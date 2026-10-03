import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';
import { openGame } from '../lib/playthrough.mjs';

const server = await serve();
const shots = join(ROOT, 'tests/shots/copy-review');
mkdirSync(shots, { recursive: true });
let browser;
let checked = 0;

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, log } = await openGame(context, server.url);
  const cases = await page.evaluate(() => NM.data.STAGE_IDS.flatMap(id =>
    ['m', 'h1', 'h23'].map(level => ({ id, level }))
  ));
  const expected = await page.evaluate(() => ({
    middle: NM.ui.stageLogic.resolveScene(NM.data.SCENES.s12, 'm').reflection.ask,
    high: NM.ui.stageLogic.resolveScene(NM.data.SCENES.s12, 'h23').reflection.ask
  }));
  assert.match(expected.middle, /줄임말/);
  assert.match(expected.high, /500년/);
  assert.notEqual(expected.middle, expected.high);

  async function openReflection(id, level, fallback = false) {
    const prompt = await page.evaluate(({ id, level, fallback }) => {
      const scene = NM.ui.stageLogic.resolveScene(NM.data.SCENES[id], level);
      if (fallback) delete scene.reflection;
      const store = NM.core.save.createStore({ storage: localStorage, urlLevel: level, level });
      window.__reflectionStore = store;
      store.setReflection(id, '기존 기록');
      window.__reflectionRun = NM.ui.stageEnd.run({
        scene, reducedMotion: () => true, sfx() {},
        setReflection: text => store.setReflection(id, text),
        alive: () => true
      });
      return scene.reflection || {
        ask: NM.ui.stageText.t('reflectAsk'),
        placeholder: NM.ui.stageText.t('reflectPlaceholder')
      };
    }, { id, level, fallback });
    if (id === 's0') {
      const plate = page.locator('[data-win="carve"]');
      assert.match(await plate.innerText(), /통사 패를 받았어요/);
      assert.equal(await plate.locator('.nm-st-glyph').innerText(), '');
    }
    await page.locator('[data-win="carve"] .nm-st-next').click();
    await page.locator('[data-win="reflect"]').waitFor();
    return prompt;
  }

  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: width === 360 ? 740 : 800 });
    for (const { id, level } of cases) {
      const prompt = await openReflection(id, level);
      const input = page.getByLabel(prompt.ask, { exact: false });
      assert.equal(await input.count(), 1, `${id}/${level}: accessible question`);
      assert.equal(await input.getAttribute('placeholder'), prompt.placeholder);
      assert.equal(await input.getAttribute('maxlength'), '200');
      assert.equal(await page.locator('[data-win="reflect"]').evaluate(w =>
        w.scrollWidth <= w.clientWidth + 1 &&
        w.querySelector('.nm-st-body').scrollWidth <= w.querySelector('.nm-st-body').clientWidth + 1
      ), true, `${id}/${level}/${width}: horizontal overflow`);
      const answer = id === 's5' ? '  어리다는 옛날에 어리석다는 뜻이었다.  ' : '  새로 알게 된 점  ';
      await input.fill(answer);
      if (id === 's12' && level !== 'h1') {
        await page.screenshot({ path: join(shots, `reflection-${level}-${width}.png`) });
      }
      if (level === 'h1') await page.locator('[data-win="reflect"] .nm-st-skip').click();
      else await page.locator('[data-win="reflect"] .nm-st-next').click();
      await page.evaluate(() => window.__reflectionRun);
      const saved = await page.evaluate(id => window.__reflectionStore.stage(id).reflection, id);
      assert.equal(saved, level === 'h1' ? '기존 기록' : answer.trim(), `${id}/${level}: save or skip`);
      checked++;
    }
  }

  const fallback = await openReflection('s5', 'h1', true);
  assert.equal(await page.getByLabel(fallback.ask, { exact: false }).count(), 1);
  await page.locator('.nm-st-reflect-input').fill('닫으면 저장하지 않음');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__reflectionRun);
  assert.equal(await page.evaluate(() => window.__reflectionStore.stage('s5').reflection), '기존 기록');
  assert.deepEqual(log.console, []);
  assert.deepEqual(log.external, []);
  assert.deepEqual(await page.evaluate(() => window.__nmErrors || []), []);
  console.log(`reflection-browser ok: ${checked} reflection cases; save, skip, Escape, fallback; errors 0`);
} finally {
  if (browser) await browser.close();
  await server.close();
}
