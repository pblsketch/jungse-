#!/usr/bin/env python3
"""R3 원문 대조 스크립트 (고대·16세기·근대·현대).

design/research/11_원문_고대_근대.md 의 原文 블록(#### O-...)을 읽어,
design/research/source_cache/r3/ 의 독립 자료 사본과 글자 단위로 비교한다.

실행:  python tools/compare_orig_r3.py            (표 + 차이 목록)
       python tools/compare_orig_r3.py --markdown (문서에 붙일 마크다운 표)

정규화 규칙 (양쪽에 똑같이 적용):
  N1  방점 지움: 데이터 표기 '·'(U+00B7) ':' 와 유니코드 방점 U+302E/U+302F
  N2  데이터 표기 [..](호환 자모 한 음절) → 첫가끝 자모열, 현대 음절은 NFD 분해
  N3  루비 {漢|읽기}: 비교 방식(mode)에 따라 한자만/읽기만 남김
  N4  띄어쓰기·문장 부호 지움 (띄어쓰기 차이는 따로 세어 보고)
  N5  비교 방식별 선택 규칙
        hangul : 한자(와 그 괄호)를 모두 지우고 한글만 비교
        han    : 한자만 남겨 비교 (이체자 표 적용)
        mixed  : 한글·한자 모두 비교
        yes2o  : 옛이응 ㆁ(ᅌ/ᇰ)을 ㅇ으로 합쳐 비교 (교과서 통용형이 ㅇ으로 적는 경우)
일치율 = difflib.SequenceMatcher 의 ratio (음절 단위, 0~1).
외부 라이브러리 없이 표준 라이브러리만 쓴다.
"""
from __future__ import annotations

import difflib
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "design" / "research" / "11_원문_고대_근대.md"
CACHE = ROOT / "design" / "research" / "source_cache" / "r3"

# ---------------------------------------------------------------- 표기 변환
_CHO_SPECIAL = {}
_JUNG_SPECIAL = {"ARAEA": "ARAEA", "ARAEAE": "ARAEA-I"}
_JONG_SPECIAL = {}


def _compat_name(ch: str) -> str:
    name = unicodedata.name(ch)
    if not name.startswith("HANGUL LETTER "):
        raise ValueError(f"호환 자모가 아님: {ch!r} ({name})")
    return name[len("HANGUL LETTER "):]


def _lookup(kind: str, base: str) -> str:
    table = {"CHOSEONG": _CHO_SPECIAL, "JUNGSEONG": _JUNG_SPECIAL, "JONGSEONG": _JONG_SPECIAL}[kind]
    base = table.get(base, base)
    return unicodedata.lookup(f"HANGUL {kind} {base}")


def _is_vowel(ch: str) -> bool:
    try:
        _lookup("JUNGSEONG", _compat_name(ch))
        return True
    except (KeyError, ValueError):
        return False


def bracket_to_jamo(inner: str) -> str:
    """'[ㅅㆍㄹ]' 의 안쪽 'ㅅㆍㄹ' → 첫가끝 자모열 (초성 1, 중성 1, 종성 0~1)."""
    chars = list(inner)
    vi = next((i for i, c in enumerate(chars) if _is_vowel(c)), None)
    if vi is None or vi != 1 or len(chars) > 3:
        raise ValueError(f"조합할 수 없는 표기: [{inner}]")
    out = _lookup("CHOSEONG", _compat_name(chars[0]))
    out += _lookup("JUNGSEONG", _compat_name(chars[1]))
    if len(chars) == 3:
        out += _lookup("JONGSEONG", _compat_name(chars[2]))
    return out


BRACKET = re.compile(r"\[([^\[\]]+)\]")
RUBY = re.compile(r"\{([^{}|]+)\|([^{}]*)\}")
HAN = re.compile(r"[㐀-鿿豈-﫿\U00020000-\U0003134f]")
BANGJEOM = re.compile(r"[·:〮〯]")

VARIANTS = str.maketrans({
    "夲": "本", "攺": "改", "夘": "卯", "逰": "遊", "扵": "於", "隠": "隱",
    "為": "爲", "腳": "脚", "肹": "兮", "\U0002c6b5": "兮",
})


def normalize(text: str, mode: str) -> str:
    """정규화한 뒤 '음절 덩어리'로 다시 모아 NFC 문자열로 돌려준다."""
    if mode in ("han",):
        text = RUBY.sub(lambda m: m.group(1), text)
    else:
        text = RUBY.sub(lambda m: (m.group(2) if "hangul" in mode else m.group(1) + m.group(2)), text)
    text = BANGJEOM.sub("", text)                                     # N1
    text = BRACKET.sub(lambda m: bracket_to_jamo(m.group(1)), text)   # N2
    text = unicodedata.normalize("NFD", text)
    text = text.translate(VARIANTS)
    if "hangul" in mode:
        text = re.sub(r"\(([㐀-鿿]+)\)", "", text)
        text = HAN.sub("", text)
    if mode == "han":
        text = "".join(HAN.findall(text))
    if "yes2o" in mode:
        text = text.replace("ᇰ", "ᆼ").replace("ᅌ", "ᄋ")
    # N4: 한글 자모(첫가끝·호환)·한자만 남김
    keep = []
    for ch in text:
        cp = ord(ch)
        if (0x1100 <= cp <= 0x11FF or 0xA960 <= cp <= 0xA97F or 0xD7B0 <= cp <= 0xD7FF
                or 0x3131 <= cp <= 0x318E or HAN.match(ch)):
            keep.append(ch)
    return "".join(keep)


