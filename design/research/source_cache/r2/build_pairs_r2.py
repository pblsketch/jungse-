"""pairs_r2.json 다시 만들기: 이 폴더의 캐시 파일에서 대조 구절을 잘라 낸다.
실행: python design/research/source_cache/r2/build_pairs_r2.py  (그다음 tools/compare_orig_r2.py --pairs ...)
"""
import json, sys, os, glob, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "..", "tools"))
import compare_orig_r2 as C

CACHE = HERE
WIKI = open(os.path.join(CACHE, "yb_wikisource_raw.txt"), encoding="utf-8").read().split("\n")
HOP = open(os.path.join(CACHE, "hopark_yb1000.txt"), encoding="utf-8").read().split("\n")

def letters(s, fmt="auto"):
    toks, _ = C.parse_any(s, fmt)
    return toks

def find_line(lines, key, fmt="plain"):
    for l in lines:
        t = letters(l, fmt)
        k = "".join(x.key("letters", False) for x in t if x.kind != "sp")
        kk = "".join(x.key("letters", False) for x in letters(key, "plain") if x.kind != "sp")
        if kk in k:
            return l
    raise KeyError(key)

def cut(text, start, end, fmt="auto"):
    toks, f = C.parse_any(text, fmt)
    nonsp = [i for i, t in enumerate(toks) if t.kind != "sp"]
    keys = [toks[i].key("letters", False) for i in nonsp]
    sk = [t.key("letters", False) for t in letters(start, "plain") if t.kind != "sp"]
    ek = [t.key("letters", False) for t in letters(end, "plain") if t.kind != "sp"]
    for a in range(len(keys)):
        if keys[a:a + len(sk)] == sk:
            for b in range(a, len(keys)):
                if keys[b:b + len(ek)] == ek:
                    lo, hi = nonsp[a], nonsp[b + len(ek) - 1]
                    seg = toks[lo:hi + 1]
                    return seg, f
    raise KeyError((start, end, text[:60]))

def render(seg, f):
    out = []
    for t in seg:
        if t.kind == "sp":
            out.append(" ")
        elif t.kind == "syl":
            out.append(t.text + ({"·": "\u302e", ":": "\u302f"}.get(t.tone, "") if f == "wiki" else ""))
        else:
            out.append(t.text)
    return re.sub(r"\s+", " ", "".join(out)).strip()

def dbtext(fname, start, end):
    s = open(os.path.join(CACHE, fname), encoding="utf-8").read()
    if "_BD_" not in fname:
        s = s.split("Ⓒ")[0]
    if fname.endswith("v001_0170.txt"):
        s = re.sub(r"【[^】]*】", " ", s)  # 협주는 교과서·블록에서 뺐으므로 비교에서도 뺀다
    s = re.sub(r"(월인석보|석보상절|분류두공부시언해 권)\s*\d+:\d+[ㄱㄴ]", " ", s)
    seg, f = cut(s, start, end, "plain")
    return render(seg, "plain")

def odtext(fname, start, end):
    s = open(os.path.join(CACHE, "od", fname), encoding="utf-8").read()
    seg, f = cut(s, start, end, "plain")
    return render(seg, "plain")

def wiki(key, start, end):
    l = find_line(WIKI, key, "wiki")
    seg, f = cut(l, start, end, "wiki")
    return render(seg, "wiki"), C.to_notation(seg)

def hop(key, start, end):
    l = find_line(HOP, key)
    seg, f = cut(l, start, end, "plain")
    return render(seg, "plain")

blocks = []
def add(bid, notation, sources):
    blocks.append({"id": bid, "notation": notation, "sources": sources})

def yb(bid, key, start, end, manual=None, extra=()):
    w, n = wiki(key, start, end)
    base = manual or n
    src = [{"label": "위키문헌(방점)", "fmt": "wiki", "text": w, "mode": "tone"},
           {"label": "위키문헌", "fmt": "wiki", "text": w, "mode": "letters"},
           {"label": "hopark", "fmt": "plain", "text": hop(key, start, end), "mode": "letters"}]
    src += list(extra)
    add(bid, base, src)
    return n

