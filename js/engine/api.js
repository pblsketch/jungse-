'use strict';
/*
 * NM.engine 공개 함수.
 *   boot()                          Phaser 게임을 #game 에 만든다(창 크기 맞춤, DPR 상한, 부드러운 확대)
 *   ready()                         부팅이 끝나면 풀리는 약속
 *   loadMap(key|url), loadStage(id) 그 장면의 맵·배경 그림(·배경음)만 그때 불러온다
 *   on/off('interact'|'mapready'|'overlay', fn)
 *   interact()                      가까운 대상 살피기(E·Enter·단추와 같음)
 *   setObjective([id]), highlight(id|null)
 *   openOverlay(el), closeOverlay(el?), isOverlayOpen()
 *   setReducedMotion(bool)
 *   listPlaces()                    장소 목록 [{ kind, id, contextId, npcId?, label(맵), name(대상 이름|null), person, objective, visited }]
 *   goTo(id)                        교사 모드: 그 자리로 옮겨(순간 이동) 살피기
 *   walkTo(id, { focusAct })        학생 장소 목록: 그 대상 곁까지 걸어간다(누른 곳으로 걷기와 같은 길 찾기, 순간 이동 없음).
 *                                   닿으면 'arrive' 사건, focusAct 면 살피기 단추로 초점. 길이 없으면 false(화면 낭독기에 알림)
 *   setPlaceNamer(fn), placeName(id) 대상 이름: fn(place) → '이름' | { name, person } | null. 없으면 장면 데이터
 *                                   (NM.data.SCENES[loadStage 의 장면].contexts[].label / npcs[].name), 그다음 한글 맵 이름.
 *                                   살피기 단추('○○ 살피기' / '○○와 말하기'), 목표 이름표·화살표 읽기 이름이 이 이름을 쓴다
 *   objective()                     지금 목표 id 목록(setObjective 로 준 것)
 *   say(text)                       화면 낭독기 알림(aria-live)
 *   setPlayerSprite(key)            주인공 그림(ASSETS.sprites 키, 예: hero_2) — 다음 맵부터
 *   audio                           audio.js
 *   test                            점검용 통로(화면에 드러내지 않음)
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};
  const W = E._w, cfg = E.config;
  let readyPromise = null, resolveReady = null, prevFocus = null;

  function measure() {
    const parent = document.getElementById('game');
    W.cssW = Math.max(1, (parent && parent.clientWidth) || root.innerWidth || 800);
    W.cssH = Math.max(1, (parent && parent.clientHeight) || root.innerHeight || 600);
    W.dpr = Math.min(root.devicePixelRatio || 1, cfg.dprMax);
  }

  // 확대 배율(CSS px 당 월드 px 의 역수). 기본은 cfg.viewWorld 넓이가 보이게.
  // 세로로 긴 화면(휴대 전화 세로)에서는 맵 높이에 더 맞춰 위아래 빈 띠를 줄인다 — 단 가로로 cfg.minViewW 월드 px 는 보이게 한다.
  function fitZoom() {
    let z = Math.min(W.cssW / cfg.viewWorld.w, W.cssH / cfg.viewWorld.h);
    if (W.map && W.map.height > 0 && W.cssH > W.cssW * cfg.tallRatio) {
      z = Math.max(z, Math.min(W.cssH / W.map.height, W.cssW / cfg.minViewW));
    }
    return Math.min(cfg.zoomMax, Math.max(cfg.zoomMin, z));
  }

  function applySize() {
    if (!W.game) return;
    measure();
    const gw = Math.round(W.cssW * W.dpr), gh = Math.round(W.cssH * W.dpr);
    const sm = W.game.scale;
    if (sm.width !== gw || sm.height !== gh) sm.resize(gw, gh);
    sm.setZoom(1 / W.dpr);
    const c = W.game.canvas;
    c.style.width = W.cssW + 'px'; c.style.height = W.cssH + 'px';
    W.zoom = W.dpr * fitZoom();
    if (W.scene) {
      const cam = W.scene.cameras.main;
      cam.setSize(gw, gh); cam.setZoom(W.zoom);
      W.updateCamera(0, true); W.updateArrows();
    }
  }

  E.boot = function () {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise(res => { resolveReady = res; });
    try {
      E.hud.init();
      let parent = document.getElementById('game');
      if (!parent) { parent = document.createElement('div'); parent.id = 'game'; (document.getElementById('app') || document.body).appendChild(parent); }
      measure();
      W.reduced = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const Scene = W.makeSceneClass(() => {
        W.ready = true;
        W.attachInput();
        wireAct();
        applySize();
        resolveReady(E);
      });
      W.game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: Math.round(W.cssW * W.dpr), height: Math.round(W.cssH * W.dpr),
        backgroundColor: '#1d1a17',
        banner: false,
        scale: { mode: Phaser.Scale.NONE, zoom: 1 / W.dpr },
        render: { antialias: true, pixelArt: false, roundPixels: false },
        input: { keyboard: false, mouse: false, touch: false, gamepad: false },
        audio: { noAudio: true },
        scene: [Scene]
      });
      // 지도 그림의 읽기 이름(화면 낭독기). 조작 안내는 문구 데이터에 있다
      try {
        const c = W.game.canvas;
        c.setAttribute('role', 'img');
        c.setAttribute('aria-label', E.text('engine.canvas.label', ''));
      } catch (e) { /* 캔버스가 아직 없으면 무시 */ }
      let t = null;
      const later = () => { clearTimeout(t); t = setTimeout(() => { try { applySize(); } catch (e) { NM.reportError('engine.resize', e); } }, 60); };
      root.addEventListener('resize', later);
      // 보이는 높이가 바뀌면(휴대 전화 안 브라우저의 주소 줄, js/main.js 의 --nm-app-h) #game 크기만 바뀌고 창 resize 는 안 올 수 있다
      if (root.visualViewport) root.visualViewport.addEventListener('resize', later);
      if (typeof root.ResizeObserver === 'function') {
        let last = '';
        new root.ResizeObserver(() => { const k = parent.clientWidth + 'x' + parent.clientHeight; if (k !== last) { last = k; later(); } }).observe(parent);
      }
      // 맵마다 높이가 달라 세로 화면의 확대 배율이 달라진다
      E.on('mapready', () => { try { applySize(); } catch (e) { NM.reportError('engine.resize', e); } });
    } catch (e) {
      NM.reportError('engine.boot', e);
    }
    return readyPromise;
  };
  E.ready = function () { return readyPromise || E.boot(); };

  E.loadMap = function (keyOrUrl) {
    return E.ready().then(() => W.loadMap(keyOrUrl)).catch(e => { NM.reportError('engine.loadMap', e); return null; });
  };
  E.loadStage = function (stageId) {
    const st = (NM.data && NM.data.STAGES && NM.data.STAGES[stageId]) || {};
    const mapKey = st.mapKey || stageId;
    W.stageId = stageId;
    return E.loadMap(mapKey).then(r => {
      if (r && E.audio) { if (st.bgmKey) E.audio.playBgm(st.bgmKey); else E.audio.stopBgm(); }
      return r;
    });
  };

  E.interact = function () { try { return W.interact(); } catch (e) { NM.reportError('engine.interact', e); return false; } };
  E.setObjective = function (ids) { try { W.setObjective(ids); } catch (e) { NM.reportError('engine.setObjective', e); } };
  E.highlight = function (id) { try { W.setHighlightObj(id); } catch (e) { NM.reportError('engine.highlight', e); } };
  E.setReducedMotion = function (on) { try { W.setReduced(on); } catch (e) { NM.reportError('engine.reducedMotion', e); } };
  E.setPlayerSprite = function (key) { W.setPlayerSprite(key); };
  E.listPlaces = function () { return W.listPlaces(); };
  E.goTo = function (id) { try { return W.goTo(id); } catch (e) { NM.reportError('engine.goTo', e); return false; } };
  E.walkTo = function (id, opts) { try { return W.walkTo(id, opts); } catch (e) { NM.reportError('engine.walkTo', e); return false; } };
  E.setPlaceNamer = function (fn) { try { W.setPlaceNamer(fn); } catch (e) { NM.reportError('engine.setPlaceNamer', e); } };
  E.placeName = function (id) { try { return W.placeName(id); } catch (e) { NM.reportError('engine.placeName', e); return null; } };
  E.objective = function () { return W.objective.slice(); };
  E.say = function (text) { E.hud.init(); E.hud.say(text); };

  /* ---------- DOM 창 ---------- */
  function focusFirst(el) {
    const f = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    // 첫 단추로 초점을 옮겨도 창 안 내용이 저절로 스크롤되지 않게 한다(창이 스스로 처음 초점을 다시 정할 수 있다)
    if (f) { f.focus({ preventScroll: true }); return; }
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  E.openOverlay = function (el) {
    if (!el || el.nodeType !== 1) return false;
    if (E.audio && E.audio.stopVoice) E.audio.stopVoice();
    const els = E.hud.init();
    if (!W.overlays.length) prevFocus = document.activeElement;
    if (W.overlays.indexOf(el) < 0) W.overlays.push(el);
    els.overlay.appendChild(el);
    els.overlay.hidden = false;
    W.setPaused(true);
    try { focusFirst(el); } catch (e) { /* 초점 실패는 무시 */ }
    E.emit('overlay', { open: true, count: W.overlays.length });
    return true;
  };
  E.closeOverlay = function (el) {
    const els = E.hud.init();
    const target = el || W.overlays[W.overlays.length - 1];
    if (!target) return false;
    const i = W.overlays.indexOf(target);
    if (i >= 0) W.overlays.splice(i, 1);
    if (target.parentNode === els.overlay) els.overlay.removeChild(target);
    if (!W.overlays.length) {
      els.overlay.hidden = true;
      W.setPaused(false);
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) { try { prevFocus.focus(); } catch (e) { /* 무시 */ } }
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      prevFocus = null;
    }
    E.emit('overlay', { open: W.overlays.length > 0, count: W.overlays.length });
    return true;
  };
  E.isOverlayOpen = function () { return W.overlays.length > 0; };

  // 살피기 단추
  function wireAct() {
    const els = E.hud.init();
    if (els.act.__nmWired) return;
    els.act.__nmWired = true;
    els.act.addEventListener('click', e => { e.preventDefault(); E.interact(); });
  }

  /* ---------- 점검용 통로 ---------- */
  E.test = {
    teleport(x, y) { return W.teleport(x, y); },
    loadTestMap() { return E.loadMap('maps/test.json'); },
    tap(x, y) { return W.tapAt(x, y); },
    worldToScreen(x, y) {
      const p = W.worldToCss(x, y), r = W.game.canvas.getBoundingClientRect();
      return { x: p.x + r.left, y: p.y + r.top };
    },
    target(id) { const t = W.findTarget(id); return t ? Object.assign({ rect: W.targetRect(t) }, t, { spr: undefined }) : null; },
    sprites() {
      const p = W.player;
      return { player: p ? p.texture.key : null, frame: p ? p.frame.name : null, flip: p ? p.flipX : null,
        anim: p && p.anims.isPlaying ? p.anims.currentAnim.key : null, npcs: W.npcs.map(n => n.spr.texture.key) };
    },
    fronts() { return W.fronts.map(f => ({ name: f.name, x: f.x, y: f.y, w: f.w, h: f.h, baseY: f.baseY, depth: f.img.depth, alpha: f.img.alpha, visible: f.img.visible })); },
    depths() { return { player: W.player ? W.player.depth : null, npcs: W.npcs.map(n => ({ id: n.npcId, depth: n.spr.depth })) }; },
    collides(x, y) { return W.grid ? E.path.collides(W.grid, x, y, cfg.feet.hw, cfg.feet.hh) : null; },
    state() {
      const n = W.nearest;
      return {
        ready: W.ready, mapLoaded: !!W.map, mapUrl: W.mapUrl,
        map: W.map ? { width: W.map.width, height: W.map.height } : null,
        x: W.pos.x, y: W.pos.y, facing: W.facing, moving: W.moving,
        paused: W.paused, overlayOpen: W.overlays.length > 0,
        path: W.path.map(p => ({ x: p.x, y: p.y })), pathMarker: !!(W.path.length && W.destGfx && W.destGfx.visible),
        joystick: W.joy.active, joy: { dx: W.joy.dx, dy: W.joy.dy },
        prompt: n ? { kind: n.kind, contextId: n.contextId || null, npcId: n.npcId || null, label: W.nearestLabel || E.actLabel(n.act) } : null,
        objective: W.objective.slice(), objectiveMarkers: W.objMarkers.length, visited: Array.from(W.visited),
        walking: !!W.walkGoal,
        arrows: E.hud.els ? [...E.hud.els.arrows.children].filter(a => !a.hidden).length : 0,
        highlight: W.highlight, reducedMotion: W.reduced,
        camera: { cx: W.cam.cx, cy: W.cam.cy, zoom: W.zoom, dpr: W.dpr, cssW: W.cssW, cssH: W.cssH },
        lastInteract: W.lastInteract, audio: E.audio ? E.audio.state() : null,
        renderer: W.game ? (W.game.config.renderType === Phaser.WEBGL ? 'webgl' : 'canvas') : null
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
