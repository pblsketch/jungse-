// G6 기믹 '높임 저울'(honorScale) 브라우저 점검: tests/pages/g-honorScale.html + 시험 장면 s7(tests/fixtures/g-honorScale.js, 실제 原文 블록)
// 실제 장면 진행기 안에서: 조판(빈 활자 자리) · 인물 패(화자는 저울 왼쪽) · 활자(데이터 표기 → DOM 옛한글) · 저울 기울기
// / 인물 패를 먼저 골라야 활자를 고를 수 있음 / 틀린 제출 → 틀린 패·활자 흐림 + 힌트 1, open 유지 / 2번째 → 고칠 곳·단서 글자 강조
// / 3번째 → doneByHelp + 정답(조판을 原文대로, 原文 카드) / 다시 열기 → 읽기 전용 / 키보드로 맞히기 → done
// / 움직임 줄이기면 저울 전환 없음 / 360px 가로 넘침 없음 / 오류·콘솔 오류·외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL g6-honorScale-browser: time limit (180 s)'); process.exit(1); }, 180000);
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
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s7'); return p.items[id] ? p.items[id].state : 'none'; }, id);
async function openPage(context, query, pre) {
  const page = await context.newPage();
  watch(page);
  if (pre) {
    await page.goto(server.url + 'tests/pages/g-honorScale.html?idle=1');
    await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', s); }, pre);
  }
  await page.goto(server.url + 'tests/pages/g-honorScale.html?' + query);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  return page;
}
const SL = (id) => `${TOP} .ghs-slot[data-slot="${id}"]`;
const info = (page, id) => page.evaluate((sel) => {
  const s = document.querySelector(sel);
  const pick = (q) => { const e = s.querySelector(q); return e ? { cls: e.className, wrong: e.getAttribute('data-wrong'), pressed: e.getAttribute('aria-pressed'), mark: (e.querySelector(':scope > .ghs-mark') || {}).textContent || '' } : null; };
  return {
    slotbox: pick('.ghs-slotbox'), tokens: pick('.ghs-tokens'), tray: pick('.ghs-tray'),
    tok: Object.fromEntries([...s.querySelectorAll('.ghs-token')].map(b => [b.getAttribute('data-role'), { cls: b.className, pressed: b.getAttribute('aria-pressed'), wrong: b.getAttribute('data-wrong') }])),
    types: Object.fromEntries([...s.querySelectorAll('.ghs-type')].map(b => [b.getAttribute('data-ending'), { cls: b.className, pressed: b.getAttribute('aria-pressed'), disabled: b.disabled }])),
    tilt: s.querySelector('.ghs-scale').getAttribute('data-tilt'), scaleLabel: s.querySelector('.ghs-scale').getAttribute('aria-label'),
    cue: [...s.querySelectorAll('.ghs-u.is-hint')].map(e => e.getAttribute('data-i')).join(),
    answerUnits: [...s.querySelectorAll('.ghs-slotunit.is-answer')].map(e => e.getAttribute('data-i')).join(),
    pickFirst: !s.querySelector('.ghs-pickfirst').hidden
  };
}, SL(id));

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  // ───────── 1) 그리기 ─────────
  let page = await openPage(context, 'stage=s7&level=h23&reset=1');
  check('explore phase, tasks core at h23', (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's7.t1,s7.t2');
  await page.click('.nm-st-hud-item[data-item="s7.t1"]');
  const r0 = await page.evaluate((s) => {
    const w = document.querySelector(s);
    const zab = w.querySelector('.ghs-slot[data-slot="b"] .ghs-type[data-ending="zab"] .ghs-type-face');
    return {
      slots: w.querySelectorAll('.ghs-slot').length, slotboxes: w.querySelectorAll('.ghs-slotbox').length,
      origsHidden: w.querySelector('.ghs-origs').hidden, frameFont: getComputedStyle(w.querySelector('.ghs-line')).fontFamily,
      tokA: [...w.querySelectorAll('.ghs-slot[data-slot="a"] .ghs-token')].map(b => b.getAttribute('data-role')).join(),
      tokB: [...w.querySelectorAll('.ghs-slot[data-slot="b"] .ghs-token')].map(b => b.getAttribute('data-role')).join(),
      types: w.querySelectorAll('.ghs-slot[data-slot="b"] .ghs-type').length,
      zabText: zab && zab.textContent, zabNorm: zab && zab.textContent.normalize('NFC'),
      speaker: w.querySelector('.ghs-slot[data-slot="b"] .ghs-pan-left').textContent,
      canvas: !!w.querySelector('canvas'),
      minBtn: Math.min(...[...w.querySelectorAll('.ghs-token, .ghs-type, .ghs-slotbox')].map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)))
    };
  }, TOP);
  check('2 slots with empty type slot in the frame; 原文 card hidden until done', r0.slots === 2 && r0.slotboxes === 2 && r0.origsHidden && /NMYet/.test(r0.frameFont), r0);
  check('role tokens per slot (subject / subject+object), speaker on left pan', r0.tokA === 'subject' && r0.tokB === 'subject,object' && r0.speaker.includes('화자') && r0.speaker.includes('시험 글쓴이'), r0);
  check('6 ending types; object ending rendered from data notation as old syllable', r0.types === 6 && r0.zabText && r0.zabText.includes('ᅀ') && !r0.canvas, r0);
  check('touch targets ≥ 44px', r0.minBtn >= 44, r0);
  check('other slot on the same line stays blank in each frame (no answer leak)', await page.evaluate((s) =>
    !!document.querySelector(s + ' .ghs-slot[data-slot="a"] .ghs-otherslot[data-slot="b"]') && !document.querySelector(s + ' .ghs-slot[data-slot="a"] .ghs-u[data-i="10"]') &&
    !!document.querySelector(s + ' .ghs-slot[data-slot="b"] .ghs-otherslot[data-slot="a"]') && !document.querySelector(s + ' .ghs-slot[data-slot="b"] .ghs-u[data-i="6"]'), TOP));
  let a = await info(page, 'a');
  check('types disabled until a role token is chosen', a.pickFirst && Object.values(a.types).every(x => x.disabled) && a.tilt === '0', a);

  // ───────── 2) 틀린 제출 ─────────
  await page.click(`${SL('a')} .ghs-token[data-role="subject"]`);
  await page.click(`${SL('a')} .ghs-type[data-ending="si"]`);
  a = await info(page, 'a');
  check('scale tilts when a type is set; label names the honored kind', a.tilt === '1' && a.scaleLabel.includes('주체 높임') && a.slotbox.cls.includes('is-filled'), a);
  check('full motion: scale beam animates', await page.evaluate((s) => getComputedStyle(document.querySelector(s + ' .ghs-beam')).transitionDuration !== '0s', SL('a')));
  await page.click(`${SL('b')} .ghs-token[data-role="subject"]`);
  await page.click(`${SL('b')} .ghs-type[data-ending="sab"]`);
  await page.click(TOP + ' .ghs-submit');
  a = await info(page, 'a');
  let b = await info(page, 'b');
  check('wrong ending marked (slot + type, ✕); right token not marked', a.slotbox.wrong === '1' && a.slotbox.mark === '✕' && a.types.si.cls.includes('is-wrong') && !a.tok.subject.cls.includes('is-wrong'), a);
  check('wrong honored token marked', b.tok.subject.wrong === '1' && b.slotbox.wrong === '1', b);
  check('blur on wrong type face', await page.evaluate((s) => /blur/.test(getComputedStyle(document.querySelector(s + ' .ghs-slotbox .ghs-slot-type')).filter), SL('b')));
  check('state open + hint 1', (await state(page, 's7.t1')) === 'open' && (await page.evaluate((s) => (document.querySelector(s + ' .nm-st-hint') || {}).textContent || '', TOP)).includes('시험 힌트 하나'));
  // 고치면 표시가 걷힌다
  await page.click(`${SL('a')} .ghs-type[data-ending="sya"]`);
  a = await info(page, 'a');
  check('changing the type clears its wrong mark', !a.slotbox.cls.includes('is-wrong') && !a.types.si.cls.includes('is-wrong'), a);

  // ───────── 3) 2번째 틀림 → 고칠 곳 + 단서 글자 강조 ─────────
  await page.click(TOP + ' .ghs-submit');
  b = await info(page, 'b');
  check('2nd wrong → slot, tray and cue glyph (sound before slot) emphasized', b.slotbox.cls.includes('is-hint') && b.tray.cls.includes('is-hint') && b.cue === '9' && (await state(page, 's7.t1')) === 'open', b);

  // ───────── 4) 3번째 → doneByHelp ─────────
  await page.click(TOP + ' .ghs-submit');
  check('3rd wrong → doneByHelp', (await state(page, 's7.t1')) === 'doneByHelp');
  b = await info(page, 'b');
  a = await info(page, 'a');
  const fin = await page.evaluate((s) => { const w = document.querySelector(s); return { origs: !w.querySelector('.ghs-origs').hidden && [...w.querySelectorAll('.ghs-origs .nm-orig')].map(o => o.getAttribute('data-orig')).join(), explain: (w.querySelector('.nm-card[data-mark="explain"]') || {}).textContent || '', disabled: [...w.querySelectorAll('.ghs button')].every(x => x.disabled), boxes: w.querySelectorAll('.ghs-slotbox').length }; }, TOP);
  check('answer: honored + type set and marked, frame restored as 原文 with slot unit highlighted', b.tok.object.pressed === 'true' && b.tok.object.cls.includes('is-answer') && b.types.zab.pressed === 'true' && b.answerUnits === '10' && a.answerUnits === '6' && fin.boxes === 0, { a, b, fin });
  check('原文 card shown after done + explanation + locked', fin.origs === 'O-s7-SS6b' && fin.explain.includes('시험 풀이 높임 저울') && fin.disabled, fin);

  // ───────── 5) 다시 열기 → 읽기 전용 ─────────
  await page.click(TOP + ' .nm-st-close');
  await page.click('.nm-st-hud-item[data-item="s7.t1"]');
  b = await info(page, 'b');
  check('reopen: answer read-only', b.tok.object.pressed === 'true' && b.types.zab.pressed === 'true' && b.answerUnits === '10' && await page.evaluate((s) => document.querySelector(s + ' .ghs-submit').disabled, TOP), b);
  await page.click(TOP + ' .nm-st-close');

  // ───────── 6) 키보드로 맞히기 ─────────
  await page.focus('.nm-st-hud-item[data-item="s7.t2"]');
  await page.keyboard.press('Enter');
  let c = await info(page, 'c');
  check('choices restricted by config (3 types)', Object.keys(c.types).join() === 'si,zab,ii', c);
  await page.focus(`${SL('c')} .ghs-token[data-role="listener"]`);
  await page.keyboard.press('Enter');
  await page.focus(`${SL('c')} .ghs-type[data-ending="ii"]`);
  await page.keyboard.press('Space');
  c = await info(page, 'c');
  check('keyboard: token + type chosen, scale tilted (상대 높임)', c.tok.listener.pressed === 'true' && c.types.ii.pressed === 'true' && c.tilt === '1' && c.scaleLabel.includes('상대 높임'), c);
  await page.focus(TOP + ' .ghs-submit');
  await page.keyboard.press('Enter');
  check('correct submit → done, revealed + locked', (await state(page, 's7.t2')) === 'done' &&
    await page.evaluate((s) => document.querySelector(s + ' .ghs-submit').disabled && !document.querySelector(s + ' .ghs-origs').hidden, TOP));
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors', errs.length === 0, errs);
  await page.close();

  // ───────── 7) 움직임 줄이기 + 360px ─────────
  const rm = JSON.stringify({ v: 1, level: 'h23', protagonist: 1, nickname: '', settings: { bangjeom: true, fontScale: 3, reducedMotion: true, bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
  page = await openPage(context, 'stage=s7&level=h23', rm);
  await page.click('.nm-st-hud-item[data-item="s7.t1"]');
  await page.click(`${SL('a')} .ghs-token[data-role="subject"]`);
  await page.click(`${SL('a')} .ghs-type[data-ending="sya"]`);
  const st = await page.evaluate((s) => { const bm = document.querySelector(s + ' .ghs-beam'); return { dur: getComputedStyle(bm).transitionDuration, tf: getComputedStyle(bm).transform, motion: document.documentElement.getAttribute('data-nm-motion'), cls: document.querySelector(s).closest('.ghs').className }; }, SL('a'));
  check('reduced motion: scale tilted statically (no transition)', st.motion === 'reduce' && st.dur === '0s' && st.tf !== 'none' && /is-static/.test(st.cls), st);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(150);
  const ov = await page.evaluate((s) => { const w = document.querySelector(s); return { win: w.scrollWidth - w.clientWidth, doc: document.documentElement.scrollWidth - window.innerWidth }; }, TOP);
  check('no horizontal scroll at 360px (font scale 3)', ov.win <= 1 && ov.doc <= 1, ov);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (reduced motion run)', errs.length === 0, errs);
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
if (failed) { console.log(`FAIL g6-honorScale-browser (${failed})`); process.exit(1); }
console.log('PASS g6-honorScale-browser');
