/**
 * Motor sociométrico. Lógica pura sobre arrays: sin base de datos, sin DOM.
 *
 * Índices clásicos adaptados a un instrumento sin negativas por defecto.
 * ESPEJO no cuenta como elección recibida: mide percepción y da el ajuste
 * perceptivo. Las negativas solo existen si la toma las activó.
 */
import { esPercepcion } from '../cuestionario'
import type { Alumno, PreguntaToma, Respuesta, Situacion } from '../tipos'

export type Posicion = 'muy elegido' | 'elegido' | 'poco elegido' | 'no elegido'
/** Coie y Dodge (1983). Solo con negativas. */
export type TipoSociometrico = 'popular' | 'rechazado' | 'ignorado' | 'controvertido' | 'promedio'

export interface AnalisisAlumno {
  alumno_id: string
  recibidas: Partial<Record<Situacion, number>>
  recibidasTotal: number
  emitidasTotal: number
  /** Cuántos de los que elige le eligen también (en cualquier situación de preferencia). */
  reciprocas: number
  /** reciprocas / distintos elegidos. 0 si no eligió a nadie. */
  reciprocidad: number
  negativasRecibidas: number
  /** Fracción de ESPEJO acertada: de quienes cree que le eligen, cuántos le eligen. null si no respondió ESPEJO. */
  ajustePerceptivo: number | null
  posicion: Posicion
  tipo: TipoSociometrico | null
  /** Tipificaciones, útiles para comparar entre tomas y grupos. */
  zPositivas: number
  zNegativas: number | null
}

export interface Analisis {
  alumnos: string[]
  porAlumno: Record<string, AnalisisAlumno>
  /** matriz[i][j] = 1 si i elige a j en alguna situación de preferencia (positiva). */
  matriz: number[][]
  /** Igual que matriz pero por situación, incluida espejo y con signo. */
  matrizPorSituacion: Partial<Record<Situacion, number[][]>>
  parejasReciprocas: [string, string][]
  /** parejas recíprocas / parejas posibles. */
  cohesion: number
  /** Componentes conexas del grafo de reciprocidades, de tamaño ≥ 2. */
  subgrupos: string[][]
  /** Alumnado cuya retirada partiría un subgrupo. */
  puentes: string[]
  sinElecciones: string[]
  /** Alumnado que no respondió (sin participación). Se calcula fuera; aquí solo se acepta. */
  sinRespuesta: string[]
}

export interface EntradaAnalisis {
  alumnos: Pick<Alumno, 'id'>[]
  respuestas: Pick<Respuesta, 'situacion' | 'de_alumno' | 'a_alumno' | 'signo'>[]
  situaciones: Situacion[]
  /** Preguntas propias de la toma, para saber cuáles son de percepción. */
  preguntas?: PreguntaToma[]
  negativas: boolean
  /** ids de quienes han respondido; si se omite, se deduce de las respuestas. */
  participantes?: string[]
}

