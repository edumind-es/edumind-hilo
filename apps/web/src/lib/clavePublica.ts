/**
 * Entregas cifradas para el docente (modalidad D).
 *
 * El docente tiene un par ECDH P-256. Su clave pública viaja en el enlace de
 * la prueba. Cada respuesta genera un par efímero, deriva una clave AES-GCM
 * con la pública del docente y cifra. Solo la privada del docente, que nunca
 * sale de su dispositivo, puede deshacerlo: ni Moodle, ni quien lo administre,
 * ni un fichero perdido.
 */
export interface ParClaves {
  publica: JsonWebKey
  privada: JsonWebKey
}

export interface Sobre {
  formato: 'hilo-respuesta'
  version: 1
  toma: string
  /** Clave pública efímera del alumno (JWK). */
  epk: JsonWebKey
  iv: string
  datos: string
}

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))
const desb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const

export async function generarParDocente(): Promise<ParClaves> {
  const par = await crypto.subtle.generateKey(ECDH, true, ['deriveKey'])
  return { publica: await crypto.subtle.exportKey('jwk', par.publicKey), privada: await crypto.subtle.exportKey('jwk', par.privateKey) }
}

/** Solo la parte pública, compacta, para el fragmento de la URL. */
export function publicaCompacta(jwk: JsonWebKey): string {
  return btoa(JSON.stringify({ x: jwk.x, y: jwk.y })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function publicaDesdeCompacta(texto: string): JsonWebKey {
  const b = texto.replace(/-/g, '+').replace(/_/g, '/')
  const { x, y } = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4))) as { x: string; y: string }
  if (!x || !y) throw new Error('clave pública no válida')
  return { kty: 'EC', crv: 'P-256', x, y, ext: true }
}

async function claveCompartida(privada: CryptoKey, publica: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey({ name: 'ECDH', public: publica }, privada, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function cifrarParaDocente(texto: string, publicaDocente: JsonWebKey, toma: string): Promise<Sobre> {
  const pubDocente = await crypto.subtle.importKey('jwk', { ...publicaDocente, key_ops: [] }, ECDH, false, [])
  const efimero = await crypto.subtle.generateKey(ECDH, true, ['deriveKey'])
  const k = await claveCompartida(efimero.privateKey, pubDocente)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, k, new TextEncoder().encode(texto))
  const epk = await crypto.subtle.exportKey('jwk', efimero.publicKey)
  delete epk.key_ops
  return { formato: 'hilo-respuesta', version: 1, toma, epk, iv: b64(iv), datos: b64(new Uint8Array(datos)) }
}

export async function descifrarSobre(sobre: Sobre, privadaDocente: JsonWebKey): Promise<string> {
  if (sobre.formato !== 'hilo-respuesta' || sobre.version !== 1) throw new Error('No es una entrega de Hilo.')
  const priv = await crypto.subtle.importKey('jwk', privadaDocente, ECDH, false, ['deriveKey'])
  const epk = await crypto.subtle.importKey('jwk', { ...sobre.epk, key_ops: [] }, ECDH, false, [])
  const k = await claveCompartida(priv, epk)
  try {
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: desb64(sobre.iv) as BufferSource }, k, desb64(sobre.datos) as BufferSource)
    return new TextDecoder().decode(claro)
  } catch {
    throw new Error('La entrega no se puede abrir con las claves de este dispositivo.')
  }
}

export function esSobre(x: unknown): x is Sobre {
  return typeof x === 'object' && x !== null && (x as { formato?: string }).formato === 'hilo-respuesta'
}
