'use strict';
/*
 * G9 두 시대 수첩 점검용 시험 장면 s10 (게임 데이터 아님 — 실제 장면은 S10 작업이 쓴다).
 * 原文은 진짜 블록 id 로만 가리킨다. 줄 이름·알아 두기 글은 시험용 문자열이다.
 * 맵: tests/fixtures/maps/g-twoEraNotebook.json (조사 지점 s10.c1)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.SCENES.s10 = {
    id: 's10', title: '시험 장면 백 년 뒤', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g-twoEraNotebook.json', carveGlyph: '[ㆍ]',
    intro: [{ who: 'senior', text: '시험을 시작하자.' }],
    request: [{ who: 'senior', text: '두 시대를 견주어 보자.' }],
    contexts: [{ id: 's10.c1', label: '서당', orig: ['O-s10-SOHAK1'], lines: ['시험 맥락'], items: ['s10.t1'] }],
    items: [{
      id: 's10.t1', kind: 'task', levels: ['h1', 'h23'], label: '두 시대 수첩', gimmick: 'twoEraNotebook',
      config: {
        page15: {
          orig: ['O-s6-SS6e'],
          words: [{ id: 'e.ne', match: ':네' }, { id: 'e.saram', match: ':사[ㄹㆍ]·[ㅁㆎ]' }, { id: 'e.mom', match: '·모·[ㅁㆍㄹ]' }, { id: 'e.buteo', match: '부텨·를' }],
          extra: [{ id: 'e.saal', text: '사[ㅇㆍㄹ]', src: '시험 출처' }]
        },
        page16: {
          orig: ['O-s10-SOHAK1', 'O-s10-SOHAK2', 'O-s10-SOHAK4'],
          words: [
            { id: 's.i', block: 'O-s10-SOHAK1', match: 'ㅣ' },
            { id: 's.mom1', block: 'O-s10-SOHAK2', match: '·몸·이며' },
            { id: 's.eolgul', block: 'O-s10-SOHAK2', match: '얼굴·이며' },
            { id: 's.geosira', block: 'O-s10-SOHAK2', match: '거·시·라' },
            { id: 's.mom2', block: 'O-s10-SOHAK4', match: '·몸·을' },
            { id: 's.machm', block: 'O-s10-SOHAK4', match: '[ㅁㆍ]·[ㅊㆍㅁ]·이니·라' }
          ],
          extra: [{ id: 'x.saheul', text: '사흘', note: '시험 메모', src: '시험 출처' }]
        },
        rows: [
          { id: 'nom', label: '시험 줄 주격', ex15: ['e.ne'] },
          { id: 'cut', label: '시험 줄 적기', ex15: ['e.mom'] },
          { id: 'vh', label: '시험 줄 모음 조화', ex15: ['e.mom', 'e.buteo'] },
          { id: 'ga', label: '시험 줄 없는 것' },
          { id: 'bj', label: '시험 줄 방점', graded: false, note: '시험 알아 두기 글', src: '시험 출처' },
          { id: 'araea', label: '시험 줄 아래아', ex15: ['e.saram', 'e.saal'] }
        ],
        notes: [{ kind: 'know', orig: 'O-s10-HUNMONG1', text: '시험 알아 두기', src: '시험 출처' }]
      },
      answer: {
        nom: { status: 'kept', evidence: ['s.i'] },
        cut: { status: 'shaky', evidence: ['s.mom1', 's.eolgul', 's.machm'] },
        vh: { status: 'shaky', evidence: ['s.mom2'] },
        ga: { status: 'none', evidence: [] },
        araea: { status: 'shaky', evidence: ['x.saheul'] }
      },
      hints: ['시험 힌트: 15세기 쪽과 견주어 봐.', 'araea'], explain: '시험 풀이: 두 시대.'
    }, {
      id: 's10.t2', kind: 'task', levels: ['h1', 'h23'], label: '시험 과제 둘', gimmick: 'twoEraNotebook',
      config: {
        page16: { orig: ['O-s10-SOHAK1'], words: [{ id: 's.i', match: 'ㅣ' }] },
        rows: [{ id: 'nom', label: '시험 줄 주격' }]
      },
      answer: { nom: { status: 'kept' } },
      hints: ['시험 힌트 둘', 'nom'], explain: '시험 풀이 둘.'
    }],
    translate: { lines: [{ who: 'senior', text: '시험 통역 끝.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
