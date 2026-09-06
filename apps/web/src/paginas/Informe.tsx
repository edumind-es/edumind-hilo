/**
 * Informe de grupo: la misma cadena HTML que se descarga, mostrada en
 * pantalla. Sin marco, para que imprimir y descargar den lo mismo.
 */
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { analizar } from '@edumind-hilo/nucleo'
import { useAlumnos, useGrupo, useParticipaciones, useRespuestas, useToma } from '@/db/hooks'
import { cssInforme, cuerpoInforme, documentoInforme, type DatosInforme } from '@/informe/plantilla'
import { descargarTexto } from '@/lib/descargar'

export function Informe() {
  const { id } = useParams()
  const toma = useToma(id)
  const grupo = useGrupo(toma?.grupo_id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const respuestas = useRespuestas(id)
  const participaciones = useParticipaciones(id)

  const datos = useMemo<DatosInforme | null>(() => {
    if (!toma || !grupo || !alumnos || !respuestas || !participaciones) return null
    const analisis = analizar({ alumnos, respuestas, situaciones: toma.situaciones, negativas: toma.negativas, participantes: participaciones.map(p => p.alumno_id) })
    return { grupo, toma, alumnos, analisis, nombres: new Map(alumnos.map(a => [a.id, a.nombre])), respondieron: participaciones.length }
  }, [toma, grupo, alumnos, respuestas, participaciones])

  if (!datos) return <p className="mono" style={{ padding: 20 }}>Cargando…</p>

  return (
    <>
      <div className="hojas-barra no-imprimir" style={{ maxWidth: 1080 }}>
        <Link to={`/toma/${datos.toma.id}`} className="mono mono-ink">← {datos.toma.titulo}</Link>
        <span style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn pequeno secundario" onClick={async () => descargarTexto(`hilo-informe-${datos.grupo.nombre}-${datos.toma.inicio.slice(0, 10)}.html`.replace(/\s+/g, '_'), await documentoInforme(datos), 'text/html')}>Descargar HTML</button>
          <button type="button" className="btn pequeno" onClick={() => print()}>Imprimir</button>
        </span>
      </div>
      <style>{cssInforme}</style>
      <div dangerouslySetInnerHTML={{ __html: cuerpoInforme(datos) }} />
    </>
  )
}
