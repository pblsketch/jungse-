'use strict';
/*
 * NM.ui.marker — 표지 체계 (spec §12). 색만으로 나누지 않도록 표지마다 글자 이름표를 단다.
 *   KINDS                     orig(原文·붉은 낙관) explain(풀이) know(알아 두기) fiction(게임 설정 · 虛)
 *                             variant(이본 노트·채점 안 함) interp(해석·채점 안 함)
 *   badge(kind, opts)         <span class="nm-mark" data-mark>이름표</span>
 *   card({kind, text, src, real, showReal, title, item, fill, solved, document})
 *                             표지 카드. know 는 출처(src), fiction 은 showReal 이면 "실제로는 → real",
 *                             variant·interp 는 '채점하지 않아요' 표시. text·title·real 은 장면 데이터 표기(옛한글 가능).
 *   orig(blockId, {solved, document})  NM.data.ORIG[blockId] 원문 카드: 原文 낙관 + 제목 + 줄마다 현대 표기 읽기 + 출처.
 *                             원문 글자는 자동 생성 데이터 그대로 그린다(바꾸지 않는다). 없는 블록이면 null + 오류 모음.
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const KINDS = ['orig', 'explain', 'know', 'fiction', 'variant', 'interp'];

  function el(doc, tag, cls, text) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(doc.createTextNode(String(text)));
    return e;
  }

  function badge(kind, opts) {
    const doc = (opts && opts.document) || root.document;
    const k = KINDS.indexOf(kind) >= 0 ? kind : 'know';
    const b = el(doc, 'span', 'nm-mark nm-mark-' + k, TX().t('marks.' + k));
    b.setAttribute('data-mark', k);
    return b;
  }

  function rich(doc, text, o) {
    const span = el(doc, 'span', 'nm-st-text');
    span.appendChild(YB().build(o.fill ? o.fill(text) : text, { document: doc, solved: o.solved }));
    return span;
  }

  function card(o) {
    const doc = o.document || root.document;
    const k = KINDS.indexOf(o.kind) >= 0 ? o.kind : 'know';
    const c = el(doc, 'div', 'nm-card nm-card-' + k);
    c.setAttribute('data-mark', k);
    if (o.item) c.setAttribute('data-item', o.item);
    const head = el(doc, 'div', 'nm-card-head');
    head.appendChild(badge(k, { document: doc }));
    if (o.title) { const t = el(doc, 'span', 'nm-card-title'); t.appendChild(rich(doc, o.title, o)); head.appendChild(t); }
    if (k === 'variant' || k === 'interp') head.appendChild(el(doc, 'span', 'nm-card-note', TX().t('marks.notScored')));
    c.appendChild(head);
    if (o.text) { const p = el(doc, 'p', 'nm-card-text'); p.appendChild(rich(doc, o.text, o)); c.appendChild(p); }
    if (k === 'fiction' && o.showReal && o.real) {
      const r = el(doc, 'p', 'nm-card-real');
      r.appendChild(el(doc, 'span', 'nm-card-real-label', TX().t('marks.real')));
      r.appendChild(doc.createTextNode(' '));
      r.appendChild(rich(doc, o.real, o));
      c.appendChild(r);
    }
    if (o.src) {
      const s = el(doc, 'p', 'nm-card-src');
      s.appendChild(el(doc, 'span', 'nm-card-src-label', TX().t('marks.src')));
      s.appendChild(doc.createTextNode(' ' + o.src));
      c.appendChild(s);
    }
    return c;
  }

  function orig(blockId, opts) {
    const o = opts || {};
    const doc = o.document || root.document;
    const block = NM.data.ORIG && NM.data.ORIG[blockId];
    if (!block || !Array.isArray(block.lines)) { NM.reportError('stage.orig', 'missing 原文 block: ' + blockId); return null; }
    const sec = el(doc, 'section', 'nm-orig');
    sec.setAttribute('data-orig', blockId);
    const head = el(doc, 'div', 'nm-orig-head');
    head.appendChild(badge('orig', { document: doc }));
    if (block.title) { const t = el(doc, 'span', 'nm-orig-title'); t.appendChild(YB().build(block.title, { document: doc })); head.appendChild(t); }
    sec.appendChild(head);
    const body = el(doc, 'div', 'nm-orig-body');
    block.lines.forEach(ln => body.appendChild(YB().line(ln, { document: doc, solved: o.solved })));
    sec.appendChild(body);
    if (block.src) {
      const s = el(doc, 'p', 'nm-card-src');
      s.appendChild(el(doc, 'span', 'nm-card-src-label', TX().t('marks.src')));
      s.appendChild(doc.createTextNode(' ' + block.src));
      sec.appendChild(s);
    }
    return sec;
  }

  NM.ui.marker = { KINDS, badge, card, orig };
})(typeof window !== 'undefined' ? window : globalThis);
