/**
 * Operaciones sobre la base local. Cada función es una transacción completa:
 * o entra todo o no entra nada.
 */
import {
  MAX_ELECCIONES_POR_ETAPA,
  SITUACIONES_POR_ETAPA,
  analizarLista,
  esquemaGrupo,
  esquemaToma,
  generarCodigosUnicos,
  negativasPermitidas,
  type Alumno,
  type Eleccion,
  type Etapa,
  type Grupo,
  type Idioma,
  type Origen,
  type Participacion,
  type Respuesta,
  type Situacion,
  type Toma,
} from '@edumind-hilo/nucleo'
import { db } from './localDb'
import { ahora, nuevoId } from './ids'

function sello() {
  const t = ahora()
  return { created_at: t, updated_at: t, deleted_at: null }
}

export async function crearGrupoDesdeLista(datos: { nombre: string; etapa: Etapa; idioma: Idioma; curso: string; lista: string }): Promise<string> {
  const nombres = analizarLista(datos.lista)
  if (nombres.length < 2) throw new Error('Un grupo necesita al menos dos nombres.')
  const grupo: Grupo = { id: nuevoId(), ...sello(), nombre: datos.nombre.trim(), etapa: datos.etapa, idioma: datos.idioma, curso: datos.curso.trim() }
  esquemaGrupo.parse(grupo)
  const codigos = generarCodigosUnicos(nombres.length, await todosLosCodigos())
  const alumnos: Alumno[] = nombres.map((nombre, i) => ({ id: nuevoId(), ...sello(), grupo_id: grupo.id, nombre, codigo: codigos[i]!, neae: false }))
  await db.transaction('rw', db.grupos, db.alumnos, async () => {
    await db.grupos.add(grupo)
    await db.alumnos.bulkAdd(alumnos)
  })
  return grupo.id
}

async function todosLosCodigos(): Promise<string[]> {
  return (await db.alumnos.toArray()).map(a => a.codigo)
}

export async function anadirAlumnos(grupoId: string, lista: string): Promise<number> {
  const existentes = await alumnosDeGrupo(grupoId)
  const conocidos = new Set(existentes.map(a => a.nombre.toLocaleLowerCase('es')))
  const nombres = analizarLista(lista).filter(n => !conocidos.has(n.toLocaleLowerCase('es')))
  if (!nombres.length) return 0
  const codigos = generarCodigosUnicos(nombres.length, await todosLosCodigos())
  const nuevos: Alumno[] = nombres.map((nombre, i) => ({ id: nuevoId(), ...sello(), grupo_id: grupoId, nombre, codigo: codigos[i]!, neae: false }))
  await db.alumnos.bulkAdd(nuevos)
  return nuevos.length
}

