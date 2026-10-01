// G1·G2·G3 기믹 브라우저 점검이 함께 쓰는 도구 (점검 파일 아님 — tests/checks/g-*-browser.mjs 가 불러 쓴다).
// 진짜 장면 진행기(tests/pages/g-<기믹>.html) 안에서 시험 장면을 돌린다. 설치된 Chrome(channel 'chrome') 필요.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

export const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

export async function startKit(name, limitMs = 200000) {
  const timer = setTimeout(() => { console.log(`FAIL ${name}: time limit (${limitMs / 1000} s, 느린 기기 고려)`); process.exit(1); }, limitMs);
  let failed = 0;
  const check = (label, ok, info) => {
    if (ok) console.log('  ok   ' + label);
    else { failed++; console.log('  FAIL ' + label + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
  };
  const server = await serve();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const consoleErrors = [], external = [];
  function watch(page) {
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
    page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
  }
  async function open(context, pageFile, query) {
    const page = await context.newPage();
    watch(page);
    await page.goto(server.url + 'tests/pages/' + pageFile + '?' + query);
    await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
    await advance(page);
    return page;
  }
  async function topWin(page) {
    return page.evaluate((sel) => {
      const w = document.querySelector(sel);
      return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), item: w.getAttribute('data-item'), text: w.textContent } : null;
    }, TOP);
  }
  async function advance(page, max = 30) {
    for (let i = 0; i < max; i++) {
      const t = await topWin(page);
      if (!t || t.win !== 'dialog') break;
      await page.click(TOP + ' .nm-dlg-next');
      await page.waitForTimeout(20);
    }
  }
  // 진행표(HUD)의 항목 단추로 연다. 좁은 화면에서 진행표가 접혀 있으면 진행기의 openItem 으로 연다.
  async function openTask(page, itemId) {
    const sel = `.nm-st-hud-item[data-item="${itemId}"]`;
    if (await page.isVisible(sel)) await page.click(sel);
    else await page.evaluate((id) => NM.ui.stage.openItem(id), itemId);
    await page.waitForSelector(TOP + ` .nm-st-gimmick`, { timeout: 10000 });
  }
  const state = (page, stageId, id) => page.evaluate(([s, id]) => { const p = window.__store.stage(s); return p.items[id] ? p.items[id].state : 'none'; }, [stageId, id]);
  async function closeTop(page) { await page.click(TOP + ' .nm-st-close'); await page.waitForTimeout(40); }
  // 360px 폭: 과제 창 안과 문서에 가로 스크롤이 없다
  async function noHScroll(page) {
    return page.evaluate((sel) => {
      const w = document.querySelector(sel);
      const de = document.documentElement;
      return { win: w ? w.scrollWidth - w.clientWidth : -1, doc: de.scrollWidth - de.clientWidth };
    }, TOP);
  }
  async function finish(pages) {
    for (const p of pages) {
      const errs = await p.evaluate(() => window.__nmErrors.slice()).catch(() => ['page closed']);
      check('no NM errors (' + p.url().split('?')[1] + ')', errs.length === 0, errs);
    }
    check('no console errors', consoleErrors.length === 0, consoleErrors);
    check('no external requests', external.length === 0, external);
    await browser.close();
    await server.close();
    clearTimeout(timer);
    console.log(failed ? `FAIL ${name} (${failed})` : `PASS ${name}`);
    process.exit(failed ? 1 : 0);
  }
  async function fail(e) {
    console.log(`FAIL ${name}: ${e && e.stack || e}`);
    try { await browser.close(); } catch { /* 무시 */ }
    try { await server.close(); } catch { /* 무시 */ }
    process.exit(1);
  }
  return { browser, server, check, open, topWin, advance, openTask, state, closeTop, noHScroll, finish, fail, watch };
}
