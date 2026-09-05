#!/usr/bin/env bash
#
# Despliegue de EDUmind Hilo (sitio estático).
#
#   ./desplegar.sh                 pruebas, compilar y publicar
#   ./desplegar.sh --volver        volver a la versión anterior
#   ./desplegar.sh --sin-pruebas   publicar sin pasar las pruebas (a tu riesgo)
#
# Nunca se dispara solo: lo lanzas tú. Compila aparte y cambia la versión viva
# con un enlace simbólico: el cambio es instantáneo y volver atrás también.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$RAIZ/apps/web"
RELEASES="$WEB/releases"
VIVA="$WEB/dist"
URL="${HILO_URL:-https://hilos.edumind.es}"
CONSERVAR=5

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
gris()  { printf '\033[90m%s\033[0m\n' "$*"; }

[ "$(id -u)" -eq 0 ] && { rojo "No lo lances como root."; exit 1; }

publicar() {
  local destino="$1"
  ln -sfn "releases/$(basename "$destino")" "$WEB/.dist-nueva"
  mv -Tf "$WEB/.dist-nueva" "$VIVA"
}

comprobar() {
  local esperado="$1" intento html
  for intento in 1 2 3 4 5 6; do
    sleep 2
    html="$(curl -fsS --max-time 15 "$URL/?despliegue=$(date +%s)" || true)"
    if [ -n "$html" ] && grep -q "$esperado" <<<"$html"; then return 0; fi
  done
  return 1
}

if [ "${1:-}" = "--volver" ]; then
  actual="$(basename "$(readlink -f "$VIVA")")"
  anterior="$(ls -1 "$RELEASES" | grep -v "^$actual\$" | sort | tail -1 || true)"
  [ -z "$anterior" ] && { rojo "No hay ninguna versión anterior guardada."; exit 1; }
  gris "Volviendo de $actual a $anterior"
  publicar "$RELEASES/$anterior"
  verde "Hecho. Sirviendo $anterior"
  exit 0
fi

cd "$RAIZ"
if [ -n "$(git status --porcelain)" ]; then
  rojo "Hay cambios sin guardar en git. Producción debe salir de un commit:"
  git status --short
  exit 1
fi
rama="$(git branch --show-current)"
[ "$rama" != "main" ] && gris "Aviso: estás desplegando la rama '$rama', no main."
commit="$(git rev-parse --short HEAD)"

if [ "${1:-}" = "--sin-pruebas" ]; then
  rojo "Publicando SIN pasar las pruebas."
else
  gris "Pasando las pruebas…"
  npm run typecheck
  npm test
fi

version="$(date +%Y%m%d-%H%M%S)-$commit"
destino="$RELEASES/$version"
mkdir -p "$RELEASES"
gris "Compilando en releases/$version"
( cd "$WEB" && npx vite build --outDir "$destino" --emptyOutDir )
node "$RAIZ/pruebas/sin-origenes-externos.mjs" "$destino"
echo "$commit" > "$destino/.commit"

if [ -d "$VIVA" ] && [ ! -L "$VIVA" ]; then
  rescate="$RELEASES/00000000-000000-anterior"
  gris "Guardando la versión actual como $(basename "$rescate")"
  mv "$VIVA" "$rescate"
fi

paquete="$(basename "$(ls -1 "$destino"/assets/index-*.js | head -1)")"
publicar "$destino"
gris "Publicado. Comprobando que $URL sirve $paquete…"
if comprobar "$paquete"; then
  verde "✓ Desplegado $version"
else
  rojo "✗ La comprobación ha fallado. Volviendo atrás."
  "$RAIZ/desplegar.sh" --volver
  exit 1
fi

viva="$(basename "$(readlink -f "$VIVA")")"
ls -1 "$RELEASES" | sort -r | tail -n +$((CONSERVAR + 1)) | while read -r vieja; do
  [ "$vieja" = "$viva" ] && continue
  rm -rf "${RELEASES:?}/$vieja"
done
