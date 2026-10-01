'use strict';
/*
 * NM.ui.screens — 화면 그리기 (spec §4·§6·§10-1). 상태와 이동은 NM.ui.app 이 맡고, 여기서는 그리기만 한다.
 *   render(name, rootEl, app, params)
 *   화면 이름: title, setup-level, setup-protagonist, setup-nickname, teacher-level, select
 * 점검이 기대는 표시: #nm-screens[data-screen], 단추의 data-act / data-value, 장면 카드의 data-stage / data-role / data-status,
 *   칭호 줄 [data-part="title"], 별명 칸 #nm-nick, 오류 .nm-error, 첫 초점 [data-primary].
 * 문구는 NM.data.TEXT.ui 에서만 가져온다.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);
  const el = (a, b, c) => dom.el(a, b, c);
  const LEVELS = ['m', 'h1', 'h23'];
  const STAGES = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];

  function inner(rootEl, cls) {
    const box = el('div', { class: 'nm-screen-inner' + (cls ? ' ' + cls : '') });
    rootEl.appendChild(box);
    return box;
  }
  function heading(text, level) { return el(level || 'h2', { class: 'nm-heading', text, attrs: { tabindex: '-1' } }); }
  function teacherBadge() { return el('span', { class: 'nm-badge nm-badge-teacher', text: t('title.teacherBadge') }); }

  /* ---------- 첫 화면 ---------- */
  function title(rootEl, app) {
    const box = inner(rootEl, 'nm-title-screen');
    const h1 = el('h1', { class: 'nm-game-title', attrs: { tabindex: '-1' } }, dom.yet(t('gameTitle'), { bangjeom: true }));
    box.appendChild(h1);
    box.appendChild(el('p', { class: 'nm-game-sub', text: t('gameSub') }));
    const acts = el('div', { class: 'nm-stack' });
    if (app.isTeacher()) {
      box.appendChild(el('p', { class: 'nm-center' }, teacherBadge()));
      acts.appendChild(dom.button(t('title.teacherStart'), 'start', () => app.teacherStart(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
    } else if (!app.setupNeeded()) {
      acts.appendChild(dom.button(t('title.continue'), 'continue', () => app.continueGame(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
      acts.appendChild(dom.button(t('title.newStart'), 'newstart', () => app.askNewStart(), { class: 'nm-btn-big' }));
    } else {
      acts.appendChild(dom.button(t('title.start'), 'start', () => app.beginSetup(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
    }
    acts.appendChild(dom.button(t('title.settings'), 'settings', () => app.openSettings(), { class: 'nm-btn-big' }));
    box.appendChild(acts);
  }

  /* ---------- 처음 정하기 ---------- */
  function stepLine(n, total) { return el('p', { class: 'nm-step', text: t('setup.step', { n, total }) }); }
  // 처음 정하기·교사 학교급 화면에도 설정 단추(설정은 언제든 연다)
  function backRow(onBack, app) {
    return el('div', { class: 'nm-row nm-row-end' }, [
      app ? dom.button(t('title.settings'), 'settings', () => app.openSettings()) : null,
      dom.button(t('back'), 'back', onBack)
    ]);
  }

  function levelChoices(act, current, onPick) {
    const list = el('div', { class: 'nm-choice-list' });
    LEVELS.forEach(lv => {
      list.appendChild(dom.button(null, act, () => onPick(lv), {
        class: 'nm-choice', data: { value: lv }, pressed: current === lv ? true : undefined,
        kids: [el('span', { class: 'nm-choice-main', text: t('levels.' + lv) }), el('span', { class: 'nm-choice-sub', text: t('levelNotes.' + lv) })]
      }));
    });
    return list;
  }

  function setupLevel(rootEl, app) {
    const box = inner(rootEl);
    const steps = app.setupSteps();
    box.appendChild(stepLine(1, steps));
    box.appendChild(heading(t('setup.levelTitle')));
    box.appendChild(el('p', { class: 'nm-help', text: t('setup.levelHelp') }));
    // 정하기 전에 설정에서 학교급을 골라 두었으면 그 값을 미리 표시한다
    const st = app.store();
    const list = levelChoices('level', st.hasRecord ? st.level : null, lv => app.setupLevel(lv));
    list.firstChild.setAttribute('data-primary', '1');
    box.appendChild(list);
    box.appendChild(backRow(() => app.go('title'), app));
  }

  function portrait(n) {
    const A = NM.data.ASSETS && NM.data.ASSETS.portraits;
    const src = A && (A['protagonist' + n] || A['p' + n]);
    if (typeof src !== 'string' || !src) return el('span', { class: 'nm-portrait nm-portrait-empty', attrs: { 'aria-hidden': 'true' }, text: String(n) });
    return el('img', { class: 'nm-portrait', attrs: { src, alt: '', loading: 'lazy' } });
  }
  function setupProtagonist(rootEl, app) {
    const box = inner(rootEl);
    const steps = app.setupSteps();
    box.appendChild(stepLine(steps - 1, steps));
    box.appendChild(heading(t('setup.protagonistTitle')));
    box.appendChild(el('p', { class: 'nm-help', text: t('setup.protagonistHelp') }));
    const grid = el('div', { class: 'nm-hero-grid' });
    [1, 2, 3, 4].forEach(n => {
      grid.appendChild(dom.button(null, 'protagonist', () => app.setupProtagonist(n), {
        class: 'nm-hero', data: { value: n, primary: n === 1 ? '1' : null },
        pressed: app.setupDraft().protagonist === n ? true : undefined,
        kids: [portrait(n), el('span', { class: 'nm-hero-name', text: t('setup.protagonistName', { n }) })]
      }));
    });
    box.appendChild(grid);
    box.appendChild(backRow(() => app.setupBack('setup-protagonist'), app));
  }

  const ERRORS = ['empty', 'tooLong', 'space', 'chars', 'profanity'];
  function setupNickname(rootEl, app, params) {
    const box = inner(rootEl);
    const steps = app.setupSteps();
    box.appendChild(stepLine(steps, steps));
    box.appendChild(heading(t('setup.nicknameTitle')));
    const help = el('p', { class: 'nm-help', text: t('setup.nicknameHelp'), attrs: { id: 'nm-nick-help' } });
    const warn = el('p', { class: 'nm-help nm-warn', text: t('setup.nicknameRealName'), attrs: { id: 'nm-nick-warn' } });
    const err = el('p', { class: 'nm-error', attrs: { id: 'nm-nick-error', role: 'alert', 'aria-live': 'assertive' } });
    const input = el('input', { attrs: {
      id: 'nm-nick', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done',
      'aria-describedby': 'nm-nick-help nm-nick-warn nm-nick-error', 'data-primary': '1'
    } });
    input.value = (params && params.value) || '';
    const okBtn = dom.button(t('setup.nicknameOk'), 'nick-ok', null, { class: 'nm-btn-primary nm-btn-big', attrs: { type: 'submit' } });
    const form = el('form', { class: 'nm-form', attrs: { novalidate: true, autocomplete: 'off' }, on: { submit(ev) {
      ev.preventDefault();
      const r = app.setupNickname(input.value);
      if (r && r.ok === false) {
        const reason = ERRORS.indexOf(r.reason) >= 0 ? r.reason : 'chars';
        err.textContent = t('setup.nicknameErrors.' + reason);
        input.setAttribute('aria-invalid', 'true');
        try { input.focus(); } catch (e) { /* 무시 */ }
      }
    } } }, [
      el('label', { class: 'nm-label', text: t('setup.nicknameLabel'), attrs: { for: 'nm-nick' } }),
      input, err, okBtn
    ]);
    box.appendChild(help);
    box.appendChild(warn);
    box.appendChild(form);
    box.appendChild(backRow(() => app.setupBack('setup-nickname'), app));
  }

  /* ---------- 교사 모드 학교급 ---------- */
  function teacherLevel(rootEl, app) {
    const box = inner(rootEl);
    box.appendChild(el('p', { class: 'nm-center' }, teacherBadge()));
    box.appendChild(heading(t('settings.teacherPickLevel')));
    const list = levelChoices('teacher-level', null, lv => app.teacherPickLevel(lv));
    list.firstChild.setAttribute('data-primary', '1');
    box.appendChild(list);
    box.appendChild(backRow(() => app.go('title'), app));
  }

  /* ---------- 장면 고르기 ---------- */
  function roleBadge(role) {
    const key = { bundle: 'select.roleBundle', optional: 'select.roleOptional', outside: 'select.roleOutside', prologue: 'select.rolePrologue' }[role];
    return key ? el('span', { class: 'nm-badge nm-role-' + role, text: t(key) }) : null;
  }
  function stageCard(app, id) {
    const st = app.store();
    const M = UI.notebookModel;
    const prog = st.stage(id);
    const role = st.bundleRole(id);
    const rec = st.get();
    // 서장 완료는 기록 하나에 한 번(학교급과 상관없음)
    const status = id === 's0' && rec.prologueDone && !app.isTeacher() ? 'done' : prog.status;
    const hasGlyph = (rec.glyphs[st.level] || []).indexOf(id) >= 0;
    const glyph = hasGlyph ? M.carveGlyph(id) : '';
    const name = M.stageName(id);
    const label = M.stageLabel(id);
    const sc = M.sceneOf(id);
    const kids = [
      el('span', { class: 'nm-card-top' }, [
        el('span', { class: 'nm-card-label', text: id === 's0' && app.canSelectStage() && !app.isTeacher() ? t('select.prologueAgain') : label }),
        roleBadge(role)
      ]),
      name !== label ? el('span', { class: 'nm-card-name' }, dom.yet(name)) : null,
      sc && typeof sc.era === 'string' && sc.era ? el('span', { class: 'nm-card-era', text: sc.era }) : null,
      el('span', { class: 'nm-card-bottom' }, [
        status === 'done' ? el('span', { class: 'nm-badge nm-status-done', text: t('select.statusDone') }) : null,
        status === 'progress' ? el('span', { class: 'nm-badge nm-status-progress', text: t('select.statusProgress') }) : null,
        glyph ? el('span', { class: 'nm-card-glyph' }, [
          el('span', { class: 'nm-sr', text: t('select.glyphLabel') }),
          el('span', { class: 'nm-glyph nm-yet', text: glyph })
        ]) : null
      ])
    ];
    return dom.button(null, 'stage', () => app.requestStage(id), {
      class: 'nm-stage-card nm-card-' + role + ' nm-card-' + status,
      data: { stage: id, role, status }, kids
    });
  }
  function select(rootEl, app) {
    const st = app.store();
    const rec = st.get();
    const box = inner(rootEl, 'nm-select-screen');
    const tt = st.title();
    const header = el('header', { class: 'nm-select-head' }, [
      el('div', { class: 'nm-who' }, [
        el('span', { class: 'nm-who-name', text: rec.nickname || t('select.defaultAddress') }),
        el('span', { class: 'nm-badge nm-badge-level', text: t('levels.' + st.level) }),
        app.isTeacher() ? teacherBadge() : null
      ]),
      el('p', { class: 'nm-title-line', data: { part: 'title' } }, [
        el('span', { class: 'nm-title-label', text: t('select.titleLabel') + ' ' }),
        el('strong', { class: 'nm-title-value', text: tt.title }),
        el('span', { class: 'nm-title-count', text: ' · ' + t('select.titleCount', { done: tt.done, total: tt.total }) })
      ]),
      el('div', { class: 'nm-row' }, [
        dom.button(t('select.notebook'), 'notebook', () => app.openNotebook(null)),
        dom.button(t('select.settings'), 'settings', () => app.openSettings()),
        dom.button(t('back'), 'back', () => app.go('title'))
      ])
    ]);
    box.appendChild(header);
    const h = heading(t('select.heading'));
    box.appendChild(h);
    if (app.isTeacher()) box.appendChild(el('p', { class: 'nm-help', text: t('select.prologueSkip') }));
    box.appendChild(el('p', { class: 'nm-legend' }, [
      el('span', { text: t('select.legendBundle') }), el('span', { text: t('select.legendOptional') }),
      el('span', { text: t('select.legendOutside') }), el('span', { text: t('select.legendDone') })
    ]));
    const grid = el('div', { class: 'nm-stage-grid' });
    STAGES.forEach(id => {
      if (id === 's0' && !app.isTeacher() && !app.canSelectStage()) return;
      const card = stageCard(app, id);
      grid.appendChild(card);
    });
    box.appendChild(grid);
    const first = grid.querySelector('[data-role="bundle"]') || grid.firstChild;
    if (first) first.setAttribute('data-primary', '1');
  }

  const SCREENS = {
    title, 'setup-level': setupLevel, 'setup-protagonist': setupProtagonist, 'setup-nickname': setupNickname,
    'teacher-level': teacherLevel, select
  };
  function render(name, rootEl, app, params) {
    const fn = SCREENS[name];
    if (!fn) { NM.reportError('ui.screens', 'unknown screen ' + name); return false; }
    fn(rootEl, app, params || {});
    return true;
  }

  UI.screens = { render, names: Object.keys(SCREENS) };
})(typeof window !== 'undefined' ? window : globalThis);
