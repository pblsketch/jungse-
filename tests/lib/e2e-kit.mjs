// 끝까지 풀기(e2e) 공용 도구 — tests/e2e/*.mjs 가 불러 쓴다(점검 파일이 아님).
// 실제 게임(index.html)을 설치된 Chrome(headless)으로 열고, 첫 화면부터 화면의 단추를 눌러 진행한다.
// - 화면(첫 화면·처음 정하기·장면 고르기·설정·수첩)의 단추는 Playwright 누르기(실제 포인터)로 누른다.
// - 장면 창(대사·맥락·항목·끝 창)의 단추는 DOM click 으로 누른다(같은 단추·같은 처리기, 겹친 그림의 영향만 없음).
// - 걷기는 NM.engine.goTo(장소 id)로 건너뛴다(교사 모드 장소 목록과 같은 길: 그 자리로 옮겨 살피기).
//   세 가지 움직임(키보드·누른 곳으로 걷기·조이스틱)은 tests/e2e/screens.mjs 가 실제 입력으로 따로 확인한다.
// - 기믹 과제의 답은 점검 통로 NM.ui.itemTask.test.submit 로 낸다(기믹 화면 조작은 g-*-browser 점검 몫).
//   일부러 틀린 답(tests/lib/wrong-answer.mjs) 뒤에는 기믹이 틀린 부분 표시를 그렸는지 본다.
// 콘솔 오류·페이지 오류·외부 요청·window.__nmErrors 는 쪽마다 모은다(새로 고침해도 이어서 모음).
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../server.mjs';
import { pickWrongAnswer, WRONG_MARK_SELECTOR } from './wrong-answer.mjs';
import { answerTranslateChoice } from './translate-choice.mjs';

export const KEY = 'naratmalssami:v1';
export const LEVELS = ['m', 'h1', 'h23'];
export const BUNDLE = {
  m: ['s2', 's3', 's9', 's12'],
  h1: ['s4', 's5', 's6', 's9', 's12', 's10'],          // s10 은 고1 추천 선택 — 함께 푼다
  h23: ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12']
};
export const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots', 'e2e');
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

/* ---------- 점검 기록 ---------- */
export function makeChecker(name, limitMs) {
  let failed = 0, count = 0;
  const fails = [];
  const t0 = Date.now();
  const timer = setTimeout(() => {
    console.log(`FAIL ${name}: time limit (${Math.round(limitMs / 1000)} s)`);
    console.log(`SUMMARY ${name}: ${count - failed}/${count} ok, ${failed + 1} failed (time limit)`);
    process.exit(1);
  }, limitMs);
  return {
    check(label, ok, info) {
      count++;
      if (ok) console.log('  ok   ' + label);
      else {
        failed++;
        const msg = label + (info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 1500) : '');
        fails.push(msg);
        console.log('  FAIL ' + msg);
      }
      return !!ok;
    },
    step(text) { console.log(`-- ${text}  (${Math.round((Date.now() - t0) / 1000)} s)`); },
    get failed() { return failed; },
    get fails() { return fails.slice(); },
    finish(extra) {
      clearTimeout(timer);
      const s = Math.round((Date.now() - t0) / 1000);
      console.log(`SUMMARY ${name}: ${count - failed}/${count} ok${failed ? `, ${failed} failed` : ''} (${s} s)${extra ? ' — ' + extra : ''}`);
      process.exit(failed ? 1 : 0);
    }
  };
}

/* ---------- 브라우저·쪽 ---------- */
export async function startBrowser() {
  const server = await serve();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  return { server, browser, async close() { await browser.close().catch(() => {}); await server.close(); } };
}

export async function newSession(env, opts) {
  const o = opts || {};
  const context = await env.browser.newContext({
    viewport: o.viewport || { width: 1280, height: 800 }, deviceScaleFactor: 1,
    hasTouch: !!o.hasTouch, isMobile: !!o.isMobile, acceptDownloads: true
  });
  const page = await context.newPage();
  page.setDefaultTimeout(o.timeout || 30000);
  const watch = { consoleErrors: [], external: [], failed: [], nmErrors: [] };
  page.on('console', m => { if (m.type() === 'error') watch.consoleErrors.push(m.text()); });
  page.on('pageerror', e => watch.consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { const u = r.url(); if (!/^(data:|blob:)/.test(u) && !u.startsWith(env.server.url)) watch.external.push(u); });
  page.on('response', r => { if (r.status() >= 400) watch.failed.push(r.status() + ' ' + r.url()); });
  const S = {
    env, page, context, watch,
    url: (q) => env.server.url + 'index.html' + (q || ''),
    async open(query) {
      await S.collectNmErrors();
      await page.goto(S.url(query));
      await S.waitStarted();
    },
    async reload() {
      await S.collectNmErrors();
      await page.reload();
      await S.waitStarted();
    },
    async waitStarted() {
      await page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.app.started === true && NM.engine, null, { timeout: 60000 });
      await page.evaluate(() => NM.engine.ready());
    },
    // 새로 고침 전에 게임 오류 목록을 옮겨 둔다
    async collectNmErrors() {
      try {
        const e = await page.evaluate(() => (window.__nmErrors || []).splice(0));
        if (e && e.length) watch.nmErrors.push(...e);
      } catch (e) { /* 아직 쪽이 없음 */ }
    },
    async allNmErrors() { await S.collectNmErrors(); return watch.nmErrors.slice(); },
    screen() { return page.evaluate(() => { const s = document.getElementById('nm-screens'); return s && !s.hidden ? s.getAttribute('data-screen') : null; }); },
    waitScreen(name, timeout) { return page.waitForFunction(n => { const s = document.getElementById('nm-screens'); return s && !s.hidden && s.getAttribute('data-screen') === n; }, name, { timeout: timeout || 30000 }); },
    waitModal(name) { return page.waitForSelector(`.nm-modal[data-modal="${name}"]`, { state: 'visible', timeout: 30000 }); },
    modalOpen(name) { return page.evaluate(n => !!document.querySelector(`.nm-modal[data-modal="${n}"]`), name); },
    saved() { return page.evaluate(k => { const v = localStorage.getItem(k); return v === null ? null : JSON.parse(v); }, KEY); },
    rawStorage() { return page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(o); }); },
    appState() { return page.evaluate(() => NM.ui.app.test.state()); },
    stageNow() { return page.evaluate(() => NM.ui.stage.current()); },
    engine() { return page.evaluate(() => NM.engine.test.state()); },
    async shot(name) {
      try { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, name + '.png') }); } catch (e) { /* 그림은 참고용 */ }
    }
  };
  return S;
}

