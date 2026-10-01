'use strict';
/*
 * 규칙 조정값 (선생님이 고칠 수 있는 파일). spec §5-2, §6-1, §6-2.
 * - TITLE_RULES.tiers: 위에서부터 차례로 보아 '끝낸 수 / 묶음 수'가 ratio 이상인 첫 칭호를 준다.
 *   (자기 학교급 추천 묶음만 센다. 서장·추천 선택·묶음 밖 장면은 세지 않는다.)
 * - SCOPE_RULES: 묶음 밖 장면의 핵심 항목 범위.
 *   · h23Only: 고2~3 전용 장면. 누가 들어가도 그 장면 범위(h23)를 쓴다. 다른 규칙보다 우선.
 *   · fallback: 학교급에 맞는 핵심 항목이 하나도 없을 때 차례로 쓸 범위.
 *     (중학교판이 없는 장면에 중학생 → 고1 범위)
 * - HELP_MAX: 도움 단계 수 = 도움으로 확정되는 오답 횟수.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TITLE_RULES = {
  tiers: [
    { ratio: 1, title: '정음 통사' },
    { ratio: 0.5, title: '통사' },
    { ratio: 0, title: '견습 통사' }
  ]
};
NM.data.SCOPE_RULES = {
  h23Only: ['s1', 's7', 's8', 's11'],
  fallback: { m: ['h1', 'h23'], h1: ['h23', 'm'], h23: ['h1', 'm'] }
};
NM.data.HELP_MAX = 3;
