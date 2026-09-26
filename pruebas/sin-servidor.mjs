#!/usr/bin/env node
// Hilo no tiene servidor: ni relé, ni buzón, ni API. Desde 1.7.0 la app
// compilada no puede contener ninguna ruta `/api/`. Si alguien vuelve a meter
// una llamada al servidor, esto la ve en el directorio de salida de vite.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) { console.error('uso: sin-servidor.mjs <dist>'); process.exit(2) }

function* ficheros(d) {
  for (const n of readdirSync(d)) {
    const r = join(d, n)
    if (statSync(r).isDirectory()) yield* ficheros(r)
    else if (/\.(js|css|html|webmanifest|json)$/.test(n)) yield r
  }
}
const hallazgos = []
for (const f of ficheros(dir)) {
  const t = readFileSync(f, 'utf8')
  const i = t.indexOf('/api/')
  if (i !== -1) hallazgos.push(`${f.split('/').pop()}: …${t.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, ' ')}…`)
}
if (hallazgos.length) {
  console.error('La app compilada contiene rutas «/api/» y Hilo no tiene servidor:\n  ' + hallazgos.join('\n  '))
  process.exit(1)
}
console.log('rutas /api/: ninguna')
