'use strict';
/*
 * G8 종합 해독 점검용 시험 장면 s9 (게임 데이터 아님 — 실제 장면은 S9 작업이 쓴다).
 * 原文은 진짜 블록 id 로만 가리킨다. 뜻 카드·현대어 조각·현대어 대목은 시험용 문자열이다.
 * 규칙 카드 목록(K1)이 아직 없으므로 시험용 규칙 카드 둘을 둔다(하나는 수첩에 있게, 하나는 없게 점검한다).
 * 맵: tests/fixtures/maps/g-prefaceDecode.json (조사 지점 s9.c1)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.RULE_CARDS = NM.data.RULE_CARDS || {};
  NM.data.RULE_CARDS['rule.g8known'] = { id: 'rule.g8known', name: '시험 규칙 가', text: '시험 규칙 가의 문장', stage: 's6' };
  NM.data.RULE_CARDS['rule.g8unknown'] = { id: 'rule.g8unknown', name: '시험 규칙 나', text: '시험 규칙 나의 문장', stage: 's4' };

  NM.data.SCENES.s9 = {
    id: 's9', title: '시험 장면 서문', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g-prefaceDecode.json', carveGlyph: '[ㆍ]',
    intro: [{ who: 'sejong', text: '시험을 시작하자.', fiction: true }],
    request: [{ who: 'senior', text: '서문을 읽어 보자.' }],
    contexts: [{ id: 's9.c1', label: '집현전', orig: ['O-s9-SEOMUN1'], lines: ['시험 맥락'], items: ['s9.t1'] }],
    items: [{
      id: 's9.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '종합 해독', gimmick: 'prefaceDecode',
      config: {
        phrases: [
          {
            id: 'p1', orig: 'O-s9-SEOMUN1', hanmun: 'O-s9-HANMUN1',
            words: [{ id: 'p1.w1', match: '나·랏' }, { id: 'p1.w2', match: '{中|[ㄷㅠㆁ]}{國|·귁}·에' }],
            decode: [
              { word: 'p1.w1', rule: 'rule.g8known', cards: [{ id: 'p1.w1.a', text: '시험 뜻 가' }, { id: 'p1.w1.b', text: '시험 뜻 나' }] },
              { word: 'p1.w2', rule: 'rule.g8unknown', cards: [{ id: 'p1.w2.a', text: '시험 뜻 다' }, { id: 'p1.w2.b', text: '시험 뜻 라' }] }
            ],
            pieces: [{ id: 'p1.k1', text: '시험 조각 하나' }, { id: 'p1.k2', text: '시험 조각 둘' }, { id: 'p1.kx', text: '헛조각' }],
            spiritWords: ['p1.w2']
          },
          {
            id: 'p2', orig: 'O-s9-SEOMUN5',
            words: [{ id: 'p2.w1', match: ':어엿·비' }],
            decode: [{ word: 'p2.w1', cards: [{ id: 'p2.w1.a', text: '시험 뜻 마' }, { id: 'p2.w1.b', text: '시험 뜻 바' }] }],
            pieces: [{ id: 'p2.k1', text: '시험 조각 셋' }, { id: 'p2.k2', text: '시험 조각 넷' }],
            spiritWords: ['p2.w1']
          }
        ],
        spirits: ['jaju', 'aemin', 'silyong'],
        modern: [{ id: 'm1', text: '시험 대목 하나' }, { id: 'm2', text: '시험 대목 둘' }, { id: 'm3', text: '시험 대목 셋' }]
      },
      answer: {
        decode: { 'p1.w1': 'p1.w1.a', 'p1.w2': 'p1.w2.a', 'p2.w1': 'p2.w1.a' },
        order: { p1: ['p1.k1', 'p1.k2'], p2: ['p2.k1', 'p2.k2'] },
        spirits: { p1: 'jaju', p2: 'aemin' },
        modernSpirits: { m1: 'jaju', m2: 'aemin', m3: 'none' }
      },
      hints: ['시험 힌트: 규칙 카드를 떠올려 봐.', 'p1'], explain: '시험 풀이: 서문 해독.'
    }, {
      // 고등판에서 config.mode 'modern' 으로 정신 찾기만
      id: 's9.t2', kind: 'task', levels: ['h1', 'h23'], label: '시험 과제 둘', gimmick: 'prefaceDecode',
      config: { mode: 'modern', spirits: [{ id: 'jaju', label: '**자주**' }, 'aemin'], modern: [{ id: 'm1', text: '시험 대목 넷' }] },
      answer: { modernSpirits: { m1: 'jaju' } },
      hints: ['시험 힌트 둘', 'm1'], explain: '시험 풀이 둘.'
    }],
    translate: { lines: [{ who: 'senior', text: '시험 통역 끝.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
