/**
 * Lectura de una exportación de MiClase (JSON en claro; el descifrado del
 * fichero .miclase lo hace la web con la contraseña). Devuelve los grupos con
 * sus alumnos y, si el código de MiClase vale en nuestro alfabeto, el código,
 * para que la hoja de códigos de MiClase sirva también en Hilo.
 *
 * Solo se leen tres tablas: grupos, alumnos y grupo_alumnos. Nada más de la
 * exportación (notas, evidencias, asistencia) se mira ni se guarda.
 */
import { esCodigoValido } from '../codigos'
import type { Etapa } from '../tipos'

export interface AlumnoMiClase {
  nombre: string
  codigo: string | null
  neae: boolean
}
export interface GrupoMiClase {
  nombre: string
  etapa: Etapa
  curso: string
  alumnos: AlumnoMiClase[]
}

interface Fila {
  id?: number
  deleted_at?: string | null
}

function etapaDesde(texto: unknown): Etapa {
  const t = String(texto ?? '').toLowerCase()
  if (/infantil|inicial/.test(t)) return 'inicial'
  if (/secundaria|eso|bachiller|fp|adult/.test(t)) return 'secundaria'
  return 'primaria'
}

export function esExportacionMiClase(bruto: unknown): boolean {
  const d = bruto as { version?: unknown; grupos?: unknown; alumnos?: unknown; grupo_alumnos?: unknown }
  return typeof d === 'object' && d !== null && typeof d.version === 'number' && Array.isArray(d.grupos) && Array.isArray(d.alumnos) && Array.isArray(d.grupo_alumnos)
}

export function leerExportacionMiClase(bruto: unknown): GrupoMiClase[] {
  if (!esExportacionMiClase(bruto)) throw new Error('No es una exportación de MiClase.')
  const d = bruto as {
    grupos: (Fila & { nombre?: string; etapa?: string; curso?: string; curso_escolar?: string })[]
    alumnos: (Fila & { nombre?: string; apellidos?: string; neae?: number | boolean; codigo_cifrado?: string })[]
    grupo_alumnos: (Fila & { grupo_id?: number; alumno_id?: number; activo?: number | boolean })[]
  }
  const alumnos = new Map(d.alumnos.filter(a => !a.deleted_at && a.id !== undefined).map(a => [a.id!, a]))
  return d.grupos
    .filter(g => !g.deleted_at && g.id !== undefined)
    .map(g => {
      const ids = d.grupo_alumnos.filter(ga => ga.grupo_id === g.id && !ga.deleted_at && (ga.activo === undefined || ga.activo === 1 || ga.activo === true)).map(ga => ga.alumno_id)
      const lista: AlumnoMiClase[] = []
      for (const id of ids) {
        const a = id === undefined ? undefined : alumnos.get(id)
        if (!a) continue
        const nombre = `${a.nombre ?? ''} ${a.apellidos ?? ''}`.replace(/\s+/g, ' ').trim()
        if (!nombre) continue
        const codigo = a.codigo_cifrado && esCodigoValido(a.codigo_cifrado) ? a.codigo_cifrado : null
        lista.push({ nombre, codigo, neae: a.neae === 1 || a.neae === true })
      }
      return { nombre: String(g.nombre ?? 'Grupo'), etapa: etapaDesde(g.etapa ?? g.curso), curso: String(g.curso_escolar ?? ''), alumnos: lista }
    })
    .filter(g => g.alumnos.length > 0)
}
