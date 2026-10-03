'use strict';
/*
 * 기믹 G9 '두 시대 수첩'(twoEraNotebook, 장면 10 백 년 뒤) 화면 문구. 선생님이 고칠 수 있다.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점을 음절에 붙이면 방점이 되므로 나열에는 쓰지 않는다.
 * - %w% 자리에는 낱말 읽기가 들어간다. levels.<학교급> 에 같은 키를 두면 그 학교급에서는 그 글을 쓴다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.twoEraNotebook = {
  howto: '한쪽은 15세기, 한쪽은 16세기 글이에요. 수첩의 현상마다 16세기에도 지켜졌는지, 흔들리는지, 보이지 않는지 고르고, 16세기 글에서 근거 낱말을 눌러 보세요.',
  page15: '15세기 쪽',
  page16: '16세기 쪽',
  extraHead: '더 살펴볼 낱말',
  notebook: '두 시대 수첩',
  criteria: '지켜짐: 제시된 예에서 같은 규칙을 따르고 있어요. 흔들림: 규칙을 따르지 않는 예도 섞여 있어요. 없음: 제시된 글에서 그 현상이 보이지 않아요. 판단한 뒤 근거 고르기를 켜고, 그 판단을 보여 주는 낱말을 하나 이상 눌러요. 없음에는 근거를 붙이지 않아요.',
  statusLabel: '16세기에는?',
  status: { kept: '지켜짐', shaky: '흔들림', none: '없음' },
  pickEvidence: '근거 고르기',
  evidence: '근거',
  evidenceNone: '고른 근거가 없어요.',
  remove: '%w% 빼기',
  noRow: '먼저 수첩 줄에서 근거 고르기 단추를 눌러 주세요.',
  example15: '15세기 보기',
  submit: '제출하기',
  needAll: '수첩의 모든 줄에서 하나씩 고르면 제출할 수 있어요.',
  wrongNote: '엑스 표시가 붙은 곳을 다시 살펴보세요.',
  hintNote: '빛나는 줄과 15세기 보기를 견주어 다시 살펴보세요.',
  answerTag: '정답',
  levels: {}
};
