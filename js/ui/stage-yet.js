'use strict';
/*
 * NM.ui.stageYet — 장면 화면의 옛한글 DOM 그리기 (캔버스 아님). 표기 해석은 NM.core.yet.parse 가 한다.
 *   build(text, opts) → DocumentFragment   대사·이름표 등 줄 안 글자
 *   line(text, opts)  → <p class="nm-orig-line" data-modern>   원문 한 줄(화면 낭독기용 현대 표기 읽기 포함)
 *   eums(chars)       → [음|null]  한자 글자 배열의 오늘날 음(기믹이 한자를 따로 그릴 때)
 *   opts: { document, solved: [{itemId, forms, gloss}], yetAll(true면 전체를 NMYet 으로) }
 *
 * ■ 방점을 음절 왼쪽에 찍는 방법 (spec §13, 결정 기록 0001 의 '알려진 한계' 해결)
 *   방점 글자 U+302E/302F 는 글꼴이 그린다 — 그리는 자리·간격이 글꼴마다 다르고, 음절 뒤가 아니면 점선 동그라미(◌)와
 *   함께 그려지며, 켜기/끄기 때마다 글을 다시 그려야 한다.
 *   그래서 화면에서는 방점 글자를 글자열에서 빼고, 음절을 <span class="nm-bj-syl" data-bj="1|2"> 로 감싼 뒤
 *   그 안 왼쪽 끝에 점 요소 <span class="nm-bj" aria-hidden="true"> 를 둔다(점은 css/stage.css 가 그린다:
 *   1점 거성, 2점 상성 — 위아래 두 점). 음절 글자 자체는 그대로 DOM 글자다.
 *   방점 켜기/끄기: <html data-nm-bangjeom="on|off"> 로 점만 숨긴다(다시 그리지 않음). 진행기가 설정·장면(s4·s10 늘 켬)에 맞춰 바꾼다.
 *   화면 낭독기: 원문 줄은 눈에 보이는 글자(aria-hidden)와 따로 현대 표기 읽기(.nm-sr, data-modern)를 둔다.
 *   옛말 낱말은 <span class="nm-yet"> 로 감싸 NMYet 글꼴(옛한글 조합 기능)로 그린다. 감싸는 단위는 음절 하나가 아니라
 *   '낱말'(띄어쓰기·문장 부호로 끊기는 한글·한자 글자 묶음)이다: 묶음 안에 옛한글 음절이나 방점 찍힌 음절이 하나라도
 *   있으면 묶음 전체를 감싼다. 음절 하나만 감싸면 한 낱말 안에서 글꼴이 바뀌어(나랏말[ㅆㆍ]미 → 고딕·명조·고딕)
 *   굵기·크기·기준선이 들쭉날쭉해진다. 옛말 낱말 안의 한자도 함께 명조로 그린다(父母[ㄹㆍㄹ]).
 *   루비(한자+읽기)는 바탕이나 읽기가 옛말이면 <ruby class="nm-yet">. yetAll(원문 줄)이면 바깥이 이미 .nm-yet 이다.
 * ■ 한자 음: 읽기가 달리지 않은 한자(맨 한자)는 한 글자씩 <ruby class="nm-eum"> 로 감싸 아래에 오늘날 음
 *   <rt class="nm-eum-rt"> 를 단다(NM.data.HANJA_EUM: 한자 덩어리 안에서 words 의 가장 긴 열쇠 먼저, 없으면 chars).
 *   {漢|읽기} 루비의 바탕 한자에는 달지 않는다(原文의 읽기가 이미 있음). 설정 '한자 음 달기'가 끔이면
 *   <html data-nm-eum="off"> 로 단 음만 숨긴다(css/stage.css). 루비는 모두 글자 아래(ruby-position: under).
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
  const HANJA = /^(?:[㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{3134F}])$/u;

  // 음절 묶음마다 한자 음(맨 한자가 아니면 null). 이어진 한자 덩어리 안에서 words 의 가장 긴 열쇠를 왼쪽부터 먼저 맞춘다.
  function eumFor(infos) {
    const T = NM.data && NM.data.HANJA_EUM;
    const out = new Array(infos.length).fill(null);
    if (!T) return out;
    const words = T.words || {}, chars = T.chars || {};
    let maxW = 1;
    Object.keys(words).forEach(k => { const n = Array.from(k).length; if (n > maxW) maxW = n; });
    let i = 0;
    while (i < infos.length) {
      if (!HANJA.test(infos[i].base)) { i++; continue; }
      let j = i;
      while (j < infos.length && HANJA.test(infos[j].base)) j++;
      let k = i;
      while (k < j) {
        let hit = 0;
        for (let n = Math.min(maxW, j - k); n >= 2 && !hit; n--) {
          const key = infos.slice(k, k + n).map(x => x.base).join('');
          const val = words[key];
          if (typeof val === 'string' && Array.from(val).length === n) { Array.from(val).forEach((s, d) => { out[k + d] = s; }); hit = n; }
        }
        if (!hit) { out[k] = typeof chars[infos[k].base] === 'string' ? chars[infos[k].base] : null; hit = 1; }
        k += hit;
      }
      i = j;
    }
    return out;
  }

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

  // 낱말을 이루는 글자: 한글 음절·첫가끝 자모·호환 자모·한자
  const WORDCH = /^(?:[ᄀ-ᇿꥠ-꥿ힰ-퟿가-힣ㄱ-ㆎ㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{3134F}])/u;
  // 옛말 낱말 자리: 낱말 글자 묶음 안에 옛한글 음절이나 방점 음절이 있으면 그 묶음 전체가 true
  function medievalMask(infos) {
    const med = new Array(infos.length).fill(false);
    let i = 0;
    while (i < infos.length) {
      if (!WORDCH.test(infos[i].base)) { i++; continue; }
      let j = i, hit = false;
      while (j < infos.length && WORDCH.test(infos[j].base)) { if (infos[j].archaic || infos[j].tone) hit = true; j++; }
      if (hit) for (let k = i; k < j; k++) med[k] = true;
      i = j;
    }
    return med;
  }
  function isMedieval(str) {
    try { return Y().splitSyllables(str).some(u => { const f = unitInfo(u); return f.archaic || f.tone > 0; }); }
    catch (e) { return false; }
  }

  // 음절 묶음 배열을 parent 에 그린다(방점 → 왼쪽 점, 옛말 낱말 → .nm-yet)
  // mask: 옛말 낱말 자리(build 가 꾸밈·루비 경계를 넘어 미리 셈). 없으면 이 음절들만 보고 센다.
  function appendUnits(doc, parent, units, yetAll, mask, noEum) {
    const infos = units.map(unitInfo);
    const med = yetAll ? null : (mask || medievalMask(infos));
    const eums = noEum ? null : eumFor(infos);
    let buf = '', bufTo = null, yetSpan = null;
    const flush = () => { if (buf) { bufTo.appendChild(doc.createTextNode(buf)); buf = ''; } };
    infos.forEach((info, i) => {
      let to = parent;
      if (med && med[i]) {
        if (!yetSpan) { flush(); yetSpan = doc.createElement('span'); yetSpan.className = 'nm-yet'; parent.appendChild(yetSpan); }
        to = yetSpan;
      } else if (yetSpan) { flush(); yetSpan = null; }
      if (eums && eums[i]) {
        flush();
        const rb = doc.createElement('ruby');
        rb.className = 'nm-eum';
        rb.appendChild(doc.createTextNode(info.base));
        const p1 = doc.createElement('rp'); p1.appendChild(doc.createTextNode('('));
        const rt = doc.createElement('rt'); rt.className = 'nm-eum-rt'; rt.appendChild(doc.createTextNode(eums[i]));
        const p2 = doc.createElement('rp'); p2.appendChild(doc.createTextNode(')'));
        rb.appendChild(p1); rb.appendChild(rt); rb.appendChild(p2);
        to.appendChild(rb);
        return;
      }
      if (info.tone) {
        flush();
        const syl = doc.createElement('span');
        syl.className = 'nm-bj-syl';
        syl.setAttribute('data-bj', String(info.tone));
        const dot = doc.createElement('span');
        dot.className = 'nm-bj';
        dot.setAttribute('aria-hidden', 'true');
        syl.appendChild(dot);
        syl.appendChild(doc.createTextNode(info.base));
        to.appendChild(syl);
        return;
      }
      if (bufTo !== to) { flush(); bufTo = to; }
      buf += info.base;
    });
    flush();
  }

  function appendString(doc, parent, str, opts, mask) {
    const units = Y().splitSyllables(str);
    const matches = findMatches(units, opts.solved);
    const part = (a, b) => (mask ? mask.slice(a, b) : null);
    const ne = !!opts.noEum;
    let i = 0;
    matches.forEach(m => {
      if (m.start > i) appendUnits(doc, parent, units.slice(i, m.start), opts.yetAll, part(i, m.start), ne);
      const wrap = doc.createElement('span');
      wrap.className = 'nm-solved';
      wrap.setAttribute('data-item', m.s.itemId);
      appendUnits(doc, wrap, units.slice(m.start, m.start + m.len), opts.yetAll, part(m.start, m.start + m.len), ne);
      const g = doc.createElement('span');
      g.className = 'nm-gloss';
      g.appendChild(doc.createTextNode(m.s.gloss));
      wrap.appendChild(g);
      parent.appendChild(wrap);
      i = m.start + m.len;
    });
    if (i < units.length) appendUnits(doc, parent, units.slice(i), opts.yetAll, part(i, units.length), ne);
  }

  // 옛말 낱말 자리를 꾸밈(**굵게** _밑줄_)·루비 경계를 넘어 센다: 'tk.mask'(글 토큰의 음절마다), 'tk.med'(루비).
  // 루비는 한자 한 글자처럼 보고, 바탕이나 읽기가 옛말이면 그 자체로 옛말이다({中|[ㄷㅠㆁ]}·에 · {羅雲|라운}·의).
  function maskTokens(tokens) {
    const flat = [];
    const out = tokens.map((tk, ti) => {
      if (tk.type === 'ruby') { flat.push({ ti, k: -1, info: { base: '漢', tone: 0, archaic: isMedieval(tk.base) || isMedieval(tk.reading) } }); return { med: false }; }
      const units = Y().splitSyllables(tk.text);
      units.forEach((u, k) => flat.push({ ti, k, info: unitInfo(u) }));
      return { mask: new Array(units.length).fill(false) };
    });
    const m = medievalMask(flat.map(f => f.info));
    flat.forEach((f, i) => { if (f.k < 0) out[f.ti].med = m[i]; else out[f.ti].mask[f.k] = m[i]; });
    return out;
  }

  function build(text, opts) {
    const o = opts || {};
    const doc = o.document || root.document;
    const frag = doc.createDocumentFragment();
    let tokens;
    try { tokens = Y().parse(String(text == null ? '' : text), { bangjeom: true }); }
    catch (e) { NM.reportError('stageYet.build', e); frag.appendChild(doc.createTextNode(String(text))); return frag; }
    const marks = o.yetAll ? null : maskTokens(tokens);
    tokens.forEach((tk, ti) => {
      let node;
      if (tk.type === 'ruby') {
        node = doc.createElement('ruby');
        if (marks && marks[ti].med) node.className = 'nm-yet';
        appendString(doc, node, tk.base, { yetAll: o.yetAll, noEum: true });
        const rp1 = doc.createElement('rp'); rp1.appendChild(doc.createTextNode('('));
        const rt = doc.createElement('rt'); appendString(doc, rt, tk.reading, { yetAll: o.yetAll, noEum: true });
        const rp2 = doc.createElement('rp'); rp2.appendChild(doc.createTextNode(')'));
        node.appendChild(rp1); node.appendChild(rt); node.appendChild(rp2);
      } else {
        node = doc.createElement('span');
        node.className = 'nm-tk';
        appendString(doc, node, tk.text, o, marks ? marks[ti].mask : null);
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

  // 한자 글자 배열(한 글자씩) → 같은 길이의 음 배열(맨 한자가 아니면 null). 한자를 따로 그리는 기믹용.
  function eums(chars) { return eumFor((chars || []).map(c => ({ base: String(c) }))); }

  NM.ui.stageYet = { build, line, modern, eums };
})(typeof window !== 'undefined' ? window : globalThis);
