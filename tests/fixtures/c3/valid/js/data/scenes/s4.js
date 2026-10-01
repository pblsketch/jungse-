'use strict';
/* C3 시험용 장면 데이터 (spec §19-3 모양). 실제 장면 내용이 아니다. */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s4'] = {
  id: 's4',
  title: '견본 장면',
  era: '견본 시대',
  mapKey: 's4',
  bgmKey: 's4',
  carveGlyph: 'ㆍ',
  intro: ['혼자 시작하는 견본 도입입니다.'],
  request: ['견본 의뢰: 이 책을 읽어 주세요.'],
  contexts: [
    { id: 's4.c1', label: '견본 책상', orig: ['O-s4-TST1'], lines: ['책상 위 종이에 [ㄱㆍ]·[ㄴㆍ] 가 적혀 있다.'], items: ['s4.r1'] },
    { id: 's4.c2', label: '견본 간판', lines: ['간판에도 같은 말이 보인다: {견본|견본}'], items: ['s4.r1'] },
    { id: 's4.c3', label: '견본 어르신', lines: ['어르신의 말: 끊어 읽어 보게.'], items: [] }
  ],
  items: [
    {
      id: 's4.r1', kind: 'read', levels: ['h1', 'h23'],
      cards: [
        { id: 's4.r1.a', text: '앞 음절 받침을 뒤 음절 첫소리로 이어 적었다', correct: true },
        { id: 's4.r1.b', text: '글자를 잘못 적었다', correct: false, why: '두 곳에서 같은 방식으로 적혀 있으므로 실수가 아니다.' },
        { id: 's4.r1.c', text: '다른 지방 말이다', correct: false, why: '같은 책 안에서 일관되게 나타난다.' }
      ],
      explain: '견본 풀이: 소리 나는 대로 이어 적었다.',
      hints: ['두 곳의 적힌 모양을 견주어 보세요.', 's4.c2'],
      misread: { 's4.r1.b': ['어르신: 틀린 글자라니, 무슨 말인가?'], 's4.r1.c': ['어르신: 이 고장 말이 맞다네.'] },
      ruleCard: 'rule.fixtureLink'
    },
    {
      id: 's4.t1', kind: 'task', levels: ['h1', 'h23'],
      gimmick: 'split', config: { text: '[ㄱㆍ][ㄴㆍ][ㄷㆍ]' }, answer: [1],
      hints: ['낱말 경계를 찾아보세요.', 1],
      explain: '견본 풀이: 첫 음절 뒤에서 끊는다.'
    }
  ],
  translate: ['견본 통역 장면입니다.'],
  notes: [{ kind: 'know', text: '견본 알아 두기', src: 'https://example.org/fixture/note' }],
  fiction: [{ text: '견본 게임 설정', real: '실제로는 견본이다.' }]
};
