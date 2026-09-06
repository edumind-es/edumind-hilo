# Cambios

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
