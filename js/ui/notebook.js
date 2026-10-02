'use strict';
/*
 * NM.ui.notebook — 해독 수첩 창 (plan U1). 장면 고르기 머리 단추, 장면 중 도구 막대, 끝낸 장면 창에서 연다.
 *   open(app, stageId)   stageId 가 없으면 진행 중인 장면 → 마지막으로 끝낸 장면 → 첫 추천 장면 순으로 고른다.
 * 칸: [data-section="items"] 확정한 항목(원문 → 현대어, 원문은 옛한글 글꼴) · translations 옮긴 구절 · reflection 돌아보기 ·
 *     rules 규칙 카드(지금 학교급에서 얻은 것) · unlearned 아직 확인하지 않은 규칙(배우는 장면 이름) · dogam 옛글자 도감(● 만남 / ○ 아직)
 * 장면 고르기 칸 #nm-nb-stage, 이미지 저장 단추 [data-act="save-image"] → NM.ui.notebookImage.open
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);
  const el = (a, b, c) => dom.el(a, b, c);

  function defaultStage(app) {
    const st = app.store();
    const ids = (NM.data.STAGE_IDS || []).slice();
    const prog = ids.filter(id => st.stage(id).status === 'progress');
    if (prog.length) return prog[0];
    const done = ids.filter(id => st.stage(id).status === 'done');
    if (done.length) return done[done.length - 1];
    const b = NM.data.BUNDLES && NM.data.BUNDLES[st.level];
    return b && b.stages.length ? b.stages[0] : 's0';
  }

  function section(name, titleKey, kids, emptyKey) {
    const has = Array.isArray(kids) ? kids.length > 0 : !!kids;
    return el('section', { class: 'nm-nb-section', data: { section: name } }, [
      el('h3', { class: 'nm-nb-title', text: t(titleKey) }),
      has ? kids : el('p', { class: 'nm-empty', text: t(emptyKey) })
    ]);
  }

  function open(app, stageId) {
    if (dom.isOpen('notebook')) return null;
    const M = UI.notebookModel;
    let current = stageId || defaultStage(app);
    const body = el('div', { class: 'nm-notebook' });
    const sel = el('select', { attrs: { id: 'nm-nb-stage' } });
    (NM.data.STAGE_IDS || []).forEach(id => {
      const name = M.stageName(id), label = M.stageLabel(id);
      const opt = el('option', { attrs: { value: id }, text: name !== label ? label + ' ' + NM.core.yet.render(name) : label });
      if (id === current) opt.selected = true;
      sel.appendChild(opt);
    });
    const pick = el('div', { class: 'nm-row nm-nb-pick' }, [el('label', { class: 'nm-label', text: t('notebook.stage'), attrs: { for: 'nm-nb-stage' } }), sel]);
    const content = el('div', { class: 'nm-nb-content' });
    body.appendChild(pick);
    body.appendChild(content);
    let wrap = null;

    function draw() {
      dom.clear(content);
      const v = M.view(app.store(), current);
      // 제4장·제10장 내용은 방점을 늘 켠다(그 장면에 속한 글은 어디서 보이든)
      const bj = (sid) => M.bangjeomFor(app.store(), sid || current);
      const yt = (text, sid, opt) => dom.yet(text, Object.assign({ bangjeom: bj(sid) }, opt || {}));
      const items = v.items.map(x => el('li', { class: 'nm-nb-item' }, [
        yt(x.word, current, { class: 'nm-nb-word' }),
        el('span', { class: 'nm-arrow', text: ' ' + t('notebook.arrow') + ' ', attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'nm-modern', text: x.modern })
      ]));
      content.appendChild(section('items', 'notebook.items', items.length ? el('ul', { class: 'nm-nb-list' }, items) : [], 'notebook.itemsEmpty'));
      const tr = v.translations.map(x => el('li', null, yt(x.text, current)));
      content.appendChild(section('translations', 'notebook.translations', tr.length ? el('ul', { class: 'nm-nb-list' }, tr) : [], 'notebook.translationsEmpty'));
      if (v.reflection) content.appendChild(section('reflection', 'notebook.reflection', el('p', { class: 'nm-reflection', text: v.reflection }), 'notebook.itemsEmpty'));
      const rules = v.rulesLearned.map(r => el('li', { class: 'nm-rule' }, [el('strong', null, yt(r.name, r.stage)), el('span', { class: 'nm-rule-text' }, yt(r.text, r.stage))]));
      content.appendChild(section('rules', 'notebook.rules', rules.length ? el('ul', { class: 'nm-nb-list' }, rules) : [], 'notebook.rulesEmpty'));
      const un = v.rulesUnlearned.map(r => el('li', { class: 'nm-rule nm-rule-unlearned' }, [
        el('strong', null, yt(r.name, r.stage)),
        r.stageName ? el('span', { class: 'nm-rule-stage', text: t('notebook.learnAt', { stage: r.stageName }) }) : null
      ]));
      content.appendChild(section('unlearned', 'notebook.unlearned', un.length ? el('ul', { class: 'nm-nb-list' }, un) : [], 'notebook.unlearnedEmpty'));
      const dg = v.dogam.map(d => el('li', { class: 'nm-dogam' + (d.found ? ' nm-dogam-found' : '') }, [
        el('span', { class: 'nm-dogam-glyph' }, yt(d.glyph, d.stage)),
        el('span', { class: 'nm-dogam-name' }, yt(d.name, d.stage)),
        el('span', { class: 'nm-badge', text: d.found ? t('notebook.dogamFound') : t('notebook.dogamNotYet') }),
        d.note ? el('span', { class: 'nm-dogam-note' }, yt(d.note, d.stage)) : null,
        !d.found && d.stageName ? el('span', { class: 'nm-rule-stage', text: t('notebook.learnAt', { stage: d.stageName }) }) : null
      ]));
      content.appendChild(section('dogam', 'notebook.dogam', dg.length ? el('ul', { class: 'nm-dogam-list' }, dg) : [], 'notebook.dogamEmpty'));
      content.appendChild(el('div', { class: 'nm-row nm-row-end' },
        dom.button(t('notebook.saveImage'), 'save-image', () => UI.notebookImage.open(app, current), { class: 'nm-btn-primary' })));
    }
    sel.addEventListener('change', dom.guard(() => { current = sel.value; draw(); }, 'ui.notebook.stage'));
    draw();
    wrap = dom.openModal(body, { name: 'notebook', titleKey: 'notebook.title', full: true });
    return wrap;
  }

  UI.notebook = { open, defaultStage };
})(typeof window !== 'undefined' ? window : globalThis);
