import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';
import { reachLearningTarget } from '../lib/learning-flow.mjs';

const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
const out = join(ROOT, 'tests/shots/learning-flow');
mkdirSync(out, { recursive: true });
const server = await serve(), errors = [], evidence = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const timeout = setTimeout(() => { console.error('learning-flow-browser: timeout'); process.exit(1); }, 300000);
async function settle(page) {
  for (let i = 0; i < 100; i++) {
    const next = page.locator(TOP + ' .nm-dlg-next');
    if (!await next.count()) break;
    await next.click();
  }
}
async function start(page, id) {
  await page.evaluate(id => NM.ui.app.enterStage(id), id);
  await page.waitForFunction(() => ['intro', 'explore'].includes(NM.ui.stage.current().phase));
  await settle(page);
  await page.waitForFunction(() => NM.ui.stage.current().phase === 'explore');
}
async function game(level, viewport, teacher = false) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(level => {
    if (sessionStorage.getItem('flow-seeded')) return;
    localStorage.setItem('naratmalssami:v1', JSON.stringify({ v: 1, level, protagonist: 1, nickname: '시험',
      settings: { bgm: false, sfx: false, voice: false, reducedMotion: true }, prologueDone: true,
      progress: {}, glyphs: {}, seenNotices: [] }));
    sessionStorage.setItem('flow-seeded', '1');
  }, level);
  await page.goto(server.url + `?level=${level}${teacher ? '&teacher=1' : ''}`);
  await page.waitForFunction(() => window.NM?.ui?.app && NM.ui.stage && NM.engine);
  await page.evaluate(() => NM.engine.ready());
  return { context, page };
}
const close = page => page.locator(TOP + ' .nm-st-close').click();
const task = async (page, id) => {
  await reachLearningTarget(page, { item: id });
  await page.evaluate(id => NM.ui.stage.openItem(id), id);
};
async function measure(page, tag) {
  const data = await page.evaluate(sel => {
    const w = document.querySelector(sel), body = w.querySelector('.nm-st-body');
    return { height: body.scrollHeight, visible: body.clientHeight, width: innerWidth,
      pageWidth: document.documentElement.scrollWidth, text: w.innerText };
  }, TOP);
  assert.ok(data.pageWidth <= data.width, tag + ': no horizontal overflow');
  evidence.push({ tag, ...data });
  await page.screenshot({ path: join(out, tag + '.png') });
}

