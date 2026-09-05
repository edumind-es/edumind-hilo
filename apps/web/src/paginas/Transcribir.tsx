/**
 * Teclado de transcripción: para el cuestionario clásico en papel o cualquier
 * otro modelo. Tres letras del nombre y Enter. Sin ratón.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { type Eleccion } from '@edumind-hilo/nucleo'
import { construirPasos } from '@/alumno/PantallaAlumno'
import { registrarRespuestas } from '@/db/consultas'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { coincidencias } from '@/lib/buscar'

export function Transcribir() {
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const [quien, setQuien] = useState<string>('')
  const [textos, setTextos] = useState<string[]>([])
  const [elegidos, setElegidos] = useState<string[][]>([])
  const [mensaje, setMensaje] = useState<string | null>(null)
  const entradas = useRef<(HTMLInputElement | null)[]>([])

  const pasos = useMemo(() => (toma ? construirPasos({ idioma: toma.idioma, etapa: toma.etapa, situaciones: toma.situaciones, negativas: toma.negativas }) : []), [toma])

  useEffect(() => {
    setTextos(pasos.map(() => ''))
    setElegidos(pasos.map(() => []))
  }, [pasos, quien])

  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !alumnos) return <p>Esta toma no existe.</p>

  const yaRespondieron = new Set(participaciones?.map(p => p.alumno_id) ?? [])
  const pendientes = alumnos.filter(a => !yaRespondieron.has(a.id))
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
        setMensaje(`Máximo ${toma!.max_elecciones} en cada pregunta.`)
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
    try {
      await registrarRespuestas({ toma, alumnoId: quien, elecciones, origen: 'transcripcion' })
      setMensaje(`${nombre.get(quien)}: ${elecciones.length} elecciones guardadas.`)
      const siguiente = pendientes.find(a => a.id !== quien)
      setQuien(siguiente?.id ?? '')
      setTimeout(() => entradas.current[0]?.focus(), 50)
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · transcribir</p>
          <h1>Transcribir<br /><span className="light">del papel</span></h1>
          <p className="lede">Elige quién responde, escribe tres letras del nombre y pulsa Enter. Enter con la casilla vacía pasa a la siguiente pregunta; en la última, guarda. Retroceso quita el último.</p>
        </div>
      </div>

      <div className="fila">
        <label className="campo" style={{ flex: '0 1 360px' }}><span>Quién responde ({pendientes.length} pendientes)</span>
          <select value={quien} onChange={e => setQuien(e.target.value)}>
            <option value="">— elegir —</option>
            {pendientes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
      </div>

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
            <button type="submit" className="btn">Guardar y pasar al siguiente</button>
          </div>
        </form>
      )}
      {mensaje && <p className="aviso" role="status" style={{ marginTop: 14 }}>{mensaje}</p>}
    </>
  )
}
