"""tests/shots/maps-audit/browser/<A>/ 와 <B>/ 의 같은 이름 사진을 나란히 붙인 한 장(맵별)으로 만든다.
  python tools/map_shots_sheet.py before after   → tests/shots/maps-audit/browser/sheet-<맵>.png
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'tests', 'shots', 'maps-audit', 'browser')
a, b = sys.argv[1], sys.argv[2]
font = ImageFont.truetype('arial.ttf', 14)
names = sorted(f for f in os.listdir(os.path.join(B, b)) if f.endswith('.png'))
groups = {}
for n in names:
    groups.setdefault(n.split('-')[0], []).append(n)
for mid, ns in groups.items():
    rows = []
    for n in ns:
        ims = []
        for t in (a, b):
            p = os.path.join(B, t, n)
            ims.append(Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (340, 300), 'gray'))
        w = sum(i.width for i in ims) + 10
        h = max(i.height for i in ims) + 20
        row = Image.new('RGB', (w, h), 'white')
        d = ImageDraw.Draw(row)
        d.text((4, 2), n[:-4] + '   (' + a + ' | ' + b + ')', fill='black', font=font)
        x = 0
        for i in ims:
            row.paste(i, (x, 20)); x += i.width + 10
        rows.append(row)
    W = max(r.width for r in rows); H = sum(r.height for r in rows)
    sheet = Image.new('RGB', (W, H), 'white')
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    p = os.path.join(B, 'sheet-' + mid + '.png')
    sheet.save(p)
    print(p)
