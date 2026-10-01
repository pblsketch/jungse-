// G4 기믹 '음절 조립'(syllableBuild) 브라우저 점검: tests/pages/g-syllableBuild.html + 시험 장면 s3(tests/fixtures/g-syllableBuild.js)
// 실제 장면 진행기 안에서: 그리기(原文 카드·과녁·블록·DOM 옛한글 미리보기) / 틀린 제출 → 틀린 자리 흐림 + 힌트 1, open 유지
// / 2번째 틀림 → 고칠 자리 강조 / 3번째 → doneByHelp + 정답·풀이 / 다시 열기 → 읽기 전용 정답 / 키보드로 맞히기 → done
// / 끌어다 놓기 / 학교급 용어(중 '나란히 쓰기', 고 '병서') / 360px 가로 넘침 없음 / 오류·콘솔 오류·외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL g4-syllableBuild-browser: time limit (180 s)'); process.exit(1); }, 180000);
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
  return page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), text: w.textContent } : null; }, TOP);
}
async function advance(page, max = 20) {
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog') break;
    await page.click(TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
}
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s3'); return p.items[id] ? p.items[id].state : 'none'; }, id);
async function openPage(context, query) {
  const page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/g-syllableBuild.html?' + query);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 30000 });
  await advance(page);
  return page;
}
const T = (target) => `${TOP} .gsb-target[data-target="${target}"]`;
async function put(page, target, slot, jamos) {
  await page.click(`${T(target)} .gsb-slot[data-slot="${slot}"] .gsb-slot-pick`);
  for (const j of jamos) await page.click(`${T(target)} .gsb-block[data-jamo="${j}"]`);
}
async function clearAll(page, target) {
  for (let i = 0; i < 12; i++) {
    const b = await page.$(`${T(target)} .gsb-placed:not([disabled])`);
    if (!b) break;
    await b.click();
  }
}
const slotInfo = (page, target, slot) => page.evaluate((sel) => {
  const s = document.querySelector(sel);
  return s ? {
    cls: s.className, wrong: s.getAttribute('data-wrong'), mark: s.querySelector('.gsb-mark').textContent,
    placed: [...s.querySelectorAll('.gsb-placed')].map(b => b.getAttribute('data-jamo')).join(''),
    term: s.querySelector('.gsb-term').hidden ? '' : s.querySelector('.gsb-term').textContent,
    blur: getComputedStyle(s.querySelector('.gsb-slot-items')).filter
  } : null;
}, `${T(target)} .gsb-slot[data-slot="${slot}"]`);

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  // ───────── 1) 중학교: 그리기 ─────────
  let page = await openPage(context, 'stage=s3&level=m&reset=1');
  check('explore phase, both tasks core at m', (await page.evaluate(() => NM.ui.stage.current().phase)) === 'explore' &&
    (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's3.t1,s3.t2');
  await page.click('.nm-st-hud-item[data-item="s3.t1"]');
  let t = await topWin(page);
  check('task window opens with gimmick mounted', t && t.win === 'task' && await page.evaluate((s) => !!document.querySelector(s + ' .nm-st-gimmick[data-gimmick="syllableBuild"] .gsb'), TOP), t);
  const r0 = await page.evaluate((s) => {
    const w = document.querySelector(s);
    return {
      targets: w.querySelectorAll('.gsb-target').length, origCards: [...w.querySelectorAll('.nm-orig')].map(o => o.getAttribute('data-orig')).join(),
      practice: !!w.querySelector('.gsb-target[data-target="p"][data-practice] .gsb-practice'),
      blocks: w.querySelectorAll('.gsb-target[data-target="a"] .gsb-block').length,
      minBlock: Math.min(...[...w.querySelectorAll('.gsb-block, .gsb-slot-pick')].map(b => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))),
      canvas: !!w.querySelector('canvas'), level: w.querySelector('.gsb').getAttribute('data-level')
    };
  }, TOP);
  check('3 targets, 原文 cards by block id, practice target marked', r0.targets === 3 && r0.origCards === 'O-s3-HJ-HAPYONG,O-s3-HJ-JUNGHAP' && r0.practice, r0);
  check('touch targets ≥ 44px, no canvas, level attr', r0.blocks === 6 && r0.minBlock >= 44 && !r0.canvas && r0.level === 'm', r0);

  // ───────── 2) 틀린 제출 ─────────
  await put(page, 'a', 'cho', ['ㅂ', 'ㅈ']);
  await put(page, 'a', 'jung', ['ㅏ']);
  await put(page, 'b', 'cho', ['ㅎ']);
  await put(page, 'b', 'jung', ['ㅗ', 'ㅏ']);
  const pv = await page.evaluate((s) => { const p = document.querySelector(s); const g = p.querySelector('.gsb-syl'); return { syl: p.getAttribute('data-syllable'), text: g && g.textContent, font: g && getComputedStyle(g).fontFamily, label: p.getAttribute('aria-label') }; }, `${T('a')} .gsb-preview`);
  check('preview composes old syllable via renderer (DOM text, NMYet)', pv.syl === '[ㅂㅈㅏ]' && pv.text && pv.text.length > 0 && /NMYet/.test(pv.font || ''), pv);
  check('level m term on cluster: 나란히 쓰기 / 모음자 합치기', (await slotInfo(page, 'a', 'cho')).term === '나란히 쓰기' && (await slotInfo(page, 'b', 'jung')).term === '모음자 합치기');
  await page.click(TOP + ' .gsb-submit');
  let aJong = await slotInfo(page, 'a', 'jong'), bJung = await slotInfo(page, 'b', 'jung'), aCho = await slotInfo(page, 'a', 'cho');
  check('wrong submit: wrong slots marked immediately (blur + ✕)', aJong.wrong === '1' && /is-wrong/.test(aJong.cls) && aJong.mark === '✕' && bJung.wrong === '1' && /blur/.test(bJung.blur), { aJong, bJung });
  check('right slot not marked', !/is-wrong/.test(aCho.cls), aCho);
  check('state stays open + hint 1 shown', (await state(page, 's3.t1')) === 'open' && (await page.evaluate((s) => (document.querySelector(s + ' .nm-st-hint') || {}).textContent || '', TOP)).includes('시험 힌트 하나'));
  // 고치면 그 자리 표시가 걷힌다
  await put(page, 'a', 'jong', ['ㄹ']);
  check('editing a slot clears its wrong mark', !/is-wrong/.test((await slotInfo(page, 'a', 'jong')).cls));

  // ───────── 3) 2번째 틀림 → 고칠 자리 강조 ─────────
  await page.click(TOP + ' .gsb-submit');
  bJung = await slotInfo(page, 'b', 'jung');
  check('2nd wrong → showHint(2): target slot emphasized', /is-hint/.test(bJung.cls) && (await state(page, 's3.t1')) === 'open', bJung);

  // ───────── 4) 3번째 틀림 → doneByHelp + 정답 ─────────
  await page.click(TOP + ' .gsb-submit');
  const done = await page.evaluate((s) => {
    const w = document.querySelector(s);
    return {
      answers: w.querySelectorAll('.gsb-target[data-target="a"] .gsb-slot.is-answer').length,
      aJong: [...w.querySelectorAll('.gsb-target[data-target="a"] .gsb-slot[data-slot="jong"] .gsb-placed')].map(b => b.getAttribute('data-jamo')).join(''),
      bJung: [...w.querySelectorAll('.gsb-target[data-target="b"] .gsb-slot[data-slot="jung"] .gsb-placed')].map(b => b.getAttribute('data-jamo')).join(''),
      explain: (w.querySelector('.nm-card[data-mark="explain"]') || {}).textContent || '', submit: w.querySelector('.gsb-submit').disabled,
      blocksDisabled: [...w.querySelectorAll('.gsb-block')].every(b => b.disabled)
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await state(page, 's3.t1')) === 'doneByHelp');
  check('answer shown in slots + explanation, locked', done.answers === 3 && done.aJong === 'ㄱ' && done.bJung === 'ㅗㅏㅣ' && done.explain.includes('시험 풀이 음절 조립') && done.submit && done.blocksDisabled, done);

  // ───────── 5) 다시 열기 → 읽기 전용 정답 ─────────
  await page.click(TOP + ' .nm-st-close');
  await page.click('.nm-st-hud-item[data-item="s3.t1"]');
  const ro = await page.evaluate((s) => {
    const w = document.querySelector(s);
    return { answers: w.querySelectorAll('.gsb-slot.is-answer').length, aCho: [...w.querySelectorAll('.gsb-target[data-target="a"] .gsb-slot[data-slot="cho"] .gsb-placed')].map(b => b.getAttribute('data-jamo')).join(''),
      submit: w.querySelector('.gsb-submit').disabled, locked: w.querySelector('.gsb').classList.contains('is-locked') };
  }, TOP);
  check('reopen done task: answer read-only', ro.answers >= 6 && ro.aCho === 'ㅂㅈ' && ro.submit && ro.locked, ro);
  await page.click(TOP + ' .nm-st-close');

  // ───────── 6) 키보드로 맞히기 (ㄱ+ㄱ 을 ㄲ 정답과 원자열로 판정) ─────────
  await page.focus('.nm-st-hud-item[data-item="s3.t2"]');
  await page.keyboard.press('Enter');
  t = await topWin(page);
  check('keyboard opens second task', t && t.win === 'task');
  await page.focus(`${T('k')} .gsb-block[data-jamo="ㄱ"]`);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await page.focus(`${T('k')} .gsb-slot[data-slot="jung"] .gsb-slot-pick`);
  await page.keyboard.press('Enter');
  await page.focus(`${T('k')} .gsb-block[data-jamo="ㅏ"]`);
  await page.keyboard.press('Enter');
  const kCho = await slotInfo(page, 'k', 'cho');
  check('keyboard: two ㄱ blocks in 초성 → 나란히 쓰기 term', kCho.placed === 'ㄱㄱ' && kCho.term === '나란히 쓰기', kCho);
  await page.focus(TOP + ' .gsb-submit');
  await page.keyboard.press('Enter');
  check('correct submit → done', (await state(page, 's3.t2')) === 'done');
  check('after correct: locked with answer marks', await page.evaluate((s) => document.querySelector(s + ' .gsb-submit').disabled && document.querySelectorAll(s + ' .gsb-slot.is-answer').length === 3, TOP));
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (m run)', errs.length === 0, errs);
  await page.close();

  // ───────── 7) 고등: 용어 '병서', 끌어다 놓기, 연습 과녁(연서) ─────────
  page = await openPage(context, 'stage=s3&level=h1&reset=1');
  await page.click('.nm-st-hud-item[data-item="s3.t1"]');
  await page.dragAndDrop(`${T('a')} .gsb-block[data-jamo="ㅂ"]`, `${T('a')} .gsb-slot[data-slot="cho"]`);
  await page.dragAndDrop(`${T('a')} .gsb-block[data-jamo="ㅈ"]`, `${T('a')} .gsb-slot[data-slot="cho"]`);
  const hCho = await slotInfo(page, 'a', 'cho');
  check('drag and drop places blocks; level h1 term 합용 병서', hCho.placed === 'ㅂㅈ' && hCho.term.includes('병서') && hCho.term === '합용 병서', hCho);
  await clearAll(page, 'a');
  await put(page, 'a', 'cho', ['ㄱ', 'ㄱ']);
  check('level h1: same letters → 각자 병서', (await slotInfo(page, 'a', 'cho')).term === '각자 병서');
  await put(page, 'p', 'cho', ['ㅂ', 'ㅇ']);
  await put(page, 'p', 'jung', ['ㅣ']);
  const pr = await slotInfo(page, 'p', 'cho');
  const prSyl = await page.evaluate((s) => document.querySelector(s).getAttribute('data-syllable'), `${T('p')} .gsb-preview`);
  check('practice target: 연서 labelled as 알아 두기, composes ㅸ syllable', pr.term.includes('연서') && prSyl === '[ㅂㅇㅣ]', { pr, prSyl });
  // 360px: 가로 넘침 없음
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(150);
  const ov = await page.evaluate((s) => { const w = document.querySelector(s); return { win: w.scrollWidth - w.clientWidth, doc: document.documentElement.scrollWidth - window.innerWidth }; }, TOP);
  check('no horizontal scroll at 360px', ov.win <= 1 && ov.doc <= 1, ov);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (h1 run)', errs.length === 0, errs);
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
if (failed) { console.log(`FAIL g4-syllableBuild-browser (${failed})`); process.exit(1); }
console.log('PASS g4-syllableBuild-browser');
