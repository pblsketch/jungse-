// G9 두 시대 수첩 브라우저 점검: 진짜 장면 진행기 안(tests/pages/g-twoEraNotebook.html + 시험 장면 s10)에서
// 두 쪽 그리기(原文 DOM·낭독용 현대 표기), 방점 늘 켬(설정이 꺼져 있어도), 채점하지 않는 줄(알아 두기),
// 근거 고르기(줄 켜기 → 16세기 낱말 누르기 / 키보드 Enter / 칩으로 빼기) /
// 틀림 → 갈래 ✕·받지 않는 근거 칩 ✕·근거 없음 ✕, open / 2번째 → 줄·15세기 보기·근거 블록 빛남 /
// 3번째 → doneByHelp + 정답 / 다시 열기 읽기 전용 / 바른 제출 → done / 좁은 화면 / 오류·콘솔 오류·외부 요청 0
import { harness, TOP } from '../lib/g789-harness.mjs';

const H = await harness('g9-twoEraNotebook-browser');
const { check } = H;
const PAGE = 'g-twoEraNotebook.html';
const S = (rest) => `${TOP} .tn ${rest}`;
const row = (rid, rest = '') => S(`.tn-row[data-row="${rid}"] ${rest}`);
const status = (rid, v) => row(rid, `.g789-opt[data-opt="${v}"]`);
const word = (id) => S(`.tn-page16 [data-word="${id}"]`);
async function pickRow(page, rid) { await page.click(row(rid, '.tn-pick')); }
async function fill(page, plan) {
  for (const rid of Object.keys(plan)) {
    await page.click(status(rid, plan[rid].status));
    if (plan[rid].evidence && plan[rid].evidence.length) {
      await pickRow(page, rid);
      for (const w of plan[rid].evidence) await page.click(word(w));
    }
  }
}
const RIGHT = {
  nom: { status: 'kept', evidence: ['s.i'] },
  cut: { status: 'shaky', evidence: ['s.mom1', 's.machm'] },
  vh: { status: 'shaky', evidence: ['s.mom2'] },
  ga: { status: 'none', evidence: [] },
  araea: { status: 'shaky', evidence: ['x.saheul'] }
};

