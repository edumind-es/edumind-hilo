/** Trayectoria de un alumno a lo largo de las tomas, con los eventos del grupo. SVG como cadena. */
import { esc } from './grafoSvg'

export interface PuntoTrayectoria {
  fecha: string
  titulo: string
  recibidas: number
  reciprocidad: number
}

export function trayectoriaSvg(d: { puntos: PuntoTrayectoria[]; eventos: { fecha: string; texto: string }[]; ancho?: number; alto?: number }): string {
  const ancho = d.ancho ?? 760
  const alto = d.alto ?? 260
  const ml = 44
  const mr = 20
  const mt = 24
  const mb = 60
  const puntos = [...d.puntos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (puntos.length < 2) return ''
  const t0 = new Date(puntos[0]!.fecha).getTime()
  const t1 = new Date(puntos.at(-1)!.fecha).getTime()
  const sx = (iso: string) => ml + ((new Date(iso).getTime() - t0) / Math.max(1, t1 - t0)) * (ancho - ml - mr)
  const maxR = Math.max(1, ...puntos.map(p => p.recibidas))
  const sy = (v: number) => mt + (1 - v / maxR) * (alto - mt - mb)
  const sy2 = (v: number) => mt + (1 - v) * (alto - mt - mb)
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${sx(p.fecha).toFixed(1)},${sy(p.recibidas).toFixed(1)}`).join(' ')
  const linea2 = puntos.map((p, i) => `${i ? 'L' : 'M'}${sx(p.fecha).toFixed(1)},${sy2(p.reciprocidad).toFixed(1)}`).join(' ')
  const ticks = Array.from({ length: maxR + 1 }, (_, v) => v).filter(v => maxR <= 8 || v % Math.ceil(maxR / 6) === 0)
  const rejilla = ticks.map(v => `<line x1="${ml}" x2="${ancho - mr}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}" stroke="#c9c4b8" stroke-width="1"/><text x="${ml - 8}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#7c7a74">${v}</text>`).join('')
  const ev = d.eventos.filter(e => { const t = new Date(e.fecha).getTime(); return t >= t0 && t <= t1 }).map(e => {
    const x = sx(e.fecha).toFixed(1)
    return `<line x1="${x}" x2="${x}" y1="${mt}" y2="${alto - mb + 6}" stroke="#c05f3c" stroke-width="1" stroke-dasharray="3 3"/><text x="${x}" y="${alto - mb + 18}" text-anchor="middle" font-size="10" fill="#c05f3c">${esc(e.texto.slice(0, 22))}</text>`
  }).join('')
  const marcas = puntos.map(p => `<circle cx="${sx(p.fecha).toFixed(1)}" cy="${sy(p.recibidas).toFixed(1)}" r="5" fill="#17181a"/><circle cx="${sx(p.fecha).toFixed(1)}" cy="${sy2(p.reciprocidad).toFixed(1)}" r="4" fill="#ece9e1" stroke="#c19a2e" stroke-width="2"/><text x="${sx(p.fecha).toFixed(1)}" y="${alto - 14}" text-anchor="middle" font-size="11" fill="#3d3f42">${esc(p.titulo.slice(0, 18))}</text>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Trayectoria: elecciones recibidas y reciprocidad por toma" font-family="Archivo, Helvetica, Arial, sans-serif"><rect width="${ancho}" height="${alto}" fill="#f4f2ec"/>${rejilla}${ev}<path d="${linea}" fill="none" stroke="#17181a" stroke-width="2"/><path d="${linea2}" fill="none" stroke="#c19a2e" stroke-width="1.5"/>${marcas}<text x="${ancho - mr}" y="${mt - 8}" text-anchor="end" font-size="11" fill="#3d3f42">● recibidas · <tspan fill="#c19a2e">○ reciprocidad</tspan></text></svg>`
}
