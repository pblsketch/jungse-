'use strict';
/*
 * 화면 흐름 문구 (선생님이 고칠 수 있는 파일). spec §4·§6·§9·§10·§11·§14.
 * - 화면 코드(js/ui/app*·screen*·settings*·teacher*·notebook*)는 이 문구만 쓴다.
 * - 끼워 넣는 값은 %이름% 으로 적는다(예: %n%). 중괄호·대괄호·밑줄표는 옛한글 표기 기호라 쓰지 않는다.
 * - NM.data.TEXT 를 덮어쓰지 않고 TEXT.ui 만 채운다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.ui = {
  gameTitle: '나랏말[ㅆㆍ]미',   // 옛한글 표기(대괄호 = 한 음절). 화면에서 조합한다
  gameSub: '옛말을 읽어 내는 통사 이야기',
  back: '뒤로',
  close: '닫기',
  ok: '확인',
  yes: '예',
  no: '아니요',
  on: '켬',
  off: '끔',

  title: {
    continue: '이어 하기',
    newStart: '새로 시작',
    start: '시작',
    settings: '설정',
    teacherBadge: '교사 모드',
    teacherStart: '교사 모드로 시작',
    credits: '만든 사람들'
  },

  levels: { m: '중학교', h1: '고1', h23: '고2~3' },
  levelNotes: { m: '중학교 국어 「우리말 문자 체계」', h1: '공통국어2 「국어가 걸어온 길」', h23: '화법과 언어 「시대에 따른 국어의 변화」' },
  levelGroups: { high: '고등학교' },

  setup: {
    levelTitle: '학교급을 골라 주세요',
    levelHelp: '배우는 교과서에 맞춰 추천 장면이 정해져요. 나중에 설정에서 바꿀 수 있어요.',
    protagonistTitle: '함께할 주인공을 골라 주세요',
    protagonistHelp: '네 사람 모두 하는 말과 할 수 있는 일은 같아요. 모습만 달라요.',
    protagonistName: '주인공 %n%',
    nicknameTitle: '별명을 지어 주세요',
    nicknameHelp: '한글, 영문, 숫자로 1~8자까지 쓸 수 있어요. 띄어쓰기는 안 돼요.',
    nicknameRealName: '실제 이름은 쓰지 마세요. 별명은 이 기기에만 남아요.',
    nicknameLabel: '별명',
    nicknameOk: '정했어요',
    nicknameErrors: {
      empty: '별명을 한 글자 이상 써 주세요.',
      tooLong: '별명은 8자까지 쓸 수 있어요.',
      space: '띄어쓰기 없이 써 주세요.',
      chars: '한글, 영문, 숫자만 쓸 수 있어요.',
      profanity: '다른 별명을 지어 주세요'
    },
    step: '%n% / %total%'
  },

  select: {
    heading: '장면 고르기',
    titleLabel: '칭호',
    titleCount: '추천 묶음 %done% / %total%',
    defaultAddress: '통사',
    legendBundle: '★ 추천 묶음',
    legendOptional: '☆ 추천 선택',
    legendOutside: '○ 추천 묶음 밖',
    legendDone: '● 완료',
    roleBundle: '★ 추천',
    roleOptional: '☆ 추천 선택',
    roleOutside: '○ 추천 묶음 밖',
    rolePrologue: '서장',
    statusDone: '● 완료',
    statusProgress: '▶ 진행 중',
    glyphLabel: '패 글자',
    prologueAgain: '서장 다시 보기',
    prologueSkip: '교사 모드에서는 서장을 건너뛸 수 있어요.',
    notebook: '해독 수첩',
    settings: '설정'
  },

  stageLabels: {
    s0: '서장', s1: '제1장', s2: '제2장', s3: '제3장', s4: '제4장', s5: '제5장', s6: '제6장',
    s7: '제7장', s8: '제8장', s9: '제9장', s10: '제10장', s11: '제11장', s12: '종장'
  },

  notice: {
    outside: '%where%에서 배우는 내용이에요. 추천 묶음 밖이지만 들어가서 해 볼 수 있어요. 끝내면 완료와 패 글자를 받지만 칭호에는 세지 않아요.',
    outsideTitle: '추천 묶음 밖 장면',
    enter: '들어가기',
    pickOther: '다른 장면 고르기',
    storage: '이 기기에서는 기록을 저장할 수 없어요. 지금 하는 동안에는 이어지지만, 새로 고침하면 처음부터 시작해요.',
    storageTitle: '저장 안내',
    doneTitle: '끝낸 장면',
    doneHelp: '이 장면은 이미 끝냈어요. 처음부터 다시 하면 이 장면의 수첩과 항목이 비워져요. 패 글자와 완료 표시는 그대로 남아요.',
    replay: '처음부터 다시 하기',
    viewNotebook: '수첩 보기',
    newStartTitle: '새로 시작',
    newStartConfirm: '이 기기에 남은 기록을 모두 지우고 처음부터 시작할까요? 지운 기록은 되돌릴 수 없어요.',
    newStartYes: '모두 지우고 새로 시작',
    stageMissing: '이 장면은 아직 준비 중이에요.'
  },

  settings: {
    title: '설정',
    level: '학교급',
    levelHelp: '바꾸면 그 학교급의 기록과 추천 묶음으로 바뀌어요.',
    bangjeom: '방점 표시',
    bangjeomHelp: '제4장과 제10장에서는 늘 보여요.',
    modern: '현대어 풀이',
    modernHelp: '原文 아래에 오늘날 말로 옮긴 풀이를 보여 줘요. 그 原文으로 푸는 말을 해독한 뒤에 열려요(그 전에는 잠김 표지만 보여요). 과제 화면에는 나오지 않아요.',
    moderns: { tap: '눌러서 보기', always: '늘 보기', off: '끔' },
    eum: '한자 음 달기',
    eumHelp: '한자 아래에 오늘날 음을 작게 달아요. 原文에 원래 적힌 옛 읽기는 늘 보여요.',
    fontScale: '글자 크기',
    fontScales: { 1: '보통', 2: '크게', 3: '아주 크게' },
    reducedMotion: '움직임 줄이기',
    reducedMotions: { auto: '기기 설정 따름', on: '켬', off: '끔' },
    bgm: '배경음',
    sfx: '효과음',
    soundHelp: '소리는 화면을 처음 누르거나 키를 누른 뒤에 나요.',
    teacher: '교사 모드',
    teacherHelp: '걷기 건너뛰기, 크게 보기, 정답 바로 보기를 쓸 수 있어요. 교사 모드에서는 기록을 남기지 않아요.',
    teacherOn: '교사 모드 켜기',
    teacherOff: '교사 모드 끄기',
    teacherIsOn: '교사 모드가 켜져 있어요.',
    teacherPickLevel: '교사 모드에서 쓸 학교급을 골라 주세요.',
    newStart: '새로 시작',
    newStartHelp: '이 기기의 기록을 모두 지워요.',
    newStartTeacher: '교사 모드에서는 쓸 수 없어요.',
    lockedInStage: '장면 고르기 화면에서 바꿀 수 있어요.',
    current: '지금: %v%'
  },

  teacher: {
    places: '장소 목록',
    placesTitle: '장소 목록',
    placesHelp: '고르면 걷지 않고 바로 그 자리로 가서 살펴봐요.',
    placesEmpty: '아직 갈 수 있는 장소가 없어요.',
    npc: '인물',
    spot: '조사'
  },

  toolbar: {
    label: '장면 도구',
    notebook: '수첩',
    settings: '설정'
  },

  notebook: {
    title: '해독 수첩',
    stage: '장면',
    items: '확정한 항목',
    itemsEmpty: '아직 확정한 항목이 없어요.',
    translations: '옮긴 구절',
    translationsEmpty: '아직 옮긴 구절이 없어요.',
    rules: '규칙 카드',
    rulesEmpty: '아직 얻은 규칙 카드가 없어요.',
    unlearned: '아직 확인하지 않은 규칙',
    unlearnedEmpty: '모든 규칙을 확인했어요.',
    learnAt: '배우는 장면: %stage%',
    dogam: '옛글자 도감',
    dogamEmpty: '도감이 아직 비어 있어요.',
    dogamFound: '● 만남',
    dogamNotYet: '○ 아직',
    reflection: '돌아보기 한 줄',
    arrow: '→',
    saveImage: '수첩 이미지로 저장'
  },

  image: {
    formTitle: '수첩 이미지 저장',
    formHelp: '이름과 번호는 이미지에만 들어가요. 이 기기에는 남지 않아요.',
    name: '이름',
    number: '번호',
    make: '이미지 만들기',
    making: '만드는 중…',
    previewTitle: '수첩 이미지',
    download: '이미지 내려받기',
    longPress: '내려받기가 안 되면 위 그림을 길게 눌러 저장하세요.',
    failed: '이미지를 만들지 못했어요. 다시 해 주세요.',
    fileName: 'naratmalssami',
    level: '학교급',
    nameNo: '이름 · 번호',
    nickname: '별명',
    items: '확정한 항목',
    translations: '옮긴 구절',
    rules: '규칙 카드',
    reflection: '돌아보기 한 줄',
    glyph: '패 글자',
    titleLabel: '칭호',
    record: '기록',
    firstTry: '첫 시도 정확도',
    helps: '도움 사용',
    misreads: '오해 장면',
    timesUnit: '%n%번',
    percent: '%n%%',
    none: '—',
    statusDone: '완료',
    statusProgress: '진행 중',
    teacherMark: '교사 모드',
    createdAt: '만든 때'
  },

  // 학생 장소 목록(도구 막대) — js/ui/places.js. 고르면 그곳까지 걸어간다
  places: {
    button: '장소 목록',
    title: '장소 목록',
    help: '고르면 그곳까지 걸어가요. 닿으면 살피기 단추로 살펴보세요. 목표인 곳이 먼저 나와요.',
    empty: '아직 갈 수 있는 장소가 없어요.',
    unnamed: '이름 없는 곳',
    person: '인물',
    spot: '살필 곳',
    goal: '목표',
    visited: '살펴봄',
    notVisited: '아직 안 봄'
  }
};
