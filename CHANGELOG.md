# Cambios

## 1.7.0 — 2026-09-26

**Hilo ya no tiene servidor.** Se retira entero el buzón ciego opcional que
existía desde la 1.3: la carpeta `apps/api` (Fastify + SQLite), su unidad de
systemd, el `location /api/` del vhost, la sincronización entre dispositivos
(`db/sync.ts`) y los sobres cifrados (`lib/sobres.ts`). Motivo: las dos cosas
que hacía ya las cubren piezas sin servidor. El QR de vuelta leído por cámara
sustituye al relé en vivo; la copia de seguridad cifrada, a la sincronización.
Así la promesa de privacidad no depende de que nadie configure nada: la app
compilada no contiene ninguna ruta de servidor y `pruebas/sin-servidor.mjs`
(también en el CI y en `desplegar.sh`) falla si vuelve a aparecer una.

- Sesión con tablets: desaparece el botón «Relé por servidor» y la nota «Relé
  activo»; la tablet solo muestra el QR de respuesta.
- Ajustes: desaparece la sección «Sincronizar entre mis dispositivos»; el
  texto de privacidad dice que no hay ninguna otra petición de red.
- Se conservan las seis formas de recoger, la copia cifrada, el análisis, el
  informe, la PWA sin conexión, la app nativa y la tabla de claves.
- Documentación al día: PRIVACIDAD (§1, §2.3, §2.5, §7), README,
  ARQUITECTURA, ROADMAP, CLAUDE.md, NOTICE, OPEN_SOURCE_RELEASE, DESPLIEGUE.
- Claves huérfanas retiradas de `i18n/gl.ts` y `en.ts` y del texto del
  alumnado (`entregadoServidor`).
- `CREDITS.md` se copia al dist al compilar: `/CREDITS.md` en el sitio es el
  fichero real, no el `index.html` del fallback.
- En un servidor que ya tuviera la API: `systemctl disable --now
  edumind-hilo-api`, quitar `location /api/` del vhost y borrar `data/`.

## 1.6.1 — 2026-09-26

Revisión con la rúbrica VCER (evaluación del 2026-09-25) para dejar la app
holgadamente en «Recomendable». Sin cambios de funcionamiento salvo el primero:

- **Lista de atención**: el ajuste perceptivo solo cuenta a los compañeros que
  ya han respondido, así la toma abierta no dice «cree que le eligen quienes no
  le eligen» por quien simplemente no ha participado. Prueba nueva.
- Coie, Dodge y Coppotelli (1982) como única referencia de los tipos
  sociométricos; la cifra de cohesión explica su denominador («r parejas
  recíprocas de m posibles»); «seis formas de recoger»; el aviso de la copia ya
  no muestra un `\n` literal.
- Coherencia: Ajustes, pie, README, NOTICE, CLAUDE.md y manifiesto dicen lo
  mismo que el código: local-first, sin servidor por defecto, con relé y
  sincronización opcionales que solo mueven sobres cifrados.
- PRIVACIDAD.md: qué guarda cada sitio (navegador, tablet, relé, buzón,
  servidor web) y durante cuánto tiempo.
- Accesibilidad: contraste AA en los tokens de la lámina (`--ink-3`, eyebrow,
  numeración, sellos, rótulos) y en la pantalla del alumnado (botón principal,
  «Volver a la toma»); ARIA en los QR, SVG decorativo y cabeceras de tabla
  vacías. axe-core sobre 19 pantallas: 0 violaciones.
- Material ajeno: `CREDITS.md`, `OFL.txt` junto a las fuentes, iconos y
  pantallas de arranque Android propios en vez de las imágenes de muestra de
  Capacitor.
- README: «Hecho con IA» (qué ha comprobado el autor) y «Cómo modificarlo».
- El pie enlaza los textos de las dos licencias y los créditos.

## 1.6.0 — 2026-09-14

Corregir y anular lo ya transcrito. En la pantalla de transcripción aparece la
lista de quienes ya están metidos: «corregir» abre sus elecciones con las
fichas puestas para cambiarlas, y «anular» las deshace y devuelve al alumno a
la lista de pendientes. Antes, una transcripción equivocada no tenía vuelta
atrás.

