# EDUmind Hilo

**Sociograma de aula local-first, sin servidor por defecto.** El alumnado responde a
preguntas asépticas en una sesión; el docente lee, en su propio dispositivo, la
trama de vínculos del grupo y cómo cambia a lo largo del curso.

> **Los datos del alumnado no salen del dispositivo del docente.** No es una
> promesa: es la arquitectura. Hilo es una aplicación web estática sin cuentas
> ni base de datos remota. Las dos únicas funciones con servidor (relé para
> tablets y sincronización entre los dispositivos del docente) son opcionales,
> se activan con un botón y solo envían sobres cifrados que el servidor no
> puede abrir. Ver [PRIVACIDAD.md](PRIVACIDAD.md).

Hilo es el hilo invisible que une a un grupo.

## Qué hace

- **Grupos** creados pegando una lista de nombres. Cada alumno recibe un código
  de cinco caracteres, el único dato que sale del dispositivo (en QR o en papel).
- **Cuestionario aséptico** por situaciones (equipo, recreo, ayuda, espejo,
  viaje), en tres registros por edad y en castellano, gallego e inglés. Sin
  motivo, sin ranking, sin resultados para el alumnado. Nominaciones negativas
  bloqueadas en Primaria por diseño; en Secundaria solo por activación expresa.
- **Preguntas propias y catálogo.** El docente añade sus preguntas
  (preferencia o percepción), las guarda como cuestionario reutilizable, o parte
  de un instrumento del catálogo con referencia científica: Moreno, Coie y
  Dodge, percepción sociométrica, amistad recíproca, Bull-S (bloque
  sociométrico), equipos cooperativos.
- **Seis formas de recoger, ninguna necesita servidor**: en el dispositivo del
  docente pasándolo de mano en mano; con tablets, proyectando un QR que lleva
  la lista y leyendo con la cámara el QR de respuesta de cada tablet; con
  hojas de marcas impresas que la cámara lee; transcribiendo del papel con un
  teclado rápido; con una prueba por el aula virtual cuyas entregas vienen
  cifradas con la clave pública del docente; o importando una matriz CSV de
  otra herramienta.
- **Análisis en el navegador**: matriz sociométrica, elecciones recibidas,
  reciprocidad, cohesión, ajuste perceptivo, subgrupos, puentes y lista de
  atención. Con negativas, los tipos de Coie y Dodge.
- **Lectura en el tiempo**: comparador de dos tomas y trayectoria de cada
  alumno con los eventos del grupo sobre la misma línea. Informe de grupo
  autocontenido en HTML.
- **Copia de seguridad** cifrada con contraseña (AES-256), importable en otro
  dispositivo con fusión por fecha de modificación. Importa grupos desde
  MiClase y listas desde CSV.
- **Cuestionario en castellano, gallego e inglés**, en tres registros por edad.
- **Funciona sin conexión**: PWA instalable. No carga nada de ningún origen
  externo; el CI lo comprueba.

Lo que queda (compilar la app nativa, validar la hoja de marcas en aula) está en [ROADMAP.md](ROADMAP.md). El diseño completo, con la
justificación pedagógica y la arquitectura, está en
[docs/lamina-diseno.html](docs/lamina-diseno.html).

## Arquitectura en tres líneas

```
packages/nucleo/   Modelo, esquemas Zod, cuestionario es/gl, códigos, motor
                   sociométrico, codificación compacta. Puro. Sin navegador.
apps/web/          PWA React + Vite. Portal del docente (EDUmind-Lámina) y
                   pantalla del alumnado (EDUmind-Alumno). IndexedDB vía Dexie.
```

```
apps/api/          Opcional. Buzón ciego (Fastify + SQLite): relé en vivo y
                   sincronización entre dispositivos del docente. Solo ciphertext.
```

Todo funciona sin `apps/api`; es una comodidad que el docente activa. Ver
[ARQUITECTURA.md](ARQUITECTURA.md).

## Arrancar en local

Requiere **Node 22** o superior.

```bash
git clone https://github.com/edumind-es/edumind-hilo.git
cd edumind-hilo
npm install
git config core.hooksPath .githooks   # ganchos: pruebas rápidas y guardián de secretos
npm run dev                            # http://localhost:5190
```

```bash
npm test          # cadenas prohibidas + núcleo + web
npm run typecheck
npm run build     # apps/web/dist
```

## Cómo modificarlo

Todo el código está en español y cada módulo explica en su cabecera qué hace
y por qué. El detalle está en [ARQUITECTURA.md](ARQUITECTURA.md) §«Cómo
ampliar»; en corto:

- **Una situación nueva del cuestionario**: añadirla a `SITUACIONES`
  (`packages/nucleo/src/tipos.ts`) y escribir sus textos en
  `packages/nucleo/src/cuestionario/textos.ts`, en los tres idiomas y tres
  registros; la prueba falla hasta que estén todos. Las preguntas propias del docente no necesitan
  código: se crean en la propia toma.
- **Un instrumento nuevo en el catálogo**: una entrada más en
  `packages/nucleo/src/catalogo/index.ts`, con su referencia.
