// 만든 사람들 창(spec §16): 제목 화면 단추로 열리고, 국립국악원 공공누리 출처·배경음 곡·글꼴·엔진이 보인다. 콘솔 오류 0.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL credits-browser: time limit (120 s)'); process.exit(1); }, 120000);
let failed = 0;
const check = (name, ok, info) => { if (ok) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); } };
const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const vp of [{ width: 1280, height: 800 }, { width: 360, height: 740 }]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(server.url);
    await page.waitForSelector('[data-act="credits"], button:has-text("만든 사람들")', { timeout: 30000 });
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('만든 사람들')); b.click(); });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const m = document.querySelector('[data-modal="credits"]');
      return m ? { text: m.textContent, scroll: document.documentElement.scrollWidth > window.innerWidth + 1 } : null;
    });
    check(vp.width + ': credits window opens', !!r, r);
    check(vp.width + ': 국립국악원 공공누리 attribution', !!r && r.text.includes('국립국악원') && r.text.includes('공공누리 제1유형'), r && r.text.slice(0, 120));
    check(vp.width + ': tracks, fonts, engine listed', !!r && r.text.includes('청성곡') && r.text.includes('Open Font License') && r.text.includes('Phaser'));
    check(vp.width + ': no horizontal scroll', !!r && !r.scroll);
    check(vp.width + ': no console errors', errors.length === 0, errors);
    await page.close();
  }
} catch (e) { failed++; console.log('  FAIL exception — ' + (e && e.stack || e)); }
finally { if (browser) await browser.close(); await server.close(); clearTimeout(HARD_LIMIT); }
console.log(failed ? `credits browser: ${failed} failed` : 'credits browser: all passed');
process.exit(failed ? 1 : 0);