# ---- s4 용비어천가 2장, 34장 (교과서 판독 = 기준) ----
TB = {
 "O-s4-YB2a": "불·휘 기·픈 남·[ㄱㆍㄴ] [ㅂㆍ][ㄹㆍ]·매 아·니 :뮐·[ㅆㆎ] 곶 :됴·코 여·름 ·하[ㄴㆍ]·니",
 "O-s4-YB2b": ":[ㅅㆎ]·미 기·픈 ·므·른 ·[ㄱㆍ][ㅁㆍ]·래 아·니 그·츨·[ㅆㆎ] :내·히 이·러 바·[ㄹㆍ]·래 ·가[ㄴㆍ]·니",
 "O-s4-YB34a": "·믈 깊·고 ·[ㅂㆎ] :업·건마·[ㄹㆍㄴ] 하·[ㄴㆍㄹ]·히 命·[ㅎㆍ]실·[ㅆㆎ] [ㅁㆍㄹ] ·톤 자·히 :건·너시·니[ㆁㅣ]·다",
 "O-s4-YB34b": "城 높·고 [ㄷㆍ]리 :업·건마·[ㄹㆍㄴ] 하·[ㄴㆍㄹ]·히 :도·[ㅸㆍ]실·[ㅆㆎ] [ㅁㆍㄹ] ·톤 자·히 [ㄴㆍ]·리시·니[ㆁㅣ]·다",
}
yb("O-s4-YB2a", "불휘 기픈 남ᄀᆞᆫ", "불휘", "하ᄂᆞ니", TB["O-s4-YB2a"])
yb("O-s4-YB2b", "ᄉᆡ미 기픈", "ᄉᆡ미", "가ᄂᆞ니", TB["O-s4-YB2b"])
yb("O-s4-YB34a", "믈 깊고 ᄇᆡ", "믈", "건너시니ᅌᅵ다", TB["O-s4-YB34a"])
yb("O-s4-YB34b", "城 높고 ᄃᆞ리", "城", "ᄂᆞ리시니ᅌᅵ다", TB["O-s4-YB34b"])

# ---- 용비어천가 보충(위키문헌 방점 기준) ----
OD = lambda f, s, e, lab: {"label": lab, "fmt": "plain", "text": odtext(f, s, e), "mode": "letters"}
yb("O-s5-YB13", "말ᄊᆞᄆᆞᆯ ᄉᆞᆯᄫᆞ리 하ᄃᆡ", "말ᄊᆞᄆᆞᆯ", "뵈아시니",
   extra=[OD("od_28006.txt", "말ᄊᆞᄆᆞᆯ", "뵈아시니", "우리말샘(하다)")])
yb("O-s5-YB39a", "님그ᇟ ᄆᆞᅀᆞ미", "楚國엣", "어리시니",
   extra=[OD("od_223595.txt", "楚國엣", "어리시니", "우리말샘(어리다)")])
yb("O-s5-YB39b", "鴨江앳", "鴨江앳", "올ᄒᆞ시니")
yb("O-s5-YB50", "내 百姓 어엿비", "내", "너기샤")
yb("O-s5-YB64", "叛ᄒᆞᄂᆞᆫ 노ᄆᆞᆯ", "叛ᄒᆞᄂᆞᆫ", "노ᄒᆞ시니")
yb("O-s6-YB17a", "宮女로 놀라샤미", "宮女로", "다시언마ᄅᆞᆫ")
yb("O-s6-YB17b", "官妓로 怒ᄒᆞ샤미", "官妓로", "다시언마ᄅᆞᆫ")
yb("O-s7-YB29", "大耳兒ᄅᆞᆯ 臥龍이", "大耳兒ᄅᆞᆯ", "돕ᄉᆞᄫᆞ니")
yb("O-s7-YB55", "燕人이 向慕ᄒᆞᅀᆞᄫᅡ", "逐鹿未掎예", "돕ᄉᆞᄫᆞ니")
yb("O-s7-YB63", "慶爵ᄋᆞᆯ 받ᄌᆞᄫᆞ니ᅌᅵ다", "慶爵ᄋᆞᆯ", "받ᄌᆞᄫᆞ니ᅌᅵ다")
yb("O-s8-YB15", "九變之局이", "九變之局이", "ᄠᅳ디리ᅌᅵᆺ가",
   extra=[OD("od_72841.txt", "九變之局이", "ᄠᅳ디리ᅌᅵᆺ가", "우리말샘(-가)")])
yb("O-s8-YB88", "遮陽ㄱ 세 쥐", "遮陽ㄱ", "잇더신가",
   extra=[OD("od_72841.txt", "遮陽ㄱ", "잇더신가", "우리말샘(-가)")])
