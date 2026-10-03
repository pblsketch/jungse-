// G5 기믹 '끊어 읽기'(wordCut) 브라우저 점검: tests/pages/g-wordCut.html + 시험 장면 s4(tests/fixtures/g-wordCut.js, 실제 原文 블록)
// 실제 장면 진행기 안에서: 原文 글자 단추(DOM, NMYet, 방점 왼쪽 점) · 방점 음높이 막대(평·거·상, 한자는 없음) · 두 장 견주기
// / 글자를 누르면 그 뒤 끊김, 다시 누르면 없어짐 / 틀린 제출 → 틀린 끊기 자리 번짐 + 덜 끊긴 말 표시 + 힌트 1, open 유지
// / 2번째 → 고칠 자리 강조 / 3번째 → doneByHelp + 정답 끊기 / 다시 열기 → 읽기 전용 / 키보드로 맞히기 → done
// / s4 방점 늘 켬(설정 꺼도) / 360px 가로 넘침 없음 / 오류·콘솔 오류·외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL g5-wordCut-browser: time limit (180 s)'); process.exit(1); }, 180000);
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
async function topWin(page) {
  return page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { win: w.getAttribute('data-win'), text: w.textContent } : null; }, TOP);
}
async function advance(page, max = 20) {
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog') break;
    await page.click(TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
}
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s4'); return p.items[id] ? p.items[id].state : 'none'; }, id);
async function openPage(context, query, pre) {
  const page = await context.newPage();
  watch(page);
  if (pre) {
    await page.goto(server.url + 'tests/pages/g-wordCut.html?idle=1');
    await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', s); }, pre);
  }
  await page.goto(server.url + 'tests/pages/g-wordCut.html?' + query);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  return page;
}
const L = (key) => `${TOP} .gwc-line[data-key="${key}"]`;
const tap = (page, key, i) => page.click(`${L(key)} .gwc-syl[data-i="${i}"]`);
const gaps = (page, key) => page.evaluate((sel) => [...document.querySelectorAll(sel + ' .gwc-gap')].map(g => ({
  i: Number(g.getAttribute('data-gap')), cut: g.getAttribute('data-cut'), cls: g.className, wrong: g.getAttribute('data-wrong'), sym: g.querySelector('.gwc-sym').textContent,
  blur: getComputedStyle(g.querySelector('.gwc-bar')).filter
})), L(key));
const ANS = { 'O-s4-YB2a': [1, 3, 5, 8, 10, 12, 13, 15, 17], 'O-s4-YB34a': [0, 2, 3, 7, 10, 14, 15, 16, 18], 'O-s4-YB34b': [0, 2, 4, 8, 11, 15, 16, 17, 19] };

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  // ───────── 1) 그리기 (방점 끄기 설정이어도 s4 는 방점 늘 켬) ─────────
  const offSettings = JSON.stringify({ v: 1, level: 'h1', protagonist: 1, nickname: '', settings: { bangjeom: false, fontScale: 1, reducedMotion: true, bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
  let page = await openPage(context, 'stage=s4&level=h1', offSettings);
  check('explore phase, tasks core at h1', (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's4.t1,s4.t2');
  await page.click('.nm-st-hud-item[data-item="s4.t1"]');
  const r0 = await page.evaluate((s) => {
    const w = document.querySelector(s);
    const line = w.querySelector('.gwc-line[data-key="O-s4-YB2a"]');
    const row = line.querySelector('.gwc-row');
    const bj = row.querySelector('.nm-bj');
    let left = null;
    if (bj) { const p = bj.parentElement.getBoundingClientRect(), d = bj.getBoundingClientRect(); left = d.left + d.width / 2 < (p.left + p.right) / 2 && getComputedStyle(bj).display !== 'none'; }
    const tones = (key) => [...w.querySelectorAll(`.gwc-line[data-key="${key}"] .gwc-pitch`)].map(p => p.getAttribute('data-tone'));
    return {
      lines: [...w.querySelectorAll('.gwc-line')].map(l => l.getAttribute('data-key')).join(),
      btns: line.querySelectorAll('button.gwc-syl').length, cells: line.querySelectorAll('.gwc-cell').length,
      font: getComputedStyle(row).fontFamily, canvas: !!w.querySelector('canvas'), seal: !!line.querySelector('[data-mark="orig"]'),
      text: row.textContent.replace(/\s/g, ''), bjLeft: left, bjAttr: document.documentElement.getAttribute('data-nm-bangjeom'),
      tA: tones('O-s4-YB2a'), tB: tones('O-s4-YB34a'),
      legend: w.querySelectorAll('.gwc-legend-item').length, interp: !!w.querySelector('.gwc-legend [data-mark="interp"]'),
      pitchShown: getComputedStyle(w.querySelector('.gwc-pitch')).display !== 'none',
      pair: w.querySelector('.gwc-pair') && w.querySelector('.gwc-pair').getAttribute('data-found'),
      label0: line.querySelector('button.gwc-syl[data-i="0"]').getAttribute('aria-label'),
      minBtn: Math.min(...[...line.querySelectorAll('button.gwc-syl')].map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)))
    };
  }, TOP);
  check('two 原文 lines as glyph buttons (DOM, NMYet, seal), no spaces', r0.lines === 'O-s4-YB2a,O-s4-YB34a' && r0.cells === 21 && r0.btns === 20 && /NMYet/.test(r0.font) && !r0.canvas && r0.seal, r0);
  check('s4 forces bangjeom on even with setting off; dot drawn left', r0.bjAttr === 'on' && r0.bjLeft === true, r0);
  check('pitch bars: 평0 거1 상2, hanja none', r0.tA[0] === '0' && r0.tA[1] === '1' && r0.tA[11] === '2' && r0.tB[11] === 'none' && r0.pitchShown, r0);
  check('legend 3 tones + 해석 badge; compare pair not yet found', r0.legend === 3 && r0.interp && r0.pair === '0', r0);
  check('aria label = modern reading; touch ≥ 44px', r0.label0 === '불' && r0.minBtn >= 44, r0);
  check('reduced motion (setting) → static transitions', await page.evaluate((s) => document.documentElement.getAttribute('data-nm-motion') === 'reduce' && getComputedStyle(document.querySelector(s + ' .gwc-gap')).transitionDuration === '0s', TOP));

  // ───────── 2) 누르면 끊김, 다시 누르면 없어짐 ─────────
  await tap(page, 'O-s4-YB2a', 4);
  let g = await gaps(page, 'O-s4-YB2a');
  const pressed = await page.evaluate((s) => document.querySelector(s + ' .gwc-syl[data-i="4"]').getAttribute('aria-pressed'), L('O-s4-YB2a'));
  check('tap glyph → cut after it', g[4].cut === '1' && /is-cut/.test(g[4].cls) && pressed === 'true');
  await tap(page, 'O-s4-YB2a', 4);
  g = await gaps(page, 'O-s4-YB2a');
  check('tap again → cut removed', g[4].cut === '0');

  // ───────── 3) 틀린 제출 ─────────
  await tap(page, 'O-s4-YB2a', 0); // 틀린 자리
  await tap(page, 'O-s4-YB2a', 1);
  await page.click(TOP + ' .gwc-submit');
  g = await gaps(page, 'O-s4-YB2a');
  const joined = await page.evaluate((s) => [...document.querySelectorAll(s + ' .gwc-cell[data-wrong="joined"]')].map(c => Number(c.getAttribute('data-i'))), L('O-s4-YB2a'));
  check('wrong cut position blurs (번짐) with ✕', g[0].wrong === 'extra' && /is-wrong/.test(g[0].cls) && g[0].sym === '✕' && /blur/.test(g[0].blur), g[0]);
  check('right cut not marked; joined words underlined', !/is-wrong/.test(g[1].cls) && joined.includes(2) && joined.includes(20), joined);
  check('state open + hint 1', (await state(page, 's4.t1')) === 'open' && (await page.evaluate((s) => (document.querySelector(s + ' .nm-st-hint') || {}).textContent || '', TOP)).includes('시험 힌트 하나'));
  // 두 장 견주기: 기픈 / 깊고 를 끊어 떼면 찾음
  await tap(page, 'O-s4-YB2a', 0); // 틀린 자리 지우기
  await tap(page, 'O-s4-YB2a', 3);
  await tap(page, 'O-s4-YB34a', 0);
  await tap(page, 'O-s4-YB34a', 2);
  const pair = await page.evaluate((s) => { const p = document.querySelector(s + ' .gwc-pair'); return { found: p.getAttribute('data-found'), words: [...p.querySelectorAll('.gwc-word')].map(w => w.getAttribute('aria-label')).join('|'), inLine: document.querySelectorAll(s + ' .gwc-cell.is-pair').length }; }, TOP);
  check('compare: same word in two chapters side by side, found when isolated', pair.found === '1' && pair.words === '기픈|깊고' && pair.inLine === 4, pair);

  // ───────── 4) 2번째 틀림 → 고칠 자리 강조 ─────────
  await page.click(TOP + ' .gwc-submit');
  g = await gaps(page, 'O-s4-YB2a');
  const missing = g.filter(x => ANS['O-s4-YB2a'].includes(x.i) && x.cut !== '1');
  check('2nd wrong → actual missing gaps emphasized, corrected gaps left clean', missing.length > 0 && missing.every(x => /is-hint/.test(x.cls) && x.sym === '▼') && !/is-hint/.test(g[1].cls) && !/is-hint/.test(g[3].cls) && (await state(page, 's4.t1')) === 'open', missing);

  // ───────── 5) 3번째 틀림 → doneByHelp ─────────
  await page.click(TOP + ' .gwc-submit');
  check('3rd wrong → doneByHelp', (await state(page, 's4.t1')) === 'doneByHelp');
  const dA = await gaps(page, 'O-s4-YB2a'), dB = await gaps(page, 'O-s4-YB34a');
  const cutsA = dA.filter(x => x.cut === '1').map(x => x.i), cutsB = dB.filter(x => x.cut === '1').map(x => x.i);
  const fin = await page.evaluate((s) => ({ explain: (document.querySelector(s + ' .nm-card[data-mark="explain"]') || {}).textContent || '', disabled: [...document.querySelectorAll(s + ' .gwc button')].every(b => b.disabled), found: document.querySelector(s + ' .gwc-pair').getAttribute('data-found') }), TOP);
  check('answer cuts shown + marked, explanation, locked', JSON.stringify(cutsA) === JSON.stringify(ANS['O-s4-YB2a']) && JSON.stringify(cutsB) === JSON.stringify(ANS['O-s4-YB34a']) &&
    dA.filter(x => /is-answer/.test(x.cls)).length === 9 && fin.explain.includes('시험 풀이 끊어 읽기') && fin.disabled && fin.found === '1', { cutsA, cutsB, fin });

  // ───────── 6) 다시 열기 → 읽기 전용 ─────────
  await page.click(TOP + ' .nm-st-close');
  await page.click('.nm-st-hud-item[data-item="s4.t1"]');
  const ro = await gaps(page, 'O-s4-YB34a');
  check('reopen: answer read-only', JSON.stringify(ro.filter(x => x.cut === '1').map(x => x.i)) === JSON.stringify(ANS['O-s4-YB34a']) && await page.evaluate((s) => document.querySelector(s + ' .gwc-submit').disabled, TOP));
  await page.click(TOP + ' .nm-st-close');

  // ───────── 7) 키보드로 맞히기 ─────────
  await page.focus('.nm-st-hud-item[data-item="s4.t2"]');
  await page.keyboard.press('Enter');
  for (const i of ANS['O-s4-YB34b']) { await page.focus(`${L('O-s4-YB34b')} .gwc-syl[data-i="${i}"]`); await page.keyboard.press(i % 2 ? 'Space' : 'Enter'); }
  const kb = await page.evaluate((s) => document.querySelector(s + ' .gwc-syl[data-i="0"]').getAttribute('aria-label'), L('O-s4-YB34b'));
  check('keyboard toggles cuts; aria announces cut', kb.includes('뒤를 끊음'), kb);
  await page.focus(TOP + ' .gwc-submit');
  await page.keyboard.press('Enter');
  check('correct submit → done, locked with answer marks', (await state(page, 's4.t2')) === 'done' &&
    await page.evaluate((s) => document.querySelector(s + ' .gwc-submit').disabled && document.querySelectorAll(s + ' .gwc-gap.is-answer').length === 9, TOP));
  // 360px
  await page.click(TOP + ' .nm-st-close').catch(() => {});
  await page.waitForTimeout(100);
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors', errs.length === 0, errs);
  await page.close();

  page = await openPage(context, 'stage=s4&level=h23&reset=1');
  await page.click('.nm-st-hud-item[data-item="s4.t1"]');
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(150);
  const ov = await page.evaluate((s) => { const w = document.querySelector(s); return { win: w.scrollWidth - w.clientWidth, doc: document.documentElement.scrollWidth - window.innerWidth }; }, TOP);
  check('no horizontal scroll at 360px', ov.win <= 1 && ov.doc <= 1, ov);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (h23)', errs.length === 0, errs);
  await page.close();

  check('no console errors', consoleErrors.length === 0, consoleErrors);
  check('no external requests', external.length === 0, external);
} catch (e) {
  failed++;
  console.log('  FAIL exception: ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
if (failed) { console.log(`FAIL g5-wordCut-browser (${failed})`); process.exit(1); }
console.log('PASS g5-wordCut-browser');
