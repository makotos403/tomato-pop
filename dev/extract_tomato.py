"""Extract just the tomato from the promo tile into the icon master.

promo-tile-src.jpg has the tomato inside a red timer ring on a warm ground.
We crop around the tomato, key out the ground by distance from its colour, then
mask to an ellipse that clears the ring, and normalise to a 512px transparent
square. Output: dev/icon_src.png  (then run dev/build_icons.py)

Run: python dev/extract_tomato.py
"""

import os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

DEV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DEV, "store", "raw", "promo-tile-src.jpg")
OUT = os.path.join(DEV, "icon_src.png")

BG = (249, 245, 236)
LO, HI = 22, 66  # distance-from-ground alpha ramp
BOX = (180, 200, 560, 620)  # generous crop around the tomato
TOMATO_CENTER = (362, 416)  # in full-image coords
RX, RY = 172, 168  # ellipse mask — bigger than the tomato, inside the ring

im = Image.open(SRC).convert("RGB").crop(BOX)
w, h = im.size
px = im.load()

keyed = Image.new("RGBA", (w, h))
kp = keyed.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        d = ((r - BG[0]) ** 2 + (g - BG[1]) ** 2 + (b - BG[2]) ** 2) ** 0.5
        a = 0 if d <= LO else 255 if d >= HI else int((d - LO) / (HI - LO) * 255)
        kp[x, y] = (r, g, b, a)

cx, cy = TOMATO_CENTER[0] - BOX[0], TOMATO_CENTER[1] - BOX[1]
mask = Image.new("L", (w, h), 0)
ImageDraw.Draw(mask).ellipse([cx - RX, cy - RY, cx + RX, cy + RY], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(4))
keyed.putalpha(ImageChops.multiply(keyed.getchannel("A"), mask))

keyed = keyed.crop(keyed.getbbox())
cw, ch = keyed.size
side = int(max(cw, ch) / 0.9)
master = Image.new("RGBA", (side, side), (0, 0, 0, 0))
master.paste(keyed, ((side - cw) // 2, (side - ch) // 2), keyed)
master.resize((512, 512), Image.LANCZOS).save(OUT)
print(f"wrote {OUT}")
