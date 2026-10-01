// C2: 기록 저장소 (spec §10-2, §19-5, §9)
import assert from 'node:assert/strict';
import { boot, J, fakeStorage, throwingStorage, stageById, clearStage, S0, S1, S2, S4 } from './c2-fixtures.mjs';

const ctx = boot();
const NM = ctx.NM;
const S = NM.core.save;
const KEY = 'naratmalssami:v1';
assert.equal(S.KEY, KEY);
assert.equal(typeof S.VERSION, 'number');

// console.error 를 쓰면 실패
const origErr = console.error;
console.error = (...a) => { origErr(...a); throw new Error('console.error 사용 금지'); };

// 기본 기록
const def = J(S.defaultRecord('h1'));
assert.deepEqual(def, {
  v: S.VERSION, level: 'h1', protagonist: 1, nickname: '',
  settings: { bangjeom: true, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true },
  prologueDone: false, progress: {}, glyphs: {}, seenNotices: []
});

// ── 첫 실행, 처음 정하기, 저장→복원 동일
{
  const st = fakeStorage();
  const store = S.createStore({ storage: st });
  assert.equal(store.hasRecord, false);
  assert.equal(store.storageAvailable, true);
  assert.equal(store.canSelectStage(), false, '서장 전에는 스테이지 고르기 닫힘');
  assert.equal(store.setup({ level: 'm', protagonist: 3, nickname: '세종1' }).ok, true);
  assert.equal(store.hasRecord, true);
  assert.equal(store.setup({ level: 'm', protagonist: 9, nickname: '세종' }).ok, false, '주인공 범위');
  assert.equal(store.setNickname('씨발').ok, false);
  assert.equal(store.setNickname('씨발').reason, 'profanity');
  assert.equal(store.get().nickname, '세종1');
  store.setSettings({ fontScale: 3, bgm: false, reducedMotion: true, junk: 1, sfx: 'x' });
  const s = J(store.get().settings);
  assert.deepEqual(s, { bangjeom: true, fontScale: 3, reducedMotion: true, bgm: false, sfx: true });
  // 서장
  const r0 = clearStage(ctx, store, S0);
  assert.equal(r0.ok, true);
  assert.equal(store.get().prologueDone, true);
  assert.deepEqual(J(store.get().glyphs), {}, '서장은 패 글자 없음');
  assert.equal(store.canSelectStage(), true);
  store.markNotice('outside.s4');
  assert.equal(store.hasSeenNotice('outside.s4'), true);
  store.markNotice('outside.s4');
  // 진행 중 장면
  store.seeContext(S2, 's2.c1');
  store.choose(S2, 's2.r1', 's2.r1.a');
  store.addTranslation('s2', 'tr.1');
  store.setReflection('s2', '달랐다');
  assert.equal(store.stage('s2').status, 'progress');
  // 복원
  const raw = JSON.parse(st.data.get(KEY));
  assert.equal(raw.v, S.VERSION);
  const again = S.createStore({ storage: st });
  assert.equal(again.hasRecord, true);
  assert.deepEqual(J(again.get()), J(store.get()));
  assert.deepEqual(J(again.get().seenNotices), ['outside.s4']);
  assert.deepEqual(J(again.stage('s2').items['s2.r1']), { kind: 'read', state: 'guessed', seenContexts: ['s2.c1'], guess: 's2.r1.a', wrongs: 0, helps: 0, firstTry: null });
  // 학교급 m 에서 s2.r2 는 핵심 아님 → 기록 없음
  assert.equal(again.stage('s2').items['s2.r2'], undefined);
  // get() 은 사본
  again.get().nickname = 'zzz';
  assert.equal(again.get().nickname, '세종1');
}

// ── 한 번에 저장: 규칙 항목 확정 = 항목 상태 + 규칙 카드가 쓰기 1번에
{
  const st = fakeStorage();
  const store = S.createStore({ storage: st, urlLevel: 'h23' });
  store.setup({ protagonist: 1, nickname: 'abc' });
  store.seeContext(S4, 's4.c1'); store.seeContext(S4, 's4.c3');
  store.choose(S4, 's4.r2', 's4.r2.b');
  const before = st.sets();
  const r = store.confirm(S4, 's4.r2');
  assert.equal(r.ok, true);
  assert.equal(r.correct, true);
  assert.equal(r.ruleCard, 'rule.nomCase');
  assert.equal(st.sets() - before, 1, '쓰기 한 번');
  const raw = JSON.parse(st.data.get(KEY));
  assert.equal(raw.progress.h23.s4.items['s4.r2'].state, 'confirmed');
  assert.deepEqual(raw.progress.h23.s4.rules, ['rule.nomCase']);
  // 실패한 동작은 쓰지 않는다
  const n = st.sets();
  assert.equal(store.confirm(S4, 's4.r2').ok, false);
  assert.equal(store.choose(S4, 'nope', 'x').ok, false);
  assert.equal(store.seeContext(S4, 's4.c99').ok, false);
  assert.equal(store.submit(S4, 's4.r1', true).ok, false, '해독 항목에 제출 금지');
  assert.equal(st.sets(), n);
  // 끝나기 전 completeStage 금지
  assert.equal(store.completeStage(S4).ok, false);
  assert.equal(store.completeStage(S4).reason, 'incomplete');
}

