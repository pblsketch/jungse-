'use strict';
/*
 * NM.ui.marker — 표지 체계 (spec §12). 색만으로 나누지 않도록 표지마다 글자 이름표를 단다.
 *   KINDS                     orig(原文·붉은 낙관) explain(풀이) know(알아 두기) fiction(게임 설정 · 虛)
 *                             variant(이본 노트·채점 안 함) interp(해석·채점 안 함)
 *   badge(kind, opts)         <span class="nm-mark" data-mark>이름표</span>
 *   card({kind, text, src, real, showReal, title, item, fill, solved, document})
 *                             표지 카드. know 는 출처(src), fiction 은 showReal 이면 "실제로는 → real",
 *                             variant·interp 는 '채점하지 않아요' 표시. text·title·real 은 장면 데이터 표기(옛한글 가능).
 *   orig(blockId, {solved, document, modern})  NM.data.ORIG[blockId] 원문 카드: 原文 낙관 + 제목 + 줄마다 현대 표기 읽기 + 출처.
 *                             modern: true 면 현대어 풀이(block.modern)를 붙인다 — 맥락·대사 창만(과제 화면은 답이 드러나서 붙이지 않음).
 *                             원문 글자는 자동 생성 데이터 그대로 그린다(바꾸지 않는다). 없는 블록이면 null + 오류 모음.
 *   srcLabel(raw)             데이터 출처 칸 → 학생에게 보일 출처 글(검증 메모·파일 경로 빼고, 주소는 사이트 이름으로)
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

  /* ---------- 출처 글: 데이터의 출처 칸 → 학생에게 보일 글 ----------
   * 데이터의 출처 칸에는 검증용 메모가 섞여 있다(리서치 문서 절, 오해 id, 내려받은 파일 경로, 'PDF 글자 층').
   * 화면에는 교과서 쪽·문헌 이름·사이트 이름만 보인다. 원래 글은 title(마우스를 올리면 보임)로 남긴다.
   * 남는 것이 없으면 '' → 출처 줄을 그리지 않는다. */
  const SITES = [
    [/^ko\.wikisource\.org\/wiki\//, 'wikisource'], [/^zh\.wikisource\.org\/wiki\//, 'wikisourceZh'],
    [/^db\.sejongkorea\.org\//, 'sejong'], [/^contents\.history\.go\.kr\//, 'history'],
    [/^waks\.aks\.ac\.kr\//, 'aks'], [/^www\.davincimap\.co\.kr\//, 'davinci']
  ];
  const INTERNAL = /리서치|spec\s*§|(^|[\s(,])(rule|wrong)\.[A-Za-z]|source_cache|\.txt\b/;
  const SOURCEISH = /쪽|『|「|사전|영인|DB|우리말샘|위키문헌|포털|발음법|신문|보도|지도서|\(\d{4}\)/;
  function urlLabel(u) {
    const rest = u.replace(/^https?:\/\//, '');
    for (const [re, key] of SITES) {
      if (!re.test(rest)) continue;
      const name = TX().t('marks.sites.' + key);
      const m = rest.match(/\/wiki\/(.+)$/);
      if (!m) return name;
      let page = m[1];
      try { page = decodeURIComponent(page); } catch (e) { /* 그대로 */ }
      return name + ' 「' + page.replace(/_/g, ' ').replace(/\//g, ' · ') + '」';
    }
    return rest.split('/')[0];
  }
  function srcLabel(raw) {
    if (raw == null) return '';
    let s = String(raw).replace(/\s*[—–-]?\s*`[^`]*`/g, '').replace(/\s*\(PDF 글자 층\)/g, '');
    const urls = [];
    s = s.replace(/https?:\/\/[^\s<>]+/g, u => { urls.push(urlLabel(u.replace(/[,.;]+$/, ''))); return '\u0000' + (urls.length - 1) + '\u0000'; });
    // 괄호 밖의 ' · ', ', ' 로 나눈다
    const segs = []; let depth = 0, cur = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(') depth++; else if (ch === ')') depth = Math.max(0, depth - 1);
      if (!depth && (s.startsWith(' · ', i) || s.startsWith(', ', i))) { segs.push(cur); cur = ''; i += (s[i] === ' ' ? 2 : 1); continue; }
      cur += ch;
    }
    segs.push(cur);
    const out = [];
    segs.forEach(seg => {
      let t = seg.trim();
      // '리서치 …(교과서 쪽, 문헌)', 'rule.x (교과서 쪽)' → 괄호 안의 출처만
      const m = t.match(/^(?:리서치|rule\.|wrong\.|O-s\d)[^(]*\(([^()]*)\)\s*$/);
      if (m && !INTERNAL.test(m[1]) && SOURCEISH.test(m[1])) t = m[1].trim();
      t = t.replace(/\s*\(([^()]*)\)/g, (all, inner) => INTERNAL.test(inner) ? '' : all)
        .replace(/\s*\bO-s\d+-[A-Za-z0-9-]+(\s*블록)?/g, '').trim().replace(/^\(([^()]*)\)$/, '$1');
      if (!t || /^§/.test(t) || /^\d+번$/.test(t) || /^(리서치|spec|rule\.|wrong\.)/.test(t) || INTERNAL.test(t)) return;
      t = t.replace(/\u0000(\d+)\u0000/g, (all, k) => urls[+k]);
      if (out.indexOf(t) < 0) out.push(t);
    });
    return out.join(' · ');
  }
  function srcLine(doc, raw) {
    const label = srcLabel(raw);
    if (!label) return null;
    const s = el(doc, 'p', 'nm-card-src');
    if (label !== String(raw)) s.title = String(raw);
    s.appendChild(el(doc, 'span', 'nm-card-src-label', TX().t('marks.src')));
    s.appendChild(doc.createTextNode(' ' + label));
    return s;
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
    if (o.src) { const s = srcLine(doc, o.src); if (s) c.appendChild(s); }
    return c;
  }

  // 原文 아래 현대어 풀이(block.modern: 줄마다 하나). 보이는 방식은 <html data-nm-modern="tap|always|off">(설정)로 CSS 가 가른다:
  // tap 이면 단추를 눌러 펼치고, always 면 늘 펼쳐 보이고, off 면 통째로 숨긴다(다시 그리지 않음).
  function modernBox(doc, block) {
    const lines = Array.isArray(block.modern) ? block.modern.filter(x => typeof x === 'string' && x) : [];
    if (!lines.length) return null;
    const box = el(doc, 'div', 'nm-orig-modern');
    const btn = el(doc, 'button', 'nm-orig-modern-btn', TX().t('marks.modernShow'));
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    const txt = el(doc, 'div', 'nm-orig-modern-text');
    txt.appendChild(el(doc, 'span', 'nm-orig-modern-label', TX().t('marks.modern')));
    lines.forEach(m => txt.appendChild(el(doc, 'p', 'nm-orig-modern-line', m)));
    btn.addEventListener('click', () => {
      const open = !box.classList.contains('is-open');
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = TX().t(open ? 'marks.modernHide' : 'marks.modernShow');
    });
    box.appendChild(btn);
    box.appendChild(txt);
    return box;
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
    // 제목은 메타 정보(평문)다 — 표기로 해석하면 '첫째·둘째'의 가운뎃점이 방점으로 읽힌다.
    if (block.title) head.appendChild(el(doc, 'span', 'nm-orig-title', block.title));
    sec.appendChild(head);
    const body = el(doc, 'div', 'nm-orig-body');
    block.lines.forEach(ln => body.appendChild(YB().line(ln, { document: doc, solved: o.solved })));
    sec.appendChild(body);
    if (block.noBangjeom) sec.appendChild(el(doc, 'p', 'nm-orig-note', TX().t('marks.noBangjeom')));
    if (o.modern === true) { const m = modernBox(doc, block); if (m) sec.appendChild(m); }
    if (block.src) { const s = srcLine(doc, block.src); if (s) sec.appendChild(s); }
    return sec;
  }

  NM.ui.marker = { KINDS, badge, card, orig, srcLabel };
})(typeof window !== 'undefined' ? window : globalThis);
