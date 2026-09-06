/**
 * Toda la base de datos de Hilo vive aquí, en IndexedDB del dispositivo del
 * docente. No hay ninguna otra copia salvo las que el docente exporte.
 *
 * Los índices `updated_at` existen desde el primer día para que la
 * sincronización por sobres (fase 4) pueda leer incrementalmente sin migrar.
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Alumno, ClavesDocente, Cuestionario, Evento, Grupo, NotaAlumno, Participacion, Respuesta, Toma } from '@edumind-hilo/nucleo'

export interface Ajuste {
  id: string
  idioma: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export class HiloDb extends Dexie {
  grupos!: EntityTable<Grupo, 'id'>
  alumnos!: EntityTable<Alumno, 'id'>
  tomas!: EntityTable<Toma, 'id'>
  respuestas!: EntityTable<Respuesta, 'id'>
  participaciones!: EntityTable<Participacion, 'id'>
  eventos!: EntityTable<Evento, 'id'>
  notas!: EntityTable<NotaAlumno, 'id'>
  claves!: EntityTable<ClavesDocente, 'id'>
  ajustes!: EntityTable<Ajuste, 'id'>
  cuestionarios!: EntityTable<Cuestionario, 'id'>

  constructor(nombre = 'edumind-hilo') {
    super(nombre)
    this.version(1).stores({
      grupos: 'id, updated_at',
      alumnos: 'id, grupo_id, codigo, updated_at',
      tomas: 'id, grupo_id, estado, updated_at',
      respuestas: 'id, toma_id, de_alumno, a_alumno, updated_at',
      participaciones: 'id, toma_id, alumno_id, [toma_id+alumno_id], updated_at',
      eventos: 'id, grupo_id, updated_at',
      notas: 'id, alumno_id, updated_at',
    })
    // v2: par de claves del docente para las entregas cifradas (fase 3).
    // Las migraciones nunca se editan: los cambios van en la versión siguiente.
    this.version(2).stores({
      claves: 'id, updated_at',
    })
    // v3: ajustes del portal (idioma). No viajan en la copia: son del dispositivo.
    this.version(3).stores({
      ajustes: 'id',
    })
    // v4: cuestionarios propios del docente; las tomas antiguas ganan `preguntas: []`.
    this.version(4).stores({
      cuestionarios: 'id, updated_at',
    }).upgrade(tx => tx.table('tomas').toCollection().modify(t => { if (!Array.isArray(t.preguntas)) t.preguntas = [] }))
  }
}

export const db = new HiloDb()

export const TABLAS = ['grupos', 'alumnos', 'tomas', 'respuestas', 'participaciones', 'eventos', 'notas', 'claves', 'cuestionarios'] as const
export type Tabla = (typeof TABLAS)[number]
