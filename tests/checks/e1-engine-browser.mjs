// E1 엔진 브라우저 점검: tests/pages/engine.html 의 시험 맵에서
// 키보드·목적지 누르기·조이스틱(마우스·터치) 이동, 충돌, 살피기 사건, 창 열림 중 정지,
// 장소 목록·옮겨 살피기, 목표 표시·빛내기, 카메라 고정·가운데 맞춤, 소리, 오류 0 을 확인한다.
// 설치된 Chrome(headless)을 쓴다. 실패하면 0이 아닌 코드로 끝난다. 60초 안에 끝낸다.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL e1-engine-browser: time limit (55 s)'); process.exit(1); }, 55000);
const results = [];
let failed = 0;
function check(name, ok, info) {
  results.push(name);
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  const external = [];
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });

  await page.goto(server.url + 'tests/pages/engine.html');
  await page.waitForFunction(() => window.__engineReady === true, null, { timeout: 15000 });

  const st = () => page.evaluate(() => NM.engine.test.state());
  const tp = (x, y) => page.evaluate(([x, y]) => NM.engine.test.teleport(x, y), [x, y]);
  const scr = (x, y) => page.evaluate(([x, y]) => NM.engine.test.worldToScreen(x, y), [x, y]);
  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(50); };
  const idle = () => page.waitForFunction(() => { const s = NM.engine.test.state(); return !s.path.length; }, null, { timeout: 10000 });
  await page.evaluate(() => { window.__events = []; NM.engine.on('interact', e => window.__events.push(e)); });

  let s = await st();
  check('boots with test map', s.ready && s.mapLoaded && s.map.width === 1536 && s.map.height === 960, s.map);
  check('spawn position', s.x === 300 && s.y === 480, { x: s.x, y: s.y });
  check('dpr capped and zoom set', s.camera.dpr <= 2 && s.camera.zoom > 0, s.camera);

  // 1) 키보드
  await hold('ArrowRight', 400);
  let s2 = await st();
  check('keyboard ArrowRight moves right', s2.x > s.x + 30 && Math.abs(s2.y - s.y) < 1, { from: s.x, to: s2.x });
  check('facing right after moving right', s2.facing === 'right', s2.facing);
  await hold('w', 300);
  let s3 = await st();
  check('keyboard W moves up', s3.y < s2.y - 20, { from: s2.y, to: s3.y });
  await hold('a', 200);
  check('keyboard A moves left', (await st()).x < s3.x - 10);

  // 2) 충돌: 벽(x 900~940) 왼쪽에서 오른쪽으로 오래 걸어도 벽을 넘지 못한다
  await tp(860, 500);
  await hold('ArrowRight', 800);
  s = await st();
  check('collision stops at wall', s.x <= 891.01 && s.x > 875, s.x);
  check('collision helper reports wall', await page.evaluate(() => NM.engine.test.collides(920, 300) === true && NM.engine.test.collides(300, 480) === false));
  // 인물(npc) 발자리도 막힌다
  await tp(760, 640);
  await hold('ArrowUp', 700);
  s = await st();
  check('npc blocks movement', s.y > 600 + 4, s.y);

  // 3) 목적지 누르기: 벽 너머를 누르면 벽 아래로 돌아서 간다
  await tp(860, 500);
  let p = await scr(990, 500);
  await page.mouse.click(p.x, p.y);
  s = await st();
  check('tap starts a path with marker', s.path.length >= 2 && s.pathMarker, { path: s.path.length, marker: s.pathMarker });
  let maxY = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 9000) {
    const q = await st();
    maxY = Math.max(maxY, q.y);
    if (!q.path.length) break;
    await page.waitForTimeout(60);
  }
  s = await st();
  check('tap-to-move arrives at target', Math.hypot(s.x - 990, s.y - 500) < 4, { x: s.x, y: s.y });
  check('path went around the wall', maxY > 700, maxY);
  check('marker cleared on arrival', !s.pathMarker);
  // 막힌 곳(벽 한가운데)을 눌러도 가까운 열린 곳으로 간다, 오류 없음
  p = await scr(990, 300);
  await tp(990, 380);
  p = await scr(920, 300);
  await page.mouse.click(p.x, p.y);
  await idle();
  s = await st();
  check('tap on obstacle goes to nearest open spot', !(await page.evaluate(([x, y]) => NM.engine.test.collides(x, y), [s.x, s.y])) && Math.abs(s.x - 920) < 60, { x: s.x, y: s.y });

  // 4) 조이스틱(마우스 끌기, 화면 왼쪽)
  await tp(300, 600);
  await page.mouse.move(200, 500);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(200 + i * 10, 500);
  await page.waitForTimeout(450);
  s = await st();
  check('joystick (mouse drag) active', s.joystick === true, s.joy);
  check('joystick moves player right', s.x > 330, s.x);
  check('joystick visual shown', await page.evaluate(() => !document.querySelector('.nm-joy').hidden));
  await page.mouse.up();
  await page.waitForTimeout(80);
  s = await st();
  check('joystick release: no tap path, joystick hidden', !s.joystick && s.path.length === 0 && await page.evaluate(() => document.querySelector('.nm-joy').hidden), s);
  // 짧게 누르기는 왼쪽에서도 목적지 이동
  await tp(300, 600);
  p = await scr(250, 640);
  await page.mouse.click(p.x, p.y);
  s = await st();
  check('short tap in joystick zone is tap-to-move', s.path.length >= 1 || Math.hypot(s.x - 250, s.y - 640) < 6, s.path);
  await idle();
  s = await st();
  check('short tap arrives', Math.hypot(s.x - 250, s.y - 640) < 4, { x: s.x, y: s.y });

  // 5) 조이스틱(터치 끌기)
  await tp(300, 600);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500, id: 1 }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 500 - i * 10, id: 1 }] });
  await page.waitForTimeout(400);
  s = await st();
  check('joystick (touch drag) moves player up', s.joystick && s.y < 570, { y: s.y, joy: s.joystick });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(80);
  check('touch release ends joystick', !(await st()).joystick);

  // 6) 살피기
  await tp(210, 250);
  await page.waitForTimeout(80);
  s = await st();
  check('prompt appears near spot', s.prompt && s.prompt.kind === 'spot' && s.prompt.contextId === 'test.c1', s.prompt);
  const btn = await page.evaluate(() => { const b = document.getElementById('nm-act'); return { hidden: b.hidden, text: b.textContent, vis: b.getBoundingClientRect().width > 0 }; });
  check('act button visible with label', !btn.hidden && btn.vis && btn.text.length > 0, btn);
  await page.keyboard.press('e');
  let ev = await page.evaluate(() => window.__events.slice());
  check('E fires interact for spot', ev.length === 1 && ev[0].kind === 'spot' && ev[0].contextId === 'test.c1' && ev[0].npcId === null, ev);
  await page.click('#nm-act');
  await page.keyboard.press('Enter'); // 초점이 단추에 있으면 단추가 처리(한 번만)
  ev = await page.evaluate(() => window.__events.slice());
  check('button click and Enter fire interact once each', ev.length === 3 && ev.every(e => e.contextId === 'test.c1'), ev.length);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('Enter');
  ev = await page.evaluate(() => window.__events.slice());
  check('Enter (no focus) fires interact', ev.length === 4, ev.length);
  // 'act' 키가 있는 지점: 문구 데이터가 없으면 기본 문구
  await tp(560, 455);
  await page.waitForTimeout(60);
  s = await st();
  check('act-key spot prompt with fallback label', s.prompt && s.prompt.contextId === 'test.c2' && s.prompt.label === btn.text, s.prompt);
  // 멀리 가면 단추가 사라진다
  await tp(300, 600);
  await page.waitForTimeout(60);
  check('prompt hidden away from spots', (await st()).prompt === null && await page.evaluate(() => document.getElementById('nm-act').hidden));

  // 7) DOM 창: 열리면 멈춤
  await tp(210, 250);
  await page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'test-overlay'; d.style.cssText = 'background:#fff;padding:20px';
    const b = document.createElement('button'); b.textContent = 'x'; d.appendChild(b);
    NM.engine.openOverlay(d);
  });
  s = await st();
  check('overlay opens and pauses', s.paused && s.overlayOpen && s.prompt === null, { paused: s.paused, prompt: s.prompt });
  check('overlay element hosted and focused', await page.evaluate(() => !!document.querySelector('.nm-overlay-host #test-overlay') && document.activeElement.closest('#test-overlay') !== null));
  const before = s.x;
  await hold('ArrowLeft', 400);
  await page.keyboard.press('e');
  await page.mouse.click(900, 400);
  s = await st();
  check('no movement while overlay open', s.x === before && s.path.length === 0, { before, now: s.x });
  check('no interact while overlay open', (await page.evaluate(() => window.__events.length)) === 4);
  check('act button hidden while overlay open', await page.evaluate(() => document.getElementById('nm-act').hidden));
  await page.evaluate(() => NM.engine.closeOverlay());
  s = await st();
  check('overlay closes and resumes', !s.paused && !s.overlayOpen && await page.evaluate(() => document.querySelector('.nm-overlay-host').hidden));
  await hold('ArrowDown', 300);
  check('movement works after overlay closes', (await st()).y > s.y + 20);

  // 8) 교사 모드: 장소 목록과 옮겨 살피기
  const places = await page.evaluate(() => NM.engine.listPlaces());
  check('listPlaces returns 3 spots + 1 npc', places.length === 4 && places.filter(x => x.kind === 'spot').map(x => x.contextId).join() === 'test.c1,test.c2,test.c3' && places.some(x => x.npcId === 'test.elder') && places.every(x => typeof x.label === 'string' && x.label), places);
  await tp(300, 480);
  const okGo = await page.evaluate(() => NM.engine.goTo('test.c3'));
  ev = await page.evaluate(() => window.__events.at(-1));
  s = await st();
  check('goTo spot teleports and fires interact', okGo && ev.kind === 'spot' && ev.contextId === 'test.c3' && s.prompt && s.prompt.contextId === 'test.c3', { ev, prompt: s.prompt, x: s.x, y: s.y });
  await page.evaluate(() => NM.engine.goTo('test.elder'));
  ev = await page.evaluate(() => window.__events.at(-1));
  check('goTo npc fires npc interact', ev.kind === 'npc' && ev.npcId === 'test.elder' && ev.contextId === null, ev);
  check('goTo unknown returns false', (await page.evaluate(() => NM.engine.goTo('nope'))) === false);
  // NPC 곁에서 E
  await page.keyboard.press('e');
  ev = await page.evaluate(() => window.__events.at(-1));
  check('E near npc fires npc interact', ev.kind === 'npc' && ev.npcId === 'test.elder', ev);

  // 9) 목표 표시·빛내기·움직임 줄이기
  await tp(300, 480);
  await page.evaluate(() => NM.engine.setObjective(['test.c3']));
  await page.waitForTimeout(80);
  s = await st();
  check('setObjective shows marker and off-screen arrow', s.objective.join() === 'test.c3' && s.objectiveMarkers === 1 && s.arrows === 1, s);
  await page.evaluate(() => NM.engine.goTo('test.c3'));
  await page.waitForTimeout(80);
  check('arrow hidden when target on screen', (await st()).arrows === 0);
  await page.evaluate(() => { NM.engine.setObjective(['test.c1', 'test.elder', 'missing.id']); NM.engine.highlight('test.c1'); });
  s = await st();
  check('objective tolerates unknown ids; highlight set', s.objectiveMarkers === 2 && s.highlight === 'test.c1', s);
  await page.evaluate(() => { NM.engine.setReducedMotion(true); NM.engine.highlight('test.c2'); });
  s = await st();
  check('reduced motion on, highlight moved', s.reducedMotion === true && s.highlight === 'test.c2');
  await hold('ArrowLeft', 200);
  await page.evaluate(() => { NM.engine.setReducedMotion(false); NM.engine.highlight(null); NM.engine.setObjective([]); });
  s = await st();
  check('highlight/objective cleared', s.highlight === null && s.objectiveMarkers === 0 && s.arrows === 0);

  // 10) 카메라: 맵 가장자리에서 고정, 화면보다 작은 맵은 가운데
  await tp(40, 900);
  s = await st();
  const vw = s.camera.cssW / s.camera.zoom * s.camera.dpr, vh = s.camera.cssH / s.camera.zoom * s.camera.dpr;
  check('camera clamps to map corner', Math.abs(s.camera.cx - vw / 2) < 0.5 && Math.abs(s.camera.cy - (960 - vh / 2)) < 0.5, s.camera);
  await page.setViewportSize({ width: 3600, height: 2200 });
  await page.waitForFunction(() => NM.engine.test.state().camera.cssW === 3600, null, { timeout: 3000 });
  s = await st();
  check('map smaller than screen is centered', Math.abs(s.camera.cx - 768) < 0.5 && Math.abs(s.camera.cy - 480) < 0.5, s.camera);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForFunction(() => NM.engine.test.state().camera.cssW === 1280, null, { timeout: 3000 });

  // 11) 소리
  const au = await page.evaluate(() => {
    const A = NM.engine.audio, out = { before: A.state() };
    out.sfx = A.names.map(n => A.sfx(n));
    A.playBgm('no-such-key'); A.setBgmEnabled(false); A.setBgmEnabled(true); A.setSfxEnabled(false);
    out.mutedSfx = A.sfx('confirm'); A.setSfxEnabled(true); A.stopBgm();
    out.after = A.state();
    return out;
  });
  check('audio unlocked after first input', au.before.unlocked && au.before.hasContext, au.before);
  check('synth sfx play (5 kinds)', au.sfx.length === 5 && au.sfx.every(Boolean), au.sfx);
  check('missing bgm skipped silently; sfx toggle respected', au.mutedSfx === false && au.after.bgmPlaying === false);

  // 12) 오류·외부 요청
  await page.waitForTimeout(100);
  const errs = await page.evaluate(() => window.__nmErrors.slice());
  check('no NM errors', errs.length === 0, errs);
  check('no console errors', consoleErrors.length === 0, consoleErrors);
  check('no external requests', external.length === 0, external);

  // 13) 고해상도 화면: DPR 3 → 상한 2, 누르기 좌표가 맞는다
  const hi = await browser.newContext({ viewport: { width: 1024, height: 640 }, deviceScaleFactor: 3 });
  const hp = await hi.newPage();
  const hiErr = [];
  hp.on('console', m => { if (m.type() === 'error') hiErr.push(m.text()); });
  await hp.goto(server.url + 'tests/pages/engine.html');
  await hp.waitForFunction(() => window.__engineReady === true, null, { timeout: 15000 });
  const hs = await hp.evaluate(() => { const c = document.querySelector('#game canvas'); return { s: NM.engine.test.state(), cw: c.width, ch: c.height, sw: c.getBoundingClientRect().width }; });
  check('dpr capped at 2 (canvas 2x, css 1x)', hs.s.camera.dpr === 2 && hs.cw === 2048 && hs.ch === 1280 && Math.round(hs.sw) === 1024, hs);
  const hq = await hp.evaluate(() => NM.engine.test.worldToScreen(380, 560));
  await hp.mouse.click(hq.x, hq.y);
  await hp.waitForFunction(() => !NM.engine.test.state().path.length, null, { timeout: 8000 });
  const hs2 = await hp.evaluate(() => NM.engine.test.state());
  check('tap-to-move correct at high DPR', Math.hypot(hs2.x - 380, hs2.y - 560) < 4, { x: hs2.x, y: hs2.y });
  check('no console errors at high DPR', hiErr.length === 0 && (await hp.evaluate(() => window.__nmErrors.length)) === 0, hiErr);
  await hi.close();
} catch (e) {
  failed++;
  console.log('  FAIL exception: ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(`e1 engine browser: ${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
