'use strict';
/*
 * 기믹 borrowSort(스테이지 1 「빌려 쓴 글자」 뜻이냐 소리냐) 화면 문구. 화면 코드(js/gimmicks/borrowSort.js)는 한국어를 쓰지 않고 여기서 읽는다.
 * - 한자마다 '뜻을 빌림(훈차)' / '소리를 빌림(음차)' 을 고른다. 화법과 언어 교과서(203·207쪽)의 판정 낱말은 '뜻' · '소리' 다.
 * - 문구 안의 %이름% 은 기믹이 채운다. 가운뎃점(·)을 음절 바로 앞에 붙이면 방점이 되므로 쓰지 않는다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.borrowSort = {
  lead: '밑줄 친 한자마다 그 글자의 뜻을 빌려 썼는지, 소리를 빌려 썼는지 고르세요.',
  reading: '%char% · 한자음: %eum% / 새김: %gloss% / 이 구절의 읽기: %reading%',
  page: '사례 %n% / %total%',
  previous: '앞 사례',
  next: '확인하고 다음 사례',
  practiceWrong: '다시 볼 글자를 표시했어요. 한자음, 새김, 이 구절의 읽기를 견주어 고쳐 보세요.',
  hun: '뜻',
  eum: '소리',
  hunLong: '뜻을 빌림',
  eumLong: '소리를 빌림',
  groupAria: '%char% 글자는 무엇을 빌렸을까',
  optionAria: '%char% 글자, %choice%',
  lineAria: '원문 %n%째 줄',
  interpChar: '%char% 글자는 풀이가 갈려서 고르지 않아요',
  left: '아직 고르지 않은 한자 %n%개',
  ruleTitle: '모은 사례로 규칙 세우기',
  ruleLocked: '한자를 모두 가르면 규칙 문장을 고를 수 있어요.',
  ruleNeed: '규칙 문장의 빈칸을 고르세요.',
  submit: '이대로 내기',
  mark: { wrong: '다시 볼 곳', hint: '고칠 곳', answer: '정답' },
  noteFor: '%char%'
};
