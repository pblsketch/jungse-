// 통역 고르기(js/ui/stage-translate.js)의 순수 부분 + 기록(store.recordInterp, normalizeRecord) + s5 고르기 데이터
// - steps: 올바른 고르기만(정답 1개·카드 2장 이상), has, chooseAt(줄 수 안으로), judge(차례대로 틀린 고르기), compose(빈칸 채우기)
// - 기록: 있을 때만 interp 칸, 첫 시도는 처음 한 번만, 망가진 값은 기본값, 예전 기록 모양 그대로
// - s5: 고르기마다 정답 1개, 틀린 카드마다 반응 대사, 빈칸 수 = 고르기 수, 근거 항목이 학교급마다 핵심 항목, 정답 문장 = 통역 대사
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/stages.js', 'js/data/rules-config.js', 'js/data/profanity.js', 'js/data/jamo.js',
  'js/core/yet.js', 'js/core/rules.js', 'js/core/nickname.js', 'js/core/save.js',
  'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-translate.js',
  'js/data/scenes/s5.js'
]);
const NM = ctx.NM;
const ST = NM.ui.stageTranslate;
const G = ST.logic;
const J = (x) => JSON.parse(JSON.stringify(x));

// ── steps / has ──
const opt = (id, correct, extra) => Object.assign({ id, text: id + ' 글', correct }, extra || {});
const tr = {
  lines: ['a', 'b', 'c'],
  choose: [
    { id: 'q1', prompt: '첫째', options: [opt('q1.a', true, { part: '가' }), opt('q1.b', false, { reaction: ['틀림'] }), opt('q1.c', false)] },
    { id: 'q2', prompt: '둘째', options: [opt('q2.a', false), opt('q2.b', true)] },
    { id: 'bad1', prompt: '정답 둘', options: [opt('x', true), opt('y', true)] },
    { id: 'bad2', prompt: '카드 하나', options: [opt('z', true)] },
    { id: 'bad3', options: [opt('u', true), opt('v', false)] },
    null
  ]
};
assert.deepEqual(G.steps(tr).map(s => s.id), ['q1', 'q2'], '올바른 고르기만');
assert.equal(ST.has(tr), true);
assert.equal(ST.has({ lines: [] }), false, 'choose 가 없으면 예전 통역');
assert.equal(ST.has({ choose: [] }), false);
assert.equal(ST.has(null), false);
assert.equal(ST.has({ choose: [tr.choose[2]] }), false, '정답이 둘이면 쓰지 않는다');

// ── chooseAt ──
assert.equal(G.chooseAt(tr), 0, '기본 0');
assert.equal(G.chooseAt(Object.assign({}, tr, { chooseAt: 2 })), 2);
assert.equal(G.chooseAt(Object.assign({}, tr, { chooseAt: 9 })), 3, '줄 수를 넘지 않는다');
assert.equal(G.chooseAt(Object.assign({}, tr, { chooseAt: -1 })), 0);
assert.equal(G.chooseAt(Object.assign({}, tr, { chooseAt: '1' })), 0, '정수만');

// ── judge ──
const st = G.steps(tr);
assert.deepEqual(J(G.judge(st, { q1: 'q1.a', q2: 'q2.b' })), { correct: true, wrong: [], missing: [] });
assert.deepEqual(J(G.judge(st, { q1: 'q1.b', q2: 'q2.a' })), { correct: false, wrong: ['q1', 'q2'], missing: [] }, '틀린 고르기를 차례대로');
assert.deepEqual(J(G.judge(st, { q1: 'q1.a', q2: 'q2.a' })), { correct: false, wrong: ['q2'], missing: [] });
assert.deepEqual(J(G.judge(st, { q1: 'q1.a' })), { correct: false, wrong: ['q2'], missing: ['q2'] }, '안 고른 것은 틀림 + missing');
assert.deepEqual(J(G.judge(st, { q1: 'nope', q2: 'q2.b' })), { correct: false, wrong: ['q1'], missing: ['q1'] }, '모르는 카드 id');
assert.equal(G.judge([], {}).correct, false, '고르기가 없으면 맞음이 아니다');

// ── compose ──
assert.deepEqual(J(G.compose('{?} 이웃이 {?} 쌀', st, {})), [{ blank: 'q1', text: null }, { text: ' 이웃이 ' }, { blank: 'q2', text: null }, { text: ' 쌀' }]);
assert.deepEqual(J(G.compose('{?} 이웃이 {?} 쌀', st, { q1: 'q1.a', q2: 'q2.b' })),
  [{ blank: 'q1', text: '가' }, { text: ' 이웃이 ' }, { blank: 'q2', text: 'q2.b 글' }, { text: ' 쌀' }], 'part 가 있으면 part, 없으면 text');
assert.deepEqual(J(G.compose('{?}와 {?}와 {?}', st, {})).filter(p => p.blank).length, 2, '고르기보다 많은 빈칸은 버린다');
assert.deepEqual(J(G.compose('', st, {})), []);
assert.deepEqual(J(G.compose(undefined, st, {})), []);
assert.equal(G.optionOf(st[0], 'q1.b').reaction[0], '틀림');
assert.equal(G.optionOf(st[0], 'none'), null);

