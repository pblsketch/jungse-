'use strict';
/*
 * 장면 5 「사라진 소리, 바뀐 뜻」 (1450년대 강가 장터 · 고1, 고2~3 묶음). 장면 데이터 모양은 js/data/scenes/README.md.
 * - 기믹 없음. 오해 장면(뜻 카드)이 중심이다. 해독 항목마다 그 뜻으로 통역했을 때의 오해 장면이 있다.
 * - 原文: 「세종어제훈민정음」 서문 구절(O-s9-SEOMUN1·3·4·5, 리서치 09), 낱말 출처 구절(O-s5-*, 리서치 10 §4).
 *   O-s5-DS1017·DS114 는 방점을 판독하지 못한 블록(noBangjeom)이라 방점 없이 보인다.
 * - 10~12분에 맞춰 학교급마다 핵심 항목을 5개로 골랐다.
 *   고1: 어린 · 어엿브다 · 하다 · 놈 · 어두 자음군 / 고2~3: 어린 · 어엿브다 · 하다 · 어두 자음군 · 즈믄(고유어와 한자어)
 *   고2~3 에서 놈은, 고1 에서 즈믄은 맥락 창의 알아 두기로만 보인다. 말[ㅆㆍㅁ]은 선배의 풀이 예시와 알아 두기로 다룬다.
 *   구개음화·두음 법칙·원순 모음화 이전 형태와 ㅎ 종성 체언은 알아 두기(s5.n2)로 둔다. 차용어는 확인된 낱말 예가 없어 넣지 않았다.
 *   중학교 학생이 들어오면 고1 범위를 쓴다(js/data/rules-config.js).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s5'] = {
  id: 's5',
  title: '사라진 소리, 바뀐 뜻',
  era: '1450년대 강가 장터',
  mapKey: 's5',
  bgmKey: 'bgm_s5',
  carveGlyph: 'ㅳ',

  cast: {
    merchant: { name: '곡식 장수', portrait: 'merchant' },
    yangban_woman: { name: '양반 댁 마님', portrait: 'yangban_woman' },
    yangban_man: { name: '양반 어른', portrait: 'yangban_man' },
    commoner_woman: { name: '광주리 노점 아낙', portrait: 'commoner_woman' },
    commoner_man: { name: '소금 장수', portrait: 'commoner_man' },
    child: { name: '장터 아이', portrait: 'child' },
    elder: { name: '나루터 노인', portrait: 'elder' }
  },

  fiction: [
    { id: 'fiction.tongsa', text: '정음 통사: 새 글자와 사람들의 말 사이를 옮겨 주는 통역관', real: '이런 직책은 없었어요. 이야기를 위해 지어낸 일이에요.' },
    { id: 'fiction.s5market', text: '장터에 새 글자로 쓴 방과 쪽지가 나붙은 장면', real: '장터에 이런 방이나 쪽지가 붙었다는 기록을 바탕으로 한 장면이 아니에요. 방에 보이는 서문의 우리말 풀이는 1459년 『월인석보』 첫머리에 실려 전해요.' },
    { id: 'fiction.s5pages', text: '나루에 떠밀려 온 뒷날의 책장', real: '이 두 구절은 1481년에 펴낸 『분류두공부시언해』에 실려 있어요. 1450년대 장터에는 아직 없던 책이에요.' }
  ],

  intro: [
    { who: 'narrator', text: '1450년대, 강가의 장터. 해가 기울어 천막마다 금빛이 든다.', cg: 's5_intro' },
    { who: 'senior', text: '<@아>, 오늘은 장터야. 새 글자로 쓴 방과 쪽지가 나붙었는데 읽어 줄 사람이 모자란대.', fiction: 'fiction.tongsa' },
    { who: 'me', text: '이번엔 쉬울 것 같아요. 지금 말이랑 똑같이 생긴 낱말이 많던데요.' },
    { who: 'senior', text: '그게 함정이야. 모양이 같아도 뜻이 다른 말이 있거든. 지금 뜻으로 옮겼다가는 흥정이 엉망이 돼.', expr: 'thinking', fiction: 'fiction.s5market' }
  ],

  request: [
    { who: 'merchant', text: '통사 양반, 마침 잘 왔소. 저 마님이 쓴 쪽지를 받았는데, 나는 글을 막 깨쳐서 뜻을 제대로 모르겠소.' },
    { who: 'yangban_woman', text: '쪽지에 적은 대로 쌀을 사려 하오. 장터 방에 붙은 말을 따라 적었으니, 그 말부터 바로 읽어 흥정을 이어 주시오.' }
  ],

  encounter: {
    orig: ['O-s9-SEOMUN3'],
    lines: [
      { who: 'me', text: '어·린 百姓… 이건 쉽네요. 나이 어린 백성!', expr: 'smile' },
      { who: 'senior', text: '정말 그럴까? 확정하기 전에 같은 말이 쓰인 곳을 두 군데는 찾아봐.', expr: 'thinking' }
    ]
  },

  example: {
    orig: ['O-s9-SEOMUN1'],
    lines: [
      { who: 'senior', text: '내가 먼저 하나 풀어 볼게. 나·랏:말[ㅆㆍ]·미의 :말[ㅆㆍㅁ], 높여 부르는 말씀처럼 보이지?' },
      { who: 'senior', text: '그런데 여기서는 나라의 말, 그냥 말이야. 다른 책에서도 높이는 뜻 없이 말이라는 뜻으로 쓰였어.' },
      { who: 'senior', text: '지금 뜻을 먼저 떠올리지 말고, 같은 말이 쓰인 다른 곳과 앞뒤를 보고 고르는 거야.' }
    ]
  },

  needs: [
    {
      rule: 'rule.linkedWriting',
      lines: [
        { who: 'senior', text: '15세기 글은 받침을 다음 음절로 넘겨 소리 나는 대로 적었어. 노·미는 놈 + 이, ·노·[ㅁㆍㄹ]은 놈 + [ㅇㆍㄹ]이야.' }
      ]
    }
  ],

  contexts: [
    {
      id: 's5.c1', label: '느티나무에 붙은 방', orig: ['O-s9-SEOMUN3', 'O-s9-SEOMUN4', 'O-s9-SEOMUN5'],
      lines: [
        { who: 'narrator', text: '느티나무 줄기에 방 한 장이 붙어 있다. 사람들이 모여 더듬더듬 소리 내어 읽는다.', fiction: 'fiction.s5market' },
        { who: 'senior', text: '임금께서 새 글자를 만든 까닭을 적은 글이야. 낯익은 말이 많지? 그래서 더 조심해야 해.' }
      ],
      items: ['s5.r1', 's5.r2', 's5.r3', 's5.r4', 's5.r5']
    },
    {
      id: 's5.c2', label: '양반 어른의 노래', orig: ['O-s5-YB39a'],
      lines: [
        { who: 'yangban_man', text: '「용비어천가」 한 대목을 읊어 보리다. 옛 임금의 마음을 기리는 노래요.' },
        { who: 'yangban_man', text: '임금을 기리는 노래에 임금을 깎아내리는 말이 들어갈 리는 없겠지?' }
      ],
      items: ['s5.r1']
    },
    {
      id: 's5.c3', label: '수레 위의 책 보따리', orig: ['O-s5-YB13', 'O-s5-YB50'],
      lines: [
        { who: 'narrator', text: '수레에 실린 책 보따리가 풀려 있다. 펼쳐진 장에 같은 노래책의 다른 대목이 보인다.' },
        { who: 'senior', text: '·[ㅺㅜ]므·로의 첫소리를 봐. 자음 글자 둘이 나란히 붙어 있지?' }
      ],
      items: ['s5.r2', 's5.r3', 's5.r5']
    },
    {
      id: 's5.c4', label: '광주리 노점 아낙의 쪽지', orig: ['O-s5-SS613'],
      lines: [
        { who: 'commoner_woman', text: '절에서 받아 온 글이에요. 이 구절대로 쌀을 나눠 주라는데, 누구한테 주라는 건지 헷갈려서요.' }
      ],
      items: ['s5.r2']
    },
    {
      id: 's5.c5', label: '나루터 노인의 옛이야기', orig: ['O-s5-YB64'],
      lines: [
        { who: 'elder', text: '옛 임금 이야기 하나 들려주리다. 나라를 배반한 이를 붙잡았는데, 일부러 놓아주셨다는 대목이오.' }
      ],
      items: ['s5.r4']
    },
    {
      id: 's5.c6', label: '나루에 걸린 책장', orig: ['O-s5-DS1017', 'O-s5-DS114'],
      lines: [
        { who: 'narrator', text: '나루 기둥에 젖은 책장 두 장이 걸려 있다. 이 장터보다 뒷날에 나온 책 같다.', fiction: 'fiction.s5pages' },
        { who: 'senior', text: '한시를 우리말로 옮긴 책이야. 한시의 글자와 견주어 보면 낱말 뜻이 보여.' }
      ],
      items: ['s5.r5', 's5.r6']
    },
    {
      id: 's5.c7', label: '소금 장수의 자랑',
      lines: [
        { who: 'commoner_man', text: '올해 소금을 즈믄 섬이나 날랐소. 열 섬씩 꼭 백 번을 날랐으니 틀림없소.' },
        { who: 'commoner_man', text: '셈을 할 줄 알면 내가 얼마나 날랐는지 금방 알 거요.', expr: 'smile' }
      ],
      items: ['s5.r6']
    }
  ],

  items: [
    {
      id: 's5.r1', kind: 'read', levels: ['h1', 'h23'],
      label: '어·린', word: '어·린', wordForms: ['어·리시·니'], gloss: '어리석은',
      ruleCard: 'rule.meaningChange',
      prompt: '어·린 百姓의 어·린은 무슨 뜻일까?',
      cards: [
        { id: 's5.r1.a', text: '어리석은, 슬기가 모자란', correct: true },
        { id: 's5.r1.b', text: '나이가 어린', correct: false, src: 'wrong.eorinYoung',
          why: '15세기 어리다는 어리석다, 슬기가 모자라다는 뜻이었다. 나이가 적다는 뜻은 졈다가 맡았다.' },
        { id: 's5.r1.c', text: '여린, 힘이 약한', correct: false,
          why: '여리다와는 다른 말이다. 서문은 힘이 아니라 글을 몰라 하고 싶은 말을 펴지 못하는 처지를 말한다.' }
      ],
      explain: '15세기 어리다는 어리석다는 뜻이었다. 서문의 어·린 百姓은 글을 몰라 하고 싶은 말을 제대로 펴지 못하는 백성이고, 「용비어천가」의 아·니 어·리시·니는 임금의 마음이 어리석지 않았다는 말이다. 나이가 어리다는 뜻은 졈다가 맡았다.',
      hints: ['임금을 기리는 노래에서 아니 어리시니라고 했어. 임금을 기릴 때 무엇이 아니라고 할까?', 's5.c2'],
      misread: {
        's5.r1.b': [
          { who: 'me', text: '어·린 百姓이라… 아, 아이들한테 하는 말이군요!' },
          { who: 'child', text: '하하, 우리 할아버지도 어린 백성이래요! 수염이 이만큼인데요!', cg: 'mis_child_laughing' },
          { who: 'elder', text: '나이 이야기가 아니오. 글을 몰라 제 뜻을 펴지 못하는, 슬기가 모자란 백성을 두고 하는 말이지.' }
        ],
        's5.r1.c': [
          { who: 'me', text: '힘없는 백성들 말이네요. 몸이 여린 사람들이요.' },
          { who: 'commoner_man', text: '힘이 약하다니? 나는 소금 가마니를 하루에 수십 번 지는 사람이오!', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '힘 이야기가 아니야. 글을 몰라 하고 싶은 말을 못 하는, 어리석은 처지를 말한 거지.' }
        ]
      }
    },
    {
      id: 's5.r2', kind: 'read', levels: ['h1', 'h23'],
      label: ':어엿·비', word: ':어엿·비', wordForms: [':어·엿븐'], gloss: '불쌍히',
      prompt: ':어엿·비, :어·엿븐의 뜻은 무엇일까?',
      cards: [
        { id: 's5.r2.a', text: '불쌍하다, 가엾다', correct: true },
        { id: 's5.r2.b', text: '예쁘다', correct: false, src: 'wrong.eoyeopbeuPretty',
          why: '15세기 어엿브다는 불쌍하다, 가엾다는 뜻이었다. 뜻이 옮겨 가 지금의 예쁘다가 되었다.' },
        { id: 's5.r2.c', text: '어엿하다, 번듯하다', correct: false,
          why: '소리가 비슷할 뿐 다른 말이다. 절에서 쌀을 나눠 주라는 사람은 번듯한 사람이 아니라 딱한 사람이다.' }
      ],
      explain: '15세기 어엿브다는 불쌍하다, 가엾다는 뜻이었다. 서문의 :어엿·비 너·겨는 백성을 가엾게 여긴다는 말이고, 『석보상절』의 :어·엿븐 :사[ㄹㆍ]·[ㅁㆍㄹ]은 딱한 사람이다. 뒷날 뜻이 옮겨 가 지금의 예쁘다가 되었다.',
      hints: ['절에서 쌀을 나눠 주라는 사람, 임금이 마음을 쓴 백성. 둘은 어떤 처지일까?', 's5.c4'],
      misread: {
        's5.r2.b': [
          { who: 'me', text: '임금님께서 백성을 예쁘게 여기셨대요! 이 쪽지도 예쁜 사람한테 쌀을 주라는 거예요.' },
          { who: 'commoner_woman', text: '어머, 나더러 예쁘다고요? …아니, 그게 아니라요.', cg: 'mis_woman_flustered' },
          { who: 'commoner_woman', text: '예쁜 사람만 골라 쌀을 주라는 절이 어디 있어요. 끼니를 못 잇는 딱한 사람한테 주라는 말이지요.' },
          { who: 'senior', text: '임금도 백성을 예쁘게 본 게 아니라 가엾게 여기신 거야.' }
        ],
        's5.r2.c': [
          { who: 'me', text: '번듯한 사람한테 쌀을 주라는 거네요.' },
          { who: 'commoner_woman', text: '번듯한 사람한테 쌀을 왜 나눠 줘요? 살기 어려워 가엾은 사람한테 주는 거지요.', cg: 'mis_commoner_puzzled' }
        ]
      }
    },
    {
      id: 's5.r3', kind: 'read', levels: ['h1', 'h23'],
      label: '하다', word: '하·니·라', wordForms: [':하·[ㄷㆎ]'], gloss: '많다',
      prompt: '노·미 하·니·라, :하·[ㄷㆎ]의 하다는 무슨 뜻일까?',
      cards: [
        { id: 's5.r3.a', text: '많다', correct: true },
        { id: 's5.r3.b', text: '(무엇을) 하다', correct: false, src: 'wrong.hadaDo',
          why: '15세기 하다는 많다는 뜻이었다. 지금의 하다에 해당하는 말은 [ㅎㆍ]다였다.' },
        { id: 's5.r3.c', text: '말하다, 아뢰다', correct: false,
          why: '앞에 이미 아뢸 사람([ㅅㆍㄹ]·[ㅸㆍ]·리)이 나온다. 하다는 그런 사람이 많다는 말이다.' }
      ],
      explain: '15세기 하다는 많다는 뜻이었다. 서문의 노·미 하·니·라는 제 뜻을 펴지 못하는 사람이 많다는 말이고, 「용비어천가」의 :하·[ㄷㆎ]도 아뢸 사람이 많다는 말이다. 지금의 하다에 해당하는 말은 [ㅎㆍ]다였다.',
      hints: ['노·미 하·니·라 앞에는 제 뜻을 펴지 못하는 사람 이야기가 있어. 그런 사람이 어떻다는 걸까?', 's5.c3'],
      misread: {
        's5.r3.b': [
          { who: 'me', text: '제 뜻을 펴지 못하는 사람이… 한다? 뭘 한다는 거죠?' },
          { who: 'elder', text: '하긴 뭘 해. 그런 사람이 많다는 말이오. 장터만 둘러봐도 글 몰라 답답한 사람이 수두룩하지 않소.', cg: 'mis_commoner_puzzled' }
        ],
        's5.r3.c': [
          { who: 'me', text: '아뢸 사람이 말한다…? 같은 말을 두 번 하네요.' },
          { who: 'merchant', text: '같은 말을 두 번 할 리가 있소. 아뢸 사람이 많다, 그 말이오.', cg: 'mis_official_confused' }
        ]
      }
    },
    {
      id: 's5.r4', kind: 'read', levels: ['h1'],
      label: '·노·미', word: '·노·미', wordForms: ['·노·[ㅁㆍㄹ]'], gloss: '사람',
      prompt: '·노·미, ·노·[ㅁㆍㄹ]의 놈은 어떤 말일까?',
      cards: [
        { id: 's5.r4.a', text: '사람(낮추는 뜻 없이)', correct: true },
        { id: 's5.r4.b', text: '남을 낮추어 부르는 말', correct: false, src: 'wrong.nomInsult',
          why: '15세기 놈은 낮춤의 뜻 없이 그냥 사람을 가리켰다. 앞뒤 문맥이 나빠 보여도 낮춤말이라는 근거는 되지 않는다.' },
        { id: 's5.r4.c', text: '사내, 남자', correct: false,
          why: '15세기 놈은 그냥 사람을 가리키는 말이었다. 서문의 노·미 하·니·라도 그런 사람이 많다는 뜻이다.' }
      ],
      explain: '15세기 놈은 낮추는 뜻 없이 그냥 사람을 가리켰다. 서문의 노·미 하·니·라는 그런 사람이 많다는 말이고, 「용비어천가」의 배반하는 ·노·[ㅁㆍㄹ]도 배반하는 사람을 가리킬 뿐이다.',
      hints: ['임금이 백성을 위해 붙인 방에 백성을 욕하는 말을 썼을까?', 's5.c5'],
      misread: {
        's5.r4.b': [
          { who: 'me', text: '놈이 많다니, 임금님이 백성을 욕하셨네요!' },
          { who: 'yangban_man', text: '무엄하구나! 임금께서 백성을 욕하는 글을 방으로 붙이셨겠느냐. 노·미는 그저 사람이라는 말이다.', cg: 'mis_yangban_offended' }
        ],
        's5.r4.c': [
          { who: 'me', text: '사내들만 많다는 뜻이군요.' },
          { who: 'child', text: '하하, 우리 엄마도 글 몰라서 답답하다던데요? 엄마도 사람이잖아요!', cg: 'mis_child_laughing' },
          { who: 'senior', text: '놈은 남자만 가리키는 말이 아니었어. 그냥 사람이야.' }
        ]
      }
    },
    {
      id: 's5.r5', kind: 'read', levels: ['h1', 'h23'],
      label: 'ㅳ, ㅺ처럼 나란히 쓴 첫소리', ruleCard: 'rule.initialCluster',
      sentence: '[ㅳㅡ]·들의 ㅳ, ·[ㅺㅜ]므·로의 ㅺ처럼, 15세기에는 {?}.',
      cards: [
        { id: 's5.r5.a', text: '낱말 첫머리에 서로 다른 자음 글자를 둘이나 셋 나란히 적었다', correct: true },
        { id: 's5.r5.b', text: 'ㅳ의 ㅂ은 소리 내지 않고 모양만 낸 글자였다', correct: false,
          why: '좁쌀(조 + [ㅄㆍㄹ])의 ㅂ처럼 그 흔적이 지금 말에 남아 있다. 그러니 ㅳ의 ㅂ도 실제로 소리 냈다. 모양만 낸 글자로 보기는 어렵다.' },
        { id: 's5.r5.c', text: '이런 글자는 한자음을 적을 때만 썼다', correct: false,
          why: '[ㅳㅡㄷ](뜻), [ㅺㅜㅁ](꿈)은 순우리말이다. 우리말 낱말 첫머리에도 이런 글자를 적었다.' }
      ],
      explain: '15세기에는 낱말 첫머리에 서로 다른 자음 글자를 둘이나 셋 나란히 적었다(합용 병서). [ㅳㅡ]·들은 [ㅳㅡㄷ] + 을, ·[ㅺㅜ]므·로는 [ㅺㅜㅁ] + 으로다. 이런 첫소리를 어두 자음군이라 하며, 자음을 실제로 이어 소리 냈다. 좁쌀의 ㅂ이 그 흔적이다. 어두 자음군은 뒤에 된소리로 바뀌어 지금의 뜻, 꿈이 되었다.',
      hints: ['[ㅳㅡ]·들과 ·[ㅺㅜ]므·로의 첫소리 자리에 자음 글자가 몇 개 적혔는지 세어 봐. 좁쌀(조 + 쌀)의 ㅂ이 어디서 왔는지도 떠올려 보고.', 's5.c3'],
      misread: {
        's5.r5.b': [
          { who: 'me', text: 'ㅂ은 꾸밈이니까 빼고 읽으면… 드들?' },
          { who: 'child', text: '드들이 뭐예요? 하하, 이상한 말!', cg: 'mis_child_laughing' },
          { who: 'senior', text: '첫머리의 ㅂ도 실제로 소리 냈어. 좁쌀의 ㅂ이 그 흔적이지. 이 말이 뒤에 된소리로 굳어 지금은 뜻이 되었어.' }
        ],
        's5.r5.c': [
          { who: 'me', text: '이런 글자는 한자 소리를 적는 데만 썼을 거예요. 이 낱말도 한자말이겠죠.' },
          { who: 'elder', text: '·[ㅺㅜ]므·로가 한자말이라고? 밤마다 꾸는 그 꿈 말이오. 처음 듣는 소리구려.', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '순우리말 첫머리에도 이렇게 서로 다른 자음 글자를 나란히 적었어.' }
        ]
      }
    },
    {
      id: 's5.r6', kind: 'read', levels: ['h23'],
      label: '즈믄', word: '즈믄', gloss: '천(千)', ruleCard: 'rule.nativeVsSino',
      prompt: '즈믄은 무슨 뜻일까?',
      cards: [
        { id: 's5.r6.a', text: '천(千)', correct: true },
        { id: 's5.r6.b', text: '수없이 많은', correct: false, src: 'wrong.jeumeunMany',
          why: '즈믄은 수 천(千)을 가리키는 고유어다. 한시의 千을 우리말로 옮긴 자리에 쓰였다.' },
        { id: 's5.r6.c', text: '백(百)', correct: false,
          why: '백은 온이다. 한 구절에 온과 즈믄이 함께 나와 한시의 百, 千과 짝을 이룬다.' }
      ],
      explain: '즈믄은 수 천(千)을 가리키는 고유어다. 한시의 千이 있던 자리를 즈믄으로, 百이 있던 자리를 온으로 옮겼다. 같은 뜻의 한자어 천, 백과 함께 쓰이다가 고유어가 밀려나 사라졌다.',
      hints: ['한시 원문과 견주어 봐. 즈믄이 있는 자리에 어떤 한자가 있지?', 's5.c6'],
      misread: {
        's5.r6.b': [
          { who: 'me', text: '아, 소금을 아주 많이 나르셨다는 말이군요.' },
          { who: 'commoner_man', text: '많기야 많지. 그런데 그냥 많은 게 아니라 열 섬씩 백 번, 셈이 딱 떨어지는 수요.', cg: 'mis_commoner_puzzled' },
          { who: 'senior', text: '열 섬씩 백 번이면 몇 섬일까? 즈믄은 그 수를 가리키는 우리말이야.' }
        ],
        's5.r6.c': [
          { who: 'me', text: '백 섬 나르셨군요!' },
          { who: 'commoner_man', text: '백 섬이면 열 번만 날랐게? 열 섬씩 백 번이라니까. 셈을 다시 해 보시오.', cg: 'mis_official_confused' },
          { who: 'senior', text: '백은 온이라고 했어. 책장에도 온과 즈믄이 나란히 나오지.' }
        ]
      }
    }
  ],

  npcs: {
    's5.merchant': {
      name: '곡식 장수',
      lines: [
        { who: 'merchant', text: '쪽지에 쓰인 말을 다 알아냈거든 이리 오시오. 흥정을 마무리합시다.' }
      ]
    },
    's5.lady': {
      name: '양반 댁 마님',
      lines: [
        { who: 'yangban_woman', text: '쪽지의 말은 느티나무에 붙은 방의 말을 따라 적은 것이오. 찬찬히 살펴보시오.' }
      ]
    },
    's5.child': {
      name: '장터 아이',
      lines: [
        { who: 'child', text: '저 방 글자 읽을 줄 알아요? 나는 아직 반밖에 못 읽어요.' }
      ]
    }
  },

  notes: [
    { id: 's5.n1', kind: 'know', title: ':말[ㅆㆍㅁ]', text: ':말[ㅆㆍㅁ]은 높임의 뜻이 없는 그냥 말이었다.', src: '공통국어2 137쪽 (리서치 10 §10 7번)', at: ['s5.c2', 's5.c3'] },
    { id: 's5.n2', kind: 'know', title: '소리가 바뀌기 전의 모습', text: '15세기 글에는 :됴·코(좋고), 닐·굽(일곱), ·믈(물)처럼 소리가 바뀌기 전의 모습이 보인다.', src: '공통국어2 4단원, 133쪽, 137쪽 (리서치 10 §5)', at: ['s5.c3', 's5.c6'] },
    { id: 's5.n5', kind: 'know', title: '두 책장의 한시', text: '두 책장은 두보의 한시를 우리말로 옮긴 『분류두공부시언해』(1481)의 구절이다.', src: '리서치 10 §4 (O-s5-DS1017, O-s5-DS114)', at: ['s5.c6'] }
  ],

  translate: {
    id: 's5.x1',
    text: '딱한 이웃이 많으니 쌀을 넉넉히 사서 나누겠다는 마님의 쪽지를 바르게 옮겼다.',
    at: 's5.merchant',
    lines: [
      { who: 'narrator', text: '곡식 노점 앞. 장수와 마님 사이에 쪽지 한 장이 놓여 있다.', cg: 's5_climax' },
      { who: 'me', text: '쪽지에 적힌 말을 풀면 이래요. 딱한 이웃이 많으니, 쌀을 넉넉히 사서 나누어 주겠다는 거예요.' },
      { who: 'merchant', text: '아, 그런 뜻이었구려! 나는 예쁜 이웃이 뭘 한다는 줄 알고 한참 고개를 갸웃했소.', expr: 'surprised' },
      { who: 'merchant', text: '좋은 일에 쓰신다니 값을 조금 덜 받겠소.' },
      { who: 'yangban_woman', text: '고맙소. 통사 덕에 흥정이 바로 풀렸구려.', expr: 'smile' },
      { who: 'senior', text: '모양이 같다고 뜻까지 같은 건 아니야. 같은 말이 쓰인 곳을 견주어 골랐으니 오해가 풀렸지.', expr: 'smile' }
    ]
  }
};
