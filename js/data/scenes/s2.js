'use strict';
/*
 * 스테이지 2 「스물여덟 자」 (1443~1446 궁 · 중학교 묶음, 다른 학교급도 들어올 수 있음)
 * - 原文: 『훈민정음』 해례 제자해(O-s2-SANG-*, GAHOEK*, ICHE, CHEON·JI·IN, HAP-*, JAECHUL, CHOJAE, JJ-GAK …),
 *   정인지 서(O-s2-JIJ-*), 어제 서문 한문(O-s9-HANMUN1~4, 해례본에 실린 1446년 한문 서문 — 세종의 말 근거).
 *   원문 글자는 블록 id 로만 가리킨다. 대사·풀이는 모두 새로 썼다(교과서·번역서 문장을 옮기지 않음).
 * - 의뢰: 중2-2 136쪽 세 장면(『농사직설』·『삼강행실도』·방)을 대사를 새로 써서 옮겼다.
 * - 기믹 letterForge(js/gimmicks/README-letterForge.md): t1 자음(상형·가획·다르게 만든 글자), t2 모음(천지인·합성).
 * - 학교급: 중학교는 '상형·가획·합성' 낱말만 쓴다(editions.m 의 t1 풀이). '이체'(s2.r5)는 고등 핵심이고,
 *   중학교에서는 맥락 창의 알아 두기(날개 설명)로만 보인다.
 * - 세종의 말은 어제 서문(O-s9-HANMUN1~4)을 새로 풀어 쓴 것만 쓰고, 지어낸 말에는 fiction 표지를 단다.
 */
