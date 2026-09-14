/**
 * Teclado de transcripción: para el cuestionario clásico en papel o cualquier
 * otro modelo. Tres letras del nombre y Enter. Sin ratón.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { type Eleccion } from '@edumind-hilo/nucleo'
import { construirPasos } from '@/alumno/PantallaAlumno'
import { anularParticipacion, registrarRespuestas, reemplazarRespuestas } from '@/db/consultas'
import { useAlumnos, useParticipaciones, useRespuestas, useToma } from '@/db/hooks'
import { coincidencias } from '@/lib/buscar'
import { eleccionesPorPaso } from '@/lib/elecciones'
import { useT } from '@/i18n'

export function Transcribir() {
  const tr = useT()
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const respuestas = useRespuestas(id)
  const [quien, setQuien] = useState<string>('')
  const [textos, setTextos] = useState<string[]>([])
  const [elegidos, setElegidos] = useState<string[][]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const entradas = useRef<(HTMLInputElement | null)[]>([])
  // Cuando se corrige a alguien ya transcrito, sus elecciones llegan por
  // aquí: el efecto que limpia el formulario al cambiar de alumno las siembra.
  const semilla = useRef<string[][] | null>(null)
  const [corrigiendo, setCorrigiendo] = useState(false)

  const pasos = useMemo(() => (toma ? construirPasos({ idioma: toma.idioma, etapa: toma.etapa, situaciones: toma.situaciones, preguntas: toma.preguntas, negativas: toma.negativas }) : []), [toma])

  useEffect(() => {
    setTextos(pasos.map(() => ''))
    setElegidos(semilla.current ?? pasos.map(() => []))
    semilla.current = null
  }, [pasos, quien])

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !alumnos) return <p>{tr("Esta toma no existe.")}</p>

  const yaRespondieron = new Set(participaciones?.map(p => p.alumno_id) ?? [])
  const pendientes = alumnos.filter(a => !yaRespondieron.has(a.id))
  const transcritos = alumnos.filter(a => yaRespondieron.has(a.id))
  const companeros = alumnos.filter(a => a.id !== quien)
  const nombre = new Map(alumnos.map(a => [a.id, a.nombre]))

  function tecla(i: number, e: KeyboardEvent<HTMLInputElement>) {
    const texto = textos[i] ?? ''
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!texto.trim()) {
        if (i < pasos.length - 1) entradas.current[i + 1]?.focus()
        else void guardar()
        return
      }
      const c = coincidencias(texto, companeros).filter(x => !(elegidos[i] ?? []).includes(x.id))
      const primero = c[0]
      if (!primero) return
      if ((elegidos[i]?.length ?? 0) >= toma!.max_elecciones) {
        setMensaje(tr('Máximo {n} en cada pregunta.', { n: toma!.max_elecciones }))
        return
      }
      setElegidos(prev => prev.map((l, k) => (k === i ? [...l, primero.id] : l)))
      setTextos(prev => prev.map((t, k) => (k === i ? '' : t)))
      setMensaje(null)
    } else if (e.key === 'Backspace' && !texto) {
      setElegidos(prev => prev.map((l, k) => (k === i ? l.slice(0, -1) : l)))
    }
  }

  async function guardar() {
    if (!quien || !toma) return
    const elecciones: Eleccion[] = pasos.flatMap((p, i) => (elegidos[i] ?? []).map(a_alumno => ({ situacion: p.situacion, a_alumno, signo: p.signo })))
    const deQuien = nombre.get(quien) ?? ''
    try {
      if (corrigiendo) {
        // Sustituye lo anterior entero: lo que no esté en pantalla desaparece.
        await reemplazarRespuestas({ toma, alumnoId: quien, elecciones, origen: 'transcripcion' })
        setMensaje(tr('{nombre}: corregido, {n} elecciones.', { nombre: deQuien, n: elecciones.length }))
        setCorrigiendo(false)
        setQuien('')
        return
      }
      await registrarRespuestas({ toma, alumnoId: quien, elecciones, origen: 'transcripcion' })
      setMensaje(tr('{nombre}: {n} elecciones guardadas.', { nombre: deQuien, n: elecciones.length }))
      const siguiente = pendientes.find(a => a.id !== quien)
      setQuien(siguiente?.id ?? '')
      setTimeout(() => entradas.current[0]?.focus(), 50)
    } catch (e) {
      setMensaje(e instanceof Error ? tr(e.message) : 'No se pudo guardar.')
    }
  }

  /** Abre lo ya transcrito de un alumno con sus fichas puestas, para cambiarlo. */
  function corregir(alumnoId: string) {
    const previas = eleccionesPorPaso(respuestas ?? [], pasos, alumnoId)
    setMensaje(null)
    setCorrigiendo(true)
    if (alumnoId === quien) {
      setTextos(pasos.map(() => ''))
      setElegidos(previas)
    } else {
      semilla.current = previas
      setQuien(alumnoId)
    }
    setTimeout(() => entradas.current[0]?.focus(), 50)
  }

  /** Deshace por completo lo transcrito de un alumno: vuelve a pendientes. */
  async function anular(alumnoId: string) {
    if (!toma) return
    const deQuien = nombre.get(alumnoId) ?? ''
    if (!confirm(tr('¿Anular lo transcrito de {nombre}? Volverá a la lista de pendientes.', { nombre: deQuien }))) return
    await anularParticipacion(toma.id, alumnoId)
    if (quien === alumnoId) {
      setCorrigiendo(false)
      setQuien('')
    }
    setMensaje(tr('{nombre}: anulado. Vuelve a estar pendiente.', { nombre: deQuien }))
  }

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · transcribir</p>
          <h1>{tr("Transcribir")}<br /><span className="light">{tr("del papel")}</span></h1>
          <p className="lede">{tr("Elige quién responde, escribe tres letras del nombre y pulsa Enter. Enter con la casilla vacía pasa a la siguiente pregunta; en la última, guarda. Retroceso quita el último.")}</p>
        </div>
      </div>

      <div className="fila">
        <label className="campo" style={{ flex: '0 1 360px' }}><span>Quién responde ({pendientes.length} pendientes)</span>
          <select value={quien} onChange={e => { setCorrigiendo(false); setQuien(e.target.value) }}>
            <option value="">{tr("— elegir —")}</option>
            {corrigiendo && quien && <option value={quien}>{nombre.get(quien)} · {tr("corrigiendo")}</option>}
            {pendientes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
      </div>

      {transcritos.length > 0 && (
        <details open={corrigiendo} style={{ marginTop: 6 }}>
          <summary className="blabel">{tr("Ya transcritos ({n})", { n: transcritos.length })}</summary>
          <p className="aviso">{tr("Corregir abre sus elecciones para cambiarlas. Anular las deshace y devuelve al alumno a la lista de pendientes.")}</p>
          <ul className="rules">
            {transcritos.map(a => (
              <li key={a.id}>
                <span className="dash">—</span>
                <span className="crece">{a.nombre}</span>
                <button type="button" className="enlace" onClick={() => corregir(a.id)}>{tr("corregir")}</button>
                <button type="button" className="enlace" onClick={() => void anular(a.id)}>{tr("anular")}</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {quien && (
        <form onSubmit={e => { e.preventDefault(); void guardar() }}>
          {pasos.map((p, i) => (
            <div key={i} className="paso-transcripcion">
              <p className="blabel" style={{ margin: '18px 0 6px' }}>{p.signo === -1 ? 'No · ' : ''}{p.pregunta}</p>
              <div className="chips">
                {(elegidos[i] ?? []).map(idA => (
                  <button key={idA} type="button" className="chip" onClick={() => setElegidos(prev => prev.map((l, k) => (k === i ? l.filter(x => x !== idA) : l)))}>{nombre.get(idA)} ×</button>
                ))}
                <input
                  ref={el => { entradas.current[i] = el }}
                  type="text"
                  value={textos[i] ?? ''}
                  onChange={e => setTextos(prev => prev.map((t, k) => (k === i ? e.target.value : t)))}
                  onKeyDown={e => tecla(i, e)}
                  placeholder={i === 0 ? 'tres letras y Enter' : ''}
                  autoFocus={i === 0}
                  aria-label={p.pregunta}
                />
              </div>
              {(textos[i] ?? '').trim() && (
                <p className="aviso">{coincidencias(textos[i] ?? '', companeros).slice(0, 5).map(c => c.nombre).join(' · ') || 'sin coincidencias'}</p>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn">{corrigiendo ? tr("Guardar la corrección") : tr("Guardar y pasar al siguiente")}</button>
            {corrigiendo && <button type="button" className="btn secundario" onClick={() => { setCorrigiendo(false); setQuien(''); setMensaje(null) }}>{tr("Dejarlo como estaba")}</button>}
          </div>
        </form>
      )}
      {mensaje && <p className="aviso" role="status" style={{ marginTop: 14 }}>{mensaje}</p>}
    </>
  )
}
