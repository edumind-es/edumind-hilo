/**
 * Lectura de XLSX sin librerías. Un .xlsx es un ZIP con XML dentro: se leen
 * las entradas del ZIP (deflate-raw, que el navegador y Node saben inflar),
 * las cadenas compartidas y la primera hoja. Solo valores: fórmulas, estilos y
 * fechas no se interpretan. Suficiente para listas de clase y matrices.
 */

interface Entrada {
  nombre: string
  comprimido: boolean
  offset: number
  tamano: number
}

function u16(b: Uint8Array, i: number) {
  return b[i]! | (b[i + 1]! << 8)
}
function u32(b: Uint8Array, i: number) {
  return (b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16) | (b[i + 3]! << 24)) >>> 0
}

function entradasZip(b: Uint8Array): Entrada[] {
  // Directorio central: se busca su fin (firma 0x06054b50) desde atrás.
  let fin = -1
  for (let i = b.length - 22; i >= 0 && i >= b.length - 70000; i--) {
    if (u32(b, i) === 0x06054b50) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new Error('No es un fichero ZIP (ni, por tanto, XLSX).')
  const n = u16(b, fin + 10)
  let p = u32(b, fin + 16)
  const entradas: Entrada[] = []
  for (let k = 0; k < n; k++) {
    if (u32(b, p) !== 0x02014b50) break
    const metodo = u16(b, p + 10)
    const tamano = u32(b, p + 20)
    const ln = u16(b, p + 28)
    const le = u16(b, p + 30)
    const lc = u16(b, p + 32)
    const offsetLocal = u32(b, p + 42)
    const nombre = new TextDecoder().decode(b.subarray(p + 46, p + 46 + ln))
    // Cabecera local: el offset de datos depende de sus propias longitudes.
    const lnl = u16(b, offsetLocal + 26)
    const lel = u16(b, offsetLocal + 28)
    entradas.push({ nombre, comprimido: metodo === 8, offset: offsetLocal + 30 + lnl + lel, tamano })
    p += 46 + ln + le + lc
  }
  return entradas
}

async function inflar(datos: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const escritor = ds.writable.getWriter()
  const lector = ds.readable.getReader()
  const copia = new Uint8Array(datos.byteLength)
  copia.set(datos)
  const trozos: Uint8Array[] = []
  const leer = (async () => {
    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      trozos.push(value)
    }
  })()
  await Promise.all([escritor.write(copia).then(() => escritor.close()), leer])
  const total = trozos.reduce((s, t) => s + t.length, 0)
  const salida = new Uint8Array(total)
  let pos = 0
  for (const t of trozos) {
    salida.set(t, pos)
    pos += t.length
  }
  return salida
}

async function texto(b: Uint8Array, e: Entrada): Promise<string> {
  const datos = b.subarray(e.offset, e.offset + (e.comprimido ? tamanoComprimido(b, e) : e.tamano))
  return new TextDecoder().decode(e.comprimido ? await inflar(datos) : datos)
}
function tamanoComprimido(b: Uint8Array, e: Entrada): number {
  // El tamaño comprimido está en la cabecera local, 18 bytes antes de los nombres.
  const local = e.offset
  // Retrocedemos hasta la firma local para leer el campo; más sencillo: buscar hacia atrás la firma.
  for (let i = local - 30; i >= 0; i--) {
    if (u32(b, i) === 0x04034b50) return u32(b, i + 18)
  }
  return b.length - local
}

function desxml(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&')
}

function columna(ref: string): number {
  let n = 0
  for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Primera hoja del libro como matriz de cadenas (celdas vacías = ''). */
export async function leerXlsx(bytes: Uint8Array): Promise<string[][]> {
  const entradas = entradasZip(bytes)
  const por = (n: string) => entradas.find(e => e.nombre === n)
  const cadenas: string[] = []
  const ss = por('xl/sharedStrings.xml')
  if (ss) {
    const xml = await texto(bytes, ss)
    for (const m of xml.matchAll(/<si>(.*?)<\/si>/gs)) {
      cadenas.push(desxml([...m[1]!.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(t => t[1]!).join('')))
    }
  }
  const hoja = entradas.filter(e => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.nombre)).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }))[0]
  if (!hoja) throw new Error('El XLSX no tiene ninguna hoja.')
  const xml = await texto(bytes, hoja)
  const filas: string[][] = []
  for (const fila of xml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
    const celdas: string[] = []
    for (const c of fila[1]!.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>(.*?)<\/c>)/gs)) {
      const col = columna(c[1]!)
      const attrs = c[2] ?? ''
      const cuerpo = c[3] ?? ''
      let valor = ''
      const t = /t="(\w+)"/.exec(attrs)?.[1]
      if (t === 's') {
        const i = Number(/<v>(.*?)<\/v>/s.exec(cuerpo)?.[1] ?? -1)
        valor = cadenas[i] ?? ''
      } else if (t === 'inlineStr') {
        valor = desxml([...cuerpo.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(m => m[1]!).join(''))
      } else {
        valor = desxml(/<v>(.*?)<\/v>/s.exec(cuerpo)?.[1] ?? '')
      }
      while (celdas.length < col) celdas.push('')
      celdas[col] = valor
    }
    if (celdas.some(x => x.trim())) filas.push(celdas.map(x => x.trim()))
  }
  return filas
}

export function pareceXlsx(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b
}
