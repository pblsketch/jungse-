'use strict';
/*
 * 기믹 G9 'twoEraNotebook' — 두 시대 수첩 (장면 10 백 년 뒤, 고2~3 핵심·고1 선택). 장면 데이터 설명: js/gimmicks/README-twoEraNotebook.md
 *   15세기 쪽(原文 블록 + 더 살펴볼 낱말, 보기 강조용)과 16세기 쪽(原文 블록 낱말 단추 + 더 살펴볼 낱말 단추)을 나란히 편다.
 *   수첩 줄(현상)마다 '지켜짐 kept / 흔들림 shaky / 없음 none' 을 고르고, 줄의 '근거 고르기'를 켠 채 16세기 낱말을 눌러 근거를 모은다.
 *   graded:false 인 줄(예: 『소학언해』 방점 — 교과서 1종뿐인 층)은 알아 두기로만 보이고 고르지 않는다(채점 안 함).
 *   이 장면은 방점을 늘 켠다(진행기가 html[data-nm-bangjeom] 으로 처리).
 * answer = { <줄 id>: { status: 'kept'|'shaky'|'none', evidence?: [<받아 주는 낱말 id>…] } }
 *   evidence 가 있으면: 학생이 1개 이상 고르고, 고른 것이 모두 그 안에 있어야 한다. [] 이면 하나도 고르지 않아야 한다. 없으면 보지 않는다.
 * check 틀린 곳: { rows: { <줄 id>: ['status'|'evidence'] }, evidence: { <줄 id>: [받지 않는 낱말 id] } }
 * 필요: core/ns.js, core/yet.js, gimmicks/g789-origwords.js, data/text-g-twoEraNotebook.js, ui/stage-gimmick.js
 */
