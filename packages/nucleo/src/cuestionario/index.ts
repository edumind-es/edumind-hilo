import { SITUACIONES, SITUACIONES_PREFERENCIA, type Etapa, type Idioma, type PreguntaToma, type Situacion, type SituacionCanonica } from '../tipos'
import { CUESTIONARIOS, TEXTOS_ALUMNO, type TextoSituacion } from './textos'

export * from './textos'

const CANONICAS = new Set<string>(SITUACIONES)
export function esCanonica(s: string): s is SituacionCanonica {
  return CANONICAS.has(s)
}

/** Conjunto por defecto de situaciones para cada registro. */
export const SITUACIONES_POR_ETAPA: Record<Etapa, SituacionCanonica[]> = {
  inicial: ['equipo', 'recreo', 'espejo'],
  primaria: ['equipo', 'recreo', 'ayuda', 'espejo'],
  secundaria: ['equipo', 'recreo', 'ayuda', 'espejo', 'viaje'],
}

export const MAX_ELECCIONES_POR_ETAPA: Record<Etapa, number> = {
  inicial: 2,
  primaria: 3,
  secundaria: 5,
}

/** Bloqueo por diseño, no por configuración. */
export function negativasPermitidas(etapa: Etapa): boolean {
  return etapa === 'secundaria'
}

/** Percepción («¿quién crees que te elegiría?»): no cuenta como elección recibida. */
export function esPercepcion(s: Situacion, preguntas: readonly PreguntaToma[] = []): boolean {
  if (esCanonica(s)) return !SITUACIONES_PREFERENCIA.includes(s)
  return preguntas.find(p => p.id === s)?.tipo === 'percepcion'
}
export function esPreferencia(s: Situacion, preguntas: readonly PreguntaToma[] = []): boolean {
  return !esPercepcion(s, preguntas)
}

/** Texto de una situación: canónica por idioma y registro, o propia desde la toma. */
export function textoSituacion(idioma: Idioma, etapa: Etapa, situacion: Situacion, preguntas: readonly PreguntaToma[] = []): TextoSituacion {
  if (esCanonica(situacion)) return CUESTIONARIOS[idioma][etapa][situacion]
  const p = preguntas.find(x => x.id === situacion)
  if (!p) return { pregunta: situacion, ayuda: '' }
  return { pregunta: p.pregunta, ayuda: p.ayuda ?? '', ...(p.negativa ? { negativa: p.negativa } : {}) }
}

export function textosAlumno(idioma: Idioma) {
  return TEXTOS_ALUMNO[idioma]
}

/** Etiquetas cortas para el portal del docente (las canónicas se traducen al mostrarse). */
export const ETIQUETA_SITUACION: Record<SituacionCanonica, string> = {
  equipo: 'Equipo',
  recreo: 'Recreo',
  ayuda: 'Ayuda',
  espejo: 'Espejo',
  viaje: 'Viaje',
}

export function etiquetaSituacion(s: Situacion, preguntas: readonly PreguntaToma[] = []): string {
  if (esCanonica(s)) return ETIQUETA_SITUACION[s]
  return preguntas.find(p => p.id === s)?.etiqueta ?? s
}

export const ETIQUETA_ETAPA: Record<Etapa, string> = {
  inicial: 'Lector inicial (6-8)',
  primaria: 'Primaria (8-12)',
  secundaria: 'Secundaria y adultos',
}

/** Identificador nuevo para una pregunta propia, que no pisa ni canónicas ni existentes. */
export function idPreguntaNuevo(existentes: readonly string[] = [], azar: () => number = Math.random): string {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (;;) {
    let id = 'p'
    for (let i = 0; i < 5; i++) id += abc[Math.floor(azar() * abc.length)]
    if (!CANONICAS.has(id) && !existentes.includes(id)) return id
  }
}
