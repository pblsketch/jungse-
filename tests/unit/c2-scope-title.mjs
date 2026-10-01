// C2: 핵심 항목 범위(묶음 안/밖), 장면 끝 판정, 칭호, 수첩 숫자 (spec §5-4, §5-5, §6)
import assert from 'node:assert/strict';
import { boot, J, S0, S1, S2, S4, S9 } from './c2-fixtures.mjs';

const ctx = boot();
const R = ctx.NM.core.rules;
const ids = (st, lv) => J(R.coreItemsFor(st, lv).map(i => i.id));

// 설정값이 데이터에 있다
assert.ok(ctx.NM.data.TITLE_RULES, 'TITLE_RULES');
assert.deepEqual(J(ctx.NM.data.SCOPE_RULES.h23Only), ['s1', 's7', 's8', 's11']);

// 묶음 안: 자기 학교급 범위
assert.deepEqual(ids(S2, 'm'), ['s2.r1', 's2.t1']);
assert.deepEqual(ids(S4, 'h1'), ['s4.r1', 's4.t1']);
assert.deepEqual(ids(S4, 'h23'), ['s4.r1', 's4.r2', 's4.t1']);
// 묶음 밖: 중학교판이 없는 장면에 중학생 → 고1 범위
assert.equal(R.scopeLevel(S4, 'm'), 'h1');
assert.deepEqual(ids(S4, 'm'), ['s4.r1', 's4.t1']);
// 고2~3 전용 장면은 누구든 그 장면 범위(고1 범위 규칙보다 우선)
assert.equal(R.isH23Only(S1), true);
assert.equal(R.scopeLevel(S1, 'm'), 'h23');
assert.equal(R.scopeLevel(S1, 'h1'), 'h23');
assert.deepEqual(ids(S1, 'm'), ['s1.r1', 's1.r2']);
assert.deepEqual(ids(S1, 'h1'), ['s1.r1', 's1.r2']);
// 데이터로부터 고2~3 전용을 알아냄(설정 목록에 없어도) + 장면 깃발
const derived = { id: 's3', items: [{ id: 's3.t1', kind: 'task', levels: ['h23'] }], contexts: [] };
assert.equal(R.isH23Only(derived), true);
assert.equal(R.scopeLevel(derived, 'm'), 'h23');
assert.equal(R.isH23Only({ id: 's2', h23Only: true, items: [], contexts: [] }), true);
assert.equal(R.isH23Only(S4), false);
// 고1은 4·5·6 에서 고1 범위, 고2~3은 고2~3 범위
assert.equal(R.scopeLevel(S4, 'h1'), 'h1');
assert.equal(R.scopeLevel(S4, 'h23'), 'h23');
// 중학교판이 있는 장면에 고등학생(묶음 밖)
assert.deepEqual(ids(S2, 'h1'), ['s2.r1', 's2.r2', 's2.t1']);
// levels 가 없는 항목은 모든 학교급에서 핵심
assert.deepEqual(ids({ id: 's9', items: [{ id: 's9.t1', kind: 'task' }], contexts: [] }, 'm'), ['s9.t1']);
// 잘못된 입력은 빈 목록(던지지 않음)
assert.deepEqual(ids(null, 'm'), []);
assert.deepEqual(ids(S2, 'zz'), []);

// 묶음 역할
assert.equal(R.bundleRole('m', 's2'), 'bundle');
assert.equal(R.bundleRole('m', 's4'), 'outside');
assert.equal(R.bundleRole('h1', 's10'), 'optional');
assert.equal(R.bundleRole('h23', 's10'), 'bundle');
assert.equal(R.bundleRole('h1', 's0'), 'prologue');

