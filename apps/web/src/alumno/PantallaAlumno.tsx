/**
 * Lo que ve el alumno. Componente puro: recibe quién responde, con quién se
 * puede elegir y la configuración de la toma, y devuelve elecciones.
 *
 * Reglas que se cumplen aquí y se prueban:
 *  - el propio alumno nunca aparece en su lista;
 *  - el orden se baraja en cada pregunta;
 *  - no se puede pasar del máximo de elecciones;
 *  - pasar sin elegir a nadie exige una confirmación neutra;
 *  - no se muestra ningún resultado ni la palabra «sociograma».
 */
import { useMemo, useState } from 'react'
import { textoSituacion, textosAlumno, type Eleccion, type Etapa, type Idioma, type Situacion } from '@edumind-hilo/nucleo'
import { barajar } from '@/lib/barajar'
import { callar, hayVoz, leer } from '@/lib/voz'

export interface Persona {
  id: string
  nombre: string
}

export interface PropsPantallaAlumno {
  idioma: Idioma
  etapa: Etapa
  situaciones: Situacion[]
  maxElecciones: number
  negativas: boolean
  yo: Persona
  companeros: Persona[]
  onTerminar: (elecciones: Eleccion[]) => void
}

interface Paso {
  situacion: Situacion
  signo: 1 | -1
  pregunta: string
  ayuda: string
}

export function construirPasos(p: Pick<PropsPantallaAlumno, 'idioma' | 'etapa' | 'situaciones' | 'negativas'>): Paso[] {
  const pasos: Paso[] = []
  for (const situacion of p.situaciones) {
    const t = textoSituacion(p.idioma, p.etapa, situacion)
    pasos.push({ situacion, signo: 1, pregunta: t.pregunta, ayuda: t.ayuda })
    if (p.negativas && p.etapa === 'secundaria' && t.negativa) {
      pasos.push({ situacion, signo: -1, pregunta: t.negativa, ayuda: t.ayuda })
    }
  }
  return pasos
}

export function PantallaAlumno(props: PropsPantallaAlumno) {
  const t = textosAlumno(props.idioma)
  const pasos = useMemo(() => construirPasos(props), [props.idioma, props.etapa, props.situaciones, props.negativas])
  const [indice, setIndice] = useState(0)
  const [elegidos, setElegidos] = useState<Set<string>>(new Set())
  const [acumulado, setAcumulado] = useState<Eleccion[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const lista = useMemo(
    () => barajar(props.companeros.filter(c => c.id !== props.yo.id)),
    // Se baraja de nuevo en cada paso, a propósito.
    [props.companeros, props.yo.id, indice],
  )
  const paso = pasos[indice]
  if (!paso) return null
  const ultimo = indice === pasos.length - 1
  const lleno = elegidos.size >= props.maxElecciones

  function alternar(id: string) {
    setConfirmando(false)
    setElegidos(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else if (s.size < props.maxElecciones) s.add(id)
      return s
    })
  }

  function avanzar(forzar = false) {
    if (!paso) return
    if (elegidos.size === 0 && !forzar) {
      setConfirmando(true)
      return
    }
    callar()
    const nuevas: Eleccion[] = [...elegidos].map(a_alumno => ({ situacion: paso.situacion, a_alumno, signo: paso.signo }))
    const total = [...acumulado, ...nuevas]
    if (ultimo) {
      props.onTerminar(total)
      return
    }
    setAcumulado(total)
    setElegidos(new Set())
    setConfirmando(false)
    setIndice(indice + 1)
  }

  return (
    <div className="lienzo" data-paso={indice}>
      <div className="paso">
        <span>{t.paso(indice + 1, pasos.length)}</span>
        <span className="puntos" aria-hidden="true">
          {pasos.map((_, i) => <i key={i} className={i === indice ? 'on' : i < indice ? 'hecho' : ''} />)}
        </span>
      </div>
      <h1 className="pregunta">{paso.pregunta}</h1>
      <p className="ayuda">{paso.ayuda} {t.limite(props.maxElecciones)}</p>

      <div className="fichas" role="group" aria-label={paso.pregunta}>
        {lista.map(c => {
          const on = elegidos.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className={on ? 'ficha on' : 'ficha'}
              aria-pressed={on}
              disabled={!on && lleno}
              onClick={() => alternar(c.id)}
            >
              <i aria-hidden="true" />
              {c.nombre}
            </button>
          )
        })}
      </div>

      {confirmando && (
        <div className="confirmar" role="status">
          <p>{t.sinEleccion}</p>
          <button type="button" className="boton suave" onClick={() => setConfirmando(false)}>{t.seguirEligiendo}</button>
          <button type="button" className="boton" onClick={() => avanzar(true)}>{t.confirmarSinEleccion}</button>
        </div>
      )}

      <div className="barra">
        {hayVoz() ? (
          <button type="button" className="audio" onClick={() => leer(paso.pregunta, props.idioma)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 0 1 0 6" />
            </svg>
            {t.escuchar}
          </button>
        ) : <span />}
        <span className="contador" aria-live="polite">{t.contador(elegidos.size, props.maxElecciones)}</span>
        <button type="button" className="boton" onClick={() => avanzar()}>{ultimo ? t.terminar : t.siguiente}</button>
      </div>
    </div>
  )
}

export function Gracias({ idioma, onSeguir }: { idioma: Idioma; onSeguir?: () => void }) {
  const t = textosAlumno(idioma)
  return (
    <div className="lienzo">
      <div className="gracias">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="">
          <path d="M14 44 C 22 20, 34 20, 32 32 S 44 44, 50 20" />
          <circle cx="14" cy="44" r="4" fill="currentColor" /><circle cx="32" cy="32" r="4" fill="currentColor" /><circle cx="50" cy="20" r="4" fill="currentColor" />
        </svg>
        <h1>{t.graciasTitulo}</h1>
        <p>{t.graciasTexto}</p>
        {onSeguir && <button type="button" className="boton suave" onClick={onSeguir} style={{ marginTop: 24 }}>OK</button>}
      </div>
    </div>
  )
}