export async function alumnosDeGrupo(grupoId: string): Promise<Alumno[]> {
  const todos = await db.alumnos.where('grupo_id').equals(grupoId).toArray()
  return todos.filter(a => !a.deleted_at).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function actualizarAlumno(id: string, cambios: Partial<Pick<Alumno, 'nombre' | 'neae'>>) {
  await db.alumnos.update(id, { ...cambios, updated_at: ahora() })
}

/** Borrado lógico: el registro queda, marcado. Así un sync futuro lo propaga. */
export async function borrarAlumno(id: string) {
  await db.alumnos.update(id, { deleted_at: ahora(), updated_at: ahora() })
}

export async function borrarGrupo(id: string) {
  await db.grupos.update(id, { deleted_at: ahora(), updated_at: ahora() })
}

export interface DatosToma {
  titulo: string
  etapa?: Etapa
  situaciones?: Situacion[]
  max_elecciones?: number
  negativas?: boolean
}

export async function crearToma(grupo: Grupo, datos: DatosToma): Promise<string> {
  const etapa = datos.etapa ?? grupo.etapa
  const toma: Toma = {
    id: nuevoId(),
    ...sello(),
    grupo_id: grupo.id,
    titulo: datos.titulo.trim() || tituloPorDefecto(),
    etapa,
    idioma: grupo.idioma,
    situaciones: datos.situaciones ?? SITUACIONES_POR_ETAPA[etapa],
    max_elecciones: datos.max_elecciones ?? MAX_ELECCIONES_POR_ETAPA[etapa],
    negativas: Boolean(datos.negativas) && negativasPermitidas(etapa),
    estado: 'abierta',
    inicio: ahora(),
    fin: null,
  }
  esquemaToma.parse(toma)
  await db.tomas.add(toma)
  return toma.id
}

export function tituloPorDefecto(fecha = new Date()): string {
  const mes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return `Toma de ${mes}`
}

export async function cerrarToma(id: string) {
  await db.tomas.update(id, { estado: 'cerrada', fin: ahora(), updated_at: ahora() })
}

/**
 * Guarda lo que un alumno ha respondido. Una participación por alumno y toma:
 * la segunda vez se rechaza, venga de donde venga (dispositivo, QR, hoja).
 */
export async function registrarRespuestas(datos: { toma: Toma; alumnoId: string; elecciones: Eleccion[]; origen: Origen }): Promise<void> {
  if (datos.toma.estado !== 'abierta') throw new Error('La toma está cerrada.')
  const t = ahora()
  const participacion: Participacion = { id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: datos.toma.id, alumno_id: datos.alumnoId, origen: datos.origen }
  const filas: Respuesta[] = datos.elecciones
    .filter(e => e.a_alumno !== datos.alumnoId)
    .filter(e => datos.toma.situaciones.includes(e.situacion))
    .filter(e => e.signo === 1 || datos.toma.negativas)
    .map(e => ({ id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: datos.toma.id, situacion: e.situacion, de_alumno: datos.alumnoId, a_alumno: e.a_alumno, signo: e.signo, origen: datos.origen }))
  await db.transaction('rw', db.participaciones, db.respuestas, async () => {
    const ya = await db.participaciones.where('[toma_id+alumno_id]').equals([datos.toma.id, datos.alumnoId]).first()
    if (ya && !ya.deleted_at) throw new Error('Este alumno ya ha respondido en esta toma.')
    await db.participaciones.add(participacion)
    if (filas.length) await db.respuestas.bulkAdd(filas)
  })
}

/**
 * Hoja de grupo: entra una situación entera para todo el grupo, y puede venir
 * otra hoja con otra situación después. Por eso no vale la regla de «una
 * participación y ya»: aquí se añade la participación si falta y se
 * sustituyen las respuestas de ese alumno SOLO en esa situación.
 */
export async function registrarSituacion(datos: { toma: Toma; situacion: Situacion; porAlumno: Map<string, string[]>; origen: Origen }): Promise<number> {
  if (datos.toma.estado !== 'abierta') throw new Error('La toma está cerrada.')
  if (!datos.toma.situaciones.includes(datos.situacion)) throw new Error('Esa situación no está en la toma.')
  const t = ahora()
  let registrados = 0
  await db.transaction('rw', db.participaciones, db.respuestas, async () => {
    for (const [alumnoId, elegidos] of datos.porAlumno) {
      const ya = await db.participaciones.where('[toma_id+alumno_id]').equals([datos.toma.id, alumnoId]).first()
      if (!ya || ya.deleted_at) {
        await db.participaciones.add({ id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: datos.toma.id, alumno_id: alumnoId, origen: datos.origen })
      }
      const previas = await db.respuestas.where('toma_id').equals(datos.toma.id).filter(r => r.de_alumno === alumnoId && r.situacion === datos.situacion && !r.deleted_at).toArray()
      for (const r of previas) await db.respuestas.update(r.id, { deleted_at: t, updated_at: t })
      const filas: Respuesta[] = elegidos.filter(a => a !== alumnoId).map(a => ({ id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: datos.toma.id, situacion: datos.situacion, de_alumno: alumnoId, a_alumno: a, signo: 1, origen: datos.origen }))
      if (filas.length) await db.respuestas.bulkAdd(filas)
      registrados++
    }
  })
  return registrados
}

export async function anadirEvento(grupoId: string, fecha: string, texto: string) {
  await db.eventos.add({ id: nuevoId(), ...sello(), grupo_id: grupoId, fecha, texto: texto.trim() })
}

export async function anadirNota(alumnoId: string, fecha: string, texto: string) {
  await db.notas.add({ id: nuevoId(), ...sello(), alumno_id: alumnoId, fecha, texto: texto.trim() })
}
export async function borrarNota(id: string) {
  await db.notas.update(id, { deleted_at: ahora(), updated_at: ahora() })
}

/** Borra TODO. Solo desde Ajustes y con confirmación escrita. */
export async function borrarTodo() {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear()
  })
}
