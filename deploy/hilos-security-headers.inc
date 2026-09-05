# Cabeceras de seguridad de hilos.edumind.es.
# Se incluye DENTRO de cada location que declare add_header propio: nginx
# descarta las cabeceras heredadas del server en cuanto un bloque hijo
# declara la suya.
#
# CSP sin ningún origen externo: la app no carga nada de fuera (el CI lo
# comprueba). 'unsafe-inline' en style-src por los estilos en línea de React.
# camera=(self): la fase 1 lee códigos QR y hojas de marcas con la cámara.
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=(), interest-cohort=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; media-src 'self' blob:; worker-src 'self'; manifest-src 'self'; form-action 'self';" always;
