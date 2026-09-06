/**
 * Sincronización entre dispositivos del docente por buzón ciego (opcional).
 *
 * Cada registro viaja como sobre cifrado con la clave derivada del token. El
 * servidor guarda tabla, id, updated_at y ciphertext. Convergencia: último
 * en escribir gana por registro; los borrados viajan como registros con
 * deleted_at. Los cursores viven en `ajustes`, por dispositivo.
 */
import { esquemaAlumno, esquemaClaves, esquemaEvento, esquemaGrupo, esquemaNotaAlumno, esquemaParticipacion, esquemaRespuesta, esquemaToma } from '@edumind-hilo/nucleo'
import { abrirSobre, cerrarSobre, claveDeToken } from '@/lib/sobres'
import { fusionar, type Sellado } from './copia'
import { ahora, nuevoId } from './ids'
import { TABLAS, db, type Tabla } from './localDb'

const ESQUEMAS = { grupos: esquemaGrupo, alumnos: esquemaAlumno, tomas: esquemaToma, respuestas: esquemaRespuesta, participaciones: esquemaParticipacion, eventos: esquemaEvento, notas: esquemaNotaAlumno, claves: esquemaClaves } as const

async function ajuste(id: string): Promise<string | null> {
  const a = await db.ajustes.get(id)
  return a?.idioma ?? null // la columna se llama «idioma» por historia; guarda cualquier valor de texto
}
async function guardarAjuste(id: string, valor: string) {
  const t = ahora()
  await db.ajustes.put({ id, idioma: valor, created_at: t, updated_at: t, deleted_at: null })
}

export async function tokenBuzon(): Promise<string | null> {
  return ajuste('sync_token')
}
export async function activarBuzon(token: string) {
  await guardarAjuste('sync_token', token.trim())
  await guardarAjuste('sync_pull_seq', '0')
  await guardarAjuste('sync_push_desde', '')
  if (!(await ajuste('dispositivo'))) await guardarAjuste('dispositivo', nuevoId().slice(0, 8))
}
export async function desactivarBuzon() {
  await db.ajustes.bulkDelete(['sync_token', 'sync_pull_seq', 'sync_push_desde'])
}

export interface ResultadoSync {
  enviados: number
  recibidos: number
  rechazados: number
}

async function pedir(ruta: string, token: string, init: RequestInit = {}) {
  const r = await fetch(ruta, { ...init, headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  if (!r.ok) throw new Error(r.status === 401 ? 'El servidor no acepta el token del buzón.' : `El buzón respondió ${r.status}.`)
  return r.status === 204 ? null : r.json()
}

export async function sincronizar(): Promise<ResultadoSync> {
  const token = await tokenBuzon()
  if (!token) throw new Error('No hay buzón activado.')
  const clave = await claveDeToken(token)
  const dispositivo = (await ajuste('dispositivo')) ?? 'dispositivo'
  const resultado: ResultadoSync = { enviados: 0, recibidos: 0, rechazados: 0 }

  // 1. Enviar lo modificado desde el último envío, en lotes.
  const desde = (await ajuste('sync_push_desde')) ?? ''
  const ahoraIso = ahora()
  for (const tabla of TABLAS) {
    const filas = (await db.table(tabla).where('updated_at').above(desde).toArray()) as Sellado[]
    for (let i = 0; i < filas.length; i += 400) {
      const lote = await Promise.all(filas.slice(i, i + 400).map(async f => ({ tabla, id: f.id, updated_at: f.updated_at, ciphertext: await cerrarSobre(clave, JSON.stringify(f)) })))
      const r = (await pedir('/api/buzon/registros', token, { method: 'PUT', body: JSON.stringify({ dispositivo, registros: lote }) })) as { aceptados: number; rechazados: unknown[] }
      resultado.enviados += r.aceptados
      resultado.rechazados += r.rechazados.length
    }
  }
  await guardarAjuste('sync_push_desde', ahoraIso)

  // 2. Recibir desde el último seq y fusionar (gana el updated_at más reciente).
  let seq = Number((await ajuste('sync_pull_seq')) ?? '0') || 0
  for (;;) {
    const r = (await pedir(`/api/buzon/registros?desde=${seq}`, token)) as { registros: { seq: number; tabla: string; ciphertext: string }[]; hasta: number; mas: boolean }
    const porTabla = new Map<Tabla, Sellado[]>()
    for (const reg of r.registros) {
      if (!(TABLAS as readonly string[]).includes(reg.tabla)) continue
      try {
        const bruto = JSON.parse(await abrirSobre(clave, reg.ciphertext))
        const validado = ESQUEMAS[reg.tabla as keyof typeof ESQUEMAS].parse(bruto) as Sellado
        porTabla.set(reg.tabla as Tabla, [...(porTabla.get(reg.tabla as Tabla) ?? []), validado])
      } catch {
        resultado.rechazados++
      }
    }
    await db.transaction('rw', db.tables, async () => {
      for (const [tabla, entrantes] of porTabla) {
        const existentes = (await db.table(tabla).toArray()) as Sellado[]
        const nuevos = fusionar(existentes, entrantes)
        if (nuevos.length) await db.table(tabla).bulkPut(nuevos)
        resultado.recibidos += nuevos.length
      }
    })
    seq = r.hasta
    await guardarAjuste('sync_pull_seq', String(seq))
    if (!r.mas) break
  }
  // Lo recién recibido lleva updated_at anteriores a ahora: no se reenvía porque el cursor de envío ya ha avanzado.
  return resultado
}

export async function purgarBuzon() {
  const token = await tokenBuzon()
  if (!token) return
  await pedir('/api/buzon', token, { method: 'DELETE' })
  await desactivarBuzon()
}
