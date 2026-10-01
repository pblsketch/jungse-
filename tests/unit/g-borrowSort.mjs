// G2 기믹 borrowSort 의 순수 부분: config 풀기(原文 블록 id → 글자 자리), 자리·id 오류, 판정·틀린 부분 목록,
// 시험 장면의 표시 글자가 리서치 문서 11의 S1 판정표 글자와 같은지 (spec §7 스테이지 1, §12 原文은 블록 id 로만, §13 판정은 id)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/ui/stage-gimmick.js', 'js/data/orig.generated.js', 'js/data/text-g-borrowSort.js',
  'js/gimmicks/borrowSort.js', 'tests/fixtures/g-borrowSort.js'
]);
const NM = ctx.NM;
const J = (x) => JSON.parse(JSON.stringify(x));
const def = NM.gimmicks.get('borrowSort');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'borrowSort 가 등록되어야 한다');
const F = def.facts;

// ── config 풀기: 原文 글자는 ORIG 에서 ──
const item = NM.data.SCENES.s1.items[0];
const r = F.resolve(item.config);
assert.deepEqual(J(r.errors), [], '시험 장면 config 오류 없음');
assert.deepEqual(J(r.ids), ['yeong', 'gil', 'ju', 'eun', 'ya', 'ip', 'i', 'yu', 'haeng', 'yeo', 'ga']);
const chars = {};
r.lines.forEach(l => l.targets.forEach(t => { chars[t.id] = t.char; }));
// 11 문서 S1 판정표: 永(뜻) 吉(소리) / 主(뜻) 隱(소리) / 夜 入 遊 行 如(뜻) 伊 可(소리)
assert.deepEqual(chars, { yeong: '永', gil: '吉', ju: '主', eun: '隱', ya: '夜', ip: '入', i: '伊', yu: '遊', haeng: '行', yeo: '如', ga: '可' });
const want = { 永: 'hun', 吉: 'eum', 主: 'hun', 隱: 'eum', 夜: 'hun', 入: 'hun', 伊: 'eum', 遊: 'hun', 行: 'hun', 如: 'hun', 可: 'eum' };
for (const [id, ch] of Object.entries(chars)) assert.equal(item.answer.marks[id], want[ch], `${ch}(${id}) 판정`);
assert.equal(r.lines[0].block, NM.data.ORIG['O-s1-YEONGDONG']);
assert.deepEqual(J(r.lines[2].notes.map(n => n.at)), [[0, 1], [5]], '해석 글자 자리(東京, 良)');
assert.equal(r.rule.cards.length, 3);

// ── 오류: 없는 블록, 빈칸 자리, 겹친 id, 채점 글자에 해석 표시 ──
const bad = F.resolve({ lines: [
  { orig: 'O-nope', line: 0, targets: [] },
  { orig: 'O-s1-YEONGDONG', line: 0, targets: [{ at: 3, id: 'sp' }, { at: 0, id: 'a' }, { at: 1, id: 'a' }, { at: 99, id: 'far' }],
    notes: [{ at: 0, kind: 'interp', text: 'x' }] }
] });
assert.equal(bad.errors.length, 5, J(bad.errors).join(' | '));
assert.deepEqual(J(bad.ids), ['a']);

// ── 판정 ──
assert.equal(def.check(J(item.answer), item), true);
const wrong = J(item.answer); wrong.marks.yeo = 'eum'; wrong.marks.gil = 'hun'; wrong.rule = 's1.t1.rule.b';
assert.deepEqual(J(def.check(wrong, item)), { correct: false, wrong: ['gil', 'yeo', 'rule'] }, '틀린 표시 id(원문 순서) + rule');
const noRule = J(item.answer); delete noRule.rule;
assert.deepEqual(J(def.check(noRule, item)), { correct: false, wrong: ['rule'] });
const miss = J(item.answer); delete miss.marks.ga;
assert.deepEqual(J(def.check(miss, item)), { correct: false, wrong: ['ga'] });
assert.equal(def.check(null, item).correct, false);
const t2 = NM.data.SCENES.s1.items[1];
assert.equal(def.check({ marks: { yeong: 'hun', gil: 'eum' } }, t2), true, '규칙 없는 과제는 표시만 본다');
assert.equal(def.check({ marks: { yeong: 'hun', gil: 'eum' }, rule: 'whatever' }, t2), true);

console.log('g-borrowSort: ok');
