# Arquitectura de EDUmind Hilo

## Principios

1. **Sin servidor.** Hilo es una PWA estática y no tiene API. Lo que viaja
   entre dispositivos va por luz (QR) o en una copia de seguridad cifrada.
   La compilación se comprueba: ninguna ruta `/api/`, ningún origen externo.
2. **El núcleo no conoce el navegador.** `packages/nucleo` es TypeScript puro:
   tipos, esquemas Zod, cuestionario, códigos, motor sociométrico y codificación
   compacta. Se prueba en Node en milisegundos. Todo lo que se pueda calcular
   sin DOM vive ahí.
3. **Una sola fuente de verdad sobre la validez de los datos:** los esquemas
   Zod. Lo que entra por importación, fichero o QR pasa por ellos.
4. **Registros con `updated_at` y `deleted_at` desde el primer día.** Los
   borrados son registros marcados, nunca ausencias. Así la fusión de copias
   usa una sola regla: último en escribir gana.
5. **Dos pieles, un sistema.** Portal del docente en EDUmind-Lámina (papel,
   tinta, filete; sin radios ni sombras). Pantalla del alumnado en
   EDUmind-Alumno (color vivo, radio, tipografía cálida), acotada a
   `.modo-alumno`.
6. **Nada de ningún origen externo.** Ni fuentes, ni CDN, ni analíticas. El CI
   lo comprueba sobre el directorio compilado.

## Estructura

```
packages/nucleo/src/
  tipos.ts             Modelo de dominio
  esquemas.ts          Zod: validación y reglas (negativas solo en secundaria…)
  codigos.ts           Códigos de alumno de 5 caracteres, sin ambigüedad
  lista.ts             De texto pegado a lista de nombres
  codificacion.ts      Respuestas de un alumno en una línea (QR, ficheros)
  cuestionario/        Banco de situaciones es/gl por registro; textos del alumnado
  sociometria/         Índices, reciprocidad, cohesión, subgrupos, puentes, Coie-Dodge
apps/web/src/
  db/                  Dexie (IndexedDB), consultas transaccionales, hooks, copia
  alumno/              PantallaAlumno: componente puro, probado con jsdom
  paginas/             Inicio, Grupo, Toma, Responder, Ajustes
  componentes/         Marco (Lámina) y Firma
  estilos/             base.css (Lámina) y alumno.css (Alumno)
  lib/                 barajar, voz, fechas, descargar, cifrado de la copia
pruebas/               Guardias del repositorio (cadenas prohibidas, orígenes externos, sin servidor)
```

## Flujo de una toma (fase 0)

1. El docente crea un grupo pegando nombres. `crearGrupoDesdeLista` genera
   códigos únicos y escribe grupo y alumnos en una transacción.
2. Crea una toma: etapa, situaciones, máximo de elecciones, negativas (solo
   secundaria). `esquemaToma` la valida antes de guardarla.
3. En «Responder en este dispositivo» elige al alumno que va a responder y le
   entrega la tablet. `PantallaAlumno` no ve la base de datos: recibe personas y
   devuelve elecciones.
4. `registrarRespuestas` escribe participación y respuestas en una transacción
   y rechaza una segunda participación del mismo alumno en la misma toma.
5. Si una hoja se transcribió mal, «corregir» en la pantalla de transcripción
   recarga las elecciones del alumno y `reemplazarRespuestas` sustituye las
   suyas enteras; «anular» las deshace con `anularParticipacion` y el alumno
   vuelve a pendientes. Ninguna de las dos borra filas: marcan `deleted_at`.
6. La vista de la toma calcula el análisis con `analizar()` sobre los registros
   vivos. No se persiste: se recalcula, y es instantáneo.

## Cómo ampliar

- **Nueva modalidad de recogida**: produce elecciones por código de alumno y
  llama a `registrarDesdeCodigos` (`apps/web/src/db/recoger.ts`) con su
  `origen`. Nada más cambia. Las tres de fase 1 (QR, hoja, transcripción)
  entran por ahí.
