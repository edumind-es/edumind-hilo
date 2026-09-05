import { azarSemilla, disponerGrafo } from './grafo'

describe('disposición del grafo', () => {
  const nodos = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, peso: i % 4 }))
  const aristas = [
    { de: 'n0', a: 'n1', reciproca: true }, { de: 'n1', a: 'n2', reciproca: true }, { de: 'n0', a: 'n2', reciproca: true },
    { de: 'n5', a: 'n6', reciproca: true }, { de: 'n6', a: 'n7', reciproca: false },
  ]
  it('es determinista y queda dentro del lienzo', () => {
    const a = disponerGrafo(nodos, aristas, { ancho: 600, alto: 400, semilla: 3 })
    const b = disponerGrafo(nodos, aristas, { ancho: 600, alto: 400, semilla: 3 })
    expect(a).toEqual(b)
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(40)
      expect(p.x).toBeLessThanOrEqual(560)
      expect(p.y).toBeGreaterThanOrEqual(40)
      expect(p.y).toBeLessThanOrEqual(360)
    }
  })
  it('los unidos acaban más cerca que los sueltos', () => {
    const pos = new Map(disponerGrafo(nodos, aristas, { ancho: 600, alto: 400 }).map(p => [p.id, p]))
    const d = (a: string, b: string) => Math.hypot(pos.get(a)!.x - pos.get(b)!.x, pos.get(a)!.y - pos.get(b)!.y)
    const unidos = (d('n0', 'n1') + d('n1', 'n2') + d('n5', 'n6')) / 3
    const sueltos = (d('n3', 'n9') + d('n4', 'n10') + d('n8', 'n11')) / 3
    expect(unidos).toBeLessThan(sueltos)
  })
  it('el azar con semilla se repite', () => {
    const a = azarSemilla(42)
    const b = azarSemilla(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('acepta un grafo vacío y uno de un nodo', () => {
    expect(disponerGrafo([], [], { ancho: 100, alto: 100 })).toEqual([])
    expect(disponerGrafo([{ id: 'a', peso: 0 }], [], { ancho: 100, alto: 100 })).toHaveLength(1)
  })
})
