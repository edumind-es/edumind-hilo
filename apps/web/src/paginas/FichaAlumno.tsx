/**
 * Ficha de un alumno: su posición en cada toma del grupo, quién le elige y a
 * quién elige en la última, y las notas del docente.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ETIQUETA_SITUACION, analizar, type Alumno, type Toma } from '@edumind-hilo/nucleo'
import { actualizarAlumno, anadirNota, borrarNota } from '@/db/consultas'
import { useAlumnos, useEventos, useGrupo, useNotas, useTomas } from '@/db/hooks'
import { db } from '@/db/localDb'
import { fechaCorta, hoyIso } from '@/lib/fechas'
import { trayectoriaSvg } from '@/informe/trayectoriaSvg'
import { useT } from '@/i18n'

const pct = (x: number) => `${Math.round(x * 100)} %`

export function FichaAlumno() {
  const tr = useT()
  const { id } = useParams()
  const alumno = useLiveQuery(() => (id ? db.alumnos.get(id) : undefined), [id])
  const grupo = useGrupo(alumno?.grupo_id)
  const alumnos = useAlumnos(alumno?.grupo_id)
  const tomas = useTomas(alumno?.grupo_id)
  const eventos = useEventos(alumno?.grupo_id)
  const notas = useNotas(id)
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState(hoyIso())

  const tomaIds = useMemo(() => (tomas ?? []).map(t => t.id), [tomas])
  const respuestas = useLiveQuery(async () => (tomaIds.length ? (await db.respuestas.where('toma_id').anyOf(tomaIds).toArray()).filter(r => !r.deleted_at) : []), [tomaIds])
  const participaciones = useLiveQuery(async () => (tomaIds.length ? (await db.participaciones.where('toma_id').anyOf(tomaIds).toArray()).filter(p => !p.deleted_at) : []), [tomaIds])

  const filas = useMemo(() => {
    if (!alumno || !alumnos || !tomas || !respuestas || !participaciones) return []
    return [...tomas].sort((a, b) => a.inicio.localeCompare(b.inicio)).map(t => {
      const a = analizar({ alumnos, respuestas: respuestas.filter(r => r.toma_id === t.id), situaciones: t.situaciones, negativas: t.negativas, participantes: participaciones.filter(p => p.toma_id === t.id).map(p => p.alumno_id) })
      return { toma: t, x: a.porAlumno[alumno.id]!, analisis: a }
    })
  }, [alumno, alumnos, tomas, respuestas, participaciones])

  if (alumno === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!alumno || !grupo || !alumnos) return <p>{tr("Este alumno no existe.")}</p>

  const nombre = new Map(alumnos.map(a => [a.id, a.nombre]))
  const ultima = filas.at(-1)
  const svg = filas.length >= 2 ? trayectoriaSvg({ puntos: filas.map(f => ({ fecha: f.toma.inicio, titulo: f.toma.titulo, recibidas: f.x.recibidasTotal, reciprocidad: f.x.reciprocidad })), eventos: (eventos ?? []).map(e => ({ fecha: e.fecha, texto: e.texto })) }) : null

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to="/" style={{ textDecoration: 'none' }}>{tr("Grupos")}</Link> · <Link to={`/grupo/${grupo.id}`} style={{ textDecoration: 'none' }}>{grupo.nombre}</Link></p>
          <h1>{alumno.nombre}</h1>
          <p className="lede">Código {alumno.codigo} · {filas.length} tomas · <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={alumno.neae} onChange={e => void actualizarAlumno(alumno.id, { neae: e.target.checked })} /> NEAE</label></p>
        </div>
        <div className="acciones no-imprimir"><button type="button" className="btn secundario" onClick={() => print()}>{tr("Imprimir ficha")}</button></div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Trayectoria")}</h2></div>
        {svg ? <div className="grafo" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="aviso">{tr("Con dos o más tomas aparece aquí la trayectoria, con los eventos del grupo sobre la misma línea.")}</p>}
        <div className="tablewrap">
          <table>
            <thead><tr><th>{tr("Toma")}</th><th className="num">{tr("Recibidas")}</th><th className="num">{tr("Emitidas")}</th><th className="num">{tr("Reciprocidad")}</th><th className="num">{tr("Ajuste")}</th><th>{tr("Posición")}</th><th>{tr("Tipo")}</th></tr></thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.toma.id}>
                  <td><Link to={`/toma/${f.toma.id}`}>{f.toma.titulo}</Link> <span className="mono">{fechaCorta(f.toma.inicio)}</span>{f.analisis.sinRespuesta.includes(alumno.id) && <span className="mono"> · sin respuesta</span>}</td>
                  <td className="num"><b>{f.x.recibidasTotal}</b></td>
                  <td className="num">{f.x.emitidasTotal}</td>
                  <td className="num">{f.x.emitidasTotal ? pct(f.x.reciprocidad) : '—'}</td>
                  <td className="num">{f.x.ajustePerceptivo === null ? '—' : pct(f.x.ajustePerceptivo)}</td>
                  <td>{tr(f.x.posicion)}</td>
                  <td>{f.x.tipo ? tr(f.x.tipo) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {ultima && <Vinculos alumno={alumno} toma={ultima.toma} analisis={ultima.analisis} nombre={nombre} />}

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>{tr("Notas del docente")}</h2></div>
        {notas && notas.length > 0 && (
          <ul className="rules">
            {notas.map(nt => (
              <li key={nt.id}><span className="dash">—</span><span className="crece">{nt.texto}</span><span className="meta">{nt.fecha}</span><button type="button" className="enlace no-imprimir" onClick={() => { if (confirm(tr("¿Borrar esta nota?"))) void borrarNota(nt.id) }}>{tr("borrar")}</button></li>
            ))}
          </ul>
        )}
        <form className="fila no-imprimir" onSubmit={async e => { e.preventDefault(); if (!texto.trim()) return; await anadirNota(alumno.id, fecha, texto); setTexto('') }}>
          <label className="campo" style={{ flex: '0 0 170px' }}><span>{tr("Fecha")}</span><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></label>
          <label className="campo" style={{ flex: '1 1 300px' }}><span>{tr("Observación")}</span><input type="text" value={texto} onChange={e => setTexto(e.target.value)} /></label>
          <div className="campo"><span>&nbsp;</span><button type="submit" className="btn pequeno">{tr("Anotar")}</button></div>
        </form>
      </section>
    </>
  )
}

function Vinculos({ alumno, toma, analisis, nombre }: { alumno: Alumno; toma: Toma; analisis: ReturnType<typeof analizar>; nombre: Map<string, string> }) {
  const tr = useT()
  const i = analisis.alumnos.indexOf(alumno.id)
  const eligeA = analisis.alumnos.filter((_, j) => (analisis.matriz[i]?.[j] ?? 0) === 1)
  const leEligen = analisis.alumnos.filter((_, j) => (analisis.matriz[j]?.[i] ?? 0) === 1)
  const reciprocos = eligeA.filter(x => leEligen.includes(x))
  const n = (id: string) => nombre.get(id) ?? '?'
  return (
    <section className="sec">
      <div className="sec-head"><span className="sec-num">02</span><h2>Vínculos en {toma.titulo}</h2></div>
      <dl className="cifras">
        <div><dt>{tr("Elige a")}</dt><dd style={{ fontSize: 16 }}>{eligeA.length ? eligeA.map(n).join(', ') : '—'}</dd></div>
        <div><dt>{tr("Le eligen")}</dt><dd style={{ fontSize: 16 }}>{leEligen.length ? leEligen.map(n).join(', ') : '—'}</dd></div>
        <div><dt>{tr("Recíprocos")}</dt><dd style={{ fontSize: 16 }}>{reciprocos.length ? reciprocos.map(n).join(', ') : '—'}</dd></div>
      </dl>
      <p className="aviso">Situaciones de preferencia: {toma.situaciones.filter(s => s !== 'espejo').map(s => tr(ETIQUETA_SITUACION[s])).join(', ')}.</p>
    </section>
  )
}
