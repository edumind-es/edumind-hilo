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

## En cualquier otro sitio

`npm ci && npm run build` y copiar `apps/web/dist` a la raíz del servidor. Al
ser una PWA, la primera visita descarga todo y las siguientes funcionan sin red.
