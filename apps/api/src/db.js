/**
 * Dos tablas ciegas. Ni un campo de texto libre en claro: lo único legible es
 * el código de sesión, el identificador de buzón (un hash), fechas y números.
 *
 * El esquema lo llevan migraciones numeradas; una migración nunca se edita
 * después de aplicarse. Los cambios van en la siguiente.
 */
import Database from 'better-sqlite3'

const MIGRACIONES = [
  `CREATE TABLE IF NOT EXISTS sesiones (
     codigo TEXT PRIMARY KEY,
     creada TEXT NOT NULL,
     caduca TEXT NOT NULL,
     cerrada INTEGER NOT NULL DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS sobres (
     seq INTEGER PRIMARY KEY AUTOINCREMENT,
     codigo TEXT NOT NULL,
     ciphertext TEXT NOT NULL,
     creado TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS sobres_codigo ON sobres(codigo, seq);
   CREATE TABLE IF NOT EXISTS buzon_registros (
     seq INTEGER PRIMARY KEY AUTOINCREMENT,
     buzon TEXT NOT NULL,
     tabla TEXT NOT NULL,
     registro_id TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     ciphertext TEXT NOT NULL,
     dispositivo TEXT NOT NULL,
     UNIQUE (buzon, tabla, registro_id)
   );
   CREATE INDEX IF NOT EXISTS buzon_seq ON buzon_registros(buzon, seq);
   CREATE TABLE IF NOT EXISTS buzon_meta (
     buzon TEXT PRIMARY KEY,
     creado TEXT NOT NULL,
     tocado TEXT NOT NULL,
     bytes INTEGER NOT NULL DEFAULT 0
   );`,
]

export function abrir(ruta = ':memory:') {
  const db = new Database(ruta)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec('CREATE TABLE IF NOT EXISTS migraciones (version INTEGER PRIMARY KEY, aplicada TEXT NOT NULL)')
  const aplicadas = new Set(db.prepare('SELECT version FROM migraciones').all().map(r => r.version))
  MIGRACIONES.forEach((sql, i) => {
    const v = i + 1
    if (aplicadas.has(v)) return
    db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO migraciones (version, aplicada) VALUES (?, ?)').run(v, new Date().toISOString())
    })()
  })
  return db
}

export const ahora = () => new Date().toISOString()
