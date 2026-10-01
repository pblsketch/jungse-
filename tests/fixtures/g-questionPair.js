'use strict';
/*
 * G7 질문 짝 맞추기 점검용 시험 장면 s8 (게임 데이터 아님 — 실제 장면은 S8 작업이 쓴다).
 * 原文은 진짜 블록 id 로만 가리킨다(NM.data.ORIG). 대답 카드 글은 시험용 문자열이다.
 * 맵: tests/fixtures/maps/g-questionPair.json (조사 지점 s8.c1)
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.SCENES.s8 = {
    id: 's8', title: '시험 장면 묻는 말', era: '시험 시대',
    mapKey: 'tests/fixtures/maps/g-questionPair.json', carveGlyph: '[ㆍ]',
    intro: [{ who: 'senior', text: '시험을 시작하자.' }],
    request: [{ who: 'senior', text: '묻고 답하는 말을 통역해 보자.' }],
    contexts: [{ id: 's8.c1', label: '절 마당', orig: ['O-s8-SS68'], lines: ['시험 맥락'], items: ['s8.t1', 's8.t2'] }],
    items: [{
      id: 's8.t1', kind: 'task', levels: ['h23'], label: '질문 짝 맞추기', gimmick: 'questionPair',
      config: {
        questions: [
          { id: 'q1', orig: 'O-s8-SS68', words: [{ id: 'q1.you', match: ':네' }, { id: 'q1.end', match: ':혜[ㄴㆍㄴ]·다' }], cue: ['q1.you'], cueKind: 'second', ending: ['q1.end'] },
          { id: 'q2', orig: 'O-s8-YB28', words: [{ id: 'q2.wh', match: ':엇더' }, { id: 'q2.end', match: '[ㅎㆍ]·니[ㆁㅣㅅ]·고' }], cue: ['q2.wh'], cueKind: 'wh', ending: ['q2.end'] },
          { id: 'q3', orig: 'O-s8-YB88', words: [{ id: 'q3.end', match: '잇·더신·가' }], cue: [], cueKind: 'none', ending: ['q3.end'] }
        ],
        answers: [
          { id: 'a1', text: '시험 대답 하나' },
          { id: 'a2', text: '시험 대답 둘' },
          { id: 'a3', orig: 'O-s8-WS894' }
        ]
      },
      answer: {
        q1: { pair: 'a1', kind: 'second', ending: 'nda' },
        q2: { pair: 'a2', kind: 'wh', ending: 'go' },
        q3: { pair: 'a3', kind: 'yesno', ending: 'ga' }
      },
      hints: ['시험 힌트: 의문사를 찾아봐.', 'q2'], explain: '시험 풀이: 물음의 갈래.'
    }, {
      // 대답 카드 없이(짝 맞추기 단계 없음), 주어가 앞 구절에 있는 물음
      id: 's8.t2', kind: 'task', levels: ['h23'], label: '시험 과제 둘', gimmick: 'questionPair',
      config: {
        questions: [
          { id: 'q1', orig: ['O-s6-SS6e', 'O-s8-SS6f'], words: [{ id: 'q1.you', block: 'O-s6-SS6e', match: ':네' }, { id: 'q1.end', block: 'O-s8-SS6f', match: '듣[ㄴㆍㄴ]·다' }], cue: ['q1.you'], cueKind: 'second', ending: ['q1.end'] }
        ]
      },
      answer: { q1: { kind: 'second', ending: 'nda' } },
      hints: ['시험 힌트 둘', null], explain: '시험 풀이 둘.'
    }],
    translate: { lines: [{ who: 'senior', text: '시험 통역 끝.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
