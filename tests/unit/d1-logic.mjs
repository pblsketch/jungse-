// D1 장면 진행기의 순수 부분: 학교급별 판 고르기, 목표 맥락, 아직 확인하지 않은 규칙,
// 기믹 판정 접점, 확정한 말 풀이 목록, 방점 늘 켬, 시험 장면 모양 (spec §5, §11, §19-3)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const SCRIPTS = [
  'js/core/ns.js', 'js/data/stages.js', 'js/data/rules-config.js', 'js/data/profanity.js', 'js/data/jamo.js',
  'js/core/yet.js', 'js/core/rules.js', 'js/core/nickname.js', 'js/core/save.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-gimmick.js',
  'tests/fixtures/d1-scene.js', 'tests/fixtures/d1-gimmick.js'
];
const ctx = load(SCRIPTS);
const NM = ctx.NM;
const L = NM.ui.stageLogic;
const J = (x) => JSON.parse(JSON.stringify(x));
assert.ok(L, 'NM.ui.stageLogic 가 있어야 한다');

const base = NM.data.SCENES.s6;

// ── 시험 장면 모양: 해독 항목마다 카드 3~4장·정답 1장·맥락 2곳 이상 ──
for (const it of base.items) {
  if (it.kind !== 'read') { assert.ok(it.gimmick && it.answer !== undefined, it.id); continue; }
  assert.ok(it.cards.length >= 3 && it.cards.length <= 4, it.id);
  assert.equal(it.cards.filter(c => c.correct).length, 1, it.id);
  assert.ok(L.contextsOf(base, it.id).length >= 2, it.id);
}

// ── 학교급별 판: editions[level] 이 있으면 그 필드가 덮는다(원본은 그대로) ──
const withEd = Object.assign({}, base, { editions: { m: { title: '중학교판', items: [base.items[3]] } } });
const m = L.resolveScene(withEd, 'm');
assert.equal(m.title, '중학교판');
assert.equal(m.items.length, 1);
assert.equal(m.id, 's6');
assert.equal(withEd.title, '시험 장면', '원본을 바꾸지 않는다');
assert.equal(L.resolveScene(withEd, 'h1').title, '시험 장면');
assert.equal(L.resolveScene(withEd, 'h1').editions, undefined, '판 정보는 결과에서 뺀다');

// ── 방점 늘 켬: s4·s10 또는 bangjeomAlways ──
assert.equal(L.bangjeomFor('s4', {}, { bangjeom: false }), true);
assert.equal(L.bangjeomFor('s10', {}, { bangjeom: false }), true);
assert.equal(L.bangjeomFor('s6', {}, { bangjeom: false }), false);
assert.equal(L.bangjeomFor('s6', {}, { bangjeom: true }), true);
assert.equal(L.bangjeomFor('s6', { bangjeomAlways: true }, { bangjeom: false }), true);

// ── 저장소와 함께: 목표 맥락, 확정한 말 ──
const mem = new Map();
const storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };
const store = NM.core.save.createStore({ storage, urlLevel: 'm' });
const scene = L.resolveScene(base, 'm');
const core = store.coreItems(scene);
assert.deepEqual(J(core.map(i => i.id)), ['s6.r1', 's6.r2', 's6.t1'], '중학교: r3 은 핵심이 아니다');
assert.deepEqual(J(L.nonCoreItems(scene, core).map(i => i.id)), ['s6.r3']);

// 처음: 모든 맥락이 목표
assert.deepEqual(J(L.objectives(scene, store.stage('s6'), core)), ['s6.c1', 's6.c2', 's6.c3', 's6.c4']);
store.seeContext(scene, 's6.c1');
// c1 을 보면 r1·r2 모두 c1 을 봤다 → c1 은 목표에서 빠진다
assert.deepEqual(J(L.objectives(scene, store.stage('s6'), core)), ['s6.c2', 's6.c3', 's6.c4']);
store.seeContext(scene, 's6.c2');
store.choose(scene, 's6.r1', 's6.r1.b');
store.confirm(scene, 's6.r1');
// r1 확정 → c2 는 r1 만 담으므로 빠지고, r2 를 위한 c3·c4 만 남는다
assert.deepEqual(J(L.objectives(scene, store.stage('s6'), core)), ['s6.c3', 's6.c4']);
// r2 가 두 곳을 보면 목표 없음
store.seeContext(scene, 's6.c3');
assert.deepEqual(J(L.objectives(scene, store.stage('s6'), core)), []);

