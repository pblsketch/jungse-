'use strict';
/*
 * 장면 9 「나랏말ᄊᆞ미」 (모든 학교급 묶음) — 장면 데이터. 필드 설명: js/data/scenes/README.md
 * - 原文: 「세종어제훈민정음」 서문(『월인석보』 권1, 1459) 8구절 O-s9-SEOMUN1~8과 어제 서문 한문 O-s9-HANMUN1~4.
 *   블록 id 로만 가리킨다(리서치 09 §4-1·§4-2).
 * - 기믹: prefaceDecode (js/gimmicks/README-prefaceDecode.md).
 *   고1·고2~3: 서문을 두 과제로 나눠 푼다(s9.t1 = 1~4구절, s9.t2 = 5~8구절). 구절마다 낱말 풀기 → 현대어 조각 놓기 → 창제 정신.
 *   중학교판(editions.m): 새로 쓴 현대어 서문(리서치 09 '중학교판 현대어 서문', 새로 씀)으로 창제 정신만 찾는다(s9.t3).
 * - SEOMUN6(스물여덟 자를 새로 만듦)은 자료마다 정신 판정이 갈려(09 대응표 '창조', 02 문서 '애민') 채점하지 않는다(noSpirit).
 * - 세종은 1450년에 세상을 떠났으므로 1459년 장면에는 회상 모습으로만 나온다(fiction.sejongMemory). 세종의 대사는 서문의 뜻을 옮긴 말뿐이다.
 * - 현대어 조각·대사·풀이는 모두 새로 쓴 글이다(서문 구절 풀이는 리서치 09 '풀이 · 새로 씀'을 바탕으로 함).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
(function () {
  // 모든 학교급이 함께 쓰는 해독 항목: 누가, 왜 만들었나(규칙 카드 rule.spirit)
  const READ_WHO = {
    id: 's9.r1', kind: 'read', levels: ['m', 'h1', 'h23'], label: '새 글자를 지은 사람과 그 뜻',
    ruleCard: 'rule.spirit',
    prompt: '서문은 새 글자를 누가, 왜 만들었다고 말할까?',
    sentence: '서문의 \'·내\'는 이 글을 쓴 임금 자신이다. 곧 새 글자는 {?}.',
    cards: [
      { id: 's9.r1.a', text: '임금이 글 모르는 백성을 딱하게 여겨 손수 지은 것이다', correct: true },
      { id: 's9.r1.b', text: '집현전 학자들이 모여 지어 바친 것이다', correct: false,
        why: '서문에서 임금이 스스로 \'내가\' 스물여덟 글자를 새로 만들었다고 밝힌다. 학자들은 그 뒤에 글자의 원리와 쓰임을 풀이한 해례를 지었다.', src: 'wrong.scholarsMade' },
      { id: 's9.r1.c', text: '한자를 없애려고 지은 것이다', correct: false,
        why: '서문은 글 모르는 백성이 제 뜻을 펴게 하려는 뜻을 밝힐 뿐, 한자를 버리자고 하지 않는다. 이 책도 한자 옆에 새 글자로 소리를 달아 함께 썼다.', src: 'wrong.abolishHanja' },
      { id: 's9.r1.d', text: '반포되자마자 온 나라에서 널리 쓰인 것이다', correct: false,
        why: '서문은 누구나 쉽게 익혀 날마다 편히 쓰기를 바란다고 말할 뿐이다. 새 글자는 책을 우리말로 옮기는 일과 생활 속 쓰임을 거치며 차츰 퍼졌다.', src: 'wrong.spreadAtOnce' }
    ],
    explain: '서문의 \'·내\'(한문의 \'予\')는 글을 쓴 임금 자신이다. 임금은 글 모르는 백성이 할 말이 있어도 펴지 못하는 것을 딱하게 여겨(\'憫然\') 스물여덟 글자를 새로 만들었다고 밝힌다. 서문에는 우리말이 중국말과 다르다는 자주, 백성을 아끼는 애민, 쉽게 익혀 날마다 쓰게 한다는 실용의 뜻이 담겨 있다.',
    hints: ['서문 속 \'·내\'가 누구인지, 그 사람이 무엇을 했다고 말하는지 살펴보자.', 's9.c3'],
    misread: {
      's9.r1.b': [
        { who: 'official', cg: 'mis_official_confused', text: '학자들이 지어 바쳤다고? 서문에는 임금께서 \'내가 새로 만들었다\'고 적으셨는데, 그렇게 옮기면 임금의 글을 고쳐 쓰는 셈이 되오.' },
        { who: 'senior', text: '신하들이 한 일은 글자의 원리와 쓰는 법을 풀이한 거야. 글자를 만든 사람은 서문을 쓴 임금 자신이지.' }
      ],
      's9.r1.c': [
        { who: 'official', cg: 'mis_official_confused', text: '한자를 없앤다니. 이 책만 해도 한자 옆에 새 글자로 소리를 달아 함께 적었는데, 어디서 그런 말이 나왔소?' },
        { who: 'senior', text: '서문 어디에도 한자를 버리자는 말은 없어. 글 모르는 백성도 제 뜻을 펴게 하려는 것이 서문이 밝힌 까닭이야.' }
      ],
      's9.r1.d': [
        { who: 'official', cg: 'mis_official_confused', text: '온 나라에 이미 널리 퍼졌다면, 내가 지금 이 책을 이렇게 애써 엮을 까닭이 있겠소?' },
        { who: 'senior', text: '서문은 누구나 쉽게 익혀 날마다 편히 쓰기를 \'바란다\'고 했어. 새 글자는 이런 책들과 생활 속 쓰임을 거치며 차츰 퍼져 나갔어.' }
      ]
    }
  };

  const SPIRITS = ['jaju', 'aemin', 'silyong'];

  // 고1·고2~3 과제 ①: 1~4구절 (자주·애민)
  const TASK_FRONT = {
    id: 's9.t1', kind: 'task', levels: ['h1', 'h23'], label: '서문 해독 ① 첫째~넷째 구절', gimmick: 'prefaceDecode',
    prompt: '흩어진 서문의 앞 네 구절을 풀어 지금 말로 옮기고, 창제 정신이 드러난 구절을 찾아보자.',
    config: {
      spirits: SPIRITS,
      phrases: [
        { id: 'p1', orig: 'O-s9-SEOMUN1', hanmun: 'O-s9-HANMUN1',
          words: [{ id: 'p1.w2', match: ':말[ㅆㆍ]·미' }, { id: 'p1.w3', match: '{中|[ㄷㅠㆁ]}{國|·귁}·에' }],
          decode: [
            { word: 'p1.w2', rule: 'rule.meaningChange', cards: [{ id: 'p1.w2.a', text: '말이' }, { id: 'p1.w2.b', text: '말씀(높임말)이' }] },
            { word: 'p1.w3', cards: [{ id: 'p1.w3.a', text: '중국과 견주어' }, { id: 'p1.w3.b', text: '중국 땅에서' }] }
          ],
          pieces: [{ id: 'p1.k1', text: '우리나라의 말소리는' }, { id: 'p1.k2', text: '중국 말과' }, { id: 'p1.k3', text: '같지 않아서' }, { id: 'p1.kx', text: '중국 땅에서' }],
          spiritWords: ['p1.w3'] },
        { id: 'p2', orig: 'O-s9-SEOMUN2', hanmun: 'O-s9-HANMUN1',
          words: [{ id: 'p2.w1', match: '[ㅅㆍ][ㅁㆍㅅ]·디' }],
          decode: [
            { word: 'p2.w1', cards: [{ id: 'p2.w1.a', text: '통하지' }, { id: 'p2.w1.b', text: '마음에 사무치지' }] }
          ],
          pieces: [{ id: 'p2.k1', text: '한자로 적어서는' }, { id: 'p2.k2', text: '서로 뜻이' }, { id: 'p2.k3', text: '막힘없이 오가지 못한다.' }, { id: 'p2.kx', text: '가슴 깊이 사무치지 못한다.' }],
          spiritWords: ['p2.w1'] },
        { id: 'p3', orig: 'O-s9-SEOMUN3', hanmun: 'O-s9-HANMUN2',
          words: [{ id: 'p3.w1', match: '어·린' }],
          decode: [
            { word: 'p3.w1', rule: 'rule.meaningChange', cards: [{ id: 'p3.w1.a', text: '어리석은' }, { id: 'p3.w1.b', text: '나이가 어린' }] }
          ],
          pieces: [{ id: 'p3.k1', text: '그 때문에' }, { id: 'p3.k2', text: '어리석은 백성은' }, { id: 'p3.k3', text: '하고 싶은 이야기가 있더라도' }, { id: 'p3.kx', text: '나이 어린 백성은' }],
          spiritWords: ['p3.w1'] },
        { id: 'p4', orig: 'O-s9-SEOMUN4', hanmun: 'O-s9-HANMUN2',
          words: [{ id: 'p4.w1', match: '·노·미' }, { id: 'p4.w2', match: '하·니·라' }],
          decode: [
            { word: 'p4.w1', rule: 'rule.meaningChange', cards: [{ id: 'p4.w1.a', text: '사람이' }, { id: 'p4.w1.b', text: '남을 낮춰 부르는 놈이' }] },
            { word: 'p4.w2', rule: 'rule.meaningChange', cards: [{ id: 'p4.w2.a', text: '많다' }, { id: 'p4.w2.b', text: '(무엇을) 한다' }] }
          ],
          pieces: [{ id: 'p4.k1', text: '끝내 제 속뜻을' }, { id: 'p4.k2', text: '글로 드러내지 못하는 이가' }, { id: 'p4.k3', text: '많다.' }, { id: 'p4.kx', text: '그렇게 한다.' }],
          spiritWords: ['p4.w1'] }
      ]
    },
    answer: {
      decode: { 'p1.w2': 'p1.w2.a', 'p1.w3': 'p1.w3.a', 'p2.w1': 'p2.w1.a', 'p3.w1': 'p3.w1.a', 'p4.w1': 'p4.w1.a', 'p4.w2': 'p4.w2.a' },
      order: {
        p1: ['p1.k1', 'p1.k2', 'p1.k3'], p2: ['p2.k1', 'p2.k2', 'p2.k3'],
        p3: ['p3.k1', 'p3.k2', 'p3.k3'], p4: ['p4.k1', 'p4.k2', 'p4.k3']
      },
      spirits: { p1: 'jaju', p2: 'jaju', p3: 'aemin', p4: 'aemin' }
    },
    hints: ['곁에 보이는 규칙 카드와 \'한문 원문 보기\'를 함께 펴 놓고 풀어 보자. 지금 뜻으로 읽으면 안 되는 말이 숨어 있어.', 'p1'],
    explain: '첫째, 둘째 구절은 우리말이 중국말과 달라 한자로는 서로 뜻이 통하지 않는다고 말한다(자주). \':말[ㅆㆍ]·미\'는 높임 없는 \'말이\', \'{中|[ㄷㅠㆁ]}{國|·귁}·에\'의 \'에\'는 견주는 대상, \'[ㅅㆍ][ㅁㆍㅅ]·디\'는 \'통하지\'다. 셋째, 넷째 구절은 글 모르는 백성이 할 말이 있어도 끝내 펴지 못하는 일이 많다고 말한다(애민). \'어·린\'은 \'어리석은\', \'·노·미\'는 \'사람이\', \'하·니·라\'는 \'많다\'는 뜻이다.'
  };

  // 고1·고2~3 과제 ②: 5~8구절 (애민·실용, 6구절은 정신 채점 안 함)
  const TASK_BACK = {
    id: 's9.t2', kind: 'task', levels: ['h1', 'h23'], label: '서문 해독 ② 다섯째~여덟째 구절', gimmick: 'prefaceDecode',
    prompt: '서문의 뒤 네 구절을 풀어 지금 말로 옮기고, 창제 정신이 드러난 구절을 찾아보자.',
    config: {
      spirits: SPIRITS,
      phrases: [
        { id: 'p5', orig: 'O-s9-SEOMUN5', hanmun: 'O-s9-HANMUN3',
          words: [{ id: 'p5.w1', match: ':어엿·비' }],
          decode: [
            { word: 'p5.w1', rule: 'rule.meaningChange', cards: [{ id: 'p5.w1.a', text: '불쌍히(가엾게)' }, { id: 'p5.w1.b', text: '예쁘게' }] }
          ],
          pieces: [{ id: 'p5.k1', text: '나는 이것을' }, { id: 'p5.k2', text: '가엾고 딱하게 여겨' }, { id: 'p5.kx', text: '예쁘고 귀엽게 여겨' }],
          spiritWords: ['p5.w1'] },
        { id: 'p6', orig: 'O-s9-SEOMUN6', hanmun: 'O-s9-HANMUN3', noSpirit: true,
          words: [{ id: 'p6.w1', match: '[ㅁㆎㆁ]·[ㄱㆍ]노·니' }],
          decode: [
            { word: 'p6.w1', cards: [{ id: 'p6.w1.a', text: '만드니' }, { id: 'p6.w1.b', text: '모아 엮으니' }] }
          ],
          pieces: [{ id: 'p6.k1', text: '스물여덟 글자를' }, { id: 'p6.k2', text: '새로 지었다.' }, { id: 'p6.kx', text: '모아 엮었다.' }] },
        { id: 'p7', orig: 'O-s9-SEOMUN7', hanmun: 'O-s9-HANMUN4',
          words: [{ id: 'p7.w1', match: '·[ㅄㅜ]·메' }],
          decode: [
            { word: 'p7.w1', rule: 'rule.nominalOm', cards: [{ id: 'p7.w1.a', text: '쓰는 데(씀에)' }, { id: 'p7.w1.b', text: '쓰면서' }] }
          ],
          pieces: [{ id: 'p7.k1', text: '누구나 손쉽게 배워' }, { id: 'p7.k2', text: '하루하루 쓰는 데' }, { id: 'p7.kx', text: '하루하루 쓰면서' }],
          spiritWords: ['p7.w1'] },
        { id: 'p8', orig: 'O-s9-SEOMUN8', hanmun: 'O-s9-HANMUN4',
          words: [{ id: 'p8.w1', match: '[ㅼㆍ][ㄹㆍ]·미니·라' }],
          decode: [
            { word: 'p8.w1', rule: 'rule.linkedWriting', cards: [{ id: 'p8.w1.a', text: '따름이다' }, { id: 'p8.w1.b', text: '딸이다' }] }
          ],
          pieces: [{ id: 'p8.k1', text: '불편함이 없기를' }, { id: 'p8.k2', text: '바랄 뿐이다.' }],
          spiritWords: ['p8.w1'] }
      ]
    },
    answer: {
      decode: { 'p5.w1': 'p5.w1.a', 'p6.w1': 'p6.w1.a', 'p7.w1': 'p7.w1.a', 'p8.w1': 'p8.w1.a' },
      order: { p5: ['p5.k1', 'p5.k2'], p6: ['p6.k1', 'p6.k2'], p7: ['p7.k1', 'p7.k2'], p8: ['p8.k1', 'p8.k2'] },
      spirits: { p5: 'aemin', p7: 'silyong', p8: 'silyong' }
    },
    hints: ['\'어엿브다\'의 옛 뜻과, \'쓰다\'에 \'-움\'이 붙은 꼴을 떠올려 보자. 여섯째 구절은 창제 정신을 고르지 않아도 돼.', 'p5'],
    explain: '다섯째 구절은 임금이 그 백성들을 가엾게 여겼다는 말이다(애민). \':어엿·비\'는 \'불쌍히\'다. 여섯째 구절은 스물여덟 글자를 새로 만들었다는 말인데, 자료에 따라 창조로도 애민으로도 묶여 여기서는 정신을 고르지 않는다. 일곱째, 여덟째 구절은 누구나 쉽게 익혀 날마다 편히 쓰기를 바란다는 말이다(실용). \'·[ㅄㅜ]·메\'는 \'[ㅄㅡ]-\'에 \'-움\'과 \'에\'가 붙은 꼴(씀에)이고, \'[ㅼㆍ][ㄹㆍ]·미니·라\'는 \'[ㅼㆍ][ㄹㆍㅁ]\'에 \'이니라\'가 이어 적힌 꼴(따름이다)이다.'
  };

  // 중학교판 과제: 새로 쓴 현대어 서문으로 창제 정신 찾기(리서치 09 '중학교판 현대어 서문', 새로 씀)
  const TASK_MODERN = {
    id: 's9.t3', kind: 'task', levels: ['m'], label: '창제 정신 찾기', gimmick: 'prefaceDecode',
    prompt: '지금 말로 다시 쓴 서문을 대목마다 읽고, 어떤 창제 정신이 드러나는지 골라 보자.',
    config: {
      mode: 'modern',
      spirits: SPIRITS,
      modern: [
        { id: 'm1', text: '우리말은 중국말과 소리부터 다르다.' },
        { id: 'm2', text: '그런데 글은 중국 글자인 한자를 빌려 써 왔으니, 말과 글이 서로 맞아떨어지지 않는다.' },
        { id: 'm3', text: '그래서 글을 배우지 못한 백성은 꼭 하고 싶은 말이 있어도 끝내 그 마음을 글로 펼쳐 보이지 못하는 일이 많다.' },
        { id: 'm4', text: '나는 그것이 늘 안타까웠다.' },
        { id: 'm5', text: '그래서 스물여덟 글자를 새로 만들었다.', noSpirit: true },
        { id: 'm6', text: '누구든 쉽게 배워 날마다 편하게 쓰기를 바랄 뿐이다.' }
      ]
    },
    answer: { modernSpirits: { m1: 'jaju', m2: 'jaju', m3: 'aemin', m4: 'aemin', m6: 'silyong' } },
    hints: ['누구를 위해서, 무엇이 문제여서, 어떻게 쓰이기를 바랐는지 나눠 보자.', 'm4'],
    explain: '첫 두 대목은 우리말이 중국말과 달라 남의 글자로는 맞지 않는다는 생각이다(자주). 셋째, 넷째 대목은 글을 배우지 못해 제 뜻을 펴지 못하는 백성을 안타깝게 여긴 마음이다(애민). 마지막 대목은 누구나 쉽게 배워 날마다 편히 쓰기를 바라는 뜻이다(실용). 스물여덟 글자를 만들었다는 대목은 자료마다 묶는 방식이 달라 여기서는 고르지 않는다.'
  };

  const FULL_MODERN_H = '우리나라의 말소리는 중국 말과 같지 않아서, 한자로 적어서는 서로 뜻이 막힘없이 오가지 못한다. 그 때문에 어리석은 백성은 하고 싶은 이야기가 있더라도 끝내 제 속뜻을 글로 드러내지 못하는 이가 많다. 나는 이것을 가엾고 딱하게 여겨 스물여덟 글자를 새로 지었다. 누구나 손쉽게 배워 하루하루 쓰는 데 불편함이 없기를 바랄 뿐이다.';
  const FULL_MODERN_M = '우리말은 중국말과 소리부터 다르다. 그런데 글은 중국 글자인 한자를 빌려 써 왔으니, 말과 글이 서로 맞아떨어지지 않는다. 그래서 글을 배우지 못한 백성은 꼭 하고 싶은 말이 있어도 끝내 그 마음을 글로 펼쳐 보이지 못하는 일이 많다. 나는 그것이 늘 안타까웠다. 그래서 스물여덟 글자를 새로 만들었다. 누구든 쉽게 배워 날마다 편하게 쓰기를 바랄 뿐이다.';

  NM.data.SCENES['s9'] = {
    id: 's9',
    title: '나랏말[ㅆㆍ]미',
    era: '1459년 · 책을 엮는 전각',
    mapKey: 's9',
    bgmKey: 'bgm_s9',
    carveGlyph: '정',
    cast: {
      official: { name: '책을 엮는 관원', portrait: 'official' }
    },

    fiction: [
      { id: 'fiction.tongsa', text: '정음 통사: 새 글자로 적힌 말과 사람들의 말 사이를 잇는 통역관', real: '이런 이름의 직책은 없었다. 이 이야기를 위해 지어낸 역할이다.' },
      { id: 'fiction.scattered', text: '흩어진 서문을 처음부터 끝까지 읽어 내면 돌아갈 길이 열린다', real: '이야기를 위해 지어낸 설정이다. 실제 서문은 『월인석보』 권1 첫머리에 실려 전한다.' },
      { id: 'fiction.sejongMemory', text: '세종의 회상 모습: 서문이 다 모이자 빛 속에 떠오른 세종', real: '세종은 1450년에 세상을 떠났다. 『월인석보』가 나온 1459년에는 살아 있지 않았으니, 이 장면의 세종은 이야기를 위해 그린 회상 모습이다. 세종의 말은 서문의 뜻을 옮긴 것이다.' }
    ],

    intro: [
      { who: 'narrator', text: '1459년, 새 책 『월인석보』를 엮는 큰 마루방. 열린 창으로 바람이 들이치자 책장들이 하얗게 흩날린다.', cg: 's9_intro' },
      { who: 'senior', text: '<@아>, 저 종이들 좀 잡아! 책 맨 앞에 실을 서문이야.' },
      { who: 'me', text: '서문이요? 교과서에서 보다가 글자가 눈앞에서 흩어졌던, 그 서문이요?' },
      { who: 'senior', text: '맞아. 세종 임금이 손수 지은 「세종어제훈민정음」 서문이야. 처음부터 끝까지 읽어 내면 돌아갈 길이 보일 거야.' }
    ],

    request: [
      { who: 'official', text: '통사들, 마침 잘 왔소. 이 서문을 책 맨 앞에 실어야 하는데, 바람에 책장이 다 흩어져 버렸소.' },
      { who: 'official', text: '구절마다 뜻을 쉬운 말로 풀어 처음부터 끝까지 읽어 주시오. 글을 처음 배우는 이들에게도 들려줄 수 있게 말이오.' }
    ],

    encounter: {
      orig: ['O-s9-SEOMUN1'],
      lines: [
        { who: 'senior', text: '첫 장은 단 위 서안에 떨어져 있었어. 서문의 첫 구절이야.' },
        { who: 'me', text: '교과서 맨 위에서 본 글자예요. 그런데 다시 보니 읽을 수 있을 것 같기도 하고, 아닌 것 같기도 하고….' }
      ]
    },

    example: {
      orig: ['O-s9-SEOMUN1', 'O-s9-HANMUN1'],
      lines: [
        { who: 'senior', text: '첫머리는 내가 풀어 볼게. \'나·랏\'은 \'나라\'에 관형격 조사 \'ㅅ\'이 붙은 말이야. \'나라의\'라는 뜻이지.' },
        { who: 'senior', text: '아래 한문은 같은 대목을 한문으로 적은 거야. \'國之語音\', 곧 나라의 말소리. 언해와 한문을 견주면 뜻을 확인하기 좋아.' },
        { who: 'senior', text: '그다음 \':말[ㅆㆍ]·미\'와 \'{中|[ㄷㅠㆁ]}{國|·귁}·에\'부터는 <@이> 풀어 봐. 이 \'·에\'는 견주는 대상을 나타내기도 하니 장소로만 읽지 마.' }
      ]
    },

    needs: [
      { rule: 'rule.meaningChange', lines: [
        { who: 'senior', text: '서문에는 모양은 지금과 비슷한데 뜻이 달랐던 말이 여럿 나와. 지금 뜻으로 읽으면 엉뚱하게 옮기게 되니 조심해.' }
      ] },
      { rule: 'rule.nominalOm', lines: [
        { who: 'senior', text: '이 시대에는 \'-옴/-움\'을 붙여 움직임을 나타내는 말을 명사처럼 썼어. \'쓰다\'라면 \'씀\'에 해당하는 꼴이 되지.' }
      ] }
    ],

    contexts: [
      {
        id: 's9.c1', label: '단 위 서안',
        orig: ['O-s9-SEOMUN1', 'O-s9-SEOMUN2', 'O-s9-HANMUN1'],
        lines: [
          '단 위 서안에 서문의 첫 장과 같은 대목의 한문이 놓여 있다.',
          { who: 'senior', text: '흩어진 서문을 다 읽고 나면, 여기서 처음부터 끝까지 이어 읽자.' }
        ],
        items: []
      },
      {
        id: 's9.c2', label: '바닥에 떨어진 서문 종이',
        orig: ['O-s9-SEOMUN5', 'O-s9-SEOMUN6'],
        lines: [
          { who: 'senior', text: '다섯째와 여섯째 구절이 적힌 종이야. 맨 앞의 \'·내\'는 이 글을 쓴 사람 자신, 곧 임금이야.' },
          { who: 'senior', text: '임금이 스스로 \'내가\' 무엇을 했다고 말하는지 살펴봐.' }
        ],
        items: ['s9.r1']
      },
      {
        id: 's9.c3', label: '왼쪽 서안의 한문 책',
        orig: ['O-s9-HANMUN3'],
        lines: [
          { who: 'senior', text: '같은 대목을 한문으로 적은 거야. 맨 앞의 \'予\'는 \'나\'라는 뜻이고, \'憫然\'은 딱하게 여긴다는 뜻이야.' },
          { who: 'senior', text: '\'新制\'는 새로 만들었다는 말이지. 누가, 왜 만들었는지 한문으로도 확인할 수 있어.' }
        ],
        items: ['s9.r1']
      },
      {
        id: 's9.c4', label: '책을 엮는 관원',
        lines: [
          { who: 'official', text: '새 글자는 임금께서 손수 지으셨소. 신하들은 그 뒤에 글자를 만든 원리와 쓰는 법을 풀이한 책을 엮었지.' },
          { who: 'official', text: '이 책도 한자 옆에 새 글자로 소리를 달아 함께 적었소.' }
        ],
        items: ['s9.r1']
      },
      {
        id: 's9.c5', label: '오른쪽 서안의 서문 종이',
        orig: ['O-s9-SEOMUN3', 'O-s9-SEOMUN4', 'O-s9-HANMUN2'],
        lines: [
          { who: 'senior', text: '셋째와 넷째 구절, 그리고 같은 대목의 한문이야. 한문의 \'愚民\'은 어리석은 백성, \'多矣\'는 많다는 뜻이지.' },
          { who: 'senior', text: '임금이 누구의 어떤 처지를 마음에 걸려 했는지 보여.' }
        ],
        items: ['s9.r1']
      }
    ],

    npcs: {
      senior: {
        name: '선배 통사',
        lines: [
          { who: 'senior', text: '바닥과 서안 위의 종이, 관원의 말을 둘러봐. 맥락을 두 곳 살피면 확정할 수 있어.' }
        ]
      }
    },

    items: [READ_WHO, TASK_FRONT, TASK_BACK],

    translate: {
      id: 's9.x1', at: 's9.c1', text: FULL_MODERN_H,
      lines: [
        { who: 'narrator', text: '여덟 장의 서문이 단 위 서안에 차례대로 놓였다. 마지막 장을 내려놓자 종이들이 금빛으로 빛나며 한 권의 책처럼 모여든다.', cg: 's9_climax' },
        { who: 'senior', text: '<@아>, 이제 처음부터 끝까지 이어 읽어 봐.' },
        { who: 'me', text: '우리나라의 말소리는 중국 말과 같지 않아서, 한자로 적어서는 서로 뜻이 막힘없이 오가지 못한다…' },
        { who: 'narrator', text: '빛 속에서 붉은 옷을 입은 사람의 모습이 어렴풋이 떠오른다.', fiction: 'fiction.sejongMemory' },
        { who: 'sejong', text: '나는 이것을 가엾게 여겨 스물여덟 글자를 새로 만들었다. 누구나 쉽게 익혀 날마다 편히 쓰기를 바랄 뿐이다.' },
        { who: 'narrator', text: '빛이 잦아들자 모습도 사라지고, 서안 위에는 가지런히 묶인 서문만 남았다.' },
        { who: 'senior', expr: 'smile', text: '자주, 애민, 실용. 서문 여덟 구절에 담긴 뜻을 <@이> 처음부터 끝까지 읽어 냈어. 이제 돌아갈 길이 열릴 거야.' }
      ]
    },

    editions: {
      // 중학교판: 중세 원문 해독은 고1부터(리서치 06 §6-1). 새로 쓴 현대어 서문으로 창제 정신만 찾는다.
      m: {
        request: [
          { who: 'official', text: '통사들, 마침 잘 왔소. 이 서문을 책 맨 앞에 실어야 하는데, 바람에 책장이 다 흩어져 버렸소.' },
          { who: 'senior', text: '옛 글자를 한 자 한 자 풀려면 시간이 걸려. 오늘은 내가 지금 말로 다시 써 둔 서문으로 읽어 보자. 원래 글은 곁에 함께 둘게.' },
          { who: 'official', text: '흩어진 서문을 처음부터 끝까지 읽어 내 주시오. 임금께서 어떤 뜻으로 글자를 만드셨는지 알아야 책을 바로 엮을 수 있소.' }
        ],
        encounter: {
          orig: ['O-s9-SEOMUN1'],
          lines: [
            { who: 'senior', text: '이게 서문의 첫 구절이야. 교과서 사진에서 본 글자지? 지금 말로 하면 \'우리말은 중국말과 소리부터 다르다\'쯤 돼.' }
          ]
        },
        example: {
          lines: [
            { who: 'senior', text: '서문에는 새 글자를 만든 까닭이 세 갈래로 담겨 있어. 첫째, 우리말이 중국말과 다르니 우리 말에 맞는 글자가 있어야 한다는 생각. 이것을 자주 정신이라고 해.' },
            { who: 'senior', text: '나머지 두 갈래, 백성을 아끼는 마음과 쉽게 쓰게 하려는 뜻은 <@이> 서문을 읽으며 찾아봐.' }
          ]
        },
        needs: [],
        items: [READ_WHO, TASK_MODERN],
        translate: {
          id: 's9.x1', at: 's9.c1', text: FULL_MODERN_M,
          lines: [
            { who: 'narrator', text: '여덟 장의 서문이 단 위 서안에 차례대로 놓였다. 마지막 장을 내려놓자 종이들이 금빛으로 빛나며 한 권의 책처럼 모여든다.', cg: 's9_climax' },
            { who: 'senior', text: '<@아>, 이제 처음부터 끝까지 이어 읽어 봐.' },
            { who: 'me', text: '우리말은 중국말과 소리부터 다르다. 그런데 글은 중국 글자인 한자를 빌려 써 왔으니…' },
            { who: 'narrator', text: '빛 속에서 붉은 옷을 입은 사람의 모습이 어렴풋이 떠오른다.', fiction: 'fiction.sejongMemory' },
            { who: 'sejong', text: '나는 이것을 가엾게 여겨 스물여덟 글자를 새로 만들었다. 누구나 쉽게 익혀 날마다 편히 쓰기를 바랄 뿐이다.' },
            { who: 'official', text: '방금 그 말씀은, 서문의 뜻 그대로가 아니오?' },
            { who: 'narrator', text: '빛이 잦아들자 모습도 사라지고, 서안 위에는 가지런히 묶인 서문만 남았다.' },
            { who: 'senior', expr: 'smile', text: '자주, 애민, 실용. 서문에 담긴 세 가지 뜻을 <@이> 찾아냈어. 이제 돌아갈 길이 열릴 거야.' }
          ]
        }
      }
    }
  };
})();
