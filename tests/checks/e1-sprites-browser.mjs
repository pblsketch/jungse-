// 인물 아틀라스 점검: ASSETS.sprites 의 그림(A2)을 주인공·인물에 입히는지, 걷기·서기·뒤집기, 없는 키는 임시 그림, 오류 0.
// tests/pages/engine.html 을 쓴다. 설치된 Chrome(headless).
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL e1-sprites-browser: time limit (120 s)'); process.exit(1); }, 120000);
let failed = 0;
const check = (name, ok, info) => { if (ok) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); } };

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(server.url + 'tests/pages/engine.html');
  await page.waitForFunction(() => window.__engineReady === true, null, { timeout: 30000 });

  let s = await page.evaluate(() => NM.engine.test.sprites());
  check('no sprite key → placeholder player/npc', s.player === 'nm-ph-player' && s.npcs[0] === 'nm-ph-npc', s);

  await page.evaluate(async () => {
    NM.data.ASSETS.sprites['test.elder'] = NM.data.ASSETS.sprites.elder;
    NM.engine.setPlayerSprite('hero_2');
    await NM.engine.test.loadTestMap();
  });
  s = await page.evaluate(() => NM.engine.test.sprites());
  check('player uses hero_2 atlas', s.player === 'nm-sp:hero_2', s);
  check('npc uses its atlas by npcId', s.npcs[0] === 'nm-sp:test.elder', s);
  const meta = await page.evaluate(() => fetch('assets/sprites/hero_2.json').then(r => r.json()));
  check('standing frame = down stand frame', s.frame === meta.anims.down.frames[1], { frame: s.frame });

  await page.evaluate(() => NM.engine.test.teleport(300, 700));
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(400);
  s = await page.evaluate(() => NM.engine.test.sprites());
  check('walking left plays atlas walk-left', s.anim === 'nm-sp:hero_2:walk-left' && s.flip === false, s);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400);
  s = await page.evaluate(() => NM.engine.test.sprites());
  check('walking right = flipped walk-left', s.anim === 'nm-sp:hero_2:walk-left' && s.flip === true, s);
  await page.keyboard.up('ArrowRight'); await page.waitForTimeout(200);
  s = await page.evaluate(() => NM.engine.test.sprites());
  check('stops on a standing frame', s.anim === null, s);

  await page.evaluate(async () => { NM.engine.setPlayerSprite('no_such_key'); await NM.engine.test.loadTestMap(); });
  s = await page.evaluate(() => NM.engine.test.sprites());
  check('unknown key → placeholder', s.player === 'nm-ph-player', s);

  const nm = await page.evaluate(() => window.__nmErrors || []);
  check('no NM errors', nm.length === 0, nm);
  check('no console errors', errors.length === 0, errors);
} catch (e) {
  failed++; console.log('  FAIL exception — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `e1 sprites browser: ${failed} failed` : 'e1 sprites browser: all passed');
process.exit(failed ? 1 : 0);