const solved = J(L.solvedWords(scene, store.stage('s6')));
assert.deepEqual(solved, [{ itemId: 's6.r1', forms: [':[ㅁㆍㄹ]'], gloss: '말' }]);

// ── 아직 확인하지 않은 규칙 ──
let unk = J(L.unknownRules(scene, store.get(), 'm'));
assert.equal(unk.length, 1);
assert.equal(unk[0].rule, 'rule.prev');
assert.equal(unk[0].stage, 's4');
assert.equal(unk[0].name, '앞 규칙');
assert.ok(unk[0].stageName.includes('4'), unk[0].stageName);
// 같은 학교급의 다른 장면에서 그 규칙 카드를 얻었으면 안다
const s4 = L.resolveScene(NM.data.SCENES.s4, 'm');
const fake = store.get();
fake.progress.m.s4 = { status: 'done', items: {}, rules: ['rule.prev'], translations: [], reflection: '' };
assert.equal(L.unknownRules(scene, fake, 'm').length, 0);
assert.equal(L.unknownRules(scene, fake, 'h1').length, 1, '학교급별로 따로 센다');
// 규칙 카드 목록이 없어도 던지지 않는다
const savedCards = NM.data.RULE_CARDS;
NM.data.RULE_CARDS = undefined;
unk = J(L.unknownRules(scene, store.get(), 'm'));
assert.equal(unk.length, 1);
assert.equal(unk[0].stage, null);
NM.data.RULE_CARDS = savedCards;
void s4;

// ── 기믹 접점과 판정 ──
const G = NM.gimmicks;
assert.equal(typeof G.register, 'function');
assert.ok(G.get('d1-test'), '시험 기믹이 등록돼 있다');
const t1 = scene.items.find(i => i.id === 's6.t1');
assert.deepEqual(J(L.judge(G.get('d1-test'), 2, t1)), { correct: true, wrong: null });
assert.deepEqual(J(L.judge(G.get('d1-test'), 3, t1)), { correct: false, wrong: 3 }, 'check 가 돌려준 틀린 부분');
// check 가 없으면 answer 와 깊은 비교(키 순서 무관)
const plainDef = { mount() {} };
assert.equal(L.judge(plainDef, { a: 1, b: [1, 2] }, { answer: { b: [1, 2], a: 1 } }).correct, true);
assert.equal(L.judge(plainDef, { a: 1, b: [2, 1] }, { answer: { b: [1, 2], a: 1 } }).correct, false);
// check 가 던지면 판정하지 않는다(error)
const before = ctx.__nmErrors.length;
const bad = L.judge({ check() { throw new Error('x'); } }, 1, t1);
assert.equal(bad.error, true);
assert.equal(ctx.__nmErrors.length, before + 1);
ctx.__nmErrors.length = before;
// 같은 이름 다시 등록 → 나중 것, 잘못된 정의는 거절
assert.equal(G.register('bad', null), false);
assert.equal(G.register('', { mount() {} }), false);
assert.equal(G.register('x-test', { mount() {} }), true);
assert.ok(G.list().includes('x-test'));

// ── 장면 이름 ──
assert.ok(L.stageName('s0').length > 0);
assert.ok(L.stageName('s12').length > 0);
assert.notEqual(L.stageName('s0'), L.stageName('s12'));

assert.equal(ctx.__nmErrors.length, 0, JSON.stringify(ctx.__nmErrors));
console.log('d1 logic ok');
