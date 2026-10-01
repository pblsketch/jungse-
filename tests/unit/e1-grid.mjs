// E1 충돌 격자: 사각형·다각형·타일 → 막힌 칸, 맵 밖, 발밑 상자 충돌, 걸을 수 있는 칸
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';
const P = load(['js/core/ns.js', 'js/engine/path.js']).NM.engine.path;
const at = (g, c, r) => g.blocked[r * g.cols + c];
const sum = g => [...g.blocked].reduce((a, b) => a + b, 0);

// 사각형: 넓이가 겹치는 칸만 막는다
{
  const g = P.buildGrid({ width: 160, height: 160, cell: 16, rects: [{ x: 32, y: 32, w: 32, h: 16 }] });
  assert.equal(g.cols, 10); assert.equal(g.rows, 10);
  assert.equal(at(g, 2, 2), 1); assert.equal(at(g, 3, 2), 1);
  assert.equal(at(g, 4, 2), 0, 'edge-touching cell is free'); assert.equal(at(g, 2, 3), 0); assert.equal(at(g, 1, 2), 0);
  assert.equal(sum(g), 2);
  const g2 = P.buildGrid({ width: 160, height: 160, cell: 16, rects: [{ x: 20, y: 20, w: 20, h: 4 }] });
  assert.equal(at(g2, 1, 1), 1); assert.equal(at(g2, 2, 1), 1); assert.equal(at(g2, 3, 1), 0);
  const g3 = P.buildGrid({ width: 64, height: 64, cell: 16, rects: [{ x: 10, y: 10, w: 0, h: 10 }] });
  assert.equal(sum(g3), 0, 'zero-size rect ignored');
  const g4 = P.buildGrid({ width: 64, height: 64, cell: 16, rects: [{ x: -50, y: 48, w: 500, h: 50 }] });
  assert.equal(sum(g4), 4, 'rect clipped to map');
}

// 다각형: 삼각형
{
  const tri = [{ x: 0, y: 0 }, { x: 64, y: 0 }, { x: 0, y: 64 }];
  const g = P.buildGrid({ width: 128, height: 128, cell: 16, polys: [tri] });
  assert.equal(at(g, 0, 0), 1); assert.equal(at(g, 1, 1), 1); assert.equal(at(g, 2, 0), 1);
  assert.equal(at(g, 3, 3), 0, 'outside hypotenuse'); assert.equal(at(g, 5, 5), 0);
  assert.equal(P.pointInPoly(10, 10, tri), true); assert.equal(P.pointInPoly(60, 60, tri), false);
}

// 타일 층
{
  const g = P.buildGrid({ width: 128, height: 64, cell: 16, tiles: { cols: 4, rows: 2, tw: 32, th: 32, data: [0, 1, 0, 0, 0, 0, 0, 5] } });
  assert.equal(at(g, 2, 0), 1); assert.equal(at(g, 3, 1), 1); assert.equal(at(g, 0, 0), 0);
  assert.equal(at(g, 6, 2), 1); assert.equal(at(g, 7, 3), 1); assert.equal(at(g, 5, 3), 0);
}

// 발밑 상자 충돌과 맵 밖
{
  const g = P.buildGrid({ width: 160, height: 160, cell: 16, rects: [{ x: 64, y: 64, w: 32, h: 32 }] });
  assert.equal(P.collides(g, 30, 30, 6, 4), false);
  assert.equal(P.collides(g, 60, 80, 6, 4), true, 'overlaps block');
  assert.equal(P.collides(g, 57.9, 80, 6, 4), false, 'just left of block');
  assert.equal(P.collides(g, 3, 30, 6, 4), true, 'outside map left');
  assert.equal(P.collides(g, 30, 158, 6, 4), true, 'outside map bottom');
  const m = P.walkMask(g, 6, 4);
  assert.equal(m[5 * g.cols + 5], 0); assert.equal(m[1 * g.cols + 1], 1);
  const wide = P.walkMask(g, 12, 4);
  assert.equal(wide[5 * g.cols + 3], 0, 'neighbour of block is too tight for wide box');
  assert.equal(m[5 * g.cols + 3], 1);
  P.markRect(g, { x: 16, y: 16, w: 16, h: 16 });
  assert.equal(P.collides(g, 24, 24, 2, 2), true, 'npc footprint added');
}
console.log('e1 grid ok');
