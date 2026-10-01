'use strict';
/*
 * 충돌 격자와 길찾기 (순수 함수, 브라우저·Node 공용).
 * - buildGrid: 맵 크기 + 충돌 도형(사각형·다각형·타일) → 칸마다 막힘(1)/열림(0)
 * - collides: 발밑 상자(x, y 중심, 반너비 hw, 반높이 hh)가 막힌 칸이나 맵 밖에 닿는가
 * - walkMask: 칸 가운데에 발밑 상자를 놓아도 닿지 않는 칸 = 걸을 수 있는 칸
 * - findPath: A*(8방향, 모서리 가로지르기 금지). 길이 없으면 null
 * - nearestOpen: 막힌 목적지 대신 가장 가까운 걸을 수 있는 칸
 * - simplify: 시야가 트인 중간 점을 덜어 낸 경로
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  NM.engine = NM.engine || {};

  function buildGrid(spec) {
    const cell = spec.cell || 16;
    const width = spec.width, height = spec.height;
    const cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
    const grid = { cols, rows, cell, width, height, blocked: new Uint8Array(cols * rows) };
    (spec.rects || []).forEach(r => markRect(grid, r));
    (spec.polys || []).forEach(p => markPoly(grid, p));
    if (spec.tiles) markTiles(grid, spec.tiles);
    return grid;
  }

  // 사각형과 넓이가 겹치는 칸을 막는다(변이 맞닿기만 한 칸은 막지 않음).
  function markRect(grid, r) {
    const c = grid.cell;
    if (!(r.w > 0 && r.h > 0)) return;
    const c0 = Math.max(0, Math.floor(r.x / c)), c1 = Math.min(grid.cols - 1, Math.ceil((r.x + r.w) / c) - 1);
    const r0 = Math.max(0, Math.floor(r.y / c)), r1 = Math.min(grid.rows - 1, Math.ceil((r.y + r.h) / c) - 1);
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) grid.blocked[y * grid.cols + x] = 1;
  }

  function pointInPoly(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  // 다각형: 칸 안의 3×3 표본점 중 하나라도 안에 있거나, 꼭짓점이 칸 안에 있으면 막는다.
  function markPoly(grid, pts) {
    if (!pts || pts.length < 3) return;
    const c = grid.cell;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    const c0 = Math.max(0, Math.floor(minX / c)), c1 = Math.min(grid.cols - 1, Math.floor(maxX / c));
    const r0 = Math.max(0, Math.floor(minY / c)), r1 = Math.min(grid.rows - 1, Math.floor(maxY / c));
    const s = [0.15, 0.5, 0.85];
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
      let hit = false;
      for (let i = 0; i < 3 && !hit; i++) for (let k = 0; k < 3 && !hit; k++) {
        if (pointInPoly((x + s[k]) * c, (y + s[i]) * c, pts)) hit = true;
      }
      if (!hit) hit = pts.some(p => p.x > x * c && p.x < (x + 1) * c && p.y > y * c && p.y < (y + 1) * c);
      if (hit) grid.blocked[y * grid.cols + x] = 1;
    }
  }

  // 타일 층: 0이 아닌 타일 자리를 막는다.
  function markTiles(grid, t) {
    for (let i = 0; i < t.data.length; i++) {
      if (!t.data[i]) continue;
      const tx = i % t.cols, ty = Math.floor(i / t.cols);
      markRect(grid, { x: tx * t.tw, y: ty * t.th, w: t.tw, h: t.th });
    }
  }

  function isBlockedCell(grid, cx, cy) {
    if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) return true;
    return grid.blocked[cy * grid.cols + cx] === 1;
  }

  function collides(grid, x, y, hw, hh) {
    const l = x - hw, r = x + hw, t = y - hh, b = y + hh;
    if (l < 0 || t < 0 || r > grid.width || b > grid.height) return true;
    const c = grid.cell, eps = 1e-6;
    const c0 = Math.floor(l / c), c1 = Math.floor((r - eps) / c);
    const r0 = Math.floor(t / c), r1 = Math.floor((b - eps) / c);
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) if (isBlockedCell(grid, cx, cy)) return true;
    return false;
  }

  function cellCenter(grid, cx, cy) { return { x: (cx + 0.5) * grid.cell, y: (cy + 0.5) * grid.cell }; }
  function cellOf(grid, x, y) {
    return { c: Math.min(grid.cols - 1, Math.max(0, Math.floor(x / grid.cell))), r: Math.min(grid.rows - 1, Math.max(0, Math.floor(y / grid.cell))) };
  }

  function walkMask(grid, hw, hh) {
    const m = new Uint8Array(grid.cols * grid.rows);
    for (let cy = 0; cy < grid.rows; cy++) for (let cx = 0; cx < grid.cols; cx++) {
      const p = cellCenter(grid, cx, cy);
      if (!collides(grid, p.x, p.y, hw, hh)) m[cy * grid.cols + cx] = 1;
    }
    return m;
  }

  function open(grid, mask, cx, cy) {
    return cx >= 0 && cy >= 0 && cx < grid.cols && cy < grid.rows && mask[cy * grid.cols + cx] === 1;
  }

  // 이진 힙
  function Heap() { this.a = []; }
  Heap.prototype.push = function (n) {
    const a = this.a; a.push(n); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  };
  Heap.prototype.pop = function () {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  };

  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

  function findPath(grid, mask, sc, sr, gc, gr) {
    if (!open(grid, mask, gc, gr)) return null;
    if (sc === gc && sr === gr) return [{ c: sc, r: sr }];
    const cols = grid.cols, n = cols * grid.rows;
    const g = new Float64Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
    const h = (c, r) => { const dx = Math.abs(c - gc), dy = Math.abs(r - gr); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
    const s = sr * cols + sc, goal = gr * cols + gc;
    g[s] = 0;
    const heap = new Heap(); heap.push({ i: s, f: h(sc, sr) });
    while (heap.a.length) {
      const { i } = heap.pop();
      if (closed[i]) continue;
      if (i === goal) break;
      closed[i] = 1;
      const c = i % cols, r = (i - c) / cols;
      for (const [dx, dy, cost] of DIRS) {
        const nc = c + dx, nr = r + dy;
        if (!open(grid, mask, nc, nr)) continue;
        if (dx && dy && (!open(grid, mask, c + dx, r) || !open(grid, mask, c, r + dy))) continue; // 모서리 금지
        const j = nr * cols + nc;
        if (closed[j]) continue;
        const ng = g[i] + cost;
        if (ng < g[j]) { g[j] = ng; from[j] = i; heap.push({ i: j, f: ng + h(nc, nr) }); }
      }
    }
    if (from[goal] === -1) return null;
    const out = [];
    for (let i = goal; i !== -1; i = from[i]) out.push({ c: i % cols, r: Math.floor(i / cols) });
    return out.reverse();
  }

  // 링 단위로 넓혀 가며 가장 가까운(유클리드) 열린 칸을 찾는다.
  function nearestOpen(grid, mask, cx, cy, maxR) {
    if (open(grid, mask, cx, cy)) return { c: cx, r: cy };
    const lim = maxR == null ? Math.max(grid.cols, grid.rows) : maxR;
    for (let rad = 1; rad <= lim; rad++) {
      let best = null, bd = Infinity;
      for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== rad) continue;
        if (!open(grid, mask, x, y)) continue;
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d < bd) { bd = d; best = { c: x, r: y }; }
      }
      if (best) return best;
    }
    return null;
  }

  // 두 점 사이를 발밑 상자가 지나갈 수 있는가(작은 간격으로 표본 검사).
  function lineClear(grid, x0, y0, x1, y1, hw, hh, step) {
    const len = Math.hypot(x1 - x0, y1 - y0), st = step || 4;
    const n = Math.max(1, Math.ceil(len / st));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (collides(grid, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, hw, hh)) return false;
    }
    return true;
  }

  function simplify(grid, pts, hw, hh) {
    if (pts.length <= 2) return pts.slice();
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !lineClear(grid, pts[i].x, pts[i].y, pts[j].x, pts[j].y, hw, hh)) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }

  NM.engine.path = { buildGrid, markRect, markPoly, markTiles, pointInPoly, collides, walkMask, findPath, nearestOpen, lineClear, simplify, cellCenter, cellOf, isBlockedCell };
})(typeof window !== 'undefined' ? window : globalThis);
