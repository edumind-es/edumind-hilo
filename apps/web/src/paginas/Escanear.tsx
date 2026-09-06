/**
 * Lado del docente: la cámara lee (a) el QR de vuelta de cada tablet y
 * (b) las hojas de marcas. Todo ocurre en el navegador; la foto se descarta
 * en cuanto se registra la respuesta.
 */
import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  etiquetaSituacion,
  aGris,
  decodificarIdentidadHoja,
  decodificarIdentidadHojaGrupo,
  disenoHoja,
  disenoHojaGrupo,
  leerHoja,
  type Alumno,
  type LecturaHoja,
  type Situacion,
  type Toma,
} from '@edumind-hilo/nucleo'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { registrarSituacion } from '@/db/consultas'
import { registrarDesdeCodigos, registrarQr } from '@/db/recoger'
import { abrirCamara, capturar, cerrarCamara } from '@/lib/camara'
import { useT } from '@/i18n'

interface Linea {
  texto: string
  ok: boolean
  hora: string
}

interface HojaGrupoPendiente {
  identidad: { toma: string; situacion: string; codigos: string[] }
  lectura: LecturaHoja
  imagen: string
  elegidas: Set<string>
}

interface HojaPendiente {
  identidad: { toma: string; codigo: string; filas: string[] }
  lectura: LecturaHoja
  imagen: string
  /** marcas elegidas por el docente (fila,columna) tras la propuesta de la lectura */
  elegidas: Set<string>
}

