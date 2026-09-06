/**
 * Informe de grupo: un HTML autocontenido en estilo Lámina. La misma cadena
 * se muestra en pantalla y se descarga, así no hay dos versiones.
 */
import { ETIQUETA_ETAPA, etiquetaSituacion, esPreferencia, listaAtencion, type Alumno, type Analisis, type Grupo, type Toma } from '@edumind-hilo/nucleo'
import { dibujarGrafoSvg, esc } from './grafoSvg'

export interface DatosInforme {
  grupo: Grupo
  toma: Toma
  alumnos: Alumno[]
  analisis: Analisis
  nombres: Map<string, string>
  respondieron: number
}

export const cssInforme = `
:root{--paper:#ece9e1;--paper-2:#e4e0d6;--card:#f4f2ec;--ink:#17181a;--ink-2:#3d3f42;--ink-3:#7c7a74;--hair:#c9c4b8;--m-emocional:#c05f3c;--m-social:#c19a2e;--m-fisico:#7ba24f;--m-mental:#6c8fb3;--m-interior:#4a5f68;--alert:#b03a2e}
*{box-sizing:border-box;border-radius:0}
body{margin:0;background:var(--paper);color:var(--ink);font:400 15px/1.5 Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif}
.i-wrap{max-width:1080px;margin:0 auto;padding:0 32px 40px}
.i-bar{display:grid;grid-template-columns:repeat(5,1fr);height:6px}
.i-bar i:nth-child(1){background:var(--m-emocional)}.i-bar i:nth-child(2){background:var(--m-social)}.i-bar i:nth-child(3){background:var(--m-fisico)}.i-bar i:nth-child(4){background:var(--m-mental)}.i-bar i:nth-child(5){background:var(--m-interior)}
.i-top{display:flex;justify-content:space-between;border-bottom:2px solid var(--ink);padding:12px 0;font:400 11px/1.4 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.14em;color:var(--ink-3)}
.i-top b{color:var(--ink);font-weight:500}
h1{font-weight:800;letter-spacing:-.03em;line-height:.95;font-size:44px;margin:36px 0 10px}
h1 span{font-weight:400}
.i-lede{font-size:17px;color:var(--ink-2);max-width:62ch;margin:0 0 20px}
.i-meta{display:flex;flex-wrap:wrap;border-top:1px solid var(--hair);margin:0 0 30px}
.i-meta span{font:400 12px/1 ui-monospace,Menlo,monospace;color:var(--ink-2);padding:12px 18px 12px 0;border-right:1px solid var(--hair);margin-right:18px}
.i-meta span:last-child{border:0}
.i-sec{margin:44px 0;break-inside:avoid}
.i-head{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px}
.i-num{font-weight:800;font-size:30px;line-height:.9;color:var(--m-mental);letter-spacing:-.03em}
.i-head h2{margin:0;flex:1;font-size:22px;font-weight:700;letter-spacing:-.02em;padding-top:8px;border-top:2px solid var(--ink)}
.i-cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));border-top:2px solid var(--ink);margin:0 0 10px}
.i-cifras div{padding:12px 12px 12px 10px;border-right:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.i-cifras dt{font:400 10.5px/1.3 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.14em;color:var(--ink-3);margin:0 0 3px}
.i-cifras dd{margin:0;font-weight:700;font-size:22px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.i-cifras dd small{font-size:12px;font-weight:400;color:var(--ink-3);margin-left:5px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th{background:var(--ink);color:var(--paper);font:500 10.5px/1.3 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.1em;text-align:left;padding:8px 10px}
td{padding:8px 10px;border-bottom:1px solid var(--hair);vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.i-matriz td,.i-matriz th{text-align:center;padding:4px 3px}
.i-matriz th.f,.i-matriz td.f{text-align:left;white-space:nowrap;padding-left:8px}
.i-matriz th.c{writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;height:96px;font-size:10px}
.i-matriz td.r{background:var(--paper-2);font-weight:600}
.i-matriz td.d{background:var(--hair)}
.i-matriz td.t{border-left:2px solid var(--ink);font-weight:700}
ul.i-rules{list-style:none;margin:0;padding:0}
ul.i-rules li{display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--hair)}
ul.i-rules li .m{margin-left:auto;font:400 12px/1.5 ui-monospace,Menlo,monospace;color:var(--ink-3)}
.i-note{background:var(--card);border-left:3px solid var(--m-mental);padding:14px 18px;margin:18px 0;color:var(--ink-2);max-width:68ch}
.i-note.a{border-color:var(--alert)}
.i-grafo svg{width:100%;height:auto;display:block;border:1px solid var(--hair)}
.i-aviso{font-size:13px;color:var(--ink-2);margin:8px 0 0}
footer{border-top:2px solid var(--ink);margin-top:50px;padding:22px 0 0;font:400 11px/1.6 ui-monospace,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;color:var(--ink-3)}
footer b{color:var(--ink);font-weight:500}
@media print{body{background:#fff}.i-wrap{padding:0 8mm}h1{font-size:34px}.i-sec{margin:26px 0}}
`

