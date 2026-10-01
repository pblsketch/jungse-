// G3 기믹 letterForge 브라우저 점검 — 진짜 장면 진행기 안(tests/pages/g-letterForge.html + tests/fixtures/g-letterForge.js)
// - 단면도 SVG(그림 안 글자 없음) + DOM 이름표, 原文 카드, 획 조각 고르기(키보드), 가획 빈 자리, 다르게 만든 글자, 천지인, 합성
// - 틀린 제출 → 틀린 획 흐림·× / 틀린 자리 × / 잘못 고른 글자 × (빠뜨린 글자는 드러내지 않고 '더 있어요'), open
//   2번째 → 강조(showHint 2) / 3번째 → doneByHelp + 정답 ○ / 다시 열기 → 읽기 전용
// - 학교급별 용어: 중학교 '이체' 없음 + 날개 설명, 고등 '이체' + 초출자·재출자 표 / 교사 모드 정답 보기
// - 바로 맞음 → done / 360px 가로 스크롤 없음 / 움직임 줄이기 / 오류·콘솔 오류·외부 요청 0
import { startKit, TOP } from '../fixtures/g1-browser-kit.mjs';

const K = await startKit('g-letterForge-browser', 240000);
const { check } = K;
const pages = [];
const q = (sel) => TOP + ' ' + sel;
try {
  const context = await K.browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  let page = await K.open(context, 'g-letterForge.html', 'stage=s2&level=m&reset=1');
  pages.push(page);
  await K.openTask(page, 's2.t1');
  let v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    const g = w.querySelector('.nm-glf');
    return {
      steps: [...w.querySelectorAll('.nm-glf-step')].map(s => s.getAttribute('data-step')).join(),
      heads: w.querySelectorAll('svg.nm-glf-head').length,
      svgText: w.querySelectorAll('svg text, svg tspan, svg foreignObject').length,
      svgHidden: [...w.querySelectorAll('.nm-glf svg')].every(s => s.getAttribute('aria-hidden') === 'true'),
      hl: [...w.querySelectorAll('svg.nm-glf-head')].map(s => s.getAttribute('data-sound') + (s.querySelector('.nm-glf-hl') ? '+' : '-')).join(),
      cap: w.querySelector('.nm-glf-row[data-part="shape.n"] figcaption').textContent,
      orig: !!w.querySelector('.nm-glf-step[data-step="shape"] .nm-orig[data-orig="O-s2-SANG-G"]'),
      oddTitle: w.querySelector('.nm-glf-step[data-step="odd"] .nm-glf-title').textContent,
      wing: w.querySelector('.nm-glf-step[data-step="odd"] .nm-glf-wing') && w.querySelector('.nm-glf-step[data-step="odd"] .nm-glf-wing').textContent,
      noIche: !g.textContent.includes('이체'), level: g.getAttribute('data-level'),
      submit: w.querySelector('.nm-glf-submit').disabled,
      sizes: [...w.querySelectorAll('.nm-glf-piece, .nm-glf-slot, .nm-glf-traytile, .nm-glf-otile')].map(b => Math.min(b.offsetWidth, b.offsetHeight)).reduce((a, b) => Math.min(a, b), 99)
    };
  }, TOP);
  check('consonant task renders shape → add → odd steps', v.steps === 'shape,add,odd', v.steps);
  check('5 cross-section SVGs, each highlighting its articulator, no text inside drawings', v.heads === 5 && v.svgText === 0 && v.svgHidden && v.hl === 'g+,n+,m+,s+,o+', v);
  check('labels as DOM text (sound name + shape)', v.cap.includes('혓소리') && v.cap.includes('윗잇몸'), v.cap);
  check('step orig block rendered as 原文 card', v.orig, v);
  check("middle school: no term '이체', wing explanation present (no answer names yet)", v.level === 'm' && v.noIche && v.wing && v.wing.includes('날개') && !/[ㆁㄹㅿ]/.test(v.wing) && v.oddTitle.includes('원리'), v);
  check('submit disabled until every part is done; touch targets ≥ 44px', v.submit && v.sizes >= 44, v);

  // 키보드로 ㄱ: 위 가로획(Space) + 오른쪽 세로획(Enter) + 왼쪽 세로획(틀린 획)
  for (const [p, key] of [['top', 'Space'], ['right', 'Enter'], ['left', 'Enter']]) {
    await page.focus(q(`.nm-glf-row[data-part="shape.g"] .nm-glf-piece[data-piece="${p}"]`));
    await page.keyboard.press(key);
  }
  v = await page.evaluate((sel) => {
    const r = document.querySelector(sel + ' .nm-glf-row[data-part="shape.g"]');
    return { ink: [...r.querySelectorAll('.nm-glf-ink [data-piece]')].map(x => x.getAttribute('data-piece')).join(), pressed: r.querySelector('[data-piece="top"].nm-glf-piece').getAttribute('aria-pressed'), sr: r.querySelector('.nm-glf-boardwrap .nm-sr').textContent };
  }, TOP);
  check('keyboard toggles stroke pieces; board draws them (structure ids, screen-reader list)', v.ink === 'top,left,right' && v.pressed === 'true' && v.sr.includes('위 가로획'), v);
  const pieces = { n: ['left', 'bottom'], m: ['top', 'bottom', 'left', 'right'], s: ['slashL', 'slashR'], o: ['ring'] };
  for (const [L, ps] of Object.entries(pieces)) for (const p of ps) await page.click(q(`.nm-glf-row[data-part="shape.${L}"] .nm-glf-piece[data-piece="${p}"]`));
  // 가획: 첫 빈 자리부터 차례로(자리를 고르지 않으면 첫 빈 자리), n.1·n.2 는 바꿔 넣는다
  for (const gid of ['k', 't', 'd', 'b', 'p', 'j', 'ch', 'q', 'h']) await page.click(q(`.nm-glf-traytile[data-glyph="${gid}"]`));
  v = await page.evaluate((sel) => Object.fromEntries([...document.querySelectorAll(sel + ' .nm-glf-slot')].map(b => [b.getAttribute('data-slot'), b.textContent])), TOP);
  check('tray glyphs fill empty slots in order', v['g.1'] === 'ㅋ' && v['n.1'] === 'ㅌ' && v['n.2'] === 'ㄷ' && v['o.2'] === 'ㅎ', v);
  await page.click(q('.nm-glf-otile[aria-label^="ㆁ"]'));
  await page.click(q('.nm-glf-otile[aria-label^="ㅋ"]'));
  check('all parts done → submit enabled', await page.evaluate((sel) => !document.querySelector(sel + ' .nm-glf-submit').disabled, TOP));

  // 1번째 틀림
  await page.click(q('.nm-glf-submit'));
  const marks = () => page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      wrong: [...w.querySelectorAll('.nm-glf [data-part][data-mark="wrong"]')].map(e => e.getAttribute('data-part')).join(),
      hint: [...w.querySelectorAll('.nm-glf [data-part].is-hint')].map(e => e.getAttribute('data-part')).join(),
      fadedStroke: [...w.querySelectorAll('.nm-glf-row[data-part="shape.g"] .nm-glf-ink .is-wrong')].map(e => e.getAttribute('data-piece')).join(),
      fadedOpacity: (() => { const s = w.querySelector('.nm-glf-row[data-part="shape.g"] .nm-glf-ink .is-wrong'); return s ? Number(getComputedStyle(s).opacity) : 1; })(),
      pieceFlag: w.querySelector('.nm-glf-row[data-part="shape.g"] .nm-glf-piece[data-piece="left"] .nm-glf-pflag').textContent,
      rowFlag: w.querySelector('.nm-glf-row[data-part="shape.g"] > .nm-glf-flag').textContent,
      missing: !w.querySelector('.nm-glf-missing').hidden,
      step: w.querySelector('.nm-st-help').getAttribute('data-step'),
      hint1: w.querySelector('.nm-st-hint') && w.querySelector('.nm-st-hint').textContent
    };
  }, TOP);
  v = await marks();
  check('1st wrong: wrong strokes faded on the board + × on the piece, row ×', v.fadedStroke === 'left' && v.fadedOpacity < 0.6 && v.pieceFlag === '×' && v.rowFlag === '×', v);
  check('1st wrong: wrong slots and wrongly chosen glyph marked; missed glyphs (ㄹ ㅿ) not revealed', v.wrong === 'shape.g,add.n.1,add.n.2,odd.k' && v.missing, v);
  check('1st wrong: task open with runner hint', (await K.state(page, 's2', 's2.t1')) === 'open' && v.hint1 && v.hint1.includes('시험 힌트'), v);
  // ㄱ 을 고치면 표시가 지워진다
  await page.click(q('.nm-glf-row[data-part="shape.g"] .nm-glf-piece[data-piece="left"]'));
  v = await marks();
  check('fixing a part clears its marks', !v.wrong.includes('shape.g') && v.fadedStroke === '', v);

  // 2번째 틀림 → hints[1] = 'shape.g' 강조 (지금은 맞게 고쳤어도 강조 대상은 데이터가 정한다)
  await page.click(q('.nm-glf-submit'));
  v = await marks();
  check('2nd wrong: hint target emphasized (showHint 2)', v.hint.split(',').includes('shape.g') && v.step === '2', v);
  check('2nd wrong: still open', (await K.state(page, 's2', 's2.t1')) === 'open');

  // 3번째 틀림 → doneByHelp
  await page.click(q('.nm-glf-submit'));
  v = await page.evaluate((sel) => {
    const w = document.querySelector(sel);
    return {
      answers: w.querySelectorAll('.nm-glf [data-part][data-mark="answer"]').length,
      gInk: [...w.querySelectorAll('.nm-glf-row[data-part="shape.g"] .nm-glf-ink [data-piece]')].map(x => x.getAttribute('data-piece')).join(),
      slots: [...w.querySelectorAll('.nm-glf-slot')].map(b => b.textContent).join(''),
      odd: [...w.querySelectorAll('.nm-glf-otile[aria-pressed="true"]')].map(b => b.textContent).join(''),
      wing: w.querySelector('.nm-glf-wing').textContent,
      locked: [...w.querySelectorAll('.nm-glf button')].every(b => b.disabled),
      sym: w.querySelector('.nm-glf-row[data-part="shape.g"] > .nm-glf-flag').textContent,
      explain: !!w.querySelector('.nm-card[data-mark="explain"]')
    };
  }, TOP);
  check('3rd wrong → doneByHelp', (await K.state(page, 's2', 's2.t1')) === 'doneByHelp');
  check('answer shown: ㄱ = top + right, slots ㅋㄷㅌㅂㅍㅈㅊㆆㅎ, odd ㆁㄹㅿ, ○ marks', v.gInk === 'top,right' && v.slots === 'ㅋㄷㅌㅂㅍㅈㅊㆆㅎ' && v.odd === 'ㆁㄹㅿ' && v.answers === 5 + 9 + 3 && v.sym === '○', v);
  check('wing explanation names ㆁ ㄹ ㅿ after the end (still no 이체); locked; explanation', /ㆁ.*ㄹ.*ㅿ/.test(v.wing) && !v.wing.includes('이체') && v.locked && v.explain, v);
  await K.closeTop(page);
  await K.openTask(page, 's2.t1');
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); return { answers: w.querySelectorAll('.nm-glf [data-mark="answer"]').length, locked: [...w.querySelectorAll('.nm-glf button')].every(b => b.disabled) }; }, TOP);
  check('reopened done task: answer read-only', v.answers === 17 && v.locked, v);
  await K.closeTop(page);

  // 모음 과제(중학교): 날개에 초출자·재출자, 표 없음 → 바로 맞음
  await K.openTask(page, 's2.t2');
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); return { wing: w.querySelector('.nm-glf-step[data-step="vowel"] .nm-glf-wing') && w.querySelector('.nm-glf-step[data-step="vowel"] .nm-glf-wing').textContent, tags: w.querySelectorAll('.nm-glf-tag').length, things: w.querySelectorAll('svg.nm-glf-thing').length }; }, TOP);
  check('middle school vowel step: 초출자 · 재출자 only in the wing; drawn sky/earth/person icons', v.wing && v.wing.includes('초출자') && v.tags === 0 && v.things === 9, v);
  for (const [k, th] of [['araea', 'sky'], ['eu', 'earth'], ['i', 'person']]) await page.click(q(`.nm-glf-srow[data-part="samjae.${k}"] [data-thing="${th}"]`));
  const seqs = { vo: ['araea', 'eu'], va: ['i', 'araea'], vu: ['eu', 'araea'], veo: ['araea', 'i'], vyo: ['araea', 'araea', 'eu'], vya: ['i', 'araea', 'araea'], vyu: ['eu', 'araea', 'araea'], vyeo: ['araea', 'araea', 'i'] };
  // 키보드로 하나: ㅑ 에 실수로 ㅡ 를 넣었다가 지우기
  await page.focus(q('.nm-glf-vrow[data-part="vowel.vya"] [data-key="eu"]'));
  await page.keyboard.press('Enter');
  await page.focus(q('.nm-glf-vrow[data-part="vowel.vya"] [data-key="back"]'));
  await page.keyboard.press('Enter');
  for (const [t, keys] of Object.entries(seqs)) for (const k of keys) await page.click(q(`.nm-glf-vrow[data-part="vowel.${t}"] [data-key="${k}"]`));
  v = await page.evaluate((sel) => Object.fromEntries([...document.querySelectorAll(sel + ' .nm-glf-preview')].map(p => [p.closest('[data-part]').getAttribute('data-part'), p.getAttribute('data-shape') + ':' + p.querySelectorAll('.nm-glf-dot').length])), TOP);
  check('key sequences build shapes (preview dots drawn)', v['vowel.vo'] === 'eu-up-1:1' && v['vowel.vya'] === 'i-right-2:2' && v['vowel.vyeo'] === 'i-left-2:2', v);
  await page.click(q('.nm-glf-submit'));
  check('vowel task correct first submit → done', (await K.state(page, 's2', 's2.t2')) === 'done' && await page.evaluate((sel) => document.querySelector(sel + ' .nm-glf').getAttribute('data-state') === 'done', TOP));
  await K.closeTop(page);

  // 고1 학생: 가획 두 줄 바로 맞음(키보드, 자리 고르기 + 지우기)
  page = await K.open(context, 'g-letterForge.html', 'stage=s2&level=h1&reset=1');
  pages.push(page);
  await K.openTask(page, 's2.t3');
  await page.focus(q('.nm-glf-slot[data-slot="n.2"]'));
  await page.keyboard.press('Enter');
  await page.focus(q('.nm-glf-traytile[data-glyph="r"]'));
  await page.keyboard.press('Enter');
  await page.focus(q('.nm-glf-slot[data-slot="n.2"]'));
  await page.keyboard.press('Delete');
  check('Delete clears a slot', await page.evaluate((sel) => document.querySelector(sel + ' .nm-glf-slot[data-slot="n.2"]').textContent === '', TOP));
  await page.focus(q('.nm-glf-traytile[data-glyph="t"]'));
  await page.keyboard.press('Enter');
  for (const gid of ['k', 'd']) { await page.focus(q(`.nm-glf-traytile[data-glyph="${gid}"]`)); await page.keyboard.press('Enter'); }
  await page.focus(q('.nm-glf-submit'));
  await page.keyboard.press('Enter');
  check('keyboard-only add task → done on first submit', (await K.state(page, 's2', 's2.t3')) === 'done');
  await K.closeTop(page);
  await K.openTask(page, 's2.t1');
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); return { title: w.querySelector('.nm-glf-step[data-step="odd"] .nm-glf-title').textContent, wing: !!w.querySelector('.nm-glf-wing'), level: w.querySelector('.nm-glf').getAttribute('data-level') }; }, TOP);
  check("high school: odd step uses the term '이체', no wing", v.level === 'h' && v.title.includes('이체') && !v.wing, v);

  // 고2~3 교사 모드: 정답 바로 보기 → 이체자 풀이, 초출자·재출자 표
  page = await K.open(context, 'g-letterForge.html', 'stage=s2&level=h23&teacher=1');
  pages.push(page);
  await K.openTask(page, 's2.t1');
  await page.click(q('.nm-st-teacher-answer'));
  v = await page.evaluate((sel) => { const w = document.querySelector(sel); const a = w.querySelector('.nm-glf-after'); return { after: a && !a.hidden && a.textContent, answers: w.querySelectorAll('.nm-glf [data-mark="answer"]').length }; }, TOP);
  check('teacher reveal: answer + 이체자 explanation (high school)', v.after && v.after.includes('이체자') && v.answers === 17, v);
  await K.closeTop(page);
  await K.openTask(page, 's2.t2');
  await page.click(q('.nm-st-teacher-answer'));
  v = await page.evaluate((sel) => [...document.querySelectorAll(sel + ' .nm-glf-tag')].filter(t => !t.hidden).map(t => t.closest('[data-part]').getAttribute('data-part').slice(6) + '=' + t.textContent).join(), TOP);
  check('high school vowel tags: 초출자 ㅗㅏㅜㅓ, 재출자 ㅛㅑㅠㅕ', v === 'vo=초출자,va=초출자,vu=초출자,veo=초출자,vyo=재출자,vya=재출자,vyu=재출자,vyeo=재출자', v);
  check('teacher reveal does not record', (await K.state(page, 's2', 's2.t2')) === 'none');

  // 360px + 글자 크기 1.5 + 움직임 줄이기
  const small = await K.browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  page = await K.open(small, 'g-letterForge.html', 'stage=s2&level=m&reset=1');
  pages.push(page);
  await page.evaluate(() => { document.documentElement.style.setProperty('--fs', '1.5'); document.documentElement.classList.add('nm-reduced-motion'); });
  await K.openTask(page, 's2.t1');
  await page.click(q('.nm-glf-row[data-part="shape.g"] .nm-glf-piece[data-piece="top"]'));
  let hs = await K.noHScroll(page);
  check('360px (font scale 1.5): consonant task has no horizontal scroll', hs.win <= 1 && hs.doc <= 0, hs);
  v = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel + ' .nm-glf-ink .nm-glf-stroke')).animationName, TOP);
  check('reduced motion: stroke drawing animation off', v === 'none', v);
  await K.closeTop(page);
  await K.openTask(page, 's2.t2');
  hs = await K.noHScroll(page);
  check('360px (font scale 1.5): vowel task has no horizontal scroll', hs.win <= 1 && hs.doc <= 0, hs);

  await K.finish(pages);
} catch (e) { await K.fail(e); }
