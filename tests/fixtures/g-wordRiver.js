'use strict';
/*
 * G11 점검용 시험 장면 s12 (게임 데이터 아님 — 실제 장면은 S12 작업이 js/data/scenes/s12.js 에 쓴다).
 * 기믹 'wordRiver' 를 실제 장면 진행기 안에서 돌린다.
 * 낱말 사슬은 design/research/11 5절(공통국어2 138쪽 낱말, 우리말샘·표준국어대사전으로 순서 확정):
 *   W-anpak · W-jopssal · W-sukgarak · W-salkogi(2단계만) — forms 는 데이터 표기로 적는다
 * 지금의 변화 보기는 같은 문서 6-1절(공통국어2 139쪽 사례 확인)과 05 문서 근대 행(지난 변화)에서 새로 쓴 문장.
 * 중학교판(editions.m)에는 이 기믹 과제가 없다(해독 항목만 — spec §7 종장).
 * 맵: tests/fixtures/maps/g-wordRiver.json (d1-test.json 의 맥락 id 를 s12 로 바꾼 것)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};

  NM.data.SCENES.s12 = {
    id: 's12', title: '시험 장면 12', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g-wordRiver.json', bgmKey: 'no-such-bgm', carveGlyph: '말',
    intro: [{ who: 'senior', text: '시험 도입이다.' }],
    request: [{ who: 'senior', text: '시험 의뢰다.' }],
    contexts: [
      { id: 's12.c1', label: '나루', lines: ['시험 맥락 1'], items: ['s12.t1'] },
      { id: 's12.c2', label: '배', lines: ['시험 맥락 2'], items: ['s12.t2'] },
      { id: 's12.c3', label: '돌', lines: ['시험 맥락 3'], items: [] },
      { id: 's12.c4', label: '어른', lines: ['시험 맥락 4'], items: [] }
    ],
    items: [
      {
        id: 's12.t1', kind: 'task', levels: ['h1', 'h23'], label: '변화의 강', gimmick: 'wordRiver',
        config: {
          words: [
            { id: 'anpak', label: '안팎', forms: ['안[ㅍㅏㅺ]', '안팎'] },
            { id: 'jopssal', label: '좁쌀', forms: ['조[ㅄㆍㄹ]', '좁[ㅄㆍㄹ]', '좁[ㅆㆍㄹ]', '좁쌀'] },
            { id: 'sukgarak', label: '숟가락', forms: ['술', '숫가락', '숟가락'] },
            { id: 'salkogi', forms: ['[ㅅㆍㄹ]고기', '살코기'] }
          ],
          now: {
            choices: [
              { id: 'n1', text: '\'작다\'를 \'짝따\'처럼 말머리를 된소리로 내는 발음이 늘고 있다.' },
              { id: 'n2', text: '\'혼밥\' 같은 줄임 신어가 새로 생겨 사전에 오른다.' },
              { id: 'n3', text: 'ㅔ와 ㅐ를 소리로 구별하지 않는 사람이 많다.' },
              { id: 'n4', text: 'ㅸ과 ㅿ이 쓰이지 않게 되었다.' },
              { id: 'n5', text: '주격 조사 \'가\'가 처음 나타났다.' }
            ]
          },
          predict: true
        },
        answer: {
          order: {
            anpak: ['anpak.0', 'anpak.1'],
            jopssal: ['jopssal.0', 'jopssal.1', 'jopssal.2', 'jopssal.3'],
            sukgarak: ['sukgarak.0', 'sukgarak.1', 'sukgarak.2'],
            salkogi: ['salkogi.0', 'salkogi.1']
          },
          now: ['n1', 'n2', 'n3']
        },
        hints: ['시험 힌트: 받침 ㅄ이 어디로 갔을까?', 'jopssal'],
        explain: '시험 풀이: 조[ㅄㆍㄹ]에서 좁쌀까지.'
      },
      {
        id: 's12.t2', kind: 'task', levels: ['h1', 'h23'], label: '숟가락', gimmick: 'wordRiver',
        config: { words: [{ id: 'sk', label: '숟가락', forms: ['술', '숫가락', '숟가락'] }] },
        answer: { order: { sk: ['sk.0', 'sk.1', 'sk.2'] } },
        hints: ['시험 힌트 2', 'sk'],
        explain: '시험 풀이 2.'
      }
    ],
    translate: { id: 's12.x1', lines: [{ who: 'senior', text: '시험 통역.' }] },
    editions: {
      m: {
        title: '시험 장면 12 중학교판',
        contexts: [
          { id: 's12.c1', label: '기기', lines: ['중학교판 맥락 1'], items: [] },
          { id: 's12.c2', label: '사람', lines: ['중학교판 맥락 2'], items: [] },
          { id: 's12.c3', label: '돌', lines: ['중학교판 맥락 3'], items: [] },
          { id: 's12.c4', label: '어른', lines: ['중학교판 맥락 4'], items: [] }
        ],
        items: []
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
