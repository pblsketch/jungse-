// D1 장면 진행기 브라우저 점검: tests/pages/stage.html + 시험 장면(tests/fixtures/d1-scene.js)
// - 도입 흐름(별명 조사, 虛 카드, 아직 확인하지 않은 규칙), 원문 DOM·현대 표기 읽기·방점 왼쪽 점
// - 맥락 1곳 → 확정 닫힘, 2곳 → 열림 / 확정 전 정오 숨김 / 오답 → 오해 장면 → 다시 확정
// - 오답 3번 → 도움으로 확정(1번째 힌트, 2번째 빛남, 3번째 정답·풀이) / 규칙 카드 부품
// - 기믹 과제: 틀린 부분 바로 표시, 3번째 → doneByHelp / 새로 고침 뒤 이어 하기(시작 자리)
// - 장면 끝: 통역 → 패 글자 → 돌아보기 → 이미지 저장 제안 → onExit, 통역 뒤 퀴즈 없음
// - 교사 모드(정답 바로 보기, 기록 무변경, 호칭 '통사'), 방점 끄기와 s4 늘 켬, Esc·Tab
// - 현대어 풀이 잠김 표지(해독 전) → 해독 뒤 풀이(B02) / 카드 순서는 기록 seed 로 고정, 새로 고쳐도 같음(S01)
// - '실마리 더 보기': 틀리지 않고 도움 1→2→3 단계(오답 0, 첫 시도 정답 아님), 기믹 과제도(S03)
// - 오류 0, 콘솔 오류 0, 외부 요청 0
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL d1-stage-browser: time limit (180 s, 설치된 Chrome 이 느린 기기 고려)'); process.exit(1); }, 180000);
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

// 맨 위 창(열린 창 가운데 마지막)
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
async function topWin(page) {
  return page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), item: w.getAttribute('data-item'), context: w.getAttribute('data-context'), text: w.textContent } : null;
  }, TOP);
}
// 대화 창이 맨 위에 있는 동안 '다음'을 누른다. 지나간 대화의 글을 모아 돌려준다.
async function advance(page, max = 30) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog') break;
    seen.push(t);
    await page.click(TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
  return seen;
}
const state = (page, id) => page.evaluate((id) => { const p = window.__store.stage('s6'); return p.items[id] ? p.items[id].state : 'none'; }, id);
const goTo = (page, id) => page.evaluate((id) => NM.engine.goTo(id), id);
const closeAll = (page) => page.evaluate(() => { while (NM.engine.isOverlayOpen()) NM.engine.closeOverlay(); });

