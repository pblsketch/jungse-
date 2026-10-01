'use strict';
/*
 * 기믹 '음절 조립' (syllableBuild) — s3 「모아 써야 소리가 된다」. 계약: js/ui/stage-gimmick.js 머리 주석.
 * 설정·정답 모양: js/gimmicks/README-syllableBuild.md. 문구: js/data/text-g-syllableBuild.js (NM.data.TEXT.g.syllableBuild).
 *
 * ■ 하는 일
 *   과녁(targets)마다 초성·중성·종성 세 자리에 글자 블록(config 의 호환 자모)을 모아 한 음절을 만든다.
 *   한 자리에 블록을 둘·셋 넣으면 나란히 쓰기(병서)·모음자 합치기가 되고, 학교급 용어 이름표가 붙는다.
 *   모은 글자는 데이터 표기 '[초중종]' 으로 옛한글 조합기(NM.core.yet)를 거쳐 DOM 글자로 보인다(o.yet).
 *   판정은 화면 글자가 아니라 자리별 자모 원자열로 한다(ㄲ = ㄱㄱ, ㅘ = ㅗㅏ — NM.data.JAMO.COMPAT 로 풀어 비교).
 * ■ 조작: 자리 단추로 넣을 자리를 고른 뒤 블록을 누른다(키보드 Tab·Enter·Space). 블록을 자리에 끌어다 놓아도 된다.
 *   넣은 블록을 누르면 빠진다. 연습 과녁(practice: true)은 채점하지 않는다(알아 두기, 예: 연서).
 * ■ 틀린 제출: 틀린 자리를 흐리게(is-wrong, 기호 ✕) / 도움 2: 고칠 자리 강조(is-hint, 기호 !) / 정답: is-answer.
 * 필요: core/yet.js, data/jamo.js, ui/stage-gimmick.js, data/text-g-syllableBuild.js (ui/marker.js 가 있으면 원문 카드)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'syllableBuild';
  const SLOTS = ['cho', 'jung', 'jong'];
  const MAX = 3;
  const SYM = { wrong: '✕', hint: '!', answer: '◎' };

  function T() { return (NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME]) || {}; }
  function txt(key, vars) {
    const v = String(key).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T());
    if (typeof v !== 'string') { NM.reportError('gimmick.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
  }
  const J = () => NM.data.JAMO;
  const isCons = (a) => J().CONSONANTS.indexOf(a) >= 0;
  const isVow = (a) => J().VOWELS.indexOf(a) >= 0;

  // 호환 자모·원자 글자열 → 원자열 (ㄲ → ㄱㄱ, ㅘ → ㅗㅏ). 자모가 아닌 글자는 그대로 둔다(비교에서 틀림이 된다).
  function atoms(s) {
    let out = '';
    for (const ch of String(s == null ? '' : s)) {
      if (isCons(ch) || isVow(ch)) out += ch;
      else if (J().COMPAT[ch] != null) out += J().COMPAT[ch];
      else out += ch;
    }
    return out;
  }
  function normSlots(a) {
    const o = a && typeof a === 'object' ? a : {};
    const one = (v) => atoms(Array.isArray(v) ? v.join('') : v);
    return { cho: one(o.cho), jung: one(o.jung), jong: one(o.jong) };
  }

  // 판정: item.answer 의 과녁마다 자리별 원자열이 같아야 한다. 틀리면 { wrong: { 과녁 id: [자리…] } }
  function check(answer, item) {
    const want = (item && item.answer && typeof item.answer === 'object') ? item.answer : {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = {};
    let ok = true;
    Object.keys(want).forEach(id => {
      const w = normSlots(want[id]), g = normSlots(got[id]);
      const bad = SLOTS.filter(s => w[s] !== g[s]);
      if (bad.length) { wrong[id] = bad; ok = false; }
    });
    return ok ? true : { correct: false, wrong };
  }

  // 모은 자리 → 데이터 표기 '[...]'. 한 음절로 조합되지 않으면 null.
  function compose(slots) {
    const inner = atoms((slots.cho || []).join('')) + atoms((slots.jung || []).join('')) + atoms((slots.jong || []).join(''));
    if (!inner) return null;
    if (!(slots.jung || []).length) return null;
    try { NM.core.yet.syllable(inner); return '[' + inner + ']'; } catch (e) { return null; }
  }

  // 한 자리에 여럿 넣었을 때의 이름표(학교급 용어). 하나 이하면 ''.
  function clusterTerm(slot, list, level) {
    const a = atoms((list || []).join(''));
    const arr = Array.from(a);
    if (arr.length < 2) return '';
    const terms = (T().terms && (T().terms[level] || T().terms.h1)) || {};
    if (arr.every(isVow)) return slot === 'jung' ? (terms.vowel || '') : '';
    if (!arr.every(isCons) || slot === 'jung') return '';
    if (slot === 'cho' && (T().yeonseo || []).indexOf(a) >= 0) return terms.yeonseo || '';
    const same = arr.every(x => x === arr[0]);
    return (same ? terms.same : terms.diff) || terms.pair || '';
  }

  function mount(el, o) {
    const doc = o.document || root.document;
    const cfg = o.config || {};
    const level = o.level || 'm';
    const targets = (Array.isArray(cfg.targets) ? cfg.targets : []).filter(t => t && typeof t.id === 'string');
    const state = {};      // 과녁 id → { cho:[], jung:[], jong:[] }
    const views = {};      // 과녁 id → { box, slots: {자리: {wrap, items, term, mark, pick}}, preview, active }
    let locked = !!o.readOnly;
    let lastWrong = null;

    function mk(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function rich(text, cls) {
      const s = mk('span', cls || 'gsb-text');
      s.appendChild(o.yet(o.fill ? o.fill(String(text)) : String(text)));
      return s;
    }
    function glyph(j) { const g = mk('span', 'gsb-glyph nm-yet', j); g.setAttribute('aria-hidden', 'true'); return g; }

    const box = mk('div', 'gsb');
    box.setAttribute('data-level', level);
    if (o.reducedMotion) box.classList.add('is-static');
    el.appendChild(box);

    (Array.isArray(cfg.orig) ? cfg.orig : []).forEach(id => {
      if (NM.ui && NM.ui.marker) { const c = NM.ui.marker.orig(id, { document: doc }); if (c) box.appendChild(c); }
    });
    box.appendChild(mk('p', 'gsb-guide', txt('guide')));

    function setActive(id, slot) {
      const v = views[id];
      v.active = slot;
      SLOTS.forEach(s => {
        v.slots[s].wrap.classList.toggle('is-active', s === slot);
        v.slots[s].pick.setAttribute('aria-pressed', String(s === slot));
      });
      v.tray.querySelectorAll('.gsb-block').forEach(b => {
        b.setAttribute('aria-label', txt('add', { j: b.getAttribute('data-jamo'), slot: txt('slots.' + slot) }));
      });
    }

    function clearMarks(id, slot) {
      const s = views[id].slots[slot];
      s.wrap.classList.remove('is-wrong', 'is-hint');
      s.wrap.removeAttribute('data-wrong');
      s.mark.textContent = '';
      s.mark.removeAttribute('title');
    }

    function renderSlot(id, slot) {
      const v = views[id], s = v.slots[slot];
      s.items.textContent = '';
      const list = state[id][slot];
      if (!list.length) s.items.appendChild(mk('span', 'gsb-empty', txt('empty')));
      list.forEach((j, k) => {
        const b = mk('button', 'gsb-placed');
        b.type = 'button';
        b.setAttribute('data-jamo', j);
        b.setAttribute('aria-label', txt('remove', { j, slot: txt('slots.' + slot) }));
        b.appendChild(glyph(j));
        b.disabled = locked;
        b.addEventListener('click', () => {
          if (locked) return;
          state[id][slot].splice(k, 1);
          clearMarks(id, slot);
          renderSlot(id, slot);
          setActive(id, slot);
          const next = s.items.querySelector('.gsb-placed') || s.pick;
          next.focus();
        });
        s.items.appendChild(b);
      });
      const term = clusterTerm(slot, list, level);
      s.term.textContent = term;
      s.term.hidden = !term;
      renderPreview(id);
    }

    function renderPreview(id) {
      const v = views[id];
      v.preview.textContent = '';
      const n = compose(state[id]);
      if (n) {
        const g = mk('span', 'gsb-syl nm-yet');
        g.appendChild(o.yet(n, { yetAll: true }));
        let modern = '';
        try { modern = NM.core.yet.modernReading(n); } catch (e) { modern = ''; }
        v.preview.setAttribute('aria-label', txt('preview') + ' ' + modern);
        v.preview.setAttribute('data-syllable', n);
        v.preview.appendChild(g);
      } else {
        v.preview.removeAttribute('data-syllable');
        v.preview.setAttribute('aria-label', txt('preview') + ' ' + txt('cannot'));
        v.preview.appendChild(mk('span', 'gsb-syl-none', txt('cannot')));
      }
    }

    function add(id, slot, j) {
      if (locked) return;
      const list = state[id][slot];
      if (list.length >= MAX) return;
      list.push(j);
      clearMarks(id, slot);
      renderSlot(id, slot);
    }

    targets.forEach(t => {
      state[t.id] = { cho: [], jung: [], jong: [] };
      const tb = mk('section', 'gsb-target');
      tb.setAttribute('data-target', t.id);
      if (t.practice) { tb.setAttribute('data-practice', '1'); tb.appendChild(mk('span', 'gsb-practice nm-mark nm-mark-know', txt('practice'))); }
      if (t.orig && NM.ui && NM.ui.marker) { const c = NM.ui.marker.orig(t.orig, { document: doc }); if (c) tb.appendChild(c); }
      if (t.prompt) tb.appendChild(rich(t.prompt, 'gsb-prompt'));
      const work = mk('div', 'gsb-work');
      const slotsBox = mk('div', 'gsb-slots');
      slotsBox.setAttribute('role', 'group');
      slotsBox.setAttribute('aria-label', txt('slotGroup'));
      const v = { box: tb, slots: {}, preview: null, tray: null, active: 'cho' };
      views[t.id] = v;
      SLOTS.forEach(slot => {
        const wrap = mk('div', 'gsb-slot');
        wrap.setAttribute('data-slot', slot);
        const pick = mk('button', 'gsb-slot-pick', txt('slots.' + slot));
        pick.type = 'button';
        pick.setAttribute('aria-label', txt('pickSlot', { slot: txt('slots.' + slot) }));
        pick.addEventListener('click', () => { if (!locked) setActive(t.id, slot); });
        const items = mk('div', 'gsb-slot-items');
        const term = mk('span', 'gsb-term');
        term.hidden = true;
        const mark = mk('span', 'gsb-mark');
        mark.setAttribute('aria-hidden', 'true');
        wrap.appendChild(pick); wrap.appendChild(items); wrap.appendChild(term); wrap.appendChild(mark);
        wrap.addEventListener('dragover', (e) => { if (!locked) { e.preventDefault(); wrap.classList.add('is-over'); } });
        wrap.addEventListener('dragleave', () => wrap.classList.remove('is-over'));
        wrap.addEventListener('drop', (e) => {
          e.preventDefault();
          wrap.classList.remove('is-over');
          const j = e.dataTransfer && e.dataTransfer.getData('text/plain');
          if (j) { add(t.id, slot, j); setActive(t.id, slot); }
        });
        v.slots[slot] = { wrap, pick, items, term, mark };
        slotsBox.appendChild(wrap);
      });
      work.appendChild(slotsBox);
      const pv = mk('div', 'gsb-preview');
      pv.setAttribute('role', 'img');
      v.preview = pv;
      work.appendChild(pv);
      tb.appendChild(work);
      const tray = mk('div', 'gsb-tray');
      tray.setAttribute('role', 'group');
      tray.setAttribute('aria-label', txt('tray'));
      const blocks = Array.isArray(t.tray) ? t.tray : (Array.isArray(cfg.tray) ? cfg.tray : []);
      blocks.forEach(j => {
        const b = mk('button', 'gsb-block');
        b.type = 'button';
        b.setAttribute('data-jamo', j);
        b.draggable = !locked;
        b.appendChild(glyph(j));
        b.addEventListener('click', () => add(t.id, v.active, j));
        b.addEventListener('dragstart', (e) => { if (e.dataTransfer) { e.dataTransfer.setData('text/plain', j); e.dataTransfer.effectAllowed = 'copy'; } });
        tray.appendChild(b);
      });
      v.tray = tray;
      tb.appendChild(tray);
      box.appendChild(tb);
      SLOTS.forEach(slot => renderSlot(t.id, slot));
      setActive(t.id, 'cho');
    });

    const actions = mk('div', 'gsb-actions');
    const submit = mk('button', 'nm-st-btn nm-st-primary gsb-submit', txt('submit'));
    submit.type = 'button';
    actions.appendChild(submit);
    box.appendChild(actions);

    function current() {
      const out = {};
      targets.forEach(t => {
        if (t.practice) return;
        out[t.id] = { cho: state[t.id].cho.join(''), jung: state[t.id].jung.join(''), jong: state[t.id].jong.join('') };
      });
      return out;
    }

    function lock() {
      locked = true;
      box.classList.add('is-locked');
      submit.disabled = true;
      box.querySelectorAll('button').forEach(b => { if (b !== submit) b.disabled = true; });
      box.querySelectorAll('.gsb-block').forEach(b => { b.draggable = false; });
    }
    function mark(id, slot, kind) {
      const s = views[id] && views[id].slots[slot];
      if (!s) return;
      s.wrap.classList.add('is-' + kind);
      if (kind === 'wrong') s.wrap.setAttribute('data-wrong', '1');
      s.mark.textContent = SYM[kind];
      s.mark.setAttribute('title', txt(kind + 'Mark'));
    }

    submit.addEventListener('click', () => {
      if (locked) return;
      const ans = current();
      o.onSubmit(ans);
      // 맞았으면 더 고치지 못하게 잠근다(진행기는 맞은 제출 뒤 기믹을 부르지 않는다)
      let r = null;
      try { r = check(ans, o.item); } catch (e) { r = null; }
      if (r === true) {
        lock();
        Object.keys(ans).forEach(id => SLOTS.forEach(s => mark(id, s, 'answer')));
      }
    });
    if (locked) lock();

    return {
      showWrong(info) {
        const w = (info && info.wrong) || {};
        lastWrong = w;
        targets.forEach(t => SLOTS.forEach(s => clearMarks(t.id, s)));
        Object.keys(w).forEach(id => (w[id] || []).forEach(s => mark(id, s, 'wrong')));
      },
      showHint(step, target) {
        if (step < 2) return;
        const tg = target && typeof target === 'object' ? target : lastWrong;
        if (!tg) return;
        Object.keys(tg).forEach(id => {
          const list = Array.isArray(tg[id]) ? tg[id] : [tg[id]];
          list.forEach(s => { if (SLOTS.indexOf(s) >= 0) mark(id, s, 'hint'); });
        });
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        Object.keys(a).forEach(id => {
          if (!state[id]) return;
          const n = a[id] || {};
          SLOTS.forEach(s => {
            const v = n[s];
            state[id][s] = Array.isArray(v) ? v.slice() : Array.from(String(v == null ? '' : v));
          });
        });
        lock();
        Object.keys(a).forEach(id => {
          if (!state[id]) return;
          SLOTS.forEach(s => { clearMarks(id, s); renderSlot(id, s); mark(id, s, 'answer'); });
        });
        box.querySelectorAll('.gsb-placed').forEach(b => { b.disabled = true; });
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  NM.gimmicks.register(NAME, { mount, check, logic: { atoms, normSlots, compose, clusterTerm, check } });
})(typeof window !== 'undefined' ? window : globalThis);
