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
  function uiArt(key) { const A = NM.data.ASSETS && NM.data.ASSETS.ui; return A && typeof A[key] === 'string' ? A[key] : null; }
  // 그림 칸: 넓은 화면용·세로 화면용 그림을 CSS 변수로(css/ui.css 가 화면 비율에 맞춰 고른다). 꾸밈이라 낭독기에서 숨긴다.
  function artLayer(cls) {
    const art = el('div', { class: cls, attrs: { 'aria-hidden': 'true' } });
    // CSS 변수 속 url() 은 그 변수를 쓰는 CSS 파일 기준으로 풀리므로, 문서 기준 전체 주소로 바꿔 넣는다
    const abs = (u) => { try { return new URL(u, document.baseURI).href; } catch (e) { return u; } };
    const wide = uiArt('titleBg'), tall = uiArt('titleBgTall');
    if (wide) art.style.setProperty('--nm-art-wide', 'url("' + abs(wide) + '")');
    if (tall) art.style.setProperty('--nm-art-tall', 'url("' + abs(tall) + '")');
    return art;
  }
  /* 종이 화면(처음 정하기·교사 학교급·장면 고르기)의 머리 띠: 노을 그림 위 먹빛 가림막과 한지색 제목. 띠는 화면 너비 끝까지. */
  function banner(rootEl, kids, cls) {
    const band = el('header', { class: 'nm-banner' + (cls ? ' ' + cls : '') }, [artLayer('nm-banner-art'), el('div', { class: 'nm-banner-inner' }, kids)]);
    rootEl.appendChild(band);
    return band;
  }

  /* ---------- 첫 화면 ----------
   * 온 화면 그림(ASSETS.ui.titleBg) 위에 먹빛 가림막, 큰 제목과 붉은 原文 낙관, 빛 조각처럼 떠오르는 옛 글자(꾸밈, 낭독기에서 숨김).
   * 움직임(그림·제목·낙관이 차례로 드러남, 글자 조각)은 css/ui.css — html.nm-reduced-motion 이면 멈추고 글자 조각은 숨긴다.
   * 점검이 기대는 data-act(start·continue·newstart·settings·credits)와 교사 배지는 그대로 둔다. */
  function titleArt(rootEl) {
    rootEl.appendChild(artLayer('nm-title-art'));
    rootEl.appendChild(el('div', { class: 'nm-title-scrim', attrs: { 'aria-hidden': 'true' } }));
    const glyphs = NM.data.TEXT.ui.titleGlyphs;
    if (!Array.isArray(glyphs) || !glyphs.length) return;
    const motes = el('div', { class: 'nm-title-motes', attrs: { 'aria-hidden': 'true' } });
    // 자리·크기·때는 번호로 정한다(다시 그려도 같은 모양)
    for (let i = 0; i < 18; i++) {
      const r = (k) => ((i * 7919 + k * 104729) % 997) / 997;
      const m = el('span', { class: 'nm-title-mote', text: String(glyphs[i % glyphs.length]) });
      m.style.setProperty('--x', (4 + r(1) * 92).toFixed(1) + '%');
      m.style.setProperty('--y', (38 + r(2) * 60).toFixed(1) + '%');
      m.style.setProperty('--sz', (14 + r(3) * 22).toFixed(0) + 'px');
      m.style.setProperty('--dur', (9 + r(4) * 9).toFixed(1) + 's');
      m.style.setProperty('--delay', (-r(5) * 16).toFixed(1) + 's');
      m.style.setProperty('--dx', ((r(6) - .5) * 80).toFixed(0) + 'px');
      motes.appendChild(m);
    }
    rootEl.appendChild(motes);
  }
  function title(rootEl, app) {
    titleArt(rootEl);
    const box = inner(rootEl, 'nm-title-screen');
    const card = el('div', { class: 'nm-title-card' });
    const h1 = el('h1', { class: 'nm-game-title', attrs: { tabindex: '-1' } }, [
      el('span', { class: 'nm-game-title-text' }, dom.yet(t('gameTitle'), { bangjeom: true })),
      el('span', { class: 'nm-title-seal', attrs: { 'aria-hidden': 'true' } }, Array.from(t('title.seal')).map(ch => el('span', { text: ch })))
    ]);
    card.appendChild(h1);
    card.appendChild(el('p', { class: 'nm-game-sub', text: t('gameSub') }));
    const acts = el('div', { class: 'nm-stack nm-title-acts' });
    if (app.isTeacher()) {
      card.appendChild(el('p', { class: 'nm-title-badge' }, teacherBadge()));
      acts.appendChild(dom.button(t('title.teacherStart'), 'start', () => app.teacherStart(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
    } else if (!app.setupNeeded()) {
      acts.appendChild(dom.button(t('title.continue'), 'continue', () => app.continueGame(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
      acts.appendChild(dom.button(t('title.newStart'), 'newstart', () => app.askNewStart(), { class: 'nm-btn-big nm-btn-ghost' }));
    } else {
      acts.appendChild(dom.button(t('title.start'), 'start', () => app.beginSetup(), { class: 'nm-btn-primary nm-btn-big', data: { primary: '1' } }));
    }
    acts.appendChild(el('div', { class: 'nm-title-minor' }, [
      dom.button(t('title.settings'), 'settings', () => app.openSettings(), { class: 'nm-btn-quiet' }),
      dom.button(t('title.credits'), 'credits', () => openCredits(), { class: 'nm-btn-quiet' }),
      UI.fullscreen && UI.fullscreen.supported() ? UI.fullscreen.button({ cls: 'nm-btn-quiet' }) : null
    ]));
    card.appendChild(acts);
    box.appendChild(card);
  }

  /* ---------- 만든 사람들 (spec §16: 배경음 출처를 게임 안에도 적는다) ---------- */
  function openCredits() {
    if (dom.isOpen('credits')) return null;
    const C = NM.data.CREDITS && Array.isArray(NM.data.CREDITS.sections) ? NM.data.CREDITS.sections : [];
    const body = el('div', { class: 'nm-credits' }, C.map(s => el('section', { class: 'nm-credits-sec' }, [
      el('h3', { class: 'nm-credits-title', text: String(s.title || '') })
    ].concat((s.lines || []).map(line => el('p', { class: 'nm-credits-line' }, dom.yet(String(line))))))));
    return dom.openModal(body, { name: 'credits', titleKey: 'title.credits' });
  }

  /* ---------- 처음 정하기 ---------- */
  // 단계 표시: 붉은 낙관 점(지난·지금 단계는 칠함, 꾸밈) + 글자 '1 / 3'
  function stepLine(n, total) {
    const dots = el('span', { class: 'nm-step-dots', attrs: { 'aria-hidden': 'true' } });
    for (let i = 1; i <= total; i++) dots.appendChild(el('span', { class: 'nm-step-dot' + (i < n ? ' is-done' : i === n ? ' is-now' : '') }));
    return el('p', { class: 'nm-step' }, [dots, el('span', { class: 'nm-step-text', text: t('setup.step', { n, total }) })]);
  }
  // 처음 정하기·교사 학교급 화면에도 설정 단추(설정은 언제든 연다)
  function backRow(onBack, app) {
    return el('div', { class: 'nm-row nm-row-end' }, [
      app ? dom.button(t('title.settings'), 'settings', () => app.openSettings()) : null,
      dom.button(t('back'), 'back', onBack)
    ]);
  }

  function levelChoices(act, current, onPick) {
    const list = el('div', { class: 'nm-choice-list nm-level-list' });
    LEVELS.forEach(lv => {
      const src = uiArt({ m: 'levelM', h1: 'levelH1', h23: 'levelH23' }[lv]);
      list.appendChild(dom.button(null, act, () => onPick(lv), {
        class: 'nm-choice nm-choice-level', data: { value: lv }, pressed: current === lv ? true : undefined,
        kids: [
          src ? el('img', { class: 'nm-choice-art', attrs: { src, alt: '', 'aria-hidden': 'true', loading: 'lazy', draggable: 'false' } }) : null,
          el('span', { class: 'nm-choice-text' }, [
            el('span', { class: 'nm-choice-main', text: t('levels.' + lv) }),
            el('span', { class: 'nm-choice-sub', text: t('levelNotes.' + lv) })
          ])
        ]
      }));
    });
    return list;
  }

  function setupLevel(rootEl, app) {
    const steps = app.setupSteps();
    banner(rootEl, [stepLine(1, steps), heading(t('setup.levelTitle'))]);
    const box = inner(rootEl, 'nm-paper-inner');
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
    const src = A && (A['protagonist' + n] || A['p' + n] || A['hero_' + n + '_smile'] || A['hero_' + n + '_neutral']);
    if (typeof src !== 'string' || !src) return el('span', { class: 'nm-portrait nm-portrait-empty', attrs: { 'aria-hidden': 'true' }, text: String(n) });
    return el('img', { class: 'nm-portrait', attrs: { src, alt: '', loading: 'lazy' } });
  }
  function setupProtagonist(rootEl, app) {
    const steps = app.setupSteps();
    banner(rootEl, [stepLine(steps - 1, steps), heading(t('setup.protagonistTitle'))]);
    const box = inner(rootEl, 'nm-paper-inner');
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
    const steps = app.setupSteps();
    banner(rootEl, [stepLine(steps, steps), heading(t('setup.nicknameTitle'))]);
    const box = inner(rootEl, 'nm-paper-inner');
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
    banner(rootEl, [el('p', { class: 'nm-banner-badge' }, teacherBadge()), heading(t('settings.teacherPickLevel'))]);
    const box = inner(rootEl, 'nm-paper-inner');
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
          /^[〮〯]$/.test(glyph) ? el('span', { class: 'nm-glyph nm-yet', text: NM.core.yet.soloTone(glyph) }) : el('span', { class: 'nm-glyph' }, dom.yet(glyph, { bangjeom: true }))
        ]) : null
      ])
    ];
    // 장면 첫 그림의 작은 판(꾸밈 — 이름은 글자로 읽는다)
    const TH = NM.data.ASSETS && NM.data.ASSETS.thumbs;
    const thumb = TH && typeof TH[id] === 'string' ? TH[id] : null;
    return dom.button(null, 'stage', () => app.requestStage(id), {
      class: 'nm-stage-card nm-card-' + role + ' nm-card-' + status + (thumb ? ' has-thumb' : ''),
      data: { stage: id, role, status },
      kids: thumb ? [el('img', { class: 'nm-card-thumb', attrs: { src: thumb, alt: '', 'aria-hidden': 'true', loading: 'lazy', draggable: 'false' } }), el('span', { class: 'nm-card-body' }, kids)] : kids
    });
  }
  function select(rootEl, app) {
    const st = app.store();
    const rec = st.get();
    const tt = st.title();
    const icon = (key) => { const src = uiArt(key); return src ? el('img', { class: 'nm-tb-icon', attrs: { src, alt: '', 'aria-hidden': 'true', draggable: 'false' } }) : null; };
    const header = el('div', { class: 'nm-select-head' }, [
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
      el('div', { class: 'nm-row nm-select-tools' }, [
        dom.button(null, 'notebook', () => app.openNotebook(null), { kids: [icon('notebook'), el('span', { text: t('select.notebook') })] }),
        dom.button(null, 'settings', () => app.openSettings(), { kids: [icon('settings'), el('span', { text: t('select.settings') })] }),
        dom.button(t('back'), 'back', () => app.go('title'))
      ])
    ]);
    banner(rootEl, [header], 'nm-banner-select');
    const box = inner(rootEl, 'nm-paper-inner nm-select-screen');
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
