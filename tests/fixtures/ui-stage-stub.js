'use strict';
/*
 * U1 시험용 장면 진행기 대역. D1 의 NM.ui.stage.run(stageId, ctx) 이 없을 때만 쓴다.
 * ctx = { store, level, teacher, onExit(result), saveImage }
 * window.__stub: runs(부른 기록), finish()(핵심 항목을 모두 맞히고 장면 끝), partial()(맥락 하나만 보기), exit(result)
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  if (NM.ui.stage && typeof NM.ui.stage.run === 'function') return;
  const stub = root.__stub = { runs: [], ctx: null, stageId: null, el: null, mapReady: null };
  NM.ui.stage = {
    run(stageId, ctx) {
      stub.runs.push({ stageId, level: ctx.level, teacher: ctx.teacher === true, hasStore: !!ctx.store,
        storeIsTeacher: !!(ctx.store && ctx.store.isTeacher), hasSaveImage: typeof ctx.saveImage === 'function', hasOnExit: typeof ctx.onExit === 'function' });
      stub.ctx = ctx; stub.stageId = stageId;
      const el = document.createElement('div');
      el.className = 'stub-stage';
      el.setAttribute('data-stub-stage', stageId);
      el.textContent = stageId;
      document.getElementById('ui-layer').appendChild(el);
      stub.el = el;
      if (NM.engine && typeof NM.engine.loadMap === 'function') stub.mapReady = NM.engine.loadMap('maps/test.json');
    }
  };
  const scene = () => NM.data.SCENES[stub.stageId];
  function solve(st, item) {
    const s = stub.ctx.store;
    if (item.kind === 'task') { s.submit(st, item.id, true); return; }
    (st.contexts || []).forEach(c => { if ((c.items || []).indexOf(item.id) >= 0) s.seeContext(st, c.id); });
    const right = item.cards.filter(c => c.correct)[0];
    s.choose(st, item.id, right.id);
    s.confirm(st, item.id);
  }
  function lines(st) { const tr = st.translate; return Array.isArray(tr) ? tr : (tr && tr.lines) || []; }
  stub.partial = function () {
    const st = scene(), s = stub.ctx.store;
    if (st.contexts && st.contexts[0]) s.seeContext(st, st.contexts[0].id);
    const tasks = s.coreItems(st).filter(it => it.kind === 'task');
    if (tasks[0]) s.submit(st, tasks[0].id, false);
    return s.stage(st.id);
  };
  stub.solveFirstRead = function (wrongFirst) {
    const st = scene(), s = stub.ctx.store;
    const it = s.coreItems(st).filter(x => x.kind === 'read')[0];
    (st.contexts || []).forEach(c => { if ((c.items || []).indexOf(it.id) >= 0) s.seeContext(st, c.id); });
    if (wrongFirst) { const w = it.cards.filter(c => !c.correct)[0]; s.choose(st, it.id, w.id); s.confirm(st, it.id); }
    const right = it.cards.filter(c => c.correct)[0];
    s.choose(st, it.id, right.id);
    s.confirm(st, it.id);
    lines(st).forEach(l => s.addTranslation(st.id, l.id));
    return s.stage(st.id);
  };
  stub.finish = function (reflection) {
    const st = scene(), s = stub.ctx.store;
    s.coreItems(st).forEach(it => { const cur = s.stage(st.id).items[it.id]; if (!cur || NM.core.rules.DONE_STATES.indexOf(cur.state) < 0) solve(st, it); });
    lines(st).forEach(l => s.addTranslation(st.id, l.id));
    s.setReflection(st.id, reflection || '시험 돌아보기 한 줄');
    const r = s.completeStage(st);
    stub.exit({ completed: true });
    return r;
  };
  stub.exit = function (result) {
    if (stub.el && stub.el.parentNode) stub.el.parentNode.removeChild(stub.el);
    stub.el = null;
    const ctx = stub.ctx;
    stub.ctx = null;
    if (ctx) ctx.onExit(result || { completed: false });
  };
})(typeof window !== 'undefined' ? window : globalThis);
