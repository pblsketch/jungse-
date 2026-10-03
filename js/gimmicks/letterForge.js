'use strict';
/*
 * 기믹 letterForge — 스테이지 2 「스물여덟 자」 소리 → 글자 변신 (spec §7 스테이지 2, plan G3).
 * 단계(config.steps 로 고른다, 한 과제에 하나 이상):
 *   shape  상형: 발음 기관 단면도(코드로 그린 SVG, 그림 안 글자 없음)를 보고 획 조각을 골라 기본자 ㄱ ㄴ ㅁ ㅅ ㅇ 만들기
 *   add    가획: ㄱ→ㅋ, ㄴ→ㄷ→ㅌ, ㅁ→ㅂ→ㅍ, ㅅ→ㅈ→ㅊ, ㅇ→ㆆ→ㅎ 빈 자리 채우기
 *   odd    다르게 만든 글자(ㆁ ㄹ ㅿ) 고르기 — 중학교(m)는 '이체' 용어 없이 날개 설명, 고등(h1·h23)은 '이체'
 *   samjae 모음 기본자 ㆍ ㅡ ㅣ 가 본뜬 것(하늘 · 땅 · 사람)
 *   vowel  합성: ㆍ ㅡ ㅣ 단추를 차례로 눌러 초출 ㅗ ㅏ ㅜ ㅓ, 재출 ㅛ ㅑ ㅠ ㅕ 만들기(천지인 자판과 같은 차례)
 * 획 긋기는 자유 그리기가 아니라 획 조각 고르기(누르기·Tab·Enter·Space)다. 판정은 구조 id(획 조각 id·글자 id·모양 id)로 한다.
 *
 * ■ 사실 표(아래 SHAPE·CHAINS·ODD·SAMJAE·VOWEL)가 정답을 정한다. 장면 작성자는 무엇을 낼지만 고른다.
 *   item.answer 는 answerFor(config) 와 같아야 한다(다르면 오류 모음에 알리고 판정은 사실 표를 따른다).
 * ■ config  { steps?: [...], shape?: { letters?, orig? }, add?: { chains?, extra?, orig? }, odd?: { pool?, orig? },
 *             samjae?: { orig? }, vowel?: { targets?, orig? } }   (orig: 단계 위에 보일 原文 블록 id 목록)
 *   answer  { shape?: { <기본자 id>: [획 id…] }, add?: { '<줄>.<자리>': <글자 id> }, odd?: [글자 id…],
 *             samjae?: { araea|eu|i: 'sky'|'earth'|'person' }, vowel?: { <모음 id>: '<eu|i>-<up|down|left|right>-<1|2>' } }
 *   틀린 부분 id: 'shape.g' · 'add.n.2' · 'odd.r' · 'samjae.eu' · 'vowel.vya'. hints[1] 은 이 id 나 단계 id(또는 배열).
 * 화면 글자는 js/data/text-g-letterForge.js. 그림은 js/gimmicks/letterForge-svg.js.
 * 필요: core/ns.js, ui/stage-gimmick.js, ui/marker.js(原文 카드), gimmicks/letterForge-svg.js, data/text-g-letterForge.js
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'letterForge';
  const STEPS = ['shape', 'add', 'odd', 'samjae', 'vowel'];
  const BASES = ['g', 'n', 'm', 's', 'o'];
  const SHAPE = { g: ['right', 'top'], n: ['bottom', 'left'], m: ['bottom', 'left', 'right', 'top'], s: ['slashL', 'slashR'], o: ['ring'] };
  const CHAINS = { g: ['g', 'k'], n: ['n', 'd', 't'], m: ['m', 'b', 'p'], s: ['s', 'j', 'ch'], o: ['o', 'q', 'h'] };
  const CONSONANTS = ['g', 'k', 'n', 'd', 't', 'm', 'b', 'p', 's', 'j', 'ch', 'o', 'q', 'h', 'ng', 'r', 'z'];
  const ODD = ['ng', 'r', 'z'];
  const ODD_POOL = ['k', 'd', 'ng', 't', 'b', 'r', 'p', 'j', 'z', 'ch', 'q', 'h'];
  const SAMJAE = { araea: 'sky', eu: 'earth', i: 'person' };
  const THINGS = ['sky', 'earth', 'person'];
  const VOWEL = { vo: 'eu-up-1', va: 'i-right-1', vu: 'eu-down-1', veo: 'i-left-1', vyo: 'eu-up-2', vya: 'i-right-2', vyu: 'eu-down-2', vyeo: 'i-left-2' };
  const FIRST = ['vo', 'va', 'vu', 'veo'];
  const KEYS = ['araea', 'eu', 'i'];
  const PIECE_IDS = ['top', 'bottom', 'left', 'right', 'slashL', 'slashR', 'ring'];

  /* ---------- 문구 ---------- */
  function lookup(key) {
    const T = NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME];
    if (!T) return undefined;
    return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T);
  }
  function tx(key, vars) {
    const v = lookup(key);
    if (typeof v !== 'string') { NM.reportError('g.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return vars ? v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : v;
  }
  const glyph = (id) => tx('glyphs.' + id);

  /* ---------- 순수 부분 ---------- */
  const obj = (x) => (x && typeof x === 'object' ? x : {});
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  function norm(config) {
    const c = obj(config);
    const errors = [];
    const pick = (arr, allowed, def, what) => {
      if (!Array.isArray(arr)) return def.slice();
      return uniq(arr.filter(x => { if (allowed.indexOf(x) >= 0) return true; errors.push('unknown ' + what + ': ' + x); return false; }));
    };
    const steps = pick(c.steps, STEPS, STEPS, 'step');
    if (!steps.length) errors.push('no steps');
    const chainGlyphs = [].concat.apply([], BASES.map(b => CHAINS[b]));
    const orig = {};
    STEPS.forEach(s => { orig[s] = Array.isArray(obj(c[s]).orig) ? obj(c[s]).orig.filter(x => typeof x === 'string') : []; });
    return {
      steps,
      letters: pick(obj(c.shape).letters, BASES, BASES, 'letter'),
      chains: pick(obj(c.add).chains, BASES, BASES, 'chain'),
      extra: pick(obj(c.add).extra, CONSONANTS.filter(x => chainGlyphs.indexOf(x) < 0), [], 'extra glyph'),
      pool: pick(obj(c.odd).pool, CONSONANTS, ODD_POOL, 'odd glyph'),
      targets: pick(obj(c.vowel).targets, Object.keys(VOWEL), Object.keys(VOWEL), 'vowel'),
      orig, errors
    };
  }
  function answerFor(config) {
    const n = norm(config);
    const a = {};
    if (n.steps.indexOf('shape') >= 0) { a.shape = {}; n.letters.forEach(L => { a.shape[L] = SHAPE[L].slice(); }); }
    if (n.steps.indexOf('add') >= 0) { a.add = {}; n.chains.forEach(C => CHAINS[C].slice(1).forEach((gid, k) => { a.add[C + '.' + (k + 1)] = gid; })); }
    if (n.steps.indexOf('odd') >= 0) a.odd = n.pool.filter(id => ODD.indexOf(id) >= 0);
    if (n.steps.indexOf('samjae') >= 0) a.samjae = Object.assign({}, SAMJAE);
    if (n.steps.indexOf('vowel') >= 0) { a.vowel = {}; n.targets.forEach(t => { a.vowel[t] = VOWEL[t]; }); }
    return a;
  }
  // ㆍ ㅡ ㅣ 누른 차례 → 모양 id('eu-up-1' 등). 비었으면 '', 모음이 안 되면 'invalid'
  function parseSeq(seq) {
    const s = Array.isArray(seq) ? seq : [];
    if (!s.length) return '';
    const bases = s.map((k, i) => (k === 'araea' ? -1 : i)).filter(i => i >= 0);
    if (bases.length !== 1 || s.some(k => KEYS.indexOf(k) < 0)) return 'invalid';
    const bi = bases[0], before = bi, after = s.length - bi - 1;
    if ((before && after) || before + after < 1 || before + after > 2) return 'invalid';
    const base = s[bi];
    const side = base === 'eu' ? (before ? 'up' : 'down') : (before ? 'left' : 'right');
    return base + '-' + side + '-' + (before + after);
  }
  function seqFor(shapeId) {
    const m = /^(eu|i)-(up|down|left|right)-([12])$/.exec(shapeId || '');
    if (!m) return [];
    const dots = m[3] === '2' ? ['araea', 'araea'] : ['araea'];
    return (m[2] === 'up' || m[2] === 'left') ? dots.concat([m[1]]) : [m[1]].concat(dots);
  }
  function structOf(seq) {
    const s = Array.isArray(seq) ? seq : [];
    const bi = s.findIndex(k => k !== 'araea');
    if (bi < 0) return { base: null, before: s.length, after: 0 };
    return { base: s[bi], before: s.slice(0, bi).filter(k => k === 'araea').length, after: s.slice(bi + 1).filter(k => k === 'araea').length };
  }
  const setEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && uniq(a).length === a.length && a.every(x => b.indexOf(x) >= 0);
  function check(answer, item) {
    const n = norm(item && item.config);
    const want = answerFor(item && item.config);
    const got = obj(answer);
    const wrong = [];
    if (want.shape) n.letters.forEach(L => { if (!setEq(obj(got.shape)[L], want.shape[L])) wrong.push('shape.' + L); });
    if (want.add) Object.keys(want.add).forEach(k => { if (obj(got.add)[k] !== want.add[k]) wrong.push('add.' + k); });
    if (want.odd) n.pool.forEach(id => { const w = want.odd.indexOf(id) >= 0, g = Array.isArray(got.odd) && got.odd.indexOf(id) >= 0; if (w !== g) wrong.push('odd.' + id); });
    if (want.samjae) KEYS.forEach(k => { if (obj(got.samjae)[k] !== want.samjae[k]) wrong.push('samjae.' + k); });
    if (want.vowel) n.targets.forEach(t => { if (obj(got.vowel)[t] !== want.vowel[t]) wrong.push('vowel.' + t); });
    return wrong.length ? { correct: false, wrong } : true;
  }

  /* ---------- 화면 ---------- */
  function mount(host, o) {
    const doc = o.document || root.document;
    const ART = NM.gimmicks.art && NM.gimmicks.art.letterForge;
    const item = o.item || {};
    const N = norm(o.config);
    N.errors.forEach(e => NM.reportError('g.' + NAME + '.config', e + ' (' + (item.id || '?') + ')'));
    const want = answerFor(o.config);
    if (item.answer !== undefined && check(item.answer, { config: o.config }) !== true) {
      NM.reportError('g.' + NAME + '.answer', 'item.answer differs from the fact table (answerFor): ' + item.id);
    }
    const LV = o.level === 'm' ? 'm' : 'h';
    const has = (s) => N.steps.indexOf(s) >= 0;
    const S = { shape: {}, wrongPieces: {}, add: {}, addSel: null, odd: [], samjae: {}, vowel: {} };
    N.letters.forEach(L => { S.shape[L] = []; });
    N.targets.forEach(t => { S.vowel[t] = []; });
    let locked = false, wrongCalled = false, lastWrong = [];
    const parts = {};   // 부분 id → { el, flag, sr, marks }
    const stepEls = {};
    const ui = { pieces: {}, boards: {}, boardSr: {}, slots: {}, tray: {}, oddTiles: {}, things: {}, keys: {}, previews: {}, made: {}, tags: {} };

    function el(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function btn(cls, text) { const b = el('button', cls, text); b.type = 'button'; return b; }
    function flagOf(parent) { const f = el('span', 'nm-glf-flag'); f.setAttribute('aria-hidden', 'true'); parent.appendChild(f); return f; }
    function part(id, node) {
      node.setAttribute('data-part', id);
      const sr = el('span', 'nm-sr nm-glf-marksr');
      node.appendChild(sr);
      parts[id] = { el: node, flag: flagOf(node), sr, marks: {} };
      return node;
    }

    const box = el('div', 'nm-glf');
    box.setAttribute('data-state', 'open');
    box.setAttribute('data-level', LV);

    function stepSection(step) {
      const sec = el('section', 'nm-glf-step');
      sec.setAttribute('data-step', step);
      sec.appendChild(el('h4', 'nm-glf-title', tx('steps.' + step + '.' + LV + '.title')));
      sec.appendChild(el('p', 'nm-glf-lead', tx('steps.' + step + '.' + LV + '.lead')));
      N.orig[step].forEach(id => { const c = NM.ui.marker && NM.ui.marker.orig(id, { document: doc }); if (c) sec.appendChild(c); });
      stepEls[step] = sec;
      box.appendChild(sec);
      return sec;
    }
    function wing(sec, key) {
      const a = el('aside', 'nm-glf-wing');
      a.appendChild(el('span', 'nm-glf-winglabel', tx('wingLabel')));
      const p = el('p', 'nm-glf-wingtext', tx(key));
      a.appendChild(p);
      sec.appendChild(a);
      return p;
    }

    /* 상형 */
    if (has('shape')) {
      const sec = stepSection('shape');
      N.letters.forEach(L => {
        const row = part('shape.' + L, el('div', 'nm-glf-row nm-glf-shape'));
        const fig = el('figure', 'nm-glf-fig');
        if (ART) fig.appendChild(ART.head(doc, L));
        const cap = el('figcaption', 'nm-glf-cap');
        cap.appendChild(el('strong', 'nm-glf-sound', tx('sounds.' + L + '.name')));
        cap.appendChild(el('span', 'nm-glf-soundshape', tx('sounds.' + L + '.shape')));
        fig.appendChild(cap);
        row.appendChild(fig);
        const build = el('div', 'nm-glf-build');
        const bw = el('div', 'nm-glf-boardwrap');
        if (ART) { ui.boards[L] = ART.board(doc); bw.appendChild(ui.boards[L].el); }
        ui.boardSr[L] = el('p', 'nm-sr', '');
        bw.appendChild(ui.boardSr[L]);
        build.appendChild(bw);
        const pal = el('div', 'nm-glf-palette');
        pal.setAttribute('role', 'group');
        pal.setAttribute('aria-label', tx('paletteAria', { name: tx('sounds.' + L + '.name') }));
        ui.pieces[L] = {};
        PIECE_IDS.forEach(pid => {
          const b = btn('nm-glf-piece');
          b.setAttribute('data-piece', pid);
          b.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-label', tx('pieces.' + pid));
          if (ART) b.appendChild(ART.pieceIcon(doc, pid));
          const pf = el('span', 'nm-glf-pflag');
          pf.setAttribute('aria-hidden', 'true');
          b.appendChild(pf);
          b.addEventListener('click', () => {
            if (locked) return;
            const a = S.shape[L], i = a.indexOf(pid);
            if (i >= 0) a.splice(i, 1); else a.push(pid);
            S.wrongPieces[L] = [];
            clearMarks('shape.' + L);
            refresh();
          });
          ui.pieces[L][pid] = b;
          pal.appendChild(b);
        });
        build.appendChild(pal);
        row.appendChild(build);
        sec.appendChild(row);
      });
    }

    /* 가획 */
    if (has('add')) {
      const sec = stepSection('add');
      const wrap = el('div', 'nm-glf-chains');
      N.chains.forEach(C => {
        const row = part('add.' + C, el('div', 'nm-glf-chain'));
        const base = el('span', 'nm-glf-gtile is-base nm-yet', glyph(C));
        row.appendChild(base);
        CHAINS[C].slice(1).forEach((x, k) => {
          const plus = el('span', 'nm-glf-plus', '+');
          plus.setAttribute('aria-hidden', 'true');
          row.appendChild(plus);
          const slotId = C + '.' + (k + 1);
          const b = btn('nm-glf-slot nm-yet');
          b.setAttribute('data-slot', slotId);
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', () => { if (locked) return; S.addSel = S.addSel === slotId ? null : slotId; refresh(); });
          b.addEventListener('keydown', (e) => {
            if (locked || (e.key !== 'Backspace' && e.key !== 'Delete')) return;
            e.preventDefault();
            delete S.add[slotId];
            clearMarks('add.' + slotId);
            S.addSel = slotId;
            refresh();
          });
          const slotWrap = part('add.' + slotId, el('span', 'nm-glf-slotwrap'));
          slotWrap.insertBefore(b, slotWrap.firstChild);
          ui.slots[slotId] = b;
          row.appendChild(slotWrap);
        });
        wrap.appendChild(row);
      });
      sec.appendChild(wrap);
      const tray = el('div', 'nm-glf-tray');
      tray.setAttribute('role', 'group');
      tray.setAttribute('aria-label', tx('trayAria'));
      const pool = uniq([].concat.apply([], N.chains.map(C => CHAINS[C].slice(1))).concat(N.extra)).sort();
      pool.forEach(gid => {
        const b = btn('nm-glf-gtile nm-glf-traytile nm-yet', glyph(gid));
        b.setAttribute('data-glyph', gid);
        b.setAttribute('aria-label', tx('tileAria', { glyph: glyph(gid) }));
        b.addEventListener('click', () => placeGlyph(gid));
        ui.tray[gid] = b;
        tray.appendChild(b);
      });
      sec.appendChild(tray);
    }
    function slotOrder() { return Object.keys(ui.slots); }
    function placeGlyph(gid) {
      if (locked) return;
      const order = slotOrder();
      const target = S.addSel || order.filter(s => !S.add[s])[0];
      if (!target) return;
      Object.keys(S.add).forEach(s => { if (S.add[s] === gid) delete S.add[s]; });
      S.add[target] = gid;
      clearMarks('add.' + target);
      const i = order.indexOf(target);
      S.addSel = order.slice(i + 1).concat(order.slice(0, i)).filter(s => !S.add[s])[0] || null;
      refresh();
      if (S.addSel) ui.slots[S.addSel].focus();
    }

    /* 다르게 만든 글자 */
    let oddWing = null, oddAfter = null, oddMissing = null;
    if (has('odd')) {
      const sec = stepSection('odd');
      if (LV === 'm') oddWing = wing(sec, 'steps.odd.m.wing');
      const pool = el('div', 'nm-glf-oddpool');
      N.pool.forEach(id => {
        const b = btn('nm-glf-gtile nm-glf-otile nm-yet', glyph(id));
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', tx('tileAria', { glyph: glyph(id) }));
        b.addEventListener('click', () => {
          if (locked) return;
          const i = S.odd.indexOf(id);
          if (i >= 0) S.odd.splice(i, 1); else S.odd.push(id);
          clearMarks('odd.' + id);
          oddMissing.hidden = true;
          sec.classList.remove('is-missing');
          refresh();
        });
        const w = part('odd.' + id, el('span', 'nm-glf-owrap'));
        w.insertBefore(b, w.firstChild);
        ui.oddTiles[id] = b;
        pool.appendChild(w);
      });
      sec.appendChild(pool);
      oddMissing = el('p', 'nm-glf-missing', '△ ' + tx('missing'));
      oddMissing.hidden = true;
      sec.appendChild(oddMissing);
      if (LV === 'h') { oddAfter = el('p', 'nm-glf-after', tx('steps.odd.h.after')); oddAfter.hidden = true; sec.appendChild(oddAfter); }
    }

    /* 하늘 · 땅 · 사람 */
    if (has('samjae')) {
      const sec = stepSection('samjae');
      KEYS.forEach(k => {
        const row = part('samjae.' + k, el('div', 'nm-glf-srow'));
        row.appendChild(el('span', 'nm-glf-gtile is-base nm-yet', glyph(k)));
        const grp = el('div', 'nm-glf-things');
        grp.setAttribute('role', 'radiogroup');
        grp.setAttribute('aria-label', tx('samjaeAria', { glyph: glyph(k) }));
        ui.things[k] = {};
        THINGS.forEach(th => {
          const b = btn('nm-glf-thingbtn');
          b.setAttribute('role', 'radio');
          b.setAttribute('aria-checked', 'false');
          b.setAttribute('data-thing', th);
          if (ART) b.appendChild(ART.thing(doc, th));
          b.appendChild(el('span', 'nm-glf-thinglabel', tx('things.' + th)));
          b.addEventListener('click', () => { if (locked) return; S.samjae[k] = th; clearMarks('samjae.' + k); refresh(); });
          ui.things[k][th] = b;
          grp.appendChild(b);
        });
        row.appendChild(grp);
        sec.appendChild(row);
      });
    }

    /* 합성 */
    if (has('vowel')) {
      const sec = stepSection('vowel');
      if (LV === 'm') wing(sec, 'steps.vowel.m.wing');
      N.targets.forEach(t => {
        const row = part('vowel.' + t, el('div', 'nm-glf-vrow'));
        row.appendChild(el('span', 'nm-glf-gtile is-base is-target nm-yet', glyph(t)));
        const pv = el('div', 'nm-glf-preview');
        ui.previews[t] = pv;
        row.appendChild(pv);
        const keys = el('div', 'nm-glf-keys');
        keys.setAttribute('role', 'group');
        keys.setAttribute('aria-label', tx('keysAria', { glyph: glyph(t) }));
        ui.keys[t] = {};
        KEYS.forEach(k => {
          const b = btn('nm-glf-key nm-yet', glyph(k));
          b.setAttribute('data-key', k);
          b.setAttribute('aria-label', tx('keyAria', { glyph: glyph(k) }));
          b.addEventListener('click', () => { if (locked || S.vowel[t].length >= 3) return; S.vowel[t].push(k); clearMarks('vowel.' + t); refresh(); });
          ui.keys[t][k] = b;
          keys.appendChild(b);
        });
        const back = btn('nm-glf-key nm-glf-back', tx('keyBack'));
        back.setAttribute('data-key', 'back');
        back.addEventListener('click', () => { if (locked) return; S.vowel[t].pop(); clearMarks('vowel.' + t); refresh(); });
        ui.keys[t].back = back;
        keys.appendChild(back);
        row.appendChild(keys);
        ui.made[t] = el('p', 'nm-sr nm-glf-made', '');
        ui.made[t].setAttribute('aria-live', 'polite');
        row.appendChild(ui.made[t]);
        if (LV === 'h') { const tag = el('span', 'nm-glf-tag', tx('steps.vowel.h.' + (FIRST.indexOf(t) >= 0 ? 'first' : 'second'))); tag.hidden = true; ui.tags[t] = tag; row.appendChild(tag); }
        sec.appendChild(row);
      });
    }

    const foot = el('div', 'nm-glf-foot');
    const left = el('span', 'nm-glf-left');
    left.setAttribute('aria-live', 'polite');
    foot.appendChild(left);
    const submit = btn('nm-st-btn nm-st-primary nm-glf-submit', tx('submit'));
    submit.addEventListener('click', doSubmit);
    foot.appendChild(submit);
    box.appendChild(foot);
    host.appendChild(box);

    const pages = N.steps.flatMap(step => {
      const ids = step === 'shape' ? N.letters : step === 'samjae' ? KEYS : step === 'vowel' ? N.targets : [null];
      return ids.map(id => ({ step, id: id ? step + '.' + id : step, key: id }));
    });
    let pageIndex = 0;
    const nav = el('div', 'nm-glf-nav');
    const previous = btn('nm-st-btn', tx('previous'));
    const pageLabel = el('span', 'nm-glf-page');
    pageLabel.setAttribute('aria-live', 'polite');
    const next = btn('nm-st-btn', tx('next'));
    const practiceNote = el('p', 'nm-glf-practice');
    practiceNote.setAttribute('aria-live', 'polite');
    nav.append(previous, pageLabel, next);
    nav.hidden = !(o.config && o.config.paged);
    box.insertBefore(nav, box.firstChild);
    box.insertBefore(practiceNote, foot);
    const pageWrong = p => {
      const result = check(buildAnswer(), item);
      return result === true ? [] : result.wrong.filter(id => id === p.id || id.indexOf(p.id + '.') === 0);
    };
    function showPage(index) {
      if (!(o.config && o.config.paged)) { previous.disabled = next.disabled = locked; return; }
      pageIndex = Math.max(0, Math.min(pages.length - 1, index));
      const p = pages[pageIndex];
      Object.keys(stepEls).forEach(step => { stepEls[step].hidden = step !== p.step; });
      Object.keys(parts).forEach(id => {
        if (id.indexOf('shape.') === 0 || id.indexOf('samjae.') === 0 || id.indexOf('vowel.') === 0) parts[id].el.hidden = id !== p.id;
      });
      previous.disabled = pageIndex === 0;
      next.hidden = pageIndex === pages.length - 1;
      const selected = p.step === 'shape' ? S.shape[p.key].length > 0 : p.step === 'samjae' ? !!S.samjae[p.key] : p.step === 'vowel' ? S.vowel[p.key].length > 0 : p.step === 'add' ? Object.keys(want.add || {}).every(k => S.add[k]) : S.odd.length > 0;
      next.disabled = !locked && !selected;
      submit.hidden = pageIndex !== pages.length - 1;
      pageLabel.textContent = tx('page', { n: pageIndex + 1, total: pages.length });
    }
    previous.addEventListener('click', () => { showPage(pageIndex - 1); const body = box.closest('.nm-st-body'); if (body) body.scrollTop = 0; });
    next.addEventListener('click', () => {
      const wrong = locked ? [] : pageWrong(pages[pageIndex]);
      wrong.forEach(id => setMark(id, 'wrong', true));
      if (wrong.length) { practiceNote.textContent = tx('practiceWrong'); return; }
      practiceNote.textContent = '';
      showPage(pageIndex + 1);
      const body = box.closest('.nm-st-body'); if (body) body.scrollTop = 0;
    });

    /* ---------- 표시 ---------- */
    function sym(m) { return m === 'wrong' ? '×' : m === 'hint' ? '△' : m === 'answer' ? '○' : ''; }
    function setMark(id, key, on) {
      const p = parts[id];
      if (!p) return;
      p.marks[key] = !!on;
      if (key === 'answer' && on) { p.marks.wrong = false; p.marks.hint = false; }
      ['wrong', 'hint', 'answer'].forEach(k => p.el.classList.toggle('is-' + k, !!p.marks[k]));
      const m = p.marks.answer ? 'answer' : p.marks.wrong ? 'wrong' : p.marks.hint ? 'hint' : '';
      if (m) p.el.setAttribute('data-mark', m); else p.el.removeAttribute('data-mark');
      p.flag.textContent = sym(m);
      p.sr.textContent = m ? tx('mark.' + m) : '';
    }
    function clearMarks(id) { setMark(id, 'wrong', false); setMark(id, 'hint', false); }

    function incomplete() {
      let n = 0;
      if (has('shape')) n += N.letters.filter(L => !S.shape[L].length).length;
      if (has('add')) n += slotOrder().filter(s => !S.add[s]).length;
      if (has('odd') && want.odd.length && !S.odd.length) n += 1;
      if (has('samjae')) n += KEYS.filter(k => !S.samjae[k]).length;
      if (has('vowel')) n += N.targets.filter(t => !S.vowel[t].length).length;
      return n;
    }
    function refresh() {
      if (has('shape')) N.letters.forEach(L => {
        const sel = S.shape[L], wp = S.wrongPieces[L] || [];
        Object.keys(ui.pieces[L]).forEach(pid => {
          const b = ui.pieces[L][pid];
          b.setAttribute('aria-pressed', String(sel.indexOf(pid) >= 0));
          b.classList.toggle('is-selected', sel.indexOf(pid) >= 0);
          b.classList.toggle('is-wrong', wp.indexOf(pid) >= 0);
          b.querySelector('.nm-glf-pflag').textContent = wp.indexOf(pid) >= 0 ? '×' : '';
          b.disabled = locked;
        });
        if (ui.boards[L]) ui.boards[L].set(sel, wp);
        ui.boardSr[L].textContent = sel.length ? tx('boardAria', { list: sel.map(p => tx('pieces.' + p)).join(', ') }) : tx('boardEmpty');
      });
      if (has('add')) {
        Object.keys(ui.slots).forEach(s => {
          const b = ui.slots[s];
          b.textContent = S.add[s] ? glyph(S.add[s]) : '';
          b.setAttribute('aria-label', tx('slotAria', { base: glyph(s.split('.')[0]), k: s.split('.')[1] }) + ', ' + (S.add[s] ? glyph(S.add[s]) : tx('slotEmpty')));
          b.setAttribute('aria-pressed', String(S.addSel === s));
          b.classList.toggle('is-selected', S.addSel === s);
          b.classList.toggle('is-empty', !S.add[s]);
          b.disabled = locked;
        });
        const used = Object.keys(S.add).map(s => S.add[s]);
        Object.keys(ui.tray).forEach(g => { ui.tray[g].classList.toggle('is-used', used.indexOf(g) >= 0); ui.tray[g].disabled = locked; });
      }
      if (has('odd')) Object.keys(ui.oddTiles).forEach(id => {
        const b = ui.oddTiles[id];
        b.setAttribute('aria-pressed', String(S.odd.indexOf(id) >= 0));
        b.classList.toggle('is-selected', S.odd.indexOf(id) >= 0);
        b.disabled = locked;
      });
      if (has('samjae')) KEYS.forEach(k => THINGS.forEach(th => {
        const b = ui.things[k][th];
        b.setAttribute('aria-checked', String(S.samjae[k] === th));
        b.classList.toggle('is-selected', S.samjae[k] === th);
        b.disabled = locked;
      }));
      if (has('vowel')) N.targets.forEach(t => {
        const seq = S.vowel[t];
        const pv = ui.previews[t];
        while (pv.firstChild) pv.removeChild(pv.firstChild);
        if (ART) pv.appendChild(ART.vowel(doc, structOf(seq)));
        pv.setAttribute('data-shape', parseSeq(seq));
        ui.made[t].textContent = seq.length ? tx('made', { seq: seq.map(glyph).join(' ') }) : tx('madeEmpty');
        KEYS.forEach(k => { ui.keys[t][k].disabled = locked || seq.length >= 3; });
        ui.keys[t].back.disabled = locked || !seq.length;
      });
      const n = incomplete();
      left.textContent = n && !locked ? tx('left', { n }) : '';
      submit.disabled = locked || n > 0;
      showPage(pageIndex);
    }

    function buildAnswer() {
      const a = {};
      if (has('shape')) { a.shape = {}; N.letters.forEach(L => { a.shape[L] = S.shape[L].slice().sort(); }); }
      if (has('add')) a.add = Object.assign({}, S.add);
      if (has('odd')) a.odd = N.pool.filter(id => S.odd.indexOf(id) >= 0);
      if (has('samjae')) a.samjae = Object.assign({}, S.samjae);
      if (has('vowel')) { a.vowel = {}; N.targets.forEach(t => { a.vowel[t] = parseSeq(S.vowel[t]); }); }
      return a;
    }
    function doSubmit() {
      if (locked || incomplete()) return;
      const answer = buildAnswer();
      wrongCalled = false;
      o.onSubmit(answer);
      if (!wrongCalled && check(answer, item) === true) finish('done');
    }
    function finish(st) {
      locked = true;
      S.addSel = null;
      box.setAttribute('data-state', st);
      if (oddWing) oddWing.textContent = tx('steps.odd.m.wingAfter');
      if (oddAfter) oddAfter.hidden = false;
      Object.keys(ui.tags).forEach(t => { ui.tags[t].hidden = false; });
      refresh();
    }

    refresh();
    if (o.readOnly) { locked = true; box.setAttribute('data-state', 'locked'); refresh(); }

    return {
      showWrong(info) {
        wrongCalled = true;
        const w = info && Array.isArray(info.wrong) ? info.wrong : [];
        Object.keys(parts).forEach(id => {
          let on = w.indexOf(id) >= 0;
          if (on && id.indexOf('odd.') === 0 && S.odd.indexOf(id.slice(4)) < 0) on = false;   // 빠뜨린 글자는 드러내지 않는다
          setMark(id, 'wrong', on);
        });
        if (has('shape')) N.letters.forEach(L => {
          S.wrongPieces[L] = w.indexOf('shape.' + L) >= 0 ? S.shape[L].filter(p => SHAPE[L].indexOf(p) < 0) : [];
        });
        if (has('odd')) {
          const missing = w.some(id => id.indexOf('odd.') === 0 && S.odd.indexOf(id.slice(4)) < 0);
          oddMissing.hidden = !missing;
          stepEls.odd.classList.toggle('is-missing', missing);
        }
        lastWrong = w.slice();
        const index = pages.findIndex(p => w.some(id => id === p.id || id.indexOf(p.id + '.') === 0));
        if (index >= 0) showPage(index);
        refresh();
      },
      showHint(step, target) {
        if (step < 2) return;
        const tl = o.config && o.config.paged && !lastWrong.length ? [pages[pageIndex].id] : target == null ? lastWrong : (Array.isArray(target) ? target : [target]);
        tl.forEach(tk => {
          if (stepEls[tk]) { stepEls[tk].classList.add('is-hint'); stepEls[tk].setAttribute('data-mark', 'hint'); }
          else setMark(tk, 'hint', true);
        });
      },
      showAnswer() {
        if (want.shape) N.letters.forEach(L => { S.shape[L] = want.shape[L].slice(); S.wrongPieces[L] = []; setMark('shape.' + L, 'answer', true); });
        if (want.add) { S.add = Object.assign({}, want.add); Object.keys(want.add).forEach(s => setMark('add.' + s, 'answer', true)); }
        if (want.odd) { S.odd = want.odd.slice(); want.odd.forEach(id => setMark('odd.' + id, 'answer', true)); N.pool.forEach(id => { if (want.odd.indexOf(id) < 0) clearMarks('odd.' + id); }); if (oddMissing) oddMissing.hidden = true; }
        if (want.samjae) { S.samjae = Object.assign({}, want.samjae); KEYS.forEach(k => setMark('samjae.' + k, 'answer', true)); }
        if (want.vowel) N.targets.forEach(t => { S.vowel[t] = seqFor(want.vowel[t]); setMark('vowel.' + t, 'answer', true); });
        Object.keys(stepEls).forEach(s => { stepEls[s].classList.remove('is-hint', 'is-missing'); stepEls[s].removeAttribute('data-mark'); });
        finish(o.readOnly ? 'done' : 'answer');
        showPage(pages.length - 1);
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  const def = { mount, check };
  NM.gimmicks.register(NAME, def);
  def.facts = { PIECE_IDS, STEPS, BASES, SHAPE, CHAINS, ODD, ODD_POOL, SAMJAE, VOWEL, FIRST, norm, answerFor, parseSeq, seqFor, structOf };
})(typeof window !== 'undefined' ? window : globalThis);
