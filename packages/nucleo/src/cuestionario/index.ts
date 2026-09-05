import type { Etapa, Situacion } from '../tipos'
import type { Idioma } from '../tipos'
import { CUESTIONARIOS, TEXTOS_ALUMNO, type TextoSituacion } from './textos'

export * from './textos'

/** Conjunto por defecto de situaciones para cada registro. */
export const SITUACIONES_POR_ETAPA: Record<Etapa, Situacion[]> = {
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

export function textoSituacion(idioma: Idioma, etapa: Etapa, situacion: Situacion): TextoSituacion {
  return CUESTIONARIOS[idioma][etapa][situacion]
}

export function textosAlumno(idioma: Idioma) {
  return TEXTOS_ALUMNO[idioma]
}

/** Etiquetas cortas para el portal del docente. */
export const ETIQUETA_SITUACION: Record<Situacion, string> = {
  equipo: 'Equipo',
  recreo: 'Recreo',
  ayuda: 'Ayuda',
  espejo: 'Espejo',
  viaje: 'Viaje',
}

export const ETIQUETA_ETAPA: Record<Etapa, string> = {
  inicial: 'Lector inicial (6-8)',
  primaria: 'Primaria (8-12)',
  secundaria: 'Secundaria y adultos',
}
