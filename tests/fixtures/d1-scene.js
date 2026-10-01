'use strict';
/*
 * D1 점검용 시험 장면 (게임 데이터 아님). 장면 데이터 모양은 js/data/scenes/README.md.
 * - 원문 글자는 시험용 문자열이다(실제 원문 아님). NM.data.ORIG 도 시험용으로 채운다.
 * - 같은 모양의 장면을 s6(방점 설정 따름)과 s4(방점 늘 켬)에 등록한다.
 * - 맵: tests/fixtures/maps/d1-test.json (조사 지점 s6.c1~c3, 인물 s6.elder → 맥락 s6.c4)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.ORIG = NM.data.ORIG || {};
  NM.data.RULE_CARDS = NM.data.RULE_CARDS || {};

  NM.data.ORIG['O-test-A'] = {
    title: '시험 원문 가', lines: ['·나랏:[ㅁㆍㄹ][ㅆㆍ]·미', '[ㄱㆍ][ㄹㆍㅁ]·애 {江|강}'], src: 'test fixture', certainty: '◎'
  };
  NM.data.ORIG['O-test-B'] = { title: '시험 원문 나', lines: [':[ㅁㆍㄹ]·이 ·하니'], src: 'test fixture', certainty: '◎' };

  NM.data.RULE_CARDS['rule.fixture'] = { id: 'rule.fixture', name: '시험 규칙', text: '시험 규칙 문장', stage: 's6' };
  NM.data.RULE_CARDS['rule.prev'] = { id: 'rule.prev', name: '앞 규칙', text: '앞 장면에서 배우는 규칙', stage: 's4' };

  function make(sid) {
    const id = (s) => sid + s;
    return {
      id: sid, title: '시험 장면', era: '시험 시대',
      mapKey: 'tests/fixtures/maps/d1-test.json', bgmKey: 'no-such-bgm', carveGlyph: '[ㆍ]',
      cast: { elder: { name: '마을 어른' } },
      intro: [
        { who: 'senior', text: '{@아}, 오늘 일을 시작하자.' },
        { who: 'me', text: '네, 선배님.' }
      ],
      request: [{ who: 'elder', text: '이 글을 읽어 주시오.' }],
      encounter: { orig: ['O-test-A'], lines: [{ who: 'senior', text: '처음 보는 글자들이지?' }] },
      example: { lines: [{ who: 'senior', text: '내가 한 줄 풀어 보마.' }] },
      needs: [{ rule: 'rule.prev', lines: [{ who: 'senior', text: '앞 장면의 규칙을 짧게 알려 줄게.' }] }],
      fiction: [{ id: 'fiction.tongsa', text: '정음 통사', real: '실제 직책이 아니다.' }],
      contexts: [
        { id: id('.c1'), label: '비석', orig: ['O-test-A'], lines: [{ who: 'senior', text: '비석에 글이 있다.' }], items: [id('.r1'), id('.r2')] },
        { id: id('.c2'), label: '간판', orig: ['O-test-B'], lines: ['간판에 같은 말이 보인다.'], items: [id('.r1'), id('.t1')] },
        { id: id('.c3'), label: '책', lines: [{ who: 'elder', text: ':[ㅁㆍㄹ]을 잘 들어 보시오.' }], items: [id('.r2'), id('.r3')] },
        { id: id('.c4'), label: '어른의 말', lines: [{ who: 'elder', text: '내 말을 들어 보시오.' }], items: [id('.r2')] }
      ],
      items: [
        {
          id: id('.r1'), kind: 'read', levels: ['m', 'h1', 'h23'], label: ':[ㅁㆍㄹ]', word: [':[ㅁㆍㄹ]'], gloss: '말',
          cards: [
            { id: id('.r1.a'), text: '마을', correct: false, why: '마을이 아니다.' },
            { id: id('.r1.b'), text: '말', correct: true, why: '' },
            { id: id('.r1.c'), text: '말(馬)', correct: false, why: '짐승이 아니다.' },
            { id: id('.r1.d'), text: '맑음', correct: false, why: '날씨가 아니다.' }
          ],
          explain: '시험 풀이: 말이다.', hints: ['시험 힌트: 사람의 소리를 생각해 봐.', id('.c3')],
          misread: {
            [id('.r1.a')]: [{ who: 'elder', text: '마을이라니, 무슨 소리요?' }],
            [id('.r1.c')]: [{ who: 'elder', text: '짐승 이야기가 아니오!' }],
            [id('.r1.d')]: [{ who: 'elder', text: '날씨 이야기가 아니오!' }]
          }
        },
        {
          id: id('.r2'), kind: 'read', levels: ['m', 'h1', 'h23'], label: '시험 규칙', ruleCard: 'rule.fixture',
          sentence: '이 말은 {?} 뒤에 붙는다.',
          cards: [
            { id: id('.r2.a'), text: '자음', correct: true, why: '' },
            { id: id('.r2.b'), text: '모음', correct: false, why: '모음 뒤가 아니다.' },
            { id: id('.r2.c'), text: '아무 데나', correct: false, why: '자리가 정해져 있다.' }
          ],
          explain: '시험 규칙 풀이.', hints: ['규칙 힌트', id('.c4')],
          misread: { [id('.r2.b')]: [{ who: 'elder', text: '모음이라고?' }] }
        },
        {
          id: id('.r3'), kind: 'read', levels: ['h23'], label: '고등 낱말',
          cards: [
            { id: id('.r3.a'), text: '가', correct: true, why: '' },
            { id: id('.r3.b'), text: '나', correct: false, why: '나가 아니다.' },
            { id: id('.r3.c'), text: '다', correct: false, why: '다가 아니다.' }
          ],
          explain: '고등 낱말 풀이.', hints: ['고등 힌트', id('.c1')], misread: {}
        },
        {
          id: id('.t1'), kind: 'task', levels: ['m', 'h1', 'h23'], label: '시험 과제',
          gimmick: 'd1-test', config: { choices: [1, 2, 3] }, answer: 2,
          hints: ['과제 힌트', 2], explain: '과제 풀이: 2가 맞다.'
        }
      ],
      notes: [
        { id: 'note.1', kind: 'know', text: '알아 두기 시험 문장', src: '시험 출처', at: [id('.c1')] },
        { id: 'note.2', kind: 'variant', text: '이본 노트 시험', at: [id('.c2')] },
        { id: 'note.3', kind: 'interp', text: '해석 시험', at: [id('.c2')] }
      ],
      translate: { id: id('.x1'), lines: [{ who: 'senior', text: '{@이} 통역했다.' }, { who: 'elder', text: '이제 알겠소!' }] }
    };
  }

  NM.data.SCENES.s6 = make('s6');
  NM.data.SCENES.s4 = make('s4');
})(typeof window !== 'undefined' ? window : globalThis);
