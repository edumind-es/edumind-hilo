/**
 * El grafo como cadena SVG. Lo usan la pantalla y el informe descargable, así
 * que lo que se ve en el portal es exactamente lo que sale en el fichero.
 */
import { disponerGrafo, type Analisis, type Situacion } from '@edumind-hilo/nucleo'

export const MUNDOS = ['#c05f3c', '#c19a2e', '#7ba24f', '#6c8fb3', '#4a5f68']

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface DatosGrafo {
  analisis: Analisis
  nombres: Map<string, string>
  /** Situación concreta o null para todas las de preferencia. */
  situacion: Situacion | null
  semilla?: number
  ancho?: number
  alto?: number
}

export function dibujarGrafoSvg(d: DatosGrafo): string {
  const ancho = d.ancho ?? 760
  const alto = d.alto ?? 520
  const a = d.analisis
  const n = a.alumnos.length
  const idx = new Map(a.alumnos.map((id, i) => [id, i]))
  const m = d.situacion ? a.matrizPorSituacion[d.situacion] : a.matriz
  const aristas: { de: string; a: string; reciproca: boolean }[] = []
  if (m) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j || (m[i]?.[j] ?? 0) !== 1) continue
        const reciproca = (m[j]?.[i] ?? 0) === 1
        if (reciproca && j < i) continue // una sola línea por pareja recíproca
        aristas.push({ de: a.alumnos[i]!, a: a.alumnos[j]!, reciproca })
      }
    }
  }
  const nodos = a.alumnos.map(id => ({ id, peso: a.porAlumno[id]?.recibidasTotal ?? 0 }))
  const pos = new Map(disponerGrafo(nodos, aristas, { ancho, alto, semilla: d.semilla ?? 7, margen: 46 }).map(p => [p.id, p]))
  const subgrupoDe = new Map<string, number>()
  a.subgrupos.forEach((sg, k) => sg.forEach(id => subgrupoDe.set(id, k)))
  const radio = (id: string) => 9 + Math.min(14, (a.porAlumno[id]?.recibidasTotal ?? 0) * 2.2)

  const lineas = aristas.map(ar => {
    const p = pos.get(ar.de)!
    const q = pos.get(ar.a)!
    if (ar.reciproca) return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#17181a" stroke-width="2.2"/>`
    // flecha corta hacia el elegido, acortada al borde del nodo
    const dx = q.x - p.x
    const dy = q.y - p.y
    const dist = Math.hypot(dx, dy) || 1
    const r = radio(ar.a) + 3
    const x2 = q.x - (dx / dist) * r
    const y2 = q.y - (dy / dist) * r
    return `<line x1="${p.x}" y1="${p.y}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#9a968c" stroke-width="1" marker-end="url(#flecha)"/>`
  })
  const circulos = a.alumnos.map(id => {
    const p = pos.get(id)!
    const sg = subgrupoDe.get(id)
    const color = sg === undefined ? '#e4e0d6' : MUNDOS[sg % MUNDOS.length]!
    const texto = sg === undefined ? '#17181a' : '#fff'
    const r = radio(id)
    const nombre = d.nombres.get(id) ?? id
    const aislado = (a.porAlumno[id]?.recibidasTotal ?? 0) === 0
    return `<g><circle cx="${p.x}" cy="${p.y}" r="${r.toFixed(1)}" fill="${color}" stroke="${aislado ? '#b03a2e' : '#17181a'}" stroke-width="${aislado ? 2 : 1}"/>` +
      `<text x="${p.x}" y="${(p.y + r + 12).toFixed(1)}" text-anchor="middle" font-size="11" fill="${texto === '#fff' ? '#17181a' : '#17181a'}" font-family="Archivo, Helvetica, Arial, sans-serif">${esc(nombre)}</text></g>`
  })
  const _ = idx
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Grafo de elecciones del grupo">` +
    `<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9a968c"/></marker></defs>` +
    `<rect width="${ancho}" height="${alto}" fill="#f4f2ec"/>` + lineas.join('') + circulos.join('') + `</svg>`
}