- **Un idioma nuevo**: en el núcleo, añadirlo a `IDIOMAS` y a `CUESTIONARIOS`
  y `TEXTOS_ALUMNO`; en el portal, un diccionario más en
  `apps/web/src/i18n/` (patrón gettext: la clave es el castellano; lo que
  falte sale en castellano, así nada se rompe).
- **Un índice sociométrico nuevo**: función pura en
  `packages/nucleo/src/sociometria/` con su prueba.
- **Una forma nueva de recoger respuestas**: produce elecciones por código de
  alumno y llama a `registrarDesdeCodigos` (`apps/web/src/db/recoger.ts`).
- **Tipografías y colores**: `apps/web/public/fonts/` (con su `OFL.txt`) y los
  tokens de `apps/web/src/estilos/base.css` (portal) y `alumno.css` (alumnado).
  Los tokens «-tinta» cumplen contraste AA para texto; no los cambies por los
  colores de las franjas.
- **Compilar y publicar**: `npm ci && npm run build` deja `apps/web/dist`, que
  se sirve desde cualquier servidor web estático con HTTPS (ver
  [DESPLIEGUE.md](DESPLIEGUE.md)). La PWA funciona sin conexión tras la
  primera visita.
- **Prescindir del servidor opcional**: basta con no desplegar `apps/api`.
  Todo lo demás funciona igual; los botones «Relé por servidor» (Sesión con
  tablets) y la sección «Sincronizar entre mis dispositivos» (Ajustes)
  responderán con un error al pulsarlos. Para retirarlos de la interfaz, quita
  ese botón en `apps/web/src/paginas/SesionQr.tsx` y esa sección en
  `apps/web/src/paginas/Ajustes.tsx`; el resto no depende de ellos.

## Documentación

| Documento | Para qué |
|---|---|
| [PRIVACIDAD.md](PRIVACIDAD.md) | Qué datos se tratan, dónde viven y quién puede leerlos |
| [ARQUITECTURA.md](ARQUITECTURA.md) | Decisiones técnicas, invariantes y cómo ampliar |
| [ROADMAP.md](ROADMAP.md) | Qué está hecho y qué viene, por fases |
| [DESPLIEGUE.md](DESPLIEGUE.md) | Puesta en producción como sitio estático |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo colaborar |
| [CREDITS.md](CREDITS.md) | Material ajeno: tipografías (OFL), bibliotecas y sus licencias |
| [docs/lamina-diseno.html](docs/lamina-diseno.html) | Lámina de aplicación FIG. 13: el diseño completo |
| [docs/EVALUACION.md](docs/EVALUACION.md) | Qué se comprobó al cerrar cada fase y qué queda sin comprobar |

## Hecho con IA

Este recurso se ha desarrollado con *vibe coding* con asistencia de IA (Claude
Code y ChatGPT). Lo que ha comprobado el autor:

- **Pruebas automáticas**: 85 (55 del núcleo, 24 de la web, 6 de la API), que
  corren en local (`npm test`) y en el CI de GitHub Actions en cada cambio,
  junto con los tipos estrictos y la compilación.
- **Dos guardias del repositorio**: ninguna cadena prohibida en la firma
  (`pruebas/cadenas-prohibidas.mjs`) y ningún origen externo en la app
  compilada (`pruebas/sin-origenes-externos.mjs`).
- **Textos que ve el alumnado**: revisados por el autor y protegidos por una
  prueba (sin motivo, sin ranking, sin la palabra «sociograma»).
- **Referencias del catálogo**: contrastadas una a una contra fichas
  editoriales y bibliográficas ([docs/EVALUACION.md](docs/EVALUACION.md) §1.5.1).
- **Licencias del material ajeno**: revisadas y acreditadas en
  [CREDITS.md](CREDITS.md).
- **Ejecución en navegador**, fase a fase, y uso real de la fase 0 por el
  autor, con lo que quedó sin comprobar escrito en
  [docs/EVALUACION.md](docs/EVALUACION.md) (la traducción al gallego no la ha
  revisado un hablante nativo; la hoja de marcas, solo con hojas sintéticas).
- **Accesibilidad**: axe-core (WCAG 2.x A/AA) sobre 19 pantallas de la app
  compilada, 0 violaciones, y recorrido completo con teclado (2026-09-26).

Política de uso de IA de EDUmind: https://edumind.es/es/legal/ia

## Colaborar

Se agradece especialmente la ayuda del profesorado y de orientación en:

- **Probar en aula real** y contar qué falla, en
  [Issues](https://github.com/edumind-es/edumind-hilo/issues).
- **Revisar la redacción de las situaciones**: son el corazón del instrumento.
- **Traducción** (catalán, euskera, valenciano, inglés).
- Código: ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

Licencia doble **AGPL-3.0-or-later** *o* **EUPL-1.2**, a elección de quien la
reutilice. Ver [LICENSE](LICENSE) y [NOTICE](NOTICE). El material ajeno
(tipografías OFL y bibliotecas) está acreditado en [CREDITS.md](CREDITS.md).

EDUmind® es marca registrada. El código es libre; la marca y los logotipos no
se ceden con él — ver [TRADEMARKS.md](TRADEMARKS.md).

Por **Luis Vilela Acuña** — maestro de Educación Física (Pontevedra).