function media(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}
function desviacion(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = media(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}
function tipificar(xs: number[]): number[] {
  const m = media(xs)
  const sd = desviacion(xs)
  return xs.map(x => (sd === 0 ? 0 : (x - m) / sd))
}

export function analizar(entrada: EntradaAnalisis): Analisis {
  const alumnos = entrada.alumnos.map(a => a.id)
  const indice = new Map(alumnos.map((id, i) => [id, i]))
  const n = alumnos.length
  const preguntas = entrada.preguntas ?? []
  const preferencia = entrada.situaciones.filter(s => !esPercepcion(s, preguntas))
  const percepcion = entrada.situaciones.filter(s => esPercepcion(s, preguntas))

  const vacia = () => alumnos.map(() => alumnos.map(() => 0))
  const matriz = vacia()
  const matrizPorSituacion: Partial<Record<Situacion, number[][]>> = {}
  for (const s of entrada.situaciones) matrizPorSituacion[s] = vacia()

  const emitidos = new Map<string, Set<string>>()
  const respondieron = new Set<string>(entrada.participantes ?? [])

  for (const r of entrada.respuestas) {
    const i = indice.get(r.de_alumno)
    const j = indice.get(r.a_alumno)
    if (i === undefined || j === undefined || i === j) continue
    if (!entrada.situaciones.includes(r.situacion)) continue
    if (r.signo === -1 && !entrada.negativas) continue
    respondieron.add(r.de_alumno)
    const ms = matrizPorSituacion[r.situacion]
    if (ms) ms[i]![j] = r.signo
    if (r.signo === 1 && preferencia.includes(r.situacion)) {
      matriz[i]![j] = 1
      const set = emitidos.get(r.de_alumno) ?? new Set<string>()
      set.add(r.a_alumno)
      emitidos.set(r.de_alumno, set)
    }
  }

  // Recibidas por situación y totales.
  const recibidasTotal = alumnos.map((_, j) => alumnos.reduce((acc, __, i) => acc + (matriz[i]![j] ?? 0), 0))
  const negativasRecibidas = alumnos.map((_, j) =>
    preferencia.reduce((acc, s) => acc + alumnos.reduce((a2, __, i) => a2 + ((matrizPorSituacion[s]?.[i]?.[j] ?? 0) === -1 ? 1 : 0), 0), 0),
  )
  const emitidasTotal = alumnos.map((_, i) => alumnos.reduce((acc, __, j) => acc + (matriz[i]![j] ?? 0), 0))

  // Reciprocidad.
  const parejasReciprocas: [string, string][] = []
  const reciprocas = alumnos.map(() => 0)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matriz[i]![j] && matriz[j]![i]) {
        parejasReciprocas.push([alumnos[i]!, alumnos[j]!])
        reciprocas[i]!++
        reciprocas[j]!++
      }
    }
  }
  const parejasPosibles = (n * (n - 1)) / 2
  const cohesion = parejasPosibles ? parejasReciprocas.length / parejasPosibles : 0

  // Subgrupos: componentes conexas del grafo recíproco. Puentes: puntos de
  // articulación por DFS (Tarjan), que es lo que un docente llama «puente».
  const ady = new Map<string, Set<string>>(alumnos.map(a => [a, new Set<string>()]))
  for (const [a, b] of parejasReciprocas) {
    ady.get(a)!.add(b)
    ady.get(b)!.add(a)
  }
  const visitado = new Set<string>()
  const subgrupos: string[][] = []
  for (const a of alumnos) {
    if (visitado.has(a)) continue
    const comp: string[] = []
    const pila = [a]
    visitado.add(a)
    while (pila.length) {
      const x = pila.pop()!
      comp.push(x)
      for (const y of ady.get(x) ?? []) {
        if (!visitado.has(y)) {
          visitado.add(y)
          pila.push(y)
        }
      }
    }
    if (comp.length >= 2) subgrupos.push(comp.sort((p, q) => alumnos.indexOf(p) - alumnos.indexOf(q)))
  }
  const puentes = puntosArticulacion(alumnos, ady)

  // Tipificaciones y posición.
  const zPos = tipificar(recibidasTotal)
  const zNeg = entrada.negativas ? tipificar(negativasRecibidas) : null

  const porAlumno: Record<string, AnalisisAlumno> = {}
  alumnos.forEach((id, k) => {
    const recibidas: Partial<Record<Situacion, number>> = {}
    for (const s of entrada.situaciones) {
      recibidas[s] = alumnos.reduce((acc, __, i) => acc + ((matrizPorSituacion[s]?.[i]?.[k] ?? 0) === 1 ? 1 : 0), 0)
    }
    const distintos = emitidos.get(id)?.size ?? 0
    const ajuste = ajustePerceptivo(k, alumnos, matriz, percepcion.map(s => matrizPorSituacion[s]).filter((m): m is number[][] => Boolean(m)))
    const zp = zPos[k] ?? 0
    const zn = zNeg ? (zNeg[k] ?? 0) : null
    porAlumno[id] = {
      alumno_id: id,
      recibidas,
      recibidasTotal: recibidasTotal[k] ?? 0,
      emitidasTotal: emitidasTotal[k] ?? 0,
      reciprocas: reciprocas[k] ?? 0,
      reciprocidad: distintos ? (reciprocas[k] ?? 0) / distintos : 0,
      negativasRecibidas: negativasRecibidas[k] ?? 0,
      ajustePerceptivo: ajuste,
      posicion: posicion(recibidasTotal[k] ?? 0, zp),
      tipo: zn === null ? null : tipo(zp, zn),
      zPositivas: zp,
      zNegativas: zn,
    }
  })

  return {
    alumnos,
    porAlumno,
    matriz,
    matrizPorSituacion,
    parejasReciprocas,
    cohesion,
    subgrupos,
    puentes,
    sinElecciones: alumnos.filter((_, k) => (recibidasTotal[k] ?? 0) === 0),
    sinRespuesta: alumnos.filter(a => !respondieron.has(a)),
  }
}

