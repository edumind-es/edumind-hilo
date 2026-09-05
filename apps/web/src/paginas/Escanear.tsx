/**
 * Lado del docente: la cámara lee (a) el QR de vuelta de cada tablet y
 * (b) las hojas de marcas. Todo ocurre en el navegador; la foto se descarta
 * en cuanto se registra la respuesta.
 */
import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ETIQUETA_SITUACION,
  aGris,
  decodificarIdentidadHoja,
  disenoHoja,
  leerHoja,
  type Alumno,
  type LecturaHoja,
  type Situacion,
  type Toma,
} from '@edumind-hilo/nucleo'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { registrarDesdeCodigos, registrarQr } from '@/db/recoger'
import { abrirCamara, capturar, cerrarCamara } from '@/lib/camara'

interface Linea {
  texto: string
  ok: boolean
  hora: string
}

interface HojaPendiente {
  identidad: { toma: string; codigo: string; filas: string[] }
  lectura: LecturaHoja
  imagen: string
  /** marcas elegidas por el docente (fila,columna) tras la propuesta de la lectura */
  elegidas: Set<string>
}

export function Escanear() {
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const ultimo = useRef<{ texto: string; hora: number }>({ texto: '', hora: 0 })
  const ocupado = useRef(false)
  const [activa, setActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [lineas, setLineas] = useState<Linea[]>([])
  const [hoja, setHoja] = useState<HojaPendiente | null>(null)
  const [manual, setManual] = useState('')

  const anotar = (texto: string, ok: boolean) => setLineas(l => [{ texto, ok, hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...l].slice(0, 40))

  async function encender() {
    if (!video.current) return
    try {
      stream.current = await abrirCamara(video.current)
      setActiva(true)
      setErrorCamara(null)
    } catch (e) {
      setErrorCamara(e instanceof Error ? e.message : 'No se pudo abrir la cámara.')
    }
  }
  function apagar() {
    cerrarCamara(stream.current)
    stream.current = null
    setActiva(false)
  }
  useEffect(() => () => cerrarCamara(stream.current), [])

  // Bucle de lectura: unas seis veces por segundo, sobre un fotograma reducido.
  useEffect(() => {
    if (!activa || !toma || !alumnos) return
    let vivo = true
    const tic = async () => {
      if (!vivo) return
      if (!ocupado.current && !hoja && video.current && canvas.current) {
        const datos = capturar(video.current, canvas.current, 960)
        if (datos) {
          const qr = jsQR(datos.data, datos.width, datos.height, { inversionAttempts: 'dontInvert' })
          if (qr?.data) await procesar(qr.data)
        }
      }
      if (vivo) setTimeout(() => void tic(), 160)
    }
    void tic()
    return () => {
      vivo = false
    }
  })

  async function procesar(texto: string) {
    const ahora = Date.now()
    if (texto === ultimo.current.texto && ahora - ultimo.current.hora < 4000) return
    ultimo.current = { texto, hora: ahora }
    if (!toma || !alumnos) return
    ocupado.current = true
    try {
      if (texto.startsWith('H1H|')) await leerHojaDeCamara(texto)
      else if (texto.startsWith('H1|')) {
        const r = await registrarQr(toma, alumnos, texto)
        anotar(`${r.alumno.nombre}: ${r.elecciones} elecciones registradas`, true)
      } else anotar('Código desconocido', false)
    } catch (e) {
      anotar(e instanceof Error ? e.message : 'Error al leer', false)
    } finally {
      ocupado.current = false
    }
  }

  async function leerHojaDeCamara(texto: string) {
    if (!toma || !video.current || !canvas.current) return
    const identidad = decodificarIdentidadHoja(texto)
    if (!identidad) throw new Error('La hoja no se reconoce.')
    if (identidad.toma !== toma.id) throw new Error('Esta hoja es de otra toma.')
    const datos = capturar(video.current, canvas.current, 1920)
    if (!datos) throw new Error('Sin imagen.')
    const gris = aGris(datos.data, datos.width, datos.height)
    const diseno = disenoHoja(identidad.filas.length, toma.situaciones.length)
    const lectura = leerHoja(gris, diseno)
    if (lectura.escala < 2) throw new Error('La hoja está demasiado lejos: acércala hasta que ocupe casi toda la imagen.')
    const elegidas = new Set(lectura.marcas.filter(m => m.estado === 'llena').map(m => `${m.fila},${m.columna}`))
    setHoja({ identidad, lectura, imagen: canvas.current.toDataURL('image/jpeg', 0.7), elegidas })
  }

  async function registrarHoja() {
    if (!hoja || !toma || !alumnos) return
    const elecciones = [...hoja.elegidas].map(k => {
      const [f, c] = k.split(',').map(Number)
      return { situacion: toma.situaciones[c!]!, a: hoja.identidad.filas[f!]!, signo: 1 as const }
    })
    try {
      const r = await registrarDesdeCodigos({ toma, alumnos, de: hoja.identidad.codigo, elecciones, origen: 'hoja' })
      anotar(`${r.alumno.nombre}: hoja registrada con ${r.elecciones} elecciones`, true)
      setHoja(null)
    } catch (e) {
      anotar(e instanceof Error ? e.message : 'No se pudo registrar la hoja', false)
      setHoja(null)
    }
  }

  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !alumnos) return <p>Esta toma no existe.</p>

  const respondieron = participaciones?.length ?? 0

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · leer respuestas</p>
          <h1>Leer<br /><span className="light">con la cámara</span></h1>
          <p className="lede">Códigos de respuesta de las tablets y hojas de marcas. La foto no se guarda: solo quedan las elecciones.</p>
        </div>
        <div className="acciones">
          {activa ? <button type="button" className="btn secundario" onClick={apagar}>Apagar la cámara</button> : <button type="button" className="btn" onClick={() => void encender()}>Encender la cámara</button>}
        </div>
      </div>

      {errorCamara && <p className="error">{errorCamara}</p>}
      {toma.estado !== 'abierta' && <p className="error">La toma está cerrada: no se registrará nada.</p>}

      <div className="camara">
        <video ref={video} muted playsInline />
        <canvas ref={canvas} hidden />
        {!activa && <p className="mono" style={{ padding: 20 }}>Cámara apagada</p>}
      </div>

      <dl className="cifras">
        <div><dt>Han respondido</dt><dd>{respondieron}<small>de {alumnos.length}</small></dd></div>
        <div><dt>Leídas ahora</dt><dd>{lineas.filter(l => l.ok).length}</dd></div>
      </dl>

      {hoja && <ConfirmarHoja hoja={hoja} toma={toma} alumnos={alumnos} onCambiar={setHoja} onRegistrar={() => void registrarHoja()} />}

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Registro</h2></div>
        {lineas.length === 0 ? <p className="aviso">Todavía nada. Acerca un código a la cámara.</p> : (
          <ul className="rules">
            {lineas.map((l, i) => <li key={i}><span className="dash">{l.ok ? '✓' : '×'}</span><span className="crece">{l.texto}</span><span className="meta">{l.hora}</span></li>)}
          </ul>
        )}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Sin cámara</h2></div>
        <p>Si la tablet puede compartir el texto del código (o lo copias a mano), pégalo aquí.</p>
        <form className="fila" onSubmit={e => { e.preventDefault(); void procesar(manual.trim()); setManual('') }}>
          <label className="campo" style={{ flex: '1 1 400px' }}><span>Código de respuesta</span><input type="text" value={manual} onChange={e => setManual(e.target.value)} placeholder="H1|…" /></label>
          <div className="campo"><span>&nbsp;</span><button type="submit" className="btn pequeno">Registrar</button></div>
        </form>
      </section>
    </>
  )
}

