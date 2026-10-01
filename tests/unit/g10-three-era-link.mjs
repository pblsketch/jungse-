// G10 기믹 'threeEraLink' 순수 부분: 판정(check)·틀린 부분 모양, 原文 대목 자르기(표기 경계), 정해진 섞기, 조각 id, 문구
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/data/orig.generated.js',
  'js/data/text-g-threeEraLink.js', 'js/ui/stage-gimmick.js', 'js/gimmicks/threeEraLink.js',
  'tests/fixtures/g-threeEraLink.js'
]);
const NM = ctx.NM;
const def = NM.gimmicks.get('threeEraLink');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'registered with mount + check');
const L = def.logic;
const J = (x) => JSON.parse(JSON.stringify(x));
const item = NM.data.SCENES.s11.items[0];

// ── 판정 ──
assert.equal(def.check(J(item.answer), item), true, 'exact answer is correct');
// 키 순서가 달라도 맞음
assert.equal(def.check({ spell: { sp4: 'kkeuneo', sp3: 'ieo', sp2: 'kkeuneo', sp1: 'ieo' }, link: J(item.answer.link) }, item), true);
{
  const a = J(item.answer);
  a.link.seoul = ['seoul.1', 'jota.2'];
  a.link.jota = ['jota.1', 'seoul.2'];
  a.spell.sp3 = 'geodeup';
  const r = def.check(a, item);
  assert.equal(r.correct, false);
  assert.deepEqual(J(r.wrong), { link: { seoul: [2], jota: [2] }, spell: ['sp3'] }, 'wrong parts by slot number and spell id');
}
{
  const r = def.check({}, item);
  assert.equal(r.correct, false);
  assert.deepEqual(J(r.wrong.link), { seoul: [1, 2], jota: [1, 2], maeum: [1, 2] }, 'missing answer → every slot wrong');
  assert.equal(r.wrong.spell.length, 4);
}
assert.equal(def.check(null, item).correct, false, 'null answer is wrong, not a throw');
// 한 부분만 있는 과제: 정답에 없는 부분은 보지 않는다
const t2 = NM.data.SCENES.s11.items[1];
assert.equal(def.check({ spell: { a: 'ieo', b: 'kkeuneo' } }, t2), true);
assert.deepEqual(J(def.check({ spell: { a: 'ieo', b: 'ieo' } }, t2).wrong), { link: {}, spell: ['b'] });
// 근대·현대 칸을 맞바꾸면 둘 다 틀림(순서 판정)
assert.deepEqual(J(def.check({ link: { seoul: ['seoul.2', 'seoul.1'], jota: ['jota.1', 'jota.2'], maeum: ['maeum.1', 'maeum.2'] }, spell: J(item.answer.spell) }, item).wrong.link), { seoul: [1, 2] });

// ── 조각 id ──
const chips = J(L.chipsOf(item.config));
assert.deepEqual(chips.map(c => c.id), ['seoul.1', 'seoul.2', 'jota.1', 'jota.2', 'maeum.1', 'maeum.2', 'x.0']);
assert.equal(chips[0].text, '셔울');
// 정답 id 가 모두 실제 조각이다(장면 작성 점검)
for (const cid of Object.keys(item.answer.link)) for (const id of item.answer.link[cid]) assert.ok(chips.some(c => c.id === id), id);

// ── 섞기: 정해진 차례, 같은 씨앗이면 같음, 처음 차례와 다름 ──
const ids = chips.map(c => c.id);
const s1 = J(L.seededShuffle(ids, "s11.t1:pool")), s2 = J(L.seededShuffle(ids, "s11.t1:pool"));
assert.deepEqual(s1, s2);
assert.notDeepEqual(s1, ids);
assert.deepEqual([...s1].sort(), [...ids].sort(), 'same members');
assert.deepEqual(L.seededShuffle(['a', 'b'], 'x').length, 2);
for (let i = 0; i < 30; i++) assert.notDeepEqual(J(L.seededShuffle(["a", "b", "c"], "seed" + i)), ['a', 'b', 'c'], 'never the given order');

// ── 原文 대목 자르기 ──
const line4 = NM.data.ORIG['O-s11-DOKRIP4'].lines[0];
let ex = L.excerpt(line4, '아러보지', 0, 3);
assert.equal(ex.target, '아러보지');
assert.ok(ex.cutLeft && ex.cutRight);
assert.ok(line4.includes(ex.before + ex.target + ex.after), 'excerpt is a contiguous slice of the 原文 line (not altered)');
assert.equal(ex.before.split(' ').length, 4, 'radius 3 words + partial word');
ex = L.excerpt(line4, '알아보니', 0, 3);
assert.ok(ex.before.endsWith('잘'), 'target inside a spaced word keeps its left part');
assert.ok(line4.includes(ex.before + ex.target + ex.after));
// 대괄호 안에 걸치는 자리는 찾지 않는다: '[ㅎㆍ]고' 의 'ㆍ]고' 같은 조각
assert.equal(L.excerpt(line4, 'ㆍ]고', 0, 3), null);
assert.equal(L.excerpt(line4, '없는말', 0, 3), null);
assert.equal(L.excerpt(line4, '', 0, 3), null);
// nth: 두 번째 '국문'
const e0 = L.excerpt(line4, '국문', 0, 0), e1 = L.excerpt(line4, '국문', 1, 0);
assert.ok(e0 && e1 && e0.after !== e1.after);
// 방점이 붙은 첫 음절: 방점은 말 쪽으로
const bj = L.excerpt('나랏 ·말[ㅆㆍ]·미 듕', '말', 0, 1);
assert.equal(bj.target, '·말');
assert.equal(bj.before, '나랏 ');
// 루비 안은 찾지 않는다
assert.equal(L.excerpt('{江|강} 강물', '강', 0, 1).before, '{江|강} ', 'skips the ruby reading, finds the plain 강');
// 시험 장면의 대목이 모두 찾아진다
for (const sp of item.config.spell.items) assert.ok(L.excerpt(NM.data.ORIG[sp.orig].lines[0], sp.find, 0), sp.id);

// ── 문구: 코드가 쓰는 열쇠가 다 있고, 데이터 표기로 렌더된다 ──
const TX = NM.data.TEXT.g.threeEraLink;
for (const k of ['arrow', 'linkTitle', 'linkHelp', 'poolLabel', 'poolEmpty', 'slotLabel', 'empty', 'spellTitle', 'spellHelp', 'spellFrom', 'target', 'submit', 'needAll']) assert.equal(typeof TX[k], 'string', k);
for (const k of L.ERAS) assert.equal(typeof TX.eras[k], 'string', k);
for (const k of L.KINDS) assert.equal(typeof TX.kinds[k], 'string', k);
for (const k of ['wrong', 'hint', 'answer', 'done']) assert.equal(typeof TX.marks[k], 'string', k);
assert.deepEqual([TX.kinds.ieo, TX.kinds.geodeup, TX.kinds.kkeuneo], ['이어 적기', '거듭 적기', '끊어 적기']);
assert.deepEqual([TX.eras.mid, TX.eras.modern, TX.eras.present], ['중세', '근대', '현대']);
const walk = (o) => Object.values(o).forEach(v => (typeof v === 'string' ? NM.core.yet.render(v) : walk(v)));
walk(TX);
assert.equal(ctx.__nmErrors.length, 0, JSON.stringify(ctx.__nmErrors));
console.log('PASS g10-three-era-link');
