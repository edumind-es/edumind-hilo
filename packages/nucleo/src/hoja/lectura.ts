/**
 * Lectura de la hoja de marcas a partir de una imagen en escala de grises.
 *
 * 1. Se localizan los cuatro marcadores de registro: el blob oscuro más
 *    grande y más cuadrado de cada esquina.
 * 2. Se calcula la homografía milímetros → píxeles con esas cuatro esquinas,
 *    lo que corrige perspectiva, giro y escala de la foto.
 * 3. Cada burbuja se muestrea en su posición: oscuridad del interior frente
 *    al papel que la rodea. Con umbral doble: llena, vacía o dudosa.
 *
 * No se usa ninguna librería: es un problema acotado con hoja propia.
 */
import type { DisenoHoja, Punto } from './diseno'

export interface ImagenGris {
  ancho: number
  alto: number
  /** 0 = negro, 255 = blanco, por filas. */
  datos: Uint8Array
}

export type EstadoMarca = 'llena' | 'vacia' | 'dudosa'

export interface Marca {
  fila: number
  columna: number
  estado: EstadoMarca
  /** 0 = blanco como el papel, 1 = negro. */
  oscuridad: number
  /** Centro en píxeles, para dibujar la confirmación. */
  centro: Punto
  radio: number
}

export interface LecturaHoja {
  marcadores: [Punto, Punto, Punto, Punto]
  marcas: Marca[]
  /** Píxeles por milímetro estimados. Por debajo de 2 la lectura no es fiable. */
  escala: number
}

export const UMBRAL_LLENA = 0.32
export const UMBRAL_VACIA = 0.16

export function aGris(rgba: Uint8ClampedArray | Uint8Array, ancho: number, alto: number): ImagenGris {
  const datos = new Uint8Array(ancho * alto)
  for (let i = 0, j = 0; i < datos.length; i++, j += 4) {
    datos[i] = (((rgba[j] ?? 0) * 299 + (rgba[j + 1] ?? 0) * 587 + (rgba[j + 2] ?? 0) * 114) / 1000) | 0
  }
  return { ancho, alto, datos }
}

function umbralOtsu(datos: Uint8Array): number {
  const hist = new Array<number>(256).fill(0)
  for (let i = 0; i < datos.length; i++) hist[datos[i]!]!++
  const total = datos.length
  let suma = 0
  for (let t = 0; t < 256; t++) suma += t * hist[t]!
  let sumaB = 0
  let wB = 0
  let mejor = 0
  let umbral = 128
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumaB += t * hist[t]!
    const mB = sumaB / wB
    const mF = (suma - sumaB) / wF
    const entre = wB * wF * (mB - mF) ** 2
    if (entre > mejor) {
      mejor = entre
      umbral = t
    }
  }
  return umbral
}

/** Reduce la imagen para buscar marcadores deprisa. */
function reducir(img: ImagenGris, factor: number): ImagenGris {
  if (factor <= 1) return img
  const ancho = Math.floor(img.ancho / factor)
  const alto = Math.floor(img.alto / factor)
  const datos = new Uint8Array(ancho * alto)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      let s = 0
      for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) s += img.datos[(y * factor + dy) * img.ancho + x * factor + dx]!
      datos[y * ancho + x] = (s / (factor * factor)) | 0
    }
  }
  return { ancho, alto, datos }
}

interface Blob {
  area: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  sumX: number
  sumY: number
}

/** Blob oscuro más cuadrado y grande dentro de una región. */
function mejorBlob(img: ImagenGris, umbral: number, x0: number, y0: number, x1: number, y1: number): Blob | null {
  const visto = new Uint8Array(img.ancho * img.alto)
  let mejor: Blob | null = null
  let mejorPuntuacion = 0
  const pila: number[] = []
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * img.ancho + x
      if (visto[i] || img.datos[i]! >= umbral) continue
      const b: Blob = { area: 0, minX: x, maxX: x, minY: y, maxY: y, sumX: 0, sumY: 0 }
      pila.push(i)
      visto[i] = 1
      while (pila.length) {
        const j = pila.pop()!
        const jx = j % img.ancho
        const jy = (j / img.ancho) | 0
        b.area++
        b.sumX += jx
        b.sumY += jy
        if (jx < b.minX) b.minX = jx
        if (jx > b.maxX) b.maxX = jx
        if (jy < b.minY) b.minY = jy
        if (jy > b.maxY) b.maxY = jy
        const vecinos = [j - 1, j + 1, j - img.ancho, j + img.ancho]
        for (const v of vecinos) {
          const vx = v % img.ancho
          const vy = (v / img.ancho) | 0
          if (v < 0 || v >= visto.length || vx < x0 || vx >= x1 || vy < y0 || vy >= y1) continue
          if (visto[v] || img.datos[v]! >= umbral) continue
          visto[v] = 1
          pila.push(v)
        }
      }
      const w = b.maxX - b.minX + 1
      const h = b.maxY - b.minY + 1
      const aspecto = Math.min(w, h) / Math.max(w, h)
      const relleno = b.area / (w * h)
      if (aspecto < 0.6 || relleno < 0.6 || b.area < 16) continue
      const puntuacion = b.area * aspecto * relleno
      if (puntuacion > mejorPuntuacion) {
        mejorPuntuacion = puntuacion
        mejor = b
      }
    }
  }
  return mejor
}

