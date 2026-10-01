'use strict';
/*
 * 기믹 'wordRiver'(종장 말의 강 · 고등판 변화의 강) 화면 문구. 코드(js/gimmicks/wordRiver.js)에는 한국어를 두지 않는다.
 * %이름% 자리는 코드가 채운다(데이터 표기 규칙상 중괄호·대괄호는 쓰지 않는다). 선생님이 고쳐도 되는 파일이다.
 * 연도·세기는 보이지 않는다(변화는 순서만 판정 — spec §7 종장).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.wordRiver = {
  orderTitle: '변화의 강',
  orderHelp: '조각을 누르면 강물을 따라 다음 빈 나루에 놓여요. 놓인 조각을 누르면 돌아와요. 연도는 묻지 않아요. 앞뒤 차례만 봐요.',
  upstream: '앞',
  downstream: '뒤',
  arrow: '→',
  stopLabel: '%word% %n%번째 나루: %value%',
  wordLabel: '%word%의 변화',
  wordN: '%n%번째 낱말',
  empty: '비어 있음',
  poolLabel: '남은 조각',
  poolEmpty: '조각을 모두 놓았어요.',
  nowTitle: '지금 일어나는 변화 찾기',
  nowHelp: '지금 우리말에서 일어나고 있는 변화를 모두 고르세요.',
  missing: '아직 찾지 못한 것이 있어요.',
  predictTitle: '500년 뒤의 우리말',
  predictHelp: '500년 뒤에는 우리말이 어떻게 바뀌어 있을까요? 한 줄로 적어 보세요.',
  predictNote: '채점하지 않아요. 비워 두어도 괜찮고, 기록에는 남지 않아요.',
  predictPlaceholder: '500년 뒤에는',
  submit: '내 답 내기',
  needAll: '나루를 모두 채우고 지금의 변화를 하나 이상 고르면 낼 수 있어요.',
  marks: { wrong: '고칠 곳', hint: '다시 볼 곳', answer: '정답', done: '맞음', picked: '고름', unpicked: '고르지 않음' }
};
