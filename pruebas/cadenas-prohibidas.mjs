#!/usr/bin/env node
// Ninguna institución figura en la firma de EDUmind. Es una regla del
// proyecto, no un detalle: si alguna de estas cadenas aparece en el árbol,
// las pruebas fallan y el commit no entra.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname
const PROHIBIDAS = [/xunta de galicia/i, /campolongo/i, /\bceip\b/i, /\bcep\b(?! campolongo)/i]
const IGNORAR = new Set(['node_modules', '.git', 'dist', 'releases'])
const EXT = /\.(ts|tsx|js|mjs|json|md|html|css|yml|yaml|txt|sh|py)$/

function* ficheros(dir) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) yield* ficheros(ruta)
    else if (EXT.test(nombre)) yield ruta
  }
}

const ESTE = new URL(import.meta.url).pathname
const fallos = []
for (const ruta of ficheros(RAIZ)) {
  if (ruta === ESTE) continue // este fichero contiene las cadenas que busca
  const texto = readFileSync(ruta, 'utf8')
  for (const re of PROHIBIDAS) {
    const m = texto.match(re)
    if (m) fallos.push(`${relative(RAIZ, ruta)}: «${m[0]}»`)
  }
}
if (fallos.length) {
  console.error('Cadenas prohibidas en el árbol:\n  ' + fallos.join('\n  '))
  process.exit(1)
}
console.log('cadenas prohibidas: ninguna')
