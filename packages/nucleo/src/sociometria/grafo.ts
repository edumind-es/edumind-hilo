/**
 * Disposición de fuerzas para el grafo del grupo. Puro y determinista: la
 * misma semilla da la misma figura, así el informe impreso y la pantalla
 * coinciden. Fruchterman-Reingold simplificado con enfriamiento lineal y
 * gravedad hacia el centro.
 */
export interface NodoGrafo {
  id: string
  /** Peso para el tamaño: elecciones recibidas. */
  peso: number
}
export interface AristaGrafo {
  de: string
  a: string
  reciproca: boolean
}
export interface Posicion {
  id: string
  x: number
  y: number
}

/** Generador pseudoaleatorio determinista (mulberry32). */
export function azarSemilla(semilla: number): () => number {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function disponerGrafo(nodos: NodoGrafo[], aristas: AristaGrafo[], opciones: { ancho: number; alto: number; iteraciones?: number; semilla?: number; margen?: number }): Posicion[] {
  const n = nodos.length
  if (n === 0) return []
  const { ancho, alto } = opciones
  const margen = opciones.margen ?? 40
  const iteraciones = opciones.iteraciones ?? 300
  const azar = azarSemilla(opciones.semilla ?? 7)
  const indice = new Map(nodos.map((nd, i) => [nd.id, i]))
  const x = new Float64Array(n)
  const y = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = margen + azar() * (ancho - 2 * margen)
    y[i] = margen + azar() * (alto - 2 * margen)
  }
  const area = (ancho - 2 * margen) * (alto - 2 * margen)
  const k = Math.sqrt(area / n) * 0.8
  const enlaces: [number, number, number][] = []
  for (const ar of aristas) {
    const i = indice.get(ar.de)
    const j = indice.get(ar.a)
    if (i === undefined || j === undefined || i === j) continue
    enlaces.push([i, j, ar.reciproca ? 1.6 : 1])
  }
  const dx = new Float64Array(n)
  const dy = new Float64Array(n)
  let temperatura = Math.max(ancho, alto) / 8
  const cx = ancho / 2
  const cy = alto / 2
  for (let it = 0; it < iteraciones; it++) {
    dx.fill(0)
    dy.fill(0)
    // repulsión entre todos
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ex = x[i]! - x[j]!
        let ey = y[i]! - y[j]!
        let d = Math.hypot(ex, ey)
        if (d < 0.01) {
          ex = azar() - 0.5
          ey = azar() - 0.5
          d = 0.01
        }
        const f = (k * k) / d
        dx[i]! += (ex / d) * f
        dy[i]! += (ey / d) * f
        dx[j]! -= (ex / d) * f
        dy[j]! -= (ey / d) * f
      }
    }
    // atracción por arista
    for (const [i, j, peso] of enlaces) {
      const ex = x[i]! - x[j]!
      const ey = y[i]! - y[j]!
      const d = Math.hypot(ex, ey) || 0.01
      const f = ((d * d) / k) * peso
      dx[i]! -= (ex / d) * f
      dy[i]! -= (ey / d) * f
      dx[j]! += (ex / d) * f
      dy[j]! += (ey / d) * f
    }
    // gravedad
    for (let i = 0; i < n; i++) {
      dx[i]! += (cx - x[i]!) * 0.05
      dy[i]! += (cy - y[i]!) * 0.05
    }
    for (let i = 0; i < n; i++) {
      const d = Math.hypot(dx[i]!, dy[i]!) || 0.01
      const paso = Math.min(d, temperatura)
      x[i] = Math.min(ancho - margen, Math.max(margen, x[i]! + (dx[i]! / d) * paso))
      y[i] = Math.min(alto - margen, Math.max(margen, y[i]! + (dy[i]! / d) * paso))
    }
    temperatura *= 1 - 1 / iteraciones
  }
  return nodos.map((nd, i) => ({ id: nd.id, x: Math.round(x[i]! * 10) / 10, y: Math.round(y[i]! * 10) / 10 }))
}
