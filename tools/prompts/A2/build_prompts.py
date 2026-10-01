#!/usr/bin/env python3
"""A2 (character art) prompt + manifest builder.

Writes tools/prompts/A2/<job>.txt and tools/prompts/A2/<manifest>.tsv.
Character descriptions come from tools/make_prompts.py (CHARACTERS); the period
fixes requested by the plan (cheollik 1:1, no paeraengi knob, drooping samo wings)
and the non-15th-century period rules live here.

  python tools/prompts/A2/build_prompts.py          # write every prompt + manifest
  python tools/prompts/A2/build_prompts.py --list   # show jobs
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import make_prompts as mp  # noqa: E402

V2 = "design/art/characters/v2/"
L1, L2, N1 = V2 + "L1_protagonists_lineup.png", V2 + "L2_senior_tongsa_sheet.png", V2 + "N1_npc_lineup_1450s.png"
S1, S3 = V2 + "S1_sd_protagonists_1_2.png", V2 + "S3_sd_senior_and_laborer.png"

# ------------------------------------------------------------------ fixes (plan A2 contract)
FIX = {
    "senior_tongsa": (
        "IMPORTANT PROPORTION (early Joseon cheollik, 1:1): the waist seam with the cord belt sits low, "
        "at hip level, so that in the picture the upper bodice (shoulder to waist seam) and the pleated "
        "skirt (waist seam to hem) look exactly the same length; the pleated skirt is short and ends "
        "at the knee, and the white leg wrappings are clearly visible below it. Not a long skirt, not a "
        "high waist. The hat crown is a smooth rounded dome with no knob, ball or bump on top; the topknot is "
        "fully hidden inside the crown."
    ),
    "commoner_man": (
        "The bamboo hat has a smooth rounded crown with no knob, ball or topknot bump showing on top."
    ),
    "commoner_woman": (
        "The jacket is long and roomy: its hem reaches below the hips, so in a chest-up portrait no "
        "skirt is visible at all; never a short jacket over a high-waisted skirt."
    ),
    "yangban_man": (
        "The hat crown is a smooth rounded dome with no knob, ball or bump on top."
    ),
    "yangban_woman": (
        "All of her hair is hidden under the broad hat (nothing pokes out above the crown). Draw the "
        "veil as a flat solid dark charcoal-gray silk drape (not see-through) hanging from the hat brim "
        "to the elbows, parted at the front so the face is visible."
    ),
    "official": (
        "The two soft wing-flaps at the back of the samo droop downward behind the ears; they do not "
        "stick out sideways."
    ),
}

# ------------------------------------------------------------------ period rules for other eras
ERA_OTHER = {
    "ancient": (
        "PERIOD RULE (Korean Three Kingdoms / Unified Silla, 6th-8th century): no Joseon gat, no "
        "horsehair hats, no Joseon hanbok with short jeogori and high-waisted skirt, no long otgoreum "
        "ribbons, no dopo, no durumagi, no Chinese Qing queue hair, no Japanese kimono, no armor."
    ),
    "16c": (
        "PERIOD RULE (late 16th-century Joseon): no huge flat 18th-century gat brim, no long beaded hat "
        "strings, no very short chest-length jeogori, no huge gache wig, no married-woman low bun with "
        "binyeo, no rank badges, no modern objects."
    ),
    "18c": (
        "PERIOD RULE for the 18th-century characters: no modern objects, no Western clothes, no Qing "
        "queue hair, no Japanese clothing; the dopo, jangot and gache wig are allowed."
    ),
    "1896": (
        "PERIOD RULE for the 1896 characters: no 21st-century objects, no smartphones, no zippers, no "
        "plastic, no sneakers; an early Western frock coat is allowed."
    ),
    "modern": "",
}


def era_rule(keys):
    eras = {mp.ERA_OF.get(k, "15c" if k in mp.HISTORICAL else "modern") for k in keys}
    out = []
    if "15c" in eras:
        rule = mp.ERA_RULE
        if "sejong" in keys:  # the king's dragon roundels are not rank badges
            rule = rule.replace("no rank badges on robes",
                                "no rank badges on the officials' robes (only the king wears round "
                                "dragon roundels)")
        out.append(rule)
    for e in ("ancient", "16c", "18c", "1896"):
        if e in eras:
            out.append(ERA_OTHER[e])
    return " ".join(out)


def desc(key):
    return (mp.CHARACTERS[key] + " " + FIX.get(key, "")).strip()


GREEN = ("Solid flat pure green background (#00FF00) everywhere, no shadows on the background, no "
         "frames, no boxes, no grid lines, no green on the characters.")
REFNOTE = ("Use the reference image(s) to keep the same face, hair and colors; where the reference "
           "disagrees with this text about costume details, follow this text.")


def no_green(text):
    return text.replace("muted green or brown silk", "muted brown silk")


# ------------------------------------------------------------------ builders
def p_expressions(key, exprs=("neutral calm", "surprised", "smiling happily", "thinking, one hand on chin"),
                  full_body=False):
    if full_body:
        layout = (
            "Layout: on the far left, one full-body front view standing straight (head to feet fully "
            "visible); on the right, four bust-up portraits arranged in a 2 by 2 grid: "
        )
    else:
        layout = "Layout: four bust-up portraits arranged in a 2 by 2 grid: "
    ex = list(exprs)
    pos = ["top-left", "top-right", "bottom-left", "bottom-right"]
    layout += ", ".join(f"{pos[i]} {ex[i]}" for i in range(len(ex))) + "."
    return mp._join(
        "CHARACTER EXPRESSION SHEET for dialogue portraits in an educational game.",
        no_green(desc(key)),
        layout,
        "Each bust portrait shows the same character from the top of the head (and hat) down to "
        "mid-chest, facing slightly toward the viewer, same size and scale, head never cut off, "
        "every figure separated from the others by wide empty space.",
        GREEN, REFNOTE, era_rule([key]), mp.STYLE, mp.NO_TEXT,
    )


def p_two_expr_full(key, exprs=("dignified calm", "gentle warm smile")):
    return mp._join(
        "CHARACTER SHEET for dialogue portraits in an educational game.",
        no_green(desc(key)),
        "Layout, left to right with wide empty space between: one full-body front view standing "
        "straight (head to feet fully visible); then two bust-up portraits of the same character "
        f"from the top of the head (and hat) down to mid-chest: first {exprs[0]}, second {exprs[1]}. "
        "Same scale for both busts, head never cut off.",
        GREEN, REFNOTE, era_rule([key]), mp.STYLE, mp.NO_TEXT,
    )


def p_npc_busts(keys):
    """2 or 3 different characters side by side (one row), wide gaps, nothing touching."""
    who = " ".join(f"Character {i + 1} (from the left) = {no_green(desc(k))}" for i, k in enumerate(keys))
    return mp._join(
        f"DIALOGUE PORTRAITS of {len(keys)} DIFFERENT characters for an educational game, side by "
        "side in a single row, one bust-up portrait each.",
        who,
        "Each portrait shows the character from the top of the head (and hat) down to mid-chest, "
        "facing slightly toward the viewer with a friendly natural expression, same scale, head never "
        "cut off. Keep every bust small enough that wide empty green gaps separate the portraits; no "
        "shoulder, sleeve, hat brim or veil may touch another portrait or the edge of the image.",
        GREEN, REFNOTE, era_rule(keys), mp.STYLE, mp.NO_TEXT,
    )


def p_full_body(key, extra=""):
    return mp._join(
        "CHARACTER FULL-BODY REFERENCE for an educational game, one figure only, standing straight, "
        "front view, head to feet fully visible, centered with empty space around.",
        no_green(desc(key)), extra,
        GREEN, REFNOTE, era_rule([key]), mp.STYLE, mp.NO_TEXT,
    )


def p_sd(keys):
    keys = list(keys)
    if len(keys) == 1:
        who = "the character: " + desc(keys[0])
        layout = "Arrange as one clean grid filling the whole image."
    else:
        who = f"first character = {desc(keys[0])} Second character = {desc(keys[1])}"
        layout = ("Arrange as a clean grid: the left half is the first character, the right half is "
                  "the second character, with a wide empty gap between the halves.")
    return mp._join(
        "GAME SPRITE SHEET. Chibi super-deformed versions (about 2.5 heads tall) for a top-down "
        f"3/4-view RPG of {no_green(who)}",
        layout,
        "For each character: 4 rows = walking facing down (toward viewer), facing left, facing "
        "right, facing up (away from viewer); 3 columns = walking frames (left foot forward, "
        "standing, right foot forward). Every cell same size, characters centered, feet on a common "
        "baseline in each row, consistent scale across all frames, wide empty space between rows "
        "and columns (no hat, hair or foot of one frame may come near another frame), no overlap.",
        "Solid flat pure green background (#00FF00) everywhere, no shadows on the background, no "
        "grid lines, no green on the characters.",
        REFNOTE, era_rule(keys), mp.STYLE.rstrip(".") + "." + mp.STYLE_SD, mp.NO_TEXT,
    )


# ------------------------------------------------------------------ jobs
# manifest -> [(job name, size, refs, prompt text builder)]
P = "tools/prompts/A2/"
G = "assets/raw/gen/"  # outputs of other manifests (gitignored)
MANIFESTS = {
    "m1_core": [
        ("pt_hero_1", "1024x1024", L1, lambda: p_expressions("hero_1")),
        ("pt_hero_2", "1024x1024", L1, lambda: p_expressions("hero_2")),
        ("pt_hero_3", "1024x1024", L1, lambda: p_expressions("hero_3")),
        ("pt_hero_4", "1024x1024", L1, lambda: p_expressions("hero_4")),
        ("pt_senior_tongsa", "1536x1024", L2, lambda: p_expressions("senior_tongsa", full_body=True)),
        ("sd_senior_tongsa", "1024x1536", "pt_senior_tongsa;" + S1, lambda: p_sd(["senior_tongsa"])),
    ],
    # King Sejong + 15th-century people (portraits first, then SD sheets referencing them)
    "m2_1450s": [
        ("pt_sejong", "1536x1024", "", lambda: p_two_expr_full("sejong")),
        ("pt_15c_a", "1024x1024", N1,
         lambda: p_npc_busts(["commoner_man", "commoner_woman", "child", "merchant"])),
        ("pt_15c_b", "1024x1024", N1,
         lambda: p_npc_busts(["yangban_man", "yangban_woman", "official", "monk"])),
        ("pt_15c_c", "1536x1024", N1, lambda: p_npc_busts(["artisan", "elder"])),
        ("sd_sejong_official", "1536x1024", "pt_sejong;pt_15c_b;" + S1, lambda: p_sd(["sejong", "official"])),
        ("sd_commoner_man_woman", "1536x1024", "pt_15c_a;" + S1, lambda: p_sd(["commoner_man", "commoner_woman"])),
        ("sd_child_merchant", "1536x1024", "pt_15c_a;" + S1, lambda: p_sd(["child", "merchant"])),
        ("sd_yangban_man_woman", "1536x1024", "pt_15c_b;" + S1, lambda: p_sd(["yangban_man", "yangban_woman"])),
        ("sd_monk_artisan", "1536x1024", "pt_15c_b;pt_15c_c;" + S1, lambda: p_sd(["monk", "artisan"])),
        ("sd_elder", "1024x1536", "pt_15c_c;" + S1, lambda: p_sd(["elder"])),
    ],
    # other eras: ancient (s1), 16c (s10), 18c / 1896 (s11), modern (s0)
    "m3_eras": [
        ("pt_anc_a", "1536x1024", "", lambda: p_npc_busts(["anc_man", "anc_woman"])),
        ("pt_anc_b", "1536x1024", "", lambda: p_npc_busts(["anc_scribe", "anc_child"])),
        ("pt_16c", "1536x1024", "", lambda: p_npc_busts(["teacher_16c", "student_16c"])),
        ("pt_18c", "1536x1024", "", lambda: p_npc_busts(["yeokgwan_18c", "noblewoman_18c"])),
        ("pt_1896", "1536x1024", "", lambda: p_npc_busts(["editor_1896", "newsboy_1896"])),
        ("sd_anc_man_woman", "1536x1024", "pt_anc_a;" + S1, lambda: p_sd(["anc_man", "anc_woman"])),
        ("sd_anc_scribe_child", "1536x1024", "pt_anc_b;" + S1, lambda: p_sd(["anc_scribe", "anc_child"])),
        ("sd_16c", "1536x1024", "pt_16c;" + S1, lambda: p_sd(["teacher_16c", "student_16c"])),
        ("sd_18c", "1536x1024", "pt_18c;" + S1, lambda: p_sd(["yeokgwan_18c", "noblewoman_18c"])),
        ("sd_1896", "1536x1024", "pt_1896;" + S1, lambda: p_sd(["editor_1896", "newsboy_1896"])),
        ("pt_teacher_modern", "1024x1024", L1,
         lambda: p_expressions("teacher_modern", exprs=("neutral calm", "surprised", "smiling warmly", "thinking"))),
        ("sd_teacher_modern", "1024x1536", "pt_teacher_modern;" + S1, lambda: p_sd(["teacher_modern"])),
    ],
    # redo of 15th-century dialogue portraits (2x2 grids touched each other; woman's jacket short;
    # yangban hat knob) + a separate full-body reference for the senior (cheollik 1:1)
    "m4_fix": [
        ("pt15_commoners", "1536x1024", N1, lambda: p_npc_busts(["commoner_man", "commoner_woman"])),
        ("pt15_child_merchant", "1536x1024", G + "pt_15c_a.png", lambda: p_npc_busts(["child", "merchant"])),
        ("pt15_yangban", "1536x1024", N1, lambda: p_npc_busts(["yangban_man", "yangban_woman"])),
        ("pt15_official_monk", "1536x1024", G + "pt_15c_b.png", lambda: p_npc_busts(["official", "monk"])),
        ("sd15_commoners", "1536x1024", "pt15_commoners;" + S1,
         lambda: p_sd(["commoner_man", "commoner_woman"])),
        ("sd15_yangban", "1536x1024", "pt15_yangban;" + S1,
         lambda: p_sd(["yangban_man", "yangban_woman"])),
        ("full_senior_tongsa", "1024x1536", G + "pt_senior_tongsa.png", lambda: p_full_body(
            "senior_tongsa",
            "Measure it: the distance from the shoulders down to the cord belt equals the distance from "
            "the cord belt down to the skirt hem; the hem is at the knees.")),
    ],
}


def build_all():
    for mname, jobs in MANIFESTS.items():
        lines = ["name\tsize\trefs\tprompt"]
        for name, size, refs, fn in jobs:
            text = fn()
            assert "TEXT RULE" in text
            (HERE / f"{name}.txt").write_text(text + "\n", encoding="ascii", newline="\n")
            lines.append(f"{name}\t{size}\t{refs}\t{P}{name}.txt")
        (HERE / f"{mname}.tsv").write_text("\n".join(lines) + "\n", encoding="ascii", newline="\n")
        print(f"{mname}: {len(jobs)} jobs")


if __name__ == "__main__":
    if "--list" in sys.argv:
        for m, jobs in MANIFESTS.items():
            for j in jobs:
                print(m, j[0], j[1], j[2])
    else:
        build_all()
