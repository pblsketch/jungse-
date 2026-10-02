// 맵·인물 어울림 사진(점검 아님): 장면 맵마다 주인공(hero_1)을 장애물 곁·뒤·앞 자리에 세워 실제 엔진 화면을 찍는다.
//   node tests/qa/maps-interact-shots.mjs [--maps-dir maps] [--tag after] [--only s2,s7]
// 결과: tests/shots/maps-audit/browser/<tag>/<맵>-<자리>.png 와 depths.json(앞 그림 깊이·불투명도, 인물 깊이).
// --maps-dir 로 다른 폴더의 맵(예: 고치기 전 맵을 꺼내 둔 곳)을 같은 엔진으로 찍어 견줄 수 있다.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../server.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const mapsDir = arg('--maps-dir', 'maps').split('\\').join('/').replace(/\/$/, '');
const tag = arg('--tag', 'now');
const only = arg('--only', null);
const out = join(fileURLToPath(new URL('../shots/maps-audit/browser/', import.meta.url)), tag);
mkdirSync(out, { recursive: true });

// 자리: [이름, x, y] — 발 위치(월드 px). 장애물 바로 뒤(북쪽)·옆·앞, 앞 그림 뒤, 인물 곁.
const SPOTS = {
  s0: [['beside-teacher', 645, 330], ['behind-teacher', 600, 300], ['desks-aisle', 420, 330], ['spawn', 576, 770]],
  s1: [['behind-flag', 640, 488], ['child', 705, 560], ['woman', 915, 480], ['bridge', 380, 590], ['stele-back', 566, 240]],
  s2: [['under-left-pine', 120, 400], ['left-pine-branches', 250, 520], ['under-right-pine', 1010, 400], ['above-gate-roof', 576, 478], ['child', 840, 510]],
  s3: [['notice-wall', 1505, 252], ['above-stalls', 800, 428]],
  s4: [['behind-type-table', 380, 362], ['book-table', 800, 770]],
  s5: [['dock', 1180, 560], ['above-bushes', 700, 432]],
  s6: [['seodang-gate-in', 1462, 445], ['seodang-gate-below', 1462, 520], ['behind-writing-table', 630, 318], ['left-tree', 210, 330]],
  s7: [['palace-gate-in', 152, 470], ['palace-gate-under-roof', 152, 420], ['behind-pagoda', 1350, 336], ['scholar', 1275, 520], ['behind-lantern', 1625, 375]],
  s8: [['under-pine', 300, 625], ['behind-lantern', 685, 300], ['beside-pagoda', 395, 380], ['child', 255, 520]],
  s9: [['below-dais', 576, 330], ['official', 470, 560]],
  s10: [['under-persimmon', 990, 380], ['gate', 620, 800], ['teacher', 680, 372]],
  s11: [['lamp', 1268, 410], ['sign-board', 1548, 392], ['spawn', 300, 390], ['bins', 1315, 390]],
  s12: [['left-bridge', 612, 200], ['teacher', 420, 450]]
};

const server = await serve();
let browser;
const log = {};
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.url + 'tests/pages/engine.html');
  await page.waitForFunction(() => window.__engineReady === true, null, { timeout: 15000 });
  await page.evaluate(() => NM.engine.setPlayerSprite('hero_1'));
  for (const [id, list] of Object.entries(SPOTS)) {
    if (only && !only.split(',').includes(id)) continue;
    const url = mapsDir + '/' + id + '.json';
    await page.evaluate(u => NM.engine.loadMap(u), url);
    await page.waitForFunction(u => { const s = NM.engine.test.state(); return s.mapLoaded && s.mapUrl && s.mapUrl.endsWith(u); }, url, { timeout: 15000 });
    log[id] = {};
    for (const [name, x, y] of list) {
      await page.evaluate(([x, y]) => NM.engine.test.teleport(x, y), [x, y]);
      await page.waitForTimeout(450);
      const info = await page.evaluate(([x, y]) => ({
        collides: NM.engine.test.collides(x, y), fronts: NM.engine.test.fronts(), depths: NM.engine.test.depths(),
        scr: NM.engine.test.worldToScreen(x, y)
      }), [x, y]);
      log[id][name] = { x, y, collides: info.collides, fronts: info.fronts, depths: info.depths };
      const cx = Math.round(info.scr.x), cy = Math.round(info.scr.y);
      const clip = { x: Math.max(0, cx - 170), y: Math.max(0, cy - 230), width: 340, height: 300 };
      clip.width = Math.min(clip.width, 1280 - clip.x); clip.height = Math.min(clip.height, 720 - clip.y);
      await page.screenshot({ path: join(out, `${id}-${name}.png`), clip });
    }
    console.log('shot', id, list.length);
  }
  if (errors.length) console.log('page errors:', errors);
} finally {
  writeFileSync(join(out, 'depths.json'), JSON.stringify(log, null, 1));
  if (browser) await browser.close();
  await server.close();
}
console.log('saved to', out);
