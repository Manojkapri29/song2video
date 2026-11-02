"""usage: kailash_moments.py -> public/kailash_pro.json

Adds keyword 'moments' to the Kailash story beats. A moment is a motion-graphic that appears
the instant the narrator says its keyword, so the picture follows the voice-over, not the slide.
Timing comes from whisper segments (out/kailash_vo_words.json). A keyword only fires inside the
beat whose narration contains it, and moments are spaced so two never overlap.
"""
import json, re

STORY = "public/kailash_story.json"
WORDS = "out/kailash_vo_words.json"
OUT = "public/kailash_pro.json"
DUR = 4.2       # seconds a moment stays on screen
GAP = 1.0       # minimum gap between moments, after one ends
COOL = 30.0     # same graphic is not shown again within this many seconds
LEAD = 0.15     # appear just before the word is spoken

# (regex over whisper text, graphic kind, on-screen label). Spellings cover Whisper's Hindi errors.
RULES = [
    (r"धर्म", "four", "चार धर्म"),
    (r"पर्वत|परवत|पहाड|पहार|शिकर", "mountain", "पर्वत"),
    (r"पानी|झील", "water", "झील"),
    (r"क्रिस्टल|तोस|महल", "crystal", "क्रिस्टल महल"),
    (r"बर्फ", "snow", "बर्फ"),
    (r"परिकरमा|परिक्रमा|वामा|वरत|क्लॉक|स्वस्तिक", "orbit", "परिक्रमा"),
    (r"समय", "clock", "समय"),
    (r"खोज|खंडहर|नहीं मिल|कुई महल", "magnify", "खोज"),
    (r"दस|रावण", "ten", "रावण"),
    (r"ध्वनि|आवाज|सुन", "wave", "ध्वनि"),
    (r"अष्टपद|आट कडम|कडम", "eight", "अष्टपद"),
]


def main():
    story = json.load(open(STORY, encoding="utf-8"))
    segs = json.load(open(WORDS, encoding="utf-8"))
    last_end = -1e9
    last_at = {}
    placed = []
    for beat in story["beats"]:
        b0, b1 = beat["start"], beat["end"]
        for rx, kind, label in RULES:
            hit = next((s for s in segs if b0 <= s["start"] < b1 and re.search(rx, s["text"])), None)
            if not hit:
                continue
            at = max(b0, hit["start"] - LEAD)
            if at < last_end + GAP or at < last_at.get(kind, -1e9) + COOL:
                continue
            last_at[kind] = at
            end = min(b1, at + DUR)
            last_end = end
            beat.setdefault("moments", []).append({"at": round(at, 2), "dur": round(end - at, 2),
                                                  "kind": kind, "label": label})
            placed.append((round(at, 2), kind, label, hit["text"][:40]))
    json.dump(story, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for p in placed:
        print(p)
    print(len(placed), "moments ->", OUT)


if __name__ == "__main__":
    main()
