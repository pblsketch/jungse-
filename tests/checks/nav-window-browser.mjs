// 창 닫기·맵 탐색 이름 점검 (design/qa/codex-review-2026-10-02.md B01·B03·D02) — 실제 게임(index.html)에서.
// B01 긴 장면 창(맥락·항목·기믹 과제)에서 ×와 제목이 화면 안에 남는다: 창을 연 직후와 본문을 끝까지 내린 뒤 모두.
//     창 자체는 스크롤되지 않고(scrollTop 0) 본문만 스크롤된다. 처음 초점 때문에 본문이 내려가지 않는다.
//     390×844 + 글자 크기 3, 1280×800 + 글자 크기 1. 끝에 진짜 누르기로 ×를 눌러 창이 닫히는지 본다.
// B03·D02 학생 모드: 지도 캔버스의 읽기 이름, 도구 막대 '장소 목록'(이름·종류·목표·살핌 여부, 목표 먼저),
//     고르면 걸어간다(순간 이동 아님) → 닿으면 '○○ 살피기' 단추로 초점, 인물은 '○○와/과 말하기',
//     화면 밖 목표 화살표의 읽기 이름·보이는 이름표, 화면 안 '!' 위 이름표.
// 화면 그림: tests/shots/ui-fix/ (git 이 무시하는 폴더)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';
import { reachLearningTarget } from '../lib/learning-flow.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL nav-window-browser: time limit (300 s)'); process.exit(1); }, 300000);
const SHOTS = join(ROOT, 'tests', 'shots', 'ui-fix');
mkdirSync(SHOTS, { recursive: true });
let failed = 0;
function check(name, ok, info) {
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}

const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
const KEY = 'naratmalssami:v1';
const record = (level, fontScale) => JSON.stringify({ v: 1, level, protagonist: 1, nickname: '시험', settings: { bangjeom: true, modern: 'tap', eum: true, fontScale, reducedMotion: 'on', bgm: false, sfx: false }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });

const server = await serve();
let browser;
const consoleErrors = [], external = [];

async function openStage(context, { level, fontScale, stageId }) {
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
  await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, [KEY, record(level, fontScale)]);
  await page.goto(server.url);
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.stage && NM.engine, null, { timeout: 30000 });
  await page.evaluate(() => NM.engine.ready());
  await page.evaluate((id) => NM.ui.app.enterStage(id), stageId);
  await page.waitForFunction(() => { const c = NM.ui.stage.current(); return c && (c.phase === 'intro' || c.phase === 'explore') && NM.engine.test.state().mapLoaded; }, null, { timeout: 30000 });
  await settle(page);
  return page;
}
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);
async function settle(page, max = 60) {
  for (let i = 0; i < max; i++) {
    const t = await page.evaluate((sel) => { const w = document.querySelector(sel); return w ? { next: !!w.querySelector('.nm-dlg-next'), win: w.getAttribute('data-win') } : null; }, TOP);
    if (!t || !t.next) break;
    await click(page, TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
}
const closeAll = (page) => page.evaluate(() => { let n = 0; while (NM.engine.isOverlayOpen() && n++ < 20) NM.engine.closeOverlay(); });

// 맨 위 창의 ×·제목 위치, 창·본문 스크롤, 초점
function measure(page) {
  return page.evaluate((sel) => {
    const w = document.querySelector(sel);
    if (!w) return null;
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top * 10) / 10, bottom: Math.round(b.bottom * 10) / 10, left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
    const x = w.querySelector(':scope > .nm-st-close'), body = w.querySelector(':scope > .nm-st-body'), h = w.querySelector(':scope > .nm-st-head .nm-st-title');
    const a = document.activeElement;
    let activeVisible = false;
    if (a && w.contains(a)) {
      const ar = a.getBoundingClientRect();
      if (body.contains(a)) { const br = body.getBoundingClientRect(); activeVisible = ar.top >= br.top - 1 && ar.bottom <= br.bottom + 1; }
      else activeVisible = ar.top >= 0 && ar.bottom <= innerHeight;
    }
    return { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), x: r(x), title: r(h), vw: innerWidth, vh: innerHeight,
      winScroll: w.scrollTop, bodyScroll: body.scrollTop, bodyLong: body.scrollHeight > body.clientHeight + 4,
      active: a === h ? 'title' : a ? (a.className || a.tagName) : null, activeIn: !!(a && w.contains(a)), activeVisible,
      docScrollW: document.documentElement.scrollWidth };
  }, TOP);
}
const inside = (b, m) => b && b.top >= 0 && b.left >= 0 && b.bottom <= m.vh && b.right <= m.vw && b.w > 0;

