'use strict';
/*
 * 기믹 '높임 저울' (honorScale) — s7 「높이는 말」(고2~3). 계약: js/ui/stage-gimmick.js 머리 주석.
 * 설정·정답 모양: js/gimmicks/README-honorScale.md. 문구·활자 목록: js/data/text-g-honorScale.js (NM.data.TEXT.g.honorScale).
 *
 * ■ 하는 일 (활자 자리 slot 마다)
 *   原文 줄(블록 id 로만 가리킴)을 '조판'으로 다시 짜되, 선어말 어미가 들어갈 글자 범위(slot)를 빈 활자 자리로 비운다.
 *   1) 인물 패(주체·객체·상대 — config 의 인물)에서 이 자리의 말이 높이는 사람을 고른다. 화자 패는 저울 왼쪽에 놓여 있다.
 *   2) 선어말 어미 활자(-시- · -샤- · -[ㅅㆍㅂ]- 등, 문구 데이터의 데이터 표기)를 골라 빈 자리에 끼운다. 활자를 끼우면
 *      저울의 화자 쪽에 활자 추가 얹혀 높임 받는 사람 쪽이 올라간다(움직임 줄이기면 전환 없이 바로 기운 모양).
 *   답 = { <자리 id>: { honored: 'subject'|'object'|'listener', ending: <활자 id> } }. 판정은 id 로 한다(화면 글자 아님).
 * ■ 틀린 제출: 틀린 인물 패·틀린 활자를 흐리게(is-wrong, 기호 ✕). 도움 2: 고칠 곳 강조(is-hint, 기호 !) —
 *   활자가 틀렸으면 빈 자리와 바로 앞 글자(단서, config.cue)를, 인물이 틀렸으면 인물 패 묶음을.
 *   정답·풀이(doneByHelp)나 다시 열기: 조판을 原文대로 되돌려 끼운 자리를 보이고, 原文 카드를 함께 보인다.
 * 필요: core/yet.js, ui/stage-gimmick.js, data/text-g-honorScale.js, data/orig.generated.js (ui/marker.js 가 있으면 原文 카드)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'honorScale';
  const ROLES = ['subject', 'object', 'listener'];
  const PARTS = ['honored', 'ending'];
  const SYM = { wrong: '\u2715', hint: '!', answer: '\u25CE' };
  const SPECIAL = '\\*_{}[]|\u00B7:<>';

  function T() { return (NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME]) || {}; }
  function txt(key, vars) {
    const v = String(key).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T());
    if (typeof v !== 'string') { NM.reportError('gimmick.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
  }
  const esc = (s) => Array.from(String(s)).map(ch => (SPECIAL.indexOf(ch) >= 0 ? '\\' + ch : ch)).join('');
  const ending = (id) => (T().endings && T().endings[id]) || null;

  // 原文 한 줄 → { units: [{ text(데이터 표기), modern }], spaces: [빈칸 앞 글자 번호…] } (글자 번호는 빈칸을 빼고 0부터)
  function unitsOf(line) {
    const Y = NM.core.yet;
    const units = [], spaces = [];
    Y.parse(String(line), { bangjeom: true }).forEach(tk => {
      if (tk.type === 'ruby') { units.push({ text: '{' + esc(tk.base) + '|' + esc(tk.reading) + '}' }); return; }
      Y.splitSyllables(tk.text).forEach(u => {
        if (/^\s+$/.test(u)) { if (units.length && spaces.indexOf(units.length - 1) < 0) spaces.push(units.length - 1); return; }
        units.push({ text: esc(u) });
      });
    });
    units.forEach(u => { try { u.modern = Y.modernReading(u.text); } catch (e) { u.modern = ''; } });
    return { units, spaces };
  }

  // 판정: 자리마다 honored·ending 이 같아야 한다. 틀리면 { wrong: { 자리 id: ['honored'?, 'ending'?] } }
  function check(answer, item) {
    const want = (item && item.answer && typeof item.answer === 'object') ? item.answer : {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = {};
    let ok = true;
    Object.keys(want).forEach(id => {
      const w = want[id] || {}, g = got[id] || {};
      const bad = PARTS.filter(p => w[p] !== g[p]);
      if (bad.length) { wrong[id] = bad; ok = false; }
    });
    return ok ? true : { correct: false, wrong };
  }

  function mount(el, o) {
    const doc = o.document || root.document;
    const cfg = o.config || {};
    const cast = cfg.cast && typeof cfg.cast === 'object' ? cfg.cast : {};
    const slots = (Array.isArray(cfg.slots) ? cfg.slots : []).filter(s => s && typeof s.id === 'string' && typeof s.block === 'string');
    const S = {};               // 자리 id → { spec, units, spaces, honored, ending, v: {...} }
    let locked = !!o.readOnly;
    let lastWrong = null;

    function mk(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function yet(text, cls, opts) {
      const s = mk('span', cls || 'ghs-text');
      s.appendChild(o.yet(o.fill ? o.fill(String(text)) : String(text), opts));
      return s;
    }
    function plain(text) {
      try { return NM.core.yet.render(String(text), { bangjeom: false, ruby: 'base' }); } catch (e) { return String(text); }
    }
    const personName = (castId) => (castId && cast[castId] && cast[castId].name) || '';

    const box = mk('div', 'ghs');
    if (o.reducedMotion) box.classList.add('is-static');
    el.appendChild(box);
    const origs = mk('div', 'ghs-origs');
    origs.hidden = true;
    box.appendChild(origs);
    const seenBlocks = [];

    function inRange(i, r) { return Array.isArray(r) && r.length === 2 && i >= r[0] && i < r[1]; }

    function renderLine(st) {
      const line = st.v.line;
      line.textContent = '';
      const sp = st.spec, done = st.done;
      const word = Array.isArray(sp.word) ? sp.word : null;
      const slot = Array.isArray(sp.slot) ? sp.slot : [0, 0];
      const cue = Array.isArray(sp.cue) ? sp.cue : [slot[0] - 1, slot[0]];
      // 같은 줄의 다른 활자 자리도 끝나기 전에는 비워 둔다(이 판에서 다른 자리의 정답이 보이지 않게)
      const others = done ? [] : slots.filter(o2 => o2 !== sp && o2.block === sp.block && (o2.line | 0) === (sp.line | 0) && Array.isArray(o2.slot));
      st.v.cueEls = [];
      st.v.slotbox = null;
      let wordEl = null;
      st.units.forEach((u, i) => {
        let parent = line;
        if (word && inRange(i, word)) {
          if (!wordEl) { wordEl = mk('span', 'ghs-word'); line.appendChild(wordEl); }
          parent = wordEl;
        }
        const other = others.filter(o2 => inRange(i, o2.slot))[0];
        if (other && !inRange(i, slot)) {
          if (i === other.slot[0]) {
            const ph = mk('span', 'ghs-otherslot', '…');
            ph.setAttribute('data-slot', other.id);
            ph.setAttribute('aria-label', txt('slotEmpty'));
            parent.appendChild(ph);
          }
        } else if (!done && inRange(i, slot)) {
          if (i === slot[0]) {
            const b = mk('button', 'ghs-slotbox');
            b.type = 'button';
            b.setAttribute('data-slot', sp.id);
            paintSlotbox(st, b);
            b.addEventListener('click', () => { if (!locked && st.ending) { st.ending = null; clearPart(st, 'ending'); refresh(st); } });
            parent.appendChild(b);
            st.v.slotbox = b;
          }
        } else {
          const c = yet(u.text, 'ghs-u', { yetAll: true });
          c.setAttribute('data-i', String(i));
          if (done && inRange(i, slot)) c.classList.add('ghs-slotunit', 'is-answer');
          if (inRange(i, cue)) { c.classList.add('ghs-cue'); st.v.cueEls.push(c); }
          parent.appendChild(c);
        }
        if (st.spaces.indexOf(i) >= 0) { line.appendChild(doc.createTextNode(' ')); wordEl = null; }
        else if (word && i === word[1] - 1) wordEl = null;
      });
      st.v.frameTitle.textContent = txt(done ? 'frameDone' : 'frame');
    }

    function paintSlotbox(st, b) {
      b.textContent = '';
      const e = st.ending && ending(st.ending);
      if (e) {
        b.appendChild(yet(e.label, 'ghs-slot-type'));
        b.setAttribute('aria-label', txt('slotFilled', { e: plain(e.label) }));
        b.classList.add('is-filled');
      } else {
        b.appendChild(mk('span', 'ghs-slot-empty', txt('slot')));
        b.setAttribute('aria-label', txt('slotEmpty'));
        b.classList.remove('is-filled');
      }
      const m = mk('span', 'ghs-mark');
      m.setAttribute('aria-hidden', 'true');
      b.appendChild(m);
    }

    function clearPart(st, part) {
      const els = part === 'honored' ? [st.v.tokens].concat(st.v.tokenBtns) : [st.v.slotbox, st.v.tray].concat(st.v.typeBtns).concat(st.v.cueEls);
      els.forEach(e => {
        if (!e) return;
        e.classList.remove('is-wrong', 'is-hint');
        e.removeAttribute('data-wrong');
        const m = e.querySelector && e.querySelector(':scope > .ghs-mark');
        if (m) m.textContent = '';
      });
    }

    function refresh(st) {
      st.v.tokenBtns.forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === st.honored)));
      st.v.typeBtns.forEach(b => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-ending') === st.ending));
        b.disabled = locked || !st.honored;
      });
      st.v.pickFirst.hidden = !!st.honored || locked;
      if (st.v.slotbox) paintSlotbox(st, st.v.slotbox);
      // 저울
      const sc = st.v.scale;
      const e = st.ending && ending(st.ending);
      sc.setAttribute('data-tilt', e ? '1' : '0');
      st.v.weight.textContent = '';
      if (e) st.v.weight.appendChild(yet(e.label, 'ghs-weight-type'));
      st.v.rightName.textContent = '';
      if (st.honored) {
        st.v.rightName.appendChild(mk('span', 'ghs-pan-role', txt('roles.' + st.honored)));
        st.v.rightName.appendChild(yet(personName(st.spec.roles && st.spec.roles[st.honored]), 'ghs-pan-name'));
      }
      const who = st.honored ? plain(personName(st.spec.roles && st.spec.roles[st.honored])) || txt('roles.' + st.honored) : '';
      sc.setAttribute('aria-label', txt('scale') + ': ' + (e && who ? txt('scaleTilted', { who, kind: txt('kinds.' + e.kind) }) : txt('scaleEmpty')));
    }

    slots.forEach(sp => {
      let parsed;
      const blk = NM.data.ORIG && NM.data.ORIG[sp.block];
      const raw = blk && Array.isArray(blk.lines) ? blk.lines[sp.line | 0] : null;
      if (typeof raw !== 'string') { NM.reportError('gimmick.' + NAME, 'missing 原文 line: ' + sp.block); return; }
      try { parsed = unitsOf(raw); } catch (e) { NM.reportError('gimmick.' + NAME, e); return; }
      if (seenBlocks.indexOf(sp.block) < 0) seenBlocks.push(sp.block);
      const st = { spec: sp, units: parsed.units, spaces: parsed.spaces, honored: null, ending: null, done: false, v: {} };
      S[sp.id] = st;
      const sec = mk('section', 'ghs-slot');
      sec.setAttribute('data-slot', sp.id);
      // 조판
      const frame = mk('div', 'ghs-frame');
      st.v.frameTitle = mk('p', 'ghs-frame-title');
      frame.appendChild(st.v.frameTitle);
      st.v.line = mk('p', 'ghs-line nm-yet');
      frame.appendChild(st.v.line);
      sec.appendChild(frame);
      // 1) 인물 패
      sec.appendChild(mk('p', 'ghs-step', txt('step1')));
      const tokens = mk('div', 'ghs-tokens');
      tokens.setAttribute('role', 'group');
      tokens.setAttribute('aria-label', txt('honored'));
      const tm = mk('span', 'ghs-mark'); tm.setAttribute('aria-hidden', 'true'); tokens.appendChild(tm);
      st.v.tokens = tokens;
      st.v.tokenBtns = [];
      ROLES.forEach(role => {
        const who = sp.roles && sp.roles[role];
        if (!who) return;
        const b = mk('button', 'ghs-token');
        b.type = 'button';
        b.setAttribute('data-role', role);
        b.appendChild(mk('span', 'ghs-token-role', txt('roles.' + role)));
        b.appendChild(yet(personName(who), 'ghs-token-name'));
        b.appendChild(mk('span', 'ghs-token-help', txt('roleHelp.' + role)));
        const m = mk('span', 'ghs-mark'); m.setAttribute('aria-hidden', 'true'); b.appendChild(m);
        b.addEventListener('click', () => {
          if (locked) return;
          st.honored = role;
          clearPart(st, 'honored');
          refresh(st);
        });
        tokens.appendChild(b);
        st.v.tokenBtns.push(b);
      });
      sec.appendChild(tokens);
      // 2) 활자
      sec.appendChild(mk('p', 'ghs-step', txt('step2')));
      st.v.pickFirst = mk('p', 'ghs-pickfirst', txt('pickFirst'));
      sec.appendChild(st.v.pickFirst);
      const tray = mk('div', 'ghs-tray');
      tray.setAttribute('role', 'group');
      tray.setAttribute('aria-label', txt('tray'));
      st.v.tray = tray;
      st.v.typeBtns = [];
      const order = Array.isArray(sp.choices) ? sp.choices : (Array.isArray(cfg.choices) ? cfg.choices : (T().order || []));
      order.forEach(id => {
        const e = ending(id);
        if (!e) { NM.reportError('gimmick.' + NAME, 'unknown ending: ' + id); return; }
        const b = mk('button', 'ghs-type');
        b.type = 'button';
        b.setAttribute('data-ending', id);
        b.setAttribute('aria-label', plain(e.label) + ', ' + txt('kinds.' + e.kind));
        b.appendChild(yet(e.label, 'ghs-type-face'));
        const m = mk('span', 'ghs-mark'); m.setAttribute('aria-hidden', 'true'); b.appendChild(m);
        b.addEventListener('click', () => {
          if (locked || !st.honored) return;
          st.ending = id;
          clearPart(st, 'ending');
          refresh(st);
        });
        tray.appendChild(b);
        st.v.typeBtns.push(b);
      });
      sec.appendChild(tray);
      // 저울
      const sc = mk('div', 'ghs-scale');
      sc.setAttribute('role', 'img');
      sc.appendChild(mk('span', 'ghs-scale-title', txt('scale')));
      const stage = mk('div', 'ghs-scale-stage');
      stage.setAttribute('aria-hidden', 'true');
      const beam = mk('div', 'ghs-beam');
      const left = mk('div', 'ghs-pan ghs-pan-left');
      const lw = mk('div', 'ghs-pan-body');
      lw.appendChild(mk('span', 'ghs-pan-role', txt('roles.speaker')));
      if (sp.roles && sp.roles.speaker) lw.appendChild(yet(personName(sp.roles.speaker), 'ghs-pan-name'));
      st.v.weight = mk('div', 'ghs-weight');
      lw.appendChild(st.v.weight);
      left.appendChild(lw);
      const right = mk('div', 'ghs-pan ghs-pan-right');
      st.v.rightName = mk('div', 'ghs-pan-body');
      right.appendChild(st.v.rightName);
      beam.appendChild(left); beam.appendChild(right);
      stage.appendChild(beam);
      stage.appendChild(mk('div', 'ghs-post'));
      sc.appendChild(stage);
      st.v.scale = sc;
      sec.appendChild(sc);
      box.appendChild(sec);
      renderLine(st);
      refresh(st);
    });

    const actions = mk('div', 'ghs-actions');
    const submit = mk('button', 'nm-st-btn nm-st-primary ghs-submit', txt('submit'));
    submit.type = 'button';
    actions.appendChild(submit);
    box.appendChild(actions);

    function current() {
      const out = {};
      Object.keys(S).forEach(id => { out[id] = { honored: S[id].honored, ending: S[id].ending }; });
      return out;
    }
    function markEl(e, kind) {
      if (!e) return;
      e.classList.add('is-' + kind);
      if (kind === 'wrong') e.setAttribute('data-wrong', '1');
      const m = e.querySelector && e.querySelector(':scope > .ghs-mark');
      if (m) { m.textContent = SYM[kind]; m.setAttribute('title', txt(kind + 'Mark')); }
    }
    function lock() {
      locked = true;
      box.classList.add('is-locked');
      box.querySelectorAll('button').forEach(b => { b.disabled = true; });
      Object.keys(S).forEach(id => { S[id].v.pickFirst.hidden = true; });
    }
    function reveal() {
      Object.keys(S).forEach(id => {
        const st = S[id];
        st.done = true;
        renderLine(st);
        refresh(st);
        st.v.tokenBtns.forEach(b => { if (b.getAttribute('data-role') === st.honored) markEl(b, 'answer'); });
        st.v.typeBtns.forEach(b => { if (b.getAttribute('data-ending') === st.ending) markEl(b, 'answer'); });
      });
      if (!origs.childNodes.length && NM.ui && NM.ui.marker) {
        seenBlocks.forEach(b => { const c = NM.ui.marker.orig(b, { document: doc }); if (c) origs.appendChild(c); });
      }
      origs.hidden = false;
      lock();
    }

    submit.addEventListener('click', () => {
      if (locked) return;
      const ans = current();
      o.onSubmit(ans);
      let r = null;
      try { r = check(ans, o.item); } catch (e) { r = null; }
      if (r === true) reveal();
    });
    if (locked) lock();

    return {
      showWrong(info) {
        const w = (info && info.wrong) || {};
        lastWrong = w;
        Object.keys(S).forEach(id => PARTS.forEach(p => clearPart(S[id], p)));
        Object.keys(w).forEach(id => {
          const st = S[id];
          if (!st) return;
          (w[id] || []).forEach(p => {
            if (p === 'honored') st.v.tokenBtns.forEach(b => { if (b.getAttribute('data-role') === st.honored) markEl(b, 'wrong'); });
            if (p === 'ending') {
              markEl(st.v.slotbox, 'wrong');
              st.v.typeBtns.forEach(b => { if (b.getAttribute('data-ending') === st.ending) markEl(b, 'wrong'); });
            }
          });
        });
      },
      showHint(step, target) {
        if (step < 2) return;
        const tg = target && typeof target === 'object' ? target : lastWrong;
        if (!tg) return;
        Object.keys(tg).forEach(id => {
          const st = S[id];
          if (!st) return;
          (Array.isArray(tg[id]) ? tg[id] : [tg[id]]).forEach(p => {
            if (p === 'honored') markEl(st.v.tokens, 'hint');
            if (p === 'ending') { markEl(st.v.slotbox, 'hint'); markEl(st.v.tray, 'hint'); st.v.cueEls.forEach(c => c.classList.add('is-hint')); }
          });
        });
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        Object.keys(a).forEach(id => {
          const st = S[id];
          if (!st || !a[id]) return;
          st.honored = a[id].honored || null;
          st.ending = a[id].ending || null;
          PARTS.forEach(p => clearPart(st, p));
        });
        reveal();
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  NM.gimmicks.register(NAME, { mount, check, logic: { unitsOf, check } });
})(typeof window !== 'undefined' ? window : globalThis);
