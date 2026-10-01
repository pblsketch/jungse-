// G2 기믹 borrowSort 브라우저 점검 — 진짜 장면 진행기 안(tests/pages/g-borrowSort.html + tests/fixtures/g-borrowSort.js)
// - 原文 줄을 자동 생성 데이터에서 DOM 글자로 그림(原文 낙관, 화면 낭독기 읽기), 해석 글자(東京·良)는 물결 밑줄 + 해석 카드
// - 규칙 카드 부품(o.rulecard)은 한자를 모두 가르기 전에는 잠김 / 키보드(Tab·Enter·화살표)로 고르기
// - 틀린 제출 → 틀린 한자·규칙에 × (data-mark="wrong"), open / 2번째 → 강조(showHint 2) / 3번째 → doneByHelp + 정답 ○ + 如 알아 두기
// - 끝난 과제 다시 열기 → 읽기 전용 / 바로 맞음 → done / 360px 가로 스크롤 없음 / 오류·콘솔 오류·외부 요청 0
import { startKit, TOP } from '../fixtures/g1-browser-kit.mjs';

const K = await startKit('g-borrowSort-browser');
const { check } = K;
const pages = [];
try {
  const context = await K.browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  let page = await K.open(context, 'g-borrowSort.html', 'stage=s1&level=h23&reset=1');
  pages.push(page);
  await K.openTask(page, 's1.t1');
  let v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const lines = [...w.querySelectorAll('.nm-gbs-line')];
    return {
      lines: lines.map(l => l.getAttribute('data-orig') + '#' + l.getAttribute('data-line')).join(),
      seal: lines.every(l => !!l.querySelector('[data-mark="orig"]')),
      firstRow: lines[0].querySelector('.nm-gbs-row').textContent.replace(/뜻|소리/g, ''),
      sr: lines[0].querySelector('.nm-sr').textContent,
      targets: [...w.querySelectorAll('.nm-gbs-cell.is-target')].map(c => c.getAttribute('data-target')).join(),
      interp: [...w.querySelectorAll('.nm-gbs-cell.is-note[data-note="interp"] .nm-gbs-char')].map(c => c.textContent).join(''),
      interpCards: w.querySelectorAll('.nm-gbs-note[data-mark="interp"]').length,
      afterHidden: [...w.querySelectorAll('.nm-gbs-after')].every(a => a.hidden),
      font: getComputedStyle(w.querySelector('.nm-gbs-char')).fontFamily,
      ruleDisabled: [...w.querySelectorAll('.nm-gbs-rule .nm-st-card')].every(b => b.disabled),
      submitDisabled: w.querySelector('.nm-gbs-submit').disabled,
      optH: w.querySelector('.nm-gbs-opt').offsetHeight
    };
  }, TOP);
  check('原文 lines rendered by block id with seal', v.lines === 'O-s1-YEONGDONG#0,O-s1-SEODONG1#0,O-s1-CHEOYONG1#0,O-s1-CHEOYONG1#1' && v.seal, v);
  check('原文 characters come from NM.data.ORIG unchanged', v.firstRow === '永同郡本吉同郡景德王改名今因之' && v.sr.endsWith('永同郡 本吉同郡 景德王改名 今因之'), v);
  check('11 target characters', v.targets === 'yeong,gil,ju,eun,ya,ip,i,yu,haeng,yeo,ga', v.targets);
  check('contested characters (東京, 良) wavy-underlined with 해석 cards, not scored', v.interp === '東京良' && v.interpCards === 2, v);
  check('target notes (如) hidden before the end', v.afterHidden, v);
  check('原文 characters use NMYet font', /NMYet/.test(v.font), v.font);
  check('rule card locked until all characters sorted; submit disabled', v.ruleDisabled && v.submitDisabled, v);
  check('option buttons ≥ 44px tall', v.optH >= 44, v.optH);

  // 키보드: 첫 한자의 '뜻' 단추에 초점 → Enter, 화살표로 '소리'로 바꾸고 다시 '뜻'
  await page.focus(TOP + ' .nm-gbs-cell[data-target="yeong"] .nm-gbs-opt[data-choice="hun"]');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  v = await page.evaluate((sel) => ({ eum: document.querySelector(sel + ' .nm-gbs-cell[data-target="yeong"] .nm-gbs-opt[data-choice="eum"]').getAttribute('aria-checked'), focus: document.activeElement.getAttribute('data-choice') }), TOP);
  check('keyboard: Enter selects, arrow key moves to and selects the other option', v.eum === 'true' && v.focus === 'eum', v);
  await page.keyboard.press('ArrowLeft');
  const marks = { yeong: 'hun', gil: 'hun', ju: 'hun', eun: 'eum', ya: 'hun', ip: 'hun', i: 'eum', yu: 'hun', haeng: 'hun', yeo: 'eum', ga: 'eum' };
  for (const [id, k] of Object.entries(marks).slice(1)) {
    await page.focus(TOP + ` .nm-gbs-cell[data-target="${id}"] .nm-gbs-opt[data-choice="${k}"]`);
    await page.keyboard.press('Space');
  }
  v = await page.evaluate((sel) => ({ rule: [...document.querySelectorAll(sel + ' .nm-gbs-rule .nm-st-card')].every(b => !b.disabled), submit: document.querySelector(sel + ' .nm-gbs-submit').disabled }), TOP);
  check('all sorted → rule card unlocked, submit still needs a rule card', v.rule && v.submit, v);
  await page.focus(TOP + ' .nm-gbs-rule .nm-st-card[data-card="s1.t1.rule.b"]');
  await page.keyboard.press('Enter');
  v = await page.evaluate((sel) => ({ blank: document.querySelector(sel + ' .nm-rulecard-blank').textContent, submit: document.querySelector(sel + ' .nm-gbs-submit').disabled }), TOP);
  check('rule card fills the sentence blank (shared component)', v.blank.includes('소리를, 조사와 어미는') && !v.submit, v);

  // 1번째 틀림: gil, yeo, rule
  await page.click(TOP + ' .nm-gbs-submit');
  const wrongState = () => page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      wrong: [...w.querySelectorAll('.nm-gbs-cell[data-mark="wrong"]')].map(c => c.getAttribute('data-target')).join(),
      flag: w.querySelector('.nm-gbs-cell[data-target="gil"] .nm-gbs-flag') && w.querySelector('.nm-gbs-cell[data-target="gil"] .nm-gbs-flag').textContent,
      rule: w.querySelector('.nm-gbs-rule').getAttribute('data-mark'),
      hintCells: [...w.querySelectorAll('.nm-gbs-cell.is-hint')].map(c => c.getAttribute('data-target')).join(),
      hint: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent,
      step: w.querySelector('.nm-st-help').getAttribute('data-step')
    };
  }, TOP);
  v = await wrongState();
  check('1st wrong: wrong characters and rule marked × immediately', v.wrong === 'gil,yeo' && v.flag === '×' && v.rule === 'wrong', v);
  check('1st wrong: runner hint 1, task open', v.hint && v.hint.includes('시험 힌트') && (await K.state(page, 's1', 's1.t1')) === 'open', v);
  await page.click(TOP + ' .nm-gbs-cell[data-target="gil"] .nm-gbs-opt[data-choice="eum"]');
  check('changing a wrong character clears its mark', await page.evaluate((sel) => !document.querySelector(sel + ' .nm-gbs-cell[data-target="gil"]').hasAttribute('data-mark'), TOP));

  // 2번째 틀림: yeo, rule → hints[1] = 'rule' 강조
  await page.click(TOP + ' .nm-gbs-submit');
  v = await wrongState();
  const ruleCls = await page.evaluate((sel) => { const r = document.querySelector(sel + ' .nm-gbs-rule'); return { hint: r.classList.contains('is-hint'), outline: getComputedStyle(r).outlineStyle }; }, TOP);
  check('2nd wrong: rule section emphasized (showHint 2 target "rule")', ruleCls.hint && ruleCls.outline !== 'none' && v.step === '2', { v, ruleCls });
  check('2nd wrong: 如 still marked wrong, still open', v.wrong === 'yeo' && (await K.state(page, 's1', 's1.t1')) === 'open', v);

  // 3번째 틀림 → doneByHelp
  await page.click(TOP + ' .nm-gbs-submit');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      answers: w.querySelectorAll('.nm-gbs-cell.is-answer[data-mark="answer"]').length,
      yeo: w.querySelector('.nm-gbs-cell[data-target="yeo"] .nm-gbs-opt[aria-checked="true"]').getAttribute('data-choice'),
      sym: w.querySelector('.nm-gbs-cell[data-target="yeo"] .nm-gbs-flag').textContent,
      ruleOk: !!w.querySelector('.nm-gbs-rule .nm-st-card.is-correct[data-card="s1.t1.rule.a"]'),
      ruleMark: w.querySelector('.nm-gbs-rule').getAttribute('data-mark'),
      locked: [...w.querySelectorAll('.nm-gbs-opt, .nm-gbs-submit, .nm-gbs-rule .nm-st-card')].every(b => b.disabled),
      note: [...w.querySelectorAll('.nm-gbs-after:not([hidden]) .nm-gbs-note[data-mark="know"]')].map(n => n.textContent).join(),
      explain: w.querySelector('.nm-card[data-mark="explain"]') && w.querySelector('.nm-card[data-mark="explain"]').textContent
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await K.state(page, 's1', 's1.t1')) === 'doneByHelp');
  check('answer shown: all marks ○, 如 = 뜻, rule card revealed', v.answers === 11 && v.yeo === 'hun' && v.sym === '○' && v.ruleOk && v.ruleMark === 'answer', v);
  check('answer locks inputs; 如 훈가자 알아 두기 appears; runner explanation', v.locked && v.note.includes('훈가자') && v.explain && v.explain.includes('시험 풀이'), v);

  await K.closeTop(page);
  await K.openTask(page, 's1.t1');
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); return { answers: w.querySelectorAll('.nm-gbs-cell.is-answer').length, locked: [...w.querySelectorAll('.nm-gbs-opt, .nm-gbs-submit')].every(b => b.disabled), rule: !!w.querySelector('.nm-gbs-rule .nm-st-card.is-correct') }; }, TOP);
  check('reopened done task: answer read-only', v.answers === 11 && v.locked && v.rule, v);
  await K.closeTop(page);

  // 바로 맞음(규칙 없는 과제)
  await K.openTask(page, 's1.t2');
  await page.click(TOP + ' .nm-gbs-cell[data-target="yeong"] .nm-gbs-opt[data-choice="hun"]');
  await page.click(TOP + ' .nm-gbs-cell[data-target="gil"] .nm-gbs-opt[data-choice="eum"]');
  await page.click(TOP + ' .nm-gbs-submit');
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); return { st: w.querySelector('.nm-gbs').getAttribute('data-state'), locked: w.querySelector('.nm-gbs-submit').disabled, wrong: w.querySelectorAll('[data-mark="wrong"]').length, noRule: !w.querySelector('.nm-gbs-rule') }; }, TOP);
  check('correct first submit → done and locked (no rule section when config.rule is absent)', (await K.state(page, 's1', 's1.t2')) === 'done' && v.st === 'done' && v.locked && v.wrong === 0 && v.noRule, v);

  // 360px
  const small = await K.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  page = await K.open(small, 'g-borrowSort.html', 'stage=s1&level=h23&reset=1');
  pages.push(page);
  await page.evaluate(() => document.documentElement.style.setProperty('--fs', '1.5'));
  await K.openTask(page, 's1.t1');
  const hs = await K.noHScroll(page);
  check('360px width (font scale 1.5): no horizontal scroll', hs.win <= 1 && hs.doc <= 0, hs);

  await K.finish(pages);
} catch (e) { await K.fail(e); }
