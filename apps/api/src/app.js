import Fastify from 'fastify'
import { abrir } from './db.js'
import buzon from './rutas/buzon.js'
import rele, { limpiarRele } from './rutas/rele.js'

/** Construye la app. Separado del arranque para poder probarla con inject(). */
export function construir({ rutaDb = ':memory:', logger = false } = {}) {
  const app = Fastify({ logger, bodyLimit: 1024 * 1024, trustProxy: true })
  app.decorate('db', abrir(rutaDb))
  app.get('/api/health', async () => ({ ok: true, servicio: 'hilo-api' }))
  app.register(rele)
  app.register(buzon)
  const temporizador = setInterval(() => limpiarRele(app.db), 60_000)
  temporizador.unref()
  app.addHook('onClose', async () => {
    clearInterval(temporizador)
    app.db.close()
  })
  return app
}
