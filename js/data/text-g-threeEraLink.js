'use strict';
/*
 * 기믹 'threeEraLink'(S11 끊어 적는 시대 · 세 시대 변환) 화면 문구. 코드(js/gimmicks/threeEraLink.js)에는 한국어를 두지 않는다.
 * %이름% 자리는 코드가 채운다(데이터 표기 규칙상 중괄호·대괄호는 쓰지 않는다). 선생님이 고쳐도 되는 파일이다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.threeEraLink = {
  eras: { mid: '중세', modern: '근대', present: '현대' },
  arrow: '→',
  linkTitle: '세 시대 잇기',
  linkHelp: '조각을 고른 뒤 칸을 누르세요. 칸을 먼저 골라도 됩니다. 채운 칸을 다시 누르면 조각이 돌아갑니다.',
  poolLabel: '남은 조각',
  poolEmpty: '조각을 모두 놓았어요.',
  slotLabel: '%row%에서 이어지는 %era% 칸: %value%',
  empty: '비어 있음',
  picked: '고름',
  spellTitle: '적는 방식 가르기',
  spellHelp: '밑줄 친 말은 어떻게 적었나요?',
  spellFrom: '%title%에서',
  target: '밑줄 친 말',
  kinds: { ieo: '이어 적기', geodeup: '거듭 적기', kkeuneo: '끊어 적기' },
  submit: '내 답 내기',
  needAll: '모든 칸을 채우고 모두 고르면 낼 수 있어요.',
  marks: { wrong: '고칠 곳', hint: '다시 볼 곳', answer: '정답', done: '맞음' }
};
