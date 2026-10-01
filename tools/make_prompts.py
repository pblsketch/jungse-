#!/usr/bin/env python3
"""Build ASCII-only English image prompts for tools/gen.ps1 (Codex image_gen).

Every prompt = subject + ART STYLE paragraph + TEXT RULE. Costume phrases are
copied from design/research/08_bokshik_gojeung (section 6, design/research/08_*.md).

CLI:
  python tools/make_prompts.py list
  python tools/make_prompts.py portrait senior_tongsa            -> stdout
  python tools/make_prompts.py sd hero_1 hero_2 --out tools/prompts/sd_x.txt
  python tools/make_prompts.py map --desc "a 1450s market street ..." --screens 2
  python tools/make_prompts.py cg --desc "..." --chars senior_tongsa,hero_1
  python tools/make_prompts.py samples      -> tools/prompts/*.txt + sample_manifest.tsv
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPT_DIR = ROOT / "tools" / "prompts"

STYLE = (
    "ART STYLE: Modern Korean webtoon illustration - clean confident line art, cel shading "
    "with soft gradients, bright friendly palette, expressive faces, polished and appealing "
    "to teenagers."
)
STYLE_SD = " (simplified for small sprites, slightly thicker outlines)."

NO_TEXT = (
    "TEXT RULE: Absolutely no text, no letters, no Hangul, no Chinese characters (no Hanja), "
    "no numbers, no labels, no captions, no signature, no watermark, and no brand logos, "
    "brand marks or swoosh marks on shoes or clothing anywhere in the image."
)

# Things a 15th-century (1440s-1450s) Joseon scene must not contain (08 section 5).
ERA_RULE = (
    "PERIOD RULE (early Joseon, 1440s-1450s): no wide flat late-Joseon gat, no flat-topped "
    "cylinder hats, no long beaded hat strings, no dopo, no durumagi, no changui, no cropped "
    "jeogori with high-waisted chest-high skirt, no long otgoreum ribbons, no married-woman "
    "low bun with binyeo hairpin, no huge gache wig, no sseugae-chima, no rank badges on "
    "robes, no stiff horizontal samo wings, no bright red monk kasaya."
)

# 08_bokshik_gojeung.md section 6 (copied verbatim, ASCII).
COSTUME = {
    "senior_tongsa": (
        "Korean court interpreter in his late twenties, mid-15th century, everyday work dress: "
        "deep indigo-navy pleated-waist robe (cheollik) whose upper bodice and pleated lower skirt "
        "are of equal length, narrow straight collar, thin cord belt, white leg wrappings, plain "
        "cloth shoes; topknot with black horsehair headband (manggeon) under a black lacquered hat "
        "with a rounded dome crown and a moderate brim, clearly smaller and less flat than "
        "late-Joseon gat, simple chin strap. No dopo, no durumagi, no oversized flat brim, no "
        "beaded hat strings."
    ),
    "commoner_man": (
        "Early Joseon Korean laborer, 1450s: long loose hemp jacket reaching the hips with narrow "
        "straight collar and side slits, wide baggy trousers bound below the knee with leg "
        "wrappings, straw sandals, topknot under a round-crowned bamboo hat (paeraengi). Undyed "
        "off-white and light brown hemp. No wide flat black gat, no durumagi."
    ),
    "commoner_woman": (
        "Early Joseon Korean commoner woman, 1450s: long roomy jacket covering the hips with square "
        "straight collar, straight wide sleeves and tiny ties, worn over a full wrap skirt. Hair "
        "braided and pinned up on the crown, modest volume. Muted brown, indigo, off-white. No "
        "cropped jeogori, no high-waisted skirt, no low bun at the nape."
    ),
    "yangban_man": (
        "Early Joseon scholar-gentleman, 1450s: long straight-collared robe with half-sleeved "
        "overcoat (dapho), muted green or brown silk, belt cord, cloth boots; black hat with "
        "rounded dome crown and medium brim. No beaded hat strings, no huge flat brim, no durumagi."
    ),
    "official": (
        "Joseon official, 1450s: round-collared wide-sleeved court robe reaching the heels, very "
        "dark navy-black silk, rigid rank belt, black boots; black gauze official hat (samo) with "
        "soft wing-flaps drooping downward. No rank badge (or only for 3rd rank and above after "
        "1454). No stiff horizontal wings."
    ),
    "yangban_woman": (
        "Early Joseon noblewoman, 1450s, outdoor attire: long hip-length jacket with square collar "
        "and wide straight sleeves over full skirt; face veiled by sheer black silk drape hanging "
        "from a broad hat (neoul). Hair pinned up on crown, moderate volume. No sseugae-chima, no "
        "huge wig, no cropped jacket."
    ),
    "child": (
        "Early Joseon Korean child, 1450s: hair tied in two small topknots on either side of the "
        "crown, loose long jacket and wide trousers in undyed or pale indigo cotton, straw sandals. "
        "No single long braid with red ribbon."
    ),
    "monk": (
        "Joseon Buddhist monk, mid-15th century: shaved head, long wide-sleeved robe (jangsam) in "
        "blue-gray, patchwork mantle (kasaya) in muted brown over one shoulder, straw sandals. "
        "Avoid bright red kasaya."
    ),
}

# Modern protagonists (from the approved v2 lineup prompt).
PROTAGONISTS = {
    "hero_1": (
        "Protagonist 1: a Korean high-school girl, shoulder-length black bob hair, bright curious "
        "eyes, navy school blazer with white shirt and red ribbon tie, gray pleated skirt over dark "
        "leggings, plain white canvas sneakers, small brown leather notebook in one hand."
    ),
    "hero_2": (
        "Protagonist 2: a Korean high-school boy, short messy black hair, round thin-framed glasses, "
        "slightly shy gentle smile, navy school blazer with white shirt and navy tie, gray trousers, "
        "plain white sneakers, small brown leather notebook held to his chest."
    ),
    "hero_3": (
        "Protagonist 3: a Korean high-school girl, high black ponytail, energetic grin, navy school "
        "blazer worn open over a light gray hoodie, gray trousers, plain blue-and-white sneakers "
        "with no logos, small brown leather notebook tucked under her arm."
    ),
    "hero_4": (
        "Protagonist 4: a tall Korean high-school boy, very short cropped hair, calm thoughtful "
        "face, navy school cardigan over white shirt with navy tie, gray trousers, plain dark gray "
        "sneakers with no logos, small brown leather notebook in hand."
    ),
}

# ---- A2 additions (additive): more 15th-century people + other eras.
# Sources and reasoning: design/research/12_bokshik_chuga_gojeung (design/research/12_*.md).
# 15th-century keys go into COSTUME (they get the 1440s PERIOD RULE);
# other-era keys go into OTHER_ERA with their era in ERA_OF (no 1440s rule).
COSTUME.update({
    "sejong": (
        "King Sejong of early Joseon, 1440s, a dignified kind man in his late forties with a round "
        "gentle face, slightly stout build, neat black mustache and short full beard: deep crimson "
        "round-collared royal robe with fairly narrow sleeves reaching the ankles, round gold-embroidered "
        "roundels on the chest and both shoulders showing a small stylized coiled dragon (simple, not "
        "over-detailed), white inner collar, flat jade-plaque belt, black boots; black silk royal hat "
        "(ikseongwan) with a rounded two-tier crown and two small rounded wings standing upward at the "
        "back. No crown jewels, no golden crown, no Chinese emperor yellow robe, no long beaded hat strings."
    ),
    "artisan": (
        "Early Joseon type-casting and printing workshop artisan, 1450s, a sturdy young man: long loose "
        "hip-length hemp jacket with narrow straight collar and sleeves tied back for work, wide baggy "
        "trousers bound below the knee with leg wrappings, straw sandals, topknot with a plain off-white "
        "cloth headband, ink smudges on the hands, holding a small blank wooden tray. Undyed off-white "
        "and gray-brown hemp. No hat brim, no apron with writing, no durumagi."
    ),
    "merchant": (
        "Early Joseon market merchant, 1450s, a cheerful middle-aged man with a short beard: long "
        "hip-length brown cotton jacket with narrow straight collar and side slits, wide trousers bound "
        "below the knee with leg wrappings, straw shoes, topknot under a woven straw hat (choribi) with a "
        "smooth rounded crown and a moderate brim, no knob on top, a cloth pouch hanging at the belt, "
        "holding a small wooden measuring box. No wide flat black gat, no durumagi."
    ),
    "elder": (
        "Early Joseon elderly farmer, 1450s, a thin old man with a white topknot, white beard and kind "
        "wrinkles: long loose off-white hemp jacket reaching the hips with narrow straight collar, wide "
        "trousers with leg wrappings, straw sandals, a plain black horsehair headband (manggeon), "
        "leaning on a wooden walking stick. No wide flat black gat, no durumagi."
    ),
})

# Other eras (not 1440s). ERA_OF value: ancient | 16c | 18c | 1896 | modern.
OTHER_ERA = {
    "anc_man": (
        "Silla villager man, Korean Three Kingdoms period (6th-7th century): hip-length jacket wrapped "
        "to the right and tied at the waist with a cloth sash, darker contrasting trim bands on the "
        "collar, cuffs and hem, wide trousers gathered at the ankles, straw sandals, hair in a topknot "
        "wrapped with a plain cloth kerchief. Undyed hemp beige with brown trim."
    ),
    "anc_woman": (
        "Silla villager woman, Korean Three Kingdoms period (6th-7th century): hip-length jacket wrapped "
        "to the right and tied at the waist with a cloth sash, darker contrasting trim bands on the "
        "collar, cuffs and hem, worn over a long finely pleated skirt reaching the ground, hair coiled "
        "up on the head simply. Muted ochre jacket, rust-brown trim, dark indigo skirt."
    ),
    "anc_child": (
        "Silla village child, Korean Three Kingdoms period (about 600 AD), a lively kid who sings songs "
        "in the street: small hip-length jacket tied with a sash, contrasting trim on collar and cuffs, "
        "wide trousers gathered at the ankles, straw sandals, hair simply tied back. Undyed beige and "
        "faded red-brown."
    ),
    "anc_scribe": (
        "Unified Silla scribe official (8th century), a thoughtful man in his thirties with a thin "
        "mustache: round-collared long robe (dallyeong) in muted ochre yellow, black waist belt, black "
        "soft cloth cap (bokdu) with two short stiff tails at the back, black shoes, holding a blank "
        "wooden writing slip and a brush. No Joseon gat, no Joseon hanbok."
    ),
    "teacher_16c": (
        "Village schoolmaster (hunjang) of a late 16th-century Joseon seodang, a calm scholar in his "
        "fifties with a gray beard: long light gray-white straight-collared robe with wide sleeves, thin "
        "dark belt cord, cloth socks and shoes, black horsehair hat (gat) with a tall rounded crown and "
        "a narrow brim, holding a closed blank book. No huge flat brim, no beaded hat strings."
    ),
    "student_16c": (
        "Seodang schoolboy of late 16th-century Joseon, about ten years old, bright eyes: hair tied in "
        "two small topknots on either side of the crown, long loose jacket reaching the hips and wide "
        "trousers in pale indigo and off-white cotton, cloth socks, holding a closed blank book. No "
        "modern items."
    ),
    "yeokgwan_18c": (
        "Late 18th-century Joseon Chinese-language interpreter (yeokgwan) on a journey to the capital, "
        "a smart man in his forties with a trimmed beard: long pale blue-gray dopo robe with wide sleeves "
        "and a thin dark belt cord, white trousers with ankle ties, black leather shoes, black horsehair "
        "gat with a wide brim and a simple chin strap, a cloth travel bundle on the shoulder."
    ),
    "noblewoman_18c": (
        "Joseon noblewoman traveller of the 1770s, a graceful woman in her forties: very short white "
        "jeogori with deep purple collar and cuff trim, full deep navy skirt worn high, a large braided "
        "gache wig coiled on the head with simple pins, a dark blue jangot cloak draped over her "
        "shoulders (face visible), holding a small folding fan."
    ),
    "editor_1896": (
        "Seoul newspaper editor in 1896, a lively Korean man in his thirties with short cropped hair (no "
        "topknot) and round spectacles: dark Western-style frock coat over a white high-collared shirt "
        "and a simple tie, dark trousers, black leather shoes, holding a folded blank newspaper sheet."
    ),
    "newsboy_1896": (
        "Seoul newspaper seller boy in 1896, about twelve years old, cheerful: white cotton jeogori and "
        "baggy trousers tied at the ankles, a dark sleeveless vest, a single long braid down the back, "
        "straw sandals, carrying a stack of blank folded newspapers under one arm."
    ),
    "teacher_modern": (
        "Modern Korean high-school teacher in 2026, a friendly woman in her thirties with shoulder-length "
        "brown-black hair tied low: beige knit cardigan over a white blouse, navy slacks, plain flat "
        "shoes, holding a closed blank folder."
    ),
}
ERA_OF = {
    "anc_man": "ancient", "anc_woman": "ancient", "anc_child": "ancient", "anc_scribe": "ancient",
    "teacher_16c": "16c", "student_16c": "16c",
    "yeokgwan_18c": "18c", "noblewoman_18c": "18c",
    "editor_1896": "1896", "newsboy_1896": "1896",
    "teacher_modern": "modern",
}

CHARACTERS = {**PROTAGONISTS, **COSTUME, **OTHER_ERA}
HISTORICAL = set(COSTUME)


# ----------------------------------------------------------------- helpers
def ensure_ascii(text: str, what: str = "prompt") -> str:
    bad = sorted({c for c in text if ord(c) > 126 or (ord(c) < 32 and c not in "\n")})
    assert not bad, f"{what} contains non-ASCII characters: {bad!r}"
    assert '"' not in text, f"{what} must not contain double quotes (breaks the codex argument)"
    return text


def _char(key: str) -> str:
    if key not in CHARACTERS:
        raise SystemExit(f"unknown character '{key}'. Known: {', '.join(CHARACTERS)}")
    return CHARACTERS[key]


def _join(*parts: str) -> str:
    return ensure_ascii(" ".join(p.strip() for p in parts if p and p.strip()))


def _era(keys) -> str:
    return ERA_RULE if any(k in HISTORICAL for k in keys) else ""


# ----------------------------------------------------------------- builders
def portrait_sheet(key: str, expressions: str = "neutral, smiling, surprised, thinking") -> str:
    """Character portrait sheet: full body front + bust expressions (dialogue portraits)."""
    return _join(
        "CHARACTER PORTRAIT SHEET for an educational game.",
        _char(key),
        "Left side: one full-body front view, relaxed natural pose. Right side: four bust-up "
        f"portraits of the same character with different expressions ({expressions}), each "
        "framed from the chest up, facing slightly toward the viewer, evenly spaced, same scale.",
        "Plain very light warm-gray background, soft floor shadow only, no frames or boxes.",
        _era([key]), STYLE, NO_TEXT,
    )


def sd_sheet(keys) -> str:
    """SD walking sprite sheet for 1 or 2 characters (left half / right half)."""
    keys = list(keys)
    if not 1 <= len(keys) <= 2:
        raise SystemExit("sd sheet takes 1 or 2 characters")
    if len(keys) == 1:
        who = "the character: " + _char(keys[0])
        layout = "Arrange as one clean grid filling the whole image."
    else:
        who = f"first character = {_char(keys[0])} Second character = {_char(keys[1])}"
        layout = ("Arrange as a clean grid: the left half is the first character, the right half "
                  "is the second character, with a wide empty gap between the halves.")
    # green costume parts would be eaten by the green chroma key
    who = who.replace("muted green or brown silk", "muted brown silk")
    return _join(
        "GAME SPRITE SHEET. Chibi super-deformed versions (about 2.5 heads tall) for a top-down "
        f"3/4-view RPG of {who}",
        layout,
        "For each character: 4 rows = walking facing down (toward viewer), facing left, facing "
        "right, facing up (away from viewer); 3 columns = walking frames (left foot forward, "
        "standing, right foot forward). Every cell same size, characters centered, feet on a "
        "common baseline in each row, consistent scale across all frames, clear empty space "
        "between rows and columns, no overlap.",
        "Solid flat pure green background (#00FF00) everywhere, no shadows on the background, no "
        "grid lines, no green on the characters.",
        _era(keys), STYLE.rstrip(".") + "." + STYLE_SD, NO_TEXT,
    )


def map_background(desc: str, screens: int = 1) -> str:
    """Top-down 3/4 webtoon map background, 1-2 screens wide, no characters."""
    if screens not in (1, 2):
        raise SystemExit("--screens must be 1 or 2")
    span = ("one game screen" if screens == 1 else
            "two game screens wide (a continuous panorama the camera can scroll across)")
    return _join(
        f"GAME MAP BACKGROUND, top-down 3/4 view, webtoon style, {span}: {desc.strip().rstrip('.')}.",
        "Empty of people and animals, walkable open ground in the middle, clear readable shapes, "
        "even soft daylight, no vignette.",
        "Any signboards, banners, books, scrolls or papers are blank paper with no writing.",
        ERA_RULE, STYLE, NO_TEXT,
    )


def cg_scene(desc: str, chars=()) -> str:
    """Story CG illustration (cinematic, wide)."""
    chars = list(chars)
    cast = " ".join(_char(k) for k in chars)
    return _join(
        f"STORY ILLUSTRATION (event CG) for an educational game: {desc.strip().rstrip('.')}.",
        ("Characters: " + cast) if cast else "",
        "Cinematic composition, clear focal point, warm emotional lighting.",
        "Any books, scrolls, papers or signboards are blank with no writing.",
        _era(chars) if chars else ERA_RULE, STYLE, NO_TEXT,
    )


# ----------------------------------------------------------------- samples
SAMPLES = [
    # name, size, refs, builder
    ("portrait_senior_tongsa", "1536x1024", "", lambda: portrait_sheet("senior_tongsa")),
    ("sd_hero_1_2", "1536x1024", "design/art/characters/v2/L1_protagonists_lineup.png",
     lambda: sd_sheet(["hero_1", "hero_2"])),
    ("sd_commoner_man_woman", "1536x1024", "design/art/characters/v2/N1_npc_lineup_1450s.png",
     lambda: sd_sheet(["commoner_man", "commoner_woman"])),
    ("map_market_street", "1536x1024", "", lambda: map_background(
        "a 1450s Hanyang market street with thatched and tiled-roof shops, wooden stalls with "
        "baskets of cabbages and dried fish, a stone well, dirt road", screens=2)),
    ("cg_first_meeting", "1536x1024", "portrait_senior_tongsa", lambda: cg_scene(
        "a modern high-school girl in uniform meets a young court interpreter in a quiet "
        "palace courtyard at dusk, both surprised", ["hero_1", "senior_tongsa"])),
]


def write_samples() -> None:
    PROMPT_DIR.mkdir(parents=True, exist_ok=True)
    lines = ["name\tsize\trefs\tprompt"]
    for name, size, refs, build in SAMPLES:
        path = PROMPT_DIR / f"{name}.txt"
        path.write_text(build() + "\n", encoding="ascii", newline="\n")
        lines.append(f"{name}\t{size}\t{refs}\ttools/prompts/{name}.txt")
        print("wrote", path.relative_to(ROOT).as_posix())
    manifest = PROMPT_DIR / "sample_manifest.tsv"
    manifest.write_text("\n".join(lines) + "\n", encoding="ascii", newline="\n")
    print("wrote", manifest.relative_to(ROOT).as_posix())


def self_check() -> None:
    for k, v in CHARACTERS.items():
        ensure_ascii(v, f"character {k}")
    for s in (STYLE, STYLE_SD, NO_TEXT, ERA_RULE):
        ensure_ascii(s)
    for name, _size, _refs, build in SAMPLES:
        p = build()
        assert "TEXT RULE" in p and "ART STYLE" in p, name


def main(argv=None):
    self_check()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="list character keys")
    sp = sub.add_parser("portrait"); sp.add_argument("char"); sp.add_argument("--out")
    sp = sub.add_parser("sd"); sp.add_argument("chars", nargs="+"); sp.add_argument("--out")
    sp = sub.add_parser("map"); sp.add_argument("--desc", required=True)
    sp.add_argument("--screens", type=int, default=1); sp.add_argument("--out")
    sp = sub.add_parser("cg"); sp.add_argument("--desc", required=True)
    sp.add_argument("--chars", default=""); sp.add_argument("--out")
    sub.add_parser("samples", help="write sample prompts + tools/prompts/sample_manifest.tsv")
    a = ap.parse_args(argv)

    if a.cmd == "list":
        for k in CHARACTERS:
            print(k + ("  (1450s)" if k in HISTORICAL else "  (modern)"))
        return
    if a.cmd == "samples":
        write_samples()
        return
    if a.cmd == "portrait":
        text = portrait_sheet(a.char)
    elif a.cmd == "sd":
        text = sd_sheet(a.chars)
    elif a.cmd == "map":
        text = map_background(ensure_ascii(a.desc, "--desc"), a.screens)
    else:
        chars = [c for c in a.chars.split(",") if c]
        text = cg_scene(ensure_ascii(a.desc, "--desc"), chars)
    if a.out:
        out = Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text + "\n", encoding="ascii", newline="\n")
        print("wrote", out)
    else:
        sys.stdout.write(text + "\n")


if __name__ == "__main__":
    main()
