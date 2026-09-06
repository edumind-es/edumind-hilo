/**
 * Copia de seguridad: un JSON con todas las tablas. Se importa fusionando,
 * registro a registro, y gana el `updated_at` más reciente. Es la misma
 * regla que usará la sincronización, así que una copia y un sync no se
 * pisan.
 */
import { esquemaCopia, type Copia } from '@edumind-hilo/nucleo'
import { ahora } from './ids'
import { TABLAS, db } from './localDb'

export async function exportarCopia(): Promise<Copia> {
  const copia: Copia = {
    formato: 'edumind-hilo',
    version: 1,
    exportado: ahora(),
    grupos: await db.grupos.toArray(),
    alumnos: await db.alumnos.toArray(),
    tomas: await db.tomas.toArray(),
    respuestas: await db.respuestas.toArray(),
    participaciones: await db.participaciones.toArray(),
    eventos: await db.eventos.toArray(),
    notas: await db.notas.toArray(),
    claves: await db.claves.toArray(),
    cuestionarios: await db.cuestionarios.toArray(),
  }
  return esquemaCopia.parse(copia)
}

export interface Sellado {
  id: string
  updated_at: string
}

/** Último en escribir gana, comparando `updated_at` como texto ISO. Puro y probado. */
export function fusionar<T extends Sellado>(existentes: T[], entrantes: T[]): T[] {
  const porId = new Map(existentes.map(x => [x.id, x]))
  const resultado: T[] = []
  for (const e of entrantes) {
    const actual = porId.get(e.id)
    if (!actual || e.updated_at > actual.updated_at) resultado.push(e)
  }
  return resultado
}

export async function importarCopia(texto: string): Promise<Record<string, number>> {
  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    throw new Error('El fichero no es un JSON válido.')
  }
  const copia = esquemaCopia.parse(bruto)
  const contadores: Record<string, number> = {}
  await db.transaction('rw', db.tables, async () => {
    for (const tabla of TABLAS) {
      const existentes = (await db.table(tabla).toArray()) as Sellado[]
      const nuevos = fusionar(existentes, (copia[tabla] ?? []) as Sellado[])
      if (nuevos.length) await db.table(tabla).bulkPut(nuevos)
      contadores[tabla] = nuevos.length
    }
  })
  return contadores
}
