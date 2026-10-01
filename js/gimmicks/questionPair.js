'use strict';
/*
 * 기믹 G7 'questionPair' — 질문 짝 맞추기 (장면 8 묻는 말, 고2~3). 장면 데이터 설명: js/gimmicks/README-questionPair.md
 *   물음(原文 블록)마다 ① 짝이 되는 대답 고르기(config.answers 가 있을 때) ② 갈래 가르기(판정 yesno / 설명 wh / 2인칭 주어 second)
 *   ③ 물음을 끝맺는 어미 고르기. 한 번에 제출한다.
 *   틀리면 틀린 고르기 묶음에 ✕ 와 is-wrong. 2번째 틀림(showHint 2): 단서 낱말(의문사·2인칭 주어, 판정 의문이면 어미)을 빛낸다.
 *   정답(showAnswer): 정답 칸에 ○ 와 '정답' 이름표, 모두 잠금.
 * answer = { <물음 id>: { pair?: <대답 id>, kind: 'yesno'|'wh'|'second', ending: <어미 id> } }
 * check 는 item.answer 에 적힌 칸만 본다. 틀린 칸: { wrong: { <물음 id>: ['pair'|'kind'|'ending', …] } }
 * 필요: core/ns.js, core/yet.js, gimmicks/g789-origwords.js, data/text-g-questionPair.js, ui/stage-gimmick.js
 */
