'use strict';
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;

  function el(tag, cls, text, env) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.appendChild(NM.ui.stageYet.build(env.fill(String(text)), {}));
    return node;
  }

  function history(env) {
    const details = el('details', 'nm-opening-history');
    const summary = document.createElement('summary');
    summary.textContent = TX().t('opening.history');
    summary.tabIndex = 0;
    details.appendChild(summary);
    (env.scene.fiction || []).forEach(f => details.appendChild(NM.ui.marker.card({
      kind: 'fiction', text: f.text, real: f.real, showReal: true, src: f.src, fill: env.fill
    })));
    return details;
  }

  function teaser(env) {
    const data = env.scene.opening;
    let voice = null;
    return new Promise(resolve => NM.ui.stageWindow.open({
      win: 'dialog', kind: 'intro', title: data.title,
      data: { opening: 'choice' }, className: 'nm-st-dialog nm-st-opening',
      build(w) {
        w.body.appendChild(el('p', 'nm-opening-cue', data.cue, env));
        const src = NM.data.ASSETS.cg[data.cg];
        const img = document.createElement('img');
        img.className = 'nm-opening-art'; img.src = src; img.alt = ''; img.decoding = 'async';
        w.body.appendChild(img);
        w.body.appendChild(NM.ui.dialog.lineEl(data.quote, env));
        const prompt = el('p', 'nm-opening-prompt', data.prompt, env);
        prompt.id = 'nm-opening-prompt';
        w.body.appendChild(prompt);
        const choices = el('div', 'nm-opening-choices');
        choices.setAttribute('role', 'group'); choices.setAttribute('aria-labelledby', prompt.id);
        w.body.appendChild(choices);
        const response = el('div', 'nm-opening-response');
        response.setAttribute('aria-live', 'polite'); response.setAttribute('aria-atomic', 'true');
        response.hidden = true; w.body.appendChild(response);
        const next = el('button', 'nm-st-btn nm-st-primary nm-dlg-next nm-opening-continue', TX().t('opening.continue'), env);
        next.type = 'button'; next.disabled = true;
        data.options.forEach(option => {
          const button = el('button', 'nm-st-btn nm-opening-choice', option.text, env);
          button.type = 'button'; button.dataset.option = option.id; button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', () => {
            choices.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
            response.textContent = ''; response.hidden = false;
            response.appendChild(el('h3', 'nm-opening-feedback-title', TX().t('opening.feedback'), env));
            response.appendChild(NM.ui.dialog.lineEl(option.reaction, env));
            response.appendChild(el('p', 'nm-opening-explanation', data.explanation, env));
            response.appendChild(NM.ui.dialog.lineEl(data.sejong, env));
            next.disabled = false;
            w.body.scrollTop = response.offsetTop - w.body.offsetTop;
            next.focus({ preventScroll: true });
            voice.update([option.reaction.voice, data.explanationVoice, data.sejong.voice]);
          });
          choices.appendChild(button);
        });
        next.addEventListener('click', () => w.close('next'));
        w.foot.appendChild(next);
        voice = NM.ui.stageVoice.attach(w, data.quote.voice);
      },
      onClose() { if (voice) voice.dispose(); resolve(); }
    }));
  }

  function mission(env) {
    const data = env.scene.opening.mission;
    let voice = null;
    return new Promise(resolve => NM.ui.stageWindow.open({
      win: 'dialog', kind: 'intro', title: data.title,
      data: { opening: 'mission' }, className: 'nm-st-dialog nm-st-opening nm-st-mission',
      build(w) {
        const brief = el('div', 'nm-opening-brief');
        const role = el('section', 'nm-opening-role');
        role.appendChild(el('p', 'nm-opening-kicker', TX().t('opening.role'), env));
        role.appendChild(el('h3', 'nm-opening-role-title', data.role, env));
        role.appendChild(NM.ui.dialog.lineEl({ who: 'me', text: data.identity }, env));
        brief.appendChild(role);
        const goal = el('section', 'nm-opening-goal');
        goal.appendChild(el('p', 'nm-opening-kicker', TX().t('opening.goal'), env));
        goal.appendChild(el('h3', '', data.goal, env)); brief.appendChild(goal);
        w.body.appendChild(brief);
        w.body.appendChild(el('p', 'nm-opening-appeal', data.appeal, env));
        w.body.appendChild(el('h3', 'nm-opening-section-title', TX().t('opening.play'), env));
        const list = el('ol', 'nm-opening-steps');
        data.steps.forEach(step => {
          const item = el('li');
          item.appendChild(el('strong', '', step.title, env));
          item.appendChild(el('p', '', step.text, env)); list.appendChild(item);
        });
        w.body.appendChild(list);
        w.body.appendChild(el('p', 'nm-opening-first', data.first, env));
        w.body.appendChild(history(env));
        const next = el('button', 'nm-st-btn nm-st-primary nm-dlg-next', TX().t('opening.accept'), env);
        next.type = 'button'; next.addEventListener('click', () => w.close('next')); w.foot.appendChild(next);
        voice = NM.ui.stageVoice.attach(w, data.voice);
        Promise.resolve().then(() => { if (w.isOpen()) w.focus(next); });
      },
      onClose() { if (voice) voice.dispose(); resolve(); }
    }));
  }

  function run(env) {
    return teaser(env).then(() => env.alive() ? mission(env) : null);
  }
  NM.ui.stageOpening = { run };
})(typeof window !== 'undefined' ? window : globalThis);
