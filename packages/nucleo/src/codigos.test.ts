import { ALFABETO_CODIGO, esCodigoValido, generarCodigo, generarCodigosUnicos, normalizarCodigo } from './codigos'

describe('códigos de alumno', () => {
  it('genera cinco caracteres del alfabeto sin ambigüedad', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigo()
      expect(c).toHaveLength(5)
      expect(esCodigoValido(c)).toBe(true)
    }
    expect(ALFABETO_CODIGO).not.toMatch(/[IO01]/)
  })

  it('no repite códigos ni choca con los existentes', () => {
    const existentes = ['AAAAA', 'BBBBB']
    const nuevos = generarCodigosUnicos(500, existentes)
    expect(new Set([...nuevos, ...existentes]).size).toBe(502)
  })

  it('es determinista con un azar fijo', () => {
    const secuencia = () => { let k = 0; return () => ((k++ * 7) % 32) / 32 }
    expect(generarCodigo(secuencia())).toBe(generarCodigo(secuencia()))
    expect(generarCodigo(() => 0)).toBe('AAAAA')
  })

  it('normaliza lo que teclea una persona', () => {
    expect(normalizarCodigo(' ab3-de ')).toBe('AB3DE')
    expect(esCodigoValido(normalizarCodigo('ab3de'))).toBe(true)
    expect(esCodigoValido('AB3D')).toBe(false)
    expect(esCodigoValido('AB3DO')).toBe(false)
  })
})
