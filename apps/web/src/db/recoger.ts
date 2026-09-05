/**
 * Convierte lo que llega por QR, hoja o teclado en respuestas del modelo y
 * las registra. Aquí se traduce de códigos de alumno a ids internos, y aquí
 * se rechaza lo que no cuadra con la toma.
 */
import { decodificarRespuestas, type Alumno, type Eleccion, type Origen, type Toma } from '@edumind-hilo/nucleo'
import { registrarRespuestas } from './consultas'

export interface Registro {
  alumno: Alumno
  elecciones: number
}

export async function registrarDesdeCodigos(datos: { toma: Toma; alumnos: Alumno[]; de: string; elecciones: { situacion: Eleccion['situacion']; a: string; signo: Eleccion['signo'] }[]; origen: Origen }): Promise<Registro> {
  const porCodigo = new Map(datos.alumnos.map(a => [a.codigo, a]))
  const alumno = porCodigo.get(datos.de)
  if (!alumno) throw new Error(`El código ${datos.de} no es de este grupo.`)
  const elecciones: Eleccion[] = []
  for (const e of datos.elecciones) {
    const a = porCodigo.get(e.a)
    if (!a) continue // un código ajeno se ignora, no rompe la respuesta
    elecciones.push({ situacion: e.situacion, a_alumno: a.id, signo: e.signo })
  }
  await registrarRespuestas({ toma: datos.toma, alumnoId: alumno.id, elecciones, origen: datos.origen })
  return { alumno, elecciones: elecciones.length }
}

/** QR de vuelta de una tablet. */
export async function registrarQr(toma: Toma, alumnos: Alumno[], texto: string): Promise<Registro> {
  const r = decodificarRespuestas(texto)
  if (r.toma !== toma.id) throw new Error('Este código es de otra toma.')
  return registrarDesdeCodigos({ toma, alumnos, de: r.de, elecciones: r.elecciones, origen: 'qr' })
}
