"""ACE-Step: pop-style sung bhajan from public/bhajan.json lines. Run with ~/Claude/ace-step/.venv python."""
import os, sys, json, time
ROOT = os.path.expanduser("~/Claude/ace-step"); sys.path.insert(0, ROOT); os.chdir(ROOT)
from loguru import logger
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

dev = [l["text"] for l in json.load(open(os.path.expanduser("~/Claude/lyric-video/public/bhajan.json"), encoding="utf-8"))["lines"]]
ROMAN = ["Shri guru charan saroj raj, nij manu mukuru sudhari", "Baranau raghubar bimal jasu, jo dayaku phal chari",
         "Buddhiheen tanu janike, sumiro pavan kumar", "Bal buddhi vidya dehu mohi, harahu kales bikar",
         "Jai Hanuman gyan gun sagar", "Jai kapis tihun lok ujagar", "Ram doot atulit bal dhama",
         "Anjani putra pavansut nama", "Mahabir bikram bajrangi", "Kumati nivar sumati ke sangi"]
ROMAN_MODE = os.environ.get("ROMAN") == "1"
lines = ROMAN if ROMAN_MODE else dev
lyrics = "[Intro]\n\n[Verse 1]\n" + "\n".join(lines[:4]) + "\n\n[Chorus]\n" + "\n".join(lines[4:8]) + "\n\n[Outro]\n" + "\n".join(lines[8:10])
caption = ("Modern Hindi devotional pop, catchy singable melody, warm emotional male vocal, 100 BPM, A minor, "
           "punchy claps, 808 bass, plucky synth arpeggio, soft pads, clean radio-ready mix")
SAVE = os.path.expanduser("~/Claude/lyric-video/tools/tmp/" + ("song_out_roman" if ROMAN_MODE else "song_out")); os.makedirs(SAVE, exist_ok=True)
seed = int(sys.argv[1]) if len(sys.argv) > 1 else -1
lite = len(sys.argv) > 2 and sys.argv[2] == 'lite'  # no LM + CPU offload, for low free memory

dit = AceStepHandler()
msg, ok = dit.initialize_service(project_root=ROOT, config_path="acestep-v15-turbo", device="auto", offload_to_cpu=lite)
assert ok, msg
llm = LLMHandler()
msg, ok = (None, True) if lite else llm.initialize(checkpoint_dir=os.path.join(ROOT, "checkpoints"), lm_model_path="acestep-5Hz-lm-0.6B", backend="mlx", device="auto", offload_to_cpu=False, dtype=None)
assert ok, msg
p = GenerationParams(task_type="text2music", thinking=not lite, caption=caption, lyrics=lyrics, bpm=100, keyscale="A minor",
                     timesignature="4", vocal_language="en" if ROMAN_MODE else "hi", duration=60, inference_steps=8, guidance_scale=1.0, seed=seed)
t0 = time.time()
r = generate_music(dit, None if lite else llm, params=p, config=GenerationConfig(batch_size=1, audio_format="wav"), save_dir=SAVE)
logger.info(f"{'OK' if r.success else 'FAILED'} {time.time()-t0:.0f}s {r.status_message}")
for a in r.audios: logger.info(f"AUDIO {a.get('path')}")
