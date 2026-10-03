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
 *   또는    { steps: [{ glyphs, bins?, say?, done?, rest? }, …] }  단계 나눠 가르기(서장: 3자 연습 → 나머지).
 *     glyphs  이 단계에 새로 나오는 글자 id(앞 단계 글자는 칸에 그대로 남는다)
 *     bins    이 단계의 칸: 'known' | 'unknown'(모르는 글자 한 칸 = lost+outside) | 'lost' | 'outside'.
 *             없으면 마지막 단계는 ['known','lost','outside'], 앞 단계는 ['known','unknown']. 마지막 단계는 세 칸이 다 있어야 한다.
 *     say     단계를 시작할 때 보일 대사 줄(장면 대사 줄 모양: 문자열 또는 { who, text, expr }) 또는 그 배열
 *     done    앞 단계를 다 갈랐을 때 보일 대사 줄(학생의 조작 뒤에 오는 짧은 설명)
 *     rest    앞 단계에서 이 칸으로 갈 글자만 남으면 그 글자들은 저절로 이 칸에 들어간다(예: 'unknown')
 *   앞 단계는 연습이다: 기믹이 바로 맞춰 보고(틀린 글자는 × — 다시 옮기면 지워짐) 기록·판정에 넣지 않는다.
 *   다 맞으면 done 줄과 '남은 글자 불러오기' 단추. 다음 단계로 가면 앞 단계 글자는 제자리에 고정되고,
 *   'unknown' 칸 글자는 사실 표의 칸(lost/outside)으로 옮겨진다. 제출(onSubmit)은 마지막 단계에서 모든 글자로 한 번 한다.
 *   진행기가 틀림·정답·완료를 알리면(showWrong·showAnswer·showDone) 앞 단계에 있더라도 마지막 단계로 넘어가 보인다.
 *   answer  { <글자 id>: 'known'|'lost'|'outside' }   — 모든 단계 글자. answerFor(config) 와 같아야 한다(다르면 오류 모음에 알린다).
 *   hints[1] 강조 대상: 칸 id('known'|'lost'|'outside'|'unknown') 또는 글자 id, 또는 그 배열. 없으면 마지막에 틀린 글자.
 * ■ 끝나면(맞음·도움으로 끝·이미 끝난 과제 다시 열기) 도감 결과판을 보이고
 *   document 에 'nm:dogam-open' 사건(detail { gimmick, item, glyphs:[글자], keys:[NM.data.DOGAM 열쇠], byHelp, reopened })을 보내며(byHelp: 맞음 false · 도움 true · 다시 열기 null),
 *   기믹 뿌리 요소에 data-dogam="open" 을 단다(장면·수첩이 쓸 수 있는 표지). 도감 화면 자체는 수첩(U1) 몫이다.
 *   도감 설명은 NM.data.DOGAM 에서 같은 글자(glyph)를 찾아 쓴다. 없으면 칸 설명만 보인다.
 * ■ 조작: 글자 단추를 눌러 고르고(Enter·Space), 칸의 '여기에 놓기' 단추로 놓는다. 끌어 놓기는 쓰지 않는다.
 *   놓으면 다음 글자를 미리 고르고 초점을 옮긴다. 알림 줄(.nm-gsg-now, aria-live)이 '미리 골라 둔 다음 글자'를 보이고 읽어 준다.
 *   미리 고른 글자를 한 번 더 눌러도 고름이 풀리지 않는다(안내대로 '고른 뒤 놓기'를 해도 헷갈리지 않게). 직접 고른 글자를 다시 누르면 풀린다.
 * 필요: core/ns.js, ui/stage-gimmick.js, data/text-g-sortGlyphs.js (대사 줄 모양은 ui/dialog.js 가 있으면 그것을 쓴다, 도감 설명은 data DOGAM 이 있으면)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'sortGlyphs';
  const ALL = ['g', 'k', 'ng', 'd', 't', 'n', 'b', 'p', 'm', 'j', 'ch', 's', 'q', 'h', 'o', 'r', 'z',
    'araea', 'eu', 'i', 'vo', 'va', 'vu', 'veo', 'vyo', 'vya', 'vyu', 'vyeo', 'bv'];
  const LOST = ['ng', 'z', 'q', 'araea'];
  const OUTSIDE = ['bv'];
  const BINS = ['known', 'lost', 'outside'];
  const STEP_BINS = ['known', 'unknown', 'lost', 'outside'];
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
  const cfg = (config) => (config && typeof config === 'object' ? config : {});
  const hasSteps = (config) => Array.isArray(cfg(config).steps) && cfg(config).steps.length > 0;
  const asLines = (x) => (x == null ? [] : (Array.isArray(x) ? x : [x])).filter(l => l != null && l !== '');
  function glyphsOf(config) {
    const c = cfg(config);
    const out = [];
    if (hasSteps(c)) {
      // 단계 글자를 차례로 모은다(모르는 id 는 stepsOf 가 알린다)
      c.steps.forEach(s => (s && Array.isArray(s.glyphs) ? s.glyphs : []).forEach(id => {
        if (ALL.indexOf(id) >= 0 && out.indexOf(id) < 0) out.push(id);
      }));
      return out;
    }
    if (!Array.isArray(c.glyphs)) return DEFAULT.slice();
    c.glyphs.forEach(id => {
      if (ALL.indexOf(id) < 0) { NM.reportError('g.' + NAME + '.config', 'unknown glyph id: ' + id); return; }
      if (out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }
  // 단계 목록. steps 가 없으면 한 단계(모든 글자, 세 칸).
  function stepsOf(config) {
    const c = cfg(config);
    if (!hasSteps(c)) return [{ glyphs: glyphsOf(c), bins: BINS.slice(), say: [], done: [], rest: null }];
    const seen = [];
    const last = c.steps.length - 1;
    return c.steps.map((s0, i) => {
      const s = s0 && typeof s0 === 'object' ? s0 : {};
      const glyphs = [];
      (Array.isArray(s.glyphs) ? s.glyphs : []).forEach(id => {
        if (ALL.indexOf(id) < 0) { NM.reportError('g.' + NAME + '.config', 'unknown glyph id: ' + id); return; }
        if (seen.indexOf(id) < 0) { seen.push(id); glyphs.push(id); }
      });
      let bins = Array.isArray(s.bins) ? s.bins.filter(b => STEP_BINS.indexOf(b) >= 0) : (i === last ? BINS.slice() : ['known', 'unknown']);
      if (i === last && BINS.some(b => bins.indexOf(b) < 0)) {
        NM.reportError('g.' + NAME + '.config', 'last step needs bins known, lost, outside');
        bins = BINS.slice();
      }
      const rest = STEP_BINS.indexOf(s.rest) >= 0 && bins.indexOf(s.rest) >= 0 ? s.rest : null;
      return { glyphs, bins, say: asLines(s.say), done: asLines(s.done), rest };
    });
  }
  // 한 단계의 칸들 가운데 이 글자가 갈 칸('unknown' 은 lost+outside)
  function binFor(id, bins) {
    const cat = category(id);
    if (!cat) return null;
    if (bins.indexOf(cat) >= 0) return cat;
    if ((cat === 'lost' || cat === 'outside') && bins.indexOf('unknown') >= 0) return 'unknown';
    return null;
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
    const steps = stepsOf(o.config);
    const LAST = steps.length - 1;
    const ids = glyphsOf(o.config);
    const want = answerFor(o.config);
    if (item.answer !== undefined && !sameAnswer(item.answer, want)) {
      NM.reportError('g.' + NAME + '.answer', 'item.answer differs from the fact table (answerFor): ' + item.id);
    }
    const stepOf = {};
    steps.forEach((s, i) => s.glyphs.forEach(id => { stepOf[id] = i; }));
    const place = {}, fixed = {};
    ids.forEach(id => { place[id] = null; });
    // auto: 놓은 뒤 기믹이 미리 고른 글자 id. 그 글자를 한 번 더 눌러도 고름이 풀리지 않는다(안내대로 '고른 뒤 놓기').
    let selected = null, auto = null, locked = false, finished = false, wrongCalled = false, lastWrong = [];
    // step: 지금 단계. stepDone: 앞 단계를 다 갈라 '남은 글자 불러오기'를 기다리는 중
    let step = o.readOnly ? LAST : 0, stepDone = false;
    const cur = () => steps[step];
    const active = (id) => stepOf[id] <= step;

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
    const fill = (t) => (typeof o.fill === 'function' ? o.fill(t) : t);
    // 대사 줄: 장면 대사와 같은 모양(NM.ui.dialog.lineEl)으로, 없으면 글만
    function lineNode(ln) {
      const D = NM.ui && NM.ui.dialog;
      if (D && typeof D.lineEl === 'function') {
        try { return D.lineEl(ln, { fill, scene: { cast: {} } }); } catch (e) { NM.reportError('g.' + NAME + '.say', e); }
      }
      const p = el('p', 'nm-gsg-line');
      p.appendChild(rich(fill(typeof ln === 'string' ? ln : (ln && ln.text) || '')));
      return p;
    }

    const box = el('div', 'nm-gsg');
    box.setAttribute('data-state', 'open');
    if (steps.length > 1) box.setAttribute('data-steps', String(steps.length));
    const lead = el('p', 'nm-gsg-lead', tx('lead'));
    box.appendChild(lead);
    // 단계 대사(선배의 말): 단계 시작·앞 단계를 다 가른 뒤. 화면 낭독기도 읽는다.
    const say = el('div', 'nm-gsg-say');
    say.setAttribute('aria-live', 'polite');
    say.hidden = true;
    box.appendChild(say);
    // 지금 고른 글자 알림: 놓은 뒤 다음 글자를 미리 고르면 그 사실을 보이고 읽어 준다(aria-live)
    const now = el('p', 'nm-gsg-now');
    now.setAttribute('aria-live', 'polite');
    now.hidden = true;
    box.appendChild(now);

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

    // 글자 단추(뒤 단계 글자는 그 단계가 올 때까지 숨긴다)
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
      b.addEventListener('click', () => {
        if (locked || fixed[id] || stepDone) return;
        if (selected === id && auto === id) { auto = null; refresh(); return; } // 미리 골라 둔 글자: 고름을 그대로 둔다
        select(selected === id ? null : id);
      });
      tiles[id] = { btn: b, flag, sr, marks: {} };
      poolTiles.appendChild(b);
    });

    // 칸: 머리(이름·설명), 그 아래 한 줄에 '여기에 놓기' 단추와 놓인 글자(빈 칸이 따로 줄을 차지하지 않게)
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
      const row = el('div', 'nm-gsg-binrow');
      const put = el('button', 'nm-st-btn nm-gsg-put', tx('put'));
      put.type = 'button';
      put.setAttribute('aria-label', tx('putAria', { bin: tx('bins.' + bid + '.name') }));
      put.disabled = true;
      put.addEventListener('click', () => putTo(bid));
      row.appendChild(put);
      const t = el('div', 'nm-gsg-tiles');
      row.appendChild(t);
      sec.appendChild(row);
      bins[bid] = { sec, put, tiles: t };
      return sec;
    }
    const usedBins = STEP_BINS.filter(b => steps.some(s => s.bins.indexOf(b) >= 0));
    if (usedBins.indexOf('known') >= 0) binsWrap.appendChild(makeBin('known'));
    const group = el('div', 'nm-gsg-group');
    const groupHead = el('h4', 'nm-gsg-grouphead', tx('groupUnknown'));
    group.appendChild(groupHead);
    const groupRow = el('div', 'nm-gsg-grouprow');
    ['unknown', 'lost', 'outside'].forEach(b => { if (usedBins.indexOf(b) >= 0) groupRow.appendChild(makeBin(b)); });
    group.appendChild(groupRow);
    binsWrap.appendChild(group);
    box.appendChild(binsWrap);

    // 틀린 글자 안내(앞 단계 연습에서 틀린 칸에 놓았을 때, 마지막 단계에서 틀리게 냈을 때)
    const retry = el('p', 'nm-gsg-retry', tx('stepWrong'));
    retry.setAttribute('aria-live', 'polite');
    retry.hidden = true;
    box.appendChild(retry);

    // 제출(마지막 단계) · 남은 글자 불러오기(앞 단계) — 창 아래에 붙어 있다(긴 창에서도 보이게)
    const foot = el('div', 'nm-gsg-foot');
    const left = el('span', 'nm-gsg-left');
    left.setAttribute('aria-live', 'polite');
    foot.appendChild(left);
    const nextBtn = el('button', 'nm-st-btn nm-st-primary nm-gsg-next', tx('next'));
    nextBtn.type = 'button';
    nextBtn.hidden = true;
    nextBtn.addEventListener('click', () => goStep(step + 1, true));
    foot.appendChild(nextBtn);
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
    function moveTile(id, bid) {
      place[id] = bid;
      (bid ? bins[bid].tiles : poolTiles).appendChild(tiles[id].btn);
    }
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
      const s = cur();
      const act = ids.filter(active);
      const n = act.filter(id => !place[id]).length;
      const isLast = step === LAST;
      box.setAttribute('data-step', String(step));
      left.textContent = n && !stepDone ? tx('left', { n }) : '';
      poolEmpty.hidden = n > 0;
      submit.hidden = !isLast;
      submit.disabled = locked || n > 0;
      nextBtn.hidden = isLast || !stepDone || locked;
      STEP_BINS.forEach(b => {
        if (!bins[b]) return;
        bins[b].sec.hidden = s.bins.indexOf(b) < 0;
        bins[b].put.disabled = locked || stepDone || !selected;
      });
      // '모르는 글자' 묶음: 두 칸(28자 안·밖)으로 나뉠 때만 묶음 머리를 보인다. 한 칸이면 그 칸 이름이 곧 '모르는 글자'.
      const split = ['lost', 'outside'].some(b => s.bins.indexOf(b) >= 0);
      group.setAttribute('data-split', split ? '1' : '0');
      groupHead.hidden = !split;
      group.hidden = !['unknown', 'lost', 'outside'].some(b => s.bins.indexOf(b) >= 0);
      retry.hidden = locked || !act.some(id => tiles[id].marks.wrong);
      // 조작 안내는 처음 글자를 놓을 때까지만(좁은 화면에서 자리를 아낀다)
      lead.hidden = locked || step > 0 || ids.some(id => place[id]);
      showNow();
      ids.forEach(id => {
        const t = tiles[id];
        t.btn.hidden = !active(id);
        t.btn.setAttribute('aria-pressed', String(id === selected));
        t.btn.classList.toggle('is-selected', id === selected);
        t.btn.classList.toggle('is-fixed', !!fixed[id]);
        t.btn.disabled = locked || !!fixed[id] || stepDone;
        refreshTile(id);
      });
    }
    // 고른 글자 알림 줄: 고른 글자가 없으면 숨긴다. 바뀔 때만 다시 쓴다(화면 낭독기가 같은 말을 거듭 읽지 않게).
    let nowSig = '';
    function showNow() {
      const sig = locked || !selected ? '' : (auto === selected ? 'auto:' : 'pick:') + selected;
      if (sig === nowSig) return;
      nowSig = sig;
      now.textContent = '';
      now.hidden = !sig;
      if (!sig) { now.removeAttribute('data-glyph'); now.removeAttribute('data-auto'); return; }
      now.setAttribute('data-glyph', selected);
      now.setAttribute('data-auto', auto === selected ? '1' : '0');
      const parts = tx(auto === selected ? 'nowAuto' : 'now').split('%glyph%');
      parts.forEach((p, i) => {
        if (i) now.appendChild(el('span', 'nm-gsg-now-glyph nm-yet', glyphChar(selected)));
        if (p) now.appendChild(doc.createTextNode(p));
      });
    }
    function showSay(lines, kind) {
      say.textContent = '';
      say.hidden = !lines.length;
      if (kind) say.setAttribute('data-say', kind); else say.removeAttribute('data-say');
      lines.forEach(ln => say.appendChild(lineNode(ln)));
    }
    function select(id) { selected = id; auto = null; refresh(); }
    // 다음에 미리 고를 글자: 지금 단계에서 아직 칸에 없는 첫 글자
    const nextFree = () => ids.filter(x => active(x) && !place[x] && !fixed[x])[0];
    function putTo(bid) {
      if (locked || stepDone || !selected) return;
      const id = selected;
      moveTile(id, bid);
      setMark(id, 'wrong', false);
      setMark(id, 'hint', false);
      selected = null; auto = null;
      if (step < LAST) {
        // 앞 단계(연습): 바로 맞춰 본다. 틀린 칸이면 × — 다시 옮기면 지워진다. 기록·판정에는 넣지 않는다.
        if (bid !== binFor(id, cur().bins)) setMark(id, 'wrong', true);
        if (stepComplete()) { finishStep(); return; }
      }
      const next = nextFree();
      if (next) { selected = next; auto = next; refresh(); tiles[next].btn.focus(); }
      else {
        refresh();
        const w = ids.filter(x => active(x) && tiles[x].marks.wrong)[0];
        if (step === LAST) submit.focus(); else if (w) tiles[w].btn.focus();
      }
    }
    // 앞 단계를 다 갈랐는가: 놓은 글자가 모두 맞고, 남은 글자는 모두 rest 칸으로 갈 글자뿐
    function stepComplete() {
      const s = cur();
      if (s.glyphs.some(id => place[id] && place[id] !== binFor(id, s.bins))) return false;
      return s.glyphs.filter(id => !place[id]).every(id => s.rest && binFor(id, s.bins) === s.rest);
    }
    function finishStep() {
      const s = cur();
      s.glyphs.filter(id => !place[id]).forEach(id => moveTile(id, s.rest));
      stepDone = true;
      selected = null; auto = null;
      showSay(s.done, 'done');
      refresh();
      nextBtn.focus();
    }
    // 단계 넘기기: 앞 단계 글자는 고정(맞게 놓인 것만), 'unknown' 칸 글자는 사실 표의 칸으로. focus: 다음 글자에 초점
    function goStep(to, focus) {
      if (locked || to > LAST || to <= step) return;
      for (let i = step; i < to; i++) {
        steps[i].glyphs.forEach(id => {
          if (place[id] === 'unknown') moveTile(id, category(id));
          if (place[id] && place[id] === want[id] && !tiles[id].marks.wrong) fixed[id] = true;
        });
      }
      step = to;
      stepDone = false;
      showSay(cur().say, 'step');
      const next = nextFree();
      selected = next || null; auto = next || null;
      refresh();
      if (focus && next) tiles[next].btn.focus();
    }
    function doSubmit() {
      if (locked || step !== LAST || ids.some(id => !place[id])) { refresh(); return; }
      const answer = {};
      ids.forEach(id => { answer[id] = place[id]; });
      wrongCalled = false;
      o.onSubmit(answer);
      if (!wrongCalled && check(answer, item) === true) finish(false);
    }
    function lock() { locked = true; selected = null; auto = null; refresh(); box.setAttribute('data-state', 'locked'); }
    function finish(byHelp) {
      if (finished) return; // 진행기의 showDone 과 제출 단추가 함께 끝낼 수 있다 — 한 번만
      lock();
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
    // 정답 자리에 모두 놓기(정답 보기·맞게 끝남)
    function placeAll(markAnswer) {
      ids.forEach(id => {
        if (place[id] !== want[id]) moveTile(id, want[id]);
        if (markAnswer) setMark(id, 'answer', true);
        else { setMark(id, 'wrong', false); setMark(id, 'hint', false); }
      });
      STEP_BINS.forEach(b => { if (bins[b]) { bins[b].sec.classList.remove('is-hint'); bins[b].sec.removeAttribute('data-mark'); } });
    }

    // 처음에는 아무 글자도 미리 고르지 않는다(학생이 글자를 직접 골라 보는 것이 첫 조작). 다시 연 과제는 대사 없이 정답만.
    if (!o.readOnly) showSay(cur().say, 'step');
    refresh();
    if (o.readOnly) lock();

    return {
      showWrong(info) {
        wrongCalled = true;
        if (step < LAST) goStep(LAST, false);
        const w = info && Array.isArray(info.wrong) ? info.wrong.filter(id => tiles[id]) : [];
        ids.forEach(id => setMark(id, 'wrong', w.indexOf(id) >= 0));
        lastWrong = w;
        refresh();
      },
      showHint(stepNo, target) {
        if (stepNo < 2) return;
        const list = target == null ? lastWrong.concat(lastWrong.map(id => want[id]).filter(Boolean)) : (Array.isArray(target) ? target : [target]);
        list.forEach(tk => {
          if (bins[tk]) { bins[tk].sec.classList.add('is-hint'); bins[tk].sec.setAttribute('data-mark', 'hint'); }
          else if (tiles[tk]) setMark(tk, 'hint', true);
        });
      },
      showAnswer() {
        if (step < LAST) goStep(LAST, false);
        placeAll(true);
        finish(o.readOnly ? null : true);
      },
      // 맞게 제출해 done 이 된 직후(진행기). 화면 조작 없이 낸 답이어도 정답 자리에 놓고 끝낸다.
      showDone() {
        if (finished) return;
        if (step < LAST) goStep(LAST, false);
        placeAll(false);
        finish(false);
      },
      destroy() { if (box.parentNode) box.parentNode.removeChild(box); }
    };
  }

  const def = { mount, check };
  NM.gimmicks.register(NAME, def);
  // 시험·장면 작성 도움(판정과 같은 표): NM.gimmicks.get('sortGlyphs').facts
  def.facts = { ALL, LOST, OUTSIDE, BINS, STEP_BINS, DEFAULT, category, glyphsOf, stepsOf, binFor, answerFor };
})(typeof window !== 'undefined' ? window : globalThis);
