import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ETIQUETA_ETAPA, ETIQUETA_SITUACION, SITUACIONES_PREFERENCIA, analizar, listaAtencion, type Alumno, type Situacion } from '@edumind-hilo/nucleo'
import { Grafo } from '@/componentes/Grafo'
import { cerrarToma } from '@/db/consultas'
import { useAlumnos, useGrupo, useParticipaciones, useRespuestas, useToma } from '@/db/hooks'
import { fechaHora } from '@/lib/fechas'

const pct = (x: number) => `${Math.round(x * 100)} %`

export function Toma() {
  const { id } = useParams()
  const toma = useToma(id)
  const grupo = useGrupo(toma?.grupo_id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const respuestas = useRespuestas(id)
  const participaciones = useParticipaciones(id)

  const analisis = useMemo(() => {
    if (!toma || !alumnos || !respuestas || !participaciones) return null
    return analizar({ alumnos, respuestas, situaciones: toma.situaciones, negativas: toma.negativas, participantes: participaciones.map(p => p.alumno_id) })
  }, [toma, alumnos, respuestas, participaciones])

  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !grupo || !alumnos || !analisis) return <p>Esta toma no existe. <Link to="/">Volver</Link>.</p>

  const nombre = new Map(alumnos.map(a => [a.id, a.nombre]))
  const n = (idAlumno: string) => nombre.get(idAlumno) ?? '?'
  const respondieron = participaciones?.length ?? 0
  const total = alumnos.length
  const atencion = listaAtencion(analisis)
  const preferencia = toma.situaciones.filter(s => SITUACIONES_PREFERENCIA.includes(s))

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to="/" style={{ textDecoration: 'none' }}>Grupos</Link> · <Link to={`/grupo/${grupo.id}`} style={{ textDecoration: 'none' }}>{grupo.nombre}</Link></p>
          <h1>{toma.titulo}</h1>
          <p className="lede">{ETIQUETA_ETAPA[toma.etapa]} · {toma.situaciones.map(s => ETIQUETA_SITUACION[s]).join(' · ')} · máximo {toma.max_elecciones}{toma.negativas ? ' · con negativas' : ''} · abierta {fechaHora(toma.inicio)}{toma.fin ? ` · cerrada ${fechaHora(toma.fin)}` : ''}</p>
        </div>
        <div className="acciones no-imprimir">
          {toma.estado === 'abierta' ? (
            <>
              <Link className="btn" to={`/toma/${toma.id}/responder`}>Responder en este dispositivo</Link>
              <Link className="btn secundario" to={`/toma/${toma.id}/sesion`}>Sesión con tablets</Link>
              <Link className="btn secundario" to={`/toma/${toma.id}/escanear`}>Leer con la cámara</Link>
              <Link className="btn secundario" to={`/toma/${toma.id}/hojas`}>Hojas de marcas</Link>
              <Link className="btn secundario" to={`/toma/${toma.id}/transcribir`}>Transcribir</Link>
              <Link className="btn secundario" to={`/toma/${toma.id}/prueba`}>Prueba con código</Link>
              <button type="button" className="btn secundario" onClick={() => { if (confirm('Cerrar la toma. Ya no se podrán añadir respuestas. ¿Seguir?')) void cerrarToma(toma.id) }}>Cerrar la toma</button>
            </>
          ) : <span className="stamp cerrada">Cerrada</span>}
          <Link className="btn secundario" to={`/toma/${toma.id}/informe`}>Informe</Link>
        </div>
      </div>

      <dl className="cifras">
        <div><dt>Han respondido</dt><dd>{respondieron}<small>de {total}</small><div className="progreso"><i style={{ width: total ? `${(respondieron / total) * 100}%` : 0 }} /></div></dd></div>
        <div><dt>Cohesión</dt><dd>{pct(analisis.cohesion)}<small>{analisis.parejasReciprocas.length} parejas recíprocas</small></dd></div>
        <div><dt>Subgrupos</dt><dd>{analisis.subgrupos.length}<small>{analisis.puentes.length} puentes</small></dd></div>
        <div><dt>Sin elecciones</dt><dd>{analisis.sinElecciones.length}</dd></div>
      </dl>

      {respondieron === 0 && (
        <div className="note" style={{ '--c': 'var(--m-social)' } as React.CSSProperties}>
          <span className="tag">Todavía sin respuestas</span>
          <p>Cinco formas de recoger: en este dispositivo pasándolo de mano en mano; con tablets, proyectando el código de «Sesión con tablets»; con hojas de marcas impresas y leídas con la cámara; o transcribiendo del papel. El análisis se actualiza solo.</p>
        </div>
      )}

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Lista de atención</h2></div>
        {atencion.length === 0 ? <p>Nadie sin elecciones ni sin respuesta.</p> : (
          <ul className="rules">
            {atencion.map((x, i) => <li key={i}><span className="dash">—</span><span className="crece">{n(x.alumno_id)}</span><span className="meta">{x.motivo}</span></li>)}
          </ul>
        )}
        <p className="aviso">Es una lista de trabajo del tutor, no un semáforo. Los datos dicen quién está aislado hoy; no dicen por qué ni qué hacer.</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Grafo</h2></div>
        <Grafo analisis={analisis} nombres={nombre} situaciones={toma.situaciones} />
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>Índices por alumno</h2></div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                {toma.situaciones.map(s => <th key={s} className="num">{ETIQUETA_SITUACION[s]}</th>)}
                <th className="num">Recibidas</th><th className="num">Emitidas</th><th className="num">Reciprocidad</th><th className="num">Ajuste</th>
                {toma.negativas && <th className="num">Negativas</th>}
                <th>Posición</th>
                {toma.negativas && <th>Tipo</th>}
              </tr>
            </thead>
            <tbody>
              {alumnos.map(a => {
                const x = analisis.porAlumno[a.id]
                if (!x) return null
                return (
                  <tr key={a.id}>
                    <td><Link to={`/alumno/${a.id}`}>{a.nombre}</Link>{analisis.sinRespuesta.includes(a.id) && <span className="mono"> · sin respuesta</span>}</td>
                    {toma.situaciones.map(s => <td key={s} className="num">{s === 'espejo' ? '·' : x.recibidas[s] ?? 0}</td>)}
                    <td className="num"><b>{x.recibidasTotal}</b></td>
                    <td className="num">{x.emitidasTotal}</td>
                    <td className="num">{x.emitidasTotal ? pct(x.reciprocidad) : '—'}</td>
                    <td className="num">{x.ajustePerceptivo === null ? '—' : pct(x.ajustePerceptivo)}</td>
                    {toma.negativas && <td className="num">{x.negativasRecibidas}</td>}
                    <td>{x.posicion}</td>
                    {toma.negativas && <td>{x.tipo ?? '—'}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="aviso">Reciprocidad: de los que elige, cuántos le eligen. Ajuste: de quienes cree que le eligen (Espejo), cuántos le eligen de verdad. Posición: elecciones recibidas tipificadas dentro del grupo.</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">04</span><h2>Matriz sociométrica</h2></div>
        <Matriz alumnos={alumnos} analisis={analisis} situaciones={preferencia} negativas={toma.negativas} />
        <p className="aviso">Filas: quién elige. Columnas: a quién. La cifra es en cuántas situaciones le elige; «−» marca una negativa. La última columna suma lo recibido.</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">05</span><h2>Subgrupos y puentes</h2></div>
        {analisis.subgrupos.length === 0 ? <p>Todavía no hay parejas recíprocas.</p> : (
          <ul className="rules">
            {analisis.subgrupos.map((sg, i) => (
              <li key={i}><span className="dash">—</span><span className="crece">{sg.map(n).join(', ')}</span><span className="meta">{sg.length} alumnos</span></li>
            ))}
          </ul>
        )}
        {analisis.puentes.length > 0 && <p>Puentes: <b>{analisis.puentes.map(n).join(', ')}</b>. Sin ellos, su subgrupo se partiría.</p>}
      </section>
    </>
  )
}

function Matriz({ alumnos, analisis, situaciones, negativas }: { alumnos: Alumno[]; analisis: ReturnType<typeof analizar>; situaciones: Situacion[]; negativas: boolean }) {
  const idx = new Map(analisis.alumnos.map((id, i) => [id, i]))
  const celda = (i: number, j: number) => {
    let pos = 0
    let neg = 0
    for (const s of situaciones) {
      const v = analisis.matrizPorSituacion[s]?.[i]?.[j] ?? 0
      if (v === 1) pos++
      if (v === -1) neg++
    }
    return { pos, neg }
  }
  return (
    <div className="tablewrap">
      <table className="matriz">
        <thead>
          <tr>
            <th className="fila">elige →</th>
            {alumnos.map(a => <th key={a.id} className="col">{a.nombre}</th>)}
            <th className="col">Recibidas</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map(a => {
            const i = idx.get(a.id)!
            return (
              <tr key={a.id}>
                <td className="fila">{a.nombre}</td>
                {alumnos.map(b => {
                  const j = idx.get(b.id)!
                  if (i === j) return <td key={b.id} className="diag" />
                  const { pos, neg } = celda(i, j)
                  const rec = pos > 0 && (analisis.matriz[j]?.[i] ?? 0) === 1
                  return <td key={b.id} className={neg && negativas ? 'neg' : rec ? 'rec' : ''} title={rec ? 'recíproca' : undefined}>{neg && negativas ? '−' : pos || ''}</td>
                })}
                <td className="tot">{analisis.porAlumno[a.id]?.recibidasTotal ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
