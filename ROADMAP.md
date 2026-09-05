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
- [ ] Fuentes Archivo, JetBrains Mono, Fraunces y Space Grotesk incrustadas
      (woff2 en `public/fonts`, con su OFL en NOTICE). Hasta entonces, fuentes
      del sistema.

## F1 · Aula: tablets por QR y hoja de marcas

- [ ] QR de ida con la lista comprimida en el fragmento; página del alumnado
      que la borra del historial; prueba de que no hace ninguna petición.
- [ ] QR de vuelta por tablet y escáner con la cámara (jsQR).
- [ ] Hoja de marcas individual y de grupo: impresión, lectura en canvas,
      confirmación hoja a hoja.
- [ ] Teclado de transcripción para el cuestionario clásico.

## F2 · Lectura

- [ ] Grafo de fuerzas propio en SVG, filtro por situación.
- [ ] Ficha de alumno con notas.
- [ ] Informe de grupo imprimible en Lámina.

## F3 · Tiempo y aula virtual

- [ ] Prueba autocontenida con código de acceso y respuesta cifrada con la
      clave pública del docente (ECDH P-256 + AES-256-GCM).
- [ ] Comparador de tomas y trayectoria por alumno con eventos.
- [ ] Copia cifrada con contraseña. Importación desde MiClase y desde CSV/XLSX.
- [ ] Inglés.

## F4 · Opcional

- [ ] `apps/api`: buzón ciego para relé en vivo y sincronización entre
      dispositivos del docente (patrón MiClase).
- [ ] Capacitor. Canal directo en la misma red.