Ni una cosa ni otra borra filas: la participación y las respuestas quedan
marcadas con `deleted_at`, como el resto del modelo, para que la copia y la
sincronización sigan resolviendo por «último en escribir gana».

## 1.5.1 — 2026-09-06

La guardia de orígenes externos admite el DOI de una referencia como texto.

Referencias del catálogo comprobadas contra fichas editoriales y
bibliográficas; corregidas Arruga (1974), Bull-S (Cerezo Ramírez, 2012,
versión 2.2, con ISBN), Bukowski («Friendships») y González Álvarez (título
catalán, ISBN). Fuentes en docs/EVALUACION.md.

## 1.5.0 — 2026-09-06

- Preguntas propias del docente en cada toma: etiqueta, texto, ayuda, tipo
  (preferencia o percepción) y formulación negativa en secundaria. El análisis
  las trata como a las canónicas; la percepción propia cuenta para el ajuste.
- Cuestionarios reutilizables («Mis cuestionarios»), en la copia y en la
  sincronización.
- Catálogo de instrumentos con referencia científica (Moreno; Coie, Dodge y
  Coppotelli; percepción sociométrica de Arruga y González; amistad recíproca;
  bloque sociométrico del Bull-S; formación de equipos cooperativos), con
  avisos cuando rompen la asepsia por defecto. Página «Catálogo».

## 1.4.0 — 2026-09-06

Andamiaje de la app nativa con Capacitor: proyecto Android versionado,
`npm run nativo:sync` compila la web a un directorio real y la copia al
proyecto. Compilar el APK requiere Android Studio o el SDK en la máquina.

## 1.3.0 — 2026-09-06

Fase 4, opcional: primer backend. `apps/api` es un buzón ciego (Fastify +
SQLite) que solo guarda ciphertext: relé en vivo para que las tablets entreguen
solas, y sincronización entre los dispositivos del docente sin cuentas, con
un token secreto del que el servidor solo conoce el hash. Todo lo anterior
sigue funcionando sin él.

## 1.2.0 — 2026-09-06

Portal del docente en gallego e inglés (patrón gettext: el castellano es la
clave; lo que falte sale en castellano). Selector en Ajustes, guardado en la
base local. El informe descargable sigue en castellano.

## 1.1.0 — 2026-09-06

- Fuentes Archivo, JetBrains Mono, Fraunces y Space Grotesk incrustadas
  (woff2, OFL); el informe descargado las lleva dentro en base64.
- XLSX directo sin librería (lector de ZIP y XML propio) en listas y matrices.
- Hoja de marcas de grupo: la matriz completa de una situación en un A4,
  hasta 30 alumnos, leída de una foto y registrada por situación.
- Cartas para el alumnado (código, QR y enlace de la prueba, instrucciones de
  la tarea) y etiquetas recortables de códigos, 24 por hoja.
- La entrega de la prueba pasa a fichero .txt, que Moodle acepta en cualquier
  configuración, con opción de copiar el texto para tareas de texto en línea.

## 1.0.0 — 2026-09-05

Primera versión completa: fases 0 a 3. Evaluación por fases en
`docs/EVALUACION.md`. Sin cambios de código respecto a 0.4.0.

## 0.4.0 — 2026-09-05

Fase 3. Prueba con código de acceso y entregas cifradas con clave pública,
comparador de tomas, trayectoria, importación desde MiClase y CSV, inglés.

## 0.3.0 — 2026-09-05

Fase 2. Grafo de fuerzas en SVG, ficha de alumno con notas y trayectoria,
informe de grupo autocontenido.

## 0.2.0 — 2026-09-05

Fase 1. Sesión con tablets por QR de ida y vuelta, hojas de marcas impresas
y leídas con la cámara, teclado de transcripción, copia de seguridad cifrada.

## 0.1.0 — 2026-09-05

Fase 0. Grupos, tomas, modalidad de un dispositivo, análisis completo, copia
de seguridad. Sin servidor.
