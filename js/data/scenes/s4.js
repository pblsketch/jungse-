'use strict';
/*
 * 장면 4 「소리대로 적은 책」 (1447 활자 인쇄소 · 고1, 고2~3 묶음). 장면 데이터 모양은 js/data/scenes/README.md.
 * - 原文: 「용비어천가」 제2장(O-s4-YB2a·YB2b), 제34장(O-s4-YB34a·YB34b) — 블록 id 로만 가리킨다(리서치 10 §4).
 * - 기믹: 끊어 읽기(wordCut, js/gimmicks/README-wordCut.md). 정답 경계는 README 의 블록별 경계를 그대로 쓴다.
 * - 고1과 고2~3은 같은 과제를 하고, 고2~3은 모음 조화 항목(s4.r5, levels ['h23'])을 더 한다.
 *   중학교 학생이 들어오면 고1 범위를 쓴다(js/data/rules-config.js).
 * - 사라진 글자(ㆍ ㆁ ㅸ)는 서장의 규칙(rule.letters28)이라 needs 와 알아 두기로 짚는다(따로 항목을 두지 않음 — 10~12분).
 * - 방점은 이 장면에서 늘 켠다(진행기가 s4 를 늘 켬, bangjeomAlways 도 적어 둠). 음높이 값은 해석이라 채점하지 않는다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s4'] = {
  id: 's4',
  title: '소리대로 적은 책',
  era: '1447년 활자 인쇄소',
  mapKey: 's4',
  bgmKey: 'bgm_s4',
  carveGlyph: '〮',
  bangjeomAlways: true,

  cast: {
    artisan: { name: '활자 장인', portrait: 'artisan' },
    commoner_man: { name: '구경 온 백성', portrait: 'commoner_man' },
    commoner_woman: { name: '책을 기다리는 아낙', portrait: 'commoner_woman' }
  },

  fiction: [
    { id: 'fiction.tongsa', text: '정음 통사: 새 글자와 사람들의 말 사이를 옮겨 주는 통역관', real: '이런 직책은 없었어요. 이야기를 위해 지어낸 일이에요.' },
    { id: 'fiction.s4press', text: '1447년의 활자 인쇄소와 장인, 문 앞에서 책을 기다리는 백성들', real: '이야기를 위해 지어낸 무대예요. 「용비어천가」를 어디서, 누가, 어떤 방법으로 찍었는지는 이 장면에서 다루지 않아요.' }
  ],

  intro: [
    { who: 'narrator', text: '1447년, 한양의 한 인쇄소. 먹 냄새와 쇳물 냄새가 뒤섞여 있다.', cg: 's4_intro', fiction: 'fiction.s4press' },
    { who: 'senior', text: '<@아>, 여기가 새 책을 찍는 곳이야. 오늘은 우리 정음 통사가 할 일이 있대.', fiction: 'fiction.tongsa' },
    { who: 'senior', text: '찍어 낸 책을 백성들한테 소리 내어 읽어 주는 일이야. 생각보다 만만치 않을걸.', expr: 'smile' }
  ],

  request: [
    { who: 'artisan', text: '나라를 세운 임금님 조상들을 기리는 노래책을 막 찍어 냈는데, 사람들이 어디서 끊어 읽어야 할지 모르겠다고 하오.' },
    { who: 'commoner_woman', text: '새 글자를 배웠다고 좋아했는데, 막상 책을 펴 보니 앞이 캄캄하네요. 좀 읽어 주세요.' }
  ],

  encounter: {
    orig: ['O-s4-YB2a', 'O-s4-YB34a'],
    lines: [
      { who: 'me', text: '글자 왼쪽에 점이 찍혀 있어요. 하나 찍힌 것도, 둘 찍힌 것도 있고요.', expr: 'surprised' },
      { who: 'senior', text: '여기 보이는 빈칸은 내가 읽기 쉽게 띄어 옮겨 적은 거야. 장인이 찍은 종이에는 빈칸이 하나도 없어.' },
      { who: 'senior', text: '받침이 있어야 할 것 같은 데에 없고, 뒤 글자에 붙어 있기도 하지? 하나씩 풀어 보자.' }
    ]
  },

  example: {
    orig: ['O-s4-YB2a'],
    lines: [
      { who: 'senior', text: '첫 낱말은 내가 풀어 볼게. 불·휘는 지금 말로 뿌리야. 뒤에 붙은 조사가 없으니 여기서 한 번 끊으면 돼.' },
      { who: 'senior', text: '휘 왼쪽의 점, 깊다를 닮은 기·픈은 네 몫이야. 인쇄소를 돌며 같은 말이 쓰인 다른 장을 찾아 두 곳을 견주어 봐.', expr: 'thinking' }
    ]
  },

  needs: [
    {
      rule: 'rule.letters28',
      lines: [
        { who: 'senior', text: '이 책에는 지금 쓰지 않는 글자도 섞여 있어. ㆍ, ㆁ 같은 글자야.' },
        { who: 'senior', text: '훈민정음 28자 가운데 ㆍ, ㅿ, ㆆ, ㆁ 네 글자는 지금 쓰지 않아. ㅸ은 ㅂ 아래에 ㅇ을 이어 쓴 글자라 28자에 들지 않고.' }
      ]
    }
  ],

  contexts: [
    {
      id: 's4.c1', label: '인쇄대에 걸린 첫 장', orig: ['O-s4-YB2a'],
      lines: [
        { who: 'artisan', text: '방금 찍은 제2장 앞쪽이오. 먹이 아직 덜 말랐으니 손대지 마시오.' },
        { who: 'senior', text: '점이 없는 글자, 하나인 글자, 둘인 글자가 이 한 줄에 다 나와.' }
      ],
      items: ['s4.r1', 's4.r3', 's4.r4', 's4.r5']
    },
    {
      id: 's4.c2', label: '책 말리는 시렁의 둘째 장', orig: ['O-s4-YB2b'],
      lines: [
        { who: 'narrator', text: '시렁에 제2장 뒤쪽이 널려 마르고 있다.' },
        { who: 'senior', text: '·므·른을 봐. 믈 뒤에 무엇이 붙었을까?' }
      ],
      items: ['s4.r1', 's4.r5']
    },
    {
      id: 's4.c3', label: '책 탁자의 제34장', orig: ['O-s4-YB34a'],
      lines: [
        { who: 'narrator', text: '책 탁자에 제34장 앞쪽이 놓여 있다.' },
        { who: 'senior', text: '여기도 깊다가 나와. 앞에서 본 기·픈과 받침을 견주어 봐.' }
      ],
      items: ['s4.r2', 's4.r4']
    },
    {
      id: 's4.c4', label: '활자판 탁자에 짜 둔 판', orig: ['O-s4-YB34b'],
      lines: [
        { who: 'artisan', text: '제34장 뒤쪽을 짜 둔 판이오. 앞쪽과 말이 거의 같은데 몇 글자만 다르지.' },
        { who: 'senior', text: '높·고의 받침도 눈여겨봐.' }
      ],
      items: ['s4.r2', 's4.r3']
    },
    {
      id: 's4.c5', label: '활자 장인의 말',
      lines: [
        { who: 'artisan', text: '판을 짤 때는 활자를 한 줄로 빈틈없이 박소. 글자와 글자 사이에 빈자리를 남기는 법이 없지.' },
        { who: 'artisan', text: '어디서 끊어 읽을지는 읽는 사람이 알아서 해야 하오. 그래서 다들 헤매는 거고.' }
      ],
      items: ['s4.r4']
    },
    {
      id: 's4.c6', label: '구경 온 백성의 물음',
      lines: [
        { who: 'commoner_man', text: '어떤 글자는 왼쪽에 점이 하나, 어떤 글자는 둘, 어떤 건 하나도 없소. 이게 다 무슨 표시요?' },
        { who: 'commoner_man', text: '노래책이라니, 노래할 때 쓰는 표시인가?', expr: 'thinking' }
      ],
      items: ['s4.r3']
    }
  ],

  items: [
    {
      id: 's4.t1', kind: 'task', levels: ['h1', 'h23'],
      label: '띄어쓰기 없는 두 줄 끊어 읽기',
      prompt: '빈칸 없이 찍힌 두 줄을 낱말이 끝나는 자리에서 끊어 보세요. 조사와 어미는 앞말에 붙여 한 덩어리로 둡니다.',
      gimmick: 'wordCut',
      config: {
        lines: [{ block: 'O-s4-YB2a' }, { block: 'O-s4-YB34a' }],
        pitch: true,
        compare: [
          {
            a: { block: 'O-s4-YB2a', at: [2, 4] },
            b: { block: 'O-s4-YB34a', at: [1, 3] },
            note: '같은 깊다인데 한쪽은 받침 ㅍ을 뒤 글자로 넘겨 적었고(깊 + 은 → 기·픈), 한쪽은 받침 자리에 그대로 두었어요(깊·고).'
          }
        ]
      },
      answer: {
        'O-s4-YB2a': [1, 3, 5, 8, 10, 12, 13, 15, 17],
        'O-s4-YB34a': [0, 2, 3, 7, 10, 14, 15, 16, 18]
      },
      hints: [
        '조사나 어미가 붙은 데까지가 한 덩어리야. 기·픈은 깊 + 은이니 한 낱말이고, 그 뒤에서 끊어.',
        { 'O-s4-YB2a': [1, 3] }
      ],
      explain: '원본에는 띄어쓰기가 없어서 읽는 사람이 낱말 경계를 찾아 끊어 읽었다. 끊어 보면 같은 깊다가 기·픈(깊 + 은, 받침을 다음 글자 첫소리로 넘겨 적음)과 깊·고(받침 ㅍ을 그대로 둠)로 다르게 적힌 것이 보인다.'
    },
    {
      id: 's4.r1', kind: 'read', levels: ['h1', 'h23'],
      label: '이어 적기', ruleCard: 'rule.linkedWriting',
      sentence: '받침이 있는 말 뒤에 모음으로 시작하는 조사나 어미가 오면, {?}(깊 + 은 → 기·픈).',
      cards: [
        { id: 's4.r1.a', text: '받침을 다음 음절의 첫소리로 옮겨 소리 나는 대로 적었다', correct: true },
        { id: 's4.r1.b', text: '지금처럼 받침을 제자리에 두고 끊어 적었다', correct: false,
          why: '기·픈, ·므·른, 바·[ㄹㆍ]·래를 보면 받침이 뒤 음절로 넘어가 있다. 받침을 제자리에 두는 끊어 적기는 뒷날에야 널리 쓰였다.' },
        { id: 's4.r1.c', text: '맞춤법을 잘 몰라서 받침을 잘못 옮겨 적었다', correct: false, src: 'wrong.linkedIsMistake',
          why: '15세기에는 소리 나는 대로 적는 것이 표기 원리였다. 지금과 원리가 달랐을 뿐 잘못 적은 것이 아니다.' }
      ],
      explain: '15세기에는 받침 있는 말 뒤에 모음으로 시작하는 조사나 어미가 오면 받침을 다음 음절 첫소리로 옮겨 적었다(이어 적기). 기·픈은 깊 + 은, ·므·른은 믈 + 은이다. 소리 나는 대로 적는 것이 그때의 표기 원리였다.',
      hints: ['깊 + 은을 소리 내어 읽으면 어떻게 들릴까? 인쇄소 사람들은 들리는 대로 찍었어.', 's4.c2'],
      misread: {
        's4.r1.b': [
          { who: 'me', text: '깊은이라고 적힌 데가 없으니까, 기·픈은 깊다와 다른 말이겠네요. 기픈이라는 나무 이름인가 봐요.' },
          { who: 'commoner_woman', text: '기픈 나무요? 그런 나무는 처음 들어요. 뿌리가 깊다는 말 아니에요?', cg: 'mis_woman_flustered' },
          { who: 'artisan', text: '우리는 들리는 대로 찍었소. 깊 뒤에 은이 오면 소리 나는 대로 기·픈이지. 받침이 뒤로 넘어간 거요.' }
        ],
        's4.r1.c': [
          { who: 'me', text: '장인어른, 받침을 잘못 옮겨 찍으셨네요. 고쳐 찍으셔야겠어요.' },
          { who: 'artisan', text: '잘못이라니! 이 책 전체가 소리 나는 대로 적는 법을 따랐소. ·므·른도 바·[ㄹㆍ]·래도 다 그렇게 찍었는데, 그걸 몽땅 고치란 말이오?', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '그때는 받침을 다음 음절로 넘겨 적는 게 원리였어. 틀린 게 아니라 지금과 방법이 다른 거야.' }
        ]
      }
    },
    {
      id: 's4.r2', kind: 'read', levels: ['h1', 'h23'],
      label: '8종성법과 예외', ruleCard: 'rule.eightFinals',
      sentence: '받침에는 대체로 ㄱ ㆁ ㄷ ㄴ ㅂ ㅁ ㅅ ㄹ 여덟 글자만 썼다. 그런데 깊·고, 높·고에서 받침 ㅍ을 그대로 둔 것은 {?}.',
      cards: [
        { id: 's4.r2.a', text: '원래 받침을 살려 적은 예외 표기다', correct: true },
        { id: 's4.r2.b', text: '8종성법을 몰라서 틀리게 적은 것이다', correct: false, src: 'wrong.gipgoError',
          why: '「용비어천가」가 원래 받침을 살려 적은 예외 표기로 본다. 받침을 몰라서 틀린 것이 아니다.' },
        { id: 's4.r2.c', text: '받침에는 어떤 자음이든 마음대로 쓸 수 있었다는 증거다', correct: false,
          why: '받침은 대부분 여덟 글자 안에서 썼다. 깊·고, 높·고처럼 원래 받침을 살린 곳은 드물게 보이는 예외다.' }
      ],
      explain: '15세기에는 받침에 ㄱ ㆁ ㄷ ㄴ ㅂ ㅁ ㅅ ㄹ 여덟 글자만 쓰는 것이 원칙이었다(8종성법). 그런데 「용비어천가」의 깊·고, 높·고는 받침 ㅍ을 그대로 살려 적었다. 원칙을 몰라서가 아니라 원래 받침을 살린 예외 표기로 본다.',
      hints: ['여덟 글자 원칙대로라면 받침 ㅍ은 어떤 글자로 적었을까? 이 책은 왜 ㅍ을 그대로 두었을까?', 's4.c4'],
      misread: {
        's4.r2.b': [
          { who: 'me', text: '깊고, 높고는 오자네요. 받침은 여덟 글자만 쓴다면서요.' },
          { who: 'artisan', text: '오자라니, 내가 활자를 잘못 골랐다는 말이오? 원칙을 몰라서가 아니오.', cg: 'mis_official_confused' },
          { who: 'senior', text: '이 책은 깊·고, 높·고처럼 원래 받침을 살려 적은 데가 있어. 일부러 살린 예외로 봐.' }
        ],
        's4.r2.c': [
          { who: 'me', text: '그럼 받침에는 아무 자음이나 써도 됐던 거네요!' },
          { who: 'senior', text: '그랬다면 다른 장에도 온갖 받침이 다 보여야 하지 않을까? 대부분은 여덟 글자 안에서 썼어.', expr: 'thinking' },
          { who: 'commoner_man', text: '나도 받침 여덟 개만 겨우 외웠는데, 아무거나 된다니 헷갈리오.', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '깊·고, 높·고는 드물게 원래 받침을 살린 예외야. 원칙은 여덟 글자였어.' }
        ]
      }
    },
    {
      id: 's4.r3', kind: 'read', levels: ['h1', 'h23'],
      label: '방점', ruleCard: 'rule.bangjeom',
      sentence: '글자 왼쪽에 찍은 점은 소리의 {?}를 나타냈다. 점이 없으면 평성, 하나면 거성, 둘이면 상성이다.',
      cards: [
        { id: 's4.r3.a', text: '높낮이(성조)', correct: true },
        { id: 's4.r3.b', text: '세기(크고 작음)', correct: false, src: 'wrong.bangjeomStress',
          why: '해례는 점의 개수로 평성, 거성, 상성을 가른다고 밝힌다. 방점은 소리의 세기가 아니라 높낮이(성조)를 나타낸다.' },
        { id: 's4.r3.c', text: '길이(길고 짧음)', correct: false, src: 'wrong.bangjeomStress',
          why: '평성, 거성, 상성은 소리의 높낮이를 가르는 이름이다. 방점은 소리의 길이를 적으려고 찍은 점이 아니다.' }
      ],
      explain: '방점은 글자 왼쪽에 찍어 소리의 높낮이(성조)를 나타낸 점이다. 점이 없으면 평성, 하나면 거성, 둘이면 상성이다. 정확히 얼마나 높고 낮았는지는 학자마다 설명이 달라 채점하지 않는다.',
      hints: ['해례는 점의 개수로 평성, 거성, 상성을 갈랐어. 이 이름들은 소리의 무엇을 가리킬까?', 's4.c6'],
      misread: {
        's4.r3.b': [
          { who: 'me', text: '점 찍힌 글자는 세게 읽으면 돼요. 점이 둘이면 더 세게요!' },
          { who: 'commoner_man', text: '아·니! :뮐! …목만 아프오. 소리만 커지고 노래가 되질 않는데?', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '점은 세기가 아니야. 소리를 높게 내느냐 낮게 내느냐, 높낮이를 적은 거지.' }
        ],
        's4.r3.c': [
          { who: 'me', text: '점 찍힌 글자는 길게 끌어 읽는 거예요. 아아아니이…' },
          { who: 'commoner_woman', text: '그렇게 늘이니 숨이 차요. 노래가 아니라 하품 같네요.', cg: 'mis_woman_flustered' },
          { who: 'senior', text: '평성, 거성, 상성은 길이가 아니라 소리의 높낮이를 가르는 이름이야.' }
        ]
      }
    },
    {
      id: 's4.r4', kind: 'read', levels: ['h1', 'h23'],
      label: '띄어쓰기 없음', ruleCard: 'rule.noSpacing',
      sentence: '15세기 문헌은 {?}.',
      cards: [
        { id: 's4.r4.a', text: '낱말 사이를 띄지 않고 이어서 적었다', correct: true },
        { id: 's4.r4.b', text: '지금처럼 낱말마다 띄어 적었다', correct: false,
          why: '책이나 수첩에 옮긴 原文의 빈칸은 읽기 쉽게 뒷사람이 넣은 것이다. 원본에는 빈칸이 없다.' },
        { id: 's4.r4.c', text: '띄어쓰기 대신 낱말 사이에 점을 찍었다', correct: false,
          why: '점은 낱말 경계와 상관없이 글자마다 찍혀 있다(한 낱말 아·니 안에도 있다). 소리의 높낮이를 적은 방점이다.' }
      ],
      explain: '15세기 문헌은 낱말 사이를 띄지 않고 죽 이어서 적었다. 읽는 사람이 낱말 경계를 찾아 끊어 읽어야 했다. 수첩과 原文 창의 빈칸은 읽기 쉽게 넣은 것이다.',
      hints: ['장인이 판을 짤 때 글자 사이에 빈자리를 남겼을까?', 's4.c5'],
      misread: {
        's4.r4.b': [
          { who: 'me', text: '수첩에 띄어 쓴 대로 끊어 읽으면 돼요. 원래 책도 이렇게 띄어 썼을 테니까요.' },
          { who: 'artisan', text: '띄어 쓰다니? 나는 판을 짤 때 활자를 빈틈없이 붙여 박았소. 빈칸은 하나도 없소.', cg: 'mis_official_confused' },
          { who: 'senior', text: '수첩의 빈칸은 우리가 읽기 쉽게 넣은 거야. 원래 책은 낱말을 띄지 않고 이어서 찍혀 있어.' }
        ],
        's4.r4.c': [
          { who: 'me', text: '점 있는 데가 띄어 쓴 자리예요. 점마다 끊어 읽으세요.' },
          { who: 'commoner_man', text: '아, 니, 뮐… 한 낱말 안에도 점이 있는데 다 끊으니 말이 토막 나오.', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '점은 띄어쓰기 표시가 아니야. 그때 책은 낱말을 띄지 않고 이어서 적었어. 끊는 자리는 읽는 사람이 찾아야 해.' }
        ]
      }
    },
    {
      id: 's4.r5', kind: 'read', levels: ['h23'],
      label: '모음 조화', ruleCard: 'rule.vowelHarmony',
      sentence: '·므·른과 ·[ㄱㆍ][ㅁㆍ]·래, 남·[ㄱㆍㄴ]과 [ㅂㆍ][ㄹㆍ]·매를 견주면, 조사는 {?}.',
      cards: [
        { id: 's4.r5.a', text: '앞말의 모음에 맞추어, 양성 모음 뒤에는 [ㅇㆍㄴ], 애를, 음성 모음 뒤에는 은, 에를 골라 썼다', correct: true },
        { id: 's4.r5.b', text: '같은 조사를 두 가지 모양으로 아무렇게나 섞어 썼다', correct: false,
          why: '·므·른은 ㅡ(음성 모음) 뒤라 은, ·[ㄱㆍ][ㅁㆍ]·래는 ㆍ(양성 모음) 뒤라 애가 왔다. 모양이 앞말의 모음을 따른다.' },
        { id: 's4.r5.c', text: '앞말에 받침이 있는지 없는지에 따라 골라 썼다', correct: false,
          why: '남·[ㄱㆍㄴ]과 ·므·른은 둘 다 받침 있는 말 뒤인데 조사 모양이 [ㅇㆍㄴ]과 은으로 다르다. 가른 것은 받침이 아니라 앞말의 모음이다.' }
      ],
      explain: '15세기에는 양성 모음(ㆍ ㅗ ㅏ)은 양성 모음끼리, 음성 모음(ㅡ ㅜ ㅓ)은 음성 모음끼리 어울렸다(모음 조화). 그래서 조사도 앞말의 모음에 맞추어 [ㅇㆍㄴ]과 은, 애와 에 가운데에서 골라 썼다. ·므·른은 믈 + 은, ·[ㄱㆍ][ㅁㆍ]·래는 [ㄱㆍ][ㅁㆍㄹ] + 애다.',
      hints: ['·므·른의 ㅡ와 ·[ㄱㆍ][ㅁㆍ]·래의 ㆍ, 두 모음의 성질을 견주어 봐.', 's4.c2'],
      misread: {
        's4.r5.b': [
          { who: 'me', text: '[ㅇㆍㄴ]이든 은이든 그냥 아무거나 쓴 거네요.' },
          { who: 'artisan', text: '아무거나였으면 활자를 두 가지나 따로 깎아 둘 까닭이 없지 않소?', cg: 'mis_official_confused' },
          { who: 'senior', text: '·므·른은 ㅡ 뒤라 은, ·[ㄱㆍ][ㅁㆍ]·래는 ㆍ 뒤라 애야. 앞말의 모음을 따라 고른 거지.' }
        ],
        's4.r5.c': [
          { who: 'me', text: '받침이 있으면 이쪽, 없으면 저쪽을 쓴 거예요. 지금 은, 는처럼요.' },
          { who: 'commoner_man', text: '남·[ㄱㆍㄴ]도 ·므·른도 받침 뒤인데 모양이 다르잖소. 그 셈은 안 맞는데?', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '받침이 아니라 앞말의 모음이 갈랐어. 양성은 양성끼리, 음성은 음성끼리 어울렸지.' }
        ]
      }
    }
  ],

  npcs: {
    's4.listeners': {
      name: '책을 기다리는 아낙',
      lines: [
        { who: 'commoner_woman', text: '다 읽을 수 있게 되면 문 앞으로 와 주세요. 다들 기다리고 있어요.' }
      ]
    }
  },

  notes: [
    { id: 's4.n1', kind: 'know', title: '「용비어천가」', text: '1445년에 지어 1447년(세종 29)에 펴낸 노래다. 새 글자로 우리말을 적은 이른 시기의 책 가운데 하나다.', src: '리서치 10 §3 방침 7', at: ['s4.c1'] },
    { id: 's4.n2', kind: 'know', title: '빈칸은 뒷사람이 넣은 것', text: '原文 창에 보이는 빈칸은 읽기 쉽게 통용 띄어쓰기(교과서 풀이 기준)를 넣은 것이다. 원본에는 띄어쓰기가 없다.', src: '리서치 10 §1 데이터 표기', at: ['s4.c3', 's4.c5'] },
    { id: 's4.n3', kind: 'interp', title: '음높이의 정확한 값', text: '방점이 나타낸 높낮이가 정확히 얼마였는지는 학자마다 설명이 다르다. 끊어 읽기의 음높이 막대는 어림으로 그린 것이다.', src: '리서치 10 §8', at: ['s4.c6'] },
    { id: 's4.n4', kind: 'interp', title: '곶의 받침', text: '제2장의 곶(꽃)도 받침 ㅈ을 그대로 적었다. 깊·고, 높·고와 같은 결의 표기로 볼 수 있지만, 교과서는 이 낱말을 예로 들지 않는다.', src: '리서치 10 §8', at: ['s4.c1'] },
    { id: 's4.n5', kind: 'know', title: '지금 쓰지 않는 글자', text: '이 장들에는 지금 쓰지 않는 글자가 보인다. ㆍ는 ·[ㄱㆍ][ㅁㆍ]·래, ㆁ은 끝의 [ㆁㅣ]·다, ㅸ은 :도·[ㅸㆍ]실·[ㅆㆎ]에 있다.', src: '리서치 10 §4 (O-s4-YB2b, O-s4-YB34a, O-s4-YB34b 드러나는 항목)', at: ['s4.c2', 's4.c4'] }
  ],

  translate: {
    id: 's4.x1',
    text: '뿌리가 깊이 박힌 나무는 바람이 불어도 흔들리지 않아, 꽃이 탐스럽고 열매가 많이 열린다.',
    at: 's4.listeners',
    lines: [
      { who: 'narrator', text: '문 앞에 사람들이 모여 앉는다. <@이> 제2장 앞쪽을 펴 든다.', cg: 's4_climax' },
      { who: 'me', text: '불·휘에서 한 번, 기·픈에서 한 번 끊어요. 기·픈은 깊 + 은, 소리 나는 대로 적은 말이에요.' },
      { who: 'me', text: '점이 찍힌 글자는 소리를 높이고, 점이 없는 글자는 낮게 내요. 자, 같이 읽어 봐요.' },
      { who: 'me', text: '뿌리가 깊이 박힌 나무는 바람이 불어도 흔들리지 않아, 꽃이 탐스럽고 열매가 많이 열린다는 노래예요.' },
      { who: 'senior', text: '여·름은 계절이 아니라 열매, ·하[ㄴㆍ]·니는 많다는 말이야. 이건 장터에 가면 더 자세히 배울 거야.', expr: 'smile' },
      { who: 'commoner_woman', text: '끊을 데를 알고 나니 노랫말이 귀에 쏙 들어오네요!', expr: 'smile' },
      { who: 'commoner_man', text: '점 하나에 소리가 올라가고 내려가고… 이제 좀 노래 같소.' },
      { who: 'artisan', text: '찍은 보람이 있구려. 통사 양반, 다음 장도 부탁하오.' },
      { who: 'senior', text: '소리 나는 대로 적고, 띄어 쓰지 않고, 점으로 높낮이를 적었다. 그걸 알면 이 책이 읽혀.' }
    ]
  }
};
