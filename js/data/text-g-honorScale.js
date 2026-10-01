'use strict';
/*
 * 기믹 '높임 저울'(honorScale, s7 「높이는 말」) 화면 문구와 선어말 어미 활자 목록. 선생님이 고칠 수 있는 파일.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점은 띄어 쓴다(붙이면 방점). 옛한글은 대괄호 표기로만 쓴다.
 * - endings: 활자 id → { label(데이터 표기), kind(높이는 자리: subject 주체 · object 객체 · listener 상대) }.
 *   분류는 spec §7 s7 행과 10 문서 §10 오개념 10~12(화법과 언어 205쪽 표)를 따른다.
 *   객체 높임 세 활자(sab · jab · zab)가 앞소리에 따라 갈리는 조건은 리서치 문서에서 확인하지 못해 여기 적지 않는다
 *   (장면 작성자가 과제마다 정답 활자와 단서 글자를 정한다 — README-honorScale.md).
 * - %이름% 자리에는 값이 들어간다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.honorScale = {
  endings: {
    si: { label: '-시-', kind: 'subject' },
    sya: { label: '-샤-', kind: 'subject' },
    sab: { label: '-[ㅅㆍㅂ]-', kind: 'object' },
    jab: { label: '-[ㅈㆍㅂ]-', kind: 'object' },
    zab: { label: '-[ㅿㆍㅂ]-', kind: 'object' },
    ii: { label: '-[ㆁㅣ]-', kind: 'listener' }
  },
  order: ['si', 'sya', 'sab', 'jab', 'zab', 'ii'],
  roles: { speaker: '화자', subject: '주체', object: '객체', listener: '상대' },
  roleHelp: {
    speaker: '말하는 사람',
    subject: '주어가 가리키는 사람',
    object: '목적어 · 부사어가 가리키는 대상',
    listener: '듣는 사람'
  },
  kinds: { subject: '주체 높임', object: '객체 높임', listener: '상대 높임' },
  frame: '조판 — 활자 자리를 비워 둔 판',
  frameDone: '조판 — 원문대로 짠 판',
  slot: '활자 자리',
  slotEmpty: '빈 활자 자리',
  slotFilled: '활자 자리: %e%',
  step1: '1. 이 활자 자리의 말은 누구를 높일까요? 인물 패를 고르세요.',
  step2: '2. 활자 자리에 넣을 선어말 어미 활자를 고르세요.',
  pickFirst: '먼저 인물 패를 골라요.',
  tray: '선어말 어미 활자',
  scale: '높임 저울',
  scaleEmpty: '저울이 수평이에요. 아직 아무도 높이지 않았어요.',
  scaleTilted: '%who% 쪽이 올라갔어요(%kind%).',
  honored: '높임 받는 사람',
  submit: '제출하기',
  wrongMark: '고칠 곳',
  hintMark: '여기를 다시 보세요',
  answerMark: '정답'
};