/* ---------- 장면 창 다루기(DOM click) ---------- */
export const topWin = (page) => page.evaluate((sel) => {
  const w = document.querySelector(sel);
  if (!w) return null;
  const has = (s) => !!w.querySelector(s);
  return {
    win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), item: w.getAttribute('data-item'),
    context: w.getAttribute('data-context'), next: has('.nm-dlg-next'), text: (w.textContent || '').slice(0, 200)
  };
}, TOP);
// 맨 위 창이 want({ win, kind, item, context } 중 준 것)와 맞을 때까지 기다린다(바쁜 컴퓨터용). 마지막으로 본 창을 돌려준다.
export async function waitTop(page, want, timeout = 8000) {
  const t0 = Date.now();
  let t = null;
  for (;;) {
    t = await topWin(page);
    if (t && Object.keys(want).every(k => t[k] === want[k])) return t;
    if (Date.now() - t0 > timeout) return t;
    await page.waitForTimeout(40);
  }
}
export const domClick = (page, sel) => page.evaluate((s) => {
  const b = document.querySelector(s);
  if (!b || b.disabled || b.hidden) return false;
  b.click();
  return true;
}, sel);
const winCount = (page) => page.evaluate(() => NM.ui.stageWindow.count());

// 대사 창을 '다음'으로 넘긴다(맥락·항목·끝 창에서 멈춘다). 지나간 대사 창 종류를 돌려준다.
export async function settleDialogs(page, max = 200) {
  const kinds = [];
  let lastKind = null;
  for (let i = 0; i < max; i++) {
    const t = await topWin(page);
    if (!t || t.win !== 'dialog' || !t.next) break;
    if (t.kind !== lastKind) { kinds.push(t.kind); lastKind = t.kind; }
    await domClick(page, TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
  return kinds;
}
// 맨 위의 맥락·항목·과제 창을 × 단추로 닫는다. 대사·끝 창(통역 등)이 맨 위에 오면 거기서 멈춘다(false).
export async function closeWindows(page) {
  for (let i = 0; i < 30; i++) {
    const t = await topWin(page);
    if (!t) return true;
    if (['context', 'item', 'task'].indexOf(t.win) < 0) return false;
    if (!(await domClick(page, TOP + ' > .nm-st-close'))) return false;
    await page.waitForTimeout(25);
  }
  return (await winCount(page)) === 0;
}

// 좁은 화면에서는 HUD 가 접혀 있다 — 머리 단추로 편다
export async function ensureHudOpen(page) {
  return page.evaluate(() => {
    const h = document.querySelector('.nm-st-hud .nm-st-hud-head');
    if (h && h.getAttribute('aria-expanded') === 'false') { h.click(); return 'opened'; }
    return h ? 'open' : 'none';
  });
}
export async function exitStageViaHud(page) {
  await ensureHudOpen(page);
  return domClick(page, '.nm-st-hud .nm-st-exit');
}

/* ---------- 화면 점검 ---------- */
// 점검 통로·개발용 글이 화면에 보이지 않는다
export const visibleTestUi = (page) => page.evaluate(() => {
  const bad = [];
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  for (const e of document.querySelectorAll('body *')) {
    const names = [e.id, typeof e.className === 'string' ? e.className : '', ...Array.from(e.attributes).map(a => a.name)].join(' ');
    if (/(^|[\s_-])(test|testid|debug)([\s_-]|$)|__/i.test(names) && vis(e)) bad.push(e.tagName + ' ' + names.slice(0, 80));
  }
  const text = document.body.innerText || '';
  const m = text.match(/NM\.(ui|engine|core|data)|test\.submit|undefined|NaN|%[a-zA-Z]+%|\[object /);
  if (m) bad.push('text: ' + m[0] + ' … ' + text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' '));
  return bad;
});

// 가로 넘침: 쪽 전체 가로 스크롤 + 보이는 화면·창·도구 막대가 화면 밖으로 나감 + 그 안의 가로 스크롤 칸
export const horizontalOverflow = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const pageOver = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw;
  if (pageOver > 0) out.push({ what: 'page', over: pageOver });
  const name = (r) => r.id || (typeof r.className === 'string' && r.className ? r.className.split(' ').slice(0, 2).join('.') : r.tagName);
  const roots = [document.getElementById('nm-screens'), document.getElementById('nm-toolbar'), document.querySelector('.nm-st-hud'),
    ...document.querySelectorAll('.nm-modal, .nm-overlay-host > .nm-st-win')]
    .filter(e => e && !e.hidden && e.getClientRects().length);
  for (const r of roots) {
    const q = r.getBoundingClientRect();
    if (q.right > vw + 1 || q.left < -1) out.push({ what: name(r), left: Math.round(q.left), right: Math.round(q.right), vw });
    // 틀 자체가 내용보다 좁음(가로 스크롤이거나 잘림)
    if (r.scrollWidth > r.clientWidth + 1) out.push({ what: name(r) + ' (content wider than frame)', sw: r.scrollWidth, cw: r.clientWidth });
    for (const e of r.querySelectorAll('*')) {
      if (!e.getClientRects().length) continue;
      const cs = getComputedStyle(e);
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1) out.push({ what: name(e) + ' (scrolls sideways)', sw: e.scrollWidth, cw: e.clientWidth });
      // 보이는 요소가 화면 밖으로 나감(잘려 안 보임)
      const b = e.getBoundingClientRect();
      if (b.width > 1 && b.height > 1 && cs.visibility !== 'hidden' && (b.right > vw + 1 || b.left < -1)) out.push({ what: name(e) + ' (outside screen)', left: Math.round(b.left), right: Math.round(b.right), vw });
    }
  }
  return out;
});

