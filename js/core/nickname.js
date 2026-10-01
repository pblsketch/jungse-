'use strict';
/*
 * 별명 검사 (순수 함수). spec §10-1.
 * - 1~8자, 한글 완성형 음절·영문·숫자만, 공백 없음, 비속어 목록(NM.data.PROFANITY)에 걸리지 않음.
 * - check(s) → { ok, reason } · reason: null | 'empty' | 'tooLong' | 'space' | 'chars' | 'profanity'
 *   (화면 문구는 reason 으로 고른다. 비속어면 "다른 별명을 지어 주세요")
 * 필요: js/core/ns.js, js/data/profanity.js
 */
(function (root) {
  const NM = root.NM;
  const MAX_LEN = 8;
  const ALLOWED = /^[가-힣A-Za-z0-9]+$/;

  function check(s) {
    if (typeof s !== 'string' || s.length === 0) return { ok: false, reason: 'empty' };
    if (/\s/.test(s)) return { ok: false, reason: 'space' };
    if (Array.from(s).length > MAX_LEN) return { ok: false, reason: 'tooLong' };
    if (!ALLOWED.test(s)) return { ok: false, reason: 'chars' };
    const low = s.toLowerCase();
    const list = Array.isArray(NM.data.PROFANITY) ? NM.data.PROFANITY : [];
    for (let i = 0; i < list.length; i++) {
      const w = typeof list[i] === 'string' ? list[i].toLowerCase() : '';
      if (w && low.indexOf(w) >= 0) return { ok: false, reason: 'profanity' };
    }
    return { ok: true, reason: null };
  }

  NM.core.nickname = { check, MAX_LEN };
})(typeof window !== 'undefined' ? window : globalThis);
