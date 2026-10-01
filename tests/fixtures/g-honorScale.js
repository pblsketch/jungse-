'use strict';
/*
 * G6 점검용 시험 장면 s7 (게임 데이터 아님) — 기믹 '높임 저울'(honorScale)을 실제 장면 진행기 안에서 돌린다(고2~3).
 * - 원문은 블록 id 로만 가리킨다(『석보상절』 권6, 10 문서 O-s7-SS6b · O-s7-SS6h).
 *   SS6b 의 두 자리는 10 문서 '드러나는 항목'(주체 높임 -샤- / 객체 높임 -[ㅿㆍㅂ]-: 높이는 대상 부처, 주어 羅雲)을 따랐다.
 *   SS6h 자리의 인물 이름은 시험 문자열이다(말하는 사람·듣는 사람을 리서치 문서에서 확인하지 않음). 물음·힌트·풀이도 시험 문자열.
 * - 맵: tests/fixtures/maps/g4-test.json
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.SCENES.s7 = {
    id: 's7', title: '시험 장면 높임 저울', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g4-test.json', carveGlyph: '[ㆁ]',
    intro: [{ who: 'senior', text: '시험 도입 줄' }],
    request: [{ who: 'senior', text: '시험 의뢰 줄' }],
    contexts: [
      { id: 'gx.c1', label: '시험 맥락 하나', lines: ['시험 맥락 줄'], items: ['s7.t1', 's7.t2'] },
      { id: 'gx.c2', label: '시험 맥락 둘', lines: ['시험 맥락 줄 둘'], items: [] },
      { id: 'gx.c3', label: '시험 맥락 셋', lines: ['시험 맥락 줄 셋'], items: [] },
      { id: 'gx.c4', label: '시험 맥락 넷', lines: ['시험 맥락 줄 넷'], items: [] }
    ],
    items: [
      {
        id: 's7.t1', kind: 'task', levels: ['h23'], label: '시험 높임 저울 하나', gimmick: 'honorScale',
        config: {
          cast: { writer: { name: '시험 글쓴이' }, buddha: { name: '부처' }, rahula: { name: '{羅|라}{雲|운}' } },
          slots: [
            { id: 'a', block: 'O-s7-SS6b', word: [4, 8], slot: [6, 7], roles: { speaker: 'writer', subject: 'buddha' } },
            { id: 'b', block: 'O-s7-SS6b', word: [8, 12], slot: [10, 11], roles: { speaker: 'writer', subject: 'rahula', object: 'buddha' } }
          ]
        },
        answer: { a: { honored: 'subject', ending: 'sya' }, b: { honored: 'object', ending: 'zab' } },
        hints: ['시험 힌트 하나', { b: ['ending'] }], explain: '시험 풀이 높임 저울'
      },
      {
        id: 's7.t2', kind: 'task', levels: ['h23'], label: '시험 높임 저울 둘', gimmick: 'honorScale',
        config: {
          cast: { p: { name: '시험 화자' }, q: { name: '시험 주체' }, r: { name: '시험 청자' } },
          slots: [{ id: 'c', block: 'O-s7-SS6h', word: [4, 11], slot: [9, 10], roles: { speaker: 'p', subject: 'q', listener: 'r' }, choices: ['si', 'zab', 'ii'] }]
        },
        answer: { c: { honored: 'listener', ending: 'ii' } },
        hints: ['시험 힌트 둘', { c: ['honored'] }], explain: '시험 풀이 둘'
      }
    ],
    translate: { lines: [{ who: 'senior', text: '시험 통역 줄' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
