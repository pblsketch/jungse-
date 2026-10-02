// 통역 고르기 브라우저 점검 (js/ui/stage-translate.js, s5 「사라진 소리, 바뀐 뜻」): index.html 에서 s5 를 통역 직전까지 풀고
// - 통역할 사람에게 가면 장면 설정 대사 → 고르기 창(다 된 통역 대사가 바로 나오지 않음). 라디오 묶음 2개·카드 6장·옛한글 DOM,
//   빈칸 2개 미리 보기, 다 고르기 전에는 '이렇게 통역하기' 막힘, 첫 초점이 카드
// - 틀린 통역(예쁜 이웃) → 반응 대사(아낙) → 창으로 돌아와 그 고르기만 '다시 골라 보세요', 엉뚱했던 카드는 막힘, 장면은 안 끝남
// - 창을 닫으면 탐색으로(HUD 통역 목표), 다시 말을 걸면 고르기부터 다시(엉뚱했던 카드는 그대로 막힘)
// - 바른 통역 → 다 된 통역 대사(고른 말과 같은 문장) → 새김 → 장면 완료, 기록 interp(첫 시도 아님, 시도 2, 처음 고른 카드)
// - 교사 모드: '정답과 풀이 바로 보기' → 정답 ○ 표시·골라 둠 → 바로 통역
// - 고르기가 없는 다른 장면은 예전 그대로(has=false). 412×780 에서 가로 넘침 없음·단추가 화면 안. 화면 그림 tests/shots/translate-choice/
// - 콘솔 오류·게임 오류·외부 요청 0
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../server.mjs';
import { horizontalOverflow } from '../lib/e2e-kit.mjs';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots', 'translate-choice');
mkdirSync(SHOTS, { recursive: true });
const HARD_LIMIT = setTimeout(() => { console.log('FAIL translate-choice-browser: time limit (240 s)'); process.exit(1); }, 240000);
let failed = 0;
function check(name, ok, info) {
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 1200) : '')); }
  return !!ok;
}
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
const server = await serve();
const consoleErrors = [], external = [];

async function openGame(context) {
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
  await page.goto(server.url);
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.stage && NM.ui.stageTranslate && NM.engine, null, { timeout: 30000 });
  await page.evaluate(() => NM.engine.ready());
  return page;
}
const top = (page) => page.evaluate((sel) => {
  const w = document.querySelector(sel);
  return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), next: !!w.querySelector('.nm-dlg-next'), text: w.textContent } : null;
}, TOP);
async function waitTop(page, want, timeout = 8000) {
  const t0 = Date.now();
  for (;;) {
    const t = await top(page);
    if (t && Object.keys(want).every(k => t[k] === want[k])) return t;
    if (Date.now() - t0 > timeout) return t;
    await page.waitForTimeout(30);
  }
}
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b || b.disabled || b.hidden) return false; b.click(); return true; }, sel);
// 대화 창을 넘기며 글을 모은다(대화 창이 아니면 멈춤)
async function pass(page, max = 40) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    const t = await top(page);
    if (!t || t.win !== 'dialog' || !t.next) break;
    seen.push({ kind: t.kind, text: t.text });
    await click(page, TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
  return seen;
}
const card = (sid, oid) => `${TOP} .nm-st-interp-step[data-step="${sid}"] .nm-st-card[data-card="${oid}"]`;

