'use strict';
/*
 * 기믹 '끊어 읽기' (wordCut) — s4 「소리대로 적은 책」. 계약: js/ui/stage-gimmick.js 머리 주석.
 * 설정·정답 모양: js/gimmicks/README-wordCut.md. 문구: js/data/text-g-wordCut.js (NM.data.TEXT.g.wordCut).
 *
 * ■ 하는 일
 *   config.lines 의 原文 줄(NM.data.ORIG 블록 id 로만 가리킴)을 띄어쓰기 없이 글자(음절·한자·루비 하나)마다 단추로 늘어놓는다.
 *   글자를 누르면 그 뒤가 끊기고, 다시 누르면 끊은 자리가 없어진다(마지막 글자는 끊을 수 없다).
 *   글자 번호 = 그 줄에서 빈칸을 빼고 0부터 센 순서. 답 = { <줄 열쇠>: [끊은 글자 번호…] } (그 글자 '뒤'를 끊음).
 *   방점 음높이 막대(config.pitch !== false): 평성 낮은 막대 · 거성 높은 막대 · 상성 오르는 막대(모양으로 가름). 한자는 막대 없음.
 *   두 장 견주기(config.compare): 두 줄에서 같은 말(글자 범위)을 나란히 보이고, 학생의 끊기가 그 말을 딱 떼어 내면 '찾음' 표시.
 * ■ 틀린 제출: 틀린 끊기 자리가 번짐(is-wrong, data-wrong="extra", 기호 ✕), 덜 끊긴 말은 물결 밑줄(data-wrong="joined").
 *   도움 2: 고칠 자리 강조(is-hint, 기호 ▼) — hints[1] 이 { 줄 열쇠: [번호…] } 면 그 자리, 없으면 지난 틀린 자리.
 * ■ 原文은 바꾸지 않는다: 글자는 NM.core.yet.parse 결과를 그대로 다시 그린다(빈칸만 뺀다).
 * 필요: core/yet.js, ui/stage-gimmick.js, data/text-g-wordCut.js, data/orig.generated.js (ui/marker.js 가 있으면 原文 표지)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'wordCut';
  const SYM = { wrong: '\u2715', joined: '\u2026', hint: '\u25BC', answer: '\u25CE', found: '\u2713' };
  const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/;
  const SPECIAL = '\\*_{}[]|\u00B7:<>';

  function T() { return (NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME]) || {}; }
  function txt(key, vars) {
    const v = String(key).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T());
    if (typeof v !== 'string') { NM.reportError('gimmick.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
  }
  const esc = (s) => Array.from(String(s)).map(ch => (SPECIAL.indexOf(ch) >= 0 ? '\\' + ch : ch)).join('');

  // 原文 한 줄 → { units: [{ text(데이터 표기), tone(0|1|2|null), modern }], spaces: [빈칸 앞 글자 번호…] }
  function unitsOf(line) {
    const Y = NM.core.yet;
    const units = [], spaces = [];
    Y.parse(String(line), { bangjeom: true }).forEach(tk => {
      if (tk.type === 'ruby') {
        units.push({ text: '{' + esc(tk.base) + '|' + esc(tk.reading) + '}', tone: null });
        return;
      }
      Y.splitSyllables(tk.text).forEach(u => {
        if (/^\s+$/.test(u)) { if (units.length && spaces.indexOf(units.length - 1) < 0) spaces.push(units.length - 1); return; }
        const tone = u.indexOf('\u302F') >= 0 ? 2 : u.indexOf('\u302E') >= 0 ? 1 : (HANGUL.test(u) ? 0 : null);
        units.push({ text: esc(u), tone });
      });
    });
    units.forEach(u => {
      try { u.modern = Y.modernReading(u.text); } catch (e) { u.modern = ''; }
    });
    return { units, spaces: spaces.filter(i => i < units.length - 1) };
  }

  function lineKey(spec) { return spec.block + (spec.line ? '#' + spec.line : ''); }
  function lineOf(spec) {
    const b = NM.data.ORIG && NM.data.ORIG[spec.block];
    if (!b || !Array.isArray(b.lines)) return null;
    const l = b.lines[spec.line | 0];
    return typeof l === 'string' ? l : null;
  }
  const toSet = (a) => { const s = {}; (Array.isArray(a) ? a : []).forEach(n => { if (Number.isInteger(n)) s[n] = true; }); return s; };
  const sorted = (a) => Array.from(new Set((Array.isArray(a) ? a : []).filter(Number.isInteger))).sort((x, y) => x - y);

  // 판정: item.answer 의 줄마다 끊은 자리 집합이 같아야 한다. 틀리면 { wrong: { 줄 열쇠: { extra:[…], missing:[…] } } }
  function check(answer, item) {
    const want = (item && item.answer && typeof item.answer === 'object') ? item.answer : {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = {};
    let ok = true;
    Object.keys(want).forEach(k => {
      const w = toSet(want[k]), g = toSet(got[k]);
      const extra = sorted(Object.keys(g).map(Number).filter(n => !w[n]));
      const missing = sorted(Object.keys(w).map(Number).filter(n => !g[n]));
      if (extra.length || missing.length) { wrong[k] = { extra, missing }; ok = false; }
    });
    return ok ? true : { correct: false, wrong };
  }

  // 끊은 자리가 [s, e) 범위를 딱 떼어 내는가
  function isolates(cuts, s, e, len) {
    if (!(s >= 0 && e > s && e <= len)) return false;
    if (s > 0 && !cuts[s - 1]) return false;
    if (e < len && !cuts[e - 1]) return false;
    for (let i = s; i < e - 1; i++) if (cuts[i]) return false;
    return true;
  }

  function mount(el, o) {
    const doc = o.document || root.document;
    const cfg = o.config || {};
    const showPitch = cfg.pitch !== false;
    const specs = (Array.isArray(cfg.lines) ? cfg.lines : []).filter(s => s && typeof s.block === 'string');
    const lines = [];         // { key, spec, units, cuts:{}, view: {row, cells:[], gaps:[]} }
    const byKey = {};
    let locked = !!o.readOnly;
    let lastWrong = null;

    function mk(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }

    const box = mk('div', 'gwc');
    box.setAttribute('data-level', o.level || '');
    if (o.reducedMotion) box.classList.add('is-static');
    el.appendChild(box);
    box.appendChild(mk('p', 'gwc-guide', txt('guide')));

    function pitchBar(tone) {
      const p = mk('span', 'gwc-pitch');
      p.setAttribute('data-tone', tone == null ? 'none' : String(tone));
      p.setAttribute('aria-hidden', 'true');
      p.appendChild(mk('span', 'gwc-pitch-bar'));
      return p;
    }

    function labelOf(L, i) {
      const u = L.units[i];
      return txt(L.cuts[i] ? 'sylCut' : 'syl', { w: u.modern || '' });
    }

    function paintGap(L, i) {
      const g = L.view.gaps[i];
      if (!g) return;
      const on = !!L.cuts[i];
      g.classList.toggle('is-cut', on);
      g.setAttribute('data-cut', on ? '1' : '0');
      const b = L.view.btns[i];
      if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', labelOf(L, i)); }
    }

    function clearGapMark(L, i) {
      const g = L.view.gaps[i];
      if (!g) return;
      g.classList.remove('is-wrong', 'is-hint');
      g.removeAttribute('data-wrong');
      g.querySelector('.gwc-sym').textContent = '';
    }
    function clearJoined(L) {
      L.view.cells.forEach(c => { c.classList.remove('is-joined'); c.removeAttribute('data-wrong'); });
    }

    function toggle(L, i) {
      if (locked || i >= L.units.length - 1) return;
      if (L.cuts[i]) delete L.cuts[i]; else L.cuts[i] = true;
      clearGapMark(L, i);
      clearJoined(L);
      paintGap(L, i);
      updateCompare();
    }

    function buildLine(spec) {
      const raw = lineOf(spec);
      if (raw == null) { NM.reportError('gimmick.' + NAME, 'missing 原文 line: ' + lineKey(spec)); return; }
      let parsed;
      try { parsed = unitsOf(raw); } catch (e) { NM.reportError('gimmick.' + NAME, e); return; }
      const L = { key: lineKey(spec), spec, units: parsed.units, spaces: parsed.spaces, cuts: {}, view: { cells: [], gaps: [], btns: [] } };
      const sec = mk('section', 'gwc-line');
      sec.setAttribute('data-key', L.key);
      const head = mk('div', 'gwc-head');
      if (NM.ui && NM.ui.marker) head.appendChild(NM.ui.marker.badge('orig', { document: doc }));
      const block = NM.data.ORIG[spec.block];
      if (block.title) head.appendChild(mk('span', 'gwc-title', block.title));
      sec.appendChild(head);
      const row = mk('div', 'gwc-row nm-yet');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', txt('lineLabel') + ' ' + (block.title || ''));
      L.units.forEach((u, i) => {
        const cell = mk('span', 'gwc-cell');
        cell.setAttribute('data-i', String(i));
        let face;
        if (i < L.units.length - 1) {
          face = mk('button', 'gwc-syl');
          face.type = 'button';
          face.setAttribute('data-i', String(i));
          face.setAttribute('aria-pressed', 'false');
          face.addEventListener('click', () => toggle(L, i));
          L.view.btns[i] = face;
        } else {
          face = mk('span', 'gwc-syl gwc-last');
          face.setAttribute('aria-label', u.modern || '');
        }
        face.appendChild(o.yet(u.text, { yetAll: true }));
        cell.appendChild(face);
        if (showPitch) cell.appendChild(pitchBar(u.tone));
        row.appendChild(cell);
        L.view.cells[i] = cell;
        if (i < L.units.length - 1) {
          const gap = mk('span', 'gwc-gap');
          gap.setAttribute('data-gap', String(i));
          gap.setAttribute('aria-hidden', 'true');
          gap.appendChild(mk('span', 'gwc-bar'));
          gap.appendChild(mk('span', 'gwc-sym'));
          gap.addEventListener('click', () => toggle(L, i));
          row.appendChild(gap);
          L.view.gaps[i] = gap;
        }
      });
      sec.appendChild(row);
      const src = NM.ui && NM.ui.marker && NM.ui.marker.srcLabel ? NM.ui.marker.srcLabel(block.src) : block.src;
      if (src) sec.appendChild(mk('p', 'gwc-src nm-card-src', src));
      box.appendChild(sec);
      L.units.forEach((u, i) => paintGap(L, i));
      lines.push(L);
      byKey[L.key] = L;
    }
    specs.forEach(buildLine);

    if (showPitch) {
      const lg = mk('div', 'gwc-legend');
      lg.appendChild(mk('p', 'gwc-legend-title', txt('pitchTitle')));
      const ul = mk('ul', 'gwc-legend-list');
      [0, 1, 2].forEach(t => {
        const li = mk('li', 'gwc-legend-item');
        li.appendChild(pitchBar(t));
        li.appendChild(mk('span', 'gwc-legend-text', txt('pitch.' + t)));
        ul.appendChild(li);
      });
      lg.appendChild(ul);
      const note = mk('p', 'gwc-legend-note');
      if (NM.ui && NM.ui.marker) { note.appendChild(NM.ui.marker.badge('interp', { document: doc })); note.appendChild(doc.createTextNode(' ')); }
      note.appendChild(doc.createTextNode(txt('pitchNote')));
      lg.appendChild(note);
      box.appendChild(lg);
    }

    // 두 장 견주기
    const pairs = [];
    const cmp = Array.isArray(cfg.compare) ? cfg.compare : [];
    if (cmp.length) {
      const sec = mk('section', 'gwc-compare');
      sec.appendChild(mk('p', 'gwc-compare-title', txt('compareTitle')));
      cmp.forEach((c, k) => {
        if (!c || !c.a || !c.b) return;
        const pr = mk('div', 'gwc-pair');
        pr.setAttribute('data-pair', String(k));
        const words = mk('div', 'gwc-pair-words');
        const sides = [];
        ['a', 'b'].forEach((side, n) => {
          const sd = c[side];
          const L = byKey[lineKey(sd)];
          const w = mk('span', 'gwc-word nm-yet');
          w.setAttribute('data-side', side);
          const at = Array.isArray(sd.at) ? sd.at : [];
          if (L && at.length === 2) {
            const us = L.units.slice(at[0], at[1]);
            us.forEach(u => w.appendChild(o.yet(u.text, { yetAll: true })));
            w.setAttribute('aria-label', us.map(u => u.modern).join(''));
          } else NM.reportError('gimmick.' + NAME, 'bad compare side: ' + JSON.stringify(sd));
          if (n === 1) { const vs = mk('span', 'gwc-vs', '\u2194'); vs.setAttribute('aria-hidden', 'true'); words.appendChild(vs); }
          words.appendChild(w);
          sides.push({ L, at, el: w });
        });
        pr.appendChild(words);
        if (c.note) { const nt = mk('p', 'gwc-note'); nt.appendChild(o.yet(o.fill ? o.fill(String(c.note)) : String(c.note))); pr.appendChild(nt); }
        const st = mk('span', 'gwc-pair-state');
        pr.appendChild(st);
        sec.appendChild(pr);
        pairs.push({ el: pr, sides, state: st });
      });
      box.appendChild(sec);
    }
    function updateCompare() {
      lines.forEach(L => L.view.cells.forEach(c => c.classList.remove('is-pair')));
      pairs.forEach(p => {
        let all = true;
        p.sides.forEach(s => {
          const ok = !!s.L && isolates(s.L.cuts, s.at[0], s.at[1], s.L.units.length);
          s.el.classList.toggle('is-found', ok);
          if (ok) for (let i = s.at[0]; i < s.at[1]; i++) s.L.view.cells[i].classList.add('is-pair');
          if (!ok) all = false;
        });
        p.el.setAttribute('data-found', all ? '1' : '0');
        p.state.textContent = (all ? SYM.found + ' ' : '') + txt(all ? 'found' : 'notFound');
      });
    }
    updateCompare();

    const actions = mk('div', 'gwc-actions');
    const submit = mk('button', 'nm-st-btn nm-st-primary gwc-submit', txt('submit'));
    submit.type = 'button';
    actions.appendChild(submit);
    box.appendChild(actions);

    function current() {
      const out = {};
      lines.forEach(L => { out[L.key] = sorted(Object.keys(L.cuts).map(Number)); });
      return out;
    }
    function lock() {
      locked = true;
      box.classList.add('is-locked');
      box.querySelectorAll('button').forEach(b => { b.disabled = true; });
    }
    function markGap(L, i, kind) {
      const g = L.view.gaps[i];
      if (!g) return;
      g.classList.add('is-' + kind);
      if (kind === 'wrong') g.setAttribute('data-wrong', 'extra');
      g.querySelector('.gwc-sym').textContent = SYM[kind];
      g.setAttribute('title', txt(kind + 'Mark'));
    }
    function markAnswer() {
      lines.forEach(L => Object.keys(L.cuts).forEach(i => markGap(L, Number(i), 'answer')));
    }

    submit.addEventListener('click', () => {
      if (locked) return;
      const ans = current();
      o.onSubmit(ans);
      let r = null;
      try { r = check(ans, o.item); } catch (e) { r = null; }
      if (r === true) { lock(); markAnswer(); }
    });
    if (locked) lock();

    return {
      showWrong(info) {
        const w = (info && info.wrong) || {};
        lastWrong = w;
        lines.forEach(L => { L.view.gaps.forEach((g, i) => clearGapMark(L, i)); clearJoined(L); });
        Object.keys(w).forEach(k => {
          const L = byKey[k];
          if (!L) return;
          (w[k].extra || []).forEach(i => markGap(L, i, 'wrong'));
          // 덜 끊긴 말: 빠진 끊기 자리가 든 낱말(지금 끊은 자리 사이)을 물결 밑줄로
          (w[k].missing || []).forEach(m => {
            let s = m, e = m + 1;
            while (s > 0 && !L.cuts[s - 1]) s--;
            while (e < L.units.length - 1 && !L.cuts[e]) e++;
            for (let i = s; i <= e && i < L.units.length; i++) {
              L.view.cells[i].classList.add('is-joined');
              L.view.cells[i].setAttribute('data-wrong', 'joined');
            }
          });
        });
      },
      showHint(step, target) {
        if (step < 2) return;
        let tg = target && typeof target === 'object' ? target : null;
        if (!tg && lastWrong) {
          tg = {};
          Object.keys(lastWrong).forEach(k => { tg[k] = (lastWrong[k].extra || []).concat(lastWrong[k].missing || []); });
        }
        if (!tg) return;
        Object.keys(tg).forEach(k => {
          const L = byKey[k];
          if (L) (Array.isArray(tg[k]) ? tg[k] : []).forEach(i => markGap(L, i, 'hint'));
        });
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        lines.forEach(L => {
          L.cuts = toSet(a[L.key]);
          L.view.gaps.forEach((g, i) => { clearGapMark(L, i); paintGap(L, i); });
          clearJoined(L);
        });
        lock();
        markAnswer();
        updateCompare();
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  NM.gimmicks.register(NAME, { mount, check, logic: { unitsOf, check, isolates, lineKey } });
})(typeof window !== 'undefined' ? window : globalThis);
