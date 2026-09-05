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

## nginx (referencia)

```nginx
server {
    server_name hilo.edumind.es;
    root /var/www/edumind_hilo/apps/web/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    # El service worker no debe cachearse en el navegador.
    location = /sw.js { add_header Cache-Control "no-cache"; }
    location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```

Cabeceras de seguridad recomendadas (CSP sin ningún origen externo):

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; worker-src 'self'; frame-ancestors 'none'
```

## En cualquier otro sitio

`npm ci && npm run build` y copiar `apps/web/dist` a la raíz del servidor. Al
ser una PWA, la primera visita descarga todo y las siguientes funcionan sin red.