yb("O-s8-YB28", "員의 지븨", "員의", "엇더ᄒᆞ니ᅌᅵᆺ고")
yb("O-s8-YB47", "어듸 머러 威不及", "어듸", "威不及ᄒᆞ리ᅌᅵᆺ고")

# ---- 석보상절 권6 (교과서 화언 205쪽 = 기준) ----
SS = "sj_ss6/P13_SS_e01_v006_0150.txt"
def ss(bid, nota, s, e, orig=None, extra=()):
    src = [{"label": "세종한글고전", "fmt": "plain", "text": dbtext(SS, s, e), "mode": "letters"}]
    if orig:
        src.append({"label": "원본영인 판독(방점)", "fmt": "notation", "text": orig, "mode": "tone"})
    src += list(extra)
    add(bid, nota, src)

ss("O-s6-SS6a", "{羅|랑}{雲|운}·이 져·머 노·[ㄹㆍ]·[ㅅㆍㄹ] ·즐·겨 {法|·법} 드·로·[ㅁㆍㄹ] ·슬·히 너·겨 ·[ㅎㆍ]거·든",
   "羅雲이 져머", "ᄒᆞ거든", "{羅|랑}{雲|운}·이 져·머 노·[ㄹㆍ]·[ㅅㆍㄹ] ·즐·겨 {法|·법} 드·로·[ㅁㆍㄹ] ·슬·히 너·겨 ·[ㅎㆍ]거·든")
ss("O-s7-SS6b", "부:톄 [ㅈㆍ]·로 니[ㄹㆍ]·샤·도 {從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디 아·니·[ㅎㆍ]더·니",
   "부톄 ᄌᆞ로", "아니ᄒᆞ더니", "부:톄 [ㅈㆍ]·로 니[ㄹㆍ]·샤·도 {從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디 아·니·[ㅎㆍ]더·니")
ss("O-s7-SS6c", "{後|:[ㆅㅜㅱ]}·에 부:톄 {羅|랑}{雲|운}·이[ㄷㆍ]·려 니[ㄹㆍ]·샤·[ㄷㆎ]",
   "後에 부톄", "니ᄅᆞ샤ᄃᆡ", "{後|:[ㆅㅜㅱ]}·에 부:톄 {羅|랑}{雲|운}·이[ㄷㆍ]·려 니[ㄹㆍ]·샤·[ㄷㆎ]")
ss("O-s6-SS6d", "부텨 맛:나·미 어·려[ㅸㅡ]며 {法|·법} 드·로·미 어·려[ㅸㅡ]·니",
   "부텨 맛나미", "어려ᄫᅳ니", "부텨 맛:나·미 어·려[ㅸㅡ]·며 {法|·법} 드·로·미 어·려[ㅸㅡ]·니")
ss("O-s6-SS6e", ":네 ·이제 :사[ㄹㆍ]·[ㅁㆎ] ·모·[ㅁㆍㄹ] {得|·득}[ㅎㆍ]·고 부텨·를 맛·나 잇[ㄴㆍ]·니",
   "네 이제", "잇ᄂᆞ니", ":네 ·이제 :사[ㄹㆍ]·[ㅁㆎ] ·모·[ㅁㆍㄹ] {得|·득}[ㅎㆍ]·고 부텨·를 맛·나 잇[ㄴㆍ]·니")
ss("O-s8-SS6f", ":엇·뎨 게을·어 {法|·법}·을 아·니 듣[ㄴㆍㄴ]·다",
   "엇뎨 게을어", "듣ᄂᆞᆫ다", ":엇·뎨 게을·어 {法|·법}·을 아·니 듣[ㄴㆍㄴ]·다")
# 교과서 밖 이어지는 구절(원본 영인으로 방점 판독)
ss("O-s8-SS6g", "{羅|랑}{雲|운}·이 [ㅅㆍㄹ]·[ㅸㅗ]·[ㄷㆎ] 부텻 {法|·법}·이 {精|[ㅈㅕㆁ]}{微|밍}·[ㅎㆍ]·야 져·믄 아·[ㅎㆎ] 어·느 듣[ㅈㆍ]·[ㅸㅗ]·리[ㆁㅣㅅ]·고",
   "羅雲이 ᄉᆞᆯᄫᅩᄃᆡ", "듣ᄌᆞᄫᅩ리ᅌᅵᆺ고",
   extra=[OD("od_273459.txt", "羅雲이 ᄉᆞᆯᄫᅩᄃᆡ", "듣ᄌᆞᄫᅩ리ᅌᅵᆺ고", "우리말샘(졈다)")])
