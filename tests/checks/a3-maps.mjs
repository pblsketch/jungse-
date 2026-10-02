// A3 장면 맵 점검: maps/s*.json 마다
//  - 층(bg 그림 층, collision·spots·npcs·spawn 객체 층)과 종류
//  - 배경 webp 파일이 있고, 그 픽셀 크기가 맵 크기(칸 수 × 32)와 같다
//  - 시작 자리에 발밑 상자를 놓아도 막히지 않는다
//  - 엔진의 격자(path.js, 칸 16px, NM.engine.config.feet)에서 걸을 수 있는 칸이 모두 시작 자리와 이어져 있다
//    (갇힌 빈 곳이 있으면 실패. 일부러 못 가게 할 곳은 collision 으로 막는다)
//  - front 층(있으면): 조각이 맵 안에 있고, baseY 가 조각의 위 끝보다 아래·맵 안이며, 조각 뒤(발 y < baseY)에
//    주인공이 설 수 있는 칸이 있다(없으면 그 조각은 쓸모없다)
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const NM = load(['js/core/ns.js', 'js/engine/core.js', 'js/engine/path.js', 'js/engine/tiled.js']).NM;
const T = NM.engine.tiled, P = NM.engine.path, cfg = NM.engine.config;
const feet = cfg.feet;

// WebP 머리에서 가로·세로를 읽는다(VP8 / VP8L / VP8X)
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF', 'not RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP', 'not WEBP');
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (fourcc === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  throw new Error('unknown webp chunk ' + fourcc);
}

const mapDir = join(ROOT, 'maps');
const files = readdirSync(mapDir).filter(f => /^s\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const expected = Array.from({ length: 13 }, (_, i) => `s${i}.json`);
assert.deepEqual(files, expected, 'maps/s0.json ... maps/s12.json');

let fails = 0;
for (const f of files) {
  const id = f.replace('.json', '');
  try {
    const json = JSON.parse(readFileSync(join(mapDir, f), 'utf8'));
    assert.equal(json.orientation, 'orthogonal', 'orthogonal');
    assert.equal(json.tilewidth, 32); assert.equal(json.tileheight, 32);
    assert.equal(json.infinite, false, 'finite map');

    const layer = name => {
      const l = (json.layers || []).filter(x => x.name === name);
      assert.equal(l.length, 1, `exactly one '${name}' layer`);
      return l[0];
    };
    const bg = layer('bg');
    assert.equal(bg.type, 'imagelayer', 'bg is an image layer');
    assert.ok(/^\.\.\/assets\/bg\/[\w-]+\.webp$/.test(bg.image), 'bg image path ../assets/bg/<name>.webp: ' + bg.image);
    assert.equal((bg.x || 0) + (bg.offsetx || 0), 0); assert.equal((bg.y || 0) + (bg.offsety || 0), 0);
    for (const n of ['collision', 'spots', 'npcs', 'spawn']) assert.equal(layer(n).type, 'objectgroup', n + ' is an object layer');
    const spawnObjs = layer('spawn').objects || [];
    assert.equal(spawnObjs.length, 1, 'one spawn object');
    assert.equal(spawnObjs[0].point, true, 'spawn is a point');

    // 배경 그림 크기 = 맵 크기
    const img = resolve(dirname(join(mapDir, f)), bg.image);
    assert.ok(existsSync(img), 'bg file exists: ' + bg.image);
    const sz = webpSize(readFileSync(img));
    const m = T.parse(json);
    assert.deepEqual([...m.problems], [], 'tiled problems');
    assert.equal(sz.w, m.width, `bg width ${sz.w} = map width ${m.width}`);
    assert.equal(sz.h, m.height, `bg height ${sz.h} = map height ${m.height}`);

    // 엔진과 같은 격자
    const g = P.buildGrid({ width: m.width, height: m.height, cell: cfg.cell, rects: m.rects, polys: m.polys, tiles: m.tiles });
    const mask = P.walkMask(g, feet.hw, feet.hh);
    assert.equal(P.collides(g, m.spawn.x, m.spawn.y, feet.hw, feet.hh), false, `spawn (${m.spawn.x},${m.spawn.y}) is walkable`);

    // 시작 칸에서 퍼지기. 길찾기는 모서리 가로지르기를 막으므로 4방향 연결과 같다.
    const st = P.cellOf(g, m.spawn.x, m.spawn.y);
    const seen = new Uint8Array(g.cols * g.rows);
    const stack = [st.r * g.cols + st.c];
    assert.equal(mask[stack[0]], 1, 'spawn cell open in walk mask');
    seen[stack[0]] = 1;
    let reached = 0;
    while (stack.length) {
      const i = stack.pop(); reached++;
      const c = i % g.cols, r = (i - c) / g.cols;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= g.cols || nr >= g.rows) continue;
        const j = nr * g.cols + nc;
        if (!seen[j] && mask[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    const lost = [];
    for (let i = 0; i < mask.length; i++) if (mask[i] && !seen[i]) lost.push(i);
    if (lost.length) {
      const ex = lost.slice(0, 6).map(i => { const c = i % g.cols; return `(${(c + 0.5) * g.cell},${(((i - c) / g.cols) + 0.5) * g.cell})`; });
      assert.fail(`${lost.length} walkable cells not reachable from spawn, e.g. ${ex.join(' ')}`);
    }
    for (const f of m.fronts) {
      const tag = `front '${f.name}'`;
      assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= m.width && f.y + f.h <= m.height, tag + ' inside the map');
      assert.ok(f.baseY > f.y && f.baseY <= m.height, tag + ` baseY ${f.baseY} below its top ${f.y}`);
      let behind = 0;
      for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
        const x = (c + 0.5) * g.cell, y = (r + 0.5) * g.cell;
        if (seen[r * g.cols + c] && y < f.baseY && x > f.x && x < f.x + f.w && y > f.y - 96 && y - 96 < f.y + f.h) behind++;
      }
      assert.ok(behind > 0, tag + ' has walkable cells behind it');
    }
    const total = mask.reduce((a, b) => a + b, 0);
    assert.ok(total / (g.cols * g.rows) > 0.15, 'at least 15% of the map is walkable');
    console.log(`ok ${id}: ${m.width}x${m.height}, ${m.rects.length} rects + ${m.polys.length} polys, walkable ${reached} cells (${Math.round(100 * reached / (g.cols * g.rows))}%)${m.fronts.length ? ', ' + m.fronts.length + ' front' : ''}`);
  } catch (e) {
    fails++;
    console.error(`a3-maps ${id}: ${e.message}`);
  }
}
if (fails) { console.error(`a3-maps: ${fails} map(s) failed`); process.exit(1); }
console.log(`a3-maps: ${files.length} maps ok`);
