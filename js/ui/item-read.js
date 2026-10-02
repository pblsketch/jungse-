'use strict';
/*
 * NM.ui.itemRead — 해독 항목 창 (spec §5-2). 판정·저장은 진행기의 env(→ store → NM.core.rules)로만 한다.
 *   open(env, itemId) → 창
 * 창의 내용(상태에 따라 다시 그림):
 *   - 항목 이름표(item.label, 옛한글 DOM)와 물음(item.prompt 또는 TEXT readPrompt / 규칙 항목은 rulePrompt)
 *   - 살핀 맥락 수 'n / 2'와 살핀 곳 칩(펼치면 그곳의 원문 카드·대사를 창 안에서 다시 본다 — env.clue).
 *     서로 다른 맥락이 2곳 이상이어야 확정 단추가 열린다.
 *   - 카드: item.sentence 가 있으면 규칙 카드 문장 완성 부품, 없으면 카드 묶음. 확정 전에는 정오를 알리지 않는다.
 *   - 오답 확정 → 그 카드의 오해 장면(item.misread[cardId]) 재생 → 창으로 돌아와 '왜 아닌지'(card.why)와 도움.
 *     도움 1: 선배의 힌트(hints[0]) / 2: 단서 맥락(hints[1]) 빛남 — 지도는 진행기가 NM.engine.highlight 로 /
 *     3: 정답 카드 ○ + 풀이 → confirmedByHelp.
 *   - 정답 확정 → 풀이, 규칙 항목이면 규칙 카드가 수첩에 붙었다는 표시(store 가 같은 쓰기로 붙인다).
 *   - '실마리 더 보기'(S03): 틀리지 않고도 도움을 한 단계씩 연다(env.requestHelp → rules.requestHelp; 오답 수는 그대로).
 *   - 카드는 env.cardOrder(item) 순서로 보인다(기록마다 고정된 순열, S01).
 *   - 교사 모드: '정답·풀이 바로 보기' — 창에만 보이고 기록은 바꾸지 않는다.
 * env(진행기가 줌): { scene, teacher, rec(id), choose(id, cardId), confirm(id), dialog(lines, opts), contextLabel(id),
 *                    ruleCard(id), fill(text), solved(), sfx(name), onItemClosed(id),
 *                    requestHelp(id), cardOrder(item), clue(contextId) → 그 맥락 다시 보기 DOM }
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js, ui/marker.js, ui/stage-window.js, ui/rulecard.js, ui/dialog.js, core/rules.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const MK = () => NM.ui.marker;
  const lastWrong = {}; // 이번 접속에서 마지막으로 오답 확정한 카드(왜 아닌지 표시용)

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function rich(env, text, cls) {
    const s = el('span', cls || 'nm-st-text');
    s.appendChild(YB().build(env.fill(text), { solved: [] }));
    return s;
  }
  const isDone = (rec) => NM.core.rules.isItemDone(rec);
  // 창 제목: 이 항목에서 할 일(item.label, 옛한글 DOM). 이름표가 없으면 창 갈래 이름.
  function itemTitle(env, item) {
    if (!item.label) return TX().t('win.item');
    const s = el('span', 'nm-st-item-title nm-yet');
    s.appendChild(YB().build(env.fill(item.label), {}));
    return s;
  }

  function open(env, itemId) {
    const item = (env.scene.items || []).filter(i => i.id === itemId)[0];
    if (!item) { NM.reportError('stage.item', 'unknown item: ' + itemId); return null; }
    const right = (item.cards || []).filter(c => c && c.correct === true)[0] || null;
    // 보이는 카드 순서: 기록마다 고정된 순열(S01 — 데이터는 정답 카드를 맨 앞에 적는다). 다시 열어도·새로 고쳐도 같다.
    const shown = typeof env.cardOrder === 'function' ? env.cardOrder(item) : (item.cards || []);
    let teacherShown = false;
    let w = null;
    const openClues = new Set(); // 펼친 '살핀 곳' 칩(맥락 id)

    function render() {
      const rec = env.rec(itemId) || NM.core.rules.newItemRecord('read');
      const done = isDone(rec);
      const body = w.body, foot = w.foot;
      body.textContent = ''; foot.textContent = '';

      // 항목 이름표(item.label)는 창 제목에 있다(지금 할 일). 본문은 물음부터.
      const prompt = item.prompt ? item.prompt : TX().t(item.sentence ? 'rulePrompt' : 'readPrompt');
      body.appendChild(rich(env, prompt, 'nm-st-prompt'));

      // 살핀 맥락
      const seen = Array.isArray(rec.seenContexts) ? rec.seenContexts : [];
      const seenBox = el('div', 'nm-st-seenbox');
      const count = el('p', 'nm-st-seen', TX().t('seen', { n: seen.length, need: 2 }));
      seenBox.appendChild(count);
      if (seen.length) seenBox.appendChild(clues(seen));
      if (!done) {
        let status;
        if (rec.state === 'misread') status = TX().t('pickAgain');
        else if (seen.length < 2) status = TX().t('needMore');
        else status = TX().t('canConfirm');
        seenBox.appendChild(el('p', 'nm-st-status', status));
      }
      body.appendChild(seenBox);

      // 카드
      const opts = {
        cards: shown, sentence: item.sentence, selected: done ? null : rec.guess, disabled: done || rec.state === 'unseen',
        fill: env.fill, solved: [],
        onSelect(cardId) {
          const r = env.choose(itemId, cardId);
          if (!r || !r.ok) NM.reportError('stage.item.choose', r && r.reason);
          render();
          const b = w.body.querySelector('.nm-st-card[data-card="' + cardId + '"]');
          if (b) b.focus();
        }
      };
      const comp = item.sentence ? NM.ui.rulecard.build(opts) : NM.ui.rulecard.cards(opts);
      body.appendChild(comp.el);
      if (!done && rec.guess == null) body.appendChild(el('p', 'nm-st-note', TX().t('pickCard')));

      // 왜 아닌지 (방금 오답 확정한 카드)
      const lw = lastWrong[itemId];
      const lwCard = lw ? (item.cards || []).filter(c => c.id === lw)[0] : null;
      if (lwCard && lwCard.why && rec.wrongs > 0) {
        const why = el('div', 'nm-st-why');
        why.appendChild(el('span', 'nm-st-why-label', TX().t('why')));
        why.appendChild(document.createTextNode(' '));
        why.appendChild(rich(env, lwCard.text, 'nm-st-why-card'));
        why.appendChild(document.createTextNode(' — '));
        why.appendChild(rich(env, lwCard.why));
        body.appendChild(why);
      }

      // 도움
      const hv = NM.core.rules.helpView(item, rec);
      if (hv.step >= 1) {
        const help = el('div', 'nm-st-help');
        help.setAttribute('data-step', String(hv.step));
        if (hv.hint != null) {
          const h = el('p', 'nm-st-hint');
          h.appendChild(el('span', 'nm-st-hint-label', TX().t('hint')));
          h.appendChild(document.createTextNode(' '));
          h.appendChild(rich(env, hv.hint));
          help.appendChild(h);
        }
        if (hv.glow != null && !done) help.appendChild(el('p', 'nm-st-glow', TX().t('glow')));
        if (hv.step >= 3) appendAnswer(help);
        body.appendChild(help);
      }

      // 결과
      if (done) {
        const res = el('div', 'nm-st-result');
        res.setAttribute('data-result', rec.state === 'confirmed' ? 'correct' : 'help');
        res.appendChild(el('p', 'nm-st-result-text', rec.state === 'confirmed' ? TX().t('correct') : TX().t('byHelp')));
        // 정답 확정이면 풀이를 여기서, 도움 확정이면 도움 칸(정답·풀이)에 이미 있다
        if (rec.state === 'confirmed') res.appendChild(MK().card({ kind: 'explain', text: item.explain, fill: env.fill }));
        // 규칙 카드는 확정 방식과 상관없이 확정하는 순간 수첩에 붙는다(store 가 같은 쓰기로 붙임)
        if (item.ruleCard) {
          const rc = env.ruleCard(item.ruleCard);
          const add = el('div', 'nm-st-rule-added');
          add.setAttribute('data-rule', item.ruleCard);
          add.appendChild(el('p', 'nm-st-rule-added-text', TX().t('ruleAdded')));
          if (rc && rc.name) add.appendChild(rich(env, rc.name, 'nm-st-rule-name'));
          if (rc && rc.text) { const p = el('p', 'nm-st-rule-text'); p.appendChild(rich(env, rc.text)); add.appendChild(p); }
          res.appendChild(add);
        }
        body.appendChild(res);
        if (right) comp.reveal(right.id);
        if (item.sentence && right && comp.setSelected) comp.setSelected(right.id);
      } else if (teacherShown) {
        const tv = el('div', 'nm-st-teacher-view');
        tv.appendChild(el('p', 'nm-st-note', TX().t('teacherNote')));
        appendAnswer(tv);
        body.appendChild(tv);
        if (right) comp.reveal(right.id);
      }

      // 단추
      if (env.teacher && !done && !teacherShown) {
        const tb = el('button', 'nm-st-btn nm-st-teacher-answer', TX().t('btn.teacherAnswer'));
        tb.type = 'button';
        tb.addEventListener('click', () => { teacherShown = true; render(); w.focus(); });
        foot.appendChild(tb);
      }
      // 실마리 더 보기(S03): 틀리지 않고도 도움을 한 단계씩 연다. 마지막 단계는 정답·풀이(도움으로 확정)라 이름을 달리한다.
      if (!done && !teacherShown && rec.state !== 'unseen' && hv.step < NM.core.rules.helpMax()) {
        const last = hv.step + 1 >= NM.core.rules.helpMax();
        const hb = el('button', 'nm-st-btn nm-st-morehelp', TX().t(last ? 'btn.helpAnswer' : 'btn.moreHelp'));
        hb.type = 'button';
        hb.setAttribute('data-step', String(hv.step));
        hb.title = TX().t('moreHelpNote');
        hb.addEventListener('click', onMoreHelp);
        foot.appendChild(hb);
      }
      const cb = el('button', 'nm-st-btn nm-st-primary nm-st-confirm', TX().t('btn.confirm'));
      cb.type = 'button';
      cb.hidden = done;
      cb.disabled = !((rec.state === 'confirmable' || rec.state === 'misread') && rec.guess != null && seen.length >= 2);
      cb.addEventListener('click', onConfirm);
      foot.appendChild(cb);
    }

    // 살핀 곳 다시 보기: 살핀 맥락마다 접힌 칩. 펼치면 그 맥락의 원문 카드(현대어 풀이 잠금 규칙 그대로)와 대사를
    // 이 창 안에서 작게 보인다(env.clue — 진행기가 맥락 창과 같은 부품으로 만든다). 펼친 칩은 다시 그려도 펼친 채로 둔다.
    function clues(seen) {
      const box = el('div', 'nm-st-clues');
      box.appendChild(el('p', 'nm-st-clues-label', TX().t('clues')));
      seen.forEach(cid => {
        const wrap = el('div', 'nm-st-clue');
        wrap.setAttribute('data-context', cid);
        const btn = el('button', 'nm-st-clue-btn');
        btn.type = 'button';
        const sym = el('span', 'nm-st-clue-sym');
        sym.setAttribute('aria-hidden', 'true');
        btn.appendChild(sym);
        btn.appendChild(el('span', 'nm-st-clue-name', env.contextLabel(cid)));
        const panel = el('div', 'nm-st-clue-body');
        panel.id = 'nm-clue-' + itemId.replace(/[^A-Za-z0-9_-]/g, '_') + '-' + cid.replace(/[^A-Za-z0-9_-]/g, '_');
        btn.setAttribute('aria-controls', panel.id);
        function set(open) {
          if (open) openClues.add(cid); else openClues.delete(cid);
          btn.setAttribute('aria-expanded', String(open));
          wrap.classList.toggle('is-open', open);
          panel.hidden = !open;
          panel.textContent = '';
          if (open) {
            const v = typeof env.clue === 'function' ? env.clue(cid) : null;
            if (v) panel.appendChild(v);
          }
        }
        btn.addEventListener('click', () => set(!openClues.has(cid)));
        wrap.appendChild(btn);
        wrap.appendChild(panel);
        set(openClues.has(cid));
        box.appendChild(wrap);
      });
      return box;
    }

    function appendAnswer(box) {
      const a = el('p', 'nm-st-answer');
      a.appendChild(el('span', 'nm-st-answer-label', TX().t('answer')));
      a.appendChild(document.createTextNode(' ○ '));
      if (right) a.appendChild(rich(env, right.text));
      box.appendChild(a);
      box.appendChild(MK().card({ kind: 'explain', text: item.explain, fill: env.fill }));
    }

    function onMoreHelp() {
      if (typeof env.requestHelp !== 'function') return;
      const r = env.requestHelp(itemId);
      if (!r || !r.ok) { NM.reportError('stage.item.help', r && r.reason); return; }
      env.sfx('help');
      render();
      const hb = w.foot.querySelector('.nm-st-morehelp');
      if (hb) hb.focus(); else w.focus();
    }

    function onConfirm() {
      const before = env.rec(itemId);
      const guess = before && before.guess;
      const r = env.confirm(itemId);
      if (!r || !r.ok) { NM.reportError('stage.item.confirm', r && r.reason); return; }
      if (r.correct) {
        env.sfx('confirm');
        render();
        w.focus();
        return;
      }
      lastWrong[itemId] = guess;
      env.sfx('misread');
      const lines = (item.misread && item.misread[guess]) || [];
      const note = el('p', 'nm-dlg-note', TX().t('misreadNote'));
      render();
      env.dialog([].concat(lines), { kind: 'misread', title: TX().t('win.misread'), extras: [note] }).then(() => {
        if (!w.isOpen()) return;
        render();
        const rec = env.rec(itemId);
        if (rec && rec.helps > 0) env.sfx('help');
        w.focus();
      });
    }

    w = NM.ui.stageWindow.open({
      win: 'item', eyebrow: item.label ? TX().t('win.item') : null, title: itemTitle(env, item), data: { item: itemId }, className: 'nm-st-itemwin',
      build(win) { w = win; render(); },
      onClose(reason) { if (reason !== 'all') env.onItemClosed(itemId); }
    });
    return w;
  }

  NM.ui.itemRead = { open };
})(typeof window !== 'undefined' ? window : globalThis);
