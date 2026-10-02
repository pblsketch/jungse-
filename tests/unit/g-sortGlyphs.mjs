// G1 기믹 sortGlyphs 의 순수 부분: 사실 표(28자 / 사라진 4자 / 28자 밖 ㅸ), 정답 만들기, 판정·틀린 글자 목록,
// 문구 데이터의 글자 표, 시험 장면의 answer 가 사실 표와 같은지 (spec §7 서장, §13 판정은 id)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/ui/stage-gimmick.js', 'js/data/text-g-sortGlyphs.js', 'js/gimmicks/sortGlyphs.js',
  'tests/fixtures/g-sortGlyphs.js'
]);
const NM = ctx.NM;
const J = (x) => JSON.parse(JSON.stringify(x));
const def = NM.gimmicks.get('sortGlyphs');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'sortGlyphs 가 등록되어야 한다');
const F = def.facts;
const T = NM.data.TEXT.g.sortGlyphs;

// ── 사실 표: 28자 + ㅸ, 사라진 4자, 28자 밖 ──
assert.equal(F.ALL.length, 29, '28자 + ㅸ');
assert.deepEqual(F.ALL.filter(id => id !== 'bv').map(id => T.glyphs[id]).join(''),
  'ㄱㅋㆁㄷㅌㄴㅂㅍㅁㅈㅊㅅㆆㅎㅇㄹㅿㆍㅡㅣㅗㅏㅜㅓㅛㅑㅠㅕ', '첫소리 17자 + 가운뎃소리 11자 순서');
assert.equal(F.ALL.filter(id => F.category(id) !== 'outside').length, 28);
assert.deepEqual(J(F.LOST.map(id => T.glyphs[id]).sort()), ['ㆁ', 'ㆆ', 'ㆍ', 'ㅿ'].sort(), '사라진 4자');
assert.equal(T.glyphs.bv, 'ㅸ');
assert.equal(F.category('bv'), 'outside');
assert.equal(F.category('z'), 'lost');
assert.equal(F.category('g'), 'known');
assert.equal(F.category('nope'), null);
for (const id of F.ALL) assert.equal(typeof T.glyphs[id], 'string', '글자 표에 ' + id);
for (const b of F.BINS) assert.ok(T.bins[b].name && T.bins[b].desc, '칸 문구 ' + b);

// ── 기본 글자 묶음: 사라진 4자와 ㅸ 이 모두 들어 있다 ──
for (const id of F.LOST.concat(F.OUTSIDE)) assert.ok(F.DEFAULT.includes(id), 'DEFAULT 에 ' + id);
assert.deepEqual(J(F.glyphsOf({})), J(F.DEFAULT));
assert.deepEqual(J(F.glyphsOf({ glyphs: ['g', 'g', 'bv'] })), ['g', 'bv'], '겹친 id 는 한 번');
const before = ctx.__nmErrors.length;
assert.deepEqual(J(F.glyphsOf({ glyphs: ['g', 'xx'] })), ['g'], '모르는 id 는 뺀다');
assert.equal(ctx.__nmErrors.length, before + 1, '모르는 id 는 오류 모음에 알린다');
ctx.__nmErrors.length = before;

// ── 판정 ──
const item = NM.data.SCENES.s0.items[0];
assert.deepEqual(J(F.answerFor(item.config)), J(item.answer), '시험 장면 answer 는 사실 표와 같다');
assert.equal(def.check(J(item.answer), item), true);
const bad = Object.assign(J(item.answer), { bv: 'lost', z: 'known' });
assert.deepEqual(J(def.check(bad, item)), { correct: false, wrong: ['z', 'bv'] }, '틀린 글자 id 목록(글자 순서)');
const partial = J(item.answer); delete partial.ng;
assert.deepEqual(J(def.check(partial, item)), { correct: false, wrong: ['ng'] }, '빠진 글자도 틀림');
assert.equal(def.check(Object.assign(J(item.answer), { extra: 'known' }), item), true, '쓸데없는 열쇠는 보지 않는다');
assert.equal(def.check(null, item).correct, false);
assert.equal(def.check('x', { config: {} }).wrong.length, F.DEFAULT.length);

