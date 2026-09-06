# Evaluación por fases · Hilo 1.0

Qué se comprobó al cerrar cada fase, cómo, y qué queda sin comprobar. Escrito
para que quien retome el proyecto sepa dónde fiarse y dónde mirar.

Método común a todas las fases: tipos estrictos (`noUncheckedIndexedAccess`),
pruebas unitarias en el núcleo y en la web, dos guardias del repositorio
(cadenas prohibidas, ningún origen externo en la app compilada), CI obligatorio
en `main`, despliegue con comprobación contra la URL pública y vuelta atrás.

| Fase | Versión | Pruebas | Desplegada | Estado |
|---|---|---|---|---|
| F0 · Un dispositivo | 0.1.0 | 30 | sí | verificada en uso real por el autor |
| F1 · Aula (QR, hoja, transcripción) | 0.2.0 | 44 | sí | QR y transcripción verificados en pruebas; hoja de marcas solo con hojas sintéticas |
| F2 · Lectura (grafo, ficha, informe) | 0.3.0 | 49 | sí | verificada con grupos sintéticos |
| F3 · Tiempo y aula virtual | 0.4.0 | 58 | sí | criptografía verificada; flujo Moodle pendiente de una prueba real |

## F0 · Un dispositivo

- **Cubre**: grupos, códigos, tomas por registro, cuestionario es/gl, pantalla
  del alumnado, análisis completo, copia de seguridad.
- **Verificado**: motor sociométrico contra casos construidos a mano (recibidas,
  reciprocidad, cohesión, subgrupos y puentes, Coie y Dodge); el esquema
  rechaza negativas fuera de secundaria; la pantalla del alumnado nunca
  muestra al propio alumno ni la palabra «sociograma» y no deja pasar del
  máximo; el banco de situaciones no contiene palabras que señalen ni pidan
  motivo.
- **Sin verificar por automatismo**: legibilidad a seis metros en una PDI real
  (la tipografía sigue la especificación Alumno, pero no se ha medido).

## F1 · Aula

- **Cubre**: sesión con tablets por QR de ida y vuelta, hoja de marcas,
  transcripción, copia cifrada.
- **Verificado**: el paquete de sesión de 30 alumnos cabe en un QR proyectable
  (< 600 caracteres); la página de la tablet borra el fragmento del historial y
  no llama a `fetch`; la codificación compacta de respuestas hace ida y vuelta
  y rechaza lo mal formado; la lectura de hojas reconoce marcadores, corrige
  giro y desplazamiento y clasifica burbujas en hojas sintéticas de hasta 32
  filas; el cifrado de la copia no abre con otra contraseña.
- **Sin verificar**: la lectura de hojas **con fotos reales** (luz de aula,
  sombras, arrugas, tinta de impresora). Los umbrales `UMBRAL_LLENA` y
  `UMBRAL_VACIA` en `nucleo/hoja/lectura.ts` son los que hay que ajustar con
  una foto de verdad. La confirmación hoja a hoja existe precisamente porque
  esta parte no está validada en campo.
- **Decisión**: negativas solo en tablets, dispositivo y transcripción; la hoja
  de marcas recoge solo positivas.

## F2 · Lectura

- **Cubre**: grafo de fuerzas, ficha de alumno con notas, informe autocontenido.
- **Verificado**: la disposición del grafo es determinista y deja a los
  vinculados más cerca que a los sueltos; el informe escapa los nombres, no
  referencia orígenes externos y es un documento completo.
- **Sin verificar**: legibilidad del grafo con 30 nodos en un A4 impreso (el
  tamaño de nodo y de texto se eligieron a ojo).

## F3 · Tiempo y aula virtual

- **Cubre**: prueba con código y entregas cifradas, comparador, trayectoria,
  importación desde MiClase y CSV, inglés.
- **Verificado**: solo la clave privada del docente abre una entrega (otra
  clave falla); la clave pública compacta cabe en el enlace; los importadores
  leen CSV con comillas y separadores distintos, listas con y sin cabecera,
  matrices de otras herramientas y exportaciones de MiClase conservando
  códigos válidos; el cuestionario en inglés pasa el mismo filtro de palabras
  prohibidas.
- **Sin verificar**: el flujo completo alumno → Moodle → docente con una tarea
  real (descarga en tablets del centro, subida a la tarea, descarga en lote).
  La parte que depende de Moodle es solo mover ficheros; la de Hilo está
  probada en unidad.
- **Decisión**: la prueba es un enlace a la app estática, y el fichero HTML
  descargable solo lo abre. Se descartó incrustar la app entera en un HTML
  para no mantener dos pantallas del alumnado.

## 1.1 · Pendientes cerrados (2026-09-06)

- **Fuentes incrustadas**: verificado que la app compilada no referencia
  ningún origen externo y que el informe descargado lleva las fuentes dentro.
- **XLSX**: lector propio probado con dos libros generados con openpyxl
  (lista con cabecera, matriz con números y marcas); rechaza lo que no es ZIP.
- **Hoja de grupo**: geometría probada hasta 30 alumnos con burbujas de 4 mm;
  la lectura reutiliza el mismo motor que la individual, así que hereda su
  estado: probada con hojas sintéticas, pendiente de foto real.
- **Cartas y etiquetas**: solo maquetación para impresión; sin prueba
  automática. Conviene imprimir una y medir que las etiquetas caen en la
  retícula de 70 × 37 mm.
- **Entrega .txt**: cambio de nombre y tipo; el contenido y el cifrado son los
  mismos que ya estaban probados.

## 1.2 · Portal en gallego e inglés

- Diccionarios con las mismas claves en los dos idiomas y marcadores de
  interpolación conservados (prueba automática). Traducción hecha por pase
  automático sobre los textos completos de cada página; lo que no es un texto
  completo (frases con elementos anidados) queda en castellano. Las etiquetas
  del núcleo (situaciones, registros, posiciones, tipos, motivos) se traducen
  al mostrarse. Sin revisión por hablante nativo de gallego: conviene una
  lectura.

## Lo que queda fuera de 1.0

- Relé cifrado y sincronización entre dispositivos (F4, opcional, primer backend).
- App nativa con Capacitor.
- Hoja de marcas de grupo (matriz completa en una hoja).
- Portal del docente en gallego e inglés.
- XLSX directo (hoy: guardar como CSV).
- Fuentes Archivo, JetBrains Mono, Fraunces y Space Grotesk incrustadas.
