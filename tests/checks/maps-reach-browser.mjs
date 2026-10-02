// 맵 살피기 닿음 점검: 장면 맵(maps/s0~s12.json)마다 시작 자리에서 살피기 지점·인물을 하나씩 누르면
// 걸어가 멈춘 자리에서 '살피기' 단추가 그 대상으로 뜨는지 확인한다(터치만 쓰는 전자칠판·태블릿).
// Q2 보고서 H1(s4 책 탁자에서 41px > 40px 로 멈춤)의 되풀이를 막는다.
// 설치된 Chrome(headless)을 쓴다. 실패하면 0이 아닌 코드로 끝난다.
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL maps-reach-browser: time limit (480 s)'); process.exit(1); }, 480000);
let failed = 0, count = 0;
function check(name, ok, info) {
  count++;
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}

const mapsDir = fileURLToPath(new URL('../../maps/', import.meta.url));
const maps = readdirSync(mapsDir).filter(f => /^s\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(server.url + 'tests/pages/engine.html');
  await page.waitForFunction(() => window.__engineReady === true, null, { timeout: 15000 });

  for (const f of maps) {
    const key = f.replace('.json', '');
    await page.evaluate(k => NM.engine.loadMap('maps/' + k + '.json'), key);
    await page.waitForFunction(k => { const s = NM.engine.test.state(); return s.mapLoaded && s.mapUrl && s.mapUrl.includes(k + '.json'); }, key, { timeout: 15000 });
    const info = await page.evaluate(() => {
      const s = NM.engine.test.state();
      const places = NM.engine.listPlaces().map(p => ({ id: p.contextId || p.npcId, ctx: p.contextId || null, npc: p.npcId || null }));
      return { spawn: { x: s.x, y: s.y }, places };
    });
    for (const p of info.places) {
      const res = await page.evaluate(async ([sp, id]) => {
        const T = NM.engine.test;
        T.teleport(sp.x, sp.y);
        const t = T.target(id);
        if (!t) return { err: 'no target' };
        const r = t.rect;
        T.tap(r.x + r.w / 2, r.y + r.h / 2);
        const t0 = performance.now();
        await new Promise(res => { const tick = () => (!T.state().path.length || performance.now() - t0 > 20000) ? res() : setTimeout(tick, 50); tick(); });
        await new Promise(res => setTimeout(res, 80));
        const s = T.state();
        return { prompt: s.prompt, x: Math.round(s.x), y: Math.round(s.y) };
      }, [info.spawn, p.id]);
      const ok = res.prompt && ((p.ctx && res.prompt.contextId === p.ctx) || (p.npc && res.prompt.npcId === p.npc));
      check(`${key} tap reaches ${p.id}`, !!ok, res);
    }
  }
  check('no page errors', errors.length === 0, errors);
} catch (e) {
  failed++; console.log('  FAIL maps-reach-browser crashed — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `FAIL maps-reach-browser ${failed}/${count}` : `PASS maps-reach-browser ${count}/${count}`);
process.exit(failed ? 1 : 0);
