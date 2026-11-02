"""Thumbnail for the Katyuri explainer: 1280x720, dark katha palette, Hindi title.

Output: out/katyuri_thumb.png. Run: python3 tools/katyuri_thumb.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "katyuri_thumb.png"
W, H = 1280, 720
FONT = "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"
BOLD = 1  # index of the Bold face inside Sangam MN

base = Image.new("RGB", (W, H), (12, 8, 6))
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse((560, -180, 1400, 560), fill=(150, 75, 20))  # warm light behind the title
glow = glow.filter(ImageFilter.GaussianBlur(160))
base = Image.blend(base, glow, 0.85)

# original hill silhouette at the bottom, no outside art
hills = ImageDraw.Draw(base)
hills.polygon([(0, H), (0, 560), (140, 500), (300, 540), (470, 470), (640, 540),
               (820, 480), (980, 530), (1130, 470), (W, 520), (W, H)], fill=(30, 16, 8))

draw = ImageDraw.Draw(base)
title_font = ImageFont.truetype(FONT, 150, index=BOLD)
sub_font = ImageFont.truetype(FONT, 58, index=BOLD)
tag_font = ImageFont.truetype(FONT, 40, index=0)

# left-aligned block so it reads at phone size
x = 70
draw.text((x, 150), "कत्यूरी", font=title_font, fill=(255, 244, 228),
          stroke_width=6, stroke_fill=(20, 8, 0))
draw.text((x, 330), "पहाड़ों का", font=sub_font, fill=(255, 150, 60))
draw.text((x, 400), "प्राचीन राजवंश", font=sub_font, fill=(255, 150, 60))
draw.rectangle((x, 500, x + 260, 506), fill=(255, 150, 60))
draw.text((x, 530), "कथा और इतिहास", font=tag_font, fill=(230, 210, 180))

base.save(OUT, "PNG")
print(OUT)
