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
  cast: {
    teacher: { name: '선생님', portrait: 'teacher_modern' }
  },

  fiction: [
    { id: 'tongsa',
      text: '정음 통사: 새 글자(정음)와 사람들의 말 사이를 이어 주는 통역관.',
      real: '이런 직책은 없었어요. 이 이야기를 위해 지어낸 역할이에요.' }
  ],

  intro: [
    { who: 'narrator', text: '2026년 가을, 국어 시간. 교과서에 실린 「세종어제훈민정음」 사진을 펴 놓은 참이다.', cg: 's0_intro' },
    { who: 'teacher', expr: 'smile', text: '오늘은 오백 년도 더 된 글을 읽어 볼 거예요. 사진 속 글자를 잘 보세요.' },
    { who: 'narrator', text: '그때 사진 속 글자들이 종이에서 떨어져 나와 빛 조각처럼 교실로 흩어졌다.' },
    { who: 'narrator', text: '친구들은 연필을 든 채 그대로 멈춰 있다. 움직이는 사람은 나와 선생님뿐이다.' },
    { who: 'teacher', expr: 'surprised', text: '<@아>, 너도 보이니? 글자가 사진 밖으로 날아갔어!' },
    { who: 'me', expr: 'surprised', text: '저 글자들… 반은 아는 글자인데, 반은 처음 보는 모양이에요.' }
  ],

  request: [
    { who: 'teacher', expr: 'thinking', text: '흩어진 글자를 아는 글자와 모르는 글자로 갈라 보자. 그래야 무엇이 사라졌는지 알 수 있겠어.' },
    { who: 'teacher', text: '교실 곳곳에 실마리가 있을 거야. 펼친 교과서와 책장의 옛 책도 살펴보렴.' }
  ],

  encounter: {
    orig: ['O-s9-SEOMUN1'],
    lines: [
      { who: 'narrator', text: '사진 속 첫 구절이다. 글자가 빠져나간 자리에 흐릿한 자국만 남아 원래 모양을 겨우 알아볼 수 있다.' },
      { who: 'me', expr: 'thinking', text: '나랏말… 뒤는 못 읽겠다. 생긴 것부터 낯선 글자가 섞여 있어.' }
    ]
  },

  example: {
    orig: ['O-s9-SEOMUN2'],
    lines: [
      { who: 'narrator', text: '흩어진 글자 틈에서 낯선 목소리가 들려온다.' },
      { who: 'senior', expr: 'smile', text: '거기 누가 있구나. 나는 새 글자를 사람들에게 옮겨 주는 정음 통사다.', fiction: 'tongsa' },
      { who: 'senior', text: '가르는 법을 보여 주마. ㄱ 은 너희도 지금 쓰지? 그러면 아는 글자 칸이다.' },
      { who: 'senior', expr: 'thinking', text: '이 구절에 여러 번 보이는 둥근 점 ㆍ 은 처음 보지? 스물여덟 자 가운데 하나인데 네가 모르는 걸 보니, 너희 때까지 이어지지 못한 모양이구나. 그런 글자는 모르는 글자 가운데 스물여덟 자 안 칸으로 보낸다.' },
      { who: 'senior', text: '나머지는 네가 해 보아라. 스물여덟 자에 아예 들지 않는 글자도 하나 섞여 있다.' }
    ]
  },

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
      prompt: '흩어진 글자를 아는 글자와 모르는 글자로 갈라 보자.',
      gimmick: 'sortGlyphs',
      config: { glyphs: ['g', 'va', 'z', 'n', 'eu', 'q', 'm', 'bv', 'vo', 'araea', 's', 'ng', 'o'] },
      answer: { g: 'known', va: 'known', z: 'lost', n: 'known', eu: 'known', q: 'lost', m: 'known',
                bv: 'outside', vo: 'known', araea: 'lost', s: 'known', ng: 'lost', o: 'known' },
      hints: ['훈민정음은 스물여덟 자였어. 그 가운데 지금 안 쓰는 글자는 넷뿐이야. 남는 하나는 스물여덟 자 밖이지.', 'outside'],
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
    lines: [
      { who: 'narrator', text: '글자를 다 가르자, 모르는 글자 다섯이 한꺼번에 환하게 빛났다.' },
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