function posicion(recibidas: number, z: number): Posicion {
  if (recibidas === 0) return 'no elegido'
  if (z >= 1) return 'muy elegido'
  if (z <= -1) return 'poco elegido'
  return 'elegido'
}

/** Coie y Dodge: preferencia social = zP − zN; impacto social = zP + zN. */
export function tipo(zp: number, zn: number): TipoSociometrico {
  const preferencia = zp - zn
  const impacto = zp + zn
  if (preferencia > 1 && zp > 0 && zn < 0) return 'popular'
  if (preferencia < -1 && zn > 0 && zp < 0) return 'rechazado'
  if (impacto < -1 && zp < 0 && zn < 0) return 'ignorado'
  if (impacto > 1 && zp > 0 && zn > 0) return 'controvertido'
  return 'promedio'
}

/** De quienes cree que le eligen (en cualquier situación de percepción), cuántos le eligen de verdad. */
function ajustePerceptivo(k: number, alumnos: string[], matriz: number[][], percepciones: number[][][]): number | null {
  if (!percepciones.length) return null
  const cree = alumnos.map((_, j) => j).filter(j => percepciones.some(m => (m[k]?.[j] ?? 0) === 1))
  if (!cree.length) return null
  const aciertos = cree.filter(j => (matriz[j]?.[k] ?? 0) === 1).length
  return aciertos / cree.length
}

function puntosArticulacion(nodos: string[], ady: Map<string, Set<string>>): string[] {
  const disc = new Map<string, number>()
  const low = new Map<string, number>()
  const resultado = new Set<string>()
  let t = 0
  const dfs = (u: string, padre: string | null) => {
    disc.set(u, t)
    low.set(u, t)
    t++
    let hijos = 0
    for (const v of ady.get(u) ?? []) {
      if (!disc.has(v)) {
        hijos++
        dfs(v, u)
        low.set(u, Math.min(low.get(u)!, low.get(v)!))
        if (padre !== null && low.get(v)! >= disc.get(u)!) resultado.add(u)
      } else if (v !== padre) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!))
      }
    }
    if (padre === null && hijos > 1) resultado.add(u)
  }
  for (const nodo of nodos) if (!disc.has(nodo)) dfs(nodo, null)
  return nodos.filter(nodo => resultado.has(nodo))
}

/** Lista de atención: sin elecciones, sin respuesta y desajuste perceptivo alto. Sin colores de alarma: es una lista de trabajo. */
export function listaAtencion(a: Analisis): { alumno_id: string; motivo: string }[] {
  const salida: { alumno_id: string; motivo: string }[] = []
  for (const id of a.sinElecciones) salida.push({ alumno_id: id, motivo: 'ninguna elección recibida' })
  for (const id of a.sinRespuesta) salida.push({ alumno_id: id, motivo: 'no ha respondido' })
  for (const id of a.alumnos) {
    const x = a.porAlumno[id]
    if (x && x.ajustePerceptivo !== null && x.ajustePerceptivo < 0.34 && (x.recibidasTotal ?? 0) > 0) {
      salida.push({ alumno_id: id, motivo: 'cree que le eligen quienes no le eligen' })
    }
    if (x && x.tipo === 'rechazado') salida.push({ alumno_id: id, motivo: 'tipo sociométrico rechazado (con negativas)' })
  }
  return salida
}

export * from './grafo'
