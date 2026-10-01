// U1 브라우저 점검 공용 도구(점검 파일이 아님 — tests/checks/u1-*-browser.mjs 가 불러 쓴다).
// 설치된 Chrome(headless)으로 tests/pages/ui.html 을 연다. 콘솔 오류·페이지 오류·외부 요청·__nmErrors 를 모은다.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

export const KEY = 'naratmalssami:v1';
export const PAGE = 'tests/pages/ui.html';

export function makeChecker(name, limitMs = 55000) {
  let failed = 0, count = 0;
  const timer = setTimeout(() => { console.log(`FAIL ${name}: time limit (${limitMs / 1000} s)`); process.exit(1); }, limitMs);
  return {
    check(label, ok, info) {
      count++;
      if (ok) console.log('  ok   ' + label);
      else { failed++; console.log('  FAIL ' + label + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
    },
    get failed() { return failed; },
    finish() {
      clearTimeout(timer);
      console.log(`${name}: ${count - failed}/${count} ok`);
      process.exit(failed ? 1 : 0);
    }
  };
}

// 기록 하나(spec §19-5). over 로 덮어쓴다.
export function record(over) {
  return Object.assign({
    v: 1, level: 'm', protagonist: 2, nickname: '해솔',
    settings: { bangjeom: true, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true },
    prologueDone: true, progress: {}, glyphs: {}, seenNotices: []
  }, over || {});
}

export async function startBrowser() {
  const server = await serve();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  return { server, browser, async close() { await browser.close(); await server.close(); } };
}

// 새 맥락 + 쪽. opts: { viewport, initScript, hasTouch }
export async function newPage(env, opts) {
  const o = opts || {};
  const context = await env.browser.newContext({
    viewport: o.viewport || { width: 1280, height: 800 }, deviceScaleFactor: 1, hasTouch: !!o.hasTouch, acceptDownloads: true
  });
  if (o.initScript) await context.addInitScript(o.initScript);
  // 저장소를 채우는 쪽(스크립트 파일을 문서로 연다)에서 브라우저가 스스로 찾는 favicon.ico 의 404 를 막는다
  await context.route('**/favicon.ico', r => r.fulfill({ status: 204, body: '' }));
  const page = await context.newPage();
  const watch = { consoleErrors: [], external: [] };
  page.on('console', m => { if (m.type() === 'error') watch.consoleErrors.push(m.text()); });
  page.on('pageerror', e => watch.consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { const u = r.url(); if (!/^(data:|blob:)/.test(u) && !u.startsWith(env.server.url)) watch.external.push(u); });
  const api = {
    page, context, watch,
    // 같은 출처의 다른 쪽에서 저장소를 미리 채운다(값이 null 이면 지운다)
    async seed(value) {
      await page.goto(env.server.url + 'tests/fixtures/ui-data.js');
      await page.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [KEY, value === null ? null : JSON.stringify(value)]);
    },
    async open(query) {
      await page.goto(env.server.url + PAGE + (query || ''));
      await page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.app.started === true, null, { timeout: 15000 });
    },
    screen() { return page.evaluate(() => { const s = document.getElementById('nm-screens'); return s && !s.hidden ? s.getAttribute('data-screen') : null; }); },
    waitScreen(name) { return page.waitForFunction(n => { const s = document.getElementById('nm-screens'); return s && !s.hidden && s.getAttribute('data-screen') === n; }, name, { timeout: 8000 }); },
    waitModal(name) { return page.waitForSelector(`.nm-modal[data-modal="${name}"]`, { state: 'visible', timeout: 8000 }); },
    modalOpen(name) { return page.evaluate(n => !!document.querySelector(`.nm-modal[data-modal="${n}"]`), name); },
    saved() { return page.evaluate(k => { const v = localStorage.getItem(k); return v === null ? null : JSON.parse(v); }, KEY); },
    rawStorage() { return page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); }); },
    state() { return page.evaluate(() => NM.ui.app.test.state()); },
    nmErrors() { return page.evaluate(() => (window.__nmErrors || []).slice()); },
    async clean(check, label) {
      const errs = await api.nmErrors();
      check(`${label}: no __nmErrors`, errs.length === 0, errs);
      check(`${label}: no console errors`, watch.consoleErrors.length === 0, watch.consoleErrors);
      check(`${label}: no external requests`, watch.external.length === 0, watch.external);
    }
  };
  return api;
}
