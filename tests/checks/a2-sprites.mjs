// A2 인물 그림 점검 (의존 패키지 없음).
// - assets/sprites/*.json 마다: 12프레임, 같은 칸 크기, pivot/origin, anims down/left/up/idle,
//   flip.right=left, PNG 가 있고 크기가 칸×줄과 같음, 발 기준선(±2px, A1 기준)
// - A2 가 만들기로 한 스프라이트·초상 목록이 모두 있는지, 초상 webp 머리글과 크기(긴 변 ≤512)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPR = join(ROOT, 'assets', 'sprites');
const POR = join(ROOT, 'assets', 'portraits');

// A2 결과 목록 (js/data/assets.js 에 등록할 키와 같다)
const SPRITES = [
  'hero_1', 'hero_2', 'hero_3', 'hero_4', 'senior_tongsa',
  'sejong', 'official', 'commoner_man', 'commoner_woman', 'child', 'merchant',
  'yangban_man', 'yangban_woman', 'monk', 'artisan', 'elder',
  'anc_man', 'anc_woman', 'anc_scribe', 'anc_child',
  'teacher_16c', 'student_16c', 'yeokgwan_18c', 'noblewoman_18c', 'editor_1896', 'newsboy_1896',
  'teacher_modern',
];
const EXPR = ['neutral', 'surprised', 'smile', 'thinking'];
const PORTRAITS = [
  ...['hero_1', 'hero_2', 'hero_3', 'hero_4', 'senior_tongsa', 'teacher_modern'].flatMap(k => EXPR.map(e => `${k}_${e}`)),
  'senior_tongsa_full', 'sejong_full', 'sejong_neutral', 'sejong_smile',
  'commoner_man', 'commoner_woman', 'child', 'merchant', 'yangban_man', 'yangban_woman', 'official', 'monk',
  'artisan', 'elder', 'anc_man', 'anc_woman', 'anc_child', 'anc_scribe', 'teacher_16c', 'student_16c',
  'yeokgwan_18c', 'noblewoman_18c', 'editor_1896', 'newsboy_1896',
];

const errors = [];
const err = m => errors.push(m);

// ---- every atlas JSON in assets/sprites
const jsons = existsSync(SPR) ? readdirSync(SPR).filter(f => f.endsWith('.json')).sort() : [];
for (const f of jsons) {
  const name = f.replace(/\.json$/, '');
  let meta;
  try { meta = JSON.parse(readFileSync(join(SPR, f), 'utf8')); } catch (e) { err(`${f}: bad JSON (${e.message})`); continue; }
  const pre = `${f}:`;
  if (meta.frameCount !== 12 || !Array.isArray(meta.frames) || meta.frames.length !== 12) err(`${pre} expected 12 frames (got ${meta.frameCount}/${meta.frames && meta.frames.length})`);
  for (const fr of meta.frames || []) {
    if (fr.w !== meta.frameWidth || fr.h !== meta.frameHeight) err(`${pre} frame ${fr.index} size ${fr.w}x${fr.h} != ${meta.frameWidth}x${meta.frameHeight}`);
  }
  if (!meta.pivot || !Number.isFinite(meta.pivot.x) || !Number.isFinite(meta.pivot.y)) err(`${pre} pivot missing`);
  if (!meta.origin || !Number.isFinite(meta.origin.x) || !Number.isFinite(meta.origin.y)) err(`${pre} origin missing`);
  for (const k of ['down', 'left', 'up', 'idle']) {
    const a = meta.anims && meta.anims[k];
    if (!a || !Array.isArray(a.frames) || !a.frames.length || a.frames.some(i => i < 0 || i >= 12)) err(`${pre} anim ${k} missing or bad`);
  }
  if (!meta.flip || meta.flip.right !== 'left') err(`${pre} flip.right must be 'left'`);
  const png = join(SPR, meta.image || `${name}.png`);
  if (!existsSync(png)) { err(`${pre} PNG missing (${meta.image})`); continue; }
  let img;
  try { img = decodePng(readFileSync(png)); } catch (e) { err(`${pre} PNG unreadable (${e.message})`); continue; }
  if (img.width !== meta.columns * meta.frameWidth || img.height !== meta.rows * meta.frameHeight) err(`${pre} atlas ${img.width}x${img.height} != ${meta.columns}x${meta.frameWidth} by ${meta.rows}x${meta.frameHeight}`);
  // foot baseline: lowest row with >=2 opaque px must be within 2px across frames, and at pivot.y
  const base = (meta.frames || []).map(fr => {
    for (let y = fr.h - 1; y >= 0; y--) {
      let n = 0;
      for (let x = 0; x < fr.w; x++) if (img.data[((fr.y + y) * img.width + fr.x + x) * 4 + 3] >= 128) n++;
      if (n >= 2) return y;
    }
    return -1;
  });
  if (base.some(b => b < 0)) err(`${pre} empty frame`);
  else {
    const spread = Math.max(...base) - Math.min(...base);
    if (spread > 2) err(`${pre} foot baselines spread ${spread}px (${base.join(',')})`);
    if (Math.abs(Math.max(...base) - (meta.pivot.y - 1)) > 2) err(`${pre} baseline ${Math.max(...base)} not at pivot.y ${meta.pivot.y}`);
  }
}

// ---- A2 roster
for (const k of SPRITES) {
  if (!existsSync(join(SPR, `${k}.json`))) err(`sprite ${k}: assets/sprites/${k}.json missing`);
  if (!existsSync(join(SPR, `${k}.png`))) err(`sprite ${k}: assets/sprites/${k}.png missing`);
}
for (const k of PORTRAITS) {
  const p = join(POR, `${k}.webp`);
  if (!existsSync(p)) { err(`portrait ${k}: assets/portraits/${k}.webp missing`); continue; }
  const b = readFileSync(p);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') { err(`portrait ${k}: not a webp`); continue; }
  const sz = webpSize(b);
  if (!sz) err(`portrait ${k}: cannot read webp size`);
  else if (Math.max(sz.w, sz.h) > 512) err(`portrait ${k}: ${sz.w}x${sz.h} longer than 512`);
}

if (errors.length) {
  for (const e of errors) console.error('a2-sprites: ' + e);
  console.error(`a2-sprites: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`a2 sprites ok: ${jsons.length} atlases, ${SPRITES.length} roster sprites, ${PORTRAITS.length} portraits`);

function webpSize(b) {
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  return null;
}

function decodePng(buf) {
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('not a PNG');
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
