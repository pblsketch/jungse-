#!/usr/bin/env python3
"""Cut a green-background portrait sheet into separate transparent portraits.

Uses the chroma key of tools/process_sprites.py, finds the figures as connected
blobs, orders them in reading order (rows by top edge, then left to right) and
writes one RGBA PNG per figure, then converts each to webp with
tools/process_assets.py (portrait: longest side 512, alpha kept).

  python tools/prompts/A2/split_portraits.py assets/raw/gen/pt_hero_1.png \
      --names hero_1_neutral,hero_1_surprised,hero_1_smile,hero_1_thinking
  ('-' in --names skips that figure)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools"))
import process_sprites as ps  # noqa: E402
import process_assets as pa  # noqa: E402


def split(src: Path, names, min_frac=0.03, row_tol=0.15, pad=6, grid=None):
    img = Image.open(src)
    rgba = ps.chroma_key(img, "green", 40.0, 140.0)
    alpha = rgba[..., 3]
    # despill every semi-transparent pixel (sheer veils, hair), not only the edge band
    semi = alpha < 0.999
    g = rgba[..., 1]
    lim = np.maximum(rgba[..., 0], rgba[..., 2])
    rgba[..., 1] = np.where(semi & (g > lim), lim, g)
    solid = alpha >= 0.5
    if grid:  # figures touch each other: one label per even grid cell
        gc, gr = grid
        H, W = alpha.shape
        lab = np.zeros(alpha.shape, dtype=np.int32)
        k = 0
        for r in range(gr):
            for c in range(gc):
                k += 1
                ys, ye = r * H // gr, (r + 1) * H // gr
                xs, xe = c * W // gc, (c + 1) * W // gc
                cell = solid[ys:ye, xs:xe]
                cl, cn = ndimage.label(ndimage.binary_dilation(cell, iterations=3))
                if cn:
                    keep = 1 + int(np.argmax(ndimage.sum(cell, cl, range(1, cn + 1))))
                    lab[ys:ye, xs:xe] = np.where(cell & (cl == keep), k, 0)
        big = list(range(1, k + 1))
    else:
        merged = ndimage.binary_dilation(solid, iterations=3)
        lab, n = ndimage.label(merged)
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        total = solid.sum()
        boxes = ndimage.find_objects(lab)
        big = [i + 1 for i, s in enumerate(sizes) if s >= min_frac * total]
        # attach small blobs (loose hair strands, fingers) to the nearest big figure
        for i, s in enumerate(sizes, start=1):
            if i in big or s == 0:
                continue
            sy, sx = boxes[i - 1]
            best, bd = None, 1e9
            for b in big:
                by, bx = boxes[b - 1]
                dx = max(0, bx.start - sx.stop, sx.start - bx.stop)
                dy = max(0, by.start - sy.stop, sy.start - by.stop)
                if dx + dy < bd:
                    best, bd = b, dx + dy
            lab[lab == i] = best if (best and bd <= 40) else 0
    comps = []
    for i in big:
        ys, xs = np.nonzero((lab == i) & solid)
        comps.append({"id": i, "x0": xs.min(), "x1": xs.max() + 1, "y0": ys.min(), "y1": ys.max() + 1, "area": int(len(xs))})
    H, W = alpha.shape
    comps.sort(key=lambda c: c["y0"])
    rows, cur = [], []
    for c in comps:
        if cur and c["y0"] - cur[0]["y0"] > row_tol * H:
            rows.append(cur)
            cur = []
        cur.append(c)
    if cur:
        rows.append(cur)
    ordered = [c for r in rows for c in sorted(r, key=lambda c: c["x0"])]
    if len(ordered) != len(names):
        for c in ordered:
            print("  blob", {k: int(v) for k, v in c.items()})
        raise SystemExit(f"{src}: found {len(ordered)} figures, expected {len(names)}")
    out = []
    for c, name in zip(ordered, names):
        if name == "-":
            continue
        x0, y0 = max(0, c["x0"] - pad), max(0, c["y0"] - pad)
        x1, y1 = min(W, c["x1"] + pad), min(H, c["y1"] + pad)
        keep = (lab == c["id"])[y0:y1, x0:x1]
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] *= keep
        im = Image.fromarray((np.clip(crop, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
        cut_dir = ROOT / "assets" / "raw" / "portraits_cut"
        cut_dir.mkdir(parents=True, exist_ok=True)
        p = cut_dir / f"{name}.png"
        im.save(p)
        webp = pa.convert(p, "portrait", ROOT / "assets" / "portraits", name)
        print(f"{name}: blob {c['x0']},{c['y0']}-{c['x1']},{c['y1']} -> {webp.relative_to(ROOT).as_posix()}")
        out.append(webp)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("sheet", type=Path)
    ap.add_argument("--names", required=True)
    ap.add_argument("--min-frac", type=float, default=0.03)
    ap.add_argument("--row-tol", type=float, default=0.15)
    ap.add_argument("--grid", default=None, help="CxR even grid when figures touch (e.g. 2x2)")
    a = ap.parse_args()
    grid = tuple(int(v) for v in a.grid.lower().split("x")) if a.grid else None
    split(a.sheet, a.names.split(","), a.min_frac, a.row_tol, grid=grid)


if __name__ == "__main__":
    main()
