/**
 * Modalidad B, lado de la tablet. Lee el paquete del fragmento de la URL, lo
 * borra del historial y trabaja en memoria. Al terminar muestra el QR de
 * vuelta. No hace ninguna petición de red ni guarda nada.
 */
import { useEffect, useState } from 'react'
import { codificarRespuestas, desempaquetarSesion, paqueteDeFragmento, textosAlumno, type Eleccion, type Sesion } from '@edumind-hilo/nucleo'
import { Gracias, PantallaAlumno } from '@/alumno/PantallaAlumno'
import { qrSvg } from '@/lib/qr'
import { cerrarSobre, importarClave } from '@/lib/sobres'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'sin-sesion'; motivo: string }
  | { fase: 'quien'; sesion: Sesion }
  | { fase: 'responder'; sesion: Sesion; codigo: string }
  | { fase: 'entregar'; sesion: Sesion; svg: string; entregado: boolean | null }

export function SesionAlumno() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const [rele, setRele] = useState<{ codigo: string; clave: string } | null>(null)

  useEffect(() => {
    const paquete = paqueteDeFragmento(location.hash)
    const r = /(?:^|[#&])r=([A-Z2-9]{8})/.exec(location.hash)?.[1]
    const k = /(?:^|[#&])k=([A-Za-z0-9_-]{40,50})/.exec(location.hash)?.[1]
    if (r && k) setRele({ codigo: r, clave: k })
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
    const svg = await qrSvg(texto, 'M')
    setEstado({ fase: 'entregar', sesion, svg, entregado: rele ? null : false })
    // Con relé: se entrega también por el servidor, cifrado con la clave del QR.
    // Es la única petición de red de esta página, y solo si el QR lo pidió.
    if (rele) {
      try {
        const clave = await importarClave(rele.clave)
        const r = await fetch(`/api/rele/${rele.codigo}/sobres`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ciphertext: await cerrarSobre(clave, texto) }) })
        setEstado(e => (e.fase === 'entregar' ? { ...e, entregado: r.ok } : e))
      } catch {
        setEstado(e => (e.fase === 'entregar' ? { ...e, entregado: false } : e))
      }
    }
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
          situaciones={s.situaciones} preguntas={s.preguntas}
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
          <p>{estado.entregado === true ? t.entregadoServidor : t.entregar}</p>
          <div className="qr-vuelta" aria-label="Código de respuesta" dangerouslySetInnerHTML={{ __html: estado.svg }} />
          <button type="button" className="boton suave" onClick={() => setEstado({ fase: 'quien', sesion: estado.sesion })}>{t.siguientePersona}</button>
        </div>
      </div>
    </div>
  )
}

// Gracias se reexporta para que el enrutador no lo pierda si se usa aquí en el futuro.
export { Gracias }
