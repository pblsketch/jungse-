'use strict';
/*
 * C3 시험용 화면 코드. 주석의 한국어(살피기, 나랏말ᄊᆞ미)는 점검하지 않는다.
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  // 문구는 데이터에서 읽는다
  NM.fixtureLabel = function () { return NM.engine.text('fixture.hello', '…'); };
  const re = /[가-힣]+/u; // 정규식 리터럴은 문자열이 아니다
  NM.fixtureTest = (s) => re.test(s) ? `ok:${s.length}` : 'none';
})(typeof window !== 'undefined' ? window : globalThis);
