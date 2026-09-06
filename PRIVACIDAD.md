# Privacidad y protección de datos — EDUmind Hilo

Este documento describe **qué datos maneja la aplicación, dónde se guardan y
quién puede leerlos**. Está escrito para el docente que la usa, para la persona
responsable de protección de datos del centro y para quien audite el código.

No es asesoramiento jurídico: es la descripción técnica de cómo funciona el
programa. Todo lo que se afirma aquí es comprobable en el código fuente y buena
parte está cubierto por pruebas automáticas.

Última revisión: 5 de septiembre de 2026 · versión 1.0.

## 1. El principio de diseño

**Los datos del alumnado no salen del dispositivo del docente.**

Hilo es una aplicación web estática: un conjunto de ficheros que el navegador
descarga una vez y ejecuta en local. No existe ningún servidor de Hilo que
reciba datos, ninguna base de datos remota, ninguna cuenta de usuario. Todo el
sociograma vive en el almacenamiento del propio navegador (IndexedDB) del
dispositivo del docente.

Contrapartida: **si el docente pierde el dispositivo y no tiene copia de
seguridad, los datos se pierden.** Es el precio de que nadie más los tenga. Por
eso la aplicación insiste con las copias.

## 2. Qué datos se tratan

### 2.1 Datos del alumnado — solo en el dispositivo

| Dato | Para qué |
|---|---|
| Nombre | Identificar a quién se pregunta y a quién se elige |
| Código de cinco caracteres | Sustituye al nombre en todo lo que sale del dispositivo (QR, papel, ficheros de entrega) |
| Indicador de NEAE (opcional) | Contextualizar la lectura del docente |
| Elecciones sociométricas por situación | La finalidad del instrumento |
| Constancia de participación | Distinguir «no respondió» de «respondió sin elegir» |
| Observaciones del docente | Seguimiento cualitativo |

No se piden fotos, fecha de nacimiento, apellidos (se recomiendan solo nombres
de pila), motivo de ninguna elección ni marca temporal fina de las respuestas.

### 2.2 Datos del docente

Ninguno. No hay cuentas ni identificadores.

### 2.3 Datos que llegan a un servidor

**Ninguno, salvo que el docente active una de las dos funciones opcionales
del buzón ciego**, y entonces solo ciphertext:

- **Relé en vivo** (sesión con tablets): cada tablet deposita su respuesta
  cifrada con una clave de 256 bits que viaja en el QR proyectado y que el
  servidor nunca recibe. El servidor guarda el código de sesión, el sobre y la
  fecha; la sesión caduca a las dos horas y se borra al cerrarla.
- **Sincronización entre dispositivos del docente**: cada registro viaja como
  sobre cifrado con una clave derivada (HKDF) de un token secreto que solo
  tienen los dispositivos del docente. El servidor identifica el buzón por el
  hash del token y guarda tabla, identificador, fecha de modificación y
  ciphertext. No hay cuentas ni identidad. El docente puede purgar el buzón
  cuando quiera.

El código del servidor está en `apps/api` y sus pruebas comprueban que rechaza
cualquier cosa que no tenga forma de ciphertext.

Sin activar nada de esto, el servidor que aloja la aplicación (hilos.edumind.es o cualquier
otro) solo sirve ficheros estáticos y registra, como cualquier servidor web, la
petición de descarga de la aplicación. Las respuestas del alumnado nunca viajan
por red en ninguna modalidad.

### 2.4 Qué viaja entre dispositivos en el aula, y por dónde

| Modalidad | Qué sale del dispositivo del docente | Por dónde | Qué vuelve | Por dónde |
|---|---|---|---|---|
| Tablets | Lista del grupo (código y nombre de pila) y configuración de la toma, comprimidas en el fragmento de una URL | Un QR proyectado, leído por la cámara de la tablet | Las elecciones, por código de alumno | Un QR en la pantalla de la tablet, leído por la cámara del docente |
| Hoja de marcas | La hoja impresa, con nombres de pila y un QR con la toma, el código del alumno y el orden de filas | Papel | Las marcas | La cámara del docente; la foto se descarta al confirmar |
| Transcripción | Nada | — | Lo que teclea el docente | — |
| Prueba por aula virtual | Lista del grupo (código y nombre de pila), configuración y **clave pública** del docente, en el fragmento de un enlace | El canal del centro (Moodle, aula virtual, correo), restringido al grupo | Un fichero de entrega cifrado con esa clave pública (ECDH P-256 + AES-256-GCM) | La tarea de Moodle; solo la clave privada, que no sale del dispositivo del docente, lo abre |

La lista de la prueba viaja en claro dentro del enlace porque el alumnado tiene
que leerla; por eso se distribuye por un canal ya restringido al grupo, con
nombres de pila, y nunca en abierto. Los códigos de acceso se entregan aparte.

El fragmento de una URL (lo que va detrás de `#`) no se envía nunca al
servidor. La página de la tablet lo borra de la barra de direcciones y del
historial al cargar, y no guarda nada: al cerrar la pestaña no queda ni la
lista ni la respuesta.

La aplicación compilada no carga recursos de ningún origen externo (fuentes,
analíticas, CDN). Una prueba del CI (`pruebas/sin-origenes-externos.mjs`) lo
comprueba en cada cambio.

## 3. Qué ve el alumnado

- La pregunta y la lista de sus compañeros, barajada en cada pregunta.
- Nunca su propio nombre en la lista, nunca un contador de «te han elegido»,
  nunca ningún resultado.
- Una pantalla final idéntica para todos.

La palabra «sociograma» no aparece en su pantalla; la actividad se presenta
como «Mi equipo».

## 4. Nominaciones negativas

Están **bloqueadas por diseño** en los registros de lector inicial y Primaria:
el esquema de datos rechaza una toma que las active. En Secundaria y adultos
requieren activación expresa por toma, y quedan registradas como tales.

## 5. Base jurídica y recomendaciones al centro

El tratamiento se enmarca en la función educativa y orientadora del centro
(misión de interés público). Se recomienda:

- Informar a las familias antes de la primera toma (qué se hace, para qué, dónde
  se guarda, quién lo ve).
- Tratar los resultados como documentación de tutoría y orientación: nunca
  devolverlos al alumnado; a las familias, solo lo relativo a su hijo o hija y a
  través del tutor.
- Borrar las tomas al cambiar de etapa, salvo necesidad justificada.

## 5 bis. Importaciones

De una exportación de MiClase solo se leen tres tablas (grupos, alumnos y su
relación); nada más se mira ni se guarda. Los nombres se reducen al nombre de
pila, con la inicial del apellido solo cuando se repite.

## 6. Copias de seguridad

Al exportar se pide una contraseña y la copia sale cifrada con AES-256-GCM
(clave derivada con PBKDF2, 210.000 iteraciones). Sin la contraseña no puede
abrirla nadie, tampoco EDUmind. Si el docente deja la contraseña vacía, la
copia sale en claro, con un aviso previo; es su responsabilidad dónde la guarda.

## 7. Cómo comprobar todo esto

- `packages/nucleo/src/esquemas.ts`: la regla de negativas.
- `apps/web/src/alumno/PantallaAlumno.tsx` y su prueba: lo que ve el alumnado.
- `pruebas/sin-origenes-externos.mjs`: ningún origen externo en la app compilada.
- `apps/web/src/db/localDb.ts`: la única base de datos que existe.
