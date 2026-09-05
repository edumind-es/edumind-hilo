import type { Idioma } from '@edumind-hilo/nucleo'

const LANG: Record<Idioma, string> = { es: 'es-ES', gl: 'gl-ES' }

/** Lee la pregunta con la voz del sistema. Sin red: es la del navegador. */
export function hayVoz(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function leer(texto: string, idioma: Idioma) {
  if (!hayVoz()) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = LANG[idioma]
  u.rate = 0.9
  speechSynthesis.speak(u)
}

export function callar() {
  if (hayVoz()) speechSynthesis.cancel()
}
