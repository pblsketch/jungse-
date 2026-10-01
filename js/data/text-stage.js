'use strict';
/*
 * 장면 진행기 화면 문구 (선생님이 고칠 수 있는 파일). NM.data.TEXT.stage 아래에 둔다.
 * - 다른 작업의 문구(NM.data.TEXT.ui 등)를 덮어쓰지 않고 합친다.
 * - %이름% 자리에는 값이 들어간다(예: %n% → 살핀 맥락 수). 이 파일도 데이터 표기 규칙(js/core/yet.js)을 따른다:
 *   가운뎃점·쌍점을 음절에 붙여 쓰면 방점이 되므로 띄어 쓴다. 중괄호·대괄호는 쓰지 않는다.
 * - 장면 대사(별명 넣기 <@>, <@이> …)는 장면 데이터(js/data/scenes/)에 둔다. 표기 설명은 js/data/scenes/README.md.
 * - josa: 별명 뒤 조사 짝. c = 받침 있을 때, v = 받침 없을 때. rieulAsVowel: ㄹ 받침을 받침 없음처럼(으로/로).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.stage = {
  call: '통사',
  josa: [
    { c: '이', v: '가' }, { c: '은', v: '는' }, { c: '을', v: '를' }, { c: '과', v: '와' },
    { c: '아', v: '야' }, { c: '이라', v: '라' }, { c: '으로', v: '로', rieulAsVowel: true },
    { c: '이랑', v: '랑' }, { c: '이나', v: '나' }, { c: '이여', v: '여' }, { c: '이야', v: '야' },
    { c: '이에요', v: '예요' }, { c: '이었다', v: '였다' }, { c: '이다', v: '다' }
  ],
  speakers: { senior: '선배 통사', sejong: '세종', narrator: '' },

  btn: {
    next: '다음', close: '닫기', confirm: '확정하기', exit: '장면 나가기', open: '살펴보기',
    save: '수첩 이미지 저장하기', later: '나중에 하기', skip: '건너뛰기', done: '다 썼어요',
    teacherAnswer: '정답과 풀이 바로 보기', notebook: '수첩', skipAll: '대화 넘기기'
  },
  win: {
    context: '조사', item: '해독', task: '과제', carve: '새김', reflect: '돌아보기', save: '수첩 이미지',
    dialog: '이야기', request: '의뢰', encounter: '원문과 마주침', example: '선배의 풀이',
    needs: '선배의 짧은 설명', misread: '오해 장면', translate: '통역'
  },
  marks: {
    orig: '原文', explain: '풀이', know: '알아 두기', fiction: '게임 설정 · 虛',
    variant: '이본 노트', interp: '해석', real: '실제로는 →', src: '출처', notScored: '채점하지 않아요'
  },
  state: {
    unseen: '아직 만나지 못한 말', met: '만남', guessed: '추측', confirmable: '확정할 수 있음',
    misread: '오해 — 다시 고르기', confirmed: '확정', confirmedByHelp: '도움으로 확정',
    open: '해 보기', done: '완료', doneByHelp: '도움으로 완료'
  },
  stateSym: {
    unseen: '?', met: '◇', guessed: '◆', confirmable: '☆', misread: '△',
    confirmed: '◎', confirmedByHelp: '◎', open: '□', done: '◎', doneByHelp: '◎'
  },

  hudItems: '풀어야 할 것',
  seen: '살핀 맥락 %n% / %need%',
  seenList: '살핀 곳: %list%',
  needMore: '같은 말이 쓰인 다른 곳을 하나 더 살펴야 확정할 수 있어요.',
  canConfirm: '두 곳 이상 살폈어요. 카드를 골라 확정해 보세요.',
  pickAgain: '다른 카드를 골라 다시 확정해 보세요.',
  pickCard: '확정하기 전에는 맞았는지 알 수 없어요.',
  readPrompt: '이 말은 무슨 뜻일까?',
  rulePrompt: '빈칸에 알맞은 카드를 골라 규칙 문장을 완성해 보세요.',
  cardsLabel: '카드',
  blank: '빈칸',
  itemsHere: '여기서 만난 말',
  correct: '바르게 읽었어요!',
  byHelp: '선배가 정답과 풀이를 알려 주었어요.',
  misreadNote: '그 뜻으로 통역했더니 이야기가 엉뚱해졌어요.',
  why: '왜 아닌지',
  answer: '정답',
  hint: '선배의 힌트',
  glow: '단서가 있는 곳이 지도에서 빛나요.',
  fix: '고칠 곳을 표시했어요.',
  ruleAdded: '규칙 카드가 수첩에 붙었어요.',
  taskWrong: '틀린 부분을 표시했어요. 고쳐서 다시 내 보세요.',
  taskDone: '해냈어요!',
  taskByHelp: '선배가 정답과 풀이를 보여 주었어요.',
  noGimmick: '이 과제를 아직 열 수 없어요.',
  teacherNote: '교사 진행용 보기예요. 기록과 상관없어요.',
  unknownRule: '아직 확인하지 않은 규칙',
  learnAt: '%stage%에서 배워요',
  stageNo: '스테이지 %n%',
  prologue: '서장',
  epilogue: '종장',
  carve: '통사 패에 글자를 새겼어요.',
  reflectAsk: '오늘의 말과 무엇이 달랐나요? 한 줄로 적어 보세요. 비워 두어도 괜찮아요.',
  reflectPlaceholder: '오늘의 말과 무엇이 달랐나',
  saveAsk: '해독 수첩을 이미지로 저장할까요?',
  goTranslate: '모든 말을 풀었어요. 의뢰한 사람에게 가서 통역해 주세요.',
  hudLabel: '장면 진행'
};
