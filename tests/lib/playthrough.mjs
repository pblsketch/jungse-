// 장면 끝까지 풀기(브라우저): index.html 에서 장면 하나를 학교급 범위로 처음부터 끝까지 푼다.
// - 해독 항목: 그 항목이 든 서로 다른 맥락 2곳을 살핀 뒤, 오답 카드로 한 번 확정(오해 장면) → 정답 카드로 확정
// - 기믹 과제: 일부러 틀린 답 한 번(틀린 부분 표시) → 정답(item.answer) 제출 (기믹 화면 조작은 각 기믹 점검이 맡는다)
// - 통역 → 새김 → 돌아보기(건너뜀) → 저장 제안(나중에) → onExit
// 모든 누르기는 DOM click(겹친 화면의 영향을 받지 않음)이다.
// 사용: const r = await playStage(page, { stageId: 's3', level: 'm' }); r.problems 가 비어 있어야 한다.

const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

export async function openGame(context, baseUrl) {
  const page = await context.newPage();
  const log = { console: [], external: [] };
  page.on('console', m => { if (m.type() === 'error') log.console.push(m.text()); });
  page.on('pageerror', e => log.console.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^(data:|blob:)/.test(r.url()) && !r.url().startsWith(baseUrl)) log.external.push(r.url()); });
  await page.goto(baseUrl);
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.stage && NM.engine, null, { timeout: 30000 });
  await page.evaluate(() => NM.engine.ready());
  return { page, log };
}

const top = (page) => page.evaluate((sel) => {
  const w = document.querySelector(sel);
  if (!w) return null;
  const has = (s) => !!w.querySelector(s);
  return { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), item: w.getAttribute('data-item'),
    context: w.getAttribute('data-context'), next: has('.nm-dlg-next'), skip: has('.nm-st-skip'), later: has('.nm-st-later'),
    endNext: has('.nm-st-foot .nm-st-next'), text: (w.textContent || '').slice(0, 300) };
}, TOP);
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);

// 대화·끝 창을 넘긴다(맥락·항목 창은 그대로 둔다). 지나간 대화 글을 돌려준다.
async function settle(page, max = 80) {
  const seen = [];
  for (let i = 0; i < max; i++) {
    const t = await top(page);
    if (!t) break;
    if (t.next) { seen.push(t); await click(page, TOP + ' .nm-dlg-next'); }
    else if (t.skip) await click(page, TOP + ' .nm-st-skip');
    else if (t.later) await click(page, TOP + ' .nm-st-later');
    else if (t.endNext) await click(page, TOP + ' .nm-st-foot .nm-st-next');
    else break;
    await page.waitForTimeout(25);
  }
  return seen;
}
const closeAll = (page) => page.evaluate(() => { let n = 0; while (NM.engine.isOverlayOpen() && n++ < 20) NM.engine.closeOverlay(); });

