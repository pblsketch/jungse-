// G7·G8·G9 기믹 브라우저 점검 공용 도구: 진짜 장면 진행기(tests/pages/g-<기믹>.html) 안에서 과제 창을 연다.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

export const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

export async function harness(name, limitMs = 240000) {
  const hard = setTimeout(() => { console.log(`FAIL ${name}: time limit (${limitMs / 1000} s, 설치된 Chrome 이 느린 기기 고려)`); process.exit(1); }, limitMs);
  let failed = 0;
  const check = (label, ok, info) => {
    if (ok) console.log('  ok   ' + label);
    else { failed++; console.log('  FAIL ' + label + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
  };
  const server = await serve();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const consoleErrors = [];
  const external = [];
  const watch = (page) => {
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
    page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
  };
  async function topWin(page) {
    return page.evaluate((sel) => {
      const w = document.querySelector(sel);
      return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), item: w.getAttribute('data-item'), text: w.textContent } : null;
    }, TOP);
  }
  async function advance(page, max = 40) {
    for (let i = 0; i < max; i++) {
      const t = await topWin(page);
      if (!t || t.win !== 'dialog') break;
      await page.click(TOP + ' .nm-dlg-next');
      await page.waitForTimeout(20);
    }
  }
  async function open(context, pageName, query) {
    const page = await context.newPage();
    watch(page);
    await page.goto(server.url + 'tests/pages/' + pageName + '?' + query);
    await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
    await advance(page);
    return page;
  }
  // 진행표 단추를 누른다(좁은 화면에서 진행표가 접혀 있으면 진행기의 openItem 으로 — 같은 창을 연다)
  async function openTask(page, itemId) {
    const sel = `.nm-st-hud-item[data-item="${itemId}"]`;
    if (await page.isVisible(sel)) await page.click(sel);
    else await page.evaluate((id) => NM.ui.stage.openItem(id), itemId);
    await page.waitForSelector(TOP + ' .nm-st-gimmick', { timeout: 10000 });
  }
  const state = (page, stage, id) => page.evaluate(([s, id]) => { const p = window.__store.stage(s); return p.items[id] ? p.items[id].state : 'none'; }, [stage, id]);
  const errors = (page) => page.evaluate(() => (window.__nmErrors || []).slice());
  async function finish() {
    check('no console errors', consoleErrors.length === 0, consoleErrors);
    check('no external requests', external.length === 0, external);
    await browser.close();
    await server.close();
    clearTimeout(hard);
    if (failed) { console.log(`${name}: ${failed} failed`); process.exit(1); }
    console.log(name + ' ok');
  }
  function fail(e) { failed++; console.log('  FAIL exception: ' + (e && e.stack || e)); }
  return { browser, server, check, watch, topWin, advance, open, openTask, state, errors, finish, fail };
}
