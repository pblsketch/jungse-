#!/usr/bin/env python3
"""R2 원문 대조기 (15세기 문헌) — 두 본문을 글자(음절) 단위로 비교한다.

사용법
  python tools/compare_orig_r2.py "<본문 A>" "<본문 B>" [--mode letters|tone] [--keep-ruby]
  python tools/compare_orig_r2.py @a.txt @b.txt          # @파일 = 파일 내용(UTF-8)
  python tools/compare_orig_r2.py --pairs design/research/source_cache/r2/pairs_r2.json
  python tools/compare_orig_r2.py --to-notation "<위키문헌식 본문>"   # 데이터 표기로 바꾸기

입력 형식은 자동으로 알아본다(--fmt-a/--fmt-b 로 지정 가능).
  notation : 리서치 문서·게임 데이터 표기.  [ㅎㆍ] = 호환 자모로 쓴 한 음절,
             방점은 음절 앞에 붙임(· 거성, : 상성, 없음 평성),
             {漢|[ㄷㅠㆁ]} = 한자 + 동국정운식 한자음(루비)
  wiki     : 위키문헌 식. 첫가끝 자모 + 방점(U+302E 〮, U+302F 〯)을 음절 뒤에 붙임
  plain    : 방점 없는 일반 본문(세종한글고전·우리말샘·hopark 등).
             한자 뒤 괄호 속 현대 한자음 "命(명)" 은 지운다.

정규화 규칙은 실행할 때마다 맨 앞에 출력한다. 표준 라이브러리만 쓴다.
"""
import argparse
import difflib
import json
import re
import sys
import unicodedata as ud

NORMALIZATION_RULES = [
    "1. 모든 음절을 첫가끝 자모열로 풀었다가 NFC로 다시 모은다(현대 음절은 완성형, 옛 음절은 자모열).",
    "2. 데이터 표기의 [호환 자모]는 위치에 따라 초성·중성·종성 자모로 바꾼다(ㆎ=ᆡ, ㆁ=ᅌ/ᇰ 등).",
    "3. 띄어쓰기·문장 부호·괄호 속 현대 한자음 '(명)'·【】 협주 표시는 비교에서 뺀다.",
    "4. 한자는 한 글자를 한 단위로 보고 NFC로 정규화한다(호환 한자 U+F900~ → 통합 한자). 루비(동국정운식 한자음)는 기본으로 빼고, --keep-ruby 일 때만 넣는다.",
    "5. letters 모드: 방점을 지우고 글자만 비교. tone 모드: 방점(·/:)을 음절에 붙여 함께 비교.",
    "6. 홀로 쓰인 자모(王ㄱ의 ㄱ, 帝冑ㅣ의 ㅣ)는 호환 자모 한 글자 단위로 본다.",
    "7. 일치율 = difflib.SequenceMatcher(None, A, B).ratio() (단위 = 음절/한자/홀자모).",
]

TONE_CHARS = {"〮": "·", "〯": ":"}
HAN_RE = re.compile(r"[㐀-䶿一-鿿豈-﫿]")


def _is_cho(c):
    o = ord(c)
    return 0x1100 <= o <= 0x115F or 0xA960 <= o <= 0xA97F


def _is_jung(c):
    o = ord(c)
    return 0x1160 <= o <= 0x11A7 or 0xD7B0 <= o <= 0xD7C6


def _is_jong(c):
    o = ord(c)
    return 0x11A8 <= o <= 0x11FF or 0xD7CB <= o <= 0xD7FB


def _is_syll(c):
    return 0xAC00 <= ord(c) <= 0xD7A3


def _is_compat(c):
    return 0x3131 <= ord(c) <= 0x318E


def _compat_is_vowel(c):
    o = ord(c)
    return 0x314F <= o <= 0x3163 or 0x3187 <= o <= 0x318E


# ---- 호환 자모 <-> 첫가끝 자모 대응표 (유니코드 이름으로 만든다) ----
_SPECIAL_JUNG = {"ARAEAE": "ARAEA-I"}
COMPAT2CHO, COMPAT2JUNG, COMPAT2JONG = {}, {}, {}
for _o in range(0x3131, 0x318F):
    _c = chr(_o)
    _n = ud.name(_c, "").replace("HANGUL LETTER ", "")
    if not _n:
        continue
    if _compat_is_vowel(_c):
        try:
            COMPAT2JUNG[_c] = ud.lookup("HANGUL JUNGSEONG " + _SPECIAL_JUNG.get(_n, _n))
        except KeyError:
            pass
    else:
        for _tab, _pre in ((COMPAT2CHO, "HANGUL CHOSEONG "), (COMPAT2JONG, "HANGUL JONGSEONG ")):
            try:
                _tab[_c] = ud.lookup(_pre + _n)
            except KeyError:
                pass
CHO2COMPAT = {v: k for k, v in COMPAT2CHO.items()}
JUNG2COMPAT = {v: k for k, v in COMPAT2JUNG.items()}
JONG2COMPAT = {v: k for k, v in COMPAT2JONG.items()}


