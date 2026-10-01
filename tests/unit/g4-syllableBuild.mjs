// G4 기믹 '음절 조립'(syllableBuild)의 순수 부분: 자모 원자열 판정(ㄲ = ㄱㄱ), 자리별 틀린 곳, 연습 과녁 제외,
// 옛한글 조합기로 음절 만들기(합용 병서·ㅙ·겹받침·연서), 학교급 용어, 진행기 판정 접점(stageLogic.judge)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/core/rules.js', 'js/data/rules-config.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-gimmick.js',
  'js/data/text-g-syllableBuild.js', 'js/gimmicks/syllableBuild.js'
]);
const NM = ctx.NM;
const def = NM.gimmicks.get('syllableBuild');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'syllableBuild 가 등록되어야 한다');
const G = def.logic;

// ── 판정: 자리별 원자열 ──
const item = { answer: { a: { cho: 'ㅂㅈ', jung: 'ㅏ', jong: 'ㄱ' }, k: { cho: 'ㄲ', jung: 'ㅙ', jong: '' } } };
assert.equal(def.check({ a: { cho: 'ㅂㅈ', jung: 'ㅏ', jong: 'ㄱ' }, k: { cho: 'ㄱㄱ', jung: 'ㅗㅏㅣ', jong: '' } }, item), true, 'ㄲ = ㄱㄱ, ㅙ = ㅗㅏㅣ');
assert.equal(def.check({ a: { cho: ['ㅂ', 'ㅈ'], jung: ['ㅏ'], jong: ['ㄱ'] }, k: { cho: ['ㄲ'], jung: ['ㅗ', 'ㅐ'], jong: [] } }, item), true, '배열·묶음 글자도 원자열로');
let r = def.check({ a: { cho: 'ㅈㅂ', jung: 'ㅏ', jong: '' }, k: { cho: 'ㄱㄱ', jung: 'ㅗㅏㅣ', jong: '' } }, item);
assert.deepEqual(JSON.parse(JSON.stringify(r)), { correct: false, wrong: { a: ['cho', 'jong'] } }, '순서가 바뀐 병서·빠진 종성은 틀림');
r = def.check({}, item);
assert.deepEqual(JSON.parse(JSON.stringify(r.wrong)), { a: ['cho', 'jung', 'jong'], k: ['cho', 'jung'] }, '빈 답: 정답이 있는 자리만 틀림');
assert.equal(def.check({ a: { cho: 'ㅂㅈ', jung: 'ㅏ', jong: 'ㄱ' }, k: { cho: 'ㄲ', jung: 'ㅙ' }, p: { cho: 'ㅂㅇ', jung: 'ㅣ' } }, item), true, '연습 과녁(답에 없음)은 판정에서 빠진다');
assert.equal(G.atoms('ㅺㅘ'), 'ㅅㄱㅗㅏ');

// ── 진행기 판정 접점 ──
const j = NM.ui.stageLogic.judge(def, { a: { cho: 'ㅂ', jung: 'ㅏ', jong: 'ㄱ' } }, item);
assert.equal(j.correct, false);
assert.deepEqual(JSON.parse(JSON.stringify(j.wrong.a)), ['cho']);

// ── 조합: 데이터 표기 '[초중종]' (README 예시 포함) ──
assert.equal(G.compose({ cho: ['ㅂ', 'ㅈ'], jung: ['ㅏ'], jong: ['ㄱ'] }), '[ㅂㅈㅏㄱ]');
assert.equal(G.compose({ cho: ['ㅎ'], jung: ['ㅗ', 'ㅏ', 'ㅣ'], jong: [] }), '[ㅎㅗㅏㅣ]');
assert.equal(G.compose({ cho: ['ㅎ'], jung: ['ㆍ'], jong: ['ㄹ', 'ㄱ'] }), '[ㅎㆍㄹㄱ]');
assert.equal(G.compose({ cho: ['ㅂ', 'ㅇ'], jung: ['ㅣ'], jong: [] }), '[ㅂㅇㅣ]');
assert.equal(G.compose({ cho: ['ㄱ', 'ㅁ'], jung: ['ㅏ'], jong: [] }), null, '표에 없는 첫소리 묶음은 모이지 않는다');
assert.equal(G.compose({ cho: ['ㄱ'], jung: [], jong: ['ㄹ'] }), null, '중성 없으면 모이지 않는다');
for (const [inner, want] of [['ㅂㅈㅏㄱ', 'ᄧᅡᆨ'], ['ㅂㅇㅣ', 'ᄫᅵ'], ['ㅎㆍㄹㄱ', 'ᄒᆞᆰ']]) {
  assert.equal(NM.core.yet.render('[' + inner + ']'), want, '옛한글 조합기 결과 ' + inner);
}

// ── 학교급 용어 ──
assert.equal(G.clusterTerm('cho', ['ㄱ', 'ㄱ'], 'm'), '나란히 쓰기');
assert.equal(G.clusterTerm('jong', ['ㄹ', 'ㄱ'], 'm'), '나란히 쓰기');
assert.equal(G.clusterTerm('cho', ['ㄱ', 'ㄱ'], 'h1'), '각자 병서');
assert.equal(G.clusterTerm('cho', ['ㅂ', 'ㅈ'], 'h23'), '합용 병서');
assert.ok(G.clusterTerm('cho', ['ㅂ', 'ㅅ'], 'h1').includes('병서'));
assert.equal(G.clusterTerm('jung', ['ㅗ', 'ㅏ'], 'm'), '모음자 합치기');
assert.equal(G.clusterTerm('jung', ['ㅗ', 'ㅏ'], 'h1'), '모음자 합치기');
assert.ok(G.clusterTerm('cho', ['ㅂ', 'ㅇ'], 'm').includes('연서') && G.clusterTerm('cho', ['ㅂ', 'ㅇ'], 'm').includes('알아 두기'));
assert.equal(G.clusterTerm('cho', ['ㄱ'], 'm'), '');
assert.equal(G.clusterTerm('jung', ['ㄱ', 'ㄱ'], 'm'), '', '중성 자리의 자음 묶음에는 이름표 없음');

// ── 문구: 기믹이 쓰는 열쇠가 모두 있다 ──
const T = NM.data.TEXT.g.syllableBuild;
for (const k of ['guide', 'tray', 'slotGroup', 'pickSlot', 'add', 'remove', 'empty', 'preview', 'cannot', 'submit', 'practice', 'wrongMark', 'hintMark', 'answerMark']) assert.equal(typeof T[k], 'string', k);
for (const lv of ['m', 'h1', 'h23']) assert.ok(T.terms[lv] && T.terms[lv].pair && T.terms[lv].vowel && T.terms[lv].yeonseo, lv);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.window.__nmErrors || [])), [], '오류 모음 없음');
console.log('g4-syllableBuild: ok');
