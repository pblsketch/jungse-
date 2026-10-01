'use strict';
/*
 * NM.ui.teacher — 교사 모드 장면 도구 (spec §9-1 걷기 건너뛰기).
 *   openPlaces(app)   장소 목록 창: NM.engine.listPlaces() 의 조사 지점·인물. 고르면 창을 닫고 NM.engine.goTo(id)
 *                     (그 자리로 옮겨 살피기 → 장면 진행기가 조사·대화를 연다).
 *   placeLabel(place, stageId)  장면 데이터의 맥락 이름(contexts[].label)이 있으면 그것, 없으면 엔진이 준 이름.
 * 켜기·끄기와 기록 분리는 NM.ui.app.setTeacher, 크게 보기는 app 이 html.nm-large 와 --fs 로 한다.
 * 정답·풀이 바로 보기 단추는 장면 진행기(D1)가 ctx.teacher 를 보고 그린다.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);

  function placeLabel(place, stageId) {
    const sc = UI.notebookModel.sceneOf(stageId);
    const cid = place.contextId || null;
    if (sc && cid && Array.isArray(sc.contexts)) {
      const c = sc.contexts.filter(x => x && x.id === cid)[0];
      if (c && typeof c.label === 'string' && c.label) return c.label;
    }
    if (sc && place.npcId && sc.npcs) {
      // 장면 진행기 형식은 npcs = { <npcId>: { name, lines } } (배열 형식도 받는다)
      const n = Array.isArray(sc.npcs) ? sc.npcs.filter(x => x && x.id === place.npcId)[0] : sc.npcs[place.npcId];
      if (n && typeof n.name === 'string' && n.name) return n.name;
    }
    return String(place.label || place.id || '');
  }

  function openPlaces(app) {
    if (dom.isOpen('places')) return null;
    const E = NM.engine;
    let list = [];
    try { list = E && typeof E.listPlaces === 'function' ? (E.listPlaces() || []) : []; }
    catch (e) { NM.reportError('ui.teacher.listPlaces', e); list = []; }
    const body = dom.el('div', { class: 'nm-places' });
    body.appendChild(dom.el('p', { class: 'nm-help', text: t('teacher.placesHelp') }));
    let wrap = null;
    if (!list.length) body.appendChild(dom.el('p', { class: 'nm-empty', text: t('teacher.placesEmpty') }));
    const ul = dom.el('ul', { class: 'nm-place-list' });
    list.forEach(p => {
      const kind = p.kind === 'npc' ? t('teacher.npc') : t('teacher.spot');
      const label = placeLabel(p, app.stageId);
      ul.appendChild(dom.el('li', null, dom.button(null, 'place', () => {
        dom.closeModal(wrap, true);
        try { E.goTo(p.id); } catch (e) { NM.reportError('ui.teacher.goTo', e); }
      }, { class: 'nm-place', data: { place: p.id }, kids: [
        dom.el('span', { class: 'nm-badge nm-place-kind', text: kind }),
        dom.el('span', { class: 'nm-place-name' }, dom.yet(label))
      ] })));
    });
    body.appendChild(ul);
    wrap = dom.openModal(body, { name: 'places', titleKey: 'teacher.placesTitle' });
    return wrap;
  }

  UI.teacher = { openPlaces, placeLabel };
})(typeof window !== 'undefined' ? window : globalThis);
