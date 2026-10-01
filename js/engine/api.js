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
 *   listPlaces(), goTo(id)          교사 모드: 장소 목록, 그 자리로 옮겨 살피기
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

  function applySize() {
    if (!W.game) return;
    measure();
    const gw = Math.round(W.cssW * W.dpr), gh = Math.round(W.cssH * W.dpr);
    const sm = W.game.scale;
    if (sm.width !== gw || sm.height !== gh) sm.resize(gw, gh);
    sm.setZoom(1 / W.dpr);
    const c = W.game.canvas;
    c.style.width = W.cssW + 'px'; c.style.height = W.cssH + 'px';
    const base = Math.min(W.cssW / cfg.viewWorld.w, W.cssH / cfg.viewWorld.h);
    W.zoom = W.dpr * Math.min(cfg.zoomMax, Math.max(cfg.zoomMin, base));
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
      let t = null;
      root.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { try { applySize(); } catch (e) { NM.reportError('engine.resize', e); } }, 60); });
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
    return E.loadMap(mapKey).then(r => {
      if (r && E.audio) { if (st.bgmKey) E.audio.playBgm(st.bgmKey); else E.audio.stopBgm(); }
      return r;
    });
  };

  E.interact = function () { try { return W.interact(); } catch (e) { NM.reportError('engine.interact', e); return false; } };
  E.setObjective = function (ids) { try { W.setObjective(ids); } catch (e) { NM.reportError('engine.setObjective', e); } };
  E.highlight = function (id) { try { W.setHighlightObj(id); } catch (e) { NM.reportError('engine.highlight', e); } };
  E.setReducedMotion = function (on) { try { W.setReduced(on); } catch (e) { NM.reportError('engine.reducedMotion', e); } };
  E.listPlaces = function () { return W.listPlaces(); };
  E.goTo = function (id) { try { return W.goTo(id); } catch (e) { NM.reportError('engine.goTo', e); return false; } };

  /* ---------- DOM 창 ---------- */
  function focusFirst(el) {
    const f = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f) { f.focus(); return; }
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus();
  }
  E.openOverlay = function (el) {
    if (!el || el.nodeType !== 1) return false;
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
        prompt: n ? { kind: n.kind, contextId: n.contextId || null, npcId: n.npcId || null, label: E.actLabel(n.act) } : null,
        objective: W.objective.slice(), objectiveMarkers: W.objMarkers.length,
        arrows: E.hud.els ? [...E.hud.els.arrows.children].filter(a => !a.hidden).length : 0,
        highlight: W.highlight, reducedMotion: W.reduced,
        camera: { cx: W.cam.cx, cy: W.cam.cy, zoom: W.zoom, dpr: W.dpr, cssW: W.cssW, cssH: W.cssH },
        lastInteract: W.lastInteract, audio: E.audio ? E.audio.state() : null,
        renderer: W.game ? (W.game.config.renderType === Phaser.WEBGL ? 'webgl' : 'canvas') : null
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