def syllables(s: str) -> list[str]:
    """첫가끝 자모열을 음절 단위 목록으로 (초성으로 시작하는 덩어리)."""
    def conj(c: str) -> bool:
        cp = ord(c)
        return 0x1100 <= cp <= 0x11FF or 0xA960 <= cp <= 0xA97F or 0xD7B0 <= cp <= 0xD7FF

    out: list[str] = []
    for ch in s:
        cp = ord(ch)
        follow = 0x1160 <= cp <= 0x11FF or 0xD7B0 <= cp <= 0xD7FF   # 중성·종성
        if follow and out and conj(out[-1][-1]):
            out[-1] += ch
        else:
            out.append(ch)
    return [unicodedata.normalize("NFC", x) for x in out]


def count_spaces(text: str) -> int:
    return len(re.findall(r"\s+", text.strip()))


# ---------------------------------------------------------------- 자료 읽기
def read_blocks(doc: Path) -> dict[str, list[str]]:
    blocks: dict[str, list[str]] = {}
    cur = None
    in_orig = False
    for line in doc.read_text(encoding="utf-8").splitlines():
        if line.startswith("#### O-"):
            cur = line[5:].strip()
            blocks[cur] = []
            in_orig = False
            continue
        if cur is None:
            continue
        if line.startswith("> **原文**"):
            in_orig = True
            continue
        if in_orig and line.startswith("> "):
            blocks[cur].append(line[2:])
            continue
        if in_orig:
            in_orig = False
            cur = None
    return blocks


def read_cache(name: str) -> str:
    raw = (CACHE / name).read_text(encoding="utf-8")
    return raw.split("\n---\n", 1)[1]


def korean_side(text: str) -> str:
    """다빈치맵처럼 '한문<전각 공백>언해' 줄이면 언해 쪽만."""
    out = []
    for line in text.splitlines():
        parts = re.split(r"[　]{2,}\s*", line)
        out.append(parts[-1])
    return "\n".join(out)


def ws_strip(text: str) -> str:
    """위키문헌 줄 머리 '# ', 줄 안 '/', {{..}} 틀 제거."""
    text = re.sub(r"^# ", "", text, flags=re.M)
    text = text.replace("/", " ")
    text = re.sub(r"\{\{\*\|([^}]*)\}\}", r"\1", text)
    return text


def pick(text: str, start: str, end: str | None = None) -> str:
    i = text.find(start)
    if i < 0:
        raise ValueError(f"자료에서 찾지 못함: {start}")
    if end is None:
        return text[i:]
    j = text.find(end, i)
    if j < 0:
        raise ValueError(f"자료에서 찾지 못함: {end}")
    return text[i:j + len(end)]


# ---------------------------------------------------------------- 비교 목록
def S(name, start=None, end=None, fn=None):
    def get():
        t = read_cache(name)
        if fn:
            t = fn(t)
        if start:
            t = pick(t, start, end)
        return t
    get.label = name
    return get