(function (root) {
  const NM = root.NM = root.NM || {};
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};

  const ALL = ['m', 'h1', 'h23'];

  /* ---------- 해독 항목 ---------- */
  const R1 = {
    id: 's2.r1', kind: 'read', levels: ALL, label: '자음 기본 글자의 바탕', ruleCard: 'rule.consShape',
    prompt: '학사의 원고와 사람들의 말을 살피고, 빈칸에 맞는 말을 고르자.',
    sentence: '자음의 기본 글자 ㄱ ㄴ ㅁ ㅅ ㅇ은 {?}을 본떠 만들었다.',
    cards: [
      { id: 's2.r1.a', text: '그 소리를 낼 때의 발음 기관 모양', correct: true, why: '' },
      { id: 's2.r1.b', text: '하늘, 땅, 사람의 모양', correct: false,
        why: '하늘, 땅, 사람은 모음 기본 글자 ㆍ ㅡ ㅣ의 바탕이다. 자음 기본 글자는 소리 낼 때의 혀, 입, 이, 목구멍 모양을 따랐다.' },
      { id: 's2.r1.c', text: '낫이나 문 같은 생활 물건의 모양', correct: false,
        why: 'ㄱ이 낫처럼 보이는 것은 우연이다. ㄱ은 혀뿌리가 목구멍 쪽을 막는 모양을 옆에서 본 꼴이다.' }
    ],
    explain: 'ㄱ은 혀뿌리가 목구멍을 막는 모양, ㄴ은 혀끝이 윗잇몸에 닿는 모양, ㅁ은 입, ㅅ은 이, ㅇ은 목구멍 모양을 본떴다. 소리를 내는 몸의 모양에서 기본 글자가 나왔다(상형).',
    hints: ['"가" 하고 소리 내면서 혀가 어디에 닿는지 느껴 봐. 학사의 원고도 같은 이야기를 해.', 's2.c1'],
    misread: {
      's2.r1.b': [
        { who: 'farmer', text: '하늘을 본떴다고? 그럼 ㄱ을 쓸 때마다 하늘부터 올려다봐야 하오?', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '아, 제가 헷갈렸어요. 하늘, 땅, 사람은 모음 ㆍ ㅡ ㅣ의 바탕이에요.', expr: 'surprised' },
        { who: 'senior', text: '자음은 소리 낼 때의 혀, 입, 이, 목구멍 모양을 본떴어요. ㄱ은 혀뿌리 모양이고요.' }
      ],
      's2.r1.c': [
        { who: 'farmer', text: 'ㄱ이 낫 모양이라고? 우리 집 낫은 이렇게 꺾이지 않았는데…', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '낫을 닮아 보이는 건 우연이에요. ㄱ은 "가" 할 때 혀뿌리가 목구멍을 막는 모양에서 나왔어요.' }
      ]
    }
  };

  const R2 = {
    id: 's2.r2', kind: 'read', levels: ALL, label: '획을 더한 까닭', ruleCard: 'rule.addStroke',
    sentence: 'ㅋ은 ㄱ보다 소리가 세게 나서 {?}.',
    cards: [
      { id: 's2.r2.a', text: 'ㄱ에 획을 하나 더해 만들었다', correct: true, why: '' },
      { id: 's2.r2.b', text: 'ㄱ을 두 번 겹쳐 써서 만들었다', correct: false,
        why: 'ㄱ을 나란히 겹쳐 쓴 ㄲ은 된소리를 적는 방법이다. 거센 소리 ㅋ은 ㄱ에 획을 하나 더한 글자다.' },
      { id: 's2.r2.c', text: 'ㄱ과 상관없이 새 모양으로 따로 만들었다', correct: false,
        why: 'ㅋ 안에는 ㄱ이 그대로 들어 있다. 소리가 닮은 글자는 모양도 닮게 만들었다.' }
    ],
    explain: 'ㄱ에 획을 더해 ㅋ, ㄴ에 더해 ㄷ, ㅁ에 더해 ㅂ, ㅅ에 더해 ㅈ, ㅇ에 더해 ㆆ을 만들었다. 소리가 한 번 더 세지면 다시 획을 더해 ㅌ ㅍ ㅊ ㅎ이 되었다(가획).',
    hints: ['"가"와 "카"를 번갈아 소리 내 봐. 어느 쪽 숨이 더 세게 터지지?', 's2.c3'],
    misread: {
      's2.r2.b': [
        { who: 'farmer', text: 'ㄱ이 둘이면 ㅋ이라… 그럼 "가가" 하고 두 번 소리 내야 하오?', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '아니에요. ㄱ을 나란히 겹쳐 쓰는 건 된소리 ㄲ을 적는 방법이에요.' },
        { who: 'senior', text: '숨이 거세게 터지는 ㅋ은 ㄱ에 획을 하나 더 그은 글자예요.' }
      ],
      's2.r2.c': [
        { who: 'farmer', text: '하나하나 따로 만들었다면, 스물여덟 자를 몽땅 따로 외워야겠구먼.', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '다행히 그렇지 않아요. ㄱ을 알면 ㅋ은 획 하나만 더하면 돼요. 소리가 닮으면 모양도 닮았어요.', expr: 'smile' }
      ]
    }
  };

  const R3 = {
    id: 's2.r3', kind: 'read', levels: ALL, label: '모음 기본 글자의 바탕', ruleCard: 'rule.vowelShape',
    sentence: '모음의 기본 글자 ㆍ ㅡ ㅣ는 {?}을 본떠 만들었다.',
    cards: [
      { id: 's2.r3.a', text: '하늘의 둥근 모양, 땅의 평평한 모양, 사람이 선 모양', correct: true, why: '' },
      { id: 's2.r3.b', text: '소리 낼 때의 혀와 입술 모양', correct: false,
        why: '발음 기관의 모양을 본뜬 것은 자음 기본 글자다. 모음 기본 글자는 하늘, 땅, 사람에서 꼴을 따왔다.' },
      { id: 's2.r3.c', text: 'ㆍ는 하늘, ㅡ는 사람, ㅣ는 땅의 모양', correct: false,
        why: '평평하게 누운 ㅡ가 땅이고, 곧게 선 ㅣ가 사람이다.' }
    ],
    explain: '둥근 ㆍ는 하늘, 평평한 ㅡ는 땅, 곧게 선 ㅣ는 사람을 본떴다. 하늘, 땅, 사람 셋에서 모음 기본 글자의 꼴을 따왔다(상형).',
    hints: ['청동 그릇에 비친 하늘, 발밑의 박석, 네 그림자를 차례로 봐.', 's2.c5'],
    misread: {
      's2.r3.b': [
        { who: 'child', text: '혀 모양이면 ㆍ는 혀끝에 붙은 밥알이에요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '하하, 그건 아니야. 혀와 입 모양을 본뜬 건 자음이고, 모음 ㆍ는 둥근 하늘을 본떴어.', expr: 'smile' }
      ],
      's2.r3.c': [
        { who: 'child', text: 'ㅣ가 땅이면, 땅이 벌떡 일어선 거예요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '그러게, 이상하지? 땅은 평평하게 누운 ㅡ야. 서 있는 사람이 ㅣ고.' }
      ]
    }
  };

  const R4 = {
    id: 's2.r4', kind: 'read', levels: ALL, label: '모음을 만든 방법', ruleCard: 'rule.vowelCompound',
    sentence: 'ㅗ ㅏ ㅜ ㅓ는 기본 글자를 {?} 만들었고, 여기에 ㆍ를 하나 더 합쳐 ㅛ ㅑ ㅠ ㅕ를 만들었다.',
    cards: [
      { id: 's2.r4.a', text: '서로 합쳐(ㆍ와 ㅡ, ㆍ와 ㅣ)', correct: true, why: '' },
      { id: 's2.r4.b', text: '자음처럼 획을 더해', correct: false,
        why: '소리가 세질 때 획을 더한 것은 자음이다. 모음은 기본 글자를 서로 합쳐 만들었다(합성).' },
      { id: 's2.r4.c', text: '쓰지 않고 하나하나 새 모양으로 그려', correct: false,
        why: 'ㅗ를 보면 ㆍ와 ㅡ가 그대로 보인다. 새로 그린 모양이 아니라 기본 글자를 합친 것이다.' }
    ],
    explain: 'ㆍ와 ㅡ를 합쳐 ㅗ ㅜ, ㆍ와 ㅣ를 합쳐 ㅏ ㅓ를 만들었다. 여기에 ㆍ를 하나 더 합치면 ㅛ ㅠ ㅑ ㅕ가 된다. 기본 글자를 합쳐 모음을 만든 것이다(합성).',
    hints: ['아이가 바닥에 찍은 점과 줄을 봐. ㅗ 안에 무엇이 숨어 있지?', 's2.c6'],
    misread: {
      's2.r4.b': [
        { who: 'child', text: '획을 더하면 세지는 거예요? 그럼 ㅛ는 ㅗ보다 힘센 소리예요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '그건 자음 이야기야. 모음은 ㆍ와 ㅡ를 합쳐 ㅗ를 만들고, ㆍ를 하나 더 합쳐 ㅛ를 만들었어.' }
      ],
      's2.r4.c': [
        { who: 'child', text: '새로 그린 모양이면, 이 점은 왜 꼭 여기 붙어 있어요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '좋은 질문이야. 그 점이 바로 ㆍ야. ㅗ는 ㆍ와 ㅡ를 합친 글자거든.', expr: 'smile' }
      ]
    }
  };

  // 고등 핵심(이체). 중학교에서는 맥락 창의 알아 두기로만 보인다(날개 설명).
  const R5 = {
    id: 's2.r5', kind: 'read', levels: ['h1', 'h23'], label: '모양을 달리한 글자 ㆁ ㄹ ㅿ', ruleCard: 'rule.iche',
    sentence: 'ㆁ ㄹ ㅿ은 {?}.',
    cards: [
      { id: 's2.r5.a', text: '가획의 원리를 따르지 않고 모양을 달리해 만든 이체자다', correct: true, why: '' },
      { id: 's2.r5.b', text: '소리가 세져서 획을 더한 가획자다', correct: false, src: 'wrong.icheIsStroke',
        why: '이 셋은 획을 더할수록 소리가 세지는 길을 따르지 않았다. 모양을 달리해 만든 글자다.' },
      { id: 's2.r5.c', text: '스물여덟 자에 들지 않는 덤 글자다', correct: false,
        why: 'ㆁ ㄹ ㅿ은 첫소리 열일곱 자 안에 든다. 28자에 들지 않는 것은 ㅸ처럼 글자를 이어 써서 만든 것이다.' }
    ],
    explain: 'ㆁ ㄹ ㅿ은 겉보기에 획이 더 붙어 있지만, 소리가 세지는 만큼 획을 더한 글자가 아니다. 모양을 달리해 만들었다. 고등학교에서는 이런 글자를 이체자라고 부른다.',
    hints: ['학사의 원고 끝, ㄹ과 ㅿ을 두고 한 말을 다시 들어 봐.', 's2.c1'],
    misread: {
      's2.r5.b': [
        { who: 'scholar', text: '허허, 그럼 ㄹ이 ㄷ보다 센 소리라는 말인가? 원고를 다시 보게.', cg: 'mis_official_confused' },
        { who: 'senior', text: '맞아요. 원고에 ㆁ만은 다르다고 적혀 있었어요. ㄹ과 ㅿ도 모양만 달리했을 뿐 획을 더한 뜻은 없고요.' }
      ],
      's2.r5.c': [
        { who: 'scholar', text: '이 셋을 빼면 첫소리는 열넷뿐일세. 원고에는 열일곱이라 적었는데?', cg: 'mis_official_confused' },
        { who: 'senior', text: '그렇네요. ㆁ ㄹ ㅿ도 스물여덟 자 안에 들어요. 만드는 방법이 달랐을 뿐이에요.' }
      ]
    }
  };

  const R6 = {
    // 중학교는 창제 정신을 스테이지 9(중학교판)에서 핵심으로 다룬다 → 여기서는 고등만 핵심, 중학교는 맥락 창의 알아 두기로 본다(시간 조정, Q2).
    id: 's2.r6', kind: 'read', levels: ['h1', 'h23'], label: '새 글자를 만든 뜻',
    prompt: '임금의 말과 서문 원고를 살피고, 새 글자를 두고 바르게 말한 것을 고르자.',
    cards: [
      { id: 's2.r6.a', text: '임금이 손수 지었고, 글 모르는 백성도 쉽게 익혀 날마다 편히 쓰게 하려는 뜻이 담겼다.', correct: true, why: '' },
      { id: 's2.r6.b', text: '세종은 한자를 없애려고 새 글자를 만들었다.', correct: false, src: 'wrong.abolishHanja',
        why: '서문은 글 모르는 백성이 제 뜻을 펴게 하려는 뜻을 밝힐 뿐, 한자를 버리자고 하지 않는다. 학사들도 해례를 한문으로 썼다.' },
      { id: 's2.r6.c', text: '집현전 학자들이 모여 새 글자를 만들었다.', correct: false, src: 'wrong.scholarsMade',
        why: '서문에서 임금이 스스로 스물여덟 글자를 새로 지었다고 밝힌다. 학자들은 만든 글자의 원리와 쓰임을 풀이한 해례를 지었다.' }
    ],
    explain: '임금은 우리말이 중국말과 달라 한자로는 맞지 않음을 걱정하고(자주), 글 모르는 백성을 딱하게 여겨(애민), 누구나 쉽게 익혀 날마다 쓰게 하려고(실용) 새 글자를 손수 지었다. 학사들은 그 원리를 풀이한 해례를 썼다.',
    hints: ['임금의 말 가운데 "누구나 쉽게 익혀"라는 대목을 떠올려 봐.', 's2.c8'],
    misread: {
      's2.r6.b': [
        { who: 'scholar', text: '한자를 없애다니! 우리가 쓰는 이 해례도 한문인데?', cg: 'mis_official_confused' },
        { who: 'senior', text: '제가 잘못 옮겼어요. 임금께서는 한자를 버리자고 하지 않으셨어요.', expr: 'surprised' },
        { who: 'senior', text: '글 모르는 백성도 제 뜻을 글로 펼 수 있게 하려는 거예요.' }
      ],
      's2.r6.c': [
        { who: 'scholar', text: '우리가 만들었다고? 당치 않네. 우리는 임금께서 지으신 글자를 풀이할 뿐이야.', cg: 'mis_official_confused' },
        { who: 'senior', text: '그렇죠. 서문에도 임금께서 스물여덟 자를 새로 지었다고 나와요.' }
      ]
    }
  };

  /* ---------- 기믹 과제 (letterForge) ---------- */
  const T1_CONFIG = {
    steps: ['shape', 'add', 'odd'],
    shape: { orig: ['O-s2-SANG-G', 'O-s2-SANG-N', 'O-s2-SANG-M', 'O-s2-SANG-S', 'O-s2-SANG-O'] },
    add: { orig: ['O-s2-GAHOEK1', 'O-s2-GAHOEK2'] },
    odd: { orig: ['O-s2-ICHE'] }
  };
  const T1_ANSWER = {
    shape: { g: ['right', 'top'], n: ['bottom', 'left'], m: ['bottom', 'left', 'right', 'top'], s: ['slashL', 'slashR'], o: ['ring'] },
    add: { 'g.1': 'k', 'n.1': 'd', 'n.2': 't', 'm.1': 'b', 'm.2': 'p', 's.1': 'j', 's.2': 'ch', 'o.1': 'q', 'o.2': 'h' },
    odd: ['ng', 'r', 'z']
  };
  function t1(explain) {
    return {
      id: 's2.t1', kind: 'task', levels: ALL, label: '소리를 자음으로',
      prompt: '농부의 말소리를 자음 글자로 바꾸어 보이자. 단면도의 굵은 선을 따라 기본 글자부터.',
      gimmick: 'letterForge', config: T1_CONFIG, answer: T1_ANSWER,
      hints: ['ㄱ은 혀뿌리가 목구멍을 막는 모양이야. 단면도의 굵은 선이 어디서 꺾이는지 봐.', 'shape'],
      explain
    };
  }
  const T1_H = t1('기본 글자 ㄱ ㄴ ㅁ ㅅ ㅇ은 소리 낼 때의 발음 기관 모양을 본떴다(상형). 소리가 세지면 획을 더했다(가획). ㆁ ㄹ ㅿ은 가획의 원리를 따르지 않고 모양을 달리해 만든 이체자다.');
  // 중학교판: '모양을 달리한 글자(이체)'는 날개 설명으로만 보므로(spec §7) 셋째 단계(odd)를 빼고 상형·가획만 한다(시간 조정, Q2).
  const T1_M = Object.assign(t1('기본 글자 ㄱ ㄴ ㅁ ㅅ ㅇ은 소리 낼 때의 발음 기관 모양을 본떴다(상형). 소리가 세지면 획을 더했다(가획). ㆁ ㄹ ㅿ은 겉보기에 획이 더 있지만, 소리가 세져서 획을 더한 글자가 아니라 모양을 달리해 만든 글자다.'), {
    // 가획 줄도 ㄱ·ㄴ·ㅁ 세 줄만(ㄱ→ㅋ, ㄴ→ㄷ→ㅌ, ㅁ→ㅂ→ㅍ). 나머지 줄은 r2 의 풀이·규칙 카드에 그대로 있다.
    // 기믹 창 첫머리의 原文 카드는 줄였다: 상형 원고 다섯 장은 학사 맥락(s2.c1)에 있어 조작판이 바로 보이게 한다(플레이테스트 Q2).
    config: { steps: ['shape', 'add'], shape: {}, add: { chains: ['g', 'n', 'm'], orig: ['O-s2-GAHOEK1'] } },
    answer: { shape: T1_ANSWER.shape, add: { 'g.1': 'k', 'n.1': 'd', 'n.2': 't', 'm.1': 'b', 'm.2': 'p' } }
  });

  const T2 = {
    id: 's2.t2', kind: 'task', levels: ALL, label: '하늘, 땅, 사람으로 모음을',
    prompt: '아낙에게 모음 글자가 생겨난 길을 보여 주자. 기본 글자 셋이 무엇을 본떴는지 고르고, 합쳐서 모음을 만들자.',
    gimmick: 'letterForge',
    config: {
      steps: ['samjae', 'vowel'],
      samjae: { orig: ['O-s2-CHEON', 'O-s2-JI', 'O-s2-IN'] },
      vowel: { orig: ['O-s2-HAP-O', 'O-s2-HAP-A', 'O-s2-JAECHUL'] }
    },
    answer: {
      samjae: { araea: 'sky', eu: 'earth', i: 'person' },
      vowel: { vo: 'eu-up-1', va: 'i-right-1', vu: 'eu-down-1', veo: 'i-left-1',
        vyo: 'eu-up-2', vya: 'i-right-2', vyu: 'eu-down-2', vyeo: 'i-left-2' }
    },
    hints: ['ㅏ는 곧게 선 ㅣ의 오른쪽에 ㆍ가 붙은 꼴이야. ㅣ를 먼저 누르고 ㆍ를 눌러 봐.', 'vowel.va'],
    explain: '둥근 ㆍ는 하늘, 평평한 ㅡ는 땅, 곧게 선 ㅣ는 사람을 본떴다. ㆍ를 ㅡ의 위아래나 ㅣ의 양옆에 하나 합치면 ㅗ ㅜ ㅏ ㅓ, 둘 합치면 ㅛ ㅠ ㅑ ㅕ가 된다(합성).'
  };

  // 중학교판 모음 과제: 합성은 ㅗ ㅏ(ㆍ 하나)와 ㅛ ㅑ(ㆍ 둘) 네 자만 만들어 본다(시간 조정, Q2). 나머지는 r4 의 풀이에 있다.
  const T2_M = Object.assign({}, T2, {
    config: { steps: ['samjae', 'vowel'], samjae: T2.config.samjae, vowel: Object.assign({ targets: ['vo', 'va', 'vyo', 'vya'] }, T2.config.vowel) },
    answer: { samjae: T2.answer.samjae, vowel: { vo: 'eu-up-1', va: 'i-right-1', vyo: 'eu-up-2', vya: 'i-right-2' } },
    explain: '둥근 ㆍ는 하늘, 평평한 ㅡ는 땅, 곧게 선 ㅣ는 사람을 본떴다. ㆍ를 ㅡ의 위나 ㅣ의 오른쪽에 하나 합치면 ㅗ ㅏ, 둘 합치면 ㅛ ㅑ가 된다. ㅜ ㅓ ㅠ ㅕ도 같은 방법으로 합쳐 만들었다(합성).'
  });

  const ITEMS_H = [R1, R2, R3, R4, R5, R6, T1_H, T2];
  const ITEMS_M = [R1, R2, R3, R4, R5, R6, T1_M, T2_M];

  NM.data.SCENES['s2'] = {
    id: 's2',
    title: '스물여덟 자',
    era: '1443~1446 · 궁 안뜰',
    mapKey: 's2',
    bgmKey: 'bgm_s2',
    carveGlyph: 'ㄱ',
    cast: {
      farmer: { name: '늙은 농부', portrait: 'elder' },
      woman: { name: '아낙', portrait: 'commoner_woman' },
      villager: { name: '젊은 백성', portrait: 'commoner_man' },
      scholar: { name: '학사', portrait: 'official' },
      child: { name: '아이', portrait: 'child' }
    },

    intro: [
      { who: 'narrator', text: '궁 안뜰. 정전 앞 박석 마당에 아침 햇살이 내려앉는다.', cg: 's2_intro' },
      { who: 'senior', text: '<@아>, 왔구나. 나는 정음 통사야. 임금께서 지으신 스물여덟 글자를 지금 학사들이 풀이하는 책으로 마무리하고 있어.' },
      { who: 'senior', text: '저기 모인 이들은 글을 몰라 곤란을 겪은 백성들이야. 오늘은 저들에게 새 글자가 어떻게 생겨났는지 보여 줄 거다.' }
    ],

    request: [
      { who: 'farmer', text: '나라에서 농사짓는 법을 책으로 내려 주셨다는데, 글을 모르니 책장만 넘기다 말았소.' },
      { who: 'woman', text: '효자와 열녀 이야기를 그린 책을 받았어요. 그림은 알겠는데, 곁에 쓰인 글은 한 자도 못 읽겠어요.' },
      { who: 'villager', text: '저는 궁문 앞 방에 무슨 금령이 적혔는지 몰라 그만 어겼다가, 크게 혼쭐이 났습니다.' },
      { who: 'senior', text: '<@아>, 소리에서 글자가 어떻게 나오는지 네가 눈앞에서 만들어 보이자.' }
    ],

    encounter: {
      orig: ['O-s2-JJ-GAK'],
      lines: [
        { who: 'senior', text: '해례 첫머리에 이런 말이 있어. 정음 스물여덟 글자는 저마다 무언가의 꼴을 본떠 지었다는 뜻이야.' },
        { who: 'me', text: '꼴을 본떴다고요? 무엇의 꼴을요?', expr: 'thinking' }
      ]
    },

    example: {
      orig: ['O-s2-SANG-G'],
      lines: [
        { who: 'senior', text: '첫 글자 ㄱ부터 풀어 볼게. "가" 하고 소리 내 봐. 혀뿌리가 목구멍 쪽을 막지?' },
        { who: 'me', text: '아, 정말 그래요.', expr: 'surprised' },
        { who: 'senior', text: 'ㄱ은 바로 그 혀뿌리 모양을 옆에서 본 꼴이야. 소리 내는 몸의 모양이 곧 글자가 된 거지.' },
        { who: 'senior', text: '나머지도 이렇게 찾아보자. 원고와 사람들 말을 두 군데씩 살피면 확실해져.' }
      ]
    },

    contexts: [
      {
        id: 's2.c1', label: '왼쪽 행각의 학사 (첫소리 원고)',
        orig: ['O-s2-SANG-G', 'O-s2-SANG-N', 'O-s2-SANG-M', 'O-s2-SANG-S', 'O-s2-SANG-O', 'O-s2-ICHE'],
        lines: [
          { who: 'scholar', text: '첫소리 글자 원고일세. 기본 글자 다섯은 소리 낼 때 혀, 입, 이, 목구멍의 모양을 따랐네.' },
          { who: 'scholar', text: 'ㄴ은 혀끝이 윗잇몸에 닿은 모양, ㅁ은 입, ㅅ은 이, ㅇ은 목구멍 모양이지.' },
          { who: 'scholar', text: 'ㄹ과 ㅿ도 혀와 이를 본떴지만, 모양을 달리했을 뿐 획을 더했다는 뜻은 담지 않았네.' }
        ],
        items: ['s2.r1', 's2.r5']
      },
      {
        id: 's2.c2', label: '늙은 농부',
        lines: [
          { who: 'farmer', text: '"가" 하니 혀뿌리가 목을 콱 막는구먼. 그 모양이 ㄱ이라고?' },
          { who: 'farmer', text: '"카" 하니 숨이 더 세게 터지는데… 그래서 ㄱ에 한 획을 더 그은 거요?' },
          { who: 'senior', text: '입속을 그대로 그린 셈이에요. 소리가 세지면 글자도 한 획 늘어나고요.' }
        ],
        items: ['s2.r1', 's2.r2']
      },
      {
        id: 's2.c3', label: '왼쪽 행각 돌계단의 원고',
        orig: ['O-s2-GAHOEK1', 'O-s2-GAHOEK2'],
        lines: [
          { who: 'narrator', text: '돌계단 위에 원고 한 장이 펼쳐져 있다. ㄱ과 ㅋ, ㄴ ㄷ ㅌ이 줄지어 적혀 있다.' },
          { who: 'senior', text: 'ㅋ은 ㄱ보다 소리가 거세게 나서 획을 하나 더했대. 다른 줄도 같은 생각이고, 끝에는 ㆁ만은 다르다고 적었네.' }
        ],
        items: ['s2.r2', 's2.r5']
      },
      {
        id: 's2.c4', label: '오른쪽 행각의 학사 (가운뎃소리 원고)',
        orig: ['O-s2-CHEON', 'O-s2-JI', 'O-s2-IN'],
        lines: [
          { who: 'scholar', text: '가운뎃소리 기본 글자는 셋일세. 둥근 ㆍ는 하늘, 평평한 ㅡ는 땅, 곧게 선 ㅣ는 사람을 본떴지.' },
          { who: 'scholar', text: '하늘, 땅, 사람에서 꼴을 따왔으니 세상의 세 바탕을 다 담은 셈이네.' }
        ],
        items: ['s2.r3']
      },
      {
        id: 's2.c5', label: '청동 그릇',
        lines: [
          { who: 'narrator', text: '청동 그릇에 고인 물에 둥근 하늘이 비친다. 그릇 아래로는 평평한 박석, 그 위에 <@>의 그림자가 곧게 서 있다.' },
          { who: 'senior', text: '하늘은 둥글고, 땅은 평평하고, 사람은 서 있지. 모음 기본 글자 셋이 바로 이 모양이야.' }
        ],
        items: ['s2.r3']
      },
      {
        id: 's2.c6', label: '소나무 곁의 아이',
        orig: ['O-s2-HAP-O', 'O-s2-HAP-U'],
        lines: [
          { who: 'child', text: '점 하나를 줄 위에 찍으니 "오", 줄 아래에 찍으니 "우"가 돼요!' },
          { who: 'child', text: '점을 둘 찍으면 "요"예요?' },
          { who: 'senior', text: '그렇지. ㆍ와 ㅡ를 합치면 ㅗ, 거기에 ㆍ를 하나 더 합치면 ㅛ야.', expr: 'smile' }
        ],
        items: ['s2.r4']
      },
      {
        id: 's2.c7', label: '오른쪽 행각 돌계단의 원고',
        orig: ['O-s2-HAP-A', 'O-s2-HAP-EO', 'O-s2-JAECHUL'],
        lines: [
          { who: 'narrator', text: '또 다른 원고에는 모음 글자가 둘씩 짝지어 적혀 있다.' },
          { who: 'senior', text: 'ㅏ ㅓ는 ㅣ와 ㆍ를 합친 것이고, ㅑ ㅕ는 ㆍ를 하나 더 합친 거래. ㅗ ㅜ도 마찬가지고.' }
        ],
        items: ['s2.r4']
      },
      {
        id: 's2.c8', label: '정전 계단 위의 임금',
        orig: ['O-s9-HANMUN1', 'O-s9-HANMUN2', 'O-s9-HANMUN3', 'O-s9-HANMUN4'],
        lines: [
          { who: 'sejong', text: '우리말은 중국말과 소리부터 다르니, 한자로 적어서는 말과 글이 서로 맞아떨어지지 않는다.' },
          { who: 'sejong', text: '그래서 글을 모르는 백성은 하고 싶은 말이 있어도 끝내 제 뜻을 펴지 못하는 일이 많다. 나는 그것을 딱하게 여겼다.' },
          { who: 'sejong', text: '그리하여 스물여덟 글자를 새로 지었다. 누구나 쉽게 익혀 날마다 편히 쓰기를 바랄 뿐이다.', expr: 'smile' }
        ],
        items: ['s2.r6']
      },
      {
        id: 's2.c9', label: '왼쪽 월대 앞의 학사 (서문 원고)',
        orig: ['O-s2-JIJ-GAN', 'O-s2-JIJ-ZI'],
        lines: [
          { who: 'scholar', text: '해례 끝에 붙일 글일세. 스물여덟 글자만으로 무엇이든 끝없이 바꾸어 적을 수 있다고 썼지.' },
          { who: 'scholar', text: '슬기로운 이는 아침나절이 가기 전에, 더딘 이도 열흘이면 배운다네. 우리 학사들은 임금께서 지으신 글자를 풀이할 뿐이야.' }
        ],
        items: ['s2.r6']
      }
    ],

    npcs: {
      's2.woman': {
        name: '아낙',
        lines: [{ who: 'woman', text: '새 글자가 정말 내 말소리를 닮았다면, 저도 배울 수 있겠지요?' }]
      },
      's2.villager': {
        name: '젊은 백성',
        lines: [{ who: 'villager', text: '방에 적힌 걸 제 눈으로 읽을 수만 있다면 얼마나 좋을까요.' }]
      }
    },

    items: ITEMS_H,

    notes: [
      { id: 'note.s2.dates', kind: 'know', title: '만든 해와 알린 해',
        text: '새 글자는 1443년에 만들어졌고, 1446년에 해례본과 함께 세상에 알려졌다.',
        src: '리서치 02 §2-3 (창제 1443, 해례와 반포 1446)', at: ['s2.c8', 's2.c9'] },
      { id: 'note.s2.before', kind: 'know', title: '새 글자가 나오기 전',
        text: '새 글자가 나오기 전에는 책도 방도 한자로 적어서, 한자를 배우지 못한 백성은 읽을 수 없었다.',
        src: '리서치 02 §2-3, 중학 국어 2-2 136쪽 (리서치 06 §7-2)', at: ['s2.c2'] }
    ],

    fiction: [
      { id: 'fiction.tongsa', text: '정음 통사: 새 글자로 적은 글을 읽고, 그 뜻을 사람들에게 전해 주는 통역관',
        real: '이런 직책은 없었어요. 이 이야기를 위해 지은 설정이에요.' },
      { id: 'fiction.court', text: '궁 안뜰에 백성들이 모여 새 글자가 생겨난 길을 구경하는 장면',
        real: '이런 일이 있었다는 기록은 없어요. 이야기를 위해 지어낸 장면이에요.' },
      { id: 'fiction.sejong', text: '세종이 통사와 백성에게 건네는 말 가운데 서문에 없는 말',
        real: '그 대사는 지어낸 것이에요. 세종이 새 글자를 만든 뜻은 훈민정음 서문으로 전해져요.' }
    ],

    translate: {
      id: 's2.x1',
      text: '정음 스물여덟 글자는 저마다 무언가의 꼴을 본떠 지었다.',
      // 통역 고르기(js/ui/stage-translate.js): 단면 그림 앞에서 ㅋ을 만든 길(s2.r2 획을 더한 까닭)과
      // 모음 기본 글자의 바탕(s2.r3)을 어떻게 보여 줄지 고른다. 두 항목은 모든 학교급의 핵심 항목이라 학교급마다 같다.
      chooseAt: 1,
      compose: '"가" 할 때의 혀뿌리 모양이 ㄱ, 숨이 세지면 {?} ㅋ이에요. 모음은 {?} 합쳐서 만들어요.',
      choose: [
        {
          id: 's2.i1', item: 's2.r2',
          prompt: '숨이 세게 터지는 ㅋ, 사람들에게 어떻게 만든 글자라고 보여 줄까?',
          options: [
            { id: 's2.i1.a', text: 'ㄱ에 획을 하나 더해 만들었다', part: '획 하나를 더해', correct: true },
            { id: 's2.i1.b', text: 'ㄱ을 두 번 겹쳐 써서 만들었다', part: 'ㄱ을 둘 겹쳐 써서', correct: false,
              reaction: [
                { who: 'me', text: '숨이 세지면 ㄱ을 둘 겹쳐 써서 ㅋ이에요.' },
                { who: 'farmer', cg: 'mis_commoner_puzzled', text: 'ㄱ이 둘이면 "가가" 하고 두 번 소리 내야 하오? 그림 속 ㅋ에는 ㄱ이 하나뿐인데.' },
                { who: 'senior', text: 'ㄱ을 겹쳐 쓰는 건 된소리 ㄲ이야. ㅋ 안에 무엇이 들어 있었는지 해독할 때 본 걸 떠올려 봐.' }
              ] },
            { id: 's2.i1.c', text: 'ㄱ과 상관없이 새 모양으로 따로 만들었다', part: 'ㄱ과 상관없는 새 모양을 그려', correct: false,
              reaction: [
                { who: 'me', text: '숨이 세지면 ㄱ과 상관없는 새 모양을 그려 ㅋ이에요.' },
                { who: 'farmer', cg: 'mis_commoner_puzzled', text: '하나하나 따로 그렸다면 스물여덟 자를 몽땅 따로 외워야겠구먼.' },
                { who: 'senior', text: '소리가 닮은 글자는 모양도 닮았어. 해독할 때 알아낸 걸 떠올려 봐.' }
              ] }
          ]
        },
        {
          id: 's2.i2', item: 's2.r3',
          prompt: '모음의 기본 글자 ㆍ ㅡ ㅣ, 무엇을 본뜬 글자라고 보여 줄까?',
          options: [
            { id: 's2.i2.a', text: '하늘의 둥근 모양, 땅의 평평한 모양, 사람이 선 모양', part: '둥근 하늘 ㆍ, 평평한 땅 ㅡ, 서 있는 사람 ㅣ를', correct: true },
            { id: 's2.i2.b', text: '소리 낼 때의 혀와 입술 모양', part: '혀와 입술 모양을 본뜬 ㆍ ㅡ ㅣ를', correct: false,
              reaction: [
                { who: 'me', text: '모음은 혀와 입술 모양을 본뜬 ㆍ ㅡ ㅣ를 합쳐서 만들어요.' },
                { who: 'child', cg: 'mis_child_laughing', text: '혀 모양이요? 그럼 ㆍ는 혀끝에 붙은 밥알이에요?' },
                { who: 'senior', text: '혀와 입 모양을 본뜬 건 자음이었지. 청동 그릇 앞에서 본 걸 떠올려 봐.' }
              ] },
            { id: 's2.i2.c', text: 'ㆍ는 하늘, ㅡ는 사람, ㅣ는 땅의 모양', part: '둥근 하늘 ㆍ, 누운 사람 ㅡ, 서 있는 땅 ㅣ를', correct: false,
              reaction: [
                { who: 'me', text: '모음은 둥근 하늘 ㆍ, 누운 사람 ㅡ, 서 있는 땅 ㅣ를 합쳐서 만들어요.' },
                { who: 'child', cg: 'mis_child_laughing', text: '땅이 벌떡 서 있어요? 사람은 누워 있고요?' },
                { who: 'senior', text: '땅은 평평하고 사람은 서 있지. 해독할 때 알아낸 걸 떠올려 봐.' }
              ] }
          ]
        }
      ],
      lines: [
        { who: 'narrator', text: '단면 그림 앞에 사람들이 모였다. 임금도 걸음을 멈추고 그림을 들여다본다.', cg: 's2_climax' },
        { who: 'me', text: '보세요. "가" 할 때의 혀뿌리 모양이 ㄱ, 숨이 세지면 획 하나를 더해 ㅋ이에요.' },
        { who: 'me', text: '모음은 둥근 하늘 ㆍ, 평평한 땅 ㅡ, 서 있는 사람 ㅣ를 합쳐서 만들어요.' },
        { who: 'farmer', text: '내 입속 모양이 그대로 글자라니! 이러면 잊을 수가 없겠구먼.' },
        { who: 'sejong', text: '소리 나는 모양을 따라가니 백성이 금세 알아보는구나.', fiction: 'fiction.sejong', expr: 'smile' },
        { who: 'sejong', text: '누구나 쉽게 익혀 날마다 편히 쓰기를 바랐을 뿐이다.' },
        { who: 'senior', text: '<@아>, 오늘 네가 한 일이 바로 정음 통사의 일이야. 소리와 글자 사이를 이어 준 거지.', expr: 'smile' }
      ]
    },

    editions: {
      m: { items: ITEMS_M }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
