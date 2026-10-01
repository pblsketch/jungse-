'use strict';
/*
 * NM.g789 — 기믹 G7(questionPair)·G8(prefaceDecode)·G9(twoEraNotebook)가 함께 쓰는 작은 도구.
 *   原文 줄을 '조각'으로 나누고(데이터 표기 그대로 — 글자를 바꾸지 않는다), 장면 데이터가 고른 낱말을
 *   누를 수 있는 단추로 그린다. 原文 글자는 NM.data.ORIG[블록 id] 에서만 온다(손으로 옮겨 적지 않음).
 *
 * ■ 조각 나누기 pieces(line) → [문자열]  (모두 이으면 line 과 글자까지 같다)
 *   - '[…]' 옛한글 한 음절, '{漢|읽기}' 루비 하나, 완성형 음절·한자·홑 자모 한 글자가 각각 한 조각(= 한 '자리')
 *   - 음절 바로 앞의 방점('·' ':')은 뒤 조각에 붙는다. 빈칸은 따로 조각이 되지만 자리로 세지 않는다.
 * ■ 낱말 지정 (장면 데이터 config 의 words 항목)
 *   { id, block?, line?(기본 0), match?: '<데이터 표기 조각열>', nth?(같은 꼴이 여럿일 때 몇 번째, 1부터), at?: [시작 자리, 자리 수] }
 *   match 는 조각 경계에 맞아야 한다(방점까지 原文 그대로). at 의 자리는 0부터 세고 빈칸은 세지 않는다.
 * ■ API
 *   pieces(line), places(line) → [{ piece, index(조각 번호) }], locate(line, word) → { from, to }(조각 번호, to 는 끝 다음) | null
 *   segment(line, words) → [{ text, wordId|null }]   (겹치거나 못 찾은 낱말은 NM.reportError 로 알리고 건너뜀)
 *   block(id) → ORIG 블록 | null, plain(text) → 평문(방점 없음·루비 바탕), modern(text) → 화면 낭독용 현대 표기
 *   textOf(name, level) → t(key, vars)   NM.data.TEXT.g[name] 문구. levels[level][key] 가 있으면 그것을 먼저 쓴다
 *   el(doc, tag, cls, text), mark(doc, kind, label), richSpan(o, text, cls), yetPiece(o, text, cls)(보이는 글자 + 낭독용 현대 표기)
 *   origView(o, blockId, { words, onWord, asSpans, wordClass, noteNoBangjeom }) → { el, words: { id: 단추 또는 span } }
 *   radios(o, { label, options:[{id, text|plain}], value, onChange }) → { el, get, set, disable, clearMarks, markWrong, markAnswer }
 *   knownRules(o) → [규칙 카드 id]   o.knownRules(배열) → NM.ui.app.store() 기록 → 없으면 [] (모두 '아직 확인하지 않은 규칙')
 *   ruleInfo(id) → { id, name, text, stage, stageName }   NM.data.RULE_CARDS 가 없으면 이름만 비어 있다
 * 필요: core/ns.js, core/yet.js (ui/stage-logic.js 가 있으면 장면 이름·수첩 규칙을 그것으로 구한다)
 */