COMPARISONS = [
    # (블록 id, 줄 번호(None=전부), mode, [자료...])
    ("O-s1-YEONGDONG", None, "han", [
        S("samguksagi_zh_wikisource.txt", "永同郡", "今因之"),
        S("samguksagi_db_history.txt", "永同郡", "今因之")]),
    ("O-s1-MILSEONG", None, "han", [S("samguksagi_zh_wikisource.txt", "密城郡", "今因之")]),
    ("O-s1-SUSEONG", None, "han", [S("samguksagi_zh_wikisource.txt", "水城郡", "今水州")]),
    ("O-s1-SEODONG1", None, "han", [
        S("samgukyusa_zh_wikisource.txt", "善化", "主隱"),
        S("samgukyusa_ko_wikisource.txt", "善化", "主隱")]),
    ("O-s1-SEODONG2", None, "han", [
        S("samgukyusa_zh_wikisource.txt", "他密只", "去如"),
        S("samgukyusa_ko_wikisource.txt", "他密只", "去如")]),
    ("O-s1-CHEOYONG1", None, "han", [
        S("samgukyusa_zh_wikisource.txt", "東京", "如可"),
        S("samgukyusa_ko_wikisource.txt", "東京", "如可"),
        S("cheoyong_gugak.txt", "東京", "如可")]),
    ("O-s10-SOHAK1", None, "hangul+yes2o", [S("sohak2_wikisource.txt", "고ᇰ", "ᄀᆞᆯᄋᆞ샤ᄃᆡ")]),
    ("O-s10-SOHAK2", None, "hangul+yes2o", [S("sohak2_wikisource.txt", "몸이며", "거시라")]),
    ("O-s10-SOHAK3", None, "hangul+yes2o", [S("sohak2_wikisource.txt", "감(敢)히", "비르소미오")]),
    ("O-s10-SOHAK4", None, "hangul+yes2o", [S("sohak2_wikisource.txt", "몸을 셰워", "ᄆᆞᄎᆞᆷ이니라")]),
    ("O-s10-HUNMONG1", None, "mixed", [S("hunmong_jamo_wikisource.txt", "ㄱ", "異凝", fn=ws_strip)]),
    ("O-s10-HUNMONG2", None, "mixed", [S("hunmong_jamo_wikisource.txt", "(末)(衣)", "為聲")]),
    ("O-s10-HUNMONG3", None, "mixed", [S("hunmong_jamo_wikisource.txt", "(箕)字", "為聲")]),
    ("O-s11-NOGEOL1795", None, "mixed", [
        S("nogeol1795_davincimap.txt", "우리 셔울", "ᄀᆞᆺ다", fn=korean_side)]),
    ("O-s11-NOGEOL1670", None, "mixed", [
        S("nogeol1670_wikisource.txt", "우리 가면", "ᄀᆞᆺ다", fn=ws_strip),
        S("nogeol1670_davincimap.txt", "우리 가면", "ᄀᆞᆺ다", fn=korean_side)]),
    ("O-s11-DOKRIP1", None, "mixed", [
        S("dokrip_wikisource.txt", "우리신문이", "ᄒᆞᆷ이라"),
        S("dokrip_history_go_kr.txt", "우리 신문이", "ᄒᆞᆷ이라")]),
    ("O-s11-DOKRIP2", None, "mixed", [
        S("dokrip_wikisource.txt", "각국에셔", "드물미라"),
        S("dokrip_history_go_kr.txt", "각국에셔", "드물미라")]),
    ("O-s11-DOKRIP3", None, "mixed", [
        S("dokrip_wikisource.txt", "죠션 국문ᄒᆞ고", "쉬흘터이라"),
        S("dokrip_history_go_kr.txt", "죠션 국문ᄒᆞ고", "쉬흘 터이라")]),
    ("O-s11-DOKRIP4", None, "mixed", [
        S("dokrip_wikisource.txt", "한문만 늘써", "아니ᄒᆞ리요"),
        S("dokrip_history_go_kr.txt", "한문만 늘 써", "아니ᄒᆞ리요")]),
    ("O-s11-AD1902", None, "mixed", [S("ad1902_aks_jeguk.txt", "각국시계와", "잘하오")]),
]


def diff_list(a: list[str], b: list[str]) -> list[str]:
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    out = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        ctx = "".join(a[max(0, i1 - 2):i1])
        out.append(f"{tag}: 교과서「{''.join(a[i1:i2]) or '∅'}」 ↔ 자료「{''.join(b[j1:j2]) or '∅'}」 (앞: …{ctx})")
    return out


def main() -> int:
    md = "--markdown" in sys.argv
    blocks = read_blocks(DOC)
    rows = []
    failed = False
    for bid, line_no, mode, sources in COMPARISONS:
        if bid not in blocks:
            print(f"!! 블록 없음: {bid}", file=sys.stderr)
            failed = True
            continue
        lines = blocks[bid] if line_no is None else [blocks[bid][line_no]]
        mine_raw = " ".join(lines)
        a = syllables(normalize(mine_raw, mode))
        for get in sources:
            src_raw = get()
            b = syllables(normalize(src_raw, mode))
            ratio = difflib.SequenceMatcher(a=a, b=b, autojunk=False).ratio()
            diffs = diff_list(a, b)
            rows.append((bid, get.label, mode, len(a), len(b), ratio, diffs,
                         count_spaces(mine_raw), count_spaces(src_raw)))
    if md:
        print("| 블록 | 대조 자료 | 방식 | 음절(교/자) | 일치율 | 차이 |")
        print("|---|---|---|---|---|---|")
        for bid, lab, mode, la, lb, r, diffs, sa, sb in rows:
            d = "<br>".join(diffs) if diffs else "없음"
            print(f"| {bid} | {lab} | {mode} | {la}/{lb} | {r:.3f} | {d} |")
    else:
        for bid, lab, mode, la, lb, r, diffs, sa, sb in rows:
            print(f"{bid:18s} {lab:34s} {mode:13s} {la:4d}/{lb:<4d} ratio={r:.3f}  띄어쓰기 {sa}/{sb}")
            for d in diffs:
                print("    " + d)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
