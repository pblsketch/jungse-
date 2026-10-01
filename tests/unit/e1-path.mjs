// E1 길찾기: 빈 격자, 벽 돌아가기, 길 없음, 막힌 목적지, 모서리 금지, 경로 단순화
// vm 컨텍스트의 객체는 프로토타입이 달라 JSON 으로 평평하게 바꿔 비교한다
const flat = x => JSON.parse(JSON.stringify(x));
const eq = (a, b, m) => assert.deepEqual(flat(a), flat(b), m);
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';
const P = load(['js/core/ns.js', 'js/engine/path.js']).NM.engine.path;

const HW = 6, HH = 4;
function grid(w, h, rects = [], polys = []) { return P.buildGrid({ width: w, height: h, cell: 16, rects, polys }); }
function plen(path) { let s = 0; for (let i = 1; i < path.length; i++) s += Math.hypot(path[i].c - path[i - 1].c, path[i].r - path[i - 1].r); return s; }
function validSteps(g, mask, path) {
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    assert.equal(mask[p.r * g.cols + p.c], 1, `cell ${p.c},${p.r} walkable`);
    if (i) {
      const q = path[i - 1], dc = p.c - q.c, dr = p.r - q.r;
      assert.ok(Math.abs(dc) <= 1 && Math.abs(dr) <= 1 && (dc || dr), 'adjacent step');
      if (dc && dr) {
        assert.equal(mask[q.r * g.cols + q.c + dc], 1, 'no corner cut (x)');
        assert.equal(mask[(q.r + dr) * g.cols + q.c], 1, 'no corner cut (y)');
      }
    }
  }
}

// 1) 빈 격자: 직선 최단
{
  const g = grid(320, 160), m = P.walkMask(g, HW, HH);
  const path = P.findPath(g, m, 1, 5, 15, 5);
  assert.ok(path); eq(path[0], { c: 1, r: 5 }); eq(path.at(-1), { c: 15, r: 5 });
  assert.equal(path.length, 15);
  validSteps(g, m, path);
  eq(P.findPath(g, m, 3, 3, 3, 3), [{ c: 3, r: 3 }]);
}

// 2) 벽 돌아가기: x=160~176 세로 벽, 아래쪽만 열림
{
  const g = grid(320, 320, [{ x: 160, y: 0, w: 16, h: 240 }]), m = P.walkMask(g, HW, HH);
  const path = P.findPath(g, m, 5, 5, 15, 5);
  assert.ok(path, 'path exists around wall');
  validSteps(g, m, path);
  assert.ok(path.some(p => p.r >= 15), 'goes below the wall');
  assert.ok(path.every(p => p.c !== 10 || p.r >= 15), 'never crosses wall cells');
  assert.ok(plen(path) > 10, 'longer than straight line');
  const pts = path.map(p => P.cellCenter(g, p.c, p.r));
  const s = P.simplify(g, pts, HW, HH);
  assert.ok(s.length >= 3 && s.length < pts.length);
  eq(s[0], pts[0]); eq(s.at(-1), pts.at(-1));
  for (let i = 1; i < s.length; i++) assert.ok(P.lineClear(g, s[i - 1].x, s[i - 1].y, s[i].x, s[i].y, HW, HH));
  assert.equal(P.lineClear(g, pts[0].x, pts[0].y, pts.at(-1).x, pts.at(-1).y, HW, HH), false, 'straight line blocked');
}

// 3) 길 없음: 목적지가 닫힌 방 안
{
  const g = grid(320, 320, [
    { x: 160, y: 160, w: 96, h: 16 }, { x: 160, y: 240, w: 96, h: 16 },
    { x: 160, y: 160, w: 16, h: 96 }, { x: 240, y: 160, w: 16, h: 96 }
  ]);
  const m = P.walkMask(g, HW, HH);
  assert.equal(m[12 * g.cols + 12], 1, 'room inside is walkable');
  assert.equal(P.findPath(g, m, 2, 2, 12, 12), null, 'no path into closed room');
}

// 4) 막힌 목적지는 null, nearestOpen 으로 대신 고른다
{
  const g = grid(320, 320, [{ x: 96, y: 96, w: 64, h: 64 }]), m = P.walkMask(g, HW, HH);
  assert.equal(P.findPath(g, m, 1, 1, 7, 7), null);
  const n = P.nearestOpen(g, m, 7, 7);
  assert.ok(n); assert.equal(m[n.r * g.cols + n.c], 1);
  assert.ok(Math.max(Math.abs(n.c - 7), Math.abs(n.r - 7)) <= 3);
  assert.ok(P.findPath(g, m, 1, 1, n.c, n.r));
  eq(P.nearestOpen(g, m, 1, 1), { c: 1, r: 1 });
  const full = grid(64, 64, [{ x: 0, y: 0, w: 64, h: 64 }]), fm = P.walkMask(full, HW, HH);
  assert.equal(P.nearestOpen(full, fm, 1, 1), null);
}

// 5) 모서리 가로지르기 금지: 대각으로만 이어진 두 칸
{
  const g = grid(64, 64), m = new Uint8Array(g.cols * g.rows);
  m[0] = 1; m[1 * g.cols + 1] = 1;
  assert.equal(P.findPath(g, m, 0, 0, 1, 1), null);
  m[1] = 1;
  eq(P.findPath(g, m, 0, 0, 1, 1), [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }]);
}

// 6) 큰 격자에서도 빠르다
{
  const rects = []; for (let i = 0; i < 20; i++) rects.push({ x: 100 + i * 70, y: (i % 2) ? 0 : 200, w: 20, h: 800 });
  const g = grid(1600, 1000, rects), m = P.walkMask(g, HW, HH);
  const t = Date.now();
  const path = P.findPath(g, m, 1, 30, 98, 30);
  assert.ok(path, 'zigzag path'); validSteps(g, m, path);
  assert.ok(Date.now() - t < 500, 'fast enough');
}
console.log('e1 path ok');