class Tok:
    __slots__ = ("kind", "text", "tone", "ruby", "ruby_tone")

    def __init__(self, kind, text, tone="", ruby="", ruby_tone=""):
        self.kind, self.text, self.tone, self.ruby, self.ruby_tone = kind, text, tone, ruby, ruby_tone

    def key(self, mode, keep_ruby):
        k = self.text
        if mode == "tone" and self.kind == "syl":
            k = self.tone + k
        if self.kind == "han" and keep_ruby and self.ruby:
            k = k + "{" + (self.ruby_tone if mode == "tone" else "") + self.ruby + "}"
        return k

    def __repr__(self):
        return f"Tok({self.kind},{self.tone}{self.text})"


def canon(jamo_seq):
    """음절 문자열을 정준형으로: 완전 분해 후 NFC 재조합."""
    return ud.normalize("NFC", ud.normalize("NFD", jamo_seq))


def bracket_to_jamo(inner):
    """'ㅎㆍㄴ' 같은 호환 자모열(한 음절)을 첫가끝 자모열로."""
    chars = list(inner)
    vi = [i for i, c in enumerate(chars) if _compat_is_vowel(c)]
    if not vi:
        raise ValueError(f"[{inner}] 에 모음이 없다")
    first_v, last_v = vi[0], vi[-1]
    if vi != list(range(first_v, last_v + 1)):
        raise ValueError(f"[{inner}] 모음이 이어져 있지 않다")
    out = []
    for c in chars[:first_v]:
        if c not in COMPAT2CHO:
            raise ValueError(f"[{inner}] 초성으로 쓸 수 없는 자모 {c}")
        out.append(COMPAT2CHO[c])
    if first_v == 0:
        out.append("ᄋ")  # 초성 없으면 ㅇ(소리 없음)
    vowels = "".join(COMPAT2JUNG[c] for c in chars[first_v:last_v + 1])
    out.append(vowels)
    for c in chars[last_v + 1:]:
        if c not in COMPAT2JONG:
            raise ValueError(f"[{inner}] 종성으로 쓸 수 없는 자모 {c}")
        out.append(COMPAT2JONG[c])
    return "".join(out)


def parse_notation(s):
    toks, i, tone = [], 0, ""
    n = len(s)
    while i < n:
        c = s[i]
        if c in "·:":
            tone = c
            i += 1
            continue
        if c == "[":
            j = s.index("]", i)
            toks.append(Tok("syl", canon(bracket_to_jamo(s[i + 1:j])), tone))
            tone, i = "", j + 1
            continue
        if c == "{":
            j = s.index("}", i)
            han, _, rd = s[i + 1:j].partition("|")
            rt = ""
            rtoks = parse_notation(rd) if rd else []
            ruby = "".join(t.text for t in rtoks)
            if rtoks:
                rt = rtoks[0].tone
            for h in han:
                toks.append(Tok("han", ud.normalize("NFC", h), "", ruby, rt))
            tone, i = "", j + 1
            continue
        if _is_syll(c):
            toks.append(Tok("syl", canon(c), tone))
            tone, i = "", i + 1
            continue
        if HAN_RE.match(c):
            toks.append(Tok("han", ud.normalize("NFC", c)))
            i += 1
            continue
        if _is_compat(c):
            toks.append(Tok("jamo", c))
            i += 1
            continue
        if c.isspace():
            toks.append(Tok("sp", " "))
        i += 1
    return toks


def _syllables_unicode(s, keep_tone_marks=True):
    """첫가끝/완성형 혼합 본문을 토큰열로. 방점은 앞 음절에 붙인다(위키문헌식)."""
    toks, i, n = [], 0, len(s)
    while i < n:
        c = s[i]
        if c in TONE_CHARS:
            if keep_tone_marks:
                for t in reversed(toks):
                    if t.kind == "syl":
                        t.tone = TONE_CHARS[c]
                        break
            i += 1
            continue
        if _is_cho(c) or _is_syll(c):
            j = i + 1
            if _is_cho(c):
                while j < n and _is_cho(s[j]):
                    j += 1
                while j < n and _is_jung(s[j]):
                    j += 1
            while j < n and _is_jong(s[j]):
                j += 1
            toks.append(Tok("syl", canon(s[i:j])))
            i = j
            continue
        if _is_jung(c):  # 홀로 쓰인 중성(주격 ㅣ 등)
            toks.append(Tok("jamo", JUNG2COMPAT.get(c, c)))
            i += 1
            continue
        if _is_jong(c):
            toks.append(Tok("jamo", JONG2COMPAT.get(c, c)))
            i += 1
            continue
        if HAN_RE.match(c):
            toks.append(Tok("han", ud.normalize("NFC", c)))
            i += 1
            continue
        if _is_compat(c):
            toks.append(Tok("jamo", c))
            i += 1
            continue
        if c.isspace():
            toks.append(Tok("sp", " "))
        i += 1
    return toks


