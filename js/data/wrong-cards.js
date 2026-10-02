'use strict';
/*
 * 오답 카드 목록 NM.data.WRONG_CARDS (선생님이 고칠 수 있는 공용 목록 — K1).
 * 학생이 실제로 하는 오개념만 모았다(웃음거리용 오답이 아니다. 예: 어린 = 나이 어린).
 * 장면 작가는 여기서 골라 해독 항목의 카드(items[].cards[] 의 correct:false 카드)로 옮겨 적는다.
 * 항목 카드 id 는 '<항목>.<a|b|c|d>' 이고, 카드의 text·why 는 장면에 맞게 줄이거나 다듬어도 된다.
 * 화면 코드는 이 목록을 직접 읽지 않는다(장면 데이터만 읽는다).
 *
 * ■ 필드
 *   id      'wrong.<영문 이름>' — 키와 같다.
 *   text    카드에 적힐 오답(학생이 고르게 될 잘못된 뜻이나 생각). 낱말 항목이면 잘못된 풀이, 규칙 항목이면 잘못된 규칙 문장.
 *   why     왜 아닌지(새로 쓴 글). 교과서·번역서·시험 문장을 옮기지 않았다.
 *   about   무엇에 관한 오개념인지(짧은 이름표, 화면에 보여도 되는 말).
 *   stages  이 카드를 쓸 만한 장면 id 목록.
 *   src     근거가 된 리서치 문서 위치(리서치 = design/research/ 의 번호 문서, 예: '리서치 10 §10 3번' = 10번 문서 10절 표의 3번).
 *   rule    (있으면) 관련 규칙 카드 id(NM.data.RULE_CARDS).
 *   word    (있으면) 낱말 항목일 때 그 옛 낱말(데이터 표기).
 *   orig    (있으면) 이 오개념이 생기기 쉬운 原文 블록 id 목록.
 *   caution (있으면) 장면 작가에게 주는 주의(화면에 내지 않는다). 예: 학설이 갈려 채점에 쓰면 안 되는 부분.
 *
 * ■ 넣지 않은 것: 학생 오개념이 아닌 설계 주의(예: '세기 범위를 정답으로 삼지 말 것', '교과서 표 예문의 시기')는 카드로 만들지 않았다.
 * ■ 적는 법: js/core/yet.js 머리의 데이터 표기. 옛 음절은 [ㅁㆍㄹ], 나열은 쉼표. 원문 한 줄을 통째로 옮겨 적지 않는다(블록 id 로만).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.WRONG_CARDS = {
  // ── 창제와 글자 (서장·2·3·9) ──
  'wrong.scholarsMade': {
    id: 'wrong.scholarsMade', stages: ['s2', 's9'], about: '누가 만들었나',
    text: '집현전 학자들이 모여 한글을 만들었다.',
    why: '서문에서 임금이 스스로 스물여덟 글자를 새로 지었다고 밝힌다. 정인지를 비롯한 학자들은 만든 글자의 원리와 쓰임을 풀이한 해례를 지었다.',
    src: '리서치 03 §2 M1, 리서치 09 §4-1, §4-4',
    orig: ['O-s9-SEOMUN6']
  },
  'wrong.sameName': {
    id: 'wrong.sameName', stages: ['s2'], about: '글자의 이름',
    text: '\'훈민정음\'과 \'한글\'은 처음부터 같은 이름이었다.',
    why: '\'훈민정음\'은 세종 때 만든 글자의 이름이자 그 글자를 풀이한 책의 이름이다. \'한글\'은 창제 때 쓰던 이름이 아니라 훨씬 뒤에 붙은 이름이다.',
    src: '리서치 03 §2 M2',
    caution: '\'한글\'이라는 이름이 생긴 정확한 때는 리서치에서 확인하지 않았다. 연도를 덧붙이지 않는다.'
  },
  'wrong.byeop28': {
    id: 'wrong.byeop28', stages: ['s0', 's3'], about: '28자의 범위', rule: 'rule.letters28',
    text: 'ㅸ도 스물여덟 자 가운데 하나다.',
    why: '28자는 첫소리 17자와 가운뎃소리 11자다. ㅸ은 ㅂ 아래에 ㅇ을 이어 써서 만든 글자라 이 안에 들지 않는다.',
    src: '리서치 03 §2 M3, 리서치 09 §4-3, §4-5',
    orig: ['O-s2-JJ-CHO17', 'O-s3-YEONSEO']
  },
  'wrong.icheIsStroke': {
    id: 'wrong.icheIsStroke', stages: ['s2'], about: '획을 더한 글자와 모양을 달리한 글자', rule: 'rule.iche',
    text: 'ㆁ, ㄹ, ㅿ도 획을 더해 만든 글자다.',
    why: '이 셋은 획을 더할수록 소리가 세지는 길을 따르지 않았다. 모양을 달리해 만든 글자다.',
    src: '리서치 03 §2 M4, 리서치 09 §4-3, §5, 리서치 06 §7-1',
    orig: ['O-s2-ICHE', 'O-s2-GAHOEK2']
  },
  'wrong.araeaIsA': {
    id: 'wrong.araeaIsA', stages: ['s0', 's10', 's11'], about: 'ㆍ의 정체',
    text: 'ㆍ는 ㅏ와 같은 소리였다.',
    why: 'ㆍ는 28자 안에서 ㅏ와 따로 만든 모음 글자다. 소리가 사라질 때 둘째 음절 이하에서는 주로 ㅡ로 바뀌었으니 ㅏ와 같은 소리로 볼 수 없다.',
    src: '리서치 03 §2 M9, 리서치 11 §5, §9',
    caution: 'ㆍ의 정확한 소리값은 학설이 갈린다. 소리값을 맞히는 채점에는 쓰지 말고 해석 카드로 둔다.'
  },
  'wrong.spreadAtOnce': {
    id: 'wrong.spreadAtOnce', stages: ['s9', 's10'], about: '새 글자가 퍼진 길',
    text: '한글은 반포되자마자 온 나라에서 널리 쓰였다.',
    why: '새 글자는 책을 우리말로 옮기는 언해 사업과 편지 같은 생활 속 쓰임을 거치며 차츰 퍼졌다. 곧바로 온 나라에 퍼진 것도, 아무도 쓰지 않은 것도 아니다.',
    src: '리서치 03 §2 M10, 리서치 02 §2-3'
  },
  'wrong.abolishHanja': {
    id: 'wrong.abolishHanja', stages: ['s2', 's9'], about: '창제의 목적',
    text: '세종은 한자를 없애려고 새 글자를 만들었다.',
    why: '서문은 글 모르는 백성이 제 뜻을 펴게 하려는 뜻을 밝힐 뿐, 한자를 버리자고 하지 않는다. 언해본도 한자 옆에 새 글자로 소리를 달아 함께 썼다.',
    src: '리서치 03 §2 M11, 리서치 09 §4-1',
    orig: ['O-s9-SEOMUN1', 'O-s9-SEOMUN3']
  },

  // ── 4 소리대로 적은 책 ──
  'wrong.linkedIsMistake': {
    id: 'wrong.linkedIsMistake', stages: ['s4'], about: '이어 적기', rule: 'rule.linkedWriting',
    text: '이어 적기는 맞춤법을 잘 몰라서 생긴 잘못이다.',
    why: '15세기에는 소리 나는 대로 적는 것이 표기 원리였다. 지금과 원리가 달랐을 뿐 잘못 적은 것이 아니다.',
    src: '리서치 03 §2 M5',
    orig: ['O-s4-YB2a', 'O-s4-YB2b']
  },
  'wrong.bangjeomStress': {
    id: 'wrong.bangjeomStress', stages: ['s4'], about: '방점이 나타내는 것', rule: 'rule.bangjeom',
    text: '방점은 소리의 세기나 길이를 나타낸다.',
    why: '해례는 점의 개수로 평성, 거성, 상성을 가른다고 밝힌다. 방점은 소리의 높낮이(성조)를 나타낸다.',
    src: '리서치 03 §2 M6, 리서치 09 §4-5, §5',
    orig: ['O-s3-HJ-BANGJEOM', 'O-s3-HJ-SASEONG']
  },
  'wrong.gipgoError': {
    id: 'wrong.gipgoError', stages: ['s4'], about: '8종성법의 예외', rule: 'rule.eightFinals',
    text: '\'깊고\', \'높고\'는 8종성법을 어긴 잘못이다.',
    why: '「용비어천가」가 원래 받침을 살려 적은 예외 표기로 본다. 받침을 몰라서 틀린 것이 아니다.',
    src: '리서치 10 §10 15번',
    orig: ['O-s4-YB34a', 'O-s4-YB34b']
  },

  // ── 5 사라진 소리, 바뀐 뜻 ──
  'wrong.eorinYoung': {
    id: 'wrong.eorinYoung', stages: ['s5', 's9'], about: '어리다의 뜻', rule: 'rule.meaningChange', word: '어린',
    text: '나이가 어린',
    why: '15세기 \'어리다\'는 \'어리석다, 슬기가 모자라다\'는 뜻이었다. 나이가 적다는 뜻은 \'졈다\'가 맡았다.',
    src: '리서치 03 §2 M8, 리서치 10 §10 3번',
    orig: ['O-s9-SEOMUN3', 'O-s5-YB39a', 'O-s6-SS6a']
  },
  'wrong.hadaDo': {
    id: 'wrong.hadaDo', stages: ['s5', 's9'], about: '하다의 뜻', rule: 'rule.meaningChange', word: '하다',
    text: '(무엇을) 하다',
    why: '15세기 \'하다\'는 \'많다\'는 뜻이었다. 지금의 \'하다\'에 해당하는 말은 \'[ㅎㆍ]다\'였다.',
    src: '리서치 10 §10 4번',
    orig: ['O-s9-SEOMUN4', 'O-s5-YB13', 'O-s4-YB2a']
  },
  'wrong.eoyeopbeuPretty': {
    id: 'wrong.eoyeopbeuPretty', stages: ['s5', 's9'], about: '어엿브다의 뜻', rule: 'rule.meaningChange', word: '어엿브다',
    text: '예쁘다',
    why: '15세기 \'어엿브다\'는 \'불쌍하다, 가엾다\'는 뜻이었다. 뜻이 옮겨 가 지금의 \'예쁘다\'가 되었다.',
    src: '리서치 10 §10 5번, 리서치 02 §2-2',
    orig: ['O-s9-SEOMUN5', 'O-s5-YB50', 'O-s5-SS613']
  },
  'wrong.nomInsult': {
    id: 'wrong.nomInsult', stages: ['s5', 's9'], about: '놈의 뜻', rule: 'rule.meaningChange', word: '놈',
    text: '남을 낮추어 부르는 말',
    why: '15세기 \'놈\'은 낮춤의 뜻 없이 그냥 \'사람\'을 가리켰다. 앞뒤 문맥이 나빠 보여도 낮춤말이라는 근거는 되지 않는다.',
    src: '리서치 10 §10 6번',
    orig: ['O-s9-SEOMUN4', 'O-s5-YB64'],
    caution: '서문의 노미(者)를 \'것, 경우\'로 보자는 견해도 있다(리서치 09 §8-1). 서문 구절에서는 \'사람\' 대 \'낮춤말\'만 가르고 그 밖의 풀이는 해석 카드로 둔다.'
  },
  'wrong.malsseumHonor': {
    id: 'wrong.malsseumHonor', stages: ['s5', 's9'], about: '말[ㅆㆍㅁ]의 뜻', rule: 'rule.meaningChange', word: '말[ㅆㆍㅁ]',
    text: '높여 이르는 \'말씀\'',
    why: '15세기 \'말[ㅆㆍㅁ]\'은 높임의 뜻 없이 그냥 \'말\'이었다. 임금의 말을 가리킬 때 쓰였다고 해서 높임말이 되는 것은 아니다.',
    src: '리서치 10 §10 7번',
    orig: ['O-s9-SEOMUN1', 'O-s5-YB13', 'O-s5-YB39b']
  },
  'wrong.yeoreumSummer': {
    id: 'wrong.yeoreumSummer', stages: ['s4', 's5'], about: '여름의 뜻', rule: 'rule.meaningChange', word: '여름',
    text: '계절 여름',
    why: '15세기 \'여름\'은 \'열매\'였다. 계절 여름은 \'녀름\'이라 따로 적었다.',
    src: '리서치 10 §10 8번',
    orig: ['O-s4-YB2a', 'O-s5-WS112']
  },
  'wrong.jeumeunMany': {
    id: 'wrong.jeumeunMany', stages: ['s5'], about: '즈믄의 뜻', rule: 'rule.nativeVsSino', word: '즈믄',
    text: '많다',
    why: '\'즈믄\'은 수 \'천(千)\'을 가리키는 고유어다. 한시의 千을 우리말로 옮긴 자리에 쓰였다.',
    src: '리서치 10 §10 9번',
    orig: ['O-s5-DS1017', 'O-s5-DS114']
  },
  'wrong.jeommeoYouth': {
    id: 'wrong.jeommeoYouth', stages: ['s5', 's6'], about: '졈다의 뜻', word: '져머',
    text: '젊은이(청년)처럼',
    why: '15세기 \'졈다\'는 아이처럼 나이가 어린 것까지 가리켰다. 羅雲은 아이였다.',
    src: '리서치 10 §10 22번',
    orig: ['O-s6-SS6a', 'O-s8-SS6g']
  },
  'wrong.haneulhiSuffix': {
    id: 'wrong.haneulhiSuffix', stages: ['s4', 's5'], about: 'ㅎ 종성 체언', rule: 'rule.hFinalNoun',
    text: '\'하[ㄴㆍㄹ]히\'는 \'하[ㄴㆍㄹ]\'에 접사 \'히\'가 붙은 말이다.',
    why: '\'하[ㄴㆍㅀ]\'처럼 끝에 ㅎ을 지닌 체언에 주격 조사 \'이\'가 붙어, 숨어 있던 ㅎ이 드러난 것이다.',
    src: '리서치 10 §10 14번',
    orig: ['O-s4-YB34a', 'O-s4-YB34b']
  },

  // ── 6 말을 잇는 끈 ──
  'wrong.ga15c': {
    id: 'wrong.ga15c', stages: ['s6', 's9'], about: '주격 조사', rule: 'rule.nomCase',
    text: '15세기에도 주격 조사 \'가\'가 있었다.',
    why: '15세기 주격 조사는 \'이\', \'ㅣ\', 형태 없음(Ø) 세 가지뿐이었다. 15세기 문헌에서는 주격 \'가\'를 찾을 수 없다. \'가\'는 16세기 말 무렵의 글에서 드물게 보이기 시작해 근대 국어에 와서 널리 쓰였다.',
    src: '리서치 03 §2 M7, 리서치 10 §10 1번',
    orig: ['O-s4-YB2a', 'O-s7-SS6b']
  },
  'wrong.genitiveAlwaysUi': {
    id: 'wrong.genitiveAlwaysUi', stages: ['s6'], about: '관형격 조사', rule: 'rule.genitiveS',
    text: '관형격 조사는 언제나 \'의\'였다.',
    why: '무정 명사나 높일 대상 뒤에는 \'ㅅ\'을 썼고(부텻), 높이지 않는 사람이나 동물 뒤에는 \'[ㅇㆎ]\'나 \'의\'를 썼다.',
    src: '리서치 10 §10 18번',
    orig: ['O-s8-SS6g', 'O-s6-SS6e', 'O-s6-SS6j']
  },
  'wrong.nominalEum': {
    id: 'wrong.nominalEum', stages: ['s6'], about: '명사형 어미', rule: 'rule.nominalOm',
    text: '15세기 명사형 어미도 지금처럼 \'-(으)ㅁ\'이 중심이었다.',
    why: '15세기 명사형 어미는 주로 \'-옴/-움\'이었다. 서문의 \'[ㅄㅜ]메\'도 \'[ㅄㅡ]- + -움 + 에\'로 나뉜다.',
    src: '리서치 10 §10 19번',
    orig: ['O-s9-SEOMUN7', 'O-s6-SS6a', 'O-s6-SS6d']
  },
  'wrong.eIsPlace': {
    id: 'wrong.eIsPlace', stages: ['s6', 's9'], about: '비교의 에', rule: 'rule.compareE',
    text: '\'中國에 달아\'의 \'에\'는 장소를 나타낸다.',
    why: '여기서 \'에\'는 견주는 대상을 나타낸다. \'중국과 달라\'라는 뜻이다.',
    src: '리서치 10 §10 20번',
    orig: ['O-s9-SEOMUN1']
  },

  // ── 7 높이는 말 ──
  'wrong.honorOnlySi': {
    id: 'wrong.honorOnlySi', stages: ['s7'], about: '높임 선어말 어미의 종류', rule: 'rule.objHon',
    text: '높임을 나타내는 선어말 어미는 \'-시-\' 하나뿐이다.',
    why: '15세기에는 주어를 높이는 \'-시-/-샤-\', 목적어나 부사어가 가리키는 대상을 높이는 \'-[ㅅㆍㅂ]-\' 무리, 듣는 사람을 높이는 \'-[ㆁㅣ]-\'가 따로 있었다.',
    src: '리서치 10 §10 10번',
    orig: ['O-s4-YB34a', 'O-s7-SS6b', 'O-s7-SS6h']
  },
  'wrong.objHonSubject': {
    id: 'wrong.objHonSubject', stages: ['s7'], about: '객체 높임', rule: 'rule.objHon',
    text: '객체 높임 어미가 있으면 주어를 높인 것이다.',
    why: '객체 높임은 목적어나 부사어가 가리키는 대상을 높인다. 從[ㅎㆍ][ㅿㆍㅂ]디에서 높이는 대상은 부처이고, 주어는 羅雲이다.',
    src: '리서치 10 §10 11번',
    orig: ['O-s7-SS6b']
  },
  'wrong.ingiCopula': {
    id: 'wrong.ingiCopula', stages: ['s7'], about: '상대 높임', rule: 'rule.addrHon',
    text: '\'건너시니[ㆁㅣ]다\'의 \'[ㆁㅣ]\'는 서술격 조사 \'이\'다.',
    why: '\'-[ㆁㅣ]-\'는 듣는 사람을 높이는 상대 높임 선어말 어미다. 체언 뒤에 붙는 서술격 조사와 달리 용언의 어미 자리에 들어간다.',
    src: '리서치 10 §10 12번',
    orig: ['O-s4-YB34a']
  },
  'wrong.salboObjHon': {
    id: 'wrong.salboObjHon', stages: ['s7', 's8'], about: '객체 높임과 닮은 말', rule: 'rule.objHon',
    text: '\'[ㅅㆍㄹ][ㅸㅗ][ㄷㆎ]\'의 \'[ㅅㆍㅂ]\'은 객체 높임 어미다.',
    why: '여기서는 \'아뢰다\'라는 뜻의 동사 \'[ㅅㆍㄼ]-\'의 어간이다. 모양이 비슷해도 어미가 아니다.',
    src: '리서치 10 §10 13번',
    orig: ['O-s8-SS6g']
  },

  // ── 8 묻는 말 ──
  'wrong.questionGaIsNom': {
    id: 'wrong.questionGaIsNom', stages: ['s8'], about: '묻는 말의 가', rule: 'rule.yesNoQ',
    text: '\'너희 죵가\'의 \'가\'는 주격 조사다.',
    why: '체언 바로 뒤에 붙어 묻는 뜻을 더하는 \'가\'다(판정 의문). 주격 조사 \'가\'는 이때 아직 없었다.',
    src: '리서치 10 §10 2번',
    orig: ['O-s8-WS894']
  },
  'wrong.questionByEnding': {
    id: 'wrong.questionByEnding', stages: ['s8'], about: '판정 의문과 설명 의문', rule: 'rule.whQ',
    text: '의문사가 있는지는 볼 필요 없이 어미 모양만으로 판정 의문과 설명 의문을 가를 수 있다.',
    why: '어미가 \'-[ㆁㅣㅅ]가\', \'-[ㆁㅣㅅ]고\'처럼 길어지면 헷갈리기 쉽다. 먼저 \'어느, 엇더\' 같은 의문사가 있는지 본다. 있으면 설명 의문(-고 계열), 없으면 판정 의문(-가 계열)이다.',
    src: '리서치 10 §10 16번',
    orig: ['O-s8-YB28', 'O-s8-YB15']
  },
  'wrong.deunneundaStatement': {
    id: 'wrong.deunneundaStatement', stages: ['s8'], about: '2인칭 의문', rule: 'rule.secondPersonQ',
    text: '\'듣[ㄴㆍㄴ]다\'는 지금의 \'듣는다\'처럼 서술하는 말이다.',
    why: '주어가 듣는 사람(너)일 때 쓰는 의문형 \'-ㄴ다\'다. \'듣느냐\'라고 묻는 말이다.',
    src: '리서치 10 §10 17번',
    orig: ['O-s8-SS6f', 'O-s8-SS68']
  },

  // ── 1 빌려 쓴 글자 ──
  'wrong.particleAlwaysSound': {
    id: 'wrong.particleAlwaysSound', stages: ['s1'], about: '향찰의 조사와 어미', rule: 'rule.hyangchal',
    text: '향찰에서 조사와 어미는 언제나 한자의 소리를 빌려 적었다.',
    why: '규칙은 \'대체로\'다. \'如可\'(-다가)의 如는 새김 \'다\'를 빌린 글자다.',
    src: '리서치 11 §11 1번',
    orig: ['O-s1-CHEOYONG1']
  },
  'wrong.oldNameSound': {
    id: 'wrong.oldNameSound', stages: ['s1'], about: '고장 이름 적기', rule: 'rule.borrowing',
    text: '옛 고장 이름은 늘 소리를, 고친 이름은 늘 뜻을 빌려 적었다.',
    why: '吉同(옛 이름, 소리)과 永同(고친 이름, 뜻)만 보면 그래 보인다. 그러나 推火(옛 이름)는 뜻을, 密城(고친 이름)은 소리를 빌려 방향이 반대다.',
    src: '리서치 11 §11 2번, §4-1',
    orig: ['O-s1-YEONGDONG', 'O-s1-MILSEONG']
  },
  'wrong.hyangchalOneWay': {
    id: 'wrong.hyangchalOneWay', stages: ['s1'], about: '향찰의 짜임', rule: 'rule.hyangchal',
    text: '향찰은 한자의 뜻만 빌려 적었다.',
    why: '한 구절 안에서도 뜻을 빌린 글자와 소리를 빌린 글자가 섞인다. 「처용가」 둘째 구의 夜는 뜻(밤)을, 伊는 소리(이)를 빌렸다.',
    src: '리서치 11 §11 3번, §4-1',
    orig: ['O-s1-CHEOYONG1']
  },

  // ── 10 백 년 뒤 ──
  'wrong.hunmongAllSound': {
    id: 'wrong.hunmongAllSound', stages: ['s10'], about: '자모 이름',
    text: '『훈몽자회』의 자모 이름은 모두 한자의 소리를 빌려 지었다.',
    why: 'ㄷ의 末(새김 \'귿\')과 ㅅ의 衣(새김 \'옷\')는 뜻을 빌려 \'디귿\', \'시옷\'이 되었다.',
    src: '리서치 11 §11 4번, 리서치 06 §7-2',
    orig: ['O-s10-HUNMONG1', 'O-s10-HUNMONG2']
  },
  'wrong.ga16c': {
    id: 'wrong.ga16c', stages: ['s10'], about: '16세기의 주격 조사', rule: 'rule.nomI16',
    text: '16세기 후반 『소학언해』에서도 주격 조사로 이미 \'가\'를 썼다.',
    why: '『소학언해』(1588)의 이 대목에서 주격은 \'ㅣ\'다(孔子ㅣ). \'가\'는 16세기 말 무렵의 글에서 드물게 보이기 시작하지만 이 대목에는 없고, 널리 쓰인 것은 근대 국어에 와서다.',
    src: '리서치 11 §11 5번, 리서치 05 §3-1, 『새국어생활』 4권 4호(1994) 「갑오경장기의 문법」',
    orig: ['O-s10-SOHAK1']
  },
  'wrong.harmonyGone16': {
    id: 'wrong.harmonyGone16', stages: ['s10'], about: '모음 조화의 흔들림', rule: 'rule.harmony16',
    text: '모음 조화는 16세기에 완전히 무너졌다.',
    why: '16세기 후반 『소학언해』 한 대목 안에도 지킨 예(父母[ㄹㆍㄹ])와 어긴 예(몸을)가 함께 나온다. 흔들리기 시작했을 뿐이다.',
    src: '리서치 11 §11 12번',
    orig: ['O-s10-SOHAK2', 'O-s10-SOHAK4']
  },

  // ── 11 끊어 적는 시대 ──
  'wrong.seoulFourEras': {
    id: 'wrong.seoulFourEras', stages: ['s11'], about: '낱말 변화의 단계',
    text: '셔[ㅸㅡㄹ], 셔욿, 셔울, 서울은 차례로 이어진 네 시대의 모습이다.',
    why: '셔욿과 셔울은 같은 때에 함께 쓰인 두 모양이다(끝에 ㅎ을 지닌 체언). 단계는 셔[ㅸㅡㄹ] → 셔울 → 서울로 본다.',
    src: '리서치 11 §11 6번, §5'
  },
  'wrong.allJida': {
    id: 'wrong.allJida', stages: ['s5', 's11'], about: '구개음화를 거친 말', rule: 'rule.palatal',
    text: '모든 \'지다\'는 옛말 \'디다\'에서 왔다.',
    why: '\'해가 지다\'의 \'지다\'는 \'디다\'에서 왔지만, \'짐을 지다\'의 \'지다\'는 15세기에도 \'지다\'였다.',
    src: '리서치 11 §11 8번, §5'
  },
  'wrong.modernAllSeparate': {
    id: 'wrong.modernAllSeparate', stages: ['s11'], about: '근대의 적기 방식', rule: 'rule.mixedWriting',
    text: '근대 국어에서는 모두 끊어 적기로 바뀌었다.',
    why: '한 글 안에 이어 적기, 끊어 적기, 거듭 적기가 함께 나온다. 『독립신문』 한 문장에도 \'아러보지\'와 \'알아보니\'가 함께 쓰였다.',
    src: '리서치 11 §11 9번',
    orig: ['O-s11-DOKRIP4']
  },
  'wrong.noAraeaModern': {
    id: 'wrong.noAraeaModern', stages: ['s11'], about: 'ㆍ 글자의 수명', rule: 'rule.araeaLoss',
    text: '근대 자료에는 ㆍ가 쓰이지 않는다.',
    why: 'ㆍ의 소리는 사라졌어도 글자는 오래 남았다. 1896년 신문에도 \'사[ㄹㆍㅁ]\'처럼 ㆍ가 적혀 있다.',
    src: '리서치 11 §11 10번',
    orig: ['O-s11-DOKRIP2', 'O-s11-AD1902']
  },
  'wrong.noDyoAfterPalatal': {
    id: 'wrong.noDyoAfterPalatal', stages: ['s11'], about: '표기 변화의 속도', rule: 'rule.palatal',
    text: '구개음화가 일어난 뒤에는 \'됴\'처럼 적는 일이 없었다.',
    why: '표기는 고르게 바뀌지 않았다. 1795년 책은 이미 \'죠흐료\'라 적었지만, 1896년 신문에는 \'됴흔\'이 나온다.',
    src: '리서치 11 §11 11번',
    orig: ['O-s11-NOGEOL1795', 'O-s11-DOKRIP3']
  },

  // ── 종장 s12 ──
  'wrong.coffeeHonor': {
    id: 'wrong.coffeeHonor', stages: ['s12'], about: '사물 높임', rule: 'rule.livingLanguage',
    text: '\'커피 나오셨습니다\'는 손님을 높인 바른 말이다.',
    why: '\'-시-\'는 문장의 주어를 높인다. 이 문장의 주어는 커피라서 \'-시-\'를 붙이는 것이 맞지 않는다.',
    src: '리서치 11 §11 13번, §6-1'
  },
  'wrong.aeEStandard': {
    id: 'wrong.aeEStandard', stages: ['s12'], about: '현실 발음과 표준 발음', rule: 'rule.livingLanguage',
    text: 'ㅔ와 ㅐ를 구별하지 않는 사람이 많으니 표준 발음도 하나가 되었다.',
    why: '현실 발음에서 구별이 약해졌어도 표준 발음법은 여전히 둘을 다른 소리로 둔다. 현실과 규범을 나누어 보아야 한다.',
    src: '리서치 11 §11 14번, §6-1'
  },
  'wrong.fewLettersFast': {
    id: 'wrong.fewLettersFast', stages: ['s12'], about: '한글 입력이 빠른 까닭', rule: 'rule.digitalHangul',
    text: '한글 입력이 빠른 까닭은 글자 수가 적기 때문이다.',
    why: '자음, 모음을 누르는 대로 음절이 바로 완성되어 한자로 바꾸는 단계가 없고, 모아쓰기로 음절이 만들어지기 때문이다.',
    src: '리서치 11 §11 15번, §6-2'
  },

  // ── Q2 플레이테스트에서 장면 카드에서 옮겨 온 것(여러 장면에 다시 쓸 만한 오개념) ──
  'wrong.yearsFixOrder': {
    id: 'wrong.yearsFixOrder', stages: ['s11', 's12'], about: '변화의 연도', rule: 'rule.changeChain',
    text: '낱말마다 바뀐 해가 하나씩 정해져 있어서, 연도를 외우면 차례도 정해진다.',
    why: '문헌에 보인 때가 서로 겹친다. 옛 모습과 새 모습이 함께 쓰인 때가 있어 연도 하나로 못 박을 수 없고, 앞뒤 차례로 본다.',
    src: '리서치 11 §11 7번'
  },
  'wrong.oldFormVanishes': {
    id: 'wrong.oldFormVanishes', stages: ['s10', 's11', 's12'], about: '옛 모습과 새 모습', rule: 'rule.changeChain',
    text: '새 모습이 나타나면 옛 모습은 그 자리에서 사라졌다.',
    why: '\'믈\'과 \'물\'처럼 앞 모습과 뒤 모습이 오랫동안 함께 쓰였다. 새 모습이 생긴 뒤에도 옛 모습은 한동안 남았다.',
    src: '리서치 11 §5, §11 10번'
  },
  'wrong.syllabary': {
    id: 'wrong.syllabary', stages: ['s3', 's12'], about: '한글의 문자 종류', rule: 'rule.moasseugi',
    text: '한글은 한 덩어리가 곧 한 글자인 음절 문자라서 모아 쓴다.',
    why: '한글은 자음, 모음 하나하나가 소리 하나를 나타내는 음소 문자다. 그 글자들을 음절 단위로 모아 쓸 뿐이다.',
    src: '리서치 06 §4'
  }
};
