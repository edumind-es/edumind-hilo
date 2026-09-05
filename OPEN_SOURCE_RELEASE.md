# Modelo de publicación

A diferencia de otras apps de EDUmind, **este repositorio es el árbol de trabajo
completo**: Hilo no tiene backend, ni secretos, ni configuración de despliegue
sensible, ni datos de aula en ningún fichero. No hay nada que sanear.

Lo único que no se versiona son las compilaciones (`apps/web/dist`,
`apps/web/releases/`) y `node_modules`.

`desplegar.sh` se incluye porque no contiene nada privado y sirve a cualquiera
que aloje Hilo con nginx y un enlace simbólico.
