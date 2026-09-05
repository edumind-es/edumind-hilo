# EDUmind Hilo

**Sociograma de aula local-first y sin servidor.** El alumnado responde a
preguntas asépticas en una sesión; el docente lee, en su propio dispositivo, la
trama de vínculos del grupo y cómo cambia a lo largo del curso.

> **Los datos del alumnado no salen del dispositivo del docente.** No es una
> promesa: es la arquitectura. Hilo es una aplicación web estática. No tiene
> servidor, no tiene base de datos remota, no tiene cuentas. Ver
> [PRIVACIDAD.md](PRIVACIDAD.md).

Hilo es el hilo invisible que une a un grupo.

## Qué hace

- **Grupos** creados pegando una lista de nombres. Cada alumno recibe un código
  de cinco caracteres, el único dato que sale del dispositivo (en QR o en papel).
- **Cuestionario aséptico** por situaciones (equipo, recreo, ayuda, espejo,
  viaje), en tres registros por edad y en castellano y gallego. Sin motivo, sin
  ranking, sin resultados para el alumnado. Nominaciones negativas bloqueadas en
  Primaria por diseño; en Secundaria solo por activación expresa.
- **Toma en un dispositivo**: el docente pasa la tablet y cada alumno responde
  en una pantalla pensada para su edad.
- **Análisis en el navegador**: matriz sociométrica, elecciones recibidas,
  reciprocidad, cohesión, ajuste perceptivo, subgrupos, puentes y lista de
  atención. Con negativas, los tipos de Coie y Dodge.
- **Copia de seguridad** en JSON, importable en otro dispositivo con fusión por
  fecha de modificación.
- **Funciona sin conexión**: PWA instalable. No carga nada de ningún origen
  externo; el CI lo comprueba.

Lo que viene (tablets por QR de ida y vuelta, hoja de marcas leída con la
cámara, prueba con código de acceso cifrada para el aula virtual, lectura
longitudinal) está en [ROADMAP.md](ROADMAP.md). El diseño completo, con la
justificación pedagógica y la arquitectura, está en
[docs/lamina-diseno.html](docs/lamina-diseno.html).

## Arquitectura en tres líneas

```
packages/nucleo/   Modelo, esquemas Zod, cuestionario es/gl, códigos, motor
                   sociométrico, codificación compacta. Puro. Sin navegador.
apps/web/          PWA React + Vite. Portal del docente (EDUmind-Lámina) y
                   pantalla del alumnado (EDUmind-Alumno). IndexedDB vía Dexie.
```

No hay `apps/api`. Si algún día hace falta un relé opcional (fase 4), nacerá
como workspace aparte y el resto no cambia. Ver [ARQUITECTURA.md](ARQUITECTURA.md).

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

## Documentación

| Documento | Para qué |
|---|---|
| [PRIVACIDAD.md](PRIVACIDAD.md) | Qué datos se tratan, dónde viven y quién puede leerlos |
| [ARQUITECTURA.md](ARQUITECTURA.md) | Decisiones técnicas, invariantes y cómo ampliar |
| [ROADMAP.md](ROADMAP.md) | Qué está hecho y qué viene, por fases |
| [DESPLIEGUE.md](DESPLIEGUE.md) | Puesta en producción como sitio estático |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo colaborar |
| [docs/lamina-diseno.html](docs/lamina-diseno.html) | Lámina de aplicación FIG. 13: el diseño completo |

## Colaborar

Se agradece especialmente la ayuda del profesorado y de orientación en:

- **Probar en aula real** y contar qué falla, en
  [Issues](https://github.com/edumind-es/edumind-hilo/issues).
- **Revisar la redacción de las situaciones**: son el corazón del instrumento.
- **Traducción** (catalán, euskera, valenciano, inglés).
- Código: ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

Licencia doble **AGPL-3.0-or-later** *o* **EUPL-1.2**, a elección de quien la
reutilice. Ver [LICENSE](LICENSE) y [NOTICE](NOTICE).

EDUmind® es marca registrada. El código es libre; la marca y los logotipos no
se ceden con él — ver [TRADEMARKS.md](TRADEMARKS.md).

Por **Luis Vilela Acuña** — maestro de Educación Física (Pontevedra).
