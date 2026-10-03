// 화면 크기·조작(spec §18-1 7): 화면 크기 6종에서 실제 게임(index.html)을 첫 화면부터 연다.
//   1920×1080, 1280×800, 1366×768, 390×844, 360×740, 844×390 (좁은 셋은 터치 기기로)
// - 가로 스크롤 없음: 첫 화면, 처음 정하기 3단계(오류 문구 포함), 서장 대사, 장면 고르기, 설정, 수첩,
//   장면 창(도입 대사·맥락·항목·오해 장면·기믹 과제), 장면 중 설정, 탐색 화면(HUD·도구 막대)
// - 움직임 세 가지: 키보드(방향키), 누른 곳으로 걷기(마우스 누르기 / 터치 기기는 손가락 누르기),
//   조이스틱(왼쪽 자리 끌기 — 마우스 / 터치 기기는 터치 끌기) — 실제 장면(s2) 맵에서
// - 콘솔 오류·게임 오류·외부 요청 0, 점검 통로가 화면에 보이지 않음
//   node tests/e2e/screens.mjs [--only 390x844]
import {
  makeChecker, startBrowser, newSession, playStageUI, settleDialogs, closeWindows, waitTop, domClick,
  horizontalOverflow, visibleTestUi, ensureHudOpen, exitStageViaHud, stagePlan, TOP
} from '../lib/e2e-kit.mjs';

const SIZES = [[1920, 1080], [1280, 800], [1366, 768], [390, 844], [360, 740], [844, 390]];
const args = process.argv.slice(2);
const only = args.indexOf('--only') >= 0 ? args[args.indexOf('--only') + 1] : null;
const C = makeChecker('e2e screens', 30 * 60 * 1000);
const env = await startBrowser();

async function look(S, tag, label, bad) {
  const r = await horizontalOverflow(S.page);
  const t = await visibleTestUi(S.page);
  if (r.length) bad.push({ label, overflow: r.slice(0, 5) });
  if (t.length) bad.push({ label, testUi: t.slice(0, 5) });
  await S.shot(`screens-${tag}-${label}`);
}