/* ---------- 처음부터: 첫 화면 → 처음 정하기 → 서장 ---------- */
// level: 'm'|'h1'|'h23', viaUrl: 주소 ?level= 로 학교급 단계를 건너뛴다
export async function setupFromTitle(S, C, { level, viaUrl, protagonist = 2, nickname = '해솔' }) {
  const { page } = S;
  await S.waitScreen('title');
  C.check(`${level}: title shows start only (no record)`, !!(await page.$('[data-act="start"]')) && !(await page.$('[data-act="continue"]')));
  C.check(`${level}: no visible test UI on title`, (await visibleTestUi(page)).length === 0, await visibleTestUi(page));
  await page.click('[data-act="start"]');
  if (viaUrl) {
    await S.waitScreen('setup-protagonist');
    C.check(`${level}: URL level skips the level step`, true);
  } else {
    await S.waitScreen('setup-level');
    await page.click(`[data-act="level"][data-value="${level}"]`);
    await S.waitScreen('setup-protagonist');
  }
  await page.click(`[data-act="protagonist"][data-value="${protagonist}"]`);
  await S.waitScreen('setup-nickname');
  await page.fill('#nm-nick', nickname);
  await page.click('[data-act="nick-ok"]');
  await page.waitForFunction(() => { const c = NM.ui.stage.current(); return c.stageId === 's0' && c.phase !== 'loading' && c.phase !== 'idle'; }, null, { timeout: 60000 });
  const rec = await S.saved();
  C.check(`${level}: setup saved (level, protagonist, nickname)`, rec && rec.level === level && rec.protagonist === protagonist && rec.nickname === nickname && rec.prologueDone === false, rec && { level: rec.level, protagonist: rec.protagonist, nickname: rec.nickname });
}

/* ---------- 장면 하나를 화면으로 끝까지 ---------- */
// opts: {
//   tag, level,
//   fromSelect: true     장면 고르기에서 카드를 눌러 들어간다(서장은 처음 정하기 뒤 바로 들어가므로 false)
//   expectOutside        묶음 밖 안내가 떠야 하는가
//   reloadAfterItems: n  n번째 항목까지 끝내고 다음 해독 항목의 맥락 하나를 살핀 뒤 새로 고침 → 이어 하기
//   imageInProgress      항목 몇 개를 끝낸 뒤 도구 막대의 수첩에서 이미지 저장(진행 중)
//   saveAtEnd            끝의 저장 제안에서 '저장'을 누른다(아니면 '나중에')
//   reflection           돌아보기 한 줄(없으면 건너뛰기)
// }
export async function playStageUI(S, C, stageId, opts) {
  const o = Object.assign({ fromSelect: true, expectOutside: false, wrongOnce: true }, opts || {});
  const { page } = S;
  const tag = o.tag || stageId;
  if (o.fromSelect) await enterFromSelect(S, C, stageId, { tag, expectOutside: o.expectOutside });
  // 장면이 열릴 때까지
  await page.waitForFunction((id) => { const c = NM.ui.stage.current(); return c.stageId === id && (c.phase === 'intro' || c.phase === 'explore'); }, stageId, { timeout: 90000 });
  await page.waitForFunction(() => NM.engine.test.state().mapLoaded, null, { timeout: 60000 });
  const first = await page.evaluate(() => ({ phase: NM.ui.stage.current().phase, x: NM.engine.test.state().x, y: NM.engine.test.state().y, map: NM.engine.test.state().mapUrl }));
  const spawn = { x: first.x, y: first.y };
  C.check(`${tag}: stage opens with intro (fresh)`, first.phase === 'intro', first);
  C.check(`${tag}: toolbar shown during stage`, await page.isVisible('#nm-toolbar [data-act="notebook"]') && await page.isVisible('#nm-toolbar [data-act="settings"]'));
  const introKinds = await settleDialogs(page);
  C.check(`${tag}: intro dialogs played (intro, request …)`, introKinds[0] === 'intro' && introKinds.indexOf('request') >= 0, introKinds);
  await page.waitForFunction(() => NM.ui.stage.current().phase === 'explore', null, { timeout: 30000 }).catch(() => {});
  C.check(`${tag}: explore phase after intro`, (await S.stageNow()).phase === 'explore', await S.stageNow());
  C.check(`${tag}: no visible test UI in stage`, (await visibleTestUi(page)).length === 0, await visibleTestUi(page));

  const plan = await stagePlan(page, stageId);
  C.check(`${tag}: has core items for level`, plan.items.length > 0, plan);
  let reloaded = false, imaged = false;
  for (let k = 0; k < plan.items.length; k++) {
    const it = plan.items[k];
    // 새로 고침 → 이어 하기 (해독 항목의 맥락 하나를 살핀 상태에서)
    if (o.reloadAfterItems !== undefined && !reloaded && k >= o.reloadAfterItems && it.kind === 'read') {
      reloaded = true;
      await closeWindows(page);
      await page.evaluate((c) => NM.engine.goTo(c), it.contexts[0]);
      await waitTop(page, { win: 'context', context: it.contexts[0] });
      await closeWindows(page);
      await reloadAndResume(S, C, stageId, { tag, spawn, partialItem: it.id });
    }
    if (o.imageInProgress && !imaged && k >= Math.min(2, plan.items.length - 1)) {
      imaged = true;
      await closeWindows(page);
      await imageFromToolbar(S, C, stageId, { tag });
    }
    if (it.kind === 'read') await solveRead(S, C, stageId, it, { tag, wrongOnce: o.wrongOnce });
    else await solveTask(S, C, stageId, it, { tag, wrongOnce: o.wrongOnce });
  }
  if (o.reloadAfterItems !== undefined && !reloaded) C.check(`${tag}: reload step ran`, false, 'no read item after index ' + o.reloadAfterItems);
  await finishStage(S, C, stageId, plan, { tag, saveAtEnd: o.saveAtEnd, reflection: o.reflection });
  return { plan, spawn };
}

