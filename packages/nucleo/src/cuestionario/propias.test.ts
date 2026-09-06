import { esquemaToma } from '../esquemas'
import { analizar } from '../sociometria'
import { esPercepcion, etiquetaSituacion, idPreguntaNuevo, textoSituacion } from './index'

const ahora = '2026-09-06T10:00:00.000Z'
const base = { id: 't', created_at: ahora, updated_at: ahora, deleted_at: null, grupo_id: 'g', titulo: 'x', etapa: 'primaria' as const, idioma: 'es' as const, max_elecciones: 3, negativas: false, estado: 'abierta' as const, inicio: ahora, fin: null }

describe('preguntas propias', () => {
  const preguntas = [
    { id: 'pmesa', etiqueta: 'Mesa', pregunta: '¿Con quién te sentarías?', tipo: 'preferencia' as const },
    { id: 'pcree', etiqueta: 'Cree', pregunta: '¿Quién crees que se sentaría contigo?', tipo: 'percepcion' as const },
  ]
  it('el esquema exige coherencia entre situaciones y preguntas', () => {
    expect(esquemaToma.safeParse({ ...base, situaciones: ['equipo', 'pmesa', 'pcree'], preguntas }).success).toBe(true)
    expect(esquemaToma.safeParse({ ...base, situaciones: ['equipo', 'pnada'], preguntas }).success).toBe(false)
    expect(esquemaToma.safeParse({ ...base, situaciones: ['equipo'], preguntas: [{ ...preguntas[0]!, id: 'equipo' }] }).success).toBe(false)
    expect(esquemaToma.safeParse({ ...base, situaciones: ['Mesa'], preguntas: [] }).success).toBe(false)
  })
  it('textos, etiquetas y tipo salen de la toma', () => {
    expect(textoSituacion('es', 'primaria', 'pmesa', preguntas).pregunta).toBe('¿Con quién te sentarías?')
    expect(textoSituacion('gl', 'primaria', 'equipo', preguntas).pregunta).toMatch(/equipo/i)
    expect(etiquetaSituacion('pcree', preguntas)).toBe('Cree')
    expect(esPercepcion('pcree', preguntas)).toBe(true)
    expect(esPercepcion('pmesa', preguntas)).toBe(false)
    expect(esPercepcion('espejo')).toBe(true)
  })
  it('el análisis trata la percepción propia como espejo', () => {
    const alumnos = ['a', 'b', 'c'].map(id => ({ id }))
    const respuestas = [
      { situacion: 'pmesa', de_alumno: 'b', a_alumno: 'a', signo: 1 as const },
      { situacion: 'pcree', de_alumno: 'a', a_alumno: 'b', signo: 1 as const },
      { situacion: 'pcree', de_alumno: 'a', a_alumno: 'c', signo: 1 as const },
    ]
    const an = analizar({ alumnos, respuestas, situaciones: ['pmesa', 'pcree'], preguntas, negativas: false })
    expect(an.porAlumno.a!.recibidasTotal).toBe(1)
    expect(an.porAlumno.b!.recibidasTotal).toBe(0) // la percepción no cuenta
    expect(an.porAlumno.a!.ajustePerceptivo).toBeCloseTo(0.5)
  })
  it('los ids nuevos no chocan', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 50; i++) ids.add(idPreguntaNuevo([...ids]))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(/^p[a-z0-9]{5}$/)
  })
})
