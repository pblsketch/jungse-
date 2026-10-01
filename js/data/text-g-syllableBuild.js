'use strict';
/*
 * 기믹 '음절 조립'(syllableBuild, s3 「모아 써야 소리가 된다」) 화면 문구. 선생님이 고칠 수 있는 파일.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점은 띄어 쓴다(붙이면 방점).
 * - %이름% 자리에는 값이 들어간다(%j% 글자 블록, %slot% 자리 이름).
 * - terms: 학교급별 용어(spec §7 s3 — 중학교 '나란히 쓰기', 고등 '병서'). 06 문서 §4·§7-1, 02 문서 운용 규칙 표.
 *   pair 는 자음 두셋을 한 자리에 넣었을 때, same/diff 가 있으면 같은 글자끼리(각자)·다른 글자끼리(합용)를 가른다.
 * - yeonseo: 연서로 보는 자음 묶음(입술소리 아래 ㅇ — 09 문서 O-s3-YEONSEO). 연서는 알아 두기라서 채점과 상관없이 이름표만 단다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.syllableBuild = {
  slots: { cho: '초성', jung: '중성', jong: '종성' },
  guide: '넣을 자리(초성 · 중성 · 종성)를 먼저 고르고, 아래 글자 블록을 누르거나 끌어다 놓으세요. 넣은 블록을 다시 누르면 빠져요.',
  tray: '글자 블록',
  slotGroup: '음절 자리',
  pickSlot: '%slot% 자리 고르기',
  add: '%j% 블록을 %slot% 자리에 넣기',
  remove: '%slot% 자리의 %j% 빼기',
  empty: '비어 있음',
  preview: '모은 글자',
  cannot: '아직 한 글자로 모이지 않아요',
  submit: '제출하기',
  practice: '알아 두기 · 채점하지 않아요',
  wrongMark: '고칠 곳',
  hintMark: '여기를 다시 보세요',
  answerMark: '정답',
  terms: {
    m: { pair: '나란히 쓰기', vowel: '모음자 합치기', yeonseo: '연서 · 알아 두기' },
    h1: { pair: '병서', same: '각자 병서', diff: '합용 병서', vowel: '모음자 합치기', yeonseo: '연서 · 알아 두기' },
    h23: { pair: '병서', same: '각자 병서', diff: '합용 병서', vowel: '모음자 합치기', yeonseo: '연서 · 알아 두기' }
  },
  yeonseo: ['ㅁㅇ', 'ㅂㅇ', 'ㅍㅇ', 'ㅂㅂㅇ']
};
