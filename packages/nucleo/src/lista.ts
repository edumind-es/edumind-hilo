/**
 * De un texto pegado a una lista de nombres. Es la única forma de crear un
 * grupo en fase 0, y sigue siendo la más rápida: se copia de cualquier
 * hoja de cálculo o de la lista del centro y se pega.
 */

const MAX_NOMBRE = 80

export function analizarLista(texto: string): string[] {
  const vistos = new Set<string>()
  const nombres: string[] = []
  for (const bruto of texto.split(/[\n;,\t]+/)) {
    const nombre = bruto.replace(/^\s*\d+[.)-]?\s*/, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOMBRE)
    if (!nombre) continue
    const clave = nombre.toLocaleLowerCase('es')
    if (vistos.has(clave)) continue
    vistos.add(clave)
    nombres.push(nombre)
  }
  return nombres
}

/**
 * Nombre de pila para la pantalla del alumnado. En un grupo con dos «Iker»
 * se añade la inicial del apellido a los dos, y solo a ellos.
 */
export function nombresParaAlumnado(nombresCompletos: string[]): string[] {
  const pila = nombresCompletos.map(n => n.split(' ')[0] ?? n)
  const cuenta = new Map<string, number>()
  for (const p of pila) cuenta.set(p.toLocaleLowerCase('es'), (cuenta.get(p.toLocaleLowerCase('es')) ?? 0) + 1)
  return nombresCompletos.map((n, i) => {
    const p = pila[i] ?? n
    if ((cuenta.get(p.toLocaleLowerCase('es')) ?? 0) < 2) return p
    const apellido = n.split(' ')[1]
    return apellido ? `${p} ${apellido[0]}.` : p
  })
}
