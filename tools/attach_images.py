"""Copy the generated FLUX scenes into public/img and attach one to each lyric line.

Scene order must match tools/scene_prompts.txt (batch01..batch12).
"""
import json, re, shutil
from pathlib import Path

SRC = Path.home() / "AI-Studio/output/images"
DST = Path("public/img")

# first word(s) of the line -> scene number from scene_prompts.txt
SCENE_OF_LINE = {
    "जो कहानी दादी": 1, "उसमें एक सच": 1,
    "कथा और रहस्य — हर कहानी में एक राज़": 1,
    "कथा और रहस्य — पत्थरों में बोलती आवाज़": 1,
    "हवा में लटका": 2,
    "जगन्नाथ की अधूरी": 3,
    "ध्वज की चोटी": 4,
    "चितई में चिट्ठी": 5,
    "दीया बुझा": 6,
    "गरुड़ पुराण": 7, "यमराज का दरबार": 7, "कर्म ही सवाल": 7,
    "कुरुक्षेत्र में अर्जुन": 8, '"कर्म कर, फल छोड़"': 8,
    "कलियुग थक चुका": 9, "कल्कि की तलवार": 9,
    "रामायण कहानी नहीं": 10, "महाभारत मिटी नहीं": 10,
    "देवभूमि की हवा": 11,
    "संत की समाधि": 12,
    "कथा और रहस्य!": 11,
    "जुड़े रहो": 11, "हर हर महादेव": 11,
    "कथा और रहस्य — सब्सक्राइब": 11,
}

def scene_for(text):
    for key in sorted(SCENE_OF_LINE, key=len, reverse=True):   # longest key first: exact hook text wins
        if text.startswith(key):
            return SCENE_OF_LINE[key]
    return None

DST.mkdir(parents=True, exist_ok=True)
found = {}
for p in SRC.glob("batch*_*.png"):
    m = re.match(r"batch(\d+)_", p.name)
    if m:
        n = int(m.group(1))
        if n not in found or p.stat().st_mtime > found[n].stat().st_mtime:
            found[n] = p
for n, p in sorted(found.items()):
    shutil.copy2(p, DST / f"{n:02d}.png")
print("scenes copied:", sorted(found))

lines = json.load(open("public/katha_final.json", encoding="utf-8"))
missing = []
for l in lines:
    n = scene_for(l["text"])
    if n is None or n not in found:
        missing.append(l["text"])
        l.pop("img", None)
    else:
        l["img"] = f"img/{n:02d}.png"
json.dump(lines, open("public/katha_final.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("lines with image:", sum("img" in l for l in lines), "/", len(lines))
for t in missing:
    print("  NO IMAGE:", t)
