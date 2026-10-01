// U1 교사 모드 브라우저 점검 (spec §9):
// 주소 teacher=1 로 켜면 학생 기록을 읽지도 쓰지도 않는다(저장소 호출 0), 처음 정하기·서장 없이 장면 고르기,
// 장소 목록 → NM.engine.goTo, 크게 보기(原文 포함), 교사 모드 이미지 표시, 끄면 학생 기록이 그대로(바이트 동일).
// 설정 단추로 켜기(학교급 고르기) → 진행 → 끄기 뒤에도 바이트 동일. 새로 고침하면 꺼진다.
import { makeChecker, startBrowser, newPage, record, KEY } from '../fixtures/u1-harness.mjs';

const C = makeChecker('u1-teacher-browser', 90000);
const { check } = C;
const env = await startBrowser();

// 저장소 호출 엿보기(쪽 스크립트보다 먼저)
const spy = () => {
  window.__storageCalls = [];
  const P = Storage.prototype;
  ['getItem', 'setItem', 'removeItem', 'clear', 'key'].forEach(n => {
    const orig = P[n];
    P[n] = function () { if (this === window.localStorage) window.__storageCalls.push([n, arguments[0]]); return orig.apply(this, arguments); };
  });
};
const calls = (page) => page.evaluate(() => window.__storageCalls.slice());
const seeded = record({
  level: 'm',
  progress: { m: { s2: { status: 'done', items: { 's2.r1': { kind: 'read', state: 'confirmed', seenContexts: ['test.c1', 'test.c2'], guess: 's2.r1.a', wrongs: 0, helps: 0, firstTry: true } }, rules: ['rule.araea'], translations: ['s2.tr1'], reflection: '학생 돌아보기' } } },
  glyphs: { m: ['s2'] }
});

