import { analizar } from '@edumind-hilo/nucleo'
import { documentoInforme } from './plantilla'

const ahora = '2026-09-05T10:00:00.000Z'
const base = { created_at: ahora, updated_at: ahora, deleted_at: null }

describe('informe de grupo', () => {
  it('es un documento autocontenido, con los datos escapados y sin orígenes externos', () => {
    const alumnos = ['a', 'b', 'c'].map((id, i) => ({ id, ...base, grupo_id: 'g', nombre: i === 0 ? 'Ana <script>' : `N${i}`, codigo: 'AB3DE', neae: false }))
    const toma = { id: 't', ...base, grupo_id: 'g', titulo: 'Septiembre', etapa: 'primaria' as const, idioma: 'es' as const, situaciones: ['equipo' as const, 'espejo' as const], max_elecciones: 3, negativas: false, estado: 'cerrada' as const, inicio: ahora, fin: ahora }
    const grupo = { id: 'g', ...base, nombre: '4.º B', etapa: 'primaria' as const, curso: '2026-2027', idioma: 'es' as const }
    const analisis = analizar({ alumnos, respuestas: [{ situacion: 'equipo', de_alumno: 'a', a_alumno: 'b', signo: 1 }, { situacion: 'equipo', de_alumno: 'b', a_alumno: 'a', signo: 1 }], situaciones: toma.situaciones, negativas: false, participantes: ['a', 'b'] })
    const html = documentoInforme({ grupo, toma, alumnos, analisis, nombres: new Map(alumnos.map(a => [a.id, a.nombre])), respondieron: 2 })
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('Ana &lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toMatch(/<svg /)
    expect(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')).not.toMatch(/https?:\/\/(?!hilos\.edumind\.es)/)
    expect(html).toContain('Luis Vilela Acuña')
  })
})
