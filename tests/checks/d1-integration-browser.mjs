// 장면 진행기 연결 점검: 주인공·선배 초상(ASSETS.portraits), 주인공 아틀라스, 原文 제목은 평문,
// 방점 판독 못 한 블록 안내, 교사 표시 + 학생 저장소면 멈춤. tests/pages/stage.html (idle=1) 을 쓴다.
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL d1-integration-browser: time limit (150 s)'); process.exit(1); }, 150000);
let failed = 0;
const check = (name, ok, info) => { if (ok) console.log('  ok   ' + name); else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info) : '')); } };

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(server.url + 'tests/pages/stage.html?idle=1');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* 무시 */ } });
  await page.evaluate(() => NM.engine.boot());

  // 1) 교사 표시 + 학생 저장소 → 멈추고 기록 그대로
  const guard = await page.evaluate(async () => {
    const st = NM.core.save.createStore({ storage: localStorage, urlLevel: 'm', level: 'm' });
    st.setup({ protagonist: 3, nickname: '하늘' });
    const before = localStorage.getItem(NM.core.save.KEY);
    const exits = [];
    const r = await NM.ui.stage.run('s6', { store: st, level: 'm', teacher: true, onExit: x => exits.push(x) });
    const errs = (window.__nmErrors || []).splice(0);
    return { r, exits, same: before === localStorage.getItem(NM.core.save.KEY), errs: errs.length };
  });
  check('teacher flag with student store refuses to run', guard.r === false && guard.exits.length === 1 && guard.same && guard.errs === 1, guard);

  // 2) 학생 진행: 주인공 3번 → 아틀라스 hero_3, 대사 초상
  await page.evaluate(async () => {
    const st = NM.core.save.createStore({ storage: localStorage, urlLevel: 'm', level: 'm' });
    window.__st = st;
    await NM.ui.stage.run('s6', { store: st, level: 'm', teacher: false, onExit: () => {} });
  });
  await page.waitForTimeout(500);
  const sp = await page.evaluate(() => NM.engine.test.sprites());
  check('player atlas follows protagonist 3', sp.player === 'nm-sp:hero_3', sp);
  const imgs = await page.evaluate(() => [...document.querySelectorAll('.nm-dlg-portrait img')].map(i => i.getAttribute('src')));
  check('senior portrait resolved to senior_tongsa_*', imgs.some(s => /senior_tongsa_/.test(s)), imgs);

  // 2-1) 기믹 과제를 맞게 제출하면 instance.showDone 이 불린다
  const done = await page.evaluate(async () => {
    const it = NM.data.SCENES.s6.items.filter(x => x.id === 's6.t1')[0];
    NM.ui.stage.openItem('s6.t1');
    await new Promise(r => setTimeout(r, 300));
    const b = document.querySelector('.d1tg-choice[data-choice="' + it.answer + '"]');
    if (!b) return { found: false };
    b.click(); document.querySelector('.d1tg-submit').click();
    await new Promise(r => setTimeout(r, 200));
    return { found: true, flag: document.querySelector('.d1tg').getAttribute('data-done'), state: window.__st.stage('s6').items['s6.t1'].state };
  });
  check('correct task submit → showDone called, state done', done.found && done.flag === '1' && done.state === 'done', done);

  // 3) 原文 제목은 평문, 방점 판독 못 한 블록 안내
  const mk = await page.evaluate(() => {
    NM.data.ORIG['O-test-T'] = { title: '첫째·둘째 구절', lines: ['나·랏'], src: 'test', certainty: '◎', noBangjeom: true };
    const sec = NM.ui.marker.orig('O-test-T', { document });
    return { title: sec.querySelector('.nm-orig-title').textContent, note: !!sec.querySelector('.nm-orig-note') };
  });
  check('原文 title shown as plain text', mk.title === '첫째·둘째 구절', mk);
  check('noBangjeom block shows the note', mk.note, mk);

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
console.log(failed ? `d1 integration browser: ${failed} failed` : 'd1 integration browser: all passed');
process.exit(failed ? 1 : 0);
