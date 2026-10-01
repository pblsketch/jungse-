// G5 기믹 '끊어 읽기'(wordCut)의 순수 부분: 原文 줄 → 글자(빈칸 뺌)·방점 높낮이, README 블록별 정답 경계 = 原文 빈칸,
// 끊기 판정(틀린 자리·빠진 자리), 견주기 '딱 떼어 냄', 진행기 판정 접점
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/core/rules.js', 'js/data/rules-config.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-gimmick.js',
  'js/data/orig.generated.js', 'js/data/text-g-wordCut.js', 'js/gimmicks/wordCut.js'
]);
const NM = ctx.NM;
const def = NM.gimmicks.get('wordCut');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'wordCut 가 등록되어야 한다');
const G = def.logic;
const J = (x) => JSON.parse(JSON.stringify(x)); // vm 쪽 배열·객체를 이쪽 것으로

// ── 原文 줄 → 글자 ──
const yb2a = G.unitsOf(NM.data.ORIG['O-s4-YB2a'].lines[0]);
assert.equal(yb2a.units.length, 21);
assert.deepEqual(J(yb2a.units.slice(0, 4).map(u => u.modern)), ['불', '휘', '기', '픈']);
assert.deepEqual(J(yb2a.units.slice(0, 4).map(u => u.tone)), [0, 1, 0, 1], '평성 0 · 거성 1');
assert.equal(yb2a.units[11].tone, 2, ':뮐 상성');
const yb34a = G.unitsOf(NM.data.ORIG['O-s4-YB34a'].lines[0]);
assert.equal(yb34a.units[11].tone, null, '독음 없는 한자는 막대 없음');
assert.equal(yb34a.units.length, 25);
// 글자를 다시 그려도 原文과 같다(빈칸만 뺌)
const Y = NM.core.yet;
for (const id of ['O-s4-YB2a', 'O-s4-YB2b', 'O-s4-YB34a', 'O-s4-YB34b']) {
  const line = NM.data.ORIG[id].lines[0];
  const u = G.unitsOf(line).units;
  assert.equal(Y.render(u.map(x => x.text).join(''), { bangjeom: true }), Y.render(line, { bangjeom: true }).replace(/ /g, ''), id + ' 다시 그리기 = 原文');
}

// ── README 의 블록별 정답 경계 = 原文 빈칸 ──
const readme = readFileSync(join(ROOT, 'js/gimmicks/README-wordCut.md'), 'utf8');
const m = /<!-- wordCut-boundaries -->\s*```json\s*([\s\S]*?)```/.exec(readme);
assert.ok(m, 'README 에 wordCut-boundaries JSON 이 있어야 한다');
const bounds = JSON.parse(m[1]);
assert.deepEqual(J(Object.keys(bounds).sort()), ['O-s4-YB2a', 'O-s4-YB2b', 'O-s4-YB34a', 'O-s4-YB34b']);
for (const id of Object.keys(bounds)) assert.deepEqual(J(G.unitsOf(NM.data.ORIG[id].lines[0]).spaces), bounds[id], id + ' 경계 = 빈칸 자리');

// 시험 장면의 정답도 같은 값이다
const fx = load(['js/core/ns.js', 'tests/fixtures/g-wordCut.js']).NM.data.SCENES.s4;
for (const it of fx.items) for (const k of Object.keys(it.answer)) assert.deepEqual(JSON.parse(JSON.stringify(it.answer[k])), bounds[k], it.id + ' ' + k);

// ── 판정 ──
const item = { answer: { A: [1, 3, 5], B: [0] } };
assert.equal(def.check({ A: [5, 3, 1], B: [0] }, item), true, '순서 무관');
let r = def.check({ A: [0, 1, 3], B: [] }, item);
assert.deepEqual(JSON.parse(JSON.stringify(r)), { correct: false, wrong: { A: { extra: [0], missing: [5] }, B: { extra: [], missing: [0] } } });
r = def.check({}, item);
assert.equal(r.correct, false);
assert.equal(G.lineKey({ block: 'O-x-Y' }), 'O-x-Y');
assert.equal(G.lineKey({ block: 'O-x-Y', line: 1 }), 'O-x-Y#1');
const j = NM.ui.stageLogic.judge(def, { A: [1, 3], B: [0] }, item);
assert.equal(j.correct, false);
assert.deepEqual(JSON.parse(JSON.stringify(j.wrong.A.missing)), [5]);

// ── 견주기: 끊기가 [s, e) 를 딱 떼어 내는가 ──
const cuts = { 1: true, 3: true };
assert.equal(G.isolates(cuts, 2, 4, 21), true);
assert.equal(G.isolates(cuts, 0, 2, 21), true, '줄 머리');
assert.equal(G.isolates({ 1: true, 2: true, 3: true }, 2, 4, 21), false, '안에 끊기가 있으면 아님');
assert.equal(G.isolates({ 3: true }, 2, 4, 21), false, '앞이 안 끊겼으면 아님');
assert.equal(G.isolates({ 18: true }, 19, 21, 21), true, '줄 끝');

// ── 문구 ──
const T = NM.data.TEXT.g.wordCut;
for (const k of ['guide', 'lineLabel', 'syl', 'sylCut', 'submit', 'pitchTitle', 'pitchNote', 'compareTitle', 'found', 'notFound', 'wrongMark', 'hintMark', 'answerMark']) assert.equal(typeof T[k], 'string', k);
for (const t of [0, 1, 2]) assert.equal(typeof T.pitch[t], 'string');
assert.deepEqual(JSON.parse(JSON.stringify(ctx.window.__nmErrors)), [], '오류 모음 없음');
console.log('g5-wordCut: ok');
