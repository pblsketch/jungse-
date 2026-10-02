'use strict';
/*
 * 엔진 공용: 사건(on/off/emit), 설정값, 화면 문구 찾기.
 * 화면 문구는 데이터(NM.data.TEXT 또는 NM.core.t)에서 가져온다. 엔진의 기본 문구는 js/data/text-engine.js(NM.data.TEXT.engine)에 있다.
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};

  E.config = Object.assign({
    cell: 16,               // 충돌 격자 칸 크기(월드 px)
    viewWorld: { w: 960, h: 600 }, // 이 정도의 월드 넓이가 화면에 보이도록 확대
    zoomMin: 0.5, zoomMax: 2,
    tallRatio: 1.15,        // 세로/가로가 이보다 크면 '세로로 긴 화면': 맵 높이에 맞춰 더 확대한다(api.js fitZoom)
    minViewW: 440,          // 그때도 가로로 이만큼(월드 px)은 보이게(너무 확대하지 않게)
    dprMax: 2,              // 전자칠판 성능용 해상도 상한
    speed: 170,             // 걷기 속도(월드 px/초)
    feet: { hw: 9, hh: 5 }, // 발밑 충돌 상자 반너비·반높이
    npcFeet: { hw: 14, hh: 7 },
    reach: 40,              // 살피기 거리
    bodyHw: 20, bodyH: 96,  // 주인공 몸 상자(발 위로 높이, 좌우 반너비): 앞 그림과 겹치는지 볼 때
    frontFade: 0.45,        // 주인공이 앞 그림 뒤에 가려질 때 그 조각의 불투명도
    joyRadius: 56,          // 조이스틱 반지름(CSS px)
    joyZone: 0.45,          // 화면 왼쪽 몇 할이 조이스틱 자리인가
    dragThreshold: 10       // 이만큼 움직이면 '끌기', 아니면 '누르기'(CSS px)
  }, E.config || {});

  // 기본 단추 이름: 'act.inspect' → 없으면 js/data/text-engine.js 의 'engine.act.inspect' → 그것도 없으면 '…'
  const ACT_KEY = 'act.inspect';
  const ACT_FALLBACK_KEY = 'engine.act.inspect';
  const ACT_LAST = '\u2026';

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
  // 문구의 %이름% 자리 채우기
  E.fill = function (s, vars) {
    return String(s == null ? '' : s).replace(/%(\w+)%/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  };
  // 조사 고르기: pair = [받침 있을 때, 없을 때]. 이름 끝의 마지막 한글 음절을 본다(』 ) 같은 닫는 표는 건너뜀).
  E.josa = function (word, pair) {
    if (!Array.isArray(pair) || pair.length < 2) return '';
    const s = String(word || '');
    for (let i = s.length - 1; i >= 0; i--) {
      const c = s.charCodeAt(i);
      if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? pair[0] : pair[1];
      if (/[0-9A-Za-zㄱ-ㆎᄀ-ᇿ]/.test(s[i])) return pair[1];
    }
    return pair[1];
  };
  // 살피기 단추 이름. info = { name, person } (대상 이름을 알면). 맵 객체의 act 키 문구가 있으면 그것이 먼저다.
  E.actLabel = function (actKey, info) {
    const def = E.text(ACT_KEY, E.text(ACT_FALLBACK_KEY, ACT_LAST));
    if (actKey) {
      const v = E.text(actKey, null);
      if (v) return E.fill(v, { name: info && info.name ? info.name : '' });
    }
    if (info && info.name) {
      const key = info.person ? 'engine.act.talkNamed' : 'engine.act.inspectNamed';
      const tpl = E.text(key, null);
      if (tpl) return E.fill(tpl, { name: info.name, wa: E.josa(info.name, E.textList('engine.josa.wa')) });
    }
    return def;
  };
  // 문구 목록(배열) 찾기
  E.textList = function (key) {
    const T = NM.data && NM.data.TEXT;
    const v = T && String(key).split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, T);
    return Array.isArray(v) ? v : null;
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