// ── 기록: recordInterp / normalizeRecord ──
const S = NM.core.save;
const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; };
const storage = mem();
const store = S.createStore({ storage, urlLevel: 'h1' });
store.setup({ level: 'h1', protagonist: 1, nickname: '' });
assert.equal('interp' in store.stage('s5'), false, '기록 전에는 interp 칸이 없다(예전 모양 그대로)');
assert.equal(store.recordInterp('s5', { id: 's5.x1', firstTry: false, tries: 2, first: ['s5.t1.b', 's5.t2.a'], picks: ['s5.t1.a', 's5.t2.a'] }).ok, true);
assert.deepEqual(J(store.stage('s5').interp), { firstTry: false, tries: 2, first: ['s5.t1.b', 's5.t2.a'], picks: ['s5.t1.a', 's5.t2.a'] });
assert.equal(store.stage('s5').status, 'progress');
// 다시 하기 뒤 다시 고르면 첫 시도는 그대로, 시도 수·마지막 고른 것만 바뀐다
store.recordInterp('s5', { firstTry: true, tries: 1, first: ['s5.t1.a', 's5.t2.a'], picks: ['s5.t1.a', 's5.t2.a'] });
assert.deepEqual(J(store.stage('s5').interp), { firstTry: false, tries: 1, first: ['s5.t1.b', 's5.t2.a'], picks: ['s5.t1.a', 's5.t2.a'] });
assert.equal(store.recordInterp('nope', {}).ok, false);
assert.equal(store.recordInterp('s5', null).ok, false);
// 저장된 값에서 다시 읽기
const again = S.createStore({ storage });
assert.deepEqual(J(again.stage('s5').interp), J(store.stage('s5').interp), '새로 불러도 같다');
// 망가진 값 → 그 칸만 기본값, interp 가 객체가 아니면 칸 없음
const raw = J(JSON.parse(storage.m[S.KEY]));
raw.progress.h1.s5.interp = { firstTry: 'yes', tries: -3, first: 'x', picks: ['a', 7, 'a', 'b'] };
assert.deepEqual(J(S.normalizeRecord(raw).progress.h1.s5.interp), { firstTry: null, tries: 0, first: [], picks: ['a', 'b'] });
raw.progress.h1.s5.interp = 'broken';
assert.equal('interp' in S.normalizeRecord(raw).progress.h1.s5, false);
delete raw.progress.h1.s5.interp;
assert.equal('interp' in S.normalizeRecord(raw).progress.h1.s5, false, '예전 기록(칸 없음)은 그대로');
// 교사 저장소: 같은 API, 저장소에 쓰지 않음
const t = S.createStore({ teacher: true, level: 'h1' });
assert.equal(t.recordInterp('s5', { firstTry: true, tries: 1, first: [], picks: [] }).ok, true);

// ── s5 고르기 데이터 ──
const L = NM.ui.stageLogic;
const s5 = NM.data.SCENES.s5;
const yet = NM.core.yet;
const plain = (s) => yet.render(s, { bangjeom: false, ruby: 'base' });
for (const lv of ['m', 'h1', 'h23']) {
  const sc = L.resolveScene(s5, lv);
  sc.id = 's5';
  const T = sc.translate;
  const steps = G.steps(T);
  assert.equal(steps.length, T.choose.length, lv + ': 데이터의 고르기가 모두 올바르다');
  assert.ok(steps.length >= 1 && steps.length <= 2, lv + ': 고르기 1~2번');
  const core = NM.core.rules.coreItemsFor(sc, lv).map(i => i.id);
  const ids = new Set();
  for (const s of steps) {
    assert.ok(s.item && core.indexOf(s.item) >= 0, `${lv}: ${s.id} 의 근거 항목 ${s.item} 이 이 학교급 핵심 항목`);
    assert.ok(s.options.length >= 3, s.id + ': 카드 3장 이상');
    for (const o of s.options) {
      assert.ok(!ids.has(o.id), '카드 id 겹침 ' + o.id); ids.add(o.id);
      if (o.correct) assert.ok(!o.reaction, o.id + ': 정답 카드에는 반응이 없다');
      else assert.ok(Array.isArray(o.reaction) && o.reaction.length >= 2 && o.reaction.length <= 4, o.id + ': 틀린 카드마다 짧은 반응(2~4줄)');
      for (const ln of o.reaction || []) assert.ok(ln.who === 'me' || ln.who === 'senior' || sc.cast[ln.who], o.id + ': 말하는 사람 ' + ln.who);
      plain(o.text); plain(o.part || o.text);
    }
    plain(s.prompt);
  }
  assert.equal(T.compose.split(G.BLANK).length - 1, steps.length, lv + ': 빈칸 수 = 고르기 수');
  assert.ok(Number.isInteger(T.chooseAt) && T.chooseAt >= 1 && T.chooseAt < T.lines.length, lv + ': 고르기 앞뒤에 대사가 있다');
  // 정답으로 채운 통역 문장이 고르기 뒤 첫 대사(내가 하는 통역)에 그대로 들어 있다(띄어쓰기·쉼표 무시)
  const right = {};
  steps.forEach(s => { right[s.id] = s.options.filter(o => o.correct)[0].id; });
  const sentence = G.compose(T.compose, steps, right).map(p => p.text).join('');
  const next = T.lines[T.chooseAt];
  const squash = (x) => plain(x).replace(/[\s,.]/g, '');
  assert.equal(next.who, 'me', lv + ': 고르기 뒤 첫 줄은 내 통역');
  assert.ok(squash(next.text).includes(squash(sentence)), lv + ': 고른 통역 = 다 된 통역 대사 — ' + sentence);
}

// 화면 문구가 모두 있다
for (const k of ['title', 'lead', 'preview', 'stepNo', 'pickAll', 'deliver', 'again', 'tried', 'react', 'misNote']) {
  assert.ok(typeof NM.data.TEXT.stage.interp[k] === 'string' && NM.data.TEXT.stage.interp[k], 'TEXT.stage.interp.' + k);
}
assert.ok(!(ctx.__nmErrors || []).length, '오류 없음');
console.log('translate-choice: ok');
