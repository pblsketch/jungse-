// G9 두 시대 수첩(twoEraNotebook)의 순수 부분: 판정(갈래·근거 규칙), 틀린 곳 모양, README 예 항목(『소학언해』 '道·를' 은 근거에서 뺌).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { load, ROOT } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/data/orig.generated.js', 'js/ui/stage-gimmick.js',
  'js/data/text-g-twoEraNotebook.js', 'js/gimmicks/g789-origwords.js', 'js/gimmicks/twoEraNotebook.js',
  'tests/fixtures/g-twoEraNotebook.js'
]);
const NM = ctx.NM;
const G = NM.g789;
const def = NM.gimmicks.get('twoEraNotebook');
assert.ok(def && def.mount && def.check);
const J = (x) => JSON.parse(JSON.stringify(x));
const item = NM.data.SCENES.s10.items[0];
const ans = () => J(item.answer);

assert.equal(def.check(ans(), item), true, '정답 그대로 참');
let x = ans(); x.cut.evidence = ['s.mom1'];
assert.equal(def.check(x, item), true, '받아 주는 근거 가운데 하나만 골라도 참');
x = ans(); x.vh.status = 'kept';
assert.deepEqual(J(def.check(x, item)), { correct: false, wrong: { rows: { vh: ['status'] } } });
x = ans(); x.cut.evidence = ['s.mom1', 's.geosira'];
assert.deepEqual(J(def.check(x, item)), { correct: false, wrong: { rows: { cut: ['evidence'] }, evidence: { cut: ['s.geosira'] } } }, '받지 않는 근거를 알린다');
x = ans(); x.araea.evidence = [];
assert.deepEqual(J(def.check(x, item)).wrong, { rows: { araea: ['evidence'] } }, '근거가 필요한데 없으면 틀림(칩 없음)');
x = ans(); x.ga.evidence = ['s.i'];
assert.deepEqual(J(def.check(x, item)).wrong, { rows: { ga: ['evidence'] }, evidence: { ga: ['s.i'] } }, "evidence: [] 줄에 근거를 고르면 틀림");
x = ans(); x.nom = { status: 'shaky', evidence: [] };
assert.deepEqual(J(def.check(x, item)).wrong.rows.nom, ['status', 'evidence']);
x = ans(); x.bj = { status: 'kept', evidence: ['s.i'] };
assert.equal(def.check(x, item), true, '채점하지 않는 줄(answer 에 없음)은 보지 않는다');
assert.equal(def.check(null, item).correct, false);
const t2 = NM.data.SCENES.s10.items[1];
assert.equal(def.check({ nom: { status: 'kept', evidence: ['s.i'] } }, t2), true, 'evidence 를 적지 않으면 근거는 보지 않는다');

// ── 시험 장면 낱말이 모두 찾아진다 ──
const n0 = ctx.__nmErrors.length;
const cfg = item.config;
for (const w of cfg.page15.words) assert.ok(G.wordText(NM.data.ORIG[cfg.page15.orig[0]].lines[0], w), w.id);
for (const w of cfg.page16.words) assert.ok(G.wordText(NM.data.ORIG[w.block].lines[0], w), w.id);
assert.equal(ctx.__nmErrors.length, n0);

// ── README 예 항목 ──
const md = readFileSync(join(ROOT, 'js/gimmicks/README-twoEraNotebook.md'), 'utf8');
const blocks = [...md.matchAll(/```js\n([\s\S]*?)```/g)].map(m => m[1]).filter(s => s.trim().startsWith('{') && s.includes('gimmick:'));
assert.equal(blocks.length, 1);
const ex = vm.runInContext('(' + blocks[0] + ')', ctx);
const c = ex.config;
for (const b of c.page15.orig.concat(c.page16.orig)) assert.ok(NM.data.ORIG[b], b);
for (const w of c.page15.words) assert.ok(G.wordText(NM.data.ORIG[w.block || c.page15.orig[0]].lines[w.line || 0], w), 'README 15 ' + w.id);
const ids16 = new Set(c.page16.extra.map(e => e.id));
for (const w of c.page16.words) {
  const text = G.wordText(NM.data.ORIG[w.block || c.page16.orig[0]].lines[w.line || 0], w);
  assert.ok(text, 'README 16 ' + w.id);
  ids16.add(w.id);
  // 『소학언해』 권2 '道:도·를' 의 조사(판본마다 다름, 11 문서 §8)는 근거 낱말이 되지 않는다
  assert.ok(!(w.block === 'O-s10-SOHAK4' && /^·를$|\{道\|:도\}·를/.test(text)), "SOHAK4 '·를' 는 근거로 쓰지 않는다");
}
for (const r of c.rows) {
  for (const id of (r.ex15 || [])) assert.ok(c.page15.words.some(w => w.id === id) || (c.page15.extra || []).some(e => e.id === id), r.id + ' ex15 ' + id);
  if (r.graded === false) assert.equal(ex.answer[r.id], undefined, '채점하지 않는 줄은 answer 에 없다: ' + r.id);
}
for (const [rid, a] of Object.entries(ex.answer)) {
  assert.ok(c.rows.some(r => r.id === rid && r.graded !== false), rid);
  for (const id of (a.evidence || [])) assert.ok(ids16.has(id), '근거 ' + id + ' 는 16세기 낱말');
}
assert.ok(c.rows.some(r => r.id === 'bj' && r.graded === false), '방점 줄은 채점하지 않음');
assert.equal(def.check(J(ex.answer), ex), true);
for (const n of c.notes) if (n.orig) assert.ok(NM.data.ORIG[n.orig], n.orig);
assert.equal(ctx.__nmErrors.length, n0);
console.log('g9-twoEraNotebook ok');
