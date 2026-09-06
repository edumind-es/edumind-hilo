/**
 * Relé en vivo (modalidad F). La tablet deposita su respuesta cifrada con la
 * clave que iba en el QR; el docente la recoge. El servidor ve el código de
 * sesión, el ciphertext y la fecha. Nada más.
 */
import { randomBytes } from 'node:crypto'
import { ahora } from '../db.js'

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DURACION_MS = 2 * 60 * 60 * 1000
const MAX_SOBRES = 300
const MAX_SOBRE_BYTES = 8 * 1024
const CIPHERTEXT = /^[A-Za-z0-9+/=_-]+$/

function codigoNuevo() {
  const b = randomBytes(8)
  return [...b].map(x => ALFABETO[x % ALFABETO.length]).join('')
}

export default async function rele(app) {
  const db = app.db

  app.post('/api/rele/sesiones', async (_req, reply) => {
    let codigo = codigoNuevo()
    while (db.prepare('SELECT 1 FROM sesiones WHERE codigo = ?').get(codigo)) codigo = codigoNuevo()
    const t = ahora()
    const caduca = new Date(Date.now() + DURACION_MS).toISOString()
    db.prepare('INSERT INTO sesiones (codigo, creada, caduca) VALUES (?, ?, ?)').run(codigo, t, caduca)
    return reply.code(201).send({ codigo, caduca })
  })

  function sesionViva(codigo) {
    const s = db.prepare('SELECT * FROM sesiones WHERE codigo = ?').get(codigo)
    if (!s || s.cerrada || s.caduca < ahora()) return null
    return s
  }

  app.post('/api/rele/:codigo/sobres', async (req, reply) => {
    const s = sesionViva(req.params.codigo)
    if (!s) return reply.code(404).send({ error: 'sesión no encontrada o caducada' })
    const c = req.body?.ciphertext
    if (typeof c !== 'string' || !c || c.length > MAX_SOBRE_BYTES || !CIPHERTEXT.test(c)) {
      return reply.code(400).send({ error: 'sobre no válido' })
    }
    const n = db.prepare('SELECT COUNT(*) AS n FROM sobres WHERE codigo = ?').get(s.codigo).n
    if (n >= MAX_SOBRES) return reply.code(429).send({ error: 'la sesión ha llegado a su máximo de sobres' })
    const r = db.prepare('INSERT INTO sobres (codigo, ciphertext, creado) VALUES (?, ?, ?)').run(s.codigo, c, ahora())
    return reply.code(201).send({ seq: Number(r.lastInsertRowid) })
  })

  app.get('/api/rele/:codigo/sobres', async (req, reply) => {
    const s = db.prepare('SELECT * FROM sesiones WHERE codigo = ?').get(req.params.codigo)
    if (!s) return reply.code(404).send({ error: 'sesión no encontrada' })
    const desde = Number(req.query?.desde ?? 0) || 0
    const filas = db.prepare('SELECT seq, ciphertext, creado FROM sobres WHERE codigo = ? AND seq > ? ORDER BY seq LIMIT 200').all(s.codigo, desde)
    return { sobres: filas, cerrada: Boolean(s.cerrada), caduca: s.caduca }
  })

  app.delete('/api/rele/:codigo', async (req, reply) => {
    const s = db.prepare('SELECT codigo FROM sesiones WHERE codigo = ?').get(req.params.codigo)
    if (!s) return reply.code(404).send({ error: 'sesión no encontrada' })
    db.transaction(() => {
      db.prepare('DELETE FROM sobres WHERE codigo = ?').run(s.codigo)
      db.prepare('UPDATE sesiones SET cerrada = 1 WHERE codigo = ?').run(s.codigo)
    })()
    return reply.code(204).send()
  })
}

/** Borra sesiones caducadas y sus sobres. Se llama cada minuto. */
export function limpiarRele(db) {
  const t = ahora()
  db.transaction(() => {
    db.prepare('DELETE FROM sobres WHERE codigo IN (SELECT codigo FROM sesiones WHERE caduca < ? OR cerrada = 1)').run(t)
    db.prepare('DELETE FROM sesiones WHERE caduca < ?').run(t)
  })()
}
