'use strict';
/*
 * NM.ui.url — 주소 값 읽기 (spec §19-1, §9). 키 이름은 js/ui/README.md 에 적어 둔다.
 *   ?level=m|h1|h23   이번 접속의 학교급(기록이 있으면 저장하지 않음, 첫 실행이면 처음 학교급으로 저장)
 *   ?teacher=1        이번 접속에서 교사 모드 켜기(저장하지 않음)
 * parse(search) → { level: 'm'|'h1'|'h23'|null, teacher: bool }. 모르는 값은 없는 것으로 본다.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const KEYS = { level: 'level', teacher: 'teacher' };
  const LEVELS = ['m', 'h1', 'h23'];

  function parse(search) {
    const out = { level: null, teacher: false };
    const s = String(search || '').replace(/^\?/, '');
    if (!s) return out;
    s.split('&').forEach(pair => {
      if (!pair) return;
      const i = pair.indexOf('=');
      let k = i < 0 ? pair : pair.slice(0, i);
      let v = i < 0 ? '' : pair.slice(i + 1);
      try { k = decodeURIComponent(k.replace(/\+/g, ' ')); v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { return; }
      if (k === KEYS.level && LEVELS.indexOf(v) >= 0) out.level = v;
      if (k === KEYS.teacher && v === '1') out.teacher = true;
    });
    return out;
  }

  UI.url = { KEYS, parse };
})(typeof window !== 'undefined' ? window : globalThis);
