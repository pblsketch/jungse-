'use strict';
/*
 * 기믹 G8 'prefaceDecode' — 종합 해독 (장면 9 나랏말ᄊᆞ미, 모든 학교급). 장면 데이터 설명: js/gimmicks/README-prefaceDecode.md
 * ■ 고등판(기본): 서문 구절(原文 블록)마다
 *   ① 낱말 풀기 — 앞 장면에서 모은 규칙 카드(NM.data.RULE_CARDS)를 곁에 보이고 뜻 카드를 고른다.
 *      수첩에 없는 규칙은 '아직 확인하지 않은 규칙'(이름 + 배우는 장면)으로 보인다 — 막지 않는다.
 *   ② 현대어로 옮기기 — 새로 쓴 현대어 조각(장면 데이터)을 차례대로 놓는다(누르기·Enter 로 놓고, 놓은 조각을 누르면 되돌림).
 *   ③ 창제 정신 찾기 — 구절마다 config.spirits 가운데 하나 또는 '어느 쪽도 아님'. noSpirit:true 인 구절·대목은 고르지 않는다
 *      (자료마다 판정이 갈리는 대목은 채점하지 않는다 — spec §12).
 * ■ 중학교판(config.mode 'modern', 또는 학교급 m 이고 config.modern 이 있을 때): 새로 쓴 현대어 서문 대목마다 창제 정신 고르기만.
 * answer(고등) = { decode: { <낱말 id>: <카드 id> }, order: { <구절 id>: [<조각 id>…] }, spirits: { <구절 id>: <정신 id>|'none' } }
 * answer(중학) = { modernSpirits: { <대목 id>: <정신 id>|'none' } }
 * check: 학생 답에 modernSpirits 가 있으면 그것만, 아니면 decode·order·spirits 가운데 item.answer 에 있는 것만 본다.
 *   틀린 곳: { decode: [낱말 id], spirits: [구절 id], modernSpirits: [대목 id], order: { <구절 id>: [틀린 자리 번호] } }
 * 필요: core/ns.js, core/yet.js, gimmicks/g789-origwords.js, data/text-g-prefaceDecode.js, ui/stage-gimmick.js
 *       (ui/stage-logic.js 가 있으면 장면 이름·수첩 규칙)
 */
