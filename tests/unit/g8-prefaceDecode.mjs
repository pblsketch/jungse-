// G8 종합 해독(prefaceDecode)의 순수 부분: 판정(고등판·중학교판), 틀린 곳 모양, 규칙 카드 정보, README 예 항목.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { load, ROOT } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/stages.js', 'js/data/rules-config.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/core/rules.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js',
  'js/data/orig.generated.js', 'js/ui/stage-gimmick.js',
  'js/data/text-g-prefaceDecode.js', 'js/gimmicks/g789-origwords.js', 'js/gimmicks/prefaceDecode.js',
  'tests/fixtures/g-prefaceDecode.js'
]);
const NM = ctx.NM;
const G = NM.g789;
const def = NM.gimmicks.get('prefaceDecode');
assert.ok(def && def.mount && def.check);
const J = (x) => JSON.parse(JSON.stringify(x));
const item = NM.data.SCENES.s9.items[0];
const A = item.answer;
const high = () => J({ decode: A.decode, order: A.order, spirits: A.spirits });

// ── 고등판 ──
assert.equal(def.check(high(), item), true, '고등판 정답(modernSpirits 없음)은 참 — 중학교판 칸은 보지 않는다');
let x = high(); x.decode['p1.w2'] = 'p1.w2.b';
assert.deepEqual(J(def.check(x, item)), { correct: false, wrong: { decode: ['p1.w2'] } });
x = high(); x.order.p1 = ['p1.k2', 'p1.k1'];
assert.deepEqual(J(def.check(x, item)), { correct: false, wrong: { order: { p1: [0, 1] } } }, '틀린 자리 번호');
x = high(); x.order.p1 = ['p1.k1'];
assert.deepEqual(J(def.check(x, item)).wrong, { order: { p1: [1] } }, '덜 놓은 자리도 틀림');
x = high(); x.order.p2 = ['p2.k1', 'p2.k2', 'p1.kx'];
assert.deepEqual(J(def.check(x, item)).wrong, { order: { p2: [2] } }, '헛조각을 더 놓아도 틀림');
x = high(); x.spirits.p2 = 'none';
assert.deepEqual(J(def.check(x, item)).wrong, { spirits: ['p2'] });
assert.equal(def.check({}, item).correct, false);
// ── 중학교판 ──
assert.equal(def.check({ modernSpirits: J(A.modernSpirits) }, item), true, '중학교판 답은 modernSpirits 만 본다');
assert.deepEqual(J(def.check({ modernSpirits: { m1: 'jaju', m2: 'silyong', m3: null } }, item)).wrong, { modernSpirits: ['m2', 'm3'] });
const t2 = NM.data.SCENES.s9.items[1];
assert.equal(def.check({}, t2).correct, false, '중학교판 정답만 있는 항목에 빈 답 → 틀림');
assert.deepEqual(J(def.check({}, t2)).wrong, { modernSpirits: ['m1'] });

// ── 규칙 카드 정보 / 수첩 규칙(없으면 빈 목록) ──
const ki = G.ruleInfo('rule.g8unknown');
assert.equal(ki.name, '시험 규칙 나');
assert.equal(ki.stage, 's4');
assert.ok(ki.stageName && ki.stageName.includes('4'), '배우는 장면 이름');
assert.equal(G.ruleInfo('rule.none').name, null, '목록에 없으면 이름 없음(막지 않음)');
assert.deepEqual(J(G.knownRules({})), [], 'NM.ui.app 이 없으면 빈 목록');
assert.deepEqual(J(G.knownRules({ knownRules: ['a'] })), ['a']);
ctx.NM.ui.app = { started: true, store: () => ({ level: 'h1', get: () => ({ progress: { h1: { s6: { rules: ['rule.g8known'] } } } }) }) };
assert.deepEqual(J(G.knownRules({})), ['rule.g8known'], '수첩 기록에서 규칙을 읽는다');
delete ctx.NM.ui.app;

// ── 시험 장면 낱말 찾기 ──
const n0 = ctx.__nmErrors.length;
for (const p of item.config.phrases) for (const w of p.words) assert.ok(G.wordText(NM.data.ORIG[p.orig].lines[0], w), p.id + ' ' + w.id);
assert.equal(G.wordText(NM.data.ORIG['O-s9-SEOMUN1'].lines[0], { match: '나·랏' }), '나·랏');
assert.equal(ctx.__nmErrors.length, n0);

// ── README 예 항목: 블록·낱말·규칙 칸·정답이 맞물린다 ──
const md = readFileSync(join(ROOT, 'js/gimmicks/README-prefaceDecode.md'), 'utf8');
const blocks = [...md.matchAll(/```js\r?\n([\s\S]*?)```/g)].map(m => m[1]).filter(s => s.trim().startsWith('{') && s.includes('gimmick:'));
assert.ok(blocks.length >= 2, 'README 예 항목(고등판·중학교판)');
for (const b of blocks) {
  const ex = vm.runInContext('(' + b + ')', ctx);
  for (const p of (ex.config.phrases || [])) {
    assert.ok(NM.data.ORIG[p.orig], p.orig);
    if (p.hanmun) assert.ok(NM.data.ORIG[p.hanmun], p.hanmun);
    for (const w of p.words) assert.ok(G.wordText(NM.data.ORIG[p.orig].lines[w.line || 0], w), 'README 낱말 ' + w.id);
    for (const d of (p.decode || [])) {
      assert.ok(p.words.some(w => w.id === d.word), d.word);
      assert.ok(d.cards.some(c => c.id === ex.answer.decode[d.word]), '정답 카드 ' + d.word);
    }
    if (p.pieces) for (const k of ex.answer.order[p.id]) assert.ok(p.pieces.some(q => q.id === k), k);
  }
  const ans = JSON.parse(JSON.stringify(ex.answer));
  assert.equal(def.check(ans, ex), true, 'README 정답이 check 를 통과');
}
assert.equal(ctx.__nmErrors.length, n0, 'README 예에서 오류 없음');
console.log('g8-prefaceDecode ok');
