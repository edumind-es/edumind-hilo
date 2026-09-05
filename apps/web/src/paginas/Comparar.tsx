/** Dos tomas del mismo grupo, lado a lado. Cambios en tinta, no en color. */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { analizar } from '@edumind-hilo/nucleo'
import { useAlumnos, useGrupo, useTomas } from '@/db/hooks'
import { db } from '@/db/localDb'
import { fechaCorta } from '@/lib/fechas'

const pct = (x: number) => `${Math.round(x * 100)} %`
const delta = (a: number, b: number) => (b === a ? '=' : b > a ? `+${b - a}` : `${b - a}`)

export function Comparar() {
  const { id } = useParams()
  const grupo = useGrupo(id)
  const alumnos = useAlumnos(id)
  const tomas = useTomas(id)
  const orden = useMemo(() => [...(tomas ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio)), [tomas])
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')
  const a = orden.find(t => t.id === (idA || orden.at(-2)?.id))
  const b = orden.find(t => t.id === (idB || orden.at(-1)?.id))
  const ids = useMemo(() => [a?.id, b?.id].filter((x): x is string => Boolean(x)), [a, b])
  const respuestas = useLiveQuery(async () => (ids.length ? (await db.respuestas.where('toma_id').anyOf(ids).toArray()).filter(r => !r.deleted_at) : []), [ids])
  const participaciones = useLiveQuery(async () => (ids.length ? (await db.participaciones.where('toma_id').anyOf(ids).toArray()).filter(p => !p.deleted_at) : []), [ids])

  const analisis = useMemo(() => {
    if (!alumnos || !respuestas || !participaciones || !a || !b) return null
    const de = (t: typeof a) => analizar({ alumnos, respuestas: respuestas.filter(r => r.toma_id === t.id), situaciones: t.situaciones, negativas: t.negativas, participantes: participaciones.filter(p => p.toma_id === t.id).map(p => p.alumno_id) })
    return { A: de(a), B: de(b) }
  }, [alumnos, respuestas, participaciones, a, b])

  if (grupo === undefined) return <p className="mono">Cargando…</p>
  if (!grupo || !alumnos) return <p>Este grupo no existe.</p>

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/grupo/${grupo.id}`} style={{ textDecoration: 'none' }}>{grupo.nombre}</Link> · comparar tomas</p>
          <h1>Antes<br /><span className="light">y después</span></h1>
          <p className="lede">Dos tomas del mismo grupo. Lo que cambia se marca en negrita. Una toma de septiembre solo cobra sentido con la de enero al lado.</p>
        </div>
      </div>
      {orden.length < 2 ? <p className="aviso">Hacen falta al menos dos tomas de este grupo.</p> : (
        <>
          <div className="fila">
            <label className="campo"><span>Toma A</span><select value={a?.id ?? ''} onChange={e => setIdA(e.target.value)}>{orden.map(t => <option key={t.id} value={t.id}>{t.titulo} · {fechaCorta(t.inicio)}</option>)}</select></label>
            <label className="campo"><span>Toma B</span><select value={b?.id ?? ''} onChange={e => setIdB(e.target.value)}>{orden.map(t => <option key={t.id} value={t.id}>{t.titulo} · {fechaCorta(t.inicio)}</option>)}</select></label>
          </div>
          {analisis && a && b && (
            <>
              <div className="tablewrap">
                <table>
                  <thead><tr><th></th><th className="num">{a.titulo}</th><th className="num">{b.titulo}</th><th className="num">Cambio</th></tr></thead>
                  <tbody>
                    <tr><td>Cohesión</td><td className="num">{pct(analisis.A.cohesion)}</td><td className="num">{pct(analisis.B.cohesion)}</td><td className="num"><b>{Math.round((analisis.B.cohesion - analisis.A.cohesion) * 100)} pt</b></td></tr>
                    <tr><td>Parejas recíprocas</td><td className="num">{analisis.A.parejasReciprocas.length}</td><td className="num">{analisis.B.parejasReciprocas.length}</td><td className="num"><b>{delta(analisis.A.parejasReciprocas.length, analisis.B.parejasReciprocas.length)}</b></td></tr>
                    <tr><td>Subgrupos</td><td className="num">{analisis.A.subgrupos.length}</td><td className="num">{analisis.B.subgrupos.length}</td><td className="num"><b>{delta(analisis.A.subgrupos.length, analisis.B.subgrupos.length)}</b></td></tr>
                    <tr><td>Sin elecciones</td><td className="num">{analisis.A.sinElecciones.length}</td><td className="num">{analisis.B.sinElecciones.length}</td><td className="num"><b>{delta(analisis.A.sinElecciones.length, analisis.B.sinElecciones.length)}</b></td></tr>
                    <tr><td>Respondieron</td><td className="num">{alumnos.length - analisis.A.sinRespuesta.length}</td><td className="num">{alumnos.length - analisis.B.sinRespuesta.length}</td><td></td></tr>
                  </tbody>
                </table>
              </div>
              <section className="sec">
                <div className="sec-head"><span className="sec-num">01</span><h2>Por alumno</h2></div>
                <div className="tablewrap">
                  <table>
                    <thead><tr><th>Alumno</th><th className="num">Recibidas A</th><th className="num">Recibidas B</th><th className="num">Cambio</th><th>Posición A</th><th>Posición B</th><th className="num">Reciprocidad A</th><th className="num">Reciprocidad B</th></tr></thead>
                    <tbody>
                      {alumnos.map(al => {
                        const x = analisis.A.porAlumno[al.id]
                        const y = analisis.B.porAlumno[al.id]
                        if (!x || !y) return null
                        const cambia = x.posicion !== y.posicion
                        return (
                          <tr key={al.id}>
                            <td><Link to={`/alumno/${al.id}`}>{al.nombre}</Link></td>
                            <td className="num">{x.recibidasTotal}</td><td className="num">{y.recibidasTotal}</td>
                            <td className="num"><b>{delta(x.recibidasTotal, y.recibidasTotal)}</b></td>
                            <td>{x.posicion}</td><td>{cambia ? <b>{y.posicion}</b> : y.posicion}</td>
                            <td className="num">{x.emitidasTotal ? pct(x.reciprocidad) : '—'}</td><td className="num">{y.emitidasTotal ? pct(y.reciprocidad) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </>
  )
}