// ── 도움으로 확정된 규칙 항목도 규칙 카드가 붙는다
{
  const store = S.createStore({ storage: fakeStorage(), urlLevel: 'h23' });
  store.seeContext(S4, 's4.c1'); store.seeContext(S4, 's4.c3');
  for (const c of ['s4.r2.a', 's4.r2.c', 's4.r2.a']) { store.choose(S4, 's4.r2', c); store.confirm(S4, 's4.r2'); }
  assert.equal(store.stage('s4').items['s4.r2'].state, 'confirmedByHelp');
  assert.deepEqual(J(store.stage('s4').rules), ['rule.nomCase']);
}

// ── 보상은 한 번만(새로 고침 흉내)
{
  const st = fakeStorage();
  let store = S.createStore({ storage: st, urlLevel: 'm' });
  store.setup({ protagonist: 2, nickname: '' });
  const r = clearStage(ctx, store, S2);
  assert.deepEqual([r.ok, r.newlyDone, r.glyphAdded], [true, true, true]);
  assert.equal(store.stage('s2').status, 'done');
  assert.deepEqual(J(store.get().glyphs), { m: ['s2'] });
  // 완료 + 패 글자가 한 번의 쓰기에 같이 들어감
  const raw = JSON.parse(st.data.get(KEY));
  assert.equal(raw.progress.m.s2.status, 'done');
  assert.deepEqual(raw.glyphs.m, ['s2']);
  store = S.createStore({ storage: st });
  const r2 = store.completeStage(S2);
  assert.deepEqual([r2.ok, r2.newlyDone, r2.glyphAdded], [true, false, false]);
  assert.deepEqual(J(store.get().glyphs), { m: ['s2'] });

  // 다시 하기: 수첩·상태 비움, 패 글자·firstTry 유지, 상태는 done 유지
  store.seeContext(S2, 's2.c1');
  assert.equal(store.replay('s2').ok, true);
  const p = J(store.stage('s2'));
  assert.equal(p.status, 'done');
  assert.deepEqual([p.rules, p.translations, p.reflection], [[], [], '']);
  assert.deepEqual(p.items['s2.r1'], { kind: 'read', state: 'unseen', seenContexts: [], guess: null, wrongs: 0, helps: 0, firstTry: true });
  assert.deepEqual(p.items['s2.t1'], { kind: 'task', state: 'open', wrongs: 0, helps: 0, firstTry: true });
  assert.deepEqual(J(store.get().glyphs), { m: ['s2'] });
  assert.equal(store.title().done, 1, '다시 하는 동안 칭호 유지');
  // 다시 하는 중 틀려도 firstTry 그대로, 도움·오해는 이번 회의 값
  store.seeContext(S2, 's2.c1'); store.seeContext(S2, 's2.c2');
  store.choose(S2, 's2.r1', 's2.r1.a'); store.confirm(S2, 's2.r1');
  store.choose(S2, 's2.r1', 's2.r1.b'); store.confirm(S2, 's2.r1');
  store.submit(S2, 's2.t1', false); store.submit(S2, 's2.t1', true);
  const it = store.stage('s2').items;
  assert.deepEqual([it['s2.r1'].firstTry, it['s2.r1'].wrongs, it['s2.t1'].firstTry], [true, 1, true]);
  assert.deepEqual(J(store.stats(S2)), { firstTryRate: 1, firstTryRight: 2, firstTrySet: 2, helps: 2, misreads: 1 });
  const r3 = store.completeStage(S2);
  assert.deepEqual([r3.ok, r3.newlyDone, r3.glyphAdded], [true, false, false]);
  assert.deepEqual(J(store.get().glyphs), { m: ['s2'] });
  // 끝나지 않은 장면은 다시 하기 불가
  assert.equal(store.replay('s3').ok, false);
}