async function checkWindow(page, tag, open, arg, shot) {
  if (tag.includes('context')) await reachLearningTarget(page, { context: arg });
  else await reachLearningTarget(page, { item: arg });
  await page.evaluate(open, arg);
  await page.waitForTimeout(250);
  const m0 = await measure(page);
  if (!m0) { check(`${tag}: window opened`, false); return null; }
  check(`${tag}: × inside viewport after opening`, inside(m0.x, m0), m0.x);
  check(`${tag}: title inside viewport after opening`, inside(m0.title, m0), m0.title);
  check(`${tag}: window itself does not scroll; body not scrolled by initial focus`, m0.winScroll === 0 && m0.bodyScroll === 0, { win: m0.winScroll, body: m0.bodyScroll });
  check(`${tag}: initial focus inside window and visible without scrolling`, m0.activeIn && m0.activeVisible, { active: m0.active });
  check(`${tag}: no horizontal page scroll`, m0.docScrollW <= m0.vw, m0.docScrollW);
  if (shot) await page.screenshot({ path: join(SHOTS, shot + '-open.png') });
  await page.evaluate((sel) => { const b = document.querySelector(sel + ' > .nm-st-body'); b.scrollTop = b.scrollHeight; }, TOP);
  await page.waitForTimeout(80);
  const m1 = await measure(page);
  check(`${tag}: × and title still inside viewport after scrolling body to the bottom`, inside(m1.x, m1) && inside(m1.title, m1) && m1.winScroll === 0, { x: m1.x, title: m1.title, winScroll: m1.winScroll, bodyScroll: m1.bodyScroll });
  if (shot) await page.screenshot({ path: join(SHOTS, shot + '-scrolled.png') });
  return { m0, m1 };
}

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  /* ───────── B01: 긴 창의 × ───────── */
  for (const env of [{ tag: '390x844 fs3', vp: { width: 390, height: 844 }, fs: 3, touch: true }, { tag: '1280x800 fs1', vp: { width: 1280, height: 800 }, fs: 1 }]) {
    const short = env.vp.width < 500 ? 'm' : 'd';
    const context = await browser.newContext({ viewport: env.vp, deviceScaleFactor: 1, hasTouch: !!env.touch });
    // s4 맥락·해독 항목(고2~3)
    let page = await openStage(context, { level: 'h23', fontScale: env.fs, stageId: 's4' });
    const fsv = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs').trim());
    check(`${env.tag}: font scale applied (--fs)`, env.fs === 3 ? fsv === '1.5' : fsv === '1', fsv);
    for (const cid of ['s4.c1', 's4.c3']) {
      await checkWindow(page, `${env.tag} s4 context ${cid}`, (id) => NM.ui.stage.openContext(id), cid, cid === 's4.c1' ? `${short}-s4-context` : null);
      await closeAll(page); await settle(page);
    }
    await checkWindow(page, `${env.tag} s4 item s4.r1`, (id) => NM.ui.stage.openItem(id), 's4.r1', `${short}-s4-item`);
    // 진짜 누르기로 × 닫기(본문을 끝까지 내린 상태)
    const xBox = await page.locator(TOP + ' > .nm-st-close').boundingBox();
    if (env.touch) await page.touchscreen.tap(xBox.x + xBox.width / 2, xBox.y + xBox.height / 2);
    else await page.mouse.click(xBox.x + xBox.width / 2, xBox.y + xBox.height / 2);
    await page.waitForTimeout(120);
    check(`${env.tag}: pressing × (after scrolling) closes the window`, !(await page.evaluate(() => NM.engine.isOverlayOpen())));
    await closeAll(page); await page.close();

    // 긴 기믹 과제: s11 threeEraLink, s8 questionPair (고2~3)
    for (const [stageId, taskId] of [['s11', 's11.t1'], ['s8', 's8.t1']]) {
      page = await openStage(context, { level: 'h23', fontScale: env.fs, stageId });
      const res = await checkWindow(page, `${env.tag} ${taskId} task`, (id) => NM.ui.stage.openItem(id), taskId, `${short}-${taskId}-task`);
      if (res && env.fs === 3) check(`${env.tag} ${taskId}: long task actually scrolls its body (case exercised)`, res.m0.bodyLong, res.m0);
      await closeAll(page); await page.close();
    }
    // s6 의 가장 긴 맥락
    page = await openStage(context, { level: 'h23', fontScale: env.fs, stageId: 's6' });
    await page.evaluate(() => NM.ui.stage.openContext('s6.c1'));
    await page.waitForTimeout(200);
    let m = await measure(page);
    check(`${env.tag} s6.c1 (longest context): × inside, body not auto-scrolled`, m && inside(m.x, m) && m.bodyScroll === 0 && m.winScroll === 0, m);
    if (env.fs === 3) check(`${env.tag} s6.c1: body is long enough to scroll (case exercised)`, m && m.bodyLong, m);
    await page.evaluate((sel) => { const b = document.querySelector(sel + ' > .nm-st-body'); b.scrollTop = b.scrollHeight; }, TOP);
    m = await measure(page);
    check(`${env.tag} s6.c1: × inside after scrolling to the bottom`, m && inside(m.x, m) && m.winScroll === 0, m);
    await page.screenshot({ path: join(SHOTS, `${short}-s6-context-scrolled.png`) });
    await closeAll(page); await page.close();
    await context.close();
  }

  /* ───────── B03·D02: 이름 있는 탐색 · 학생 장소 목록 ───────── */
  for (const env of [{ tag: '1280x800', vp: { width: 1280, height: 800 }, fs: 1 }, { tag: '390x844 fs3', vp: { width: 390, height: 844 }, fs: 3 }]) {
    const short = env.vp.width < 500 ? 'm' : 'd';
    const context = await browser.newContext({ viewport: env.vp, deviceScaleFactor: 1 });
    const page = await openStage(context, { level: 'h23', fontScale: env.fs, stageId: 's4' });
    const canvas = await page.evaluate(() => { const c = document.querySelector('#game canvas'); return { role: c.getAttribute('role'), label: c.getAttribute('aria-label') }; });
    check(`${env.tag}: map canvas has an accessible name`, canvas.role === 'img' && canvas.label && canvas.label.length > 10, canvas);
    check(`${env.tag}: student toolbar has '장소 목록', no teacher places button`, await page.isVisible('#nm-toolbar [data-act="student-places"]') && !(await page.$('#nm-toolbar [data-act="places"]')));
    const scene = await page.evaluate(() => {
      const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES.s4, 'h23');
      return { labels: Object.fromEntries(sc.contexts.map(c => [c.id, c.label])), npcs: Object.fromEntries(Object.entries(sc.npcs || {}).map(([k, v]) => [k, v.name])) };
    });
    const objective = await page.evaluate(() => NM.engine.objective());
    // 장소 id → 기대 이름(인물 이름 → 맥락 이름)·목표 여부(그 id 나 인물의 맥락 id 가 목표)
    const places = await page.evaluate(() => NM.engine.listPlaces());
    const meta = Object.fromEntries(places.map(p => [p.id, {
      name: (p.npcId && scene.npcs[p.npcId]) || (p.contextId && scene.labels[p.contextId]) || null,
      goal: objective.includes(p.id) || (!!p.contextId && objective.includes(p.contextId))
    }]));
    const nameOf = (id) => meta[id] && meta[id].name || scene.npcs[id] || scene.labels[id];
    // 목록 열기
    await page.click('#nm-toolbar [data-act="student-places"]');
    await page.waitForSelector('.nm-modal[data-modal="student-places"]');
    let list = await page.$$eval('.nm-modal[data-modal="student-places"] [data-act="walk-place"]', bs => bs.map(b => ({ id: b.getAttribute('data-place'), goal: b.getAttribute('data-goal') === '1', visited: b.getAttribute('data-visited') === '1', text: b.textContent })));
    check(`${env.tag}: place list lists currently unlocked places and hides later contexts`, list.length === places.length && list.length > 0 && !places.some(p => p.contextId === 's4.c3'), list.length);
    check(`${env.tag}: place names come from scene data (npc name or context label)`, list.every(p => nameOf(p.id) && p.text.includes(nameOf(p.id))), list.map(p => p.text));
    check(`${env.tag}: place kind and visited state shown`, list.every(p => p.text.includes('인물') || p.text.includes('살필 곳')) && list.every(p => p.text.includes('아직 안 봄') || p.text.includes('살펴봄')), list.map(p => p.text));
    const goals = list.filter(p => p.goal).map(p => p.id);
    check(`${env.tag}: current objectives marked (목표) and listed first`, goals.length > 0 && list.every(p => p.goal === meta[p.id].goal) && list.slice(0, goals.length).every(p => p.goal) && list.every(p => !p.goal || p.text.includes('목표')), { goals, objective });
    if (short === 'd') await page.screenshot({ path: join(SHOTS, 'd-student-places.png') });
    else await page.screenshot({ path: join(SHOTS, 'm-student-places.png') });
    // 하나 고르기 → 걸어간다
    const pick = list.find(p => p.goal) || list[0];
    const before = await page.evaluate(() => { const s = NM.engine.test.state(); return { x: s.x, y: s.y }; });
    await page.click(`.nm-modal[data-modal="student-places"] [data-place="${pick.id}"]`);
    await page.waitForTimeout(60);
    let s = await page.evaluate(() => { const s = NM.engine.test.state(); return { x: s.x, y: s.y, walking: s.walking, path: s.path.length, overlay: s.overlayOpen }; });
    check(`${env.tag}: choosing a place closes the list and walks (path, no teleport)`, !s.overlay && s.walking && s.path > 0 && Math.hypot(s.x - before.x, s.y - before.y) < 40, { s, before });
    await page.waitForFunction((id) => { const s = NM.engine.test.state(); return !s.walking && s.prompt && (s.prompt.contextId === id || s.prompt.npcId === id); }, pick.id, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(120); // 알림 줄은 비웠다가 조금 뒤에 채운다
    const act = await page.evaluate(() => { const b = document.getElementById('nm-act'); const s = NM.engine.test.state(); const r = b.getBoundingClientRect(); return { text: b.textContent, hidden: b.hidden, focused: document.activeElement === b, prompt: s.prompt, live: document.querySelector('.nm-hud-live').textContent, right: r.right, left: r.left, vw: innerWidth }; });
    const pickName = nameOf(pick.id);
    check(`${env.tag}: arrived next to the chosen place; act button names it ('○○ 살피기') and has focus`, !act.hidden && act.prompt && (act.prompt.contextId === pick.id || act.prompt.npcId === pick.id) && act.text === pickName + ' 살피기' && act.focused, act);
    check(`${env.tag}: arrival announced in the live region`, act.live.includes(pickName), act.live);
    check(`${env.tag}: act button inside viewport`, act.left >= 0 && act.right <= act.vw, act);
    await page.screenshot({ path: join(SHOTS, `${short}-act-named.png`) });
    // Enter 로 살피기 → 맥락 창
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const opened = await page.evaluate((sel) => { const w = document.querySelector(sel); return w ? w.getAttribute('data-context') || w.getAttribute('data-win') : null; }, TOP);
    check(`${env.tag}: Enter on the focused act button opens that place`, opened === pick.id || opened === 'dialog', opened);
    await closeAll(page); await settle(page); await closeAll(page);
    await page.click('#nm-toolbar [data-act="student-places"]');
    await page.waitForSelector('.nm-modal[data-modal="student-places"]');
    list = await page.$$eval('.nm-modal[data-modal="student-places"] [data-act="walk-place"]', bs => bs.map(b => ({ id: b.getAttribute('data-place'), visited: b.getAttribute('data-visited') === '1' })));
    check(`${env.tag}: visited place marked 살펴봄 in the list`, list.some(p => p.id === pick.id && p.visited), list);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
    // 인물: '○○과 말하기'
    if (scene.npcs['s4.listeners']) {
      await page.evaluate(() => NM.engine.walkTo('s4.listeners', { focusAct: true }));
      await page.waitForFunction(() => { const s = NM.engine.test.state(); return !s.walking && s.prompt && s.prompt.npcId === 's4.listeners'; }, null, { timeout: 25000 }).catch(() => {});
      const t = await page.evaluate(() => document.getElementById('nm-act').textContent);
      check(`${env.tag}: npc act button reads '<name>과 말하기'`, t === scene.npcs['s4.listeners'] + '과 말하기', t);
    }
    // 화면 밖 목표 화살표 · 화면 안 이름표
    await page.evaluate(() => { NM.engine.test.teleport(80, 860); NM.engine.setObjective(NM.engine.listPlaces().filter(p => p.kind === 'spot').map(p => p.id)); });
    await page.waitForTimeout(250);
    const ar = await page.evaluate(() => {
      const vis = (e) => !e.hidden && e.getClientRects().length > 0;
      const box = (n) => { const r = n.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
      const inView = (b) => b.l >= 0 && b.r <= innerWidth && b.t >= 0 && b.b <= innerHeight;
      const arrows = [...document.querySelectorAll('.nm-edge-arrow')].filter(vis).map(a => { const n = a.querySelector('.nm-edge-name'); const b = box(n); return { id: a.getAttribute('data-target'), role: a.getAttribute('role'), label: a.getAttribute('aria-label'), name: n.textContent, shown: vis(n), inView: !vis(n) || inView(b), b }; });
      // 이름표가 붙은 화면 안 목표(겹쳐서 숨긴 것 포함). 보이는 이름표는 화면 안, 서로 겹치지 않는다
      const tags = [...document.querySelectorAll('.nm-mark-tag[data-want="1"]')].map(t => { const b = box(t); return { id: t.getAttribute('data-target'), name: t.textContent, shown: vis(t), inView: !vis(t) || inView(b), b }; });
      const shown = arrows.filter(a => a.shown).map(a => a.b).concat(tags.filter(t => t.shown).map(t => t.b));
      const overlaps = shown.filter((p, i) => shown.some((q, j) => j < i && p.l < q.r - 2 && p.r > q.l + 2 && p.t < q.b - 2 && p.b > q.t + 2)).length;
      return { arrows, tags, overlaps, shownCount: shown.length, markers: NM.engine.test.state().objectiveMarkers };
    });
    check(`${env.tag}: objectives off screen get edge arrows`, ar.arrows.length > 0, ar);
    check(`${env.tag}: edge arrows have role=img + aria-label with the place name and direction`, ar.arrows.every(a => a.role === 'img' && a.label.includes(nameOf(a.id)) && /위쪽|아래쪽|왼쪽|오른쪽/.test(a.label)), ar.arrows);
    check(`${env.tag}: edge arrows carry the place name tag; shown tags inside the viewport`, ar.arrows.every(a => a.name === nameOf(a.id) && a.inView) && ar.arrows.some(a => a.shown), ar.arrows);
    check(`${env.tag}: on-screen objective markers carry a name tag (inside the viewport)`, ar.tags.length + ar.arrows.length === ar.markers && ar.tags.every(t => t.name === nameOf(t.id) && t.inView), ar);
    check(`${env.tag}: visible name tags do not overlap each other`, ar.overlaps === 0 && ar.shownCount > 0, { overlaps: ar.overlaps, shown: ar.shownCount });
    await page.screenshot({ path: join(SHOTS, `${short}-arrows-named.png`) });
    const docW = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    check(`${env.tag}: no horizontal page scroll on the map`, docW);
    const errs = await page.evaluate(() => (window.__nmErrors || []).slice());
    check(`${env.tag}: no NM errors`, errs.length === 0, errs);
    await page.close();
    await context.close();
  }
  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  check('no external requests', external.length === 0, external.slice(0, 5));
} catch (e) {
  failed++; console.log('  FAIL exception — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `nav-window-browser: ${failed} failed` : 'nav-window-browser: ok');
process.exit(failed ? 1 : 0);
