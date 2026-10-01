'use strict';
/*
 * 기믹 '끊어 읽기'(wordCut, s4 「소리대로 적은 책」) 화면 문구. 선생님이 고칠 수 있는 파일.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점은 띄어 쓴다(붙이면 방점).
 * - %이름% 자리에는 값이 들어간다(%w% 글자의 현대 표기 읽기).
 * - 방점 음높이 막대: 평성 낮음 · 거성 높음 · 상성 낮다가 높음(03 문서 §2 '음높이 막대').
 *   정확한 높낮이 값은 학설이 갈린다(10 문서 §8) — 그래서 막대 설명에 '어림' 표지를 단다(채점 안 함).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.wordCut = {
  guide: '띄어쓰기 없이 찍힌 줄이에요. 낱말이 끝나는 글자를 누르면 그 뒤가 끊겨요. 한 번 더 누르면 끊은 자리가 없어져요.',
  lineLabel: '끊을 줄',
  syl: '%w%',
  sylCut: '%w%, 뒤를 끊음',
  submit: '제출하기',
  pitchTitle: '방점 음높이 막대',
  pitch: { 0: '평성 · 점 없음 · 낮음', 1: '거성 · 점 하나 · 높음', 2: '상성 · 점 둘 · 낮다가 높음' },
  pitchNote: '막대는 어림이에요. 옛 소리의 정확한 높낮이는 학자마다 생각이 달라요.',
  compareTitle: '두 장에서 같은 말 견주기',
  found: '끊어 찾음',
  notFound: '아직 못 찾음',
  wrongMark: '틀린 끊기 자리',
  joinedMark: '아직 덜 끊긴 말',
  hintMark: '여기를 다시 보세요',
  answerMark: '정답 끊기 자리'
};