async function openPage(context, query) {
  const page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/stage.html?' + query);
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 15000 });
  return page;
}

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

  // ───────── 1) 도입 흐름 ─────────
  let page = await openPage(context, 'stage=s6&level=m&nick=' + encodeURIComponent('바다') + '&reset=1');
  let t = await topWin(page);
  check('intro dialog opens first', t && t.win === 'dialog' && t.kind === 'intro', t);
  check('nickname with vowel-final particle (바다야)', t && t.text.includes('바다야'), t && t.text);
  check('map paused while dialog open', (await page.evaluate(() => NM.engine.test.state().paused)) === true);
  // 虛 표지는 이야기 앞에 한 줄로(접힘) — '실제 역사 보기'(aria-expanded)를 누르면 "실제로는 →"
  const ficTag = await page.evaluate((sel) => {
    const c = document.querySelector(sel + ' .nm-dlg-extras .nm-card-fiction');
    if (!c) return null;
    const b = c.querySelector('.nm-card-toggle'), more = c.querySelector('.nm-card-more');
    const r = { compact: c.classList.contains('is-compact'), mark: c.querySelector('[data-mark="fiction"]').textContent, name: c.querySelector('.nm-card-fname').textContent,
      label: b && b.textContent, expanded0: b && b.getAttribute('aria-expanded'), controls: b && b.getAttribute('aria-controls') === more.id, hidden0: more.hidden, h0: c.getBoundingClientRect().height };
    b.click();
    r.expanded1 = b.getAttribute('aria-expanded'); r.visible1 = !more.hidden && more.getBoundingClientRect().height > 0; r.real = more.textContent; r.label1 = b.textContent;
    b.click();
    r.expanded2 = b.getAttribute('aria-expanded'); r.hidden2 = more.hidden;
    return r;
  }, TOP);
  check('intro fiction is a compact one-line tag (collapsed, button with aria-expanded)', !!ficTag && ficTag.compact && ficTag.mark === '게임 설정 · 虛' && ficTag.name === '정음 통사' && ficTag.label === '실제 역사 보기' && ficTag.expanded0 === 'false' && ficTag.controls && ficTag.hidden0 && ficTag.h0 < 70, ficTag);
  check('fiction toggle expands "실제로는 →" real text and collapses again', !!ficTag && ficTag.expanded1 === 'true' && ficTag.visible1 && ficTag.real.includes('실제로는 →') && ficTag.real.includes('실제 직책이 아니다') && ficTag.label1 === '실제 역사 접기' && ficTag.expanded2 === 'false' && ficTag.hidden2, ficTag);
  const flow = await advance(page);
  const kinds = flow.map(x => x.kind).filter((k, i, a) => a.indexOf(k) === i);
  check('flow order: intro → request → encounter → example → needs', kinds.join() === 'intro,request,encounter,example,needs', kinds);
  const fic = flow.find(x => x.text.includes('虛'));
  check('fiction card with "실제로는 →" on first appearance', !!fic && fic.text.includes('실제로는') && fic.text.includes('실제 직책이 아니다'), fic && fic.text);
  const need = flow.find(x => x.kind === 'needs');
  check('unknown rule card with stage name', !!need && need.text.includes('아직 확인하지 않은 규칙') && need.text.includes('앞 규칙') && need.text.includes('4'), need && need.text);
  check('explore phase after intro, map running', (await page.evaluate(() => NM.ui.stage.current().phase)) === 'explore' && !(await page.evaluate(() => NM.engine.test.state().paused)));
  check('objective markers set for contexts', (await page.evaluate(() => NM.engine.test.state().objective.join())) === 's6.c1,s6.c2,s6.c3,s6.c4');
  check('HUD lists 3 core items (r3 not core at m)', (await page.evaluate(() => [...document.querySelectorAll('.nm-st-hud-item')].map(e => e.getAttribute('data-item')).join())) === 's6.r1,s6.r2,s6.t1');

  // ───────── 2) 원문 DOM ─────────
  // 맥락 1: 조사 지점 곁에서 E 를 눌러 연다(걷기 경로)
  await page.evaluate(() => NM.engine.test.teleport(210, 250));
  await page.waitForTimeout(60);
  await page.keyboard.press('e');
  await page.waitForTimeout(50);
  t = await topWin(page);
  check('E near spot opens context window', t && t.win === 'context' && t.context === 's6.c1', t);
  const ctxTitle = await page.evaluate((sel) => { const h = document.querySelector(sel + ' .nm-st-title'); return { eyebrow: h.querySelector('.nm-st-eyebrow') && h.querySelector('.nm-st-eyebrow').textContent, main: h.querySelector('.nm-st-title-main').textContent }; }, TOP);
  check('context window title = place name, kind as small eyebrow', ctxTitle.eyebrow === '조사' && ctxTitle.main === '비석', ctxTitle);
  const orig = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const lines = [...w.querySelectorAll('.nm-orig .nm-orig-line')];
    const l0 = lines[0];
    const vis = l0 && l0.querySelector('[aria-hidden="true"]');
    const bj = w.querySelector('.nm-orig .nm-bj');
    let bjBox = null;
    if (bj) {
      const s = bj.parentElement.getBoundingClientRect(), d = bj.getBoundingClientRect();
      bjBox = { dotX: d.left + d.width / 2, synLeft: s.left, synRight: s.right, display: getComputedStyle(bj).display };
    }
    return {
      inCanvas: false, count: lines.length, modern: l0 && l0.getAttribute('data-modern'),
      sr: l0 && l0.querySelector('.nm-sr') && l0.querySelector('.nm-sr').textContent,
      visHidden: !!vis, seal: !!w.querySelector('.nm-orig [data-mark="orig"]'),
      font: l0 && getComputedStyle(vis).fontFamily, bj: bjBox,
      rawToneChars: /[〮〯]/.test(vis ? vis.textContent : '')
    };
  }, TOP);
  check('原文 rendered as DOM lines with seal', orig.count === 2 && orig.seal, orig);
  check('modern reading attribute + screen-reader text', !!orig.modern && orig.modern.length > 0 && orig.sr === orig.modern && orig.visHidden && !/[〮〯]/.test(orig.modern), orig);
  check('原文 uses NMYet font', /NMYet/.test(orig.font || ''), orig.font);
  check('bangjeom drawn as left-side dot (no raw tone mark glyph)', orig.bj && orig.bj.display !== 'none' && orig.bj.dotX < (orig.bj.synLeft + orig.bj.synRight) / 2 && !orig.rawToneChars, orig.bj);
  check('notes card (알아 두기) with source in context', await page.evaluate((sel) => { const c = document.querySelector(sel + ' .nm-card[data-mark="know"]:not([data-item])'); return !!c && c.textContent.includes('시험 출처'); }, TOP));
  const lock0 = await page.evaluate((sel) => { const w = document.querySelector(sel); const L = w.querySelector('.nm-orig .nm-orig-modern-locked'); return { has: !!L && getComputedStyle(L).display !== 'none', text: L && L.textContent, want: NM.data.TEXT.stage.marks.modernLocked, leak: !!w.querySelector('.nm-orig .nm-orig-modern-text') || w.textContent.includes('시험 현대어 풀이') }; }, TOP);
  check('before decoding: 原文 shows locked 현대어 풀이 note (no translation in DOM)', lock0.has && lock0.text.includes(lock0.want) && !lock0.leak, lock0);

  // ───────── 3) 맥락 수와 확정 단추 ─────────
  check('context marks r1 met', (await state(page, 's6.r1')) === 'met');
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r1"]');
  t = await topWin(page);
  check('item window opens from context', t && t.win === 'item' && t.item === 's6.r1', t);
  check('context window inert under item window', await page.evaluate(() => document.querySelector('.nm-st-win[data-win="context"]').hasAttribute('inert')));
  const itemTitle = await page.evaluate((sel) => { const h = document.querySelector(sel + ' .nm-st-title'); const m = h.querySelector('.nm-st-title-main'); return { eyebrow: h.querySelector('.nm-st-eyebrow') && h.querySelector('.nm-st-eyebrow').textContent, yet: !!m.querySelector('.nm-st-item-title.nm-yet'), sr: m.textContent, bodyLabel: !!document.querySelector(sel + ' .nm-st-body .nm-st-item-label') }; }, TOP);
  check('item window title = item label (old Hangul DOM), "해독" as eyebrow, no duplicate body label', itemTitle.eyebrow === '해독' && itemTitle.yet && itemTitle.sr.length > 0 && !itemTitle.bodyLabel, itemTitle);
  // 살핀 곳 칩: 살핀 맥락(s6.c1)만, 접힘 → 펼치면 그 맥락의 원문 카드(현대어 풀이 잠김)와 대사를 창 안에서
  const clue = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const chips = [...w.querySelectorAll('.nm-st-clue')];
    const c = chips[0], b = c && c.querySelector('.nm-st-clue-btn'), body = c && c.querySelector('.nm-st-clue-body');
    const r = { n: chips.length, ctx: c && c.getAttribute('data-context'), name: b && b.textContent, exp0: b && b.getAttribute('aria-expanded'), ctrl: b && b.getAttribute('aria-controls') === body.id, hidden0: body && body.hidden };
    b.click();
    r.exp1 = b.getAttribute('aria-expanded'); r.vis1 = !body.hidden && body.getBoundingClientRect().height > 0;
    r.orig = [...body.querySelectorAll('.nm-orig')].map(o => o.getAttribute('data-orig')).join();
    r.locked = !!body.querySelector('.nm-orig-modern-locked'); r.leak = !!body.querySelector('.nm-orig-modern-text') || body.textContent.includes('시험 현대어 풀이');
    r.line = body.textContent.includes('비석에 글이 있다'); r.stillItem = w.getAttribute('data-win') === 'item' && document.querySelector(sel) === w;
    return r;
  }, TOP);
  check('clue chip per examined context (collapsed, aria-expanded/controls)', clue.n === 1 && clue.ctx === 's6.c1' && clue.name.includes('비석') && clue.exp0 === 'false' && clue.ctrl && clue.hidden0, clue);
  check('clue chip expands 원문 card (locked 현대어 풀이) + dialog lines inside the item window', clue.exp1 === 'true' && clue.vis1 && clue.orig === 'O-test-A' && clue.locked && !clue.leak && clue.line && clue.stillItem, clue);
  const cardIds = (page) => page.evaluate((sel) => [...document.querySelectorAll(sel + ' .nm-st-card')].map(b => b.getAttribute('data-card')), TOP);
  const r1Order = await cardIds(page);
  const r1Want = await page.evaluate(() => NM.core.rules.cardOrder(NM.data.SCENES.s6.items.find(i => i.id === 's6.r1'), window.__store.seed).map(c => c.id));
  check('cards shown in the record seed order (rules.cardOrder)', r1Order.join() === r1Want.join() && r1Order.length === 4, { r1Order, r1Want });
  await page.click(TOP + ' .nm-st-card[data-card="s6.r1.a"]');
  check('choose → guessed', (await state(page, 's6.r1')) === 'guessed');
  let conf = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-confirm'); return { disabled: b.disabled, seen: document.querySelector(sel + ' .nm-st-seen').textContent }; }, TOP);
  check('1 context seen → confirm disabled', conf.disabled === true && conf.seen.includes('1'), conf);
  const gs = await page.evaluate((sel) => { const g = document.querySelector(sel + ' .nm-st-guess'), c = document.querySelector(sel + ' .nm-st-confirm'); return { guess: !!g && !g.hidden && !g.disabled && g.textContent, confirmHidden: !!c && c.hidden }; }, TOP);
  check('1 context seen → 추측하기 button instead of confirm', gs.guess === '추측하기' && gs.confirmHidden, gs);
  check('no correctness shown before confirm', await page.evaluate((sel) => !document.querySelector(sel + ' .is-correct, ' + sel + ' .nm-st-answer, ' + sel + ' .nm-st-result'), TOP));
  // Tab 은 창 안에서 돈다
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  check('Tab keeps focus inside top window', await page.evaluate((sel) => !!document.activeElement.closest(sel), TOP));
  await page.click(TOP + ' .nm-st-guess');
  t = await topWin(page);
  const toast = await page.evaluate(() => { const e = document.querySelector('.nm-st-toast'); return e ? { text: e.textContent, role: e.getAttribute('role') } : null; });
  check('추측하기 closes only the item window (context stays)', t && t.win === 'context', t);
  const guessSavedText = await page.evaluate(() => NM.data.TEXT.stage.guessSaved);
  check('추측하기 shows a short notice (role=status)', !!toast && toast.role === 'status' && toast.text === guessSavedText, toast);
  check('guess kept after 추측하기', (await state(page, 's6.r1')) === 'guessed');
  await page.keyboard.press('Escape');
  check('Esc closes context; map resumes', !(await page.evaluate(() => NM.engine.isOverlayOpen())));
  // 같은 맥락 다시 → 그대로 1곳
  await goTo(page, 's6.c1');
  await closeAll(page);
  check('same context twice still guessed', (await state(page, 's6.r1')) === 'guessed');
  await goTo(page, 's6.c2');
  t = await topWin(page);
  check('goTo opens second context', t && t.context === 's6.c2', t);
  check('2 distinct contexts → confirmable', (await state(page, 's6.r1')) === 'confirmable');
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r1"]');
  conf = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-confirm'); return { disabled: b.disabled, seen: document.querySelector(sel + ' .nm-st-seen').textContent }; }, TOP);
  check('2 contexts → confirm enabled', conf.disabled === false && conf.seen.includes('2'), conf);
  check('2 clue chips after 2 contexts', (await page.evaluate((sel) => [...document.querySelectorAll(sel + ' .nm-st-clue')].map(c => c.getAttribute('data-context')).join(), TOP)) === 's6.c1,s6.c2');
  check('guess restored as checked card', await page.evaluate((sel) => document.querySelector(sel + ' .nm-st-card[data-card="s6.r1.a"]').getAttribute('aria-checked') === 'true', TOP));

  // ───────── 4) 오답 확정 → 오해 장면 → 도움 ─────────
  await page.click(TOP + ' .nm-st-confirm');
  t = await topWin(page);
  check('wrong confirm → misread dialog', t && t.win === 'dialog' && t.kind === 'misread' && t.text.includes('마을이라니'), t);
  check('state misread', (await state(page, 's6.r1')) === 'misread');
  await advance(page);
  t = await topWin(page);
  let help = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const h = w.querySelector('.nm-st-help');
    return { win: w.getAttribute('data-win'), step: h && h.getAttribute('data-step'), hint: !!w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent, why: w.querySelector('.nm-st-why') && w.querySelector('.nm-st-why').textContent, answer: !!w.querySelector('.nm-st-answer'), confirmDisabled: w.querySelector('.nm-st-confirm').disabled };
  }, TOP);
  check('after 1st wrong: back in item window with hint (step 1) + why', help.win === 'item' && help.step === '1' && help.hint && help.hint.includes('시험 힌트') && help.why && help.why.includes('마을이 아니다') && !help.answer, help);
  check('re-confirm needs a new card (guess cleared)', help.confirmDisabled === true, help);
  check('no glow yet', (await page.evaluate(() => NM.engine.test.state().highlight)) === null);
  await page.click(TOP + ' .nm-st-card[data-card="s6.r1.c"]');
  await page.click(TOP + ' .nm-st-confirm');
  t = await topWin(page);
  check('2nd wrong → misread dialog again', t && t.kind === 'misread' && t.text.includes('짐승'), t);
  await advance(page);
  help = await page.evaluate((sel) => { const w = document.querySelector(sel); return { step: w.querySelector('.nm-st-help').getAttribute('data-step'), glowNote: !!w.querySelector('.nm-st-glow') }; }, TOP);
  check('after 2nd wrong: step 2 with glow note', help.step === '2' && help.glowNote, help);
  check('after 2nd wrong: hinted context glows on map', (await page.evaluate(() => NM.engine.test.state().highlight)) === 's6.c3');
  await page.click(TOP + ' .nm-st-card[data-card="s6.r1.d"]');
  await page.click(TOP + ' .nm-st-confirm');
  t = await topWin(page);
  check('3rd wrong → misread dialog', t && t.kind === 'misread', t);
  await advance(page);
  help = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { step: w.querySelector('.nm-st-help').getAttribute('data-step'), answer: w.querySelector('.nm-st-answer') && w.querySelector('.nm-st-answer').textContent, explain: !!w.querySelector('.nm-card[data-mark="explain"]') && w.querySelector('.nm-card[data-mark="explain"]').textContent, right: w.querySelector('.nm-st-card.is-correct') && w.querySelector('.nm-st-card.is-correct').getAttribute('data-card'), confirm: !!w.querySelector('.nm-st-confirm:not([hidden])') };
  }, TOP);
  check('3rd wrong → confirmedByHelp', (await state(page, 's6.r1')) === 'confirmedByHelp');
  check('answer + explanation shown, correct card marked with symbol', help.step === '3' && help.answer && help.answer.includes('말') && help.explain && help.explain.includes('시험 풀이') && help.right === 's6.r1.b' && !help.confirm, help);
  check('glow cleared after done', (await page.evaluate(() => NM.engine.test.state().highlight)) === null);
  check('HUD shows done state with symbol', await page.evaluate(() => { const e = document.querySelector('.nm-st-hud-item[data-item="s6.r1"]'); return e.getAttribute('data-state') === 'confirmedByHelp' && /◎/.test(e.textContent); }));
  await closeAll(page);

  // ───────── 5) 새로 고침 → 이어 하기 ─────────
  await page.evaluate(() => NM.engine.test.teleport(1000, 800));
  await page.goto(server.url + 'tests/pages/stage.html?stage=s6&level=m');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 15000 });
  t = await topWin(page);
  check('reload: no intro replay (resume)', !t || t.kind !== 'intro', t);
  await advance(page); // 이어 하기 안내가 있으면 넘긴다
  const pos = await page.evaluate(() => { const s = NM.engine.test.state(); return { x: s.x, y: s.y }; });
  check('reload: character back at spawn', pos.x === 300 && pos.y === 480, pos);
  check('reload: item state restored', (await state(page, 's6.r1')) === 'confirmedByHelp' && await page.evaluate(() => document.querySelector('.nm-st-hud-item[data-item="s6.r1"]').getAttribute('data-state') === 'confirmedByHelp'));
  check('reload: seen contexts kept (r2 met from c1)', (await state(page, 's6.r2')) === 'met');
  await page.click('.nm-st-hud-item[data-item="s6.r1"]');
  const r1Again = await cardIds(page);
  check('reload: same card order for the same item', r1Again.join() === r1Order.join(), { r1Order, r1Again });
  await closeAll(page);

  // ───────── 6) 규칙 항목: 문장 완성 부품, 정답 확정, 규칙 카드, 현대어 풀이 ─────────
  await goTo(page, 's6.c3');
  check('non-core r3 shown as 알아 두기 only (no item button)', await page.evaluate((sel) => { const w = document.querySelector(sel); return !w.querySelector('.nm-st-ctx-item[data-item="s6.r3"]') && !!w.querySelector('.nm-card[data-mark="know"][data-item="s6.r3"]'); }, TOP));
  check('confirmed word glossed in modern Korean elsewhere', await page.evaluate((sel) => { const g = document.querySelector(sel + ' .nm-solved[data-item="s6.r1"] .nm-gloss'); return !!g && g.textContent.includes('말'); }, TOP));
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r2"]');
  const rc = await page.evaluate((sel) => { const w = document.querySelector(sel); const r = w.querySelector('.nm-rulecard'); return { has: !!r, blank: r && r.querySelector('.nm-rulecard-blank').textContent, opts: r ? r.querySelectorAll('.nm-st-card').length : 0 }; }, TOP);
  check('rule item uses sentence-completion component', rc.has && rc.opts === 3, rc);
  await page.click(TOP + ' .nm-st-card[data-card="s6.r2.a"]');
  check('chosen card fills the blank', (await page.evaluate((sel) => document.querySelector(sel + ' .nm-rulecard-blank').textContent, TOP)).includes('자음'));
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  check('no Esc leak: overlay closed', !(await page.evaluate(() => NM.engine.isOverlayOpen())));
  await goTo(page, 's6.elder'); // 인물의 말이 맥락(s6.c4)
  t = await topWin(page);
  check('npc with contextId opens context window', t && t.win === 'context' && t.context === 's6.c4', t);
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r2"]');
  await page.click(TOP + ' .nm-st-confirm');
  t = await topWin(page);
  const res = await page.evaluate((sel) => { const w = document.querySelector(sel); return { r: w.querySelector('.nm-st-result') && w.querySelector('.nm-st-result').getAttribute('data-result'), rule: !!w.querySelector('.nm-st-rule-added'), explain: !!w.querySelector('.nm-card[data-mark="explain"]') }; }, TOP);
  check('correct confirm → confirmed, explanation, rule card added', (await state(page, 's6.r2')) === 'confirmed' && res.r === 'correct' && res.rule && res.explain, res);
  check('rule card stored in notebook', await page.evaluate(() => window.__store.stage('s6').rules.join() === 'rule.fixture'));
  check('after confirm: 맵으로 돌아가기 button', await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-back'); return !!b && !b.hidden && b.textContent === '맵으로 돌아가기'; }, TOP));
  await page.click(TOP + ' .nm-st-back');
  await page.waitForTimeout(50);
  check('맵으로 돌아가기 closes item + context windows', await page.evaluate(() => NM.ui.stageWindow.count() === 0 && NM.ui.stage.current().phase === 'explore'));
  await goTo(page, 's6.c1');
  const lock1 = await page.evaluate((sel) => { const w = document.querySelector(sel); const m = w.querySelector('.nm-orig .nm-orig-modern-text'); return { locked: !!w.querySelector('.nm-orig-modern-locked'), modern: m && m.textContent }; }, TOP);
  check('after decoding: locked note replaced by 현대어 풀이', !lock1.locked && !!lock1.modern && lock1.modern.includes('시험 현대어 풀이'), lock1);
  await closeAll(page);

  // ───────── 7) 기믹 과제 ─────────
  await page.click('.nm-st-hud-item[data-item="s6.t1"]');
  t = await topWin(page);
  check('task window opens from HUD with gimmick mounted', t && t.win === 'task' && await page.evaluate((sel) => !!document.querySelector(sel + ' .nm-st-gimmick .d1tg'), TOP), t);
  await page.click(TOP + ' .d1tg-choice[data-choice="1"]');
  await page.click(TOP + ' .d1tg-submit');
  let tk = await page.evaluate((sel) => { const w = document.querySelector(sel); return { wrongMark: !!w.querySelector('.d1tg-choice[data-choice="1"].d1tg-wrong'), hint: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent, win: w.getAttribute('data-win') }; }, TOP);
  check('wrong submit → wrong part marked immediately + hint 1 (no misread scene)', tk.win === 'task' && tk.wrongMark && tk.hint && tk.hint.includes('과제 힌트'), tk);
  check('task still open', (await state(page, 's6.t1')) === 'open');
  await page.click(TOP + ' .d1tg-choice[data-choice="3"]');
  await page.click(TOP + ' .d1tg-submit');
  check('2nd wrong → fix target emphasized (showHint 2)', await page.evaluate((sel) => !!document.querySelector(sel + ' .d1tg-choice[data-choice="2"].d1tg-hint'), TOP));
  await page.click(TOP + ' .d1tg-choice[data-choice="1"]');
  await page.click(TOP + ' .d1tg-submit');
  tk = await page.evaluate((sel) => { const w = document.querySelector(sel); return { ans: !!w.querySelector('.d1tg-answer'), explain: w.querySelector('.nm-card[data-mark="explain"]') && w.querySelector('.nm-card[data-mark="explain"]').textContent }; }, TOP);
  check('3rd wrong → doneByHelp with answer + explanation', (await state(page, 's6.t1')) === 'doneByHelp' && tk.ans && tk.explain && tk.explain.includes('과제 풀이'), tk);

  check('task done: 맵으로 돌아가기 button', await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-st-back'); return !!b && !b.hidden; }, TOP));

  // ───────── 8) 장면 끝 ─────────
  await page.click(TOP + ' .nm-st-back');
  await page.waitForTimeout(50);
  t = await topWin(page);
  check('all core done → translate scene', t && t.win === 'dialog' && t.kind === 'translate', t);
  const trans = await advance(page);
  check('translate uses nickname particle (바다가)', trans.some(x => x.text.includes('바다가')), trans.map(x => x.text));
  t = await topWin(page);
  check('after translate: carve (no quiz)', t && t.win === 'carve' && await page.evaluate((sel) => !document.querySelector(sel + ' .nm-st-card'), TOP), t);
  check('carve shows glyph as DOM text', await page.evaluate((sel) => { const g = document.querySelector(sel + ' .nm-st-glyph'); return !!g && g.textContent.length > 0; }, TOP));
  check('stage completed atomically (done + glyph)', await page.evaluate(() => { const r = window.__store.get(); return r.progress.m.s6.status === 'done' && r.glyphs.m.join() === 's6'; }));
  await page.click(TOP + ' .nm-st-next');
  t = await topWin(page);
  check('then reflection line', t && t.win === 'reflect', t);
  await page.fill(TOP + ' .nm-st-reflect-input', '받침이 달랐다');
  await page.click(TOP + ' .nm-st-next');
  t = await topWin(page);
  check('then notebook-image save offer', t && t.win === 'save', t);
  check('reflection saved', await page.evaluate(() => window.__store.stage('s6').reflection === '받침이 달랐다'));
  await page.click(TOP + ' .nm-st-save');
  await page.waitForFunction(() => window.__exits.length === 1, null, { timeout: 3000 });
  const exit = await page.evaluate(() => ({ e: window.__exits[0], saved: window.__saved, open: NM.engine.isOverlayOpen(), hud: !!document.querySelector('.nm-st-hud') }));
  check('saveImage called then onExit(completed)', exit.saved === 1 && exit.e.completed === true && exit.e.stageId === 's6' && !exit.open && !exit.hud, exit);
  // 끝낸 장면 다시 하기: 수첩·항목을 비우면 도입부터, 패 글자·완료는 남는다
  const rp = await page.evaluate(async () => {
    const r = window.__store.replay('s6');
    await NM.ui.stage.run('s6', { store: window.__store, level: 'm', teacher: false, onExit: (x) => window.__exits.push(x) });
    const w = document.querySelector('.nm-overlay-host > .nm-st-win:last-child');
    const rec = window.__store.get();
    const out = { ok: r.ok, kind: w && w.getAttribute('data-kind'), status: rec.progress.m.s6.status, glyphs: rec.glyphs.m.join(), rules: rec.progress.m.s6.rules.length };
    NM.ui.stage.stop();
    return out;
  });
  check('replay: intro again, glyph and done kept, notebook cleared', rp.ok && rp.kind === 'intro' && rp.status === 'done' && rp.glyphs === 's6' && rp.rules === 0, rp);
  let errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (student run)', errs.length === 0, errs);
  await page.close();

  // ───────── 9) 저장 제안 없이 끝(saveImage 없음), 나가기 ─────────
  page = await openPage(context, 'stage=s6&level=m&nosave=1&reset=1');
  await advance(page);
  await page.click('.nm-st-exit');
  await page.waitForFunction(() => window.__exits.length === 1, null, { timeout: 3000 });
  check('exit button → onExit(completed:false), cleaned up', await page.evaluate(() => window.__exits[0].completed === false && !document.querySelector('.nm-st-hud') && NM.ui.stage.current().phase === 'exited'));
  await page.close();

  // ───────── 9b) 실마리 더 보기: 틀리지 않고 도움 단계 올리기 ─────────
  page = await openPage(context, 'stage=s6&level=m&nosave=1&reset=1');
  await advance(page);
  await goTo(page, 's6.c1');
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r1"]');
  const mh = () => page.evaluate((sel) => {
    const w = document.querySelector(sel), b = w.querySelector('.nm-st-morehelp'), h = w.querySelector('.nm-st-help');
    const r = window.__store.stage('s6').items['s6.r1'];
    return { btn: b && b.textContent, step: h && h.getAttribute('data-step'), hint: !!w.querySelector('.nm-st-hint'), answer: !!w.querySelector('.nm-st-answer'),
      result: w.querySelector('.nm-st-result') && w.querySelector('.nm-st-result').getAttribute('data-result'), rec: r, glow: NM.engine.test.state().highlight };
  }, TOP);
  const T = await page.evaluate(() => NM.data.TEXT.stage.btn);
  let m = await mh();
  check('more-help button offered without any wrong answer', m.btn === T.moreHelp && !m.step, m);
  await page.click(TOP + ' .nm-st-morehelp');
  m = await mh();
  check('more-help 1: hint shown, no wrong counted, state unchanged', m.step === '1' && m.hint && m.rec.wrongs === 0 && m.rec.helps === 1 && m.rec.asks === 1 && m.rec.state === 'met' && m.rec.firstTry === false, m);
  await page.click(TOP + ' .nm-st-morehelp');
  m = await mh();
  check('more-help 2: clue context glows; last step relabeled', m.step === '2' && m.glow === 's6.c3' && m.btn === T.helpAnswer && m.rec.wrongs === 0, m);
  await page.click(TOP + ' .nm-st-morehelp');
  m = await mh();
  check('more-help 3: answer + confirmedByHelp, button gone', m.step === '3' && m.answer && m.result === 'help' && m.btn === null && m.rec.state === 'confirmedByHelp' && m.rec.wrongs === 0 && m.rec.asks === 3, m);
  check('more-help: glow cleared after done', m.glow === null, m.glow);
  await closeAll(page);
  await page.click('.nm-st-hud-item[data-item="s6.t1"]');
  await page.click(TOP + ' .nm-st-morehelp');
  const tm = await page.evaluate((sel) => { const w = document.querySelector(sel); const b = w.querySelector('.nm-st-morehelp:not([hidden])'); return { hint: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent, rec: window.__store.stage('s6').items['s6.t1'], btn: b && b.textContent }; }, TOP);
  check('task more-help: hint 1 without a wrong submit', !!tm.hint && tm.hint.includes('과제 힌트') && tm.rec.wrongs === 0 && tm.rec.helps === 1 && tm.rec.state === 'open' && tm.btn === T.moreHelp, tm);
  await page.click(TOP + ' .nm-st-morehelp');
  await page.click(TOP + ' .nm-st-morehelp');
  const tm3 = await page.evaluate((sel) => { const w = document.querySelector(sel); return { ans: !!w.querySelector('.d1tg-answer'), explain: !!w.querySelector('.nm-card[data-mark="explain"]'), rec: window.__store.stage('s6').items['s6.t1'], btn: !!w.querySelector('.nm-st-morehelp:not([hidden])') }; }, TOP);
  check('task more-help 3: doneByHelp with answer, button hidden', tm3.ans && tm3.explain && tm3.rec.state === 'doneByHelp' && tm3.rec.wrongs === 0 && !tm3.btn, tm3);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (more-help run)', errs.length === 0, errs);
  await page.close();

  // ───────── 10) 교사 모드 ─────────
  page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/stage.html?idle=1'); // 같은 출처에 학생 기록을 미리 둔다(장면은 돌리지 않음)
  const sentinel = JSON.stringify({ v: 1, level: 'm', protagonist: 2, nickname: '하늘', settings: { bangjeom: true, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', s); }, sentinel);
  await page.goto(server.url + 'tests/pages/stage.html?stage=s6&level=m&teacher=1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 15000 });
  t = await topWin(page);
  check('teacher: called 통사 (no nickname)', t && t.text.includes('통사야') && !t.text.includes('하늘'), t && t.text);
  check('teacher: big view class on windows', await page.evaluate(() => document.documentElement.getAttribute('data-nm-teacher') === '1'));
  await advance(page);
  await goTo(page, 's6.c1');
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r1"]');
  const before = await page.evaluate(() => JSON.stringify(window.__store.stage('s6').items['s6.r1']));
  await page.click(TOP + ' .nm-st-teacher-answer');
  const ta = await page.evaluate((sel) => { const w = document.querySelector(sel); return { ans: w.querySelector('.nm-st-answer') && w.querySelector('.nm-st-answer').textContent, ex: !!w.querySelector('.nm-card[data-mark="explain"]') }; }, TOP);
  const after = await page.evaluate(() => JSON.stringify(window.__store.stage('s6').items['s6.r1']));
  check('teacher: answer/explanation shown on demand', ta.ans && ta.ans.includes('말') && ta.ex, ta);
  check('teacher: reveal does not change item record', before === after, { before, after });
  check('teacher: student record untouched', (await page.evaluate(() => localStorage.getItem('naratmalssami:v1'))) === sentinel);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (teacher run)', errs.length === 0, errs);
  await page.close();

  // ───────── 11) 방점 끄기 / s4 늘 켬 ─────────
  page = await context.newPage();
  watch(page);
  await page.goto(server.url + 'tests/pages/stage.html?idle=1');
  const off = JSON.stringify({ v: 1, level: 'm', protagonist: 1, nickname: '', settings: { bangjeom: false, fontScale: 3, reducedMotion: true, bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', s); }, off);
  await page.goto(server.url + 'tests/pages/stage.html?stage=s6&level=m');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 15000 });
  // 원문과 마주침 창까지 넘긴다
  for (let i = 0; i < 10; i++) { const w = await topWin(page); if (!w || w.kind === 'encounter') break; await page.click(TOP + ' .nm-dlg-next'); }
  const bjOff = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-orig .nm-bj'); return { attr: document.documentElement.getAttribute('data-nm-bangjeom'), display: b ? getComputedStyle(b).display : 'missing', fs: getComputedStyle(document.documentElement).getPropertyValue('--fs').trim(), motion: document.documentElement.getAttribute('data-nm-motion') }; }, TOP);
  check('bangjeom off setting hides dots in s6', bjOff.attr === 'off' && bjOff.display === 'none', bjOff);
  check('font scale 3 applied (--fs) and reduced motion', Number(bjOff.fs) > 1.3 && bjOff.motion === 'reduce', bjOff);
  // U1 의 설정 알림(nm:settings): 방점 켜기는 다시 그리지 않고 점만 보인다. --fs 는 U1 몫이 된다.
  const live = await page.evaluate((sel) => {
    document.documentElement.style.setProperty('--fs', '1.25');
    NM.core.yet.setBangjeom(true);
    document.dispatchEvent(new CustomEvent('nm:settings', { detail: { settings: { bangjeom: true, fontScale: 2, reducedMotion: false, bgm: true, sfx: true }, reducedMotion: false } }));
    const b = document.querySelector(sel + ' .nm-orig .nm-bj');
    return { attr: document.documentElement.getAttribute('data-nm-bangjeom'), display: getComputedStyle(b).display, fs: getComputedStyle(document.documentElement).getPropertyValue('--fs').trim(), motion: document.documentElement.getAttribute('data-nm-motion') };
  }, TOP);
  check('nm:settings toggles bangjeom live; --fs left to U1', live.attr === 'on' && live.display !== 'none' && live.fs === '1.25' && live.motion === 'full', live);
  const stopped = await page.evaluate(() => { const r = NM.ui.stage.stop(); return { r, exits: window.__exits.length, hud: !!document.querySelector('.nm-st-hud'), open: NM.engine.isOverlayOpen(), phase: NM.ui.stage.current().phase }; });
  check('stop(): clean abort without onExit', stopped.r === true && stopped.exits === 0 && !stopped.hud && !stopped.open && stopped.phase === 'exited', stopped);
  await page.goto(server.url + 'tests/pages/stage.html?stage=s4&level=h1');
  await page.waitForFunction(() => window.__stageReady === true, null, { timeout: 15000 });
  for (let i = 0; i < 10; i++) { const w = await topWin(page); if (!w || w.kind === 'encounter') break; await page.click(TOP + ' .nm-dlg-next'); }
  const bjOn = await page.evaluate((sel) => { const b = document.querySelector(sel + ' .nm-orig .nm-bj'); return { attr: document.documentElement.getAttribute('data-nm-bangjeom'), display: b ? getComputedStyle(b).display : 'missing', setting: window.__store.get().settings.bangjeom }; }, TOP);
  check('s4 forces bangjeom on regardless of setting', bjOn.attr === 'on' && bjOn.display !== 'none' && bjOn.setting === false, bjOn);
  const s4live = await page.evaluate(() => {
    NM.core.yet.setBangjeom(false); // U1 이 설정대로 끈 뒤 알린다
    document.dispatchEvent(new CustomEvent('nm:settings', { detail: { settings: { bangjeom: false, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true } } }));
    return { attr: document.documentElement.getAttribute('data-nm-bangjeom'), yet: NM.core.yet.settings.bangjeom };
  });
  check('s4 stays forced on after nm:settings(bangjeom off)', s4live.attr === 'on' && s4live.yet === true, s4live);
  errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors (bangjeom runs)', errs.length === 0, errs);
  await page.close();

  // ───────── 12) 좁은 화면: 가로 스크롤 없음 ─────────
  const phone = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true });
  page = await openPage(phone, 'stage=s6&level=m&reset=1');
  await advance(page);
  await goTo(page, 's6.c1');
  await page.click(TOP + ' .nm-st-ctx-item[data-item="s6.r1"]');
  const fit = await page.evaluate((sel) => { const w = document.querySelector(sel).getBoundingClientRect(); return { left: w.left, right: w.right, vw: innerWidth, sw: document.documentElement.scrollWidth }; }, TOP);
  check('phone: item window fits width, no horizontal scroll', fit.left >= 0 && fit.right <= fit.vw && fit.sw <= fit.vw, fit);
  await page.close();
  await phone.close();

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
if (failed) { console.log(`d1-stage-browser: ${failed} failed`); process.exit(1); }
console.log('d1-stage-browser ok');