export function encontrarMarcadores(img: ImagenGris): [Punto, Punto, Punto, Punto] | null {
  const factor = Math.max(1, Math.floor(img.ancho / 700))
  const red = reducir(img, factor)
  const umbral = umbralOtsu(red.datos)
  const fx = Math.floor(red.ancho * 0.3)
  const fy = Math.floor(red.alto * 0.3)
  const zonas: [number, number, number, number][] = [
    [0, 0, fx, fy],
    [red.ancho - fx, 0, red.ancho, fy],
    [0, red.alto - fy, fx, red.alto],
    [red.ancho - fx, red.alto - fy, red.ancho, red.alto],
  ]
  const puntos: Punto[] = []
  for (const [x0, y0, x1, y1] of zonas) {
    const b = mejorBlob(red, umbral, x0, y0, x1, y1)
    if (!b) return null
    puntos.push({ x: ((b.sumX / b.area) + 0.5) * factor, y: ((b.sumY / b.area) + 0.5) * factor })
  }
  return puntos as [Punto, Punto, Punto, Punto]
}

/** Homografía mm → px a partir de cuatro correspondencias (DLT). */
export function homografia(origen: Punto[], destino: Punto[]): number[] {
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = origen[i]!
    const { x: u, y: v } = destino[i]!
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  // Resolver el sistema 8x8 por eliminación gaussiana con pivote parcial.
  const n = 8
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r
    const tmp = A[c]!
    A[c] = A[p]!
    A[p] = tmp
    const piv = A[c]![c]!
    if (Math.abs(piv) < 1e-12) throw new Error('marcadores degenerados')
    for (let k = c; k <= n; k++) A[c]![k]! /= piv
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = A[r]![c]!
      for (let k = c; k <= n; k++) A[r]![k]! -= f * A[c]![k]!
    }
  }
  return [...A.map(fila => fila[n]!), 1]
}

export function aplicar(H: number[], p: Punto): Punto {
  const w = H[6]! * p.x + H[7]! * p.y + H[8]!
  return { x: (H[0]! * p.x + H[1]! * p.y + H[2]!) / w, y: (H[3]! * p.x + H[4]! * p.y + H[5]!) / w }
}

function mediaDisco(img: ImagenGris, c: Punto, r0: number, r1: number): number {
  let s = 0
  let n = 0
  const x0 = Math.max(0, Math.floor(c.x - r1))
  const x1 = Math.min(img.ancho - 1, Math.ceil(c.x + r1))
  const y0 = Math.max(0, Math.floor(c.y - r1))
  const y1 = Math.min(img.alto - 1, Math.ceil(c.y + r1))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - c.x, y - c.y)
      if (d < r0 || d > r1) continue
      s += img.datos[y * img.ancho + x]!
      n++
    }
  }
  return n ? s / n : 255
}

export function leerHoja(img: ImagenGris, diseno: DisenoHoja): LecturaHoja {
  const marcadores = encontrarMarcadores(img)
  if (!marcadores) throw new Error('No se ven los cuatro marcadores de las esquinas.')
  const H = homografia(diseno.marcadores, marcadores)
  const escala = Math.hypot(marcadores[1].x - marcadores[0].x, marcadores[1].y - marcadores[0].y) / (diseno.marcadores[1].x - diseno.marcadores[0].x)
  const radio = (diseno.diametro / 2) * escala
  const marcas: Marca[] = []
  diseno.filas.forEach((fy, fila) => {
    diseno.columnas.forEach((cx, columna) => {
      const centro = aplicar(H, { x: cx, y: fy })
      const dentro = mediaDisco(img, centro, 0, radio * 0.62)
      const papel = mediaDisco(img, centro, radio * 1.35, radio * 1.9)
      const oscuridad = papel > 0 ? Math.max(0, Math.min(1, (papel - dentro) / papel)) : 0
      const estado: EstadoMarca = oscuridad >= UMBRAL_LLENA ? 'llena' : oscuridad <= UMBRAL_VACIA ? 'vacia' : 'dudosa'
      marcas.push({ fila, columna, estado, oscuridad, centro, radio })
    })
  })
  return { marcadores, marcas, escala }
}
