/**
 * Toda la base de datos de Hilo vive aquí, en IndexedDB del dispositivo del
 * docente. No hay ninguna otra copia salvo las que el docente exporte.
 *
 * Los índices `updated_at` existen desde el primer día para que la
 * sincronización por sobres (fase 4) pueda leer incrementalmente sin migrar.
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Alumno, Evento, Grupo, NotaAlumno, Participacion, Respuesta, Toma } from '@edumind-hilo/nucleo'

export class HiloDb extends Dexie {
  grupos!: EntityTable<Grupo, 'id'>
  alumnos!: EntityTable<Alumno, 'id'>
  tomas!: EntityTable<Toma, 'id'>
  respuestas!: EntityTable<Respuesta, 'id'>
  participaciones!: EntityTable<Participacion, 'id'>
  eventos!: EntityTable<Evento, 'id'>
  notas!: EntityTable<NotaAlumno, 'id'>

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
  }
}

export const db = new HiloDb()

export const TABLAS = ['grupos', 'alumnos', 'tomas', 'respuestas', 'participaciones', 'eventos', 'notas'] as const
export type Tabla = (typeof TABLAS)[number]