async function enterFromSelect(S, C, stageId, { tag, expectOutside }) {
  const { page } = S;
  await S.waitScreen('select');
  await page.click(`[data-stage="${stageId}"]`);
  // 안내 창이 뜨거나 장면이 열리기 시작할 때까지
  await page.waitForFunction((id) => !!document.querySelector('.nm-modal[data-modal="notice-outside"], .nm-modal[data-modal="stage-done"]') ||
    NM.ui.stage.current().stageId === id, stageId, { timeout: 30000 }).catch(() => {});
  const outside = await S.modalOpen('notice-outside');
  C.check(`${tag}: out-of-bundle notice ${expectOutside ? 'shown' : 'not shown'}`, outside === !!expectOutside);
  C.check(`${tag}: no 'already done' dialog`, !(await S.modalOpen('stage-done')));
  if (outside) {
    const txt = await page.textContent('.nm-modal[data-modal="notice-outside"]');
    C.check(`${tag}: notice says which level teaches it`, /배우는 내용이에요/.test(txt), txt);
    await page.click('.nm-modal[data-modal="notice-outside"] [data-act="enter"]');
  }
}

export async function stagePlan(page, stageId) {
  return page.evaluate((stageId) => {
    const st = NM.ui.app.store();
    const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[stageId], st.level);
    return {
      level: st.level,
      items: st.coreItems(sc).map(it => ({
        id: it.id, kind: it.kind, answer: it.answer, gimmick: it.gimmick || null,
        contexts: (sc.contexts || []).filter(c => (c.items || []).indexOf(it.id) >= 0).map(c => c.id),
        wrong: it.kind === 'read' ? ((it.cards || []).filter(c => !c.correct)[0] || {}).id : null,
        right: it.kind === 'read' ? ((it.cards || []).filter(c => c.correct)[0] || {}).id : null
      })),
      translateAt: (sc.translate && sc.translate.at) || null,
      choice: !!(NM.ui.stageTranslate && NM.ui.stageTranslate.has(sc.translate)),
      carveGlyph: sc.carveGlyph || null
    };
  }, stageId);
}
const itemRec = (page, stageId, id) => page.evaluate(({ stageId, id }) => {
  const r = NM.ui.app.store().stage(stageId).items[id];
  return r ? { state: r.state, wrongs: r.wrongs, seen: (r.seenContexts || []).length } : null;
}, { stageId, id });

// 걷기 건너뛰기: 그 자리로 옮겨 살피기 → 맥락 창이 떠야 한다
async function visit(S, C, tag, contextId) {
  const { page } = S;
  await closeWindows(page);
  const ok = await page.evaluate((c) => NM.engine.goTo(c), contextId);
  const t = await waitTop(page, { win: 'context', context: contextId });
  const opened = !!ok && t && t.win === 'context' && t.context === contextId;
  if (!opened) C.check(`${tag}: walking to ${contextId} opens its context window`, false, { ok, top: t });
  return opened;
}

async function solveRead(S, C, stageId, it, { tag, wrongOnce }) {
  const { page } = S;
  const ctx = [...new Set(it.contexts)];
  if (ctx.length < 2) { C.check(`${tag}: ${it.id} is in 2+ contexts`, false, ctx); return; }
  await visit(S, C, tag, ctx[0]);
  if (!(await visit(S, C, tag, ctx[1]))) return;
  // 맥락 창의 항목 단추로 항목 창 열기
  if (!(await domClick(page, TOP + ` .nm-st-ctx-item[data-item="${it.id}"]`))) { C.check(`${tag}: ${it.id} button in context window`, false); return; }
  let t = await waitTop(page, { win: 'item', item: it.id });
  if (!t || t.win !== 'item' || t.item !== it.id) { C.check(`${tag}: ${it.id} item window opens`, false, t); return; }
  if (wrongOnce && it.wrong) {
    await domClick(page, TOP + ` .nm-st-card[data-card="${it.wrong}"]`);
    const canConfirm = await domClick(page, TOP + ' .nm-st-confirm');
    t = await waitTop(page, { win: 'dialog', kind: 'misread' });
    const misreadShown = !!t && t.win === 'dialog' && t.kind === 'misread';
    const kinds = await settleDialogs(page);
    const back = await waitTop(page, { win: 'item', item: it.id });
    const rec = await itemRec(page, stageId, it.id);
    const why = await page.evaluate((sel) => !!document.querySelector(sel + ' .nm-st-why'), TOP);
    C.check(`${tag}: ${it.id} wrong card → misread scene, then 'why not' in item window`,
      canConfirm && misreadShown && kinds[0] === 'misread' && rec && rec.state === 'misread' && rec.wrongs === 1 && back && back.item === it.id && why,
      { canConfirm, misreadShown, kinds, rec, back, why });
  }
  await domClick(page, TOP + ` .nm-st-card[data-card="${it.right}"]`);
  await domClick(page, TOP + ' .nm-st-confirm');
  await page.waitForFunction(({ sel, id }) => { const w = document.querySelector(sel); return w && w.getAttribute('data-item') === id && !!w.querySelector('.nm-st-result'); }, { sel: TOP, id: it.id }, { timeout: 8000 }).catch(() => {});
  await settleDialogs(page);
  const rec = await itemRec(page, stageId, it.id);
  const result = await page.evaluate((sel) => { const r = document.querySelector(sel + ' .nm-st-result'); return r ? r.getAttribute('data-result') : null; }, TOP);
  C.check(`${tag}: ${it.id} right card confirmed`, rec && rec.state === 'confirmed' && result === 'correct', { rec, result });
  await closeWindows(page);
}

