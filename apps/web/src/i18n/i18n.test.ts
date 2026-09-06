import { en } from './en'
import { gl } from './gl'

const marcadores = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('diccionarios del portal', () => {
  it('gallego e inglés cubren las mismas claves', () => {
    expect(Object.keys(gl).sort()).toEqual(Object.keys(en).sort())
  })
  it('las traducciones conservan los marcadores de interpolación', () => {
    for (const d of [gl, en]) {
      for (const [clave, texto] of Object.entries(d)) {
        expect(marcadores(texto), clave).toEqual(marcadores(clave))
        expect(texto.trim().length, clave).toBeGreaterThan(0)
      }
    }
  })
  it('ninguna traducción nombra instituciones ni la palabra sociograma al alumnado', () => {
    for (const d of [gl, en]) for (const texto of Object.values(d)) expect(texto).not.toMatch(/\bceip\b/i)
  })
})
