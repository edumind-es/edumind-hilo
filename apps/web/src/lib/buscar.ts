/** Búsqueda de nombres para el teclado de transcripción: sin acentos ni mayúsculas, por prefijo de cualquier palabra. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function coincidencias<T extends { nombre: string }>(texto: string, personas: T[]): T[] {
  const t = normalizar(texto)
  if (!t) return []
  const empiezan = personas.filter(p => normalizar(p.nombre).startsWith(t))
  const porPalabra = personas.filter(p => !empiezan.includes(p) && normalizar(p.nombre).split(' ').some(w => w.startsWith(t)))
  return [...empiezan, ...porPalabra]
}
