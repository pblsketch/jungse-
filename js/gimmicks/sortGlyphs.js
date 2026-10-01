'use strict';
/*
 * 기믹 sortGlyphs — 서장 「흩어진 글자」 (spec §7 서장, plan G1).
 * 흩어진 글자를 '아는 글자' / '모르는 글자(스물여덟 자 안 · 스물여덟 자 밖)' 칸으로 가른다 → 옛글자 도감이 열린다.
 * 핵심: 28자 가운데 사라진 4자(ㆍ ㅿ ㆆ ㆁ)와 28자에 들지 않는 ㅸ 을 구별한다. 학교급 차이 없음.
 *
 * ■ 판정은 글자 id 로 한다. 어느 칸이 맞는지는 아래 사실 표가 정한다(장면 작성자가 정하지 않는다):
 *     LOST(사라진 4자) = ng(ㆁ) z(ㅿ) q(ㆆ) araea(ㆍ) → 'lost'
 *     OUTSIDE(28자 밖)  = bv(ㅸ, 연서로 만든 글자)    → 'outside'
 *     그 밖의 28자 글자(오늘날에도 씀)                 → 'known'
 *   보이는 글자는 js/data/text-g-sortGlyphs.js 의 glyphs 표(코드에 한글을 두지 않는다).
 * ■ config  { glyphs?: [글자 id…] }   흩을 글자(없으면 DEFAULT). 글자 id 는 text-g-sortGlyphs.js glyphs 의 열쇠.
 *   answer  { <글자 id>: 'known'|'lost'|'outside' }   — answerFor(config) 와 같아야 한다(다르면 오류 모음에 알린다).
 *   hints[1] 강조 대상: 칸 id('known'|'lost'|'outside') 또는 글자 id, 또는 그 배열. 없으면 마지막에 틀린 글자.
 * ■ 끝나면(맞음·도움으로 끝·이미 끝난 과제 다시 열기) 도감 결과판을 보이고
 *   document 에 'nm:dogam-open' 사건(detail { gimmick, item, glyphs:[글자], keys:[NM.data.DOGAM 열쇠], byHelp, reopened })을 보내며(byHelp: 맞음 false · 도움 true · 다시 열기 null),
 *   기믹 뿌리 요소에 data-dogam="open" 을 단다(장면·수첩이 쓸 수 있는 표지). 도감 화면 자체는 수첩(U1) 몫이다.
 *   도감 설명은 NM.data.DOGAM 에서 같은 글자(glyph)를 찾아 쓴다. 없으면 칸 설명만 보인다.
 * ■ 조작: 글자 단추를 눌러 고르고(Enter·Space), 칸의 '여기에 놓기' 단추로 놓는다. 끌어 놓기는 쓰지 않는다.
 * 필요: core/ns.js, ui/stage-gimmick.js, data/text-g-sortGlyphs.js (도감 설명은 data DOGAM 이 있으면)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'sortGlyphs';
  const ALL = ['g', 'k', 'ng', 'd', 't', 'n', 'b', 'p', 'm', 'j', 'ch', 's', 'q', 'h', 'o', 'r', 'z',
    'araea', 'eu', 'i', 'vo', 'va', 'vu', 'veo', 'vyo', 'vya', 'vyu', 'vyeo', 'bv'];
  const LOST = ['ng', 'z', 'q', 'araea'];
  const OUTSIDE = ['bv'];
  const BINS = ['known', 'lost', 'outside'];
  const DEFAULT = ['g', 'va', 'z', 'n', 'eu', 'q', 'm', 'bv', 'vo', 'araea', 's', 'ng', 'o'];

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
  const glyphChar = (id) => tx('glyphs.' + id);

  /* ---------- 순수 부분 ---------- */
  function category(id) {
    if (OUTSIDE.indexOf(id) >= 0) return 'outside';
    if (LOST.indexOf(id) >= 0) return 'lost';
    return ALL.indexOf(id) >= 0 ? 'known' : null;
  }
  function glyphsOf(config) {
    const c = config && typeof config === 'object' ? config : {};
    if (!Array.isArray(c.glyphs)) return DEFAULT.slice();
    const out = [];
    c.glyphs.forEach(id => {
      if (ALL.indexOf(id) < 0) { NM.reportError('g.' + NAME + '.config', 'unknown glyph id: ' + id); return; }
      if (out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }
  function answerFor(config) {
    const a = {};
    glyphsOf(config).forEach(id => { a[id] = category(id); });
    return a;
  }
  function check(answer, item) {
    const want = answerFor(item && item.config);
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = Object.keys(want).filter(id => got[id] !== want[id]);
    return wrong.length ? { correct: false, wrong } : true;
  }
  function sameAnswer(a, b) {
    if (!a || typeof a !== 'object' || !b || typeof b !== 'object') return false;
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
  }
  function dogamFor(char) {
    const D = NM.data && NM.data.DOGAM;
    if (!D || typeof D !== 'object') return null;
    const key = Object.keys(D).filter(k => D[k] && D[k].glyph === char)[0];
    return key ? { key, entry: D[key] } : null;
  }

  /* ---------- 화면 ---------- */
  function mount(host, o) {
    const doc = o.document || root.document;
    const item = o.item || {};
    const ids = glyphsOf(o.config);
    const want = answerFor(o.config);
    if (item.answer !== undefined && !sameAnswer(item.answer, want)) {
      NM.reportError('g.' + NAME + '.answer', 'item.answer differs from the fact table (answerFor): ' + item.id);
    }
    const place = {};
    ids.forEach(id => { place[id] = null; });
    let selected = null, locked = false, finished = false, wrongCalled = false, lastWrong = [];

    function el(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function rich(text, cls) {
      const s = el('span', cls || 'nm-gsg-text');
      s.appendChild(o.yet(String(text == null ? '' : text)));
      return s;
    }

    const box = el('div', 'nm-gsg');
    box.setAttribute('data-state', 'open');
    box.appendChild(el('p', 'nm-gsg-lead', tx('lead')));

    // 흩어진 글자
    const pool = el('section', 'nm-gsg-pool');
    pool.setAttribute('aria-label', tx('pool'));
    pool.appendChild(el('h4', 'nm-gsg-head', tx('pool')));
    const poolTiles = el('div', 'nm-gsg-tiles nm-gsg-scatter');
    pool.appendChild(poolTiles);
    const poolEmpty = el('p', 'nm-gsg-empty', tx('poolEmpty'));
    poolEmpty.hidden = true;
    pool.appendChild(poolEmpty);
    box.appendChild(pool);

    // 글자 단추
    const tiles = {};
    ids.forEach((id, i) => {
      const b = el('button', 'nm-gsg-tile');
      b.type = 'button';
      b.setAttribute('data-glyph', id);
      b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--gsg-r', (((i * 37) % 23) - 11) + 'deg');
      b.style.setProperty('--gsg-dy', (((i * 53) % 17) - 8) + 'px');
      const g = el('span', 'nm-gsg-glyph nm-yet', glyphChar(id));
      g.setAttribute('aria-hidden', 'true');
      b.appendChild(g);
      const flag = el('span', 'nm-gsg-flag');
      flag.setAttribute('aria-hidden', 'true');
      b.appendChild(flag);
      const sr = el('span', 'nm-sr nm-gsg-sr');
      b.appendChild(sr);
      b.addEventListener('click', () => { if (!locked) select(selected === id ? null : id); });
      tiles[id] = { btn: b, flag, sr, marks: {} };
      poolTiles.appendChild(b);
    });

    // 칸
    const bins = {};
    const binsWrap = el('div', 'nm-gsg-bins');
    function makeBin(bid) {
      const sec = el('section', 'nm-gsg-bin');
      sec.setAttribute('data-bin', bid);
      sec.setAttribute('aria-label', tx('bins.' + bid + '.name'));
      const head = el('div', 'nm-gsg-binhead');
      const mark = el('span', 'nm-gsg-binmark');
      mark.setAttribute('aria-hidden', 'true');
      head.appendChild(mark);
      const names = el('div', 'nm-gsg-binnames');
      names.appendChild(el('h4', 'nm-gsg-binname', tx('bins.' + bid + '.name')));
      names.appendChild(el('p', 'nm-gsg-bindesc', tx('bins.' + bid + '.desc')));
      head.appendChild(names);
      sec.appendChild(head);
      const put = el('button', 'nm-st-btn nm-gsg-put', tx('put'));
      put.type = 'button';
      put.setAttribute('aria-label', tx('putAria', { bin: tx('bins.' + bid + '.name') }));
      put.disabled = true;
      put.addEventListener('click', () => putTo(bid));
      sec.appendChild(put);
      const t = el('div', 'nm-gsg-tiles');
      sec.appendChild(t);
      bins[bid] = { sec, put, tiles: t };
      return sec;
    }
    binsWrap.appendChild(makeBin('known'));
    const group = el('div', 'nm-gsg-group');
    group.appendChild(el('h4', 'nm-gsg-grouphead', tx('groupUnknown')));
    const groupRow = el('div', 'nm-gsg-grouprow');
    groupRow.appendChild(makeBin('lost'));
    groupRow.appendChild(makeBin('outside'));
    group.appendChild(groupRow);
    binsWrap.appendChild(group);
    box.appendChild(binsWrap);

    // 제출
    const foot = el('div', 'nm-gsg-foot');
    const left = el('span', 'nm-gsg-left');
    left.setAttribute('aria-live', 'polite');
    foot.appendChild(left);
    const submit = el('button', 'nm-st-btn nm-st-primary nm-gsg-submit', tx('submit'));
    submit.type = 'button';
    submit.addEventListener('click', doSubmit);
    foot.appendChild(submit);
    box.appendChild(foot);

    // 도감 결과판
    const dogam = el('section', 'nm-gsg-dogam');
    dogam.hidden = true;
    box.appendChild(dogam);

    host.appendChild(box);

    function binName(bid) { return tx('bins.' + bid + '.name'); }
    function refreshTile(id) {
      const t = tiles[id];
      const bid = place[id];
      t.sr.textContent = bid ? tx('tileInBin', { glyph: glyphChar(id), bin: binName(bid) }) : tx('tileAria', { glyph: glyphChar(id) });
      const m = t.btn.getAttribute('data-mark');
      if (m) t.sr.textContent += ', ' + tx('mark.' + m);
      t.btn.setAttribute('data-bin', bid || '');
    }
    // 표시 상태: wrong(틀림 ×) · hint(고칠 곳 △) · answer(정답 자리 ○). 색과 함께 늘 기호를 단다.
    function setMark(id, key, on) {
      const t = tiles[id];
      t.marks[key] = !!on;
      if (key === 'answer' && on) { t.marks.wrong = false; t.marks.hint = false; }
      ['wrong', 'hint', 'answer'].forEach(k => t.btn.classList.toggle('is-' + k, !!t.marks[k]));
      const m = t.marks.answer ? 'answer' : t.marks.wrong ? 'wrong' : t.marks.hint ? 'hint' : '';
      if (m) t.btn.setAttribute('data-mark', m); else t.btn.removeAttribute('data-mark');
      t.flag.textContent = m === 'wrong' ? '×' : m === 'hint' ? '△' : m === 'answer' ? '○' : '';
      refreshTile(id);
    }
    function refresh() {
      const n = ids.filter(id => !place[id]).length;
      left.textContent = n ? tx('left', { n }) : '';
      poolEmpty.hidden = n > 0;
      submit.disabled = locked || n > 0;
      BINS.forEach(b => { bins[b].put.disabled = locked || !selected; });
      ids.forEach(id => {
        tiles[id].btn.setAttribute('aria-pressed', String(id === selected));
        tiles[id].btn.classList.toggle('is-selected', id === selected);
        tiles[id].btn.disabled = locked;
        refreshTile(id);
      });
    }
    function select(id) { selected = id; refresh(); }
    function putTo(bid) {
      if (locked || !selected) return;
      const id = selected;
      place[id] = bid;
      setMark(id, 'wrong', false);
      setMark(id, 'hint', false);
      bins[bid].tiles.appendChild(tiles[id].btn);
      selected = null;
      const next = ids.filter(x => !place[x])[0];
      if (next) { selected = next; refresh(); tiles[next].btn.focus(); }
      else { refresh(); submit.focus(); }
    }
    function doSubmit() {
      if (locked || ids.some(id => !place[id])) { refresh(); return; }
      const answer = {};
      ids.forEach(id => { answer[id] = place[id]; });
      wrongCalled = false;
      o.onSubmit(answer);
      if (!wrongCalled && check(answer, item) === true) finish(false);
    }
    function lock() { locked = true; selected = null; refresh(); box.setAttribute('data-state', 'locked'); }
    function finish(byHelp) {
      lock();
      if (finished) return;
      finished = true;
      box.setAttribute('data-state', byHelp ? 'doneByHelp' : 'done');
      showDogam(byHelp);
    }
    function showDogam(byHelp) {
      dogam.textContent = '';
      dogam.appendChild(el('h4', 'nm-gsg-dogam-title', tx('dogam.title')));
      dogam.appendChild(el('p', 'nm-gsg-dogam-lead', tx('dogam.lead')));
      const list = el('ul', 'nm-gsg-dogam-list');
      const chars = [], keys = [];
      ['lost', 'outside'].forEach(bid => ids.filter(id => want[id] === bid).forEach(id => {
        const ch = glyphChar(id);
        const found = dogamFor(ch);
        chars.push(ch);
        if (found) keys.push(found.key);
        const li = el('li', 'nm-gsg-dogam-entry');
        li.setAttribute('data-glyph', id);
        li.setAttribute('data-bin', bid);
        if (found) li.setAttribute('data-dogam', found.key);
        li.appendChild(el('span', 'nm-gsg-dogam-glyph nm-yet', ch));
        const info = el('div', 'nm-gsg-dogam-info');
        if (found && found.entry.name) info.appendChild(rich(found.entry.name, 'nm-gsg-dogam-name'));
        info.appendChild(el('span', 'nm-gsg-dogam-bin', binName(bid)));
        info.appendChild(found && found.entry.note ? rich(found.entry.note, 'nm-gsg-dogam-note') : el('span', 'nm-gsg-dogam-note', tx('bins.' + bid + '.desc')));
        li.appendChild(info);
        list.appendChild(li);
      }));
      dogam.appendChild(list);
      dogam.hidden = false;
      box.setAttribute('data-dogam', 'open');
      try {
        doc.dispatchEvent(new root.CustomEvent('nm:dogam-open', {
          detail: { gimmick: NAME, item: item.id || null, glyphs: chars, keys, byHelp, reopened: !!o.readOnly }
        }));
      } catch (e) { NM.reportError('g.' + NAME + '.event', e); }
    }

    refresh();
    if (o.readOnly) lock();

    return {
      showWrong(info) {
        wrongCalled = true;
        const w = info && Array.isArray(info.wrong) ? info.wrong.filter(id => tiles[id]) : [];
        ids.forEach(id => setMark(id, 'wrong', w.indexOf(id) >= 0));
        lastWrong = w;
      },
      showHint(step, target) {
        if (step < 2) return;
        const list = target == null ? lastWrong : (Array.isArray(target) ? target : [target]);
        list.forEach(tk => {
          if (bins[tk]) { bins[tk].sec.classList.add('is-hint'); bins[tk].sec.setAttribute('data-mark', 'hint'); }
          else if (tiles[tk]) setMark(tk, 'hint', true);
        });
      },
      showAnswer() {
        ids.forEach(id => {
          place[id] = want[id];
          bins[want[id]].tiles.appendChild(tiles[id].btn);
          setMark(id, 'answer', true);
        });
        BINS.forEach(b => { bins[b].sec.classList.remove('is-hint'); bins[b].sec.removeAttribute('data-mark'); });
        finish(o.readOnly ? null : true);
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  const def = { mount, check };
  NM.gimmicks.register(NAME, def);
  // 시험·장면 작성 도움(판정과 같은 표): NM.gimmicks.get('sortGlyphs').facts
  def.facts = { ALL, LOST, OUTSIDE, BINS, DEFAULT, category, glyphsOf, answerFor };
})(typeof window !== 'undefined' ? window : globalThis);
