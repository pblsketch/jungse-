'use strict';
/*
 * 장면 7 「높이는 말」 (궁·절, 고2~3 전용). 장면 데이터 모양: js/data/scenes/README.md
 * - 고2~3 전용 장면이라 누가 들어가도 h23 범위를 쓴다(js/data/rules-config.js SCOPE_RULES.h23Only) → 항목 levels 는 ['h23'].
 * - 원문은 블록 id 로만 가리킨다(NM.data.ORIG). 原文 글자를 여기 옮겨 적지 않는다.
 * - 기믹 honorScale(js/gimmicks/README-honorScale.md) 과제 둘 + 규칙 항목 셋(주체·객체·상대 높임).
 * - 객체 높임 세 형태(-[ㅅㆍㅂ]- -[ㅈㆍㅂ]- -[ㅿㆍㅂ]-)가 앞소리에 따라 갈리는 조건은 리서치 문서에서 확인하지 못했다
 *   (02 문서 '검증 필요'). 그래서 조건을 적지 않고, 활자 자리마다 객체 높임 활자는 정답 형태 하나만 쟁반에 둔다
 *   (choices) — 과제는 '어느 자리를 높이나(주체·객체·상대)'와 -시-/-샤- 구별만 판정한다.
 * - 인물 패의 '말하는 이·듣는 이' 이름은 리서치 문서에 구절별로 적혀 있지 않아 장면 설정으로 정했다(fiction.s7roles).
 *   판정은 높이는 자리(honored)만 본다. 높이는 대상(부처, 羅雲, 大耳兒, 普光佛)은 리서치 10 §4 에 적힌 것만 썼다.
 * - 맵 maps/s7.json: 인물 official(→ s7.c1) messenger(→ s7.c2) scholar(→ s7.c3) monk(→ s7.c4), 조사 지점 s7.c5(종각 앞).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s7'] = {
  id: 's7',
  title: '높이는 말',
  era: '15세기 · 궁과 절',
  mapKey: 's7',
  bgmKey: 'bgm_s7',
  carveGlyph: 'ㆁ',

  cast: {
    official: { name: '궁의 관원', portrait: 'official' },
    monk: { name: '스님', portrait: 'monk' },
    messenger: { name: '전령', portrait: 'commoner_man' },
    scholar: { name: '다리 끝의 선비', portrait: 'yangban_man' }
  },

  fiction: [
    { id: 'fiction.tongsa', text: '정음 통사 — 새 글자와 사람들의 말 사이를 잇는 통역관',
      real: '정음 통사라는 직책은 없었어요. 이 게임에서 만든 역할이에요.' },
    { id: 'fiction.s7roles', text: "높임 저울의 인물 패 이름('노래를 지은 이', '노래를 듣는 이' 등)",
      real: '구절마다 말하는 이와 듣는 이가 정확히 누구인지는 이 게임의 원문 조사에서 따로 확인하지 않았어요. 인물 이름은 이해를 돕는 설정이고, 판정은 높이는 자리(주체, 객체, 상대)만 봐요.' }
  ],

  intro: [
    { who: 'narrator', cg: 's7_intro', text: '궁의 돌계단. 관원과 스님, 짐을 진 전령이 저마다 허리를 굽혀 인사한다.' },
    { who: 'messenger', text: '아이고, 통사님. 궁에서 들은 말을 절에 옮기고, 절에서 들은 말을 궁에 옮기는 게 제 일인데요. 높이는 말을 잘못 옮겼다가 양쪽에서 혼쭐이 났습니다.' },
    { who: 'senior', text: '이 시대 말에는 누구를 높이느냐에 따라 낱말 속에 끼우는 작은 조각이 따로 있었어. 어간과 맨 끝 어미 사이에 들어가는 조각, 선어말 어미야.' },
    { who: 'me', text: "높임이면 '-시-' 하나 아닌가요?" },
    { who: 'senior', expr: 'smile', text: '이 시대 책을 보면 조각이 여러 가지야. 말 사이를 잇는 정음 통사라면 이 조각들을 가려 들어야 해.', fiction: 'fiction.tongsa' }
  ],

  request: [
    { who: 'official', text: '통사, 궁과 절 사이를 오가는 글을 예법에 맞게 옮겨 주게. 이 글이 누구를 높이는지 하나라도 어긋나면 큰 결례일세.' },
    { who: 'monk', text: '절에서 읽는 책에도 높이는 말이 가득합니다. 누가 누구를 높이는지 가려 주십시오.' }
  ],

  encounter: {
    orig: ['O-s4-YB34a'],
    lines: [
      { who: 'official', text: '궁에서 읽는 「용비어천가」의 한 장일세. 맨 끝 낱말이 길게 늘어지지?' },
      { who: 'senior', text: '그 낱말 하나에 조각이 둘이나 들어 있어. 하나씩 떼어 보자.' }
    ]
  },

  example: {
    orig: ['O-s7-WS1c'],
    lines: [
      { who: 'senior', text: "먼저 내가 하나 풀어 볼게. **드르·시·고** — '듣다'에 '-시-'가 끼어 있어." },
      { who: 'senior', text: '이 문장에서 듣는 사람은 {善|선}{慧|혜}야. 문장의 주어지. 그러니 이 \'-시-\'는 주어인 {善|선}{慧|혜}를 높인 거야.' },
      { who: 'senior', expr: 'thinking', text: '이렇게 먼저 조각을 떼어 내고, 그 조각이 문장의 누구를 높이는지 따져 봐. 높이는 자리는 주어 말고도 있어. 궁과 절을 오가며 사례를 모아 보자.' }
    ]
  },

  contexts: [
    {
      id: 's7.c1', label: '궁의 관원',
      orig: ['O-s4-YB34a', 'O-s4-YB34b'],
      lines: [
        { who: 'official', text: "제34장은 앞절과 뒷절이 짝을 이루네. 두 절 모두 끝이 '-시니[ㆁㅣ]다'로 끝나지." },
        { who: 'senior', text: "':건·너시·니[ㆁㅣ]·다'에서 '-시-' 바로 뒤에는 '-니'가 와. 뒤에 무엇이 오는지 기억해 둬." },
        { who: 'senior', expr: 'thinking', text: "그런데 '[ㆁㅣ]'는 강을 건넌 분을 한 번 더 높이는 걸까, 아니면 다른 누구를 향한 걸까?" }
      ],
      items: ['s7.r1', 's7.r3']
    },
    {
      id: 's7.c2', label: '전령이 품은 두루마리',
      orig: ['O-s7-YB29', 'O-s7-YB63'],
      lines: [
        { who: 'messenger', text: "궁에서 받아 온 노래 두루마리입니다. 글을 다 읽지는 못하지만, 끝이 '[ㆁㅣ]·다'로 끝나는 줄은 어쩐지 공손하게 들립니다." },
        { who: 'senior', text: "첫 줄을 봐. '{大|대}{耳|이}{兒|아}' 뒤에는 목적어 끈이 붙었고, 돕는 쪽은 '{臥|와}{龍|룡}'이야. 그럼 ':돕·[ㅅㆍ][ㅸㆍ]·니'의 조각은 누구를 높일까?" }
      ],
      items: ['s7.r2', 's7.r3']
    },
    {
      id: 's7.c3', label: '다리 끝의 선비',
      orig: ['O-s7-WS1c', 'O-s7-WS1e', 'O-s7-WS1i'],
      lines: [
        { who: 'scholar', text: "『월인석보』를 읽던 참이오. 같은 이야기 안에서 '드르·시·고'도 나오고 '니[ㄹㆍ]·샤·[ㄷㆎ]'도 나오니 헷갈리는구려." },
        { who: 'senior', text: "'-시-'와 '-샤-'가 갈린 곳 바로 뒤를 견주어 봐. 높이는 사람 때문일까, 뒤에 오는 말 때문일까?" }
      ],
      items: ['s7.r1']
    },
    {
      id: 's7.c4', label: '절 마당의 스님',
      orig: ['O-s7-SS6b', 'O-s7-SS6c'],
      lines: [
        { who: 'monk', text: '『석보상절』의 한 대목입니다. 부처님께서 {羅|라}{雲|운}에게 여러 번 이르셨지만, {羅|라}{雲|운}은 좀처럼 따르지 않았지요.' },
        { who: 'senior', text: "'{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디'에서 따르는 쪽은 {羅|라}{雲|운}이야. 그런데 끼어 있는 조각이 {羅|라}{雲|운}을 높인 걸까?" }
      ],
      items: ['s7.r1', 's7.r2']
    },
    {
      id: 's7.c5', label: '종각 앞 경상',
      orig: ['O-s7-WS1a', 'O-s7-WS1j'],
      lines: [
        { who: 'narrator', text: '종각 앞 경상 위에 『월인석보』 첫째 권이 펼쳐져 있다.' },
        { who: 'senior', text: "{王|왕}이 {普|보}{光|광}{佛|불}을 청하는 대목이야. '{請|:[ㅊㅓㆁ]}·[ㅎㆍ][ㅿㆍ]·[ㅸㅏ]'의 조각이 높이는 쪽은 청하는 {王|왕}일까, 청함을 받는 {普|보}{光|광}{佛|불}일까?" },
        { who: 'senior', text: "아래 줄의 '부텻·긔 받[ㅈㆍ]·[ㅸㆍㅭ]'에도 같은 무리의 조각이 들어 있어. 모양은 조금 달라도 하는 일은 같아." }
      ],
      items: ['s7.r2']
    }
  ],

  items: [
    {
      id: 's7.r1', kind: 'read', levels: ['h23'], label: '주체 높임 -시-, -샤-',
      ruleCard: 'rule.subjHon',
      sentence: "주어를 높이는 '-시-'는 {?} 앞에서 '-샤-'로 나타났다(니[ㄹㆍ]·샤·[ㄷㆎ]).",
      cards: [
        { id: 's7.r1.a', text: "'-아/-어'나 '-오-'로 시작하는 어미", correct: true, why: '' },
        { id: 's7.r1.b', text: "'-고', '-니'처럼 자음으로 시작하는 어미", correct: false, src: 'rule.subjHon (화법과 언어 205쪽), 리서치 10 §4 O-s7-WS1c·O-s4-YB34a',
          why: "자음으로 시작하는 어미 앞에서는 '-시-'가 그대로다(드르·시·고, :건·너시·니[ㆁㅣ]·다)." },
        { id: 's7.r1.c', text: '부처처럼 더 높은 분을 높일 때', correct: false, src: '리서치 10 §4 O-s7-WS1i, rule.subjHon (화법과 언어 205쪽)',
          why: "높이는 정도로 갈린 것이 아니다. 『월인석보』에서는 {俱|구}{夷|이}가 말할 때도 '니[ㄹㆍ]·샤·[ㄷㆎ]'를 썼다. 바로 뒤에 오는 어미가 모양을 정했다." }
      ],
      explain: "'-시-'는 문장의 주어를 높인다. 뒤에 '-아/-어'나 '-오-'로 시작하는 어미가 오면 '-샤-'로 나타나, 니[ㄹㆍ]·샤·[ㄷㆎ], :겨샤·[ㄷㆎ], 니[ㄹㆍ]·샤·도처럼 쓰였다. 드르·시·고, :건·너시·니[ㆁㅣ]·다처럼 자음으로 시작하는 어미 앞에서는 '-시-' 그대로다.",
      hints: ["다리 끝 선비가 든 책에서 '-시-'와 '-샤-' 바로 뒤에 무엇이 오는지 견주어 봐.", 's7.c3'],
      misread: {
        's7.r1.b': [
          { who: 'scholar', cg: 'mis_yangban_offended', text: "자음 앞에서 '-샤-'라니, 그럼 내 책의 '드르·시·고'는 무엇이란 말이오?" },
          { who: 'senior', text: "선비님 말씀이 맞습니다. 자음으로 시작하는 어미 앞에서는 '-시-'가 그대로 남았어요." }
        ],
        's7.r1.c': [
          { who: 'monk', cg: 'mis_monk_bemused', text: "더 높은 분에게만 '-샤-'를 쓴다면, {俱|구}{夷|이}의 말에 붙은 '-샤-'는 어찌 된 일이겠습니까?" },
          { who: 'senior', text: '높이는 정도가 아니라 뒤에 오는 말을 봐야겠네요.' }
        ]
      }
    },
    {
      id: 's7.r2', kind: 'read', levels: ['h23'], label: '객체 높임',
      ruleCard: 'rule.objHon',
      sentence: "'-[ㅅㆍㅂ]-', '-[ㅈㆍㅂ]-', '-[ㅿㆍㅂ]-'은 {?}을 높였다.",
      cards: [
        { id: 's7.r2.a', text: '목적어나 부사어가 가리키는 대상', correct: true, why: '' },
        { id: 's7.r2.b', text: '문장의 주어', correct: false, src: 'wrong.objHonSubject',
          why: "객체 높임은 목적어나 부사어가 가리키는 대상을 높인다. '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디'에서 높이는 대상은 부처이고, 주어는 {羅|라}{雲|운}이다." },
        { id: 's7.r2.c', text: '말을 듣는 사람', correct: false, src: 'wrong.honorOnlySi (리서치 10 §10 10번)',
          why: "듣는 사람을 높이는 것은 '-[ㆁㅣ]-'다. '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디', ':돕·[ㅅㆍ][ㅸㆍ]·니'의 조각은 문장 안의 대상(부처, {大|대}{耳|이}{兒|아})을 높인다." }
      ],
      explain: "객체 높임은 목적어나 부사어가 가리키는 대상을 높인다. '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디'에서 따르는 쪽은 {羅|라}{雲|운}이지만 높임을 받는 쪽은 따름을 받는 부처다. ':돕·[ㅅㆍ][ㅸㆍ]·니'도 돕는 {臥|와}{龍|룡}이 아니라 도움을 받는 {大|대}{耳|이}{兒|아}를 높였다. 세 조각은 같은 일을 하고, 앞 소리에 따라 모양만 다르다.",
      hints: ['스님이 읽어 준 대목에서 따르는 사람과 따름을 받는 분을 나눠 봐. 조각은 어느 쪽을 높이고 있지?', 's7.c4'],
      misread: {
        's7.r2.b': [
          { who: 'monk', cg: 'mis_monk_bemused', text: '그렇다면 이 책이 말을 듣지 않는 {羅|라}{雲|운}을 높였다는 말씀입니까? 따르지 않은 쪽은 {羅|라}{雲|운}인데요.' },
          { who: 'senior', text: '따르는 쪽 말고, 따름을 받는 쪽을 다시 볼게요.' }
        ],
        's7.r2.c': [
          { who: 'official', cg: 'mis_official_confused', text: "듣는 이를 높이는 조각이라면 '[ㆁㅣ]'와 무엇이 다르단 말인가?" },
          { who: 'senior', text: "듣는 이를 높이는 건 '[ㆁㅣ]'의 몫입니다. 이 조각은 문장 안의 누군가를 향해 있어요." }
        ]
      }
    },
    {
      id: 's7.r3', kind: 'read', levels: ['h23'], label: '상대 높임 -[ㆁㅣ]-',
      ruleCard: 'rule.addrHon',
      sentence: "':건·너시·니[ㆁㅣ]·다'의 '[ㆁㅣ]'는 {?}.",
      cards: [
        { id: 's7.r3.a', text: '말을 듣는 사람을 높이는 상대 높임 선어말 어미다', correct: true, why: '' },
        { id: 's7.r3.b', text: "체언 뒤에 붙는 서술격 조사 '이'다", correct: false, src: 'wrong.ingiCopula',
          why: "'-[ㆁㅣ]-'는 듣는 사람을 높이는 상대 높임 선어말 어미다. 체언 뒤에 붙는 서술격 조사와 달리 용언의 어미 자리에 들어간다." },
        { id: 's7.r3.c', text: '강을 건넌 분(주어)을 한 번 더 높이는 어미다', correct: false, src: '리서치 10 §10 10번, 12번',
          why: "주어를 높이는 일은 이미 '-시-'가 맡았다. '[ㆁㅣ]'는 문장 밖에서 이 말을 듣는 사람을 향한다." }
      ],
      explain: "'-[ㆁㅣ]-'는 말을 듣는 사람을 높이는 상대 높임 선어말 어미로, 하쇼셔체에 쓰였다. ':건·너시·니[ㆁㅣ]·다'에는 주어를 높이는 '-시-'와 듣는 사람을 높이는 '-[ㆁㅣ]-'가 함께 들어 있다.",
      hints: ["전령의 두루마리에 있는 '받[ㅈㆍ]·[ㅸㆍ]·니[ㆁㅣ]·다'도 끝이 같아. 이 조각이 문장 안의 사람을 높이는지, 이 말을 듣는 사람을 높이는지 생각해 봐.", 's7.c2'],
      misread: {
        's7.r3.b': [
          { who: 'official', cg: 'mis_official_confused', text: "서술격 조사라면 앞에 체언이 있어야 할 텐데, 바로 앞은 '-니'가 아닌가?" },
          { who: 'senior', text: '맞습니다. 용언의 어미 자리에 끼어 있는 조각이에요.' }
        ],
        's7.r3.c': [
          { who: 'messenger', cg: 'mis_commoner_puzzled', text: "강을 건너신 분은 이미 '-시-'로 높이셨잖습니까? 한 사람을 두 번이나 높이나요?" },
          { who: 'senior', text: "좋은 지적이에요. '[ㆁㅣ]'는 다른 사람을 향해 있어요." }
        ]
      }
    },
    {
      id: 's7.t1', kind: 'task', levels: ['h23'], label: '『석보상절』 활자 끼우기',
      prompt: '누가 누구를 높이는지 보고, 빈 활자 자리에 알맞은 선어말 어미 활자를 끼우세요.',
      gimmick: 'honorScale',
      config: {
        cast: {
          writer: { name: '이 책을 엮은 이' },
          buddha: { name: '부처' },
          rahula: { name: '{羅|라}{雲|운}' }
        },
        choices: ['si', 'sya', 'zab', 'ii'],
        slots: [
          { id: 'a', block: 'O-s7-SS6b', word: [4, 8], slot: [6, 7],
            roles: { speaker: 'writer', subject: 'buddha' } },
          { id: 'b', block: 'O-s7-SS6b', word: [8, 12], slot: [10, 11],
            roles: { speaker: 'writer', subject: 'rahula', object: 'buddha' } }
        ]
      },
      answer: {
        a: { honored: 'subject', ending: 'sya' },
        b: { honored: 'object', ending: 'zab' }
      },
      hints: ['따르지 않은 쪽은 {羅|라}{雲|운}이지만, 따름을 받아야 할 분은 부처야. 두 번째 자리가 그분을 어느 자리에서 높이는지 생각해 봐.', { b: ['honored', 'ending'] }],
      explain: "첫 자리 '니[ㄹㆍ]·샤·도'는 주어인 부처를 높인 '-시-'가 뒤 어미와 어울려 '-샤-'로 나타난 것이다. 둘째 자리 '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디'는 주어가 {羅|라}{雲|운}이지만, 따름을 받는 부처를 높인 객체 높임 '-[ㅿㆍㅂ]-'이다."
    },
    {
      id: 's7.t2', kind: 'task', levels: ['h23'], label: '「용비어천가」 활자 끼우기',
      prompt: '한 낱말에 빈 활자 자리가 둘이에요. 자리마다 누구를 높이는지 고르고 활자를 끼우세요.',
      gimmick: 'honorScale',
      config: {
        cast: {
          poet: { name: '노래를 지은 이' },
          crosser: { name: '강을 건넌 분' },
          hearer: { name: '노래를 듣는 이' }
        },
        choices: ['si', 'sya', 'sab', 'ii'],
        slots: [
          { id: 'a', block: 'O-s4-YB34a', word: [19, 25], slot: [21, 22],
            roles: { speaker: 'poet', subject: 'crosser', listener: 'hearer' } },
          { id: 'b', block: 'O-s4-YB34a', word: [19, 25], slot: [23, 24],
            roles: { speaker: 'poet', subject: 'crosser', listener: 'hearer' } }
        ]
      },
      answer: {
        a: { honored: 'subject', ending: 'si' },
        b: { honored: 'listener', ending: 'ii' }
      },
      hints: ['한 낱말에 조각이 둘이야. 하나는 강을 건넌 분을, 다른 하나는 이 노래를 듣는 쪽을 향해.', { a: ['honored'], b: ['honored'] }],
      explain: "':건·너시·니[ㆁㅣ]·다'에는 조각이 둘 들어 있다. '-시-'는 강을 건넌 주어를 높이고, '-[ㆁㅣ]-'는 이 말을 듣는 사람을 높인다. 높이는 대상이 다르니 두 조각이 한 낱말에 함께 설 수 있다."
    }
  ],

  notes: [
    { id: 's7.know.objForms', kind: 'know', title: '객체 높임의 세 모양',
      text: "객체 높임 조각은 앞 소리에 따라 '-[ㅅㆍㅂ]-', '-[ㅈㆍㅂ]-', '-[ㅿㆍㅂ]-' 세 모양으로 나타났다.",
      src: '화법과 언어 205쪽 (리서치 10 §5, §10 10~11번)', at: ['s7.c2', 's7.c5'] }
  ],

  translate: {
    id: 's7.x1',
    text: '높이는 자리(주체, 객체, 상대)를 가려 예법에 맞게 옮긴 말',
    // 통역 고르기(js/ui/stage-translate.js): 전령의 부탁 한 줄 뒤에, 해독한 객체 높임(s7.r2)·상대 높임(s7.r3)으로
    // 절의 말과 궁의 노래에 든 조각이 누구를 높이는지 전령에게 일러 준다. 고2~3 전용 장면이라 누가 들어가도 두 항목이 핵심이다.
    // 고른 말은 바로 뒤 내 대사에 그대로 든다.
    chooseAt: 1,
    compose: '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디의 조각은 {?}, :건·너시·니[ㆁㅣ]·다의 [ㆁㅣ]는 {?} 높여요.',
    choose: [
      {
        id: 's7.i1', item: 's7.r2',
        prompt: "절의 책 '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디', 이 조각은 누구를 높인다고 전할까?",
        options: [
          { id: 's7.i1.a', text: '따름을 받으시는 부처', part: '따름을 받으시는 부처를', correct: true },
          { id: 's7.i1.b', text: '따르는 {羅|라}{雲|운}(문장의 주어)', part: '따르는 {羅|라}{雲|운}을', correct: false,
            reaction: [
              { who: 'me', text: '이 조각은 따르는 {羅|라}{雲|운}을 높여요.' },
              { who: 'monk', cg: 'mis_monk_bemused', text: '말씀을 따르지 않은 {羅|라}{雲|운}을 책이 높였다는 말씀입니까?' },
              { who: 'senior', text: '따르는 쪽 말고, 따름을 받는 쪽을 다시 봐.' }
            ] },
          { id: 's7.i1.c', text: '이 말을 듣는 사람', part: '이 말을 듣는 사람을', correct: false,
            reaction: [
              { who: 'me', text: '이 조각은 이 말을 듣는 사람을 높여요.' },
              { who: 'official', cg: 'mis_official_confused', text: "듣는 이를 높이는 조각이라면 '[ㆁㅣ]'와 무엇이 다르단 말인가?" },
              { who: 'senior', text: "듣는 이는 '[ㆁㅣ]'의 몫이야. 이 조각은 문장 안의 누군가를 향해 있어." }
            ] }
        ]
      },
      {
        id: 's7.i2', item: 's7.r3',
        prompt: "궁의 노래 ':건·너시·니[ㆁㅣ]·다', 그 '[ㆁㅣ]'는 누구를 높인다고 전할까?",
        options: [
          { id: 's7.i2.a', text: '이 노래를 듣는 이', part: '이 노래를 듣는 이를', correct: true },
          { id: 's7.i2.b', text: "강을 건너신 분을 한 번 더", part: '강을 건너신 분을 한 번 더', correct: false,
            reaction: [
              { who: 'me', text: "'[ㆁㅣ]'는 강을 건너신 분을 한 번 더 높여요." },
              { who: 'messenger', cg: 'mis_commoner_puzzled', text: "강을 건너신 분은 이미 '-시-'로 높이셨잖습니까? 한 분을 두 번이나 높이나요?" },
              { who: 'senior', text: "'[ㆁㅣ]'는 문장 밖을 향해 있어. 이 노래를 누가 듣는지 생각해 봐." }
            ] },
          { id: 's7.i2.c', text: '노래를 지은 이(말하는 사람) 자신', part: '노래를 지은 이 자신을', correct: false,
            reaction: [
              { who: 'me', text: "'[ㆁㅣ]'는 노래를 지은 이 자신을 높여요." },
              { who: 'official', cg: 'mis_official_confused', text: '노래를 지은 이가 제 노래에서 저를 높였다니, 그런 결례가 어디 있나?' },
              { who: 'senior', text: "말하는 이는 남을 높이지. '[ㆁㅣ]'는 이 말을 듣는 쪽을 향해 있어." }
            ] }
        ]
      }
    ],
    lines: [
      { who: 'messenger', text: '통사님, 절의 책과 궁의 노래에 든 조각이 저마다 누구를 높이는지 일러 주십시오. 이번엔 바로 옮기겠습니다.' },
      { who: 'me', text: '{從|[ㅉㅛㆁ]}·[ㅎㆍ][ㅿㆍㅂ]·디의 조각은 따름을 받으시는 부처를, :건·너시·니[ㆁㅣ]·다의 [ㆁㅣ]는 이 노래를 듣는 이를 높여요.' },
      { who: 'narrator', cg: 's7_climax', text: '전령이 옮긴 말을 듣고 관원과 스님이 함께 고개를 끄덕인다. 저울이 반듯하게 선다.' },
      { who: 'messenger', text: "이제 알겠습니다! 일을 하시는 분을 높일 땐 '-시-', 그 일을 받으시는 분을 높일 땐 '-[ㅅㆍㅂ]-' 무리, 제 말을 들으시는 분을 높일 땐 '-[ㆁㅣ]-'로군요." },
      { who: 'official', text: '그렇게만 옮기면 궁에서도 결례가 없겠네.' },
      { who: 'monk', text: '절에서도 높여야 할 분을 제자리에서 높이게 되었습니다.' },
      { who: 'senior', expr: 'smile', text: '<@이> 저울을 맞췄네. 누가 누구를 높이는지 보면 말이 제자리에 서.' }
    ]
  }
};