ss("O-s7-SS6h", "어·루 {法|·법}·을 [ㅂㆎ]·호[ㅿㆍ]·[ㅸㅗ]·리[ㆁㅣ]·다", "어루 法을", "ᄇᆡ호ᅀᆞᄫᅩ리ᅌᅵ다")
ss("O-s8-SS6i", "네 목:수·믈 미·더 ·[ㅈㆍ]·[ㄹㅏㅭ] {時|씽}{節|·[ㅈㅕㅭ]}·을 기·드·리[ㄴㆍㄴ]·다", "네 목수믈", "기드리ᄂᆞᆫ다")
ss("O-s6-SS6j", "{羅|랑}{雲|운}·의 [ㅁㆍ]·[ㅿㆍ]·미 여·러 :아니·라", "羅雲의", "아니라")
SS8 = "sj_ss6/P13_SS_e01_v006_0110.txt"
add("O-s8-SS68", ":네 :디·나건 :녜 :뉫 {時|씽}{節|·[ㅈㅕㅭ]}·에 {盟|[ㅁㅕㆁ]}{誓|·쎙} {發|·[ㅂㅓㅭ]}{願|·[ㆁㅝㄴ]}·혼 :이·[ㄹㆍㄹ] :혜[ㄴㆍㄴ]·다 모·[ㄹㆍ][ㄴㆍㄴ]·다",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext(SS8, "네 디나건", "모ᄅᆞᄂᆞᆫ다"), "mode": "letters"},
     OD("od_343186.txt", "네 디나건", "모ᄅᆞᄂᆞᆫ다", "우리말샘(-ㄴ다)")])
SS13 = "sj_ss6/P13_SS_e01_v006_0190.txt"
add("O-s5-SS613", "{艱|간}{難|난}[ㅎㆍ]·며 :어·엿븐 :사[ㄹㆍ]·[ㅁㆍㄹ] :쥐·주·어",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext(SS13, "艱難ᄒᆞ며", "쥐주어"), "mode": "letters"},
     OD("od_224204.txt", "艱難ᄒᆞ며", "쥐주어", "우리말샘(어엿브다)")])

# ---- 월인석보 권1 (교과서 화언 208쪽 = 기준) ----
WS = "sj_ws1/P14_WS_e01_v001_0170.txt"
def ws(bid, nota, s, e, extra=()):
    add(bid, nota, [{"label": "세종한글고전", "fmt": "plain", "text": dbtext(WS, s, e), "mode": "letters"}] + list(extra))
ws("O-s7-WS1a", "그 저·긧 {燈|[ㄷㅡㆁ]}{照|·[ㅈㅛㅱ]} {王|[ㅇㅘㆁ]}·이 {普|:퐁}{光|[ㄱㅘㆁ]}{佛|·[ㅃㅜㅭ]}·을 {請|:[ㅊㅓㆁ]}·[ㅎㆍ][ㅿㆍ]·[ㅸㅏ] {供|[ㄱㅗㆁ]}{養|·[ㅇㅑㆁ]}·호리·라 ·[ㅎㆍ]·야", "그저긧", "ᄒᆞ야")
ws("O-s7-WS1b", "나·라·해 {出|·[ㅊㅠㅭ]}{令|·[ㄹㅕㆁ]}·호·[ㄷㆎ] :됴[ㅎㆍㄴ] 고·[ㅈㆍ]란 ·[ㅍㆍ]·디 :말·오 :다 {王|[ㅇㅘㆁ]}·[ㅺㅢ] 가·져오·라", "나라해", "오라")
ws("O-s7-WS1c", "{善|:쎤}{慧|·[ㆅㅞㅇ]} 드르·시·고 츠기 너·겨", "善慧 드르시고", "너겨")
ws("O-s7-WS1d", "·가·시다·가 {俱|궁}{夷|잉}·[ㄹㆍㄹ] 맛·나시·니", "가시다가", "맛나시니")
ws("O-s7-WS1e", "곳 닐·굽 줄·기·를 가·져 :겨샤·[ㄷㆎ]", "곳 닐굽", "겨사ᄃᆡ",
   extra=[{"label": "원본영인 판독(글자)", "fmt": "notation", "text": "곳 닐·굽 줄·기·[ㄹㆍㄹ] 가·져 :겨·샤·[ㄷㆎ]", "mode": "letters"}])
