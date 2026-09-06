#!/usr/bin/env node
// La app compilada no debe cargar nada de otro origen: ni fuentes, ni
// analíticas, ni CDN. Todo lo que necesita viaja con ella. Esto lo comprueba
// sobre el directorio de salida de vite.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) { console.error('uso: sin-origenes-externos.mjs <dist>'); process.exit(2) }

// Se admiten las URL que aparecen en licencias, manifiestos y esquemas XML,
// y las que React, React Router y Workbox incrustan como TEXTO en sus
// mensajes de error (enlaces a documentación: no se cargan nunca). En HTML,
// CSS y manifiesto no se admite ninguna.
const PERMITIDAS_JS = [
  /^https?:\/\/(www\.)?(gnu\.org|joinup\.ec\.europa\.eu|edumind\.es|hilos\.edumind\.es|github\.com)/,
  /^http:\/\/www\.w3\.org\//,
  /^https?:\/\/schema\.org/,
  /^https:\/\/react\.dev\//,
  /^https:\/\/reactrouter\.com\//,
  /^https?:\/\/(bit\.ly|tinyurl\.com)\//,
  /^http:\/\/localhost/,
  // DOI de las referencias del catálogo: texto de una cita, no una carga.
  /^https:\/\/doi\.org\//,
]
const PERMITIDAS_RESTO = [/^https?:\/\/(www\.)?(edumind\.es|hilos\.edumind\.es|github\.com)/, /^http:\/\/www\.w3\.org\//]
function* ficheros(d) {
  for (const n of readdirSync(d)) {
    const r = join(d, n)
    if (statSync(r).isDirectory()) yield* ficheros(r)
    else if (/\.(js|css|html|webmanifest|json)$/.test(n)) yield r
  }
}
const externas = new Set()
for (const f of ficheros(dir)) {
  const t = readFileSync(f, 'utf8')
  for (const m of t.matchAll(/https?:\/\/[a-z0-9.-]+(?:\/[^\s"'`)]*)?/gi)) {
    const url = m[0]
    const permitidas = /\.js$/.test(f) ? PERMITIDAS_JS : PERMITIDAS_RESTO
    if (!permitidas.some(re => re.test(url))) externas.add(`${f.split('/').pop()}: ${url.slice(0, 80)}`)
  }
}
if (externas.size) {
  console.error('Orígenes externos en la app compilada:\n  ' + [...externas].join('\n  '))
  process.exit(1)
}
console.log('orígenes externos: ninguno')
