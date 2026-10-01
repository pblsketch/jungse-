'use strict';
/*
 * 지도 세계: Phaser 장면, 맵 짓기, 주인공 이동(키보드·조이스틱·목적지 누르기), 충돌, 카메라,
 * 살피기 대상 찾기, 목표 표시('!'·화면 밖 화살표), 빛내기.
 * 내부 상태는 NM.engine._w 에 두고, 바깥에 내는 함수는 api.js 가 묶는다.
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};
  const cfg = E.config;
  const P = E.path;

  const W = E._w = {
    game: null, scene: null, ready: false,
    dpr: 1, cssW: 0, cssH: 0, zoom: 1,
    mapUrl: null, map: null, grid: null, mask: null, objs: [], bgKey: null,
    player: null, pos: { x: 0, y: 0 }, facing: 'down', moving: false,
    npcs: [], spots: [],
    keys: { up: false, down: false, left: false, right: false },
    pointers: new Map(), joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
    path: [], pathFace: null, pathGfx: null, destGfx: null, stuck: 0,
    paused: false, reduced: false, overlays: [],
    objective: [], objMarkers: [], arrowSig: '',
    highlight: null, hlGfx: null,
    nearest: null, cam: { cx: 0, cy: 0 }, errCount: 0, lastInteract: null,
    playerKey: null, sheets: {}
  };
  E._w = W;
  // 주인공 그림 키(ASSETS.sprites). 다음 loadMap 부터 쓴다.
  W.setPlayerSprite = function (key) { W.playerKey = key || null; };

  /* ---------- 임시 그림(진짜 그림이 오기 전) ---------- */
  const FW = 48, FH = 64;
  function drawSD(c, ox, oy, dir, frame, pal) {
    const cx = ox + FW / 2;
    c.save();
    // 그림자
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(cx, oy + 60, 14, 4, 0, 0, Math.PI * 2); c.fill();
    // 발
    const lf = frame === 1 ? -3 : frame === 2 ? 2 : 0, rf = frame === 1 ? 2 : frame === 2 ? -3 : 0;
    c.fillStyle = pal.shoe;
    c.beginPath(); c.ellipse(cx - 6, oy + 58 + lf * 0.6, 4, 3, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + 6, oy + 58 + rf * 0.6, 4, 3, 0, 0, Math.PI * 2); c.fill();
    // 몸(도포)
    const bob = frame ? -1 : 0;
    c.fillStyle = pal.robe; c.strokeStyle = pal.line; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - 10, oy + 32 + bob); c.lineTo(cx + 10, oy + 32 + bob); c.lineTo(cx + 15, oy + 57); c.lineTo(cx - 15, oy + 57); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = pal.belt; c.fillRect(cx - 11, oy + 42 + bob, 22, 3);
    // 머리
    const hy = oy + 21 + bob;
    c.fillStyle = pal.skin; c.beginPath(); c.arc(cx, hy, 13, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = pal.hair;
    if (dir === 'up') { c.beginPath(); c.arc(cx, hy, 13, 0, Math.PI * 2); c.fill(); }
    else if (dir === 'left') { c.beginPath(); c.arc(cx, hy, 13, -Math.PI * 0.55, Math.PI * 0.45); c.fill(); }
    else { c.beginPath(); c.arc(cx, hy, 13, Math.PI, Math.PI * 2); c.fill(); }
    c.beginPath(); c.arc(cx + (dir === 'left' ? 3 : 0), hy - 14, 5, 0, Math.PI * 2); c.fill(); // 상투
    c.fillStyle = pal.line;
    if (dir === 'down') { c.fillRect(cx - 6, hy + 1, 3, 4); c.fillRect(cx + 3, hy + 1, 3, 4); }
    else if (dir === 'left') { c.fillRect(cx - 9, hy + 1, 3, 4); }
    c.restore();
  }

  function makeTextures(scene) {
    const mkSheet = (key, pal) => {
      if (scene.textures.exists(key)) return;
      const cv = document.createElement('canvas');
      cv.width = FW * 3; cv.height = FH * 3;
      const c = cv.getContext('2d');
      ['down', 'up', 'left'].forEach((d, r) => [0, 1, 2].forEach(f => drawSD(c, f * FW, r * FH, d, f, pal)));
      const tex = scene.textures.addCanvas(key, cv);
      ['down', 'up', 'left'].forEach((d, r) => [0, 1, 2].forEach(f => tex.add(d + '-' + f, 0, f * FW, r * FH, FW, FH)));
    };
    mkSheet('nm-ph-player', { robe: '#3f6fa8', belt: '#d9b45a', skin: '#f3d2b3', hair: '#2b2420', shoe: '#2b2420', line: '#2b2420' });
    mkSheet('nm-ph-npc', { robe: '#8a6a4a', belt: '#4d3b2a', skin: '#efcfae', hair: '#5a5550', shoe: '#2b2420', line: '#2b2420' });
    ['down', 'up', 'left'].forEach(d => {
      const k = 'nm-p-walk-' + d;
      if (!scene.anims.exists(k)) {
        scene.anims.create({ key: k, frameRate: 8, repeat: -1, frames: [1, 0, 2, 0].map(f => ({ key: 'nm-ph-player', frame: d + '-' + f })) });
      }
    });
  }

  /* ---------- 좌표 ---------- */
  function cssToWorld(sx, sy) {
    const k = W.dpr / W.zoom;
    return { x: W.cam.cx + (sx - W.cssW / 2) * k, y: W.cam.cy + (sy - W.cssH / 2) * k };
  }
  function worldToCss(x, y) {
    const k = W.zoom / W.dpr;
    return { x: (x - W.cam.cx) * k + W.cssW / 2, y: (y - W.cam.cy) * k + W.cssH / 2 };
  }

  function clampCam(cx, cy) {
    const vw = W.cssW * W.dpr / W.zoom, vh = W.cssH * W.dpr / W.zoom;
    const mw = W.map.width, mh = W.map.height;
    cx = mw <= vw ? mw / 2 : Math.min(Math.max(cx, vw / 2), mw - vw / 2);
    cy = mh <= vh ? mh / 2 : Math.min(Math.max(cy, vh / 2), mh - vh / 2);
    return { cx, cy };
  }
  function updateCamera(dt, snap) {
    if (!W.map || !W.scene) return;
    const t = clampCam(W.pos.x, W.pos.y - 24);
    if (snap || W.reduced) { W.cam.cx = t.cx; W.cam.cy = t.cy; }
    else {
      const a = 1 - Math.exp(-dt * 8);
      W.cam.cx += (t.cx - W.cam.cx) * a; W.cam.cy += (t.cy - W.cam.cy) * a;
    }
    W.scene.cameras.main.centerOn(W.cam.cx, W.cam.cy);
  }

  /* ---------- 맵 ---------- */
  function clearWorld() {
    const s = W.scene;
    W.objs.forEach(o => { try { o.destroy(); } catch (e) { /* 이미 없음 */ } });
    W.objs = []; W.npcs = []; W.spots = []; W.player = null; W.map = null; W.grid = null; W.mask = null;
    clearObjectiveMarkers(); W.objective = []; setHighlightObj(null); cancelPath();
    if (W.bgKey && s.textures.exists(W.bgKey)) s.textures.remove(W.bgKey);
    W.bgKey = null; W.nearest = null; E.hud.hideAct(); E.hud.setArrows([]);
  }

  function loadImage(key, url) {
    const s = W.scene;
    return new Promise(resolve => {
      if (s.textures.exists(key)) return resolve(true);
      let failed = false;
      const onErr = file => { if (file && file.key === key) failed = true; };
      s.load.on('loaderror', onErr);
      s.load.once('complete', () => { s.load.off('loaderror', onErr); resolve(!failed && s.textures.exists(key)); });
      s.load.image(key, url);
      s.load.start();
    });
  }

  /* ---------- 인물 아틀라스 (tools/process_sprites.py 결과: png + json) ----------
   * NM.data.ASSETS.sprites[key] = { png, json }. 칸 번호 프레임, anims down/left/up/idle, 오른쪽 = 왼쪽 뒤집기.
   * 목록에 없는 키는 임시 그림을 쓰고, 목록에 있는데 못 불러오면 오류로 보고한 뒤 임시 그림을 쓴다. */
  async function loadSheet(key) {
    if (!key) return null;
    if (W.sheets[key] !== undefined) return W.sheets[key];
    const A = NM.data && NM.data.ASSETS, ent = A && A.sprites && A.sprites[key];
    if (!ent || !ent.png || !ent.json) { W.sheets[key] = null; return null; }
    const s = W.scene, tk = 'nm-sp:' + key;
    try {
      const res = await fetch(ent.json);
      if (!res.ok) throw new Error('sprite json not found: ' + ent.json);
      const meta = await res.json();
      if (!s.textures.exists(tk)) {
        await new Promise(resolve => {
          let failed = false;
          const onErr = file => { if (file && file.key === tk) failed = true; };
          s.load.on('loaderror', onErr);
          s.load.once('complete', () => { s.load.off('loaderror', onErr); resolve(!failed); });
          s.load.spritesheet(tk, ent.png, { frameWidth: meta.frameWidth, frameHeight: meta.frameHeight });
          s.load.start();
        });
      }
      if (!s.textures.exists(tk)) throw new Error('sprite image not loaded: ' + ent.png);
      const anims = meta.anims || {};
      ['down', 'left', 'up'].forEach(d => {
        const a = anims[d], ak = tk + ':walk-' + d;
        if (a && !s.anims.exists(ak)) {
          s.anims.create({ key: ak, frameRate: a.fps || 8, repeat: -1, frames: a.frames.map(f => ({ key: tk, frame: f })) });
        }
      });
      const stand = {};
      ['down', 'left', 'up'].forEach(d => { const a = anims[d]; stand[d] = a && a.frames.length ? a.frames[Math.min(1, a.frames.length - 1)] : 0; });
      const o = meta.origin || { x: 0.5, y: 1 };
      W.sheets[key] = { tex: tk, stand, ox: o.x, oy: o.y, idle: anims.idle && anims.idle.frames ? anims.idle.frames[0] : stand.down };
    } catch (e) {
      NM.reportError('engine.sprite', e);
      W.sheets[key] = null;
    }
    return W.sheets[key];
  }

  function resolveMapUrl(keyOrUrl) {
    const A = NM.data && NM.data.ASSETS;
    if (A && A.maps && typeof A.maps[keyOrUrl] === 'string') return A.maps[keyOrUrl];
    if (/\.json$/i.test(keyOrUrl)) return keyOrUrl;
    return 'maps/' + keyOrUrl + '.json';
  }

  async function loadMap(keyOrUrl) {
    const url = resolveMapUrl(keyOrUrl);
    const res = await fetch(url);
    if (!res.ok) throw new Error('map not found: ' + url);
    const json = await res.json();
    const map = E.tiled.parse(json);
    map.problems.forEach(p => NM.reportError('engine.map', url + ': ' + p));
    clearWorld();
    const s = W.scene;
    W.mapUrl = url;
    let bgOk = false;
    if (map.bg) {
      const bgUrl = new URL(map.bg.image, new URL(url, document.baseURI)).href;
      W.bgKey = 'nm-bg:' + bgUrl;
      bgOk = await loadImage(W.bgKey, bgUrl);
      if (!bgOk) NM.reportError('engine.bg', 'background not loaded: ' + map.bg.image);
    }
    if (bgOk) W.objs.push(s.add.image(map.bg.x, map.bg.y, W.bgKey).setOrigin(0, 0).setDepth(-100000));
    else W.objs.push(s.add.rectangle(0, 0, map.width, map.height, 0x8fa86a).setOrigin(0, 0).setDepth(-100000));

    const grid = P.buildGrid({ width: map.width, height: map.height, cell: cfg.cell, rects: map.rects, polys: map.polys, tiles: map.tiles });
    map.npcs.forEach(n => P.markRect(grid, { x: n.x - cfg.npcFeet.hw, y: n.y - cfg.npcFeet.hh * 2, w: cfg.npcFeet.hw * 2, h: cfg.npcFeet.hh * 2 }));
    W.map = map; W.grid = grid; W.mask = P.walkMask(grid, cfg.feet.hw, cfg.feet.hh);
    W.spots = map.spots.slice();
    const A = NM.data && NM.data.ASSETS, spriteKeys = (A && A.sprites) || {};
    const npcKey = n => n.sprite || (spriteKeys[n.npcId] ? n.npcId : null);
    const keys = [W.playerKey].concat(map.npcs.map(npcKey)).filter(Boolean);
    for (const k of keys) await loadSheet(k);
    if (W.mapUrl !== url) return { url, width: map.width, height: map.height }; // 그사이 다른 맵을 불렀다
    W.npcs = map.npcs.map(n => {
      const sh = W.sheets[npcKey(n)];
      const spr = sh
        ? s.add.sprite(n.x, n.y, sh.tex, sh.idle).setOrigin(sh.ox, sh.oy).setDepth(n.y)
        : s.add.sprite(n.x, n.y, 'nm-ph-npc', 'down-0').setOrigin(0.5, 62 / 64).setDepth(n.y);
      // 서 있는 인물은 코드로 숨쉬기(움직임 줄이기면 멈춤)
      if (sh && !W.reduced) s.tweens.add({ targets: spr, scaleY: 1.025, duration: 1300 + (n.x % 7) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      W.objs.push(spr);
      return Object.assign({}, n, { spr });
    });
    let sp = map.spawn;
    if (P.collides(grid, sp.x, sp.y, cfg.feet.hw, cfg.feet.hh)) {
      const c0 = P.cellOf(grid, sp.x, sp.y), c = P.nearestOpen(grid, W.mask, c0.c, c0.r);
      if (c) sp = P.cellCenter(grid, c.c, c.r);
    }
    W.pos = { x: sp.x, y: sp.y }; W.facing = 'down';
    const psh = W.sheets[W.playerKey] || null;
    W.psheet = psh;
    W.player = psh
      ? s.add.sprite(sp.x, sp.y, psh.tex, psh.stand.down).setOrigin(psh.ox, psh.oy).setDepth(sp.y)
      : s.add.sprite(sp.x, sp.y, 'nm-ph-player', 'down-0').setOrigin(0.5, 62 / 64).setDepth(sp.y);
    W.objs.push(W.player);
    W.pathGfx = s.add.graphics().setDepth(-50000); W.objs.push(W.pathGfx);
    W.destGfx = s.add.graphics().setDepth(-49999); W.objs.push(W.destGfx);
    W.hlGfx = s.add.graphics().setDepth(-49000); W.objs.push(W.hlGfx);
    updateCamera(0, true);
    E.emit('mapready', { url, width: map.width, height: map.height });
    return { url, width: map.width, height: map.height };
  }

  /* ---------- 대상 ---------- */
  function npcRect(n) { return { x: n.x - cfg.npcFeet.hw, y: n.y - cfg.npcFeet.hh * 2, w: cfg.npcFeet.hw * 2, h: cfg.npcFeet.hh * 2 }; }
  function distRect(px, py, r) {
    const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h));
    return Math.hypot(dx, dy);
  }
  function targetRect(t) { return t.kind === 'npc' ? npcRect(t) : { x: t.x, y: t.y, w: t.w, h: t.h }; }
  function findTarget(id) {
    if (!id) return null;
    return W.spots.find(s => s.contextId === id) || W.npcs.find(n => n.npcId === id) || W.npcs.find(n => n.contextId === id) || null;
  }
  function markerPoint(t) { return t.kind === 'npc' ? { x: t.x, y: t.y - 70 } : { x: t.cx, y: t.y - 10 }; }
  function updateNearest() {
    let best = null, bd = Infinity;
    if (W.map && !W.paused) {
      const fy = W.pos.y - cfg.feet.hh;
      W.spots.concat(W.npcs).forEach(t => {
        const d = distRect(W.pos.x, fy, targetRect(t));
        if (d <= cfg.reach && d < bd) { bd = d; best = t; }
      });
    }
    W.nearest = best;
    if (best) E.hud.showAct(E.actLabel(best.act)); else E.hud.hideAct();
  }

  function faceToward(x, y) {
    const dx = x - W.pos.x, dy = y - W.pos.y;
    W.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }

  function fireInteract(t) {
    const r = targetRect(t);
    faceToward(r.x + r.w / 2, r.y + r.h / 2);
    applyAnim();
    const payload = { kind: t.kind, contextId: t.contextId || null, npcId: t.npcId || null, act: t.act || null };
    W.lastInteract = payload;
    E.audio && E.audio.sfx('inspect');
    E.emit('interact', payload);
    return true;
  }
  function interact() {
    if (W.paused || !W.map) return false;
    updateNearest();
    return W.nearest ? fireInteract(W.nearest) : false;
  }

  // 대상 곁의 설 자리(아래 → 왼쪽 → 오른쪽 → 위 순서), 없으면 가장 가까운 걸을 수 있는 칸
  function approachPoint(t) {
    const r = targetRect(t), hw = cfg.feet.hw, hh = cfg.feet.hh, g = W.grid;
    const cands = [
      { x: r.x + r.w / 2, y: r.y + r.h + hh * 2 + 4 },
      { x: r.x - hw - 6, y: r.y + r.h / 2 + hh },
      { x: r.x + r.w + hw + 6, y: r.y + r.h / 2 + hh },
      { x: r.x + r.w / 2, y: r.y - 6 }
    ];
    for (const p of cands) if (!P.collides(g, p.x, p.y, hw, hh) && distRect(p.x, p.y - hh, r) <= cfg.reach) return p;
    const c0 = P.cellOf(g, cands[0].x, cands[0].y), c = P.nearestOpen(g, W.mask, c0.c, c0.r, 8);
    return c ? P.cellCenter(g, c.c, c.r) : null;
  }

  /* ---------- 이동 ---------- */
  function cancelPath() {
    W.path = []; W.pathFace = null; W.stuck = 0;
    if (W.pathGfx) W.pathGfx.clear();
    if (W.destGfx) { if (W.scene) W.scene.tweens.killTweensOf(W.destGfx); W.destGfx.clear(); W.destGfx.setScale(1); }
  }

  function drawPath() {
    const g = W.pathGfx; if (!g) return;
    g.clear();
    if (!W.path.length) return;
    let prev = W.pos;
    g.fillStyle(0xfff6d8, 0.95); g.lineStyle(2, 0x2b2420, 0.6);
    W.path.forEach(p => {
      const len = Math.hypot(p.x - prev.x, p.y - prev.y), n = Math.floor(len / 22);
      for (let i = 1; i <= n; i++) {
        const x = prev.x + (p.x - prev.x) * i / (n + 1), y = prev.y + (p.y - prev.y) * i / (n + 1);
        g.fillCircle(x, y, 3.5); g.strokeCircle(x, y, 3.5);
      }
      prev = p;
    });
  }
  function drawDest(p) {
    const d = W.destGfx; if (!d) return;
    W.scene.tweens.killTweensOf(d);
    d.clear(); d.setPosition(p.x, p.y); d.setScale(1);
    d.lineStyle(4, 0x2b2420, 0.5); d.strokeEllipse(0, 0, 34, 18);
    d.lineStyle(3, 0xffd76a, 1); d.strokeEllipse(0, 0, 30, 15);
    d.fillStyle(0xffd76a, 1); d.fillEllipse(0, 0, 8, 4);
    if (!W.reduced) W.scene.tweens.add({ targets: d, scaleX: 1.25, scaleY: 1.25, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  function flashNoPath(x, y) {
    const s = W.scene, g = s.add.graphics().setDepth(-49998);
    g.lineStyle(4, 0xb8322a, 1); g.lineBetween(x - 8, y - 8, x + 8, y + 8); g.lineBetween(x - 8, y + 8, x + 8, y - 8);
    W.objs.push(g);
    s.time.delayedCall(600, () => { g.destroy(); const i = W.objs.indexOf(g); if (i >= 0) W.objs.splice(i, 1); });
  }

  // 월드 좌표로 목적지 정하기. 길을 찾으면 true.
  function tapAt(wx, wy) {
    if (!W.map || W.paused) return false;
    const g = W.grid, hw = cfg.feet.hw, hh = cfg.feet.hh;
    let target = null;
    W.spots.forEach(s => { if (!target && distRect(wx, wy, { x: s.x, y: s.y, w: s.w, h: s.h }) <= 20) target = s; });
    W.npcs.forEach(n => { if (!target && wx > n.x - 22 && wx < n.x + 22 && wy > n.y - 64 && wy < n.y + 6) target = n; });
    let goal;
    if (target) goal = approachPoint(target);
    else if (!P.collides(g, wx, wy, hw, hh)) goal = { x: wx, y: wy };
    else {
      const c0 = P.cellOf(g, wx, wy), c = P.nearestOpen(g, W.mask, c0.c, c0.r, 6);
      goal = c ? P.cellCenter(g, c.c, c.r) : null;
    }
    if (!goal) { flashNoPath(wx, wy); return false; }
    let s0 = P.cellOf(g, W.pos.x, W.pos.y);
    if (!W.mask[s0.r * g.cols + s0.c]) s0 = P.nearestOpen(g, W.mask, s0.c, s0.r, 3) || s0;
    let g0 = P.cellOf(g, goal.x, goal.y);
    if (!W.mask[g0.r * g.cols + g0.c]) g0 = P.nearestOpen(g, W.mask, g0.c, g0.r, 3) || g0;
    const cells = P.findPath(g, W.mask, s0.c, s0.r, g0.c, g0.r);
    if (!cells) { flashNoPath(wx, wy); return false; }
    const pts = [{ x: W.pos.x, y: W.pos.y }].concat(cells.slice(1).map(c => P.cellCenter(g, c.c, c.r)));
    const last = pts[pts.length - 1];
    if (!P.collides(g, goal.x, goal.y, hw, hh) && P.lineClear(g, last.x, last.y, goal.x, goal.y, hw, hh)) pts.push({ x: goal.x, y: goal.y });
    const simple = P.simplify(g, pts, hw, hh);
    W.path = simple.slice(1);
    if (!W.path.length) { cancelPath(); return true; }
    W.pathFace = target; W.stuck = 0;
    drawPath(); drawDest(W.path[W.path.length - 1]);
    return true;
  }

  function moveBy(dx, dy) {
    const g = W.grid, hw = cfg.feet.hw, hh = cfg.feet.hh;
    let x = W.pos.x, y = W.pos.y;
    const axis = (d, isX) => {
      if (!d) return;
      const nx = isX ? x + d : x, ny = isX ? y : y + d;
      if (!P.collides(g, nx, ny, hw, hh)) { if (isX) x = nx; else y = ny; return; }
      const s = Math.sign(d); let k = Math.floor(Math.abs(d));
      while (k-- > 0) {
        const tx = isX ? x + s : x, ty = isX ? y : y + s;
        if (P.collides(g, tx, ty, hw, hh)) break;
        if (isX) x = tx; else y = ty;
      }
    };
    axis(dx, true); axis(dy, false);
    const moved = Math.hypot(x - W.pos.x, y - W.pos.y);
    W.pos.x = x; W.pos.y = y;
    return moved;
  }

  function applyAnim() {
    const p = W.player; if (!p) return;
    const dir = W.facing === 'right' ? 'left' : W.facing;
    p.setFlipX(W.facing === 'right');
    const sh = W.psheet;
    if (W.moving && !W.reduced) {
      const k = sh ? sh.tex + ':walk-' + dir : 'nm-p-walk-' + dir;
      if (!p.anims.isPlaying || p.anims.currentAnim.key !== k) p.anims.play(k, true);
    } else {
      if (p.anims.isPlaying) p.anims.stop();
      p.setFrame(sh ? sh.stand[dir] : dir + '-0');
    }
  }

  function step(dt) {
    if (!W.map || !W.player) return;
    dt = Math.min(dt, 0.05);
    let vx = 0, vy = 0, fromPath = false, lastMoved = 0;
    if (!W.paused) {
      const k = W.keys;
      vx = (k.right ? 1 : 0) - (k.left ? 1 : 0); vy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      let len = Math.hypot(vx, vy);
      if (len) { vx /= len; vy /= len; }
      else if (W.joy.active) {
        const jl = Math.hypot(W.joy.dx, W.joy.dy) / cfg.joyRadius;
        if (jl > 0.18) { const m = Math.min(1, jl); vx = W.joy.dx / (jl * cfg.joyRadius) * m; vy = W.joy.dy / (jl * cfg.joyRadius) * m; }
      }
      len = Math.hypot(vx, vy);
      if (len && W.path.length) cancelPath();
      if (!len && W.path.length) {
        const t = W.path[0], d = Math.hypot(t.x - W.pos.x, t.y - W.pos.y), sl = cfg.speed * dt;
        if (d <= sl || d < 0.5) {
          const ddx = t.x - W.pos.x, ddy = t.y - W.pos.y;
          const got = moveBy(ddx, ddy);
          lastMoved = got;
          if (Math.abs(ddx) > Math.abs(ddy) * 1.05) W.facing = ddx < 0 ? 'left' : 'right';
          else if (ddy) W.facing = ddy < 0 ? 'up' : 'down';
          if (got < d - 0.5) { W.stuck += dt; if (W.stuck > 0.4) cancelPath(); }
          else {
            W.path.shift(); W.stuck = 0;
            if (!W.path.length) {
              const face = W.pathFace;
              cancelPath();
              if (face) { const r = targetRect(face); faceToward(r.x + r.w / 2, r.y + r.h / 2); }
            } else drawPath();
          }
          fromPath = 'arrived';
        } else {
          vx = (t.x - W.pos.x) / d; vy = (t.y - W.pos.y) / d; fromPath = true;
        }
      }
    }
    let moved = lastMoved;
    if (fromPath !== 'arrived' && (vx || vy)) {
      moved = moveBy(vx * cfg.speed * dt, vy * cfg.speed * dt);
      if (fromPath) {
        if (moved < cfg.speed * dt * 0.2) W.stuck += dt; else W.stuck = 0;
        if (W.stuck > 0.4) cancelPath();
        drawPath();
      }
      if (Math.abs(vx) > Math.abs(vy) * 1.05) W.facing = vx < 0 ? 'left' : 'right';
      else if (vy) W.facing = vy < 0 ? 'up' : 'down';
    }
    W.moving = moved > 0.01 || fromPath === true;
    W.player.setPosition(W.pos.x, W.pos.y).setDepth(W.pos.y);
    applyAnim();
    updateNearest();
    updateCamera(dt, false);
    updateArrows();
  }

  /* ---------- 목표 표시 · 빛내기 ---------- */
  function clearObjectiveMarkers() {
    W.objMarkers.forEach(m => { try { if (W.scene) W.scene.tweens.killTweensOf(m.obj); m.obj.destroy(); } catch (e) { /* 없음 */ } });
    W.objMarkers = []; W.arrowSig = ''; E.hud.setArrows([]);
  }
  function buildObjectiveMarkers() {
    clearObjectiveMarkers();
    if (!W.scene || !W.map) return;
    W.objective.forEach(id => {
      const t = findTarget(id);
      if (!t) return;
      const p = markerPoint(t);
      const obj = W.scene.add.text(p.x, p.y, '!', { fontFamily: 'system-ui, sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffd76a', stroke: '#2b2420', strokeThickness: 7 })
        .setOrigin(0.5, 1).setDepth(1e6);
      if (!W.reduced) W.scene.tweens.add({ targets: obj, y: p.y - 8, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      W.objMarkers.push({ id, obj, x: p.x, y: p.y - 20 });
    });
    updateArrows();
  }
  function setObjective(ids) {
    W.objective = Array.isArray(ids) ? ids.filter(Boolean).map(String) : (ids ? [String(ids)] : []);
    buildObjectiveMarkers();
  }
  function updateArrows() {
    if (!W.map) return;
    const m = 34, list = [];
    const cx = W.cssW / 2, cy = W.cssH / 2;
    W.objMarkers.forEach(mk => {
      const p = worldToCss(mk.x, mk.y);
      if (p.x >= m && p.x <= W.cssW - m && p.y >= m && p.y <= W.cssH - m) return;
      const dx = p.x - cx, dy = p.y - cy, ang = Math.atan2(dy, dx);
      const sx = (cx - m) / Math.max(Math.abs(dx), 1e-6), sy = (cy - m) / Math.max(Math.abs(dy), 1e-6), s = Math.min(sx, sy);
      list.push({ id: mk.id, x: Math.round(cx + dx * s), y: Math.round(cy + dy * s), angle: Math.round(ang * 100) / 100 });
    });
    const sig = JSON.stringify(list);
    if (sig !== W.arrowSig) { W.arrowSig = sig; E.hud.setArrows(list); }
  }

  function setHighlightObj(id) {
    W.highlight = id || null;
    const g = W.hlGfx;
    if (!g) return;
    if (W.scene) W.scene.tweens.killTweensOf(g);
    g.clear(); g.setAlpha(1);
    const t = findTarget(W.highlight);
    if (!t) { if (id) W.highlight = null; return; }
    const r = targetRect(t), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const w = Math.max(r.w, 24) + 36, h = Math.max(r.h, 16) + 28;
    g.fillStyle(0xffe9a0, 0.35); g.fillEllipse(cx, cy, w + 16, h + 12);
    g.fillStyle(0xfff3c4, 0.5); g.fillEllipse(cx, cy, w, h);
    g.lineStyle(4, 0xffd76a, 1); g.strokeEllipse(cx, cy, w, h);
    if (!W.reduced) W.scene.tweens.add({ targets: g, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /* ---------- 입력 ---------- */
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  function isTyping(t) { return t && t.nodeType === 1 && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); }
  function isControl(t) { return t && t.nodeType === 1 && (isTyping(t) || /^(BUTTON|A|SUMMARY)$/.test(t.tagName) || t.getAttribute('role') === 'button'); }
  function clearKeys() { W.keys.up = W.keys.down = W.keys.left = W.keys.right = false; }

  function onKeyDown(e) {
    if (W.paused || !W.map || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = KEYMAP[e.code];
    if (k) { W.keys[k] = true; e.preventDefault(); return; }
    if ((e.code === 'KeyE' || e.key === 'Enter') && !e.repeat) {
      if (isControl(e.target)) return; // 초점 받은 단추는 스스로 처리
      if (interact()) e.preventDefault();
    }
  }
  function onKeyUp(e) { const k = KEYMAP[e.code]; if (k) W.keys[k] = false; }

  function cssPos(e) {
    const r = W.game.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function releaseJoy() { W.joy.active = false; W.joy.id = null; W.joy.dx = W.joy.dy = 0; E.hud.joyHide(); }
  function onPointerDown(e) {
    if (W.paused || !W.map) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const p = cssPos(e);
    W.pointers.set(e.pointerId, { x0: p.x, y0: p.y, zone: p.x < W.cssW * cfg.joyZone, mode: 'pending' });
    try { W.game.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 일부 환경 */ }
  }
  function onPointerMove(e) {
    const st = W.pointers.get(e.pointerId);
    if (!st || W.paused) return;
    const p = cssPos(e), dx = p.x - st.x0, dy = p.y - st.y0;
    if (st.mode === 'pending' && Math.hypot(dx, dy) > cfg.dragThreshold) {
      if (st.zone && !W.joy.active) {
        st.mode = 'joy';
        W.joy.active = true; W.joy.id = e.pointerId; W.joy.ox = st.x0; W.joy.oy = st.y0;
        cancelPath(); E.hud.joyShow(st.x0, st.y0);
      } else st.mode = 'drag';
    }
    if (st.mode === 'joy') {
      const len = Math.hypot(dx, dy), r = cfg.joyRadius, f = len > r ? r / len : 1;
      W.joy.dx = dx * f; W.joy.dy = dy * f;
      E.hud.joyKnob(W.joy.dx, W.joy.dy);
    }
  }
  function onPointerUp(e, cancelled) {
    const st = W.pointers.get(e.pointerId);
    if (!st) return;
    W.pointers.delete(e.pointerId);
    if (st.mode === 'joy') releaseJoy();
    else if (st.mode === 'pending' && !cancelled && !W.paused) {
      const p = cssPos(e), w = cssToWorld(p.x, p.y);
      tapAt(w.x, w.y);
    }
  }

  function attachInput() {
    const c = W.game.canvas;
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', onPointerDown);
    c.addEventListener('pointermove', onPointerMove);
    c.addEventListener('pointerup', e => onPointerUp(e, false));
    c.addEventListener('pointercancel', e => onPointerUp(e, true));
    c.addEventListener('contextmenu', e => e.preventDefault());
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('keyup', onKeyUp);
    root.addEventListener('blur', clearKeys);
  }

  function setPaused(on) {
    W.paused = !!on;
    if (W.paused) {
      cancelPath(); clearKeys(); W.pointers.clear(); releaseJoy();
      W.moving = false; applyAnim();
      W.nearest = null; E.hud.hideAct();
    }
  }

  function setReduced(on) {
    W.reduced = !!on;
    if (!W.scene) return;
    buildObjectiveMarkers();
    setHighlightObj(W.highlight);
    if (W.path.length) drawDest(W.path[W.path.length - 1]);
    applyAnim();
  }

  function teleport(x, y) {
    if (!W.map) return false;
    cancelPath();
    W.pos.x = x; W.pos.y = y;
    if (W.player) W.player.setPosition(x, y).setDepth(y);
    updateNearest(); updateCamera(0, true); updateArrows();
    return true;
  }

  function goTo(id) {
    const t = findTarget(id);
    if (!t || !W.map) return false;
    const p = approachPoint(t);
    if (p) teleport(p.x, p.y);
    return fireInteract(t);
  }

  function listPlaces() {
    return W.spots.map(s => ({ kind: 'spot', id: s.contextId, contextId: s.contextId, label: s.label || s.contextId }))
      .concat(W.npcs.map(n => ({ kind: 'npc', id: n.npcId, npcId: n.npcId, contextId: n.contextId || null, label: n.label || n.npcId })));
  }

  /* ---------- Phaser 장면 ---------- */
  function makeSceneClass(onReady) {
    return class WorldScene extends Phaser.Scene {
      constructor() { super({ key: 'nm-world' }); }
      create() {
        W.scene = this;
        makeTextures(this);
        onReady(this);
      }
      update(time, delta) {
        try { step(delta / 1000); }
        catch (e) { if (W.errCount++ < 3) NM.reportError('engine.step', e); }
      }
    };
  }

  Object.assign(W, {
    makeSceneClass, attachInput, loadMap, tapAt, interact, setPaused, setReduced, setObjective, setHighlightObj,
    teleport, goTo, listPlaces, findTarget, worldToCss, cssToWorld, updateCamera, updateArrows, cancelPath, releaseJoy, clearKeys, targetRect
  });
})(typeof window !== 'undefined' ? window : globalThis);
