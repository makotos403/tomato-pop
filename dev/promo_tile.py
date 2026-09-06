"""Build the Chrome Web Store promo tile (440x280) from the Gemini source.

The current source (raw/promo-tile-src.jpg) is the "Tomato Pop Timer" version:
tomato + timer ring + two-line wordmark, no tagline. Just resize to spec.

Run: python dev/promo_tile.py
"""

import os
from PIL import Image

DEV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DEV, "store", "raw", "promo-tile-src.jpg")
OUT = os.path.join(DEV, "store", "promo-tile.png")

Image.open(SRC).convert("RGB").resize((440, 280), Image.LANCZOS).save(OUT)
print(f"wrote {OUT}  440x280")
