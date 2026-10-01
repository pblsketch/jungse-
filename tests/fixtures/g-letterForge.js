'use strict';
/*
 * G3 기믹 letterForge 점검용 시험 장면 (게임 데이터 아님). 진짜 장면은 S2 작업이 js/data/scenes/s2.js 에 쓴다.
 * - s2.t1 자음(상형 → 가획 → 다르게 만든 글자), s2.t2 모음(하늘·땅·사람 → 합성), s2.t3 가획 두 줄(바로 맞음 시험)
 * - 原文은 진짜 자동 생성 데이터의 블록 id 로만 가리킨다. 맵: tests/fixtures/maps/g1-test.json
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  const task = (id, config, answer, hint2) => ({
    id, kind: 'task', levels: ['m', 'h1', 'h23'], label: '소리를 글자로',
    gimmick: 'letterForge', config, answer,
    hints: ['시험 힌트: 발음 기관 모양을 다시 봐.', hint2],
    explain: '시험 풀이: 상형, 가획, 합성.'
  });
  NM.data.SCENES.s2 = {
    id: 's2', title: '시험 스물여덟 자', era: '1443년',
    mapKey: 'tests/fixtures/maps/g1-test.json', bgmKey: 'no-such-bgm', carveGlyph: 'ㄱ',
    intro: [{ who: 'senior', text: '시험 도입.' }],
    request: [],
    contexts: [],
    items: [
      task('s2.t1', { steps: ['shape', 'add', 'odd'], shape: { orig: ['O-s2-SANG-G'] } }, {
        shape: { g: ['right', 'top'], n: ['bottom', 'left'], m: ['bottom', 'left', 'right', 'top'], s: ['slashL', 'slashR'], o: ['ring'] },
        add: { 'g.1': 'k', 'n.1': 'd', 'n.2': 't', 'm.1': 'b', 'm.2': 'p', 's.1': 'j', 's.2': 'ch', 'o.1': 'q', 'o.2': 'h' },
        odd: ['ng', 'r', 'z']
      }, 'shape.g'),
      task('s2.t2', { steps: ['samjae', 'vowel'] }, {
        samjae: { araea: 'sky', eu: 'earth', i: 'person' },
        vowel: { vo: 'eu-up-1', va: 'i-right-1', vu: 'eu-down-1', veo: 'i-left-1', vyo: 'eu-up-2', vya: 'i-right-2', vyu: 'eu-down-2', vyeo: 'i-left-2' }
      }, 'vowel'),
      task('s2.t3', { steps: ['add'], add: { chains: ['g', 'n'], extra: ['r'] } }, { add: { 'g.1': 'k', 'n.1': 'd', 'n.2': 't' } }, null)
    ],
    translate: { lines: [{ who: 'senior', text: '시험 통역.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
