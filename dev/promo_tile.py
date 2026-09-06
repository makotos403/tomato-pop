"""Build the Chrome Web Store promo tile (440x280) from the Gemini source.

The Gemini image had a garbled tagline; we paint it out and keep the tomato +
timer-ring + wordmark, then resize. Run: python dev/promo_tile.py
"""

from PIL import Image, ImageDraw

SRC = r"D:\Create\Tools\tomato-pop\dev\store\raw\promo-tile-src.jpg"
OUT = r"D:\Create\Tools\tomato-pop\dev\store\promo-tile.png"

im = Image.open(SRC).convert("RGB")
w, h = im.size
bg = im.getpixel((10, 10))

# paint over the garbled AI tagline below the "Tomato Pop" wordmark
ImageDraw.Draw(im).rectangle(
    [int(w * 0.47), int(h * 0.52), w, int(h * 0.66)], fill=bg
)

im.resize((440, 280), Image.LANCZOS).save(OUT)
print(f"wrote {OUT}  440x280")
