'use strict';
/*
 * G5 점검용 시험 장면 s4 (게임 데이터 아님) — 기믹 '끊어 읽기'(wordCut)를 실제 장면 진행기 안에서 돌린다(s4 는 방점 늘 켬).
 * - 원문은 블록 id 로만 가리킨다(「용비어천가」 제2장·제34장, 10 문서). 정답 끊기 자리는 블록의 통용 띄어쓰기에서 셌다
 *   (README-wordCut.md 의 블록별 표와 같다 — tests/unit/g5-wordCut.mjs 가 맞대 본다). 물음·힌트·풀이·견주기 메모는 시험 문자열이다.
 * - 맵: tests/fixtures/maps/g4-test.json
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.SCENES.s4 = {
    id: 's4', title: '시험 장면 끊어 읽기', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g4-test.json', carveGlyph: '·[ㆍ]',
    intro: [{ who: 'senior', text: '시험 도입 줄' }],
    request: [{ who: 'senior', text: '시험 의뢰 줄' }],
    contexts: [
      { id: 'gx.c1', label: '시험 맥락 하나', lines: ['시험 맥락 줄'], items: ['s4.t1', 's4.t2'] },
      { id: 'gx.c2', label: '시험 맥락 둘', lines: ['시험 맥락 줄 둘'], items: [] },
      { id: 'gx.c3', label: '시험 맥락 셋', lines: ['시험 맥락 줄 셋'], items: [] },
      { id: 'gx.c4', label: '시험 맥락 넷', lines: ['시험 맥락 줄 넷'], items: [] }
    ],
    items: [
      {
        id: 's4.t1', kind: 'task', levels: ['h1', 'h23'], label: '시험 끊어 읽기 하나', gimmick: 'wordCut',
        config: {
          lines: [{ block: 'O-s4-YB2a' }, { block: 'O-s4-YB34a' }],
          compare: [
            { a: { block: 'O-s4-YB2a', at: [2, 4] }, b: { block: 'O-s4-YB34a', at: [1, 3] }, note: '시험 견주기 메모' }
          ]
        },
        answer: { 'O-s4-YB2a': [1, 3, 5, 8, 10, 12, 13, 15, 17], 'O-s4-YB34a': [0, 2, 3, 7, 10, 14, 15, 16, 18] },
        hints: ['시험 힌트 하나', { 'O-s4-YB2a': [1, 3] }], explain: '시험 풀이 끊어 읽기'
      },
      {
        id: 's4.t2', kind: 'task', levels: ['h1', 'h23'], label: '시험 끊어 읽기 둘', gimmick: 'wordCut',
        config: { lines: [{ block: 'O-s4-YB34b' }], pitch: true },
        answer: { 'O-s4-YB34b': [0, 2, 4, 8, 11, 15, 16, 17, 19] },
        hints: ['시험 힌트 둘', { 'O-s4-YB34b': [0] }], explain: '시험 풀이 둘'
      }
    ],
    translate: { lines: [{ who: 'senior', text: '시험 통역 줄' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
