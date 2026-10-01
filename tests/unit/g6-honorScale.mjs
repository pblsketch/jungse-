// G6 기믹 '높임 저울'(honorScale)의 순수 부분: 활자 목록(데이터 표기·높이는 자리), 原文 줄 → 글자 번호(README 자리 후보가
// 가리키는 글자가 맞는지), 판정(인물·활자 따로 틀린 곳), 진행기 판정 접점, 시험 장면 자리 범위
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/core/rules.js', 'js/data/rules-config.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-gimmick.js',
  'js/data/orig.generated.js', 'js/data/text-g-honorScale.js', 'js/gimmicks/honorScale.js'
]);
const NM = ctx.NM;
const Y = NM.core.yet;
const J = (x) => JSON.parse(JSON.stringify(x));
const def = NM.gimmicks.get('honorScale');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'honorScale 가 등록되어야 한다');
const G = def.logic;

// ── 활자 목록 ──
const T = NM.data.TEXT.g.honorScale;
assert.deepEqual(J(T.order), ['si', 'sya', 'sab', 'jab', 'zab', 'ii']);
const kinds = {}; T.order.forEach(id => { kinds[id] = T.endings[id].kind; });
assert.deepEqual(J(kinds), { si: 'subject', sya: 'subject', sab: 'object', jab: 'object', zab: 'object', ii: 'listener' });
assert.equal(Y.render(T.endings.sab.label), '-ᄉᆞᆸ-', '-ᄉᆞᆸ-');
assert.equal(Y.render(T.endings.jab.label), '-ᄌᆞᆸ-', '-ᄌᆞᆸ-');
assert.equal(Y.render(T.endings.zab.label), '-ᅀᆞᆸ-', '-ᅀᆞᆸ-');
assert.equal(Y.render(T.endings.ii.label), '-ᅌᅵ-', '-ᅌᅵ-');
for (const k of ['speaker', 'subject', 'object', 'listener']) { assert.equal(typeof T.roles[k], 'string'); assert.equal(typeof T.roleHelp[k], 'string'); }
for (const k of ['frame', 'frameDone', 'slot', 'slotEmpty', 'slotFilled', 'step1', 'step2', 'pickFirst', 'tray', 'scale', 'scaleEmpty', 'scaleTilted', 'honored', 'submit', 'wrongMark', 'hintMark', 'answerMark']) assert.equal(typeof T[k], 'string', k);

// ── README 자리 후보: 글자 번호가 가리키는 글자 ──
const unit = (id, i) => G.unitsOf(NM.data.ORIG[id].lines[0]).units[i].text;
const R = (s) => Y.render(s, { bangjeom: true });
const cases = [
  ['O-s7-SS6b', 6, '·샤'], ['O-s7-SS6b', 10, '[ㅿㆍㅂ]'], ['O-s7-SS6b', 9, '·[ㅎㆍ]'],
  ['O-s7-SS6h', 6, '[ㅿㆍ]'], ['O-s7-SS6h', 7, '·[ㅸㅗ]'], ['O-s7-SS6h', 9, '[ㆁㅣ]'],
  ['O-s7-WS1a', 13, '[ㅿㆍ]'], ['O-s7-WS1a', 14, '·[ㅸㅏ]'],
  ['O-s7-WS1j', 5, '[ㅿㆍ]'], ['O-s7-WS1j', 11, '[ㅈㆍ]'], ['O-s7-WS1j', 12, '·[ㅸㆍㅭ]'],
  ['O-s7-YB29', 8, '·[ㅅㆍ]'], ['O-s7-YB29', 9, '[ㅸㆍ]'],
  ['O-s7-YB63', 4, '[ㅈㆍ]'], ['O-s7-YB63', 7, '[ㆁㅣ]'],
  ['O-s4-YB34a', 21, '시'], ['O-s4-YB34a', 23, '[ㆁㅣ]']
];
for (const [id, i, want] of cases) assert.equal(R(unit(id, i)), R(want), `${id} 글자 ${i}`);
assert.equal(G.unitsOf(NM.data.ORIG['O-s7-SS6b'].lines[0]).units.length, 17);
assert.deepEqual(J(G.unitsOf(NM.data.ORIG['O-s7-SS6b'].lines[0]).spaces), [1, 3, 7, 11]);
assert.ok(unit('O-s7-SS6b', 8).startsWith('{'), '루비 한 덩이가 한 글자');

// 시험 장면의 자리도 같은 글자를 가리킨다
const fx = load(['js/core/ns.js', 'tests/fixtures/g-honorScale.js']).NM.data.SCENES.s7;
const sl = fx.items[0].config.slots;
assert.equal(R(unit(sl[0].block, sl[0].slot[0])), R('·샤'));
assert.equal(R(unit(sl[1].block, sl[1].slot[0])), R('[ㅿㆍㅂ]'));

// ── 판정 ──
const item = { answer: { a: { honored: 'subject', ending: 'sya' }, b: { honored: 'object', ending: 'zab' } } };
assert.equal(def.check({ a: { honored: 'subject', ending: 'sya' }, b: { honored: 'object', ending: 'zab' } }, item), true);
let r = def.check({ a: { honored: 'subject', ending: 'si' }, b: { honored: 'subject', ending: 'sab' } }, item);
assert.deepEqual(J(r), { correct: false, wrong: { a: ['ending'], b: ['honored', 'ending'] } });
r = def.check({ a: { honored: null, ending: null } }, item);
assert.deepEqual(J(r.wrong), { a: ['honored', 'ending'], b: ['honored', 'ending'] });
const j = NM.ui.stageLogic.judge(def, { a: { honored: 'object', ending: 'sya' }, b: { honored: 'object', ending: 'zab' } }, item);
assert.equal(j.correct, false);
assert.deepEqual(J(j.wrong), { a: ['honored'] });
assert.deepEqual(J(ctx.window.__nmErrors), [], '오류 모음 없음');
console.log('g6-honorScale: ok');
