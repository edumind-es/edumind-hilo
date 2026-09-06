/**
 * Modalidad A: el docente elige quién responde y entrega el dispositivo.
 * Tres estados: elegir → responder → gracias. El estado «responder» es la
 * pantalla del alumnado a pantalla completa, sin nada del portal a la vista.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { nombresParaAlumnado, type Eleccion } from '@edumind-hilo/nucleo'
import { Gracias, PantallaAlumno } from '@/alumno/PantallaAlumno'
import { registrarRespuestas } from '@/db/consultas'
import { useAlumnos, useParticipaciones, useToma } from '@/db/hooks'
import { useT } from '@/i18n'

type Estado = { fase: 'elegir' } | { fase: 'responder'; alumnoId: string } | { fase: 'gracias' }

export function Responder() {
  const tr = useT()
  const { id } = useParams()
  const toma = useToma(id)
  const alumnos = useAlumnos(toma?.grupo_id)
  const participaciones = useParticipaciones(id)
  const [estado, setEstado] = useState<Estado>({ fase: 'elegir' })
  const [error, setError] = useState<string | null>(null)

  if (!toma || !alumnos || !participaciones) return <div className="modo-alumno"><div className="lienzo"><p>{tr("Cargando…")}</p></div></div>
  if (toma.estado !== 'abierta') {
    return <div className="modo-alumno"><div className="lienzo"><p>Esta toma está cerrada.</p><Link to={`/toma/${toma.id}`}>{tr("Volver")}</Link></div></div>
  }

  const yaRespondieron = new Set(participaciones.map(p => p.alumno_id))
  const pendientes = alumnos.filter(a => !yaRespondieron.has(a.id))
  const nombresCortos = nombresParaAlumnado(alumnos.map(a => a.nombre))
  const personas = alumnos.map((a, i) => ({ id: a.id, nombre: nombresCortos[i] ?? a.nombre }))

  async function terminar(alumnoId: string, elecciones: Eleccion[]) {
    try {
      await registrarRespuestas({ toma: toma!, alumnoId, elecciones, origen: 'dispositivo' })
      setEstado({ fase: 'gracias' })
    } catch (err) {
      setError(err instanceof Error ? tr(err.message) : 'No se pudo guardar.')
      setEstado({ fase: 'elegir' })
    }
  }

  if (estado.fase === 'responder') {
    const yo = personas.find(p => p.id === estado.alumnoId)!
    return (
      <div className="modo-alumno">
        <div className="banda" />
        <PantallaAlumno
          key={estado.alumnoId}
          idioma={toma.idioma}
          etapa={toma.etapa}
          situaciones={toma.situaciones}
          preguntas={toma.preguntas}
          maxElecciones={toma.max_elecciones}
          negativas={toma.negativas}
          yo={yo}
          companeros={personas}
          onTerminar={el => void terminar(estado.alumnoId, el)}
        />
      </div>
    )
  }

  if (estado.fase === 'gracias') {
    return (
      <div className="modo-alumno">
        <div className="banda" />
        <Gracias idioma={toma.idioma} onSeguir={() => setEstado({ fase: 'elegir' })} />
      </div>
    )
  }

  // Pantalla del docente: quién responde ahora. Solo pendientes, sin más datos.
  return (
    <div className="modo-alumno">
      <div className="banda" />
      <Link to={`/toma/${toma.id}`} className="esquina">{tr("Volver a la toma")}</Link>
      <div className="lienzo">
        <div className="paso"><span>{toma.titulo}</span><span>{alumnos.length - pendientes.length} de {alumnos.length} han respondido</span></div>
        <h1 className="pregunta">{tr("¿Quién responde ahora?")}</h1>
        <p className="ayuda">{tr("Elige al alumno y entrégale el dispositivo. Al terminar, verá una pantalla de gracias y podrás elegir al siguiente.")}</p>
        {error && <p className="ayuda" style={{ color: '#b03a2e' }}>{error}</p>}
        {pendientes.length === 0 ? (
          <p className="ayuda">Todo el grupo ha respondido. <Link to={`/toma/${toma.id}`}>{tr("Ver el análisis")}</Link>.</p>
        ) : (
          <div className="quien">
            {pendientes.map(a => (
              <button key={a.id} type="button" className="ficha" onClick={() => { setError(null); setEstado({ fase: 'responder', alumnoId: a.id }) }}>
                <i aria-hidden="true" />{a.nombre}
              </button>
            ))}
          </div>
        )}
        <p className="pie">Una app de EDUmind · por Luis Vilela Acuña</p>
      </div>
    </div>
  )
}