(function (root) {
  const NM = root.NM;
  const K = () => NM.g789;
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);
  const NONE = 'none';
  const SPIRIT_PAGE = '#spirits';

  function check(answer, item) {
    const want = (item && item.answer) || {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = {};
    const add = (k, v) => (wrong[k] = wrong[k] || []).push(v);
    const cmpMap = (key) => {
      const w = want[key];
      if (!w || typeof w !== 'object') return;
      const g = got[key] && typeof got[key] === 'object' ? got[key] : {};
      Object.keys(w).forEach(k => { if (g[k] !== w[k]) add(key, k); });
    };
    const modern = got.modernSpirits !== undefined || (!!want.modernSpirits && !want.decode && !want.order && !want.spirits);
    if (modern) cmpMap('modernSpirits');
    else {
      cmpMap('decode');
      cmpMap('spirits');
      if (want.order && typeof want.order === 'object') {
        const g = got.order && typeof got.order === 'object' ? got.order : {};
        Object.keys(want.order).forEach(p => {
          const wa = list(want.order[p]);
          const ga = Array.isArray(g[p]) ? g[p] : [];
          const bad = [];
          for (let i = 0; i < Math.max(wa.length, ga.length); i++) if (ga[i] !== wa[i]) bad.push(i);
          if (bad.length) { wrong.order = wrong.order || {}; wrong.order[p] = bad; }
        });
      }
    }
    return Object.keys(wrong).length ? { correct: false, wrong } : true;
  }

  function mount(el, o) {
    const G = K();
    const doc = o.document || root.document;
    const t = G.textOf('prefaceDecode', o.level);
    const cfg = o.config || {};
    const E = (tag, cls, text) => G.el(doc, tag, cls, text);
    const modernMode = cfg.mode === 'modern' || (o.level === 'm' && cfg.mode !== 'decode' && list(cfg.modern).length > 0);
    const spiritOpts = list(cfg.spirits).map(s => (typeof s === 'string' ? { id: s } : s)).filter(s => typeof s.id === 'string')
      .map(s => (s.label != null ? { id: s.id, text: s.label } : { id: s.id, plain: t('spirits.' + s.id) }));
    const spiritChoices = spiritOpts.concat([{ id: NONE, plain: t('none') }]);
    let locked = !!o.readOnly;
    let wrongSeen = false;
    let lastWrong = {};

    const box = E('div', 'pd');
    box.setAttribute('data-mode', modernMode ? 'modern' : 'decode');
    box.appendChild(E('p', 'pd-howto', t(modernMode ? 'howtoModern' : 'howto')));
    const note = E('p', 'pd-note');
    note.setAttribute('aria-live', 'polite');
    const submit = E('button', 'nm-st-btn nm-st-primary pd-submit', t('submit'));
    submit.type = 'button';

    const spiritGroups = {};   // 구절 id 또는 대목 id → radios
    const decodeGroups = {};   // 낱말 id → radios
    const trays = {};          // 구절 id → [조각 id]
    const orderWrong = {};     // 구절 id → [자리]
    const views = {};          // 구절 id → { panel, words, tray, pool, decRows, spirit }
    const phrases = modernMode ? [] : list(cfg.phrases).filter(p => typeof p.id === 'string');
    const pages = phrases.map(p => p.id).concat(!modernMode && spiritOpts.length ? [SPIRIT_PAGE] : []);
    let active = pages[0] || null;
    const navBtns = {};

    function lineOf(p) {
      const b = G.block(p.orig);
      return b && b.lines ? b.lines[0] : '';
    }

    function ruleChip(d, known) {
      const info = G.ruleInfo(d.rule);
      const isKnown = known.indexOf(d.rule) >= 0;
      const chip = E('div', 'pd-rule');
      chip.setAttribute('data-rule', String(d.rule));
      chip.setAttribute('data-known', isKnown ? '1' : '0');
      chip.appendChild(G.mark(doc, isKnown ? 'know' : 'unknown', t(isKnown ? 'ruleKnown' : 'ruleUnknown')));
      const name = info.name || d.ruleName;
      if (name) chip.appendChild(G.richSpan(o, name, 'pd-rule-name'));
      if (isKnown && info.text) chip.appendChild(G.richSpan(o, info.text, 'pd-rule-text'));
      if (!isKnown && info.stageName) chip.appendChild(E('span', 'pd-rule-where', t('ruleWhere', { stage: info.stageName })));
      return chip;
    }

    // ── 조각 놓기 ──
    function renderTray(pid, focusHint) {
      const v = views[pid];
      const p = phrases.filter(x => x.id === pid)[0];
      if (!v || !p) return;
      const placed = trays[pid];
      const bad = orderWrong[pid] || [];
      v.tray.textContent = '';
      v.pool.textContent = '';
      if (!placed.length) v.tray.appendChild(E('p', 'pd-tray-empty', t('trayEmpty')));
      placed.forEach((kid, i) => {
        const piece = list(p.pieces).filter(k => k.id === kid)[0];
        const b = E('button', 'pd-piece is-placed');
        b.type = 'button';
        b.setAttribute('data-piece', kid);
        b.setAttribute('data-pos', String(i));
        const no = E('span', 'pd-piece-no', String(i + 1));
        no.setAttribute('aria-hidden', 'true');
        b.appendChild(no);
        b.appendChild(G.richSpan(o, piece ? piece.text : kid, 'pd-piece-text'));
        b.appendChild(E('span', 'nm-sr', t('placed', { n: i + 1 })));
        if (bad.indexOf(i) >= 0) { b.classList.add('is-wrong'); b.setAttribute('data-wrong', '1'); }
        b.disabled = locked;
        b.addEventListener('click', () => {
          if (locked) return;
          placed.splice(i, 1);
          delete orderWrong[pid];
          renderTray(pid, { tray: i });
          refresh();
        });
        v.tray.appendChild(b);
      });
      // 모자란 자리(틀린 제출에서 학생이 덜 놓은 곳)
      bad.filter(i => i >= placed.length).forEach(() => {
        const gap = E('span', 'pd-gap is-wrong', '✕');
        gap.setAttribute('data-wrong', '1');
        v.tray.appendChild(gap);
      });
      list(p.pieces).forEach(k => {
        if (placed.indexOf(k.id) >= 0) return;
        const b = E('button', 'pd-piece');
        b.type = 'button';
        b.setAttribute('data-piece', k.id);
        b.appendChild(G.richSpan(o, k.text, 'pd-piece-text'));
        b.disabled = locked;
        b.addEventListener('click', () => {
          if (locked) return;
          placed.push(k.id);
          delete orderWrong[pid];
          const idx = Array.prototype.indexOf.call(v.pool.children, b);
          renderTray(pid, { pool: idx });
          refresh();
        });
        v.pool.appendChild(b);
      });
      if (focusHint) {
        let target = null;
        if (focusHint.pool !== undefined) target = v.pool.children[focusHint.pool] || v.pool.lastElementChild || v.tray.lastElementChild;
        else if (focusHint.tray !== undefined) target = v.tray.querySelectorAll('.pd-piece')[focusHint.tray] || v.tray.querySelector('.pd-piece:last-of-type') || v.pool.firstElementChild;
        if (target && typeof target.focus === 'function') target.focus();
      }
    }

    function showPage(id) {
      if (!pages.length) return;
      active = pages.indexOf(id) >= 0 ? id : pages[0];
      Object.keys(views).forEach(k => { views[k].panel.hidden = k !== active; });
      if (spiritPanel) spiritPanel.hidden = active !== SPIRIT_PAGE;
      Object.keys(navBtns).forEach(k => {
        if (k === active) navBtns[k].setAttribute('aria-current', 'step');
        else navBtns[k].removeAttribute('aria-current');
      });
      const i = pages.indexOf(active);
      if (prevBtn) prevBtn.disabled = i <= 0;
      if (nextBtn) nextBtn.disabled = i >= pages.length - 1;
    }

    let spiritPanel = null, prevBtn = null, nextBtn = null, navList = null;
    const known = modernMode ? [] : G.knownRules(o);

    if (modernMode) {
      const sec = E('section', 'pd-modern');
      const head = E('div', 'pd-modern-head');
      head.appendChild(G.mark(doc, 'explain', o.text('marks.explain')));
      sec.appendChild(head);
      list(cfg.modern).filter(s => typeof s.id === 'string').forEach(s => {
        const row = E('div', 'pd-seg');
        row.setAttribute('data-seg', s.id);
        row.appendChild(G.richSpan(o, s.text, 'pd-seg-text'));
        if (s.noSpirit === true) { row.classList.add('pd-seg-plain'); sec.appendChild(row); return; }
        const g = G.radios(o, { label: t('spiritPrompt'), options: spiritChoices, onChange: () => { row.classList.remove('is-wrong'); refresh(); } });
        row.appendChild(g.el);
        spiritGroups[s.id] = g;
        sec.appendChild(row);
      });
      box.appendChild(sec);
    } else {
      navList = E('div', 'pd-nav');
      navList.setAttribute('role', 'group');
      navList.setAttribute('aria-label', t('navLabel'));
      pages.forEach((pid, i) => {
        const b = E('button', 'pd-nav-btn');
        b.type = 'button';
        b.setAttribute('data-page', pid);
        const sym = E('span', 'pd-nav-sym');
        sym.setAttribute('aria-hidden', 'true');
        b.appendChild(sym);
        b.appendChild(E('span', 'pd-nav-text', pid === SPIRIT_PAGE ? t('navSpirit') : t('nav', { n: i + 1 })));
        b.addEventListener('click', () => showPage(pid));
        navBtns[pid] = b;
        navList.appendChild(b);
      });
      box.appendChild(navList);

      phrases.forEach(p => {
        const panel = E('section', 'pd-phrase');
        panel.setAttribute('data-phrase', p.id);
        const ov = G.origView(o, p.orig, { asSpans: true, words: list(p.words) });
        panel.appendChild(ov.el);
        if (p.hanmun) {
          const det = E('details', 'pd-hanmun');
          det.appendChild(E('summary', 'pd-hanmun-sum', t('hanmun')));
          list([].concat(p.hanmun)).forEach(b => det.appendChild(G.origView(o, b, {}).el));
          panel.appendChild(det);
        }
        const v = { panel, words: ov.words, decRows: {}, tray: null, pool: null };
        const line = lineOf(p);
        if (list(p.decode).length) {
          panel.appendChild(E('h3', 'pd-h', t('decodeHead')));
          list(p.decode).forEach(d => {
            const w = list(p.words).filter(x => x.id === d.word)[0];
            const row = E('div', 'pd-dec');
            row.setAttribute('data-word', String(d.word));
            const face = E('div', 'pd-dec-word');
            face.appendChild(G.yetPiece(o, w ? G.wordText(line, w) : String(d.word), 'pd-dec-yet'));
            row.appendChild(face);
            if (d.rule) row.appendChild(ruleChip(d, known));
            const g = G.radios(o, { label: G.modern(w ? G.wordText(line, w) : ''), options: list(d.cards).map(c => ({ id: c.id, text: c.text })), onChange: () => { row.classList.remove('is-wrong'); refresh(); } });
            row.appendChild(g.el);
            decodeGroups[d.word] = g;
            v.decRows[d.word] = row;
            panel.appendChild(row);
          });
        }
        if (list(p.pieces).length) {
          panel.appendChild(E('h3', 'pd-h', t('arrangeHead')));
          const trayWrap = E('div', 'pd-tray-wrap');
          trayWrap.appendChild(E('p', 'pd-sub', t('tray')));
          v.tray = E('div', 'pd-tray');
          v.tray.setAttribute('data-phrase', p.id);
          trayWrap.appendChild(v.tray);
          trayWrap.appendChild(E('p', 'pd-tip', t('removeTip')));
          panel.appendChild(trayWrap);
          panel.appendChild(E('p', 'pd-sub', t('pool')));
          v.pool = E('div', 'pd-pool');
          v.pool.setAttribute('data-phrase', p.id);
          panel.appendChild(v.pool);
          trays[p.id] = [];
        }
        views[p.id] = v;
        box.appendChild(panel);
        if (v.tray) renderTray(p.id);
      });

      if (spiritOpts.length) {
        spiritPanel = E('section', 'pd-spirits');
        spiritPanel.appendChild(E('h3', 'pd-h', t('spiritHead')));
        phrases.filter(p => p.noSpirit !== true).forEach(p => {
          const row = E('div', 'pd-sp');
          row.setAttribute('data-phrase', p.id);
          const ov = G.origView(o, p.orig, { asSpans: true, words: list(p.words).filter(w => list(p.spiritWords).indexOf(w.id) >= 0) });
          row.appendChild(ov.el);
          const g = G.radios(o, { label: t('spiritPrompt'), options: spiritChoices, onChange: () => { row.classList.remove('is-wrong'); refresh(); } });
          row.appendChild(g.el);
          spiritGroups[p.id] = g;
          views[p.id].spirit = { row, words: ov.words };
          spiritPanel.appendChild(row);
        });
        box.appendChild(spiritPanel);
      }

      const pager = E('div', 'pd-pager');
      prevBtn = E('button', 'nm-st-btn pd-prev', t('prev'));
      nextBtn = E('button', 'nm-st-btn pd-next', t('next'));
      prevBtn.type = 'button';
      nextBtn.type = 'button';
      prevBtn.addEventListener('click', () => showPage(pages[pages.indexOf(active) - 1]));
      nextBtn.addEventListener('click', () => showPage(pages[pages.indexOf(active) + 1]));
      pager.appendChild(prevBtn);
      pager.appendChild(nextBtn);
      box.appendChild(pager);
    }

    const foot = E('div', 'pd-foot');
    foot.appendChild(note);
    foot.appendChild(submit);
    box.appendChild(foot);
    el.appendChild(box);

    // ── 상태 ──
    function phraseComplete(p) {
      const decOk = list(p.decode).every(d => decodeGroups[d.word] && decodeGroups[d.word].get() !== null);
      const trayOk = !trays[p.id] || trays[p.id].length > 0;
      return decOk && trayOk;
    }
    function pageWrong(pid) {
      const w = lastWrong;
      if (pid === SPIRIT_PAGE) return list(w.spirits).length > 0;
      const p = phrases.filter(x => x.id === pid)[0];
      if (!p) return false;
      return list(p.decode).some(d => list(w.decode).indexOf(d.word) >= 0) || !!(w.order && w.order[pid]);
    }
    function complete() {
      if (modernMode) return Object.keys(spiritGroups).every(k => spiritGroups[k].get() !== null);
      return phrases.every(phraseComplete) && Object.keys(spiritGroups).every(k => spiritGroups[k].get() !== null);
    }
    function refresh() {
      Object.keys(navBtns).forEach(pid => {
        const sym = navBtns[pid].querySelector('.pd-nav-sym');
        const done = pid === SPIRIT_PAGE ? Object.keys(spiritGroups).every(k => spiritGroups[k].get() !== null)
          : phraseComplete(phrases.filter(x => x.id === pid)[0]);
        const bad = pageWrong(pid) && navBtns[pid].classList.contains('is-wrong');
        sym.textContent = bad ? '✕' : (done ? '●' : '○');
        navBtns[pid].setAttribute('data-done', done ? '1' : '0');
      });
      if (locked) { submit.disabled = true; submit.hidden = true; return; }
      const ok = complete();
      submit.disabled = !ok;
      const need = t(modernMode ? 'needAllModern' : 'needAll');
      if (!ok) note.textContent = need;
      else if (note.textContent === need) note.textContent = '';
    }
    function collect() {
      const pick = (groups) => { const out = {}; Object.keys(groups).forEach(k => { out[k] = groups[k].get(); }); return out; };
      if (modernMode) return { modernSpirits: pick(spiritGroups) };
      const out = { decode: pick(decodeGroups), order: {} };
      Object.keys(trays).forEach(k => { out.order[k] = trays[k].slice(); });
      if (spiritOpts.length) out.spirits = pick(spiritGroups);
      return out;
    }
    function lockAll() {
      locked = true;
      Object.keys(decodeGroups).forEach(k => decodeGroups[k].disable(true));
      Object.keys(spiritGroups).forEach(k => spiritGroups[k].disable(true));
      Object.keys(trays).forEach(k => renderTray(k));
      refresh();
    }
    submit.addEventListener('click', () => {
      if (locked || !complete()) return;
      wrongSeen = false;
      o.onSubmit(collect());
      if (!wrongSeen) lockAll();   // 맞은 제출은 진행기가 기믹에 알리지 않는다 — showWrong 없이 돌아오면 끝난 것
    });

    function cueWord(wordEl) {
      if (!wordEl) return;
      wordEl.classList.add('is-cue');
      wordEl.setAttribute('data-cue', '1');
    }

    showPage(active);
    if (locked) lockAll(); else refresh();

    return {
      showWrong(info) {
        const w = info && info.wrong && typeof info.wrong === 'object' ? info.wrong : {};
        wrongSeen = true;
        lastWrong = w;
        Object.keys(navBtns).forEach(k => navBtns[k].classList.remove('is-wrong'));
        Object.keys(decodeGroups).forEach(k => {
          const bad = list(w.decode).indexOf(k) >= 0;
          if (bad) decodeGroups[k].markWrong(); else decodeGroups[k].clearMarks();
          Object.keys(views).forEach(pid => { if (views[pid].decRows[k]) views[pid].decRows[k].classList.toggle('is-wrong', bad); });
        });
        const spiritKey = modernMode ? 'modernSpirits' : 'spirits';
        Object.keys(spiritGroups).forEach(k => {
          const bad = list(w[spiritKey]).indexOf(k) >= 0;
          if (bad) spiritGroups[k].markWrong(); else spiritGroups[k].clearMarks();
          const row = modernMode ? box.querySelector('.pd-seg[data-seg="' + k + '"]') : (views[k] && views[k].spirit && views[k].spirit.row);
          if (row) row.classList.toggle('is-wrong', bad);
        });
        Object.keys(trays).forEach(pid => {
          if (w.order && w.order[pid]) orderWrong[pid] = w.order[pid].slice(); else delete orderWrong[pid];
          renderTray(pid);
        });
        let first = null;
        pages.forEach(pid => { if (pageWrong(pid)) { navBtns[pid].classList.add('is-wrong'); if (!first) first = pid; } });
        if (first) showPage(first);
        refresh();
        note.textContent = t('wrongNote');
      },
      showHint(step, target) {
        if (step < 2) return;
        const w = lastWrong;
        if (modernMode) {
          const ids = typeof target === 'string' && spiritGroups[target] ? [target] : (list(w.modernSpirits).length ? list(w.modernSpirits) : Object.keys(spiritGroups));
          ids.forEach(id => { const row = box.querySelector('.pd-seg[data-seg="' + id + '"]'); if (row) row.classList.add('is-hint'); const tx = row && row.querySelector('.pd-seg-text'); if (tx) cueWord(tx); });
          note.textContent = t('hintNote');
          return;
        }
        const hintPhrase = (pid, onlyWord) => {
          const v = views[pid];
          const p = phrases.filter(x => x.id === pid)[0];
          if (!v || !p) return;
          list(p.decode).forEach(d => {
            if (onlyWord && d.word !== onlyWord) return;
            if (!onlyWord && list(w.decode).length && list(w.decode).indexOf(d.word) < 0) return;
            cueWord(v.words[d.word]);
            if (v.decRows[d.word]) v.decRows[d.word].classList.add('is-hint');
          });
          if (v.tray && (!onlyWord) && (w.order && w.order[pid] || !list(w.decode).length)) v.tray.classList.add('is-hint');
        };
        const hintSpirit = (pid) => {
          const v = views[pid];
          const p = phrases.filter(x => x.id === pid)[0];
          if (!v || !v.spirit || !p) return;
          v.spirit.row.classList.add('is-hint');
          list(p.spiritWords).forEach(id => cueWord(v.spirit.words[id]));
        };
        let goTo = null;
        if (typeof target === 'string' && views[target]) { hintPhrase(target); goTo = target; }
        else if (typeof target === 'string' && phrases.some(p => list(p.decode).some(d => d.word === target))) {
          const p = phrases.filter(x => list(x.decode).some(d => d.word === target))[0];
          hintPhrase(p.id, target); goTo = p.id;
        } else if (target === 'spirits' && spiritPanel) { phrases.forEach(p => hintSpirit(p.id)); goTo = SPIRIT_PAGE; }
        else {
          phrases.forEach(p => { if (pageWrong(p.id)) { hintPhrase(p.id); if (!goTo) goTo = p.id; } });
          list(w.spirits).forEach(pid => { hintSpirit(pid); if (!goTo) goTo = SPIRIT_PAGE; });
        }
        if (goTo) showPage(goTo);
        note.textContent = t('hintNote');
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        const tag = t('answerTag');
        const fill = (groups, map) => {
          if (!map || typeof map !== 'object') return;
          Object.keys(groups).forEach(k => {
            if (map[k] === undefined) return;
            groups[k].set(map[k]);
            groups[k].clearMarks();
            groups[k].markAnswer(map[k], tag);
          });
        };
        if (modernMode) fill(spiritGroups, a.modernSpirits);
        else {
          fill(decodeGroups, a.decode);
          fill(spiritGroups, a.spirits);
          if (a.order && typeof a.order === 'object') Object.keys(trays).forEach(pid => { if (Array.isArray(a.order[pid])) { trays[pid].length = 0; a.order[pid].forEach(x => trays[pid].push(x)); delete orderWrong[pid]; } });
        }
        box.querySelectorAll('.is-wrong').forEach(x => { if (!x.classList.contains('g789-opt')) x.classList.remove('is-wrong'); });
        Object.keys(navBtns).forEach(k => navBtns[k].classList.remove('is-wrong'));
        lastWrong = {};
        box.classList.add('is-answer');
        note.textContent = '';
        lockAll();
        Object.keys(trays).forEach(pid => views[pid].tray.querySelectorAll('.pd-piece').forEach(b => b.classList.add('is-answer')));
      },
      destroy() { box.remove(); }
    };
  }

  NM.gimmicks.register('prefaceDecode', { mount, check });
})(typeof window !== 'undefined' ? window : globalThis);
