'use strict';
/*
 * G4 점검용 시험 장면 s3 (게임 데이터 아님) — 기믹 '음절 조립'(syllableBuild)을 실제 장면 진행기 안에서 돌린다.
 * - 원문은 자동 생성 원문 데이터(NM.data.ORIG)의 블록 id 로만 가리킨다. 과녁 낱말은 해례 합자해 예(09 문서 HJ-HAPYONG·HJ-JUNGHAP)와
 *   연습 과녁(연서, 채점 안 함)이다. 물음·힌트·풀이 문구는 시험 문자열이다.
 * - 맵: tests/fixtures/maps/g4-test.json (조사 지점 gx.c1~c3, 인물 gx.elder → 맥락 gx.c4)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.SCENES.s3 = {
    id: 's3', title: '시험 장면 음절 조립', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g4-test.json', carveGlyph: 'ㅘ',
    intro: [{ who: 'senior', text: '시험 도입 줄' }],
    request: [{ who: 'senior', text: '시험 의뢰 줄' }],
    contexts: [
      { id: 'gx.c1', label: '시험 맥락 하나', lines: ['시험 맥락 줄'], items: ['s3.t1', 's3.t2'] },
      { id: 'gx.c2', label: '시험 맥락 둘', lines: ['시험 맥락 줄 둘'], items: [] },
      { id: 'gx.c3', label: '시험 맥락 셋', lines: ['시험 맥락 줄 셋'], items: [] },
      { id: 'gx.c4', label: '시험 맥락 넷', lines: ['시험 맥락 줄 넷'], items: [] }
    ],
    items: [
      {
        id: 's3.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '시험 음절 조립 하나', gimmick: 'syllableBuild',
        config: {
          orig: ['O-s3-HJ-HAPYONG'],
          targets: [
            { id: 'a', prompt: '시험 과녁 가 (짝)', tray: ['ㄱ', 'ㄹ', 'ㅂ', 'ㅈ', 'ㅏ', 'ㆍ'] },
            { id: 'b', prompt: '시험 과녁 나 (홰)', orig: 'O-s3-HJ-JUNGHAP', tray: ['ㅎ', 'ㅗ', 'ㅏ', 'ㅣ', 'ㅜ'] },
            { id: 'p', prompt: '시험 연습 과녁 (연서)', practice: true, tray: ['ㅂ', 'ㅇ', 'ㅣ'] }
          ]
        },
        answer: { a: { cho: 'ㅂㅈ', jung: 'ㅏ', jong: 'ㄱ' }, b: { cho: 'ㅎ', jung: 'ㅗㅏㅣ', jong: '' } },
        hints: ['시험 힌트 하나', { b: ['jung'] }], explain: '시험 풀이 음절 조립'
      },
      {
        id: 's3.t2', kind: 'task', levels: ['m', 'h1', 'h23'], label: '시험 음절 조립 둘', gimmick: 'syllableBuild',
        config: { tray: ['ㄱ', 'ㄴ', 'ㅏ'], targets: [{ id: 'k', prompt: '시험 과녁 다' }] },
        answer: { k: { cho: 'ㄲ', jung: 'ㅏ', jong: '' } },
        hints: ['시험 힌트 둘', { k: ['cho'] }], explain: '시험 풀이 둘'
      }
    ],
    translate: { lines: [{ who: 'senior', text: '시험 통역 줄' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
