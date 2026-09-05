import { esquemaCopia, esquemaRespuesta, esquemaToma } from './esquemas'

const ahora = '2026-09-05T10:00:00.000Z'
const base = { id: 'x', created_at: ahora, updated_at: ahora, deleted_at: null }

describe('esquemas', () => {
  it('una toma con negativas fuera de secundaria no valida', () => {
    const toma = { ...base, grupo_id: 'g', titulo: 'Septiembre', etapa: 'primaria', idioma: 'es', situaciones: ['equipo'], max_elecciones: 3, negativas: true, estado: 'abierta', inicio: ahora, fin: null }
    expect(esquemaToma.safeParse(toma).success).toBe(false)
    expect(esquemaToma.safeParse({ ...toma, etapa: 'secundaria' }).success).toBe(true)
    expect(esquemaToma.safeParse({ ...toma, negativas: false }).success).toBe(true)
  })

  it('nadie se elige a sí mismo', () => {
    const r = { ...base, toma_id: 't', situacion: 'equipo', de_alumno: 'a', a_alumno: 'a', signo: 1, origen: 'dispositivo' }
    expect(esquemaRespuesta.safeParse(r).success).toBe(false)
    expect(esquemaRespuesta.safeParse({ ...r, a_alumno: 'b' }).success).toBe(true)
  })

  it('una copia de otra versión se rechaza entera', () => {
    const copia = { formato: 'edumind-hilo', version: 2, exportado: ahora, grupos: [], alumnos: [], tomas: [], respuestas: [], participaciones: [], eventos: [], notas: [] }
    expect(esquemaCopia.safeParse(copia).success).toBe(false)
    expect(esquemaCopia.safeParse({ ...copia, version: 1 }).success).toBe(true)
  })
})
