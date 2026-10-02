// 맵 격자 내보내기: 엔진과 같은 코드(js/engine/path.js·tiled.js)로 maps/sN.json 의 충돌 격자를 계산해 JSON 으로 낸다.
// tools/map_audit.py 가 이 결과로 겹쳐 보기 그림을 만든다.
// 사용: node tools/map_grid_dump.mjs [s0 s1 ...]  → 표준 출력에 { sN: { width, height, cell, cols, rows, blocked, mask, spots, npcs, spawn, fronts } }
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../tests/lib/load.mjs';

const NM = load(['js/core/ns.js', 'js/engine/core.js', 'js/engine/path.js', 'js/engine/tiled.js']).NM;
const T = NM.engine.tiled, P = NM.engine.path, cfg = NM.engine.config;
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(join(ROOT, 'maps')).filter(f => /^s\d+\.json$/.test(f)).map(f => f.slice(0, -5));
const out = {};
for (const id of ids) {
  const m = T.parse(JSON.parse(readFileSync(join(ROOT, 'maps', id + '.json'), 'utf8')));
  const g = P.buildGrid({ width: m.width, height: m.height, cell: cfg.cell, rects: m.rects, polys: m.polys, tiles: m.tiles });
  const base = Array.from(g.blocked);
  m.npcs.forEach(n => P.markRect(g, { x: n.x - cfg.npcFeet.hw, y: n.y - cfg.npcFeet.hh * 2, w: cfg.npcFeet.hw * 2, h: cfg.npcFeet.hh * 2 }));
  const mask = P.walkMask(g, cfg.feet.hw, cfg.feet.hh);
  out[id] = {
    width: m.width, height: m.height, cell: g.cell, cols: g.cols, rows: g.rows,
    blocked: base, npcBlocked: Array.from(g.blocked), mask: Array.from(mask),
    rects: m.rects, polys: m.polys, spots: m.spots, npcs: m.npcs, spawn: m.spawn, fronts: m.fronts || [],
    feet: cfg.feet, npcFeet: cfg.npcFeet, reach: cfg.reach
  };
}
process.stdout.write(JSON.stringify(out));
