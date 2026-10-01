// E1 Tiled 맵 읽기: maps/test.json 계약(spec §19-4)과 잘못된 데이터 알림
// vm 컨텍스트의 객체는 프로토타입이 달라 JSON 으로 평평하게 바꿔 비교한다
const flat = x => JSON.parse(JSON.stringify(x));
const eq = (a, b, m) => assert.deepEqual(flat(a), flat(b), m);
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';
const NM = load(['js/core/ns.js', 'js/engine/path.js', 'js/engine/tiled.js']).NM;
const T = NM.engine.tiled, P = NM.engine.path;

const json = JSON.parse(readFileSync(join(ROOT, 'maps/test.json'), 'utf8'));
const m = T.parse(json);
eq([...m.problems], []);
assert.equal(m.width, 1536); assert.equal(m.height, 960);
assert.equal(m.bg.image, '../assets/bg/test.webp');
eq(m.spots.map(s => s.contextId), ['test.c1', 'test.c2', 'test.c3']);
assert.equal(m.spots[1].act, 'act.read'); assert.equal(m.spots[0].act, null);
assert.equal(m.npcs.length, 1); assert.equal(m.npcs[0].npcId, 'test.elder'); assert.equal(m.npcs[0].contextId, null);
assert.equal(m.npcs[0].x, 760); assert.equal(m.npcs[0].y, 600);
assert.equal(m.spawn.x, 300); assert.equal(m.spawn.y, 480);
assert.equal(m.rects.length, 4); assert.equal(m.polys.length, 1); assert.equal(m.polys[0].length, 5);

// 격자로 만들면: 벽은 막히고, 시작 자리는 걸을 수 있고, 벽 너머로 길이 있다
const g = P.buildGrid({ width: m.width, height: m.height, cell: 16, rects: m.rects, polys: m.polys });
const mask = P.walkMask(g, 9, 5);
assert.equal(P.collides(g, 920, 300, 9, 5), true, 'wall');
assert.equal(P.collides(g, 1250, 680, 9, 5), true, 'pond polygon');
assert.equal(P.collides(g, m.spawn.x, m.spawn.y, 9, 5), false, 'spawn free');
const a = P.cellOf(g, 860, 500), b = P.cellOf(g, 980, 500);
const path = P.findPath(g, mask, a.c, a.r, b.c, b.r);
assert.ok(path && path.some(p => p.r * 16 > 700), 'goes around the wall');
const st = P.cellOf(g, m.spawn.x, m.spawn.y);
for (const s of m.spots) {
  const near = P.cellOf(g, s.cx, s.y + s.h + 12);
  const c = P.nearestOpen(g, mask, near.c, near.r);
  assert.ok(P.findPath(g, mask, st.c, st.r, c.c, c.r), 'reachable ' + s.contextId);
}

// 잘못된 데이터는 problems 로 모인다
const bad = T.parse({ width: 10, height: 10, tilewidth: 32, tileheight: 32, layers: [
  { name: 'bg', type: 'objectgroup', objects: [] },
  { name: 'collision', type: 'tilelayer', width: 10, height: 10, data: 'AAAA', encoding: 'base64' },
  { name: 'spots', type: 'objectgroup', objects: [{ id: 3, x: 1, y: 1, width: 4, height: 4, properties: [{ name: 'act', value: 'x' }] }] },
  { name: 'npcs', type: 'objectgroup', objects: [{ id: 4, x: 1, y: 1, point: true }] }
] });
assert.equal(bad.spots.length, 0); assert.equal(bad.npcs.length, 0);
assert.equal(bad.problems.length, 5, bad.problems.join(' | '));
assert.equal(bad.spawn.x, 160); assert.equal(bad.spawn.y, 160);

// 타일 층 충돌(그룹 안), 옛 객체 속성 형식, 점 조사 지점
const t2 = T.parse({ width: 4, height: 2, tilewidth: 32, tileheight: 32, layers: [
  { name: 'g', type: 'group', layers: [{ name: 'collision', type: 'tilelayer', width: 4, height: 2, data: [0, 1, 0, 0, 0, 0, 0, 0] }] },
  { name: 'spots', type: 'objectgroup', objects: [{ id: 1, x: 10, y: 10, point: true, properties: { contextId: 'x.c1' } }] },
  { name: 'spawn', type: 'objectgroup', objects: [{ id: 2, x: 5, y: 6, point: true }] }
] });
eq([...t2.problems], []);
assert.equal(t2.tiles.data[1], 1); assert.equal(t2.spots[0].contextId, 'x.c1'); assert.equal(t2.spots[0].w, 0);

// 회전 사각형·타원은 다각형으로
const t3 = T.parse({ width: 4, height: 4, tilewidth: 32, tileheight: 32, layers: [
  { name: 'collision', type: 'objectgroup', objects: [{ id: 1, x: 32, y: 32, width: 32, height: 10, rotation: 90 }, { id: 2, x: 0, y: 0, width: 20, height: 20, ellipse: true }] },
  { name: 'spawn', type: 'objectgroup', objects: [{ id: 3, x: 5, y: 6, point: true }] }
] });
assert.equal(t3.polys.length, 2); assert.equal(t3.rects.length, 0);
assert.ok(Math.abs(t3.polys[0][1].x - 32) < 1e-9 && Math.abs(t3.polys[0][1].y - 64) < 1e-9, 'rotated clockwise around top-left');
console.log('e1 tiled ok');
