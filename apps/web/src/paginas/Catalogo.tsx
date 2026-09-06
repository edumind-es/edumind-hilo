/** Catálogo de instrumentos con referencia científica y cuestionarios propios del docente. */
import { Link } from 'react-router-dom'
import { ETIQUETA_ETAPA, INSTRUMENTOS, etiquetaSituacion, textoSituacion } from '@edumind-hilo/nucleo'
import { borrarCuestionario } from '@/db/consultas'
import { useCuestionarios } from '@/db/hooks'
import { useT } from '@/i18n'

export function Catalogo() {
  const tr = useT()
  const mios = useCuestionarios()
  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow">{tr('Social · Emocional')}</p>
          <h1>{tr('Catálogo')}<br /><span className="light">{tr('de instrumentos')}</span></h1>
          <p className="lede">{tr('Instrumentos sociométricos con referencia científica, adaptados al formato de Hilo: nominaciones por situación, sin motivo, sin ranking. Se cargan al crear una toma y se pueden retocar; lo que retoques puedes guardarlo como cuestionario tuyo.')}</p>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr('Instrumentos')}</h2></div>
        {INSTRUMENTOS.map(ins => (
          <article key={ins.id} className="instrumento">
            <h3 style={{ marginTop: 0 }}>{ins.nombre}</h3>
            <p className="mono" style={{ margin: '0 0 8px' }}>{ins.autores} · {ins.anio} · {ins.etapas.map(e => tr(ETIQUETA_ETAPA[e])).join(' · ')} · {tr('máx.')} {ins.max_elecciones}{ins.negativas ? ` · ${tr('con negativas')}` : ''}</p>
            <p>{ins.resumen}</p>
            <ul className="rules">
              {ins.situaciones.map(s => {
                const t = textoSituacion('es', ins.etapas[0]!, s, ins.preguntas)
                return <li key={s}><span className="dash">—</span><span className="crece"><b>{tr(etiquetaSituacion(s, ins.preguntas))}</b> · {t.pregunta}</span><span className="meta">{ins.preguntas.find(p => p.id === s)?.tipo === 'percepcion' || s === 'espejo' ? tr('percepción') : tr('preferencia')}</span></li>
              })}
            </ul>
            {ins.advertencias.map((a, i) => <div key={i} className="note alert"><span className="tag">{tr('Aviso')}</span><p>{a}</p></div>)}
            <p className="aviso"><b>{tr('Referencia')}.</b> {ins.referencia}</p>
          </article>
        ))}
        <div className="note" style={{ '--c': 'var(--m-mental)' } as React.CSSProperties}><span className="tag">{tr('Criterio')}</span><p>{tr('Se incluyen instrumentos con base publicada y adaptables a nominaciones. Se excluyen los bloques que piden al alumnado juzgar conductas de sus compañeros (agresividad, cobardía) y las escalas de valoración uno a uno, que Hilo no recoge. Un instrumento que nombra la amistad o pide rechazos lo avisa: rompe la asepsia por defecto y es una decisión del docente.')}</p></div>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>{tr('Mis cuestionarios')}</h2></div>
        {!mios?.length ? <p className="aviso">{tr('Todavía ninguno. Al crear una toma, retoca las preguntas y pulsa «Guardar como cuestionario mío».')}</p> : (
          <ul className="rules">
            {mios.map(c => (
              <li key={c.id}><span className="dash">—</span><span className="crece"><b>{c.nombre}</b> · {tr(ETIQUETA_ETAPA[c.etapa])} · {c.situaciones.map(s => tr(etiquetaSituacion(s, c.preguntas))).join(', ')}{c.referencia ? <><br /><span className="meta">{c.referencia}</span></> : null}</span>
                <button type="button" className="enlace" onClick={() => { if (confirm(tr('¿Borrar este cuestionario?'))) void borrarCuestionario(c.id) }}>{tr('borrar')}</button>
              </li>
            ))}
          </ul>
        )}
        <p className="aviso">{tr('Los cuestionarios viajan en la copia de seguridad y en la sincronización. Se usan desde')} <Link to="/">{tr('Grupos')}</Link> → {tr('Nueva toma')} → {tr('Punto de partida')}.</p>
      </section>
    </>
  )
}
