'use strict';
/*
 * U1 시험용 고정 데이터 (게임 데이터가 아님 — tests/pages/ui.html 과 u1 점검만 쓴다).
 * 장면 데이터(spec §19-3 모양 일부)·규칙 카드·옛글자 도감·原文 자리.
 * K1·S 작업이 진짜 데이터를 채우기 전에 화면 흐름을 시험하려는 것이다. 원문 글자는 시험용 글이다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
(function (S) {
  if (!S.s0) S.s0 = {
    id: 's0', title: '시험 서장', era: '오늘',
    contexts: [],
    items: [{ id: 's0.t1', kind: 'task', gimmick: 'test', answer: 1, hints: ['힌트', null], explain: '풀이' }]
  };
  if (!S.s2) S.s2 = {
    id: 's2', title: '시험 장면 둘', era: '1446년', carveGlyph: 'ㆍ',
    contexts: [
      { id: 'test.c1', label: '방 앞', items: ['s2.r1'] },
      { id: 'test.c2', label: '우물가', items: ['s2.r1'] }
    ],
    items: [
      { id: 's2.r1', kind: 'read', word: '·[ㅁㆍㄹ][ㅆㆍ]·미', ruleCard: 'rule.araea',
        cards: [
          { id: 's2.r1.a', text: '말씀이', correct: true, why: '시험' },
          { id: 's2.r1.b', text: '물이', correct: false, why: '시험' },
          { id: 's2.r1.c', text: '몰래', correct: false, why: '시험' }
        ],
        hints: ['힌트', 'test.c2'], explain: '풀이' },
      { id: 's2.t1', kind: 'task', gimmick: 'test', answer: 1, hints: ['힌트', null], explain: '풀이' }
    ],
    translate: { lines: [{ id: 's2.tr1', text: '시험으로 옮긴 구절' }] }
  };
  if (!S.s4) S.s4 = {
    id: 's4', title: '시험 장면 넷', era: '1447년', carveGlyph: 'ㆆ',
    contexts: [
      { id: 'test.c1', label: '인쇄소', items: ['s4.r1'] },
      { id: 'test.c3', label: '책상', items: ['s4.r1'] }
    ],
    items: [
      { id: 's4.r1', kind: 'read', word: ':[ㄴㆍ]·[ㄹㆍ]', ruleCard: 'rule.bangjeom',
        cards: [
          { id: 's4.r1.a', text: '나라', correct: true, why: '시험' },
          { id: 's4.r1.b', text: '노래', correct: false, why: '시험' },
          { id: 's4.r1.c', text: '누리', correct: false, why: '시험' }
        ],
        hints: ['힌트', 'test.c3'], explain: '풀이' }
    ],
    translate: [{ id: 's4.tr1', text: '시험 구절 넷' }]
  };
})(NM.data.SCENES);

NM.data.RULE_CARDS = NM.data.RULE_CARDS || {
  'rule.araea': { id: 'rule.araea', name: '아래아', text: '시험용 규칙 문장 하나', stage: 's2' },
  'rule.bangjeom': { id: 'rule.bangjeom', name: '방점', text: '시험용 규칙 문장 둘', stage: 's4' },
  'rule.nomCase': { id: 'rule.nomCase', name: '주격 조사', text: '시험용 규칙 문장 셋', stage: 's6' }
};
NM.data.DOGAM = NM.data.DOGAM || {
  araea: { glyph: 'ㆍ', name: '아래아', note: '시험용 설명', stage: 's2' },
  banchieum: { glyph: 'ㅿ', name: '반치음', note: '시험용 설명', stage: 's3' }
};
NM.data.ORIG = NM.data.ORIG || {};
