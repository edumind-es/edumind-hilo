/**
 * Buzón de sincronización entre dispositivos del docente. Sin cuentas: el
 * cliente presenta un token secreto de 256 bits; el servidor guarda solo su
 * hash como identificador del buzón y no puede derivar la clave de cifrado
 * (que sale del token por HKDF en el cliente). Cada registro es un sobre
 * cifrado; el servidor ve tabla, id, fecha de modificación y dispositivo,
 * que es lo mínimo para servir sincronizaciones incrementales.
 *
 * Convergencia: último en escribir gana por registro, comparando updated_at
 * como texto ISO. Los borrados viajan como registros con deleted_at dentro
 * del sobre, nunca como ausencias.
 */
import { createHash } from 'node:crypto'
import { ahora } from '../db.js'

const LOTE = 500
const MAX_REGISTRO_BYTES = 64 * 1024
const CUOTA_REGISTROS = 50_000
const CUOTA_BYTES = 200 * 1024 * 1024
const TABLAS = new Set(['grupos', 'alumnos', 'tomas', 'respuestas', 'participaciones', 'eventos', 'notas', 'claves'])
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const TOKEN = /^[A-Za-z0-9_-]{40,64}$/

function buzonDe(req) {
  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!TOKEN.test(token)) return null
  return createHash('sha256').update(token).digest('hex')
}

export default async function buzon(app) {
  const db = app.db

  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/api/buzon')) return
    const id = buzonDe(req)
    if (!id) return reply.code(401).send({ error: 'token de buzón no válido' })
    req.buzon = id
  })

  app.put('/api/buzon/registros', async (req, reply) => {
    const registros = req.body?.registros
    const dispositivo = String(req.body?.dispositivo ?? '').slice(0, 64)
    if (!Array.isArray(registros) || registros.length > LOTE || !dispositivo) return reply.code(400).send({ error: 'lote no válido' })
    const meta = db.prepare('SELECT * FROM buzon_meta WHERE buzon = ?').get(req.buzon)
    const t = ahora()
    if (!meta) db.prepare('INSERT INTO buzon_meta (buzon, creado, tocado, bytes) VALUES (?, ?, ?, 0)').run(req.buzon, t, t)
    const cuenta = db.prepare('SELECT COUNT(*) AS n FROM buzon_registros WHERE buzon = ?').get(req.buzon).n
    const bytesActuales = meta?.bytes ?? 0
    const resultado = { aceptados: 0, rechazados: [], antiguos: 0 }
    let bytesNuevos = 0
    const upsert = db.prepare(`INSERT INTO buzon_registros (buzon, tabla, registro_id, updated_at, ciphertext, dispositivo)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (buzon, tabla, registro_id) DO UPDATE SET
        updated_at = excluded.updated_at, ciphertext = excluded.ciphertext, dispositivo = excluded.dispositivo, seq = (SELECT COALESCE(MAX(seq), 0) + 1 FROM buzon_registros)
      WHERE excluded.updated_at > buzon_registros.updated_at`)
    const existente = db.prepare('SELECT updated_at, length(ciphertext) AS bytes FROM buzon_registros WHERE buzon = ? AND tabla = ? AND registro_id = ?')
    db.transaction(() => {
      let nuevos = 0
      for (const r of registros) {
        const motivo = validar(r)
        if (motivo) {
          resultado.rechazados.push({ tabla: r?.tabla, id: r?.id, motivo })
          continue
        }
        const previo = existente.get(req.buzon, r.tabla, r.id)
        if (previo && previo.updated_at >= r.updated_at) {
          resultado.antiguos++
          continue
        }
        if (!previo && cuenta + nuevos >= CUOTA_REGISTROS) {
          resultado.rechazados.push({ tabla: r.tabla, id: r.id, motivo: 'cuota_registros' })
          continue
        }
        if (bytesActuales + bytesNuevos + r.ciphertext.length > CUOTA_BYTES) {
          resultado.rechazados.push({ tabla: r.tabla, id: r.id, motivo: 'cuota_bytes' })
          continue
        }
        upsert.run(req.buzon, r.tabla, r.id, r.updated_at, r.ciphertext, dispositivo)
        bytesNuevos += r.ciphertext.length - (previo?.bytes ?? 0)
        if (!previo) nuevos++
        resultado.aceptados++
      }
      db.prepare('UPDATE buzon_meta SET tocado = ?, bytes = bytes + ? WHERE buzon = ?').run(t, bytesNuevos, req.buzon)
    })()
    return resultado
  })

  app.get('/api/buzon/registros', async req => {
    const desde = Number(req.query?.desde ?? 0) || 0
    const filas = db.prepare('SELECT seq, tabla, registro_id AS id, updated_at, ciphertext, dispositivo FROM buzon_registros WHERE buzon = ? AND seq > ? ORDER BY seq LIMIT ?').all(req.buzon, desde, LOTE)
    const ultimo = db.prepare('SELECT COALESCE(MAX(seq), 0) AS seq FROM buzon_registros WHERE buzon = ?').get(req.buzon).seq
    return { registros: filas, hasta: filas.length ? filas[filas.length - 1].seq : desde, ultimo, mas: filas.length === LOTE }
  })

  app.get('/api/buzon', async req => {
    const meta = db.prepare('SELECT creado, tocado, bytes FROM buzon_meta WHERE buzon = ?').get(req.buzon)
    const n = db.prepare('SELECT COUNT(*) AS n FROM buzon_registros WHERE buzon = ?').get(req.buzon).n
    return { existe: Boolean(meta), registros: n, bytes: meta?.bytes ?? 0, creado: meta?.creado ?? null, tocado: meta?.tocado ?? null }
  })

  /** Purga completa: el docente deja de usar el buzón y no queda nada. */
  app.delete('/api/buzon', async (req, reply) => {
    db.transaction(() => {
      db.prepare('DELETE FROM buzon_registros WHERE buzon = ?').run(req.buzon)
      db.prepare('DELETE FROM buzon_meta WHERE buzon = ?').run(req.buzon)
    })()
    return reply.code(204).send()
  })
}

function validar(r) {
  if (!r || typeof r !== 'object') return 'campos_incompletos'
  if (!TABLAS.has(r.tabla)) return 'tabla_desconocida'
  if (typeof r.id !== 'string' || !r.id || r.id.length > 64) return 'campos_incompletos'
  if (typeof r.updated_at !== 'string' || !FECHA_ISO.test(r.updated_at)) return 'fecha_invalida'
  if (typeof r.ciphertext !== 'string' || !r.ciphertext || !/^[A-Za-z0-9+/=_-]+$/.test(r.ciphertext)) return 'campos_incompletos'
  if (r.ciphertext.length > MAX_REGISTRO_BYTES) return 'demasiado_grande'
  return null
}