// 장면 끝: 학교급 3 × 묶음 안/밖
function progWith(stage, level, recOverride) {
  const items = {};
  for (const it of R.coreItemsFor(stage, level)) {
    items[it.id] = Object.assign(R.newItemRecord(it.kind), { state: it.kind === 'read' ? 'confirmed' : 'done', firstTry: true });
  }
  Object.assign(items, recOverride || {});
  return { status: 'progress', items, rules: [], translations: [], reflection: '' };
}
const cases = [
  ['m', S2, 'bundle'], ['m', S4, 'outside'],
  ['h1', S4, 'bundle'], ['h1', S2, 'outside'],
  ['h23', S4, 'bundle'], ['h23', S2, 'outside'],
  ['m', S1, 'outside'], ['h23', S1, 'bundle']
];
for (const [lv, st, role] of cases) {
  assert.equal(R.bundleRole(lv, st.id), role, `${lv} ${st.id}`);
  const p = progWith(st, lv);
  assert.equal(R.isCoreComplete(p, st, lv), true, `${lv} ${st.id} 완료`);
  // 핵심 하나라도 덜 끝나면 미완
  const first = R.coreItemsFor(st, lv)[0];
  const open = progWith(st, lv, { [first.id]: R.newItemRecord(first.kind) });
  assert.equal(R.isCoreComplete(open, st, lv), false, `${lv} ${st.id} 미완`);
  // 기록 없음 = 미완
  const missing = progWith(st, lv); delete missing.items[first.id];
  assert.equal(R.isCoreComplete(missing, st, lv), false);
}
// 도움으로 끝낸 것도 완료
const helped = progWith(S4, 'h23', {
  's4.r2': Object.assign(R.newItemRecord('read'), { state: 'confirmedByHelp', wrongs: 3, helps: 3, firstTry: false }),
  's4.t1': Object.assign(R.newItemRecord('task'), { state: 'doneByHelp', wrongs: 3, helps: 3, firstTry: false })
});
assert.equal(R.isCoreComplete(helped, S4, 'h23'), true);
// 중학생은 s4.r2(고2~3만 핵심)를 안 해도 끝남
assert.equal(R.isCoreComplete(progWith(S4, 'm'), S4, 'm'), true);
// misread 는 미완
assert.equal(R.isCoreComplete(progWith(S4, 'h1', { 's4.r1': Object.assign(R.newItemRecord('read'), { state: 'misread', wrongs: 1 }) }), S4, 'h1'), false);
// 서장
assert.equal(R.isCoreComplete(progWith(S0, 'm'), S0, 'm'), true);
assert.equal(R.isCoreComplete(undefined, S9, 'm'), false);

// 수첩 숫자
const nb = R.notebookStats(helped, S4, 'h23');
assert.deepEqual(J(nb), { firstTryRate: 1 / 3, firstTryRight: 1, firstTrySet: 3, helps: 6, misreads: 3 });
const partial = progWith(S4, 'h23', { 's4.t1': R.newItemRecord('task') });
assert.equal(R.notebookStats(partial, S4, 'h23').firstTrySet, 2, 'firstTry 가 정해진 항목만');
assert.equal(R.notebookStats(partial, S4, 'h23').firstTryRate, 1);
assert.deepEqual(J(R.notebookStats(undefined, S4, 'h23')), { firstTryRate: null, firstTryRight: 0, firstTrySet: 0, helps: 0, misreads: 0 });

// 도움 2단계: 빛낼 맥락
const s4r2 = S4.items[1];
assert.equal(R.helpView(s4r2, Object.assign(R.newItemRecord('read'), { state: 'misread', wrongs: 2, helps: 2 })).glow, 's4.c3');
assert.equal(R.helpView(s4r2, Object.assign(R.newItemRecord('read'), { state: 'misread', wrongs: 1, helps: 1 })).glow, null);

// 칭호 경계값
const prog = (doneIds) => Object.fromEntries(doneIds.map(id => [id, { status: 'done', items: {}, rules: [], translations: [], reflection: '' }]));
const T = (lv, done) => J(R.titleFor(prog(done), lv));
assert.deepEqual(T('m', []), { title: '견습 통사', done: 0, total: 4 });
assert.deepEqual(T('m', ['s2']), { title: '견습 통사', done: 1, total: 4 });
assert.deepEqual(T('m', ['s2', 's3']), { title: '통사', done: 2, total: 4 });
assert.deepEqual(T('m', ['s2', 's3', 's9']), { title: '통사', done: 3, total: 4 });
assert.deepEqual(T('m', ['s2', 's3', 's9', 's12']), { title: '정음 통사', done: 4, total: 4 });
// 묶음 밖·서장은 세지 않음
assert.deepEqual(T('m', ['s0', 's4', 's5', 's6', 's1']), { title: '견습 통사', done: 0, total: 4 });
// 고1: 10은 추천 선택이라 세지 않음, 5개 중 절반(2.5) 이상 → 3
assert.deepEqual(T('h1', ['s4', 's5', 's10']), { title: '견습 통사', done: 2, total: 5 });
assert.deepEqual(T('h1', ['s4', 's5', 's6']), { title: '통사', done: 3, total: 5 });
assert.deepEqual(T('h1', ['s4', 's5', 's6', 's9', 's12']), { title: '정음 통사', done: 5, total: 5 });
// 고2~3: 10개
assert.deepEqual(T('h23', ['s1', 's4', 's5', 's6']), { title: '견습 통사', done: 4, total: 10 });
assert.deepEqual(T('h23', ['s1', 's4', 's5', 's6', 's7']), { title: '통사', done: 5, total: 10 });
assert.equal(T('h23', ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11']).title, '통사');
assert.equal(T('h23', ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12']).title, '정음 통사');
// progress 상태만 'done' 인 것
assert.equal(J(R.titleFor({ s2: { status: 'progress' } }, 'm')).done, 0);
assert.equal(J(R.titleFor(undefined, 'm')).title, '견습 통사');
console.log('c2 scope/title ok');
