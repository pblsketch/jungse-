'use strict';
/*
 * 기믹 G7 '질문 짝 맞추기'(questionPair, 장면 8 묻는 말) 화면 문구. 선생님이 고칠 수 있다.
 * - 데이터 표기 규칙(js/core/yet.js)을 따른다: 가운뎃점을 음절에 붙이면 방점이 되므로 나열에는 쓰지 않는다.
 * - %n% 자리에는 번호가 들어간다. levels.<학교급> 에 같은 키를 두면 그 학교급에서는 그 글을 쓴다.
 * - 용어 근거: 화법과 언어 205쪽 표(판정 의문 -가, 설명 의문 -고, 2인칭 주어 -ㄴ다).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.questionPair = {
  howto: '물음마다 짝이 되는 대답을 고르고, 어떤 물음인지 가른 다음, 그 물음을 끝맺는 어미를 골라 보세요.',
  answersHead: '대답 카드',
  question: '물음 %n%',
  answerNo: '대답 %n%',
  stepPair: '짝이 되는 대답',
  stepKind: '어떤 물음일까?',
  stepEnding: '물음을 끝맺는 어미',
  kinds: { yesno: '판정 의문', wh: '설명 의문', second: '2인칭 주어 의문' },
  kindNotes: {
    yesno: '예, 아니요로 대답하는 물음',
    wh: '의문사가 있어 설명을 바라는 물음',
    second: '듣는 이(너)가 주어인 물음'
  },
  endings: { 'ga': '-가', 'go': '-고', 'nda': '-ㄴ다' },
  cue: { wh: '의문사', second: '2인칭 주어', none: '의문사 없음' },
  endingTag: '어미',
  submit: '제출하기',
  needAll: '모든 물음에서 셋을 다 고르면 제출할 수 있어요.',
  wrongNote: '엑스 표시가 붙은 곳을 다시 골라 보세요.',
  hintNote: '빛나는 낱말을 단서로 다시 살펴보세요. 의문사가 있는지, 주어가 듣는 이인지 보세요.',
  answerTag: '정답',
  levels: {}
};
