/**
 * Codificación compacta de las respuestas de un alumno, pensada para caber
 * en un QR de vuelta o en un fichero de entrega. Usa códigos de alumno,
 * nunca nombres ni ids internos.
 *
 *   H1|<toma>|<codigo del que responde>|equipo:+AB3DE+F2GH7|recreo:-K9M2N
 *
 * Los signos van explícitos para que una toma sin negativas pueda rechazar
 * un fichero que las traiga.
 */
import { esCodigoValido } from './codigos'
import { ID_SITUACION_RE, type Signo, type Situacion } from './tipos'

export interface RespuestaCodificada {
  toma: string
  de: string
  elecciones: { situacion: Situacion; a: string; signo: Signo }[]
}

const VERSION = 'H1'

export function codificarRespuestas(r: RespuestaCodificada): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(r.toma)) throw new Error('identificador de toma no codificable')
  if (!esCodigoValido(r.de)) throw new Error('código de alumno no válido')
  const porSituacion = new Map<Situacion, string[]>()
  for (const e of r.elecciones) {
    if (!esCodigoValido(e.a)) throw new Error('código de alumno no válido')
    const lista = porSituacion.get(e.situacion) ?? []
    lista.push((e.signo === -1 ? '-' : '+') + e.a)
    porSituacion.set(e.situacion, lista)
  }
  const partes = [...porSituacion].map(([s, l]) => `${s}:${l.join('')}`)
  return [VERSION, r.toma, r.de, ...partes].join('|')
}

export function decodificarRespuestas(texto: string): RespuestaCodificada {
  const partes = texto.trim().split('|')
  const [version, toma, de, ...resto] = partes
  if (version !== VERSION) throw new Error('formato desconocido')
  if (!toma || !/^[A-Za-z0-9_-]{1,64}$/.test(toma)) throw new Error('toma no válida')
  if (!de || !esCodigoValido(de)) throw new Error('código del alumno no válido')
  const elecciones: RespuestaCodificada['elecciones'] = []
  for (const parte of resto) {
    const i = parte.indexOf(':')
    if (i < 1) throw new Error('situación mal formada')
    const situacion: Situacion = parte.slice(0, i)
    if (!ID_SITUACION_RE.test(situacion)) throw new Error(`situación desconocida: ${situacion}`)
    const cuerpo = parte.slice(i + 1)
    if (cuerpo.length % 6 !== 0) throw new Error('lista de códigos mal formada')
    for (let j = 0; j < cuerpo.length; j += 6) {
      const signo = cuerpo[j]
      const a = cuerpo.slice(j + 1, j + 6)
      if ((signo !== '+' && signo !== '-') || !esCodigoValido(a)) throw new Error('elección mal formada')
      if (a === de) throw new Error('nadie se elige a sí mismo')
      elecciones.push({ situacion, a, signo: signo === '-' ? -1 : 1 })
    }
  }
  return { toma, de, elecciones }
}