(function (root) {
  const NM = root.NM;
  const K = () => NM.g789;
  const KINDS = ['yesno', 'wh', 'second'];
  const FIELDS = ['pair', 'kind', 'ending'];
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);
  const CIRCLED = (n) => String.fromCharCode(0x2460 + n);

  function check(answer, item) {
    const want = (item && item.answer) || {};
    const got = answer && typeof answer === 'object' ? answer : {};
    const wrong = {};
    Object.keys(want).forEach(q => {
      const w = want[q] || {};
      const g = got[q] || {};
      FIELDS.forEach(f => {
        if (w[f] === undefined) return;
        if (g[f] !== w[f]) (wrong[q] = wrong[q] || []).push(f);
      });
    });
    return Object.keys(wrong).length ? { correct: false, wrong } : true;
  }

  function endingOptions(config, t) {
    if (list(config.endings).length) return list(config.endings).map(e => ({ id: e.id, text: e.text }));
    const T = NM.data.TEXT && NM.data.TEXT.g && NM.data.TEXT.g.questionPair;
    return Object.keys((T && T.endings) || {}).map(id => ({ id, plain: t('endings.' + id) }));
  }

  function mount(el, o) {
    const G = K();
    const doc = o.document || root.document;
    const t = G.textOf('questionPair', o.level);
    const cfg = o.config || {};
    const questions = list(cfg.questions).filter(q => typeof q.id === 'string');
    const answers = list(cfg.answers).filter(a => typeof a.id === 'string');
    const endings = endingOptions(cfg, t);
    const E = (tag, cls, text) => G.el(doc, tag, cls, text);
    let locked = !!o.readOnly;
    let lastWrong = {};

    const box = E('div', 'qp');
    box.appendChild(E('p', 'qp-howto', t('howto')));

    // 대답 카드
    const ansLabel = {};
    if (answers.length) {
      const sec = E('section', 'qp-answers');
      sec.appendChild(E('h3', 'qp-h', t('answersHead')));
      answers.forEach((a, i) => {
        ansLabel[a.id] = CIRCLED(i);
        const card = E('div', 'qp-answer');
        card.setAttribute('data-answer', a.id);
        const head = E('span', 'qp-answer-no', CIRCLED(i));
        head.setAttribute('aria-label', t('answerNo', { n: i + 1 }));
        card.appendChild(head);
        if (a.who) card.appendChild(G.richSpan(o, a.who, 'qp-who'));
        if (a.orig) list([].concat(a.orig)).forEach(b => card.appendChild(G.origView(o, b, { asSpans: true, words: [], noteNoBangjeom: o.text('marks.noBangjeom') }).el));
        if (a.text) card.appendChild(G.richSpan(o, a.text, 'qp-answer-text'));
        sec.appendChild(card);
      });
      box.appendChild(sec);
    }

    const rows = {};
    questions.forEach((q, qi) => {
      const card = E('section', 'qp-q');
      card.setAttribute('data-q', q.id);
      card.appendChild(E('h3', 'qp-h', t('question', { n: qi + 1 })));
      if (q.who) card.appendChild(G.richSpan(o, q.who, 'qp-who'));
      if (q.lead) card.appendChild(G.richSpan(o, q.lead, 'qp-lead'));
      const wordEls = {};
      list([].concat(q.orig)).forEach(b => {
        const v = G.origView(o, b, { asSpans: true, words: list(q.words), noteNoBangjeom: o.text('marks.noBangjeom') });
        Object.assign(wordEls, v.words);
        card.appendChild(v.el);
      });
      const r = { card, wordEls, groups: {} };
      const step = (field, label, options) => {
        const wrap = E('div', 'qp-step');
        wrap.setAttribute('data-field', field);
        wrap.appendChild(E('p', 'qp-step-label', label));
        const g = G.radios(o, { label, options, onChange: () => {
          if (!Object.keys(r.groups).some(k => r.groups[k].el.classList.contains('is-wrong'))) card.classList.remove('is-wrong');
          refresh();
        } });
        wrap.appendChild(g.el);
        card.appendChild(wrap);
        r.groups[field] = g;
      };
      if (answers.length) step('pair', t('stepPair'), answers.map(a => ({ id: a.id, plain: ansLabel[a.id] })));
      step('kind', t('stepKind'), KINDS.map(k => ({ id: k, plain: t('kinds.' + k) + ' — ' + t('kindNotes.' + k) })));
      step('ending', t('stepEnding'), endings);
      rows[q.id] = r;
      box.appendChild(card);
    });

    const foot = E('div', 'qp-foot');
    const note = E('p', 'qp-note');
    note.setAttribute('aria-live', 'polite');
    const submit = E('button', 'nm-st-btn nm-st-primary qp-submit', t('submit'));
    submit.type = 'button';
    foot.appendChild(note);
    foot.appendChild(submit);
    box.appendChild(foot);
    el.appendChild(box);

    function collect() {
      const out = {};
      Object.keys(rows).forEach(q => {
        const a = {};
        Object.keys(rows[q].groups).forEach(f => { a[f] = rows[q].groups[f].get(); });
        out[q] = a;
      });
      return out;
    }
    function complete() {
      return Object.keys(rows).every(q => Object.keys(rows[q].groups).every(f => rows[q].groups[f].get() !== null));
    }
    function refresh() {
      if (locked) { submit.disabled = true; submit.hidden = true; return; }
      const ok = complete();
      submit.disabled = !ok;
      if (!ok) note.textContent = t('needAll');
      else if (note.textContent === t('needAll')) note.textContent = '';
    }
    function lockAll() {
      locked = true;
      Object.keys(rows).forEach(q => Object.keys(rows[q].groups).forEach(f => rows[q].groups[f].disable(true)));
      refresh();
    }
    // 진행기는 맞은 제출을 기믹에 알리지 않는다. 틀리면 onSubmit 안에서 바로 showWrong 이 불리므로,
    // 그것 없이 돌아오면 끝난 것으로 보고 잠근다(틀린 제출이면 잠그지 않는다).
    let wrongSeen = false;
    submit.addEventListener('click', () => {
      if (locked || !complete()) return;
      wrongSeen = false;
      o.onSubmit(collect());
      if (!wrongSeen) lockAll();
    });

    function emphasize(qids) {
      qids.forEach(qid => {
        const r = rows[qid];
        const q = questions.filter(x => x.id === qid)[0];
        if (!r || !q || r.card.classList.contains('is-hint')) return;
        r.card.classList.add('is-hint');
        list(q.cue).forEach(w => { if (r.wordEls[w]) { r.wordEls[w].classList.add('is-cue'); r.wordEls[w].setAttribute('data-cue', '1'); } });
        list(q.ending).forEach(w => { if (r.wordEls[w]) { r.wordEls[w].classList.add('is-ending'); r.wordEls[w].setAttribute('data-ending', '1'); } });
        const kind = q.cueKind === 'wh' || q.cueKind === 'second' ? q.cueKind : (list(q.cue).length ? null : 'none');
        const tags = E('p', 'qp-cue-tags');
        if (kind) tags.appendChild(E('span', 'qp-cue-tag', '◆ ' + t('cue.' + kind)));
        if (list(q.ending).length) tags.appendChild(E('span', 'qp-cue-tag qp-cue-tag-end', '◇ ' + t('endingTag')));
        if (tags.firstChild) r.card.insertBefore(tags, r.card.querySelector('.qp-step'));
      });
    }

    if (locked) lockAll(); else refresh();

    return {
      showWrong(info) {
        const w = (info && info.wrong && typeof info.wrong === 'object') ? info.wrong : {};
        lastWrong = w;
        wrongSeen = true;
        Object.keys(rows).forEach(q => {
          const r = rows[q];
          const bad = list(w[q]);
          r.card.classList.toggle('is-wrong', bad.length > 0);
          Object.keys(r.groups).forEach(f => { if (bad.indexOf(f) >= 0) r.groups[f].markWrong(); else r.groups[f].clearMarks(); });
        });
        note.textContent = t('wrongNote');
      },
      showHint(step, target) {
        if (step < 2) return;
        let ids;
        if (typeof target === 'string' && rows[target]) ids = [target];
        else ids = Object.keys(lastWrong).filter(q => rows[q]);
        if (!ids.length) ids = Object.keys(rows);
        emphasize(ids);
        note.textContent = t('hintNote');
      },
      showAnswer(answer) {
        const a = answer && typeof answer === 'object' ? answer : {};
        Object.keys(rows).forEach(q => {
          const r = rows[q];
          const want = a[q] || {};
          Object.keys(r.groups).forEach(f => {
            if (want[f] === undefined) return;
            r.groups[f].set(want[f]);
            r.groups[f].clearMarks();
            r.groups[f].markAnswer(want[f], t('answerTag'));
          });
          r.card.classList.remove('is-wrong');
        });
        emphasize(Object.keys(rows));
        note.textContent = '';
        lockAll();
      },
      destroy() { box.remove(); }
    };
  }

  NM.gimmicks.register('questionPair', { mount, check });
})(typeof window !== 'undefined' ? window : globalThis);
