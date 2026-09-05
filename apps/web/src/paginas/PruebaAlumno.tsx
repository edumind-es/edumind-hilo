/**
 * Modalidad D, lado del alumno. Como la sesión de tablet, pero entra con su
 * código y, al terminar, descarga un fichero cifrado con la clave pública del
 * docente para subirlo a la tarea. Sin red, sin guardar nada.
 */
import { useEffect, useState } from 'react'
import { claveDeFragmento, codificarRespuestas, desempaquetarSesion, normalizarCodigo, paqueteDeFragmento, textosAlumno, type Eleccion, type Sesion } from '@edumind-hilo/nucleo'
import { PantallaAlumno } from '@/alumno/PantallaAlumno'
import { cifrarParaDocente, publicaDesdeCompacta } from '@/lib/clavePublica'
import { descargarTexto } from '@/lib/descargar'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'sin-sesion'; motivo: string }
  | { fase: 'codigo'; sesion: Sesion; clave: JsonWebKey; error?: string }
  | { fase: 'responder'; sesion: Sesion; clave: JsonWebKey; codigo: string }
  | { fase: 'entregar'; sesion: Sesion; fichero: string; nombre: string }

export function PruebaAlumno() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const [entrada, setEntrada] = useState('')

  useEffect(() => {
    const paquete = paqueteDeFragmento(location.hash)
    const k = claveDeFragmento(location.hash)
    history.replaceState(null, '', '/p')
    if (!paquete || !k) {
      setEstado({ fase: 'sin-sesion', motivo: 'Este enlace no lleva ninguna prueba. Usa el que te ha dado tu profe.' })
      return
    }
    desempaquetarSesion(paquete)
      .then(sesion => setEstado({ fase: 'codigo', sesion, clave: publicaDesdeCompacta(k) }))
      .catch(e => setEstado({ fase: 'sin-sesion', motivo: e instanceof Error ? e.message : 'No se pudo abrir la prueba.' }))
  }, [])

  async function terminar(sesion: Sesion, clave: JsonWebKey, codigo: string, elecciones: Eleccion[]) {
    const texto = codificarRespuestas({ toma: sesion.toma, de: codigo, elecciones: elecciones.map(e => ({ situacion: e.situacion, a: e.a_alumno, signo: e.signo })) })
    const sobre = await cifrarParaDocente(texto, clave, sesion.toma)
    const fichero = JSON.stringify(sobre)
    const nombre = `respuesta-${codigo}.hilo`
    descargarTexto(nombre, fichero, 'application/json')
    setEstado({ fase: 'entregar', sesion, fichero, nombre })
  }

  if (estado.fase === 'cargando') return <div className="modo-alumno"><div className="lienzo"><p>…</p></div></div>
  if (estado.fase === 'sin-sesion') {
    return <div className="modo-alumno"><div className="banda" /><div className="lienzo"><h1 className="pregunta">Sin prueba</h1><p className="ayuda">{estado.motivo}</p></div></div>
  }
  const t = textosAlumno(estado.sesion.idioma)
  const personas = estado.sesion.alumnos.map(([id, nombre]) => ({ id, nombre }))

  if (estado.fase === 'codigo') {
    return (
      <div className="modo-alumno">
        <div className="banda" />
        <div className="lienzo">
          <div className="paso"><span>{t.titulo}</span><span>{estado.sesion.titulo}</span></div>
          <h1 className="pregunta">{t.codigo}</h1>
          <form onSubmit={e => {
            e.preventDefault()
            const codigo = normalizarCodigo(entrada)
            if (!personas.some(p => p.id === codigo)) {
              setEstado({ ...estado, error: t.codigoMal })
              return
            }
            setEstado({ fase: 'responder', sesion: estado.sesion, clave: estado.clave, codigo })
          }}>
            <input className="codigo" type="text" inputMode="text" autoCapitalize="characters" autoComplete="off" maxLength={7} value={entrada} onChange={e => setEntrada(e.target.value.toUpperCase())} aria-label={t.codigo} />
            {estado.error && <p className="ayuda" role="alert" style={{ color: '#b03a2e' }}>{estado.error}</p>}
            <button type="submit" className="boton" style={{ marginTop: 16 }}>{t.siguiente}</button>
          </form>
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
        <PantallaAlumno key={estado.codigo} idioma={s.idioma} etapa={s.etapa} situaciones={s.situaciones} maxElecciones={s.maxElecciones} negativas={s.negativas} yo={yo} companeros={personas} onTerminar={el => void terminar(s, estado.clave, estado.codigo, el)} />
      </div>
    )
  }

  return (
    <div className="modo-alumno">
      <div className="banda" />
      <div className="lienzo">
        <div className="gracias" style={{ minHeight: 'auto', paddingTop: 10 }}>
          <h1>{t.graciasTitulo}</h1>
          <p>{t.subir(estado.nombre)}</p>
          <button type="button" className="boton suave" onClick={() => descargarTexto(estado.nombre, estado.fichero, 'application/json')}>{t.descargarOtraVez}</button>
        </div>
      </div>
    </div>
  )
}
