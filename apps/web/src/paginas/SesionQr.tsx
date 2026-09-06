/**
 * Modalidad B, lado del docente: el QR de ida. Lleva la lista del grupo y la
 * configuración de la toma en el fragmento de la URL. Se proyecta; las
 * tablets lo leen y trabajan sin red.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { empaquetarSesion, nombresParaAlumnado } from '@edumind-hilo/nucleo'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { qrSvg } from '@/lib/qr'
import { useT } from '@/i18n'

export function SesionQr() {
  const tr = useT()
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const [svg, setSvg] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!toma || !alumnos?.length) return
    const cortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
    void (async () => {
      try {
        const paquete = await empaquetarSesion({
          toma: toma.id,
          titulo: toma.titulo,
          idioma: toma.idioma,
          etapa: toma.etapa,
          situaciones: toma.situaciones,
          maxElecciones: toma.max_elecciones,
          negativas: toma.negativas,
          alumnos: alumnos.map((a, i) => [a.codigo, cortos[i] ?? a.nombre]),
        })
        const enlace = `${location.origin}/s#g=${paquete}`
        setUrl(enlace)
        setSvg(await qrSvg(enlace, 'M'))
      } catch (e) {
        setError(e instanceof Error ? tr(e.message) : 'No se pudo generar el código.')
      }
    })()
  }, [toma, alumnos])

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !alumnos) return <p>{tr("Esta toma no existe.")}</p>

  const respondieron = participaciones?.length ?? 0

  return (
    <>
      <div className="cabecera no-imprimir">
        <div>
          <p className="eyebrow"><Link to={`/toma/${toma.id}`} style={{ textDecoration: 'none' }}>{toma.titulo}</Link> · sesión con tablets</p>
          <h1>{tr("Proyecta")}<br /><span className="light">{tr("este código")}</span></h1>
          <p className="lede">{tr("Cada tablet lo lee con la cámara, muestra la lista y trabaja sin red. La lista viaja del proyector a la tablet por luz: no pasa por ningún servidor.")}</p>
        </div>
        <div className="acciones">
          <Link className="btn" to={`/toma/${toma.id}/escanear`}>{tr("Leer respuestas")}</Link>
          <button type="button" className="btn secundario" onClick={() => print()}>{tr("Imprimir")}</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {toma.estado !== 'abierta' && <p className="error">{tr("La toma está cerrada: las tablets no podrán entregar.")}</p>}

      <div className="qr-grande" aria-label={tr("Código QR de la sesión")}>
        {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="mono">{tr("Generando…")}</p>}
      </div>

      <dl className="cifras no-imprimir">
        <div><dt>{tr("Alumnado")}</dt><dd>{alumnos.length}</dd></div>
        <div><dt>{tr("Han respondido")}</dt><dd>{respondieron}<small>de {alumnos.length}</small></dd></div>
        <div><dt>{tr("Tamaño del enlace")}</dt><dd>{url.length}<small>{tr("caracteres")}</small></dd></div>
      </dl>

      <section className="sec no-imprimir">
        <div className="sec-head"><span className="sec-num">01</span><h2>{tr("Cómo va")}</h2></div>
        <ul className="rules">
          <li><span className="dash">—</span><span className="crece">{tr("Cada alumno abre la cámara de su tablet y lee el código. Se abre «Mi equipo»: elige su nombre y responde.")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("Al terminar, la tablet muestra un código de respuesta. Tú lo lees desde «Leer respuestas» con la cámara de tu dispositivo, en unos segundos por tablet.")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("La tablet no guarda nada: al cerrar la pestaña no queda ni la lista ni la respuesta.")}</span></li>
          <li><span className="dash">—</span><span className="crece">{tr("Si una tablet no tiene la app en caché y no hay red, no podrá abrir el enlace. Conviene que visiten hilos.edumind.es una vez con conexión.")}</span></li>
        </ul>
      </section>
    </>
  )
}
