'use strict';
/*
 * G10 점검용 시험 장면 s11 (게임 데이터 아님 — 실제 장면은 S11 작업이 js/data/scenes/s11.js 에 쓴다).
 * 기믹 'threeEraLink' 를 실제 장면 진행기 안에서 돌린다. 原文은 NM.data.ORIG(자동 생성)의 블록 id 로만 가리킨다.
 * 낱말 사슬은 design/research/11 5절(우리말샘·표준국어대사전으로 순서 확정)의 W-seoul · W-jota · W-maeum,
 * 적는 방식은 같은 문서 4-3절 O-s11-DOKRIP1(거슨=이어, 홈이라=끊어) · O-s11-DOKRIP4(아러보지=이어, 알아보니=끊어).
 * 맵: tests/fixtures/maps/g-threeEraLink.json (d1-test.json 의 맥락 id 를 s11 로 바꾼 것)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};

  NM.data.SCENES.s11 = {
    id: 's11', title: '시험 장면 11', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g-threeEraLink.json', bgmKey: 'no-such-bgm', carveGlyph: '가',
    intro: [{ who: 'senior', text: '시험 도입이다.' }],
    request: [{ who: 'senior', text: '시험 의뢰다.' }],
    contexts: [
      { id: 's11.c1', label: '신문', orig: ['O-s11-DOKRIP1'], lines: ['시험 맥락 1'], items: ['s11.t1'] },
      { id: 's11.c2', label: '책', orig: ['O-s11-NOGEOL1795'], lines: ['시험 맥락 2'], items: ['s11.t2'] },
      { id: 's11.c3', label: '돌', lines: ['시험 맥락 3'], items: [] },
      { id: 's11.c4', label: '어른', lines: ['시험 맥락 4'], items: [] }
    ],
    items: [
      {
        id: 's11.t1', kind: 'task', levels: ['h23'], label: '세 시대 변환', gimmick: 'threeEraLink',
        config: {
          chains: [
            { id: 'seoul', forms: ['셔[ㅸㅡㄹ]', '셔울', '서울'] },
            { id: 'jota', forms: ['둏다', '죻다', '좋다'] },
            { id: 'maeum', forms: ['[ㅁㆍ][ㅿㆍㅁ]', '[ㅁㆍ][ㅇㆍㅁ]', '마음'] }
          ],
          extra: ['물'],
          spell: {
            items: [
              { id: 'sp1', orig: 'O-s11-DOKRIP1', find: '거슨' },
              { id: 'sp2', orig: 'O-s11-DOKRIP1', find: '홈이라' },
              { id: 'sp3', orig: 'O-s11-DOKRIP4', find: '아러보지' },
              { id: 'sp4', orig: 'O-s11-DOKRIP4', find: '알아보니' }
            ]
          }
        },
        answer: {
          link: { seoul: ['seoul.1', 'seoul.2'], jota: ['jota.1', 'jota.2'], maeum: ['maeum.1', 'maeum.2'] },
          spell: { sp1: 'ieo', sp2: 'kkeuneo', sp3: 'ieo', sp4: 'kkeuneo' }
        },
        hints: ['시험 힌트: ㅸ이 사라진 꼴을 찾아봐.', 'seoul'],
        explain: '시험 풀이: 셔울, 죻다, 마음.'
      },
      {
        id: 's11.t2', kind: 'task', levels: ['h23'], label: '적는 방식', gimmick: 'threeEraLink',
        config: {
          orig: ['O-s11-DOKRIP4'],
          spell: { items: [{ id: 'a', orig: 'O-s11-DOKRIP4', find: '아러보지' }, { id: 'b', orig: 'O-s11-DOKRIP4', find: '알아보니' }] }
        },
        answer: { spell: { a: 'ieo', b: 'kkeuneo' } },
        hints: ['시험 힌트 2', 'b'],
        explain: '시험 풀이 2.'
      }
    ],
    translate: { id: 's11.x1', lines: [{ who: 'senior', text: '시험 통역.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
