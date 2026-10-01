// 장면 끝까지 풀기 점검: NM.data.SCENES 에 있는 장면마다, 그 장면이 추천 묶음에 든 학교급(서장은 세 학교급 모두)으로
// index.html 에서 처음부터 끝까지 푼다(tests/lib/playthrough.mjs). 장면 데이터가 없으면 '없음'으로 알리고 넘어간다.
// 하나만: node tests/checks/scenes-play-browser.mjs --stage s3 [--level m]
import { chromium } from 'playwright';
import { serve } from '../server.mjs';
import { openGame, playStage } from '../lib/playthrough.mjs';

const args = process.argv.slice(2);
const pick = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const onlyStage = pick('--stage'), onlyLevel = pick('--level');
const HARD_LIMIT = setTimeout(() => { console.log('FAIL scenes-play-browser: time limit (600 s)'); process.exit(1); }, 600000);
let failed = 0;

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, log } = await openGame(context, server.url);
  const jobs = await page.evaluate(() => {
    const out = [];
    const B = NM.data.BUNDLES;
    NM.data.STAGE_IDS.forEach(id => {
      if (!NM.data.SCENES || !NM.data.SCENES[id]) { out.push({ id, missing: true }); return; }
      ['m', 'h1', 'h23'].forEach(lv => {
        const b = B[lv];
        if (id === 's0' || b.stages.indexOf(id) >= 0 || (b.optional || []).indexOf(id) >= 0) out.push({ id, level: lv });
      });
    });
    return out;
  });
  for (const j of jobs) {
    if (onlyStage && j.id !== onlyStage) continue;
    if (j.missing) { console.log('  --   ' + j.id + ' 없음'); continue; }
    if (onlyLevel && j.level !== onlyLevel) continue;
    const r = await playStage(page, { stageId: j.id, level: j.level });
    if (r.problems.length) { failed++; console.log('  FAIL ' + j.id + '/' + j.level + '\n       ' + r.problems.join('\n       ')); }
    else console.log('  ok   ' + j.id + '/' + j.level + ' — ' + r.plan.items.length + ' core items, done');
  }
  if (log.console.length) { failed++; console.log('  FAIL console errors — ' + JSON.stringify(log.console.slice(0, 5))); }
  if (log.external.length) { failed++; console.log('  FAIL external requests — ' + JSON.stringify(log.external.slice(0, 5))); }
} catch (e) {
  failed++; console.log('  FAIL exception — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
console.log(failed ? `scenes play: ${failed} failed` : 'scenes play: ok');
process.exit(failed ? 1 : 0);
