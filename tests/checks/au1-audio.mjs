// AU1 배경음 점검: NM.data.BGM의 모든 키가 실제 파일을 가리키는지, 크기가 적당한지(< 2MB),
// assets/audio/CREDITS.md가 파일마다 출처를 적었는지 본다.
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const ctx = load(['js/core/ns.js', 'js/data/bgm.js']);
const BGM = ctx.NM.data.BGM;
assert.ok(BGM && typeof BGM === 'object', 'NM.data.BGM이 없다');

const want = ['bgm_title', 'bgm_select', ...Array.from({ length: 13 }, (_, i) => `bgm_s${i}`)];
assert.deepEqual(Object.keys(BGM).sort(), [...want].sort(), '배경음 키 목록이 다르다');

const credits = readFileSync(join(ROOT, 'assets/audio/CREDITS.md'), 'utf8');
assert.ok(credits.includes('공공누리 제1유형'), 'CREDITS.md에 공공누리 제1유형 표기가 없다');
assert.ok(credits.includes('국립국악원'), 'CREDITS.md에 국립국악원 표기가 없다');

const MAX = 2 * 1024 * 1024;
for (const [key, rel] of Object.entries(BGM)) {
  assert.equal(typeof rel, 'string', `${key}: 경로가 문자열이 아니다`);
  assert.ok(rel.startsWith('assets/audio/') && rel.endsWith('.mp3'), `${key}: assets/audio/*.mp3가 아니다 (${rel})`);
  const abs = join(ROOT, rel);
  assert.ok(existsSync(abs), `${key}: 파일이 없다 (${rel})`);
  const size = statSync(abs).size;
  assert.ok(size > 50 * 1024, `${key}: 파일이 너무 작다 (${size} B)`);
  assert.ok(size < MAX, `${key}: 2MB를 넘는다 (${size} B)`);
  const head = readFileSync(abs).subarray(0, 3);
  const isMp3 = head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
  assert.ok(isMp3, `${key}: MP3 머리가 아니다`);
  assert.ok(credits.includes(basename(rel)), `CREDITS.md에 ${basename(rel)} 출처가 없다`);
}
console.log(`au1-audio ok (${Object.keys(BGM).length}곡)`);
