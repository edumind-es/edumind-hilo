# Créditos y material ajeno

EDUmind Hilo es obra de **Luis Vilela Acuña · EDUmind®** y se publica bajo
doble licencia AGPL-3.0-or-later / EUPL-1.2 (ver [LICENSE](LICENSE)). Este
fichero enumera todo lo que no es propio: de dónde viene y con qué licencia.

## Tipografías

Las cuatro van incrustadas en `apps/web/public/fonts/` (woff2, subconjunto
latino) y también dentro del informe HTML descargable. Todas bajo la
**SIL Open Font License 1.1**; el texto de la licencia y los titulares están
en [`apps/web/public/fonts/OFL.txt`](apps/web/public/fonts/OFL.txt), junto a
los ficheros de fuente, como pide la OFL.

| Fuente | Autoría | Origen | Licencia |
|---|---|---|---|
| Archivo | The Archivo Project Authors (Omnibus-Type) | https://github.com/Omnibus-Type/Archivo | OFL 1.1 |
| Fraunces | The Fraunces Project Authors (Undercase Type) | https://github.com/undercasetype/Fraunces | OFL 1.1 |
| JetBrains Mono | The JetBrains Mono Project Authors (JetBrains) | https://github.com/JetBrains/JetBrainsMono | OFL 1.1 |
| Space Grotesk | The Space Grotesk Project Authors (Florian Karsten) | https://github.com/floriankarsten/space-grotesk | OFL 1.1 |

## Imágenes e iconos

Todo propio: el icono `apps/web/public/icono.svg` (curva con nodos sobre
papel), los PNG de la PWA y los iconos y pantallas de arranque de la app
Android, generados todos con `scripts/iconos.py` a partir del mismo dibujo. Los
SVG en línea (altavoz, curva de «Gracias», grafo) son propios.

No se usan pictogramas ARASAAC, ni fotografías, ni música ni sonidos.

## Bibliotecas empaquetadas en la app

| Biblioteca | Para qué | Licencia |
|---|---|---|
| React y React DOM | Interfaz | MIT |
| React Router | Rutas | MIT |
| Dexie y dexie-react-hooks | IndexedDB | Apache-2.0 |
| jsQR | Lectura de códigos QR con la cámara | Apache-2.0 |
| qrcode | Generación de códigos QR | MIT |
| Zod | Esquemas de datos | MIT |
| Workbox (vía vite-plugin-pwa) | Service worker y caché sin conexión | MIT |
| Capacitor (`@capacitor/core`, `@capacitor/android`) | Envoltorio nativo Android | MIT |

## Herramientas de desarrollo (no viajan con la app)

Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), Testing Library (MIT),
jsdom (MIT), Pillow para `scripts/iconos.py` (MIT-CMU). El andamiaje del
proyecto Android (`apps/web/android`, Gradle) procede de la plantilla de
Capacitor (MIT); sus imágenes de muestra se han sustituido por las propias.

Las versiones exactas y las licencias de cada dependencia transitiva están en
`package-lock.json` y en el `package.json` de cada paquete dentro de
`node_modules` tras `npm ci`.

## Referencias científicas

Los instrumentos del catálogo citan su fuente (Moreno, 1934; Coie, Dodge y
Coppotelli, 1982; Arruga, 1974; Cerezo Ramírez, 2012; entre otras) en
`packages/nucleo/src/catalogo/index.ts`. Cómo se comprobó cada referencia está
en [docs/EVALUACION.md](docs/EVALUACION.md) §1.5.1. Son citas, no material
reproducido.

## Marca

EDUmind® es marca registrada de Luis Vilela Acuña y no se cede con el código
(ver [TRADEMARKS.md](TRADEMARKS.md)).
