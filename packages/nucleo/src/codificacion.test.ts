import { codificarRespuestas, decodificarRespuestas } from './codificacion'

describe('codificación compacta de respuestas', () => {
  it('ida y vuelta', () => {
    const r = {
      toma: 'toma-2026-09',
      de: 'AB3DE',
      elecciones: [
        { situacion: 'equipo' as const, a: 'F2GH7', signo: 1 as const },
        { situacion: 'equipo' as const, a: 'K9M2N', signo: 1 as const },
        { situacion: 'recreo' as const, a: 'K9M2N', signo: -1 as const },
      ],
    }
    const texto = codificarRespuestas(r)
    expect(texto).toBe('H1|toma-2026-09|AB3DE|equipo:+F2GH7+K9M2N|recreo:-K9M2N')
    expect(decodificarRespuestas(texto)).toEqual(r)
  })

  it('cabe de sobra en un QR: 5 situaciones por 5 elecciones', () => {
    const elecciones = (['equipo', 'recreo', 'ayuda', 'espejo', 'viaje'] as const).flatMap(situacion =>
      ['F2GH7', 'K9M2N', 'P4Q5R', 'S6T7U', 'V8W9X'].map(a => ({ situacion, a, signo: 1 as const })),
    )
    const texto = codificarRespuestas({ toma: 'x'.repeat(64), de: 'AB3DE', elecciones })
    expect(texto.length).toBeLessThan(300)
  })

  it('rechaza lo mal formado', () => {
    expect(() => decodificarRespuestas('H2|t|AB3DE')).toThrow()
    expect(() => decodificarRespuestas('H1|t|AB3DE|equipo:AB3DE')).toThrow()
    expect(() => decodificarRespuestas('H1|t|AB3DE|equipo:+AB3DE')).toThrow(/sí mismo/)
    expect(() => decodificarRespuestas('H1|t|AB3DE|otra:+F2GH7')).toThrow(/desconocida/)
    expect(() => codificarRespuestas({ toma: 't', de: 'AB3D', elecciones: [] })).toThrow()
  })
})
