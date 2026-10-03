import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';
import { openGame } from '../lib/playthrough.mjs';

const urlArg = process.argv.indexOf('--url');
const server = urlArg >= 0 ? { url: process.argv[urlArg + 1], close: async () => {} } : await serve();
const shots = join(ROOT, 'tests/shots/opening-review');
mkdirSync(shots, { recursive: true });
const limit = setTimeout(() => { console.error('opening-browser: time limit'); process.exit(1); }, 180000);
let browser;
let checked = 0;

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, log } = await openGame(context, server.url);
  async function start(level, protagonist = 1) {
    await page.evaluate(async ({ level, protagonist }) => {
      NM.ui.stage.stop();
      const store = NM.core.save.createStore({ storage: null, level });
      store.setup({ level, protagonist, nickname: '바다' });
      window.__openingStore = store;
      await NM.ui.stage.run('s0', { store, level, teacher: false, onExit() {} });
    }, { level, protagonist });
    await page.locator('[data-opening="choice"]').waitFor();
    await page.locator('.nm-opening-art').evaluate(img => img.decode());
  }
  async function fit(panel) {
    assert.equal(await panel.evaluate(w => w.scrollWidth <= w.clientWidth + 1 &&
      w.querySelector('.nm-st-body').scrollWidth <= w.querySelector('.nm-st-body').clientWidth + 1), true);
    const box = await panel.locator('.nm-st-foot').boundingBox();
    const viewport = page.viewportSize();
    assert.ok(box.y >= 0 && box.y + box.height <= viewport.height + 1, 'primary action remains on screen');
  }
  for (const [width, height] of [[1280, 800], [390, 844], [360, 740], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const [levelIndex, level] of ['m', 'h1', 'h23'].entries()) {
      await start(level, levelIndex + 1);
      const opening = page.locator('[data-opening="choice"]');
      await fit(opening);
      assert.match(await opening.innerText(), /억울한 일을 당해도/);
      assert.equal(await opening.locator('.nm-opening-choice').count(), 2);
      assert.equal(await opening.locator('.nm-dlg-next').isDisabled(), true);
      const before = await page.evaluate(() => JSON.stringify(window.__openingStore.stage('s0')));
      if (level === 'm') await page.screenshot({ path: join(shots, `first-choice-${width}.png`) });
      await opening.locator('[data-option="young"]').focus();
      await page.keyboard.press('Enter');
      assert.match(await opening.locator('.nm-opening-response').innerText(), /제가 어린아이로 보이시오/);
      assert.match(await opening.locator('.nm-opening-response').innerText(), /누구나 쉽게 배워/);
      assert.equal(await opening.locator('.nm-dlg-next').isEnabled(), true);
      assert.equal(await opening.locator('[data-option="young"]').getAttribute('aria-pressed'), 'true');
      if (level === 'm') await page.screenshot({ path: join(shots, `reaction-${width}.png`) });
      await opening.locator('[data-option="unlearned"]').click();
      assert.match(await opening.locator('.nm-opening-response').innerText(), /제 나이가 어리다는 말이 아니오/);
      assert.equal(await opening.locator('[data-option="young"]').getAttribute('aria-pressed'), 'false');
      assert.equal(await page.evaluate(() => JSON.stringify(window.__openingStore.stage('s0'))), before, 'teaser does not write attempts or answers');
      await opening.locator('.nm-dlg-next').click();
      const mission = page.locator('[data-opening="mission"]');
      await mission.waitFor(); await fit(mission);
      assert.match(await mission.innerText(), /옛 글을 읽어 사람들을 돕는 정음 통사/);
      assert.match(await mission.innerText(), /세종의 서문을 끝까지 해독하고/);
      assert.match(await mission.innerText(), /단서 찾기[\s\S]*뜻 고르기[\s\S]*통역하기/);
      const visibleGoal = await mission.locator('.nm-opening-goal').evaluate(e => {
        const r = e.getBoundingClientRect(), body = e.closest('.nm-st-body').getBoundingClientRect();
        return r.top >= body.top - 1 && r.bottom <= body.bottom + 1;
      });
      assert.equal(visibleGoal, true, `${width}/${level}: final mission is visible without scrolling`);
      if (level === 'm') await page.screenshot({ path: join(shots, `role-mission-${width}.png`) });
      await mission.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.match(await mission.locator('.nm-opening-history').innerText(), /실제 발언을 그대로 옮긴 것은 아니/);
      await mission.locator('.nm-dlg-next').click();
      const intro = page.locator('[data-kind="intro"]');
      await intro.waitFor();
      assert.match(await intro.innerText(), /2026년의 교실/);
      await intro.locator('.nm-dlg-next').click();
      const request = page.locator('[data-kind="request"]');
      await request.waitFor(); await request.locator('.nm-dlg-next').click();
      await page.locator('[data-win="task"][data-item="s0.t1"]').waitFor();
      assert.equal(await page.evaluate(() => NM.ui.stage.current().phase), 'explore');
      checked++;
    }
  }
  await start('m');
  await page.keyboard.press('Escape');
  await page.locator('[data-opening="mission"]').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('[data-kind="intro"]').waitFor();
  await start('m');
  await page.evaluate(() => NM.ui.stage.stop());
  await page.waitForTimeout(50);
  assert.equal(await page.locator('[data-opening]').count(), 0, 'stopping does not open a stale mission');
  assert.deepEqual(log.console, []);
  assert.deepEqual(log.external, []);
  assert.deepEqual(await page.evaluate(() => window.__nmErrors || []), []);
  console.log(`opening-browser ok: ${checked} viewport/level cases; keyboard and pointer, both reactions, record isolation, role/goal visibility, tutorial, Escape and stop; errors 0; ${server.url}`);
} finally {
  clearTimeout(limit);
  if (browser) await browser.close();
  await server.close();
}
