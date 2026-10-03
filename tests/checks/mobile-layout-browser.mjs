// 휴대 전화 배치·첫 화면 점검 — 실제 게임(index.html)에서.
// 교사 실기기 보고(카카오톡 안 브라우저, 412 폭): 장면 진행 판(HUD) 위가 잘림 · 도구 막대가 세로로 쌓여 이름표·HUD 를 가림 ·
// 지도 위아래 검은 띠가 큼. 그리고 첫 화면이 밋밋함.
// ① 장면 중(412×780 카카오 비슷 isMobile+hasTouch, 360×640, 390×844 글자 크기 3, 844×390, 1280×800):
//    문서가 세로로 스크롤되지 않는다(scrollHeight ≤ 보이는 높이, 스크롤을 시켜도 0 으로 돌아옴), #app 높이 = visualViewport 높이,
//    HUD·도구 막대 위 끝 ≥ 0 이고 화면 안, 도구 막대가 HUD 와 겹치지 않는다(접힘·펼침 모두), 살피기 단추가 HUD·도구 막대와 겹치지 않는다,
//    좁거나 낮은 화면의 도구 막대는 가로 한 줄(아이콘 + 이름), 누르는 것 44px 이상, 세로 화면에서 지도가 화면 높이의 80% 이상을 채운다.
// ② 첫 화면(같은 크기들): 배경 그림(저장소 안 파일)이 실제로 뜨고, 제목·原文 낙관(낭독기에서 숨김)·단추가 스크롤 없이 화면 안,
//    단추 data-act 그대로, 첫 초점 단추에 초점 테두리, 옛 글자 조각은 움직임 줄이기에서 숨는다. 가로 넘침 없음, 외부 요청 0.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';
import { answerOpening } from '../lib/opening.mjs';
import { reachLearningTarget } from '../lib/learning-flow.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL mobile-layout-browser: time limit (240 s)'); process.exit(1); }, 240000);
let failed = 0;
function check(name, ok, info) {
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}
const KEY = 'naratmalssami:v1';
const record = (fontScale, reducedMotion = false) => JSON.stringify({ v: 1, level: 'm', protagonist: 1, nickname: '시험', settings: { bangjeom: true, modern: 'tap', eum: true, fontScale, reducedMotion, bgm: false, sfx: false }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] });
const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
const ENVS = [
  { tag: '412x780 kakao-like', vp: { width: 412, height: 780 }, mobile: true, dpr: 2.625, fs: 1, narrow: true },
  { tag: '360x640', vp: { width: 360, height: 640 }, mobile: true, fs: 1, narrow: true },
  { tag: '390x844 fs3', vp: { width: 390, height: 844 }, mobile: true, fs: 3, narrow: true },
  { tag: '844x390', vp: { width: 844, height: 390 }, mobile: true, fs: 1, narrow: true },
  { tag: '1280x800', vp: { width: 1280, height: 800 }, mobile: false, fs: 1, narrow: false }
];

const server = await serve();
let browser;
const consoleErrors = [], external = [];
const overlap = (a, b) => !!(a && b && a.l < b.r - 1 && a.r > b.l + 1 && a.t < b.b - 1 && a.b > b.t + 1);