(function (root) {
  const NM = root.NM;
  const MID = '·';
  const isSylChar = (ch) => {
    if (!ch) return false;
    const c = ch.codePointAt(0);
    return (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0x1100 && c <= 0x115F) || (c >= 0xA960 && c <= 0xA97F) || ch === '[';
  };

  function pieces(line) {
    const s = String(line == null ? '' : line);
    const chars = Array.from(s);
    const out = [];
    let tone = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if ((ch === MID || ch === ':') && isSylChar(chars[i + 1])) { tone += ch; continue; }
      let p;
      if (ch === '[' || ch === '{') {
        const close = ch === '[' ? ']' : '}';
        let j = i + 1;
        while (j < chars.length && chars[j] !== close) j++;
        p = chars.slice(i, Math.min(j + 1, chars.length)).join('');
        i = Math.min(j, chars.length - 1);
      } else if (ch === '\\' && i + 1 < chars.length) {
        p = ch + chars[i + 1];
        i++;
      } else if (/\s/.test(ch)) {
        let j = i;
        while (j + 1 < chars.length && /\s/.test(chars[j + 1])) j++;
        p = chars.slice(i, j + 1).join('');
        i = j;
      } else p = ch;
      out.push(tone + p);
      tone = '';
    }
    if (tone) out.push(tone);
    return out;
  }
  const isSpace = (p) => /^\s+$/.test(p);
  function places(line) {
    const out = [];
    pieces(line).forEach((piece, index) => { if (!isSpace(piece)) out.push({ piece, index }); });
    return out;
  }

  function locate(line, word) {
    const ps = pieces(line);
    if (!word) return null;
    if (Array.isArray(word.at) && word.at.length === 2) {
      const pl = places(line);
      const a = word.at[0], n = word.at[1];
      if (!(Number.isInteger(a) && Number.isInteger(n) && a >= 0 && n > 0 && a + n <= pl.length)) return null;
      return { from: pl[a].index, to: pl[a + n - 1].index + 1 };
    }
    if (typeof word.match !== 'string' || !word.match) return null;
    const want = word.match;
    let seen = 0;
    const nth = Number.isInteger(word.nth) && word.nth > 0 ? word.nth : 1;
    for (let i = 0; i < ps.length; i++) {
      if (isSpace(ps[i])) continue;
      let acc = '';
      for (let j = i; j < ps.length; j++) {
        acc += ps[j];
        if (acc.length > want.length) break;
        if (acc === want) {
          seen++;
          if (seen === nth) return { from: i, to: j + 1 };
          break;
        }
      }
    }
    return null;
  }

  function segment(line, words) {
    const ps = pieces(line);
    const owner = new Array(ps.length).fill(null);
    (Array.isArray(words) ? words : []).forEach(w => {
      if (!w || typeof w.id !== 'string') return;
      const r = locate(line, w);
      if (!r) { NM.reportError('g789.word', 'word not found: ' + w.id); return; }
      for (let k = r.from; k < r.to; k++) {
        if (owner[k]) { NM.reportError('g789.word', 'words overlap: ' + w.id + ' / ' + owner[k]); return; }
      }
      for (let k = r.from; k < r.to; k++) owner[k] = w.id;
    });
    const out = [];
    ps.forEach((p, i) => {
      const last = out[out.length - 1];
      // 같은 낱말(또는 둘 다 낱말 아님)이면 잇는다. 낱말 둘이 바로 붙어 있으면 owner 가 달라 나뉜다.
      if (last && last.wordId === owner[i]) {
        last.text += p;
      } else out.push({ text: p, wordId: owner[i] });
    });
    return out;
  }

  function block(id) {
    const O = NM.data && NM.data.ORIG;
    return O && typeof id === 'string' && O[id] ? O[id] : null;
  }
  function plain(text) {
    try { return NM.core.yet.render(String(text == null ? '' : text), { bangjeom: false, ruby: 'base' }); }
    catch (e) { NM.reportError('g789.plain', e); return String(text); }
  }
  function modern(text) {
    try { return NM.core.yet.modernReading(String(text == null ? '' : text)); }
    catch (e) { NM.reportError('g789.modern', e); return plain(text); }
  }

  function textOf(name, level) {
    const pick = (key) => {
      const G = NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[name];
      if (!G) return undefined;
      const get = (obj) => String(key).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
      const lv = G.levels && level && G.levels[level] ? get(G.levels[level]) : undefined;
      return typeof lv === 'string' ? lv : get(G);
    };
    return function t(key, vars) {
      const v = pick(key);
      if (typeof v !== 'string') { NM.reportError('g789.text', 'missing text: ' + name + '.' + key); return ''; }
      return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
    };
  }

  function el(doc, tag, cls, text) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(doc.createTextNode(String(text)));
    return e;
  }
  function mark(doc, kind, label) {
    const m = el(doc, 'span', 'nm-mark nm-mark-' + kind, label);
    m.setAttribute('data-mark', kind);
    return m;
  }
  function richSpan(o, text, cls) {
    const doc = o.document || root.document;
    const s = el(doc, 'span', cls || 'g789-rich');
    try { s.appendChild(o.yet(o.fill ? o.fill(String(text == null ? '' : text)) : String(text))); }
    catch (e) { NM.reportError('g789.rich', e); s.textContent = String(text); }
    return s;
  }
  // 옛말 조각(데이터 표기)을 눈에 보이는 글자 + 화면 낭독용 현대 표기로
  function yetPiece(o, text, cls) {
    const doc = o.document || root.document;
    const s = el(doc, 'span', cls || 'g789-piece');
    const vis = el(doc, 'span', 'g789-vis');
    vis.setAttribute('aria-hidden', 'true');
    try { vis.appendChild(o.yet(String(text))); } catch (e) { NM.reportError('g789.piece', e); vis.textContent = String(text); }
    s.appendChild(vis);
    s.appendChild(el(doc, 'span', 'nm-sr', modern(text)));
    return s;
  }

  // 原文 블록 보기. opts: { words: [낱말 지정], onWord(id, btn), wordClass, label(원문 표지 글), noteNoBangjeom(글) }
  function origView(o, blockId, opts) {
    const doc = o.document || root.document;
    const op = opts || {};
    const b = block(blockId);
    const box = el(doc, 'div', 'g789-orig nm-orig');
    box.setAttribute('data-block', String(blockId));
    const words = {};
    if (!b) {
      NM.reportError('g789.orig', 'unknown ORIG block: ' + blockId);
      return { el: box, words };
    }
    const head = el(doc, 'div', 'nm-orig-head');
    head.appendChild(mark(doc, 'orig', op.label || (typeof o.text === 'function' ? o.text('marks.orig') : '')));
    head.appendChild(el(doc, 'span', 'nm-orig-title', b.title || ''));
    box.appendChild(head);
    const mine = (Array.isArray(op.words) ? op.words : []).filter(w => w && (w.block === undefined || w.block === blockId));
    (b.lines || []).forEach((line, li) => {
      const p = el(doc, 'p', 'g789-line nm-orig-line');
      p.setAttribute('data-modern', modern(line));
      segment(line, mine.filter(w => (w.line || 0) === li)).forEach(seg => {
        if (!seg.wordId) { p.appendChild(yetPiece(o, seg.text, 'g789-seg')); return; }
        if (op.asSpans) {
          const sp = yetPiece(o, seg.text, 'g789-word g789-word-span ' + (op.wordClass || ''));
          sp.setAttribute('data-word', seg.wordId);
          words[seg.wordId] = sp;
          p.appendChild(sp);
          return;
        }
        const btn = el(doc, 'button', 'g789-word ' + (op.wordClass || ''));
        btn.type = 'button';
        btn.setAttribute('data-word', seg.wordId);
        btn.setAttribute('aria-label', modern(seg.text));
        const vis = el(doc, 'span', 'g789-vis');
        vis.setAttribute('aria-hidden', 'true');
        try { vis.appendChild(o.yet(seg.text)); } catch (e) { NM.reportError('g789.word', e); vis.textContent = seg.text; }
        btn.appendChild(vis);
        if (typeof op.onWord === 'function') btn.addEventListener('click', () => op.onWord(seg.wordId, btn));
        else btn.disabled = true;
        words[seg.wordId] = btn;
        p.appendChild(btn);
      });
      box.appendChild(p);
    });
    if (b.noBangjeom && op.noteNoBangjeom) box.appendChild(el(doc, 'p', 'nm-orig-note', op.noteNoBangjeom));
    return { el: box, words };
  }

  // 고르기 묶음(진짜 radio — Tab 으로 들어가 화살표·Space 로 고른다). 색만이 아니라 ✕ / ○ 기호로 틀림·정답을 보인다.
  // opts: { name, label(묶음 이름, 평문), options: [{ id, text(데이터 표기) | plain(평문) }], value, onChange(id) }
  let seq = 0;
  function radios(o, opts) {
    const doc = o.document || root.document;
    const name = 'g789r' + (++seq);
    const box = el(doc, 'div', 'g789-radios');
    box.setAttribute('role', 'radiogroup');
    if (opts.label) box.setAttribute('aria-label', opts.label);
    const inputs = {};
    const labels = {};
    (opts.options || []).forEach(op => {
      const lab = el(doc, 'label', 'g789-opt');
      lab.setAttribute('data-opt', op.id);
      const inp = el(doc, 'input', 'g789-radio');
      inp.type = 'radio';
      inp.name = name;
      inp.value = op.id;
      inp.addEventListener('change', () => { if (inp.checked) { api.clearMarks(); if (typeof opts.onChange === 'function') opts.onChange(op.id); } });
      lab.appendChild(inp);
      const face = el(doc, 'span', 'g789-face');
      const sym = el(doc, 'span', 'g789-sym');
      sym.setAttribute('aria-hidden', 'true');
      face.appendChild(sym);
      if (op.text != null) face.appendChild(richSpan(o, op.text, 'g789-opt-text'));
      else face.appendChild(el(doc, 'span', 'g789-opt-text', op.plain == null ? op.id : op.plain));
      lab.appendChild(face);
      inputs[op.id] = inp;
      labels[op.id] = lab;
      box.appendChild(lab);
    });
    const api = {
      el: box,
      get() { const k = Object.keys(inputs).filter(id => inputs[id].checked)[0]; return k === undefined ? null : k; },
      set(id) { Object.keys(inputs).forEach(k => { inputs[k].checked = k === id; }); },
      disable(b) { Object.keys(inputs).forEach(k => { inputs[k].disabled = !!b; }); box.classList.toggle('is-locked', !!b); },
      clearMarks() {
        box.classList.remove('is-wrong');
        box.removeAttribute('data-wrong');
        Object.keys(labels).forEach(k => {
          labels[k].classList.remove('is-wrong');
          if (!labels[k].classList.contains('is-answer')) labels[k].querySelector('.g789-sym').textContent = '';
        });
      },
      markWrong() {
        box.classList.add('is-wrong');
        box.setAttribute('data-wrong', '1');
        const cur = api.get();
        if (cur && labels[cur]) { labels[cur].classList.add('is-wrong'); labels[cur].querySelector('.g789-sym').textContent = '✕'; }
      },
      markAnswer(id, tag) {
        const lab = labels[id];
        if (!lab || lab.classList.contains('is-answer')) return;
        lab.classList.add('is-answer');
        lab.querySelector('.g789-sym').textContent = '○';
        if (tag) lab.querySelector('.g789-face').appendChild(el(doc, 'span', 'g789-tag', tag));
      }
    };
    if (opts.value != null) api.set(opts.value);
    return api;
  }

  function knownRules(o) {
    if (o && Array.isArray(o.knownRules)) return o.knownRules.slice();
    try {
      const app = NM.ui && NM.ui.app;
      if (app && app.started && typeof app.store === 'function' && NM.ui.stageLogic) {
        const st = app.store();
        if (st && typeof st.get === 'function') return NM.ui.stageLogic.knownRules(st.get(), st.level);
      }
    } catch (e) { NM.reportError('g789.knownRules', e); }
    return [];
  }
  function ruleInfo(id) {
    const C = NM.data && NM.data.RULE_CARDS && typeof NM.data.RULE_CARDS === 'object' ? NM.data.RULE_CARDS : {};
    const c = C[id] || null;
    const stage = c && typeof c.stage === 'string' ? c.stage : null;
    let stageName = null;
    if (stage) {
      try { stageName = NM.ui && NM.ui.stageLogic ? NM.ui.stageLogic.stageName(stage) : stage; }
      catch (e) { stageName = stage; }
    }
    return { id, name: c && c.name ? c.name : null, text: c && c.text ? c.text : null, stage, stageName };
  }

  NM.g789 = { pieces, places, locate, segment, block, plain, modern, textOf, el, mark, richSpan, yetPiece, origView, radios, knownRules, ruleInfo };
})(typeof window !== 'undefined' ? window : globalThis);