- **Nueva situación canónica**: añadirla a `SITUACIONES`, escribir sus textos
  en los tres idiomas y tres registros; la prueba del cuestionario falla hasta
  que estén. Para preguntas del docente no hace falta código: son
  `PreguntaToma` dentro de la toma (`id` propio, `tipo` preferencia o
  percepción); `esPercepcion`, `textoSituacion` y `etiquetaSituacion` las
  resuelven, y `analizar()` recibe `preguntas`.
- **Nuevo instrumento del catálogo**: una entrada en `nucleo/catalogo/` con
  referencia; la prueba comprueba que produce una toma válida en sus etapas.
- **Nuevo idioma**: un objeto más en `CUESTIONARIOS` y `TEXTOS_ALUMNO`.
- **Nuevo índice**: función pura en `sociometria/` con su prueba.

## Fase 1: lo que hay detrás de cada modalidad

- **Tablets.** `nucleo/sesion.ts` empaqueta la lista y la configuración
  (deflate + base64url) en `/s#g=…`. `SesionAlumno` lo lee, lo borra del
  historial y, al terminar, muestra un QR con `codificarRespuestas`. `Escanear`
  lo lee con jsQR y lo registra.
- **Hoja de marcas.** `nucleo/hoja/diseno.ts` da la geometría en mm; `Hojas`
  la imprime y `nucleo/hoja/lectura.ts` la lee: marcadores por blob más
  cuadrado de cada esquina, homografía por DLT, muestreo de cada burbuja
  frente al papel que la rodea, umbral doble (llena, vacía, dudosa). El QR de
  la hoja lleva el orden de filas, así la lectura no depende de que el grupo
  no haya cambiado desde que se imprimió. La confirmación hoja a hoja es
  obligatoria y el docente corrige antes de registrar.
- **Transcripción.** `lib/buscar.ts` para el prefijo sin acentos; los pasos
  salen de `construirPasos`, los mismos que ve el alumnado.

## Fase 3

- **Prueba con código (modalidad D).** `Prueba` construye `/p#g=…&k=…`: el
  mismo paquete de sesión más la clave pública del docente (`lib/clavePublica.ts`,
  ECDH P-256). `PruebaAlumno` pide el código, reutiliza `PantallaAlumno` y
  cifra la respuesta con un par efímero; `Entregas` la abre con la privada
  (`db/claves.ts`, tabla `claves`, versión 2 de Dexie) y la registra por
  `registrarDesdeCodigos`. Decisión: la prueba es un enlace a la app estática,
  no un HTML con la app dentro; el fichero HTML descargable solo lo abre.
  Así no hay dos implementaciones de la pantalla del alumnado.
- **Tiempo.** `Comparar` y la trayectoria de `FichaAlumno` recalculan
  `analizar()` por toma; nada se persiste. `informe/trayectoriaSvg.ts` dibuja
  la línea con los eventos del grupo.
- **Importación.** `nucleo/importacion/`: CSV sin librerías (listas y
  matrices) y lectura de la exportación de MiClase (solo grupos y alumnos);
  `db/importar.ts` decide qué es cada fichero.

## Fase 4: retirada (1.7.0)

Entre la 1.3 y la 1.6 existió `apps/api`, un buzón ciego opcional (Fastify +
SQLite, solo ciphertext) con dos usos: relé en vivo para que las tablets
entregaran solas y sincronización entre dispositivos del docente. Se retiró
entero en la 1.7.0: el QR de vuelta leído por cámara sustituye al relé y la
copia de seguridad cifrada sustituye a la sincronización. Con ello Hilo es una
PWA estática pura, sin proceso que mantener ni base de datos en el servidor.
`pruebas/sin-servidor.mjs` impide que vuelva a entrar una ruta `/api/`.

## Invariantes que no se rompen

- La pantalla del alumnado no muestra resultados ni la palabra «sociograma».
- El propio alumno no aparece en su lista.
- Ninguna toma con negativas fuera de secundaria.
- Ningún origen externo ni ninguna ruta de servidor en la app compilada.
- Ninguna institución en la firma (`pruebas/cadenas-prohibidas.mjs`).