// ── 묶음 밖 장면: 패 글자는 주고 칭호엔 안 셈
{
  const store = S.createStore({ storage: fakeStorage(), urlLevel: 'm' });
  assert.equal(store.bundleRole('s4'), 'outside');
  const r = clearStage(ctx, store, S4); // 중학생 → 고1 범위(s4.r1, s4.t1)
  assert.equal(r.ok, true);
  assert.deepEqual(J(store.get().glyphs), { m: ['s4'] });
  assert.equal(store.title().done, 0);
  assert.equal(store.stage('s4').items['s4.r2'], undefined);
  // 고2~3 전용 장면
  const r1 = clearStage(ctx, store, S1);
  assert.equal(r1.ok, true);
  assert.deepEqual(Object.keys(store.stage('s1').items).sort(), ['s1.r1', 's1.r2']);
  for (const id of ['s2', 's3', 's9']) clearStage(ctx, store, stageById(id));
  assert.equal(store.title().title, '통사');
  clearStage(ctx, store, stageById('s12'));
  assert.equal(store.title().title, '정음 통사');
}

// ── 학교급 바꾸기: 학교급별로 따로, 다른 학교급 기록 유지
{
  const st = fakeStorage();
  const store = S.createStore({ storage: st });
  store.setup({ level: 'm', protagonist: 1, nickname: '' });
  clearStage(ctx, store, S2);
  store.setLevel('h1');
  assert.equal(store.level, 'h1');
  assert.equal(store.get().level, 'h1');
  assert.equal(store.stage('s2').status, 'new');
  assert.equal(store.title().done, 0);
  clearStage(ctx, store, S4);
  store.setLevel('m');
  assert.equal(store.stage('s2').status, 'done');
  assert.equal(store.stage('s4').status, 'new');
  assert.deepEqual(J(store.get().glyphs), { m: ['s2'], h1: ['s4'] });
  assert.equal(store.setLevel('x').ok, false);
}

// ── 주소 학교급: 기록이 있으면 이번 접속만, 진행은 그 학교급 칸에
{
  const st = fakeStorage();
  const first = S.createStore({ storage: st });
  first.setup({ level: 'm', protagonist: 1, nickname: '' });
  const store = S.createStore({ storage: st, urlLevel: 'h23' });
  assert.equal(store.level, 'h23');
  assert.equal(store.get().level, 'm');
  clearStage(ctx, store, S4);
  const raw = JSON.parse(st.data.get(KEY));
  assert.equal(raw.level, 'm', '주소 학교급은 저장하지 않음');
  assert.equal(raw.progress.h23.s4.status, 'done');
  assert.equal(raw.progress.m, undefined);
  // 다음 접속(주소 값 없음) → 기록 학교급
  const later = S.createStore({ storage: st });
  assert.equal(later.level, 'm');
  // 이상한 주소 값은 무시
  assert.equal(S.createStore({ storage: st, urlLevel: 'zz' }).level, 'm');
}
// 첫 실행이면 주소 학교급이 기록의 학교급
{
  const st = fakeStorage();
  const store = S.createStore({ storage: st, urlLevel: 'h1' });
  assert.equal(store.level, 'h1');
  store.setup({ protagonist: 4, nickname: 'Kim' });
  const raw = JSON.parse(st.data.get(KEY));
  assert.equal(raw.level, 'h1');
  assert.equal(raw.protagonist, 4);
}

// ── 새로 시작: 기록 전부 지움
{
  const st = fakeStorage();
  const store = S.createStore({ storage: st, urlLevel: 'm' });
  store.setup({ protagonist: 2, nickname: '' });
  clearStage(ctx, store, S2);
  store.newStart();
  assert.equal(st.data.has(KEY), false);
  assert.equal(store.hasRecord, false);
  assert.deepEqual(J(store.get().progress), {});
  assert.deepEqual(J(store.get().glyphs), {});
  assert.equal(store.get().prologueDone, false);
  assert.equal(S.createStore({ storage: st }).hasRecord, false);
}

