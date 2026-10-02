'use strict';
/*
 * NM.ui.places — 학생용 장소 목록(지도를 보지 않고도 갈 곳을 고르는 길: 키보드·화면 낭독기).
 *   open(app)   장소 목록 창: NM.engine.listPlaces() 의 조사 지점·인물을 이름·종류·목표 여부·살핌 여부와 함께 보인다.
 *               지금 목표인 곳이 먼저 온다. 고르면 창을 닫고 NM.engine.walkTo(id, { focusAct: true }) —
 *               누른 곳으로 걷기와 같은 길로 걸어가고(순간 이동 없음), 닿으면 살피기 단추로 초점이 간다.
 *               교사 모드의 장소 목록(ui/teacher.js, 바로 옮겨 살피기)은 그대로 둔다.
 *   sceneName(place, stageId)  장면 데이터의 이름 { name, person } | null:
 *               인물 이름(npcs[npcId].name → person) → 맥락 이름(contexts[].label). 학교급 판(editions)을 반영한다.
 * 불러오면 NM.engine.setPlaceNamer 로 sceneName 을 엔진에 건넨다 → 살피기 단추 '○○ 살피기'·'○○와 말하기',
 * 목표 이름표, 화면 밖 화살표 읽기 이름이 이 이름을 쓴다.
 * 살핌 여부: 이 맵에서 살핀 곳(엔진) + 기록의 항목별 살핀 맥락(seenContexts).
 * 문구는 js/data/text-ui.js 의 places.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);

  function sceneName(place, stageId) {
    if (!place || !stageId || !UI.notebookModel) return null;
    const sc = UI.notebookModel.sceneOf(stageId);
    if (!sc) return null;
    if (place.npcId && sc.npcs) {
      const n = Array.isArray(sc.npcs) ? sc.npcs.filter(x => x && x.id === place.npcId)[0] : sc.npcs[place.npcId];
      if (n && typeof n.name === 'string' && n.name) return { name: n.name, person: true };
    }
    const cid = place.contextId || null;
    if (cid && Array.isArray(sc.contexts)) {
      const c = sc.contexts.filter(x => x && x.id === cid)[0];
      if (c && typeof c.label === 'string' && c.label) return { name: c.label, person: false };
    }
    return null;
  }

  function seenFromRecord(app) {
    const seen = {};
    try {
      const st = app && app.stageId ? app.store().stage(app.stageId) : null;
      const items = (st && st.items) || {};
      Object.keys(items).forEach(k => {
        const r = items[k];
        (r && Array.isArray(r.seenContexts) ? r.seenContexts : []).forEach(c => { seen[c] = true; });
      });
    } catch (e) { NM.reportError('ui.places.seen', e); }
    return seen;
  }

  function open(app) {
    if (dom.isOpen('student-places')) return null;
    const E = NM.engine;
    let list = [];
    try { list = E && typeof E.listPlaces === 'function' ? (E.listPlaces() || []) : []; }
    catch (e) { NM.reportError('ui.places.list', e); list = []; }
    const seen = seenFromRecord(app);
    list = list.map((p, i) => Object.assign({}, p, { i, visited: !!(p.visited || (p.contextId && seen[p.contextId])) }));
    list.sort((a, b) => (b.objective ? 1 : 0) - (a.objective ? 1 : 0) || a.i - b.i);

    const body = dom.el('div', { class: 'nm-places nm-places-student' });
    body.appendChild(dom.el('p', { class: 'nm-help', text: t('places.help') }));
    let wrap = null;
    if (!list.length) body.appendChild(dom.el('p', { class: 'nm-empty', text: t('places.empty') }));
    const ul = dom.el('ul', { class: 'nm-place-list' });
    list.forEach(p => {
      const name = p.name || t('places.unnamed');
      const kids = [
        dom.el('span', { class: 'nm-place-name' }, dom.yet(name)),
        dom.el('span', { class: 'nm-place-tags' }, [
          dom.el('span', { class: 'nm-badge nm-place-kind', text: p.kind === 'npc' ? t('places.person') : t('places.spot') }),
          p.objective ? dom.el('span', { class: 'nm-badge nm-place-goal', text: t('places.goal') }) : null,
          dom.el('span', { class: 'nm-badge nm-place-seen' + (p.visited ? ' is-seen' : ''), text: p.visited ? t('places.visited') : t('places.notVisited') })
        ])
      ];
      ul.appendChild(dom.el('li', null, dom.button(null, 'walk-place', () => {
        dom.closeModal(wrap, true);
        try { E.walkTo(p.id, { focusAct: true }); } catch (e) { NM.reportError('ui.places.walkTo', e); }
      }, { class: 'nm-place', data: { place: p.id, goal: p.objective ? '1' : null, visited: p.visited ? '1' : '0' }, kids })));
    });
    body.appendChild(ul);
    wrap = dom.openModal(body, { name: 'student-places', titleKey: 'places.title' });
    return wrap;
  }

  if (NM.engine && typeof NM.engine.setPlaceNamer === 'function') {
    NM.engine.setPlaceNamer(place => sceneName(place, UI.app && UI.app.stageId));
  }

  UI.places = { open, sceneName };
})(typeof window !== 'undefined' ? window : globalThis);
