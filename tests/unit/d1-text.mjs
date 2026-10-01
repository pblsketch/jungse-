// D1 대사 문구: 별명 받침에 맞춘 조사 고르기, 별명 채우기, 화면 문구 찾기 (spec §10-1, §9)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load(['js/core/ns.js', 'js/data/text-stage.js', 'js/ui/stage-text.js']);
const S = ctx.NM.ui.stageText;
assert.ok(S, 'NM.ui.stageText 가 있어야 한다');

// ── 받침 판정 ──
const fin = (w) => JSON.parse(JSON.stringify(S.finalInfo(w)));
assert.deepEqual(fin('하늘'), { batchim: true, rieul: true });
assert.deepEqual(fin('바다'), { batchim: false, rieul: false });
assert.deepEqual(fin('솔밭'), { batchim: true, rieul: false });
assert.deepEqual(fin('7'), { batchim: true, rieul: true }, '칠');
assert.deepEqual(fin('2'), { batchim: false, rieul: false }, '이');
assert.deepEqual(fin('3'), { batchim: true, rieul: false }, '삼');
assert.deepEqual(fin('Tom'), { batchim: true, rieul: false });
assert.deepEqual(fin('Alex'), { batchim: false, rieul: false });
assert.deepEqual(fin('Bill'), { batchim: true, rieul: true });
assert.deepEqual(fin('L'), { batchim: true, rieul: true }, '엘');
assert.deepEqual(fin('R'), { batchim: true, rieul: true }, '알');
assert.deepEqual(fin('K'), { batchim: false, rieul: false }, '케이');

// ── 조사 고르기: 어느 쪽 형태로 적어도 같은 짝을 찾는다 ──
const cases = [
  ['하늘', '이', '이'], ['하늘', '가', '이'], ['바다', '이', '가'], ['바다', '가', '가'],
  ['하늘', '은', '은'], ['바다', '는', '는'], ['바다', '은', '는'],
  ['하늘', '을', '을'], ['바다', '를', '를'],
  ['하늘', '과', '과'], ['바다', '과', '와'],
  ['하늘', '아', '아'], ['바다', '아', '야'],
  ['하늘', '이라', '이라'], ['바다', '이라', '라'],
  ['솔밭', '으로', '으로'], ['하늘', '으로', '로'], ['바다', '으로', '로'],
  ['Tom', '이', '이'], ['Alex', '이', '가'], ['kim7', '이', '이'], ['a2', '은', '는']
];
for (const [w, p, want] of cases) assert.equal(S.particle(w, p), want, `${w}+${p}`);
assert.equal(S.particle('하늘', '께서'), '께서', '짝이 없는 말은 그대로 붙인다');

// ── 별명 채우기 ──
assert.equal(S.fill('{@아}, 이리 와.', { nickname: '하늘' }), '하늘아, 이리 와.');
assert.equal(S.fill('{@아}, 이리 와.', { nickname: '바다' }), '바다야, 이리 와.');
assert.equal(S.fill('{@}의 차례', { nickname: '바다' }), '바다의 차례');
assert.equal(S.fill('{@이} 왔다. {@을} 보라.', { nickname: '솔밭' }), '솔밭이 왔다. 솔밭을 보라.');
// 교사 모드나 별명이 없으면 호칭 '통사'
const call = S.t('call');
assert.equal(call, '통사');
assert.equal(S.fill('{@아}', { nickname: '하늘', teacher: true }), '통사야');
assert.equal(S.fill('{@이} 왔다', { nickname: '' }), '통사가 왔다');
assert.equal(S.callName({ nickname: '하늘', teacher: true }), '통사');
assert.equal(S.callName({ nickname: '하늘' }), '하늘');
// 루비·옛한글 표기는 건드리지 않는다
assert.equal(S.fill('{世|셰}{@아} [ㅁㆍㄹ]', { nickname: '바다' }), '{世|셰}바다야 [ㅁㆍㄹ]');

// ── 화면 문구 ──
assert.equal(S.t('seen', { n: 1, need: 2 }).includes('1'), true);
assert.equal(typeof S.t('btn.confirm'), 'string');
assert.ok(S.t('btn.confirm').length > 0);
const before = ctx.__nmErrors.length;
assert.equal(S.t('no.such.key'), '');
assert.equal(ctx.__nmErrors.length, before + 1, '없는 문구 열쇠는 오류로 모은다');
// 이 파일은 NM.data.TEXT 를 덮어쓰지 않고 합친다
const ctx2 = load(['js/core/ns.js'], {});
ctx2.NM.data.TEXT = { ui: { a: 1 } };
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { ROOT } = await import('../lib/load.mjs');
const vm = (await import('node:vm')).default;
vm.runInContext(readFileSync(join(ROOT, 'js/data/text-stage.js'), 'utf8'), ctx2);
assert.equal(ctx2.NM.data.TEXT.ui.a, 1);
assert.ok(ctx2.NM.data.TEXT.stage);

console.log('d1 text ok');
