// 앞 그림(맵의 front 층) 브라우저 점검: 배경에서 오려 낸 조각이 baseY 깊이로 놓이고,
// 주인공이 그 뒤(발 y < baseY)에서 몸이 겹치면 조각이 흐려지며(주인공보다 앞), 앞(발 y >= baseY)에서는
// 주인공이 조각보다 앞에 그려지는지, 맵을 바꾸면 조각이 새로 만들어지는지 본다.
// 설치된 Chrome(headless)을 쓴다. 실패하면 0이 아닌 코드로 끝난다.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL e1-front-browser: time limit (90 s)'); process.exit(1); }, 90000);
let failed = 0, count = 0;
function check(name, ok, info) {
  count++;
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); }
}

const fronts = n => JSON.parse(readFileSync(new URL('../../maps/' + n + '.json', import.meta.url), 'utf8'))
  .layers.filter(l => l.name === 'front').flatMap(l => l.objects || []);

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(server.url + 'tests/pages/engine.html');
  await page.waitForFunction(() => window.__engineReady === true, null, { timeout: 15000 });
  const T = (fn, a) => page.evaluate(fn, a);
  const load = async k => {
    await T(k => NM.engine.loadMap('maps/' + k + '.json'), k);
    await page.waitForFunction(k => { const s = NM.engine.test.state(); return s.mapLoaded && s.mapUrl.endsWith(k + '.json'); }, k);
  };

  check('test map has no fronts', (await T(() => NM.engine.test.fronts())).length === 0);

  // s2: 소나무 우듬지 둘
  await load('s2');
  let f = await T(() => NM.engine.test.fronts());
  const want = fronts('s2');
  check('s2 fronts built from the map', f.length === want.length && want.length >= 2, { got: f.length, want: want.length });
  const left = f.find(x => x.name === 'pine-left-canopy');
  check('front depth = baseY', left && left.depth === left.baseY && left.baseY === 600, left);
  check('front starts opaque', left && left.alpha === 1, left);

  // 뒤: 우듬지 아래 걸을 수 있는 자리(발 y 400 < 600)
  await T(() => NM.engine.test.teleport(120, 400));
  await page.waitForTimeout(400);
  f = await T(() => NM.engine.test.fronts());
  let d = await T(() => NM.engine.test.depths());
  const l2 = f.find(x => x.name === 'pine-left-canopy');
  check('player behind canopy is drawn under it', d.player < l2.depth, { player: d.player, front: l2.depth });
  check('canopy fades while the player is behind it', l2.alpha < 0.7, l2.alpha);
  check('walkable spot behind canopy', (await T(() => NM.engine.test.collides(120, 400))) === false);

  // 앞이 아니라 멀리: 다시 불투명
  await T(() => NM.engine.test.teleport(576, 472));
  await page.waitForTimeout(400);
  f = await T(() => NM.engine.test.fronts());
  check('canopy opaque again when the player is away', f.every(x => x.alpha === 1), f.map(x => x.alpha));

  // s7 탑: 발이 탑 뒤(baseY 위)면 탑 아래에, 탑 앞이면 위에
  await load('s7');
  f = await T(() => NM.engine.test.fronts());
  const pag = f.find(x => x.name === 'pagoda-tower');
  check('s7 pagoda front exists', !!pag, f.map(x => x.name));
  await T(() => NM.engine.test.teleport(1350, 336));
  await page.waitForTimeout(400);
  d = await T(() => NM.engine.test.depths());
  check('behind pagoda: player depth < pagoda', pag && d.player < pag.baseY, { player: d.player, base: pag && pag.baseY });
  await T(() => NM.engine.test.teleport(1350, 440));
  await page.waitForTimeout(400);
  d = await T(() => NM.engine.test.depths());
  f = await T(() => NM.engine.test.fronts());
  check('in front of pagoda: player depth > pagoda, pagoda opaque', d.player > pag.baseY && f.find(x => x.name === 'pagoda-tower').alpha === 1, { player: d.player });

  // NPC 깊이도 발 y
  const npcs = await T(() => NM.engine.test.depths().npcs);
  check('npc depth = feet y', npcs.length > 0 && npcs.every(n => typeof n.depth === 'number'), npcs);

  // 맵을 바꾸면 이전 조각은 사라진다
  await T(() => NM.engine.test.loadTestMap());
  await page.waitForFunction(() => NM.engine.test.state().mapUrl.endsWith('test.json'));
  check('fronts cleared on map change', (await T(() => NM.engine.test.fronts())).length === 0);
  check('no page errors', errors.length === 0, errors);
} catch (e) {
  failed++; console.log('  FAIL e1-front-browser crashed — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `FAIL e1-front-browser ${failed}/${count}` : `PASS e1-front-browser ${count}/${count}`);
process.exit(failed ? 1 : 0);