ws("O-s7-WS1f", "{王|[ㅇㅘㆁ]}ㄱ {出|·[ㅊㅠㅭ]}{令|·[ㄹㅕㆁ]}·을 저[ㅆㆍ]·[ㅸㅏ] {甁|[ㅃㅕㆁ]}ㄱ :소·배 [ㄱㆍ]·초·아 ·뒷·더시·니", "王ㄱ", "뒷더시니")
ws("O-s7-WS1g", "{善|:쎤}{慧|·[ㆅㅞㅇ]} {精|[ㅈㅕㆁ]}{誠|[ㅆㅕㆁ]}·이 {至|·징}{極|·끅}·[ㅎㆍ]실·[ㅆㆎ] 고·지 소·사·나거·늘", "善慧 精誠이", "소사나거늘")
ws("O-s7-WS1h", "조·차 블·러 ·사·아 지·라 ·[ㅎㆍ]신·대", "조차", "ᄒᆞ신대")
ws("O-s7-WS1i", "{俱|궁}{夷|잉} 니[ㄹㆍ]·샤·[ㄷㆎ]", "俱夷 니ᄅᆞ샤ᄃᆡ", "니ᄅᆞ샤ᄃᆡ")
ws("O-s7-WS1j", "{大|·땡}{闕|·[ㄱㅝㅭ]}·에 보·내[ㅿㆍ]·[ㅸㅏ] 부텻·긔 받[ㅈㆍ]·[ㅸㆍㅭ] 고·지·라 :몯[ㅎㆍ]·리·라", "大闕에", "몯ᄒᆞ니라",
   extra=[{"label": "원본영인 판독(글자)", "fmt": "notation", "text": "{大|·땡}{闕|·[ㄱㅝㅭ]}·에 보·내[ㅿㆍ]·[ㅸㅏ] 부텻·긔 받[ㅈㆍ]·[ㅸㆍㅭ] 고·지·라 :몯[ㅎㆍ]·리·라", "mode": "letters"}])

# ---- 방점 미판독 보충(글자만) ----
add("O-s8-WS894", "이 [ㅼㆍ]리 너희 죵가",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext("sj_ws8/P14_WS_e01_v008_0940.txt", "이 ᄯᆞ리", "죠ᇰ가"), "mode": "letters"}])
add("O-s5-WS112", "{果|광}[ㄴㆍㄴ] 여르미오",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext("sj_ws1/P14_WS_e01_v001_0180.txt", "果ᄂᆞᆫ", "여르미오"), "mode": "letters"}])
add("O-s5-DS1017", "[ㅎㆍㄴ]번 브[ㅿㅓ] 머구메 즈믄 시르미 흗[ㄴㆍ]다",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext("sj_bd10/P51_BD_e01_v010_0180.txt", "ᄒᆞᆫ번", "흗ᄂᆞ다"), "mode": "letters"},
     OD("od_280214.txt", "ᄒᆞᆫ", "흗ᄂᆞ다", "우리말샘(즈믄)")])
add("O-s5-DS114", "[ㅁㆍ][ㅿㆍ]매 온 혜아룜과 [ㅼㅗ] 즈믄 혜아료[ㅁㆍㄹ] 머겟도다",
    [{"label": "세종한글고전", "fmt": "plain", "text": dbtext("sj_bd11/P51_BD_e01_v011_0060.txt", "ᄆᆞᅀᆞ매 온", "머겟도다"), "mode": "letters"},
     OD("od_280214.txt", "ᄆᆞᅀᆞ매 온", "머겟도다", "우리말샘(즈믄)")])

out = {"note": "R2 원문 대조 쌍. notation = 리서치 문서 原文 블록(기준). 다시 만들기: build_pairs_r2.py (이 폴더 캐시에서 추출).",
       "blocks": blocks}
json.dump(out, open(os.path.join(CACHE, "pairs_r2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# 자동 변환 결과(위키문헌 -> 표기)도 출력
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    for b in blocks:
        print(b["id"], "|", b["notation"])
