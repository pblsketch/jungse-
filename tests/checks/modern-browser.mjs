// 현대어 풀이 설정: 原文 카드(맥락·대사 창, modern: true) 아래 현대어 풀이가
// '눌러서 보기'(처음 값)면 단추로 펼치고, '늘 보기'면 바로 보이고, '끔'이면 숨는다. 과제 화면용 카드(modern 없음)에는 없다.
// 실제 데이터: 현대어 풀이가 있는 原文 블록은 줄마다 풀이가 하나씩 있다. 콘솔 오류 0.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL modern-browser: time limit (120 s)'); process.exit(1); }, 120000);
let failed = 0;
const check = (name, ok, info) => { if (ok) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); } };
const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(server.url + 'index.html');
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.app.started === true, null, { timeout: 60000 });

  const data = await page.evaluate(() => {
    const O = NM.data.ORIG, ids = Object.keys(O);
    const withModern = ids.filter(id => Array.isArray(O[id].modern));
    const bad = withModern.filter(id => O[id].modern.length !== O[id].lines.length);
    return { total: ids.length, withModern: withModern.length, bad };
  });
  check('modern lines align with 原文 lines', data.bad.length === 0, data);
  console.log(`  info ${data.withModern}/${data.total} 原文 blocks have 현대어 풀이`);

  await page.evaluate(() => {
    NM.data.ORIG['T-modern'] = { title: '시험 블록', lines: ['나·랏:말', '둘째 줄'], modern: ['우리나라 말', '둘째 풀이'], src: '시험 출처 3쪽', certainty: '◎' };
    const host = document.createElement('div'); host.id = 'modern-host'; host.style.cssText = 'position:fixed;left:0;top:0;width:600px;z-index:99999;background:#fff';
    const a = NM.ui.marker.orig('T-modern', { modern: true }); a.id = 'card-modern';
    const b = NM.ui.marker.orig('T-modern', {}); b.id = 'card-task';
    host.appendChild(a); host.appendChild(b); document.body.appendChild(host);
  });
  const vis = () => page.evaluate(() => {
    const shown = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
    const c = document.getElementById('card-modern');
    const txt = c.querySelector('.nm-orig-modern-text');
    return {
      attr: document.documentElement.getAttribute('data-nm-modern'),
      box: shown(c.querySelector('.nm-orig-modern')), btn: shown(c.querySelector('.nm-orig-modern-btn')),
      text: shown(txt), lines: [...txt.querySelectorAll('.nm-orig-modern-line')].map(p => p.textContent),
      expanded: c.querySelector('.nm-orig-modern-btn').getAttribute('aria-expanded'),
      taskBox: !!document.querySelector('#card-task .nm-orig-modern')
    };
  });
  let v = await vis();
  check('default setting is tap', v.attr === 'tap', v.attr);
  check('tap: button shown, text hidden', v.btn && !v.text && v.expanded === 'false', v);
  check('modern lines rendered in order', v.lines.join('|') === '우리나라 말|둘째 풀이', v.lines);
  check('task card (no modern option) has no 현대어 풀이', v.taskBox === false);
  await page.click('#card-modern .nm-orig-modern-btn');
  v = await vis();
  check('tap: clicking button shows text', v.text && v.expanded === 'true', v);

  // 설정 창에서 바꾸기
  await page.click('[data-act="settings"]');
  await page.waitForSelector('[data-setting="modern"]', { timeout: 10000 });
  const labels = await page.$$eval('[data-setting="modern"] [data-value]', bs => bs.map(b => b.getAttribute('data-value')));
  check('settings row has tap/always/off', labels.join(',') === 'tap,always,off', labels);
  await page.click('[data-setting="modern"] [data-value="always"]');
  v = await vis();
  check('always: text shown without button', v.attr === 'always' && v.text && !v.btn, v);
  await page.click('[data-setting="modern"] [data-value="off"]');
  v = await vis();
  check('off: whole box hidden', v.attr === 'off' && !v.box, v);
  await page.click('[data-setting="modern"] [data-value="tap"]');
  v = await vis();
  check('back to tap', v.attr === 'tap' && v.btn, v);
  check('no console errors', errors.length === 0, errors);
} catch (e) { failed++; console.log('  FAIL exception — ' + (e && e.stack || e)); }
finally { if (browser) await browser.close(); await server.close(); clearTimeout(HARD_LIMIT); }
console.log(failed ? `modern browser: ${failed} failed` : 'modern browser: all passed');
process.exit(failed ? 1 : 0);
