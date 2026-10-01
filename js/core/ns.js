'use strict';
/*
 * 전역 이름 공간 NM(나랏말ᄊᆞ미)과 오류 모음.
 * - 모든 모듈은 NM.<층>.<이름> 아래에 붙는다: NM.core / NM.data / NM.engine / NM.ui / NM.gimmicks
 * - 게임 코드의 오류는 window.__nmErrors 에 모인다. 점검은 이 목록이 비어 있어야 통과한다.
 *   (console.error 를 쓰는 것도 점검 실패로 본다.)
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  NM.core = NM.core || {};
  NM.data = NM.data || {};
  NM.engine = NM.engine || {};
  NM.ui = NM.ui || {};
  NM.gimmicks = NM.gimmicks || {};

  const errors = root.__nmErrors || (root.__nmErrors = []);
  NM.reportError = function (where, err) {
    errors.push({ where: String(where), message: String(err && err.message || err) });
  };

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('error', function (e) { NM.reportError('window', e.error || e.message); });
    root.addEventListener('unhandledrejection', function (e) { NM.reportError('promise', e.reason); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
