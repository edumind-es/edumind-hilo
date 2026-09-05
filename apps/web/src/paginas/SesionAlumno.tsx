/**
 * Modalidad B, lado de la tablet. Lee el paquete del fragmento de la URL, lo
 * borra del historial y trabaja en memoria. Al terminar muestra el QR de
 * vuelta. No hace ninguna petición de red ni guarda nada.
 */
import { useEffect, useState } from 'react'
import { codificarRespuestas, desempaquetarSesion, paqueteDeFragmento, textosAlumno, type Eleccion, type Sesion } from '@edumind-hilo/nucleo'
import { Gracias, PantallaAlumno } from '@/alumno/PantallaAlumno'
import { qrSvg } from '@/lib/qr'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'sin-sesion'; motivo: string }
  | { fase: 'quien'; sesion: Sesion }
  | { fase: 'responder'; sesion: Sesion; codigo: string }
  | { fase: 'entregar'; sesion: Sesion; svg: string }

export function SesionAlumno() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })

  useEffect(() => {
    const paquete = paqueteDeFragmento(location.hash)
    // El fragmento se borra del historial nada más leerlo: la lista del grupo
    // no debe quedar en la barra de direcciones de una tablet compartida.
    history.replaceState(null, '', '/s')
    if (!paquete) {
      setEstado({ fase: 'sin-sesion', motivo: 'Este enlace no lleva ninguna sesión. Lee el código que proyecta tu profe.' })
      return
    }
    desempaquetarSesion(paquete)
      .then(sesion => setEstado({ fase: 'quien', sesion }))
      .catch(e => setEstado({ fase: 'sin-sesion', motivo: e instanceof Error ? e.message : 'No se pudo abrir la sesión.' }))
  }, [])

  async function terminar(sesion: Sesion, codigo: string, elecciones: Eleccion[]) {
    const texto = codificarRespuestas({ toma: sesion.toma, de: codigo, elecciones: elecciones.map(e => ({ situacion: e.situacion, a: e.a_alumno, signo: e.signo })) })
    setEstado({ fase: 'entregar', sesion, svg: await qrSvg(texto, 'M') })
  }

  if (estado.fase === 'cargando') return <div className="modo-alumno"><div className="lienzo"><p>…</p></div></div>
  if (estado.fase === 'sin-sesion') {
    return (
      <div className="modo-alumno"><div className="banda" /><div className="lienzo"><h1 className="pregunta">Sin sesión</h1><p className="ayuda">{estado.motivo}</p></div></div>
    )
  }

  const t = textosAlumno(estado.sesion.idioma)
  const personas = estado.sesion.alumnos.map(([id, nombre]) => ({ id, nombre }))

  if (estado.fase === 'quien') {
    return (
      <div className="modo-alumno">
        <div className="banda" />
        <div className="lienzo">
          <div className="paso"><span>{t.titulo}</span><span>{estado.sesion.titulo}</span></div>
          <h1 className="pregunta">{t.quienEres}</h1>
          <div className="quien">
            {personas.map(p => (
              <button key={p.id} type="button" className="ficha" onClick={() => setEstado({ fase: 'responder', sesion: estado.sesion, codigo: p.id })}>
                <i aria-hidden="true" />{p.nombre}
              </button>
            ))}
          </div>
          <p className="pie">Una app de EDUmind · por Luis Vilela Acuña</p>
        </div>
      </div>
    )
  }

  if (estado.fase === 'responder') {
    const yo = personas.find(p => p.id === estado.codigo)!
    const s = estado.sesion
    return (
      <div className="modo-alumno">
        <div className="banda" />
        <PantallaAlumno
          key={estado.codigo}
          idioma={s.idioma}
          etapa={s.etapa}
          situaciones={s.situaciones}
          maxElecciones={s.maxElecciones}
          negativas={s.negativas}
          yo={yo}
          companeros={personas}
          onTerminar={el => void terminar(s, estado.codigo, el)}
        />
      </div>
    )
  }

  // entregar
  return (
    <div className="modo-alumno">
      <div className="banda" />
      <div className="lienzo">
        <div className="gracias" style={{ minHeight: 'auto', paddingTop: 10 }}>
          <h1>{t.graciasTitulo}</h1>
          <p>{t.entregar}</p>
          <div className="qr-vuelta" aria-label="Código de respuesta" dangerouslySetInnerHTML={{ __html: estado.svg }} />
          <button type="button" className="boton suave" onClick={() => setEstado({ fase: 'quien', sesion: estado.sesion })}>{t.siguientePersona}</button>
        </div>
      </div>
    </div>
  )
}

// Gracias se reexporta para que el enrutador no lo pierda si se usa aquí en el futuro.
export { Gracias }