// 맵 위에서 덮인 것 없이 캔버스가 받는 점(세계 좌표 + 화면 좌표). zone: 'joy'(왼쪽 조이스틱 자리) | 'tap'(오른쪽) | 'any'
const canvasPoint = (page, { zone, dists, free }) => page.evaluate(({ zone, dists, free }) => {
  const s = NM.engine.test.state();
  const cv = document.querySelector('#game canvas');
  const r = cv.getBoundingClientRect();
  const joyW = r.width * 0.45;
  for (const d of dists) {
    for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * Math.PI * 2;
      const wx = s.x + Math.cos(ang) * d, wy = s.y + Math.sin(ang) * d;
      if (free && NM.engine.test.collides(wx, wy)) continue;
      const p = NM.engine.test.worldToScreen(wx, wy);
      if (p.x < r.left + 12 || p.x > r.right - 12 || p.y < r.top + 12 || p.y > r.bottom - 12) continue;
      if (zone === 'joy' && p.x - r.left > joyW - 70) continue;
      if (zone === 'tap' && p.x - r.left < joyW + 10) continue;
      if (document.elementFromPoint(p.x, p.y) !== cv) continue;
      return { wx, wy, x: p.x, y: p.y };
    }
  }
  // 카메라가 이동하면 고정 반경 밖에 입력 영역이 놓일 수 있으므로 보이는 캔버스에서도 찾는다.
  if (zone === 'tap' || zone === 'joy') {
    const zero = NM.engine.test.worldToScreen(0, 0);
    const unit = NM.engine.test.worldToScreen(1, 1);
    const candidates = [];
    const xStart = zone === 'tap' ? r.left + joyW + 12 : r.left + 12;
    const xEnd = zone === 'tap' ? r.right - 12 : r.left + joyW - 70;
    for (let x = xStart; x < xEnd; x += 16) {
      for (let y = r.top + 12; y < r.bottom - 12; y += 16) {
        if (document.elementFromPoint(x, y) !== cv) continue;
        const wx = (x - zero.x) / (unit.x - zero.x);
        const wy = (y - zero.y) / (unit.y - zero.y);
        if (free && NM.engine.test.collides(wx, wy)) continue;
        const distance = Math.hypot(wx - s.x, wy - s.y);
        if (zone === 'tap' && distance < 40) continue;
        candidates.push({ wx, wy, x, y, distance });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    if (candidates.length) return candidates[0];
  }
  return null;
}, { zone, dists, free });
const eng = (page) => page.evaluate(() => NM.engine.test.state());
const idle = (page) => page.waitForFunction(() => { const s = NM.engine.test.state(); return !s.path.length && !s.moving; }, null, { timeout: 15000 }).catch(() => {});

async function movement(S, tag, touch) {
  const { page } = S;
  const res = {};
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  // 1) 키보드: 방향키를 누르고 있으면 그쪽으로 걷는다(막힌 쪽이면 다른 방향)
  const dirs = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]];
  res.keyboard = [];
  for (const [key, dx, dy] of dirs) {
    const a = await eng(page);
    await page.keyboard.down(key); await page.waitForTimeout(450); await page.keyboard.up(key);
    await page.waitForTimeout(80);
    const b = await eng(page);
    const moved = (b.x - a.x) * dx + (b.y - a.y) * dy;
    res.keyboard.push({ key, moved: Math.round(moved) });
    if (moved > 15) break;
  }
  C.check(`${tag}: keyboard arrows move the character`, res.keyboard.some(k => k.moved > 15), res.keyboard);
  // 2) 누른 곳으로 걷기(오른쪽 자리를 짧게 누름 — 터치 기기는 손가락으로)
  let tapOk = false;
  const tapTries = [];
  for (const d of [[110, 150], [180, 220], [70, 90]]) {
    const p = await canvasPoint(page, { zone: 'tap', dists: d, free: true });
    if (!p) { tapTries.push('no point'); continue; }
    const a = await eng(page);
    if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(60);
    const started = await eng(page);
    await idle(page);
    const b = await eng(page);
    const dist = Math.hypot(b.x - p.wx, b.y - p.wy), from = Math.hypot(a.x - p.wx, a.y - p.wy);
    tapTries.push({ path: started.path.length, from: Math.round(from), dist: Math.round(dist) });
    if (started.path.length > 0 && dist < 8) { tapOk = true; break; }
  }
  C.check(`${tag}: tap-to-move walks to the tapped spot (${touch ? 'touch' : 'mouse'})`, tapOk, tapTries);
  // 3) 조이스틱: 왼쪽 자리에서 끌면 끄는 쪽으로 걷는다(막힌 쪽이면 다른 방향)
  const origin = await canvasPoint(page, { zone: 'joy', dists: [0, 40, 80, 120, 160, 200, 260], free: false });
  let joyOk = false;
  const joyTries = [];
  if (!origin) joyTries.push('no joystick origin point on canvas');
  else {
    const cdp = touch ? await S.context.newCDPSession(page) : null;
    for (const [, dx, dy] of dirs) {
      const a = await eng(page);
      const pts = [1, 2, 3, 4, 5, 6].map(i => ({ x: origin.x + dx * i * 10, y: origin.y + dy * i * 10 }));
      if (touch) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: origin.x, y: origin.y, id: 1 }] });
        for (const q of pts) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: q.x, y: q.y, id: 1 }] });
      } else {
        await page.mouse.move(origin.x, origin.y); await page.mouse.down();
        for (const q of pts) await page.mouse.move(q.x, q.y);
      }
      await page.waitForTimeout(500);
      const mid = await eng(page);
      const joyVisible = await page.evaluate(() => { const j = document.querySelector('.nm-joy'); return !!j && !j.hidden; });
      if (touch) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
      await page.waitForTimeout(100);
      const end = await eng(page);
      const moved = (mid.x - a.x) * dx + (mid.y - a.y) * dy;
      joyTries.push({ dx, dy, active: mid.joystick, joyVisible, moved: Math.round(moved), released: !end.joystick, pathAfter: end.path.length });
      if (mid.joystick && joyVisible && moved > 15 && !end.joystick && end.path.length === 0) { joyOk = true; break; }
    }
    if (cdp) await cdp.detach().catch(() => {});
  }
  C.check(`${tag}: joystick drag moves the character (${touch ? 'touch' : 'mouse'})`, joyOk, joyTries);
}

