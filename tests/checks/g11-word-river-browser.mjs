// G11 기믹 'wordRiver'(종장 고등판 변화의 강) 브라우저 점검 — 실제 장면 진행기 안에서 시험 장면(tests/fixtures/g-wordRiver.js)으로 돈다.
// - 그리기: 낱말마다 강의 나루(앞 → 뒤), 섞인 옛 꼴 조각(옛한글 DOM·NMYet·낭독기용 현대 표기), 연도·세기 글자 없음
// - 조각 누르면 다음 빈 나루, 놓인 조각 누르면 돌아옴 / 키보드(Tab·Enter·Space) / 다 채우기 전에는 낼 수 없음
// - 지금의 변화 여럿 고르기, 500년 뒤 예측 한 줄(채점 안 함, 답에 안 들어감)
// - 틀린 제출 → 틀린 나루·잘못 고른 보기에 ✕, 빠짐 △ 안내, open / 2번째 → showHint(2) ★ / 3번째 → doneByHelp + 정답
// - 끝난 과제 다시 열기 → 읽기 전용 정답 / 맞게 내기 → done / 중학교판에는 이 과제가 없음 / 360px 가로 스크롤 없음
// - 오류 0, 콘솔 오류 0, 외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL g11-word-river-browser: time limit (180 s)'); process.exit(1); }, 180000);
let failed = 0;
function check(name, ok, info) {
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}

