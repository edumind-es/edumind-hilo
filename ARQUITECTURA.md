# Arquitectura de EDUmind Hilo

## Principios

1. **Sin servidor en el aula.** Hilo es una PWA estática. Cualquier función que
   necesite red es opcional y llega después (fase 4), como workspace aparte.
2. **El núcleo no conoce el navegador.** `packages/nucleo` es TypeScript puro:
   tipos, esquemas Zod, cuestionario, códigos, motor sociométrico y codificación
   compacta. Se prueba en Node en milisegundos. Todo lo que se pueda calcular
   sin DOM vive ahí.
3. **Una sola fuente de verdad sobre la validez de los datos:** los esquemas
   Zod. Lo que entra por importación, fichero o QR pasa por ellos.
4. **Registros con `updated_at` y `deleted_at` desde el primer día.** Los
   borrados son registros marcados, nunca ausencias. Así la fusión de copias y
   la futura sincronización usan la misma regla: último en escribir gana.
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
  lib/                 barajar, voz, fechas, descargar
pruebas/               Guardias del repositorio (cadenas prohibidas, orígenes externos)
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
5. La vista de la toma calcula el análisis con `analizar()` sobre los registros
   vivos. No se persiste: se recalcula, y es instantáneo.

## Cómo ampliar

- **Nueva modalidad de recogida**: produce elecciones por código de alumno y
  llama a `registrarDesdeCodigos` (`apps/web/src/db/recoger.ts`) con su
  `origen`. Nada más cambia. Las tres de fase 1 (QR, hoja, transcripción)
  entran por ahí.
- **Nueva situación**: añadirla a `SITUACIONES`, escribir sus textos en los dos
  idiomas y tres registros; la prueba del cuestionario falla hasta que estén.
- **Nuevo idioma**: un objeto más en `CUESTIONARIOS` y `TEXTOS_ALUMNO`.
- **Nuevo índice**: función pura en `sociometria/` con su prueba.
- **Sincronización o relé** (fase 4): workspace `apps/api` con buzón ciego
  (patrón de MiClase). Las tablas ya llevan lo que ese mecanismo necesita.

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

## Fase 4 (opcional): el buzón ciego

`apps/api` (Fastify 5 + better-sqlite3, puerto 3280 solo local, nginx en
`/api/`). Dos usos, mismo principio: el servidor guarda sobres que no puede
abrir.

- **Relé** (`rutas/rele.js`): `POST /api/rele/sesiones` da un código; las
  tablets hacen `POST /api/rele/:codigo/sobres` con el ciphertext (clave en el
  QR, `lib/sobres.ts`); el docente lee por `GET …/sobres?desde=seq` cada 3 s
  desde `SesionQr`. Caducidad 2 h, 300 sobres, limpieza cada minuto.
- **Buzón** (`rutas/buzon.js`): `Authorization: Bearer <token>`; el servidor
  guarda `sha256(token)` como id. `PUT /api/buzon/registros` (LWW por
  `updated_at`, cuotas) y `GET …?desde=seq`. El cliente (`db/sync.ts`) cifra
  cada registro con la clave HKDF del token y fusiona con `fusionar()`, la
  misma regla que la copia de seguridad. Cursores en `ajustes`.
- **Invariante**: la página de la tablet solo llama a la red si el QR trae
  `r=` y `k=`; sin relé no hay ninguna petición, y la prueba lo vigila.
- **Operación**: `deploy/edumind-hilo-api.service`, alta con
  `.edumind_ops/hilos_api_install.py`; `desplegar.sh` reinicia la API solo si
  `apps/api` cambió.

## Invariantes que no se rompen

- La pantalla del alumnado no muestra resultados ni la palabra «sociograma».
- El propio alumno no aparece en su lista.
- Ninguna toma con negativas fuera de secundaria.
- Ningún origen externo en la app compilada.
- Ninguna institución en la firma (`pruebas/cadenas-prohibidas.mjs`).
