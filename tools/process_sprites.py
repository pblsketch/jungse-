#!/usr/bin/env python3
"""SD sprite sheet -> game atlas (PNG + JSON).

Pipeline (one character per run):
  1. chroma key (green by default, magenta for legacy sheets) with soft alpha,
     un-premultiply against the key colour and spill suppression on edges
  2. crop the character's region of the sheet (full / left / right / x0,y0,x1,y1)
  3. split into a rows x cols grid by detecting empty gaps in the row/column
     projections (falls back to an even grid when gaps are not found)
  4. per-frame alpha bbox
  5. ONE common scale for every frame = target height / first frame height
  6. foot pivot = median x of opaque pixels in the bottom 12% rows of the bbox,
     baseline = bbox bottom; every frame is placed so pivot/baseline coincide
  7. soft alpha (no binarisation), LANCZOS downscale, no palette quantisation
  8. pack into an atlas  <out-dir>/<name>.png  +  <out-dir>/<name>.json

Example:
  python tools/process_sprites.py design/art/characters/v2/S1_sd_protagonists_1_2.png \
      --name hero_a --region left
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError as exc:  # pragma: no cover - environment problem
    sys.stderr.write(
        "process_sprites.py needs numpy and Pillow. Install with:\n"
        "  python -m pip install numpy Pillow\n"
        f"(import error: {exc})\n"
    )
    sys.exit(3)

ROOT = Path(__file__).resolve().parent.parent
DIRS_DEFAULT = "down,left,right,up"

KEYS = {
    # name: (key rgb, default lo, default hi) -- "keyness" d below lo => opaque,
    # above hi => fully transparent, linear in between.
    "green": ((0, 255, 0), 40.0, 140.0),
    "magenta": ((255, 0, 255), 40.0, 140.0),
}


# --------------------------------------------------------------------------- key
def keyness(rgb: np.ndarray, key: str) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        return g - np.maximum(r, b)
    return np.minimum(r, b) - g  # magenta


def dilate(mask: np.ndarray, it: int) -> np.ndarray:
    m = mask.copy()
    for _ in range(it):
        n = m.copy()
        n[1:, :] |= m[:-1, :]
        n[:-1, :] |= m[1:, :]
        n[:, 1:] |= m[:, :-1]
        n[:, :-1] |= m[:, 1:]
        m = n
    return m


def chroma_key(img: Image.Image, key: str, lo: float, hi: float, spill_px: int = 3) -> np.ndarray:
    """Return float32 RGBA array (0..1) with soft alpha."""
    if hi <= lo:
        raise SystemExit(f"--key-hi ({hi}) must be greater than --key-lo ({lo})")
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
    d = keyness(rgb, key)
    alpha = np.clip((hi - d) / (hi - lo), 0.0, 1.0)
    keyc = np.array(KEYS[key][0], dtype=np.float32)

    # un-premultiply semi-transparent pixels against the key colour
    semi = (alpha > 0.0) & (alpha < 1.0)
    a = alpha[semi][:, None]
    rgb[semi] = np.clip((rgb[semi] - (1.0 - a) * keyc) / a, 0.0, 255.0)

    # spill suppression on an edge band (keeps genuinely green costume interiors)
    band = dilate(alpha < 0.999, spill_px) & (alpha > 0.0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        lim = np.maximum(r, b)
        rgb[..., 1] = np.where(band & (g > lim), lim, g)
    else:  # magenta spill: red and blue both above green -> pull both down
        excess = np.where(band, np.clip(np.minimum(r, b) - g, 0.0, None), 0.0)
        rgb[..., 0] = r - excess
        rgb[..., 2] = b - excess
    out = np.dstack([rgb / 255.0, alpha]).astype(np.float32)
    out[alpha <= 0.0, :3] = 0.0
    return out


# ------------------------------------------------------------------- splitting
def runs(flags: np.ndarray):
    """Yield (start, end) runs of True values (end exclusive)."""
    out, start = [], None
    for i, f in enumerate(flags):
        if f and start is None:
            start = i
        elif not f and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(flags)))
    return out


def cut_positions(proj: np.ndarray, n: int, min_count: float):
    """Find n-1 cut positions in a projection.

    1) widest interior empty gaps (projection <= min_count), else
    2) the deepest valley of the smoothed projection near each even boundary.
    """
    length = len(proj)
    if n <= 1:
        return [0, length], "single"
    empty = proj <= min_count
    gaps = [(s, e) for s, e in runs(empty) if s > 0 and e < length]
    if len(gaps) >= n - 1:
        best = sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[: n - 1]
        cuts = sorted((s + e) // 2 for s, e in best)
        return [0] + cuts + [length], "gaps"
    k = 5
    smooth = np.convolve(proj, np.ones(k) / k, mode="same")
    step = length / n
    win = int(step * 0.3)
    cuts = []
    for i in range(1, n):
        c = int(round(i * step))
        a, b = max(1, c - win), min(length - 1, c + win + 1)
        cuts.append(a + int(np.argmin(smooth[a:b])))
    return [0] + cuts + [length], "valley"


def bbox(alpha: np.ndarray, thr: float = 0.5, min_px: int = 2):
    m = alpha >= thr
    rows = np.nonzero(m.sum(axis=1) >= min_px)[0]
    cols = np.nonzero(m.sum(axis=0) >= min_px)[0]
    if rows.size == 0 or cols.size == 0:
        return None
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def parse_region(spec: str, w: int, h: int):
    if spec == "full":
        return 0, 0, w, h
    if spec == "left":
        return 0, 0, w // 2, h
    if spec == "right":
        return w // 2, 0, w, h
    parts = [int(p) for p in spec.split(",")]
    if len(parts) != 4:
        raise SystemExit("--region must be full|left|right|x0,y0,x1,y1")
    x0, y0, x1, y1 = parts
    if not (0 <= x0 < x1 <= w and 0 <= y0 < y1 <= h):
        raise SystemExit(f"--region {spec} outside image {w}x{h}")
    return x0, y0, x1, y1


# ------------------------------------------------------------------- pipeline
def process(args) -> dict:
    src = Path(args.sheet)
    if not src.is_file():
        raise SystemExit(f"sheet not found: {src}")
    img = Image.open(src)
    W, H = img.size
    x0, y0, x1, y1 = parse_region(args.region, W, H)
    lo = args.key_lo if args.key_lo is not None else KEYS[args.key][1]
    hi = args.key_hi if args.key_hi is not None else KEYS[args.key][2]
    rgba = chroma_key(img.crop((x0, y0, x1, y1)), args.key, lo, hi)
    alpha = rgba[..., 3]
    dirs = [d.strip() for d in args.row_order.split(",") if d.strip()]
    if len(dirs) != args.rows:
        raise SystemExit(f"--row-order has {len(dirs)} entries, expected --rows {args.rows}")

    solid = alpha >= 0.5
    min_count = max(1.0, args.gap_noise)
    warnings = []
    # columns over the whole region, then rows separately inside each column strip
    # (rows of neighbouring columns may overlap vertically: shoes vs. hair)
    ccuts, cmode = cut_positions(solid.sum(axis=0).astype(float), args.cols, min_count)
    rcuts_per_col = []
    for ci in range(args.cols):
        strip = solid[:, ccuts[ci]:ccuts[ci + 1]]
        rc, rmode = cut_positions(strip.sum(axis=1).astype(float), args.rows, min_count)
        rcuts_per_col.append(rc)
        if rmode != "gaps":
            warnings.append(f"column {ci}: row split used '{rmode}' (no clean gaps)")
    if cmode != "gaps":
        warnings.append(f"column split used '{cmode}' (no clean gaps)")

    frames = []
    for ri in range(args.rows):
        for ci in range(args.cols):
            rcuts = rcuts_per_col[ci]
            cy0, cy1, cx0, cx1 = rcuts[ri], rcuts[ri + 1], ccuts[ci], ccuts[ci + 1]
            cell = rgba[cy0:cy1, cx0:cx1]
            bb = bbox(cell[..., 3])
            if bb is None:
                raise SystemExit(f"empty frame at row {ri} col {ci} (check --region/--rows/--cols/--key)")
            bx0, by0, bx1, by1 = bb
            fr = cell[by0:by1, bx0:bx1]
            fh = by1 - by0
            foot_rows = max(1, int(round(fh * 0.12)))
            foot = fr[-foot_rows:, :, 3] >= 0.5
            xs = np.nonzero(foot)[1]
            pivot_x = float(np.median(xs)) if xs.size else (bx1 - bx0) / 2.0
            frames.append({
                "dir": dirs[ri], "step": ci, "data": fr,
                "srcBBox": [x0 + cx0 + bx0, y0 + cy0 + by0, x0 + cx0 + bx1, y0 + cy0 + by1],
                "pivotX": pivot_x, "w": bx1 - bx0, "h": fh,
            })

    scale = args.target_height / frames[0]["h"]
    if scale > 1.0:
        warnings.append(f"upscaling (scale {scale:.3f}); source sprites are smaller than target height")

    # scaled frames (premultiplied LANCZOS via Pillow's RGBA path)
    for f in frames:
        nw = max(1, int(round(f["w"] * scale)))
        nh = max(1, int(round(f["h"] * scale)))
        im = Image.fromarray((np.clip(f["data"], 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
        f["img"] = im.resize((nw, nh), Image.LANCZOS)
        f["px"] = int(round(f["pivotX"] * scale))  # pivot x inside the scaled frame
        f["nw"], f["nh"] = nw, nh

    pad = args.pad
    left = max(f["px"] for f in frames)
    right = max(f["nw"] - f["px"] for f in frames)
    up = max(f["nh"] for f in frames)
    need_w = 2 * max(left, right) + 2 * pad  # symmetric so pivot is centred
    need_h = up + 2 * pad
    if args.cell == "auto":
        cw = need_w + (-need_w) % 4
        ch = need_h + (-need_h) % 4
    else:
        try:
            cw, ch = (int(v) for v in args.cell.lower().split("x"))
        except ValueError:
            raise SystemExit("--cell must be auto or WxH")
    pivot = (cw // 2, ch - pad)

    errors = []
    for i, f in enumerate(frames):
        ox, oy = pivot[0] - f["px"], pivot[1] - f["nh"]
        f["ox"], f["oy"] = ox, oy
        if ox < 0 or oy < 0 or ox + f["nw"] > cw or oy + f["nh"] > ch:
            errors.append(f"frame {i} ({f['dir']} {f['step']}) {f['nw']}x{f['nh']} exceeds cell {cw}x{ch}")
    if errors:
        for e in errors:
            sys.stderr.write("ERROR: " + e + "\n")
        raise SystemExit(2)

    cols = args.cols
    atlas = Image.new("RGBA", (cw * cols, ch * args.rows), (0, 0, 0, 0))
    meta_frames = []
    for i, f in enumerate(frames):
        cx, cy = (i % cols) * cw, (i // cols) * ch
        layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        layer.paste(f["img"], (f["ox"], f["oy"]))
        atlas.alpha_composite(layer, (cx, cy))
        meta_frames.append({
            "index": i, "dir": f["dir"], "step": f["step"],
            "x": cx, "y": cy, "w": cw, "h": ch,
            "srcBBox": f["srcBBox"],
        })

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    png_path = out_dir / f"{args.name}.png"
    json_path = out_dir / f"{args.name}.json"
    atlas.save(png_path, optimize=True)

    def row_of(d):
        return dirs.index(d) if d in dirs else None

    walk = [int(v) for v in args.walk_cycle.split(",")]
    anims = {}
    for d in ("down", "left", "up"):
        r = row_of(d)
        if r is None:
            warnings.append(f"no '{d}' row in --row-order")
            continue
        anims[d] = {"frames": [r * cols + s for s in walk], "fps": args.fps, "repeat": -1}
    rd = row_of("down")
    if rd is not None:
        anims["idle"] = {"frames": [rd * cols + args.idle_step], "fps": 1, "repeat": -1}
    try:
        src_rel = src.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        src_rel = src.name

    meta = {
        "name": args.name,
        "image": png_path.name,
        "source": src_rel,
        "sourceRegion": [x0, y0, x1, y1],
        "frameWidth": cw, "frameHeight": ch,
        "frameCount": len(frames),
        "columns": cols, "rows": args.rows,
        "rowOrder": dirs,
        "pivot": {"x": pivot[0], "y": pivot[1]},
        "origin": {"x": round(pivot[0] / cw, 4), "y": round(pivot[1] / ch, 4)},
        "scale": round(scale, 5),
        "targetHeight": args.target_height,
        "anims": anims,
        "flip": {"right": "left"},
        "frames": meta_frames,
        "warnings": warnings,
    }
    json_path.write_text(json.dumps(meta, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")

    if not args.no_raw:
        raw_dir = Path(args.raw_dir)
        try:
            src.resolve().relative_to(raw_dir.resolve())
        except ValueError:
            raw_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, raw_dir / src.name)

    for w in warnings:
        sys.stderr.write("WARN: " + w + "\n")
    print(f"atlas {png_path} ({atlas.width}x{atlas.height}), frame {cw}x{ch}, "
          f"{len(frames)} frames, scale {scale:.4f}, pivot {pivot}")
    return meta


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("sheet", help="sprite sheet PNG (solid green or magenta background)")
    p.add_argument("--name", required=True, help="output base name (assets/sprites/<name>.png/.json)")
    p.add_argument("--region", default="full", help="full | left | right | x0,y0,x1,y1 (character area)")
    p.add_argument("--rows", type=int, default=4)
    p.add_argument("--cols", type=int, default=3)
    p.add_argument("--row-order", default=DIRS_DEFAULT, help="direction per row (default %(default)s)")
    p.add_argument("--key", choices=sorted(KEYS), default="green")
    p.add_argument("--key-lo", type=float, default=None, help="keyness at/below which a pixel is opaque")
    p.add_argument("--key-hi", type=float, default=None, help="keyness at/above which a pixel is transparent")
    p.add_argument("--gap-noise", type=float, default=2.0, help="max opaque px in a projection line counted as gap")
    p.add_argument("--target-height", type=int, default=112, help="first frame character height in px")
    p.add_argument("--cell", default="auto", help="auto or WxH (fails if a frame does not fit)")
    p.add_argument("--pad", type=int, default=2)
    p.add_argument("--fps", type=int, default=8)
    p.add_argument("--walk-cycle", default="0,1,2,1", help="step indices of the walk animation")
    p.add_argument("--idle-step", type=int, default=1)
    p.add_argument("--out-dir", default=str(ROOT / "assets" / "sprites"))
    p.add_argument("--raw-dir", default=str(ROOT / "assets" / "raw" / "sprites"),
                   help="keep a copy of the original sheet here (gitignored)")
    p.add_argument("--no-raw", action="store_true", help="do not copy the original sheet to --raw-dir")
    args = p.parse_args(argv)
    process(args)


if __name__ == "__main__":
    main()
