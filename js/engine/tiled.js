'use strict';
/*
 * Tiled 맵(JSON) 읽기 (순수 함수). spec §19-4.
 *   bg        그림 층(imagelayer)        → bg: { image, x, y }  (image는 맵 파일 기준 상대 경로 그대로)
 *   collision 객체 층(사각형·다각형·타원) → rects / polys,  또는 타일 층 → tiles
 *   spots     객체 층: contextId(필수), act(선택), label(선택)
 *   npcs      객체 층: npcId(필수), contextId(선택), label(선택)
 *   spawn     객체 층: 점 하나
 * 잘못된 데이터는 problems 에 모은다(부르는 쪽이 NM.reportError 로 알린다).
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  NM.engine = NM.engine || {};

  function props(o) {
    const out = {};
    const p = o && o.properties;
    if (Array.isArray(p)) p.forEach(x => { if (x && x.name) out[x.name] = x.value; });
    else if (p && typeof p === 'object') Object.assign(out, p);
    return out;
  }

  function rotate(pts, ox, oy, deg) {
    if (!deg) return pts;
    const a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
    return pts.map(p => ({ x: ox + (p.x - ox) * cs - (p.y - oy) * sn, y: oy + (p.x - ox) * sn + (p.y - oy) * cs }));
  }

  function ellipsePts(x, y, w, h) {
    const out = [], cx = x + w / 2, cy = y + h / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; out.push({ x: cx + Math.cos(a) * w / 2, y: cy + Math.sin(a) * h / 2 }); }
    return out;
  }

  // 객체 → 겉 사각형 (점은 크기 0)
  function bounds(o) {
    if (Array.isArray(o.polygon) || Array.isArray(o.polyline)) {
      const pts = (o.polygon || o.polyline).map(p => ({ x: o.x + p.x, y: o.y + p.y }));
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    if (o.gid) return { x: o.x, y: o.y - (o.height || 0), w: o.width || 0, h: o.height || 0 }; // 타일 객체는 아래 기준
    return { x: o.x || 0, y: o.y || 0, w: o.width || 0, h: o.height || 0 };
  }

  function parse(json) {
    const problems = [];
    const tw = json.tilewidth || 32, th = json.tileheight || 32;
    const map = {
      width: (json.width || 0) * tw, height: (json.height || 0) * th, tileW: tw, tileH: th,
      bg: null, rects: [], polys: [], tiles: null, spots: [], npcs: [], spawn: null, problems
    };
    if (!map.width || !map.height) problems.push('map size missing');

    const layers = [];
    (function walk(list) { (list || []).forEach(l => { if (l.type === 'group') walk(l.layers); else layers.push(l); }); })(json.layers);
    const byName = name => layers.filter(l => l.name === name);

    const bg = byName('bg')[0];
    if (bg) {
      if (bg.type === 'imagelayer' && bg.image) map.bg = { image: bg.image, x: (bg.offsetx || 0) + (bg.x || 0), y: (bg.offsety || 0) + (bg.y || 0) };
      else problems.push('bg layer must be an image layer with an image');
    }

    byName('collision').forEach(l => {
      if (l.type === 'tilelayer') {
        if (!Array.isArray(l.data)) { problems.push('collision tile layer must use csv/array encoding'); return; }
        map.tiles = { cols: l.width || json.width, rows: l.height || json.height, tw, th, data: l.data };
      } else if (l.type === 'objectgroup') {
        (l.objects || []).forEach(o => {
          if (o.point || o.polyline) return;
          if (Array.isArray(o.polygon)) {
            map.polys.push(rotate(o.polygon.map(p => ({ x: o.x + p.x, y: o.y + p.y })), o.x, o.y, o.rotation));
          } else if (o.ellipse) {
            map.polys.push(rotate(ellipsePts(o.x, o.y, o.width, o.height), o.x, o.y, o.rotation));
          } else if (o.width > 0 && o.height > 0) {
            if (o.rotation) map.polys.push(rotate([{ x: o.x, y: o.y }, { x: o.x + o.width, y: o.y }, { x: o.x + o.width, y: o.y + o.height }, { x: o.x, y: o.y + o.height }], o.x, o.y, o.rotation));
            else map.rects.push({ x: o.x, y: o.y, w: o.width, h: o.height });
          }
        });
      }
    });

    byName('spots').forEach(l => (l.objects || []).forEach(o => {
      const p = props(o);
      if (!p.contextId) { problems.push('spot ' + (o.id != null ? o.id : '?') + ' has no contextId'); return; }
      const b = bounds(o);
      map.spots.push({ kind: 'spot', contextId: String(p.contextId), act: p.act ? String(p.act) : null, label: p.label || o.name || null, x: b.x, y: b.y, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: b.y + b.h / 2 });
    }));

    byName('npcs').forEach(l => (l.objects || []).forEach(o => {
      const p = props(o);
      if (!p.npcId) { problems.push('npc ' + (o.id != null ? o.id : '?') + ' has no npcId'); return; }
      const b = bounds(o);
      // 인물의 발 자리: 점이면 그 점, 사각형이면 아래 가운데
      map.npcs.push({ kind: 'npc', npcId: String(p.npcId), contextId: p.contextId ? String(p.contextId) : null, act: p.act ? String(p.act) : null, label: p.label || o.name || null, sprite: p.sprite || null, x: b.x + b.w / 2, y: b.y + b.h });
    }));

    const sp = byName('spawn')[0];
    const so = sp && (sp.objects || [])[0];
    if (so) { const b = bounds(so); map.spawn = { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }
    else { problems.push('spawn point missing'); map.spawn = { x: map.width / 2, y: map.height / 2 }; }
    if (sp && (sp.objects || []).length > 1) problems.push('spawn layer has more than one object');

    return map;
  }

  NM.engine.tiled = { parse, props };
})(typeof window !== 'undefined' ? window : globalThis);
