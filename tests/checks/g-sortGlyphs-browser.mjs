// G1 기믹 sortGlyphs 브라우저 점검 — 진짜 장면 진행기 안(tests/pages/g-sortGlyphs.html + tests/fixtures/g-sortGlyphs.js)
// - 그려짐(흩어진 글자 8개·칸 3개), 키보드로 고르고 놓기
// - 틀린 제출 → 틀린 글자에 × 표시(data-mark="wrong")·과제는 open / 2번째 → 강조 칸(showHint 2) / 3번째 → doneByHelp + 정답 자리 + 도감
// - 도감 결과판: 사라진 4자 + ㅸ, NM.data.DOGAM 이름, 'nm:dogam-open' 사건, data-dogam="open"
// - 끝난 과제 다시 열기 → 읽기 전용으로 정답 / 바로 맞음 → done + 도감
// - 360px 폭 가로 스크롤 없음, 움직임 줄이기, 오류·콘솔 오류·외부 요청 0
import { startKit, TOP } from '../fixtures/g1-browser-kit.mjs';

const K = await startKit('g-sortGlyphs-browser');
const { check } = K;
const pages = [];
try {
  const context = await K.browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  let page = await K.open(context, 'g-sortGlyphs.html', 'stage=s0&level=m&reset=1');
  pages.push(page);
  await page.evaluate(() => { window.__dogam = []; document.addEventListener('nm:dogam-open', e => window.__dogam.push(e.detail)); });

  await K.openTask(page, 's0.t1');
  let v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      gimmick: !!w.querySelector('.nm-st-gimmick[data-gimmick="sortGlyphs"] .nm-gsg'),
      pool: [...w.querySelectorAll('.nm-gsg-pool .nm-gsg-tile')].map(b => b.getAttribute('data-glyph')).join(),
      bins: [...w.querySelectorAll('.nm-gsg-bin')].map(b => b.getAttribute('data-bin')).join(),
      glyphFont: getComputedStyle(w.querySelector('.nm-gsg-glyph')).fontFamily,
      puts: [...w.querySelectorAll('.nm-gsg-put')].every(b => b.disabled),
      submitDisabled: w.querySelector('.nm-gsg-submit').disabled,
      dogamHidden: w.querySelector('.nm-gsg-dogam').hidden,
      tileSize: [w.querySelector('.nm-gsg-tile').offsetWidth, w.querySelector('.nm-gsg-tile').offsetHeight]
    };
  }, TOP);
  check('task window renders the sortGlyphs gimmick', v.gimmick, v);
  check('8 scattered glyphs in the pool, 3 bins', v.pool === 'g,va,z,n,q,bv,araea,ng' && v.bins === 'known,lost,outside', v);
  check('glyphs drawn as DOM text with NMYet font', /NMYet/.test(v.glyphFont), v.glyphFont);
  check('nothing selected → put buttons and submit disabled, 도감 hidden', v.puts && v.submitDisabled && v.dogamHidden, v);
  check('touch targets ≥ 44px', v.tileSize[0] >= 44 && v.tileSize[1] >= 44, v.tileSize);

  // 키보드: 글자에 초점 → Enter(고르기) → 칸 단추에 초점 → Enter(놓기). 놓으면 다음 글자가 골라지고 초점이 간다.
  const wrongPlan = { g: 'known', va: 'known', z: 'known', n: 'known', q: 'lost', bv: 'lost', araea: 'lost', ng: 'lost' };
  async function placeAll(plan, viaKeyboard) {
    for (const [id, bin] of Object.entries(plan)) {
      const sel = await page.evaluate(([sel, id]) => document.querySelector(sel + ` .nm-gsg-tile[data-glyph="${id}"]`).getAttribute('aria-pressed'), [TOP, id]);
      if (sel !== 'true') {
        if (viaKeyboard) { await page.focus(TOP + ` .nm-gsg-tile[data-glyph="${id}"]`); await page.keyboard.press('Enter'); }
        else await page.click(TOP + ` .nm-gsg-tile[data-glyph="${id}"]`);
      }
      if (viaKeyboard) { await page.focus(TOP + ` .nm-gsg-bin[data-bin="${bin}"] .nm-gsg-put`); await page.keyboard.press('Enter'); }
      else await page.click(TOP + ` .nm-gsg-bin[data-bin="${bin}"] .nm-gsg-put`);
    }
  }
  await page.focus(TOP + ' .nm-gsg-tile[data-glyph="g"]');
  await page.keyboard.press('Space');
  v = await page.evaluate((sel) => ({ pressed: document.querySelector(sel + ' .nm-gsg-tile[data-glyph="g"]').getAttribute('aria-pressed'), puts: [...document.querySelectorAll(sel + ' .nm-gsg-put')].every(b => !b.disabled) }), TOP);
  check('keyboard Space selects a glyph (aria-pressed) and enables the put buttons', v.pressed === 'true' && v.puts, v);
  await page.focus(TOP + ' .nm-gsg-bin[data-bin="known"] .nm-gsg-put');
  await page.keyboard.press('Enter');
  v = await page.evaluate((sel) => ({
    inKnown: !!document.querySelector(sel + ' .nm-gsg-bin[data-bin="known"] .nm-gsg-tile[data-glyph="g"]'),
    nextSel: document.querySelector(sel + ' .nm-gsg-tile[aria-pressed="true"]') && document.querySelector(sel + ' .nm-gsg-tile[aria-pressed="true"]').getAttribute('data-glyph'),
    focus: document.activeElement && document.activeElement.getAttribute('data-glyph')
  }), TOP);
  check('keyboard Enter on put places the glyph; next glyph selected and focused', v.inKnown && v.nextSel === 'va' && v.focus === 'va', v);
  await placeAll(Object.fromEntries(Object.entries(wrongPlan).slice(1)), true);
  check('all placed → submit enabled', await page.evaluate((sel) => !document.querySelector(sel + ' .nm-gsg-submit').disabled && document.querySelector(sel + ' .nm-gsg-empty').hidden === false, TOP));

  // 1번째 틀림
  await page.click(TOP + ' .nm-gsg-submit');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const wrong = [...w.querySelectorAll('.nm-gsg-tile[data-mark="wrong"]')].map(b => b.getAttribute('data-glyph')).sort().join();
    const z = w.querySelector('.nm-gsg-tile[data-glyph="z"]');
    return { wrong, flag: z.querySelector('.nm-gsg-flag').textContent, cls: z.classList.contains('is-wrong'), sr: z.textContent,
      hint: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent, win: w.getAttribute('data-win') };
  }, TOP);
  check('1st wrong: wrong glyphs (z, bv) marked immediately with × symbol', v.wrong === 'bv,z' && v.flag === '×' && v.cls && v.win === 'task', v);
  check('1st wrong: hint 1 shown by the runner', v.hint && v.hint.includes('시험 힌트'), v.hint);
  check('task stays open after a wrong submit', (await K.state(page, 's0', 's0.t1')) === 'open');
  // 옮기면 그 글자의 틀림 표시가 지워진다
  await page.click(TOP + ' .nm-gsg-tile[data-glyph="z"]');
  await page.click(TOP + ' .nm-gsg-bin[data-bin="lost"] .nm-gsg-put');
  check('moving a wrong glyph clears its mark', await page.evaluate((sel) => !document.querySelector(sel + ' .nm-gsg-tile[data-glyph="z"]').hasAttribute('data-mark'), TOP));

  // 2번째 틀림 (bv 는 아직 틀림) → 강조
  await page.click(TOP + ' .nm-gsg-submit');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const b = w.querySelector('.nm-gsg-bin[data-bin="outside"]');
    return { binHint: b.classList.contains('is-hint') && b.getAttribute('data-mark') === 'hint', outline: getComputedStyle(b).outlineStyle,
      wrong: [...w.querySelectorAll('.nm-gsg-tile[data-mark="wrong"]')].map(x => x.getAttribute('data-glyph')).join(),
      step: w.querySelector('.nm-st-help').getAttribute('data-step') };
  }, TOP);
  check('2nd wrong: hints[1] target bin (outside) emphasized (showHint 2)', v.binHint && v.outline !== 'none' && v.step === '2', v);
  check('2nd wrong: only bv still marked wrong', v.wrong === 'bv', v);
  check('still open after 2nd wrong', (await K.state(page, 's0', 's0.t1')) === 'open');

  // 3번째 틀림 → doneByHelp
  await page.click(TOP + ' .nm-gsg-submit');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const inBin = (b) => [...w.querySelectorAll(`.nm-gsg-bin[data-bin="${b}"] .nm-gsg-tile`)].map(x => x.getAttribute('data-glyph')).sort().join();
    const d = w.querySelector('.nm-gsg-dogam');
    return {
      known: inBin('known'), lost: inBin('lost'), outside: inBin('outside'),
      answerMarks: w.querySelectorAll('.nm-gsg-tile.is-answer[data-mark="answer"]').length,
      symbol: w.querySelector('.nm-gsg-tile[data-glyph="bv"] .nm-gsg-flag').textContent,
      disabled: [...w.querySelectorAll('.nm-gsg-tile, .nm-gsg-put, .nm-gsg-submit')].every(b => b.disabled),
      explain: w.querySelector('.nm-card[data-mark="explain"]') && w.querySelector('.nm-card[data-mark="explain"]').textContent,
      dogamShown: !d.hidden, dogamAttr: w.querySelector('.nm-gsg').getAttribute('data-dogam'),
      entries: [...d.querySelectorAll('.nm-gsg-dogam-entry')].map(e => e.getAttribute('data-glyph') + ':' + e.getAttribute('data-bin')).join(),
      names: d.textContent
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await K.state(page, 's0', 's0.t1')) === 'doneByHelp');
  check('answer shown: every glyph in its correct bin with ○', v.known === 'g,n,va' && v.lost === 'araea,ng,q,z' && v.outside === 'bv' && v.answerMarks === 8 && v.symbol === '○', v);
  check('answer locks the gimmick + runner explanation', v.disabled && v.explain && v.explain.includes('시험 풀이'), v);
  check('도감 opens: lost 4 + ㅸ listed, data-dogam="open"', v.dogamShown && v.dogamAttr === 'open' && v.entries === 'z:lost,q:lost,araea:lost,ng:lost,bv:outside', v);
  check('도감 uses NM.data.DOGAM names where present', v.names.includes('시험 아래아') && v.names.includes('시험 순경음 비읍'), v.names);
  let ev = await page.evaluate(() => window.__dogam.slice());
  check("'nm:dogam-open' event once with glyphs and DOGAM keys", ev.length === 1 && ev[0].item === 's0.t1' && ev[0].glyphs.join('') === 'ㅿㆆㆍㆁㅸ' && ev[0].keys.join() === 'fixAraea,fixBv' && ev[0].byHelp === true, ev);

  // 다시 열기 → 읽기 전용
  await K.closeTop(page);
  await K.openTask(page, 's0.t1');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { answer: w.querySelectorAll('.nm-gsg-tile.is-answer').length, disabled: [...w.querySelectorAll('.nm-gsg-tile, .nm-gsg-submit')].every(b => b.disabled),
      dogam: !w.querySelector('.nm-gsg-dogam').hidden, status: w.querySelector('.nm-st-taskstatus').getAttribute('data-result') };
  }, TOP);
  check('reopened done task shows the answer read-only (+ 도감)', v.answer === 8 && v.disabled && v.dogam && v.status === 'help', v);
  ev = await page.evaluate(() => window.__dogam.slice());
  check('reopen event marked reopened', ev.length === 2 && ev[1].reopened === true, ev);
  await K.closeTop(page);

  // 바로 맞음 (기본 묶음, 마우스)
  await K.openTask(page, 's0.t2');
  await placeAll({ g: 'known', va: 'known', z: 'lost', n: 'known', eu: 'known', q: 'lost', m: 'known', bv: 'outside', vo: 'known', araea: 'lost', s: 'known', ng: 'lost', o: 'known' }, false);
  await page.click(TOP + ' .nm-gsg-submit');
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return { state: w.querySelector('.nm-gsg').getAttribute('data-state'), dogam: !w.querySelector('.nm-gsg-dogam').hidden,
      wrong: w.querySelectorAll('[data-mark="wrong"]').length, locked: w.querySelector('.nm-gsg-submit').disabled };
  }, TOP);
  check('correct first submit → done, gimmick locked, 도감 opens, no wrong marks', (await K.state(page, 's0', 's0.t2')) === 'done' && v.state === 'done' && v.dogam && v.wrong === 0 && v.locked, v);
  ev = await page.evaluate(() => window.__dogam.slice());
  check('done event byHelp false', ev.length === 3 && ev[2].item === 's0.t2' && ev[2].byHelp === false, ev);

  // 360px 폭 + 글자 크기 3단계 + 움직임 줄이기
  const small = await K.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  page = await K.open(small, 'g-sortGlyphs.html', 'stage=s0&level=h1&reset=1');
  pages.push(page);
  await page.evaluate(() => { document.documentElement.style.setProperty('--fs', '1.5'); document.documentElement.classList.add('nm-reduced-motion'); });
  await K.openTask(page, 's0.t1');
  const hs = await K.noHScroll(page);
  check('360px width (font scale 1.5): no horizontal scroll', hs.win <= 1 && hs.doc <= 0, hs);
  v = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel + ' .nm-gsg-tile')).animationName + '|' + getComputedStyle(document.querySelector(sel + ' .nm-gsg-tile')).transform, TOP);
  check('reduced motion: no scatter animation or tilt', v === 'none|none', v);

  await K.finish(pages);
} catch (e) { await K.fail(e); }