try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    const { context, page } = await game('h23', viewport);
    await start(page, 's1');
    assert.deepEqual(await page.evaluate(() => NM.engine.objective()), ['s1.c1']);
    assert.ok(!await page.evaluate(() => NM.engine.listPlaces().some(p => p.contextId === 's1.c2')));
    assert.equal(await page.evaluate(() => !!NM.ui.stage.openContext('s1.c2')), false);
    assert.equal(await page.evaluate(() => !!NM.ui.stage.openItem('s1.t1')), false);
    assert.equal(await page.evaluate(() => NM.engine.goTo('s1.c2')), false);
    assert.equal(await page.evaluate(() => { const r = NM.engine.test.target('s1.c2').rect; return NM.engine.test.tap(r.x + r.w / 2, r.y + r.h / 2); }), false);
    assert.ok((await page.locator('.nm-st-toast').innerText()).includes('돌비석'));
    await page.evaluate(() => NM.ui.stage.openContext('s1.c1'));
    assert.ok(!await page.evaluate(() => NM.ui.stage.guidance().contexts.includes('s1.c2')));
    await page.getByRole('button', { name: '조사를 마쳤어요', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => NM.engine.objective()), ['s1.c2']);
    await page.reload(); await page.evaluate(() => NM.engine.ready()); await start(page, 's1');
    assert.ok(await page.evaluate(() => NM.ui.stage.guidance().contexts.includes('s1.c2')));
    assert.ok(await page.evaluate(() => NM.ui.stage.guidance().contexts.includes('s1.c1')));
    await task(page, 's1.t1');
    assert.equal(await page.locator('.nm-gbs-cell.is-target').count(), 6);
    assert.equal(await page.locator('.nm-gbs-cell.is-target:visible').count(), 2);
    assert.equal(await page.locator('.nm-gbs [data-target="yeo"]').count(), 0);
    assert.ok(await page.locator('.nm-gbs-reading:visible').first().innerText().then(t => t.includes('새김')));
    await measure(page, 's1-first-' + viewport.width);
    const pick = (id, choice) => page.locator(TOP + ` [data-target="${id}"] [data-choice="${choice}"]`).click();
    await pick('yeong', 'eum'); await pick('gil', 'eum');
    await page.locator('.nm-gbs-nav button').last().click();
    assert.equal(await page.locator('.nm-gbs-page').innerText(), '사례 1 / 3');
    assert.ok(await page.locator('.nm-gbs-practice').innerText());
    await pick('yeong', 'hun'); await page.locator('.nm-gbs-nav button').last().click();
    await pick('ju', 'hun'); await pick('eun', 'eum'); await page.locator('.nm-gbs-nav button').last().click();
    assert.ok((await page.locator(TOP).innerText()).includes('이 글자는 분류하지 않아요'));
    await pick('ya', 'hun'); await pick('i', 'eum');
    await page.locator(TOP + ' [data-card="s1.t1.a"]').click();
    await page.locator('.nm-gbs-submit').click();
    assert.equal(await page.evaluate(() => NM.ui.app.store().stage('s1').items['s1.t1'].state), 'done');
    console.log('  ok ordered unlock, reload, revisit and actual hyangchal practice ' + viewport.width);
    await context.close();
  }

  const { context, page } = await game('m', { width: 1366, height: 768 });
  await start(page, 's2'); await task(page, 's2.t1');
  assert.equal(await page.locator('.nm-glf-shape:visible').count(), 1);
  await measure(page, 's2-first');
  await page.locator('[data-part="shape.g"] button[data-piece="ring"]').click();
  await page.locator('.nm-glf-nav button').last().click();
  assert.equal(await page.locator('.nm-glf-page').innerText(), '연습 1 / 6');
  await page.locator('[data-part="shape.g"] button[data-piece="ring"]').click();
  await page.locator('[data-part="shape.g"] button[data-piece="right"]').click();
  await page.locator('[data-part="shape.g"] button[data-piece="top"]').click();
  await page.locator('.nm-glf-nav button').last().click();
  assert.equal(await page.locator('.nm-glf-page').innerText(), '연습 2 / 6');
  console.log('  ok letter practice gives feedback before next letter');
  await context.close();

  const qgame = await game('h23', { width: 1366, height: 768 });
  await start(qgame.page, 's8'); await task(qgame.page, 's8.t1');
  assert.equal(await qgame.page.locator('.qp-q:visible').count(), 1);
  await measure(qgame.page, 's8-first');
  for (const [index, answers] of [[0, [0, 2, 2]], [1, [1, 1, 1]], [2, [2, 1, 1]], [3, [3, 0, 0]]]) {
    for (const [field, n] of ['pair', 'kind', 'ending'].map((f, i) => [f, answers[i]])) {
      await qgame.page.locator(`.qp-q[data-q="q${index + 1}"] [data-field="${field}"] .g789-opt`).nth(n).click();
    }
    if (index < 3) await qgame.page.locator('.qp-nav button').last().click();
  }
  await qgame.page.locator('.qp-submit').click();
  assert.equal(await qgame.page.evaluate(() => NM.ui.app.store().stage('s8').items['s8.t1'].state), 'done');
  console.log('  ok actual question practice and final submit');
  await qgame.context.close();

  const probes = [
    { stage: 's2', level: 'm', item: 's2.t1', change: 'add', expected: '[data-part="add.g.1"].is-hint' },
    { stage: 's8', level: 'h23', item: 's8.t1', change: 'q4', expected: '[data-q="q4"].is-hint' },
    { stage: 's9', level: 'h23', item: 's9.t1', change: 'p4', expected: '[data-phrase="p4"] .is-hint' },
    { stage: 's10', level: 'h23', item: 's10.t1', change: 'vh', expected: '[data-row="vh"].is-hint' },
    { stage: 's11', level: 'h23', item: 's11.t1', change: 'sp4', expected: '[data-target="sp4"].is-hint' },
    { stage: 's12', level: 'h1', item: 's12.t1', change: 'now', expected: '[data-target="now"].is-hint' }
  ];
  for (const p of probes) {
    const g = await game(p.level, { width: 1366, height: 768 });
    await start(g.page, p.stage); await task(g.page, p.item);
    await g.page.evaluate(p => {
      const st = NM.ui.app.store(), sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[p.stage], st.level);
      const a = JSON.parse(JSON.stringify(sc.items.find(i => i.id === p.item).answer));
      if (p.change === 'add') a.add['g.1'] = 'g';
      if (p.change === 'q4') a.q4.ending = 'go';
      if (p.change === 'p4') a.decode['p4.w2'] = 'p4.w2.b';
      if (p.change === 'vh') a.vh.status = 'kept';
      if (p.change === 'sp4') a.spell.sp4 = 'ieo';
      if (p.change === 'now') a.now.push('n5');
      NM.ui.itemTask.test.submit(a);
    }, p);
    await g.page.locator(TOP + ' .nm-st-morehelp').click();
    assert.ok(await g.page.locator(p.expected).count(), p.stage + ': actual wrong part receives hint');
    await measure(g.page, p.stage + '-matching-hint');
    console.log('  ok matching hint ' + p.stage);
    await g.context.close();
  }

  const teacher = await game('h23', { width: 1366, height: 768 }, true);
  const before = await teacher.page.evaluate(() => localStorage.getItem('naratmalssami:v1'));
  await start(teacher.page, 's1');
  assert.equal(await teacher.page.evaluate(() => NM.ui.stage.guidance()), null);
  assert.ok(await teacher.page.evaluate(() => !!NM.ui.stage.openItem('s1.t1')));
  await teacher.page.locator(TOP + ' .nm-st-teacher-answer').click();
  assert.equal(await teacher.page.evaluate(() => localStorage.getItem('naratmalssami:v1')), before);
  console.log('  ok teacher preview remains free and student storage unchanged');
  await teacher.context.close();
  assert.deepEqual(errors, []);
  writeFileSync(join(out, 'evidence.json'), JSON.stringify({ errors, evidence }, null, 2));
  console.log('learning-flow-browser: ok');
} finally { clearTimeout(timeout); await browser.close(); await server.close(); }
