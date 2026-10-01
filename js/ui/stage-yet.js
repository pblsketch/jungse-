'use strict';
/*
 * NM.ui.stageYet — 장면 화면의 옛한글 DOM 그리기 (캔버스 아님). 표기 해석은 NM.core.yet.parse 가 한다.
 *   build(text, opts) → DocumentFragment   대사·이름표 등 줄 안 글자
 *   line(text, opts)  → <p class="nm-orig-line" data-modern>   원문 한 줄(화면 낭독기용 현대 표기 읽기 포함)
 *   opts: { document, solved: [{itemId, forms, gloss}], yetAll(true면 전체를 NMYet 으로) }
 *
 * ■ 방점을 음절 왼쪽에 찍는 방법 (spec §13, 결정 기록 0001 의 '알려진 한계' 해결)
 *   NMYet 글꼴은 U+302E/302F 방점을 음절 오른쪽에 그린다. 교과서·판본은 왼쪽이다.
 *   그래서 화면에서는 방점 글자를 글자열에서 빼고, 음절을 <span class="nm-bj-syl" data-bj="1|2"> 로 감싼 뒤
 *   그 안 왼쪽 끝에 점 요소 <span class="nm-bj" aria-hidden="true"> 를 둔다(점은 css/stage.css 가 그린다:
 *   1점 거성, 2점 상성 — 위아래 두 점). 음절 글자 자체는 그대로 DOM 글자다.
 *   방점 켜기/끄기: <html data-nm-bangjeom="on|off"> 로 점만 숨긴다(다시 그리지 않음). 진행기가 설정·장면(s4·s10 늘 켬)에 맞춰 바꾼다.
 *   화면 낭독기: 원문 줄은 눈에 보이는 글자(aria-hidden)와 따로 현대 표기 읽기(.nm-sr, data-modern)를 둔다.
 *   옛한글 음절(첫가끝 자모가 든 음절)은 <span class="nm-yet"> 로 감싸 NMYet 글꼴의 조합 기능을 쓰게 한다.
 * ■ 확정한 말의 현대어 풀이: solved 의 forms(데이터 표기)와 방점을 뺀 음절열이 같은 곳을
 *   <span class="nm-solved" data-item> 로 감싸고 뒤에 <span class="nm-gloss">풀이</span> 를 붙인다(표시만, 판정과 무관).
 * 필요: ns.js, core/yet.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const Y = () => NM.core.yet;
  const TONE = /[〮〯]/g;
  const ARCHAIC = /[ᄀ-ᇿꥠ-꥿ힰ-퟿]/;

  function unitInfo(unit) {
    const tone = unit.indexOf('〯') >= 0 ? 2 : unit.indexOf('〮') >= 0 ? 1 : 0;
    const base = unit.replace(TONE, '');
    return { tone, base, archaic: ARCHAIC.test(base) };
  }

  function norm(s) {
    try { return Y().normalize(s, { tone: false }); } catch (e) { return String(s).replace(TONE, ''); }
  }

  function formUnits(form) {
    try { return Y().splitSyllables(Y().render(form, { bangjeom: false, ruby: 'base' })).map(norm); }
    catch (e) { NM.reportError('stageYet.form', e); return []; }
  }

  // units 안에서 solved 의 낱말이 놓인 자리: [{ start, len, s }]
  function findMatches(units, solved) {
    const out = [];
    if (!solved || !solved.length) return out;
    const bases = units.map(u => norm(unitInfo(u).base));
    const taken = new Array(units.length).fill(false);
    solved.forEach(s => (s.forms || []).forEach(f => {
      const fu = formUnits(f);
      if (!fu.length) return;
      for (let i = 0; i + fu.length <= bases.length; i++) {
        let ok = true;
        for (let k = 0; k < fu.length; k++) if (bases[i + k] !== fu[k] || taken[i + k]) { ok = false; break; }
        if (!ok) continue;
        for (let k = 0; k < fu.length; k++) taken[i + k] = true;
        out.push({ start: i, len: fu.length, s });
      }
    }));
    return out.sort((a, b) => a.start - b.start);
  }

  // 음절 묶음 배열을 parent 에 그린다(방점 → 왼쪽 점, 옛한글 → .nm-yet)
  function appendUnits(doc, parent, units, yetAll) {
    let textBuf = '', yetSpan = null;
    const flushText = () => { if (textBuf) { parent.appendChild(doc.createTextNode(textBuf)); textBuf = ''; } };
    const endYet = () => { yetSpan = null; };
    units.forEach(u => {
      const info = unitInfo(u);
      if (info.tone) {
        flushText(); endYet();
        const syl = doc.createElement('span');
        syl.className = 'nm-bj-syl';
        syl.setAttribute('data-bj', String(info.tone));
        const dot = doc.createElement('span');
        dot.className = 'nm-bj';
        dot.setAttribute('aria-hidden', 'true');
        syl.appendChild(dot);
        if (info.archaic && !yetAll) {
          const y = doc.createElement('span'); y.className = 'nm-yet'; y.appendChild(doc.createTextNode(info.base)); syl.appendChild(y);
        } else syl.appendChild(doc.createTextNode(info.base));
        parent.appendChild(syl);
        return;
      }
      if (info.archaic && !yetAll) {
        flushText();
        if (!yetSpan) { yetSpan = doc.createElement('span'); yetSpan.className = 'nm-yet'; parent.appendChild(yetSpan); }
        yetSpan.appendChild(doc.createTextNode(info.base));
        return;
      }
      endYet();
      textBuf += info.base;
    });
    flushText();
  }

  function appendString(doc, parent, str, opts) {
    const units = Y().splitSyllables(str);
    const matches = findMatches(units, opts.solved);
    let i = 0;
    matches.forEach(m => {
      if (m.start > i) appendUnits(doc, parent, units.slice(i, m.start), opts.yetAll);
      const wrap = doc.createElement('span');
      wrap.className = 'nm-solved';
      wrap.setAttribute('data-item', m.s.itemId);
      appendUnits(doc, wrap, units.slice(m.start, m.start + m.len), opts.yetAll);
      const g = doc.createElement('span');
      g.className = 'nm-gloss';
      g.appendChild(doc.createTextNode(m.s.gloss));
      wrap.appendChild(g);
      parent.appendChild(wrap);
      i = m.start + m.len;
    });
    if (i < units.length) appendUnits(doc, parent, units.slice(i), opts.yetAll);
  }

  function build(text, opts) {
    const o = opts || {};
    const doc = o.document || root.document;
    const frag = doc.createDocumentFragment();
    let tokens;
    try { tokens = Y().parse(String(text == null ? '' : text), { bangjeom: true }); }
    catch (e) { NM.reportError('stageYet.build', e); frag.appendChild(doc.createTextNode(String(text))); return frag; }
    tokens.forEach(tk => {
      let node;
      if (tk.type === 'ruby') {
        node = doc.createElement('ruby');
        appendString(doc, node, tk.base, { yetAll: o.yetAll });
        const rp1 = doc.createElement('rp'); rp1.appendChild(doc.createTextNode('('));
        const rt = doc.createElement('rt'); appendString(doc, rt, tk.reading, { yetAll: o.yetAll });
        const rp2 = doc.createElement('rp'); rp2.appendChild(doc.createTextNode(')'));
        node.appendChild(rp1); node.appendChild(rt); node.appendChild(rp2);
      } else {
        node = doc.createElement('span');
        node.className = 'nm-tk';
        appendString(doc, node, tk.text, o);
      }
      if (tk.underline) { const u = doc.createElement('u'); u.appendChild(node); node = u; }
      if (tk.bold) { const b = doc.createElement('strong'); b.appendChild(node); node = b; }
      frag.appendChild(node);
    });
    return frag;
  }

  function modern(text) {
    try { return Y().modernReading(String(text == null ? '' : text)); }
    catch (e) { NM.reportError('stageYet.modern', e); return String(text); }
  }

  function line(text, opts) {
    const o = opts || {};
    const doc = o.document || root.document;
    const p = doc.createElement('p');
    p.className = 'nm-orig-line';
    const m = modern(text);
    p.setAttribute('data-modern', m);
    const sr = doc.createElement('span');
    sr.className = 'nm-sr';
    sr.appendChild(doc.createTextNode(m));
    const vis = doc.createElement('span');
    vis.className = 'nm-yet nm-orig-vis';
    vis.setAttribute('aria-hidden', 'true');
    vis.appendChild(build(text, { document: doc, solved: o.solved, yetAll: true }));
    p.appendChild(sr);
    p.appendChild(vis);
    return p;
  }

  NM.ui.stageYet = { build, line, modern };
})(typeof window !== 'undefined' ? window : globalThis);