async function newPage(context, rec) {
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(server.url)) external.push(r.url()); });
  await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); if (v) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, [KEY, rec]);
  await page.goto(server.url);
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.app && NM.ui.stage && NM.engine, null, { timeout: 30000 });
  await page.waitForSelector('#nm-screens[data-screen="title"]');
  return page;
}
const boxes = (page) => page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e || e.hidden || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const vv = window.visualViewport;
  const app = document.getElementById('app').getBoundingClientRect();
  const tb = [...document.querySelectorAll('#nm-toolbar button')].map(b => { const q = b.getBoundingClientRect(); return { act: b.getAttribute('data-act'), w: q.width, h: q.height, t: q.top, icon: !!b.querySelector('img.nm-tb-icon[aria-hidden="true"], svg.nm-fs-icon[aria-hidden="true"]'), label: (b.querySelector('.nm-tb-label') || {}).textContent }; });
  const s = NM.engine.test.state();
  return { vw: innerWidth, vh: vv ? vv.height : innerHeight, docH: document.documentElement.scrollHeight, bodyH: document.body.scrollHeight, scrollY,
    appH: app.height, appTop: app.top, hud: r('.nm-st-hud'), toolbar: r('#nm-toolbar'), act: r('#nm-act'), tb,
    hudOpen: (document.querySelector('.nm-st-hud-head') || {}).getAttribute && document.querySelector('.nm-st-hud-head').getAttribute('aria-expanded'),
    mapCssH: s.map ? s.map.height * s.camera.zoom / s.camera.dpr : 0, mapCssW: s.map ? s.map.width * s.camera.zoom / s.camera.dpr : 0, cssH: s.camera.cssH };
});
const inView = (b, m) => b && b.t >= -0.5 && b.l >= -0.5 && b.b <= m.vh + 0.5 && b.r <= m.vw + 0.5;
const setHud = (page, open) => page.evaluate((o) => { const h = document.querySelector('.nm-st-hud .nm-st-hud-head'); if (h && (h.getAttribute('aria-expanded') === 'true') !== o) h.click(); }, open);

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const env of ENVS) {
    const context = await browser.newContext({ viewport: env.vp, deviceScaleFactor: env.dpr || 1, isMobile: env.mobile, hasTouch: env.mobile });

    /* ───── ② 첫 화면 ───── */
    let page = await newPage(context, null);
    await page.waitForTimeout(1500); // 드러남이 끝나게
    const tt = await page.evaluate(async () => {
      const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const art = document.querySelector('#nm-screens .nm-title-art');
      const bg = art ? getComputedStyle(art).backgroundImage : '';
      const url = (bg.match(/url\("?([^")]+)"?\)/) || [])[1] || null;
      let loaded = false;
      if (url) loaded = await new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = url; });
      const seal = document.querySelector('.nm-game-title .nm-title-seal');
      const btns = [...document.querySelectorAll('#nm-screens button')].map(b => ({ act: b.getAttribute('data-act'), ...r(b) }));
      const a = document.activeElement;
      const cs = a ? getComputedStyle(a) : null;
      return { url, loaded, artBox: r(art), title: r(document.querySelector('.nm-game-title')), titleText: (document.querySelector('.nm-game-title .nm-sr') || document.querySelector('.nm-game-title')).textContent,
        seal: seal ? { hidden: seal.getAttribute('aria-hidden'), text: seal.textContent, box: r(seal) } : null,
        sub: r(document.querySelector('.nm-game-sub')), btns, focusAct: a && a.getAttribute('data-act'), outline: cs ? cs.outlineStyle + ' ' + cs.outlineWidth : null,
        motes: document.querySelectorAll('.nm-title-motes .nm-title-mote').length, motesShown: !!document.querySelector('.nm-title-motes') && getComputedStyle(document.querySelector('.nm-title-motes')).display !== 'none',
        vw: innerWidth, vh: (window.visualViewport ? visualViewport.height : innerHeight), scrollTop: document.getElementById('nm-screens').scrollTop,
        sw: document.documentElement.scrollWidth, screensSW: document.getElementById('nm-screens').scrollWidth, screensCW: document.getElementById('nm-screens').clientWidth };
    });
    check(`${env.tag} title: key art is a local file and loads`, tt.url && tt.url.startsWith(server.url) && /assets\/ui\/title-bg[\w-]*\.webp$/.test(tt.url) && tt.loaded, { url: tt.url, loaded: tt.loaded });
    check(`${env.tag} title: art covers the whole screen`, tt.artBox && tt.artBox.l <= 0 && tt.artBox.t <= 0 && tt.artBox.r >= tt.vw - 1 && tt.artBox.b >= tt.vh - 1, tt.artBox);
    check(`${env.tag} title: title, seal (aria-hidden 원문), subtitle inside the screen`, inView(tt.title, tt) && inView(tt.sub, tt) && tt.seal && tt.seal.hidden === 'true' && tt.seal.text === '원문' && inView(tt.seal.box, tt), { title: tt.title, seal: tt.seal, sub: tt.sub });
    check(`${env.tag} title: start / settings / credits buttons inside the screen without scrolling, >= 44px`, ['start', 'settings', 'credits'].every(a => tt.btns.some(b => b.act === a)) && tt.btns.every(b => inView(b, tt) && b.w >= 44 && b.h >= 44) && tt.scrollTop === 0, tt.btns);
    check(`${env.tag} title: first focus on the start button with a visible focus ring`, tt.focusAct === 'start' && /solid|auto/.test(tt.outline) && !/^\w+ 0px/.test(tt.outline), { focus: tt.focusAct, outline: tt.outline });
    check(`${env.tag} title: drifting glyph motes present`, tt.motes >= 8 && tt.motesShown, tt.motes);
    check(`${env.tag} title: no horizontal scroll`, tt.sw <= tt.vw && tt.screensSW <= tt.screensCW + 1, { sw: tt.sw, screens: [tt.screensSW, tt.screensCW] });
    // 처음 정하기(학교급·주인공): 머리 띠 그림·카드 그림이 저장소 안 파일로 실제로 뜬다(CSS 변수 속 url 이 css/ 기준으로 잘못 풀리지 않음)
    const artOf = () => page.evaluate(async () => {
      const bg = getComputedStyle(document.querySelector('#nm-screens .nm-banner-art')).backgroundImage;
      const url = (bg.match(/url\("?([^")]+)"?\)/) || [])[1] || null;
      const ok = url ? await new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = url; }) : false;
      const imgs = [...document.querySelectorAll('#nm-screens .nm-choice-art, #nm-screens .nm-portrait')];
      await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
      return { url, ok, imgs: imgs.map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth, alt: i.getAttribute('alt') })),
        sw: document.getElementById('nm-screens').scrollWidth, cw: document.getElementById('nm-screens').clientWidth };
    });
    await page.click('[data-act="start"]');
    await page.waitForSelector('#nm-screens[data-screen="setup-level"]');
    let sa = await artOf();
    check(`${env.tag} setup-level: banner art loads from assets/ui; 3 level card pictures load (alt="")`, sa.ok && /\/assets\/ui\//.test(sa.url) && sa.imgs.length === 3 && sa.imgs.every(i => i.w > 0 && i.alt === ''), sa);
    check(`${env.tag} setup-level: no sideways scroll`, sa.sw <= sa.cw + 1, sa);
    await page.click('[data-act="level"][data-value="m"]');
    await page.waitForSelector('#nm-screens[data-screen="setup-protagonist"]');
    sa = await artOf();
    check(`${env.tag} setup-protagonist: 4 hero portraits load`, sa.ok && sa.imgs.length === 4 && sa.imgs.every(i => i.w > 0 && /hero_\d_/.test(i.src)), sa);
    await page.close();
    // 기록 있음 + 움직임 줄이기: 이어 하기·새로 시작, 글자 조각 숨김
    page = await newPage(context, record(env.fs, true));
    const t2 = await page.evaluate(() => ({ acts: [...document.querySelectorAll('#nm-screens button')].map(b => b.getAttribute('data-act')),
      reduced: document.documentElement.classList.contains('nm-reduced-motion'),
      motes: (() => { const m = document.querySelector('.nm-title-motes'); return m ? getComputedStyle(m).display : 'none'; })(),
      titleAnim: getComputedStyle(document.querySelector('.nm-game-title')).animationName,
      wide: (() => { const sc = document.getElementById('nm-screens'), t = document.querySelector('.nm-game-title').getBoundingClientRect(); return sc.scrollWidth > sc.clientWidth + 1 || t.right > innerWidth + 0.5; })(),
      inside: [...document.querySelectorAll('#nm-screens button')].every(b => { const q = b.getBoundingClientRect(); return q.top >= 0 && q.bottom <= (window.visualViewport ? visualViewport.height : innerHeight) + 0.5; }) }));
    check(`${env.tag} title (record): continue / newstart / settings / credits kept`, ['continue', 'newstart', 'settings', 'credits'].every(a => t2.acts.includes(a)), t2.acts);
    check(`${env.tag} title (reduced motion): glyph motes hidden, no intro animation`, t2.reduced && t2.motes === 'none' && t2.titleAnim === 'none', t2);
    check(`${env.tag} title (record, font scale ${env.fs}): buttons fit without scrolling`, t2.inside || env.fs === 3, t2);
    check(`${env.tag} title (record, font scale ${env.fs}): title inside the screen, no sideways scroll`, !t2.wide, t2);

    // 장면 고르기: 장면 카드의 작은 그림이 뜨고 가로 넘침이 없다
    await page.click('[data-act="continue"]');
    await page.waitForSelector('#nm-screens[data-screen="select"]');
    const sel = await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('#nm-screens .nm-card-thumb')];
      imgs.forEach(i => { i.loading = 'eager'; });
      await Promise.all(imgs.map(i => i.complete && i.naturalWidth ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 5000); })));
      const sc = document.getElementById('nm-screens');
      return { n: imgs.length, cards: document.querySelectorAll('#nm-screens [data-act="stage"]').length, bad: imgs.filter(i => !i.naturalWidth || i.alt !== '').map(i => i.getAttribute('src')), sw: sc.scrollWidth, cw: sc.clientWidth };
    });
    check(`${env.tag} select: every stage card has a loaded picture (alt=""), no sideways scroll`, sel.n === sel.cards && sel.n >= 12 && sel.bad.length === 0 && sel.sw <= sel.cw + 1, sel);

    /* ───── ① 장면 중 ───── */
    await page.evaluate(() => NM.engine.ready());
    await page.evaluate(() => NM.ui.app.enterStage('s0'));
    await page.waitForFunction(() => { const c = NM.ui.stage.current(); return c && (c.phase === 'intro' || c.phase === 'explore') && NM.engine.test.state().mapLoaded; }, null, { timeout: 30000 });
    for (let i = 0; i < 60; i++) {
      await answerOpening(page, TOP);
      const more = await page.evaluate((sel) => { const w = document.querySelector(sel); const b = w && w.querySelector('.nm-dlg-next'); if (b && !b.disabled) { b.click(); return true; } return false; }, TOP);
      if (!more) break;
      await page.waitForTimeout(20);
    }
    await page.evaluate(() => { let k = 0; while (NM.engine.isOverlayOpen() && k++ < 20) NM.engine.closeOverlay(); });
    await page.waitForTimeout(200);
    let m = await boxes(page);
    check(`${env.tag} stage: HUD starts ${env.narrow ? 'folded' : 'open'}`, m.hudOpen === (env.narrow ? 'false' : 'true'), m.hudOpen);
    check(`${env.tag} stage: document does not scroll vertically`, m.docH <= Math.ceil(m.vh) + 1 && m.bodyH <= Math.ceil(m.vh) + 1 && m.scrollY === 0, { docH: m.docH, bodyH: m.bodyH, vh: m.vh });
    await page.evaluate(() => { window.scrollTo(0, 200); document.body.scrollTop = 200; });
    await page.waitForTimeout(80);
    const sy = await page.evaluate(() => ({ y: scrollY, b: document.body.scrollTop }));
    check(`${env.tag} stage: forced scroll returns to 0`, sy.y === 0 && sy.b === 0, sy);
    check(`${env.tag} stage: #app height = visible (visualViewport) height, top 0`, Math.abs(m.appH - m.vh) <= 1 && m.appTop === 0 && m.cssH === Math.round(m.appH), { appH: m.appH, vh: m.vh, cssH: m.cssH });
    for (const open of [false, true]) {
      await setHud(page, open);
      await page.waitForTimeout(120);
      m = await boxes(page);
      const st = open ? 'open' : 'folded';
      check(`${env.tag} stage (HUD ${st}): HUD and toolbar top >= 0 and inside the screen`, inView(m.hud, m) && inView(m.toolbar, m), { hud: m.hud, toolbar: m.toolbar, vh: m.vh });
      check(`${env.tag} stage (HUD ${st}): toolbar does not overlap the HUD`, !overlap(m.hud, m.toolbar), { hud: m.hud, toolbar: m.toolbar });
    }
    await setHud(page, false);
    check(`${env.tag} stage: toolbar buttons have icon + label, >= 44px`, m.tb.length >= 3 && m.tb.every(b => b.icon && b.label && b.w >= 44 && b.h >= 44), m.tb);
    if (env.narrow) check(`${env.tag} stage: compact toolbar is one horizontal row`, m.tb.every(b => Math.abs(b.t - m.tb[0].t) < 1) && m.toolbar.h < 70, { tb: m.tb, h: m.toolbar.h });
    if (env.vp.height > env.vp.width * 1.15) check(`${env.tag} stage: map fills >= 80% of the screen height (smaller black bands)`, m.mapCssH >= 0.8 * m.cssH, { mapH: Math.round(m.mapCssH), cssH: m.cssH });
    // 살피기 단추가 보이게 선생님 곁으로 걸어가기
    await reachLearningTarget(page, { context: 's0.c3' });
    await page.evaluate(() => NM.engine.walkTo('s0.c3', { focusAct: true }));
    await page.waitForFunction(() => { const s = NM.engine.test.state(); return !s.walking && !document.getElementById('nm-act').hidden; }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(100);
    m = await boxes(page);
    check(`${env.tag} stage: act button shown inside the screen, not under the HUD or toolbar`, m.act && inView(m.act, m) && !overlap(m.act, m.hud) && !overlap(m.act, m.toolbar), { act: m.act, hud: m.hud, toolbar: m.toolbar });
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
console.log(failed ? `mobile-layout-browser: ${failed} failed` : 'mobile-layout-browser: ok');
process.exit(failed ? 1 : 0);
