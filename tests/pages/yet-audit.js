// 옛한글 표기 검수 페이지 (tests/pages/yet-audit.html) — index.html 의 스타일·스크립트를 그대로 읽고(main.js 제외)
// 실제 그리기 코드(NM.ui.stageYet / marker / dom.yet / notebookImage / 기믹)로 데이터의 표기 글을 그린다.
// window.__audit() 는 그린 화면을 자동으로 훑는다(글꼴에 없는 글자, ◌, 풀리지 않은 표기, 한 낱말 안의 글꼴 섞임,
// 조합되지 않은 첫가끝 자모, 방점 점 위치, 루비 겹침, 상자 밖으로 삐져나온 글자).
/* eslint-disable no-console */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search);
  const SEC = q.get('sec') || 'orig';
  const FS = q.get('fs') || '1';
  const NICK = '해솔';

  function loadAll() {
    return fetch('index.html').then(r => r.text()).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const css = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'));
      const js = [...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).filter(s => s !== 'js/main.js');
      css.forEach(h => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.insertBefore(l, document.head.querySelector('style')); });
      return js.reduce((p, src) => p.then(() => new Promise((res, rej) => {
        const s = document.createElement('script'); s.src = src; s.async = false; s.onload = res; s.onerror = () => rej(new Error('load ' + src));
        document.body.appendChild(s);
      })), Promise.resolve());
    });
  }

  // ── 도우미 ──
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }
  const fill = (s) => String(s).replace(/<@([^>]*)>/g, (m, j) => NICK + (j ? (j.split('/')[1] || j) : ''));
  const YB = () => NM.ui.stageYet;
  const HAN = /[ᄀ-ᇿꥠ-꥿ힰ-퟿ㄱ-ㆎ〮〯⺀-⿟㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{3134F}]/u;
  const interesting = (s) => typeof s === 'string' && (/[[\]{}]/.test(s) || /[·:](?=[가-힣ᄀ-ᅟꥠ-꥿[])/.test(s) || HAN.test(s));
  let host = null, layer = null, ser = 0;
  function win(title) {
    const w = el('div', 'nm-st-win');
    w.setAttribute('data-audit', String(++ser));
    const head = el('div', 'nm-st-head');
    head.appendChild(el('h2', 'nm-st-title', title));
    const body = el('div', 'nm-st-body');
    w.appendChild(head); w.appendChild(body);
    host.appendChild(w);
    return body;
  }
  function heading(text) { host.appendChild(el('h2', 'ya-h', text)); }
  function pathNote(parent, p) { parent.appendChild(el('p', 'ya-path', p)); }
  function rich(text, cls, opts) {
    const s = el('span', cls || 'nm-st-text');
    s.appendChild(YB().build(fill(text), opts || {}));
    return s;
  }

  // ── 原文 ──
  function secOrig() {
    heading('原文 블록 — NM.ui.marker.orig (' + Object.keys(NM.data.ORIG).length + ')');
    const ids = Object.keys(NM.data.ORIG);
    let body = null;
    ids.forEach((id, i) => {
      if (i % 4 === 0) body = win('原文 ' + (i + 1) + '–' + Math.min(ids.length, i + 4));
      pathNote(body, id);
      const c = NM.ui.marker.orig(id);
      if (c) body.appendChild(c);
    });
  }

  // ── 장면 글 ──
  function walk(v, path, out, seen) {
    if (typeof v === 'string') { out.push([path, v]); return; }
    if (!v || typeof v !== 'object' || seen.has(v)) return;
    seen.add(v);
    for (const k of Object.keys(v)) {
      if (k === 'editions' || k === 'orig' || k === 'src' || k === 'id' || k === 'gimmick' || k === 'mapKey' || k === 'bgmKey' || k === 'portrait' || k === 'cg' || k === 'who' || k === 'expr' || k === 'ruleCard' || k === 'levels' || k === 'at' || k === 'kind' || k === 'answer' || k === 'mark') continue;
      walk(v[k], path + '.' + k, out, seen);
    }
  }
  function sceneStrings(sc) {
    const out = [];
    walk(sc, sc.id, out, new Set());
    Object.keys(sc.editions || {}).forEach(lv => walk(sc.editions[lv], sc.id + '@' + lv, out, new Set()));
    const seen = new Set();
    return out.filter(([p, s]) => { if (seen.has(s) || !interesting(s)) return false; seen.add(s); return true; });
  }
  function renderSceneString(body, p, s) {
    const row = el('div', 'ya-row');
    row.setAttribute('data-path', p);
    if (/\.items\.\d+\.label$/.test(p)) {
      const l = el('div', 'nm-st-item-label nm-yet'); l.appendChild(YB().build(fill(s), {})); row.appendChild(l);
    } else if (/\.cards\.\d+\.text$/.test(p)) {
      const b = el('button', 'nm-st-card'); b.type = 'button';
      b.appendChild(el('span', 'nm-st-card-mark')); b.appendChild(rich(s)); row.appendChild(b);
    } else if (/\.contexts\.\d+\.label$/.test(p) || /\.npcs\.[^.]+\.name$/.test(p)) {
      const b = el('button', 'nm-st-btn nm-st-ctx-item'); b.type = 'button';
      b.appendChild(el('span', 'nm-st-sym', '○')); b.appendChild(rich(s, 'nm-st-ctx-name')); row.appendChild(b);
    } else if (/\.carveGlyph$/.test(p)) {
      const plate = el('div', 'nm-st-plate is-still'); const g = el('span', 'nm-st-glyph nm-yet');
      if (/^[〮〯]$/.test(s)) g.textContent = NM.core.yet.soloTone(s); else g.appendChild(YB().build(s, {})); // js/ui/stage-end.js 와 같게
      plate.appendChild(g); row.appendChild(plate);
    } else if (/\.(notes|fiction)\.\d+\.(text|title|real)$/.test(p)) {
      const kind = /\.fiction\./.test(p) ? 'fiction' : 'know';
      row.appendChild(NM.ui.marker.card({ kind, text: s, real: kind === 'fiction' ? s : null, showReal: false }));
    } else if (/\.why$/.test(p)) {
      const w = el('div', 'nm-st-why'); w.appendChild(el('span', 'nm-st-why-label', '왜 아닐까')); w.appendChild(document.createTextNode(' ')); w.appendChild(rich(s)); row.appendChild(w);
    } else if (/\.sentence$/.test(p)) {
      const ps = el('p', 'nm-rulecard-sentence'); ps.appendChild(rich(s)); row.appendChild(ps);
    } else {
      const line = el('div', 'nm-dlg-line'); const main = el('div', 'nm-dlg-main');
      const t = el('p', 'nm-dlg-text'); t.appendChild(rich(s)); main.appendChild(t); line.appendChild(main); row.appendChild(line);
    }
    pathNote(row, p);
    body.appendChild(row);
  }
  function secScenes() {
    const ids = (NM.data.STAGE_IDS || Object.keys(NM.data.SCENES)).filter(id => NM.data.SCENES[id]);
    ids.forEach(id => {
      const sc = NM.data.SCENES[id];
      const list = sceneStrings(sc);
      heading('장면 ' + id + ' — 표기 글 ' + list.length);
      // 진행표(HUD)
      const hud = el('div', 'nm-st-hud');
      const head = el('button', 'nm-st-hud-head'); head.type = 'button';
      head.appendChild(rich(sc.title || '', 'nm-st-hud-title'));
      if (sc.era) head.appendChild(rich(sc.era, 'nm-st-hud-era'));
      head.appendChild(el('span', 'nm-st-hud-count', '● 0/3'));
      hud.appendChild(head);
      const ul = el('ul', 'nm-st-hud-list');
      (sc.items || []).forEach(it => {
        const li = el('li'); const b = el('button', 'nm-st-hud-item'); b.type = 'button';
        b.appendChild(el('span', 'nm-st-sym', '○')); b.appendChild(rich(it.label || it.id, 'nm-st-hud-name'));
        b.appendChild(el('span', 'nm-st-hud-state', '확인 전')); li.appendChild(b); ul.appendChild(li);
      });
      hud.appendChild(ul);
      layer.insertBefore(hud, host);
      let body = null;
      list.forEach(([p, s], i) => {
        if (i % 14 === 0) body = win(id + ' ' + (i + 1) + '–' + Math.min(list.length, i + 14));
        renderSceneString(body, p, s);
      });
    });
    // 진행표는 host 앞에 모았다 → 장면 순서대로 보이게 마지막에 host 를 뒤로
  }

  // ── 공용 데이터 ──
  function secData() {
    const dom = NM.ui.dom;
    const modal = (title) => { const m = el('div', 'nm-modal'); m.setAttribute('data-audit', String(++ser)); m.appendChild(el('h3', 'nm-nb-title', title)); host.appendChild(m); return m; };
    heading('규칙 카드 NM.data.RULE_CARDS — 수첩(dom.yet) / 장면(stageYet)');
    let m = null;
    Object.keys(NM.data.RULE_CARDS).forEach((id, i) => {
      const r = NM.data.RULE_CARDS[id];
      if (i % 8 === 0) m = modal('규칙 카드 ' + (i + 1));
      const li = el('div', 'nm-rule ya-row'); li.setAttribute('data-path', id);
      const st = el('strong'); st.appendChild(dom.yet(r.name, { bangjeom: true })); li.appendChild(st);
      const tx = el('span', 'nm-rule-text'); tx.appendChild(dom.yet(r.text, { bangjeom: true })); li.appendChild(tx);
      m.appendChild(li);
      const ps = el('p', 'nm-rulecard-sentence'); ps.appendChild(rich(r.text)); m.appendChild(ps);
      pathNote(m, id);
    });
    heading('옛글자 도감 NM.data.DOGAM');
    m = modal('도감');
    const ul = el('ul', 'nm-dogam-list'); m.appendChild(ul);
    Object.keys(NM.data.DOGAM).forEach(k => {
      const d = NM.data.DOGAM[k];
      const li = el('li', 'nm-dogam nm-dogam-found'); li.setAttribute('data-path', 'DOGAM.' + k);
      const g = el('span', 'nm-dogam-glyph'); g.appendChild(dom.yet(d.glyph, { bangjeom: true })); li.appendChild(g);
      const n = el('span', 'nm-dogam-name'); n.appendChild(dom.yet(d.name, { bangjeom: true })); li.appendChild(n);
      if (d.note) { const no = el('span', 'nm-dogam-note'); no.appendChild(dom.yet(d.note, { bangjeom: true })); li.appendChild(no); }
      ul.appendChild(li);
    });
    heading('오답 카드 NM.data.WRONG_CARDS');
    let body = null;
    Object.keys(NM.data.WRONG_CARDS).filter(id => interesting(NM.data.WRONG_CARDS[id].text) || interesting(NM.data.WRONG_CARDS[id].why)).forEach((id, i) => {
      const w = NM.data.WRONG_CARDS[id];
      if (i % 10 === 0) body = win('오답 카드 ' + (i + 1));
      renderSceneString(body, id + '.cards.0.text', w.text);
      if (w.why) renderSceneString(body, id + '.why', w.why);
    });
    heading('기믹 문구 NM.data.TEXT.g.*');
    const g = (NM.data.TEXT && NM.data.TEXT.g) || {};
    const out = [];
    Object.keys(g).forEach(k => walk(g[k], 'TEXT.g.' + k, out, new Set()));
    body = null;
    out.filter(([, s]) => interesting(s) && !/\{[a-z]+\}/.test(s)).forEach(([p, s], i) => {
      if (i % 14 === 0) body = win('기믹 문구 ' + (i + 1));
      renderSceneString(body, p, s);
    });
  }

  // ── 화면 흐름 UI ──
  function secUi() {
    const dom = NM.ui.dom, M = NM.ui.notebookModel;
    const screens = el('div'); screens.id = 'nm-screens';
    const inner = el('div', 'nm-screen-inner'); screens.appendChild(inner);
    host.appendChild(screens);
    inner.appendChild(el('h2', 'ya-h', '첫 화면 제목'));
    const h1 = el('h1', 'nm-game-title'); h1.appendChild(dom.yet(dom.t('gameTitle'), { bangjeom: true })); inner.appendChild(h1);
    inner.appendChild(el('h2', 'ya-h', '장면 고르기 카드'));
    const grid = el('div', 'nm-stage-grid'); inner.appendChild(grid);
    (NM.data.STAGE_IDS || []).forEach(id => {
      const name = M.stageName(id), label = M.stageLabel(id), sc = M.sceneOf(id), glyph = M.carveGlyph(id);
      const b = el('button', 'nm-btn nm-stage-card nm-card-core nm-card-done'); b.type = 'button'; b.setAttribute('data-path', 'select.' + id);
      const top = el('span', 'nm-card-top'); top.appendChild(el('span', 'nm-card-label', label)); b.appendChild(top);
      if (name !== label) { const n = el('span', 'nm-card-name'); n.appendChild(dom.yet(name)); b.appendChild(n); }
      if (sc && sc.era) b.appendChild(el('span', 'nm-card-era', sc.era));
      const bottom = el('span', 'nm-card-bottom');
      if (glyph) {
        const cg = el('span', 'nm-card-glyph');
        if (/^[〮〯]$/.test(glyph)) cg.appendChild(el('span', 'nm-glyph nm-yet', NM.core.yet.soloTone(glyph))); // js/ui/screens.js 와 같게
        else { const gg = el('span', 'nm-glyph'); gg.appendChild(dom.yet(glyph, { bangjeom: true })); cg.appendChild(gg); }
        bottom.appendChild(cg);
      }
      b.appendChild(bottom);
      grid.appendChild(b);
    });
    // 수첩(실제 수첩 창과 같은 글 짜임)
    heading('수첩 — 확정한 말 · 규칙 · 옮긴 구절');
    const nb = el('div', 'nm-modal'); nb.setAttribute('data-audit', String(++ser));
    const sel = el('select'); sel.id = 'nm-nb-stage';
    (NM.data.STAGE_IDS || []).forEach(id => { const name = M.stageName(id), label = M.stageLabel(id); sel.appendChild(el('option', null, name !== label ? label + ' ' + NM.core.yet.render(name) : label)); });
    nb.appendChild(sel);
    const list = el('ul', 'nm-nb-list'); nb.appendChild(list);
    const words = [];
    Object.keys(NM.data.SCENES).forEach(sid => {
      const sc = NM.data.SCENES[sid];
      const items = [].concat(sc.items || [], ...Object.keys(sc.editions || {}).map(l => sc.editions[l].items || []));
      const seen = new Set();
      items.forEach(it => { const w = it.word || it.label; if (it.kind === 'read' && w && !seen.has(w)) { seen.add(w); words.push({ sid, w, it }); } });
    });
    words.forEach(({ sid, w, it }) => {
      const li = el('li', 'nm-nb-item'); li.setAttribute('data-path', sid + ':' + it.id);
      li.appendChild(dom.yet(w, { bangjeom: true, class: 'nm-nb-word' })); // js/ui/notebook.js 와 같게
      li.appendChild(el('span', 'nm-arrow', ' → '));
      li.appendChild(el('span', 'nm-modern', it.gloss || '풀이'));
      list.appendChild(li);
    });
    host.appendChild(nb);
    // 수첩 이미지(캔버스)
    heading('수첩 이미지(캔버스) — 장면마다');
    const F = document.fonts; // 실제 수첩 이미지처럼 글꼴을 받은 뒤 그린다(notebook-image.js loadFonts)
    const ready = Promise.all([F.load("40px 'NMYet'", '가'), F.load("40px 'NMYetExt'", '梬'), F.load("32px 'NMSans'", '가'), F.load("700 32px 'NMSans'", '가')]);
    return ready.then(() => (NM.data.STAGE_IDS || []).forEach(sid => {
      const sc = NM.data.SCENES[sid];
      if (!sc) return;
      const ws = words.filter(x => x.sid === sid);
      const rules = Object.keys(NM.data.RULE_CARDS).map(k => NM.data.RULE_CARDS[k]).filter(r => r.stage === sid);
      const tr = [].concat(sc.translations || [], sc.translate && sc.translate.text ? [sc.translate] : []);
      const plain = (s) => NM.core.yet.render(String(s || ''), { bangjeom: true });
      const model = {
        gameTitle: plain(dom.t('gameTitle')), stageId: sid, stageLabel: M.stageLabel(sid), stageName: plain(M.stageName(sid)),
        level: 'h23', levelLabel: dom.t('levels.h23'), name: '', number: '', nickname: NICK,
        items: ws.map(x => ({ id: x.it.id, orig: plain(x.w), modern: x.it.gloss || '' })),
        translations: tr.map(x => plain(x.text)), rules: rules.map(r => ({ id: r.id, name: plain(r.name), text: plain(r.text) })),
        reflection: '', glyph: M.carveGlyph(sid) ? (/^[〮〯]$/.test(M.carveGlyph(sid)) ? NM.core.yet.soloTone(M.carveGlyph(sid)) : plain(M.carveGlyph(sid))) : '',
        title: '', stats: { self: 1, byHelp: 0, growthText: '스스로 확정한 말 1 · 도움 받아 확정한 말 0', helps: 0, misreads: 0, misreadText: '0번' }, status: 'done', statusText: '끝냄',
        teacher: false, teacherText: '', createdAt: '', createdText: '2026-10-02 09:00', fileName: 'x.png'
      };
      try {
        const r = NM.ui.notebookImage.draw(model);
        const img = el('img', 'ya-canvas'); img.src = r.canvas.toDataURL('image/png'); img.setAttribute('data-path', 'image.' + sid);
        img.style.width = 'min(540px, 100%)'; img.style.boxSizing = 'border-box';
        host.appendChild(img);
      } catch (e) { NM.reportError('audit.image', e); }
    }));
  }

  // ── 기믹 ──
  function secGimmicks() {
    Object.keys(NM.data.SCENES).forEach(sid => {
      const sc = NM.data.SCENES[sid];
      const variants = [['', sc]].concat(Object.keys(sc.editions || {}).map(l => [l, Object.assign({}, sc, sc.editions[l])]));
      const seen = new Set();
      variants.forEach(([lv, s]) => (s.items || []).filter(it => it.kind === 'task').forEach(it => {
        if (seen.has(it)) return; seen.add(it);
        const def = NM.gimmicks.get(it.gimmick);
        if (!def) return;
        [false, true].forEach(answer => {
          heading(sid + (lv ? '@' + lv : '') + ' ' + it.id + ' ' + it.gimmick + (answer ? ' — 정답 보기' : ''));
          const body = win(it.id);
          if (it.label) { const l = el('div', 'nm-st-item-label'); l.appendChild(YB().build(fill(it.label), {})); body.appendChild(l); }
          if (it.prompt) body.appendChild(rich(it.prompt, 'nm-st-prompt'));
          const mount = el('div', 'nm-st-gimmick'); mount.setAttribute('data-gimmick', it.gimmick); body.appendChild(mount);
          try {
            const inst = def.mount(mount, {
              item: it, config: it.config || {}, level: lv || 'h23', teacher: false, document, readOnly: answer,
              reducedMotion: true, bangjeom: true, onSubmit() {}, text: NM.ui.stageText.t, fill,
              knownRules: Object.keys(NM.data.RULE_CARDS), addTranslation() {},
              yet: (text, o) => YB().build(text, o || {}), rulecard: (o) => NM.ui.rulecard.build(o)
            });
            if (answer && inst && typeof inst.showAnswer === 'function') inst.showAnswer(it.answer);
          } catch (e) { NM.reportError('audit.gimmick.' + it.id, e); }
        });
      }));
    });
  }

  // ── 자동 탐지 ──
  function coverage() {
    return fetch('assets/fonts/coverage.json').then(r => r.json()).then(cov => {
      const out = {};
      Object.keys(cov.fonts).forEach(name => {
        const set = new Set();
        cov.fonts[name].ranges.forEach(([a, b]) => { for (let c = a; c <= b; c++) set.add(c); });
        out[name] = set;
      });
      return out;
    });
  }
  // js/ui/stage-yet.js 와 같은 '낱말 글자'(한글 음절·자모·한자) — 이것이 아닌 글자에서 낱말이 끊긴다
  const WORDCH = /^(?:[ᄀ-ᇿꥠ-꥿ힰ-퟿가-힣ㄱ-ㆎ㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{3134F}])/u;
  const isJamo = (c) => (c >= 0x1100 && c <= 0x11FF) || (c >= 0xA960 && c <= 0xA97F) || (c >= 0xD7B0 && c <= 0xD7FF);
  const isHangul = (c) => isJamo(c) || (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0x3131 && c <= 0x318E);
  const isHanja = (c) => (c >= 0x3400 && c <= 0x4DBF) || (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0xF900 && c <= 0xFAFF) || (c >= 0x20000 && c <= 0x3134F);
  const visible = (e) => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return false; if (x.classList.contains('nm-sr')) return false; } return true; };
  const where = (n) => { const e = n.nodeType === 1 ? n : n.parentElement; const r = e && e.closest('[data-path]'); const w = e && e.closest('[data-audit]'); return (r ? r.getAttribute('data-path') : '') || (w ? 'win#' + w.getAttribute('data-audit') : '') || (e ? e.className : ''); };

  function audit(cov) {
    const issues = [];
    const add = (type, node, info) => issues.push(Object.assign({ type, where: where(node) }, info || {}));
    const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' });
    const famCache = new Map();
    const fams = (e) => {
      const f = getComputedStyle(e).fontFamily;
      if (!famCache.has(f)) famCache.set(f, f.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')));
      return famCache.get(f);
    };
    const resolve = (list, g) => {
      const cps = [...g].map(ch => ch.codePointAt(0)).filter(c => c !== 0xFE0F && c !== 0x200B);
      for (const f of list) { const set = cov[f]; if (set && cps.every(c => set.has(c))) return f; }
      return 'fallback(' + list.join('/') + ')';
    };
    const blockOf = (e) => { for (let x = e; x; x = x.parentElement) { if (x.tagName === 'RT') return x; const d = getComputedStyle(x).display; if (d !== 'inline' && d !== 'ruby' && d !== 'ruby-base' && d !== 'contents') return x; } return document.body; };
    const words = new Map(); // block → [{ g, font, node, sp }]
    const walker = document.createTreeWalker(document.getElementById('ui-layer'), NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let n;
    while ((n = walker.nextNode())) {
      const p = n.parentElement;
      if (!p || p.closest('rp, option, script, style, .ya-path, .ya-h') || !visible(p)) continue;
      if (!n.data.trim()) { const b0 = blockOf(p); if (words.has(b0)) words.get(b0).push({ sp: true }); continue; }
      const list = fams(p);
      const blk = blockOf(p);
      if (!words.has(blk)) words.set(blk, []);
      const arr = words.get(blk);
      let off = 0;
      for (const { segment: g } of seg.segment(n.data)) {
        const c = g.codePointAt(0);
        const start = off; off += g.length;
        if (/^\s+$/.test(g)) { arr.push({ sp: true }); continue; }
        if (c === 0x25CC) add('dotted-circle', n, { text: n.data });
        const font = resolve(list, g);
        if (font.startsWith('fallback')) add('no-font', n, { ch: g, cps: [...g].map(x => x.codePointAt(0).toString(16)), font });
        if (/[〮〯]/.test(g)) {
          // 방점 글자를 글꼴이 그리는 곳(수첩 등). 음절 뒤가 아니면 글꼴이 점선 동그라미(◌)와 함께 그린다.
          const base = g.replace(/[〮〯]/g, '');
          if (!base || !isHangul(base.codePointAt(0))) add('dotted-circle', n, { ch: g, ctx: n.data.slice(Math.max(0, start - 3), start + 4) });
          else add('tone-char', n, { ch: g, font });
        }
        if (isJamo(c) && [...g].length > 1 && !p.closest('rt')) {
          range.setStart(n, start); range.setEnd(n, off);
          const r = range.getBoundingClientRect();
          const fz = parseFloat(getComputedStyle(p).fontSize);
          if (r.width > fz * 1.25) add('not-composed', n, { ch: g, width: Math.round(r.width), fontSize: fz, font });
        } else if (isJamo(c) && c >= 0x1160 && c <= 0x11FF && g.length === 1) {
          add('lone-jamo', n, { ch: g, ctx: n.data.slice(Math.max(0, start - 3), start + 4) });
        }
        arr.push({ g, font, hangul: isHangul(c), hanja: isHanja(c), node: n, fz: parseFloat(getComputedStyle(p).fontSize), plain: !p.closest('rt, .nm-gloss, sup, sub, small, .nm-modern, .nm-arrow') });
      }
      if (/\[[ㄱ-ㆎᄀ-ᇿ]|\{[^}]*\|/.test(n.data)) add('raw-markup', n, { text: n.data });
      // 상자 밖으로 삐져나온 글자
      range.selectNodeContents(n);
      const tr = range.getBoundingClientRect();
      let box = p;
      if (p.closest('[class*="mark"], [class*="flag"], [class*="badge"]') || getComputedStyle(p).position === 'absolute') box = null; // 모서리 표지는 일부러 걸친다
      while (box && box.id !== 'ui-layer') {
        const cs = getComputedStyle(box);
        if ((cs.borderLeftStyle !== 'none' && parseFloat(cs.borderLeftWidth) > 0) || cs.overflowX !== 'visible' || box.tagName === 'BUTTON') break;
        box = box.parentElement;
      }
      if (box && box.id !== 'ui-layer') {
        const br = box.getBoundingClientRect();
        if (tr.width && (tr.left < br.left - 2 || tr.right > br.right + 2)) add('spill', n, { text: n.data.slice(0, 30), text_lr: [Math.round(tr.left), Math.round(tr.right)], box_lr: [Math.round(br.left), Math.round(br.right)], box: box.className });
      }
    }
    // 한 줄(블록) 안 글자 크기 들쭉날쭉: 같은 블록의 한글·한자 본문 글자 크기가 5% 넘게 다르면
    words.forEach((arr) => {
      const sz = [...new Set(arr.filter(x => !x.sp && x.plain && (x.hangul || x.hanja)).map(x => Math.round(x.fz * 10) / 10))];
      if (sz.length > 1 && Math.max(...sz) / Math.min(...sz) > 1.05) { const x = arr.find(y => !y.sp); add('size-jump', x.node, { sizes: sz, text: arr.filter(y => !y.sp).map(y => y.g).join('').slice(0, 40) }); }
    });
    // 한 낱말 안 글꼴 섞임
    words.forEach((arr) => {
      let w = [];
      const flush = () => {
        const hf = new Set(w.filter(x => x.hangul).map(x => x.font));
        if (hf.size > 1) add('mixed-font-word', w[0].node, { word: w.map(x => x.g).join(''), fonts: [...hf] });
        const hj = w.filter(x => x.hanja).map(x => x.font), hg = w.filter(x => x.hangul).map(x => x.font);
        if (hj.length && hg.length && hj.some(f => f !== 'NMYetExt' && hg.indexOf(f) < 0)) add('hanja-font-differs', w[0].node, { word: w.map(x => x.g).join(''), hanja: [...new Set(hj)], hangul: [...new Set(hg)] });
        w = [];
      };
      arr.forEach(x => { if (x.sp || !WORDCH.test(x.g)) flush(); else w.push(x); });
      flush();
    });
    // 방점 점: 제 음절 쪽에 붙어 있는가
    document.querySelectorAll('#ui-layer .nm-bj').forEach(dot => {
      if (!visible(dot)) return;
      const syl = dot.parentElement;
      const d = dot.getBoundingClientRect();
      const tn = [...syl.childNodes].map(c => c.nodeType === 3 ? c : c.firstChild).find(c => c && c.nodeType === 3);
      if (!tn) return;
      range.selectNodeContents(tn);
      const g = range.getBoundingClientRect();
      // 앞 글자
      let prevRect = null;
      const prevText = (() => {
        const tw = document.createTreeWalker(document.getElementById('ui-layer'), NodeFilter.SHOW_TEXT);
        tw.currentNode = syl; let pn = tw.previousNode();
        while (pn && !pn.data.trim()) pn = tw.previousNode();
        return pn;
      })();
      if (prevText && prevText.parentElement.closest('.nm-sr, rp, .ya-path') == null) {
        const len = prevText.data.replace(/\s+$/, '').length;
        if (len) {
          const units = NM.core.yet.splitSyllables(prevText.data.slice(0, len));
          const last = units[units.length - 1];
          range.setStart(prevText, len - last.length); range.setEnd(prevText, len);
          const pr = range.getBoundingClientRect();
          if (Math.abs(pr.top - g.top) < g.height / 2 && pr.right <= d.left + 1) prevRect = pr;
        }
      }
      const fz = parseFloat(getComputedStyle(syl).fontSize);
      // 글자 그림의 실제 먹 자리는 알 수 없으니, 글자 칸(advance) 사이 거리로 비교한다
      const gapOwn = g.left - d.right, gapPrev = prevRect ? d.left - prevRect.right : Infinity;
      if (gapPrev < gapOwn + 0.06 * fz) add('bangjeom-ambiguous', dot, { syl: tn.data, gapOwn: +gapOwn.toFixed(1), gapPrev: +gapPrev.toFixed(1), fontSize: fz });
      const midY = d.top + d.height / 2;
      if (midY < g.top + g.height * 0.2 || midY > g.bottom - g.height * 0.2) add('bangjeom-vertical', dot, { syl: tn.data, dotY: Math.round(midY - g.top), glyphH: Math.round(g.height) });
    });
    // 루비 읽기 겹침
    const rts = [...document.querySelectorAll('#ui-layer rt')].filter(visible).map(rt => ({ rt, r: rt.getBoundingClientRect() }));
    for (let i = 0; i + 1 < rts.length; i++) {
      const a = rts[i].r, b = rts[i + 1].r;
      if (Math.abs(a.top - b.top) < 2 && a.right > b.left + 1 && b.right > a.left) add('ruby-overlap', rts[i].rt, { a: rts[i].rt.textContent, b: rts[i + 1].rt.textContent });
    }
    // 잘린 상자
    document.querySelectorAll('#ui-layer *').forEach(e => {
      if (e.closest('.nm-sr')) return;
      const cs = getComputedStyle(e);
      // 화면 낭독기용으로만 남긴 요소(1px·clip 으로 숨김, 예: 좁은 화면의 기믹 칸 설명)는 잘림이 아니다
      if (/rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip) && e.clientWidth <= 1) return;
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') return;
      if (e.clientWidth && e.scrollWidth > e.clientWidth + 1 && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll') add('clipped-x', e, { cls: e.className, sw: e.scrollWidth, cw: e.clientWidth });
      if (e.clientHeight && e.scrollHeight > e.clientHeight + 1 && cs.overflowY === 'hidden') add('clipped-y', e, { cls: e.className, sh: e.scrollHeight, ch: e.clientHeight });
    });
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      const wide = [...document.querySelectorAll('#ui-layer *')].filter(e => !e.closest('.nm-sr') && e.getBoundingClientRect().right > window.innerWidth + 1 && visible(e));
      issues.push({ type: 'page-hscroll', where: 'page', sw: document.documentElement.scrollWidth, vw: window.innerWidth, wide: wide.slice(0, 5).map(e => where(e) + ' ' + e.tagName + '.' + e.className) });
    }
    (window.__nmErrors || []).forEach(e => issues.push({ type: 'nm-error', where: e.where, message: e.message }));
    return issues;
  }

  // ── 시작 ──
  loadAll().then(() => {
    document.documentElement.style.setProperty('--fs', FS);
    document.documentElement.setAttribute('data-nm-bangjeom', q.get('bj') === 'off' ? 'off' : 'on');
    if (q.get('bj') === 'off') NM.core.yet.setBangjeom(false);
    layer = document.getElementById('ui-layer');
    host = el('div', 'nm-overlay-host');
    layer.appendChild(host);
    return Promise.resolve(({ orig: secOrig, scenes: secScenes, data: secData, ui: secUi, gimmicks: secGimmicks })[SEC]()).then(() => document.fonts.ready);
  }).then(() => new Promise(r => setTimeout(r, 300))).then(() => document.fonts.ready).then(coverage).then(cov => {
    window.__audit = () => audit(cov);
    window.__auditReady = true;
  }).catch(e => { (window.__nmErrors = window.__nmErrors || []).push({ where: 'yet-audit', message: String(e && e.stack || e) }); window.__auditReady = true; window.__audit = () => [{ type: 'nm-error', where: 'yet-audit', message: String(e) }]; });
})();