async function solveTask(S, C, stageId, it, { tag, wrongOnce }) {
  const { page } = S;
  await closeWindows(page);
  // 과제는 HUD 목록의 단추(또는 과제가 든 맥락 창의 단추)로 연다
  await ensureHudOpen(page);
  let opened = await domClick(page, `.nm-st-hud .nm-st-hud-item[data-item="${it.id}"]`);
  if (!opened && it.contexts.length) {
    await visit(S, C, tag, it.contexts[0]);
    opened = await domClick(page, TOP + ` .nm-st-ctx-item[data-item="${it.id}"]`);
  }
  const t = opened ? await waitTop(page, { win: 'task', item: it.id }) : await topWin(page);
  if (!opened || !t || t.win !== 'task' || t.item !== it.id) { C.check(`${tag}: ${it.id} task window opens`, false, { opened, t }); return; }
  const mount = await page.evaluate((sel) => { const m = document.querySelector(sel + ' .nm-st-gimmick'); return m ? { gimmick: m.getAttribute('data-gimmick'), kids: m.children.length } : null; }, TOP);
  C.check(`${tag}: ${it.id} gimmick ${it.gimmick} drawn`, mount && mount.gimmick === it.gimmick && mount.kids > 0, mount);
  if (wrongOnce) {
    const w = await page.evaluate(pickWrongAnswer, { stageId, itemId: it.id });
    if (!w.ok) C.check(`${tag}: ${it.id} wrong answer candidate`, false, w);
    else {
      const before = await page.evaluate(({ sel, m }) => document.querySelector(sel + ' .nm-st-gimmick').querySelectorAll(m).length, { sel: TOP, m: WRONG_MARK_SELECTOR });
      await page.evaluate((a) => NM.ui.itemTask.test.submit(a), w.answer);
      await page.waitForTimeout(80);
      const after = await page.evaluate(({ sel, m }) => {
        const win = document.querySelector(sel);
        const g = win && win.querySelector('.nm-st-gimmick');
        const st = win && win.querySelector('.nm-st-taskstatus');
        const vis = (e) => e.getClientRects().length > 0;
        const marks = g ? Array.from(g.querySelectorAll(m)).filter(vis).length : -1;
        return { marks, status: st && !st.hidden ? st.getAttribute('data-result') : null };
      }, { sel: TOP, m: WRONG_MARK_SELECTOR });
      const rec = await itemRec(page, stageId, it.id);
      C.check(`${tag}: ${it.id} wrong submit → gimmick marks the wrong parts`, after.status === 'wrong' && after.marks > before && rec && rec.state === 'open' && rec.wrongs === 1,
        { before, after, rec, wrong: w.wrong });
    }
  }
  await page.evaluate((a) => NM.ui.itemTask.test.submit(a), it.answer);
  await page.waitForTimeout(80);
  const rec = await itemRec(page, stageId, it.id);
  const status = await page.evaluate((sel) => { const s = document.querySelector(sel + ' .nm-st-taskstatus'); return s ? s.getAttribute('data-result') : null; }, TOP);
  C.check(`${tag}: ${it.id} correct submit → done`, rec && rec.state === 'done' && status === 'correct', { rec, status });
  await closeWindows(page);
}

// 통역 → 새김 → 돌아보기 → 저장 제안 → 장면 고르기
async function finishStage(S, C, stageId, plan, { tag, saveAtEnd, reflection }) {
  const { page } = S;
  await closeWindows(page);
  await page.waitForTimeout(100);
  if (plan.translateAt) {
    const goal = await page.evaluate(() => !!document.querySelector('.nm-st-hud .nm-st-hud-goal'));
    C.check(`${tag}: HUD shows 'go translate' goal`, goal);
    await page.evaluate((at) => NM.engine.goTo(at), plan.translateAt);
  }
  let t = await waitTop(page, { win: 'dialog', kind: 'translate' });
  C.check(`${tag}: translate scene starts`, !!t && t.win === 'dialog' && t.kind === 'translate', t);
  await settleDialogs(page);
  // 통역 고르기(scene.translate.choose): 한 번 틀린 통역 → 반응 대사 → 다시 골라 바른 통역 → 다 된 통역 대사
  if (plan.choice) {
    const ch = await answerTranslateChoice(page, { wrongOnce: true });
    C.check(`${tag}: translate choice — wrong interpretation gets a reaction, right one goes on`, ch.shown && ch.delivered && !ch.problems.length, ch);
    await page.waitForTimeout(60);
    const after = await settleDialogs(page);
    C.check(`${tag}: finished translation plays after the choice`, after[0] === 'translate', after);
  }
  await waitTop(page, { win: 'carve' });
  const carve = await page.evaluate((sel) => { const w = document.querySelector(sel); const g = w && w.querySelector('.nm-st-glyph'); return w ? { win: w.getAttribute('data-win'), glyph: g ? g.textContent : null } : null; }, TOP);
  C.check(`${tag}: carve window with glyph`, carve && carve.win === 'carve' && (stageId === 's0' || (carve.glyph && carve.glyph.length > 0)), carve);
  await domClick(page, TOP + ' .nm-st-next');
  t = await waitTop(page, { win: 'reflect' });
  C.check(`${tag}: reflect window`, !!t && t.win === 'reflect', t);
  if (reflection) {
    await page.fill(TOP + ' textarea.nm-st-reflect-input', reflection);
    await domClick(page, TOP + ' .nm-st-next');
  } else await domClick(page, TOP + ' .nm-st-skip');
  t = await waitTop(page, { win: 'save' });
  C.check(`${tag}: save offer window`, !!t && t.win === 'save', t);
  if (saveAtEnd) {
    // 이름·번호 창이 열렸다 닫히는지 기록한다(창 붙고 떨어짐)
    await page.evaluate(() => {
      const log = window.__e2eModalLog = [];
      const t0 = performance.now();
      const each = (n, f) => { if (n.nodeType !== 1) return; (n.matches('.nm-modal') ? [n] : Array.from(n.querySelectorAll('.nm-modal'))).forEach(f); };
      const mo = new MutationObserver(ms => ms.forEach(m => {
        m.addedNodes.forEach(n => each(n, x => log.push('+' + x.getAttribute('data-modal') + ' @' + Math.round(performance.now() - t0) + 'ms')));
        m.removedNodes.forEach(n => each(n, x => log.push('-' + x.getAttribute('data-modal') + ' @' + Math.round(performance.now() - t0) + 'ms')));
      }));
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 8000);
    });
    await domClick(page, TOP + ' .nm-st-save');
    await page.waitForTimeout(800);
    const open = await S.modalOpen('image-form');
    const log = await page.evaluate(() => window.__e2eModalLog.slice());
    const app = await S.appState();
    if (C.check(`${tag}: end-of-stage '저장' opens the name/number form and it stays open`, open,
      { modalLog: log, screen: app.screen, inStage: app.inStage, lastExit: app.lastExit && app.lastExit.result })) {
      await imageForm(S, C, stageId, { tag: tag + ' end-of-stage save', expect: 'done' });
    }
  } else {
    await domClick(page, TOP + ' .nm-st-later');
  }
  await S.waitScreen('select', 30000).catch(() => {});
  const scr = await S.screen();
  C.check(`${tag}: back to stage select`, scr === 'select', { screen: scr, app: await S.appState() });
  const rec = await S.saved();
  const lv = plan.level;
  const prog = rec && rec.progress && rec.progress[lv] && rec.progress[lv][stageId];
  C.check(`${tag}: stage done in record`, prog && prog.status === 'done', prog && prog.status);
  if (stageId === 's0') C.check(`${tag}: prologue done saved`, rec && rec.prologueDone === true);
  else C.check(`${tag}: carve glyph saved`, rec && (rec.glyphs[lv] || []).indexOf(stageId) >= 0, rec && rec.glyphs);
  if (reflection) C.check(`${tag}: reflection saved`, prog && prog.reflection === reflection, prog && prog.reflection);
  if (scr === 'select') {
    const card = await page.evaluate((id) => { const e = document.querySelector(`[data-stage="${id}"]`); return e ? { status: e.getAttribute('data-status'), glyph: !!e.querySelector('.nm-glyph') } : null; }, stageId);
    C.check(`${tag}: select card shows done${stageId === 's0' ? '' : ' + glyph'}`, card && card.status === 'done' && (stageId === 's0' || card.glyph), card);
  }
}