def strip_markup(s):
    s = re.sub(r"\{\{옛한글 인라인\|(.*?)\}\}", r"\1", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\(([가-힣\s]+)\)", "", s)  # hopark 식 '命(명)'
    s = s.replace("【", " ").replace("】", " ").replace("≪", " ").replace("≫", " ")
    return s


def parse_any(s, fmt="auto"):
    if fmt == "auto":
        if "{{" in s or "〮" in s or "〯" in s:
            fmt = "wiki"
        elif re.search(r"[\[\]{}]", s) or re.search(r"(^|[\s\]}])[·:]", s):
            fmt = "notation"
        else:
            fmt = "plain"
    if fmt == "notation":
        return parse_notation(s), fmt
    return _syllables_unicode(strip_markup(s)), fmt


def to_notation(toks):
    out = []
    for t in toks:
        if t.kind == "sp":
            if out and out[-1] != " ":
                out.append(" ")
            continue
        if t.kind == "han":
            out.append(t.text)
            continue
        if t.kind == "jamo":
            out.append(t.text)
            continue
        syl = t.text
        if len(syl) == 1 and _is_syll(syl):
            body = syl
        else:
            d = ud.normalize("NFD", syl)
            comp = []
            for ch in d:
                if _is_cho(ch):
                    comp.append(CHO2COMPAT.get(ch, "?"))
                elif _is_jung(ch):
                    comp.append(JUNG2COMPAT.get(ch, "?"))
                elif _is_jong(ch):
                    comp.append(JONG2COMPAT.get(ch, "?"))
            body = "[" + "".join(comp) + "]"
        out.append(t.tone + body)
    return "".join(out).strip()


def units(toks, mode, keep_ruby):
    return [t.key(mode, keep_ruby) for t in toks if t.kind != "sp"]


def compare(a, b, mode="letters", keep_ruby=False, fmt_a="auto", fmt_b="auto"):
    ta, fa = parse_any(a, fmt_a)
    tb, fb = parse_any(b, fmt_b)
    ua, ub = units(ta, mode, keep_ruby), units(tb, mode, keep_ruby)
    sm = difflib.SequenceMatcher(None, ua, ub, autojunk=False)
    diffs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != "equal":
            diffs.append((op, "".join(ua[i1:i2]), "".join(ub[j1:j2]), i1))
    return sm.ratio(), diffs, fa, fb, len(ua), len(ub)


def _read_arg(x):
    if x.startswith("@"):
        with open(x[1:], encoding="utf-8") as f:
            return f.read()
    return x


def print_rules():
    print("[정규화 규칙]")
    for r in NORMALIZATION_RULES:
        print("  " + r)
    print()


def run_pairs(path, keep_ruby_default=False):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    print_rules()
    rows = []
    for blk in data["blocks"]:
        bid, base = blk["id"], blk["notation"]
        for src in blk["sources"]:
            mode = src.get("mode", "letters")
            kr = src.get("keep_ruby", keep_ruby_default)
            r, diffs, fa, fb, na, nb = compare(base, src["text"], mode, kr, "notation", src.get("fmt", "auto"))
            rows.append((bid, src["label"], mode, r, diffs, na, nb))
    print(f"{'블록':<14} {'대조 자료':<22} {'모드':<7} {'일치율':>7}  차이")
    for bid, lab, mode, r, diffs, na, nb in rows:
        d = "; ".join(f"{op}:'{x}'→'{y}'" for op, x, y, _ in diffs) or "-"
        print(f"{bid:<14} {lab:<22} {mode:<7} {r:7.3f}  {d}")
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("a", nargs="?")
    ap.add_argument("b", nargs="?")
    ap.add_argument("--mode", choices=["letters", "tone"], default="letters")
    ap.add_argument("--keep-ruby", action="store_true")
    ap.add_argument("--fmt-a", default="auto", choices=["auto", "notation", "wiki", "plain"])
    ap.add_argument("--fmt-b", default="auto", choices=["auto", "notation", "wiki", "plain"])
    ap.add_argument("--pairs")
    ap.add_argument("--to-notation")
    args = ap.parse_args(argv)
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if args.to_notation is not None:
        toks, _ = parse_any(_read_arg(args.to_notation), "auto")
        print(to_notation(toks))
        return 0
    if args.pairs:
        run_pairs(args.pairs)
        return 0
    if not (args.a and args.b):
        ap.error("본문 두 개 또는 --pairs 가 필요하다")
    print_rules()
    r, diffs, fa, fb, na, nb = compare(_read_arg(args.a), _read_arg(args.b), args.mode, args.keep_ruby, args.fmt_a, args.fmt_b)
    print(f"형식: A={fa}, B={fb} / 단위 수: A={na}, B={nb} / 모드: {args.mode}")
    print(f"일치율: {r:.3f}")
    if diffs:
        print("[차이]")
        for op, x, y, pos in diffs:
            print(f"  @{pos} {op}: A='{x}'  B='{y}'")
    else:
        print("[차이] 없음")
    return 0


if __name__ == "__main__":
    sys.exit(main())