try {
  const probe = await newSession(env, { viewport: { width: 1280, height: 800 } });
  await probe.open('');
  const decoration = await horizontalOverflow(probe.page);
  C.check('decorative title animation does not create visible overflow', decoration.length === 0, decoration);
  await probe.page.evaluate(() => {
    const button = document.createElement('button');
    button.className = 'nm-layout-probe';
    button.style.cssText = 'position:fixed;left:0;top:0;width:120vw;height:30px';
    button.textContent = 'layout';
    document.getElementById('nm-screens').appendChild(button);
  });
  C.check('overflow check still detects an oversized control', (await horizontalOverflow(probe.page)).some(r => r.what.includes('nm-layout-probe')));
  await probe.page.evaluate(() => {
    document.querySelector('.nm-layout-probe').remove();
    const box = document.createElement('div');
    box.className = 'nm-layout-probe';
    box.style.cssText = 'position:fixed;left:0;top:0;width:40px;height:40px;overflow-x:auto';
    const content = document.createElement('div');
    content.style.cssText = 'width:140px;height:20px';
    content.textContent = 'layout';
    box.appendChild(content);
    document.getElementById('nm-screens').appendChild(box);
  });
  C.check('overflow check still detects a horizontally scrolling container', (await horizontalOverflow(probe.page)).some(r => r.what.includes('scrolls sideways')));
  await probe.context.close();
  for (const [w, h] of SIZES) {
    const tag = `${w}x${h}`;
    if (only && only !== tag) continue;
    const touch = w < 900;
    C.step(tag);
    const S = await newSession(env, { viewport: { width: w, height: h }, hasTouch: touch });
    const { page } = S;
    const bad = [];
    try {
      await S.open('');
      await S.waitScreen('title'); await look(S, tag, 'title', bad);
      await page.click('[data-act="start"]');
      await S.waitScreen('setup-level'); await look(S, tag, 'setup-level', bad);
      await page.click('[data-act="level"][data-value="m"]');
      await S.waitScreen('setup-protagonist'); await look(S, tag, 'setup-protagonist', bad);
      await page.click('[data-act="protagonist"][data-value="1"]');
      await S.waitScreen('setup-nickname');
      await page.fill('#nm-nick', 'a b');
      await page.click('[data-act="nick-ok"]');
      await look(S, tag, 'setup-nickname-error', bad);
      await page.click('[data-act="back"]');
      await S.waitScreen('setup-protagonist');
      await page.click('[data-act="protagonist"][data-value="1"]');
      await S.waitScreen('setup-nickname');
      await page.fill('#nm-nick', '해솔');
      await page.click('[data-act="nick-ok"]');
      await page.waitForFunction(() => { const t = document.querySelector('.nm-overlay-host > .nm-st-win'); return !!t && t.getAttribute('data-kind') === 'intro'; }, null, { timeout: 60000 });
      await look(S, tag, 's0-intro-dialog', bad);
      // 서장을 화면 흐름으로 끝까지(좁은 화면의 접힌 HUD 포함)
      await playStageUI(S, C, 's0', { tag: `${tag}/s0`, level: 'm', fromSelect: false, wrongOnce: false });
      await S.waitScreen('select'); await look(S, tag, 'select', bad);
      await page.click('#nm-screens [data-act="settings"]');
      await S.waitModal('settings'); await look(S, tag, 'settings', bad);
      await page.click('.nm-modal[data-modal="settings"] [data-act="close"]');
      await page.click('#nm-screens [data-act="notebook"]');
      await S.waitModal('notebook'); await look(S, tag, 'notebook', bad);
      await page.click('.nm-modal[data-modal="notebook"] [data-act="close"]');
      // 장면 s2: 도입 대사 → 탐색 → 맥락·항목·오해 장면·과제 창
      await page.click('[data-stage="s2"]');
      await page.waitForFunction(() => { const t = document.querySelector('.nm-overlay-host > .nm-st-win'); return !!t && t.getAttribute('data-kind') === 'intro'; }, null, { timeout: 60000 });
      await look(S, tag, 's2-intro-dialog', bad);
      await settleDialogs(page);
      await page.waitForFunction(() => NM.ui.stage.current().phase === 'explore', null, { timeout: 30000 });
      await look(S, tag, 's2-explore', bad);
      if (touch && (w <= 520 || h <= 520)) C.check(`${tag}: HUD starts folded on a narrow or short screen`, (await page.getAttribute('.nm-st-hud .nm-st-hud-head', 'aria-expanded')) === 'false');
      await ensureHudOpen(page);
      await look(S, tag, 's2-explore-hud-open', bad);
      await page.click('#nm-toolbar [data-act="settings"]');
      await S.waitModal('settings'); await look(S, tag, 's2-settings', bad);
      await page.click('.nm-modal[data-modal="settings"] [data-act="close"]');
      const plan = await stagePlan(page, 's2');
      const read = plan.items.filter(i => i.kind === 'read')[0];
      const task = plan.items.filter(i => i.kind === 'task')[0];
      await page.evaluate((c) => NM.engine.goTo(c), read.contexts[0]);
      C.check(`${tag}: context window opens`, ((await waitTop(page, { win: 'context' })) || {}).win === 'context');
      await look(S, tag, 's2-context', bad);
      await closeWindows(page);
      await page.evaluate((c) => NM.engine.goTo(c), read.contexts[1]);
      await waitTop(page, { win: 'context', context: read.contexts[1] });
      await domClick(page, TOP + ` .nm-st-ctx-item[data-item="${read.id}"]`);
      C.check(`${tag}: item window opens`, ((await waitTop(page, { win: 'item' })) || {}).win === 'item');
      await look(S, tag, 's2-item', bad);
      await domClick(page, TOP + ` .nm-st-card[data-card="${read.wrong}"]`);
      await domClick(page, TOP + ' .nm-st-confirm');
      C.check(`${tag}: misread dialog opens`, ((await waitTop(page, { kind: 'misread' })) || {}).kind === 'misread');
      await look(S, tag, 's2-misread-dialog', bad);
      await settleDialogs(page);
      await closeWindows(page);
      await ensureHudOpen(page);
      await domClick(page, `.nm-st-hud .nm-st-hud-item[data-item="${task.id}"]`);
      C.check(`${tag}: task window opens`, ((await waitTop(page, { win: 'task' })) || {}).win === 'task');
      await look(S, tag, 's2-task', bad);
      await closeWindows(page);
      // 움직임 세 가지
      await page.evaluate(() => { const h = document.querySelector('.nm-st-hud .nm-st-hud-head'); if (h && h.getAttribute('aria-expanded') === 'true' && window.matchMedia('(max-width: 520px), (max-height: 520px)').matches) h.click(); });
      await movement(S, tag, touch);
      C.check(`${tag}: still exploring after movement (no stray windows)`, (await S.stageNow()).phase === 'explore');
      await closeWindows(page);
      await exitStageViaHud(page);
      await S.waitScreen('select');
      C.check(`${tag}: no horizontal scroll / no visible test UI on every screen and window`, bad.length === 0, bad);
    } catch (e) {
      C.check(`${tag}: no exception`, false, String(e && e.stack || e));
      await S.shot(`screens-${tag}-exception`);
    }
    const nm = await S.allNmErrors().catch(() => []);
    C.check(`${tag}: no game errors`, nm.length === 0, nm.slice(0, 5));
    C.check(`${tag}: no console errors`, S.watch.consoleErrors.length === 0, S.watch.consoleErrors.slice(0, 5));
    C.check(`${tag}: no external requests`, S.watch.external.length === 0, S.watch.external.slice(0, 5));
    C.check(`${tag}: no failed requests`, S.watch.failed.length === 0, S.watch.failed.slice(0, 5));
    await S.context.close();
  }
} catch (e) {
  C.check('screens: no exception', false, String(e && e.stack || e));
} finally {
  await env.close();
}
C.finish(C.failed ? 'first failures: ' + C.fails.slice(0, 3).join(' | ').slice(0, 600) : `${only || SIZES.length + ' sizes'} ok`);
