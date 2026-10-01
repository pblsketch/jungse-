// G10 기믹 'threeEraLink'(S11 세 시대 변환) 브라우저 점검 — 실제 장면 진행기 안에서 시험 장면(tests/fixtures/g-threeEraLink.js)으로 돈다.
// - 그리기: 중세 어형 줄 3개(옛한글 DOM·NMYet), 섞인 조각, 原文 블록에서 잘라 온 대목과 밑줄, 낭독기용 현대 표기
// - 다 채우기 전에는 낼 수 없음 / 키보드(Tab·Enter·Space)로 조각 놓기 / 칸을 먼저 고르기 / 채운 칸 누르면 돌아감
// - 틀린 제출 → 틀린 칸·틀린 고름에 ✕(is-wrong) 바로 표시, 과제는 open / 2번째 → showHint(2) ★ 강조 / 3번째 → doneByHelp, 정답 표시
// - 끝난 과제 다시 열기 → 정답 읽기 전용 / 맞게 내기 → done, 잠금 / 360px 너비 가로 스크롤 없음
// - 오류 0, 콘솔 오류 0, 외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL g10-three-era-link-browser: time limit (180 s)'); process.exit(1); }, 180000);
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
const G = TOP + ' .tel';
async function topWin(page) {
  return page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), text: w.textContent } : null; }, TOP);
}
async function advance(page, max = 30) {
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog') break;
    await page.click(TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
}
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s11'); return p.items[id] ? p.items[id].state : 'none'; }, id);
const closeAll = (page) => page.evaluate(() => { while (NM.engine.isOverlayOpen()) NM.engine.closeOverlay(); });
async function openTask(page, id) {
  await closeAll(page);
  await page.click('.nm-st-hud-item[data-item="' + id + '"]');
  await page.waitForSelector(G);
}
// 조각을 골라 칸에 놓는다(조각 → 칸)
async function put(page, chip, chain, pos) {
  await page.click(`${G} .tel-chip[data-chip="${chip}"]`);
  await page.click(`${G} .tel-slot[data-chain="${chain}"][data-pos="${pos}"]`);
}
async function kind(page, sp, k) { await page.click(`${G} .tel-sp[data-spell="${sp}"] .tel-kind[data-kind="${k}"]`); }
async function clearSlots(page) {
  for (let i = 0; i < 10; i++) {
    const n = await page.$(`${G} .tel-slot.is-filled`);
    if (!n) break;
    await n.click();
  }
}

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  let page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-threeEraLink.html?stage=s11&level=h23&reset=1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  check('gimmick registered', await page.evaluate(() => !!NM.gimmicks.get('threeEraLink')));
  check('HUD lists both tasks at h23', (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's11.t1,s11.t2');

  // ───── 1) 그리기 ─────
  await openTask(page, 's11.t1');
  const r = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const anchors = [...box.querySelectorAll('.tel-anchor')];
    const yet = box.querySelector('.tel-anchor .nm-yet');
    const ex = [...box.querySelectorAll('.tel-sp')].map(s => ({ target: s.querySelector('.tel-target') && s.querySelector('.tel-target').textContent, sr: s.querySelector('.tel-ex .nm-sr') && s.querySelector('.tel-ex .nm-sr').textContent, cut: s.querySelectorAll('.tel-cut').length, src: s.querySelector('.tel-src') && s.querySelector('.tel-src').textContent }));
    return {
      eras: [...box.querySelectorAll('.tel-head .tel-era')].map(e => e.textContent).join(','),
      anchors: anchors.length, anchorSr: anchors.map(a => a.querySelector('.nm-sr').textContent),
      yetFont: yet ? getComputedStyle(yet).fontFamily : null,
      chips: [...box.querySelectorAll('.tel-chip')].map(c => c.getAttribute('data-chip')),
      slots: box.querySelectorAll('.tel-slot').length, ex,
      kinds: [...box.querySelectorAll('.tel-sp[data-spell="sp1"] .tel-kind')].map(k => k.textContent).join(','),
      submitDisabled: box.querySelector('.tel-submit').disabled, need: !box.querySelector('.tel-need').hidden,
      canvas: !!box.querySelector('canvas'),
      smallTargets: [...box.querySelectorAll('button')].filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && (q.height < 44 || q.width < 44); }).length
    };
  }, G);
  check('era headers 중세,근대,현대', r.eras === '중세,근대,현대', r.eras);
  check('3 rows with medieval anchors as DOM (NMYet, modern reading for screen readers)', r.anchors === 3 && /NMYet/.test(r.yetFont || '') && r.anchorSr.every(s => s && !/[ᄀ-ᇿ]/.test(s)) && !r.canvas, r);
  check('pool has 6 forms + 1 extra, shuffled (not in config order)', r.chips.length === 7 && r.chips.join() !== 'seoul.1,seoul.2,jota.1,jota.2,maeum.1,maeum.2,x.0' && r.chips.includes('x.0'), r.chips);
  check('6 slots (근대·현대 × 3)', r.slots === 6, r.slots);
  check('excerpts from 原文 with underlined target + source title', r.ex.length === 4 && r.ex[0].target === '거슨' && r.ex[1].target === '홈이라' && r.ex[2].target === '아러보지' && r.ex[3].target === '알아보니' && r.ex.every(e => e.sr && e.cut >= 1 && /독립신문/.test(e.src || '')), r.ex);
  check('three spelling kinds', r.kinds.includes('이어 적기') && r.kinds.includes('거듭 적기') && r.kinds.includes('끊어 적기'), r.kinds);
  check('cannot submit before everything is filled', r.submitDisabled && r.need, r);
  check('touch targets >= 44px', r.smallTargets === 0, r.smallTargets);

  // ───── 2) 키보드 · 칸 먼저 고르기 · 되돌리기 ─────
  await page.focus(`${G} .tel-chip[data-chip="seoul.1"]`);
  await page.keyboard.press('Enter');
  check('Enter on chip → pressed', await page.evaluate((g) => document.querySelector(g + ' .tel-chip[data-chip="seoul.1"]').getAttribute('aria-pressed') === 'true', G));
  await page.focus(`${G} .tel-slot[data-chain="seoul"][data-pos="1"]`);
  await page.keyboard.press('Space');
  let kb = await page.evaluate((g) => { const s = document.querySelector(g + ' .tel-slot[data-chain="seoul"][data-pos="1"]'); return { chip: s.getAttribute('data-chip'), hidden: document.querySelector(g + ' .tel-chip[data-chip="seoul.1"]').hidden, label: s.getAttribute('aria-label') }; }, G);
  check('Space on slot places chip (keyboard path), chip leaves pool, slot has aria label', kb.chip === 'seoul.1' && kb.hidden && /근대/.test(kb.label), kb);
  await page.keyboard.press('Tab');
  check('Tab moves focus inside gimmick', await page.evaluate((g) => !!document.activeElement.closest(g), G));
  await page.click(`${G} .tel-slot[data-chain="seoul"][data-pos="2"]`); // 빈 칸 먼저
  await page.click(`${G} .tel-chip[data-chip="seoul.2"]`);
  check('slot-first then chip also places', await page.evaluate((g) => document.querySelector(g + ' .tel-slot[data-chain="seoul"][data-pos="2"]').getAttribute('data-chip') === 'seoul.2', G));
  await page.click(`${G} .tel-slot[data-chain="seoul"][data-pos="2"]`); // 채운 칸 → 돌아감
  check('tapping a filled slot returns the chip', await page.evaluate((g) => document.querySelector(g + ' .tel-slot[data-chain="seoul"][data-pos="2"]').getAttribute('data-chip') === '' && !document.querySelector(g + ' .tel-chip[data-chip="seoul.2"]').hidden, G));

  // ───── 3) 틀린 제출 1: 서울↔좋다 자리 바꿈, sp3 틀림 ─────
  await put(page, 'jota.2', 'seoul', 2);
  await put(page, 'jota.1', 'jota', 1);
  await put(page, 'seoul.2', 'jota', 2);
  await put(page, 'maeum.1', 'maeum', 1);
  await put(page, 'maeum.2', 'maeum', 2);
  await kind(page, 'sp1', 'ieo'); await kind(page, 'sp2', 'kkeuneo'); await kind(page, 'sp3', 'geodeup'); await kind(page, 'sp4', 'kkeuneo');
  check('submit enabled when complete', await page.evaluate((g) => !document.querySelector(g + ' .tel-submit').disabled, G));
  await page.click(`${G} .tel-submit`);
  let w = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    return {
      wrongSlots: [...box.querySelectorAll('.tel-slot.is-wrong')].map(s => s.getAttribute('data-chain') + s.getAttribute('data-pos')).sort().join(),
      wrongSym: [...box.querySelectorAll('.tel-slot.is-wrong .tel-sym-wrong')].length,
      wrongKind: [...box.querySelectorAll('.tel-kind.is-wrong')].map(k => k.closest('.tel-sp').getAttribute('data-spell') + ':' + k.getAttribute('data-kind')).join(),
      hint: win.querySelector('.nm-st-hint') && win.querySelector('.nm-st-hint').textContent,
      status: win.querySelector('.nm-st-taskstatus').getAttribute('data-result'),
      emph: box.querySelectorAll('.is-hint').length, enabled: !box.querySelector('.tel-slot').disabled
    };
  }, G);
  check('1st wrong: wrong slots marked immediately with ✕ (seoul2, jota2)', w.wrongSlots === 'jota2,seoul2' && w.wrongSym === 2, w);
  check('1st wrong: wrong spelling choice marked (sp3:geodeup)', w.wrongKind === 'sp3:geodeup', w);
  check('1st wrong: task stays open, hint 1 shown, no emphasis yet, still editable', (await state(page, 's11.t1')) === 'open' && w.hint && w.hint.includes('시험 힌트') && w.status === 'wrong' && w.emph === 0 && w.enabled, w);
  // 고치면 그 칸의 표시가 걷힌다
  await kind(page, 'sp3', 'ieo');
  check('changing a marked choice clears its mark', await page.evaluate((g) => !document.querySelector(g + ' .tel-kind.is-wrong'), G));

  // ───── 4) 틀린 제출 2 → ★ 강조 ─────
  await page.click(`${G} .tel-submit`);
  w = await page.evaluate((g) => { const box = document.querySelector(g); const row = box.querySelector('.tel-row[data-target="seoul"]'); return { hint: row.classList.contains('is-hint') && !!row.querySelector('.tel-sym-hint'), wrong: box.querySelectorAll('.tel-slot.is-wrong').length }; }, G);
  check('2nd wrong → showHint(2) emphasizes the seoul row with ★', w.hint && w.wrong === 2, w);
  check('2nd wrong: still open', (await state(page, 's11.t1')) === 'open');

  // ───── 5) 틀린 제출 3 → doneByHelp + 정답 ─────
  await page.click(`${G} .tel-submit`);
  w = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    const slot = (c, p) => box.querySelector(`.tel-slot[data-chain="${c}"][data-pos="${p}"]`);
    return {
      s2: slot('seoul', 2).getAttribute('data-chip'), j2: slot('jota', 2).getAttribute('data-chip'),
      answers: box.querySelectorAll('.tel-slot.is-answer').length, kindAns: box.querySelectorAll('.tel-kind.is-answer').length,
      disabled: [...box.querySelectorAll('button')].every(b => b.disabled || b.hidden), submitHidden: box.querySelector('.tel-submit').hidden,
      explain: win.querySelector('.nm-card[data-mark="explain"]') && win.querySelector('.nm-card[data-mark="explain"]').textContent
    };
  }, G);
  check('3rd wrong → doneByHelp', (await state(page, 's11.t1')) === 'doneByHelp');
  check('answer shown (seoul.2 / jota.2 in place, ○ marks) and explanation, controls locked', w.s2 === 'seoul.2' && w.j2 === 'jota.2' && w.answers === 6 && w.kindAns === 4 && w.disabled && w.submitHidden && w.explain && w.explain.includes('시험 풀이'), w);

  // ───── 6) 다시 열기 → 읽기 전용 정답 ─────
  await openTask(page, 's11.t1');
  w = await page.evaluate((g) => { const box = document.querySelector(g); return { locked: box.classList.contains('is-locked'), answers: box.querySelectorAll('.tel-slot.is-answer').length, m1: box.querySelector('.tel-slot[data-chain="maeum"][data-pos="1"]').getAttribute('data-chip'), allDisabled: [...box.querySelectorAll('button.tel-slot, button.tel-chip, button.tel-kind')].every(b => b.disabled), submit: box.querySelector('.tel-submit').hidden }; }, G);
  check('reopen done task → read-only with answer', w.locked && w.answers === 6 && w.m1 === 'maeum.1' && w.allDisabled && w.submit, w);

  // ───── 7) 한 부분만(적는 방식만) + 맞게 내기 → done ─────
  await openTask(page, 's11.t2');
  w = await page.evaluate((g) => { const box = document.querySelector(g); return { link: !!box.querySelector('.tel-link'), sp: box.querySelectorAll('.tel-sp').length, orig: !!box.querySelector('.tel-orig .nm-orig[data-orig="O-s11-DOKRIP4"]') }; }, G);
  check('spell-only config renders only that part (+ 原文 card)', !w.link && w.sp === 2 && w.orig, w);
  await kind(page, 'a', 'ieo');
  await kind(page, 'b', 'kkeuneo');
  await page.click(`${G} .tel-submit`);
  w = await page.evaluate((g) => { const box = document.querySelector(g); return { done: box.classList.contains('is-done'), locked: [...box.querySelectorAll('.tel-kind')].every(b => b.disabled), wrong: box.querySelectorAll('.is-wrong').length }; }, G);
  check('correct submit → done, gimmick locks', (await state(page, 's11.t2')) === 'done' && w.done && w.locked && w.wrong === 0, w);
  await closeAll(page);
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors', errs.length === 0, errs);
  await page.close();

  // ───── 8) 360px 너비 · 글자 크기 3 ─────
  const small = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  page = await small.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-threeEraLink.html?idle=1');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', JSON.stringify({ v: 1, level: 'h23', protagonist: 1, nickname: '', settings: { bangjeom: true, fontScale: 3, reducedMotion: true, bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] })); });
  await page.goto(server.url + 'tests/pages/g-threeEraLink.html?stage=s11&level=h23');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  await page.evaluate(() => NM.ui.stage.openItem('s11.t1')); // 좁은 화면에서는 진행표가 접혀 있을 수 있다
  await page.waitForSelector(G);
  const lay = await page.evaluate((g) => {
    const box = document.querySelector(g);
    const win = box.closest('.nm-st-win');
    const over = [...box.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > window.innerWidth + 1).length;
    return { docW: document.documentElement.scrollWidth, vw: window.innerWidth, winScroll: win.scrollWidth - win.clientWidth, over, motion: document.documentElement.getAttribute('data-nm-motion'), tr: getComputedStyle(box.querySelector('.tel-chip')).transitionDuration };
  }, G);
  check('360px: no horizontal scroll (page or window)', lay.docW <= lay.vw && lay.winScroll <= 1 && lay.over === 0, lay);
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
console.log(failed ? `FAIL g10-three-era-link-browser (${failed})` : 'PASS g10-three-era-link-browser');
process.exit(failed ? 1 : 0);
