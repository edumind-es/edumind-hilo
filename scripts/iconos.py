#!/usr/bin/env python3
"""Genera los iconos PNG de la PWA a partir del mismo dibujo que icono.svg.

Uso: python3 scripts/iconos.py   (necesita Pillow)
El enmascarable lleva el dibujo más pequeño: el sistema recorta los bordes.
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
SALIDA = Path(__file__).resolve().parent.parent / "apps/web/public"

def bezier(p0, p1, p2, p3, n=120):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t**2*p2[0] + t**3*p3[0]
        y = (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t**2*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts

def dibujar(tam, margen):
    escala = 8  # se dibuja grande y se reduce: antialiasing
    S = tam * escala
    im = Image.new("RGB", (S, S), PAPEL)
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

SALIDA.mkdir(parents=True, exist_ok=True)
dibujar(192, 0.0).save(SALIDA / "icono-192.png")
dibujar(512, 0.0).save(SALIDA / "icono-512.png")
dibujar(512, 0.16).save(SALIDA / "icono-512-maskable.png")
print("iconos generados en", SALIDA)
