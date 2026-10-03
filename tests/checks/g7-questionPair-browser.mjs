// G7 질문 짝 맞추기 브라우저 점검: 진짜 장면 진행기 안(tests/pages/g-questionPair.html + 시험 장면 s8)에서
// 그리기(原文 DOM·NMYet·낭독용 현대 표기) / 다 골라야 제출 / 틀림 → 틀린 묶음 ✕ 표시·상태 open /
// 2번째 틀림 → 단서 낱말 빛남(showHint 2) / 3번째 → doneByHelp + 정답 / 다시 열기 → 읽기 전용 정답 /
// 바른 제출 → done / 키보드(Tab·화살표·Space·Enter) / 좁은 화면 가로 스크롤 없음 / 오류·콘솔 오류·외부 요청 0
import { harness, TOP } from '../lib/g789-harness.mjs';

const H = await harness('g7-questionPair-browser');
const { check } = H;
const PAGE = 'g-questionPair.html';
const Q = (q, rest = '') => `${TOP} .qp-q[data-q="${q}"] ${rest}`;
const opt = (q, field, val) => Q(q, `.qp-step[data-field="${field}"] .g789-opt[data-opt="${val}"]`);
async function pick(page, ans) {
  for (const q of Object.keys(ans)) for (const f of Object.keys(ans[q])) await page.click(opt(q, f, ans[q][f]));
}
const RIGHT = {
  q1: { pair: 'a1', kind: 'second', ending: 'nda' },
  q2: { pair: 'a2', kind: 'wh', ending: 'go' },
  q3: { pair: 'a3', kind: 'yesno', ending: 'ga' }
};

