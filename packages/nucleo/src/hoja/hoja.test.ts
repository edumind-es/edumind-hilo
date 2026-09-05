import { codificarIdentidadHoja, decodificarIdentidadHoja, disenoHoja } from './diseno'
import { aplicar, encontrarMarcadores, homografia, leerHoja, type ImagenGris } from './lectura'

/**
 * Rasterizador mínimo para las pruebas: pinta una hoja según el diseño en una
 * imagen gris, con una transformación afín (escala, giro y desplazamiento)
 * para simular una foto torcida. Cada píxel se mapea hacia atrás a mm.
 */
function pintarHoja(opts: { filas: number; columnas: number; llenas: [number, number][]; ppm: number; giro?: number; dx?: number; dy?: number; fondo?: number }): { img: ImagenGris; diseno: ReturnType<typeof disenoHoja> } {
  const diseno = disenoHoja(opts.filas, opts.columnas)
  const giro = opts.giro ?? 0
  const cos = Math.cos(giro)
  const sin = Math.sin(giro)
  const ancho = Math.round(diseno.ancho * opts.ppm * 1.3)
  const alto = Math.round(diseno.alto * opts.ppm * 1.3)
  const dx = opts.dx ?? ancho * 0.15
  const dy = opts.dy ?? alto * 0.15
  const datos = new Uint8Array(ancho * alto).fill(opts.fondo ?? 120)
  const llenas = new Set(opts.llenas.map(([f, c]) => `${f},${c}`))
  for (let py = 0; py < alto; py++) {
    for (let px = 0; px < ancho; px++) {
      // píxel → mm (inversa de: mm → giro → escala → desplazamiento)
      const rx = (px - dx) / opts.ppm
      const ry = (py - dy) / opts.ppm
      const mx = rx * cos + ry * sin
      const my = -rx * sin + ry * cos
      if (mx < 0 || my < 0 || mx > diseno.ancho || my > diseno.alto) continue
      let v = 245 // papel
      for (const m of diseno.marcadores) {
        if (Math.abs(mx - m.x) <= diseno.ladoMarcador / 2 && Math.abs(my - m.y) <= diseno.ladoMarcador / 2) v = 15
      }
      // Solo se comprueba la burbuja más cercana en la rejilla: es lo que
      // mantiene el rasterizador en milisegundos.
      const f = Math.round((my - diseno.filas[0]!) / diseno.paso)
      const c = Math.round((mx - diseno.columnas[0]!) / (diseno.columnas[1]! - diseno.columnas[0]!))
      const fy = diseno.filas[f]
      const cx = diseno.columnas[c]
      if (fy !== undefined && cx !== undefined) {
        const d = Math.hypot(mx - cx, my - fy)
        const r = diseno.diametro / 2
        if (llenas.has(`${f},${c}`) && d <= r) v = 30
        else if (d <= r && d >= r - 0.3) v = 60 // contorno impreso
      }
      datos[py * ancho + px] = v
    }
  }
  return { img: { ancho, alto, datos }, diseno }
}

describe('hoja de marcas · diseño', () => {
  it('cabe en A4 con 32 filas y 5 columnas', () => {
    const d = disenoHoja(32, 5)
    expect(d.filas.at(-1)!).toBeLessThan(d.alto - 20)
    expect(d.columnas.at(-1)!).toBeLessThan(d.ancho - 20)
    expect(d.paso).toBeGreaterThan(5.5)
  })
  it('identidad de la hoja: ida y vuelta', () => {
    const t = codificarIdentidadHoja('toma-1', 'AB3DE', ['F2GH7', 'K9M2N'])
    expect(t).toBe('H1H|toma-1|AB3DE|F2GH7K9M2N')
    expect(decodificarIdentidadHoja(t)).toEqual({ toma: 'toma-1', codigo: 'AB3DE', filas: ['F2GH7', 'K9M2N'] })
    expect(decodificarIdentidadHoja('H1|x')).toBeNull()
  })
})

describe('hoja de marcas · lectura', () => {
  it('la homografía devuelve los puntos de control', () => {
    const o = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }]
    const d = [{ x: 100, y: 100 }, { x: 300, y: 110 }, { x: 90, y: 320 }, { x: 310, y: 330 }]
    const H = homografia(o, d)
    o.forEach((p, i) => {
      const q = aplicar(H, p)
      expect(q.x).toBeCloseTo(d[i]!.x, 6)
      expect(q.y).toBeCloseTo(d[i]!.y, 6)
    })
  })

  it('lee una hoja recta', { timeout: 20000 }, () => {
    const { img, diseno } = pintarHoja({ filas: 24, columnas: 4, llenas: [[0, 0], [5, 2], [23, 3]], ppm: 4 })
    const m = encontrarMarcadores(img)
    expect(m).not.toBeNull()
    const lectura = leerHoja(img, diseno)
    const llenas = lectura.marcas.filter(x => x.estado === 'llena').map(x => [x.fila, x.columna])
    expect(llenas).toEqual([[0, 0], [5, 2], [23, 3]])
    expect(lectura.marcas.filter(x => x.estado === 'dudosa')).toHaveLength(0)
    expect(lectura.escala).toBeCloseTo(4, 0)
  })

  it('lee una hoja girada y desplazada, como una foto con el móvil', { timeout: 20000 }, () => {
    const { img, diseno } = pintarHoja({ filas: 30, columnas: 5, llenas: [[2, 1], [17, 4], [29, 0]], ppm: 3.2, giro: 0.06, dx: 90, dy: 70 })
    const lectura = leerHoja(img, diseno)
    const llenas = lectura.marcas.filter(x => x.estado === 'llena').map(x => [x.fila, x.columna])
    expect(llenas).toEqual([[2, 1], [17, 4], [29, 0]])
    expect(lectura.marcas.filter(x => x.estado === 'dudosa')).toHaveLength(0)
  })

  it('falla con claridad si faltan marcadores', () => {
    const img: ImagenGris = { ancho: 300, alto: 400, datos: new Uint8Array(300 * 400).fill(240) }
    expect(() => leerHoja(img, disenoHoja(10, 3))).toThrow(/marcadores/)
  })
})
