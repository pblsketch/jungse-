#!/usr/bin/env python3
"""나랏말ᄊᆞ미 글꼴 만들기: Noto Serif KR / Noto Sans KR → assets/fonts/NMYet.woff2, NMSans.woff2

  python -m pip install fonttools brotli
  python tools/build_fonts.py            # 원본이 없으면 내려받는다(assets/raw/fonts_src/, git 제외)

- NMYet  (옛한글 본문용, Noto Serif KR 바탕): 첫가끝 자모 전 영역(U+1100–11FF, A960–A97F, D7B0–D7FF),
  호환 자모(3130–318F), 방점(302E/302F), 현대 음절 11,172자, 라틴·문장부호, 그리고 데이터·리서치 문서에 나온 모든 글자(한자 등).
  옛한글 조합 기능 ljmo/vjmo/tjmo 와 ccmp, locl, kern, mark, mkmk 를 남긴다.
- NMSans (UI용, Noto Sans KR 바탕): 현대 음절·호환 자모·라틴·문장부호·데이터에 나온 글자. 옛한글 조합 기능은 뺀다.
- SIL OFL 1.1: 고친 글꼴은 이름을 바꾼다(NMYet / NMSans). assets/fonts/OFL.txt 를 함께 둔다.
- assets/fonts/coverage.json: 글꼴별 cmap 범위 + 파일 sha256. tests/checks/font-coverage.mjs 가 읽는다.
  데이터에 새 글자(한자 등)를 넣었으면 이 스크립트를 다시 돌린다 — 점검이 알려 준다.
"""
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'raw' / 'fonts_src'
OUT = ROOT / 'assets' / 'fonts'
BASE_URL = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/'
SOURCES = {
    'NotoSerifKR-Regular.otf': 'Serif/SubsetOTF/KR/NotoSerifKR-Regular.otf',
    'NotoSansKR-Regular.otf': 'Sans/SubsetOTF/KR/NotoSansKR-Regular.otf',
    'NotoSerifTC-Regular.otf': 'Serif/SubsetOTF/TC/NotoSerifTC-Regular.otf',
    'OFL-Serif.txt': 'Serif/LICENSE',
}
# KR 판에 없는 한자를 채우는 보조 글꼴(NMYetExt)의 바탕. 데이터에 쓰인 한자 중 NMYet 에 없는 것만 담는다.
EXT_SRC = 'NotoSerifTC-Regular.otf'
HANJA = [(0x2E80, 0x2FDF), (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF), (0x20000, 0x3134F)]

COMMON = [
    (0x0020, 0x007E),  # Basic Latin
    (0x00A0, 0x00FF),  # Latin-1 (· × ° …)
    (0x2010, 0x205E),  # 일반 문장부호 (— – ‘ ’ “ ” … ※ ‥)
    (0x2190, 0x2199),  # 화살표
    (0x2460, 0x2473),  # ①–⑳
    (0x25A0, 0x25CF),  # □ ■ ○ ● ◎ △ ▲ ◇ ◆
    (0x2605, 0x2606),  # ★ ☆
    (0x3000, 0x303F),  # CJK 기호 (「」『』〈〉《》 〮 〯)
    (0x3131, 0x318E),  # 호환 자모 (ㆍ ㆎ ㅿ ㆁ ㆆ ㅸ …)
    (0xAC00, 0xD7A3),  # 현대 음절
    (0xFF01, 0xFF5E),  # 전각 기호
]
OLD_HANGUL = [(0x1100, 0x11FF), (0xA960, 0xA97F), (0xD7B0, 0xD7FF)]

FONTS = {
    'NMYet': {
        'src': 'NotoSerifKR-Regular.otf',
        'ranges': COMMON + OLD_HANGUL,
        'features': ['ccmp', 'ljmo', 'vjmo', 'tjmo', 'locl', 'kern', 'mark', 'mkmk'],
        # 홀로 쓴 아래아 ㆍ(U+318D): Noto Serif KR 은 붓으로 찍은 비스듬한 획을 칸 왼쪽 위에 그려 쉼표(、)처럼 보인다.
        # 게임은 ㆍ를 '둥근 점'으로 가르치므로(서장) 가운데 둥근 점 ・(U+30FB, 같은 글꼴의 전각 가운뎃점)의 그림을 쓴다.
        # 음절 안의 ㆍ(첫가끝 U+119E)는 그대로다.
        'remap': {0x318D: 0x30FB},
    },
    'NMSans': {
        'src': 'NotoSansKR-Regular.otf',
        'ranges': COMMON,
        'features': ['ccmp', 'locl', 'kern', 'mark', 'mkmk'],
    },
}


