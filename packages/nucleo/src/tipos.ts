/**
 * Modelo de dominio de Hilo.
 *
 * Todo registro lleva `updated_at` y `deleted_at` desde el primer día: los
 * borrados viajan como registros, nunca como ausencias. Es lo que permite
 * que en fase 4 la sincronización entre dispositivos del docente reutilice
 * el mecanismo de sobres de MiClase sin migrar nada.
 */

export const ETAPAS = ['inicial', 'primaria', 'secundaria'] as const
/** Registro de presentación del cuestionario, no el curso administrativo. */
export type Etapa = (typeof ETAPAS)[number]

export const IDIOMAS = ['es', 'gl', 'en'] as const
export type Idioma = (typeof IDIOMAS)[number]

export const SITUACIONES = ['equipo', 'recreo', 'ayuda', 'espejo', 'viaje'] as const
export type Situacion = (typeof SITUACIONES)[number]

/**
 * ESPEJO no es una preferencia: es percepción («¿quién crees que te
 * elegiría?»). No cuenta como elección recibida; sirve para el ajuste
 * perceptivo.
 */
export const SITUACIONES_PREFERENCIA: readonly Situacion[] = ['equipo', 'recreo', 'ayuda', 'viaje']

export type Signo = 1 | -1

export const ORIGENES = ['dispositivo', 'qr', 'hoja', 'fichero', 'transcripcion'] as const
export type Origen = (typeof ORIGENES)[number]

export const ESTADOS_TOMA = ['abierta', 'cerrada'] as const
export type EstadoToma = (typeof ESTADOS_TOMA)[number]

export interface Registro {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Grupo extends Registro {
  nombre: string
  etapa: Etapa
  /** Curso escolar, «2026-2027». Solo informativo. */
  curso: string
  idioma: Idioma
}

export interface Alumno extends Registro {
  grupo_id: string
  nombre: string
  /** Cinco caracteres sin ambigüedad. Es lo único que sale del dispositivo. */
  codigo: string
  neae: boolean
}

export interface Toma extends Registro {
  grupo_id: string
  titulo: string
  etapa: Etapa
  idioma: Idioma
  situaciones: Situacion[]
  max_elecciones: number
  /** Solo puede ser true en secundaria, y requiere activación expresa. */
  negativas: boolean
  estado: EstadoToma
  inicio: string
  fin: string | null
}

/** Una fila por elección. Sin orden, sin motivo, sin marca temporal fina. */
export interface Respuesta extends Registro {
  toma_id: string
  situacion: Situacion
  de_alumno: string
  a_alumno: string
  signo: Signo
  origen: Origen
}

/**
 * Constancia de que un alumno ha respondido, aunque no eligiera a nadie.
 * Sin esto, «no ha contestado» y «ha contestado sin elegir» serían iguales.
 */
export interface Participacion extends Registro {
  toma_id: string
  alumno_id: string
  origen: Origen
}

/** Anotación del docente sobre el grupo: cambio de sitios, intervención… */
export interface Evento extends Registro {
  grupo_id: string
  fecha: string
  texto: string
}

/** Clave en formato JWK, sin depender de los tipos del DOM. Compatible con JsonWebKey en ambos sentidos. */
export interface ClaveJwk {
  kty?: string
  crv?: string
  x?: string
  y?: string
  d?: string
  ext?: boolean
  key_ops?: string[]
}

/** Par de claves del docente para las entregas cifradas (ECDH P-256, JWK). */
export interface ClavesDocente extends Registro {
  publica: ClaveJwk
  privada: ClaveJwk
}

export interface NotaAlumno extends Registro {
  alumno_id: string
  fecha: string
  texto: string
}

/** Una elección tal como sale de la pantalla del alumnado, antes de persistir. */
export interface Eleccion {
  situacion: Situacion
  a_alumno: string
  signo: Signo
}
