# edumind_hilo — Contexto del proyecto

## Qué es
EDUmind Hilo: sociograma de aula local-first y SIN servidor. PWA estática.
Monorepo npm: `packages/nucleo` (puro) y `apps/web` (React + Vite + Dexie).

## Reglas del proyecto (no negociables)
- **Sin servidor.** No añadir backend, fetch a terceros ni analíticas. El CI
  falla si la app compilada referencia otro origen (`pruebas/sin-origenes-externos.mjs`).
- **Nada de ninguna institución en la firma.** `pruebas/cadenas-prohibidas.mjs`
  bloquea el nombre del centro y de la administración educativa (ver la lista
  en el propio script; no repetirla en ningún otro fichero). Firma: «Una app de
  EDUmind® · por Luis Vilela Acuña».
- **Pantalla del alumnado**: nunca resultados, nunca la palabra «sociograma»,
  nunca el propio alumno en su lista. Hay prueba.
- **Negativas solo en secundaria**, y el esquema Zod lo impone.
- **Portal docente en EDUmind-Lámina** (cero radios, sombras, degradados, emoji).
  **Pantalla del alumnado en EDUmind-Alumno**, acotada a `.modo-alumno`.
- Todo en español: código, comentarios, commits, issues.

## Comandos
- `npm run dev` → http://localhost:5190 (Vite). Puertos: dev 5190, preview 4190.
- `npm test` → cadenas prohibidas + núcleo + web. `npm run test:rapido` → solo núcleo.
- `npm run typecheck`, `npm run build`.
- `python3 scripts/iconos.py` regenera los PNG de la PWA (Pillow).
- Ganchos: `git config core.hooksPath .githooks` (encadenan el guardián global).

## Despliegue
- `./desplegar.sh` a mano, nunca automático. `--volver` deshace.
- `apps/web/dist` es un ENLACE SIMBÓLICO a `apps/web/releases/<versión>` tras
  el primer despliegue: no compilar encima a mano.

## Dónde está cada cosa
- Diseño completo: `docs/lamina-diseno.html` (FIG. 13). Fases: `ROADMAP.md`.
- Núcleo: `packages/nucleo/src/`. El motor sociométrico en `sociometria/`.
- Base local: `apps/web/src/db/localDb.ts`; operaciones en `consultas.ts`.
- El alias `@edumind-hilo/nucleo` apunta SIEMPRE al código fuente, no a un dist.
