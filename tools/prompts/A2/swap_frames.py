#!/usr/bin/env python3
"""Swap two frames of a process_sprites atlas (PNG cells + srcBBox in JSON).

Used when the image model drew one frame facing the wrong way, e.g. the 3rd 'left'
frame facing right while the 3rd 'right' frame faces left:
  python tools/prompts/A2/swap_frames.py yeokgwan_18c 5 8
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
name, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
jp = ROOT / "assets" / "sprites" / f"{name}.json"
meta = json.loads(jp.read_text(encoding="utf-8"))
img = Image.open(ROOT / "assets" / "sprites" / meta["image"]).convert("RGBA")
fa, fb = meta["frames"][a], meta["frames"][b]
ca = img.crop((fa["x"], fa["y"], fa["x"] + fa["w"], fa["y"] + fa["h"]))
cb = img.crop((fb["x"], fb["y"], fb["x"] + fb["w"], fb["y"] + fb["h"]))
img.paste(cb, (fa["x"], fa["y"]))
img.paste(ca, (fb["x"], fb["y"]))
img.save(ROOT / "assets" / "sprites" / meta["image"], optimize=True)
fa["srcBBox"], fb["srcBBox"] = fb["srcBBox"], fa["srcBBox"]
meta.setdefault("warnings", []).append(f"frames {a} and {b} swapped by tools/prompts/A2/swap_frames.py (wrong facing in source sheet)")
jp.write_text(json.dumps(meta, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
print(f"{name}: swapped frames {a} <-> {b}")
