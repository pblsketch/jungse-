// A4 그림 점검: 장면 그림(cg)·오해 장면 그림·UI 아이콘·대표 이미지(OG)·앱 아이콘.
// - 목록의 파일이 모두 있고, 형식(시그니처)과 크기 규칙을 지키는가.
//   cg: webp, 가로 ≤ 1280 / og.jpg: jpeg 1200×630 / 첫 화면·종이 화면 그림(assets/ui/title-bg*·level_*·paper·thumbs): webp, 크기·용량 상한 / 아이콘·앱 아이콘: png 정사각형
// - manifest.webmanifest 의 icons 가 실제 파일을 가리키고, 적힌 sizes 와 실제 크기가 같은가.
// 외부 모듈 없이 파일 머리만 읽는다.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/load.mjs';

const STAGES = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];
const CG = [
  ...STAGES.flatMap((s) => [`${s}_intro`, `${s}_climax`]),
  'mis_commoner_puzzled', 'mis_yangban_offended', 'mis_child_laughing',
  'mis_official_confused', 'mis_woman_flustered', 'mis_monk_bemused',
].map((k) => `assets/cg/${k}.webp`);
const ICONS = ['notebook', 'settings', 'rulecard', 'dictionary', 'plaque', 'hint', 'map',
  'sound_on', 'sound_off'].map((k) => `assets/ui/icon_${k}.png`);
const APP = { 'assets/ui/app-192.png': 192, 'assets/ui/app-512.png': 512,
  'assets/ui/app-maskable-512.png': 512, 'assets/ui/apple-touch-icon.png': 180,
  'assets/ui/favicon-32.png': 32 };

function size(rel) {
  const p = join(ROOT, rel);
  assert.ok(existsSync(p), `${rel} 없음`);
  const b = readFileSync(p);
  assert.ok(b.length > 200, `${rel} 이 너무 작다`);
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { fmt: 'png', w: b.readUInt32BE(16), h: b.readUInt32BE(20), bytes: b.length };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { fmt: 'jpg', h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7), bytes: b.length };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    assert.fail(`${rel}: JPEG 크기 정보를 찾지 못함`);
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const c = b.toString('ascii', 12, 16);
    if (c === 'VP8X') return { fmt: 'webp', w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), bytes: b.length };
    if (c === 'VP8 ') return { fmt: 'webp', w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, bytes: b.length };
    if (c === 'VP8L') {
      const v = b.readUInt32LE(21);
      return { fmt: 'webp', w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff), bytes: b.length };
    }
    assert.fail(`${rel}: 모르는 WEBP 조각 ${c}`);
  }
  assert.fail(`${rel}: png/jpg/webp 가 아니다`);
}

let n = 0;
for (const rel of CG) {
  const s = size(rel);
  assert.equal(s.fmt, 'webp', `${rel} 형식`);
  assert.ok(s.w <= 1280 && s.w >= 640, `${rel} 가로 ${s.w} (640~1280)`);
  assert.ok(s.h >= 400 && s.h <= 1440, `${rel} 세로 ${s.h}`);
  assert.ok(s.bytes <= 600 * 1024, `${rel} ${Math.round(s.bytes / 1024)} KB > 600 KB`);
  n++;
}
const og = size('assets/ui/og.jpg');
assert.deepEqual([og.fmt, og.w, og.h], ['jpg', 1200, 630], 'og.jpg 는 1200×630 jpeg');
assert.ok(og.bytes <= 600 * 1024, 'og.jpg 600 KB 이하');
n++;
// 첫 화면·종이 화면 그림(assets/ui): webp, 크기·용량 상한(첫 화면이 늦게 뜨지 않게)
//   title-bg(넓은 화면) 가로 ≤ 1920·300 KB / title-bg-tall(세로 화면) 가로 ≤ 1080·300 KB /
//   level_*(학교급 카드) 정사각형 ≤ 640·60 KB / paper(한지 타일) ≤ 1024·120 KB / thumbs/<장면>(장면 카드) 가로 ≤ 480·40 KB
const UI_ART = [
  ['assets/ui/title-bg.webp', { maxW: 1920, minW: 960, kb: 300 }],
  ['assets/ui/title-bg-tall.webp', { maxW: 1080, minW: 540, kb: 300, tall: true }],
  ...['m', 'h1', 'h23'].map((k) => [`assets/ui/level_${k}.webp`, { maxW: 640, minW: 240, kb: 60, square: true }]),
  ['assets/ui/paper.webp', { maxW: 1024, minW: 256, kb: 120 }],
  ...STAGES.map((s) => [`assets/ui/thumbs/${s}.webp`, { maxW: 480, minW: 160, kb: 40 }])
];
for (const [rel, r] of UI_ART) {
  const s = size(rel);
  assert.equal(s.fmt, 'webp', `${rel} 형식`);
  assert.ok(s.w >= r.minW && s.w <= r.maxW, `${rel} 가로 ${s.w} (${r.minW}~${r.maxW})`);
  if (r.square) assert.equal(s.w, s.h, `${rel} 정사각형 아님 (${s.w}×${s.h})`);
  if (r.tall) assert.ok(s.h > s.w, `${rel} 세로가 더 길어야 한다 (${s.w}×${s.h})`);
  assert.ok(s.bytes <= r.kb * 1024, `${rel} ${Math.round(s.bytes / 1024)} KB > ${r.kb} KB`);
  n++;
}
for (const rel of ICONS) {
  const s = size(rel);
  assert.equal(s.fmt, 'png', `${rel} 형식`);
  assert.equal(s.w, s.h, `${rel} 정사각형 아님 (${s.w}×${s.h})`);
  assert.ok(s.w >= 64 && s.w <= 256, `${rel} 크기 ${s.w}`);
  n++;
}
for (const [rel, px] of Object.entries(APP)) {
  const s = size(rel);
  assert.deepEqual([s.fmt, s.w, s.h], ['png', px, px], `${rel} 는 ${px}×${px} png`);
  n++;
}

// manifest.webmanifest
const man = JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8'));
assert.ok(Array.isArray(man.icons) && man.icons.length >= 2, 'manifest icons 가 2개 이상');
const sizesSeen = new Set();
for (const ic of man.icons) {
  assert.ok(ic.src && !/^(https?:)?\/\//.test(ic.src), `manifest icon src 는 상대 경로: ${ic.src}`);
  const rel = ic.src.replace(/^\.\//, '');
  assert.ok(existsSync(join(ROOT, rel)) && statSync(join(ROOT, rel)).isFile(), `manifest icon 파일 없음: ${ic.src}`);
  const s = size(rel);
  assert.equal(ic.type, 'image/png', `${ic.src} type`);
  assert.equal(ic.sizes, `${s.w}x${s.h}`, `${ic.src} sizes 표기(${ic.sizes})와 실제(${s.w}x${s.h})가 다르다`);
  sizesSeen.add(ic.sizes);
}
assert.ok(sizesSeen.has('192x192') && sizesSeen.has('512x512'), 'manifest 에 192·512 아이콘 필요');
assert.ok(man.icons.some((i) => (i.purpose || '').includes('maskable')), 'maskable 아이콘 필요');

console.log(`a4-art: 파일 ${n}개 형식·크기 OK, manifest 아이콘 ${man.icons.length}개 OK`);
