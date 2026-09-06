"""Burn a full-width caption band into each store screenshot.
Raws are already 1280x800; output keeps that size. ss05 (green) is unused."""

import os
from PIL import Image, ImageDraw, ImageFont

SRC = r"D:\Create\Tools\tomato-pop\dev\store\raw"
OUT = r"D:\Create\Tools\tomato-pop\dev\store"
FONT_PATH = r"C:\Windows\Fonts\YuGothB.ttc"

CREAM = (251, 247, 242)
CHARCOAL = (58, 51, 48)
TOMATO = (229, 83, 61)

BAND_H = 104

SHOTS = [
    ("ss01", "1-timer",
     "画面で知らせるポモドーロタイマー",
     "A Pomodoro timer that tells you on the screen"),
    ("ss03", "2-banner",
     "終了を、見ているページの上部でお知らせ",
     "A banner slides down the page when a session ends"),
    ("ss04", "3-popout",
     "タイマーを切り離して、常に画面に表示",
     "Pop the timer out to keep it on screen"),
    ("ss02", "4-settings",
     "時間・音・言語をこまかく設定",
     "Tune the timers, sound, and language"),
    ("ss06", "5-dark",
     "ライト / ダークに自動で対応",
     "Adapts to light and dark automatically"),
]


def add_band(img, text):
    w, h = img.size
    d = ImageDraw.Draw(img)
    top = h - BAND_H
    d.rectangle([0, top, w, h], fill=CHARCOAL)
    d.rectangle([0, top, w, top + 3], fill=TOMATO)  # brand accent line

    font = ImageFont.truetype(FONT_PATH, 26, index=0)
    bbox = d.textbbox((0, 0), text, font=font)
    ty = top + (BAND_H - (bbox[3] - bbox[1])) // 2 - bbox[1] + 2
    d.text((52 - bbox[0], ty), text, font=font, fill=CREAM)
    return img


for raw, name, ja, en in SHOTS:
    for lang, cap in (("ja", ja), ("en", en)):
        src = os.path.join(SRC, f"{raw}_{lang}.png")
        im = add_band(Image.open(src).convert("RGB"), cap)
        dst = os.path.join(OUT, f"{name}-{lang}.png")
        im.save(dst)
        print(f"{raw}_{lang}  ->  dev/store/{name}-{lang}.png")
