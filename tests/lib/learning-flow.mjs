const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';
async function settle(page) {
  for (let i = 0; i < 80; i++) {
    const moved = await page.evaluate(sel => {
      const w = document.querySelector(sel);
      const b = w && w.querySelector('.nm-dlg-next');
      if (!b || b.disabled) return false;
      b.click(); return true;
    }, TOP);
    if (!moved) break;
    await page.waitForTimeout(15);
  }
}
async function close(page) {
  await page.evaluate(() => { let n = 0; while (NM.engine.isOverlayOpen() && n++ < 30) NM.engine.closeOverlay(); });
}
export async function reachLearningTarget(page, { item, context } = {}) {
  for (let turn = 0; turn < 120; turn++) {
    const f = await page.evaluate(() => NM.ui.stage.guidance ? NM.ui.stage.guidance() : null);
    if (!f || item && f.items.includes(item) || context && f.contexts.includes(context)) return;
    await close(page);
    if (f.readyItems.length) {
      await page.evaluate(id => NM.ui.stage.openItem(id), f.readyItems[0]);
      for (let i = 0; i < 3; i++) {
        const b = page.locator(TOP + ' .nm-st-morehelp');
        if (await b.count() && await b.isVisible()) await b.click();
      }
      await settle(page); await close(page);
    } else if (f.objectives.length) {
      await page.evaluate(id => NM.ui.stage.openContext(id), f.objectives[0]);
      await settle(page); await close(page);
    } else throw new Error('Learning flow cannot reach ' + (item || context));
  }
  throw new Error('Learning flow exceeded limit for ' + (item || context));
}