try {
  const context = await H.browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  // 방점 끄기 설정을 미리 둔다 — 이 장면은 그래도 늘 켠다
  const pre = await context.newPage();
  H.watch(pre);
  await pre.goto(H.server.url + 'tests/pages/' + PAGE + '?idle=1');
  await pre.evaluate(() => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', JSON.stringify({ v: 1, level: 'h23', protagonist: 1, nickname: '', settings: { bangjeom: false, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true }, prologueDone: true, progress: {}, glyphs: {}, seenNotices: [] })); });
  await pre.close();
  let page = await H.open(context, PAGE, 'stage=s10&level=h23');
  await H.openTask(page, 's10.t1');
  let r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const bj = w.querySelector('.tn-page16 .nm-bj');
    const line = w.querySelector('.tn-page16 .g789-line');
    return {
      pages: w.querySelectorAll('.tn-page').length,
      blocks16: [...w.querySelectorAll('.tn-page16 .g789-orig')].map(b => b.getAttribute('data-block')).join(),
      words16: [...w.querySelectorAll('.tn-page16 button[data-word]')].map(b => b.getAttribute('data-word')).join(),
      words15: w.querySelectorAll('.tn-page15 [data-word]').length,
      bjAttr: document.documentElement.getAttribute('data-nm-bangjeom'), bjShown: !!bj && getComputedStyle(bj).display !== 'none',
      setting: window.__store.get().settings.bangjeom,
      modern: line && line.getAttribute('data-modern'), aria: (w.querySelector('.tn-page16 button[data-word="s.mom1"]') || {}).getAttribute && w.querySelector('.tn-page16 button[data-word="s.mom1"]').getAttribute('aria-label'),
      know: (() => { const k = w.querySelector('.tn-row[data-row="bj"]'); return k && { mark: !!k.querySelector('.nm-mark-know'), ns: k.textContent.includes('채점하지 않아요'), radios: k.querySelectorAll('input').length, pick: !!k.querySelector('.tn-pick') }; })(),
      active: (w.querySelector('.tn-row.is-active') || {}).getAttribute && w.querySelector('.tn-row.is-active').getAttribute('data-row'),
      ex15: [...w.querySelectorAll('.tn-page15 .is-example')].map(e => e.getAttribute('data-word')).join(),
      note: !!w.querySelector('.tn-notes .nm-card[data-mark="know"] .g789-orig[data-block="O-s10-HUNMONG1"]'),
      submit: w.querySelector('.tn-submit').disabled
    };
  }, TOP);
  check('two pages side by side; 16th-c 原文 blocks with tappable words + extra word', r.pages === 2 && r.blocks16 === 'O-s10-SOHAK1,O-s10-SOHAK2,O-s10-SOHAK4' && r.words16 === 's.i,s.mom1,s.eolgul,s.geosira,s.mom2,s.machm,x.saheul' && r.words15 === 5, r);
  check('this stage always shows 방점 (setting off)', r.bjAttr === 'on' && r.bjShown && r.setting === false, r);
  check('modern reading on lines and word buttons', !!r.modern && !!r.aria, r);
  check('ungraded row (방점): 알아 두기 + 채점하지 않아요, no inputs', r.know && r.know.mark && r.know.ns && r.know.radios === 0 && !r.know.pick, r.know);
  check('first row active; its 15th-c example marked ◇; 훈몽자회 알아 두기 card', r.active === 'nom' && r.ex15 === 'e.ne' && r.note, r);
  check('submit disabled until every graded row has a status', r.submit === true);

  // ── 근거 고르기: 줄 켜기 → 낱말, 키보드, 칩으로 빼기 ──
  await page.click(word('s.i'));
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { chips: [...w.querySelectorAll('.tn-row[data-row="nom"] .tn-chip')].map(c => c.getAttribute('data-word')).join(), pressed: w.querySelector('.tn-page16 [data-word="s.i"]').getAttribute('aria-pressed') }; }, TOP);
  check('tapping a 16th-c word adds evidence chip to the active row', r.chips === 's.i' && r.pressed === 'true', r);
  await pickRow(page, 'cut');
  await page.focus(word('s.mom1'));
  await page.keyboard.press('Enter');
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { cut: [...w.querySelectorAll('.tn-row[data-row="cut"] .tn-chip')].map(c => c.getAttribute('data-word')).join(), siPressed: w.querySelector('.tn-page16 [data-word="s.i"]').getAttribute('aria-pressed'), ex15: [...w.querySelectorAll('.tn-page15 .is-example')].map(e => e.getAttribute('data-word')).join() }; }, TOP);
  check('keyboard: switch row, Enter on word adds to that row; pressed state follows the active row', r.cut === 's.mom1' && r.siPressed === 'false' && r.ex15 === 'e.mom', r);
  await page.click(row('cut', '.tn-chip[data-word="s.mom1"]'));
  check('clicking a chip removes the evidence', await page.evaluate((sel) => !document.querySelector(sel + ' .tn-row[data-row="cut"] .tn-chip'), TOP));

  // ── 1번째 틀림 ──
  await fill(page, {
    nom: { status: 'kept' },
    cut: { status: 'shaky', evidence: ['s.mom1', 's.geosira'] },
    vh: { status: 'kept' },
    ga: { status: 'none' },
    araea: { status: 'shaky' }
  });
  check('submit enabled after statuses', await page.evaluate((sel) => !document.querySelector(sel + ' .tn-submit').disabled, TOP));
  await page.click(S('.tn-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const rowWrong = (id) => w.querySelector(`.tn-row[data-row="${id}"]`).classList.contains('is-wrong');
    return {
      nom: rowWrong('nom'), ga: rowWrong('ga'),
      cut: rowWrong('cut') && !!w.querySelector('.tn-row[data-row="cut"] .tn-chip[data-word="s.geosira"].is-wrong') && !w.querySelector('.tn-row[data-row="cut"] .tn-chip[data-word="s.mom1"].is-wrong'),
      vh: rowWrong('vh') && !!w.querySelector('.tn-row[data-row="vh"] .g789-opt[data-opt="kept"].is-wrong'),
      vhSym: (w.querySelector('.tn-row[data-row="vh"] .g789-opt.is-wrong .g789-sym') || {}).textContent,
      araea: rowWrong('araea') && !!w.querySelector('.tn-row[data-row="araea"] .tn-chips-empty.is-wrong'),
      hint: (w.querySelector('.nm-st-hint') || {}).textContent || ''
    };
  }, TOP);
  check('wrong submit → wrong status ✕, rejected evidence chip ✕, missing evidence ✕; right rows clean', !r.nom && !r.ga && r.cut && r.vh && r.vhSym === '✕' && r.araea, r);
  check('hint 1 shown, state open', r.hint.includes('시험 힌트') && (await H.state(page, 's10', 's10.t1')) === 'open', r);

  // 근거 칩을 고치면 그 줄의 근거 틀림 표시가 사라진다 → 다시 틀리게 제출(vh·araea 그대로)
  await page.click(row('cut', '.tn-chip[data-word="s.geosira"]'));
  check('fixing evidence clears that row mark', await page.evaluate((sel) => !document.querySelector(sel + ' .tn-row[data-row="cut"]').classList.contains('is-wrong'), TOP));
  await page.click(S('.tn-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      row: w.querySelector('.tn-row[data-row="araea"]').classList.contains('is-hint'),
      active: w.querySelector('.tn-row.is-active').getAttribute('data-row'),
      cue: [...w.querySelectorAll('.tn-page15 [data-cue="1"]')].map(e => e.getAttribute('data-word')).join(),
      extra: w.querySelector('.tn-page16 .tn-extra').classList.contains('is-hint'),
      blocksHint: w.querySelectorAll('.tn-page16 .g789-orig.is-hint').length,
      wordRevealed: !!w.querySelector('.tn-page16 [data-word="x.saheul"].is-cue')
    };
  }, TOP);
  check('2nd wrong → actual wrong rows emphasized, first wrong row active, corresponding evidence areas glowed', r.row && r.active === 'vh' && r.cue.includes('e.mom') && r.cue.includes('e.buteo') && r.cue.includes('e.saal') && r.extra && r.blocksHint > 0 && !r.wordRevealed, r);
  check('state open after 2nd wrong', (await H.state(page, 's10', 's10.t1')) === 'open');

  await page.click(S('.tn-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      st: [...w.querySelectorAll('.tn .g789-opt.is-answer')].map(l => l.closest('.tn-row').getAttribute('data-row') + ':' + l.getAttribute('data-opt')).join(),
      cut: [...w.querySelectorAll('.tn-row[data-row="cut"] .tn-chip.is-answer')].map(c => c.getAttribute('data-word')).join(),
      locked: [...w.querySelectorAll('.tn input, .tn button.g789-word, .tn-chip, .tn-pick')].every(i => i.disabled), hidden: w.querySelector('.tn-submit').hidden,
      wrong: w.querySelectorAll('.tn .is-wrong').length
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await H.state(page, 's10', 's10.t1')) === 'doneByHelp');
  check('answer shown: statuses ○ and answer evidence chips, all locked', r.st === 'nom:kept,cut:shaky,vh:shaky,ga:none,araea:shaky' && r.cut === 's.mom1,s.eolgul,s.machm' && r.locked && r.hidden && r.wrong === 0, r);
  await page.click(TOP + ' .nm-st-close');
  await page.waitForTimeout(50);
  await H.openTask(page, 's10.t1');
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { n: w.querySelectorAll('.tn .g789-opt.is-answer').length, chips: w.querySelectorAll('.tn-chip.is-answer').length, locked: [...w.querySelectorAll('.tn input, .tn button.g789-word, .tn-chip')].every(i => i.disabled) }; }, TOP);
  check('reopen done task → answer read-only', r.n === 5 && r.chips === 6 && r.locked, r);
  let errs = await H.errors(page);
  check('no NM errors (help path)', errs.length === 0, errs);
  await page.close();

  // ── 바른 제출 → done (고1, 선택 장면) ──
  page = await H.open(context, PAGE, 'stage=s10&level=h1&reset=1');
  await H.openTask(page, 's10.t1');
  await fill(page, RIGHT);
  await page.click(S('.tn-submit'));
  check('correct submission → done (h1)', (await H.state(page, 's10', 's10.t1')) === 'done');
  check('done: locked, no wrong marks', await page.evaluate((sel) => { const w = document.querySelector(sel); return [...w.querySelectorAll('.tn input')].every(i => i.disabled) && !w.querySelector('.tn .is-wrong'); }, TOP));
  errs = await H.errors(page);
  check('no NM errors (correct path)', errs.length === 0, errs);
  await page.close();
  await context.close();

  const phone = await H.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true });
  page = await H.open(phone, PAGE, 'stage=s10&level=h23&reset=1');
  await H.openTask(page, 's10.t1');
  await page.click(word('s.i'));
  const fit = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const tn = w.querySelector('.tn');
    const small = [...w.querySelectorAll('.tn .g789-face, .tn button.g789-word, .tn-chip, .tn-pick')].filter(f => f.getBoundingClientRect().height < 43.5).length;
    const p15 = w.querySelector('.tn-page15').getBoundingClientRect(), p16 = w.querySelector('.tn-page16').getBoundingClientRect();
    return { sw: document.documentElement.scrollWidth, vw: innerWidth, w: tn.scrollWidth, c: tn.clientWidth, small, stacked: p16.top >= p15.bottom - 1 };
  }, TOP);
  check('phone 360px: pages stacked, no horizontal scroll, touch targets ≥ 44px', fit.sw <= fit.vw && fit.w <= fit.c + 1 && fit.small === 0 && fit.stacked, fit);
  await page.close();
  await phone.close();
} catch (e) { H.fail(e); }
await H.finish();
