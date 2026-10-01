'use strict';
/*
 * NM.ui.stage — 장면 진행기. 모든 장면이 같은 틀(spec §7)로 돈다:
 *   1 의뢰 전 도입(intro) → 의뢰(request) → 2 원문과 마주침(encounter) → 3 선배의 풀이 예시(example)
 *   → (앞 장면 규칙이 필요한데 모르면) 선배의 짧은 설명(needs) → 4 탐색·해독(맵 + 맥락·항목 창)
 *   → 5 통역(translate) → 6 새김(패 글자) → 돌아보기 한 줄 → 수첩 이미지 저장 제안 → onExit
 *   통역 뒤에 퀴즈는 없다. 판정은 NM.core.rules(store 를 거쳐)로만, 항목 id·카드 id 로 한다.
 *
 * ■ 공개 API
 *   run(stageId, ctx) → Promise<bool>  ctx = { store, level, teacher, onExit(result), saveImage?(), openNotebook?() }
 *       store 는 NM.core.save.createStore(...) (교사 모드면 메모리 저장소 — 같은 API, 학생 기록을 읽지도 쓰지도 않음).
 *       학교급은 store.level 을 쓴다(ctx.level 은 참고). 맵을 불러오고 첫 창(도입 또는 탐색)을 연 뒤 풀린다.
 *       onExit({ stageId, completed, reason:'done'|'exit'|'noScene', newlyDone, glyphAdded, saved })
 *   exit()              장면 나가기(HUD 의 '장면 나가기' 단추와 같음) → onExit(completed:false) 한 번
 *   stop()              조용히 멈춤(창·HUD·사건 정리, onExit 부르지 않음). 부른 쪽이 화면을 옮길 때.
 *   applySettings(settings?)  설정 다시 적용(방점·글자 크기·움직임 줄이기·소리). s4·s10 은 방점 늘 켬.
 *                       document 의 'nm:settings' 사건(detail { settings, reducedMotion, ... })도 듣고 같은 일을 한다.
 *                       방점은 다시 그리지 않고 <html data-nm-bangjeom> 으로 점만 숨기거나 보인다.
 *                       --fs 는 U1 이 html 에 두면 U1 몫, 아무도 두지 않았을 때만 진행기가 둔다(1 / 1.25 / 1.5).
 *   current()           { stageId, phase }  phase: idle|loading|intro|explore|translate|end|done|exited
 *   unknownRules(stageId, store)  수첩의 '아직 확인하지 않은 규칙' 칸용 [{ rule, name, text, stage, stageName }]
 *   openContext(contextId), openItem(itemId)  교사 진행·점검용(보통은 맵의 살피기와 HUD 가 부른다)
 *
 * ■ 장면 데이터 모양 (NM.data.SCENES[id], 파일 js/data/scenes/<id>.js — 자세한 설명은 js/data/scenes/README.md)
 *   { id, title, era, mapKey, bgmKey, carveGlyph, bangjeomAlways?,
 *     cast: { <who>: { name, portrait } },               대사의 who 키(선배 'senior'·'sejong'·'me'·'narrator' 는 따로 없어도 됨)
 *     intro: [줄], request: [줄],
 *     encounter: { orig: [원문 블록 id], lines: [줄] },    원문과 마주침(선택)
 *     example:   { orig: [원문 블록 id], lines: [줄] },    선배의 풀이 예시(선택)
 *     needs: [{ rule: 'rule.x', lines: [줄] }],            앞 장면에서 배우는 규칙(모르면 짧은 설명 + 아직 확인하지 않은 규칙 카드)
 *     contexts: [{ id, label, orig: [블록 id], lines: [줄], items: [항목 id] }],
 *     items: [ 해독 { id, kind:'read', levels, label, prompt?, sentence?('{?}' 빈칸 — 규칙 문장 완성), word?, wordForms?, gloss?,
 *                     cards:[{id,text,correct,why}], explain, hints:[힌트, 빛낼 맥락 id], misread:{카드 id:[줄]}, ruleCard? }
 *              과제 { id, kind:'task', levels, label?, prompt?, gimmick, config, answer, hints:[힌트, 강조 대상], explain } ],
 *     npcs?: { <npcId>: { name, lines: [줄] } },          맥락이 아닌 인물의 말(선택). name 은 장소 목록 이름표로도 쓰인다
 *     notes: [{ id, kind:'know'|'variant'|'interp', text, src, at: [맥락 id] }],
 *     fiction: [{ id, text, real }],
 *     translate: { id?, text?, at?(맥락 id 또는 npcId — 있으면 그곳에서 통역), lines: [줄] },
 *     translations?: [{ id, text, orig? }],               기믹이 store.addTranslation 으로 남기는 옮긴 구절(수첩용)
 *     editions?: { m: { ...그 학교급 판에서 바꿀 필드 } } }
 *   줄 = 문자열 또는 { who, text, portrait?, expr?(표정: neutral|surprised|smile|thinking), cg?(ASSETS.cg 키), fiction?, mark?, src? } (js/ui/dialog.js)
 *   원문 글자는 장면 데이터에 쓰지 않는다 — 블록 id 로만 가리키고 NM.data.ORIG(자동 생성)에서 그린다.
 * 필요: core(yet·rules·save), engine(api), ui(stage-text·stage-logic·stage-yet·marker·stage-window·dialog·rulecard·
 *       stage-gimmick·item-read·item-task·stage-end), data/text-stage.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const L = () => NM.ui.stageLogic;
  const YB = () => NM.ui.stageYet;
  const MK = () => NM.ui.marker;
  const E = () => NM.engine;
  const FONT_SCALE = { 1: 1, 2: 1.25, 3: 1.5 };

  let cur = null;
  let last = { stageId: null, phase: 'idle' };
  let token = 0;

  const alive = (my) => !!cur && cur.token === my && !cur.tearing;
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function setPhase(p) { if (cur) { cur.phase = p; last = { stageId: cur.stageId, phase: p }; } }
  function plain(text) {
    try { return NM.core.yet.render(String(text == null ? '' : text), { bangjeom: false, ruby: 'base' }); }
    catch (e) { return String(text); }
  }
  function sfx(name) { try { if (E().audio) E().audio.sfx(name); } catch (e) { NM.reportError('stage.sfx', e); } }
  function stageProg() { return cur.store.stage(cur.stageId); }
  function coreItems() { return cur.store.coreItems(cur.scene); }
  function isCore(id) { return coreItems().some(i => i.id === id); }

  /* ---------- 문구 환경 ---------- */
  function fill(text) {
    return TX().fill(text, { nickname: cur ? cur.store.get().nickname : '', teacher: cur ? cur.teacher : false });
  }
  function dialogEnv() {
    return {
      scene: cur.scene, store: cur.store, teacher: cur.teacher, fill,
      callName: () => TX().callName({ nickname: cur.store.get().nickname, teacher: cur.teacher }),
      solved: () => L().solvedWords(cur.scene, stageProg()),
      seenFiction: (id) => cur.store.hasSeenNotice('fiction:' + id),
      markFiction: (id) => { cur.store.markNotice('fiction:' + id); }
    };
  }
  function play(lines, opts) {
    return NM.ui.dialog.play(lines, Object.assign({ env: dialogEnv() }, opts || {}));
  }
  function titleNode(text) {
    const s = el('span', 'nm-st-text');
    s.appendChild(YB().build(fill(text || ''), {}));
    return s;
  }

  /* ---------- 설정 ---------- */
  // 설정 적용. U1 이 'nm:settings'(detail.settings) 를 보내면 그 값을 쓰고(교사 모드 설정은 기록에 없으므로),
  // 없으면 store 의 설정. --fs 는 U1 이 html 에 두면 U1 몫이고, 아무도 두지 않았을 때만 진행기가 둔다.
  function currentSettings() {
    return (cur && cur.settingsOverride) || (cur ? cur.store.get().settings : null) || {};
  }
  function applySettings(override) {
    if (!cur) return;
    if (override && typeof override === 'object') cur.settingsOverride = override;
    const html = document.documentElement;
    const s = currentSettings();
    const bj = L().bangjeomFor(cur.stageId, cur.scene, s);
    html.setAttribute('data-nm-bangjeom', bj ? 'on' : 'off');
    try { NM.core.yet.setBangjeom(bj); } catch (e) { NM.reportError('stage.settings', e); }
    if (cur.fsOwned) html.style.setProperty('--fs', String(FONT_SCALE[s.fontScale] || 1));
    let reduce = s.reducedMotion === true;
    if (typeof cur.reducedOverride === 'boolean') reduce = cur.reducedOverride;
    else if (s.reducedMotion === 'auto' || s.reducedMotion === undefined) {
      reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    html.setAttribute('data-nm-motion', reduce ? 'reduce' : 'full');
    try {
      E().setReducedMotion(reduce);
      if (E().audio) { E().audio.setBgmEnabled(s.bgm !== false); E().audio.setSfxEnabled(s.sfx !== false); }
    } catch (e) { NM.reportError('stage.settings', e); }
    cur.eff = { bangjeom: bj, reducedMotion: reduce };
  }

  /* ---------- HUD ---------- */
  function buildHud() {
    const layer = E().hud.init().layer;
    const hud = el('aside', 'nm-st-hud');
    hud.setAttribute('aria-label', TX().t('hudLabel'));
    hud.hidden = true;
    layer.appendChild(hud);
    cur.hud = hud;
  }
  function stateBits(item, rec) {
    const st = rec ? rec.state : (item.kind === 'task' ? 'open' : 'unseen');
    return { st, sym: TX().t('stateSym.' + st), text: TX().t('state.' + st) };
  }
  function refreshHud() {
    if (!cur || !cur.hud) return;
    const hud = cur.hud;
    hud.textContent = '';
    // 머리(제목·시대·끝낸 수)는 접기 단추. 좁은 화면에서는 처음에 접혀 있다.
    const items = coreItems();
    const prog0 = stageProg();
    const doneN = items.filter(it => NM.core.rules.isItemDone(prog0.items[it.id])).length;
    const head = el('button', 'nm-st-hud-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', String(cur.hudOpen));
    const title = el('span', 'nm-st-hud-title');
    title.appendChild(YB().build(cur.scene.title || '', {}));
    head.appendChild(title);
    if (cur.scene.era) { const era = el('span', 'nm-st-hud-era'); era.appendChild(YB().build(cur.scene.era, {})); head.appendChild(era); }
    head.appendChild(el('span', 'nm-st-hud-count', TX().t('stateSym.done') + ' ' + doneN + '/' + items.length));
    const chev = el('span', 'nm-st-hud-chev', cur.hudOpen ? '▴' : '▾');
    chev.setAttribute('aria-hidden', 'true');
    head.appendChild(chev);
    head.addEventListener('click', () => { cur.hudOpen = !cur.hudOpen; refreshHud(); const h = cur.hud.querySelector('.nm-st-hud-head'); if (h) h.focus(); });
    hud.appendChild(head);
    if (cur.translateReady) hud.appendChild(el('p', 'nm-st-hud-goal', TX().t('goTranslate')));
    if (!cur.hudOpen) return;
    if (!cur.translateReady) hud.appendChild(el('p', 'nm-st-hud-sub', TX().t('hudItems')));
    const ul = el('ul', 'nm-st-hud-list');
    const prog = stageProg();
    coreItems().forEach(item => {
      const rec = prog.items[item.id] || null;
      const b = stateBits(item, rec);
      const li = el('li');
      const btn = el('button', 'nm-st-hud-item');
      btn.type = 'button';
      btn.setAttribute('data-item', item.id);
      btn.setAttribute('data-state', b.st);
      const sym = el('span', 'nm-st-sym', b.sym);
      sym.setAttribute('aria-hidden', 'true');
      btn.appendChild(sym);
      const name = el('span', 'nm-st-hud-name');
      if (item.kind === 'read' && b.st === 'unseen') { name.textContent = TX().t('state.unseen'); btn.disabled = true; }
      else name.appendChild(YB().build(fill(item.label || item.id), {}));
      btn.appendChild(name);
      const meta = el('span', 'nm-st-hud-state', b.text);
      if (item.kind === 'read' && rec && !NM.core.rules.isItemDone(rec) && b.st !== 'unseen') {
        meta.textContent = b.text + ' · ' + Math.min(rec.seenContexts.length, 2) + '/2';
      }
      if (b.st !== 'unseen' || item.kind === 'task') btn.appendChild(meta);
      btn.addEventListener('click', () => openItem(item.id));
      li.appendChild(btn);
      ul.appendChild(li);
    });
    hud.appendChild(ul);
    const acts = el('div', 'nm-st-hud-actions');
    if (typeof cur.ctx.openNotebook === 'function') {
      const nb = el('button', 'nm-st-btn nm-st-notebook', TX().t('btn.notebook'));
      nb.type = 'button';
      nb.addEventListener('click', () => { try { cur.ctx.openNotebook(); } catch (e) { NM.reportError('stage.notebook', e); } });
      acts.appendChild(nb);
    }
    const ex = el('button', 'nm-st-btn nm-st-exit', TX().t('btn.exit'));
    ex.type = 'button';
    ex.addEventListener('click', () => exit());
    acts.appendChild(ex);
    hud.appendChild(acts);
  }

  /* ---------- 목표·빛남 ---------- */
  function updateObjectives() {
    if (!cur || cur.phase !== 'explore') return;
    const at = cur.scene.translate && cur.scene.translate.at;
    if (cur.translateReady && at) E().setObjective([at]);
    else E().setObjective(L().objectives(cur.scene, stageProg(), coreItems()));
  }
  function updateGlow() {
    if (!cur) return;
    const prog = stageProg();
    let glow = null;
    coreItems().some(it => {
      const rec = prog.items[it.id];
      if (it.kind !== 'read' || !rec || NM.core.rules.isItemDone(rec)) return false;
      const hv = NM.core.rules.helpView(it, rec);
      if (hv.glow) { glow = hv.glow; return true; }
      return false;
    });
    if (cur.glow !== glow) { cur.glow = glow; E().highlight(glow); }
  }
  function afterChange() {
    if (!cur) return;
    refreshHud();
    updateObjectives();
    updateGlow();
    cur.ctxWins.forEach(v => { if (v.w.isOpen()) renderContext(v.w, v.cx); });
  }
  function afterWindowClosed() {
    if (!cur || cur.tearing) return;
    afterChange();
    maybeTranslate();
  }

  /* ---------- 맥락 창 ---------- */
  function renderContext(w, cx) {
    const body = w.body;
    body.textContent = '';
    const solved = L().solvedWords(cur.scene, stageProg());
    (Array.isArray(cx.orig) ? cx.orig : []).forEach(id => { const o = MK().orig(id, { solved }); if (o) body.appendChild(o); });
    const lines = Array.isArray(cx.lines) ? cx.lines : [];
    if (lines.length) {
      const box = el('div', 'nm-ctx-lines');
      const env = dialogEnv();
      lines.forEach(ln => box.appendChild(NM.ui.dialog.lineEl(ln, env)));
      body.appendChild(box);
    }
    (Array.isArray(cur.scene.notes) ? cur.scene.notes : []).forEach(n => {
      if (!n || !Array.isArray(n.at) || n.at.indexOf(cx.id) < 0) return;
      body.appendChild(MK().card({ kind: n.kind, text: n.text, src: n.src, title: n.title, fill, solved }));
    });
    const ids = Array.isArray(cx.items) ? cx.items : [];
    const core = ids.filter(isCore);
    const others = ids.filter(id => !isCore(id)).map(id => L().itemById(cur.scene, id)).filter(Boolean);
    if (core.length) {
      const sec = el('div', 'nm-ctx-items');
      sec.appendChild(el('p', 'nm-ctx-items-label', TX().t('itemsHere')));
      const prog = stageProg();
      core.forEach(id => {
        const item = L().itemById(cur.scene, id);
        const b = stateBits(item, prog.items[id] || null);
        const btn = el('button', 'nm-st-btn nm-st-ctx-item');
        btn.type = 'button';
        btn.setAttribute('data-item', id);
        btn.setAttribute('data-state', b.st);
        const sym = el('span', 'nm-st-sym', b.sym);
        sym.setAttribute('aria-hidden', 'true');
        btn.appendChild(sym);
        const nm = el('span', 'nm-st-ctx-name');
        nm.appendChild(YB().build(fill(item.label || id), {}));
        btn.appendChild(nm);
        btn.appendChild(el('span', 'nm-st-ctx-state', b.text));
        btn.addEventListener('click', () => openItem(id));
        sec.appendChild(btn);
      });
      body.appendChild(sec);
    }
    others.forEach(item => {
      body.appendChild(MK().card({ kind: 'know', title: item.label, text: item.explain, item: item.id, fill, solved }));
    });
  }

  function openContext(contextId) {
    if (!cur) return null;
    const cx = L().contextById(cur.scene, contextId);
    if (!cx) { NM.reportError('stage.context', 'unknown context: ' + contextId); return null; }
    const r = cur.store.seeContext(cur.scene, contextId);
    if (!r || !r.ok) NM.reportError('stage.seeContext', r && r.reason);
    refreshHud();
    updateObjectives();
    updateGlow();
    const view = { w: null, cx };
    view.w = NM.ui.stageWindow.open({
      win: 'context', title: titleNode(cx.label), data: { context: contextId }, className: 'nm-st-ctxwin',
      build(w) { renderContext(w, cx); },
      onClose(reason) {
        const i = cur ? cur.ctxWins.indexOf(view) : -1;
        if (i >= 0) cur.ctxWins.splice(i, 1);
        if (reason !== 'all') afterWindowClosed();
      }
    });
    cur.ctxWins.push(view);
    return view.w;
  }

  /* ---------- 항목 창 ---------- */
  function itemEnv() {
    const sc = cur.scene, store = cur.store;
    return {
      scene: sc, level: store.level, teacher: cur.teacher, fill, sfx,
      rec: (id) => stageProg().items[id] || null,
      choose: (id, cardId) => { const r = store.choose(sc, id, cardId); afterChange(); return r; },
      confirm: (id) => { const r = store.confirm(sc, id); afterChange(); return r; },
      submit: (id, ok) => { const r = store.submit(sc, id, ok); afterChange(); return r; },
      dialog: (lines, o) => play(lines, o),
      contextLabel: (id) => { const c = L().contextById(sc, id); return c ? plain(c.label) : id; },
      ruleCard: (id) => (NM.data.RULE_CARDS && NM.data.RULE_CARDS[id]) || null,
      solved: () => L().solvedWords(sc, stageProg()),
      settings: () => cur.eff || { bangjeom: true, reducedMotion: false },
      knownRules: () => L().knownRules(store.get(), store.level),
      addTranslation: (tid) => (typeof tid === 'string' && tid ? store.addTranslation(cur.stageId, tid) : null),
      onItemClosed: () => afterWindowClosed()
    };
  }
  function openItem(itemId) {
    if (!cur) return null;
    const item = L().itemById(cur.scene, itemId);
    if (!item || !isCore(itemId)) { NM.reportError('stage.item', 'not a core item: ' + itemId); return null; }
    return item.kind === 'task' ? NM.ui.itemTask.open(itemEnv(), itemId) : NM.ui.itemRead.open(itemEnv(), itemId);
  }

  /* ---------- 맵 살피기 ---------- */
  function onInteract(p) {
    if (!cur || cur.phase !== 'explore' || !p) return;
    if (NM.ui.stageWindow.count() || E().isOverlayOpen()) return;
    const tr = cur.scene.translate || {};
    if (cur.translateReady && tr.at && (p.contextId === tr.at || p.npcId === tr.at)) { startTranslate(); return; }
    if (p.contextId) { openContext(p.contextId); return; }
    if (p.npcId) {
      const n = cur.scene.npcs && cur.scene.npcs[p.npcId];
      if (n && Array.isArray(n.lines)) play(n.lines, { kind: 'npc', title: n.name ? titleNode(n.name) : undefined });
    }
  }

  /* ---------- 흐름 ---------- */
  function unknownRuleCard(u) {
    const c = el('div', 'nm-card nm-card-unknown');
    c.setAttribute('data-rule', u.rule);
    const head = el('div', 'nm-card-head');
    head.appendChild(el('span', 'nm-mark nm-mark-unknown', TX().t('unknownRule')));
    if (u.name) { const t = el('span', 'nm-card-title'); t.appendChild(YB().build(u.name, {})); head.appendChild(t); }
    c.appendChild(head);
    if (u.stageName) c.appendChild(el('p', 'nm-card-text', TX().t('learnAt', { stage: u.stageName })));
    return c;
  }

  function intro(my) {
    const sc = cur.scene;
    const fic = (Array.isArray(sc.fiction) ? sc.fiction : []).filter(f => f && f.id && !cur.store.hasSeenNotice('fiction:' + f.id)).map(f => {
      const card = MK().card({ kind: 'fiction', text: f.text, real: f.real, showReal: true, fill });
      cur.store.markNotice('fiction:' + f.id);
      return card;
    });
    const origs = (part) => (part && Array.isArray(part.orig) ? part.orig : []).map(id => MK().orig(id, { solved: [] })).filter(Boolean);
    const steps = [
      () => play(sc.intro, { kind: 'intro', title: titleNode(sc.title), extras: fic }),
      () => play(sc.request, { kind: 'request', title: TX().t('win.request') }),
      () => play(sc.encounter && sc.encounter.lines, { kind: 'encounter', title: TX().t('win.encounter'), extras: origs(sc.encounter) }),
      () => play(sc.example && sc.example.lines, { kind: 'example', title: TX().t('win.example'), extras: origs(sc.example) }),
      () => {
        const unk = L().unknownRules(sc, cur.store.get(), cur.store.level);
        if (!unk.length) return Promise.resolve();
        const lines = [];
        unk.forEach(u => u.lines.forEach(l => lines.push(l)));
        return play(lines, { kind: 'needs', title: TX().t('win.needs'), extras: unk.map(unknownRuleCard) });
      }
    ];
    let p = Promise.resolve();
    steps.forEach(step => { p = p.then(() => (alive(my) ? step() : null)); });
    return p.then(() => { if (alive(my)) enterExplore(); })
      .catch(e => NM.reportError('stage.intro', e));
  }

  function enterExplore() {
    setPhase('explore');
    cur.hud.hidden = false;
    refreshHud();
    updateObjectives();
    updateGlow();
    maybeTranslate();
  }

  function coreComplete() { return NM.core.rules.isCoreComplete(stageProg(), cur.scene, cur.store.level); }

  function maybeTranslate() {
    if (!cur || cur.phase !== 'explore' || !coreComplete()) return;
    if (NM.ui.stageWindow.count() || E().isOverlayOpen()) return;
    const tr = cur.scene.translate || {};
    if (tr.at) {
      if (!cur.translateReady) { cur.translateReady = true; refreshHud(); updateObjectives(); }
      return;
    }
    startTranslate();
  }

  function startTranslate() {
    if (!cur || cur.phase !== 'explore') return;
    const my = cur.token;
    const sc = cur.scene;
    const tr = sc.translate || {};
    setPhase('translate');
    cur.translateReady = false;
    cur.hud.hidden = true;
    E().setObjective([]);
    cur.glow = null;
    E().highlight(null);
    play(tr.lines, { kind: 'translate', title: TX().t('win.translate') }).then(() => {
      if (!alive(my)) return null;
      if (typeof tr.id === 'string' && tr.id) cur.store.addTranslation(cur.stageId, tr.id);
      const res = cur.store.completeStage(sc);
      if (!res || !res.ok) NM.reportError('stage.complete', res && res.reason);
      setPhase('end');
      return NM.ui.stageEnd.run({
        scene: sc, sfx, alive: () => alive(my),
        reducedMotion: () => !!(cur && cur.eff && cur.eff.reducedMotion),
        setReflection: (text) => { if (alive(my)) cur.store.setReflection(cur.stageId, text); },
        saveImage: typeof cur.ctx.saveImage === 'function' ? () => cur.ctx.saveImage() : undefined
      }).then(r => {
        if (!alive(my)) return;
        finish(true, 'done', { newlyDone: !!(res && res.newlyDone), glyphAdded: !!(res && res.glyphAdded), saved: !!(r && r.saved) });
      });
    }).catch(e => NM.reportError('stage.translate', e));
  }

  /* ---------- 시작·끝 ---------- */
  function teardown() {
    if (!cur) return;
    const c = cur;
    c.tearing = true;
    c.offs.forEach(off => { try { off(); } catch (e) { /* 무시 */ } });
    try { NM.ui.stageWindow.closeAll(); } catch (e) { NM.reportError('stage.teardown', e); }
    try {
      E().highlight(null);
      E().setObjective([]);
      if (E().audio) E().audio.stopBgm();
    } catch (e) { NM.reportError('stage.teardown', e); }
    if (c.hud && c.hud.parentNode) c.hud.parentNode.removeChild(c.hud);
    const html = document.documentElement;
    const s = c.settingsOverride || c.store.get().settings || {};
    try { NM.core.yet.setBangjeom(s.bangjeom !== false); } catch (e) { /* 무시 */ }
    html.setAttribute('data-nm-bangjeom', s.bangjeom !== false ? 'on' : 'off');
    html.removeAttribute('data-nm-teacher');
    if (c.fsOwned) html.style.removeProperty('--fs');
    cur = null;
  }

  function finish(completed, reason, info) {
    if (!cur) return;
    const ctx = cur.ctx, stageId = cur.stageId;
    teardown();
    last = { stageId, phase: completed ? 'done' : 'exited' };
    const result = Object.assign({ stageId, completed: !!completed, reason, newlyDone: false, glyphAdded: false, saved: false }, info || {});
    if (typeof ctx.onExit === 'function') {
      try { ctx.onExit(result); } catch (e) { NM.reportError('stage.onExit', e); }
    }
  }

  function exit() { finish(false, 'exit'); }

  // 처음부터 시작하는가: 새 장면이거나, 다시 하기(store.replay)로 항목이 모두 처음 상태면 도입부터.
  // 장면 도중 다시 열면(살핀 맥락·고른 카드·제출이 있으면) 도입 없이 탐색으로 이어 간다.
  function isFresh(prog) {
    if (!prog || prog.status === 'new') return true;
    const items = prog.items || {};
    return Object.keys(items).every(id => {
      const r = items[id];
      return r && (r.state === 'unseen' || r.state === 'open') && !(r.wrongs > 0) &&
        !(Array.isArray(r.seenContexts) && r.seenContexts.length);
    });
  }

  function run(stageId, ctx) {
    if (cur) teardown();
    const c = ctx || {};
    const store = c.store;
    const raw = NM.data.SCENES && NM.data.SCENES[stageId];
    if (!store || !raw) {
      NM.reportError('stage.run', !store ? 'no store' : 'no scene: ' + stageId);
      last = { stageId, phase: 'exited' };
      if (typeof c.onExit === 'function') {
        try { c.onExit({ stageId, completed: false, reason: 'noScene', newlyDone: false, glyphAdded: false, saved: false }); }
        catch (e) { NM.reportError('stage.onExit', e); }
      }
      return Promise.resolve(false);
    }
    // 교사 진행은 메모리 저장소로만 한다: 교사 표시인데 학생 저장소가 오면 학생 기록을 건드리므로 멈춘다.
    if (c.teacher === true && store.isTeacher !== true) {
      NM.reportError('stage.run', 'teacher mode needs the in-memory teacher store');
      last = { stageId, phase: 'exited' };
      if (typeof c.onExit === 'function') {
        try { c.onExit({ stageId, completed: false, reason: 'noScene', newlyDone: false, glyphAdded: false, saved: false }); }
        catch (e) { NM.reportError('stage.onExit', e); }
      }
      return Promise.resolve(false);
    }
    const scene = L().resolveScene(raw, store.level);
    scene.id = stageId;
    const my = ++token;
    cur = { token: my, stageId, ctx: c, store, scene, teacher: c.teacher === true || store.isTeacher === true,
      phase: 'loading', offs: [], hud: null, ctxWins: [], translateReady: false, glow: null, eff: null, tearing: false,
      hudOpen: !(root.matchMedia && root.matchMedia('(max-width: 520px)').matches),
      settingsOverride: null, reducedOverride: null,
      fsOwned: !document.documentElement.style.getPropertyValue('--fs') };
    setPhase('loading');
    if (cur.teacher) document.documentElement.setAttribute('data-nm-teacher', '1');
    applySettings();
    buildHud();
    const st = (NM.data.STAGES && NM.data.STAGES[stageId]) || {};
    const mapKey = scene.mapKey || st.mapKey || stageId;
    const bgmKey = scene.bgmKey || st.bgmKey || null;
    // 주인공 그림: 고른 주인공(교사 모드는 1번)의 아틀라스(ASSETS.sprites.hero_<번호>)
    if (typeof E().setPlayerSprite === 'function') {
      const pn = cur.teacher ? 1 : (store.get().protagonist || 1);
      E().setPlayerSprite('hero_' + pn);
    }
    return E().ready()
      .then(() => E().loadMap(mapKey))
      .then(() => {
        if (!alive(my)) return false;
        if (E().audio) { if (bgmKey) E().audio.playBgm(bgmKey); else E().audio.stopBgm(); }
        cur.offs.push(E().on('interact', onInteract));
        const onSettings = (ev) => {
          if (!cur) return;
          const d = (ev && ev.detail) || {};
          cur.fsOwned = false;
          cur.reducedOverride = typeof d.reducedMotion === 'boolean' ? d.reducedMotion : null;
          applySettings(d.settings && typeof d.settings === 'object' ? d.settings : null);
        };
        document.addEventListener('nm:settings', onSettings);
        cur.offs.push(() => document.removeEventListener('nm:settings', onSettings));
        if (isFresh(store.stage(stageId))) { setPhase('intro'); intro(my); }
        else enterExplore();
        return true;
      })
      .catch(e => { NM.reportError('stage.run', e); return false; });
  }

  // 장면을 조용히 멈춘다(onExit 를 부르지 않음 — 부른 쪽이 화면을 옮길 때). 돌던 장면이 있었으면 true.
  function stop() {
    if (!cur) return false;
    const stageId = cur.stageId;
    teardown();
    last = { stageId, phase: 'exited' };
    return true;
  }

  NM.ui.stage = {
    run, exit, stop, applySettings,
    current: () => (cur ? { stageId: cur.stageId, phase: cur.phase } : Object.assign({}, last)),
    unknownRules(stageId, store) {
      const raw = NM.data.SCENES && NM.data.SCENES[stageId];
      if (!raw || !store) return [];
      return L().unknownRules(L().resolveScene(raw, store.level), store.get(), store.level)
        .map(u => ({ rule: u.rule, name: u.name, text: u.text, stage: u.stage, stageName: u.stageName }));
    },
    openContext: (id) => openContext(id),
    openItem: (id) => openItem(id)
  };
})(typeof window !== 'undefined' ? window : globalThis);
