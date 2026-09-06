/**
 * Modalidad D, lado del docente: la prueba con código de acceso. Un enlace
 * (o un fichero HTML que lo abre) con la lista del grupo y la clave pública
 * del docente en el fragmento. Se cuelga en el aula virtual; cada alumno
 * entra con su código y entrega un fichero cifrado.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { empaquetarSesion, nombresParaAlumnado } from '@edumind-hilo/nucleo'
import { obtenerOCrearClaves } from '@/db/claves'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { publicaCompacta } from '@/lib/clavePublica'
import { descargarTexto } from '@/lib/descargar'

function ficheroLanzador(url: string, titulo: string): string {
  // El fragmento se conserva en location.replace: no llega a ningún servidor.
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title></head><body style="font-family:system-ui;padding:24px">
<p>Abriendo <b>${titulo}</b>… Si no se abre solo, <a id="e" href="#">pulsa aquí</a>.</p>
<script>var u=${JSON.stringify(url)};document.getElementById('e').href=u;location.replace(u);</script>
</body></html>`
}

export function Prueba() {
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!toma || !alumnos?.length) return
    void (async () => {
      try {
        const claves = await obtenerOCrearClaves()
        const cortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
        const paquete = await empaquetarSesion({
          toma: toma.id, titulo: toma.titulo, idioma: toma.idioma, etapa: toma.etapa, situaciones: toma.situaciones,
          maxElecciones: toma.max_elecciones, negativas: toma.negativas, alumnos: alumnos.map((a, i) => [a.codigo, cortos[i] ?? a.nombre]),
        })
        setUrl(`${location.origin}/p#g=${paquete}&k=${publicaCompacta(claves.publica)}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo preparar la prueba.')
      }
    })()
  }, [toma, alumnos])

  if (toma === undefined) return <p className="mono">Cargando…</p>
  if (!toma || !alumnos) return <p>Esta toma no existe.</p>

  return (
    <>
      <div className="cabecera">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · prueba con código de acceso</p>
          <h1>Prueba<br /><span className="light">para el aula virtual</span></h1>
          <p className="lede">Un enlace con la lista del grupo y tu clave pública. Cada alumno entra con su código de cinco caracteres, responde y descarga un fichero de texto cifrado que solo este dispositivo puede abrir. La tarea de Moodle puede ser de fichero o de texto en línea: el alumno también puede copiar y pegar.</p>
        </div>
        <div className="acciones">
          <Link className="btn" to={`/toma/${toma.id}/entregas`}>Recoger entregas</Link>
          <Link className="btn secundario" to={`/toma/${toma.id}/cartas`}>Cartas para el alumnado</Link>
          <Link className="btn secundario" to={`/toma/${toma.id}/etiquetas`}>Etiquetas de códigos</Link>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="sec">
        <div className="sec-head"><span className="sec-num">01</span><h2>Distribuir</h2></div>
        <label className="campo"><span>Enlace de la prueba</span><textarea readOnly value={url} style={{ minHeight: 90, maxWidth: 'none' }} /></label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn" disabled={!url} onClick={async () => { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }}>{copiado ? 'Copiado' : 'Copiar el enlace'}</button>
          <button type="button" className="btn secundario" disabled={!url} onClick={() => descargarTexto(`prueba-${toma.titulo}.html`.replace(/\s+/g, '_'), ficheroLanzador(url, `Mi equipo · ${toma.titulo}`), 'text/html')}>Descargar como fichero HTML</button>
        </div>
        <p className="aviso">El fichero HTML solo abre el enlace: sirve para colgarlo en una tarea de Moodle o en el aula virtual. La lista del grupo va en la parte del enlace que el navegador nunca envía a ningún servidor.</p>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">02</span><h2>Códigos de acceso</h2></div>
        <p>Cada alumno necesita su código. Es el mismo de la hoja de códigos de MiClase, si la usas. Entrégalo en mano: «Cartas para el alumnado» imprime una carta por alumno con su código, el enlace, un QR y las instrucciones de la tarea; «Etiquetas de códigos» imprime etiquetas recortables solo con nombre y código. Nunca en abierto junto al enlace.</p>
        <div className="tablewrap">
          <table><thead><tr><th>Alumno</th><th>Código</th><th>Entregado</th></tr></thead>
            <tbody>{alumnos.map(a => <tr key={a.id}><td>{a.nombre}</td><td className="k">{a.codigo}</td><td>{participaciones?.some(p => p.alumno_id === a.id) ? 'sí' : ''}</td></tr>)}</tbody>
          </table>
        </div>
        <button type="button" className="btn secundario pequeno" onClick={() => print()}>Imprimir códigos</button>
      </section>

      <section className="sec">
        <div className="sec-head"><span className="sec-num">03</span><h2>Validez</h2></div>
        <div className="note" style={{ '--c': 'var(--m-social)' } as React.CSSProperties}><span className="tag">Misma sesión</span><p>Conviene que todo el grupo responda en la misma franja aunque cada uno esté en su casa: un sociograma respondido a lo largo de una semana mide otra cosa. Cierra la toma cuando hayas recogido las entregas.</p></div>
      </section>
    </>
  )
}
