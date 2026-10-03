'use strict';
/*
 * 기믹 'threeEraLink' — S11 끊어 적는 시대 「세 시대 변환」 (G10, spec §7 · §5-3).
 *  ① 세 시대 잇기(config.chains): 줄마다 중세 어형이 고정되어 있고, 섞인 조각(근대·현대 어형 + 헷갈리게 하는 조각
 *     config.extra)을 그 줄의 근대·현대 칸에 놓는다. 판정은 줄·칸마다 조각 id 로 한다. 세기·연도는 판정하지 않는다
 *     (세기 범위가 겹치므로 순서만 — design/research/11 5절).
 *  ② 적는 방식 가르기(config.spell): 原文 블록(id)의 한 대목에서 밑줄 친 말을 이어 적기/거듭 적기/끊어 적기로 가른다.
 *     原文 글자는 NM.data.ORIG 에서만 읽고, 둘레 몇 낱말만 잘라 보인다(글자는 바꾸지 않는다).
 *  두 부분은 하나만 있어도 된다. config/answer 모양과 예시: js/gimmicks/README-threeEraLink.md
 *  문구: js/data/text-g-threeEraLink.js (NM.data.TEXT.g.threeEraLink) · 모양: css/g-threeEraLink.css
 *
 * 조각 id: 줄 c 의 근대 어형 = '<c.id>.1', 현대 어형 = '<c.id>.2', config.extra[k] = 'x.<k>'.
 * 학생 답: { link: { <줄 id>: [근대 칸 조각 id, 현대 칸 조각 id] }, spell: { <대목 id>: 'ieo'|'geodeup'|'kkeuneo' } }
 * check → true 또는 { correct:false, wrong: { link: { <줄 id>: [틀린 칸 번호 1|2] }, spell: [틀린 대목 id] } }
 * showHint(2, target): target = 줄 id · 대목 id · 'link' · 'spell' (또는 그 배열) — 그 부분에 ★ 강조.
 * 필요: core/ns.js, ui/stage-gimmick.js, ui/stage-yet.js(옛한글 DOM·현대 표기 읽기), ui/marker.js(config.orig 원문 카드)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'threeEraLink';
  const KINDS = ['ieo', 'geodeup', 'kkeuneo'];
  const ERAS = ['mid', 'modern', 'present'];
  const RADIUS = 3; // 밑줄 친 말 앞뒤로 보일 낱말(띄어쓰기 단위) 수
  const SYM = { wrong: '✕', hint: '★', answer: '○', done: '○', pick: '●', unpick: '○' };

  const list = (x) => (Array.isArray(x) ? x.filter(v => v != null) : []);
  const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

  /* ---------- 문구 ---------- */
  function T(key, vars) {
    const base = NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME];
    let v = base;
    String(key).split('.').forEach(k => { v = v && typeof v === 'object' ? v[k] : undefined; });
    if (typeof v !== 'string') { NM.reportError('gimmick.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return v.replace(/%(\w+)%/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  }

  /* ---------- 순수 부분(단위 점검용으로 def.logic 에 둔다) ---------- */
  // 데이터 표기 안에서 i 자리가 대괄호·중괄호 밖인가
  function depthAt(s, i) {
    let d = 0;
    for (let k = 0; k < i; k++) {
      const c = s[k];
      if (c === '\\') { k++; continue; }
      if (c === '[' || c === '{') d++;
      else if ((c === ']' || c === '}') && d > 0) d--;
    }
    return d;
  }
  // 原文 한 줄(데이터 표기)에서 find 의 nth 번째 자리(표기 경계에 맞는 곳만)를 찾아 앞·말·뒤로 나눈다.
  // 앞뒤는 띄어쓰기 단위로 radius 낱말까지만 남기고 잘린 쪽을 알린다. 못 찾으면 null.
  function excerpt(line, find, nth, radius) {
    const s = String(line == null ? '' : line), f = String(find == null ? '' : find);
    if (!f) return null;
    const r = radius == null ? RADIUS : Math.max(0, radius | 0);
    let from = 0, seen = 0, at = -1;
    for (;;) {
      const i = s.indexOf(f, from);
      if (i < 0) break;
      if (depthAt(s, i) === 0 && depthAt(s, i + f.length) === 0) {
        if (seen === (nth | 0)) { at = i; break; }
        seen++;
      }
      from = i + 1;
    }
    if (at < 0) return null;
    let start = at;
    if (start > 0 && (s[start - 1] === '·' || s[start - 1] === ':')) start--; // 첫 음절의 방점은 말에 붙인다
    const before = s.slice(0, start), after = s.slice(at + f.length);
    const bp = before.split(' '), ap = after.split(' ');
    const keepB = bp.slice(Math.max(0, bp.length - (r + 1))), keepA = ap.slice(0, r + 1);
    return {
      before: keepB.join(' '), target: s.slice(start, at + f.length), after: keepA.join(' '),
      cutLeft: bp.length > keepB.length, cutRight: ap.length > keepA.length
    };
  }
  // 학생 답과 정답 비교. 정답에 있는 줄·대목만 본다.
  function check(answer, item) {
    const exp = (item && item.answer) || {};
    const a = answer && typeof answer === 'object' ? answer : {};
    const wrong = { link: {}, spell: [] };
    let n = 0;
    const gl = a.link && typeof a.link === 'object' ? a.link : {};
    Object.keys(exp.link || {}).forEach(cid => {
      const e = list(exp.link[cid]), g = Array.isArray(gl[cid]) ? gl[cid] : [];
      const bad = [];
      e.forEach((id, i) => { if (g[i] !== id) bad.push(i + 1); });
      if (bad.length) { wrong.link[cid] = bad; n += bad.length; }
    });
    const gs = a.spell && typeof a.spell === 'object' ? a.spell : {};
    Object.keys(exp.spell || {}).forEach(sid => { if (gs[sid] !== exp.spell[sid]) { wrong.spell.push(sid); n++; } });
    return n ? { correct: false, wrong } : true;
  }
  // 정해진 섞기(같은 과제는 다시 열어도 같은 차례). 처음 차례와 같으면 한 칸 돌린다.
  function seededShuffle(arr, seedText) {
    let h = 2166136261;
    const s = String(seedText || '');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9E3779B9) >>> 0;
      const j = h % (i + 1);
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    if (out.length > 1 && out.every((v, i) => v === arr[i])) out.push(out.shift());
    return out;
  }
  // config → 조각 목록 [{ id, text }] (섞기 전)
  function chipsOf(cfg) {
    const out = [];
    list(cfg && cfg.chains).forEach(c => {
      const forms = list(c.forms);
      for (let k = 1; k < ERAS.length; k++) if (forms[k] != null) out.push({ id: c.id + '.' + k, text: String(forms[k]) });
    });
    list(cfg && cfg.extra).forEach((t, k) => out.push({ id: 'x.' + k, text: String(t) }));
    return out;
  }

  /* ---------- 그리기 ---------- */
  function mount(host, o) {
    const doc = o.document || root.document;
    const cfg = o.config || {};
    const item = o.item || {};
    const chains = list(cfg.chains).filter(c => c && c.id && list(c.forms).length >= ERAS.length);
    const spellCfg = cfg.spell && typeof cfg.spell === 'object' ? cfg.spell : null;
    const spellItems = list(spellCfg && spellCfg.items).filter(s => s && s.id);
    const kinds = (spellCfg && Array.isArray(spellCfg.kinds) ? spellCfg.kinds.filter(k => KINDS.indexOf(k) >= 0) : []);
    const kindList = kinds.length ? kinds : KINDS;
    const chips = seededShuffle(chipsOf({ chains, extra: cfg.extra }), (item.id || NAME) + ':pool');
    const chipText = {};
    chips.forEach(c => { chipText[c.id] = c.text; });

    const slots = {};       // 줄 id → [null, 근대 조각, 현대 조각]
    chains.forEach(c => { slots[c.id] = [null, null, null]; });
    const spell = {};       // 대목 id → 고른 방식
    let selChip = null, selSlot = null, locked = !!o.readOnly, signalled = false;
    const nodes = { slot: {}, row: {}, chip: {}, sp: {}, kind: {} };

    function el(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function button(cls) { const b = el('button', cls); b.type = 'button'; return b; }
    function modern(text) { return NM.ui.stageYet ? NM.ui.stageYet.modern(text) : String(text); }
    function yetSpan(text, cls) {
      const s = el('span', cls || 'tel-yet');
      s.setAttribute('aria-hidden', 'true');
      s.appendChild(o.yet(String(text)));
      return s;
    }
    function markSym(kind) {
      const s = el('span', 'tel-sym tel-sym-' + kind);
      s.appendChild(el('span', null, SYM[kind])).setAttribute('aria-hidden', 'true');
      s.appendChild(el('span', 'nm-sr', T('marks.' + kind)));
      return s;
    }
    function setMark(node, kind, on) {
      if (!node) return;
      node.classList.toggle('is-' + kind, !!on);
      const old = node.querySelector(':scope > .tel-sym-' + kind);
      if (on && !old) node.appendChild(markSym(kind));
      if (!on && old) old.remove();
    }

    const box = el('div', 'tel');
    box.setAttribute('data-level', String(o.level || ''));
    if (o.readOnly) box.classList.add('is-locked');

    // 原文 카드(선택): 이 과제가 기대는 블록을 위에 보인다
    list(cfg.orig).forEach(id => {
      try {
        const card = NM.ui.marker && NM.ui.marker.orig(id, { document: doc });
        if (card) { const w = el('div', 'tel-orig'); w.appendChild(card); box.appendChild(w); }
      } catch (e) { NM.reportError('gimmick.' + NAME + '.orig', e); }
    });

    /* ① 세 시대 잇기 */
    let pool = null, poolEmpty = null;
    if (chains.length) {
      const sec = el('section', 'tel-sec tel-link');
      sec.setAttribute('data-target', 'link');
      const hid = 'tel-h-' + Math.random().toString(36).slice(2, 8);
      const h = el('h3', 'tel-title', T('linkTitle')); h.id = hid;
      sec.setAttribute('aria-labelledby', hid);
      sec.appendChild(h);
      sec.appendChild(el('p', 'tel-help', T('linkHelp')));
      const grid = el('div', 'tel-grid');
      grid.setAttribute('role', 'table');
      const headRow = el('div', 'tel-row tel-head');
      headRow.setAttribute('role', 'row');
      ERAS.forEach((era, k) => {
        if (k) { const ar = el('span', 'tel-arrow', T('arrow')); ar.setAttribute('aria-hidden', 'true'); headRow.appendChild(ar); }
        const c = el('span', 'tel-era', T('eras.' + era));
        c.setAttribute('role', 'columnheader');
        c.setAttribute('data-era', era);
        headRow.appendChild(c);
      });
      grid.appendChild(headRow);
      chains.forEach(c => {
        const row = el('div', 'tel-row');
        row.setAttribute('role', 'row');
        row.setAttribute('data-target', c.id);
        row.setAttribute('data-chain', c.id);
        const anchor = el('span', 'tel-cell tel-anchor');
        anchor.setAttribute('role', 'rowheader');
        anchor.appendChild(el('span', 'nm-sr', modern(c.forms[0])));
        anchor.appendChild(yetSpan(c.forms[0]));
        row.appendChild(anchor);
        nodes.slot[c.id] = [null];
        for (let k = 1; k < ERAS.length; k++) {
          const ar = el('span', 'tel-arrow', T('arrow')); ar.setAttribute('aria-hidden', 'true'); row.appendChild(ar);
          const cell = el('span', 'tel-cell');
          cell.setAttribute('role', 'cell');
          const b = button('tel-slot');
          b.setAttribute('data-chain', c.id);
          b.setAttribute('data-pos', String(k));
          b.setAttribute('data-era', ERAS[k]);
          b.addEventListener('click', () => clickSlot(c.id, k));
          cell.appendChild(b);
          row.appendChild(cell);
          nodes.slot[c.id][k] = b;
        }
        nodes.row[c.id] = row;
        grid.appendChild(row);
      });
      sec.appendChild(grid);
      pool = el('div', 'tel-pool');
      pool.setAttribute('role', 'group');
      pool.setAttribute('aria-label', T('poolLabel'));
      chips.forEach(ch => {
        const b = button('tel-chip');
        b.setAttribute('data-chip', ch.id);
        b.setAttribute('aria-pressed', 'false');
        b.appendChild(el('span', 'nm-sr', modern(ch.text)));
        b.appendChild(yetSpan(ch.text));
        b.addEventListener('click', () => clickChip(ch.id));
        nodes.chip[ch.id] = b;
        pool.appendChild(b);
      });
      poolEmpty = el('p', 'tel-pool-empty', T('poolEmpty'));
      pool.appendChild(poolEmpty);
      sec.appendChild(pool);
      box.appendChild(sec);
    }

    /* ② 적는 방식 가르기 */
    if (spellItems.length) {
      const sec = el('section', 'tel-sec tel-spell');
      sec.setAttribute('data-target', 'spell');
      const hid = 'tel-s-' + Math.random().toString(36).slice(2, 8);
      const h = el('h3', 'tel-title', T('spellTitle')); h.id = hid;
      sec.setAttribute('aria-labelledby', hid);
      sec.appendChild(h);
      sec.appendChild(el('p', 'tel-help', T('spellHelp')));
      spellItems.forEach(sp => {
        const row = el('div', 'tel-sp');
        row.setAttribute('data-target', sp.id);
        row.setAttribute('data-spell', sp.id);
        const block = NM.data && NM.data.ORIG ? NM.data.ORIG[sp.orig] : null;
        const lines = block && Array.isArray(block.lines) ? block.lines : null;
        const ex = lines ? excerpt(lines[sp.line | 0], sp.find, sp.nth, sp.radius) : null;
        if (!ex) NM.reportError('gimmick.' + NAME + '.spell', 'cannot find ' + JSON.stringify(sp.find) + ' in ' + sp.orig);
        const q = el('p', 'tel-ex');
        const qid = 'tel-q-' + Math.random().toString(36).slice(2, 8);
        q.id = qid;
        if (ex) {
          q.appendChild(el('span', 'nm-sr', modern(ex.before) + ' ' + T('target') + ' ' + modern(ex.target) + ' ' + modern(ex.after)));
          const vis = el('span', 'tel-ex-vis nm-yet');
          vis.setAttribute('aria-hidden', 'true');
          if (ex.cutLeft) vis.appendChild(el('span', 'tel-cut', '…'));
          vis.appendChild(o.yet(ex.before));
          const m = el('mark', 'tel-target');
          m.appendChild(o.yet(ex.target));
          vis.appendChild(m);
          vis.appendChild(o.yet(ex.after));
          if (ex.cutRight) vis.appendChild(el('span', 'tel-cut', '…'));
          q.appendChild(vis);
        }
        row.appendChild(q);
        if (block && block.title) row.appendChild(el('p', 'tel-src', T('spellFrom', { title: block.title })));
        const grp = el('div', 'tel-kinds');
        grp.setAttribute('role', 'group');
        grp.setAttribute('aria-labelledby', qid);
        nodes.kind[sp.id] = {};
        kindList.forEach(kd => {
          const b = button('tel-kind');
          b.setAttribute('data-kind', kd);
          b.setAttribute('aria-pressed', 'false');
          b.appendChild(el('span', 'tel-kind-sym', SYM.unpick)).setAttribute('aria-hidden', 'true');
          b.appendChild(el('span', 'tel-kind-name', T('kinds.' + kd)));
          b.addEventListener('click', () => clickKind(sp.id, kd));
          nodes.kind[sp.id][kd] = b;
          grp.appendChild(b);
        });
        row.appendChild(grp);
        nodes.sp[sp.id] = row;
        spell[sp.id] = null;
        sec.appendChild(row);
      });
      box.appendChild(sec);
    }

    const foot = el('div', 'tel-foot');
    const need = el('p', 'tel-need', T('needAll'));
    const submit = button('nm-st-btn nm-st-primary tel-submit');
    submit.appendChild(doc.createTextNode(T('submit')));
    submit.addEventListener('click', doSubmit);
    foot.appendChild(need);
    foot.appendChild(submit);
    box.appendChild(foot);
    host.appendChild(box);

    /* ---------- 상태 ---------- */
    function placedChips() {
      const s = {};
      Object.keys(slots).forEach(cid => slots[cid].forEach(id => { if (id) s[id] = true; }));
      return s;
    }
    function complete() {
      const allSlots = Object.keys(slots).every(cid => slots[cid][1] && slots[cid][2]);
      const allSpell = Object.keys(spell).every(sid => !!spell[sid]);
      return allSlots && allSpell;
    }
    function answerNow() {
      const a = {};
      if (chains.length) { a.link = {}; chains.forEach(c => { a.link[c.id] = [slots[c.id][1], slots[c.id][2]]; }); }
      if (spellItems.length) { a.spell = {}; spellItems.forEach(sp => { a.spell[sp.id] = spell[sp.id]; }); }
      return a;
    }
    function render() {
      const placed = placedChips();
      chains.forEach(c => {
        for (let k = 1; k < ERAS.length; k++) {
          const b = nodes.slot[c.id][k], id = slots[c.id][k];
          Array.from(b.childNodes).forEach(n => { if (!n.classList || !n.classList.contains('tel-sym')) n.remove(); });
          const first = b.firstChild;
          if (id) b.insertBefore(yetSpan(chipText[id]), first);
          else b.insertBefore(el('span', 'tel-slot-empty', ' '), first);
          b.classList.toggle('is-filled', !!id);
          b.setAttribute('data-chip', id || '');
          const on = !!selSlot && selSlot.cid === c.id && selSlot.pos === k;
          b.setAttribute('aria-pressed', String(on));
          b.setAttribute('aria-label', T('slotLabel', { row: modern(c.forms[0]), era: T('eras.' + ERAS[k]), value: id ? modern(chipText[id]) : T('empty') }));
          b.disabled = locked;
        }
      });
      let left = 0;
      chips.forEach(ch => {
        const b = nodes.chip[ch.id];
        b.hidden = !!placed[ch.id];
        if (!placed[ch.id]) left++;
        b.setAttribute('aria-pressed', String(selChip === ch.id));
        b.disabled = locked;
      });
      if (poolEmpty) poolEmpty.hidden = left > 0;
      Object.keys(nodes.kind).forEach(sid => Object.keys(nodes.kind[sid]).forEach(kd => {
        const b = nodes.kind[sid][kd], on = spell[sid] === kd;
        b.setAttribute('aria-pressed', String(on));
        b.querySelector('.tel-kind-sym').textContent = on ? SYM.pick : SYM.unpick;
        b.disabled = locked;
      }));
      const ok = complete();
      submit.disabled = locked || !ok;
      submit.hidden = locked && !!o.readOnly;
      need.hidden = locked || ok;
    }
    function focusNode(n) { try { if (n && !n.hidden && !n.disabled) n.focus(); } catch (e) { /* 초점 실패는 무시 */ } }
    function clearSlotMarks(cid, pos) {
      const b = nodes.slot[cid] && nodes.slot[cid][pos];
      setMark(b, 'wrong', false); setMark(b, 'answer', false);
    }
    function place(cid, pos, chipId) {
      Object.keys(slots).forEach(c => slots[c].forEach((id, k) => { if (id === chipId) { slots[c][k] = null; clearSlotMarks(c, k); } }));
      slots[cid][pos] = chipId;
      clearSlotMarks(cid, pos);
    }
    function clickChip(id) {
      if (locked) return;
      if (selSlot) {
        const s = selSlot;
        place(s.cid, s.pos, id);
        selSlot = null; selChip = null;
        render();
        focusNode(nodes.slot[s.cid][s.pos]);
        return;
      }
      selChip = selChip === id ? null : id;
      render();
    }
    function clickSlot(cid, pos) {
      if (locked) return;
      if (selChip) {
        place(cid, pos, selChip);
        selChip = null;
      } else if (slots[cid][pos]) {
        const back = slots[cid][pos];
        slots[cid][pos] = null;
        clearSlotMarks(cid, pos);
        selSlot = null;
        render();
        focusNode(nodes.chip[back]);
        return;
      } else {
        selSlot = selSlot && selSlot.cid === cid && selSlot.pos === pos ? null : { cid, pos };
      }
      render();
    }
    function clickKind(sid, kd) {
      if (locked) return;
      spell[sid] = kd;
      Object.keys(nodes.kind[sid]).forEach(k => { setMark(nodes.kind[sid][k], 'wrong', false); });
      render();
    }
    function clearAll(kind) {
      box.querySelectorAll('.is-' + kind).forEach(n => setMark(n, kind, false));
    }
    function doSubmit() {
      if (locked || !complete()) return;
      signalled = false;
      o.onSubmit(answerNow());
      // 진행기는 틀리면 같은 자리에서 showWrong 을 부른다. 아무 신호가 없으면 맞은 것 — 더 고치지 못하게 닫는다.
      if (!signalled) {
        locked = true;
        box.classList.add('is-locked', 'is-done');
        clearAll('wrong'); clearAll('hint');
        selChip = null; selSlot = null;
        render();
      }
    }

    if (o.readOnly) { selChip = null; selSlot = null; }
    render();

    return {
      showWrong(info) {
        signalled = true;
        if (!o.readOnly) { locked = false; box.classList.remove('is-locked', 'is-done'); }
        clearAll('wrong');
        const w = (info && info.wrong) || {};
        box._hintTargets = Object.keys(w.link || {}).concat(list(w.spell));
        Object.keys(w.link || {}).forEach(cid => list(w.link[cid]).forEach(pos => setMark(nodes.slot[cid] && nodes.slot[cid][pos], 'wrong', true)));
        list(w.spell).forEach(sid => { if (spell[sid] && nodes.kind[sid]) setMark(nodes.kind[sid][spell[sid]], 'wrong', true); });
        render();
      },
      showHint(step, target) {
        if (step < 2) return;
        const targets = target == null ? (box._hintTargets || []) : Array.isArray(target) ? target : [target];
        targets.forEach(t => {
          if (t == null) return;
          box.querySelectorAll('[data-target]').forEach(n => { if (n.getAttribute('data-target') === String(t)) setMark(n, 'hint', true); });
        });
      },
      showAnswer(answer) {
        signalled = true;
        const a = answer || {};
        clearAll('wrong'); clearAll('hint');
        Object.keys(a.link || {}).forEach(cid => {
          if (!slots[cid]) return;
          list(a.link[cid]).forEach((id, i) => { if (own(chipText, id)) { slots[cid][i + 1] = id; setMark(nodes.slot[cid][i + 1], 'answer', true); } });
        });
        Object.keys(a.spell || {}).forEach(sid => {
          if (!nodes.kind[sid] || !nodes.kind[sid][a.spell[sid]]) return;
          spell[sid] = a.spell[sid];
          setMark(nodes.kind[sid][a.spell[sid]], 'answer', true);
        });
        locked = true; selChip = null; selSlot = null;
        box.classList.add('is-locked', 'is-answer');
        render();
        submit.hidden = true;
      },
      destroy() { box.remove(); }
    };
  }

  NM.gimmicks.register(NAME, { mount, check, logic: { excerpt, check, seededShuffle, chipsOf, KINDS, ERAS } });
})(typeof window !== 'undefined' ? window : globalThis);