// ── 단계 나눠 가르기(config.steps) ──
const stepped = NM.data.SCENES.s0.items.filter(i => i.id === 's0.t3')[0];
const st = F.stepsOf(stepped.config);
assert.equal(st.length, 2, '두 단계');
assert.deepEqual(J(st[0].bins), ['known', 'unknown']);
assert.equal(st[0].rest, 'unknown');
assert.deepEqual(J(st[1].bins), ['known', 'lost', 'outside'], '마지막 단계 칸 기본값 = 세 칸');
assert.equal(st[0].say.length, 1, '대사 줄 하나도 배열로');
assert.deepEqual(J(F.glyphsOf(stepped.config)), ['g', 'va', 'araea', 'bv', 'z', 'n', 'q', 'ng'], '단계 글자를 차례로 모은다');
assert.deepEqual(J(F.answerFor(stepped.config)), J(stepped.answer), '단계 과제의 answer 도 사실 표와 같다(모든 단계 글자)');
assert.equal(def.check(J(stepped.answer), stepped), true, '판정은 모든 단계 글자로');
assert.deepEqual(J(def.check(Object.assign(J(stepped.answer), { araea: 'outside' }), stepped)), { correct: false, wrong: ['araea'] });
assert.equal(F.binFor('araea', ['known', 'unknown']), 'unknown', '한 칸 모르는 글자 = lost + outside');
assert.equal(F.binFor('bv', ['known', 'unknown']), 'unknown');
assert.equal(F.binFor('g', ['known', 'unknown']), 'known');
assert.equal(F.binFor('araea', ['known', 'lost', 'outside']), 'lost');
assert.deepEqual(J(F.stepsOf({})), [{ glyphs: J(F.DEFAULT), bins: ['known', 'lost', 'outside'], say: [], done: [], rest: null }], 'steps 없으면 한 단계');
let b0 = ctx.__nmErrors.length;
assert.deepEqual(J(F.stepsOf({ steps: [{ glyphs: ['g', 'xx'] }, { glyphs: ['g', 'bv'], bins: ['known', 'unknown'] }] }).map(s => [s.glyphs, s.bins])),
  [[['g'], ['known', 'unknown']], [['bv'], ['known', 'lost', 'outside']]], '모르는 id 는 빼고, 겹친 글자는 처음 단계에만, 마지막 단계는 세 칸');
assert.equal(ctx.__nmErrors.length, b0 + 2, '모르는 id·마지막 단계 칸 모자람을 오류 모음에 알린다');
ctx.__nmErrors.length = b0;

// ── 진짜 서장 장면(js/data/scenes/s0.js): 두 단계, 첫 단계 = ㄱ ㅏ ㆍ, 정답 = 사실 표 ──
const real = load(['js/core/ns.js', 'js/ui/stage-gimmick.js', 'js/data/text-g-sortGlyphs.js', 'js/gimmicks/sortGlyphs.js', 'js/data/scenes/s0.js']);
const RF = real.NM.gimmicks.get('sortGlyphs').facts;
const rt = real.NM.data.SCENES.s0.items.filter(i => i.id === 's0.t1')[0];
const rs = RF.stepsOf(rt.config);
assert.equal(rs.length, 2, '서장 과제는 두 단계');
assert.deepEqual(J(rs[0].glyphs), ['g', 'va', 'araea'], '첫 단계: ㄱ ㅏ ㆍ');
assert.deepEqual(J(rs[0].bins), ['known', 'unknown'], '첫 단계: 두 칸');
assert.ok(rs[1].glyphs.includes('bv') && rs[1].glyphs[0] === 'bv', '둘째 단계는 ㅸ 부터(미리 골라지는 글자 = 대사의 ㅸ)');
assert.deepEqual(J(RF.answerFor(rt.config)), J(rt.answer), '서장 answer = 사실 표');
for (const id of RF.LOST.concat(RF.OUTSIDE)) assert.ok(RF.glyphsOf(rt.config).includes(id), '서장 과제에 ' + id);
assert.equal(real.__nmErrors.length, 0, '서장 데이터 오류 없음');

console.log('g-sortGlyphs: ok');
