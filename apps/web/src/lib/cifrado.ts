/**
 * Cifrado de la copia de seguridad con contraseña.
 * PBKDF2-SHA256 (210.000 iteraciones, OWASP 2023) → AES-256-GCM.
 * Web Crypto nativo, sin dependencias. Mismo esquema que MiClase.
 */
const ITERACIONES = 210_000

export interface Cifrado {
  formato: 'edumind-hilo-cifrado'
  version: 1
  salt: string
  iv: string
  datos: string
}

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))
const desb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))

async function clave(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERACIONES, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function cifrarTexto(texto: string, password: string): Promise<Cifrado> {
  if (password.length < 6) throw new Error('La contraseña necesita al menos seis caracteres.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const k = await clave(password, salt)
  const datos = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, k, new TextEncoder().encode(texto))
  return { formato: 'edumind-hilo-cifrado', version: 1, salt: b64(salt), iv: b64(iv), datos: b64(new Uint8Array(datos)) }
}

export async function descifrarTexto(c: Cifrado, password: string): Promise<string> {
  if (c.formato !== 'edumind-hilo-cifrado' || c.version !== 1) throw new Error('Formato de copia cifrada desconocido.')
  const k = await clave(password, desb64(c.salt))
  try {
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: desb64(c.iv) as BufferSource }, k, desb64(c.datos) as BufferSource)
    return new TextDecoder().decode(claro)
  } catch {
    throw new Error('Contraseña incorrecta o copia dañada.')
  }
}

export function esCifrado(x: unknown): x is Cifrado {
  return typeof x === 'object' && x !== null && (x as { formato?: string }).formato === 'edumind-hilo-cifrado'
}