const server = await serve();
let browser;
const consoleErrors = [];
const external = [];
function watch(page) {
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
}
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
const G = TOP + ' .wr';
async function topWin(page) {
  return page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind') } : null; }, TOP);
}
async function advance(page, max = 30) {
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog') break;
    await page.click(TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
}
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s12'); return p.items[id] ? p.items[id].state : 'none'; }, id);
const closeAll = (page) => page.evaluate(() => { while (NM.engine.isOverlayOpen()) NM.engine.closeOverlay(); });
async function openTask(page, id) {
  await closeAll(page);
  await page.evaluate((id) => NM.ui.stage.openItem(id), id);
  await page.waitForSelector(G);
}
const chip = (page, id) => page.click(`${G} .wr-chip[data-chip="${id}"]`);
async function fillWord(page, ids) { for (const id of ids) await chip(page, id); }
const choose = (page, id) => page.click(`${G} .wr-choice[data-choice="${id}"]`);

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  let page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-wordRiver.html?stage=s12&level=h1&reset=1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  check('gimmick registered', await page.evaluate(() => !!NM.gimmicks.get('wordRiver')));
  check('HUD lists both tasks at h1 (고등판)', (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's12.t1,s12.t2');

  // ───── 1) 그리기 ─────
  await openTask(page, 's12.t1');
  const r = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const rows = [...box.querySelectorAll('.wr-word')];
    const yet = box.querySelector('.wr-chip .nm-yet');
    return {
      rows: rows.map(w => w.getAttribute('data-word') + ':' + w.querySelectorAll('.wr-stop').length).join(),
      labels: rows.map(w => w.querySelector('.wr-word-label').textContent),
      ends: box.querySelector('.wr-word .wr-river').textContent,
      pool: [...box.querySelectorAll('.wr-word[data-word="jopssal"] .wr-chip')].map(c => c.getAttribute('data-chip')),
      chipSr: [...box.querySelectorAll('.wr-chip .nm-sr')].every(s => s.textContent && !/[ᄀ-ᇿ]/.test(s.textContent)),
      yetFont: yet ? getComputedStyle(yet).fontFamily : null,
      years: /\d{3,4}\s*년|세기/.test([...box.querySelectorAll('.wr-order')].map(n => n.textContent).join(' ')),
      choices: box.querySelectorAll('.wr-choice').length, predict: !!box.querySelector('.wr-predict textarea'),
      submitDisabled: box.querySelector('.wr-submit').disabled, need: !box.querySelector('.wr-need').hidden,
      canvas: !!box.querySelector('canvas'),
      smallTargets: [...box.querySelectorAll('button')].filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && (q.height < 44 || q.width < 44); }).length
    };
  }, G);
  check('one river per word with as many stops as stages', r.rows === 'anpak:2,jopssal:4,sukgarak:3,salkogi:2', r.rows);
  check('word labels (label or n-th word), upstream/downstream ends', r.labels[0].includes('안팎') && r.labels[3].includes('4') && r.ends.includes('앞') && r.ends.includes('뒤'), r);
  check('pool shuffled (not in stage order)', r.pool.length === 4 && r.pool.join() !== 'jopssal.0,jopssal.1,jopssal.2,jopssal.3', r.pool);
  check('old forms as DOM in NMYet with modern reading for screen readers', /NMYet/.test(r.yetFont || '') && r.chipSr && !r.canvas, r);
  check('no years/centuries shown in the river (order only)', !r.years);
  check('now choices + ungraded prediction box', r.choices === 5 && r.predict, r);
  check('cannot submit before complete', r.submitDisabled && r.need, r);
  check('touch targets >= 44px', r.smallTargets === 0, r.smallTargets);

  // ───── 2) 조각 놓기·돌려보내기·키보드 ─────
  await chip(page, 'anpak.1');
  let s = await page.evaluate((g) => [...document.querySelectorAll(g + ' .wr-word[data-word="anpak"] .wr-stop')].map(b => b.getAttribute('data-chip')).join(), G);
  check('tap chip → first empty stop', s === 'anpak.1,', s);
  await page.click(`${G} .wr-stop[data-word="anpak"][data-pos="1"]`);
  s = await page.evaluate((g) => ({ stops: [...document.querySelectorAll(g + ' .wr-word[data-word="anpak"] .wr-stop')].map(b => b.getAttribute('data-chip')).join(), back: !document.querySelector(g + ' .wr-chip[data-chip="anpak.1"]').hidden, focus: document.activeElement.getAttribute('data-chip') }), G);
  check('tap placed stop → chip returns to pool (focus follows)', s.stops === ',' && s.back && s.focus === 'anpak.1', s);
  await page.focus(`${G} .wr-chip[data-chip="anpak.0"]`);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space'); // 초점이 다음 남은 조각(anpak.1)으로 옮겨 가 있다
  s = await page.evaluate((g) => ({ stops: [...document.querySelectorAll(g + ' .wr-word[data-word="anpak"] .wr-stop')].map(b => b.getAttribute('data-chip')).join(), label: document.querySelector(g + ' .wr-stop[data-word="anpak"][data-pos="2"]').getAttribute('aria-label') }), G);
  check('keyboard: Enter/Space place chips in order, stops have aria labels', s.stops === 'anpak.0,anpak.1' && /2/.test(s.label), s);
  await page.keyboard.press('Tab');
  check('Tab moves focus inside gimmick', await page.evaluate((g) => !!document.activeElement.closest(g), G));

  // ───── 3) 틀린 제출 1: 좁쌀 2·3 바꿈, n4 잘못 고름, n3 빠짐 ─────
  await fillWord(page, ['jopssal.0', 'jopssal.2', 'jopssal.1', 'jopssal.3']);
  await fillWord(page, ['sukgarak.0', 'sukgarak.1', 'sukgarak.2']);
  await fillWord(page, ['salkogi.0', 'salkogi.1']);
  check('submit still disabled without a now choice', await page.evaluate((g) => document.querySelector(g + ' .wr-submit').disabled, G));
  await choose(page, 'n1'); await choose(page, 'n2'); await choose(page, 'n4');
  await page.fill(`${G} .wr-predict-input`, '받침이 더 줄어들 것 같다');
  check('submit enabled when complete', await page.evaluate((g) => !document.querySelector(g + ' .wr-submit').disabled, G));
  await page.evaluate(() => { window.__answers = []; const def = NM.gimmicks.get('wordRiver'); const c = def.check; def.check = function (a, i) { window.__answers.push(JSON.parse(JSON.stringify(a))); return c(a, i); }; });
  await page.click(`${G} .wr-submit`);
  let w = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    return {
      wrongStops: [...box.querySelectorAll('.wr-stop.is-wrong')].map(b => b.getAttribute('data-word') + b.getAttribute('data-pos')).sort().join(),
      sym: box.querySelectorAll('.wr-stop.is-wrong .wr-sym-wrong').length,
      wrongChoices: [...box.querySelectorAll('.wr-choice.is-wrong')].map(b => b.getAttribute('data-choice')).join(),
      missing: !box.querySelector('.wr-missing').hidden && box.querySelector('.wr-now').classList.contains('is-missing'),
      hint: win.querySelector('.nm-st-hint') && win.querySelector('.nm-st-hint').textContent,
      emph: box.querySelectorAll('.is-hint').length, answer: window.__answers[0]
    };
  }, G);
  check('1st wrong: wrong stops marked immediately with ✕ (jopssal 2, 3)', w.wrongStops === 'jopssal2,jopssal3' && w.sym === 2, w);
  check('1st wrong: wrongly picked change marked (n4), missing one → △ notice without revealing which', w.wrongChoices === 'n4' && w.missing, w);
  check('1st wrong: open, hint 1, no emphasis yet', (await state(page, 's12.t1')) === 'open' && w.hint && w.hint.includes('시험 힌트') && w.emph === 0, w);
  check('prediction text is not part of the graded answer', w.answer && !JSON.stringify(w.answer).includes('받침이') && Object.keys(w.answer).sort().join() === 'now,order', w.answer);
  await choose(page, 'n4'); // 고르기 풀기 → 표시 걷힘
  check('un-picking a marked choice clears its mark and the missing notice', await page.evaluate((g) => !document.querySelector(g + ' .wr-choice.is-wrong') && document.querySelector(g + ' .wr-missing').hidden, G));
  await choose(page, 'n4');

  // ───── 4) 2번째 → ★ ─────
  await page.click(`${G} .wr-submit`);
  w = await page.evaluate((g) => { const row = document.querySelector(g + ' .wr-word[data-target="jopssal"]'); return { hint: row.classList.contains('is-hint') && !!row.querySelector('.wr-sym-hint'), open: true }; }, G);
  check('2nd wrong → showHint(2) emphasizes the jopssal river with ★', w.hint, w);
  check('2nd wrong: still open', (await state(page, 's12.t1')) === 'open');
  check('prediction kept while the window is open', (await page.inputValue(`${G} .wr-predict-input`)) === '받침이 더 줄어들 것 같다');

  // ───── 5) 3번째 → doneByHelp ─────
  await page.click(`${G} .wr-submit`);
  w = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    return {
      jop: [...box.querySelectorAll('.wr-word[data-word="jopssal"] .wr-stop')].map(b => b.getAttribute('data-chip')).join(),
      ans: box.querySelectorAll('.wr-stop.is-answer').length,
      now: [...box.querySelectorAll('.wr-choice[aria-pressed="true"]')].map(b => b.getAttribute('data-choice')).join(),
      nowAns: box.querySelectorAll('.wr-choice.is-answer').length,
      locked: [...box.querySelectorAll('button.wr-stop, button.wr-chip, button.wr-choice')].every(b => b.disabled), submit: box.querySelector('.wr-submit').hidden,
      explain: win.querySelector('.nm-card[data-mark="explain"]') && win.querySelector('.nm-card[data-mark="explain"]').textContent
    };
  }, G);
  check('3rd wrong → doneByHelp', (await state(page, 's12.t1')) === 'doneByHelp');
  check('answer shown in order with ○, correct changes picked, locked, explanation', w.jop === 'jopssal.0,jopssal.1,jopssal.2,jopssal.3' && w.ans === 11 && w.now === 'n1,n2,n3' && w.nowAns === 3 && w.locked && w.submit && w.explain && w.explain.includes('시험 풀이'), w);

  // ───── 6) 다시 열기 → 읽기 전용 ─────
  await openTask(page, 's12.t1');
  w = await page.evaluate((g) => { const box = document.querySelector(g); return { locked: box.classList.contains('is-locked'), ans: box.querySelectorAll('.wr-stop.is-answer').length, dis: [...box.querySelectorAll('button.wr-stop, button.wr-chip, button.wr-choice')].every(b => b.disabled), submit: box.querySelector('.wr-submit').hidden, predict: box.querySelector('.wr-predict-input').value }; }, G);
  check('reopen done task → read-only answer', w.locked && w.ans === 11 && w.dis && w.submit, w);
  check('prediction remembered for this session only (not in the record)', w.predict === '받침이 더 줄어들 것 같다' && !(await page.evaluate(() => JSON.stringify(window.__store.get()).includes('받침이 더'))), w);

  // ───── 7) 맞게 내기 → done ─────
  await openTask(page, 's12.t2');
  await fillWord(page, ['sk.0', 'sk.1', 'sk.2']);
  await page.click(`${G} .wr-submit`);
  w = await page.evaluate((g) => { const box = document.querySelector(g); return { done: box.classList.contains('is-done'), dis: [...box.querySelectorAll('.wr-stop')].every(b => b.disabled), now: !!box.querySelector('.wr-now'), predict: !!box.querySelector('.wr-predict') }; }, G);
  check('correct submit → done, locked; optional parts absent when not configured', (await state(page, 's12.t2')) === 'done' && w.done && w.dis && !w.now && !w.predict, w);
  await closeAll(page);
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors', errs.length === 0, errs);
  await page.close();

  // ───── 8) 중학교판: 이 기믹 과제 없음 ─────
  page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-wordRiver.html?stage=s12&level=m&reset=1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  check('middle-school edition has no wordRiver task', await page.evaluate(() => ![...document.querySelectorAll('.nm-st-hud-item')].some(e => /s12\.t/.test(e.getAttribute('data-item') || ''))));
  await page.close();

  // ───── 9) 360px · 글자 크기 3 · 움직임 줄이기 ─────
  const small = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  page = await small.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-wordRiver.html?idle=1');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', JSON.stringify({ v: 1, level: 'h1', protagonist: 1, nickname: '', settings: { bangjeom: true, fontScale: 3, reducedMotion: true, bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] })); });
  await page.goto(server.url + 'tests/pages/g-wordRiver.html?stage=s12&level=h1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  await openTask(page, 's12.t1');
  await fillWord(page, ['jopssal.3', 'jopssal.2', 'jopssal.1', 'jopssal.0']);
  const lay = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    const over = [...box.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > window.innerWidth + 1).length;
    return { docW: document.documentElement.scrollWidth, vw: window.innerWidth, winScroll: win.scrollWidth - win.clientWidth, over, motion: document.documentElement.getAttribute('data-nm-motion'), tr: getComputedStyle(box.querySelector('.wr-chip')).transitionDuration };
  }, G);
  check('360px: no horizontal scroll with a filled 4-stop river', lay.docW <= lay.vw && lay.winScroll <= 1 && lay.over === 0, lay);
  check('reduced motion: no transitions', lay.motion === 'reduce' && /^0s/.test(lay.tr), lay);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (small)', errs.length === 0, errs);
  await page.close();

  check('no console errors', consoleErrors.length === 0, consoleErrors);
  check('no external requests', external.length === 0, external);
} catch (e) {
  failed++;
  console.log('  FAIL exception: ' + (e && e.stack || e));
} finally {
  clearTimeout(HARD_LIMIT);
  if (browser) await browser.close();
  await server.close();
}
console.log(failed ? `FAIL g11-word-river-browser (${failed})` : 'PASS g11-word-river-browser');
process.exit(failed ? 1 : 0);
