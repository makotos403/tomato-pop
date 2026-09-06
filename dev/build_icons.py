"""Resize the tomato master to the four toolbar/store sizes.

Master: dev/icon_src.png (transparent, 512px) — produced by dev/extract_tomato.py
from the promo-tile source. Same art at every size (a thin ring motif doesn't
survive 16px, so the timer identity lives in the popup, not the icon).

Run: python dev/build_icons.py
"""

import os
from PIL import Image

DEV = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DEV)

master = Image.open(os.path.join(DEV, "icon_src.png")).convert("RGBA")
for px in (128, 48, 32, 16):
    master.resize((px, px), Image.LANCZOS).save(
        os.path.join(ROOT, "icons", f"icon{px}.png")
    )
print("wrote icons/icon{16,32,48,128}.png")
