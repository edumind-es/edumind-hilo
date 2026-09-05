import { generarParDocente } from '@/lib/clavePublica'
import { ahora } from './ids'
import { db } from './localDb'

/** El par de claves del docente: uno por dispositivo, se crea la primera vez que hace falta y viaja en la copia de seguridad. */
export async function obtenerOCrearClaves() {
  const actual = await db.claves.get('docente')
  if (actual && !actual.deleted_at) return actual
  const par = await generarParDocente()
  const t = ahora()
  const registro = { id: 'docente', created_at: t, updated_at: t, deleted_at: null, ...par }
  await db.claves.put(registro)
  return registro
}
