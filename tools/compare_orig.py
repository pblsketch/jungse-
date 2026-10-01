#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""원문 대조 도구 (R1).

두 텍스트를 정규화한 뒤 '글자(음절) 단위'로 맞대어 일치율과 차이 줄을 낸다.

사용법
    python tools/compare_orig.py A B [--ignore-tone] [--quiet]

A, B 자리에 올 수 있는 것
    path.txt                     파일 전체
    path.txt::시작..끝            파일 안에서 '시작'부터 '끝'까지(정규화 후 찾음, 방점 무시)
    (끝에 @nr 를 붙이면 그 입력에서 한자 바로 뒤의 한글 한 음절(한자음)을 지운다:
     한자음을 싣지 않은 자료와 맞댈 때 쓴다. 예: path.md::O-s9-SEOMUN@nr)
    (끝에 @hz 를 붙이면 한자만 남긴다: 구결 토가 달린 한문과 맞댈 때)
    path.md::=O-s2-SANG-G         id가 정확히 이것인 블록 하나
    --batch jobs.tsv              한 줄에 'A<탭>B<탭>메모' 인 작업을 차례로 돌려 요약(방점 포함/무시 일치율)을 낸다
                                  (경로는 jobs.tsv가 있는 폴더 기준)
    path.md::O-s9-SEOMUN          리서치 문서에서 id가 이 접두로 시작하는 原文 블록들을 차례로 이어 붙임
                                  (데이터 표기 [..] {漢|음} \u00b7 : 를 유니코드로 풀어서 비교)

