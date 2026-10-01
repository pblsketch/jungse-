// G3 기믹 letterForge 의 순수 부분: 사실 표(상형 획 구조, 가획 줄, 다르게 만든 글자 ㆁ ㄹ ㅿ, 천지인, 초출·재출),
// config 고르기·오류, 정답 만들기, ㆍ ㅡ ㅣ 누른 차례 → 모양 id, 판정·틀린 부분 목록, 학교급별 용어 문구 (spec §7 스테이지 2)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/ui/stage-gimmick.js', 'js/data/text-g-letterForge.js',
  'js/gimmicks/letterForge-svg.js', 'js/gimmicks/letterForge.js', 'tests/fixtures/g-letterForge.js'
]);
const NM = ctx.NM;
const J = (x) => JSON.parse(JSON.stringify(x));
const def = NM.gimmicks.get('letterForge');
assert.ok(def && typeof def.mount === 'function' && typeof def.check === 'function', 'letterForge 가 등록되어야 한다');
const F = def.facts;
const T = NM.data.TEXT.g.letterForge;
const G = (ids) => ids.map(id => T.glyphs[id]).join('');

// ── 사실 표 (지학사 중2-2 140~143쪽 · 해례 제자해 O-s2-*) ──
assert.equal(G(F.BASES), 'ㄱㄴㅁㅅㅇ', '상형 기본자 5자');
assert.deepEqual(J(Object.fromEntries(Object.entries(F.CHAINS).map(([k, v]) => [k, G(v)]))), { g: 'ㄱㅋ', n: 'ㄴㄷㅌ', m: 'ㅁㅂㅍ', s: 'ㅅㅈㅊ', o: 'ㅇㆆㅎ' }, '가획 줄');
assert.equal(G(F.ODD), 'ㆁㄹㅿ', '다르게 만든 글자(이체자)');
assert.deepEqual(J(F.SAMJAE), { araea: 'sky', eu: 'earth', i: 'person' }, 'ㆍ 하늘 · ㅡ 땅 · ㅣ 사람');
assert.equal(G(F.FIRST), 'ㅗㅏㅜㅓ', '초출자');
// 상형 획 구조가 모두 그림 조각 id 이고, 그림 조각 목록과 같다
const ART = NM.gimmicks.art.letterForge;
assert.deepEqual(J(F.PIECE_IDS), J(ART.ORDER));
for (const [L, ps] of Object.entries(F.SHAPE)) for (const p of ps) assert.ok(ART.PIECES[p], L + ' 의 획 ' + p);
for (const p of F.PIECE_IDS) assert.equal(typeof T.pieces[p], 'string', '획 이름 ' + p);
for (const L of F.BASES) assert.ok(T.sounds[L].name && T.sounds[L].shape && ART.HIGHLIGHT[L], '소리 ' + L);

// ── 학교급별 용어: 중학교 문구에 '이체' 없음(날개 설명), 고등에 '이체' 있음 ──
const levelText = (lv) => JSON.stringify(Object.fromEntries(Object.entries(T.steps).map(([k, v]) => [k, v[lv]])));
assert.ok(!levelText('m').includes('이체'), "중학교 문구에는 '이체'가 없다");
assert.ok(levelText('h').includes('이체'), "고등 문구에는 '이체'가 있다");
assert.ok(T.steps.odd.m.wing && T.steps.odd.m.wingAfter, '중학교 날개 설명');
for (const s of F.STEPS) for (const lv of ['m', 'h']) assert.ok(T.steps[s][lv].title && T.steps[s][lv].lead, s + ' ' + lv);
for (const s of F.STEPS) assert.ok(['상형', '가획', '합성'].some(w => T.steps[s].m.title.startsWith(w)) || s === 'odd', '중학교 제목은 상형·가획·합성 ' + s);

// ── ㆍ ㅡ ㅣ 누른 차례 → 모양 id ──
const P = F.parseSeq;
assert.equal(P([]), '');
assert.equal(P(['araea', 'eu']), 'eu-up-1');
assert.equal(P(['eu', 'araea']), 'eu-down-1');
assert.equal(P(['i', 'araea']), 'i-right-1');
assert.equal(P(['araea', 'i']), 'i-left-1');
assert.equal(P(['araea', 'araea', 'eu']), 'eu-up-2');
assert.equal(P(['i', 'araea', 'araea']), 'i-right-2');
assert.equal(P(['araea', 'eu', 'araea']), 'invalid');
assert.equal(P(['eu', 'i']), 'invalid');
assert.equal(P(['araea']), 'invalid');
assert.equal(P(['eu']), 'invalid');
for (const [v, shape] of Object.entries(F.VOWEL)) assert.equal(P(J(F.seqFor(shape))), shape, v + ' 차례 되돌리기');
assert.deepEqual(J(F.structOf(['araea', 'araea', 'i'])), { base: 'i', before: 2, after: 0 });

// ── config 고르기·오류 ──
const n0 = F.norm({});
assert.deepEqual(J(n0.steps), J(F.STEPS), '단계 기본값은 다섯 단계 전부');
assert.equal(n0.errors.length, 0);
const nb = F.norm({ steps: ['shape', 'nope'], shape: { letters: ['g', 'k'] }, add: { extra: ['k', 'r'] } });
assert.deepEqual(J(nb.steps), ['shape']);
assert.deepEqual(J(nb.letters), ['g']);
assert.deepEqual(J(nb.extra), ['r'], '가획 줄에 든 글자는 덤으로 못 넣는다');
assert.equal(nb.errors.length, 3, J(nb.errors).join(' | '));

// ── 시험 장면 answer 는 사실 표와 같다, 판정 ──
for (const it of NM.data.SCENES.s2.items) {
  assert.deepEqual(J(F.answerFor(it.config)), J(it.answer), it.id + ' answer = answerFor(config)');
  assert.equal(def.check(J(it.answer), it), true, it.id);
}
const t1 = NM.data.SCENES.s2.items[0];
const w1 = J(t1.answer);
w1.shape.g = ['top', 'right', 'left'];   // 획 하나 더
w1.add['n.2'] = 'd'; w1.add['n.1'] = 't';
w1.odd = ['ng', 'k'];                    // r·z 빠뜨리고 k 잘못 고름
assert.deepEqual(J(def.check(w1, t1)), { correct: false, wrong: ['shape.g', 'add.n.1', 'add.n.2', 'odd.k', 'odd.r', 'odd.z'] });
const w1b = J(t1.answer); w1b.shape.o = ['ring', 'ring'];
assert.deepEqual(J(def.check(w1b, t1).wrong), ['shape.o'], '겹친 획은 틀림');
const t2 = NM.data.SCENES.s2.items[1];
const w2 = J(t2.answer); w2.samjae.eu = 'sky'; w2.vowel.vya = 'i-right-1'; w2.vowel.vyeo = 'invalid';
assert.deepEqual(J(def.check(w2, t2)), { correct: false, wrong: ['samjae.eu', 'vowel.vya', 'vowel.vyeo'] });
assert.equal(def.check(null, t2).correct, false);
assert.equal(def.check({}, { config: { steps: ['odd'], odd: { pool: ['k', 'd'] } } }), true, '고를 글자가 없는 묶음은 아무것도 안 고르면 맞음');

console.log('g-letterForge: ok');