function ConfirmarHoja({ hoja, toma, alumnos, onCambiar, onRegistrar }: { hoja: HojaPendiente; toma: Toma; alumnos: Alumno[]; onCambiar: (h: HojaPendiente | null) => void; onRegistrar: () => void }) {
  const nombre = new Map(alumnos.map(a => [a.codigo, a.nombre]))
  const quien = nombre.get(hoja.identidad.codigo) ?? hoja.identidad.codigo
  const dudosas = hoja.lectura.marcas.filter(m => m.estado === 'dudosa').length
  const porColumna = toma.situaciones.map((_, c) => [...hoja.elegidas].filter(k => k.endsWith(`,${c}`)).length)
  const exceso = porColumna.some(n => n > toma.max_elecciones)

  function alternar(f: number, c: number) {
    const k = `${f},${c}`
    const s = new Set(hoja.elegidas)
    if (s.has(k)) s.delete(k)
    else s.add(k)
    onCambiar({ ...hoja, elegidas: s })
  }

  return (
    <section className="sec panel" aria-live="polite">
      <div className="sec-head"><span className="sec-num">✓</span><h2>Hoja de {quien}</h2></div>
      <p className="aviso">{dudosas ? `${dudosas} marcas dudosas, resaltadas: decide a mano.` : 'Ninguna marca dudosa.'} Toca una casilla para corregirla y registra.</p>
      <div className="hoja-confirmacion">
        <img src={hoja.imagen} alt="Foto de la hoja leída" />
        <div className="tablewrap">
          <table>
            <thead><tr><th>Compañero</th>{toma.situaciones.map((s: Situacion) => <th key={s}>{ETIQUETA_SITUACION[s]}</th>)}</tr></thead>
            <tbody>
              {hoja.identidad.filas.map((codigo, f) => (
                <tr key={codigo}>
                  <td>{nombre.get(codigo) ?? codigo}</td>
                  {toma.situaciones.map((_, c) => {
                    const m = hoja.lectura.marcas.find(x => x.fila === f && x.columna === c)
                    const on = hoja.elegidas.has(`${f},${c}`)
                    return (
                      <td key={c} className={m?.estado === 'dudosa' ? 'dudosa' : ''} style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={on} onChange={() => alternar(f, c)} aria-label={`${nombre.get(codigo) ?? codigo} · ${ETIQUETA_SITUACION[toma.situaciones[c]!]}`} title={m ? `oscuridad ${Math.round(m.oscuridad * 100)} %` : ''} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {exceso && <p className="error">Alguna columna supera el máximo de {toma.max_elecciones} elecciones. Quita marcas antes de registrar.</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className="btn" disabled={exceso} onClick={onRegistrar}>Registrar la hoja</button>
        <button type="button" className="btn secundario" onClick={() => onCambiar(null)}>Repetir la foto</button>
      </div>
    </section>
  )
}
