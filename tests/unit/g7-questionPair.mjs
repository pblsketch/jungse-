// G7 질문 짝 맞추기(questionPair)의 순수 부분: 판정(check)·틀린 칸, 原文 조각 나누기와 낱말 찾기(공용 g789).
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/data/orig.generated.js', 'js/ui/stage-gimmick.js',
  'js/data/text-g-questionPair.js', 'js/gimmicks/g789-origwords.js', 'js/gimmicks/questionPair.js',
  'tests/fixtures/g-questionPair.js'
]);
const NM = ctx.NM;
const G = NM.g789;
const def = NM.gimmicks.get('questionPair');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', '기믹이 등록되어야 한다');
const item = NM.data.SCENES.s8.items[0];
const J = (x) => JSON.parse(JSON.stringify(x));

// ── 판정 ──
assert.equal(def.check(J(item.answer), item), true, '정답 그대로면 참');
const one = J(item.answer); one.q2.kind = 'yesno';
assert.deepEqual(J(def.check(one, item)), { correct: false, wrong: { q2: ['kind'] } }, '틀린 칸만 알린다');
const many = J(item.answer); many.q1.pair = 'a2'; many.q1.ending = 'go'; many.q3.kind = 'wh';
assert.deepEqual(J(def.check(many, item)), { correct: false, wrong: { q1: ['pair', 'ending'], q3: ['kind'] } });
assert.deepEqual(J(def.check({}, item)).wrong.q1, ['pair', 'kind', 'ending'], '고르지 않은 칸도 틀림');
assert.deepEqual(J(def.check(null, item)).correct, false);
const extra = J(item.answer); extra.q1.note = 'x'; extra.zz = { kind: 'wh' };
assert.equal(def.check(extra, item), true, 'item.answer 에 없는 칸은 보지 않는다');
const noPair = { id: 'x', answer: { q1: { kind: 'second', ending: 'nda' } } };
assert.equal(def.check({ q1: { kind: 'second', ending: 'nda', pair: null } }, noPair), true, '대답 카드가 없으면 짝은 보지 않는다');

// ── 원문 조각: 모든 原文 줄이 글자 그대로 다시 이어지고, 조각마다 조합된다 ──
for (const [id, b] of Object.entries(NM.data.ORIG)) {
  for (const line of b.lines) {
    const ps = G.pieces(line);
    assert.equal(ps.join(''), line, id + ' 조각을 이으면 原文 그대로');
    for (const p of ps) NM.core.yet.render(p, { bangjeom: true });
  }
}
// 방점은 뒤 음절에 붙고, 루비는 한 조각, 빈칸은 자리로 세지 않는다
assert.deepEqual(J(G.pieces(':엇·뎨 게')), [':엇', '·뎨', ' ', '게']);
assert.deepEqual(J(G.pieces('{法|·법}·을')), ['{法|·법}', '·을']);
assert.equal(G.places(':엇·뎨 게').length, 3);
const ss68 = NM.data.ORIG['O-s8-SS68'].lines[0];
assert.deepEqual(J(G.locate(ss68, { match: ':네' })), { from: 0, to: 1 }, ':네 첫 번째');
assert.equal(G.locate(ss68, { match: ':녜' }).from, 6, '빈칸 조각도 조각 번호에는 든다');
assert.equal(G.locate(ss68, { match: '네' }), null, '방점까지 같아야 찾는다');
assert.deepEqual(J(G.locate(ss68, { at: [0, 1] })), { from: 0, to: 1 });
assert.equal(G.locate(ss68, { at: [99, 1] }), null);
// 낱말이 모두 찾아지고 겹치지 않는다(시험 장면)
const before = ctx.__nmErrors.length;
for (const q of item.config.questions) {
  const segs = G.segment(NM.data.ORIG[q.orig].lines[0], q.words);
  for (const w of q.words) assert.ok(segs.some(s => s.wordId === w.id), w.id + ' 찾음');
  assert.equal(segs.map(s => s.text).join(''), NM.data.ORIG[q.orig].lines[0]);
}
assert.equal(ctx.__nmErrors.length, before, '낱말 찾기 오류 없음');
G.segment(ss68, [{ id: 'a', match: ':네' }, { id: 'b', at: [0, 2] }]);
assert.ok(ctx.__nmErrors.length > before && /overlap/.test(ctx.__nmErrors[ctx.__nmErrors.length - 1].message), '겹치면 알린다');
G.segment(ss68, [{ id: 'zz', match: '없는말' }]);
assert.ok(/not found/.test(ctx.__nmErrors[ctx.__nmErrors.length - 1].message), '못 찾으면 알린다');

// ── 문구: 학교급 덮기 ──
NM.data.TEXT.g.questionPair.levels.m = { kinds: { yesno: 'M' } };
assert.equal(G.textOf('questionPair', 'm')('kinds.yesno'), 'M');
assert.equal(G.textOf('questionPair', 'h23')('kinds.yesno'), NM.data.TEXT.g.questionPair.kinds.yesno);
assert.equal(G.textOf('questionPair', 'h1')('question', { n: 2 }).includes('2'), true);
console.log('g7-questionPair ok');

// ── README 의 예 항목이 그대로 돈다: 原文 블록이 있고 낱말이 모두 찾아지며, 정답이 check 를 통과한다 ──
{
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { ROOT } = await import('../lib/load.mjs');
  const vm = await import('node:vm');
  const md = readFileSync(join(ROOT, 'js/gimmicks/README-questionPair.md'), 'utf8');
  const code = /```js\n([\s\S]*?)```/g;
  const blocks = [...md.matchAll(code)].map(m => m[1]).filter(s => s.trim().startsWith('{') && s.includes('gimmick:'));
  assert.equal(blocks.length, 1, 'README 예 항목 1개');
  const ex = vm.runInContext('(' + blocks[0] + ')', ctx);
  const n0 = ctx.__nmErrors.length;
  for (const q of ex.config.questions) {
    for (const b of [].concat(q.orig)) assert.ok(NM.data.ORIG[b], b);
    for (const w of q.words) {
      const b = w.block || [].concat(q.orig)[0];
      assert.ok(G.locate(NM.data.ORIG[b].lines[w.line || 0], w), 'README 낱말 ' + w.id);
    }
  }
  for (const a of ex.config.answers) if (a.orig) assert.ok(NM.data.ORIG[a.orig], a.orig);
  assert.equal(def.check(JSON.parse(JSON.stringify(ex.answer)), ex), true);
  assert.equal(ctx.__nmErrors.length, n0);
  console.log('g7-questionPair README example ok');
}
