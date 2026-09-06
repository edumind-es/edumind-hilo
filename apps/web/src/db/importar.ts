/** Importaciones: grupo desde MiClase, lista desde CSV, matriz desde CSV. */
import { analizarCsv, analizarLista, esExportacionMiClase, esquemaGrupo, generarCodigosUnicos, leerExportacionMiClase, leerXlsx, matrizDeCsv, nombresDeCsv, nombresParaAlumnado, pareceXlsx, type Alumno, type Etapa, type Grupo, type GrupoMiClase, type Idioma, type Participacion, type Respuesta, type Toma } from '@edumind-hilo/nucleo'
import { descifrarMiClase, esCifradoMiClase } from '@/lib/cifrado'
import { crearToma } from './consultas'
import { ahora, nuevoId } from './ids'
import { db } from './localDb'

function sello() {
  const t = ahora()
  return { created_at: t, updated_at: t, deleted_at: null }
}

export type Detectado =
  | { tipo: 'miclase'; grupos: GrupoMiClase[] }
  | { tipo: 'miclase-cifrado'; cifrado: Parameters<typeof descifrarMiClase>[0] }
  | { tipo: 'lista'; nombres: string[] }
  | { tipo: 'hilo' }

/** Filas de un fichero tabular: XLSX (sin librería) o CSV/TSV. */
export async function filasDeFichero(f: File): Promise<string[][]> {
  const bytes = new Uint8Array(await f.arrayBuffer())
  if (pareceXlsx(bytes)) return leerXlsx(bytes)
  return analizarCsv(new TextDecoder().decode(bytes))
}

/** Mira qué es un fichero antes de decidir qué hacer con él. */
export async function detectarFichero(f: File): Promise<Detectado> {
  const bytes = new Uint8Array(await f.arrayBuffer())
  if (pareceXlsx(bytes)) {
    const nombres = nombresDeCsv(await leerXlsx(bytes))
    if (nombres.length < 2) throw new Error('No se reconocen nombres en la hoja de cálculo.')
    return { tipo: 'lista', nombres }
  }
  return detectar(new TextDecoder().decode(bytes))
}

export function detectar(texto: string): Detectado {
  let bruto: unknown = null
  try {
    bruto = JSON.parse(texto)
  } catch {
    /* no es JSON: será CSV o lista */
  }
  if (bruto && typeof bruto === 'object') {
    if ((bruto as { formato?: string }).formato === 'edumind-hilo') return { tipo: 'hilo' }
    if (esCifradoMiClase(bruto)) return { tipo: 'miclase-cifrado', cifrado: bruto }
    if (esExportacionMiClase(bruto)) return { tipo: 'miclase', grupos: leerExportacionMiClase(bruto) }
    throw new Error('JSON desconocido: no es de Hilo ni de MiClase.')
  }
  const nombres = nombresDeCsv(analizarCsv(texto))
  if (nombres.length < 2) throw new Error('No se reconocen nombres en el fichero.')
  return { tipo: 'lista', nombres }
}

export async function abrirMiClaseCifrado(cifrado: Parameters<typeof descifrarMiClase>[0], password: string): Promise<GrupoMiClase[]> {
  const claro = await descifrarMiClase(cifrado, password)
  return leerExportacionMiClase(JSON.parse(claro))
}

/** Crea un grupo de Hilo desde uno de MiClase, conservando sus códigos válidos y aplicando la minimización de nombres. */
export async function crearGrupoDesdeMiClase(g: GrupoMiClase, idioma: Idioma, etapa?: Etapa): Promise<string> {
  const grupo: Grupo = { id: nuevoId(), ...sello(), nombre: g.nombre, etapa: etapa ?? g.etapa, idioma, curso: g.curso }
  esquemaGrupo.parse(grupo)
  const existentes = new Set((await db.alumnos.toArray()).map(a => a.codigo))
  const nombres = nombresParaAlumnado(g.alumnos.map(a => a.nombre))
  const sinCodigo = g.alumnos.filter(a => !a.codigo || existentes.has(a.codigo)).length
  const nuevos = generarCodigosUnicos(sinCodigo, [...existentes, ...g.alumnos.map(a => a.codigo).filter((c): c is string => Boolean(c))])
  let k = 0
  const alumnos: Alumno[] = g.alumnos.map((a, i) => {
    const codigo = a.codigo && !existentes.has(a.codigo) ? a.codigo : nuevos[k++]!
    return { id: nuevoId(), ...sello(), grupo_id: grupo.id, nombre: nombres[i] ?? a.nombre, codigo, neae: a.neae }
  })
  await db.transaction('rw', db.grupos, db.alumnos, async () => {
    await db.grupos.add(grupo)
    await db.alumnos.bulkAdd(alumnos)
  })
  return grupo.id
}

/** Una matriz «quién elige a quién» de otra herramienta entra como toma cerrada con una sola situación. */
export async function importarMatriz(grupo: Grupo, alumnos: Alumno[], filas: string[][], titulo: string): Promise<string> {
  const { nombres, elecciones } = matrizDeCsv(filas)
  const porNombre = new Map<string, Alumno>()
  for (const a of alumnos) porNombre.set(a.nombre.toLocaleLowerCase('es'), a)
  const sinCasar = nombres.filter(n => !porNombre.has(n.toLocaleLowerCase('es')))
  if (sinCasar.length) throw new Error(`Nombres que no están en el grupo: ${sinCasar.join(', ')}. Ajusta el fichero o el grupo.`)
  const tomaId = await crearToma(grupo, { titulo, situaciones: ['equipo'], max_elecciones: 10, negativas: false })
  const toma = (await db.tomas.get(tomaId)) as Toma
  const t = ahora()
  const respuestas: Respuesta[] = elecciones.map(e => ({ id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: toma.id, situacion: 'equipo', de_alumno: porNombre.get(e.de.toLocaleLowerCase('es'))!.id, a_alumno: porNombre.get(e.a.toLocaleLowerCase('es'))!.id, signo: 1, origen: 'fichero' }))
  const participaciones: Participacion[] = [...new Set(elecciones.map(e => e.de))].map(n => ({ id: nuevoId(), created_at: t, updated_at: t, deleted_at: null, toma_id: toma.id, alumno_id: porNombre.get(n.toLocaleLowerCase('es'))!.id, origen: 'fichero' }))
  await db.transaction('rw', db.respuestas, db.participaciones, db.tomas, async () => {
    await db.respuestas.bulkAdd(respuestas)
    await db.participaciones.bulkAdd(participaciones)
    await db.tomas.update(toma.id, { estado: 'cerrada', fin: t, updated_at: t })
  })
  return toma.id
}

export { analizarLista }
