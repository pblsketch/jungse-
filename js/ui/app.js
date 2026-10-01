'use strict';
/*
 * NM.ui.app — 화면 흐름의 상태와 이동(spec §4·§6·§9·§10·§11). NM.ui.start 를 낸다(js/main.js 가 부른다).
 *
 * ■ 기록
 *   - 학생 기록: NM.core.save.createStore({ storage: localStorage, urlLevel }) 하나. 화면 코드는 저장소에 직접 쓰지 않는다.
 *     처음 필요할 때 만든다(주소 teacher=1 로 열면 교사 모드를 끌 때까지 학생 기록을 읽지 않는다).
 *   - 교사 모드: createStore({ teacher: true, ... }) 메모리 저장소. 켜짐 사실·설정·진행은 저장하지 않는다.
 *   - 주소 학교급(?level=)은 store 의 urlLevel 로만 넘긴다(기록이 있으면 그 접속에만, 첫 실행이면 처음 학교급으로 저장).
 * ■ 화면: #ui-layer 안 #nm-screens(첫 화면·처음 정하기·장면 고르기). 창(설정·수첩·안내)은 NM.ui.dom.openModal.
 * ■ 장면: NM.ui.stage.run(stageId, ctx) — D1. ctx = { store, level, teacher, onExit(result), saveImage }
 *   장면 중에는 #nm-screens 를 숨기고 도구 막대 #nm-toolbar(수첩·설정·교사 모드 장소 목록)를 보인다.
 * ■ 설정 적용: --fs(글자 크기, 교사 크게 보기 ×1.4), html 의 nm-teacher / nm-large / nm-reduced-motion,
 *   NM.core.yet.setBangjeom, NM.engine.setReducedMotion, NM.engine.audio.setBgmEnabled / setSfxEnabled.
 *   바뀔 때마다 document 에 'nm:settings' 사건(detail: { settings, teacher, reducedMotion, fontScale })을 보낸다.
 * ■ 점검용 통로: NM.ui.app.test.state(), NM.ui.app.test.lastImage() (화면에 드러내지 않음)
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);
  const FONT = { 1: 1, 2: 1.25, 3: 1.5 };
  const LARGE = 1.4;

  const state = {
    url: { level: null, teacher: false },
    student: null,
    teacherStore: null,
    teacher: false,
    teacherLevelKnown: false,
    screen: null,
    params: null,
    inStage: false,
    stageId: null,
    draft: { level: null, protagonist: null, levelStep: false },
    reducedMotion: false
  };
  let screensEl = null, toolbarEl = null;

  /* ---------- 기록 ---------- */
  function safeStorage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }
  function studentStore() {
    if (!state.student) state.student = NM.core.save.createStore({ storage: safeStorage(), urlLevel: state.url.level });
    return state.student;
  }
  function store() { return state.teacher ? state.teacherStore : studentStore(); }
  function isTeacher() { return state.teacher; }
  function canSelectStage() { return state.teacher || store().canSelectStage(); }
  function setupNeeded() {
    const s = studentStore();
    return !s.hasRecord || !s.get().nickname;
  }
  function checkStorageWarning() {
    if (state.teacher || !state.student) return;
    if (state.student.takeStorageWarning()) {
      const node = dom.el('p', { class: 'nm-notice-text', text: t('notice.storage') });
      dom.openModal(node, { name: 'notice-storage', titleKey: 'notice.storageTitle' });
    }
  }

  /* ---------- 설정 적용 ---------- */
  function systemReduced() {
    try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function applySettings() {
    const s = store().get().settings;
    const html = document.documentElement;
    const scale = FONT[s.fontScale] || 1;
    const fs = state.teacher ? Math.round(scale * LARGE * 100) / 100 : scale;
    html.style.setProperty('--fs', String(fs));
    html.classList.toggle('nm-teacher', state.teacher);
    html.classList.toggle('nm-large', state.teacher);
    const reduced = s.reducedMotion === 'auto' ? systemReduced() : s.reducedMotion === true;
    state.reducedMotion = reduced;
    html.classList.toggle('nm-reduced-motion', reduced);
    const Y = NM.core.yet;
    if (Y && typeof Y.setBangjeom === 'function') Y.setBangjeom(s.bangjeom !== false);
    const E = NM.engine;
    if (E && typeof E.setReducedMotion === 'function') E.setReducedMotion(reduced);
    if (E && E.audio) {
      if (typeof E.audio.setBgmEnabled === 'function') E.audio.setBgmEnabled(s.bgm !== false);
      if (typeof E.audio.setSfxEnabled === 'function') E.audio.setSfxEnabled(s.sfx !== false);
    }
    try {
      document.dispatchEvent(new CustomEvent('nm:settings', { detail: { settings: s, teacher: state.teacher, reducedMotion: reduced, fontScale: fs } }));
    } catch (e) { NM.reportError('ui.settingsEvent', e); }
  }
  function updateSettings(partial) {
    const r = store().setSettings(partial);
    applySettings();
    checkStorageWarning();
    return r;
  }
  function setLevel(lv) {
    const r = store().setLevel(lv);
    applySettings();
    checkStorageWarning();
    refresh();
    return r;
  }

  /* ---------- 화면 ---------- */
  function ensureDom() {
    const layer = document.getElementById('ui-layer') || document.body;
    if (!screensEl || !document.contains(screensEl)) {
      screensEl = dom.el('main', { attrs: { id: 'nm-screens' } });
      layer.appendChild(screensEl);
    }
    if (!toolbarEl || !document.contains(toolbarEl)) {
      toolbarEl = dom.el('nav', { attrs: { id: 'nm-toolbar', hidden: true, 'aria-label': t('toolbar.label') } });
      layer.appendChild(toolbarEl);
    }
  }
  function renderScreen(keepScroll) {
    ensureDom();
    const top = keepScroll ? screensEl.scrollTop : 0;
    dom.clear(screensEl);
    screensEl.hidden = false;
    screensEl.setAttribute('data-screen', state.screen);
    UI.screens.render(state.screen, screensEl, api, state.params);
    screensEl.scrollTop = top;
  }
  function focusPrimary() {
    const f = screensEl.querySelector('[data-primary]') || screensEl.querySelector('.nm-heading, h1');
    if (f) { try { f.focus({ preventScroll: false }); } catch (e) { /* 무시 */ } }
  }
  function go(screen, params) {
    state.screen = screen;
    state.params = params || null;
    renderScreen(false);
    focusPrimary();
  }
  function refresh() {
    if (!state.inStage && state.screen && screensEl && !screensEl.hidden) renderScreen(true);
  }

  function renderToolbar() {
    dom.clear(toolbarEl);
    if (state.teacher) {
      toolbarEl.appendChild(dom.el('span', { class: 'nm-badge nm-badge-teacher', text: t('title.teacherBadge') }));
      toolbarEl.appendChild(dom.button(t('teacher.places'), 'places', () => UI.teacher.openPlaces(api)));
    }
    toolbarEl.appendChild(dom.button(t('toolbar.notebook'), 'notebook', () => openNotebook(state.stageId)));
    toolbarEl.appendChild(dom.button(t('toolbar.settings'), 'settings', () => openSettings()));
  }

  /* ---------- 처음 정하기 ---------- */
  function setupSteps() { return state.draft.levelStep ? 3 : 2; }
  function beginSetup() {
    const s = studentStore();
    const levelStep = !s.hasRecord && !state.url.level;
    state.draft = { level: null, protagonist: null, levelStep };
    go(levelStep ? 'setup-level' : 'setup-protagonist');
  }
  function setupLevel(lv) { state.draft.level = lv; go('setup-protagonist'); }
  function setupProtagonist(n) { state.draft.protagonist = n; go('setup-nickname'); }
  function setupBack(from) {
    if (from === 'setup-nickname') go('setup-protagonist');
    else go(state.draft.levelStep ? 'setup-level' : 'title');
  }
  function setupNickname(value) {
    const nick = String(value == null ? '' : value);
    const c = NM.core.nickname.check(nick);
    if (!c.ok) return c;
    const q = { protagonist: state.draft.protagonist || 1, nickname: nick };
    if (state.draft.levelStep && state.draft.level) q.level = state.draft.level;
    const r = studentStore().setup(q);
    if (!r.ok) return r;
    applySettings();
    checkStorageWarning();
    enterStage('s0');
    return { ok: true };
  }

  function continueGame() {
    if (state.teacher) { teacherStart(); return; }
    if (setupNeeded()) { beginSetup(); return; }
    if (studentStore().canSelectStage()) go('select');
    else enterStage('s0');
  }
  function askNewStart() {
    const box = dom.el('div', { class: 'nm-confirm' });
    box.appendChild(dom.el('p', { class: 'nm-notice-text', text: t('notice.newStartConfirm') }));
    let wrap = null;
    box.appendChild(dom.el('div', { class: 'nm-row' }, [
      dom.button(t('notice.newStartYes'), 'yes', () => { dom.closeModal(wrap, true); newStart(); }, { class: 'nm-btn-danger' }),
      dom.button(t('no'), 'no', () => dom.closeModal(wrap), { data: { autofocus: '1' } })
    ]));
    wrap = dom.openModal(box, { name: 'confirm-newstart', titleKey: 'notice.newStartTitle' });
  }
  function newStart() {
    if (state.teacher) return;
    dom.closeAll();
    studentStore().newStart();
    applySettings();
    beginSetup();
  }

  /* ---------- 교사 모드 ---------- */
  function setTeacher(on, level) {
    if (state.inStage) return false;
    dom.closeAll();
    if (on) {
      const lv = state.url.level || level || null;
      state.teacherStore = NM.core.save.createStore({ teacher: true, urlLevel: state.url.level, level: lv || 'm' });
      state.teacherLevelKnown = !!lv;
      state.teacher = true;
      applySettings();
      if (state.teacherLevelKnown) go('select');
      else go('teacher-level');
    } else {
      state.teacher = false;
      state.teacherStore = null;
      state.teacherLevelKnown = false;
      applySettings();
      go('title');
      checkStorageWarning();
    }
    return true;
  }
  function teacherStart() {
    if (!state.teacher) return;
    if (state.teacherLevelKnown) go('select');
    else go('teacher-level');
  }
  function teacherPickLevel(lv) {
    if (!state.teacher) { setTeacher(true, lv); return; }
    state.teacherStore.setLevel(lv);
    state.teacherLevelKnown = true;
    applySettings();
    go('select');
  }

  /* ---------- 장면 ---------- */
  function outsideWhere(stageId) {
    const B = NM.data.BUNDLES || {};
    const lv = ['m', 'h1', 'h23'].filter(l => B[l] && (B[l].stages.indexOf(stageId) >= 0 || (B[l].optional || []).indexOf(stageId) >= 0));
    if (lv.length > 1 && lv.every(l => l === 'h1' || l === 'h23')) return t('levelGroups.high');
    return lv.map(l => t('levels.' + l)).join(', ');
  }
  function requestStage(id) {
    const st = store();
    if (st.stage(id).status === 'done') { askDone(id); return; }
    proceed(id);
  }
  function askDone(id) {
    const box = dom.el('div', { class: 'nm-confirm' });
    box.appendChild(dom.el('p', { class: 'nm-notice-text', text: t('notice.doneHelp') }));
    let wrap = null;
    box.appendChild(dom.el('div', { class: 'nm-row' }, [
      dom.button(t('notice.replay'), 'replay', () => {
        dom.closeModal(wrap, true);
        const r = store().replay(id);
        if (!r.ok) NM.reportError('ui.replay', r.reason);
        checkStorageWarning();
        proceed(id);
      }, { class: 'nm-btn-primary', data: { autofocus: '1' } }),
      dom.button(t('notice.viewNotebook'), 'notebook', () => { dom.closeModal(wrap, true); openNotebook(id); }),
      dom.button(t('close'), 'cancel', () => dom.closeModal(wrap))
    ]));
    wrap = dom.openModal(box, { name: 'stage-done', title: UI.notebookModel.stageLabel(id) + ' · ' + t('notice.doneTitle') });
  }
  function proceed(id) {
    const st = store();
    const noticeId = 'outside.' + st.level + '.' + id;
    if (st.bundleRole(id) === 'outside' && !st.hasSeenNotice(noticeId)) {
      st.markNotice(noticeId);
      checkStorageWarning();
      const box = dom.el('div', { class: 'nm-confirm' });
      box.appendChild(dom.el('p', { class: 'nm-notice-text', text: t('notice.outside', { where: outsideWhere(id) }) }));
      let wrap = null;
      box.appendChild(dom.el('div', { class: 'nm-row' }, [
        dom.button(t('notice.enter'), 'enter', () => { dom.closeModal(wrap, true); enterStage(id); }, { class: 'nm-btn-primary', data: { autofocus: '1' } }),
        dom.button(t('notice.pickOther'), 'cancel', () => dom.closeModal(wrap))
      ]));
      wrap = dom.openModal(box, { name: 'notice-outside', titleKey: 'notice.outsideTitle' });
      return;
    }
    enterStage(id);
  }
  function enterStage(id) {
    ensureDom();
    dom.closeAll();
    const runner = UI.stage && UI.stage.run;
    if (typeof runner !== 'function') {
      NM.reportError('ui.enterStage', 'NM.ui.stage.run is missing');
      dom.openModal(dom.el('p', { class: 'nm-notice-text', text: t('notice.stageMissing') }), { name: 'notice-missing', titleKey: 'notice.outsideTitle' });
      return false;
    }
    const st = store();
    state.inStage = true;
    state.stageId = id;
    screensEl.hidden = true;
    renderToolbar();
    toolbarEl.hidden = false;
    let exited = false;
    const ctx = {
      store: st,
      level: st.level,
      teacher: state.teacher,
      onExit(result) { if (exited) return; exited = true; exitStage(id, result); },
      saveImage() { UI.notebookImage.open(api, id); }
    };
    try { runner.call(UI.stage, id, ctx); }
    catch (e) { NM.reportError('ui.stage.run', e); ctx.onExit({ error: true }); }
    return true;
  }
  function exitStage(id, result) {
    if (!state.inStage || state.stageId !== id) return;
    state.inStage = false;
    state.stageId = null;
    toolbarEl.hidden = true;
    dom.clear(toolbarEl);
    dom.closeAll();
    state.lastExit = { stageId: id, result: result || null };
    if (canSelectStage()) go('select');
    else go('title');
    checkStorageWarning();
  }

  /* ---------- 창 ---------- */
  function openSettings() { UI.settings.open(api); }
  function openNotebook(stageId) { UI.notebook.open(api, stageId || null); }

  /* ---------- 시작 ---------- */
  function unlockAudioOnce() {
    const fn = () => {
      document.removeEventListener('pointerdown', fn, true);
      document.removeEventListener('keydown', fn, true);
      try { if (NM.engine && NM.engine.audio && typeof NM.engine.audio.unlock === 'function') NM.engine.audio.unlock(); }
      catch (e) { NM.reportError('ui.audio', e); }
    };
    document.addEventListener('pointerdown', fn, true);
    document.addEventListener('keydown', fn, true);
  }
  function watchSystemMotion() {
    try {
      const mq = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', dom.guard(() => { if (store().get().settings.reducedMotion === 'auto') applySettings(); }, 'ui.motion'));
    } catch (e) { /* 무시 */ }
  }
  function start() {
    if (api.started) return;
    try {
      state.url = UI.url.parse(root.location ? root.location.search : '');
      ensureDom();
      if (state.url.teacher) {
        state.teacher = true;
        state.teacherStore = NM.core.save.createStore({ teacher: true, urlLevel: state.url.level, level: state.url.level || 'm' });
        state.teacherLevelKnown = !!state.url.level;
      }
      applySettings();
      unlockAudioOnce();
      watchSystemMotion();
      go('title');
      checkStorageWarning();
    } catch (e) {
      NM.reportError('ui.start', e);
    }
    api.started = true;
  }

  const api = {
    started: false,
    start, go, refresh, store, isTeacher, canSelectStage,
    get level() { return store().level; },
    get inStage() { return state.inStage; },
    get stageId() { return state.stageId; },
    get urlLevel() { return state.url.level; },
    applySettings, updateSettings, setLevel,
    beginSetup, setupLevel, setupProtagonist, setupNickname, setupBack, setupSteps,
    setupDraft() { return Object.assign({}, state.draft); },
    continueGame, askNewStart, newStart,
    setTeacher, teacherStart, teacherPickLevel,
    requestStage, enterStage,
    openSettings, openNotebook,
    test: {
      state() {
        return {
          screen: screensEl && !screensEl.hidden ? state.screen : null,
          teacher: state.teacher, level: store().level, inStage: state.inStage, stageId: state.stageId,
          urlLevel: state.url.level, reducedMotion: state.reducedMotion, lastExit: state.lastExit || null,
          modals: dom.modals().map(m => m.getAttribute('data-modal'))
        };
      },
      lastImage() { return UI.notebookImage ? UI.notebookImage.last() : null; }
    }
  };
  UI.app = api;
  UI.start = start;
})(typeof window !== 'undefined' ? window : globalThis);
