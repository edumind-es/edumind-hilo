/**
 * Esquemas Zod del modelo. Son la única validación que existe: lo que entra
 * por importación, por fichero o por QR pasa por aquí antes de tocar la base
 * local. Un registro que no valida se rechaza entero.
 */
import { z } from 'zod'
import { ESTADOS_TOMA, ETAPAS, ID_SITUACION_RE, IDIOMAS, ORIGENES, SITUACIONES, type ClaveJwk } from './tipos'

const fechaIso = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  'fecha ISO-8601 con zona horaria',
)
const id = z.string().min(1).max(64)

const registro = {
  id,
  created_at: fechaIso,
  updated_at: fechaIso,
  deleted_at: fechaIso.nullable(),
}

export const CODIGO_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/

export const esquemaGrupo = z.object({
  ...registro,
  nombre: z.string().trim().min(1).max(80),
  etapa: z.enum(ETAPAS),
  curso: z.string().max(20),
  idioma: z.enum(IDIOMAS),
})

export const esquemaAlumno = z.object({
  ...registro,
  grupo_id: id,
  nombre: z.string().trim().min(1).max(80),
  codigo: z.string().regex(CODIGO_RE),
  neae: z.boolean(),
})

export const esquemaPregunta = z.object({
  id: z.string().regex(ID_SITUACION_RE),
  etiqueta: z.string().trim().min(1).max(24),
  pregunta: z.string().trim().min(4).max(240),
  ayuda: z.string().trim().max(160).optional(),
  negativa: z.string().trim().max(240).optional(),
  tipo: z.enum(['preferencia', 'percepcion']),
})

const CANONICAS = new Set<string>(SITUACIONES)
const situacionId = z.string().regex(ID_SITUACION_RE)

/** Cada situación es canónica o una pregunta propia definida; los ids propios no pisan a las canónicas. */
function situacionesCoherentes(x: { situaciones: string[]; preguntas: { id: string }[] }): boolean {
  const propias = new Set(x.preguntas.map(p => p.id))
  if (propias.size !== x.preguntas.length) return false
  if ([...propias].some(p => CANONICAS.has(p))) return false
  if (new Set(x.situaciones).size !== x.situaciones.length) return false
  return x.situaciones.every(s => CANONICAS.has(s) || propias.has(s))
}

const camposCuestionario = {
  situaciones: z.array(situacionId).min(1).max(12),
  preguntas: z.array(esquemaPregunta).max(12).default([]),
  max_elecciones: z.number().int().min(1).max(10),
  negativas: z.boolean(),
}

export const esquemaToma = z
  .object({
    ...registro,
    grupo_id: id,
    titulo: z.string().trim().min(1).max(80),
    etapa: z.enum(ETAPAS),
    idioma: z.enum(IDIOMAS),
    ...camposCuestionario,
    estado: z.enum(ESTADOS_TOMA),
    inicio: fechaIso,
    fin: fechaIso.nullable(),
  })
  // Las negativas están bloqueadas fuera de secundaria por diseño, no por
  // configuración: un fichero que lo intente no valida.
  .refine(t => !t.negativas || t.etapa === 'secundaria', {
    message: 'las nominaciones negativas solo existen en secundaria',
    path: ['negativas'],
  })
  .refine(situacionesCoherentes, { message: 'situaciones o preguntas propias incoherentes', path: ['situaciones'] })

export const esquemaCuestionario = z
  .object({
    ...registro,
    nombre: z.string().trim().min(1).max(80),
    etapa: z.enum(ETAPAS),
    idioma: z.enum(IDIOMAS),
    descripcion: z.string().trim().max(600).default(''),
    ...camposCuestionario,
    origen: z.enum(['propio', 'catalogo']),
    referencia: z.string().trim().max(300).default(''),
  })
  .refine(c => !c.negativas || c.etapa === 'secundaria', { message: 'las nominaciones negativas solo existen en secundaria', path: ['negativas'] })
  .refine(situacionesCoherentes, { message: 'situaciones o preguntas propias incoherentes', path: ['situaciones'] })

export const esquemaRespuesta = z
  .object({
    ...registro,
    toma_id: id,
    situacion: situacionId,
    de_alumno: id,
    a_alumno: id,
    signo: z.union([z.literal(1), z.literal(-1)]),
    origen: z.enum(ORIGENES),
  })
  .refine(r => r.de_alumno !== r.a_alumno, { message: 'nadie se elige a sí mismo', path: ['a_alumno'] })

export const esquemaParticipacion = z.object({
  ...registro,
  toma_id: id,
  alumno_id: id,
  origen: z.enum(ORIGENES),
})

export const esquemaEvento = z.object({
  ...registro,
  grupo_id: id,
  fecha: z.string().min(10).max(30),
  texto: z.string().trim().min(1).max(2000),
})

export const esquemaClaves = z.object({
  ...registro,
  publica: z.custom<ClaveJwk>(v => typeof v === 'object' && v !== null && typeof (v as ClaveJwk).x === 'string'),
  privada: z.custom<ClaveJwk>(v => typeof v === 'object' && v !== null && typeof (v as ClaveJwk).d === 'string'),
})

export const esquemaNotaAlumno = z.object({
  ...registro,
  alumno_id: id,
  fecha: z.string().min(10).max(30),
  texto: z.string().trim().min(1).max(4000),
})

/**
 * Copia de seguridad completa. La versión manda: una copia de una versión
 * futura se rechaza en vez de importarse a medias.
 */
export const esquemaCopia = z.object({
  formato: z.literal('edumind-hilo'),
  version: z.literal(1),
  exportado: fechaIso,
  grupos: z.array(esquemaGrupo),
  alumnos: z.array(esquemaAlumno),
  tomas: z.array(esquemaToma),
  respuestas: z.array(esquemaRespuesta),
  participaciones: z.array(esquemaParticipacion),
  eventos: z.array(esquemaEvento),
  notas: z.array(esquemaNotaAlumno),
  /** Desde 0.4: las claves de entrega del docente viajan con la copia. */
  claves: z.array(esquemaClaves).optional(),
  /** Desde 1.5: cuestionarios propios del docente. */
  cuestionarios: z.array(esquemaCuestionario).optional(),
})
export type Copia = z.infer<typeof esquemaCopia>
