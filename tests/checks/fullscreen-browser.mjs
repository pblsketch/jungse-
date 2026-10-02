// 전체 화면(js/ui/fullscreen.js): 첫 화면·설정·장면 도구 막대의 '전체 화면' 단추가 쪽 전체 화면을 켜고 끄며 글자·상태가 따라 바뀐다.
// 전체 화면을 쓸 수 없는 브라우저(아이폰 사파리 등)에서는 단추를 숨기고 설정에 대안 안내만 보인다. 콘솔 오류 0.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL fullscreen-browser: time limit (120 s)'); process.exit(1); }, 120000);
let failed = 0;
const check = (name, ok, info) => { if (ok) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); } };
const server = await serve();
let browser;
const started = (page) => page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.app.started === true, null, { timeout: 60000 });
const state = (page) => page.evaluate(() => ({
  fs: !!(document.fullscreenElement || document.webkitFullscreenElement),
  cls: document.documentElement.classList.contains('nm-fullscreen'),
  label: (document.querySelector('[data-act="fullscreen"] .nm-fs-label') || {}).textContent || null,
  pressed: (document.querySelector('[data-act="fullscreen"]') || { getAttribute: () => null }).getAttribute('aria-pressed')
}));
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(server.url + 'index.html');
    await started(page);
    check('title screen has a fullscreen button', await page.locator('#nm-screens [data-act="fullscreen"]').count() === 1);
    let s = await state(page);
    check('starts windowed', !s.fs && !s.cls && s.label === '전체 화면' && s.pressed === 'false', s);
    await page.click('#nm-screens [data-act="fullscreen"]');
    await page.waitForFunction(() => !!document.fullscreenElement && document.documentElement.classList.contains('nm-fullscreen'), null, { timeout: 5000 }).catch(() => {});
    s = await state(page);
    check('click enters fullscreen', s.fs && s.cls && s.label === '화면 원래대로' && s.pressed === 'true', s);
    await page.click('#nm-screens [data-act="fullscreen"]');
    await page.waitForFunction(() => !document.fullscreenElement && !document.documentElement.classList.contains('nm-fullscreen'), null, { timeout: 5000 }).catch(() => {});
    s = await state(page);
    check('click again leaves fullscreen', !s.fs && !s.cls && s.label === '전체 화면', s);
    // 설정 창 줄
    await page.click('#nm-screens [data-act="settings"]');
    await page.waitForSelector('[data-setting="fullscreen"]', { timeout: 5000 });
    check('settings has a fullscreen row with a button', await page.locator('[data-setting="fullscreen"] [data-act="fullscreen"]').count() === 1);
    await page.keyboard.press('Escape');
    // 장면 도구 막대(교사 모드로 바로 장면에 들어가 확인)
    await page.goto(server.url + 'index.html?teacher=1&level=m');
    await started(page);
    await page.click('[data-act="start"]');
    await page.waitForSelector('[data-stage="s2"]', { timeout: 30000 });
    await page.click('[data-stage="s2"]');
    await page.waitForSelector('#nm-toolbar:not([hidden]) [data-act="fullscreen"]', { timeout: 60000 }).catch(() => {});
    check('stage toolbar has a fullscreen button', await page.locator('#nm-toolbar [data-act="fullscreen"]').count() === 1);
    check('no console errors', errors.length === 0, errors);
    await page.close();
  }
  {
    // 쪽 전체 화면을 허락하지 않는 브라우저 흉내(아이폰 사파리·일부 앱 안 브라우저)
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false, configurable: true });
      Object.defineProperty(Document.prototype, 'webkitFullscreenEnabled', { get: () => false, configurable: true });
    });
    await page.goto(server.url + 'index.html');
    await started(page);
    check('unsupported: no fullscreen button on title', await page.locator('[data-act="fullscreen"]').count() === 0);
    await page.click('#nm-screens [data-act="settings"]');
    await page.waitForSelector('[data-setting="fullscreen"]', { timeout: 5000 });
    const txt = await page.textContent('[data-setting="fullscreen"]');
    check('unsupported: settings explains the alternative (홈 화면에 추가)', /홈 화면에 추가/.test(txt) && await page.locator('[data-setting="fullscreen"] [data-act="fullscreen"]').count() === 0, txt);
    await page.close();
  }
} catch (e) { failed++; console.log('  FAIL exception — ' + (e && e.stack || e)); }
finally { if (browser) await browser.close(); await server.close(); clearTimeout(HARD_LIMIT); }
console.log(failed ? `fullscreen browser: ${failed} failed` : 'fullscreen browser: all passed');
process.exit(failed ? 1 : 0);
