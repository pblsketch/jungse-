'use strict';
/*
 * 엔진 기본 화면 문구 (선생님이 고칠 수 있는 파일). spec §17 "화면 코드에 한국어 문장을 박지 않는다".
 * 엔진(js/engine/*.js)은 NM.engine.text('engine.<키>', …)로 읽는다. %name% 같은 자리는 엔진이 채운다.
 * - act.inspect: 조사 지점·인물 곁에서 뜨는 기본 단추 이름(대상 이름을 모를 때, 또는 맵 객체의 act 키 문구가 없을 때).
 *   더 앞선 문구 'act.inspect'(NM.data.TEXT.act.inspect)가 있으면 그것을 쓴다.
 * - act.inspectNamed / act.talkNamed: 대상 이름을 알 때의 단추 이름. 이름은 장면 데이터의 맥락 이름(contexts[].label)
 *   이나 인물 이름(npcs[].name)이다. 인물 이름이 있으면 '말하기', 그 밖에는 '살피기'.
 *   %wa% 는 이름 끝 받침에 따라 josa.wa 의 [받침 있을 때, 없을 때] 가운데 하나가 된다.
 * - arrow: 화면 밖 목표 화살표의 읽기 이름(화면 낭독기). dir 은 화살표가 가리키는 화면 쪽.
 * - canvas: 지도 그림(캔버스)의 읽기 이름.
 * - walk: 장소 목록에서 골라 걸어갈 때 화면 낭독기에 알리는 말.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.engine = {
  act: {
    inspect: '살피기',
    inspectNamed: '%name% 살피기',
    talkNamed: '%name%%wa% 말하기'
  },
  josa: {
    wa: ['과', '와']
  },
  arrow: {
    label: '목표 %name%: 화면 %dir% 밖',
    unnamed: '목표: 화면 %dir% 밖',
    dir: { up: '위쪽', down: '아래쪽', left: '왼쪽', right: '오른쪽' }
  },
  marker: {
    label: '목표 %name%'
  },
  canvas: {
    label: '장면 지도. 방향 키로 걷고 대상 곁에서 E 키나 Enter 키로 살펴요. 장소 목록 단추로도 갈 수 있어요.'
  },
  walk: {
    start: '%name% 쪽으로 걸어가요.',
    arrived: '%name% 곁에 왔어요.',
    noPath: '%name%까지 가는 길을 찾지 못했어요.'
  }
};