try {
  const context = await H.browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  let page = await H.open(context, PAGE, 'stage=s8&level=h23&reset=1');
  await H.openTask(page, 's8.t1');
  const r = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const qp = w.querySelector('.qp');
    const line = w.querySelector('.qp-q .g789-line');
    const vis = line && line.querySelector('.g789-vis');
    return {
      qs: qp ? qp.querySelectorAll('.qp-q').length : 0,
      answers: qp ? qp.querySelectorAll('.qp-answer').length : 0,
      words: [...w.querySelectorAll('.qp-q [data-word]')].map(e => e.getAttribute('data-word')).join(),
      modern: line && line.getAttribute('data-modern'), sr: !!(line && line.querySelector('.nm-sr')),
      font: vis ? getComputedStyle(vis).fontFamily : '', canvas: !!w.querySelector('canvas'),
      seal: w.querySelectorAll('.qp-q .nm-mark-orig').length,
      submitDisabled: w.querySelector('.qp-submit').disabled, bj: !!w.querySelector('.qp-q .nm-bj')
    };
  }, TOP);
  check('task renders 3 questions + 3 answer cards inside the stage runner', r.qs === 3 && r.answers === 3, r);
  check('原文 as DOM (NMYet, no canvas, 原文 seal, modern reading for screen readers)', /NMYet/.test(r.font) && !r.canvas && r.seal === 3 && !!r.modern && r.sr && r.bj, r);
  check('config words found in 原文 (cue/ending spans)', r.words === 'q1.you,q1.end,q2.wh,q2.end,q3.end', r.words);
  check('submit disabled until everything is chosen', r.submitDisabled === true);

  // ── 1번째 틀림: q2 의 갈래만 틀리게 ──
  const wrong1 = JSON.parse(JSON.stringify(RIGHT)); wrong1.q2.kind = 'yesno';
  await pick(page, wrong1);
  check('submit enabled when all chosen', await page.evaluate((sel) => !document.querySelector(sel + ' .qp-submit').disabled, TOP));
  await page.click(TOP + ' .qp-submit');
  let m = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const g = w.querySelector('.qp-q[data-q="q2"] .qp-step[data-field="kind"] .g789-radios');
    const lab = w.querySelector('.qp-q[data-q="q2"] .g789-opt[data-opt="yesno"]');
    return {
      groupWrong: g.classList.contains('is-wrong') && g.getAttribute('data-wrong') === '1',
      labWrong: lab.classList.contains('is-wrong'), sym: lab.querySelector('.g789-sym').textContent,
      others: w.querySelectorAll('.g789-radios.is-wrong').length, cardWrong: w.querySelector('.qp-q[data-q="q2"]').classList.contains('is-wrong'),
      hint: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent, cue: w.querySelectorAll('.is-cue').length
    };
  }, TOP);
  check('wrong submit → wrong group marked (is-wrong + ✕ symbol), only that one', m.groupWrong && m.labWrong && m.sym === '✕' && m.others === 1 && m.cardWrong, m);
  check('hint 1 from runner, no cue emphasis yet', !!m.hint && m.hint.includes('시험 힌트') && m.cue === 0, m);
  check('state stays open after 1st wrong', (await H.state(page, 's8', 's8.t1')) === 'open');

  // ── 키보드: q2 갈래 묶음에서 화살표로 바꾸면 틀림 표시가 지워진다 ──
  await page.focus(Q('q2', '.qp-step[data-field="kind"] input[value="yesno"]'));
  await page.keyboard.press('ArrowDown');
  const kb = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const ch = w.querySelector('.qp-q[data-q="q2"] .qp-step[data-field="kind"] input:checked');
    return { val: ch && ch.value, focusIn: !!document.activeElement.closest(sel), cleared: !w.querySelector('.qp-q[data-q="q2"] .g789-radios.is-wrong') };
  }, TOP);
  check('keyboard: arrow key moves the radio choice (native radio), wrong mark cleared', kb.val === 'wh' && kb.focusIn && kb.cleared, kb);
  // 2번째 틀림: q3 어미를 틀리게(키보드 Space 로 고르고 Enter 로 제출)
  await page.focus(Q('q3', '.qp-step[data-field="ending"] input[value="go"]'));
  await page.keyboard.press('Space');
  await page.focus(TOP + ' .qp-submit');
  await page.keyboard.press('Enter');
  m = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const cue = w.querySelector('.qp-q[data-q="q3"] [data-ending="1"]');
    return {
      hintCard: w.querySelector('.qp-q[data-q="q3"]').classList.contains('is-hint') && !w.querySelector('.qp-q[data-q="q2"]').classList.contains('is-hint'),
      cue: cue && cue.classList.contains('is-ending'),
      tag: (w.querySelector('.qp-q[data-q="q3"] .qp-cue-tags') || {}).textContent || '',
      endWrong: !!w.querySelector('.qp-q[data-q="q3"] .qp-step[data-field="ending"] .g789-radios.is-wrong'),
      fix: !!w.querySelector('.nm-st-fix')
    };
  }, TOP);
  check('2nd wrong (keyboard submit) → actual wrong question and ending emphasized, correct question left clean', m.hintCard && m.cue && m.tag.includes('◇') && m.fix, m);
  check('2nd wrong → the new wrong part marked', m.endWrong, m);
  check('state still open after 2nd wrong', (await H.state(page, 's8', 's8.t1')) === 'open');

  // ── 3번째 틀림 → doneByHelp + 정답 ──
  await page.click(opt('q1', 'pair', 'a3'));
  await page.click(TOP + ' .qp-submit');
  m = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      answers: w.querySelectorAll('.g789-opt.is-answer').length,
      checkedRight: [...w.querySelectorAll('.g789-opt.is-answer input')].every(i => i.checked),
      disabled: [...w.querySelectorAll('.qp input')].every(i => i.disabled),
      tag: w.querySelectorAll('.g789-opt.is-answer .g789-tag').length,
      submitHidden: w.querySelector('.qp-submit').hidden,
      explain: (w.querySelector('.nm-card[data-mark="explain"]') || {}).textContent || ''
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await H.state(page, 's8', 's8.t1')) === 'doneByHelp');
  check('answer shown: 9 answer options (○ + 정답 tag), locked, explanation', m.answers === 9 && m.checkedRight && m.disabled && m.tag === 9 && m.submitHidden && m.explain.includes('시험 풀이'), m);

  // ── 다시 열기: 읽기 전용 정답 ──
  await page.click(TOP + ' .nm-st-close');
  await page.waitForTimeout(50);
  await H.openTask(page, 's8.t1');
  m = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { answers: w.querySelectorAll('.g789-opt.is-answer').length, disabled: [...w.querySelectorAll('.qp input')].every(i => i.disabled), submitHidden: w.querySelector('.qp-submit').hidden };
  }, TOP);
  check('reopen done task → answer shown read-only', m.answers === 9 && m.disabled && m.submitHidden, m);
  await page.click(TOP + ' .nm-st-close');
  await page.waitForTimeout(50);

  // ── 대답 카드 없는 과제(짝 단계 없음) + 주어가 앞 구절에 있는 물음 ──
  await H.openTask(page, 's8.t2');
  m = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { pair: w.querySelectorAll('.qp-step[data-field="pair"]').length, blocks: [...w.querySelectorAll('.qp-q .g789-orig')].map(b => b.getAttribute('data-block')).join(), you: !!w.querySelector('.g789-orig[data-block="O-s6-SS6e"] [data-word="q1.you"]'), end: !!w.querySelector('.g789-orig[data-block="O-s8-SS6f"] [data-word="q1.end"]') };
  }, TOP);
  check('no answer cards → no pair step; words located per block', m.pair === 0 && m.blocks === 'O-s6-SS6e,O-s8-SS6f' && m.you && m.end, m);
  await page.click(opt('q1', 'kind', 'second'));
  await page.click(opt('q1', 'ending', 'nda'));
  await page.click(TOP + ' .qp-submit');
  check('t2 correct → done', (await H.state(page, 's8', 's8.t2')) === 'done');
  let errs = await H.errors(page);
  check('no NM errors (help path)', errs.length === 0, errs);
  await page.close();

  // ── 바른 제출 → done ──
  page = await H.open(context, PAGE, 'stage=s8&level=h23&reset=1');
  await H.openTask(page, 's8.t1');
  await pick(page, RIGHT);
  await page.click(TOP + ' .qp-submit');
  check('correct submission → done', (await H.state(page, 's8', 's8.t1')) === 'done');
  check('done: inputs locked, no wrong marks', await page.evaluate((sel) => { const w = document.querySelector(sel); return [...w.querySelectorAll('.qp input')].every(i => i.disabled) && !w.querySelector('.is-wrong'); }, TOP));
  errs = await H.errors(page);
  check('no NM errors (correct path)', errs.length === 0, errs);
  await page.close();
  await context.close();

  // ── 좁은 화면 ──
  const phone = await H.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true });
  page = await H.open(phone, PAGE, 'stage=s8&level=h23&reset=1');
  await H.openTask(page, 's8.t1');
  const fit = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const qp = w.querySelector('.qp');
    const small = [...w.querySelectorAll('.qp .g789-face')].filter(f => f.getBoundingClientRect().height < 43.5).length;
    return { sw: document.documentElement.scrollWidth, vw: innerWidth, qpW: qp.scrollWidth, qpC: qp.clientWidth, small };
  }, TOP);
  check('phone 360px: no horizontal scroll, touch targets ≥ 44px', fit.sw <= fit.vw && fit.qpW <= fit.qpC + 1 && fit.small === 0, fit);
  await page.close();
  await phone.close();
} catch (e) { H.fail(e); }
await H.finish();
