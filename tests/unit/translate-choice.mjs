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

// ── 고르기가 있는 모든 장면(s0~s12), 학교급마다(그 학교급이 보는 판 = resolveScene) ──
// 고르기 1~2번·카드 3장·정답 1개, 근거 항목이 그 학교급의 핵심 항목, 틀린 카드마다 반응(2~4줄),
// 빈칸 수 = 고르기 수, 고르기 앞뒤에 대사, 정답으로 채운 문장 조각이 고르기 뒤 내 통역 대사에 차례대로 든다.
{
  const all = load([
    'js/core/ns.js', 'js/data/stages.js', 'js/data/rules-config.js', 'js/data/profanity.js', 'js/data/jamo.js',
    'js/core/yet.js', 'js/core/rules.js', 'js/core/nickname.js', 'js/core/save.js',
    'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/stage-logic.js', 'js/ui/stage-translate.js'
  ].concat(NM.data.STAGE_IDS.map(id => 'js/data/scenes/' + id + '.js')));
  const A = all.NM, AG = A.ui.stageTranslate.logic;
  const aplain = (s) => A.core.yet.render(String(s), { bangjeom: false, ruby: 'base' });
  const sq = (x) => aplain(x).replace(/[\s,.!?'"]/g, '');
  const seen = [];
  for (const id of A.data.STAGE_IDS) {
    for (const lv of ['m', 'h1', 'h23']) {
      const sc = A.ui.stageLogic.resolveScene(A.data.SCENES[id], lv);
      sc.id = id;
      const T = sc.translate || {};
      if (T.choose === undefined) { assert.equal(A.ui.stageTranslate.has(T), false, `${id}/${lv}: 고르기가 없으면 예전 통역`); continue; }
      const tag = `${id}/${lv}`;
      seen.push(tag);
      const st = AG.steps(T);
      assert.equal(st.length, T.choose.length, tag + ': 데이터의 고르기가 모두 올바르다(정답 1개·카드 2장 이상)');
      assert.ok(st.length >= 1 && st.length <= 2, tag + ': 고르기 1~2번');
      const core = A.core.rules.coreItemsFor(sc, lv).map(i => i.id);
      const taken = new Set((sc.items || []).map(i => i.id).concat((sc.contexts || []).map(c => c.id)));
      const ids = new Set();
      for (const s of st) {
        assert.ok(!taken.has(s.id) && !ids.has(s.id), `${tag}: 고르기 id ${s.id} 가 항목·맥락·다른 고르기와 겹치지 않는다`); ids.add(s.id);
        assert.ok(s.item && core.indexOf(s.item) >= 0, `${tag}: ${s.id} 의 근거 항목 ${s.item} 이 이 학교급 핵심 항목 (${core.join(',')})`);
        assert.equal(s.options.length, 3, `${tag}: ${s.id} 카드 3장`);
        aplain(s.prompt);
        for (const o of s.options) {
          assert.ok(!ids.has(o.id), `${tag}: 카드 id 겹침 ${o.id}`); ids.add(o.id);
          if (o.correct) assert.ok(!o.reaction, `${tag}: ${o.id} 정답 카드에는 반응이 없다`);
          else assert.ok(Array.isArray(o.reaction) && o.reaction.length >= 2 && o.reaction.length <= 4, `${tag}: ${o.id} 틀린 카드마다 짧은 반응(2~4줄)`);
          for (const ln of o.reaction || []) {
            assert.ok(ln.who === 'me' || ln.who === 'senior' || (sc.cast && sc.cast[ln.who]), `${tag}: ${o.id} 말하는 사람 ${ln.who}`);
            assert.ok(typeof ln.text === 'string' && ln.text, `${tag}: ${o.id} 반응 대사`);
            aplain(ln.text);
          }
          aplain(o.text); aplain(o.part || o.text);
        }
      }
      assert.equal(T.compose.split(AG.BLANK).length - 1, st.length, tag + ': 빈칸 수 = 고르기 수');
      assert.ok(Number.isInteger(T.chooseAt) && T.chooseAt >= 1 && T.chooseAt < T.lines.length, tag + ': 고르기 앞뒤에 대사가 있다');
      assert.equal(T.lines[T.chooseAt].who, 'me', tag + ': 고르기 뒤 첫 줄은 내 통역');
      // 정답 문장 조각(고정 글·고른 말)이 고르기 뒤 내 대사들에 차례대로 들어 있다(띄어쓰기·문장 부호 무시)
      const right = {};
      st.forEach(s => { right[s.id] = s.options.filter(o => o.correct)[0].id; });
      const parts = AG.compose(T.compose, st, right);
      assert.ok(parts.every(p => typeof p.text === 'string'), tag + ': 정답으로 빈칸이 모두 찬다');
      const mine = sq(T.lines.slice(T.chooseAt).filter(l => l.who === 'me').map(l => l.text).join(''));
      let at = 0;
      // 고정 글은 문장마다 나눈다(통역 문장 둘이 내 대사 두 줄에 나뉘어 들 수 있다)
      for (const piece of parts.reduce((a, p) => a.concat(p.blank === undefined ? p.text.split(/[.?!]\s+/) : [p.text]), [])) {
        const f = sq(piece);
        if (!f) continue;
        const k = mine.indexOf(f, at);
        assert.ok(k >= 0, `${tag}: 고른 통역 조각 '${piece}' 이 뒤의 내 통역 대사에 차례대로 든다`);
        at = k + f.length;
      }
      // 틀린 카드로 채운 문장은 다 된 통역과 달라야 한다
      for (const s of st) for (const o of s.options.filter(x => !x.correct)) {
        const w = Object.assign({}, right, { [s.id]: o.id });
        assert.ok(!mine.includes(sq(AG.compose(T.compose, st, w).map(p => p.text).join(''))), `${tag}: ${o.id} 로 채운 문장은 바른 통역이 아니다`);
      }
    }
  }
  for (const tag of ['s0/m', 's0/h1', 's0/h23', 's1/h23', 's2/m', 's2/h1', 's2/h23', 's3/m', 's3/h1', 's3/h23', 's5/h1', 's5/h23',
    's4/m', 's4/h1', 's4/h23', 's6/m', 's6/h1', 's6/h23', 's7/m', 's7/h1', 's7/h23', 's8/m', 's8/h1', 's8/h23',
    's9/m', 's9/h1', 's9/h23', 's10/m', 's10/h1', 's10/h23', 's11/m', 's11/h1', 's11/h23', 's12/m', 's12/h1', 's12/h23']) {
    assert.ok(seen.indexOf(tag) >= 0, tag + ': 통역 고르기가 있다');
  }
  // s9·s12: 중학교판(editions.m.translate)은 그 판이 실제로 다룬 항목으로 고른다(고등판과 근거 항목이 다르다)
  {
    const items = (id, lv) => AG.steps(A.ui.stageLogic.resolveScene(A.data.SCENES[id], lv).translate).map(s => s.item).join();
    assert.equal(items('s9', 'm'), 's9.r1,s9.t3', 's9 중학교판: 누가·왜(s9.r1) + 창제 정신(s9.t3)');
    assert.equal(items('s9', 'h1'), 's9.t1,s9.t1', 's9 고등판: 서문 해독 ①(어린, 하니라)');
    assert.equal(items('s12', 'm'), 's12.r1,s12.r2', 's12 중학교판: 입력 방식 + 글자와 소리');
    assert.equal(items('s12', 'h23'), 's12.r1,s12.r2', 's12 고등판: 변화의 순서 + 지금도 바뀌는 말');
    assert.notEqual(A.data.SCENES.s12.editions.m.translate.choose[0].prompt, A.data.SCENES.s12.translate.choose[0].prompt, 's12 두 판의 고르기는 서로 다르다');
  }
  assert.ok(!(all.__nmErrors || []).length, '장면 전체 불러오기 오류 없음');
  // s6: 고1(중학생은 고1 범위)은 주격 하나, 고2~3판(editions.h23.translate)은 주격 + 관형격 [ㅇㆎ] — 대사·통역 id 는 같다
  {
    const s6 = A.data.SCENES.s6, pick = (lv) => A.ui.stageLogic.resolveScene(s6, lv).translate;
    assert.equal(AG.steps(pick('m')).map(s => s.id).join(), 's6.i1');
    assert.equal(AG.steps(pick('h1')).map(s => s.id).join(), 's6.i1');
    assert.equal(AG.steps(pick('h23')).map(s => s.id).join(), 's6.i1,s6.i2');
    assert.equal(pick('h23').id, s6.translate.id);
    assert.equal(pick('h23').lines.length, s6.translate.lines.length);
    assert.ok(!('said' in pick('h23')), 's6 h23: said 는 대사로 옮겨진다');
  }
}

// 화면 문구가 모두 있다
for (const k of ['title', 'lead', 'preview', 'stepNo', 'pickAll', 'deliver', 'again', 'tried', 'react', 'misNote']) {
  assert.ok(typeof NM.data.TEXT.stage.interp[k] === 'string' && NM.data.TEXT.stage.interp[k], 'TEXT.stage.interp.' + k);
}
assert.ok(!(ctx.__nmErrors || []).length, '오류 없음');
console.log('translate-choice: ok');