export function Escanear() {
  const tr = useT()
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
  const [hojaGrupo, setHojaGrupo] = useState<HojaGrupoPendiente | null>(null)
  const [manual, setManual] = useState('')

  const anotar = (texto: string, ok: boolean) => setLineas(l => [{ texto, ok, hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...l].slice(0, 40))

  async function encender() {
    if (!video.current) return
    try {
      stream.current = await abrirCamara(video.current)
      setActiva(true)
      setErrorCamara(null)
    } catch (e) {
      setErrorCamara(e instanceof Error ? tr(e.message) : 'No se pudo abrir la cámara.')
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
      if (!ocupado.current && !hoja && !hojaGrupo && video.current && canvas.current) {
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
      else if (texto.startsWith('H1G|')) await leerHojaGrupoDeCamara(texto)
      else if (texto.startsWith('H1|')) {
        const r = await registrarQr(toma, alumnos, texto)
        anotar(`${r.alumno.nombre}: ${r.elecciones} elecciones registradas`, true)
      } else anotar(tr("Código desconocido"), false)
    } catch (e) {
      anotar(e instanceof Error ? tr(e.message) : 'Error al leer', false)
    } finally {
      ocupado.current = false
    }
  }

  async function leerHojaDeCamara(texto: string) {
    if (!toma || !video.current || !canvas.current) return
    const identidad = decodificarIdentidadHoja(texto)
    if (!identidad) throw new Error(tr("La hoja no se reconoce."))
    if (identidad.toma !== toma.id) throw new Error(tr("Esta hoja es de otra toma."))
    const datos = capturar(video.current, canvas.current, 1920)
    if (!datos) throw new Error(tr("Sin imagen."))
    const gris = aGris(datos.data, datos.width, datos.height)
    const diseno = disenoHoja(identidad.filas.length, toma.situaciones.length)
    const lectura = leerHoja(gris, diseno)
    if (lectura.escala < 2) throw new Error(tr("La hoja está demasiado lejos: acércala hasta que ocupe casi toda la imagen."))
    const elegidas = new Set(lectura.marcas.filter(m => m.estado === 'llena').map(m => `${m.fila},${m.columna}`))
    setHoja({ identidad, lectura, imagen: canvas.current.toDataURL('image/jpeg', 0.7), elegidas })
  }

  async function leerHojaGrupoDeCamara(texto: string) {
    if (!toma || !video.current || !canvas.current) return
    const identidad = decodificarIdentidadHojaGrupo(texto)
    if (!identidad) throw new Error(tr("La hoja de grupo no se reconoce."))
    if (identidad.toma !== toma.id) throw new Error(tr("Esta hoja es de otra toma."))
    if (!toma.situaciones.includes(identidad.situacion as Situacion)) throw new Error(tr("Esa situación no está en la toma."))
    const datos = capturar(video.current, canvas.current, 1920)
    if (!datos) throw new Error(tr("Sin imagen."))
    const lectura = leerHoja(aGris(datos.data, datos.width, datos.height), disenoHojaGrupo(identidad.codigos.length))
    if (lectura.escala < 2) throw new Error(tr("La hoja está demasiado lejos: acércala hasta que ocupe casi toda la imagen."))
    const elegidas = new Set(lectura.marcas.filter(m => m.estado === 'llena' && m.fila !== m.columna).map(m => `${m.fila},${m.columna}`))
    setHojaGrupo({ identidad, lectura, imagen: canvas.current.toDataURL('image/jpeg', 0.7), elegidas })
  }

  async function registrarHojaGrupo() {
    if (!hojaGrupo || !toma || !alumnos) return
    const porCodigo = new Map(alumnos.map(a => [a.codigo, a.id]))
    const porAlumno = new Map<string, string[]>()
    for (const k of hojaGrupo.elegidas) {
      const [f, c] = k.split(',').map(Number)
      const de = porCodigo.get(hojaGrupo.identidad.codigos[f!]!)
      const a = porCodigo.get(hojaGrupo.identidad.codigos[c!]!)
      if (!de || !a) continue
      porAlumno.set(de, [...(porAlumno.get(de) ?? []), a])
    }
    try {
      const n = await registrarSituacion({ toma, situacion: hojaGrupo.identidad.situacion as Situacion, porAlumno, origen: 'hoja' })
      anotar(tr('Hoja de grupo ({situacion}): {n} alumnos con elecciones', { situacion: tr(etiquetaSituacion(hojaGrupo.identidad.situacion as Situacion, toma.preguntas)), n }), true)
    } catch (e) {
      anotar(e instanceof Error ? tr(e.message) : 'No se pudo registrar la hoja de grupo', false)
    }
    setHojaGrupo(null)
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
      anotar(e instanceof Error ? tr(e.message) : 'No se pudo registrar la hoja', false)
      setHoja(null)
    }
  }

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !alumnos) return <p>{tr("Esta toma no existe.")}</p>

  const respondieron = participaciones?.length ?? 0

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · leer respuestas</p>
          <h1>{tr("Leer")}<br /><span className="light">{tr("con la cámara")}</span></h1>
          <p className="lede">{tr("Códigos de respuesta de las tablets y hojas de marcas. La foto no se guarda: solo quedan las elecciones.")}</p>
        </div>
        <div className="acciones">
          {activa ? <button type="button" className="btn secundario" onClick={apagar}>{tr("Apagar la cámara")}</button> : <button type="button" className="btn" onClick={() => void encender()}>{tr("Encender la cámara")}</button>}
        </div>
      </div>

      {errorCamara && <p className="error">{errorCamara}</p>}
      {toma.estado !== 'abierta' && <p className="error">{tr("La toma está cerrada: no se registrará nada.")}</p>}

      <div className="camara">
        <video ref={video} muted playsInline />
        <canvas ref={canvas} hidden />
        {!activa && <p className="mono" style={{ padding: 20 }}>{tr("Cámara apagada")}</p>}
      </div>

      <dl className="cifras">
        <div><dt>{tr("Han respondido")}</dt><dd>{respondieron}<small>de {alumnos.length}</small></dd></div>
        <div><dt>{tr("Leídas ahora")}</dt><dd>{lineas.filter(l => l.ok).length}</dd></div>
      </dl>

      {hoja && <ConfirmarHoja hoja={hoja} toma={toma} alumnos={alumnos} onCambiar={setHoja} onRegistrar={() => void registrarHoja()} />}
      {hojaGrupo && <ConfirmarHojaGrupo hoja={hojaGrupo} toma={toma} alumnos={alumnos} onCambiar={setHojaGrupo} onRegistrar={() => void registrarHojaGrupo()} />}

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Registro")}</h2></div>
        {lineas.length === 0 ? <p className="aviso">{tr("Todavía nada. Acerca un código a la cámara.")}</p> : (
          <ul className="rules">
            {lineas.map((l, i) => <li key={i}><span className="dash">{l.ok ? '✓' : '×'}</span><span className="crece">{l.texto}</span><span className="meta">{l.hora}</span></li>)}
          </ul>
        )}
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>{tr("Sin cámara")}</h2></div>
        <p>{tr("Si la tablet puede compartir el texto del código (o lo copias a mano), pégalo aquí.")}</p>
        <form className="fila" onSubmit={e => { e.preventDefault(); void procesar(manual.trim()); setManual('') }}>
          <label className="campo" style={{ flex: '1 1 400px' }}><span>{tr("Código de respuesta")}</span><input type="text" value={manual} onChange={e => setManual(e.target.value)} placeholder="H1|…" /></label>
          <div className="campo"><span>&nbsp;</span><button type="submit" className="btn pequeno">{tr("Registrar")}</button></div>
        </form>
      </section>
    </>
  )
}

