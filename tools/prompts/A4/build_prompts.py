#!/usr/bin/env python3
"""A4 scene / misread / key-art / icon prompts -> tools/prompts/A4/*.txt + manifest.tsv.

Reuses the shared pieces of tools/make_prompts.py (ART STYLE, TEXT RULE, PERIOD RULE and the
08 costume phrases) and adds A4-only phrases:
  - PLAYER: the protagonist is chosen by the player (4 options), so scene art never shows a
    specific protagonist's face or hairstyle (back view / over-the-shoulder / hands only).
  - SEJONG: kept non-committal (doc 08 has no royal attire): plain robe, no emblems.
  - other-era PERIOD RULEs for s1 (ancient), s10 (late 16th c.), s11 (18th c. / 1896).

  python tools/prompts/A4/build_prompts.py         # writes the files
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from make_prompts import COSTUME as _COSTUME, ERA_RULE, NO_TEXT, STYLE, ensure_ascii  # noqa: E402

COSTUME = dict(_COSTUME)
# 08 section 5 / spec 15: the bamboo hat has no knob on top (the topknot stays hidden inside)
COSTUME["commoner_man"] += (" The bamboo hat has a smooth rounded crown that fully covers the "
                            "topknot - no knob, bump or hair sticking out of the top of the hat.")

L1 = "design/art/characters/v2/L1_protagonists_lineup.png"
L2 = "design/art/characters/v2/L2_senior_tongsa_sheet.png"
N1 = "design/art/characters/v2/N1_npc_lineup_1450s.png"
STYLE_REF = "design/art/style-drafts/C_webtoon.png"

PLAYER = (
    "The player character is a Korean high-school student in a navy school uniform jacket "
    "holding a small brown leather notebook; because the player picks one of four "
    "protagonists, show this student only from behind or over the shoulder with the head "
    "turned away or cropped by the frame, so the face is NOT visible and the hair is mostly out of "
    "frame or in shadow; frame the student from the waist up so that no skirt or trousers are "
    "shown."
)
SENIOR = (
    "The senior interpreter (same man as in the reference sheet): " + COSTUME["senior_tongsa"]
    + " Unlike the reference sheet, the pleated skirt of his robe is short: it ends just below "
    "the knee so that the white leg wrappings show clearly, making the upper bodice (shoulder "
    "to waist seam) and the pleated skirt (waist seam to hem) equal in length (1:1)."
)
SEJONG = (
    "King Sejong: a dignified, warm-faced Korean king in his late forties with a neat short "
    "beard, wearing a plain deep crimson round-collared royal robe with NO embroidered "
    "emblems, roundels or insignia, and a simple black royal cap; drawn at a respectful middle "
    "distance, not a close-up of regalia."
)
REFS_NOTE = ("Use the attached reference images only for character faces, body shapes and "
             "color palette; follow this text for costume details.")
COMMON = (
    "Cinematic wide composition, clear focal point, warm emotional lighting. No speech "
    "bubbles, no question marks or exclamation marks, no symbols. Any books, scrolls, papers, "
    "tags, steles, plaques or signboards are completely blank with no writing or marks. Korean "
    "interiors have wooden maru floors or smooth oiled-paper ondol floors, never Japanese tatami "
    "mats."
)

ANCIENT_RULE = (
    "PERIOD RULE (ancient Korea, Silla kingdom, about the 7th-8th century): simple undyed hemp "
    "clothing - belted hip-length jackets, wide trousers, long skirts; hair in plain topknots "
    "or tied back; thatched houses and wooden fences. No Joseon black horsehair gat, no "
    "manggeon headband, no dopo, no durumagi, no cropped jeogori, no tiled palaces, no paper "
    "books."
)
LATE16_RULE = (
    "PERIOD RULE (Joseon, late 16th century, around 1580s): the village teacher wears a long "
    "light robe (dopo) and a black horsehair gat with a tall crown and a narrow brim; children "
    "wear loose jackets and trousers with simple braided or tied hair; jackets are still fairly "
    "long. No wide flat 19th-century brim, no long beaded hat strings, no modern objects."
)
C18_RULE = (
    "PERIOD RULE (late Joseon, 18th century): men in long robes (dopo) with wide-brimmed black "
    "gat; the noblewoman wears a short jacket and full skirt with a long green cloak (jangot) "
    "draped over her head as an outdoor veil; interpreters ride horses with simple luggage. "
    "No modern objects."
)
Y1896_RULE = (
    "PERIOD RULE (Korea, 1896): a transitional mix - some men in white hanbok with black gat, a "
    "few younger men with short hair in early Western suits; kerosene lamps, wooden desks, an "
    "iron hand-operated printing press, stacks of blank newspaper sheets. No electric lights, "
    "no screens, no modern objects."
)


def scene(subject: str, *extra: str, rule: str = ERA_RULE) -> str:
    parts = [f"STORY ILLUSTRATION (event CG) for an educational game: {subject.strip().rstrip('.')}."]
    parts += [e for e in extra if e]
    parts += [COMMON, rule, STYLE, NO_TEXT]
    return ensure_ascii(" ".join(p.strip() for p in parts if p.strip()))


def misread(subject: str, who: str) -> str:
    return ensure_ascii(" ".join([
        "REACTION ILLUSTRATION for an educational game (a funny misunderstanding moment): "
        + subject.strip().rstrip(".") + ".",
        who,
        "Waist-up framing, the character centered and filling about two thirds of the image, "
        "exaggerated but friendly comic expression, a few simple comic motion lines or sweat "
        "drops are fine. Plain soft warm-beige background with a gentle radial gradient, no "
        "scenery, so the picture can be reused in many scenes. No speech bubbles, no question "
        "marks, no exclamation marks, no symbols.",
        ERA_RULE, STYLE, NO_TEXT,
    ]))


# name, size, refs, prompt
JOBS: list[tuple[str, str, list[str], str]] = []


def add(name, size, refs, text):
    JOBS.append((name, size, refs, text))


# ---------------------------------------------------------------- s0 2026 classroom
add("s0_intro", "1536x1024", [L1, STYLE_REF], scene(
    "a bright modern Korean high-school classroom in 2026 on a sunny afternoon; on a desk in "
    "the foreground a Korean language textbook lies open at a page with a large photograph of "
    "an old book page drawn only as a soft blurry warm-gray paper texture with no glyph-like "
    "marks at all, and from that photo "
    "dozens of small glowing golden abstract sparks and brush-stroke fragments lift off the "
    "paper and swirl into the air like fireflies; the student's hands and navy sleeves reach "
    "toward the sparks in amazement",
    PLAYER, "Empty desks and a blank green chalkboard in the background, no classmates in focus.",
    "The glowing fragments are abstract dots, arcs and short curved strokes, never readable "
    "letters or characters.",
    rule="PERIOD RULE (present day 2026): modern classroom, modern school uniform."))
add("s0_climax", "1536x1024", [L1, STYLE_REF], scene(
    "the glowing golden sparks from the textbook whirl into a huge luminous vortex above the "
    "classroom floor; the student, seen from behind, is lifted off the feet and pulled into the "
    "vortex, notebook clutched tight, while desks, chairs and loose blank paper sheets fly "
    "around; through the center of the vortex a faint misty view of ancient thatched roofs and "
    "mountains can be seen",
    PLAYER, "The vortex is made of abstract light streaks and sparks, never letters.",
    rule="PERIOD RULE (present day 2026): modern classroom, modern school uniform."))

# ---------------------------------------------------------------- s1 ancient village
add("s1_intro", "1536x1024", [L1], scene(
    "an ancient Korean village of the Silla era at a misty morning; at the village entrance "
    "stands a tall weathered granite stele whose face is worn completely smooth and blank; a "
    "curious village elder and two children in simple hemp clothing gather around the "
    "student, who stands before the stele seen from behind, looking up at it; thatched huts, "
    "millet fields and blue mountains behind",
    PLAYER, rule=ANCIENT_RULE))
add("s1_climax", "1536x1024", [L1], scene(
    "dusk in the same ancient Silla-era village; villagers sit around a crackling bonfire while "
    "an old woman sings a traditional song with her eyes closed and hands raised; soft "
    "glowing ribbons of light drift up from the song into the purple sky; the student sits "
    "among the villagers in the foreground, seen from behind, writing in the open notebook "
    "whose pages stay blank",
    PLAYER, rule=ANCIENT_RULE))

# ---------------------------------------------------------------- s2 1443-46 palace
add("s2_intro", "1536x1024", [L1, L2, N1], scene(
    "outside a 1440s Joseon palace gate, a crowd of commoners - a laborer, a woman with a "
    "basket, a child - stand puzzled and worried before a large posted notice on the wall that "
    "is plain blank paper; they cannot read it; the young senior interpreter in navy watches "
    "them with concern beside the student, who is seen from behind",
    SENIOR, "Commoners: " + COSTUME["commoner_man"] + " " + COSTUME["commoner_woman"] + " "
    + COSTUME["child"], PLAYER, REFS_NOTE))
add("s2_climax", "1536x1024", [L1, L2], scene(
    "inside a quiet lamplit palace study in the 1440s, King Sejong kneels at a low desk with a "
    "brush in hand, gazing thoughtfully at a simple ink drawing of a human mouth and throat in "
    "side profile on blank paper; warm candlelight; soft golden motes of light float above the "
    "desk; the senior interpreter and the student (seen from behind) kneel respectfully at the "
    "side of the room",
    SEJONG, SENIOR, PLAYER, REFS_NOTE,
    "The only drawing on the paper is the anatomical mouth-and-throat sketch; no letters, no "
    "strokes that look like writing."))

# ---------------------------------------------------------------- s3 1446 market
add("s3_intro", "1536x1024", [L1, L2, N1], scene(
    "a lively 1446 Hanyang market street; a line of cheerful commoners - a laborer holding a "
    "chicken, a woman with a cloth bundle, a child - wait eagerly in front of a small wooden "
    "table where the student (seen from behind) and the senior interpreter sit with brushes, "
    "an ink stone and a stack of blank wooden name tags; thatched and tiled shops, baskets of "
    "cabbages and dried fish",
    SENIOR, "Commoners: " + COSTUME["commoner_man"] + " " + COSTUME["commoner_woman"] + " "
    + COSTUME["child"], PLAYER, REFS_NOTE))
add("s3_climax", "1536x1024", [L1, N1], scene(
    "close warm moment at the market table: a commoner woman holds up a small blank wooden name "
    "tag with both hands, beaming with joy and tears of happiness, while her little child "
    "hugs her skirt and laughs; the student's hands (navy sleeves) in the foreground set down "
    "a brush beside an ink stone",
    "Commoners: " + COSTUME["commoner_woman"] + " " + COSTUME["child"], PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s4 1447 printing shop
add("s4_intro", "1536x1024", [L1, L2, N1], scene(
    "inside a 1447 Joseon metal-type printing workshop: craftsmen in hemp clothes set tiny "
    "bronze type pieces into a wooden tray (type seen from the side, faces not visible), ink "
    "brushes, a printer rubbing a sheet of paper laid over the inked type tray with a soft "
    "pad by hand (Korean rubbing method, NO screw press, no European printing press), freshly "
    "printed sheets hung to dry that are blank paper; warm "
    "light through paper windows; the senior interpreter shows the student (seen from behind) "
    "around",
    SENIOR, "Craftsmen work indoors bareheaded: plain topknots tied with simple cloth headbands, "
    "long loose hip-length hemp jackets, wide trousers with leg wrappings; NO hats of any kind "
    "on the craftsmen.", PLAYER, REFS_NOTE))
add("s4_climax", "1536x1024", [L1, N1], scene(
    "in a sunny courtyard in front of the printing workshop, the student (seen from behind) "
    "stands holding open a freshly bound book with blank pages and reads it aloud; a crowd of "
    "commoners - laborers, women, children, an old man - sit on mats listening with wonder and "
    "smiles, some leaning forward; no printing press machinery in the background",
    "Commoners: " + COSTUME["commoner_man"] + " " + COSTUME["commoner_woman"] + " "
    + COSTUME["child"], PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s5 1450s market haggling
add("s5_intro", "1536x1024", [L1, N1], scene(
    "a crowded 1450s Hanyang market: at a fabric and pottery stall a stout merchant and a "
    "scholar-gentleman customer argue with wild gestures, both clearly misunderstanding each "
    "other; the student stands between them (seen from behind), hands raised to calm them; "
    "onlookers peek with amused faces",
    "Merchant: " + COSTUME["commoner_man"] + " Customer: " + COSTUME["yangban_man"], PLAYER,
    REFS_NOTE))
add("s5_climax", "1536x1024", [L1, N1], scene(
    "the same market stall a moment later: the misunderstanding is solved and everybody laughs "
    "together - the merchant hands a folded bolt of cloth to the smiling scholar-gentleman, the "
    "onlookers clap, a child jumps; the student (seen from behind) gives a thumbs-up",
    "Merchant: " + COSTUME["commoner_man"] + " Customer: " + COSTUME["yangban_man"] + " "
    + COSTUME["child"], PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s6 local government office
add("s6_intro", "1536x1024", [L1, L2, N1], scene(
    "the courtyard of a 1450s Joseon local government office (gwana): a distressed commoner man "
    "kneels on a straw mat, pleading with tears; on the raised wooden porch sits a stern but "
    "fair official; the senior interpreter stands nearby and the student (seen from behind) "
    "opens the notebook ready to write",
    "Commoner: " + COSTUME["commoner_man"] + " Official: " + COSTUME["official"], SENIOR,
    PLAYER, REFS_NOTE))
add("s6_climax", "1536x1024", [L1, N1], scene(
    "on the porch of the same government office, the official reads a long sheet of blank "
    "paper with a softened, understanding face while the kneeling commoner looks up with "
    "hope and relief; the student (seen from behind) holds the brush, having just finished "
    "writing; late afternoon golden light",
    "Commoner: " + COSTUME["commoner_man"] + " Official: " + COSTUME["official"], PLAYER,
    REFS_NOTE))

# ---------------------------------------------------------------- s7 palace / temple ranks
add("s7_intro", "1536x1024", [L1, L2, N1], scene(
    "at the stone steps of a 1450s palace hall, a high-ranking official stands at the top and "
    "a nervous young monk and a commoner messenger bow at the bottom; the student (seen from "
    "behind) stands in the middle of the steps, bowing politely to each side as a go-between; "
    "the senior interpreter watches approvingly",
    "Official: " + COSTUME["official"] + " Monk: " + COSTUME["monk"] + " Messenger: "
    + COSTUME["commoner_man"], SENIOR, PLAYER, REFS_NOTE))
add("s7_climax", "1536x1024", [L1, N1], scene(
    "the same palace steps: the high-ranking official smiles and nods graciously, the monk and "
    "the messenger straighten up relieved and bow happily; above the student (seen from "
    "behind) a softly glowing golden balance scale made of light floats in perfect balance",
    "Official: " + COSTUME["official"] + " Monk: " + COSTUME["monk"] + " Messenger: "
    + COSTUME["commoner_man"], PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s8 temple Q&A
add("s8_intro", "1536x1024", [L1, L2, N1], scene(
    "a quiet mountain Buddhist temple courtyard in the 1450s with a wooden pagoda, pine trees "
    "and morning mist; an old monk and a small curious novice monk face each other, the novice "
    "raising a hand to ask a question; the student (seen from behind) and the senior "
    "interpreter listen from the side",
    "Monks: " + COSTUME["monk"] + " The novice is a small boy with a shaved head in the same "
    "blue-gray robe.", SENIOR, PLAYER, REFS_NOTE))
add("s8_climax", "1536x1024", [L1, N1], scene(
    "under the eaves of the temple pavilion, a lively question-and-answer: the novice and two "
    "visiting commoners eagerly ask, the old monk answers with a gentle smile, and thin "
    "glowing threads of golden light link each asker to the one who answers; the student "
    "(seen from behind) sits in the middle with the notebook open",
    "Monks: " + COSTUME["monk"] + " Visitors: " + COSTUME["commoner_woman"] + " "
    + COSTUME["commoner_man"], PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s9 1459 preface
add("s9_intro", "1536x1024", [L1, L2], scene(
    "a palace courtyard in 1459 on a windy evening: dozens of blank paper pages torn from a "
    "book whirl through the air and over the tiled roofs; the senior interpreter and the "
    "student (seen from behind) run and leap to catch them, hats and sleeves flying",
    SENIOR, PLAYER, REFS_NOTE))
add("s9_climax", "1536x1024", [L1, L2], scene(
    "night in a palace hall in 1459: the gathered blank pages float in a glowing circle and "
    "reassemble into one bound book that shines with warm golden light in the student's hands "
    "(seen from behind); the senior interpreter smiles; in the soft light behind them the "
    "translucent, gently glowing memory-image of King Sejong appears like a warm vision, "
    "smiling kindly",
    SEJONG + " He appears as a translucent, softly glowing memory, not a living person in the "
    "room.", SENIOR, PLAYER, REFS_NOTE))

# ---------------------------------------------------------------- s10 late 16th c school
add("s10_intro", "1536x1024", [L1], scene(
    "a small village school (seodang) in the late 16th century: a thatched room with paper "
    "doors open to a garden; a row of children sit on the floor with blank open books, some "
    "yawning, some puzzled; an elderly teacher with a long beard gestures toward the student, "
    "who stands at the doorway seen from behind",
    PLAYER, rule=LATE16_RULE))
add("s10_climax", "1536x1024", [L1], scene(
    "inside the same village school: the student (seen from behind) sits among the children "
    "and reads aloud from an open blank book while beside it lies the small brown notebook, "
    "also open to blank pages, as if comparing two eras; the children lean in with sparkling "
    "eyes and the old teacher nods with a smile",
    PLAYER, rule=LATE16_RULE))

# ---------------------------------------------------------------- s11 18th c road / 1896
add("s11_intro", "1536x1024", [L1], scene(
    "dawn on the east coast of Korea in the 18th century: on a high rocky viewpoint a "
    "noblewoman with a long green cloak draped over her head watches a huge red sun rise over "
    "the sea with her maid; on the coastal road below, an interpreter party of men on horses "
    "with luggage travels toward the capital; the student stands on the path in the "
    "foreground, seen from behind, taking in the view",
    PLAYER, rule=C18_RULE))
add("s11_climax", "1536x1024", [L1], scene(
    "inside a busy newspaper office in Seoul in 1896: men in white hanbok and gat and young men "
    "with short hair in early Western suits work around an iron hand press, stacks of freshly "
    "printed newspapers that are completely blank paper, kerosene lamps, wooden desks; an "
    "editor hands a blank newspaper sheet to the student, who is seen from behind",
    PLAYER, rule=Y1896_RULE))

# ---------------------------------------------------------------- s12 river of words
add("s12_intro", "1536x1024", [L1], scene(
    "a dreamlike luminous river flowing across the land at twilight: upstream on the left it "
    "passes old thatched roofs and pine hills, in the middle tiled hanok villages, and "
    "downstream on the right a modern city skyline and a hazy futuristic horizon; countless "
    "small glowing golden sparks drift on the water like floating lanterns; the student "
    "stands on the riverbank in the foreground seen from behind",
    PLAYER, "The sparks are abstract points of light, never letters.",
    rule="PERIOD RULE: abstract, dreamlike, spanning past to future; no modern brand logos."))
add("s12_climax", "1536x1024", [L1, STYLE_REF], scene(
    "back in the bright 2026 classroom at sunset: the last golden sparks settle softly back "
    "into the open textbook on the desk, whose pages are blank paper; in the left foreground "
    "only the navy-sleeved shoulder and two hands of the student hold the worn brown notebook "
    "(the head is outside the frame, no hair and no lower body visible); through the "
    "window a faint glowing river of light fades into the sky",
    PLAYER, "The sparks are abstract points of light, never letters.",
    rule="PERIOD RULE (present day 2026): modern classroom, modern school uniform."))

# ---------------------------------------------------------------- misread reactions
add("mis_commoner_puzzled", "1024x1024", [N1], misread(
    "a Joseon laborer tilts his head and scratches his topknot, completely baffled, one eyebrow "
    "raised and mouth twisted", "Character: " + COSTUME["commoner_man"]))
add("mis_yangban_offended", "1024x1024", [N1], misread(
    "a scholar-gentleman is comically offended - cheeks puffed and red, nose in the air, arms "
    "folded inside his sleeves, steam puffing from his ears", "Character: " + COSTUME["yangban_man"]))
add("mis_child_laughing", "1024x1024", [N1], misread(
    "a little Joseon child bursts out laughing, holding the belly, eyes squeezed shut, tears of "
    "laughter at the corners", "Character: " + COSTUME["child"]))
add("mis_official_confused", "1024x1024", [N1], misread(
    "a Joseon official blinks in total confusion, eyes spinning in little spirals, his soft "
    "hat wings drooping, a brush slipping from his fingers", "Character: " + COSTUME["official"]))
add("mis_woman_flustered", "1024x1024", [N1], misread(
    "a Joseon commoner woman covers her mouth with one hand, eyes wide, blushing and flustered "
    "as if she just heard something very embarrassing", "Character: " + COSTUME["commoner_woman"]))
add("mis_monk_bemused", "1024x1024", [N1], misread(
    "a Joseon Buddhist monk with a frozen awkward smile and a big sweat drop, prayer beads "
    "paused mid-count", "Character: " + COSTUME["monk"]))

# ---------------------------------------------------------------- key art / app icon / icons
add("og_keyart", "1536x1024", [L1, L2], ensure_ascii(" ".join([
    "KEY ART for an educational web game, wide banner composition: on a grassy hill at golden "
    "hour, the young senior interpreter in navy and the student (seen from behind) look out "
    "over a 1450s Joseon capital with tiled roofs, a palace and mountains; streams of small "
    "glowing golden sparks flow across the sky like a river of light. Keep all important "
    "content inside the middle horizontal band (top and bottom 15 percent may be cropped).",
    SENIOR, PLAYER, REFS_NOTE,
    "No title, no logo, no lettering of any kind. Any signboards are blank.",
    ERA_RULE, STYLE, NO_TEXT])))
add("app_icon", "1024x1024", [], ensure_ascii(" ".join([
    "APP ICON for an educational game, a single bold symbolic emblem centered on a flat deep "
    "warm ink-brown background (#1d1a17) that fills the entire square edge to edge: a "
    "traditional Korean calligraphy brush drawn diagonally, its tip touching one glowing "
    "golden dot of light with a soft halo. Simple flat shapes, thick clean outlines, high "
    "contrast, readable at 48 pixels, generous margin so the emblem stays inside the central "
    "70 percent. No rounded-corner frame, no border, no shadow box.",
    "ART STYLE: clean modern flat vector illustration with subtle cel shading.", NO_TEXT])))
add("ui_icons", "1024x1024", [], ensure_ascii(" ".join([
    "GAME UI ICON SET: nine icons arranged in a clean 3 by 3 grid with wide empty gaps, each "
    "icon centered in its cell and the same size. Row 1: a small brown leather notebook; a "
    "gear for settings; a playing-card-like rule card with a simple star emblem. Row 2: a thick "
    "closed bound book with a magnifying glass for a glyph encyclopedia; a rectangular "
    "wooden hanging identity plaque with a tassel; a glowing light bulb for hints. Row 3: a "
    "folded paper map with a dotted path and a pin; a speaker with sound waves; a speaker with "
    "a small cross for mute.",
    "Consistent style: flat icons with thick dark brown outlines, warm palette of ink brown, "
    "parchment cream, muted gold and indigo, subtle cel shading, no drop shadows.",
    "Solid flat pure green background (#00FF00) everywhere, no grid lines, no green inside the "
    "icons.", "All covers, pages, cards and plaques are blank.", NO_TEXT])))


def main() -> None:
    lines = ["name\tsize\trefs\tprompt"]
    for name, size, refs, text in JOBS:
        assert "TEXT RULE" in text, name
        (HERE / f"{name}.txt").write_text(text + "\n", encoding="ascii", newline="\n")
        lines.append(f"{name}\t{size}\t{';'.join(refs)}\ttools/prompts/A4/{name}.txt")
    (HERE / "manifest.tsv").write_text("\n".join(lines) + "\n", encoding="ascii", newline="\n")
    print(f"wrote {len(JOBS)} prompts + manifest.tsv")


if __name__ == "__main__":
    main()