const pct = (x: number) => `${Math.round(x * 100)} %`
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

export function cuerpoInforme(d: DatosInforme): string {
  const { grupo, toma, alumnos, analisis: a, nombres } = d
  const n = (id: string) => esc(nombres.get(id) ?? '?')
  const preferencia = toma.situaciones.filter(s => esPreferencia(s, toma.preguntas))
  const atencion = listaAtencion(a)
  const idx = new Map(a.alumnos.map((id, i) => [id, i]))
  const celda = (i: number, j: number) => {
    let pos = 0
    let neg = 0
    for (const s of preferencia) {
      const v = a.matrizPorSituacion[s]?.[i]?.[j] ?? 0
      if (v === 1) pos++
      if (v === -1) neg++
    }
    return { pos, neg }
  }
  const filasIndices = alumnos.map(al => {
    const x = a.porAlumno[al.id]
    if (!x) return ''
    return `<tr><td>${n(al.id)}${a.sinRespuesta.includes(al.id) ? ' <small>· sin respuesta</small>' : ''}</td>` +
      toma.situaciones.map(s => `<td class="n">${esPreferencia(s, toma.preguntas) ? x.recibidas[s] ?? 0 : '·'}</td>`).join('') +
      `<td class="n"><b>${x.recibidasTotal}</b></td><td class="n">${x.emitidasTotal}</td><td class="n">${x.emitidasTotal ? pct(x.reciprocidad) : '—'}</td><td class="n">${x.ajustePerceptivo === null ? '—' : pct(x.ajustePerceptivo)}</td>` +
      (toma.negativas ? `<td class="n">${x.negativasRecibidas}</td>` : '') +
      `<td>${x.posicion}</td>` + (toma.negativas ? `<td>${x.tipo ?? '—'}</td>` : '') + `</tr>`
  })
  const matriz = alumnos.map(al => {
    const i = idx.get(al.id)!
    return `<tr><td class="f">${n(al.id)}</td>` + alumnos.map(b => {
      const j = idx.get(b.id)!
      if (i === j) return '<td class="d"></td>'
      const { pos, neg } = celda(i, j)
      const rec = pos > 0 && (a.matriz[j]?.[i] ?? 0) === 1
      return `<td class="${neg && toma.negativas ? '' : rec ? 'r' : ''}">${neg && toma.negativas ? '−' : pos || ''}</td>`
    }).join('') + `<td class="t">${a.porAlumno[al.id]?.recibidasTotal ?? 0}</td></tr>`
  })

  return `
<div class="i-bar"><i></i><i></i><i></i><i></i><i></i></div>
<div class="i-wrap">
<div class="i-top"><b>EDUMIND · HILO · INFORME DE GRUPO</b><span>${esc(grupo.nombre)} · ${esc(toma.titulo)}</span></div>
<h1>${esc(grupo.nombre)}<br><span>${esc(toma.titulo)}</span></h1>
<p class="i-lede">Lectura sociométrica de una toma. Describe la trama de elecciones del grupo el día de la toma. No es un diagnóstico: dice quién está aislado hoy, no por qué ni qué hacer.</p>
<div class="i-meta"><span>${esc(ETIQUETA_ETAPA[toma.etapa])}</span><span>${fecha(toma.inicio)}</span><span>${toma.situaciones.map(s => etiquetaSituacion(s, toma.preguntas)).join(' · ')}</span><span>máx. ${toma.max_elecciones}</span>${toma.negativas ? '<span>con negativas</span>' : ''}<span>${d.respondieron} de ${alumnos.length} respondieron</span></div>

<dl class="i-cifras">
<div><dt>Cohesión</dt><dd>${pct(a.cohesion)}<small>${a.parejasReciprocas.length} parejas recíprocas</small></dd></div>
<div><dt>Subgrupos</dt><dd>${a.subgrupos.length}<small>${a.puentes.length} puentes</small></dd></div>
<div><dt>Sin elecciones</dt><dd>${a.sinElecciones.length}</dd></div>
<div><dt>Sin respuesta</dt><dd>${a.sinRespuesta.length}</dd></div>
</dl>

<section class="i-sec"><div class="i-head"><span class="i-num">01</span><h2>Lista de atención</h2></div>
${atencion.length ? `<ul class="i-rules">${atencion.map(x => `<li>${n(x.alumno_id)}<span class="m">${esc(x.motivo)}</span></li>`).join('')}</ul>` : '<p>Nadie sin elecciones ni sin respuesta.</p>'}
<div class="i-note a">Es una lista de trabajo del tutor, no un semáforo. Conviene contrastarla con la observación directa y, si procede, con orientación.</div>
</section>

<section class="i-sec"><div class="i-head"><span class="i-num">02</span><h2>Grafo de elecciones</h2></div>
<div class="i-grafo">${dibujarGrafoSvg({ analisis: a, nombres, situacion: null })}</div>
<p class="i-aviso">Línea gruesa: elección recíproca. Flecha fina: en un sentido. Tamaño: elecciones recibidas. Color: subgrupo. Borde rojo: sin ninguna elección.</p>
</section>

<section class="i-sec"><div class="i-head"><span class="i-num">03</span><h2>Índices por alumno</h2></div>
<table><thead><tr><th>Alumno</th>${toma.situaciones.map(s => `<th class="n">${etiquetaSituacion(s, toma.preguntas)}</th>`).join('')}<th class="n">Recibidas</th><th class="n">Emitidas</th><th class="n">Reciprocidad</th><th class="n">Ajuste</th>${toma.negativas ? '<th class="n">Negativas</th>' : ''}<th>Posición</th>${toma.negativas ? '<th>Tipo</th>' : ''}</tr></thead>
<tbody>${filasIndices.join('')}</tbody></table>
<p class="i-aviso">Reciprocidad: de los que elige, cuántos le eligen. Ajuste: de quienes cree que le eligen (Espejo), cuántos le eligen de verdad. Posición: elecciones recibidas tipificadas dentro del grupo.${toma.negativas ? ' Tipo: Coie y Dodge (1983) a partir de preferencia e impacto social; una foto, no un diagnóstico.' : ''}</p>
</section>

<section class="i-sec"><div class="i-head"><span class="i-num">04</span><h2>Matriz sociométrica</h2></div>
<div style="overflow-x:auto"><table class="i-matriz"><thead><tr><th class="f">elige →</th>${alumnos.map(b => `<th class="c">${n(b.id)}</th>`).join('')}<th class="c">Recibidas</th></tr></thead><tbody>${matriz.join('')}</tbody></table></div>
<p class="i-aviso">Filas: quién elige. Columnas: a quién. La cifra es en cuántas situaciones le elige; «−» marca una negativa. Sombreado: recíproca.</p>
</section>

<section class="i-sec"><div class="i-head"><span class="i-num">05</span><h2>Subgrupos y puentes</h2></div>
${a.subgrupos.length ? `<ul class="i-rules">${a.subgrupos.map(sg => `<li>${sg.map(n).join(', ')}<span class="m">${sg.length} alumnos</span></li>`).join('')}</ul>` : '<p>Todavía no hay parejas recíprocas.</p>'}
${a.puentes.length ? `<p>Puentes: <b>${a.puentes.map(n).join(', ')}</b>. Sin ellos, su subgrupo se partiría.</p>` : ''}
</section>

<section class="i-sec"><div class="i-head"><span class="i-num">06</span><h2>Método</h2></div>
<div class="i-note">Instrumento de nominaciones por situación (${toma.situaciones.map(s => etiquetaSituacion(s, toma.preguntas).toLowerCase()).join(', ')}), sin motivo ni orden, máximo ${toma.max_elecciones} por situación. Espejo mide percepción y no cuenta como elección recibida. Los datos se recogieron y se analizaron en el dispositivo del docente; ningún dato ha salido de él. Documento para el equipo docente y orientación: no se entrega al alumnado.</div>
</section>

<footer><b>Una app de EDUmind® · por Luis Vilela Acuña</b> · generado el ${fecha(new Date().toISOString())} · hilos.edumind.es</footer>
</div>
<div class="i-bar"><i></i><i></i><i></i><i></i><i></i></div>`
}

/** Las fuentes viajan dentro del fichero: el informe se abre igual sin red y sin Hilo. */
async function fuentesIncrustadas(): Promise<string> {
  const familias: [string, string, string][] = [['Archivo', '/fonts/Archivo.woff2', '400 800'], ['JetBrains Mono', '/fonts/JetBrainsMono.woff2', '400 500']]
  const reglas: string[] = []
  for (const [nombre, ruta, pesos] of familias) {
    try {
      const r = await fetch(ruta)
      if (!r.ok) continue
      const bytes = new Uint8Array(await r.arrayBuffer())
      let bin = ''
      for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192))
      reglas.push(`@font-face{font-family:'${nombre}';font-weight:${pesos};font-display:swap;src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2')}`)
    } catch {
      /* sin fuente incrustada: quedan las del sistema */
    }
  }
  return reglas.join('\n')
}

export async function documentoInforme(d: DatosInforme): Promise<string> {
  const fuentes = await fuentesIncrustadas()
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="author" content="Luis Vilela Acuña"><title>${esc(d.grupo.nombre)} · ${esc(d.toma.titulo)} · Hilo</title><style>${fuentes}\n${cssInforme}</style></head><body>${cuerpoInforme(d)}</body></html>`
}