// 수첩 이미지 이름·번호 창 → 만들기 → 미리 보기, PNG 확인. expect: 'progress'|'done'
export async function imageForm(S, C, stageId, { tag, expect, name = '김하나', number = '7' }) {
  const { page } = S;
  const formShown = await S.waitModal('image-form').then(() => true, () => false);
  if (!C.check(`${tag}: image form opens`, formShown, await S.appState())) return false;
  await page.fill('#nm-img-name', name);
  await page.fill('#nm-img-no', number);
  // 만들기 전에 화면이 바뀌어 창이 닫히지 않는가(장면 끝에서 저장을 눌렀을 때)
  await page.waitForTimeout(400);
  const still = await S.modalOpen('image-form');
  if (!C.check(`${tag}: image form stays open until the player makes the image`, still, await S.appState())) return false;
  await page.click('.nm-modal[data-modal="image-form"] [data-act="make-image"]');
  const prev = await S.waitModal('image-preview').then(() => true, () => false);
  if (!C.check(`${tag}: image preview shown`, prev)) return false;
  const li = await page.evaluate(() => NM.ui.app.test.lastImage());
  const m = li && li.model;
  C.check(`${tag}: image model (${expect}, ${stageId})`, m && m.status === expect && m.name === name && m.number === number && m.teacher === false && m.stageName,
    m && { status: m.status, stageName: m.stageName, name: m.name, teacher: m.teacher });
  C.check(`${tag}: PNG blob drawn`, li && li.blobType === 'image/png' && li.blobSize > 5000 && li.inkPixels > 2000 && li.fontsReady === true,
    li && { type: li.blobType, size: li.blobSize, ink: li.inkPixels, fonts: li.fontsReady });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.click('.nm-modal[data-modal="image-preview"] a[data-act="download"]')
  ]);
  const path = await download.path();
  const head = readFileSync(path).subarray(0, 8).toString('hex');
  C.check(`${tag}: downloaded file is a PNG`, head === '89504e470d0a1a0a' && download.suggestedFilename().endsWith('.png'), { head, name: download.suggestedFilename() });
  const raw = await S.rawStorage();
  C.check(`${tag}: name/number not stored`, !raw.includes(name));
  await page.click('.nm-modal[data-modal="image-preview"] [data-act="close"]');
  await page.waitForTimeout(80);
  return true;
}

// 장면 도중: 도구 막대 → 수첩 → 이미지 저장(진행 중)
export async function imageFromToolbar(S, C, stageId, { tag }) {
  const { page } = S;
  await page.click('#nm-toolbar [data-act="notebook"]');
  await S.waitModal('notebook');
  const sel = await page.inputValue('#nm-nb-stage').catch(() => null);
  C.check(`${tag}: notebook opens on current stage`, sel === stageId, sel);
  await page.click('.nm-modal[data-modal="notebook"] [data-act="save-image"]');
  await imageForm(S, C, stageId, { tag: tag + ' in-progress image', expect: 'progress' });
  // 수첩 창이 남아 있으면 닫기 단추로 닫는다
  for (let i = 0; i < 3 && (await page.evaluate(() => NM.ui.dom.modals().length)); i++) {
    await page.evaluate(() => { const m = NM.ui.dom.modals(); const b = m.length && m[m.length - 1].querySelector('[data-act="close"]'); if (b) b.click(); });
    await page.waitForTimeout(80);
  }
  C.check(`${tag}: modals closed, still in stage`, (await page.evaluate(() => NM.ui.dom.modals().length)) === 0 && (await S.stageNow()).phase === 'explore');
}

