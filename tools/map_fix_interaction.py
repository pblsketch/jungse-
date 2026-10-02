"""인물·배경 어울림 점검(2026-10)에서 고친 맵 내용. 여러 번 돌려도 같은 결과(이름으로 찾아 고치거나 만든다).

  python tools/map_fix_interaction.py         → maps/s*.json 고침
  python tools/map_audit.py --sprites         → tests/shots/maps-audit/ 에 겹쳐 보기 그림 다시 만들기

고친 것
- front(앞 그림) 층: 주인공이 뒤로 걸어갈 수 있는 나무 우듬지·문 지붕·탑. 엔진(js/engine/world.js '앞 그림')이
  이 모양만큼 배경을 오려 baseY 깊이로 다시 그린다.
- collision: 그림에는 있는데 막히지 않았던 물건(울타리·가로등·쓰레기통·입간판·문짝), 뒤에 서면 발이
  물건 머리에 올라타던 석등.
- npcs: 그림 속 물건(깃대·덤불·울타리·나뭇가지) 위에 서 있던 인물을 바로 옆 맨땅으로.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import map_json as M


def set_obj(m, layer_name, name, **kw):
    l = M.ensure_layer(m, layer_name)
    for o in l['objects']:
        if o.get('name') == name:
            o.update(kw)
            return o
    o = M.new_object(m, name, **kw)
    l['objects'].append(o)
    return o


def drop(m, layer_name, name):
    l = M.layer(m, layer_name)
    if l:
        l['objects'] = [o for o in l['objects'] if o.get('name') != name]


def rect(m, name, x, y, w, h):
    return set_obj(m, 'collision', name, x=x, y=y, width=w, height=h)


def front(m, name, pts, base_y):
    x0, y0 = pts[0]
    poly = [{'x': x - x0, 'y': y - y0} for x, y in pts]
    o = set_obj(m, 'front', name, x=x0, y=y0, polygon=poly,
                properties=[{'name': 'baseY', 'type': 'float', 'value': base_y}])
    return o


def npc(m, name, x, y):
    o = M.find(m, 'npcs', name)
    o['x'], o['y'] = x, y


FIX = {}


def fix(mid):
    def deco(fn):
        FIX[mid] = fn
        return fn
    return deco


@fix('s1')
def _s1(m):
    npc(m, 'child', 705, 512)     # 깃대 가로대 위 → 깃대 오른쪽 맨땅
    npc(m, 'woman', 915, 442)     # 덤불 위 → 옹기 앞 마당


@fix('s2')
def _s2(m):
    front(m, 'pine-left-canopy', [(0, 340), (30, 336), (70, 330), (115, 334), (140, 350), (150, 378), (185, 380),
                                  (220, 388), (238, 405), (245, 432), (262, 445), (268, 470), (255, 488), (272, 500),
                                  (280, 520), (272, 540), (245, 550), (215, 548), (195, 562), (150, 562), (115, 565),
                                  (112, 600), (45, 600), (40, 565), (0, 565)], 600)
    front(m, 'pine-right-canopy', [(985, 345), (1030, 333), (1080, 332), (1110, 340), (1152, 330), (1152, 555),
                                   (1100, 560), (1092, 600), (1040, 600), (1050, 540), (1010, 520), (960, 515),
                                   (940, 528), (905, 525), (878, 512), (868, 492), (885, 475), (920, 470), (925, 440),
                                   (945, 410), (970, 395), (990, 385), (988, 365)], 600)
    npc(m, 'child', 840, 462)     # 오른쪽 소나무 가지 속 → 소나무 곁
    npc(m, 'woman', 815, 592)     # 아이와 겹치지 않게 조금 아래
    npc(m, 'farmer', 330, 470)    # 왼쪽 소나무 가지 끝·아래 사람과 겹침 → 조금 오른쪽 위


@fix('s6')
def _s6(m):
    front(m, 'seodang-gate-roof', [(1395, 385), (1405, 360), (1420, 350), (1445, 354), (1480, 361), (1520, 369),
                                   (1546, 382), (1548, 400), (1516, 404), (1516, 492), (1498, 492), (1498, 402),
                                   (1428, 400), (1428, 492), (1404, 492), (1404, 404), (1395, 400)], 492)


@fix('s7')
def _s7(m):
    rect(m, 'gate-door-leaf', 176, 500, 60, 92)          # 궁 문 오른쪽 열린 문짝: 걸어 들어가지 않게
    rect(m, 'fence-bridge-end', 1160, 330, 95, 150)      # 다리 끝 나무 울타리(뒤 덤불 틈까지: 갇힌 빈칸 없게)
    front(m, 'palace-gate-roof', [(100, 440), (105, 410), (112, 382), (135, 392), (175, 395), (237, 405),
                                  (242, 440), (240, 500), (238, 596), (176, 596), (176, 502), (128, 500),
                                  (128, 610), (100, 610)], 600)
    front(m, 'pagoda-tower', [(1340, 200), (1360, 200), (1368, 225), (1378, 248), (1386, 275), (1392, 295),
                              (1398, 312), (1396, 335), (1398, 400), (1300, 400), (1300, 335), (1298, 312),
                              (1312, 292), (1320, 270), (1328, 248), (1334, 225)], 420)
    npc(m, 'scholar', 1275, 482)  # 울타리 위 → 울타리 끝 오른쪽 풀밭


@fix('s8')
def _s8(m):
    o = M.find(m, 'collision', 'stone-lantern')
    o['y'], o['height'] = 315, 125                       # 석등 지붕까지: 뒤에 서면 발이 지붕에 올라타던 것
    front(m, 'pine-left-canopy', [(55, 600), (60, 560), (100, 540), (150, 525), (195, 512), (230, 503), (262, 512),
                                  (290, 535), (305, 565), (318, 595), (340, 612), (362, 628), (372, 650), (368, 675),
                                  (345, 688), (318, 676), (295, 660), (265, 650), (235, 640), (200, 638), (180, 660),
                                  (175, 700), (150, 705), (140, 670), (115, 648), (80, 632)], 700)
    npc(m, 'child', 255, 478)     # 소나무 가지 위 → 탑 왼쪽 마당


@fix('s10')
def _s10(m):
    front(m, 'persimmon-canopy', [(930, 170), (950, 140), (985, 110), (1010, 95), (1050, 85), (1100, 80),
                                  (1152, 80), (1152, 470), (1120, 470), (1085, 465), (1060, 450), (1060, 420),
                                  (1040, 400), (1010, 402), (985, 398), (960, 395), (940, 385), (935, 360),
                                  (945, 335), (925, 320), (905, 300), (900, 270), (905, 240), (915, 210)], 465)


@fix('s11')
def _s11(m):
    rect(m, 'street-lamp-1', 1258, 372, 20, 20)
    rect(m, 'bins', 1288, 335, 58, 37)
    rect(m, 'sign-board', 1528, 340, 40, 32)
    rect(m, 'street-lamps-2-3', 1580, 315, 58, 53)        # 가로등 둘과 그 뒤 가게 벽까지(갇힌 빈칸 없게)
    drop(m, 'collision', 'street-lamp-2')
    drop(m, 'collision', 'street-lamp-3')


def main(ids):
    for mid in ids or sorted(FIX, key=lambda s: int(s[1:])):
        m = M.load(mid)
        FIX[mid](m)
        M.save(mid, m)
        print('fixed', mid)


if __name__ == '__main__':
    main(sys.argv[1:])