function ConfirmarHoja({ hoja, toma, alumnos, onCambiar, onRegistrar }: { hoja: HojaPendiente; toma: Toma; alumnos: Alumno[]; onCambiar: (h: HojaPendiente | null) => void; onRegistrar: () => void }) {
  const tr = useT()
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
      <div className="sec-head"><span className="sec-num">✓</span><h2>{tr('Hoja de {nombre}', { nombre: quien })}</h2></div>
      <p className="aviso">{dudosas ? tr('{n} marcas dudosas, resaltadas: decide a mano.', { n: dudosas }) : tr('Ninguna marca dudosa.')} {tr('Toca una casilla para corregirla y registra.')}</p>
      <div className="hoja-confirmacion">
        <img src={hoja.imagen} alt={tr("Foto de la hoja leída")} />
        <div className="tablewrap">
          <table>
            <thead><tr><th>{tr("Compañero")}</th>{toma.situaciones.map((s: Situacion) => <th key={s}>{tr(etiquetaSituacion(s, toma.preguntas))}</th>)}</tr></thead>
            <tbody>
              {hoja.identidad.filas.map((codigo, f) => (
                <tr key={codigo}>
                  <td>{nombre.get(codigo) ?? codigo}</td>
                  {toma.situaciones.map((_, c) => {
                    const m = hoja.lectura.marcas.find(x => x.fila === f && x.columna === c)
                    const on = hoja.elegidas.has(`${f},${c}`)
                    return (
                      <td key={c} className={m?.estado === 'dudosa' ? 'dudosa' : ''} style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={on} onChange={() => alternar(f, c)} aria-label={`${nombre.get(codigo) ?? codigo} · ${etiquetaSituacion(toma.situaciones[c]!, toma.preguntas)}`} title={m ? `oscuridad ${Math.round(m.oscuridad * 100)} %` : ''} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {exceso && <p className="error">{tr('Alguna columna supera el máximo de {n} elecciones. Quita marcas antes de registrar.', { n: toma.max_elecciones })}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className="btn" disabled={exceso} onClick={onRegistrar}>{tr("Registrar la hoja")}</button>
        <button type="button" className="btn secundario" onClick={() => onCambiar(null)}>{tr("Repetir la foto")}</button>
      </div>
    </section>
  )
}

function ConfirmarHojaGrupo({ hoja, toma, alumnos, onCambiar, onRegistrar }: { hoja: HojaGrupoPendiente; toma: Toma; alumnos: Alumno[]; onCambiar: (h: HojaGrupoPendiente | null) => void; onRegistrar: () => void }) {
  const tr = useT()
  const nombre = new Map(alumnos.map(a => [a.codigo, a.nombre]))
  const n = hoja.identidad.codigos.length
  const dudosas = hoja.lectura.marcas.filter(m => m.estado === 'dudosa' && m.fila !== m.columna).length
  const exceso = hoja.identidad.codigos.some((_, f) => [...hoja.elegidas].filter(k => k.startsWith(`${f},`)).length > toma.max_elecciones)
  function alternar(f: number, c: number) {
    const k = `${f},${c}`
    const s = new Set(hoja.elegidas)
    if (s.has(k)) s.delete(k)
    else s.add(k)
    onCambiar({ ...hoja, elegidas: s })
  }
  return (
    <section className="sec panel" aria-live="polite">
      <div className="sec-head"><span className="sec-num">✓</span><h2>Hoja de grupo · {tr(etiquetaSituacion(hoja.identidad.situacion as Situacion, toma.preguntas))}</h2></div>
      <p className="aviso">{dudosas ? `${dudosas} marcas dudosas, resaltadas.` : 'Ninguna marca dudosa.'} Filas: quién elige. Toca una casilla para corregirla. Al registrar se sustituyen las respuestas de esta situación para las filas con marcas.</p>
      <div className="hoja-confirmacion">
        <img src={hoja.imagen} alt={tr("Foto de la hoja de grupo")} />
        <div className="tablewrap">
          <table className="matriz">
            <thead><tr><th className="fila">{tr("elige →")}</th>{hoja.identidad.codigos.map(c => <th key={c} className="col">{nombre.get(c) ?? c}</th>)}</tr></thead>
            <tbody>
              {hoja.identidad.codigos.map((cf, f) => (
                <tr key={cf}>
                  <td className="fila">{nombre.get(cf) ?? cf}</td>
                  {Array.from({ length: n }, (_, c) => {
                    if (f === c) return <td key={c} className="diag" />
                    const m = hoja.lectura.marcas.find(x => x.fila === f && x.columna === c)
                    return <td key={c} className={m?.estado === 'dudosa' ? 'dudosa' : ''}><input type="checkbox" checked={hoja.elegidas.has(`${f},${c}`)} onChange={() => alternar(f, c)} aria-label={`${nombre.get(cf)} elige a ${nombre.get(hoja.identidad.codigos[c]!)}`} /></td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {exceso && <p className="error">Alguna fila supera el máximo de {toma.max_elecciones}. Quita marcas antes de registrar.</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className="btn" disabled={exceso} onClick={onRegistrar}>{tr("Registrar la hoja de grupo")}</button>
        <button type="button" className="btn secundario" onClick={() => onCambiar(null)}>{tr("Repetir la foto")}</button>
      </div>
    </section>
  )
}
