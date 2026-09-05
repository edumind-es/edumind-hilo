/**
 * CSV y TSV sin librerías: separador detectado (coma, punto y coma o
 * tabulador), comillas dobles con escape, saltos de línea de cualquier
 * sistema. Suficiente para listas de clase y matrices de otras herramientas.
 */
export function analizarCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, '')
  const primera = limpio.split(/\r?\n/).find(l => l.trim()) ?? ''
  const sep = [';', '\t', ','].reduce((mejor, s) => (primera.split(s).length > primera.split(mejor).length ? s : mejor), ',')
  const filas: string[][] = []
  let fila: string[] = []
  let campo = ''
  let entreComillas = false
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]!
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"'
          i++
        } else entreComillas = false
      } else campo += c
      continue
    }
    if (c === '"') entreComillas = true
    else if (c === sep) {
      fila.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++
      fila.push(campo)
      campo = ''
      if (fila.some(x => x.trim())) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some(x => x.trim())) filas.push(fila)
  return filas.map(f => f.map(x => x.trim()))
}

const CABECERAS_NOMBRE = ['nombre', 'alumno', 'alumna', 'alumnado', 'name', 'nome', 'estudiante', 'student']
const CABECERAS_APELLIDOS = ['apellidos', 'apellido', 'surname', 'apelidos']

function pareceCabecera(fila: string[]): boolean {
  const l = fila.map(x => x.toLowerCase())
  return l.some(x => CABECERAS_NOMBRE.includes(x) || CABECERAS_APELLIDOS.includes(x))
}

/** Lista de nombres de un CSV: columna «nombre» si hay cabecera (más «apellidos» si existe), si no la primera columna. */
export function nombresDeCsv(filas: string[][]): string[] {
  if (!filas.length) return []
  const cab = filas[0]!
  let datos = filas
  let colNombre = 0
  let colApellidos = -1
  if (pareceCabecera(cab)) {
    const l = cab.map(x => x.toLowerCase())
    colNombre = Math.max(0, l.findIndex(x => CABECERAS_NOMBRE.includes(x)))
    colApellidos = l.findIndex(x => CABECERAS_APELLIDOS.includes(x))
    datos = filas.slice(1)
  }
  return datos
    .map(f => {
      const n = f[colNombre] ?? ''
      const a = colApellidos >= 0 ? f[colApellidos] ?? '' : ''
      return `${n} ${a}`.replace(/\s+/g, ' ').trim()
    })
    .filter(Boolean)
}

const VERDADEROS = new Set(['1', 'x', 'si', 'sí', 'yes', 'true', '✓', '*'])

/**
 * Matriz «quién elige a quién» de otra herramienta: primera fila y primera
 * columna con nombres; una celda marcada es una elección.
 */
export function matrizDeCsv(filas: string[][]): { nombres: string[]; elecciones: { de: string; a: string }[] } {
  if (filas.length < 2) throw new Error('La matriz necesita al menos dos filas.')
  const columnas = filas[0]!.slice(1).map(x => x.trim())
  const nombresFilas = filas.slice(1).map(f => (f[0] ?? '').trim()).filter(Boolean)
  const nombres = [...new Set([...columnas, ...nombresFilas].filter(Boolean))]
  if (nombres.length < 2) throw new Error('No se reconocen nombres en la primera fila y la primera columna.')
  const elecciones: { de: string; a: string }[] = []
  for (const f of filas.slice(1)) {
    const de = (f[0] ?? '').trim()
    if (!de) continue
    f.slice(1).forEach((celda, j) => {
      const a = columnas[j]
      if (!a || a === de) return
      const v = celda.trim().toLowerCase()
      if (VERDADEROS.has(v) || /^[1-9]\d*$/.test(v)) elecciones.push({ de, a })
    })
  }
  return { nombres, elecciones }
}