try {
  // ── 1) 주소로 켜기
  let P = await newPage(env, { initScript: spy });
  let page = P.page;
  await P.seed(seeded);
  const before = await P.rawStorage();
  await P.open('?teacher=1&level=h1');
  await P.waitScreen('title');
  check('teacher via URL: no storage access at all on load', (await calls(page)).length === 0, await calls(page));
  check('teacher badge on title', (await page.textContent('#nm-screens')).includes('교사 모드'));
  let st = await P.state();
  check('state: teacher on, level h1', st.teacher === true && st.level === 'h1', st);
  check('large view classes', await page.evaluate(() => document.documentElement.classList.contains('nm-teacher') && document.documentElement.classList.contains('nm-large')));
  await page.click('[data-act="start"]');
  await P.waitScreen('select');
  check('teacher skips setup and prologue', true);
  const roles = await page.$$eval('[data-stage]', els => Object.fromEntries(els.map(e => [e.getAttribute('data-stage'), e.getAttribute('data-role') + ':' + e.getAttribute('data-status')])));
  check('teacher select: h1 bundle, nothing done (student record not read)', roles.s4 === 'bundle:new' && roles.s2 === 'outside:new' && roles.s0, roles);
  check('teacher address shown (no nickname)', (await page.textContent('#nm-screens header')).includes('통사'));
  // 설정 바꾸기(메모리에만)
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-setting="fontScale"] [data-value="3"]');
  await page.click('[data-setting="bangjeom"] [data-value="off"]');
  const sNew = await page.$$eval('[data-setting="newstart"] button', bs => bs.map(b => b.disabled));
  check('new start disabled in teacher mode', sNew.length === 1 && sNew[0] === true, sNew);
  await page.keyboard.press('Escape');
  // 장면 들어가기
  await page.click('[data-stage="s4"]');
  await page.waitForFunction(() => window.__stub && __stub.runs.length === 1);
  const run = await page.evaluate(() => __stub.runs[0]);
  check('stage ctx: teacher flag + memory store + level', run.teacher === true && run.storeIsTeacher === true && run.level === 'h1', run);
  await page.evaluate(() => __stub.mapReady);
  check('places button in toolbar (teacher)', await page.isVisible('#nm-toolbar [data-act="places"]'));
  await page.evaluate(() => { window.__goTo = []; const g = NM.engine.goTo; NM.engine.goTo = function (id) { window.__goTo.push(id); return g.apply(this, arguments); }; });
  await page.click('#nm-toolbar [data-act="places"]');
  await P.waitModal('places');
  const places = await page.$$eval('.nm-modal[data-modal="places"] [data-act="place"]', bs => bs.map(b => ({ id: b.getAttribute('data-place'), text: b.textContent })));
  check('place list from engine (3 spots + 1 npc)', places.length === 4, places);
  check('place label from scene data', places.some(p => p.id === 'test.c3' && p.text.includes('책상')), places);
  await page.click('.nm-modal[data-modal="places"] [data-place="test.c3"]');
  check('goTo called with place id, list closed', (await page.evaluate(() => window.__goTo.slice())).join() === 'test.c3' && !(await P.modalOpen('places')));
  // 교사 모드 이미지
  await page.evaluate(() => __stub.solveFirstRead(false));
  await page.click('#nm-toolbar [data-act="notebook"]');
  await P.waitModal('notebook');
  await page.click('.nm-modal[data-modal="notebook"] [data-act="save-image"]');
  await P.waitModal('image-form');
  await page.click('.nm-modal[data-modal="image-form"] [data-act="make-image"]');
  await P.waitModal('image-preview');
  const li = await page.evaluate(() => NM.ui.app.test.lastImage());
  check('teacher image has teacher mark', li && li.model.teacher === true && li.texts.some(t => t.includes('교사 모드')), li && li.model);
  await page.evaluate(() => NM.ui.dom.closeAll());
  await page.evaluate(() => __stub.exit());
  await P.waitScreen('select');
  check('still no storage access while teacher', (await calls(page)).length === 0, await calls(page));
  // 끄기
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-act="teacher-off"]');
  await P.waitScreen('title');
  st = await P.state();
  check('teacher off → student view (URL level stays for this session)', st.teacher === false && st.level === 'h1' && !!(await page.$('[data-act="continue"]')), st);
  check('large class removed, student font scale', await page.evaluate(() => !document.documentElement.classList.contains('nm-large') && getComputedStyle(document.documentElement).getPropertyValue('--fs').trim() === '1'));
  const writes = (await calls(page)).filter(c => c[0] !== 'getItem' && c[0] !== 'key');
  check('no storage writes in whole teacher session', writes.length === 0, writes);
  check('student record byte-identical after teacher on/off (URL)', (await P.rawStorage()) === before);
  check('student record still level m', (await P.saved()).level === 'm');
  await P.clean(check, 'teacher-url');
  await P.context.close();

  // ── 2) 설정 단추로 켜기(학교급 고르기) → 진행 → 끄기
  P = await newPage(env, { initScript: spy });
  page = P.page;
  await P.seed(seeded);
  await P.open('');
  await P.waitScreen('title');
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');
  await page.click('#nm-screens [data-act="notebook"]');
  await P.waitModal('notebook');
  await page.selectOption('#nm-nb-stage', 's2');
  const studentYet = await page.$eval('.nm-modal[data-modal="notebook"] [data-section="items"] .nm-yet', e => parseFloat(getComputedStyle(e).fontSize));
  const studentBtn = await page.$eval('.nm-modal[data-modal="notebook"] [data-act="save-image"]', e => parseFloat(getComputedStyle(e).fontSize));
  check('student notebook shows student data', (await page.textContent('.nm-modal[data-modal="notebook"]')).includes('말씀이'));
  await page.keyboard.press('Escape');
  const snap = await P.rawStorage();
  await page.evaluate(() => { window.__storageCalls.length = 0; });
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-act="teacher-on"]');
  await page.waitForSelector('[data-act="teacher-level"]');
  check('teacher-on without URL level asks for level', (await page.$$('[data-act="teacher-level"]')).length === 3);
  await page.click('[data-act="teacher-level"][data-value="h23"]');
  await P.waitScreen('select');
  st = await P.state();
  check('teacher on via settings, level h23', st.teacher === true && st.level === 'h23', st);
  await page.click('[data-stage="s2"]');
  await P.waitModal('notice-outside');
  await page.click('.nm-modal[data-modal="notice-outside"] [data-act="enter"]');
  await page.waitForFunction(() => __stub.runs.length === 1);
  await page.evaluate(() => __stub.finish());
  await P.waitScreen('select');
  check('teacher progress shown in memory', (await page.getAttribute('[data-stage="s2"]', 'data-status')) === 'done');
  await page.click('#nm-screens [data-act="notebook"]');
  await P.waitModal('notebook');
  await page.selectOption('#nm-nb-stage', 's2');
  const teacherYet = await page.$eval('.nm-modal[data-modal="notebook"] [data-section="items"] .nm-yet', e => parseFloat(getComputedStyle(e).fontSize));
  const teacherBtn = await page.$eval('.nm-modal[data-modal="notebook"] [data-act="save-image"]', e => parseFloat(getComputedStyle(e).fontSize));
  check('large view enlarges 原文 (old Hangul) too', teacherYet >= studentYet * 1.25, { teacherYet, studentYet });
  check('large view enlarges buttons', teacherBtn >= studentBtn * 1.25, { teacherBtn, studentBtn });
  await page.keyboard.press('Escape');
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-setting="fontScale"] [data-value="2"]');
  await page.click('[data-act="teacher-off"]');
  await P.waitScreen('title');
  const w2 = (await calls(page)).filter(c => c[0] !== 'getItem' && c[0] !== 'key');
  check('no storage writes while teacher (settings path)', w2.length === 0, w2);
  check('student record byte-identical after teacher on/off (settings)', (await P.rawStorage()) === snap);
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');
  const sv = await page.$$eval('[data-stage]', els => Object.fromEntries(els.map(e => [e.getAttribute('data-stage'), e.getAttribute('data-role') + ':' + e.getAttribute('data-status')])));
  check('student view restored (m, s2 done by student)', sv.s2 === 'bundle:done' && sv.s1 === 'outside:new', sv);
  // 새로 고침하면 교사 모드는 꺼진다(저장 안 함)
  await P.open('');
  st = await P.state();
  check('reload: teacher mode off (not persisted)', st.teacher === false);
  await P.clean(check, 'teacher-settings');
  await P.context.close();

  // ── 3) teacher=1, 학교급 값 없음 → 켤 때 고른다
  P = await newPage(env, { initScript: spy });
  page = P.page;
  await P.seed(seeded);
  await P.open('?teacher=1');
  await P.waitScreen('title');
  await page.click('[data-act="start"]');
  await page.waitForSelector('[data-act="teacher-level"]');
  check('settings button on teacher-level screen', !!(await page.$('#nm-screens [data-act="settings"]')));
  await page.click('[data-act="teacher-level"][data-value="m"]');
  await P.waitScreen('select');
  check('teacher=1 without level: picked level used', (await P.state()).level === 'm' && (await page.getAttribute('[data-stage="s2"]', 'data-status')) === 'new');
  check('teacher=1 without level: no storage access', (await calls(page)).length === 0, await calls(page));
  await P.clean(check, 'teacher-nolevel');
  await P.context.close();
} catch (e) {
  check('no exception', false, String(e && e.stack || e));
} finally {
  await env.close();
}
C.finish();
