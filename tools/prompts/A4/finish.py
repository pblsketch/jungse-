#!/usr/bin/env python3
"""A4 raw images (assets/raw/gen/*.png) -> game files.

  scenes / misread  -> tools/process_assets.py cg   -> assets/cg/<name>.webp (w <= 1280, q80)
  og_keyart         -> tools/process_assets.py og   -> assets/ui/og.jpg (1200x630)
  app_icon          -> assets/ui/app-192.png, app-512.png, app-maskable-512.png,
                       apple-touch-icon.png (180), favicon-32.png
  ui_icons (3x3 sheet on green) -> assets/ui/icon_<name>.png (128x128, transparent)

  python tools/prompts/A4/finish.py [names...]     # default: everything that exists in raw
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent.parent
RAW = ROOT / "assets" / "raw" / "gen"
UI = ROOT / "assets" / "ui"
ICON_NAMES = ["notebook", "settings", "rulecard", "dictionary", "plaque", "hint", "map",
              "sound_on", "sound_off"]
BG = (0x1D, 0x1A, 0x17)


def run(*args):
    subprocess.run([sys.executable, str(ROOT / "tools" / "process_assets.py"), *args], check=True)


def og(src: Path):
    """1200x630 jpeg q85 (same as process_assets og) but centred a bit left of the middle so
    the student's shoulder, the senior and the palace all stay in the crop."""
    from PIL import ImageOps
    im = ImageOps.fit(Image.open(src).convert("RGB"), (1200, 630), Image.LANCZOS, centering=(0.4, 0.5))
    UI.mkdir(parents=True, exist_ok=True)
    im.save(UI / "og.jpg", "JPEG", quality=85, optimize=True, progressive=True)
    print("og ->", UI / "og.jpg")


def app_icons(src: Path):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    UI.mkdir(parents=True, exist_ok=True)
    for name, px in [("app-512", 512), ("app-192", 192), ("apple-touch-icon", 180), ("favicon-32", 32)]:
        im.resize((px, px), Image.LANCZOS).save(UI / f"{name}.png", optimize=True)
    # maskable: the emblem must sit inside the 80% safe circle -> shrink to 80% on the bg color
    canvas = Image.new("RGB", (512, 512), BG)
    inner = im.resize((410, 410), Image.LANCZOS)
    canvas.paste(inner, ((512 - 410) // 2, (512 - 410) // 2))
    canvas.save(UI / "app-maskable-512.png", optimize=True)
    print("app icons ->", UI)


def _bands(profile: np.ndarray, want: int, min_gap: int = 40):
    on = profile > 0
    segs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            segs.append([start, i]); start = None
    if start is not None:
        segs.append([start, len(on)])
    # merge segments separated by tiny gaps, then keep the `want` largest
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    merged = sorted(sorted(merged, key=lambda s: s[1] - s[0], reverse=True)[:want])
    if len(merged) != want:
        raise SystemExit(f"icon sheet: found {len(merged)} bands, expected {want}")
    return merged


def ui_icons(src: Path, px: int = 128):
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > 120) & (g - np.maximum(r, b) > 40)
    alpha = np.where(green, 0, 255).astype(np.uint8)
    # soft edge: partially green pixels get partial alpha, and lose the green spill
    spill = np.clip(g - np.maximum(r, b), 0, 255)
    edge = (~green) & (spill > 15)
    alpha[edge] = np.clip(255 - spill[edge] * 2, 60, 255).astype(np.uint8)
    rgb = a.copy()
    rgb[..., 1] = np.minimum(g, np.maximum(r, b) + 10)
    rgba = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha])
    mask = alpha > 40
    rows = _bands(mask.sum(axis=1) > 3, 3, min_gap=6)
    UI.mkdir(parents=True, exist_ok=True)
    k = 0
    for (y0, y1) in rows:
        cols = _bands(mask[y0:y1].sum(axis=0) > 2, 3)
        for (x0, x1) in cols:
            sub = mask[y0:y1, x0:x1]
            ys, xs = np.nonzero(sub)
            cy0, cy1 = y0 + ys.min(), y0 + ys.max() + 1
            cx0, cx1 = x0 + xs.min(), x0 + xs.max() + 1
            tile = Image.fromarray(rgba[cy0:cy1, cx0:cx1], "RGBA")
            side = int(max(tile.size) * 1.12)
            sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            sq.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2))
            sq.resize((px, px), Image.LANCZOS).save(UI / f"icon_{ICON_NAMES[k]}.png", optimize=True)
            k += 1
    print(f"{k} icons ->", UI)


def main(names):
    raws = sorted(RAW.glob("*.png"))
    if names:
        raws = [p for p in raws if p.stem in names]
    for p in raws:
        n = p.stem
        if n == "og_keyart":
            og(p)
        elif n == "app_icon":
            app_icons(p)
        elif n == "ui_icons":
            ui_icons(p)
        elif n.startswith(("s", "mis_")) and "_" in n:
            run("cg", str(p))


if __name__ == "__main__":
    main(sys.argv[1:])
