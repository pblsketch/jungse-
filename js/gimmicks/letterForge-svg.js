'use strict';
/*
 * 기믹 letterForge 의 그림(SVG, 코드로 그림). 그림 안에는 글자를 넣지 않는다(spec §12) — 이름표는 DOM 글자로 따로 단다.
 * 모든 그림은 aria-hidden(뜻은 곁의 DOM 글자가 전한다). 색은 currentColor·CSS 변수(css/g-letterForge.css).
 *   NM.gimmicks.art.letterForge = {
 *     head(doc, sound)        발음 기관 단면도(왼쪽을 보는 옆모습). sound 'g'|'n'|'m'|'s'|'o' 의 본뜬 곳을 굵게 칠한다(.nm-glf-hl)
 *     PIECES                  획 조각 id → 그리기 정보(0~100 칸). top bottom left right slashL slashR ring
 *     board(doc)              획 판 → { el, set(pieces, wrongPieces) }  안내선(점선) 위에 고른 획을 굵게, 틀린 획은 흐리게(.is-wrong)
 *     pieceIcon(doc, piece)   획 단추 그림
 *     vowel(doc, struct)      합성 모음 미리보기. struct = { base: 'eu'|'i'|null, before: n, after: n } (ㆍ 수)
 *     thing(doc, kind)        'sky'(둥근 하늘) | 'earth'(평평한 땅) | 'person'(서 있는 사람)
 *   }
 * 필요: core/ns.js
 */