// 장면 도중 새로 고침 → 첫 화면 '이어 하기' → 장면 고르기(진행 중) → 같은 장면 → 탐색으로 이어짐, 항목 상태 그대로, 주인공은 처음 자리
export async function reloadAndResume(S, C, stageId, { tag, spawn, partialItem }) {
  const { page } = S;
  const st0 = await page.evaluate((id) => JSON.stringify(NM.ui.app.store().stage(id)), stageId);
  const level0 = await page.evaluate(() => NM.ui.app.store().level);
  await S.reload();
  await S.waitScreen('title');
  C.check(`${tag}: after reload, title offers continue`, !!(await page.$('[data-act="continue"]')));
  await page.click('[data-act="continue"]');
  await S.waitScreen('select');
  const card = await page.getAttribute(`[data-stage="${stageId}"]`, 'data-status');
  C.check(`${tag}: select shows the stage in progress`, card === 'progress', card);
  await page.click(`[data-stage="${stageId}"]`);
  await page.waitForTimeout(150);
  C.check(`${tag}: no outside notice / done dialog on resume`, !(await S.modalOpen('notice-outside')) && !(await S.modalOpen('stage-done')));
  await page.waitForFunction((id) => { const c = NM.ui.stage.current(); return c.stageId === id && (c.phase === 'intro' || c.phase === 'explore'); }, stageId, { timeout: 90000 });
  await page.waitForFunction(() => NM.engine.test.state().mapLoaded, null, { timeout: 60000 });
  const now = await page.evaluate((id) => ({ phase: NM.ui.stage.current().phase, x: NM.engine.test.state().x, y: NM.engine.test.state().y, level: NM.ui.app.store().level, prog: JSON.stringify(NM.ui.app.store().stage(id)), wins: NM.ui.stageWindow.count() }), stageId);
  C.check(`${tag}: resume goes straight to exploring (no intro)`, now.phase === 'explore' && now.wins === 0, { phase: now.phase, wins: now.wins });
  C.check(`${tag}: item states persist after reload`, now.prog === st0 && now.level === level0, { before: JSON.parse(st0).items, after: JSON.parse(now.prog).items });
  const pr = JSON.parse(now.prog).items[partialItem];
  C.check(`${tag}: half-done item keeps its seen context`, pr && pr.seenContexts && pr.seenContexts.length === 1, pr);
  C.check(`${tag}: character back at spawn`, Math.abs(now.x - spawn.x) < 1 && Math.abs(now.y - spawn.y) < 1, { now: { x: now.x, y: now.y }, spawn });
}

// 장면 고르기 화면: 묶음 장면이 모두 끝남 + 패 글자, 칭호
export async function checkLevelComplete(S, C, level) {
  const { page } = S;
  await S.waitScreen('select');
  const info = await page.evaluate((ids) => {
    const st = NM.ui.app.store();
    const out = {};
    ids.forEach(id => {
      const e = document.querySelector(`[data-stage="${id}"]`);
      const g = e && e.querySelector('.nm-glyph');
      const want = NM.ui.notebookModel.carveGlyph(id);
      const ref = want ? (/^[〮〯]$/.test(want) ? NM.core.yet.soloTone(want) : NM.ui.dom.yet(want, { bangjeom: true }).textContent) : '';
      out[id] = { role: e && e.getAttribute('data-role'), status: e && e.getAttribute('data-status'), glyph: g ? g.textContent : null, want: ref };
    });
    const tt = st.title();
    return { cards: out, title: tt, line: (document.querySelector('[data-part="title"]') || {}).textContent || '' };
  }, BUNDLE[level]);
  const bad = Object.entries(info.cards).filter(([, c]) => !(c.status === 'done' && c.glyph && c.glyph === c.want && (c.role === 'bundle' || c.role === 'optional')));
  C.check(`${level}: every bundle stage done with its glyph on stage select`, bad.length === 0, bad.length ? bad : undefined);
  C.check(`${level}: title is 정음 통사`, info.title.title === '정음 통사' && info.line.includes('정음 통사') && info.title.done === info.title.total, { title: info.title, line: info.line });
  return info;
}

// 장면 고르기의 수첩 → 장면 고르기 칸 → 이미지 저장(완료)
export async function imageFromSelect(S, C, stageId, { tag }) {
  const { page } = S;
  await S.waitScreen('select');
  await page.click('#nm-screens [data-act="notebook"]');
  await S.waitModal('notebook');
  await page.selectOption('#nm-nb-stage', stageId);
  await page.waitForTimeout(80);
  await page.click('.nm-modal[data-modal="notebook"] [data-act="save-image"]');
  await imageForm(S, C, stageId, { tag: tag + ' completed image (notebook)', expect: 'done' });
  await page.evaluate(() => NM.ui.dom.closeAll());
}

// 묶음 밖 장면에 한 번 들어갔다가(안내 → 들어가기) HUD 의 '장면 나가기'로 나온다.
// 두 번째로 누르면 안내 없이 들어가는지도 본다.
export async function outsideVisit(S, C, stageId, { level }) {
  const { page } = S;
  const tag = `${level}/${stageId} (outside)`;
  await S.waitScreen('select');
  const role = await page.getAttribute(`[data-stage="${stageId}"]`, 'data-role');
  C.check(`${tag}: card marked outside the bundle`, role === 'outside', role);
  await enterFromSelect(S, C, stageId, { tag, expectOutside: true });
  await page.waitForFunction((id) => { const c = NM.ui.stage.current(); return c.stageId === id && (c.phase === 'intro' || c.phase === 'explore'); }, stageId, { timeout: 90000 });
  await settleDialogs(page);
  await page.waitForFunction(() => NM.ui.stage.current().phase === 'explore', null, { timeout: 30000 }).catch(() => {});
  const ex = await exitStageViaHud(page);
  C.check(`${tag}: HUD 'exit stage' button`, ex);
  await S.waitScreen('select');
  const rec = await S.saved();
  C.check(`${tag}: notice marked seen after entering`, rec.seenNotices.some(n => n.indexOf(stageId) >= 0), rec.seenNotices);
  await page.click(`[data-stage="${stageId}"]`);
  await page.waitForTimeout(200);
  C.check(`${tag}: notice not shown the second time`, !(await S.modalOpen('notice-outside')));
  await page.waitForFunction((id) => { const c = NM.ui.stage.current(); return c.stageId === id && (c.phase === 'intro' || c.phase === 'explore'); }, stageId, { timeout: 90000 });
  await settleDialogs(page);
  await exitStageViaHud(page);
  await S.waitScreen('select');
}

