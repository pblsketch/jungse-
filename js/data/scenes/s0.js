'use strict';
/*
 * 서장 「흩어진 글자」 (spec §7 서장, §4-3, §5-6) — 2026년 국어 시간 교실.
 * - 핵심: 글자 가르기 기믹 과제(sortGlyphs) + 규칙 항목 하나(rule.letters28, 확정하면 수첩에 규칙 카드가 붙는다).
 *   학교급 차이 없음(levels 셋 다). 패 글자 없음. 묶음 계산 밖.
 * - 原文은 블록 id 로만 가리킨다. 서문 8구절에는 ㅿ 이 없으므로 "흩어진 글자가 모두 서문에서 나왔다"고 쓰지 않는다.
 * - ㅸ(28자 밖)은 중학교 교과서 본문이 아니라 지도서 보충에 있다 → 풀이는 짧게, '연서'라는 말은 알아 두기에만.
 * - 끝(통역 자리): 과거로 떨어진다. 중학교·고1은 1443년(기본), 고2~3은 고대(editions.h23.translate). spec §5-6.
 * - 선배 통사는 이 시대에 없으므로 흩어진 글자 틈에서 들리는 목소리로만 나온다(맵에 없음).
 * - 반 친구들은 그림이 없으므로 해설로만 나온다.
 * - 첫 1분 안에 학생이 손을 쓰게: 도입·의뢰는 5쪽(원문과 마주침·선배의 풀이 예시 없음) → 과제 「흩어진 글자」 두 단계
 *   (① ㄱ ㅏ ㆍ 세 글자로 아는/모르는 글자 연습 → 선배의 짧은 한마디 ② 나머지 글자 + 스물여덟 자 안·밖). 긴 설명은 맥락 '선생님'.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s0'] = {
  id: 's0',
  title: '흩어진 글자',
  era: '2026년 교실',
  mapKey: 's0',
  bgmKey: 'bgm_s0',
  startItem: 's0.t1',
  cast: {
    teacher: { name: '선생님', portrait: 'teacher_modern' }
  },

  fiction: [
    { id: 'tongsa',
      text: '정음 통사: 새 글자로 적은 글을 읽고, 그 뜻을 사람들에게 전해 주는 통역관',
      real: '이런 직책은 없었어요. 이 이야기를 위해 지어낸 역할이에요.' }
  ],

  // 첫 조작까지 대사 5쪽(도입 4 + 의뢰 1). 선배의 긴 설명은 학생이 글자를 가른 뒤(과제 단계 대사·맥락 '선생님')로 옮겼다.
  intro: [
    { who: 'narrator', text: '2026년 가을, 국어 시간. 교과서의 「세종어제훈민정음」에서 글자들이 떨어져 나와 교실로 흩어졌다!', cg: 's0_intro' },
    { who: 'narrator', text: '친구들은 연필을 든 채 그대로 멈췄다. 움직이는 사람은 나와 선생님뿐이다.' },
    { who: 'teacher', expr: 'surprised', text: '<@아>, 너도 보이니? 글자가 책 밖으로 날아갔어!' },
    { who: 'senior', text: '글자 틈에서 내 목소리가 들리느냐? 나는 새 글자로 적은 글을 읽어 사람들에게 그 뜻을 전해 주는 정음 통사다.', fiction: 'tongsa' }
  ],

  request: [
    { who: 'senior', expr: 'smile', text: '흩어진 글자를 다시 모아야 한다. 먼저 글자부터 갈라 다오!' }
  ],

  contexts: [
    {
      id: 's0.c1', label: '펼친 교과서',
      orig: ['O-s9-SEOMUN6', 'O-s9-SEOMUN7'],
      lines: [
        { who: 'narrator', text: '위 구절은 임금이 스물여덟 글자를 새로 만들었다고 밝히는 대목이다.' },
        { who: 'me', expr: 'thinking', text: '그런데 아래 구절에는 ㅂ 아래에 ㅇ 이 붙은 글자가 있네. 스물여덟 자를 만들었다면서, 이건 몇 번째 글자지?' }
      ],
      items: ['s0.r1']
    },
    {
      id: 's0.c2', label: '책장의 옛 책',
      orig: ['O-s2-JJ-CHO17', 'O-s2-JUNG11'],
      lines: [
        { who: 'narrator', text: '『훈민정음』 해례본을 본뜬 책이다. 한문으로 글자의 수를 밝혀 두었다.' },
        { who: 'teacher', text: '첫소리 글자는 모두 열일곱, 가운뎃소리 글자는 모두 열하나라고 적었어. 더하면 스물여덟이지.' }
      ],
      items: ['s0.r1']
    },
    {
      id: 's0.c3', label: '선생님',
      lines: [
        { who: 'teacher', expr: 'thinking', text: 'ㆍ ㅿ ㆆ ㆁ 넷은 스물여덟 자에 들었지만 지금은 쓰지 않아. 소리가 바뀌면서 글자도 사라졌지.' },
        { who: 'teacher', text: 'ㅸ 은 달라. ㅂ 아래에 ㅇ 을 이어 써서 만든 글자라서 스물여덟 자에 들지 않아.' },
        { who: 'teacher', expr: 'surprised', text: '그런데 이상하다. ㅿ 은 이 서문 여덟 구절에는 한 번도 안 나오거든. 서문 말고 다른 옛 글에서도 글자가 흘러든 모양이야.' }
      ],
      items: ['s0.r1']
    }
  ],

  items: [
    {
      id: 's0.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '흩어진 글자',
      gimmick: 'sortGlyphs',
      // 두 단계: ① 세 글자만 두 칸(아는 글자 / 모르는 글자) — 연습, 기록에 넣지 않음. 남은 ㆍ 은 저절로 '모르는 글자'로.
      //          ② 나머지 열 글자가 오고 '모르는 글자'가 스물여덟 자 안·밖으로 나뉜다(ㆍ 은 '안'으로 옮겨짐). 제출·판정은 열세 글자 모두.
      config: {
        steps: [
          { glyphs: ['g', 'va', 'araea'], bins: ['known', 'unknown'], rest: 'unknown',
            say: { who: 'senior', text: '지금도 쓰는 글자를 찾아 다오! 찾으면 「아는 글자」 칸에 놓아라.' },
            done: { who: 'senior', expr: 'smile', text: '잘했다! 남은 ㆍ 도 훈민정음 스물여덟 자 가운데 하나다. 지금은 쓰지 않을 뿐이지.' } },
          { glyphs: ['bv', 'z', 'n', 'eu', 'q', 'm', 'vo', 's', 'ng', 'o'],
            say: { who: 'senior', expr: 'thinking', text: 'ㅸ 은 ㅂ 아래에 ㅇ 을 이어 써서 만든 글자라 스물여덟 자에 들지 않는다. 나머지도 갈라 보아라.' } }
        ]
      },
      answer: { g: 'known', va: 'known', araea: 'lost', bv: 'outside', z: 'lost', n: 'known', eu: 'known',
                q: 'lost', m: 'known', vo: 'known', s: 'known', ng: 'lost', o: 'known' },
      hints: ['지금도 쓰는 글자인지부터 보자. 스물여덟 자 가운데 지금 안 쓰는 글자는 넷뿐이야. 남는 하나는 스물여덟 자 밖이지.', 'outside'],
      explain: 'ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자에 들었지만 지금은 쓰지 않는 글자이고, ㅸ 은 ㅂ 아래 ㅇ 을 이어 써서 만든 글자라 스물여덟 자에 들지 않는다.'
    },
    {
      id: 's0.r1', kind: 'read', levels: ['m', 'h1', 'h23'], label: '스물여덟 자',
      prompt: '교실에서 찾은 실마리로 규칙 문장을 완성해 보자.',
      sentence: '훈민정음 스물여덟 자는 첫소리 글자 17자와 가운뎃소리 글자 11자다. {?}',
      ruleCard: 'rule.letters28',
      cards: [
        { id: 's0.r1.a', correct: true,
          text: 'ㆍ ㅿ ㆆ ㆁ 은 그 안에 들지만 지금은 쓰지 않고, ㅸ 은 그 밖의 글자다.' },
        { id: 's0.r1.b', correct: false, src: 'wrong.byeop28',
          text: 'ㅸ 도 스물여덟 자 가운데 하나다.',
          why: '스물여덟 자는 첫소리 17자와 가운뎃소리 11자뿐이다. ㅸ 은 ㅂ 아래에 ㅇ 을 이어 써서 만든 글자라 이 안에 들지 않는다.' },
        { id: 's0.r1.c', correct: false, src: '리서치 03 §2 M3(28자 범위 혼동), spec §7 서장',
          text: '지금 쓰지 않는 ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자 밖의 글자다.',
          why: '지금 안 쓴다고 처음부터 없던 글자는 아니다. ㆍ 는 가운뎃소리 11자에, ㅿ ㆆ ㆁ 은 첫소리 17자에 든다.' }
      ],
      explain: '해례는 첫소리 17자, 가운뎃소리 11자를 밝혔다. 그 가운데 ㆍ ㅿ ㆆ ㆁ 넷은 뒤에 사라졌다. 서문에도 쓰인 ㅸ 은 두 글자를 이어 써서 만든 글자라 스물여덟 자에 들지 않는다.',
      hints: ['책장의 옛 책은 글자 수를 세어 두었고, 선생님은 ㅸ 이 어떻게 만들어졌는지 알고 있어.', 's0.c2'],
      misread: {
        's0.r1.b': [
          { who: 'me', text: '선생님, ㅸ 도 스물여덟 자 가운데 하나래요!' },
          { who: 'teacher', expr: 'surprised', text: '어? 그럼 첫소리 17자에 가운뎃소리 11자, 거기에 ㅸ 까지면 스물아홉 자가 되잖아!' },
          { who: 'teacher', expr: 'thinking', text: 'ㅸ 은 ㅂ 아래에 ㅇ 을 이어 써서 따로 만든 글자야. 스물여덟 자 안에는 들지 않아.' }
        ],
        's0.r1.c': [
          { who: 'me', text: '지금 안 쓰는 ㆍ 같은 글자는 스물여덟 자에 안 들어가는 거죠?' },
          { who: 'teacher', expr: 'surprised', text: '그러면 세종이 만든 글자가 스물넷뿐이었다는 말이 되는걸?' },
          { who: 'teacher', expr: 'smile', text: 'ㆍ 는 가운뎃소리 11자에 들고, ㅿ ㆆ ㆁ 은 첫소리 17자에 들어. 사라진 건 나중 일이야.' }
        ]
      }
    }
  ],

  // 통역 자리 = 과거로 떨어지는 끝 장면. 기본(중학교·고1)은 1443년.
  translate: {
    // 통역 고르기(js/ui/stage-translate.js): 빛나는 다섯 글자를 선생님께 어떻게 알려 줄지 한 번 고른다.
    // 근거는 s0.r1(스물여덟 자) — 모든 학교급의 핵심 항목. 틀린 카드는 s0.r1 의 오답(ㅸ 도 28자 / 안 쓰는 글자는 28자 밖)에서.
    // 고2~3판(editions.h23.translate)도 같은 고르기를 쓴다(이 파일 맨 끝).
    chooseAt: 2,
    compose: '이 다섯 글자는 모두 지금은 안 쓰는 글자예요. {?}.',
    choose: [
      {
        id: 's0.i1', item: 's0.r1',
        prompt: '빛나는 다섯 글자 ㆍ ㅿ ㆆ ㆁ ㅸ, 선생님께 어떻게 알려 줄까?',
        options: [
          { id: 's0.i1.a', text: 'ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자 안, ㅸ 은 그 밖', part: 'ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자에 들고, ㅸ 은 스물여덟 자 밖이에요', correct: true },
          { id: 's0.i1.b', text: 'ㅸ 까지 다섯 모두 스물여덟 자 안', part: 'ㅸ 까지 다섯 모두 스물여덟 자에 들어요', correct: false,
            reaction: [
              { who: 'me', text: '이 다섯 글자는 ㅸ 까지 모두 스물여덟 자에 들어요.' },
              { who: 'teacher', expr: 'surprised', text: '첫소리 17자에 가운뎃소리 11자인데, ㅸ 까지 넣으면 스물아홉 자가 되잖아?' },
              { who: 'senior', text: '글자를 가를 때 ㅸ 을 어느 칸에 놓았는지 떠올려 보아라.' }
            ] },
          { id: 's0.i1.c', text: 'ㆍ ㅿ ㆆ ㆁ 도 ㅸ 처럼 스물여덟 자 밖', part: 'ㆍ ㅿ ㆆ ㆁ 도 ㅸ 처럼 스물여덟 자 밖이에요', correct: false,
            reaction: [
              { who: 'me', text: 'ㆍ ㅿ ㆆ ㆁ 도 ㅸ 처럼 스물여덟 자 밖의 글자예요.' },
              { who: 'teacher', expr: 'surprised', text: '그러면 세종이 만든 글자가 스물넷뿐이었다는 말이 되는걸?' },
              { who: 'senior', text: '지금 안 쓴다고 처음부터 없던 글자는 아니다. 해독할 때 알아낸 것을 떠올려 보아라.' }
            ] }
        ]
      }
    ],
    lines: [
      { who: 'narrator', text: '글자를 다 가르자, 모르는 글자 다섯이 한꺼번에 환하게 빛났다.' },
      { who: 'teacher', expr: 'thinking', text: '<@아>, 저 빛나는 글자 다섯은 어떤 글자야? 네가 갈랐으니 알려 줄래?' },
      { who: 'me', text: '이 다섯 글자는 모두 지금은 안 쓰는 글자예요. ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자에 들고, ㅸ 은 스물여덟 자 밖이에요.' },
      { who: 'senior', text: '잘 갈랐다. 그 글자들이 살아 있던 때로 와 다오. 네 눈이 필요하다.' },
      { who: 'narrator', text: '손바닥에 나무 패 하나가 떨어진다. 통사가 차는 패라고 했다. 아직 아무 글자도 새겨져 있지 않다.' },
      { who: 'teacher', expr: 'surprised', text: '<@아>! 바닥이…!', cg: 's0_climax' },
      { who: 'narrator', text: '흩어진 글자들이 소용돌이가 되어 나를 끌어당긴다. 시간의 물살이다.' },
      { who: 'narrator', text: '물살이 멈춘 곳은 1443년. 새 글자가 막 세상에 나오려는 때다.' }
    ]
  },

  editions: {
    // 고2~3: 고대까지 떨어진다(spec §5-6).
    h23: {
      translate: {
        lines: [
          { who: 'narrator', text: '글자를 다 가르자, 모르는 글자 다섯이 한꺼번에 환하게 빛났다.' },
          { who: 'teacher', expr: 'thinking', text: '<@아>, 저 빛나는 글자 다섯은 어떤 글자야? 네가 갈랐으니 알려 줄래?' },
          { who: 'me', text: '이 다섯 글자는 모두 지금은 안 쓰는 글자예요. ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자에 들고, ㅸ 은 스물여덟 자 밖이에요.' },
          { who: 'senior', text: '잘 갈랐다. 그 글자들이 살아 있던 때로 와 다오. 네 눈이 필요하다.' },
          { who: 'narrator', text: '손바닥에 나무 패 하나가 떨어진다. 통사가 차는 패라고 했다. 아직 아무 글자도 새겨져 있지 않다.' },
          { who: 'teacher', expr: 'surprised', text: '<@아>! 바닥이…!', cg: 's0_climax' },
          { who: 'narrator', text: '흩어진 글자들이 소용돌이가 되어 나를 끌어당긴다. 시간의 물살이다.' },
          { who: 'senior', expr: 'surprised', text: '물살이 너무 세다! 너무 멀리 간다!' },
          { who: 'narrator', text: '물살은 1443년을 지나쳐 더 깊이 떨어진다. 우리 글자가 아직 하나도 없던, 아주 먼 옛날까지.' }
        ]
      }
    }
  }
};

// 고2~3판 통역도 같은 고르기를 쓴다. resolveScene 은 editions 를 얕게 합치므로(translate 를 통째로 바꿈) 그쪽 translate 에도 둔다.
(function (sc) {
  const h = sc.editions.h23.translate;
  h.chooseAt = sc.translate.chooseAt;
  h.compose = sc.translate.compose;
  h.choose = sc.translate.choose;
})(NM.data.SCENES['s0']);