// ── 망가진 기록 → 기본값(던지지 않음)
{
  for (const bad of ['{not json', 'null', '42', '"str"', '[]', JSON.stringify({ v: 999, level: 'h1' }), JSON.stringify({ level: 'h1' })]) {
    const store = S.createStore({ storage: fakeStorage({ [KEY]: bad }) });
    assert.equal(store.hasRecord, false, bad);
    assert.deepEqual(J(store.get()), J(S.defaultRecord('m')), bad);
  }
  const mixed = {
    v: S.VERSION, level: 'h9', protagonist: 7, nickname: 12,
    settings: { bangjeom: 'yes', fontScale: 5, reducedMotion: 'maybe', bgm: false, sfx: null },
    prologueDone: 'true',
    progress: {
      h1: {
        s4: { status: 'weird', items: {
          's4.r1': { kind: 'read', state: 'flying', seenContexts: ['a', 'a', 3, 'b'], guess: 5, wrongs: -2, helps: 9, firstTry: 'no' },
          's4.t1': { kind: 'task', state: 'done', wrongs: 1.5, helps: 1, firstTry: true },
          'junk': { kind: 'other' }, 'nul': null
        }, rules: ['rule.a', 'rule.a', 4], translations: 'x', reflection: 5 },
        s99: { status: 'done' }
      },
      zz: { s1: { status: 'done' } }
    },
    glyphs: { m: ['s2', 's2', 's0', 'bogus', 5], zz: ['s1'] },
    seenNotices: ['a', 'a', null]
  };
  const store = S.createStore({ storage: fakeStorage({ [KEY]: JSON.stringify(mixed) }) });
  const g = J(store.get());
  assert.equal(store.hasRecord, true);
  assert.equal(g.level, 'm');
  assert.equal(g.protagonist, 1);
  assert.equal(g.nickname, '');
  assert.deepEqual(g.settings, { bangjeom: true, fontScale: 1, reducedMotion: 'auto', bgm: false, sfx: true });
  assert.equal(g.prologueDone, false);
  assert.deepEqual(Object.keys(g.progress), ['h1']);
  assert.deepEqual(Object.keys(g.progress.h1), ['s4']);
  const p = g.progress.h1.s4;
  assert.equal(p.status, 'new');
  assert.deepEqual(p.items['s4.r1'], { kind: 'read', state: 'met', seenContexts: ['a', 'b'], guess: null, wrongs: 0, helps: 0, firstTry: null });
  assert.deepEqual(p.items['s4.t1'], { kind: 'task', state: 'done', wrongs: 0, helps: 1, firstTry: true });
  assert.deepEqual(Object.keys(p.items).sort(), ['s4.r1', 's4.t1']);
  assert.deepEqual([p.rules, p.translations, p.reflection], [['rule.a'], [], '']);
  assert.deepEqual(g.glyphs, { m: ['s2'] });
  assert.deepEqual(g.seenNotices, ['a']);
  // normalizeRecord 직접
  assert.equal(J(S.normalizeRecord(undefined)), null);
  assert.equal(J(S.normalizeRecord({ v: 999 })), null);
}

// ── 막힌 저장소 → 메모리로 계속, 알림 한 번
{
  const st = throwingStorage();
  const store = S.createStore({ storage: st, urlLevel: 'h1' });
  assert.equal(store.storageAvailable, false);
  assert.equal(store.takeStorageWarning(), true);
  assert.equal(store.takeStorageWarning(), false, '알림 한 번');
  store.setup({ protagonist: 1, nickname: '' });
  const r = clearStage(ctx, store, S4);
  assert.equal(r.ok, true);
  assert.equal(store.stage('s4').status, 'done');
  store.newStart();
  // 쓰기만 막힌 경우(읽기는 됨)
  const half = fakeStorage();
  half.setItem = () => { throw new Error('QuotaExceeded'); };
  const s2 = S.createStore({ storage: half });
  assert.equal(s2.storageAvailable, true);
  s2.setup({ level: 'm', protagonist: 1, nickname: '' });
  assert.equal(s2.storageAvailable, false);
  assert.equal(s2.get().protagonist, 1);
  assert.equal(s2.takeStorageWarning(), true);
  // 저장소 없음
  assert.equal(S.createStore({}).storageAvailable, false);
}

// ── 교사 모드: 저장소 읽기·쓰기 0
{
  const st = fakeStorage({ [KEY]: JSON.stringify(Object.assign(J(S.defaultRecord('h23')), { protagonist: 3, nickname: '학생', prologueDone: true })) });
  st.calls.length = 0;
  const t = S.createStore({ storage: st, teacher: true, urlLevel: 'h1' });
  assert.equal(t.isTeacher, true);
  assert.equal(t.level, 'h1');
  assert.equal(t.get().protagonist, 1);
  assert.equal(t.get().nickname, '');
  assert.equal(t.get().prologueDone, false);
  t.setSettings({ fontScale: 3 });
  clearStage(ctx, t, S0);
  clearStage(ctx, t, S4);
  t.replay('s4');
  t.setLevel('m');
  t.newStart();
  assert.equal(st.calls.length, 0, '교사 모드 저장소 호출 0');
  assert.equal(J(t.get()).teacher, undefined);
  assert.equal(S.createStore({ teacher: true }).level, 'm');
  assert.equal(S.createStore({ teacher: true, level: 'h23' }).level, 'h23');
}

console.error = origErr;
console.log('c2 save ok');
