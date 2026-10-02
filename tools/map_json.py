"""장면 맵(maps/sN.json) 읽기·쓰기. 이 저장소의 맵 파일 모양(위 칸은 줄마다, 층은 한 줄, 객체는 한 줄씩)을 그대로 지킨다.

  from map_json import load, save, layer, new_object
  m = load('s2'); ...; save('s2', m)

python tools/map_json.py --check  → 모든 맵을 읽어 다시 썼을 때 글자 하나 다르지 않은지 확인(형식 지킴 점검).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYER_ORDER = ['bg', 'collision', 'front', 'spots', 'npcs', 'spawn']


def path(mid):
    return os.path.join(ROOT, 'maps', mid + '.json')


def load(mid):
    with open(path(mid), encoding='utf-8') as f:
        return json.load(f)


def _j(v):
    return json.dumps(v, ensure_ascii=False)


def dumps(m):
    out = ['{']
    keys = [k for k in m if k != 'layers']
    for k in keys:
        out.append('  %s: %s,' % (_j(k), _j(m[k])))
    out.append('  "layers": [')
    ls = []
    for l in m['layers']:
        if 'objects' in l:
            head = {k: v for k, v in l.items() if k != 'objects'}
            h = _j(head)[:-1] + ', "objects": ['
            objs = ',\n'.join('        ' + _j(o) for o in l['objects'])
            ls.append('    ' + h + ('\n' + objs + '\n      ]}' if objs else ']}'))
        else:
            ls.append('    ' + _j(l))
    out.append(',\n'.join(ls))
    out.append('  ]')
    out.append('}')
    return '\n'.join(out) + '\n'


def save(mid, m):
    with open(path(mid), 'w', encoding='utf-8', newline='\n') as f:
        f.write(dumps(m))


def layer(m, name):
    for l in m['layers']:
        if l['name'] == name:
            return l
    return None


def ensure_layer(m, name):
    """객체 층이 없으면 LAYER_ORDER 자리에 만든다."""
    l = layer(m, name)
    if l:
        return l
    l = {'id': m['nextlayerid'], 'name': name, 'type': 'objectgroup', 'draworder': 'topdown', 'x': 0, 'y': 0,
         'opacity': 1, 'visible': True, 'objects': []}
    m['nextlayerid'] += 1
    order = {n: i for i, n in enumerate(LAYER_ORDER)}
    pos = len(m['layers'])
    for i, x in enumerate(m['layers']):
        if order.get(x['name'], 99) > order[name]:
            pos = i
            break
    m['layers'].insert(pos, l)
    return l


def new_object(m, name, **kw):
    o = {'id': m['nextobjectid'], 'name': name, 'type': ''}
    m['nextobjectid'] += 1
    o.update(kw)
    o.setdefault('rotation', 0)
    o.setdefault('visible', True)
    return o


def find(m, layer_name, name):
    for o in layer(m, layer_name)['objects']:
        if o.get('name') == name:
            return o
    raise KeyError('%s/%s' % (layer_name, name))


if __name__ == '__main__' and '--check' in sys.argv:
    bad = 0
    for f in sorted(os.listdir(os.path.join(ROOT, 'maps'))):
        if not f.endswith('.json'):
            continue
        t = open(os.path.join(ROOT, 'maps', f), encoding='utf-8').read()
        if dumps(json.loads(t)) != t:
            bad += 1
            print('format differs:', f)
    print('map_json: %s' % ('ok' if not bad else '%d differ' % bad))
    sys.exit(1 if bad else 0)
