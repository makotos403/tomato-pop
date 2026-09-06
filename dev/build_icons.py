"""Build the toolbar/store icons from the tomato master.

Size-specific art: a full ring doesn't survive 16px, so
- icon128 / icon48 : tomato + a 3/4 "timer" arc (echoes the popup ring)
- icon32  / icon16 : plain tomato (recognisable at toolbar size)

Masters (both in dev/):
- icon_src.png       : the plain flat tomato, transparent, 512px
- icon_ring_src.png  : the tomato + arc, written by this script for reference

Run: python dev/build_icons.py
"""

import math
import os
from PIL import Image, ImageDraw

DEV = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DEV)
SRC = os.path.join(DEV, "icon_src.png")
RING_SRC = os.path.join(DEV, "icon_ring_src.png")
ICONS = os.path.join(ROOT, "icons")

S = 512
TOMATO = (229, 83, 61, 255)  # --tomato #e5533d

tomato = Image.open(SRC).convert("RGBA")


def scaled_tomato(scale, dy=0):
    c = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    w = int(S * scale)
    c.alpha_composite(tomato.resize((w, w), Image.LANCZOS), ((S - w) // 2, (S - w) // 2 + dy))
    return c


def ring_master():
    c = scaled_tomato(0.66, dy=8)
    arc = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(arc)
    r_out, width = 236, 33
    start, sweep = 332, 318  # ~42 deg gap, just clockwise of 12 o'clock
    cc = S // 2
    d.arc([cc - r_out, cc - r_out, cc + r_out, cc + r_out], start, start + sweep, fill=TOMATO, width=width)
    cap = width / 2
    for ang in (start, start + sweep):
        x = cc + (r_out - cap) * math.cos(math.radians(ang))
        y = cc + (r_out - cap) * math.sin(math.radians(ang))
        d.ellipse([x - cap, y - cap, x + cap, y + cap], fill=TOMATO)
    return Image.alpha_composite(arc, c)  # arc sits behind the tomato


ring = ring_master()
plain = scaled_tomato(0.98)
ring.save(RING_SRC)

os.makedirs(ICONS, exist_ok=True)
for px in (128, 48):
    ring.resize((px, px), Image.LANCZOS).save(os.path.join(ICONS, f"icon{px}.png"))
for px in (32, 16):
    plain.resize((px, px), Image.LANCZOS).save(os.path.join(ICONS, f"icon{px}.png"))

print("wrote icons/icon{16,32,48,128}.png and dev/icon_ring_src.png")