export async function playStage(page, { stageId, level, nickname = '시험', wrongOnce = true }) {
  const problems = [];
  const note = (m) => problems.push(stageId + '/' + level + ': ' + m);
  const ok = await page.evaluate(async ({ stageId, level, nickname }) => {
    try { localStorage.clear(); } catch (e) { /* 무시 */ }
    window.__nmErrors = [];
    const st = NM.core.save.createStore({ storage: localStorage, urlLevel: level, level });
    st.setup({ level, protagonist: 1, nickname });
    st.markPrologueDone && st.markPrologueDone();
    window.__pt = { store: st, exits: [] };
    if (NM.ui.stage.stop) NM.ui.stage.stop();
    return NM.ui.stage.run(stageId, { store: st, level, teacher: false, onExit: (r) => window.__pt.exits.push(r) });
  }, { stageId, level, nickname });
  if (!ok) { note('run() failed (no scene?)'); return { problems }; }
  await settle(page);
  const plan = await page.evaluate(({ stageId }) => {
    const st = window.__pt.store;
    const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[stageId], st.level);
    return {
      phase: NM.ui.stage.current().phase,
      items: st.coreItems(sc).map(it => ({
        id: it.id, kind: it.kind, answer: it.answer,
        contexts: (sc.contexts || []).filter(c => (c.items || []).indexOf(it.id) >= 0).map(c => c.id),
        wrong: it.kind === 'read' ? ((it.cards || []).filter(c => !c.correct)[0] || {}).id : null,
        right: it.kind === 'read' ? ((it.cards || []).filter(c => c.correct)[0] || {}).id : null,
        misread: it.kind === 'read' ? !!(it.misread && Object.keys(it.misread).length) : null
      })),
      translateAt: sc.translate && sc.translate.at || null
    };
  }, { stageId });
  if (plan.phase !== 'explore') note('after intro, phase is ' + plan.phase + ' (expected explore)');
  if (!plan.items.length) note('no core items for this level');
  const stateOf = (id) => page.evaluate((id) => { const p = window.__pt.store.stage(window.__pt.stageId || NM.ui.stage.current().stageId); return p.items[id] ? p.items[id].state : 'none'; }, id);

  for (const it of plan.items) {
    if (it.kind === 'read') {
      const ctx = [...new Set(it.contexts)];
      if (ctx.length < 2) { note(it.id + ' has fewer than 2 contexts'); continue; }
      for (const cid of ctx.slice(0, 2)) {
        const onMap = await page.evaluate((cid) => !!NM.engine.test.target(cid), cid);
        if (!onMap) note(it.id + ': context ' + cid + ' not on the map');
        await page.evaluate((cid) => NM.ui.stage.openContext(cid), cid);
        await page.waitForTimeout(60);
        await settle(page);
        await closeAll(page); await settle(page);
      }
      await page.evaluate((id) => NM.ui.stage.openItem(id), it.id);
      await page.waitForTimeout(60);
      if (wrongOnce && it.wrong) {
        await click(page, TOP + ` .nm-st-card[data-card="${it.wrong}"]`);
        if (!(await click(page, TOP + ' .nm-st-confirm'))) note(it.id + ': confirm button closed after 2 contexts');
        await page.waitForTimeout(60);
        const mis = await settle(page);
        if (it.misread && !mis.length) note(it.id + ': no misread scene after wrong confirm');
        const s1 = await stateOf(it.id);
        if (s1 !== 'misread') note(it.id + ': state after wrong confirm = ' + s1);
        if ((await top(page) || {}).item !== it.id) { await page.evaluate((id) => NM.ui.stage.openItem(id), it.id); await page.waitForTimeout(60); }
      }
      await click(page, TOP + ` .nm-st-card[data-card="${it.right}"]`);
      await click(page, TOP + ' .nm-st-confirm');
      await page.waitForTimeout(60);
      await settle(page);
      const s2 = await stateOf(it.id);
      if (s2 !== 'confirmed') note(it.id + ': state after correct confirm = ' + s2);
      await closeAll(page); await settle(page);
    } else {
      await page.evaluate((id) => NM.ui.stage.openItem(id), it.id);
      await page.waitForTimeout(150);
      const g = await page.evaluate(() => !!document.querySelector('.nm-overlay-host .nm-st-win [data-gimmick], .nm-overlay-host .nm-st-win .nm-st-gimmick'));
      if (wrongOnce) {
        await page.evaluate(() => NM.ui.itemTask.test.submit({ __playthroughWrong: true }));
        await page.waitForTimeout(60);
        const s1 = await page.evaluate((id) => { const p = window.__pt.store.stage(NM.ui.stage.current().stageId).items[id]; return p ? { state: p.state, wrongs: p.wrongs } : null; }, it.id);
        if (!s1 || s1.state !== 'open' || s1.wrongs !== 1) note(it.id + ': wrong submit → ' + JSON.stringify(s1));
      }
      await page.evaluate((a) => NM.ui.itemTask.test.submit(a), it.answer);
      await page.waitForTimeout(60);
      const s2 = await stateOf(it.id);
      if (s2 !== 'done') note(it.id + ': state after correct submit = ' + s2 + (g ? '' : ' (gimmick root not found)'));
      await settle(page);
      await closeAll(page); await settle(page);
    }
  }
  // 통역
  await page.waitForTimeout(100);
  if (plan.translateAt) await page.evaluate((at) => NM.engine.goTo(at), plan.translateAt);
  await page.waitForTimeout(100);
  await settle(page, 120);
  await page.waitForTimeout(150);
  await settle(page, 40);
  const end = await page.evaluate(({ stageId }) => {
    const st = window.__pt.store, r = st.get();
    return { exits: window.__pt.exits, status: st.stage(stageId).status, glyphs: (r.glyphs && r.glyphs[st.level]) || [],
      phase: NM.ui.stage.current().phase, errors: (window.__nmErrors || []).slice(0, 5) };
  }, { stageId });
  if (end.status !== 'done') note('stage status ' + end.status + ' (phase ' + end.phase + ')');
  if (!end.exits.length || !end.exits[0].completed) note('onExit not called with completed:true → ' + JSON.stringify(end.exits));
  if (stageId !== 's0' && end.glyphs.indexOf(stageId) < 0) note('carve glyph not saved');
  if (end.errors.length) note('NM errors: ' + JSON.stringify(end.errors));
  return { problems, end, plan };
}