// 저장소를 만들어 s5 의 핵심 항목을 모두 바르게 확정해 두고(장면 도중 다시 열기 → 탐색) 장면을 연다
async function startAtTranslate(page, { level, teacher }) {
  return page.evaluate(async ({ level, teacher }) => {
    try { localStorage.clear(); } catch (e) { /* 무시 */ }
    window.__nmErrors = [];
    const st = teacher ? NM.core.save.createStore({ teacher: true, level }) : NM.core.save.createStore({ storage: localStorage, urlLevel: level, level });
    if (!teacher) { st.setup({ level, protagonist: 1, nickname: '하늘' }); st.markPrologueDone(); }
    const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES.s5, st.level);
    sc.id = 's5';
    st.coreItems(sc).forEach(it => {
      (sc.contexts || []).filter(c => (c.items || []).indexOf(it.id) >= 0).slice(0, 2).forEach(c => st.seeContext(sc, c.id));
      st.choose(sc, it.id, it.cards.filter(c => c.correct)[0].id);
      st.confirm(sc, it.id);
    });
    window.__pt = { store: st, exits: [] };
    NM.ui.stage.stop();
    const ok = await NM.ui.stage.run('s5', { store: st, level, teacher: !!teacher, onExit: (r) => window.__pt.exits.push(r) });
    return { ok, phase: NM.ui.stage.current().phase };
  }, { level, teacher });
}
const stageState = (page) => page.evaluate(() => ({
  phase: NM.ui.stage.current().phase, status: window.__pt.store.stage('s5').status,
  interp: window.__pt.store.stage('s5').interp || null,
  goal: !!document.querySelector('.nm-st-hud:not([hidden]) .nm-st-hud-goal'), wins: NM.ui.stageWindow.count()
}));
const shot = (page, name) => page.screenshot({ path: join(SHOTS, name + '.png') }).catch(() => {});

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  /* ── 학생(고1, 데스크톱) ── */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await openGame(context);
    const others = await page.evaluate(() => NM.data.STAGE_IDS.filter(id => id !== 's5' && NM.data.SCENES[id] && NM.ui.stageTranslate.has(NM.data.SCENES[id].translate)));
    check('scenes without translate.choose keep the old translate (only s5 has the choice)', others.length === 0, others);
    const st0 = await startAtTranslate(page, { level: 'h1' });
    check('s5 resumes in explore with all core items confirmed', st0.ok && st0.phase === 'explore', st0);
    let s = await stageState(page);
    check('HUD shows go-translate goal', s.goal && s.status !== 'done', s);

    await page.evaluate(() => NM.engine.goTo('s5.merchant'));
    let t = await waitTop(page, { win: 'dialog', kind: 'translate' });
    check('talking to the merchant opens the translate dialog (scene setting first)', t && t.kind === 'translate', t);
    const pre = await pass(page);
    check('only the setting lines play before the choice (no finished translation yet)', pre.length === 2 && !pre.some(x => /많으니/.test(x.text)), pre.map(x => x.text.slice(0, 40)));
    t = await waitTop(page, { win: 'interp' });
    check('choice window opens', t && t.win === 'interp', t);
    const v = await page.evaluate((sel) => {
      const w = document.querySelector(sel);
      const groups = w.querySelectorAll('[role="radiogroup"]');
      const ae = document.activeElement;
      return {
        groups: groups.length, radios: w.querySelectorAll('[role="radio"]').length,
        labelled: Array.from(groups).every(g => { const id = g.getAttribute('aria-labelledby'); return id && document.getElementById(id) && document.getElementById(id).textContent.length > 5; }),
        yet: !!w.querySelector('.nm-st-interp-step[data-step="s5.t1"] .nm-st-interp-q .nm-bj-syl') && !/[:·]/.test(w.querySelector('.nm-st-interp-step[data-step="s5.t1"] .nm-st-interp-q').textContent),
        blanks: w.querySelectorAll('.nm-st-interp-blank').length, filled: w.querySelectorAll('.nm-st-interp-blank.is-filled').length,
        deliver: (w.querySelector('.nm-st-interp-deliver') || {}).disabled,
        focusCard: !!(ae && ae.classList.contains('nm-st-card') && w.contains(ae)),
        noAnswerShown: !w.querySelector('.is-correct, .nm-st-card-tag'),
        noTeacher: !w.querySelector('.nm-st-teacher-answer')
      };
    }, TOP);
    check('choice window: 2 radio groups, 6 radio cards, each labelled by its question', v.groups === 2 && v.radios === 6 && v.labelled, v);
    check('15th-century word in the question drawn by stageYet (bangjeom DOM, no raw marks)', v.yet, v);
    check('preview has 2 empty blanks; deliver disabled before picking', v.blanks === 2 && v.filled === 0 && v.deliver === true, v);
    check('first focus on a card; no answer mark, no teacher button for students', v.focusCard && v.noAnswerShown && v.noTeacher, v);
    await shot(page, 'desktop-1-choice');

    // 키보드로 고르기(Space) — 초점이 간 첫 카드
    const kb = await page.evaluate((sel) => document.activeElement && document.activeElement.getAttribute('data-card'), TOP);
    await page.keyboard.press('Space');
    const kbSel = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-card[aria-checked="true"]'); return b ? b.getAttribute('data-card') : null; }, TOP);
    check('Space on a focused card selects it', kb && kbSel === kb, { kb, kbSel });

    // 틀린 통역: 예쁜 이웃 + 많으니
    await click(page, card('s5.t1', 's5.t1.b'));
    await click(page, card('s5.t2', 's5.t2.a'));
    const prev = await page.evaluate((sel) => document.querySelector(sel + ' .nm-st-interp-sentence').textContent, TOP);
    check('preview fills the picked words into the sentence', /예쁜/.test(prev) && /많으니/.test(prev), prev);
    await shot(page, 'desktop-2-picked');
    check('deliver enabled after picking both', await click(page, TOP + ' .nm-st-interp-deliver'));
    t = await waitTop(page, { win: 'dialog', kind: 'interp-react' });
    check('wrong interpretation → reaction dialog', t && t.kind === 'interp-react', t);
    await shot(page, 'desktop-3-reaction');
    const react = await pass(page);
    check('reaction: the market woman corrects the odd interpretation', react.some(x => /광주리 노점 아낙/.test(x.text) && /예쁜/.test(x.text)), react.map(x => x.text.slice(0, 60)));
    t = await waitTop(page, { win: 'interp' });
    const back = await page.evaluate((sel) => {
      const w = document.querySelector(sel);
      const s1 = w.querySelector('.nm-st-interp-step[data-step="s5.t1"]'), s2 = w.querySelector('.nm-st-interp-step[data-step="s5.t2"]');
      const b = s1.querySelector('.nm-st-card[data-card="s5.t1.b"]');
      const ae = document.activeElement;
      return { again1: s1.classList.contains('is-again') && !!s1.querySelector('.nm-st-interp-again'), again2: s2.classList.contains('is-again'),
        tried: b.disabled && b.classList.contains('is-tried') && !!b.querySelector('.nm-st-interp-tried'),
        keep2: (s2.querySelector('.nm-st-card[aria-checked="true"]') || {}).getAttribute ? s2.querySelector('.nm-st-card[aria-checked="true"]').getAttribute('data-card') : null,
        deliver: w.querySelector('.nm-st-interp-deliver').disabled, focusIn1: !!(ae && s1.contains(ae)) };
    }, TOP);
    check('back at the choice: only the wrong step is marked to choose again', t && t.win === 'interp' && back.again1 && !back.again2, back);
    check('the odd card is blocked and tagged; the other pick stays', back.tried && back.keep2 === 's5.t2.a', back);
    check('deliver waits for a new pick; focus moves into the step to fix', back.deliver === true && back.focusIn1, back);
    s = await stageState(page);
    check('stage not finished by a wrong interpretation (no penalty, still translate phase)', s.phase === 'translate' && s.status !== 'done', s);
    await shot(page, 'desktop-4-again');

    // 창 닫기 → 탐색으로, 다시 말 걸기 → 고르기부터
    await click(page, TOP + ' > .nm-st-close');
    await page.waitForTimeout(80);
    s = await stageState(page);
    check('closing the choice window returns to explore with the translate goal', s.phase === 'explore' && s.goal && s.wins === 0, s);
    await page.evaluate(() => NM.engine.goTo('s5.merchant'));
    await waitTop(page, { win: 'dialog', kind: 'translate' });
    await pass(page);
    t = await waitTop(page, { win: 'interp' });
    const re = await page.evaluate((sel) => {
      const w = document.querySelector(sel);
      const b = w.querySelector('.nm-st-card[data-card="s5.t1.b"]');
      return { open: !!w && w.getAttribute('data-win') === 'interp', tried: !!(b && b.disabled && b.classList.contains('is-tried')), picked: w.querySelectorAll('.nm-st-card[aria-checked="true"]').length };
    }, TOP);
    check('talking again reopens the choice; odd card still blocked, picks cleared', re.open && re.tried && re.picked === 0, re);

    // 둘째 고르기를 틀림(아뢰니) → 장수의 반응
    await click(page, card('s5.t1', 's5.t1.a'));
    await click(page, card('s5.t2', 's5.t2.c'));
    await click(page, TOP + ' .nm-st-interp-deliver');
    t = await waitTop(page, { win: 'dialog', kind: 'interp-react' });
    const react2 = await pass(page);
    check('wrong reading of 하다 → merchant reaction', t && t.kind === 'interp-react' && react2.some(x => /곡식 장수/.test(x.text) && /아뢴/.test(x.text)), react2.map(x => x.text.slice(0, 60)));
    await waitTop(page, { win: 'interp' });
    const keep1 = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-interp-step[data-step="s5.t1"] .nm-st-card[aria-checked="true"]'); return b ? b.getAttribute('data-card') : null; }, TOP);
    check('right first pick kept while fixing the second', keep1 === 's5.t1.a', keep1);

    // 바른 통역
    await click(page, card('s5.t2', 's5.t2.a'));
    const done = await click(page, TOP + ' .nm-st-interp-deliver');
    t = await waitTop(page, { win: 'dialog', kind: 'translate' });
    const post = await pass(page);
    check('right interpretation → finished translation lines follow', done && post.length >= 4 && /딱한 이웃이 많으니/.test(post[0].text) && post.every(x => x.kind === 'translate'), post.map(x => x.text.slice(0, 50)));
    t = await waitTop(page, { win: 'carve' });
    check('then carve (no quiz)', t && t.win === 'carve', t);
    // 새김 → 돌아보기(건너뜀) → 저장 제안(나중에) → 끝
    await click(page, TOP + ' .nm-st-foot .nm-st-next');
    await waitTop(page, { win: 'reflect' });
    await click(page, TOP + ' .nm-st-skip');
    await waitTop(page, { win: 'save' });
    await click(page, TOP + ' .nm-st-later');
    await page.waitForTimeout(150);
    const end = await page.evaluate(() => {
      const st = window.__pt.store;
      return { exits: window.__pt.exits, status: st.stage('s5').status, interp: st.stage('s5').interp || null, translations: st.stage('s5').translations,
        saved: JSON.parse(localStorage.getItem(st.KEY)).progress.h1.s5.interp || null, errors: window.__nmErrors.slice(0, 5) };
    });
    check('stage completed after the translation', end.status === 'done' && end.exits.length === 1 && end.exits[0].completed === true && end.translations.indexOf('s5.x1') >= 0, end);
    check('record: interp first try false, 3 tries, first picks, final picks (saved)', end.interp && end.interp.firstTry === false && end.interp.tries === 3 &&
      JSON.stringify(end.interp.first) === JSON.stringify(['s5.t1.b', 's5.t2.a']) && JSON.stringify(end.interp.picks) === JSON.stringify(['s5.t1.a', 's5.t2.a']) &&
      JSON.stringify(end.saved) === JSON.stringify(end.interp), end.interp);
    check('no game errors (student)', end.errors.length === 0, end.errors);
    await context.close();
  }

  /* ── 학생(고2~3): 첫 시도 정답 ── */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await openGame(context);
    await startAtTranslate(page, { level: 'h23' });
    await page.evaluate(() => NM.engine.goTo('s5.merchant'));
    await waitTop(page, { win: 'dialog', kind: 'translate' });
    await pass(page);
    await waitTop(page, { win: 'interp' });
    await click(page, card('s5.t1', 's5.t1.a'));
    await click(page, card('s5.t2', 's5.t2.a'));
    await click(page, TOP + ' .nm-st-interp-deliver');
    const t = await waitTop(page, { win: 'dialog', kind: 'translate' });
    const it = await page.evaluate(() => window.__pt.store.stage('s5').interp);
    check('h23: right on the first try → straight to the translation, firstTry true', t && t.kind === 'translate' && it && it.firstTry === true && it.tries === 1, { t: t && t.kind, it });
    await context.close();
  }

  /* ── 교사 모드 ── */
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await openGame(context);
    await startAtTranslate(page, { level: 'h1', teacher: true });
    await page.evaluate(() => NM.engine.goTo('s5.merchant'));
    await waitTop(page, { win: 'dialog', kind: 'translate' });
    await pass(page);
    await waitTop(page, { win: 'interp' });
    const hasBtn = await click(page, TOP + ' .nm-st-teacher-answer');
    const tv = await page.evaluate((sel) => {
      const w = document.querySelector(sel);
      return { correct: Array.from(w.querySelectorAll('.nm-st-card.is-correct')).map(b => b.getAttribute('data-card')),
        checked: Array.from(w.querySelectorAll('.nm-st-card[aria-checked="true"]')).map(b => b.getAttribute('data-card')),
        note: !!w.querySelector('.nm-st-teacher-view'), deliver: w.querySelector('.nm-st-interp-deliver').disabled };
    }, TOP);
    check('teacher: answer button reveals ○ on the right cards and picks them', hasBtn && tv.correct.join() === 's5.t1.a,s5.t2.a' && tv.checked.join() === 's5.t1.a,s5.t2.a' && tv.note && tv.deliver === false, tv);
    await shot(page, 'desktop-5-teacher');
    await click(page, TOP + ' .nm-st-interp-deliver');
    const t = await waitTop(page, { win: 'dialog', kind: 'translate' });
    check('teacher: one click on deliver goes on to the translation', t && t.kind === 'translate', t);
    const ls = await page.evaluate(() => localStorage.length);
    check('teacher: nothing written to storage', ls === 0, ls);
    await context.close();
  }

  /* ── 전화 412×780 ── */
  {
    const context = await browser.newContext({ viewport: { width: 412, height: 780 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await openGame(context);
    await startAtTranslate(page, { level: 'h1' });
    await page.evaluate(() => NM.engine.goTo('s5.merchant'));
    await waitTop(page, { win: 'dialog', kind: 'translate' });
    await pass(page);
    await waitTop(page, { win: 'interp' });
    await page.waitForTimeout(150);
    await shot(page, 'phone-1-choice');
    let ov = await horizontalOverflow(page);
    check('phone: no horizontal overflow in the choice window', ov.length === 0, ov);
    await page.tap(card('s5.t1', 's5.t1.b'));
    await page.evaluate((sel) => { const b = document.querySelector(sel); b.scrollIntoView({ block: 'center' }); }, card('s5.t2', 's5.t2.a'));
    await page.tap(card('s5.t2', 's5.t2.a'));
    const box = await page.evaluate((sel) => {
      const b = document.querySelector(sel + ' .nm-st-interp-deliver');
      const r = b.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, vw: innerWidth, vh: innerHeight, disabled: b.disabled };
    }, TOP);
    check('phone: deliver button fully on screen, tall enough to tap', box.top >= 0 && box.bottom <= box.vh && box.left >= 0 && box.right <= box.vw && box.h >= 40 && !box.disabled, box);
    await shot(page, 'phone-2-picked');
    await page.tap(TOP + ' .nm-st-interp-deliver');
    await waitTop(page, { win: 'dialog', kind: 'interp-react' });
    await page.waitForTimeout(150);
    await shot(page, 'phone-3-reaction');
    await pass(page);
    await waitTop(page, { win: 'interp' });
    await page.waitForTimeout(150);
    ov = await horizontalOverflow(page);
    check('phone: no horizontal overflow after the reaction', ov.length === 0, ov);
    await shot(page, 'phone-4-again');
    const errs = await page.evaluate(() => window.__nmErrors.slice(0, 5));
    check('no game errors (phone)', errs.length === 0, errs);
    await context.close();
  }

  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  check('no external requests', external.length === 0, external.slice(0, 5));
} catch (e) {
  check('translate-choice-browser run', false, String(e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `translate-choice-browser: ${failed} failed` : 'translate-choice-browser: ok');
process.exit(failed ? 1 : 0);