def ensure_sources():
    SRC.mkdir(parents=True, exist_ok=True)
    for name, path in SOURCES.items():
        dst = SRC / name
        if dst.exists() and dst.stat().st_size > 1000:
            continue
        print(f'download {BASE_URL + path}')
        with urllib.request.urlopen(BASE_URL + path) as r:
            dst.write_bytes(r.read())


def scanned_chars():
    """데이터와 리서치 문서에 나오는 글자 전부 (글꼴에 없는 것은 subsetter 가 건너뛴다)."""
    files = sorted((ROOT / 'js' / 'data').rglob('*.js')) + sorted((ROOT / 'design' / 'research').rglob('*.md'))
    chars = set()
    for f in files:
        chars.update(ord(c) for c in f.read_text(encoding='utf-8'))
    return {c for c in chars if c >= 0x80}


def to_ranges(cps):
    out = []
    for c in sorted(cps):
        if out and c == out[-1][1] + 1:
            out[-1][1] = c
        else:
            out.append([c, c])
    return out


def rename(font, family):
    ps = f'{family}-Regular'
    name = font['name']
    copyright_ = name.getDebugName(0) or ''
    version = name.getDebugName(5) or 'Version 1.000'
    for rec in list(name.names):
        if rec.nameID in (1, 3, 4, 5, 6, 16, 17, 18, 21, 22):
            name.removeNames(nameID=rec.nameID)
    values = {
        0: copyright_ + ' Modified (subset, renamed) for the 나랏말ᄊᆞ미 project.',
        1: family, 2: 'Regular', 3: f'{version};{ps}', 4: family, 5: f'{version}; subset {family}', 6: ps,
    }
    for nid, val in values.items():
        name.setName(val, nid, 3, 1, 0x409)
    if 'CFF ' in font:
        cff = font['CFF '].cff
        cff.fontNames = [ps]
        top = cff.topDictIndex[0]
        for attr, val in (('FullName', family), ('FamilyName', family)):
            if hasattr(top, attr):
                setattr(top, attr, val)
        if hasattr(top, 'FDArray'):
            for fd in top.FDArray:
                if hasattr(fd, 'FontName'):
                    fd.FontName = re.sub(r'^NotoS\w+(KR|TC)-Regular', ps, fd.FontName)


def build(family, spec, extra):
    unicodes = set(extra)
    for a, b in spec['ranges']:
        unicodes.update(range(a, b + 1))
    remap = spec.get('remap', {})
    unicodes.update(remap.values())
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = spec['features']
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.drop_tables += ['vhea', 'vmtx', 'VORG', 'DSIG']
    font = subset.load_font(str(SRC / spec['src']), opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    for cp, like in remap.items():  # cp 가 like 의 글자 그림을 쓰게 한다(advance 도 같이 따라간다)
        for table in font['cmap'].tables:
            if table.isUnicode() and like in table.cmap and cp in table.cmap:
                table.cmap[cp] = table.cmap[like]
    rename(font, family)
    out = OUT / f'{family}.woff2'
    subset.save_font(font, str(out), opts)
    data = out.read_bytes()
    cmap = TTFont(str(out)).getBestCmap()
    return {
        'file': out.name,
        'source': f'{spec["src"]} (notofonts/noto-cjk, SIL OFL 1.1)',
        'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(),
        'features': spec['features'],
        'ranges': to_ranges(cmap.keys()),
    }


def main():
    ensure_sources()
    OUT.mkdir(parents=True, exist_ok=True)
    extra = scanned_chars()
    result = {'generated_by': 'tools/build_fonts.py', 'fonts': {}}
    for family, spec in FONTS.items():
        info = build(family, spec, extra)
        result['fonts'][family] = info
        print(f'{family}: {info["bytes"] / 1024:.0f} KB, {sum(b - a + 1 for a, b in info["ranges"])} code points')
    yet_cmap = set(c for a, b in result['fonts']['NMYet']['ranges'] for c in range(a, b + 1))
    ext_need = {c for c in extra if c not in yet_cmap and any(a <= c <= b for a, b in HANJA)}
    ext = build('NMYetExt', {'src': EXT_SRC, 'ranges': [(0x20, 0x20)], 'features': ['locl', 'kern']}, ext_need)
    result['fonts']['NMYetExt'] = ext
    print(f'NMYetExt: {ext["bytes"] / 1024:.0f} KB, {len(ext_need)} extra hanja')
    (OUT / 'coverage.json').write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    ofl = (SRC / 'OFL-Serif.txt').read_text(encoding='utf-8')
    header = ('NMYet and NMSans are modified versions (subset and renamed under the SIL OFL 1.1)\n'
              'of Noto Serif KR and Noto Sans KR (https://github.com/notofonts/noto-cjk).\n'
              'Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name \'Source\'.\n'
              'Noto is a trademark of Google Inc.\n\n')
    (OUT / 'OFL.txt').write_text(header + ofl.replace('\r\n', '\n'), encoding='utf-8', newline='\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
