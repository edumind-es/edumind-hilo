# Despliegue

Hilo es un sitio estático: `apps/web/dist` servido por cualquier servidor web
con HTTPS. No hay proceso que mantener vivo ni base de datos que migrar.

## En el servidor de EDUmind

```bash
./desplegar.sh            # pruebas, compilar en releases/<fecha>-<commit>, publicar
./desplegar.sh --volver   # volver a la versión anterior
```

El script compila aparte y cambia el enlace simbólico `apps/web/dist` de golpe:
nginx nunca ve un directorio a medias. Conserva las cinco últimas versiones.

## nginx

El vhost definitivo y sus cabeceras están en `deploy/`. En el servidor de
EDUmind el alta la hace, con sudo, `/var/www/.edumind_ops/hilos_site_install.py`:
instala un vhost temporal con certificado prestado, emite el de
hilos.edumind.es con certbot, instala el definitivo y recarga nginx. Revierte
si `nginx -t` falla en cualquier punto.

La CSP no admite ningún origen externo, en coherencia con la app.

## App nativa (Capacitor)

```bash
npm --workspace @edumind-hilo/web run nativo:sync      # compila a dist-nativo y copia al proyecto Android
npm --workspace @edumind-hilo/web run nativo:android   # abre Android Studio
```

`webDir` es `apps/web/dist-nativo`, un directorio real: `dist` es un enlace
simbólico y Capacitor copiaría el enlace en vez de seguirlo. Compilar y firmar
el APK necesita Android Studio o el SDK; el proyecto iOS se añade con
`npx cap add ios` desde un Mac.

## En cualquier otro sitio

`npm ci && npm run build` y copiar `apps/web/dist` a la raíz del servidor. Al
ser una PWA, la primera visita descarga todo y las siguientes funcionan sin red.
