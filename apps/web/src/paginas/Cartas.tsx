/**
 * Carta por alumno para la prueba con código: su código, el QR y el enlace de
 * la prueba, y las instrucciones de la tarea. Dos por A4, para recortar y
 * entregar en mano. También sirve, sin enlace, para repartir códigos.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { empaquetarSesion, nombresParaAlumnado } from '@edumind-hilo/nucleo'
import { obtenerOCrearClaves } from '@/db/claves'
import { useAlumnos, useGrupo, useToma } from '@/db/hooks'
import { publicaCompacta } from '@/lib/clavePublica'
import { qrSvg } from '@/lib/qr'
import { useT } from '@/i18n'
import '@/estilos/hoja.css'

export function Cartas() {
  const tr = useT()
  const { id } = useParams()
  const toma = useToma(id)
  const grupo = useGrupo(toma?.grupo_id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const [url, setUrl] = useState('')
  const [qr, setQr] = useState('')
  const [tarea, setTarea] = useState('')

  useEffect(() => {
    if (!toma || !alumnos?.length) return
    void (async () => {
      const claves = await obtenerOCrearClaves()
      const cortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
      const paquete = await empaquetarSesion({ toma: toma.id, titulo: toma.titulo, idioma: toma.idioma, etapa: toma.etapa, situaciones: toma.situaciones, maxElecciones: toma.max_elecciones, negativas: toma.negativas, alumnos: alumnos.map((a, i) => [a.codigo, cortos[i] ?? a.nombre]) })
      const enlace = `${location.origin}/p#g=${paquete}&k=${publicaCompacta(claves.publica)}`
      setUrl(enlace)
      setQr(await qrSvg(enlace, 'L'))
    })()
  }, [toma, alumnos])

  if (toma === undefined) return <p className="mono">{tr("Cargando…")}</p>
  if (!toma || !grupo || !alumnos) return <p>{tr("Esta toma no existe.")}</p>

  return (
    <div className="hojas">
      <div className="hojas-barra no-imprimir" style={{ flexWrap: 'wrap' }}>
        <Link to={`/toma/${toma.id}/prueba`} className="mono mono-ink">← {toma.titulo}</Link>
        <label className="campo" style={{ margin: 0, flex: '1 1 260px' }}><span>Dónde se entrega (aparece en la carta)</span><input type="text" value={tarea} onChange={e => setTarea(e.target.value)} placeholder="Tarea «Mi equipo» del aula virtual, antes del viernes" /></label>
        <button type="button" className="btn pequeno" onClick={() => print()}>{tr("Imprimir")}</button>
      </div>
      {alumnos.map(a => (
        <div className="carta" key={a.id}>
          <div className="carta-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="carta-texto">
            <p className="carta-rotulo">Mi equipo · {grupo.nombre} · {toma.titulo}</p>
            <p className="carta-nombre">{a.nombre}</p>
            <p className="carta-codigo-rotulo">Tu código</p>
            <p className="carta-codigo">{a.codigo}</p>
            <ol className="carta-pasos">
              <li>Abre el enlace con el código QR o escribiéndolo: <span className="carta-enlace">{url ? `${location.host}/p` : ''}</span> (el enlace completo está en la tarea).</li>
              <li>Escribe tu código y responde. No hay respuestas buenas ni malas y nadie de la clase verá lo que contestas.</li>
              <li>Al terminar se descarga un fichero de texto. {tarea ? `Entrégalo en: ${tarea}.` : 'Súbelo a la tarea del aula virtual.'} Si la tarea pide texto, copia y pega.</li>
            </ol>
            <p className="carta-pie">Este código es tuyo: no lo compartas. Una app de EDUmind · por Luis Vilela Acuña</p>
          </div>
        </div>
      ))}
    </div>
  )
}
