import { analizar, listaAtencion, tipo } from './index'
import type { Situacion } from '../tipos'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `a${i + 1}`)
const elige = (de: string, a: string, situacion: Situacion = 'equipo', signo: 1 | -1 = 1) => ({ situacion, de_alumno: de, a_alumno: a, signo })

describe('motor sociométrico', () => {
  it('cuenta recibidas, emitidas y reciprocidad', () => {
    const alumnos = ids(4).map(id => ({ id }))
    const respuestas = [elige('a1', 'a2'), elige('a2', 'a1'), elige('a3', 'a1'), elige('a1', 'a3', 'recreo'), elige('a4', 'a1')]
    const a = analizar({ alumnos, respuestas, situaciones: ['equipo', 'recreo'], negativas: false })
    expect(a.porAlumno.a1!.recibidasTotal).toBe(3)
    expect(a.porAlumno.a1!.recibidas.equipo).toBe(3)
    expect(a.porAlumno.a1!.emitidasTotal).toBe(2)
    expect(a.porAlumno.a1!.reciprocas).toBe(2)
    expect(a.porAlumno.a1!.reciprocidad).toBe(1)
    expect(a.porAlumno.a4!.reciprocidad).toBe(0)
    expect(a.parejasReciprocas).toEqual([['a1', 'a2'], ['a1', 'a3']])
    expect(a.cohesion).toBeCloseTo(2 / 6)
    expect(a.sinElecciones).toEqual(['a4'])
    expect(a.porAlumno.a4!.posicion).toBe('no elegido')
  })

  it('ESPEJO no cuenta como elección recibida y da el ajuste perceptivo', () => {
    const alumnos = ids(3).map(id => ({ id }))
    const respuestas = [
      elige('a1', 'a2', 'espejo'), elige('a1', 'a3', 'espejo'), // a1 cree que le eligen a2 y a3
      elige('a2', 'a1'), // solo a2 le elige de verdad
      elige('a3', 'a2'),
    ]
    const a = analizar({ alumnos, respuestas, situaciones: ['equipo', 'espejo'], negativas: false })
    expect(a.porAlumno.a2!.recibidasTotal).toBe(1) // la de a3; la «espejo» de a1 no cuenta
    expect(a.porAlumno.a1!.ajustePerceptivo).toBeCloseTo(0.5)
    expect(a.porAlumno.a2!.ajustePerceptivo).toBeNull()
  })

  it('ignora negativas si la toma no las activó y se elige a sí mismo', () => {
    const alumnos = ids(2).map(id => ({ id }))
    const a = analizar({ alumnos, respuestas: [elige('a1', 'a2', 'equipo', -1), elige('a1', 'a1')], situaciones: ['equipo'], negativas: false })
    expect(a.porAlumno.a2!.negativasRecibidas).toBe(0)
    expect(a.porAlumno.a2!.recibidasTotal).toBe(0)
    expect(a.porAlumno.a1!.tipo).toBeNull()
  })

  it('subgrupos y puentes: dos tríos unidos por un alumno', () => {
    const alumnos = ids(7).map(id => ({ id }))
    const par = (x: string, y: string) => [elige(x, y), elige(y, x)]
    const respuestas = [
      ...par('a1', 'a2'), ...par('a2', 'a3'), ...par('a1', 'a3'),
      ...par('a4', 'a5'), ...par('a5', 'a6'), ...par('a4', 'a6'),
      ...par('a3', 'a4'), // a3 y a4 unen los dos tríos
    ]
    const a = analizar({ alumnos, respuestas, situaciones: ['equipo'], negativas: false })
    expect(a.subgrupos).toEqual([['a1', 'a2', 'a3', 'a4', 'a5', 'a6']])
    expect(a.puentes).toEqual(['a3', 'a4'])
    expect(a.sinElecciones).toEqual(['a7'])
  })

  it('tipos de Coie y Dodge', () => {
    expect(tipo(1.5, -1)).toBe('popular')
    expect(tipo(-1.2, 1.1)).toBe('rechazado')
    expect(tipo(-0.9, -0.9)).toBe('ignorado')
    expect(tipo(1, 1)).toBe('controvertido')
    expect(tipo(0.2, -0.1)).toBe('promedio')
  })

  it('con negativas activadas calcula el tipo por alumno', () => {
    const alumnos = ids(6).map(id => ({ id }))
    const respuestas = [
      // a1 es elegido por todos y nadie le rechaza: popular
      ...['a2', 'a3', 'a4', 'a5', 'a6'].map(x => elige(x, 'a1')),
      // a6 es rechazado por casi todos
      ...['a1', 'a2', 'a3', 'a4', 'a5'].map(x => elige(x, 'a6', 'equipo', -1)),
    ]
    const a = analizar({ alumnos, respuestas, situaciones: ['equipo'], negativas: true })
    expect(a.porAlumno.a1!.tipo).toBe('popular')
    expect(a.porAlumno.a6!.tipo).toBe('rechazado')
    expect(a.porAlumno.a6!.negativasRecibidas).toBe(5)
  })

  it('la lista de atención recoge los ceros y los que no respondieron', () => {
    const alumnos = ids(3).map(id => ({ id }))
    const a = analizar({ alumnos, respuestas: [elige('a1', 'a2')], situaciones: ['equipo'], negativas: false, participantes: ['a1', 'a2'] })
    const motivos = listaAtencion(a)
    expect(motivos).toContainEqual({ alumno_id: 'a1', motivo: 'ninguna elección recibida' })
    expect(motivos).toContainEqual({ alumno_id: 'a3', motivo: 'no ha respondido' })
  })

  it('el ajuste perceptivo no cuenta como «no le elige» a quien todavía no ha respondido', () => {
    const alumnos = ids(4).map(id => ({ id }))
    // a1 cree que le eligen a2 y a3; a2 le elige; a3 aún no ha respondido; a4 elige a a1.
    const respuestas = [elige('a1', 'a2', 'espejo'), elige('a1', 'a3', 'espejo'), elige('a2', 'a1'), elige('a4', 'a1')]
    const a = analizar({ alumnos, respuestas, situaciones: ['equipo', 'espejo'], negativas: false })
    expect(a.porAlumno.a1!.ajustePerceptivo).toBe(1) // solo se juzga sobre a2, que sí respondió
    expect(listaAtencion(a)).not.toContainEqual({ alumno_id: 'a1', motivo: 'cree que le eligen quienes no le eligen' })
    // Si ninguno de los nombrados ha respondido, no hay dato: null, no 0.
    const b = analizar({ alumnos, respuestas: [elige('a1', 'a3', 'espejo'), elige('a4', 'a1')], situaciones: ['equipo', 'espejo'], negativas: false })
    expect(b.porAlumno.a1!.ajustePerceptivo).toBeNull()
  })
})
