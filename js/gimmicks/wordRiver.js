'use strict';
/*
 * 기믹 'wordRiver' — 종장 말의 강 고등판 「변화의 강」 (G11, spec §7 · §5-3).
 *  ① 변화의 강(config.words): 낱말마다 강을 따라 나루(앞 → 뒤)가 있고, 섞인 조각(그 낱말의 옛 꼴~지금 꼴)을 차례대로 놓는다.
 *     조각을 누르면 다음 빈 나루에 놓이고, 놓인 조각을 누르면 돌아온다. 판정은 나루마다 조각 id — 순서만, 연도·세기는 묻지 않는다.
 *  ② 지금의 변화 찾기(config.now, 선택): 보기 가운데 지금 일어나는 변화를 모두 고른다(여럿 고르기).
 *  ③ 500년 뒤 예측 한 줄(config.predict, 선택): 채점하지 않는다. 답(answer)에 넣지 않고 기록에도 남기지 않는다
 *     (기믹 접점에 저장 통로가 없음 — 같은 창을 다시 열면 이 세션 동안만 남아 있다).
 *  중학교판(디지털 장면)은 이 기믹을 쓰지 않는다: 핵심 항목은 해독 항목 3개, 두 관점 성찰 한 줄은 장면 끝 '돌아보기'(spec §7 종장).
 *  config/answer 모양과 예시: js/gimmicks/README-wordRiver.md · 문구: js/data/text-g-wordRiver.js · 모양: css/g-wordRiver.css
 *
 * 조각 id: 낱말 w 의 forms[k] = '<w.id>.<k>' (forms 는 앞 → 뒤 차례로 적는다).
 * 학생 답: { order: { <낱말 id>: [나루 1의 조각 id, 나루 2의 조각 id, …] }, now: [고른 보기 id(정렬)] }
 * check → true 또는 { correct:false, wrong: { order: { <낱말 id>: [틀린 나루 번호(1부터)] }, now: { extra: [잘못 고른 id], missing: 빠진 수 } } }
 * showHint(2, target): target = 낱말 id · 'order' · 'now' (또는 그 배열) — 그 부분에 ★ 강조.
 * 필요: core/ns.js, ui/stage-gimmick.js, ui/stage-yet.js(옛한글 DOM·현대 표기 읽기), ui/marker.js(config.orig 원문 카드, 선택)
 */
