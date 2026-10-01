'use strict';
/*
 * 엔진 공용: 사건(on/off/emit), 설정값, 화면 문구 찾기.
 * 화면 문구는 데이터(NM.data.TEXT 또는 NM.core.t)에서 가져온다. 엔진 코드에는 기본 단추 이름 하나만 대비용으로 둔다.
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};

  E.config = Object.assign({
    cell: 16,               // 충돌 격자 칸 크기(월드 px)
    viewWorld: { w: 960, h: 600 }, // 이 정도의 월드 넓이가 화면에 보이도록 확대
    zoomMin: 0.5, zoomMax: 2,
    dprMax: 2,              // 전자칠판 성능용 해상도 상한
    speed: 170,             // 걷기 속도(월드 px/초)
    feet: { hw: 9, hh: 5 }, // 발밑 충돌 상자 반너비·반높이
    npcFeet: { hw: 14, hh: 7 },
    reach: 40,              // 살피기 거리
    joyRadius: 56,          // 조이스틱 반지름(CSS px)
    joyZone: 0.45,          // 화면 왼쪽 몇 할이 조이스틱 자리인가
    dragThreshold: 10       // 이만큼 움직이면 '끌기', 아니면 '누르기'(CSS px)
  }, E.config || {});

  const ACT_FALLBACK = '살피기';
  const ACT_KEY = 'act.inspect';

  // 문구 찾기: NM.core.t(key) → NM.data.TEXT[key](점 경로 포함) → 대비값
  E.text = function (key, fallback) {
    try {
      if (key && NM.core && typeof NM.core.t === 'function') {
        const v = NM.core.t(key);
        if (typeof v === 'string' && v && v !== key) return v;
      }
      const T = NM.data && NM.data.TEXT;
      if (key && T) {
        if (typeof T[key] === 'string') return T[key];
        const v = String(key).split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, T);
        if (typeof v === 'string') return v;
      }
    } catch (e) { NM.reportError('engine.text', e); }
    return fallback;
  };
  E.actLabel = function (actKey) {
    const def = E.text(ACT_KEY, ACT_FALLBACK);
    return actKey ? E.text(actKey, def) : def;
  };

  // 사건
  const handlers = {};
  E.on = function (name, fn) {
    (handlers[name] || (handlers[name] = [])).push(fn);
    return function () { E.off(name, fn); };
  };
  E.off = function (name, fn) {
    const l = handlers[name]; if (!l) return;
    const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1);
  };
  E.emit = function (name, payload) {
    (handlers[name] || []).slice().forEach(fn => {
      try { fn(payload); } catch (e) { NM.reportError('engine.on:' + name, e); }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
