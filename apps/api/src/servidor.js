// Arranque. Escucha solo en la interfaz local: nginx hace de puerta.
import { construir } from './app.js'

const PORT = Number(process.env.PORT ?? 3280)
const HOST = process.env.HOST ?? '127.0.0.1'
const DATABASE_PATH = process.env.DATABASE_PATH ?? new URL('../../../data/hilo-api.sqlite', import.meta.url).pathname

const app = construir({ rutaDb: DATABASE_PATH, logger: { level: process.env.LOG_LEVEL ?? 'warn' } })
app.listen({ port: PORT, host: HOST }).catch(err => {
  app.log.error(err)
  process.exit(1)
})
for (const senal of ['SIGINT', 'SIGTERM']) process.on(senal, () => void app.close().then(() => process.exit(0)))