(function (root) {
  const NM = root.NM;
  const NS = 'http://www.w3.org/2000/svg';
  NM.gimmicks.art = NM.gimmicks.art || {};

  function svg(doc, viewBox, cls) {
    const s = doc.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', cls);
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    return s;
  }
  function node(doc, tag, attrs, parent) {
    const n = doc.createElementNS(NS, tag);
    Object.keys(attrs).forEach(k => n.setAttribute(k, String(attrs[k])));
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------- 발음 기관 단면도 ---------- */
  // 왼쪽을 보는 머리 옆 단면(얼굴 앞이 왼쪽). 좌표 0~200 × 0~170.
  const HEAD = {
    skin: 'M168 6 Q104 -4 66 14 Q46 26 44 46 L30 62 L40 68 Q30 70 28 76 Q20 82 28 88 Q20 96 28 104 Q30 116 36 124 Q48 136 72 136 L112 136 Q126 140 130 168',
    back: 'M168 6 Q190 40 176 80 Q166 110 164 168',
    nasal: 'M48 58 Q90 52 150 60',
    palate: 'M52 80 Q60 70 78 68 L118 68 Q134 70 140 84',
    uvula: 'M140 84 Q143 92 138 94',
    upperLip: 'M28 76 Q22 82 30 86 L44 84',
    lowerLip: 'M28 104 Q22 98 30 94 L44 96',
    upperTooth: 'M44 80 L51 80 L48 92 Z',
    lowerTooth: 'M44 104 L51 104 L48 95 Z',
    tongue: 'M50 100 Q56 90 74 90 Q110 86 126 96 Q138 106 136 132',
    pharynx: 'M152 72 Q156 104 152 168',
    larynx: 'M136 146 Q144 140 152 146'
  };
  // 본뜬 곳(제자해): ㄱ 혀뿌리가 목구멍을 막음 · ㄴ 혀끝이 윗잇몸에 닿음 · ㅁ 입 · ㅅ 이 · ㅇ 목구멍
  const HIGHLIGHT = {
    g: { d: 'M110 80 L140 80 L140 112', dots: [[110, 80], [140, 112]] },
    n: { d: 'M56 80 L56 98 L86 98', dots: [[56, 80], [86, 98]] },
    m: { d: 'M20 74 H44 V106 H20 Z', dots: [] },
    s: { d: 'M41 95 L48 79 L55 95', dots: [[41, 95], [55, 95]] },
    o: { circle: [144, 140, 10], dots: [] }
  };
  function head(doc, sound) {
    const s = svg(doc, '0 0 200 170', 'nm-glf-head');
    s.setAttribute('data-sound', sound || '');
    const g = node(doc, 'g', { class: 'nm-glf-anat', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    node(doc, 'path', { d: HEAD.skin + ' ' + HEAD.back, class: 'nm-glf-skin' }, g);
    node(doc, 'path', { d: HEAD.nasal, class: 'nm-glf-thin' }, g);
    ['palate', 'uvula', 'upperLip', 'lowerLip', 'tongue', 'pharynx', 'larynx'].forEach(k => node(doc, 'path', { d: HEAD[k], class: 'nm-glf-part nm-glf-' + k }, g));
    node(doc, 'path', { d: HEAD.upperTooth, class: 'nm-glf-tooth' }, g);
    node(doc, 'path', { d: HEAD.lowerTooth, class: 'nm-glf-tooth' }, g);
    const h = HIGHLIGHT[sound];
    if (h) {
      const hl = node(doc, 'g', { class: 'nm-glf-hl', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      if (h.circle) node(doc, 'circle', { cx: h.circle[0], cy: h.circle[1], r: h.circle[2] }, hl);
      else node(doc, 'path', { d: h.d }, hl);
      h.dots.forEach(([x, y]) => node(doc, 'circle', { cx: x, cy: y, r: 3.2, class: 'nm-glf-hl-dot' }, hl));
    }
    return s;
  }

  /* ---------- 획 판 ---------- */
  const PIECES = {
    top: { d: 'M22 22 H78' },
    bottom: { d: 'M22 78 H78' },
    left: { d: 'M22 22 V78' },
    right: { d: 'M78 22 V78' },
    slashL: { d: 'M50 18 L20 82' },
    slashR: { d: 'M50 18 L80 82' },
    ring: { circle: [50, 50, 28] }
  };
  const ORDER = ['top', 'bottom', 'left', 'right', 'slashL', 'slashR', 'ring'];
  function drawPiece(doc, parent, id, cls) {
    const p = PIECES[id];
    const n = p.circle ? node(doc, 'circle', { cx: p.circle[0], cy: p.circle[1], r: p.circle[2] }, parent) : node(doc, 'path', { d: p.d }, parent);
    n.setAttribute('class', cls);
    n.setAttribute('data-piece', id);
    return n;
  }
  function board(doc) {
    const s = svg(doc, '0 0 100 100', 'nm-glf-board');
    const guides = node(doc, 'g', { class: 'nm-glf-guides', fill: 'none' }, s);
    ORDER.forEach(id => drawPiece(doc, guides, id, 'nm-glf-guide'));
    const ink = node(doc, 'g', { class: 'nm-glf-ink', fill: 'none', 'stroke-linecap': 'round' }, s);
    return {
      el: s,
      set(pieces, wrongPieces) {
        while (ink.firstChild) ink.removeChild(ink.firstChild);
        const w = wrongPieces || [];
        ORDER.filter(id => (pieces || []).indexOf(id) >= 0).forEach(id => drawPiece(doc, ink, id, 'nm-glf-stroke' + (w.indexOf(id) >= 0 ? ' is-wrong' : '')));
      }
    };
  }
  function pieceIcon(doc, id) {
    const s = svg(doc, '0 0 100 100', 'nm-glf-picon');
    const g = node(doc, 'g', { fill: 'none', 'stroke-linecap': 'round' }, s);
    drawPiece(doc, g, id, 'nm-glf-stroke');
    return s;
  }

  /* ---------- 합성 모음 미리보기 ---------- */
  function vowel(doc, st) {
    const s = svg(doc, '0 0 100 100', 'nm-glf-vowel');
    const g = node(doc, 'g', { class: 'nm-glf-ink', fill: 'none', 'stroke-linecap': 'round' }, s);
    const before = st.before | 0, after = st.after | 0;
    const dot = (x, y) => node(doc, 'circle', { cx: x, cy: y, r: 7, class: 'nm-glf-dot' }, s);
    if (st.base === 'eu') {
      node(doc, 'path', { d: 'M14 55 H86', class: 'nm-glf-stroke' }, g);
      const row = (n, y) => (n === 1 ? [50] : n === 2 ? [36, 64] : []).forEach(x => dot(x, y));
      row(Math.min(before, 2), 31);
      row(Math.min(after, 2), 79);
    } else if (st.base === 'i') {
      node(doc, 'path', { d: 'M50 12 V88', class: 'nm-glf-stroke' }, g);
      const col = (n, x) => (n === 1 ? [50] : n === 2 ? [36, 64] : []).forEach(y => dot(x, y));
      col(Math.min(before, 2), 26);
      col(Math.min(after, 2), 74);
    } else {
      const n = Math.min(before + after, 3);
      for (let k = 0; k < n; k++) dot(50 + (k - (n - 1) / 2) * 22, 50);
    }
    return s;
  }

  /* ---------- 하늘 · 땅 · 사람 ---------- */
  function thing(doc, kind) {
    const s = svg(doc, '0 0 60 60', 'nm-glf-thing');
    s.setAttribute('data-thing', kind);
    const g = node(doc, 'g', { fill: 'none', 'stroke-linecap': 'round' }, s);
    if (kind === 'sky') {
      node(doc, 'circle', { cx: 30, cy: 30, r: 15, class: 'nm-glf-fillish' }, g);
      [[30, 6, 30, 11], [30, 49, 30, 54], [6, 30, 11, 30], [49, 30, 54, 30]].forEach(([a, b, c, d]) => node(doc, 'path', { d: `M${a} ${b} L${c} ${d}` }, g));
    } else if (kind === 'earth') {
      node(doc, 'path', { d: 'M6 34 H54' }, g);
      [12, 22, 32, 42].forEach(x => node(doc, 'path', { d: `M${x} 38 L${x - 5} 46`, class: 'nm-glf-thin' }, g));
    } else {
      node(doc, 'circle', { cx: 30, cy: 13, r: 6 }, g);
      node(doc, 'path', { d: 'M30 20 V40 M18 28 H42 M30 40 L22 54 M30 40 L38 54' }, g);
    }
    return s;
  }

  NM.gimmicks.art.letterForge = { head, PIECES, ORDER, board, pieceIcon, vowel, thing, HIGHLIGHT };
})(typeof window !== 'undefined' ? window : globalThis);
