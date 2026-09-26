#!/usr/bin/env python3
"""Genera los iconos PNG de la PWA y los de la app Android a partir del mismo
dibujo que icono.svg (curva con nodos sobre papel).

Uso: python3 scripts/iconos.py   (necesita Pillow)

- PWA: icono-192, icono-512 y el enmascarable (dibujo más pequeño: el sistema
  recorta los bordes).
- Android (apps/web/android/app/src/main/res): ic_launcher (cuadrado),
  ic_launcher_round (recortado en círculo), ic_launcher_foreground (capa del
  icono adaptativo, fondo transparente, dibujo dentro de la zona segura) y las
  pantallas de arranque splash.png en todas las densidades. Sustituyen a las
  imágenes de muestra de la plantilla de Capacitor.
"""
import sys
from pathlib import Path
try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

PAPEL = (236, 233, 225)
TINTA = (23, 24, 26)
MOSTAZA = (193, 154, 46)
TERRACOTA = (192, 95, 60)
RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "apps/web/public"
RES = RAIZ / "apps/web/android/app/src/main/res"

def bezier(p0, p1, p2, p3, n=120):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t**2*p2[0] + t**3*p3[0]
        y = (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t**2*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts

def dibujar(tam, margen, fondo=PAPEL):
    """Cuadrado de `tam` px. `fondo=None` deja el fondo transparente (RGBA)."""
    escala = 8  # se dibuja grande y se reduce: antialiasing
    S = tam * escala
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)) if fondo is None else Image.new("RGB", (S, S), fondo)
    d = ImageDraw.Draw(im)
    # Coordenadas del SVG (64x64) mapeadas al área útil.
    util = S * (1 - 2 * margen)
    off = S * margen
    f = lambda x, y: (off + x / 64 * util, off + y / 64 * util)
    grosor = int(2 / 64 * util)
    curva = bezier(f(14, 44), f(22, 20), f(34, 20), f(32, 32)) + bezier(f(32, 32), f(30, 44), f(44, 44), f(50, 20))
    d.line(curva, fill=TINTA, width=grosor, joint="curve")
    r = 4.5 / 64 * util
    for (x, y), c in [((14, 44), TINTA), ((32, 32), TINTA), ((50, 20), TINTA), ((26, 22), MOSTAZA), ((42, 42), TERRACOTA)]:
        cx, cy = f(x, y)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=c)
    return im.resize((tam, tam), Image.LANCZOS)

def redondo(tam):
    """Icono cuadrado recortado en círculo (ic_launcher_round)."""
    im = dibujar(tam, 0.06).convert("RGBA")
    S = tam * 8
    mascara = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, S - 1, S - 1), fill=255)
    im.putalpha(mascara.resize((tam, tam), Image.LANCZOS))
    return im

def splash(ancho, alto):
    """Pantalla de arranque: papel con el dibujo centrado."""
    im = Image.new("RGB", (ancho, alto), PAPEL)
    lado = int(min(ancho, alto) * 0.34)
    im.paste(dibujar(lado, 0.0), ((ancho - lado) // 2, (alto - lado) // 2))
    return im

SALIDA.mkdir(parents=True, exist_ok=True)
dibujar(192, 0.0).save(SALIDA / "icono-192.png")
dibujar(512, 0.0).save(SALIDA / "icono-512.png")
dibujar(512, 0.16).save(SALIDA / "icono-512-maskable.png")
print("iconos generados en", SALIDA)

if RES.is_dir():
    # Densidades Android: (carpeta, icono legado, capa del adaptativo).
    for dens, legado, capa in [("mdpi", 48, 108), ("hdpi", 72, 162), ("xhdpi", 96, 216), ("xxhdpi", 144, 324), ("xxxhdpi", 192, 432)]:
        carpeta = RES / f"mipmap-{dens}"
        carpeta.mkdir(exist_ok=True)
        dibujar(legado, 0.06).save(carpeta / "ic_launcher.png")
        redondo(legado).save(carpeta / "ic_launcher_round.png")
        # Zona segura del icono adaptativo: círculo central de 66/108 dp.
        dibujar(capa, 0.22, fondo=None).save(carpeta / "ic_launcher_foreground.png")
    # Pantallas de arranque, tamaños de la plantilla de Capacitor.
    tamanos = {"mdpi": (480, 320), "hdpi": (800, 480), "xhdpi": (1280, 720), "xxhdpi": (1600, 960), "xxxhdpi": (1920, 1280)}
    splash(480, 320).save(RES / "drawable" / "splash.png")
    for dens, (w, h) in tamanos.items():
        (RES / f"drawable-land-{dens}").mkdir(exist_ok=True)
        (RES / f"drawable-port-{dens}").mkdir(exist_ok=True)
        splash(w, h).save(RES / f"drawable-land-{dens}" / "splash.png")
        splash(h, w).save(RES / f"drawable-port-{dens}" / "splash.png")
    print("iconos y pantallas de arranque Android generados en", RES)
