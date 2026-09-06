/**
 * Paquete de sesión: lo que viaja en el QR de ida, dentro del fragmento de la
 * URL (`/s#g=…`). Lleva la configuración de la toma y la lista del grupo con
 * códigos y nombres de pila. Se comprime con deflate y se codifica en
 * base64url para que quepa en un QR proyectable.
 *
 * El fragmento nunca sale en una petición HTTP: la lista va del proyector a
 * la tablet por luz. La página del alumnado lo borra del historial al cargar.
 */
import { esCodigoValido } from './codigos'
import { ETAPAS, ID_SITUACION_RE, IDIOMAS, SITUACIONES, type Etapa, type Idioma, type PreguntaToma, type Situacion } from './tipos'

export interface Sesion {
  toma: string
  titulo: string
  idioma: Idioma
  etapa: Etapa
  situaciones: Situacion[]
  preguntas: PreguntaToma[]
  maxElecciones: number
  negativas: boolean
  /** [código, nombre para el alumnado] */
  alumnos: [string, string][]
}

interface Compacta {
  v: 1
  t: string
  n: string
  i: Idioma
  e: Etapa
  s: Situacion[]
  m: number
  g: 0 | 1
  a: [string, string][]
  /** preguntas propias: [id, etiqueta, pregunta, ayuda, negativa, tipo] */
  q?: [string, string, string, string, string, 'preferencia' | 'percepcion'][]
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const desb64url = (s: string) => {
  const b = s.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b + '='.repeat((4 - (b.length % 4)) % 4)), c => c.charCodeAt(0))
}

async function transformar(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const escritor = stream.writable.getWriter()
  const lector = stream.readable.getReader()
  const trozos: Uint8Array[] = []
  // Copia sobre un ArrayBuffer propio: Node exige una vista tipada y TypeScript
  // no admite `Uint8Array<ArrayBufferLike>` como BufferSource.
  const copia = new Uint8Array(bytes.byteLength)
  copia.set(bytes)
  const escribir = escritor.write(copia).then(() => escritor.close())
  const leer = (async () => {
    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      trozos.push(value)
    }
  })()
  // Las dos promesas se esperan juntas: si la entrada es basura, el error
  // sale por aquí y no queda ninguna promesa rechazada sin atender.
  await Promise.all([escribir, leer])
  const total = trozos.reduce((n, t) => n + t.length, 0)
  const salida = new Uint8Array(total)
  let pos = 0
  for (const t of trozos) {
    salida.set(t, pos)
    pos += t.length
  }
  return salida
}

export async function empaquetarSesion(s: Sesion): Promise<string> {
  const c: Compacta = { v: 1, t: s.toma, n: s.titulo, i: s.idioma, e: s.etapa, s: s.situaciones, m: s.maxElecciones, g: s.negativas ? 1 : 0, a: s.alumnos }
  if (s.preguntas.length) c.q = s.preguntas.map(p => [p.id, p.etiqueta, p.pregunta, p.ayuda ?? '', p.negativa ?? '', p.tipo])
  const bytes = new TextEncoder().encode(JSON.stringify(c))
  const comprimido = await transformar(bytes, new CompressionStream('deflate-raw'))
  return b64url(comprimido)
}

export async function desempaquetarSesion(texto: string): Promise<Sesion> {
  let bruto: unknown
  try {
    const bytes = await transformar(desb64url(texto.trim()), new DecompressionStream('deflate-raw'))
    bruto = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('El enlace de la sesión no se puede leer.')
  }
  const c = bruto as Partial<Compacta>
  if (c.v !== 1 || typeof c.t !== 'string' || !Array.isArray(c.a)) throw new Error('El enlace de la sesión no es válido.')
  if (!IDIOMAS.includes(c.i as Idioma) || !ETAPAS.includes(c.e as Etapa)) throw new Error('El enlace de la sesión no es válido.')
  const preguntas: PreguntaToma[] = (c.q ?? [])
    .filter(q => Array.isArray(q) && ID_SITUACION_RE.test(String(q[0])) && typeof q[2] === 'string' && (q[5] === 'preferencia' || q[5] === 'percepcion'))
    .map(q => ({ id: q[0], etiqueta: String(q[1] ?? q[0]), pregunta: q[2], ...(q[3] ? { ayuda: q[3] } : {}), ...(q[4] ? { negativa: q[4] } : {}), tipo: q[5] }))
  const propias = new Set(preguntas.map(p => p.id))
  const situaciones = (c.s ?? []).filter((x): x is Situacion => typeof x === 'string' && ((SITUACIONES as readonly string[]).includes(x) || propias.has(x)))
  if (!situaciones.length) throw new Error('La sesión no tiene situaciones.')
  const alumnos = c.a.filter((p): p is [string, string] => Array.isArray(p) && esCodigoValido(String(p[0])) && typeof p[1] === 'string' && p[1].length > 0)
  if (alumnos.length < 2) throw new Error('La sesión no tiene alumnado.')
  return {
    toma: c.t,
    titulo: typeof c.n === 'string' ? c.n : '',
    idioma: c.i as Idioma,
    etapa: c.e as Etapa,
    situaciones,
    preguntas,
    maxElecciones: Math.min(10, Math.max(1, Number(c.m) || 1)),
    negativas: c.g === 1 && c.e === 'secundaria',
    alumnos,
  }
}

/** Extrae la clave pública del docente del fragmento (`&k=…`), si va. */
export function claveDeFragmento(hash: string): string | null {
  const m = /(?:^|[#&])k=([A-Za-z0-9_-]+)/.exec(hash)
  return m ? m[1]! : null
}

/** Extrae el paquete del fragmento de una URL (`#g=…`). */
export function paqueteDeFragmento(hash: string): string | null {
  const m = /(?:^|[#&])g=([A-Za-z0-9_-]+)/.exec(hash)
  return m ? m[1]! : null
}
