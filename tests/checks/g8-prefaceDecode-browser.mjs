// G8 종합 해독 브라우저 점검: 진짜 장면 진행기 안(tests/pages/g-prefaceDecode.html + 시험 장면 s9)에서
// 고등판(h1): 구절 쪽 넘기기, 규칙 카드(수첩에 있음/없음 — '아직 확인하지 않은 규칙' + 배우는 장면, 막지 않음),
//   낱말 풀기·조각 놓기(키보드 Enter)·정신 찾기 / 틀림 → 틀린 곳 ✕·is-wrong·구절 단추 ✕, open /
//   2번째 → 原文 낱말 ◆ 빛남 / 3번째 → doneByHelp + 정답 / 다시 열기 → 읽기 전용 / config.mode 'modern' 과제 바른 제출 → done
// 중학교판(m): 같은 항목이 현대어 서문 정신 찾기만(原文 없음, 풀이 표지) — 틀림 표시, 바른 제출 → done
// 좁은 화면 가로 스크롤 없음 / 오류·콘솔 오류·외부 요청 0
import { harness, TOP } from '../lib/g789-harness.mjs';

const H = await harness('g8-prefaceDecode-browser');
const { check } = H;
const PAGE = 'g-prefaceDecode.html';
const S = (rest) => `${TOP} .pd ${rest}`;
const radio = (scope, val) => S(`${scope} .g789-opt[data-opt="${val}"]`);
const dec = (word, card) => radio(`.pd-dec[data-word="${word}"]`, card);
const sp = (pid, val) => radio(`.pd-sp[data-phrase="${pid}"]`, val);
const pool = (pid, k) => S(`.pd-pool[data-phrase="${pid}"] .pd-piece[data-piece="${k}"]`);
const nav = (pid) => S(`.pd-nav-btn[data-page="${pid}"]`);

async function seedKnown(context) {
  const page = await context.newPage();
  H.watch(page);
  await page.goto(H.server.url + 'tests/pages/' + PAGE + '?idle=1');
  const rec = { v: 1, level: 'h1', protagonist: 1, nickname: '', settings: { bangjeom: true, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true }, prologueDone: true,
    progress: { h1: { s6: { status: 'progress', items: {}, rules: ['rule.g8known'], translations: [], reflection: '' } } }, glyphs: {}, seenNotices: [] };
  await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('naratmalssami:v1', s); }, JSON.stringify(rec));
  await page.close();
}
async function fillHigh(page, a) {
  await page.click(nav('p1'));
  await page.click(dec('p1.w1', a.w1)); await page.click(dec('p1.w2', a.w2));
  for (const k of a.p1) await page.click(pool('p1', k));
  await page.click(nav('p2'));
  await page.click(dec('p2.w1', 'p2.w1.a'));
  for (const k of a.p2) await page.click(pool('p2', k));
  await page.click(nav('#spirits'));
  await page.click(sp('p1', 'jaju')); await page.click(sp('p2', a.sp2));
}

