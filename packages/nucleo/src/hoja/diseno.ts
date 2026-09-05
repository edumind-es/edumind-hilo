/**
 * Geometría de la hoja de marcas, en milímetros sobre A4 vertical.
 *
 * La misma función sirve para imprimir la hoja y para leerla: quien imprime
 * coloca los elementos donde dice el diseño, quien lee busca en esos mismos
 * puntos. Si esto cambia, cambian las dos cosas a la vez.
 */
export interface Punto {
  x: number
  y: number
}

export interface DisenoHoja {
  ancho: number
  alto: number
  /** Marcadores de registro: TL, TR, BL, BR. Cuadrados negros. */
  marcadores: [Punto, Punto, Punto, Punto]
  ladoMarcador: number
  /** Código QR de identidad (toma, alumno y orden de filas). */
  qr: { x: number; y: number; lado: number }
  /** Centros de columnas de burbujas, una por situación. */
  columnas: number[]
  /** Centros de filas de burbujas, una por compañero. */
  filas: number[]
  diametro: number
  paso: number
  /** Zona del nombre de cada fila. */
  nombreX: number
  nombreAncho: number
  cabeceraY: number
  /** Zona del rótulo y las instrucciones. */
  tituloX: number
  tituloY: number
}

export const MAX_FILAS_HOJA = 32
export const MAX_COLUMNAS_HOJA = 5

export function disenoHoja(nFilas: number, nColumnas: number): DisenoHoja {
  if (nFilas < 1 || nFilas > MAX_FILAS_HOJA) throw new Error(`filas fuera de rango: ${nFilas}`)
  if (nColumnas < 1 || nColumnas > MAX_COLUMNAS_HOJA) throw new Error(`columnas fuera de rango: ${nColumnas}`)
  const margen = 14
  const lado = 8
  const ancho = 210
  const alto = 297
  const inicioY = 72
  const finY = 272
  const paso = Math.min(7.5, (finY - inicioY) / nFilas)
  const filas = Array.from({ length: nFilas }, (_, k) => inicioY + paso / 2 + k * paso)
  const primeraCol = 112
  const pasoCol = 17
  const columnas = Array.from({ length: nColumnas }, (_, k) => primeraCol + k * pasoCol)
  return {
    ancho,
    alto,
    marcadores: [
      { x: margen, y: margen },
      { x: ancho - margen, y: margen },
      { x: margen, y: alto - margen },
      { x: ancho - margen, y: alto - margen },
    ],
    ladoMarcador: lado,
    qr: { x: margen - lado / 2, y: 24, lado: 30 },
    columnas,
    filas,
    diametro: 5.5,
    paso,
    nombreX: 16,
    nombreAncho: 88,
    cabeceraY: inicioY - 5,
    tituloX: 48,
    tituloY: 30,
  }
}

/** Contenido del QR de identidad de la hoja: toma, alumno y orden de filas. */
export function codificarIdentidadHoja(toma: string, codigo: string, filas: string[]): string {
  return ['H1H', toma, codigo, filas.join('')].join('|')
}

export function decodificarIdentidadHoja(texto: string): { toma: string; codigo: string; filas: string[] } | null {
  const partes = texto.trim().split('|')
  if (partes.length !== 4 || partes[0] !== 'H1H') return null
  const [, toma, codigo, concatenadas] = partes
  if (!toma || !codigo || !concatenadas || concatenadas.length % 5 !== 0) return null
  const filas: string[] = []
  for (let i = 0; i < concatenadas.length; i += 5) filas.push(concatenadas.slice(i, i + 5))
  return { toma, codigo, filas }
}
