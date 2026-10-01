// G11 기믹 'wordRiver' 순수 부분: 판정(check)·틀린 부분 모양(나루 번호, 잘못 고른 보기, 빠진 수), 조각 id, 정해진 섞기, 문구
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js',
  'js/data/text-g-wordRiver.js', 'js/ui/stage-gimmick.js', 'js/gimmicks/wordRiver.js',
  'tests/fixtures/g-wordRiver.js'
]);
const NM = ctx.NM;
const def = NM.gimmicks.get('wordRiver');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'registered with mount + check');
const L = def.logic;
const J = (x) => JSON.parse(JSON.stringify(x));
const item = NM.data.SCENES.s12.items[0];

// ── 판정 ──
assert.equal(def.check(J(item.answer), item), true, 'exact answer');
assert.equal(def.check({ now: ['n3', 'n1', 'n2'], order: J(item.answer.order) }, item), true, 'now is a set (order of picks does not matter)');
assert.equal(def.check(Object.assign(J(item.answer), { predict: '아무 글' }), item), true, 'extra fields (e.g. a prediction) are ignored — never graded');
{
  const a = J(item.answer);
  a.order.jopssal = ['jopssal.0', 'jopssal.2', 'jopssal.1', 'jopssal.3'];
  a.now = ['n1', 'n2', 'n4'];
  const r = def.check(a, item);
  assert.equal(r.correct, false);
  assert.deepEqual(J(r.wrong), { order: { jopssal: [2, 3] }, now: { extra: ['n4'], missing: 1 } });
}
{
  const r = def.check({}, item);
  assert.equal(r.correct, false);
  assert.deepEqual(J(r.wrong.order), { anpak: [1, 2], jopssal: [1, 2, 3, 4], sukgarak: [1, 2, 3], salkogi: [1, 2] });
  assert.equal(r.wrong.now.missing, 3);
}
assert.equal(def.check(null, item).correct, false, 'null answer is wrong, not a throw');
// 뒤집은 차례(뒤 → 앞)는 틀림: 순서를 판정한다
assert.deepEqual(J(def.check({ order: Object.assign(J(item.answer.order), { anpak: ['anpak.1', 'anpak.0'] }), now: ['n1', 'n2', 'n3'] }, item).wrong.order), { anpak: [1, 2] });
// now 가 없는 과제는 now 를 보지 않는다
const t2 = NM.data.SCENES.s12.items[1];
assert.equal(def.check({ order: { sk: ['sk.0', 'sk.1', 'sk.2'] } }, t2), true);
assert.deepEqual(J(def.check({ order: { sk: ['sk.1', 'sk.0', 'sk.2'] } }, t2).wrong), { order: { sk: [1, 2] }, now: { extra: [], missing: 0 } });

// ── 조각 id: forms 차례대로 '<낱말>.<k>' — 정답 id 가 모두 실제 조각(장면 작성 점검) ──
for (const w of item.config.words) {
  const ids = J(L.chipsOf(w)).map(c => c.id);
  assert.deepEqual(ids, J(w.forms).map((_, k) => w.id + '.' + k));
  assert.deepEqual(J(item.answer.order[w.id]), ids, w.id + ': answer = forms in order');
}
// ── 섞기 ──
const ids = ['a.0', 'a.1', 'a.2', 'a.3'];
assert.deepEqual(J(L.seededShuffle(ids, 's12.t1:jopssal')), J(L.seededShuffle(ids, 's12.t1:jopssal')));
for (let i = 0; i < 40; i++) {
  const s = J(L.seededShuffle(['x', 'y'], 'k' + i));
  assert.notDeepEqual(s, ['x', 'y'], 'two forms are never shown in the right order');
}

// ── 문구 ──
const TX = NM.data.TEXT.g.wordRiver;
for (const k of ['orderTitle', 'orderHelp', 'upstream', 'downstream', 'arrow', 'stopLabel', 'wordLabel', 'wordN', 'empty', 'poolLabel', 'poolEmpty',
  'nowTitle', 'nowHelp', 'missing', 'predictTitle', 'predictHelp', 'predictNote', 'predictPlaceholder', 'submit', 'needAll']) assert.equal(typeof TX[k], 'string', k);
for (const k of ['wrong', 'hint', 'answer', 'done']) assert.equal(typeof TX.marks[k], 'string', k);
assert.ok(!/\d{3,4}\s*년도?\b|세기/.test(TX.orderHelp + TX.orderTitle), 'river text does not ask for years');
const walk = (o) => Object.values(o).forEach(v => (typeof v === 'string' ? NM.core.yet.render(v) : walk(v)));
walk(TX);
// 시험 장면의 옛 꼴이 데이터 표기로 렌더된다
for (const w of item.config.words) for (const f of w.forms) NM.core.yet.render(f);
assert.equal(ctx.__nmErrors.length, 0, JSON.stringify(ctx.__nmErrors));
console.log('PASS g11-word-river');
