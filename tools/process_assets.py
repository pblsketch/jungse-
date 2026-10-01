#!/usr/bin/env python3
"""Generated images -> game-ready files. Originals are kept under assets/raw/<kind>/ (gitignored).

  kind      output                         size rule                quality
  bg        assets/bg/<name>.webp          width <= 1920            webp q80
  portrait  assets/portraits/<name>.webp   longest side <= 512      webp q84 (alpha kept)
  cg        assets/cg/<name>.webp          width <= 1280            webp q80
  og        assets/ui/og.jpg               cover-crop to 1200x630   jpeg q85

Usage:
  python tools/process_assets.py bg assets/raw/gen/map_market_street.png
  python tools/process_assets.py portrait a.png b.png --out-dir assets/portraits
  python tools/process_assets.py og cover.png --name og
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover
    sys.stderr.write("process_assets.py needs Pillow: python -m pip install Pillow\n"
                     f"(import error: {exc})\n")
    sys.exit(3)

ROOT = Path(__file__).resolve().parent.parent

KINDS = {
    #  kind: (out dir, mode, limit, quality, ext)
    "bg": ("assets/bg", "width", 1920, 80, "webp"),
    "portrait": ("assets/portraits", "longest", 512, 84, "webp"),
    "cg": ("assets/cg", "width", 1280, 80, "webp"),
    "og": ("assets/ui", "cover", (1200, 630), 85, "jpg"),
}


def keep_raw(src: Path, kind: str, raw_root: Path) -> None:
    dst_dir = raw_root / kind
    try:
        src.resolve().relative_to(raw_root.resolve())
        return  # already an original under assets/raw
    except ValueError:
        pass
    dst_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst_dir / src.name)


def convert(src: Path, kind: str, out_dir: Path, name: str | None) -> Path:
    _, mode, limit, quality, ext = KINDS[kind]
    im = Image.open(src)
    im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    if mode == "cover":
        im = ImageOps.fit(im.convert("RGB"), limit, Image.LANCZOS, centering=(0.5, 0.5))
    else:
        w, h = im.size
        ref = w if mode == "width" else max(w, h)
        if ref > limit:
            s = limit / ref
            im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        im = im.convert("RGBA" if (has_alpha and kind == "portrait") else "RGB")
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{name or src.stem}.{ext}"
    if ext == "webp":
        im.save(out, "WEBP", quality=quality, method=6)
    else:
        im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("kind", choices=sorted(KINDS))
    ap.add_argument("inputs", nargs="+", type=Path)
    ap.add_argument("--out-dir", type=Path, default=None, help="override output folder")
    ap.add_argument("--name", default=None, help="output base name (single input only)")
    ap.add_argument("--raw-dir", type=Path, default=ROOT / "assets" / "raw")
    ap.add_argument("--no-raw", action="store_true", help="do not keep originals in --raw-dir")
    a = ap.parse_args(argv)
    if a.name and len(a.inputs) > 1:
        raise SystemExit("--name works with a single input only")
    out_dir = a.out_dir or (ROOT / KINDS[a.kind][0])
    for src in a.inputs:
        if not src.is_file():
            raise SystemExit(f"input not found: {src}")
        if not a.no_raw:
            keep_raw(src, a.kind, a.raw_dir)
        out = convert(src, a.kind, out_dir, a.name)
        with Image.open(out) as o:
            print(f"{src.name} -> {out} {o.size[0]}x{o.size[1]} {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
