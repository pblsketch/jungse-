// 한자 음 표(NM.data.HANJA_EUM, js/data/hanja-eum.js) 점검.
//  - js/data/** 의 화면 문자열에서 루비 {漢|읽기} 바깥의 '맨 한자'는 모두 chars 에 음이 있다.
//  - chars 값은 완성형 한 음절, words 값은 열쇠 글자 수만큼의 완성형 음절.
//  - words 열쇠는 두 글자 이상 한자열이고, 실제 데이터의 맨 한자 덩어리 안에 나온다(죽은 항목 없음).
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const top = readdirSync(join(ROOT, 'js/data')).filter(f => f.endsWith('.js')).sort().map(f => 'js/data/' + f);
const scenes = readdirSync(join(ROOT, 'js/data/scenes')).filter(f => f.endsWith('.js')).sort().map(f => 'js/data/scenes/' + f);
const ctx = load(['js/core/ns.js', ...top, ...scenes]);
const D = ctx.NM.data;
const E = D.HANJA_EUM;
assert.ok(E && E.chars && E.words, 'NM.data.HANJA_EUM.chars / .words 가 있어야 한다');

// 한자: CJK 통합 한자(확장 A~ 포함)·호환 한자
const HAN_ONE = /^[㐀-䶿一-鿿豈-﫿\u{20000}-\u{3134F}]$/u;
const HAN_ALL = /[㐀-䶿一-鿿豈-﫿\u{20000}-\u{3134F}]/gu;
const HAN_RUN = /[㐀-䶿一-鿿豈-﫿\u{20000}-\u{3134F}]+/gu;
const SYL = /^[가-힣]$/;
const RUBY = /\{[^{}|]*\|[^{}]*\}/g; // 루비 한 덩어리(읽기가 이미 달린 한자)

// 화면에 나오지 않는 메타 문자열(原文 블록의 리서치 문서 경로·출처·확실도)과 이 표 자체는 빼고 훑는다.
const skip = (p) => /^NM\.data\.ORIG\.[^.]+\.(doc|src|certainty)$/.test(p) || /^NM\.data\.HANJA_EUM\b/.test(p);
const runs = [];            // 맨 한자 덩어리(연속된 한자)
const where = new Map();    // 글자 → 처음 나온 경로
let nStrings = 0, nOcc = 0;
(function walk(v, path, seen) {
  if (skip(path)) return;
  if (typeof v === 'string') {
    const bare = v.replace(RUBY, '\u0000');
    const r = bare.match(HAN_RUN);
    if (!r) return;
    nStrings++;
    runs.push(...r);
    for (const ch of bare.match(HAN_ALL)) { nOcc++; if (!where.has(ch)) where.set(ch, path); }
    return;
  }
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  for (const k of Object.keys(v)) walk(v[k], Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`, seen);
})(D, 'NM.data', new Set());

const errors = [], unused = []; // unused: 데이터에서 빠진 글자(실패는 아님 — 알림만)
// 1) 맨 한자는 모두 chars 에
for (const [ch, p] of where) if (!Object.prototype.hasOwnProperty.call(E.chars, ch)) errors.push(`chars 에 없는 맨 한자 '${ch}' (U+${ch.codePointAt(0).toString(16).toUpperCase()}) — ${p}`);
// 2) chars 형식
for (const [k, v] of Object.entries(E.chars)) {
  if (!HAN_ONE.test(k)) errors.push(`chars 열쇠 '${k}' 는 한자 한 글자가 아니다`);
  if (typeof v !== 'string' || !SYL.test(v)) errors.push(`chars['${k}'] = ${JSON.stringify(v)} — 완성형 한 음절이어야 한다`);
  if (!where.has(k)) unused.push(k);
}
// 3) words 형식·쓰임
for (const [k, v] of Object.entries(E.words)) {
  const ks = [...k], vs = typeof v === 'string' ? [...v] : [];
  if (ks.length < 2 || !ks.every(c => HAN_ONE.test(c))) errors.push(`words 열쇠 '${k}' 는 두 글자 이상 한자열이어야 한다`);
  if (vs.length !== ks.length || !vs.every(s => SYL.test(s))) errors.push(`words['${k}'] = ${JSON.stringify(v)} — 글자 수(${ks.length})만큼 완성형 음절이어야 한다`);
  for (const c of ks) if (!Object.prototype.hasOwnProperty.call(E.chars, c)) errors.push(`words['${k}'] 의 '${c}' 가 chars 에 없다`);
  if (!runs.some(r => r.includes(k))) errors.push(`words['${k}'] 는 데이터의 맨 한자 덩어리에 나오지 않는다(죽은 항목)`);
}

if (errors.length) {
  for (const e of errors) console.log('  FAIL ' + e);
  console.log(`hanja-eum: 실패 ${errors.length}건`);
  process.exit(1);
}
if (unused.length) console.log(`  알림 chars 에만 있고 화면 문자열에는 안 나오는 글자 ${unused.length}개: ${unused.join('')}`);
const overrides = Object.entries(E.words).filter(([k, v]) => [...k].map(c => E.chars[c]).join('') !== v).length;
// 화면에서 쓰는 음 고르기(NM.ui.stageYet.eums): 한자 덩어리 안에서 words 의 가장 긴 열쇠 먼저, 없으면 chars
{
  const ui = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/data/hanja-eum.js', 'js/ui/stage-yet.js']);
  const eums = (s) => ui.NM.ui.stageYet.eums([...s]).map(x => x || '_').join('');
  assert.equal(eums('欲使人人易習'), '욕사인인이습', '易習 은 이습');
  assert.equal(eums('而終不得伸其情者'), '이종부득신기정자', '不得 은 부득');
  assert.equal(eums('與文字不相流通'), '여문자불상유통', '流通 은 유통, 不相 은 불상');
  assert.equal(eums('其形則'), '기형즉');
  assert.equal(eums('牙音ㄱ'), '아음_', '한자가 아니면 음 없음');
  assert.equal(eums('景德王'), '경덕왕');
}
console.log(`hanja-eum ok: 맨 한자 ${where.size}자(${nOcc}번, 문자열 ${nStrings}개) 모두 음 있음 · chars ${Object.keys(E.chars).length} · words ${Object.keys(E.words).length}(그중 글자 음과 다른 것 ${overrides})`);
