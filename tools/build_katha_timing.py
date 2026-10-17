"""Build public/katha_final.json from what the song ACTUALLY sings.

Boundaries come from a whisper transcript of the demucs-isolated vocals; the text
is the real lyric (whisper mishears Hindi, so its text is not used). Lines the song
never sings are left out, hook repeats are kept, and gaps stay empty on purpose so
the composition can show an interlude instead of holding a stale line.
"""
import json

HOOK_A = "कथा और रहस्य — हर कहानी में एक राज़"
HOOK_B = "कथा और रहस्य — पत्थरों में बोलती आवाज़"

SUNG = [
    (3.95, 10.50, "जो कहानी दादी कहती थी,"),
    (10.50, 17.26, "उसमें एक सच छुपा था..."),
    (17.44, 23.20, HOOK_A),
    (23.20, 28.98, HOOK_B),
    (29.00, 35.04, HOOK_A),
    (35.08, 41.16, HOOK_B),
    # 8.8s instrumental
    (49.94, 53.98, "हवा में लटका खंभा, कौन थामे है उसे?"),
    (54.90, 59.82, "जगन्नाथ की अधूरी मूरत, पूरा करे कौन उसे?"),
    (60.12, 65.20, "ध्वज की चोटी पर, माँ जयन्ती का धाम"),
    (65.22, 70.80, "चितई में चिट्ठी लिखो — गोलू देंगे इंसाफ़ का नाम"),
    (71.79, 75.98, HOOK_A),
    (76.08, 92.00, HOOK_B),
    (92.00, 97.30, "दीया बुझा, सांस थमी, अब आगे क्या?"),
    (97.30, 102.06, "गरुड़ पुराण कहता है — हिसाब बाक़ी था"),
    (102.98, 105.08, "यमराज का दरबार, चित्रगुप्त की किताब"),
    (105.40, 107.80, "कर्म ही सवाल था, कर्म ही जवाब"),
    (108.08, 113.23, "कुरुक्षेत्र में अर्जुन, और सारथी वो श्याम"),
    (113.42, 118.36, '"कर्म कर, फल छोड़" — बस इतना था पैग़ाम'),
    (118.80, 125.16, "कलियुग थक चुका है, घोड़ा तैयार है"),
    (126.34, 129.34, "कल्कि की तलवार में नया संसार है"),
    (129.40, 131.78, "रामायण कहानी नहीं, पत्थर गवाह हैं"),
    (132.27, 134.58, "महाभारत मिटी नहीं, मिट्टी में निशान हैं"),
    (134.82, 137.24, "देवभूमि की हवा में, आज भी वो नाम है"),
    (137.44, 139.94, "संत की समाधि में, जीवन का प्रमाण है"),
    (142.70, 144.70, "कथा और रहस्य!"),
    # 11.4s instrumental
    (156.08, 159.90, "कथा और रहस्य!"),
    (161.44, 164.08, "जुड़े रहो, सुनते रहो — रहस्य अभी बड़ा है"),
    (164.08, 168.17, "हर हर महादेव..."),
    (172.08, 177.70, "कथा और रहस्य — सब्सक्राइब, सफ़र लंबा है"),
]

out = []
for start, end, text in SUNG:
    parts = text.split()
    d = (end - start) / len(parts)
    out.append({"start": start, "end": end, "text": text,
                "words": [{"w": w, "start": round(start + i * d, 2), "end": round(start + (i + 1) * d, 2)}
                          for i, w in enumerate(parts)]})

for i, o in enumerate(out):
    assert o["end"] > o["start"], f"line {i} has no duration"
    if i:
        assert o["start"] >= out[i - 1]["end"], f"line {i} overlaps the previous one"

json.dump(out, open("public/katha_final.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
gaps = [(round(out[i - 1]["end"], 2), round(out[i]["start"], 2)) for i in range(1, len(out))
        if out[i]["start"] - out[i - 1]["end"] > 2]
print("lines:", len(out), "| instrumental gaps >2s:", [(a, b) for a, b in gaps], "| head:", out[0]["start"], "| tail:", out[-1]["end"])
