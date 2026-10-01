'use strict';
/*
 * 엔진 기본 화면 문구 (선생님이 고칠 수 있는 파일). spec §17 "화면 코드에 한국어 문장을 박지 않는다".
 * 엔진(js/engine/*.js)은 NM.engine.text('engine.<키>', …)로 읽는다.
 * - act.inspect: 조사 지점·인물 곁에서 뜨는 기본 단추 이름(맵 객체에 act 키가 없거나, 그 키의 문구가 없을 때).
 *   더 앞선 문구 'act.inspect'(NM.data.TEXT.act.inspect)가 있으면 그것을 쓴다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.engine = {
  act: {
    inspect: '살피기'
  }
};