(function (root) {
  const NM = root.NM;
  const NAME = 'wordRiver';
  const PREDICT_MAX = 120;
  const SYM = { wrong: '✕', hint: '★', answer: '○', done: '○', on: '☑', off: '☐', missing: '△' };
  const memo = {}; // 과제 id → 예측 한 줄(이 세션 동안만)

  const list = (x) => (Array.isArray(x) ? x.filter(v => v != null) : []);

  function T(key, vars) {
    const base = NM.data && NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g[NAME];
    let v = base;
    String(key).split('.').forEach(k => { v = v && typeof v === 'object' ? v[k] : undefined; });
    if (typeof v !== 'string') { NM.reportError('gimmick.' + NAME + '.text', 'missing text: ' + key); return ''; }
    return v.replace(/%(\w+)%/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  }

  /* ---------- 순수 부분(단위 점검용으로 def.logic 에 둔다) ---------- */
  function check(answer, item) {
    const exp = (item && item.answer) || {};
    const a = answer && typeof answer === 'object' ? answer : {};
    const wrong = { order: {}, now: { extra: [], missing: 0 } };
    let n = 0;
    const go = a.order && typeof a.order === 'object' ? a.order : {};
    Object.keys(exp.order || {}).forEach(wid => {
      const e = list(exp.order[wid]), g = Array.isArray(go[wid]) ? go[wid] : [];
      const bad = [];
      e.forEach((id, i) => { if (g[i] !== id) bad.push(i + 1); });
      if (bad.length) { wrong.order[wid] = bad; n += bad.length; }
    });
    if (Array.isArray(exp.now)) {
      const want = {}, got = {};
      exp.now.forEach(id => { want[id] = true; });
      list(a.now).forEach(id => { got[id] = true; });
      Object.keys(got).forEach(id => { if (!want[id]) wrong.now.extra.push(id); });
      wrong.now.missing = Object.keys(want).filter(id => !got[id]).length;
      n += wrong.now.extra.length + wrong.now.missing;
    }
    return n ? { correct: false, wrong } : true;
  }
  function seededShuffle(arr, seedText) {
    let h = 2166136261;
    const s = String(seedText || '');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9E3779B9) >>> 0;
      const j = h % (i + 1);
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    if (out.length > 1 && out.every((v, i) => v === arr[i])) out.push(out.shift());
    return out;
  }
  function chipsOf(word) { return list(word && word.forms).map((t, k) => ({ id: word.id + '.' + k, text: String(t) })); }

  /* ---------- 그리기 ---------- */
  function mount(host, o) {
    const doc = o.document || root.document;
    const cfg = o.config || {};
    const item = o.item || {};
    const words = list(cfg.words).filter(w => w && w.id && list(w.forms).length >= 2);
    const nowCfg = cfg.now && typeof cfg.now === 'object' ? cfg.now : null;
    const choices = list(nowCfg && nowCfg.choices).filter(c => c && c.id);
    const memoKey = String(item.id || NAME);

    const stops = {};   // 낱말 id → [조각 id | null] (나루 차례)
    const chipText = {};
    const pools = {};   // 낱말 id → 섞인 조각
    words.forEach(w => {
      const cs = chipsOf(w);
      cs.forEach(c => { chipText[c.id] = c.text; });
      pools[w.id] = seededShuffle(cs, memoKey + ':' + w.id);
      stops[w.id] = cs.map(() => null);
    });
    const picked = {};  // 보기 id → true
    let locked = !!o.readOnly, signalled = false;
    const nodes = { stop: {}, chip: {}, poolEmpty: {}, choice: {}, word: {} };

    function el(tag, cls, text) {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.appendChild(doc.createTextNode(String(text)));
      return e;
    }
    function button(cls) { const b = el('button', cls); b.type = 'button'; return b; }
    function modern(text) { return NM.ui.stageYet ? NM.ui.stageYet.modern(text) : String(text); }
    function yetSpan(text) {
      const s = el('span', 'wr-yet');
      s.setAttribute('aria-hidden', 'true');
      s.appendChild(o.yet(String(text)));
      return s;
    }
    function markSym(kind) {
      const s = el('span', 'wr-sym wr-sym-' + kind);
      s.appendChild(el('span', null, SYM[kind])).setAttribute('aria-hidden', 'true');
      s.appendChild(el('span', 'nm-sr', T('marks.' + kind)));
      return s;
    }
    function setMark(node, kind, on) {
      if (!node) return;
      node.classList.toggle('is-' + kind, !!on);
      const old = node.querySelector(':scope > .wr-sym-' + kind);
      if (on && !old) node.appendChild(markSym(kind));
      if (!on && old) old.remove();
    }
    function wordName(w, i) { return w.label ? modern(w.label) : T('wordN', { n: i + 1 }); }

    const box = el('div', 'wr');
    box.setAttribute('data-level', String(o.level || ''));
    if (o.readOnly) box.classList.add('is-locked');

    list(cfg.orig).forEach(id => {
      try {
        const card = NM.ui.marker && NM.ui.marker.orig(id, { document: doc });
        if (card) { const w = el('div', 'wr-orig'); w.appendChild(card); box.appendChild(w); }
      } catch (e) { NM.reportError('gimmick.' + NAME + '.orig', e); }
    });

    /* ① 변화의 강 */
    if (words.length) {
      const sec = el('section', 'wr-sec wr-order');
      sec.setAttribute('data-target', 'order');
      const hid = 'wr-h-' + Math.random().toString(36).slice(2, 8);
      const h = el('h3', 'wr-title', T('orderTitle')); h.id = hid;
      sec.setAttribute('aria-labelledby', hid);
      sec.appendChild(h);
      sec.appendChild(el('p', 'wr-help', T('orderHelp')));
      words.forEach((w, wi) => {
        const row = el('div', 'wr-word');
        row.setAttribute('data-target', w.id);
        row.setAttribute('data-word', w.id);
        const lab = el('p', 'wr-word-label');
        if (w.label) {
          lab.appendChild(el('span', 'nm-sr', T('wordLabel', { word: modern(w.label) })));
          const v = el('span', null); v.setAttribute('aria-hidden', 'true');
          const name = el('span', 'wr-word-name'); name.appendChild(o.yet(String(w.label)));
          const parts = T('wordLabel', { word: '\u0000' }).split('\u0000');
          v.appendChild(doc.createTextNode(parts[0] || ''));
          v.appendChild(name);
          v.appendChild(doc.createTextNode(parts[1] || ''));
          lab.appendChild(v);
        } else lab.appendChild(doc.createTextNode(T('wordN', { n: wi + 1 })));
        row.appendChild(lab);
        const river = el('ol', 'wr-river');
        nodes.stop[w.id] = [];
        stops[w.id].forEach((_, k) => {
          const li = el('li', 'wr-stop-li');
          if (k === 0) li.appendChild(el('span', 'wr-end', T('upstream')));
          else { const ar = el('span', 'wr-arrow', T('arrow')); ar.setAttribute('aria-hidden', 'true'); li.appendChild(ar); }
          const b = button('wr-stop');
          b.setAttribute('data-word', w.id);
          b.setAttribute('data-pos', String(k + 1));
          b.addEventListener('click', () => clickStop(w.id, k));
          li.appendChild(b);
          if (k === stops[w.id].length - 1) li.appendChild(el('span', 'wr-end', T('downstream')));
          river.appendChild(li);
          nodes.stop[w.id][k] = b;
        });
        row.appendChild(river);
        const pool = el('div', 'wr-pool');
        pool.setAttribute('role', 'group');
        pool.setAttribute('aria-label', T('poolLabel') + ' · ' + wordName(w, wi));
        pools[w.id].forEach(ch => {
          const b = button('wr-chip');
          b.setAttribute('data-chip', ch.id);
          b.appendChild(el('span', 'nm-sr', modern(ch.text)));
          b.appendChild(yetSpan(ch.text));
          b.addEventListener('click', () => clickChip(w.id, ch.id));
          nodes.chip[ch.id] = b;
          pool.appendChild(b);
        });
        const pe = el('p', 'wr-pool-empty', T('poolEmpty'));
        nodes.poolEmpty[w.id] = pe;
        pool.appendChild(pe);
        row.appendChild(pool);
        nodes.word[w.id] = row;
        sec.appendChild(row);
      });
      box.appendChild(sec);
    }

    /* ② 지금의 변화 찾기 */
    let nowSec = null, missingP = null;
    if (choices.length) {
      nowSec = el('section', 'wr-sec wr-now');
      nowSec.setAttribute('data-target', 'now');
      const hid = 'wr-n-' + Math.random().toString(36).slice(2, 8);
      const h = el('h3', 'wr-title', T('nowTitle')); h.id = hid;
      nowSec.setAttribute('aria-labelledby', hid);
      nowSec.appendChild(h);
      nowSec.appendChild(el('p', 'wr-help', T('nowHelp')));
      const grp = el('div', 'wr-choices');
      grp.setAttribute('role', 'group');
      grp.setAttribute('aria-labelledby', hid);
      choices.forEach(c => {
        const b = button('wr-choice');
        b.setAttribute('data-choice', c.id);
        b.setAttribute('aria-pressed', 'false');
        b.appendChild(el('span', 'wr-choice-sym', SYM.off)).setAttribute('aria-hidden', 'true');
        const tx = el('span', 'wr-choice-text'); tx.appendChild(o.yet(String(c.text || '')));
        b.appendChild(tx);
        b.addEventListener('click', () => clickChoice(c.id));
        nodes.choice[c.id] = b;
        grp.appendChild(b);
      });
      nowSec.appendChild(grp);
      missingP = el('p', 'wr-missing');
      missingP.appendChild(el('span', 'wr-missing-sym', SYM.missing)).setAttribute('aria-hidden', 'true');
      missingP.appendChild(doc.createTextNode(T('missing')));
      missingP.hidden = true;
      nowSec.appendChild(missingP);
      box.appendChild(nowSec);
    }

    /* ③ 500년 뒤 예측 한 줄 (채점 안 함) */
    if (cfg.predict) {
      const sec = el('section', 'wr-sec wr-predict');
      const id = 'wr-p-' + Math.random().toString(36).slice(2, 8);
      const h = el('h3', 'wr-title', T('predictTitle'));
      sec.appendChild(h);
      const lab = el('label', 'wr-help', T('predictHelp'));
      lab.setAttribute('for', id);
      sec.appendChild(lab);
      const ta = el('textarea', 'wr-predict-input');
      ta.id = id;
      ta.rows = 2;
      ta.maxLength = PREDICT_MAX;
      ta.placeholder = T('predictPlaceholder');
      ta.value = memo[memoKey] || '';
      ta.addEventListener('input', () => { memo[memoKey] = ta.value.slice(0, PREDICT_MAX); });
      sec.appendChild(ta);
      sec.appendChild(el('p', 'wr-note', T('predictNote')));
      box.appendChild(sec);
    }

    const foot = el('div', 'wr-foot');
    const need = el('p', 'wr-need', T('needAll'));
    const submit = button('nm-st-btn nm-st-primary wr-submit');
    submit.appendChild(doc.createTextNode(T('submit')));
    submit.addEventListener('click', doSubmit);
    foot.appendChild(need);
    foot.appendChild(submit);
    box.appendChild(foot);
    host.appendChild(box);

    /* ---------- 상태 ---------- */
    function complete() {
      const allStops = Object.keys(stops).every(wid => stops[wid].every(Boolean));
      const anyNow = !choices.length || Object.keys(picked).length > 0;
      return allStops && anyNow;
    }
    function answerNow() {
      const a = {};
      if (words.length) { a.order = {}; words.forEach(w => { a.order[w.id] = stops[w.id].slice(); }); }
      if (choices.length) a.now = Object.keys(picked).sort();
      return a;
    }
    function render() {
      words.forEach((w, wi) => {
        const placed = {};
        stops[w.id].forEach((id, k) => {
          const b = nodes.stop[w.id][k];
          if (id) placed[id] = true;
          Array.from(b.childNodes).forEach(n => { if (!n.classList || !n.classList.contains('wr-sym')) n.remove(); });
          const first = b.firstChild;
          if (id) b.insertBefore(yetSpan(chipText[id]), first);
          else b.insertBefore(el('span', 'wr-stop-num', String(k + 1)), first).setAttribute('aria-hidden', 'true');
          b.classList.toggle('is-filled', !!id);
          b.setAttribute('data-chip', id || '');
          b.setAttribute('aria-label', T('stopLabel', { word: wordName(w, wi), n: k + 1, value: id ? modern(chipText[id]) : T('empty') }));
          b.disabled = locked;
        });
        let left = 0;
        pools[w.id].forEach(ch => {
          const b = nodes.chip[ch.id];
          b.hidden = !!placed[ch.id];
          if (!placed[ch.id]) left++;
          b.disabled = locked;
        });
        nodes.poolEmpty[w.id].hidden = left > 0;
      });
      choices.forEach(c => {
        const b = nodes.choice[c.id], on = !!picked[c.id];
        b.setAttribute('aria-pressed', String(on));
        b.querySelector('.wr-choice-sym').textContent = on ? SYM.on : SYM.off;
        b.disabled = locked;
      });
      const ok = complete();
      submit.disabled = locked || !ok;
      need.hidden = locked || ok;
    }
    function focusNode(n) { try { if (n && !n.hidden && !n.disabled) n.focus(); } catch (e) { /* 초점 실패는 무시 */ } }
    function clearStopMarks(wid, k) { const b = nodes.stop[wid][k]; setMark(b, 'wrong', false); setMark(b, 'answer', false); }
    function clickChip(wid, chipId) {
      if (locked) return;
      const k = stops[wid].indexOf(null);
      if (k < 0 || stops[wid].indexOf(chipId) >= 0) return;
      stops[wid][k] = chipId;
      clearStopMarks(wid, k);
      render();
      const next = pools[wid].map(c => nodes.chip[c.id]).filter(b => !b.hidden)[0];
      focusNode(next || nodes.stop[wid][k]);
    }
    function clickStop(wid, k) {
      if (locked) return;
      const id = stops[wid][k];
      if (!id) return;
      stops[wid][k] = null;
      clearStopMarks(wid, k);
      render();
      focusNode(nodes.chip[id]);
    }
    function clickChoice(cid) {
      if (locked) return;
      if (picked[cid]) delete picked[cid]; else picked[cid] = true;
      setMark(nodes.choice[cid], 'wrong', false);
      if (missingP) { missingP.hidden = true; nowSec.classList.remove('is-missing'); }
      render();
    }
    function clearAll(kind) { box.querySelectorAll('.is-' + kind).forEach(n => setMark(n, kind, false)); }
    function doSubmit() {
      if (locked || !complete()) return;
      signalled = false;
      o.onSubmit(answerNow());
      // 진행기는 틀리면 같은 자리에서 showWrong 을 부른다. 아무 신호가 없으면 맞은 것 — 더 고치지 못하게 닫는다.
      if (!signalled) {
        locked = true;
        box.classList.add('is-locked', 'is-done');
        clearAll('wrong'); clearAll('hint');
        render();
      }
    }

    render();

    return {
      showWrong(info) {
        signalled = true;
        if (!o.readOnly) { locked = false; box.classList.remove('is-locked', 'is-done'); }
        clearAll('wrong');
        const w = (info && info.wrong) || {};
        Object.keys(w.order || {}).forEach(wid => list(w.order[wid]).forEach(n => setMark(nodes.stop[wid] && nodes.stop[wid][n - 1], 'wrong', true)));
        const nw = w.now || {};
        list(nw.extra).forEach(id => setMark(nodes.choice[id], 'wrong', true));
        if (missingP) {
          const miss = (nw.missing | 0) > 0;
          missingP.hidden = !miss;
          nowSec.classList.toggle('is-missing', miss);
        }
        render();
      },
      showHint(step, target) {
        if (step < 2) return;
        (Array.isArray(target) ? target : [target]).forEach(t => {
          if (t == null) return;
          box.querySelectorAll('[data-target]').forEach(n => { if (n.getAttribute('data-target') === String(t)) setMark(n, 'hint', true); });
        });
      },
      showAnswer(answer) {
        signalled = true;
        const a = answer || {};
        clearAll('wrong'); clearAll('hint');
        Object.keys(a.order || {}).forEach(wid => {
          if (!stops[wid]) return;
          list(a.order[wid]).forEach((id, k) => {
            if (k < stops[wid].length && Object.prototype.hasOwnProperty.call(chipText, id)) { stops[wid][k] = id; setMark(nodes.stop[wid][k], 'answer', true); }
          });
        });
        if (Array.isArray(a.now)) {
          Object.keys(picked).forEach(k => delete picked[k]);
          a.now.forEach(id => { if (nodes.choice[id]) { picked[id] = true; setMark(nodes.choice[id], 'answer', true); } });
          if (missingP) { missingP.hidden = true; nowSec.classList.remove('is-missing'); }
        }
        locked = true;
        box.classList.add('is-locked', 'is-answer');
        render();
        submit.hidden = true;
      },
      destroy() { box.remove(); }
    };
  }

  NM.gimmicks.register(NAME, { mount, check, logic: { check, seededShuffle, chipsOf, PREDICT_MAX } });
})(typeof window !== 'undefined' ? window : globalThis);
