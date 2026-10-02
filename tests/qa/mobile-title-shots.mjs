// 휴대 전화 배치·첫 화면 사진(점검 아님): 화면 크기마다 첫 화면·처음 정하기·장면 고르기·설정·수첩·장면(HUD 접힘/펼침)·창을 찍는다.
//   node tests/qa/mobile-title-shots.mjs [--tag after] [--only 412x780]
// 결과: tests/shots/mobile-title/<tag>/<크기>-<번호>_<화면>.png 와 layout.json(HUD·도구 막대·살피기 단추 자리, 문서 스크롤 높이).
// 412×780 은 카카오톡 안 브라우저 비슷하게(isMobile + hasTouch, 위 주소 줄·아래 단추 줄을 뺀 보이는 높이).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../server.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const tag = arg('--tag', 'now');
const only = arg('--only', null);
const out = join(fileURLToPath(new URL('../shots/mobile-title/', import.meta.url)), tag);
mkdirSync(out, { recursive: true });

const SIZES = [
  { w: 360, h: 640, mobile: true }, { w: 390, h: 844, mobile: true }, { w: 412, h: 780, mobile: true, dpr: 2.625 },
  { w: 412, h: 915, mobile: true }, { w: 844, h: 390, mobile: true }, { w: 1280, h: 800, mobile: false }
];
const KEY = 'naratmalssami:v1';
const RECORD = JSON.stringify({ v: 1, level: 'm', protagonist: 1, nickname: '시험', settings: { bangjeom: true, modern: 'tap', eum: true, fontScale: 1, reducedMotion: false, bgm: false, sfx: false }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

const layout = (page) => page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) }; };
  return { vw: innerWidth, vh: innerHeight, docH: document.documentElement.scrollHeight, scrollY, hud: r('.nm-st-hud'), toolbar: r('#nm-toolbar'), act: r('#nm-act'), canvas: r('#game canvas') };
});

const server = await serve();
let browser;
const report = {};
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const S of SIZES) {
    const size = `${S.w}x${S.h}`;
    if (only && !only.split(',').includes(size)) continue;
    const ctx = await browser.newContext({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: S.dpr || 1, isMobile: S.mobile, hasTouch: S.mobile });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    let n = 0;
    const shot = async (name, wait = 350) => { await page.waitForTimeout(wait); await page.screenshot({ path: join(out, `${size}-${String(++n).padStart(2, '0')}_${name}.png`) }); };
    const rep = report[size] = {};
    // 기록 없음
    await page.goto(server.url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#nm-screens[data-screen="title"]');
    await shot('title-new', 1600);
    await page.click('[data-act="start"]');
    await page.waitForSelector('#nm-screens[data-screen="setup-level"]');
    await shot('setup-level');
    await page.click('[data-act="level"][data-value="m"]');
    await page.waitForSelector('#nm-screens[data-screen="setup-protagonist"]');
    await shot('setup-protagonist');
    await page.click('[data-act="protagonist"][data-value="2"]');
    await page.waitForSelector('#nm-screens[data-screen="setup-nickname"]');
    await shot('setup-nickname');
    // 기록 있음
    await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, v); }, [KEY, RECORD]);
    await page.reload();
    await page.waitForSelector('#nm-screens[data-screen="title"]');
    await shot('title-continue', 1600);
    await page.click('[data-act="continue"]');
    await page.waitForSelector('#nm-screens[data-screen="select"]');
    await shot('select');
    await page.click('#nm-screens [data-act="settings"]');
    await page.waitForSelector('.nm-modal[data-modal="settings"]');
    await shot('settings');
    await page.keyboard.press('Escape');
    await page.click('#nm-screens [data-act="notebook"]');
    await page.waitForSelector('.nm-modal[data-modal="notebook"]');
    await shot('notebook');
    await page.evaluate(() => NM.ui.dom.closeAll());
    // 장면 s0
    await page.evaluate(() => NM.ui.app.enterStage('s0'));
    await page.waitForFunction(() => { const c = NM.ui.stage.current(); return c && (c.phase === 'intro' || c.phase === 'explore') && NM.engine.test.state().mapLoaded; }, null, { timeout: 30000 });
    for (let i = 0; i < 60; i++) {
      const more = await page.evaluate((sel) => { const w = document.querySelector(sel); const b = w && w.querySelector('.nm-dlg-next'); if (b) { b.click(); return true; } return false; }, TOP);
      if (!more) break;
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => { let k = 0; while (NM.engine.isOverlayOpen() && k++ < 20) NM.engine.closeOverlay(); });
    await page.evaluate(() => { const h = document.querySelector('.nm-st-hud .nm-st-hud-head'); if (h && h.getAttribute('aria-expanded') === 'true') h.click(); });
    await shot('stage-hud-closed', 600);
    rep.hudClosed = await layout(page);
    await page.evaluate(() => { const h = document.querySelector('.nm-st-hud .nm-st-hud-head'); if (h && h.getAttribute('aria-expanded') === 'false') h.click(); });
    await shot('stage-hud-open');
    rep.hudOpen = await layout(page);
    await page.evaluate(() => { const h = document.querySelector('.nm-st-hud .nm-st-hud-head'); if (h && h.getAttribute('aria-expanded') === 'true') h.click(); });
    // 살피기 단추가 보이게 선생님 곁으로
    await page.evaluate(() => NM.engine.walkTo('s0.c3', { focusAct: true }));
    await page.waitForFunction(() => { const s = NM.engine.test.state(); return !s.walking; }, null, { timeout: 20000 }).catch(() => {});
    await shot('stage-act', 400);
    rep.act = await layout(page);
    await page.evaluate(() => NM.ui.stage.openContext('s0.c1'));
    await shot('stage-window');
    await page.evaluate(() => { let k = 0; while (NM.engine.isOverlayOpen() && k++ < 20) NM.engine.closeOverlay(); });
    await page.click('#nm-toolbar [data-act="settings"]');
    await page.waitForSelector('.nm-modal[data-modal="settings"]');
    await shot('stage-settings');
    rep.errors = errs;
    await ctx.close();
    console.log(size, JSON.stringify(rep.hudClosed), errs.length ? 'ERR ' + errs[0] : '');
  }
} finally {
  writeFileSync(join(out, 'layout.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
  await server.close();
}
