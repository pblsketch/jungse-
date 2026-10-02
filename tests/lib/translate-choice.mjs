// 통역 고르기 창(js/ui/stage-translate.js, data-win="interp") 풀기 — playthrough.mjs·e2e-kit.mjs·점검이 함께 쓴다.
// 모든 누르기는 DOM click(겹친 화면의 영향을 받지 않음). 고를 카드는 장면 데이터(scene.translate.choose)에서 고른다.
//   isOpen(page)                         맨 위 창이 통역 고르기 창인가
//   answerTranslateChoice(page, { wrongOnce }) → { shown, steps, wrong?: { reaction, again, tried, kinds }, delivered, problems: [] }
//     wrongOnce: 첫 고르기에 틀린 카드를 골라 '이렇게 통역하기' → 반응 대사(interp-react)가 뜨고, 창으로 돌아와
//                그 고르기가 '다시 골라 보세요'·엉뚱했던 카드가 막혔는지 본다. 그다음 정답으로 통역한다.
export const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

const topInfo = (page) => page.evaluate((sel) => {
  const w = document.querySelector(sel);
  return w ? { win: w.getAttribute('data-win'), kind: w.getAttribute('data-kind'), next: !!w.querySelector('.nm-dlg-next') } : null;
}, TOP);
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b || b.disabled || b.hidden) return false; b.click(); return true; }, sel);

export async function isOpen(page) { const t = await topInfo(page); return !!t && t.win === 'interp'; }

async function waitWin(page, want, timeout = 6000) {
  const t0 = Date.now();
  for (;;) {
    const t = await topInfo(page);
    if (t && Object.keys(want).every(k => t[k] === want[k])) return t;
    if (Date.now() - t0 > timeout) return t;
    await page.waitForTimeout(30);
  }
}
async function passDialogs(page) {
  const kinds = [];
  for (let i = 0; i < 40; i++) {
    const t = await topInfo(page);
    if (!t || t.win !== 'dialog' || !t.next) break;
    if (kinds[kinds.length - 1] !== t.kind) kinds.push(t.kind);
    await click(page, TOP + ' .nm-dlg-next');
    await page.waitForTimeout(20);
  }
  return kinds;
}

export async function answerTranslateChoice(page, { wrongOnce = false } = {}) {
  const problems = [];
  const out = { shown: false, steps: [], delivered: false, problems };
  const t = await waitWin(page, { win: 'interp' });
  if (!t || t.win !== 'interp') { problems.push('translate choice window not shown (top: ' + JSON.stringify(t) + ')'); return out; }
  out.shown = true;
  const steps = await page.evaluate(() => {
    const c = NM.ui.stage.current();
    const st = (window.__pt && window.__pt.store) || (NM.ui.app && NM.ui.app.store ? NM.ui.app.store() : null) || window.__store;
    const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[c.stageId], st.level);
    return NM.ui.stageTranslate.logic.steps(sc.translate).map(s => ({
      id: s.id, right: s.options.filter(o => o.correct)[0].id, wrong: (s.options.filter(o => !o.correct)[0] || {}).id || null
    }));
  });
  out.steps = steps;
  const pick = (sid, oid) => click(page, `${TOP} .nm-st-interp-step[data-step="${sid}"] .nm-st-card[data-card="${oid}"]`);
  if (wrongOnce && steps[0] && steps[0].wrong) {
    const s0 = steps[0];
    await pick(s0.id, s0.wrong);
    for (const s of steps.slice(1)) await pick(s.id, s.right);
    const preview = await page.evaluate((sel) => { const e = document.querySelector(sel + ' .nm-st-interp-sentence'); return e ? e.textContent : null; }, TOP);
    const can = await click(page, TOP + ' .nm-st-interp-deliver');
    const r = await waitWin(page, { win: 'dialog', kind: 'interp-react' });
    const reaction = !!r && r.win === 'dialog' && r.kind === 'interp-react';
    const kinds = await passDialogs(page);
    const back = await waitWin(page, { win: 'interp' });
    const view = await page.evaluate(({ sel, sid, oid }) => {
      const w = document.querySelector(sel);
      const sec = w && w.querySelector(`.nm-st-interp-step[data-step="${sid}"]`);
      const card = sec && sec.querySelector(`.nm-st-card[data-card="${oid}"]`);
      const deliver = w && w.querySelector('.nm-st-interp-deliver');
      return { again: !!(sec && sec.classList.contains('is-again') && sec.querySelector('.nm-st-interp-again')),
        tried: !!(card && card.disabled && card.classList.contains('is-tried')), deliverDisabled: !!(deliver && deliver.disabled) };
    }, { sel: TOP, sid: s0.id, oid: s0.wrong });
    out.wrong = { can, preview, reaction, kinds, back: !!back && back.win === 'interp', ...view };
    if (!can) problems.push('deliver button disabled after picking all');
    if (!reaction) problems.push('wrong interpretation → no reaction dialog');
    if (!out.wrong.back) problems.push('after reaction, not back at the choice window');
    if (!view.again || !view.tried) problems.push('wrong step not marked again / tried card not blocked: ' + JSON.stringify(view));
    if (!view.deliverDisabled) problems.push('deliver should wait until the wrong step is chosen again');
    await pick(s0.id, s0.right);
  } else {
    for (const s of steps) await pick(s.id, s.right);
  }
  out.delivered = await click(page, TOP + ' .nm-st-interp-deliver');
  if (!out.delivered) problems.push('could not deliver the right interpretation');
  await page.waitForTimeout(40);
  if (await isOpen(page)) problems.push('choice window still open after the right interpretation');
  return out;
}
