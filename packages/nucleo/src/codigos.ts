/**
 * Códigos de alumno: cinco caracteres de un alfabeto sin ambigüedad (sin
 * I ni O, sin 0 ni 1). Es el mismo formato que la hoja de códigos de MiClase, para
 * que una hoja sirva en las dos apps.
 *
 * 32^5 = 33,5 millones de combinaciones: dentro de un grupo la colisión es
 * despreciable, y aun así se comprueba.
 */
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const LONGITUD_CODIGO = 5

export type Azar = () => number

/** Por defecto azar criptográfico si existe; si no, Math.random. */
export const azarPorDefecto: Azar = () => {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } }).crypto
  if (c?.getRandomValues) {
    const b = new Uint32Array(1)
    c.getRandomValues(b)
    return (b[0] ?? 0) / 4294967296
  }
  return Math.random()
}

export function generarCodigo(azar: Azar = azarPorDefecto): string {
  let s = ''
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    s += ALFABETO_CODIGO[Math.floor(azar() * ALFABETO_CODIGO.length)]
  }
  return s
}

export function esCodigoValido(codigo: string): boolean {
  return codigo.length === LONGITUD_CODIGO && [...codigo].every(ch => ALFABETO_CODIGO.includes(ch))
}

/** Normaliza lo que teclea una persona: mayúsculas y sin espacios. */
export function normalizarCodigo(entrada: string): string {
  return entrada.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function generarCodigosUnicos(n: number, existentes: Iterable<string> = [], azar: Azar = azarPorDefecto): string[] {
  const usados = new Set(existentes)
  const nuevos: string[] = []
  let intentos = 0
  while (nuevos.length < n) {
    if (++intentos > n * 100) throw new Error('no se pudieron generar códigos únicos')
    const c = generarCodigo(azar)
    if (usados.has(c)) continue
    usados.add(c)
    nuevos.push(c)
  }
  return nuevos
}