try {
  const context = await H.browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await seedKnown(context);
  let page = await H.open(context, PAGE, 'stage=s9&level=h1');
  await H.openTask(page, 's9.t1');
  let r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const pd = w.querySelector('.pd');
    const vis = (q) => { const e = w.querySelector(q); return !!e && !e.hidden && e.offsetParent !== null; };
    const known = w.querySelector('.pd-rule[data-rule="rule.g8known"]');
    const unk = w.querySelector('.pd-rule[data-rule="rule.g8unknown"]');
    return {
      mode: pd && pd.getAttribute('data-mode'), nav: [...w.querySelectorAll('.pd-nav-btn')].map(b => b.getAttribute('data-page')).join(),
      p1: vis('.pd-phrase[data-phrase="p1"]'), p2: vis('.pd-phrase[data-phrase="p2"]'), spirits: vis('.pd-spirits'),
      current: (w.querySelector('.pd-nav-btn[aria-current="step"]') || {}).textContent,
      known: known && { k: known.getAttribute('data-known'), text: known.textContent },
      unk: unk && { k: unk.getAttribute('data-known'), text: unk.textContent, dashed: !!unk.querySelector('.nm-mark-unknown') },
      unkEnabled: [...w.querySelectorAll('.pd-dec[data-word="p1.w2"] input')].every(i => !i.disabled),
      words: [...w.querySelectorAll('.pd-phrase[data-phrase="p1"] .g789-orig [data-word]')].map(e => e.getAttribute('data-word')).join(),
      decWord: (w.querySelector('.pd-dec[data-word="p1.w1"] .pd-dec-word .nm-sr') || {}).textContent,
      hanmun: !!w.querySelector('.pd-phrase[data-phrase="p1"] details.pd-hanmun .g789-orig[data-block="O-s9-HANMUN1"]'),
      font: getComputedStyle(w.querySelector('.pd-phrase .g789-vis')).fontFamily,
      submit: w.querySelector('.pd-submit').disabled
    };
  }, TOP);
  check('decode mode at h1: nav = 2 phrases + spirit page, first phrase shown', r.mode === 'decode' && r.nav === 'p1,p2,#spirits' && r.p1 && !r.p2 && !r.spirits && /1/.test(r.current), r);
  check('collected rule card shown with name and sentence', r.known && r.known.k === '1' && r.known.text.includes('규칙 카드') && r.known.text.includes('시험 규칙 가') && r.known.text.includes('시험 규칙 가의 문장'), r.known);
  check("missing rule → '아직 확인하지 않은 규칙' + card name + teaching stage, not blocking", r.unk && r.unk.k === '0' && r.unk.dashed && r.unk.text.includes('아직 확인하지 않은 규칙') && r.unk.text.includes('시험 규칙 나') && r.unk.text.includes('4') && r.unkEnabled, r.unk);
  check('原文 words found, NMYet DOM, decode word with modern reading, 한문 블록 folded', r.words === 'p1.w1,p1.w2' && /NMYet/.test(r.font) && !!r.decWord && r.hanmun, r);
  check('submit disabled until all done', r.submit === true);

  // ── 키보드로 조각 놓기(Enter), 놓은 조각 되돌리기 ──
  await page.focus(pool('p1', 'p1.k2'));
  await page.keyboard.press('Enter');
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { tray: [...w.querySelectorAll('.pd-tray[data-phrase="p1"] .pd-piece')].map(b => b.getAttribute('data-piece')).join(), focusIn: !!document.activeElement.closest('.pd-pool[data-phrase="p1"], .pd-tray[data-phrase="p1"]') };
  }, TOP);
  check('keyboard Enter places a piece; focus stays in the piece area', r.tray === 'p1.k2' && r.focusIn, r);
  await page.focus(S('.pd-tray[data-phrase="p1"] .pd-piece[data-piece="p1.k2"]'));
  await page.keyboard.press('Enter');
  check('Enter on a placed piece returns it to the pool', await page.evaluate((sel) => !document.querySelector(sel + ' .pd-tray[data-phrase="p1"] .pd-piece') && !!document.querySelector(sel + ' .pd-pool[data-phrase="p1"] .pd-piece[data-piece="p1.k2"]'), TOP));

  // ── 1번째 틀림: p1.w2 뜻, p1 조각 차례, p2 정신 ──
  await fillHigh(page, { w1: 'p1.w1.a', w2: 'p1.w2.b', p1: ['p1.k2', 'p1.k1'], p2: ['p2.k1', 'p2.k2'], sp2: 'silyong' });
  check('submit enabled when everything is filled', await page.evaluate((sel) => !document.querySelector(sel + ' .pd-submit').disabled, TOP));
  await page.click(S('.pd-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const navSym = (p) => w.querySelector(`.pd-nav-btn[data-page="${p}"] .pd-nav-sym`).textContent;
    return {
      decWrong: w.querySelector('.pd-dec[data-word="p1.w2"]').classList.contains('is-wrong') && !!w.querySelector('.pd-dec[data-word="p1.w2"] .g789-opt.is-wrong'),
      decOk: !w.querySelector('.pd-dec[data-word="p1.w1"]').classList.contains('is-wrong'),
      trayWrong: [...w.querySelectorAll('.pd-tray[data-phrase="p1"] .pd-piece.is-wrong')].map(b => b.getAttribute('data-pos')).join(),
      spWrong: w.querySelector('.pd-sp[data-phrase="p2"]').classList.contains('is-wrong'), spOk: !w.querySelector('.pd-sp[data-phrase="p1"]').classList.contains('is-wrong'),
      nav: [navSym('p1'), navSym('p2'), navSym('#spirits')].join(''),
      shown: !w.querySelector('.pd-phrase[data-phrase="p1"]').hidden,
      hint: (w.querySelector('.nm-st-hint') || {}).textContent || ''
    };
  }, TOP);
  check('wrong submit → wrong decode card, wrong piece positions, wrong spirit marked; right ones not', r.decWrong && r.decOk && r.trayWrong === '0,1' && r.spWrong && r.spOk, r);
  check('phrase buttons show ✕ / ● and jump to the first wrong phrase; hint 1 shown', r.nav === '✕●✕' && r.shown && r.hint.includes('시험 힌트'), r);
  check('state open after 1st wrong', (await H.state(page, 's9', 's9.t1')) === 'open');

  // 조각 차례만 고쳐 다시 틀리게 제출(뜻 카드는 그대로 틀림) → 2번째 틀림
  await page.click(S('.pd-tray[data-phrase="p1"] .pd-piece[data-piece="p1.k2"]'));
  await page.click(pool('p1', 'p1.k2'));
  check('changing the tray clears its wrong marks', await page.evaluate((sel) => !document.querySelector(sel + ' .pd-tray[data-phrase="p1"] .is-wrong'), TOP));
  await page.click(S('.pd-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const cue = w.querySelector('.pd-phrase[data-phrase="p1"] .g789-orig [data-word="p1.w2"]');
    return { cue: cue && cue.classList.contains('is-cue') && cue.getAttribute('data-cue') === '1', row: w.querySelector('.pd-dec[data-word="p1.w2"]').classList.contains('is-hint'), other: !!w.querySelector('.pd-phrase[data-phrase="p1"] .g789-orig [data-word="p1.w1"].is-cue'), shown: !w.querySelector('.pd-phrase[data-phrase="p1"]').hidden };
  }, TOP);
  check('2nd wrong → showHint(2,"p1"): the wrong word glows (◆) in 原文 and its decode row', r.cue && r.row && !r.other && r.shown, r);
  check('state open after 2nd wrong', (await H.state(page, 's9', 's9.t1')) === 'open');

  // 3번째 틀림 → doneByHelp
  await page.click(S('.pd-submit'));
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      decAns: [...w.querySelectorAll('.pd-dec .g789-opt.is-answer')].map(l => l.getAttribute('data-opt')).join(),
      tray1: [...w.querySelectorAll('.pd-tray[data-phrase="p1"] .pd-piece.is-answer')].map(b => b.getAttribute('data-piece')).join(),
      spAns: [...w.querySelectorAll('.pd-sp .g789-opt.is-answer')].map(l => l.getAttribute('data-opt')).join(),
      locked: [...w.querySelectorAll('.pd input, .pd-piece')].every(i => i.disabled), submitHidden: w.querySelector('.pd-submit').hidden,
      wrongLeft: w.querySelectorAll('.pd .is-wrong').length,
      explain: (w.querySelector('.nm-card[data-mark="explain"]') || {}).textContent || ''
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await H.state(page, 's9', 's9.t1')) === 'doneByHelp');
  check('answer shown: right cards (○ 정답), pieces in right order, spirits, all locked', r.decAns === 'p1.w1.a,p1.w2.a,p2.w1.a' && r.tray1 === 'p1.k1,p1.k2' && r.spAns === 'jaju,aemin' && r.locked && r.submitHidden && r.wrongLeft === 0 && r.explain.includes('시험 풀이'), r);

  await page.click(TOP + ' .nm-st-close');
  await page.waitForTimeout(50);
  await H.openTask(page, 's9.t1');
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { n: w.querySelectorAll('.pd .g789-opt.is-answer').length, locked: [...w.querySelectorAll('.pd input, .pd-piece')].every(i => i.disabled), hidden: w.querySelector('.pd-submit').hidden }; }, TOP);
  check('reopen done task → answer shown read-only', r.n === 5 && r.locked && r.hidden, r);
  await page.click(TOP + ' .nm-st-close');
  await page.waitForTimeout(50);

  // config.mode 'modern' (고등판에서도 정신 찾기만), label 이 데이터 표기
  await H.openTask(page, 's9.t2');
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { mode: w.querySelector('.pd').getAttribute('data-mode'), orig: w.querySelectorAll('.pd .g789-orig').length, bold: !!w.querySelector('.pd-seg .g789-opt[data-opt="jaju"] strong'), opts: w.querySelectorAll('.pd-seg .g789-opt').length }; }, TOP);
  check("config.mode 'modern' → spirit-only view (no 原文), label markup rendered", r.mode === 'modern' && r.orig === 0 && r.bold && r.opts === 3, r);
  await page.click(radio('.pd-seg[data-seg="m1"]', 'jaju'));
  await page.click(S('.pd-submit'));
  check('modern task correct → done', (await H.state(page, 's9', 's9.t2')) === 'done');
  let errs = await H.errors(page);
  check('no NM errors (h1 run)', errs.length === 0, errs);
  await page.close();

  // ── 중학교판 ──
  page = await H.open(context, PAGE, 'stage=s9&level=m&reset=1');
  await H.openTask(page, 's9.t1');
  r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { mode: w.querySelector('.pd').getAttribute('data-mode'), orig: w.querySelectorAll('.pd .g789-orig').length, segs: w.querySelectorAll('.pd-seg').length, mark: (w.querySelector('.pd-modern .nm-mark-explain') || {}).textContent, howto: w.querySelector('.pd-howto').textContent, nav: w.querySelectorAll('.pd-nav-btn').length };
  }, TOP);
  check('level m → modern preface spirit finding only (no 原文 decoding), 풀이 mark, level text', r.mode === 'modern' && r.orig === 0 && r.segs === 3 && r.mark === '풀이' && r.howto.includes('현대어 서문') && r.nav === 0, r);
  await page.click(radio('.pd-seg[data-seg="m1"]', 'jaju'));
  await page.click(radio('.pd-seg[data-seg="m2"]', 'silyong'));
  await page.focus(S('.pd-seg[data-seg="m3"] input[value="none"]'));
  await page.keyboard.press('Space');
  await page.focus(S('.pd-submit'));
  await page.keyboard.press('Enter');
  r = await page.evaluate((sel) => { const w = document.querySelector(sel); return { m2: w.querySelector('.pd-seg[data-seg="m2"]').classList.contains('is-wrong'), m1: w.querySelector('.pd-seg[data-seg="m1"]').classList.contains('is-wrong'), sym: (w.querySelector('.pd-seg[data-seg="m2"] .g789-opt.is-wrong .g789-sym') || {}).textContent }; }, TOP);
  check('middle: wrong segment marked (✕), right one not; keyboard Space/Enter path', r.m2 && !r.m1 && r.sym === '✕', r);
  check('middle: state open', (await H.state(page, 's9', 's9.t1')) === 'open');
  await page.click(radio('.pd-seg[data-seg="m2"]', 'aemin'));
  await page.click(S('.pd-submit'));
  check('middle: correct → done', (await H.state(page, 's9', 's9.t1')) === 'done');
  errs = await H.errors(page);
  check('no NM errors (m run)', errs.length === 0, errs);
  await page.close();
  await context.close();

  // ── 좁은 화면 ──
  const phone = await H.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true });
  page = await H.open(phone, PAGE, 'stage=s9&level=h1&reset=1');
  await H.openTask(page, 's9.t1');
  for (const k of ['p1.k1', 'p1.k2']) await page.click(pool('p1', k));
  const fit = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const pd = w.querySelector('.pd');
    const small = [...w.querySelectorAll('.pd .g789-face, .pd .pd-piece, .pd .pd-nav-btn')].filter(f => f.offsetParent && f.getBoundingClientRect().height < 43.5).length;
    return { sw: document.documentElement.scrollWidth, vw: innerWidth, w: pd.scrollWidth, c: pd.clientWidth, small };
  }, TOP);
  check('phone 360px: no horizontal scroll, touch targets ≥ 44px', fit.sw <= fit.vw && fit.w <= fit.c + 1 && fit.small === 0, fit);
  await page.close();
  await phone.close();
} catch (e) { H.fail(e); }
await H.finish();
