'use strict';
/*
 * NM.ui.stageTranslate — 통역 고르기 단계. 모든 말을 해독한 뒤 통역할 사람에게 가면, 다 된 통역 대사를 틀기 전에
 * 학생이 해독한 뜻으로 통역 문장을 직접 고른다(1~2 고르기). 장면 데이터 scene.translate.choose 가 없으면 쓰지 않는다
 * (진행기가 예전처럼 translate.lines 만 튼다).
 *
 * ■ 장면 데이터 (scene.translate 에 덧붙임)
 *   choose:   [{ id, item?(근거가 되는 해독 항목 id — 점검용), prompt,
 *                options: [{ id, text, part?(통역 문장 빈칸에 들어갈 말, 없으면 text), correct, reaction?: [줄] }] }]
 *             고르기마다 정답 1개. 틀린 고르기의 reaction 은 그 통역을 들은 사람의 반응(짧게, 2~3줄).
 *   compose?: '빈칸 {?} 이 고르기 수만큼 든 통역 문장'  — 고른 말이 빈칸에 차례로 채워져 보인다(정오는 알리지 않음).
 *   chooseAt?: n  translate.lines 의 앞 n 줄(장면 설정)을 먼저 틀고 고르기를 연다. 나머지 줄은 바르게 고른 뒤 튼다. 기본 0.
 *
 * ■ 흐름
 *   앞 줄 → 고르기 창 → '이렇게 통역하기' → 모두 맞으면 창을 닫고 뒤 줄(다 된 통역·반응) → true
 *                                     → 틀린 고르기가 있으면 첫 번째 틀린 고르기의 반응 대사 → 창으로 돌아와 그 고르기만
 *                                       '다시 골라 보세요'(엉뚱했던 통역 카드는 고를 수 없게 표시). 벌점 없음, 몇 번이든.
 *   고르기 창을 ×·Esc 로 닫으면 false(진행기가 탐색으로 돌려보내고, 다시 말을 걸면 처음부터).
 *   교사 모드: '정답과 풀이 바로 보기' — 정답 카드에 ○ 를 달고 골라 둔다(누르면 바로 통역).
 *   기록(선택): env.record({ id, firstTry, tries, first:[처음 고른 카드], picks:[마지막 고른 카드] }) — store.recordInterp.
 *
 * ■ 공개 API
 *   has(tr)                    고르기 단계가 있는가(올바른 고르기가 하나 이상)
 *   run(env) → Promise<bool>   env = { tr, teacher, fill, sfx, alive(), dialog(lines, opts), record?(r), memo?({}) }
 *                              memo: 장면 한 판 동안 같은 객체 — 창을 닫았다 열어도 첫 시도·시도 수·엉뚱했던 카드가 이어진다
 *   logic: { steps(tr), chooseAt(tr), judge(steps, picks), compose(template, steps, picks), optionOf(step, id) }  (DOM 없음)
 *   test:  { state() }         점검용: 열린 고르기 창의 { open, picks, tried, again, tries }
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js, ui/stage-window.js, ui/rulecard.js, ui/dialog.js(env.dialog 로), data/text-stage.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const BLANK = '{?}';
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);

  /* ---------- 순수 부분 ---------- */
  function okOption(o) { return !!o && typeof o.id === 'string' && o.id && typeof o.text === 'string' && o.text; }
  function steps(tr) {
    const raw = tr && Array.isArray(tr.choose) ? tr.choose : [];
    return raw.filter(s => s && typeof s.id === 'string' && s.id && typeof s.prompt === 'string' &&
      list(s.options).filter(okOption).length >= 2 && list(s.options).filter(o => okOption(o) && o.correct === true).length === 1)
      .map(s => Object.assign({}, s, { options: list(s.options).filter(okOption) }));
  }
  const has = (tr) => steps(tr).length > 0;
  function chooseAt(tr) {
    const n = list(tr && tr.lines).length;
    const at = tr && Number.isInteger(tr.chooseAt) ? tr.chooseAt : 0;
    return Math.max(0, Math.min(n, at));
  }
  const optionOf = (step, id) => list(step && step.options).filter(o => o.id === id)[0] || null;
  // picks: { 고르기 id: 카드 id } → { correct, wrong: [틀렸거나 안 고른 고르기 id](차례대로), missing: [안 고른 고르기 id] }
  function judge(st, picks) {
    const p = picks || {};
    const wrong = [], missing = [];
    list(st).forEach(s => {
      const o = optionOf(s, p[s.id]);
      if (!o) { missing.push(s.id); wrong.push(s.id); } else if (o.correct !== true) wrong.push(s.id);
    });
    return { correct: list(st).length > 0 && wrong.length === 0, wrong, missing };
  }
  // 통역 문장 조각: [{ text } | { blank: 고르기 id, text: 고른 말 또는 null }]. 빈칸이 고르기보다 많으면 남는 빈칸은 버린다.
  function compose(template, st, picks) {
    if (typeof template !== 'string' || !template) return [];
    const p = picks || {};
    const parts = template.split(BLANK);
    const out = [];
    parts.forEach((t, i) => {
      if (t) out.push({ text: t });
      if (i < parts.length - 1 && st[i]) {
        const o = optionOf(st[i], p[st[i].id]);
        out.push({ blank: st[i].id, text: o ? (typeof o.part === 'string' && o.part ? o.part : o.text) : null });
      }
    });
    return out;
  }

  /* ---------- 화면 ---------- */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function rich(env, text, cls) {
    const s = el('span', cls || 'nm-st-text');
    s.appendChild(YB().build(env.fill ? env.fill(text) : String(text), { solved: [] }));
    return s;
  }
  function plain(text) {
    try { return NM.core.yet.render(String(text == null ? '' : text), { bangjeom: false, ruby: 'base' }); } catch (e) { return String(text); }
  }

  let live = null; // 점검용

  function choose(env) {
    const tr = env.tr || {};
    const st = steps(tr);
    // memo: 진행기가 장면 한 판 동안 들고 있는 칸 — 창을 닫았다 다시 열어도 첫 시도·시도 수·엉뚱했던 카드가 이어진다
    const memo = env.memo && typeof env.memo === 'object' ? env.memo : {};
    if (!memo.tried) memo.tried = {};
    if (!Number.isInteger(memo.tries)) memo.tries = 0;
    const picks = {}, tried = memo.tried;
    st.forEach(s => { picks[s.id] = null; if (!Array.isArray(tried[s.id])) tried[s.id] = []; });
    let again = null, teacherShown = false, busy = false;
    let w = null;
    const sfx = (n) => { try { if (typeof env.sfx === 'function') env.sfx(n); } catch (e) { /* 무시 */ } };

    return new Promise(resolve => {
      let result = false;
      live = { get open() { return !!w && w.isOpen(); }, picks, tried, get again() { return again; }, get tries() { return memo.tries; } };

      function render() {
        const body = w.body, foot = w.foot;
        body.textContent = ''; foot.textContent = '';
        body.appendChild(el('p', 'nm-st-interp-lead', TX().t('interp.lead')));
        // 통역 문장 미리 보기
        const parts = compose(tr.compose, st, picks);
        if (parts.length) {
          const box = el('div', 'nm-st-interp-preview');
          box.appendChild(el('p', 'nm-st-interp-preview-label', TX().t('interp.preview')));
          const sent = el('p', 'nm-st-interp-sentence');
          sent.setAttribute('aria-live', 'polite');
          parts.forEach(pt => {
            if (pt.blank === undefined) { sent.appendChild(rich(env, pt.text)); return; }
            const b = el('span', 'nm-rulecard-blank nm-st-interp-blank');
            b.setAttribute('data-step', pt.blank);
            if (pt.text) { b.classList.add('is-filled'); b.appendChild(rich(env, pt.text)); }
            else b.appendChild(el('span', 'nm-rulecard-placeholder', TX().t('blank')));
            sent.appendChild(b);
          });
          box.appendChild(sent);
          body.appendChild(box);
        }
        // 고르기
        st.forEach((s, i) => {
          const sec = el('section', 'nm-st-interp-step');
          sec.setAttribute('data-step', s.id);
          if (again === s.id) sec.classList.add('is-again');
          const q = el('p', 'nm-st-interp-q');
          q.id = 'nm-st-interp-q-' + i;
          if (st.length > 1) q.appendChild(el('span', 'nm-st-interp-no', TX().t('interp.stepNo', { n: i + 1, total: st.length })));
          q.appendChild(rich(env, s.prompt));
          sec.appendChild(q);
          if (again === s.id) sec.appendChild(el('p', 'nm-st-interp-again', TX().t('interp.again')));
          const comp = NM.ui.rulecard.cards({
            cards: s.options.map(o => ({ id: o.id, text: o.text })), selected: picks[s.id], fill: env.fill, solved: [],
            label: plain(s.prompt),
            onSelect(id) {
              if (busy || tried[s.id].indexOf(id) >= 0) return;
              picks[s.id] = id;
              if (again === s.id) again = null;
              render();
              const b = w.body.querySelector('.nm-st-interp-step[data-step="' + s.id + '"] .nm-st-card[data-card="' + id + '"]');
              if (b) w.focus(b);
            }
          });
          comp.el.setAttribute('aria-labelledby', q.id);
          tried[s.id].forEach(id => {
            const b = comp.el.querySelector('.nm-st-card[data-card="' + id + '"]');
            if (!b) return;
            b.disabled = true;
            b.classList.add('is-tried');
            b.appendChild(el('span', 'nm-st-card-tag nm-st-interp-tried', TX().t('interp.tried')));
          });
          if (teacherShown) { const r = s.options.filter(o => o.correct === true)[0]; if (r) comp.reveal(r.id); }
          sec.appendChild(comp.el);
          body.appendChild(sec);
        });
        if (teacherShown) body.appendChild(el('p', 'nm-st-note nm-st-teacher-view', TX().t('teacherNote')));
        // 단추
        if (env.teacher && !teacherShown) {
          const tb = el('button', 'nm-st-btn nm-st-teacher-answer', TX().t('btn.teacherAnswer'));
          tb.type = 'button';
          tb.addEventListener('click', onTeacher);
          foot.appendChild(tb);
        }
        const ready = st.every(s => !!picks[s.id]);
        if (!ready) foot.appendChild(el('p', 'nm-st-note nm-st-interp-need', TX().t('interp.pickAll')));
        const db = el('button', 'nm-st-btn nm-st-primary nm-st-interp-deliver', TX().t('interp.deliver'));
        db.type = 'button';
        db.disabled = !ready || busy;
        db.addEventListener('click', onDeliver);
        foot.appendChild(db);
      }

      function onTeacher() {
        teacherShown = true;
        st.forEach(s => { const r = s.options.filter(o => o.correct === true)[0]; if (r) picks[s.id] = r.id; });
        again = null;
        render();
        const db = w.foot.querySelector('.nm-st-interp-deliver');
        if (db) w.focus(db);
      }

      function onDeliver() {
        if (busy) return;
        const j = judge(st, picks);
        if (j.missing.length) return;
        memo.tries++;
        const chosen = st.map(s => picks[s.id]);
        if (!memo.first) { memo.first = chosen.slice(); memo.firstTry = j.correct && !teacherShown; }
        if (j.correct) {
          sfx('confirm');
          if (typeof env.record === 'function') {
            try { env.record({ id: typeof tr.id === 'string' ? tr.id : null, firstTry: memo.firstTry, tries: memo.tries, first: memo.first, picks: chosen }); }
            catch (e) { NM.reportError('stage.interp.record', e); }
          }
          result = true;
          w.close('done');
          return;
        }
        const sid = j.wrong[0];
        const step = st.filter(s => s.id === sid)[0];
        const opt = optionOf(step, picks[sid]);
        if (tried[sid].indexOf(opt.id) < 0) tried[sid].push(opt.id);
        picks[sid] = null;
        again = sid;
        busy = true;
        sfx('misread');
        render();
        const note = el('p', 'nm-dlg-note', TX().t('interp.misNote'));
        Promise.resolve(env.dialog(list(opt.reaction), { kind: 'interp-react', title: TX().t('interp.react'), extras: [note] }))
          .catch(e => NM.reportError('stage.interp.react', e))
          .then(() => {
            busy = false;
            if (!w.isOpen() || (typeof env.alive === 'function' && !env.alive())) return;
            render();
            const b = w.body.querySelector('.nm-st-interp-step[data-step="' + sid + '"] .nm-st-card:not([disabled])');
            w.focus(b || undefined);
          });
      }

      w = NM.ui.stageWindow.open({
        win: 'interp', title: TX().t('interp.title'), className: 'nm-st-interpwin',
        build(win) { w = win; render(); },
        onClose() { live = null; resolve(result); }
      });
    });
  }

  function run(env) {
    const tr = (env && env.tr) || {};
    const lines = list(tr.lines);
    const at = chooseAt(tr);
    const alive = () => (typeof env.alive === 'function' ? env.alive() : true);
    const title = TX().t('win.translate');
    return Promise.resolve(env.dialog(lines.slice(0, at), { kind: 'translate', title }))
      .then(() => (alive() ? choose(env) : false))
      .then(ok => {
        if (!ok || !alive()) return false;
        return Promise.resolve(env.dialog(lines.slice(at), { kind: 'translate', title })).then(() => true);
      });
  }

  NM.ui.stageTranslate = {
    has, run,
    logic: { steps, chooseAt, judge, compose, optionOf, BLANK },
    test: { state: () => (live ? { open: live.open, picks: Object.assign({}, live.picks), tried: JSON.parse(JSON.stringify(live.tried)), again: live.again, tries: live.tries } : null) }
  };
})(typeof window !== 'undefined' ? window : globalThis);
