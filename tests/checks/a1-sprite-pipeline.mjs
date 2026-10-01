// A1 그림 도구 점검: tools/process_sprites.py 를 견본 SD 시트(왼쪽 절반 = 인물 A)에 돌려
// 아틀라스 PNG + JSON 이 생기는지, 12프레임·같은 칸 크기·발 기준선(±2px)을 확인한다.
// PNG 는 node:zlib 로 직접 풀어(8bit RGBA, 비인터레이스) 실제 픽셀로 기준선을 잰다.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SHEET = join(ROOT, 'design', 'art', 'characters', 'v2', 'S1_sd_protagonists_1_2.png');
const SCRIPT = join(ROOT, 'tools', 'process_sprites.py');

function fail(msg) { console.error('a1-sprite-pipeline: ' + msg); process.exit(1); }

// 파이썬 찾기 + numpy/Pillow 확인
const candidates = [['python'], ['py', '-3'], ['python3']];
let py = null;
for (const c of candidates) {
  const r = spawnSync(c[0], [...c.slice(1), '-c', 'import numpy, PIL; print("ok")'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.includes('ok')) { py = c; break; }
}
if (!py) fail('Python 3 with numpy + Pillow not found. Install: python -m pip install numpy Pillow');
if (!existsSync(SHEET)) fail('sample sheet missing: ' + SHEET);

const out = mkdtempSync(join(tmpdir(), 'nm-a1-'));
try {
  const r = spawnSync(py[0], [...py.slice(1), SCRIPT, SHEET, '--name', 'hero_a', '--region', 'left',
    '--out-dir', out, '--no-raw'], { encoding: 'utf8', timeout: 55000 });
  if (r.status !== 0) fail(`process_sprites.py exit ${r.status}\n${r.stdout}\n${r.stderr}`);

  const pngPath = join(out, 'hero_a.png'), jsonPath = join(out, 'hero_a.json');
  assert.ok(existsSync(pngPath), 'atlas PNG exists');
  assert.ok(existsSync(jsonPath), 'atlas JSON exists');
  const meta = JSON.parse(readFileSync(jsonPath, 'utf8'));
  assert.equal(meta.frameCount, 12, 'frameCount 12');
  assert.equal(meta.frames.length, 12, '12 frame records');
  for (const f of meta.frames) {
    assert.equal(f.w, meta.frameWidth, `frame ${f.index} width`);
    assert.equal(f.h, meta.frameHeight, `frame ${f.index} height`);
  }
  for (const k of ['down', 'left', 'up', 'idle']) assert.ok(meta.anims[k], `anim ${k}`);
  assert.equal(meta.flip.right, 'left');

  const img = decodePng(readFileSync(pngPath));
  assert.equal(img.width, meta.columns * meta.frameWidth, 'atlas width');
  assert.equal(img.height, meta.rows * meta.frameHeight, 'atlas height');

  // 각 프레임에서 alpha>=128 인 가장 아래 행(칸 기준) = 발 기준선
  const baselines = meta.frames.map(f => {
    for (let y = f.h - 1; y >= 0; y--) {
      let n = 0;
      for (let x = 0; x < f.w; x++) if (img.data[((f.y + y) * img.width + f.x + x) * 4 + 3] >= 128) n++;
      if (n >= 2) return y;
    }
    return -1;
  });
  assert.ok(baselines.every(b => b >= 0), 'every frame has opaque pixels');
  const spread = Math.max(...baselines) - Math.min(...baselines);
  assert.ok(spread <= 2, `foot baselines within 2px (got ${spread}: ${baselines.join(',')})`);
  console.log(`a1 sprite pipeline ok: ${meta.frameWidth}x${meta.frameHeight} x12, baseline spread ${spread}px`);
} finally {
  rmSync(out, { recursive: true, force: true });
}

function decodePng(buf) {
  const sig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== sig) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, depth = 0, ctype = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    const d = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = d.readUInt32BE(0); height = d.readUInt32BE(4); depth = d[8]; ctype = d[9]; interlace = d[12]; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || ctype !== 6 || interlace !== 0) throw new Error(`unsupported PNG (depth ${depth}, type ${ctype}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = width * bpp, data = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[src + x];
      const a = x >= bpp ? data[dst + x - bpp] : 0;
      const b = y > 0 ? data[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? data[dst - stride + x - bpp] : 0;
      let p;
      switch (ft) {
        case 0: p = v; break;
        case 1: p = v + a; break;
        case 2: p = v + b; break;
        case 3: p = v + ((a + b) >> 1); break;
        case 4: { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
          p = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new Error('bad filter ' + ft);
      }
      data[dst + x] = p & 255;
    }
  }
  return { width, height, data };
}
