import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './localDb'

const vivos = <T extends { deleted_at: string | null }>(xs: T[]) => xs.filter(x => !x.deleted_at)

export function useGrupos() {
  return useLiveQuery(async () => vivos(await db.grupos.toArray()).sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [])
}
export function useGrupo(id: string | undefined) {
  return useLiveQuery(() => (id ? db.grupos.get(id) : undefined), [id])
}
export function useAlumnos(grupoId: string | undefined) {
  return useLiveQuery(async () => {
    if (!grupoId) return []
    return vivos(await db.alumnos.where('grupo_id').equals(grupoId).toArray()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [grupoId])
}
export function useTomas(grupoId: string | undefined) {
  return useLiveQuery(async () => {
    if (!grupoId) return []
    return vivos(await db.tomas.where('grupo_id').equals(grupoId).toArray()).sort((a, b) => b.inicio.localeCompare(a.inicio))
  }, [grupoId])
}
export function useToma(id: string | undefined) {
  return useLiveQuery(() => (id ? db.tomas.get(id) : undefined), [id])
}
export function useRespuestas(tomaId: string | undefined) {
  return useLiveQuery(async () => (tomaId ? vivos(await db.respuestas.where('toma_id').equals(tomaId).toArray()) : []), [tomaId])
}
export function useParticipaciones(tomaId: string | undefined) {
  return useLiveQuery(async () => (tomaId ? vivos(await db.participaciones.where('toma_id').equals(tomaId).toArray()) : []), [tomaId])
}
export function useNotas(alumnoId: string | undefined) {
  return useLiveQuery(async () => (alumnoId ? vivos(await db.notas.where('alumno_id').equals(alumnoId).toArray()).sort((a, b) => b.fecha.localeCompare(a.fecha)) : []), [alumnoId])
}
export function useEventos(grupoId: string | undefined) {
  return useLiveQuery(async () => (grupoId ? vivos(await db.eventos.where('grupo_id').equals(grupoId).toArray()).sort((a, b) => b.fecha.localeCompare(a.fecha)) : []), [grupoId])
}
