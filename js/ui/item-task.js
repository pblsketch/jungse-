'use strict';
/*
 * NM.ui.itemTask — 기믹 과제 창 (spec §5-3). 기믹 모듈은 NM.gimmicks.register 로 끼운다(js/ui/stage-gimmick.js).
 *   open(env, itemId) → 창
 * 흐름: 기믹이 onSubmit(answer) → 진행기가 판정(stageLogic.judge: 기믹 check 또는 answer 깊은 비교)
 *   → env.submit(id, correct)(store → NM.core.rules.submit) → 맞으면 done + 풀이.
 *   틀리면 바로 instance.showWrong({ wrong, answer, wrongs, help }) — 오해 장면 없음.
 *   도움 1: 선배의 힌트(hints[0]) / 2: instance.showHint(2, hints[1]) 고칠 곳 강조 / 3: instance.showAnswer(answer) + 풀이 → doneByHelp.
 *   이미 끝난 과제를 다시 열면 readOnly 로 붙이고 정답·풀이를 보인다.
 *   교사 모드: '정답·풀이 바로 보기'(기록과 상관없음).
 * env: { scene, level, teacher, rec(id), submit(id, correct), fill(text), sfx(name), onItemClosed(id), settings() }
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js, ui/marker.js, ui/stage-window.js, ui/stage-logic.js, ui/stage-gimmick.js, ui/rulecard.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const MK = () => NM.ui.marker;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function rich(env, text, cls) {
    const s = el('span', cls || 'nm-st-text');
    s.appendChild(YB().build(env.fill(text), {}));
    return s;
  }
  function call(inst, name, args) {
    if (!inst || typeof inst[name] !== 'function') return;
    try { inst[name].apply(inst, args); } catch (e) { NM.reportError('gimmick.' + name, e); }
  }

  function open(env, itemId) {
    const item = (env.scene.items || []).filter(i => i.id === itemId)[0];
    if (!item) { NM.reportError('stage.task', 'unknown item: ' + itemId); return null; }
    const def = NM.gimmicks.get(item.gimmick);
    let inst = null, w = null, status = null, helpBox = null, teacherShown = false;

    function showHelp(rec) {
      helpBox.textContent = '';
      const hv = NM.core.rules.helpView(item, rec);
      helpBox.setAttribute('data-step', String(hv.step));
      helpBox.hidden = hv.step < 1 && !teacherShown;
      if (hv.step >= 1 && hv.hint != null) {
        const h = el('p', 'nm-st-hint');
        h.appendChild(el('span', 'nm-st-hint-label', TX().t('hint')));
        h.appendChild(document.createTextNode(' '));
        h.appendChild(rich(env, hv.hint));
        helpBox.appendChild(h);
      }
      if (hv.step >= 2 && !NM.core.rules.isItemDone(rec)) helpBox.appendChild(el('p', 'nm-st-fix', TX().t('fix')));
      if (hv.step >= 3 || NM.core.rules.isItemDone(rec) || teacherShown) {
        if (teacherShown && !NM.core.rules.isItemDone(rec)) helpBox.appendChild(el('p', 'nm-st-note', TX().t('teacherNote')));
        helpBox.appendChild(MK().card({ kind: 'explain', text: item.explain, fill: env.fill }));
      }
    }

    function setStatus(key, kind) {
      status.textContent = key ? TX().t(key) : '';
      status.setAttribute('data-result', kind || '');
      status.hidden = !key;
    }

    function onSubmit(answer) {
      const cur = env.rec(itemId);
      if (cur && NM.core.rules.isItemDone(cur)) return;
      const j = NM.ui.stageLogic.judge(def, answer, item);
      if (j.error) return;
      const r = env.submit(itemId, j.correct);
      if (!r || !r.ok) { NM.reportError('stage.task.submit', r && r.reason); return; }
      const rec = env.rec(itemId);
      if (j.correct) {
        env.sfx('confirm');
        setStatus('taskDone', 'correct');
        showHelp(rec);
        return;
      }
      call(inst, 'showWrong', [{ wrong: j.wrong, answer, wrongs: rec.wrongs, help: r.help }]);
      if (r.help >= 2) call(inst, 'showHint', [2, Array.isArray(item.hints) ? item.hints[1] : null]);
      if (rec.state === 'doneByHelp') {
        env.sfx('help');
        call(inst, 'showAnswer', [item.answer]);
        setStatus('taskByHelp', 'help');
      } else {
        env.sfx('misread');
        setStatus('taskWrong', 'wrong');
      }
      showHelp(rec);
    }

    w = NM.ui.stageWindow.open({
      win: 'task', title: TX().t('win.task'), data: { item: itemId }, className: 'nm-st-taskwin',
      build(win) {
        const rec = env.rec(itemId) || NM.core.rules.newItemRecord('task');
        const done = NM.core.rules.isItemDone(rec);
        if (item.label) { const l = el('div', 'nm-st-item-label'); l.appendChild(YB().build(env.fill(item.label), {})); win.body.appendChild(l); }
        if (item.prompt) win.body.appendChild(rich(env, item.prompt, 'nm-st-prompt'));
        const mount = el('div', 'nm-st-gimmick');
        mount.setAttribute('data-gimmick', String(item.gimmick || ''));
        win.body.appendChild(mount);
        status = el('p', 'nm-st-taskstatus');
        status.setAttribute('aria-live', 'polite');
        win.body.appendChild(status);
        helpBox = el('div', 'nm-st-help');
        win.body.appendChild(helpBox);
        setStatus(done ? (rec.state === 'done' ? 'taskDone' : 'taskByHelp') : null, done ? (rec.state === 'done' ? 'correct' : 'help') : null);
        if (!def) {
          NM.reportError('stage.task', 'unknown gimmick: ' + item.gimmick);
          mount.appendChild(el('p', 'nm-st-note', TX().t('noGimmick')));
        } else {
          const s = env.settings();
          try {
            inst = def.mount(mount, {
              item, config: item.config || {}, level: env.level, teacher: env.teacher, document, readOnly: done,
              reducedMotion: s.reducedMotion, bangjeom: s.bangjeom,
              onSubmit, text: TX().t, fill: env.fill,
              yet: (text, o) => YB().build(text, o || {}),
              rulecard: (o) => NM.ui.rulecard.build(o)
            }) || null;
          } catch (e) { NM.reportError('gimmick.mount', e); }
          if (done) call(inst, 'showAnswer', [item.answer]);
          else if (rec.helps >= 2) call(inst, 'showHint', [2, Array.isArray(item.hints) ? item.hints[1] : null]);
        }
        showHelp(rec);
        if (env.teacher && !done) {
          const tb = el('button', 'nm-st-btn nm-st-teacher-answer', TX().t('btn.teacherAnswer'));
          tb.type = 'button';
          tb.addEventListener('click', () => {
            teacherShown = true;
            tb.hidden = true;
            call(inst, 'showAnswer', [item.answer]);
            showHelp(env.rec(itemId) || rec);
          });
          win.foot.appendChild(tb);
        }
      },
      onClose(reason) {
        call(inst, 'destroy', []);
        if (reason !== 'all') env.onItemClosed(itemId);
      }
    });
    return w;
  }

  NM.ui.itemTask = { open };
})(typeof window !== 'undefined' ? window : globalThis);
