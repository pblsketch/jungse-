#!/usr/bin/env python3
"""A3 map background prompts -> tools/prompts/A3/<id>.txt + manifest.tsv.

Uses tools/make_prompts.py map_background (adds the blank-paper line, ART STYLE, TEXT RULE
and the early-Joseon PERIOD RULE). The PERIOD RULE is about 1440s-1450s clothing; it is
removed for scenes of other eras (s0, s1, s10, s11, s12) so it cannot pull them toward 1450s.

  python tools/prompts/A3/build_prompts.py
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import make_prompts as mp  # noqa: E402

# 1-screen maps: generated 1536x1024, shipped at 1152x768 (36x24 tiles).
SCALE_1 = (
    "Camera: high 3/4 top-down RPG view looking down at about 45 degrees. Scale: doorways are "
    "about one fifth of the image height, so furniture and props are large and readable. The "
    "outer edges are walls, buildings or trees; the middle is open walkable floor or ground."
)
# 2-screen maps: generated 1536x1024, cropped to 1536x768 and shipped at 1920x960 (60x30 tiles).
SCALE_2 = (
    "Camera: high 3/4 top-down RPG view looking down at about 45 degrees. Wide horizontal "
    "panorama. Scale: doorways are about one eighth of the image height. Keep the top 12 percent "
    "and the bottom 12 percent of the image as simple roof tops, tree tops, wall tops or plain "
    "ground because they will be cropped. One continuous open walkable path or ground runs "
    "through the middle from the left edge to the right edge."
)

MAPS = {
    "s0": (1, False,
           "a bright modern Korean high school classroom in 2026, interior seen from above: the back "
           "wall at the top with a large plain green chalkboard wiped clean and a blank wall-mounted "
           "display screen turned off, a teacher's desk at the front, rows of light wooden student "
           "desks and chairs in tidy groups on the left and right with a wide clear aisle through the "
           "middle and open floor in front of the chalkboard, a few textbooks lying open on desks "
           "showing blank white pages, a low bookshelf with plain unlabeled book spines, large windows "
           "with sunlight along the right wall, a potted plant, a corkboard with blank paper notes, "
           "pale linoleum floor"),
    "s1": (1, False,
           "an ancient Korean village of the Three Kingdoms period, about 1500 years ago: a few "
           "thatched-roof earthen houses with low wooden fences around the edges, in the middle an "
           "open packed-earth clearing with a tall weathered upright stone stele on a square stone base, "
           "its face smooth and completely blank with no carving, a large old zelkova tree, a small "
           "stream with a wooden plank bridge along one side, stacked stone walls, earthenware jars, "
           "millet fields and hills at the edges"),
    "s2": (1, True,
           "the inner courtyard of an early Joseon royal palace in the 1440s: at the top a stately "
           "wooden main hall with colorful dancheong painted eaves and a blue-gray tiled roof on a "
           "raised two-step stone platform with stone stairs, its name board under the eaves left "
           "completely blank, long roofed corridor buildings along the left and right edges, a wide "
           "courtyard paved with gray stone slabs and a raised central stone walkway, a bronze "
           "vessel on a stone pedestal, two pine trees in the lower corners, a tiled-roof gate at the "
           "bottom center"),
    "s3": (2, True,
           "a 1446 Hanyang market street running from left to right across the whole width: rows of "
           "shops with thatched and gray tiled roofs and open wooden fronts along the top, wooden "
           "stalls with baskets of cabbages, radishes, dried fish, bolts of cloth, earthenware pots and "
           "straw sandals along the bottom, a stone well with a wooden frame, a plaster wall with one "
           "blank paper notice pasted on it, a wide packed-dirt road in the middle, fresh morning light"),
    "s4": (1, True,
           "the interior of a 1447 Joseon royal metal-type printing workshop, seen from above: wooden "
           "pillars, sliding paper doors and shelves of wooden type cases along the top wall, a clay "
           "casting furnace with crucibles and sand molds in one corner, low worktables with wooden "
           "trays full of tiny metal type pieces whose faces are smooth and unmarked, a printing table "
           "with an ink brush, an ink bowl and stacks of blank white paper sheets, freshly bound books "
           "with plain blank covers drying on racks, packed-earth and wooden-plank floor, open floor "
           "space in the middle"),
    "s5": (2, True,
           "a 1450s rural periodic market on a riverbank in warm late-afternoon golden light, a "
           "different layout from a street market: an open market square with stalls arranged in a "
           "loose ring under cloth awnings, piles of grain sacks, a wooden ox cart without the ox, salt, "
           "pottery and straw-goods stalls, a big zelkova tree with a flat stone bench, thatched houses "
           "behind, a calm river with a small wooden pier along the bottom edge"),
    "s6": (2, True,
           "an early Joseon county government office yard on the left two thirds: a main office hall "
           "with a gray tiled roof on a stone platform at the top, its name board blank, a wide swept "
           "dirt yard in front with a low wooden writing table and straw mats, tiled-roof walls with a "
           "gate; on the right third, joined through an opening in a low stone wall, a small village "
           "school corner: a modest thatched-roof house with an open wooden-floored room, low reading "
           "desks with blank open books, a yard with a persimmon tree. No punishment devices"),
    "s7": (2, True,
           "two places joined side by side across a wide panorama: on the left, a corner of an early "
           "Joseon palace with a tiled-roof hall with dancheong eaves on a raised stone platform and a "
           "stone-paved yard; in the middle, a path through pine trees crossing a small stream on a "
           "stone bridge; on the right, the front courtyard of a Buddhist mountain temple with a main "
           "hall with dancheong eaves, a stone pagoda, a stone lantern and a bell pavilion; open "
           "walkable ground connects everything. The name boards under the eaves of both halls are plain "
           "wooden boards painted one flat dark color with absolutely nothing written, painted or carved "
           "on them"),  # v2 line: the first s7 image had gold pseudo-characters on both boards
    "s8": (1, True,
           "the courtyard of an early Joseon mountain Buddhist temple: at the top a main hall with "
           "colorful dancheong eaves and latticed doors on a stone platform with steps, its name board "
           "blank, a three-story stone pagoda and a stone lantern in the courtyard, monk quarters with "
           "wooden verandas along the left and right, a small bell pavilion, a stone water trough with "
           "a bamboo spout, pine and maple trees, a swept courtyard of packed earth and stone"),
    "s9": (1, True,
           "the interior of a royal reading hall and library in 1459, the moment a famous preface is "
           "read: a large wooden-floored hall with red pillars and latticed paper windows and doors "
           "along the top wall, a raised dais with a folding screen painted only with mountains and "
           "sun, bookshelves of bound books with plain blank covers on the left and right, low "
           "lacquered reading tables with an ink stone and brushes, many loose blank sheets of paper "
           "scattered across the floor and gently floating in a soft golden glow, warm light"),
    "s10": (1, False,
            "a Joseon village school in the late 16th century: at the top a tiled-roof house with a "
            "wide open wooden-floored front room with low reading desks holding blank open books, a "
            "teacher's floor cushion and a small book chest, a stone step porch with straw shoes lined "
            "up, a front yard of packed earth with a persimmon tree, a well, a low stone wall and a "
            "brushwood gate at the bottom, early autumn colors"),
    "s11": (2, False,
            "one road that changes with time from left to right across a wide panorama: on the left, "
            "an 18th to 19th century late Joseon country road with thatched farmhouses, a roadside "
            "tavern with a straw-roofed porch and earthenware jars, rice paddies; in the middle, the "
            "road passes a stone city wall gate; on the right, an 1890s to 1900s Seoul street of the "
            "Korean Empire era: tiled-roof shops mixed with a few early Western-style red brick "
            "buildings, wooden telegraph poles with wires, a streetcar track along the street, "
            "hanging shop signboards and cloth banners all blank"),
    "s12": (2, False,
            "an abstract poetic dreamscape, a river of words flowing from the present on the left to "
            "the future on the right: a wide shimmering blue river winding across the middle-top of the "
            "image, blank paper slips, paper boats and soft light particles drifting on the water, "
            "grassy banks with a stone path along the bottom bank, two small wooden bridges crossing "
            "to an upper bank, on the left soft modern elements (a park bench, a streetlamp), on the "
            "right soft translucent futuristic shapes and trees made of light, gentle dawn colors"),
}


def build(mid: str) -> str:
    screens, keep_era, desc = MAPS[mid]
    text = mp.map_background(desc + ". " + (SCALE_1 if screens == 1 else SCALE_2), screens)
    if not keep_era:
        text = text.replace(mp.ERA_RULE + " ", "")
    return mp.ensure_ascii(text, mid)


def main() -> None:
    lines = ["name\tsize\trefs\tprompt"]
    for mid in MAPS:
        (HERE / f"{mid}.txt").write_text(build(mid) + "\n", encoding="ascii")
        lines.append(f"A3_{mid}\t1536x1024\t\ttools/prompts/A3/{mid}.txt")
    (HERE / "manifest.tsv").write_text("\n".join(lines) + "\n", encoding="ascii")
    print(f"wrote {len(MAPS)} prompts + manifest.tsv")


if __name__ == "__main__":
    main()
