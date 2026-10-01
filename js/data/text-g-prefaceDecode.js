'use strict';
/*
 * 기믹 G8 '종합 해독'(prefaceDecode, 장면 9 나랏말ᄊᆞ미) 화면 문구. 선생님이 고칠 수 있다.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점을 음절에 붙이면 방점이 되므로 나열에는 쓰지 않는다.
 * - %n% · %stage% 자리에는 값이 들어간다. levels.<학교급> 에 같은 키를 두면 그 학교급에서는 그 글을 쓴다.
 * - 창제 정신 이름(자주, 애민, 실용)은 spec §7 s9 와 중2-2 교과서(06 문서)를 따른다. 장면 데이터가 config.spirits 로 바꿀 수 있다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.prefaceDecode = {
  howto: '서문 구절마다 낱말을 풀고, 현대어 조각을 차례대로 놓아 옮긴 다음, 창제 정신이 드러난 구절을 찾아보세요.',
  howtoModern: '새로 쓴 현대어 서문을 읽고, 대목마다 어떤 창제 정신이 드러나는지 골라 보세요.',
  navLabel: '서문 구절',
  nav: '구절 %n%',
  navSpirit: '창제 정신',
  hanmun: '한문 원문 보기',
  decodeHead: '낱말 풀기',
  arrangeHead: '현대어로 옮기기',
  pool: '현대어 조각',
  tray: '옮긴 구절',
  trayEmpty: '아래 조각을 눌러 차례대로 놓아 보세요.',
  removeTip: '놓은 조각을 누르면 되돌아가요.',
  placed: '%n%번째에 놓음',
  ruleKnown: '규칙 카드',
  ruleUnknown: '아직 확인하지 않은 규칙',
  ruleWhere: '%stage%에서 배워요',
  spiritHead: '창제 정신 찾기',
  spiritPrompt: '이 대목에 드러난 창제 정신은?',
  spirits: { jaju: '자주', aemin: '애민', silyong: '실용' },
  none: '어느 쪽도 아님',
  prev: '앞으로',
  next: '다음으로',
  submit: '제출하기',
  needAll: '모든 구절을 풀어 옮기고 창제 정신까지 고르면 제출할 수 있어요.',
  needAllModern: '모든 대목에서 고르면 제출할 수 있어요.',
  wrongNote: '엑스 표시가 붙은 곳을 다시 살펴보세요.',
  hintNote: '빛나는 곳을 다시 살펴보세요.',
  answerTag: '정답',
  levels: {}
};