정규화 규칙은 실행할 때마다 맨 위에 출력한다(RULES).
표준 라이브러리만 쓴다.
"""
import difflib
import re
import sys
import unicodedata

RULES = [
    "R1 유니코드 NFD로 풀어 현대 음절과 첫가끝 자모열을 같은 자모열로 만든다.",
    "R2 음절 경계: 초성(U+1100-115F, A960-A97C) 또는 자모가 아닌 글자에서 새 음절을 시작한다.",
    "R3 방점: 뒤붙임 U+302E(〮)=거성, U+302F(〯)=상성 → 그 음절 앞의 '·' ':' 로 바꾼다. "
    "앞붙임 '\u00b7'(U+00B7, U+2027, U+30FB, U+2022 포함)\u00b7':'(U+003A, U+FF1A)는 다음 음절에 붙인다.",
    "R4 공백·문장 부호(，。、,.;!?「」『』()[] 등)·위키 표지 잔여물(|)은 지운다(원본에는 띄어쓰기·현대 구두점이 없다).",
    "R5 홀로 쓰인 첫가끝 자모(음절을 이루지 않은 초성·중성)는 호환 자모로 바꾼다(ᅙ→ㆆ 등).",
    "R6 한자 이체자는 같은 글자로 본다: " ,
    "R7 --ignore-tone 이면 방점을 지우고 비교한다.",
    "R8 텍스트 파일에서 '#'으로 시작하는 줄(출처 머리말)은 비교하지 않는다.",
    "R9 입력 끝에 @nr 이 붙으면 한자 바로 뒤 한글 한 음절(한자음 표기)을 지운다.",
    "R10 입력 끝에 @hz 가 붙으면 한자만 남긴다(구결 토가 달린 한문과 맞댈 때).",
    "R11 '시작..끝' 구절은 정확히 같은 곳을 먼저 찾고, 없으면 한 글자만 다른 곳을 찾는다(차이는 결과에 그대로 드러남).",
]

VARIANTS = {
    "為": "爲", "隂": "陰", "彂": "發", "𠕅": "再", "䨱": "覆", "𡈽": "土", "㸃": "點",
    "軽": "輕", "㑹": "會", "㝎": "定", "清": "淸", "虗": "虛", "㝡": "最", "圎": "圓",
    "旣": "既", "静": "靜", "頋": "顧", "蔵": "藏", "稲": "稻", "蝿": "蠅", "竝": "並",
    "强": "強", "説": "說", "卽": "即",
    # 일본 신자체(개인 입력본에 섞임)
    "拝": "拜", "亀": "龜", "蚕": "蠶", "巣": "巢", "蝋": "蠟", "壮": "壯", "鶏": "鷄",
    "随": "隨", "暁": "曉", "聴": "聽", "掲": "揭", "盖": "蓋", "応": "應", "脩": "修",
    "横": "橫", "縦": "縱",
}
RULES[5] += ", ".join(f"{k}={v}" for k, v in VARIANTS.items())

# ---- 데이터 표기 → 유니코드 -------------------------------------------------
# 호환 자모 → (초성, 중성, 종성) 첫가끝 자모
CHO = {
    "ㄱ": "\u1100", "ㄲ": "\u1101", "ㄴ": "\u1102", "ㄷ": "\u1103", "ㄸ": "\u1104",
    "ㄹ": "\u1105", "ㅁ": "\u1106", "ㅂ": "\u1107", "ㅃ": "\u1108", "ㅅ": "\u1109",
    "ㅆ": "\u110a", "ㅇ": "\u110b", "ㅈ": "\u110c", "ㅉ": "\u110d", "ㅊ": "\u110e",
    "ㅋ": "\u110f", "ㅌ": "\u1110", "ㅍ": "\u1111", "ㅎ": "\u1112",
    "ㅿ": "\u1140", "ㆁ": "\u114c", "ㆆ": "\u1159", "ㅸ": "\u112b", "ㆀ": "\u1147",
    "ㆅ": "\u1158", "ㅳ": "\u1120", "ㅄ": "\u1121", "ㅶ": "\u1127", "ㅷ": "\u1129",
    "ㅺ": "\u112d", "ㅻ": "\u112e", "ㅼ": "\u112f", "ㅽ": "\u1132", "ㅾ": "\u1136",
    "ㅴ": "\u1122", "ㅵ": "\u1123", "ㅹ": "\u112c", "ㅱ": "\u111d",
}
JUNG = {
    "ㅏ": "\u1161", "ㅐ": "\u1162", "ㅑ": "\u1163", "ㅒ": "\u1164", "ㅓ": "\u1165",
    "ㅔ": "\u1166", "ㅕ": "\u1167", "ㅖ": "\u1168", "ㅗ": "\u1169", "ㅘ": "\u116a",
    "ㅙ": "\u116b", "ㅚ": "\u116c", "ㅛ": "\u116d", "ㅜ": "\u116e", "ㅝ": "\u116f",
    "ㅞ": "\u1170", "ㅟ": "\u1171", "ㅠ": "\u1172", "ㅡ": "\u1173", "ㅢ": "\u1174",
    "ㅣ": "\u1175", "ㆍ": "\u119e", "ㆎ": "\u11a1", "ㆇ": "\u1184", "ㆈ": "\u1185",
    "ㆉ": "\u1188", "ㆊ": "\u1191", "ㆋ": "\u1192", "ㆌ": "\u1194",
}
JONG = {
    "ㄱ": "\u11a8", "ㄲ": "\u11a9", "ㄳ": "\u11aa", "ㄴ": "\u11ab", "ㄵ": "\u11ac",
    "ㄶ": "\u11ad", "ㄷ": "\u11ae", "ㄹ": "\u11af", "ㄺ": "\u11b0", "ㄻ": "\u11b1",
    "ㄼ": "\u11b2", "ㄽ": "\u11b3", "ㄾ": "\u11b4", "ㄿ": "\u11b5", "ㅀ": "\u11b6",
    "ㅁ": "\u11b7", "ㅂ": "\u11b8", "ㅄ": "\u11b9", "ㅅ": "\u11ba", "ㅆ": "\u11bb",
    "ㅇ": "\u11bc", "ㅈ": "\u11bd", "ㅊ": "\u11be", "ㅋ": "\u11bf", "ㅌ": "\u11c0",
    "ㅍ": "\u11c1", "ㅎ": "\u11c2", "ㆁ": "\u11f0", "ㅭ": "\u11d9", "ㅿ": "\u11eb",
    "ㅩ": "\u11cc", "ㆆ": "\u11f9", "ㅸ": "\u11e6",
}
COMPAT_FROM_CHO = {v: k for k, v in CHO.items()}
COMPAT_FROM_JUNG = {v: k for k, v in JUNG.items()}


def bracket_to_jamo(inner):
    """'ㅆㆍ' 'ㅎㆍㅭ' 처럼 [초성 중성 (종성)] 한 음절을 첫가끝 자모열로."""
    chars = list(inner)
    if len(chars) not in (2, 3):
        raise ValueError(f"[{inner}] : 초성+중성(+종성) 2~3글자여야 함")
    cho, jung = chars[0], chars[1]
    if cho not in CHO or jung not in JUNG:
        raise ValueError(f"[{inner}] : 알 수 없는 초성/중성")
    out = CHO[cho] + JUNG[jung]
    if len(chars) == 3:
        if chars[2] not in JONG:
            raise ValueError(f"[{inner}] : 알 수 없는 종성")
        out += JONG[chars[2]]
    return out


def notation_to_unicode(line):
    """데이터 표기 한 줄 → 유니코드 문자열(방점은 앞붙임 · : 그대로 둠)."""
    line = re.sub(r"\{([^|{}]+)\|([^{}]+)\}", lambda m: m.group(1) + m.group(2), line)
    return re.sub(r"\[([^\[\]]+)\]", lambda m: bracket_to_jamo(m.group(1)), line)


def blocks_from_md(path, prefix):
    lines = open(path, encoding="utf-8").read().splitlines()
    out, i, found = [], 0, []
    while i < len(lines):
        m = re.match(r"^#### (O-\S+)\s*$", lines[i])
        if m and (m.group(1) == prefix[1:] if prefix.startswith("=") else m.group(1).startswith(prefix)):
            found.append(m.group(1))
            j = i + 1
            while j < len(lines) and not lines[j].startswith("> **原文**"):
                j += 1
            j += 1
            while j < len(lines) and lines[j].startswith("> "):
                out.append(notation_to_unicode(lines[j][2:]))
                j += 1
            i = j
        else:
            i += 1
    if not found:
        raise SystemExit(f"블록 없음: {path}::{prefix}")
    return "\n".join(out), found


# ---- 정규화 ------------------------------------------------------------------
PRE_DOT = "\u00b7\u2027\u30fb\u2022"
PRE_COLON = ":\uff1a"
PUNCT = set(" \t\r\n，。、,.;；!?！？「」『』()（）[]〔〕|<>-—…'\"“”‘’/") | {"\u3000"}


def is_cho(c):
    return "\u1100" <= c <= "\u115f" or "\ua960" <= c <= "\ua97c"


def is_jung(c):
    return "\u1160" <= c <= "\u11a7" or "\ud7b0" <= c <= "\ud7c6"


def is_jong(c):
    return "\u11a8" <= c <= "\u11ff" or "\ud7cb" <= c <= "\ud7fb"


def tokenize(text, ignore_tone=False):
    text = unicodedata.normalize("NFD", text)
    toks = []          # 각 토큰 = (방점, 본체)
    pending = ""
    for c in text:
        if c in PRE_DOT:
            pending = "\u00b7"
            continue
        if c in PRE_COLON:
            pending = ":"
            continue
        if c in ("\u302e", "\u302f"):
            if toks:
                t, body = toks[-1]
                toks[-1] = ("\u00b7" if c == "\u302e" else ":", body)
            continue
        if c in PUNCT:
            continue
        if (is_jung(c) or is_jong(c)) and toks and is_cho(toks[-1][1][0]):
            t, body = toks[-1]
            toks[-1] = (t, body + c)
            continue
        c = VARIANTS.get(c, c)
        toks.append((pending, c))
        pending = ""
    norm = []
    for t, body in toks:
        if len(body) == 1 and body in COMPAT_FROM_CHO:
            body = COMPAT_FROM_CHO[body]
        elif len(body) == 1 and body in COMPAT_FROM_JUNG:
            body = COMPAT_FROM_JUNG[body]
        body = unicodedata.normalize("NFC", body)
        norm.append(body if ignore_tone else t + body)
    return norm


def strip_tone(tok):
    return tok.lstrip("\u00b7:")


def drop_readings(toks):
    out, skip = [], False
    for t in toks:
        b = strip_tone(t)
        if skip and b and is_cho(unicodedata.normalize("NFD", b)[0]):
            skip = False
            continue
        skip = bool(b) and "一" <= b[0] <= "鿿"
        out.append(t)
    return out


def is_han(tok):
    b = strip_tone(tok)
    return bool(b) and ("\u4e00" <= b[0] <= "\u9fff" or "\u3400" <= b[0] <= "\u4dbf" or b[0] >= "\U00020000")


def load(spec, ignore_tone):
    if spec.endswith("@hz"):
        toks, label = load(spec[:-3], ignore_tone)
        return [t for t in toks if is_han(t)], label + " [한자만]"
    if spec.endswith("@nr"):
        toks, label = load(spec[:-3], ignore_tone)
        return drop_readings(toks), label + " [한자음 지움]"
    label = spec
    if "::" in spec:
        path, sel = spec.split("::", 1)
    else:
        path, sel = spec, None
    if path.endswith(".md") and sel:
        text, ids = blocks_from_md(path, sel)
        label = f"{spec} ({len(ids)}블록: {ids[0]}…{ids[-1]})"
        return tokenize(text, ignore_tone), label
    text = open(path, encoding="utf-8").read()
    text = "\n".join(l for l in text.splitlines() if not l.startswith("#"))  # '#' 줄 = 출처 머리말
    toks = tokenize(text, ignore_tone)
    if sel:
        start, end = sel.split("..", 1)
        bare = [strip_tone(t) for t in toks]
        s_t = [strip_tone(t) for t in tokenize(start)]
        e_t = [strip_tone(t) for t in tokenize(end)]
        si = find_sub(bare, s_t, 0)
        if si < 0:
            raise SystemExit(f"시작 구절을 못 찾음: {start} in {path}")
        ei = find_sub(bare, e_t, si)
        if ei < 0:
            raise SystemExit(f"끝 구절을 못 찾음: {end} in {path}")
        toks = toks[si:ei + len(e_t)]
    return toks, label


def find_sub(seq, sub, start):
    """정확히 같은 곳을 먼저 찾고, 없으면 한 글자만 다른 곳(이체·오입력 대비)을 찾는다."""
    for i in range(start, len(seq) - len(sub) + 1):
        if seq[i:i + len(sub)] == sub:
            return i
    if len(sub) >= 3:
        for i in range(start, len(seq) - len(sub) + 1):
            if sum(1 for x, y in zip(seq[i:i + len(sub)], sub) if x != y) <= 1:
                return i
    return -1


def compare(a, b):
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    matched = sum(bl.size for bl in sm.get_matching_blocks())
    ratio = 2.0 * matched / (len(a) + len(b)) if (a or b) else 1.0
    diffs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != "equal":
            ctx = "".join(a[max(0, i1 - 4):i1])
            diffs.append(f"{op:7s} @A{i1}: …{ctx} | A「{''.join(a[i1:i2])}」 B「{''.join(b[j1:j2])}」")
    return ratio, matched, diffs


def batch(path):
    import os
    base = os.path.dirname(os.path.abspath(path))
    print("정규화 규칙:")
    for r in RULES:
        print("  " + r)
    fails = 0
    for n, line in enumerate(open(path, encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line.strip() or line.startswith("#"):
            continue
        A, B, memo = (line.split("\t") + ["", ""])[:3]
        A2, B2 = os.path.join(base, A), os.path.join(base, B)
        try:
            a, _ = load(A2, False)
            b, _ = load(B2, False)
        except SystemExit as e:
            print(f"[{n:02d}] {memo}\n     실패: {e}")
            continue
        r1, _, d1 = compare(a, b)
        a0, _ = load(A2, True)
        b0, _ = load(B2, True)
        r0, _, _ = compare(a0, b0)
        print(f"[{n:02d}] {memo}")
        print(f"     A={A}")
        print(f"     B={B}")
        print(f"     방점포함 {r1 * 100:6.2f}%  방점무시 {r0 * 100:6.2f}%  ({len(a)}자/{len(b)}자)")
        for d in d1:
            print("       - " + d)
    print(f"작업 실패 {fails}건")
    return 1 if fails else 0


def main(argv):
    if len(argv) == 2 and argv[0] == "--batch":
        return batch(argv[1])
    args = [a for a in argv if not a.startswith("--")]
    ignore_tone = "--ignore-tone" in argv
    quiet = "--quiet" in argv
    if len(args) != 2:
        print(__doc__)
        return 2
    if not quiet:
        print("정규화 규칙:")
        for r in RULES:
            print("  " + r)
    a, la = load(args[0], ignore_tone)
    b, lb = load(args[1], ignore_tone)
    ratio, matched, diffs = compare(a, b)
    print(f"A: {la}  [{len(a)}자]")
    print(f"B: {lb}  [{len(b)}자]")
    print(f"방점 {'무시' if ignore_tone else '포함'}  일치율 {ratio * 100:.2f}%  (같은 글자 {matched})")
    for n, d in enumerate(diffs, 1):
        print(f"  차이{n} {d}")
    if not diffs:
        print("  차이 없음")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