(function (root) {
  const NM = root.NM;
  const K = () => NM.g789;
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);
  // 출처 칸 → 학생에게 보일 출처 글(검증 메모 빼기, NM.ui.marker.srcLabel). 없으면 그대로.
  const srcText = (s) => (NM.ui && NM.ui.marker && NM.ui.marker.srcLabel ? NM.ui.marker.srcLabel(s) : String(s || ''));
  const STATUSES = ['kept', 'shaky', 'none'];

  function check(answer, item) {
    const want = (item && item.answer) || {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const rows = {}, ev = {};
    Object.keys(want).forEach(r => {
      const w = want[r] || {};
      const g = got[r] || {};
      const bad = [];
      if (w.status !== undefined && g.status !== w.status) bad.push('status');
      if (Array.isArray(w.evidence)) {
        const acc = w.evidence;
        const sel = list(g.evidence);
        const extra = sel.filter(x => acc.indexOf(x) < 0);
        if ((acc.length && !sel.length) || extra.length) bad.push('evidence');
        if (extra.length) ev[r] = extra;
      }
      if (bad.length) rows[r] = bad;
    });
    if (!Object.keys(rows).length) return true;
    const wrong = { rows };
    if (Object.keys(ev).length) wrong.evidence = ev;
    return { correct: false, wrong };
  }

  function mount(el, o) {
    const G = K();
    const doc = o.document || root.document;
    const t = G.textOf('twoEraNotebook', o.level);
    const cfg = o.config || {};
    const E = (tag, cls, text) => G.el(doc, tag, cls, text);
    const p15 = cfg.page15 || {};
    const p16 = cfg.page16 || {};
    const rowsCfg = list(cfg.rows).filter(r => typeof r.id === 'string');
    const graded = rowsCfg.filter(r => r.graded !== false);
    let locked = !!o.readOnly;
    let wrongSeen = false;
    let lastWrong = {};
    let activeRow = graded.length ? graded[0].id : null;

    const box = E('div', 'tn');
    box.appendChild(E('p', 'tn-howto', t('howto')));
    box.appendChild(E('p', 'tn-howto', t('criteria')));

    // ── 두 쪽 ──
    const spread = E('div', 'tn-spread');
    const leaf = (cls, title) => { const s = E('section', 'tn-page ' + cls); s.appendChild(E('h3', 'tn-h', title)); return s; };
    const left = leaf('tn-page15', t('page15'));
    const right = leaf('tn-page16', t('page16'));
    const words15 = {}, words16 = {}, blocks16 = {};
    list(p15.orig).forEach(b => {
      const v = G.origView(o, b, { asSpans: true, words: list(p15.words), noteNoBangjeom: o.text('marks.noBangjeom') });
      Object.assign(words15, v.words);
      left.appendChild(v.el);
    });
    if (list(p15.extra).length) {
      const ex = E('div', 'tn-extra tn-extra15');
      ex.appendChild(E('p', 'tn-sub', t('extraHead')));
      const row = E('div', 'tn-extra-words');
      list(p15.extra).filter(x => typeof x.id === 'string').forEach(x => {
        const wrap = E('span', 'tn-extra-item');
        const sp = G.yetPiece(o, x.text, 'g789-word g789-word-span tn-extra-word');
        sp.setAttribute('data-word', x.id);
        words15[x.id] = sp;
        wrap.appendChild(sp);
        if (x.note) wrap.appendChild(G.richSpan(o, x.note, 'tn-extra-note'));
        if (srcText(x.src)) wrap.appendChild(E('span', 'tn-src', srcText(x.src)));
        row.appendChild(wrap);
      });
      ex.appendChild(row);
      left.appendChild(ex);
    }
    const wordText16 = {};
    list(p16.orig).forEach(b => {
      const v = G.origView(o, b, { words: list(p16.words), onWord: (id) => toggleEvidence(id), noteNoBangjeom: o.text('marks.noBangjeom') });
      Object.assign(words16, v.words);
      blocks16[b] = v.el;
      right.appendChild(v.el);
      const blk = G.block(b);
      list(p16.words).filter(w => w.block === undefined || w.block === b).forEach(w => { wordText16[w.id] = G.wordText(blk.lines[w.line || 0], w); });
    });
    if (list(p16.extra).length) {
      const ex = E('div', 'tn-extra');
      ex.appendChild(E('p', 'tn-sub', t('extraHead')));
      const row = E('div', 'tn-extra-words');
      list(p16.extra).filter(x => typeof x.id === 'string').forEach(x => {
        const b = E('button', 'g789-word tn-extra-word');
        b.type = 'button';
        b.setAttribute('data-word', x.id);
        b.setAttribute('aria-label', G.modern(x.text));
        const vis = E('span', 'g789-vis');
        vis.setAttribute('aria-hidden', 'true');
        vis.appendChild(o.yet(String(x.text)));
        b.appendChild(vis);
        b.addEventListener('click', () => toggleEvidence(x.id));
        words16[x.id] = b;
        wordText16[x.id] = x.text;
        const wrap = E('span', 'tn-extra-item');
        wrap.appendChild(b);
        if (x.note) wrap.appendChild(G.richSpan(o, x.note, 'tn-extra-note'));
        if (srcText(x.src)) wrap.appendChild(E('span', 'tn-src', srcText(x.src)));
        row.appendChild(wrap);
      });
      ex.appendChild(row);
      right.appendChild(ex);
    }
    spread.appendChild(left);
    spread.appendChild(right);
    box.appendChild(spread);

    // ── 수첩 ──
    const book = E('section', 'tn-book');
    book.appendChild(E('h3', 'tn-h', t('notebook')));
    const rows = {};
    rowsCfg.forEach(rc => {
      const row = E('div', 'tn-row');
      row.setAttribute('data-row', rc.id);
      const head = E('div', 'tn-row-head');
      head.appendChild(G.richSpan(o, rc.label || rc.id, 'tn-row-label'));
      row.appendChild(head);
      const r = { cfg: rc, el: row, evidence: [] };
      if (rc.graded === false) {
        row.classList.add('tn-row-know');
        head.appendChild(G.mark(doc, 'know', o.text('marks.know')));
        head.appendChild(E('span', 'tn-notscored', o.text('marks.notScored')));
        if (rc.note) row.appendChild(G.richSpan(o, rc.note, 'tn-row-note'));
        if (srcText(rc.src)) row.appendChild(E('p', 'tn-src', srcText(rc.src)));
        rows[rc.id] = r;
        book.appendChild(row);
        return;
      }
      if (list(rc.ex15).length) {
        const ex = E('p', 'tn-ex15');
        ex.appendChild(E('span', 'tn-ex15-label', t('example15')));
        list(rc.ex15).forEach(id => {
          const w = list(p15.words).filter(x => x.id === id)[0];
          const blk = w && G.block(w.block || list(p15.orig)[0]);
          const x = list(p15.extra).filter(e => e.id === id)[0];
          if (blk) ex.appendChild(G.yetPiece(o, G.wordText(blk.lines[w.line || 0], w), 'tn-ex15-word'));
          else if (x) ex.appendChild(G.yetPiece(o, x.text, 'tn-ex15-word'));
        });
        row.appendChild(ex);
      }
      const st = E('div', 'tn-status');
      st.appendChild(E('span', 'tn-sub', t('statusLabel')));
      r.status = G.radios(o, { label: t('statusLabel'), options: STATUSES.map(s => ({ id: s, plain: t('status.' + s) })), onChange: () => { row.classList.remove('is-wrong'); refresh(); } });
      st.appendChild(r.status.el);
      row.appendChild(st);
      const evBox = E('div', 'tn-ev');
      const pick = E('button', 'nm-st-btn tn-pick', t('pickEvidence'));
      pick.type = 'button';
      pick.addEventListener('click', () => { activeRow = rc.id; syncActive(); });
      r.pick = pick;
      evBox.appendChild(pick);
      r.chips = E('div', 'tn-chips');
      r.chips.setAttribute('aria-live', 'polite');
      evBox.appendChild(r.chips);
      row.appendChild(evBox);
      rows[rc.id] = r;
      book.appendChild(row);
    });
    box.appendChild(book);

    if (list(cfg.notes).length) {
      const ns = E('section', 'tn-notes');
      list(cfg.notes).forEach(n => {
        const kind = n.kind === 'interp' || n.kind === 'variant' ? n.kind : 'know';
        const card = E('div', 'nm-card nm-card-' + kind + ' tn-note');
        card.setAttribute('data-mark', kind);
        const h = E('div', 'nm-card-head');
        h.appendChild(G.mark(doc, kind, o.text('marks.' + kind)));
        if (kind !== 'know') h.appendChild(E('span', 'nm-card-note', o.text('marks.notScored')));
        card.appendChild(h);
        list([].concat(n.orig || [])).forEach(b => card.appendChild(G.origView(o, b, { noteNoBangjeom: o.text('marks.noBangjeom') }).el));
        if (n.text) { const p = E('p', 'nm-card-text'); p.appendChild(G.richSpan(o, n.text)); card.appendChild(p); }
        if (srcText(n.src)) card.appendChild(E('p', 'nm-card-src', o.text('marks.src') + ' ' + srcText(n.src)));
        ns.appendChild(card);
      });
      box.appendChild(ns);
    }

    const foot = E('div', 'tn-foot');
    const note = E('p', 'tn-note');
    note.setAttribute('aria-live', 'polite');
    const submit = E('button', 'nm-st-btn nm-st-primary tn-submit', t('submit'));
    submit.type = 'button';
    foot.appendChild(note);
    foot.appendChild(submit);
    box.appendChild(foot);
    el.appendChild(box);

    // ── 근거 ──
    function renderChips(rid) {
      const r = rows[rid];
      if (!r || !r.chips) return;
      const badIds = (lastWrong.evidence && lastWrong.evidence[rid]) || [];
      const missing = lastWrong.rows && list(lastWrong.rows[rid]).indexOf('evidence') >= 0 && !badIds.length;
      r.chips.textContent = '';
      if (!r.evidence.length) {
        const empty = E('span', 'tn-chips-empty' + (missing ? ' is-wrong' : ''), (missing ? '✕ ' : '') + t('evidenceNone'));
        if (missing) empty.setAttribute('data-wrong', '1');
        r.chips.appendChild(empty);
      }
      r.evidence.forEach(id => {
        const c = E('button', 'tn-chip');
        c.type = 'button';
        c.setAttribute('data-word', id);
        c.setAttribute('aria-label', t('remove', { w: G.modern(wordText16[id] || id) }));
        const vis = E('span', 'g789-vis');
        vis.setAttribute('aria-hidden', 'true');
        vis.appendChild(o.yet(String(wordText16[id] || id)));
        c.appendChild(vis);
        if (badIds.indexOf(id) >= 0) { c.classList.add('is-wrong'); c.setAttribute('data-wrong', '1'); }
        if (r.answer && r.answer.indexOf(id) >= 0) c.classList.add('is-answer');
        c.disabled = locked;
        c.addEventListener('click', () => { if (!locked) { r.evidence = r.evidence.filter(x => x !== id); clearRowWrong(rid); renderChips(rid); syncActive(); } });
        r.chips.appendChild(c);
      });
    }
    function clearRowWrong(rid) {
      if (lastWrong.evidence) delete lastWrong.evidence[rid];
      if (lastWrong.rows && lastWrong.rows[rid]) {
        lastWrong.rows[rid] = lastWrong.rows[rid].filter(x => x !== 'evidence');
        if (!lastWrong.rows[rid].length) { delete lastWrong.rows[rid]; rows[rid].el.classList.remove('is-wrong'); }
      }
    }
    function toggleEvidence(id) {
      if (locked) return;
      const r = activeRow && rows[activeRow];
      if (!r || !r.chips) { note.textContent = t('noRow'); return; }
      if (r.evidence.indexOf(id) >= 0) r.evidence = r.evidence.filter(x => x !== id);
      else r.evidence.push(id);
      clearRowWrong(activeRow);
      renderChips(activeRow);
      syncActive();
    }
    function syncActive() {
      const r = activeRow && rows[activeRow];
      Object.keys(rows).forEach(k => {
        const on = k === activeRow;
        rows[k].el.classList.toggle('is-active', on);
        if (rows[k].pick) rows[k].pick.setAttribute('aria-pressed', String(on));
      });
      Object.keys(words16).forEach(id => {
        words16[id].setAttribute('aria-pressed', String(!!r && !!r.chips && r.evidence.indexOf(id) >= 0));
        words16[id].disabled = locked;
      });
      Object.keys(words15).forEach(id => words15[id].classList.toggle('is-example', !!r && list(r.cfg.ex15).indexOf(id) >= 0));
      refresh();
    }

    function complete() { return graded.every(rc => rows[rc.id].status.get() !== null); }
    function refresh() {
      if (locked) { submit.disabled = true; submit.hidden = true; return; }
      const ok = complete();
      submit.disabled = !ok;
      if (!ok) note.textContent = t('needAll');
      else if (note.textContent === t('needAll')) note.textContent = '';
    }
    function collect() {
      const out = {};
      graded.forEach(rc => { out[rc.id] = { status: rows[rc.id].status.get(), evidence: rows[rc.id].evidence.slice() }; });
      return out;
    }
    function lockAll() {
      locked = true;
      graded.forEach(rc => { rows[rc.id].status.disable(true); rows[rc.id].pick.disabled = true; renderChips(rc.id); });
      syncActive();
    }
    submit.addEventListener('click', () => {
      if (locked || !complete()) return;
      wrongSeen = false;
      o.onSubmit(collect());
      if (!wrongSeen) lockAll();   // 맞은 제출은 진행기가 기믹에 알리지 않는다 — showWrong 없이 돌아오면 끝난 것
    });

    graded.forEach(rc => renderChips(rc.id));
    syncActive();
    if (locked) lockAll();

    function acceptable(rid) {
      const a = o.item && o.item.answer && o.item.answer[rid];
      return a && Array.isArray(a.evidence) ? a.evidence : [];
    }

    return {
      showWrong(info) {
        const w = info && info.wrong && typeof info.wrong === 'object' ? info.wrong : {};
        wrongSeen = true;
        lastWrong = { rows: Object.assign({}, w.rows || {}), evidence: Object.assign({}, w.evidence || {}) };
        graded.forEach(rc => {
          const bad = list(lastWrong.rows[rc.id]);
          const r = rows[rc.id];
          r.el.classList.toggle('is-wrong', bad.length > 0);
          if (bad.indexOf('status') >= 0) r.status.markWrong(); else r.status.clearMarks();
          renderChips(rc.id);
        });
        note.textContent = t('wrongNote');
      },
      showHint(step, target) {
        if (step < 2) return;
        let ids = typeof target === 'string' && rows[target] && rows[target].chips ? [target] : Object.keys(lastWrong.rows || {}).filter(k => rows[k]);
        if (!ids.length) ids = graded.map(rc => rc.id);
        ids.forEach(rid => {
          const r = rows[rid];
          r.el.classList.add('is-hint');
          list(r.cfg.ex15).forEach(id => { if (words15[id]) { words15[id].classList.add('is-cue'); words15[id].setAttribute('data-cue', '1'); } });
          // 근거가 있는 16세기 글 묶음(블록)만 빛낸다 — 낱말 자체는 알려 주지 않는다
          acceptable(rid).forEach(id => {
            const w = list(p16.words).filter(x => x.id === id)[0];
            if (w) { const b = blocks16[w.block || list(p16.orig)[0]]; if (b) b.classList.add('is-hint'); }
            else if (words16[id]) { const ex = words16[id].closest('.tn-extra'); if (ex) ex.classList.add('is-hint'); }
          });
        });
        activeRow = ids[0];
        syncActive();
        note.textContent = t('hintNote');
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        lastWrong = {};
        graded.forEach(rc => {
          const r = rows[rc.id];
          const want = a[rc.id] || {};
          r.el.classList.remove('is-wrong');
          if (want.status !== undefined) { r.status.set(want.status); r.status.clearMarks(); r.status.markAnswer(want.status, t('answerTag')); }
          if (Array.isArray(want.evidence)) { r.evidence = want.evidence.slice(); r.answer = want.evidence.slice(); }
        });
        note.textContent = '';
        lockAll();
      },
      destroy() { box.remove(); }
    };
  }

  NM.gimmicks.register('twoEraNotebook', { mount, check });
})(typeof window !== 'undefined' ? window : globalThis);
