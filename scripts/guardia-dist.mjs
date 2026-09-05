#!/usr/bin/env node
// Impide compilar encima de la versión que se está sirviendo.
//
// Tras el primer despliegue, apps/web/dist es un ENLACE SIMBÓLICO a
// apps/web/releases/<versión>. Un `npm run build` a mano escribiría dentro de
// esa carpeta (vite la vacía primero) y dejaría producción a medias y sin su
// `.commit`. Pasó una vez el mismo día del primer despliegue. Este guardián
// se engancha como `prebuild` y corta antes de que ocurra.
//
// Para compilar: `./desplegar.sh` (compila aparte, en releases/) o, para una
// compilación de prueba, `npx vite build --outDir /tmp/hilo-prueba`.
import { lstatSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '../apps/web/dist')
let esEnlace = false
try {
  esEnlace = lstatSync(dist).isSymbolicLink()
} catch {
  // no existe todavía: compilar es seguro
}
if (esEnlace) {
  console.error(
    `\napps/web/dist es un enlace simbólico a la versión desplegada.\n` +
      `No se compila encima. Usa ./desplegar.sh o --outDir a otra carpeta.\n`,
  )
  process.exit(1)
}
