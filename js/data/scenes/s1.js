'use strict';
/*
 * 스테이지 1 「빌려 쓴 글자」 (spec §7 스테이지 1, 고2~3 전용) — 고대 마을.
 * - 原文: 『삼국사기』 지명(O-s1-YEONGDONG 채점, O-s1-MILSEONG·O-s1-SUSEONG 은 교과서 밖 → 탐색·알아 두기),
 *   『삼국유사』 향찰(O-s1-SEODONG1, O-s1-CHEOYONG1). 리서치 11 §4-1 판정표·§9·§11 을 따른다.
 *   如 는 훈가자 → 과제가 끝난 뒤에만 보이는 알아 두기. 東京·良 → 해석(채점 안 함). SEODONG2(卯 판독 갈림)는 쓰지 않는다.
 * - 핵심(모두 h23 — 고2~3 전용 장면은 누가 들어가도 h23 범위): 기믹 과제 borrowSort 1개 + 규칙 해독 항목 2개.
 *   과제 안의 규칙 문장 완성은 수첩에 카드를 붙이지 않으므로(README-borrowSort), 규칙 카드는 해독 항목 r1·r2 가 붙인다.
 * - 선배 통사는 이 시대 맵에 없다. 통사 패 너머 목소리로만 말한다(선배의 풀이 예시 포함).
 * - 끝: 통역(모닥불 가) 뒤 전기 중세를 스쳐 1443년에 닿는 짧은 연결 장면(전기 중세는 스테이지가 아니다).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s1'] = {
  id: 's1',
  title: '빌려 쓴 글자',
  era: '고대',
  mapKey: 's1',
  reflection: {
    ask: '한자의 뜻이나 소리를 빌려 우리말을 적은 예 하나를 고르고, 어떻게 읽었는지 적어 보세요.',
    placeholder: '한자를 빌려 쓴 예와 읽는 방법'
  },
  bgmKey: 'bgm_s1',
  carveGlyph: '借',
  cast: {
    man: { name: '마을 남자', portrait: 'anc_man' },
    woman: { name: '마을 여인', portrait: 'anc_woman' },
    child: { name: '아이', portrait: 'anc_child' },
    scribe: { name: '서기', portrait: 'anc_scribe' }
  },

  fiction: [
    { id: 'tongsa',
      text: '정음 통사: 새 글자로 적은 글을 읽고, 그 뜻을 사람들에게 전해 주는 통역관',
      real: '이런 직책은 없었어요. 이 이야기를 위해 지어낸 역할이에요.' },
    { id: 's1.record',
      text: '마을 비석과 서기의 목간에 고을의 옛 이름과 새 이름이 적혀 있다.',
      real: '이 이름들은 비석이나 목간이 아니라, 고려 때(1145) 엮은 역사책 『삼국사기』의 지리지에 실려 전해요.' },
    { id: 's1.song',
      text: '한 마을에서 아이는 「서동요」를, 여인은 「처용가」를 부른다.',
      real: '두 노래는 고려 때(1281년 무렵) 엮은 『삼국유사』에 향찰로 적혀 전해요. 생겨난 때와 곳이 서로 달라서, 한 마을에서 함께 불렸다는 근거는 없어요.' }
  ],

  intro: [
    { who: 'narrator', text: '눈을 뜨니 초가와 돌담이 둘러선 마을이다. 마당 한가운데에 닳은 돌비석이 서 있다.', cg: 's1_intro' },
    { who: 'narrator', text: '사람들의 말은 알아듣겠는데, 익숙한 한글은 보이지 않는다. 비석과 기록에 적힌 글자는 모두 한자다.' },
    { who: 'senior', text: '들리느냐? 통사 패 너머로 목소리만 겨우 닿는구나. 여기는 훈민정음이 만들어지기 전 시대다.' },
    { who: 'senior', expr: 'thinking', text: '이곳 사람들은 한자의 뜻이나 소리를 빌려 우리말을 적는다. 정음 통사라면 그 표기부터 읽을 줄 알아야지.', fiction: 'tongsa' }
  ],

  request: [
    { who: 'man', text: '낯선 손님이구려. 관에서 비석에 우리 고을 이름을 새겼다는데, 우리가 부르던 그 고을이 맞는지 모르겠소.' },
    { who: 'woman', text: '아이들이 부르는 노래도 한자로 적어 두었대요. 그런데 어느 글자가 뜻이고 어느 글자가 소리인지 아무도 몰라요.' },
    { who: 'man', text: '비석과 노래를 읽어 주시오.' }
  ],

  encounter: {
    orig: ['O-s1-YEONGDONG', 'O-s1-SEODONG1'],
    lines: [
      { who: 'narrator', text: '비석은 한문이지만 고을 이름 둘이 나란히 적혀 있다.', fiction: 's1.record' },
      { who: 'narrator', text: '노래 구절은 한문으로 읽으면 뜻이 통하지 않는다. 한자로 우리말을 적은 향찰이다.', fiction: 's1.song' }
    ]
  },

  example: {
    orig: ['O-s1-YEONGDONG'],
    lines: [
      { who: 'senior', text: '고을 이름부터 보자. 앞의 이름 永同 과 뒤의 이름 吉同 은 같은 고을이다. 다른 글자는 맨 앞 하나뿐이지.' },
      { who: 'senior', expr: 'thinking', text: '永 은 길 영 이다. 오래간다는 뜻의 우리말 길- 을 적으려고 이 글자의 뜻을 빌렸다.' },
      { who: 'senior', text: '그럼 吉 은 어떨까? 길할 길 이라는 글자다. 뜻을 빌렸는지 소리를 빌렸는지는 네가 가려 보아라.' }
    ]
  },

  contexts: [
    {
      id: 's1.c1', label: '돌비석',
      orig: ['O-s1-YEONGDONG'],
      lines: [
        { who: 'narrator', text: '비바람에 닳은 비석이다. 고을의 새 이름과 본디 이름이 함께 새겨져 있다.' },
        { who: 'me', expr: 'thinking', text: '同 과 郡 은 두 이름에 똑같이 들어 있어. 다른 건 永 과 吉 뿐이야.' }
      ],
      items: ['s1.r1']
    },
    {
      id: 's1.c2', label: '목간을 든 서기',
      orig: ['O-s1-MILSEONG'],
      lines: [
        { who: 'scribe', text: '나는 관에서 고을 이름을 적는 사람이오. 이 목간을 보시오. 이웃 고을도 이름이 둘이라오.' },
        { who: 'scribe', text: '본디 이름의 推 는 밀다 라는 뜻으로 읽고, 새 이름의 密 은 밀 이라는 소리로 읽소. 여기서는 본디 이름 쪽이 뜻을 빌렸지.' }
      ],
      items: ['s1.r1']
    },
    {
      id: 's1.c3', label: '노래하는 아이',
      orig: ['O-s1-SEODONG1'],
      lines: [
        { who: 'child', text: '공주님 노래예요! 主 가 두 번 나오는데, 뒤엣것은 님 이라고 불러요.' },
        { who: 'child', text: '맨 끝 隱 은 숨다 라는 글자래요. 그런데 부를 때는 그냥 은 하고 앞말에 붙여요. 이상하죠?' }
      ],
      items: ['s1.r1', 's1.r2']
    },
    {
      id: 's1.c4', label: '옹기 앞의 여인',
      orig: ['O-s1-CHEOYONG1'],
      lines: [
        { who: 'woman', text: '처용이라는 사람이 불렀다는 노래예요. 둘째 줄은 밤늦도록 놀러 다니다가 돌아왔다는 말이고요.' },
        { who: 'woman', text: '夜 는 밤, 遊 는 놀다 하고 새겨 읽어요. 그 사이사이에 낀 글자는 말끝을 이어 주는 소리예요.' }
      ],
      items: ['s1.r2']
    },
    {
      id: 's1.c5', label: '마당의 남자',
      orig: ['O-s1-SUSEONG'],
      lines: [
        { who: 'man', text: '내 외가는 북쪽, 예전에 고구려 땅이던 고을이오. 거기도 이름이 바뀌었다오.' },
        { who: 'man', text: '본디 이름은 고구려 말소리 그대로 적었고, 새 이름은 그 말의 뜻을 한자로 옮겼다고 들었소.' }
      ],
      items: []
    }
  ],

  notes: [
    { id: 's1.n2', kind: 'know', at: ['s1.c5'],
      text: '같은 고을을 고구려 때는 소리로 買忽, 신라 때는 뜻으로 水城 이라 적었다. 그래서 買 는 물, 忽 은 고을을 뜻하는 말임을 알 수 있다.',
      src: '『삼국사기』 권35 지리2 한주, 박창원(1997) 「차자 표기의 음운론」 (리서치 11 §4-1)' }
  ],

  items: [
    {
      id: 's1.t1', kind: 'task', levels: ['h23'], label: '뜻이냐 소리냐',
      prompt: '비석과 노래의 한자마다 뜻을 빌렸는지 소리를 빌렸는지 가려 보자.',
      gimmick: 'borrowSort',
      config: {
        lines: [
          { orig: 'O-s1-YEONGDONG', line: 0, targets: [{ at: 0, id: 'yeong' }, { at: 5, id: 'gil' }] },
          { orig: 'O-s1-SEODONG1', line: 0, targets: [{ at: 4, id: 'ju' }, { at: 5, id: 'eun' }] },
          { orig: 'O-s1-CHEOYONG1', line: 0, targets: [], notes: [
            { at: [0, 1], kind: 'interp', text: '풀이가 둘로 갈려 고르지 않는다.' },
            { at: 5, kind: 'interp', text: '풀이가 둘로 갈려 고르지 않는다.' }
          ] },
          { orig: 'O-s1-CHEOYONG1', line: 1, targets: [
            { at: 0, id: 'ya' }, { at: 1, id: 'ip' }, { at: 2, id: 'i' }, { at: 3, id: 'yu' }, { at: 4, id: 'haeng' },
            { at: 5, id: 'yeo', note: { kind: 'know', text: '如 는 어미 자리인데도 소리가 아니라 뜻(새김 다)을 빌려 적은 예외다.' } },
            { at: 6, id: 'ga' }
          ] }
        ],
        rule: {
          sentence: '실질 형태소는 대체로 뜻을, 조사와 어미는 {?} 빌려 적었다.',
          cards: [
            { id: 's1.t1.a', text: '대체로 소리를' },
            { id: 's1.t1.b', text: '언제나 소리만' },
            { id: 's1.t1.c', text: '대체로 뜻을' }
          ]
        }
      },
      answer: {
        marks: { yeong: 'hun', gil: 'eum', ju: 'hun', eun: 'eum', ya: 'hun', ip: 'hun', i: 'eum', yu: 'hun', haeng: 'hun', yeo: 'hun', ga: 'eum' },
        rule: 's1.t1.a'
      },
      hints: ['낱말의 뜻을 맡은 글자와 조사나 어미 자리에 붙은 글자를 나누어 봐.', 'rule'],
      explain: '永 은 뜻 길- 을, 吉 은 소리 길 을 빌려 같은 고을을 적었다. 향찰에서도 夜 入 遊 行 처럼 뜻을 가진 말은 뜻을, 伊 可 隱 처럼 조사와 어미는 소리를 빌렸다. 다만 如 처럼 어미를 새김으로 적은 예외가 있어 대체로라고 한다.'
    },
    {
      id: 's1.r1', kind: 'read', levels: ['h23'], label: '두 이름, 한 고을',
      prompt: '비석과 서기의 목간을 견주어 규칙 문장을 완성해 보자.',
      sentence: '글자가 없던 때에는 한자를 빌려 우리말을 적었다. 고을 이름을 적을 때도 {?}',
      ruleCard: 'rule.borrowing',
      cards: [
        { id: 's1.r1.a', correct: true,
          text: '한자의 뜻을 빌리기도 하고 소리를 빌리기도 했다.' },
        { id: 's1.r1.b', correct: false, src: 'wrong.oldNameSound',
          text: '본디 이름은 늘 소리를, 고친 이름은 늘 뜻을 빌렸다.',
          why: '吉同(본디 이름, 소리)과 永同(고친 이름, 뜻)만 보면 그래 보인다. 그러나 推火(본디 이름)는 뜻을, 密城(고친 이름)은 소리를 빌려 방향이 반대다.' },
        { id: 's1.r1.c', correct: false, src: 'wrong.hyangchalOneWay (고을 이름에 맞춤)',
          text: '한자의 뜻만 빌렸고 소리는 빌리지 않았다.',
          why: '吉同 의 吉 은 좋다는 뜻과 상관없이 길 이라는 소리만 빌렸다. 같은 고을을 永 은 뜻으로, 吉 은 소리로 적었다.' }
      ],
      explain: '永 은 뜻 길- 을, 吉 은 소리 길 을 빌려 같은 고을 이름을 적었다. 이웃 고을의 推火 와 密城 은 거꾸로 본디 이름 쪽이 뜻을 빌렸다. 본디 이름이냐 새 이름이냐가 아니라, 글자마다 뜻을 빌렸는지 소리를 빌렸는지를 본다.',
      hints: ['같은 고을을 가리키는 두 이름에서 서로 다른 글자만 견주어 봐. 서기는 이웃 고을의 두 이름도 알고 있어.', 's1.c2'],
      misread: {
        's1.r1.b': [
          { who: 'me', text: '본디 이름은 늘 소리로, 고친 이름은 늘 뜻으로 적는 거래요.' },
          { who: 'scribe', cg: 'mis_official_confused', text: '그럼 내 목간은 다 틀렸단 말이오? 본디 이름 推火 는 밀다 의 뜻으로 읽고, 새 이름 密城 은 밀 소리로 읽는데?' },
          { who: 'senior', text: '본디 이름이냐 새 이름이냐로는 가를 수 없다. 글자 하나하나가 뜻을 빌렸는지 소리를 빌렸는지를 보아야 한다.' }
        ],
        's1.r1.c': [
          { who: 'me', text: '한자는 뜻만 빌려 쓴 거래요. 그러니까 吉同 은 좋은 고을이라는 뜻이고요.' },
          { who: 'man', cg: 'mis_commoner_puzzled', text: '좋은 고을? 우리 고을을 그렇게 부른 적은 없소. 그냥 길 고을이라 불렀지.' },
          { who: 'senior', text: '吉 은 좋다는 뜻과 상관없이 길 이라는 소리만 빌린 글자다. 같은 이름을 永 은 뜻으로, 吉 은 소리로 적었지.' }
        ]
      }
    },
    {
      id: 's1.r2', kind: 'read', levels: ['h23'], label: '노래를 적는 법',
      prompt: '아이의 노래와 여인의 노래를 견주어 규칙 문장을 완성해 보자.',
      sentence: '향찰에서 뜻을 지닌 말은 대체로 한자의 뜻을 빌려 적고, {?}',
      ruleCard: 'rule.hyangchal',
      cards: [
        { id: 's1.r2.a', correct: true,
          text: '조사와 어미는 대체로 한자의 소리를 빌려 적었다.' },
        { id: 's1.r2.b', correct: false, src: 'wrong.particleAlwaysSound',
          text: '조사와 어미는 언제나 한자의 소리를 빌려 적었다.',
          why: '대체로 그렇다는 규칙이다. 처용가 둘째 구의 如 는 어미 자리인데도 뜻(새김 다)을 빌린 글자다.' },
        { id: 's1.r2.c', correct: false, src: 'wrong.hyangchalOneWay',
          text: '조사와 어미도 한자의 뜻을 빌려 적었다. 향찰은 뜻만 빌렸다.',
          why: '한 구절 안에서도 뜻을 빌린 글자와 소리를 빌린 글자가 섞인다. 처용가 둘째 구의 夜 는 뜻(밤)을, 伊 는 소리(이)를 빌렸다.' }
      ],
      explain: '서동요의 主 는 뜻 님 을, 隱 은 소리 은 을 빌렸다. 처용가 둘째 구도 夜 遊 처럼 뜻을 지닌 말은 뜻으로, 伊 可 처럼 말끝은 소리로 적었다. 다만 예외가 있어서 언제나가 아니라 대체로라고 한다.',
      hints: ['노래에서 새겨 읽는 글자와, 말끝에 붙여 소리만 내는 글자를 나누어 봐.', 's1.c4'],
      misread: {
        's1.r2.b': [
          { who: 'me', text: '노래에서 조사와 어미는 언제나 소리로 적었대요.' },
          { who: 'woman', cg: 'mis_woman_flustered', text: '언제나요? 우리 할머니는 처용 노래 말끝을 소리대로만 부르시지 않던데요. 새겨서 읽는 글자도 있었어요.' },
          { who: 'senior', text: '말끝을 새김으로 적은 글자가 하나라도 있으면 언제나는 틀린 말이 된다. 그래서 대체로라고 적어 둔다.' }
        ],
        's1.r2.c': [
          { who: 'me', text: '향찰은 뜻만 빌린 거래요. 그러니까 隱 도 숨다 라는 뜻이고요.' },
          { who: 'child', cg: 'mis_child_laughing', text: '공주님 숨어! 하하, 그렇게 부르면 노래가 이상해져요!' },
          { who: 'senior', text: '隱 은 여기서 숨다 가 아니라 소리 은 을 빌린 조사다. 뜻을 지닌 主 만 님 으로 새겨 읽는다.' }
        ]
      }
    }
  ],

  translate: {
    id: 's1.tr1',
    text: '영동군의 본디 이름은 길동군이다. 永 은 뜻으로, 吉 은 소리로 같은 우리말 길- 을 적었다.',
    // 통역 고르기(js/ui/stage-translate.js): 모닥불 가에서 비석의 吉(s1.r1 두 이름, 한 고을)과 노래의 隱(s1.r2 노래를 적는 법)을
    // 어떻게 풀어 줄지 고른다. 고2~3 전용 장면이라 두 항목 모두 늘 핵심이다. 고른 말은 뒤의 내 통역 두 줄에 그대로 든다.
    chooseAt: 1,
    compose: '永 은 길다 의 뜻으로, 吉 은 {?} 같은 이름을 적었어요. 공주님 노래는 님 다음에 {?} 붙는 거예요.',
    choose: [
      {
        id: 's1.i1', item: 's1.r1',
        prompt: '비석의 고을 이름 吉同, 그 吉 을 마을 사람들에게 어떻게 풀어 줄까?',
        options: [
          { id: 's1.i1.a', text: '길 이라는 소리를 빌린 글자', part: '길 이라는 소리로', correct: true },
          { id: 's1.i1.b', text: '좋다(길하다)는 뜻을 빌린 글자', part: '좋다는 뜻으로', correct: false,
            reaction: [
              { who: 'me', text: '永 은 길다 의 뜻으로, 吉 은 좋다는 뜻으로 같은 이름을 적었어요.' },
              { who: 'man', cg: 'mis_commoner_puzzled', text: '길다 와 좋다 가 어찌 같은 이름이오? 우리는 그냥 길 고을이라 불렀소.' },
              { who: 'senior', text: '해독할 때 永 과 吉 을 견주어 보았지? 吉 이 무엇을 빌렸는지 떠올려 보아라.' }
            ] },
          { id: 's1.i1.c', text: '永 처럼 길다 의 뜻을 빌린 글자', part: '永 처럼 길다 의 뜻으로', correct: false,
            reaction: [
              { who: 'me', text: '永 도 吉 도 길다 의 뜻으로 같은 이름을 적었어요.' },
              { who: 'scribe', cg: 'mis_official_confused', text: '吉 을 길다 로 새겨 읽는 법은 없소. 그건 길할 길 자요.' },
              { who: 'senior', text: '같은 고을 이름이라도 글자마다 빌린 것이 다를 수 있다. 서기의 목간에서 본 두 이름을 떠올려 보아라.' }
            ] }
        ]
      },
      {
        id: 's1.i2', item: 's1.r2',
        prompt: '공주님 노래 끝의 隱, 아이에게 어떻게 풀어 줄까?',
        options: [
          { id: 's1.i2.a', text: '은 이라는 소리만 빌린 말끝', part: '은 이라는 소리가', correct: true },
          { id: 's1.i2.b', text: '숨다 라는 뜻을 빌린 말', part: '숨는다는 뜻이', correct: false,
            reaction: [
              { who: 'me', text: '공주님 노래는 님 다음에 숨는다는 뜻이 붙는 거예요.' },
              { who: 'child', cg: 'mis_child_laughing', text: '공주님 숨어! 하하, 그렇게 부르면 노래가 이상해져요!' },
              { who: 'senior', text: '향찰에서 말끝에 붙은 글자는 대체로 무엇을 빌렸는지 떠올려 보아라.' }
            ] },
          { id: 's1.i2.c', text: '主 처럼 님 으로 새겨 읽는 말', part: '님 이 한 번 더', correct: false,
            reaction: [
              { who: 'me', text: '공주님 노래는 님 다음에 님 이 한 번 더 붙는 거예요.' },
              { who: 'child', cg: 'mis_child_laughing', text: '공주님님? 그렇게 부르는 사람은 없어요! 끝에서는 그냥 은 하고 붙인다니까요.' },
              { who: 'senior', text: '뜻을 지닌 主 만 새겨 읽는다. 말끝의 隱 은 무엇을 빌렸을지 떠올려 보아라.' }
            ] }
        ]
      }
    ],
    lines: [
      { who: 'narrator', text: '밤이 되자 마을 사람들이 모닥불 가에 모였다. 아이가 노래를 부르고, 나는 수첩을 편다.', cg: 's1_climax' },
      { who: 'me', text: '비석의 두 이름은 같은 고을이에요. 永 은 길다 의 뜻으로, 吉 은 길 이라는 소리로 같은 이름을 적었어요.' },
      { who: 'man', text: '그럼 관에서 새긴 이름도 결국 우리가 부르던 길 고을이구려!' },
      { who: 'me', text: '노래도 그래요. 뜻을 지닌 말은 새겨 읽고, 말끝은 소리로 붙여요. 공주님 노래는 님 다음에 은 이라는 소리가 붙는 거예요.' },
      { who: 'child', text: '그래서 그렇게 부르는 거였구나!' },
      { who: 'woman', text: '처용 노래도 밤늦도록 놀러 다니다가… 하고 이어지는 거군요.' },
      { who: 'senior', expr: 'smile', text: '잘했다. 뜻을 빌린 글자와 소리를 빌린 글자를 가리는 눈, 그것이 통사의 첫 재주다.' },
      { who: 'narrator', text: '그때 모닥불 연기가 물살처럼 휘어지며 나를 감싼다. 시간의 물살이 다시 흐르기 시작한다.' },
      // 연결 장면: 전기 중세를 스쳐 1443년으로 (spec §7 — 전기 중세는 스테이지가 아니다)
      { who: 'narrator', text: '물살 속으로 다른 시대가 스쳐 간다. 고려의 관청과 절에서도 사람들은 여전히 한자를 빌려 우리말을 적고 있다.' },
      { who: 'senior', expr: 'thinking', text: '몇백 년이 지나도 남의 글자를 빌려 써야 하는 불편은 그대로였다. 이제 그 불편을 끝낼 때가 온다.' },
      { who: 'narrator', text: '물살이 멈춘 곳은 1443년. 새 글자가 막 태어나려는 때다.' }
    ]
  }
};
