/**
 * Reconstruye, a partir de las respuestas ya guardadas de un alumno, la lista
 * de elegidos que corresponde a cada paso del cuestionario. Es lo que permite
 * abrir una transcripción anterior con sus fichas puestas para corregirla.
 *
 * Función pura: no sabe nada de la base ni del DOM.
 */
export interface PasoMinimo {
  situacion: string
  signo: number
}

export interface RespuestaMinima {
  de_alumno: string
  a_alumno: string
  situacion: string
  signo: number
}

export function eleccionesPorPaso(respuestas: RespuestaMinima[], pasos: PasoMinimo[], alumnoId: string): string[][] {
  const suyas = respuestas.filter(r => r.de_alumno === alumnoId)
  return pasos.map(p => {
    const elegidos = suyas.filter(r => r.situacion === p.situacion && r.signo === p.signo).map(r => r.a_alumno)
    // Un mismo elegido no puede aparecer dos veces en un paso.
    return [...new Set(elegidos)]
  })
}
