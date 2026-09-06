/**
 * Sobres cifrados para el relé y para el buzón de sincronización.
 * AES-256-GCM con Web Crypto; la clave nunca sale del dispositivo (relé: va
 * en el QR proyectado; buzón: se deriva del token secreto por HKDF).
 */
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const desb64url = (s: string) => {
  const b = s.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b + '='.repeat((4 - (b.length % 4)) % 4)), c => c.charCodeAt(0))
}

export function claveAleatoria(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(32)))
}

export async function importarClave(claveB64: string): Promise<CryptoKey> {
  const bytes = desb64url(claveB64)
  if (bytes.length !== 32) throw new Error('clave de sesión no válida')
  return crypto.subtle.importKey('raw', bytes as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** Token de buzón (256 bits, base64url). El servidor solo ve su hash. */
export function tokenBuzonNuevo(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(32)))
}

/** Clave del buzón derivada del token por HKDF: el servidor, que solo tiene el hash del token, no puede llegar a ella. */
export async function claveDeToken(token: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', desb64url(token) as BufferSource, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('EDUmind Hilo buzón v1'), info: new TextEncoder().encode('aes-gcm') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** iv (12 bytes) + ciphertext, todo en base64url en una sola cadena. */
export async function cerrarSobre(clave: CryptoKey, texto: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const datos = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, clave, new TextEncoder().encode(texto)))
  const junto = new Uint8Array(iv.length + datos.length)
  junto.set(iv)
  junto.set(datos, iv.length)
  return b64url(junto)
}

export async function abrirSobre(clave: CryptoKey, sobre: string): Promise<string> {
  const junto = desb64url(sobre)
  if (junto.length < 13) throw new Error('sobre demasiado corto')
  const iv = junto.subarray(0, 12)
  const datos = junto.subarray(12)
  try {
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, clave, datos as BufferSource))
  } catch {
    throw new Error('el sobre no se abre con esta clave')
  }
}
