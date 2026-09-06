# Hoja de ruta

Las cuatro primeras fases no tienen backend. Cada fase se despliega con
`./desplegar.sh`, a mano, con vuelta atrás.

## F0 · Un dispositivo — HECHO (v0.1)

- [x] Monorepo, núcleo puro, PWA, CI, licencias dobles, kit de colaboración.
- [x] Grupos pegando lista, códigos de alumno, tomas por etapa.
- [x] Cuestionario es/gl en tres registros; negativas solo en secundaria.
- [x] Modalidad A: responder en el dispositivo del docente, pantalla Alumno.
- [x] Análisis: matriz, índices, reciprocidad, cohesión, ajuste perceptivo,
      subgrupos, puentes, lista de atención, Coie y Dodge con negativas.
- [x] Copia de seguridad JSON con fusión por fecha.
- [x] Fuentes Archivo, JetBrains Mono, Fraunces y Space Grotesk incrustadas
      (woff2 en `public/fonts`, con su OFL en NOTICE), v1.1.

## F1 · Aula: tablets por QR y hoja de marcas — HECHO (v0.2)

- [x] QR de ida con la lista comprimida (deflate) en el fragmento; la página
      del alumnado lo borra del historial y trabaja en memoria.
- [x] QR de vuelta por tablet y lectura con la cámara (jsQR), con pegado
      manual como alternativa.
- [x] Hoja de marcas individual: impresión A4 desde `disenoHoja`, QR de
      identidad con el orden de filas, lectura en canvas (marcadores,
      homografía, umbral doble) y confirmación hoja a hoja con corrección.
- [x] Teclado de transcripción para el cuestionario clásico.
- [x] Copia de seguridad cifrada con contraseña (adelantada de F3).
- [x] Hoja de marcas de grupo (matriz completa en una hoja, v1.1).
- [ ] Validar la lectura de hojas con fotos reales de aula (luz, sombra,
      arrugas). La lectura está probada con hojas sintéticas giradas.
- [ ] Prueba automática de que `/s` no hace ninguna petición de red.

## F2 · Lectura — HECHO (v0.3)

- [x] Grafo de fuerzas propio en SVG (Fruchterman-Reingold determinista),
      filtro por situación, subgrupos por color, aislados con borde.
- [x] Ficha de alumno: posición en cada toma, vínculos de la última, notas
      del docente, trayectoria con los eventos del grupo cuando hay dos tomas.
- [x] Informe de grupo: un HTML autocontenido en Lámina, el mismo en pantalla,
      impreso y descargado.

## F3 · Tiempo y aula virtual — HECHO (v0.4)

- [x] Prueba con código de acceso: enlace (o fichero HTML que lo abre) con la
      lista y la clave pública del docente en el fragmento; el alumno entra
      con su código y descarga una entrega cifrada (ECDH P-256 + AES-256-GCM)
      que solo el dispositivo del docente abre. Recogida por arrastre.
- [x] Comparador de tomas y trayectoria por alumno con los eventos del grupo.
- [x] Importación desde MiClase (en claro o cifrada, conservando códigos) y
      desde CSV: listas y matrices «quién elige a quién» de otras herramientas.
- [x] Inglés en el cuestionario y en la pantalla del alumnado.
- [x] XLSX directo sin librería (v1.1).
- [x] Portal del docente en gallego e inglés (v1.2). El informe descargable
      sigue en castellano.

## F4 · Opcional — HECHO en parte (v1.3)

- [x] `apps/api`: buzón ciego para relé en vivo y sincronización entre
      dispositivos del docente. Sin cuentas: token secreto, hash en el servidor,
      clave derivada por HKDF en el cliente.
- [ ] Sincronización automática en segundo plano (hoy es un botón).
- [ ] Capacitor (andamiaje). Canal directo en la misma red.
