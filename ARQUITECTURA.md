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

- **Nueva modalidad de recogida** (QR, hoja de marcas, fichero): produce
  `Eleccion[]` para un alumno y llama a `registrarRespuestas` con su `origen`.
  Nada más cambia. La codificación compacta ya está en `nucleo/codificacion.ts`.
- **Nueva situación**: añadirla a `SITUACIONES`, escribir sus textos en los dos
  idiomas y tres registros; la prueba del cuestionario falla hasta que estén.
- **Nuevo idioma**: un objeto más en `CUESTIONARIOS` y `TEXTOS_ALUMNO`.
- **Nuevo índice**: función pura en `sociometria/` con su prueba.
- **Sincronización o relé** (fase 4): workspace `apps/api` con buzón ciego
  (patrón de MiClase). Las tablas ya llevan lo que ese mecanismo necesita.

## Invariantes que no se rompen

- La pantalla del alumnado no muestra resultados ni la palabra «sociograma».
- El propio alumno no aparece en su lista.
- Ninguna toma con negativas fuera de secundaria.
- Ningún origen externo en la app compilada.
- Ninguna institución en la firma (`pruebas/cadenas-prohibidas.mjs`).
