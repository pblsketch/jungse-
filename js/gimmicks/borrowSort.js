'use strict';
/*
 * 기믹 borrowSort — 스테이지 1 「빌려 쓴 글자」 뜻이냐 소리냐 (spec §7 스테이지 1, plan G2).
 * 原文 줄의 한자마다 '뜻을 빌림(hun)' / '소리를 빌림(eum)' 을 고르고, 사례가 모이면 규칙 카드 문장 완성 공용 부품
 * (o.rulecard, js/ui/rulecard.js)으로 규칙 "실질 형태소는 대체로 뜻, 조사·어미는 대체로 소리"를 확정한다.
 *
 * ■ config (장면 데이터)
 *   lines: [{ orig: '<原文 블록 id>', line: <줄 번호, 0부터>,
 *             targets: [{ at: <글자 자리, 0부터·빈칸 포함>, id: '<표시 id>', note?: { kind: 'know'|'interp', text } }],
 *             notes?: [{ at: <자리> | [자리…], kind: 'interp'|'know', text }] }]
 *     原文 글자는 NM.data.ORIG[orig].lines[line] 에서만 그린다(옮겨 적지 않는다). 줄은 대괄호·루비 표기가 없는 한자 줄이어야 한다.
 *     targets 의 note: 끝난 뒤(맞음·정답 보기)에만 그 글자 아래에 보이는 설명(예: 향찰 如 = 새김을 빌린 훈가자 → 'know').
 *     notes: 고르지 않는 글자의 설명(학설이 갈리는 東京·良 → 'interp'). 처음부터 보이고, 그 글자는 물결 밑줄로 표시한다.
 *   rule?: { sentence: '<규칙 문장, 빈칸 {?}>', cards: [{ id, text }] }    규칙 카드 문장 완성(없으면 가르기만)
 *   labels?: { hun, eum }   단추 글자 바꾸기(기본 '뜻' / '소리')
 * ■ answer  { marks: { <표시 id>: 'hun'|'eum' }, rule?: '<카드 id>' }
 * ■ 판정(check): 표시 id 마다 같은지, 규칙 카드 id 가 같은지. 틀린 부분 = 표시 id 들과 'rule'.
 *   hints[1] 강조 대상: 표시 id, 'rule', 또는 그 배열. null 이면 마지막에 틀린 곳.
 * 필요: core/ns.js, ui/stage-gimmick.js, ui/marker.js, ui/rulecard.js, data/orig.generated.js, data/text-g-borrowSort.js
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'borrowSort';
  const CHOICES = ['hun', 'eum'];

  /* ---------- 문구 ---------- */
  function lookup(key) {
    const T = NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME];
    if (!T) return undefined;
    return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T);
  }
  function tx(key, vars) {
    const v = lookup(key);
    if (typeof v !== 'string') { NM.reportError('g.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
  }

  /* ---------- 순수 부분 ---------- */
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);
  // config 를 풀어 줄마다 { orig, line, chars, targets, notes, block } (原文이 없거나 자리가 틀리면 errors 에 모은다)
  function resolve(config) {
    const c = config && typeof config === 'object' ? config : {};
    const errors = [], lines = [], ids = [];
    list(c.lines).forEach((ln, li) => {
      const block = NM.data && NM.data.ORIG && NM.data.ORIG[ln.orig];
      const text = block && Array.isArray(block.lines) ? block.lines[ln.line | 0] : undefined;
      if (typeof text !== 'string') { errors.push('missing 原文 line: ' + ln.orig + '#' + ln.line); return; }
      if (/[[\]{}]/.test(text)) errors.push('原文 line has markup (not supported): ' + ln.orig + '#' + ln.line);
      const chars = Array.from(text);
      const targets = [];
      list(ln.targets).forEach(t => {
        if (typeof t.id !== 'string' || !t.id) { errors.push('target without id in line ' + li); return; }
        if (ids.indexOf(t.id) >= 0) { errors.push('duplicate target id: ' + t.id); return; }
        const ch = chars[t.at];
        if (typeof t.at !== 'number' || !ch || /\s/.test(ch)) { errors.push('bad target position: ' + t.id); return; }
        ids.push(t.id);
        targets.push(Object.assign({}, t, { char: ch, note: t.note && typeof t.note.text === 'string' ? t.note : null }));
      });
      const notes = list(ln.notes).map(n => ({ at: (Array.isArray(n.at) ? n.at : [n.at]).filter(i => typeof i === 'number' && chars[i]), kind: n.kind === 'know' ? 'know' : 'interp', text: String(n.text || '') }));
      notes.forEach(n => n.at.forEach(i => { if (targets.some(t => t.at === i)) errors.push('note on a scored character: ' + ln.orig + '@' + i); }));
      lines.push({ orig: ln.orig, line: ln.line | 0, block, chars, targets, notes });
    });
    return { lines, ids, rule: c.rule && Array.isArray(c.rule.cards) ? c.rule : null, errors };
  }
  function check(answer, item) {
    const r = resolve(item && item.config);
    const want = item && item.answer && typeof item.answer === 'object' ? item.answer : {};
    const wantMarks = want.marks && typeof want.marks === 'object' ? want.marks : {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const gotMarks = got.marks && typeof got.marks === 'object' ? got.marks : {};
    const wrong = r.ids.filter(id => gotMarks[id] !== wantMarks[id]);
    if (r.rule && got.rule !== want.rule) wrong.push('rule');
    return wrong.length ? { correct: false, wrong } : true;
  }

  /* ---------- 화면 ---------- */
  function mount(host, o) {
    const doc = o.document || root.document;
    const item = o.item || {};
    const cfg = o.config || {};
    const R = resolve(cfg);
    R.errors.forEach(e => NM.reportError('g.' + NAME + '.config', e + ' (' + (item.id || '?') + ')'));
    const want = item.answer && typeof item.answer === 'object' ? item.answer : { marks: {} };
    const wantMarks = want.marks || {};
    R.ids.forEach(id => { if (CHOICES.indexOf(wantMarks[id]) < 0) NM.reportError('g.' + NAME + '.answer', 'answer.marks.' + id + ' must be hun|eum'); });
    const labels = { hun: (cfg.labels && cfg.labels.hun) || tx('hun'), eum: (cfg.labels && cfg.labels.eum) || tx('eum') };
    const marks = {};
    let ruleSel = null, locked = false, wrongCalled = false, lastWrong = [];

    function el(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }

    const box = el('div', 'nm-gbs');
    box.setAttribute('data-state', 'open');
    box.appendChild(el('p', 'nm-gbs-lead', tx('lead')));
    const pages = R.lines.filter(ln => ln.targets.length);
    const sections = [];
    let pageIndex = 0;
    const nav = el('div', 'nm-gbs-nav');
    const pageLabel = el('span', 'nm-gbs-page');
    pageLabel.setAttribute('aria-live', 'polite');
    const previous = el('button', 'nm-st-btn', tx('previous'));
    previous.type = 'button';
    const next = el('button', 'nm-st-btn', tx('next'));
    next.type = 'button';
    const practiceNote = el('p', 'nm-gbs-practice');
    practiceNote.setAttribute('aria-live', 'polite');
    nav.append(previous, pageLabel, next);
    nav.hidden = !cfg.paged;
    box.append(nav, practiceNote);

    const cells = {};   // 표시 id → { cell, opts:{hun,eum}, flag, sr, noteBox, marks:{} }
    R.lines.forEach((ln, li) => {
      const sec = el('section', 'nm-gbs-line');
      sec.setAttribute('data-orig', ln.orig);
      sec.setAttribute('data-line', String(ln.line));
      const head = el('div', 'nm-gbs-linehead');
      if (NM.ui.marker) head.appendChild(NM.ui.marker.badge('orig', { document: doc }));
      if (ln.block.title) head.appendChild(el('span', 'nm-gbs-title', ln.block.title));
      sec.appendChild(head);
      const text = ln.chars.join('');
      const sr = el('p', 'nm-sr', tx('lineAria', { n: li + 1 }) + ' ' + text);
      sec.appendChild(sr);
      const row = el('div', 'nm-gbs-row');
      const interpAt = {};
      ln.notes.forEach(n => n.at.forEach(i => { interpAt[i] = n.kind; }));
      const eum = NM.ui.stageYet && NM.ui.stageYet.eums ? NM.ui.stageYet.eums(ln.chars) : [];
      ln.chars.forEach((ch, i) => {
        if (/\s/.test(ch)) { const g = el('span', 'nm-gbs-gap'); g.setAttribute('aria-hidden', 'true'); row.appendChild(g); return; }
        const t = ln.targets.filter(x => x.at === i)[0];
        const cell = el('div', 'nm-gbs-cell');
        const c = el('span', 'nm-gbs-char nm-yet', ch);
        c.setAttribute('aria-hidden', 'true');
        cell.appendChild(c);
        if (eum[i]) { const e = el('span', 'nm-eum-rt nm-gbs-eum', eum[i]); e.setAttribute('aria-hidden', 'true'); cell.appendChild(e); }
        if (!t) {
          if (interpAt[i]) { cell.classList.add('is-note'); cell.setAttribute('data-note', interpAt[i]); }
          row.appendChild(cell);
          return;
        }
        cell.classList.add('is-target');
        cell.setAttribute('data-target', t.id);
        const flag = el('span', 'nm-gbs-flag');
        flag.setAttribute('aria-hidden', 'true');
        cell.appendChild(flag);
        const grp = el('div', 'nm-gbs-opts');
        grp.setAttribute('role', 'radiogroup');
        grp.setAttribute('aria-label', tx('groupAria', { char: ch }));
        const opts = {};
        CHOICES.forEach(k => {
          const b = el('button', 'nm-gbs-opt', labels[k]);
          b.type = 'button';
          b.setAttribute('role', 'radio');
          b.setAttribute('aria-checked', 'false');
          b.setAttribute('data-choice', k);
          b.setAttribute('aria-label', tx('optionAria', { char: ch, choice: tx(k + 'Long') }));
          b.addEventListener('click', () => choose(t.id, k));
          b.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            const other = opts[k === 'hun' ? 'eum' : 'hun'];
            other.focus();
            choose(t.id, k === 'hun' ? 'eum' : 'hun');
          });
          opts[k] = b;
          grp.appendChild(b);
        });
        cell.appendChild(grp);
        const status = el('span', 'nm-sr nm-gbs-sr');
        cell.appendChild(status);
        cells[t.id] = { cell, opts, flag, sr: status, t, marks: {} };
        row.appendChild(cell);
      });
      sec.appendChild(row);
      ln.targets.filter(t => t.reading && t.gloss).forEach(t => {
        sec.appendChild(el('p', 'nm-gbs-reading', tx('reading', { char: t.char, eum: eum[t.at] || '', gloss: t.gloss, reading: t.reading })));
      });
      // 고르지 않는 글자의 설명(해석·알아 두기)은 처음부터, 고르는 글자의 설명은 끝난 뒤
      ln.notes.forEach(n => {
        if (!NM.ui.marker || !n.text) return;
        const title = n.at.map(i => ln.chars[i]).join('');
        const card = NM.ui.marker.card({ kind: n.kind, title, text: n.text, document: doc });
        card.classList.add('nm-gbs-note');
        sec.appendChild(card);
      });
      const after = el('div', 'nm-gbs-after');
      after.hidden = true;
      ln.targets.filter(t => t.note).forEach(t => {
        if (!NM.ui.marker) return;
        const card = NM.ui.marker.card({ kind: t.note.kind === 'interp' ? 'interp' : 'know', title: tx('noteFor', { char: t.char }), text: t.note.text, document: doc });
        card.classList.add('nm-gbs-note');
        card.setAttribute('data-target', t.id);
        after.appendChild(card);
      });
      sec.appendChild(after);
      sec._after = after;
      sections.push({ sec, ln });
      box.appendChild(sec);
    });

    // 규칙 카드 문장 완성
    let rule = null, ruleSec = null, ruleNote = null;
    if (R.rule) {
      ruleSec = el('section', 'nm-gbs-rule');
      ruleSec.appendChild(el('h4', 'nm-gbs-ruletitle', tx('ruleTitle')));
      ruleNote = el('p', 'nm-gbs-rulenote', tx('ruleLocked'));
      ruleSec.appendChild(ruleNote);
      const rflag = el('span', 'nm-gbs-flag nm-gbs-ruleflag');
      rflag.setAttribute('aria-hidden', 'true');
      ruleSec.appendChild(rflag);
      rule = o.rulecard({ sentence: R.rule.sentence, cards: R.rule.cards, selected: null, disabled: true, fill: o.fill,
        onSelect(id) { ruleSel = id; setRuleMark('wrong', false); setRuleMark('hint', false); refresh(); } });
      ruleSec.appendChild(rule.el);
      ruleSec._flag = rflag;
      ruleSec._marks = {};
      box.appendChild(ruleSec);
    }

    const foot = el('div', 'nm-gbs-foot');
    const left = el('span', 'nm-gbs-left');
    left.setAttribute('aria-live', 'polite');
    foot.appendChild(left);
    const submit = el('button', 'nm-st-btn nm-st-primary nm-gbs-submit', tx('submit'));
    submit.type = 'button';
    submit.addEventListener('click', doSubmit);
    foot.appendChild(submit);
    box.appendChild(foot);
    host.appendChild(box);

    function sym(m) { return m === 'wrong' ? '×' : m === 'hint' ? '△' : m === 'answer' ? '○' : ''; }
    function markOf(ms) { return ms.answer ? 'answer' : ms.wrong ? 'wrong' : ms.hint ? 'hint' : ''; }
    function setMark(id, key, on) {
      const c = cells[id];
      if (!c) return;
      c.marks[key] = !!on;
      if (key === 'answer' && on) { c.marks.wrong = false; c.marks.hint = false; }
      ['wrong', 'hint', 'answer'].forEach(k => c.cell.classList.toggle('is-' + k, !!c.marks[k]));
      const m = markOf(c.marks);
      if (m) c.cell.setAttribute('data-mark', m); else c.cell.removeAttribute('data-mark');
      c.flag.textContent = sym(m);
      c.sr.textContent = m ? tx('mark.' + m) : '';
    }
    function setRuleMark(key, on) {
      if (!ruleSec) return;
      ruleSec._marks[key] = !!on;
      if (key === 'answer' && on) { ruleSec._marks.wrong = false; ruleSec._marks.hint = false; }
      ['wrong', 'hint', 'answer'].forEach(k => ruleSec.classList.toggle('is-' + k, !!ruleSec._marks[k]));
      const m = markOf(ruleSec._marks);
      if (m) ruleSec.setAttribute('data-mark', m); else ruleSec.removeAttribute('data-mark');
      ruleSec._flag.textContent = sym(m);
    }
    function allMarked() { return R.ids.every(id => CHOICES.indexOf(marks[id]) >= 0); }
    function showPage() {
      if (!cfg.paged) { previous.disabled = next.disabled = locked; return; }
      const current = pages[pageIndex];
      sections.forEach(({ sec, ln }) => { sec.hidden = ln.targets.length ? ln !== current : pageIndex !== pages.length - 1; });
      previous.disabled = pageIndex === 0;
      next.hidden = pageIndex === pages.length - 1;
      next.disabled = !locked && !current.targets.every(t => marks[t.id]);
      pageLabel.textContent = tx('page', { n: pageIndex + 1, total: pages.length });
      if (ruleSec) ruleSec.hidden = pageIndex !== pages.length - 1;
      submit.hidden = pageIndex !== pages.length - 1;
    }
    function goPage(index) {
      pageIndex = Math.max(0, Math.min(pages.length - 1, index));
      practiceNote.textContent = '';
      showPage();
      const body = box.closest('.nm-st-body');
      if (body) body.scrollTop = 0;
    }
    previous.addEventListener('click', () => goPage(pageIndex - 1));
    next.addEventListener('click', () => {
      if (!locked) {
        const wrong = pages[pageIndex].targets.filter(t => marks[t.id] !== wantMarks[t.id]);
        wrong.forEach(t => setMark(t.id, 'wrong', true));
        if (wrong.length) { practiceNote.textContent = tx('practiceWrong'); return; }
      }
      goPage(pageIndex + 1);
    });
    function refresh() {
      R.ids.forEach(id => CHOICES.forEach(k => {
        const b = cells[id].opts[k];
        b.setAttribute('aria-checked', String(marks[id] === k));
        b.classList.toggle('is-selected', marks[id] === k);
        b.disabled = locked;
      }));
      const n = R.ids.filter(id => CHOICES.indexOf(marks[id]) < 0).length;
      const ready = n === 0;
      if (rule) {
        rule.setDisabled(locked || !ready);
        ruleNote.textContent = locked ? '' : ready ? tx('ruleNeed') : tx('ruleLocked');
        ruleNote.hidden = locked;
      }
      left.textContent = n ? tx('left', { n }) : '';
      submit.disabled = locked || !ready || (!!rule && !ruleSel);
      showPage();
    }
    function choose(id, k) {
      if (locked) return;
      marks[id] = k;
      setMark(id, 'wrong', false);
      setMark(id, 'hint', false);
      refresh();
    }
    function doSubmit() {
      if (locked || !allMarked() || (rule && !ruleSel)) return;
      const answer = { marks: {} };
      R.ids.forEach(id => { answer.marks[id] = marks[id]; });
      if (rule) answer.rule = ruleSel;
      wrongCalled = false;
      o.onSubmit(answer);
      if (!wrongCalled && check(answer, item) === true) finish('done');
    }
    function finish(st) {
      locked = true;
      box.setAttribute('data-state', st);
      box.querySelectorAll('.nm-gbs-after').forEach(a => { a.hidden = a.childNodes.length === 0; });
      refresh();
    }

    refresh();
    if (o.readOnly) { locked = true; refresh(); box.setAttribute('data-state', 'locked'); }

    return {
      showWrong(info) {
        wrongCalled = true;
        const w = info && Array.isArray(info.wrong) ? info.wrong : [];
        R.ids.forEach(id => setMark(id, 'wrong', w.indexOf(id) >= 0));
        setRuleMark('wrong', w.indexOf('rule') >= 0);
        lastWrong = w.slice();
        if (cfg.paged) {
          const index = pages.findIndex(ln => ln.targets.some(t => w.indexOf(t.id) >= 0));
          if (index >= 0) goPage(index);
        }
      },
      showHint(step, target) {
        if (step < 2) return;
        const tl = cfg.paged && !lastWrong.length ? (allMarked() ? ['rule'] : pages[pageIndex].targets.map(t => t.id)) : target == null ? lastWrong : (Array.isArray(target) ? target : [target]);
        tl.forEach(tk => { if (tk === 'rule') setRuleMark('hint', true); else setMark(tk, 'hint', true); });
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : want;
        const am = a.marks || {};
        R.ids.forEach(id => { marks[id] = am[id]; setMark(id, 'answer', true); });
        if (rule && a.rule) { ruleSel = a.rule; rule.setSelected(a.rule); rule.reveal(a.rule); setRuleMark('answer', true); }
        finish(o.readOnly ? 'done' : 'answer');
        if (cfg.paged) goPage(pages.length - 1);
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  const def = { mount, check };
  NM.gimmicks.register(NAME, def);
  def.facts = { CHOICES, resolve };
})(typeof window !== 'undefined' ? window : globalThis);
