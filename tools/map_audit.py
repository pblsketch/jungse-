"""맵 겹쳐 보기: 배경 위에 충돌 격자(엔진과 같은 계산)를 칠해 그림으로 낸다.

  python tools/map_audit.py [--out DIR] [--tag before] [--sprites] [s0 s1 ...]

빨강 = 막힌 칸, 연두 = 주인공 발밑 상자(18x10)가 설 수 있는 칸, 주황 = 인물 발밑으로 막힌 칸,
노랑 상자 = 살피기 지점(spots), 자홍 상자 = 인물 발밑, 파랑 테 = 인물 그림 크기(100x118),
하늘색 점 = 시작 자리, 보라 테 = 앞 그림(front, 주인공보다 앞에 다시 그리는 배경 조각).
격자는 node tools/map_grid_dump.mjs 로 엔진 코드(js/engine/path.js)를 그대로 돌려 얻는다.

--sprites 를 주면 sN-sprites.png 도 만든다: 배경 위에 인물(맵의 sprite 그림, 쉬는 자세)과 주인공(hero_1)을
'장애물 바로 뒤(북쪽)' 자리마다 세워, 엔진과 같은 순서(발 y가 작은 것부터, front 조각은 baseY 깊이)로 그린다.
주인공이 앞에 있어야 할 그림(지붕·나무·탁자) 위에 올라타 보이는 곳을 눈으로 찾는 용도.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


SPR = {}


def sprite(key):
    """아틀라스의 쉬는 자세 한 칸과 원점(발) 위치."""
    if key in SPR:
        return SPR[key]
    meta = json.load(open(os.path.join(ROOT, 'assets', 'sprites', key + '.json'), encoding='utf-8'))
    sheet = Image.open(os.path.join(ROOT, 'assets', 'sprites', key + '.png')).convert('RGBA')
    an = meta.get('anims', {})
    fr = (an.get('idle') or an.get('down') or {'frames': [0]})['frames'][0]
    fw, fh, cols = meta['frameWidth'], meta['frameHeight'], meta.get('columns', 3)
    im = sheet.crop(((fr % cols) * fw, (fr // cols) * fh, (fr % cols) * fw + fw, (fr // cols) * fh + fh))
    o = meta.get('origin', {'x': 0.5, 'y': 1})
    SPR[key] = (im, o['x'] * fw, o['y'] * fh)
    return SPR[key]


def front_pieces(bg, d):
    """front 조각: 배경에서 다각형만큼 오려 낸 그림과 깊이(baseY)."""
    out = []
    for f in d.get('fronts', []):
        m = Image.new('L', bg.size, 0)
        ImageDraw.Draw(m).polygon([(p['x'], p['y']) for p in f['pts']], fill=255)
        piece = Image.new('RGBA', bg.size, (0, 0, 0, 0))
        piece.paste(bg, (0, 0), m)
        out.append((f['baseY'], piece))
    return out


def sprite_sheet(mid, d, bg, out, tag):
    c, cols, rows = d['cell'], d['cols'], d['rows']
    items = []  # (depth, kind, payload)
    for n in d['npcs']:
        key = n.get('sprite') or n['npcId']
        if os.path.exists(os.path.join(ROOT, 'assets', 'sprites', key + '.json')):
            items.append((n['y'], 'spr', (key, n['x'], n['y'])))
    # 장애물 바로 북쪽의 걸을 수 있는 칸(남쪽 1~2칸 안에 막힌 칸), 가로 4칸마다 하나
    for r in range(rows - 2):
        for k in range(1, cols - 1, 4):
            j = r * cols + k
            if not d['mask'][j]:
                continue
            if any(d['npcBlocked'][(r + q) * cols + k] for q in (1, 2)):
                items.append(((r + 0.5) * c, 'spr', ('hero_1', (k + 0.5) * c, (r + 0.5) * c)))
    for depth, piece in front_pieces(bg, d):
        items.append((depth, 'front', piece))
    img = bg.copy()
    for depth, kind, pay in sorted(items, key=lambda t: t[0]):
        if kind == 'front':
            img = Image.alpha_composite(img, pay)
        else:
            im, ox, oy = sprite(pay[0])
            img.alpha_composite(im, (int(round(pay[1] - ox)), int(round(pay[2] - oy))))
    p = os.path.join(out, mid + tag + '-sprites.png')
    img.convert('RGB').save(p)
    print(p)


def main(argv):
    out = os.path.join(ROOT, 'tests', 'shots', 'maps-audit')
    tag = ''
    ids = []
    sprites = False
    i = 0
    while i < len(argv):
        if argv[i] == '--out': out = argv[i + 1]; i += 2; continue
        if argv[i] == '--tag': tag = '-' + argv[i + 1]; i += 2; continue
        if argv[i] == '--sprites': sprites = True; i += 1; continue
        ids.append(argv[i]); i += 1
    os.makedirs(out, exist_ok=True)
    data = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools', 'map_grid_dump.mjs')] + ids, cwd=ROOT))
    try:
        font = ImageFont.truetype('arial.ttf', 14)
    except OSError:
        font = ImageFont.load_default()
    for mid, d in data.items():
        bg = Image.open(os.path.join(ROOT, 'assets', 'bg', mid + '.webp')).convert('RGBA')
        if sprites:
            sprite_sheet(mid, d, bg, out, tag)
        ov = Image.new('RGBA', bg.size, (0, 0, 0, 0))
        dr = ImageDraw.Draw(ov)
        c, cols = d['cell'], d['cols']
        for r in range(d['rows']):
            for k in range(cols):
                j = r * cols + k
                box = [k * c, r * c, k * c + c - 1, r * c + c - 1]
                if d['blocked'][j]:
                    dr.rectangle(box, fill=(255, 0, 0, 80))
                elif d['npcBlocked'][j]:
                    dr.rectangle(box, fill=(255, 140, 0, 110))
                elif d['mask'][j]:
                    dr.rectangle(box, fill=(80, 255, 80, 34))
        for rc in d['rects']:
            dr.rectangle([rc['x'], rc['y'], rc['x'] + rc['w'], rc['y'] + rc['h']], outline=(200, 0, 0, 220), width=2)
        for pl in d['polys']:
            dr.line([(p['x'], p['y']) for p in pl] + [(pl[0]['x'], pl[0]['y'])], fill=(200, 0, 0, 220), width=2)
        for f in d.get('fronts', []):
            pts = f.get('pts') or []
            if pts:
                dr.line([(p['x'], p['y']) for p in pts] + [(pts[0]['x'], pts[0]['y'])], fill=(170, 60, 255, 255), width=3)
            if 'baseY' in f:
                dr.line([(f['x'], f['baseY']), (f['x'] + f['w'], f['baseY'])], fill=(170, 60, 255, 255), width=1)
        for s in d['spots']:
            dr.rectangle([s['x'], s['y'], s['x'] + s['w'], s['y'] + s['h']], outline=(255, 230, 0, 255), width=3)
            dr.text((s['x'] + 3, s['y'] + 2), s['contextId'], fill=(255, 255, 0, 255), font=font, stroke_width=2, stroke_fill=(0, 0, 0, 255))
        fh, nh = d['npcFeet'], 118
        for n in d['npcs']:
            x, y = n['x'], n['y']
            dr.rectangle([x - 50, y - nh, x + 50, y], outline=(60, 120, 255, 200), width=1)
            dr.rectangle([x - fh['hw'], y - fh['hh'] * 2, x + fh['hw'], y], outline=(255, 0, 255, 255), width=2)
            dr.text((x - 40, y - nh - 16), n['npcId'], fill=(120, 200, 255, 255), font=font, stroke_width=2, stroke_fill=(0, 0, 0, 255))
        sp = d['spawn']
        dr.ellipse([sp['x'] - 7, sp['y'] - 7, sp['x'] + 7, sp['y'] + 7], fill=(0, 230, 255, 255), outline=(0, 0, 0, 255))
        img = Image.alpha_composite(bg, ov).convert('RGB')
        p = os.path.join(out, mid + tag + '.png')
        img.save(p)
        print(p)


if __name__ == '__main__':
    main(sys.argv[1:])