// 교사 모드: via 'settings'(설정 단추) | 'url'(?teacher=1&level=) — 장소 목록으로 걷기 건너뛰기, 정답 바로 보기,
// 끈 뒤 학생 기록이 바이트까지 같다. studentQuery: url 방식에서 학생으로 돌아올 때 주소
export async function teacherVisit(S, C, { level, via, stageId, studentQuery }) {
  const { page } = S;
  const tag = `${level} teacher(${via})/${stageId}`;
  await S.waitScreen('select');
  const snap = await S.rawStorage();
  if (via === 'settings') {
    await page.click('#nm-screens [data-act="settings"]');
    await S.waitModal('settings');
    await page.click('[data-act="teacher-on"]');
    const urlLevel = await page.evaluate(() => NM.ui.app.urlLevel);
    if (!urlLevel) {
      await page.waitForSelector('[data-act="teacher-level"]');
      await page.click(`[data-act="teacher-level"][data-value="${level}"]`);
    }
    await S.waitScreen('select');
  } else {
    await S.open(`?teacher=1&level=${level}`);
    await S.waitScreen('title');
    C.check(`${tag}: teacher badge on title`, (await page.textContent('#nm-screens')).includes('교사 모드'));
    await page.click('[data-act="start"]');
    await S.waitScreen('select');
  }
  const st = await S.appState();
  C.check(`${tag}: teacher mode on, level ${level}`, st.teacher === true && st.level === level, st);
  const card = await page.getAttribute(`[data-stage="${stageId}"]`, 'data-status');
  C.check(`${tag}: teacher select does not show student progress`, card === 'new', card);
  await page.click(`[data-stage="${stageId}"]`);
  await page.waitForFunction((id) => { const c = NM.ui.stage.current(); return c.stageId === id && (c.phase === 'intro' || c.phase === 'explore'); }, stageId, { timeout: 90000 });
  await settleDialogs(page);
  await page.waitForFunction(() => NM.ui.stage.current().phase === 'explore', null, { timeout: 30000 }).catch(() => {});
  C.check(`${tag}: stage runs in teacher mode`, await page.evaluate(() => document.documentElement.getAttribute('data-nm-teacher') === '1' && NM.ui.app.store().isTeacher === true));
  const plan = await stagePlan(page, stageId);
  const read = plan.items.filter(i => i.kind === 'read')[0];
  const task = plan.items.filter(i => i.kind === 'task')[0];
  // 장소 목록 → 걷기 건너뛰기
  await page.click('#nm-toolbar [data-act="places"]');
  await S.waitModal('places');
  const places = await page.$$eval('.nm-modal[data-modal="places"] [data-act="place"]', bs => bs.map(b => b.getAttribute('data-place')));
  // 해독 항목이 든 맥락의 자리(조사 지점이거나 그 맥락을 가진 인물)
  const want = read ? read.contexts[0] : null;
  const engPlaces = await page.evaluate(() => NM.engine.listPlaces());
  const pl = engPlaces.filter(p => want ? p.contextId === want : !!p.contextId)[0] || null;
  const target = pl ? pl.id : null;
  C.check(`${tag}: place list lists the stage's places`, places.length >= 2 && target && places.indexOf(target) >= 0, { places, want, target });
  if (target) {
    await page.click(`.nm-modal[data-modal="places"] [data-place="${target}"]`);
  }
  const t = await waitTop(page, { win: 'context' });
  C.check(`${tag}: picking a place walks there and opens it`, !(await S.modalOpen('places')) && t && t.win === 'context' && t.context === (pl && pl.contextId), { top: t, place: pl });
  if (read) {
    await domClick(page, TOP + ` .nm-st-ctx-item[data-item="${read.id}"]`);
    await waitTop(page, { win: 'item', item: read.id });
    const btn = await domClick(page, TOP + ' .nm-st-teacher-answer');
    await page.waitForTimeout(60);
    const view = await page.evaluate(({ sel, right }) => {
      const w = document.querySelector(sel);
      return w ? { item: w.getAttribute('data-item'), answer: !!w.querySelector('.nm-st-teacher-view .nm-st-answer'), card: !!w.querySelector(`.nm-st-card[data-card="${right}"]`) } : null;
    }, { sel: TOP, right: read.right });
    const rec = await itemRec(page, stageId, read.id);
    C.check(`${tag}: read item — teacher answer reveal (record unchanged)`, btn && view && view.item === read.id && view.answer && rec && rec.state !== 'confirmed' && rec.state !== 'confirmedByHelp', { btn, view, rec });
    await closeWindows(page);
  }
  if (task) {
    await ensureHudOpen(page);
    await domClick(page, `.nm-st-hud .nm-st-hud-item[data-item="${task.id}"]`);
    await waitTop(page, { win: 'task', item: task.id });
    const btn = await domClick(page, TOP + ' .nm-st-teacher-answer');
    await page.waitForTimeout(80);
    const view = await page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { item: w.getAttribute('data-item'), note: !!w.querySelector('.nm-st-help .nm-st-note'), explain: !!w.querySelector('.nm-st-help .nm-card') } : null; }, TOP);
    const rec = await itemRec(page, stageId, task.id);
    C.check(`${tag}: task — teacher answer reveal (record unchanged)`, btn && view && view.item === task.id && view.note && view.explain && (!rec || rec.state === 'open'), { btn, view, rec });
    await closeWindows(page);
  }
  C.check(`${tag}: no visible test UI (teacher)`, (await visibleTestUi(page)).length === 0, await visibleTestUi(page));
  await exitStageViaHud(page);
  await S.waitScreen('select');
  await page.click('#nm-screens [data-act="settings"]');
  await S.waitModal('settings');
  await page.click('[data-act="teacher-off"]');
  await S.waitScreen('title');
  C.check(`${tag}: teacher off`, (await S.appState()).teacher === false);
  if (via === 'url') await S.open(studentQuery || '');
  C.check(`${tag}: student record byte-identical after teacher mode`, (await S.rawStorage()) === snap);
  await S.waitScreen('title');
  await page.click('[data-act="continue"]');
  await S.waitScreen('select');
}

export { TOP, WRONG_MARK_SELECTOR };

