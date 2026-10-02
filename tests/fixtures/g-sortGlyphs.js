'use strict';
/*
 * G1 기믹 sortGlyphs 점검용 시험 장면 (게임 데이터 아님). 진짜 서장 장면은 S0 작업이 js/data/scenes/s0.js 에 쓴다.
 * - 장면 s0 에 기믹 과제 셋(s0.t1 8자, s0.t2 기본 묶음, s0.t3 두 단계). 맵: tests/fixtures/maps/g1-test.json (조사 지점 없음)
 * - 옛글자 도감(NM.data.DOGAM)은 K1 이 채우기 전이라 시험용 두 줄만 둔다(ㆍ, ㅸ). 나머지 글자는 칸 설명으로 보인다.
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.DOGAM = NM.data.DOGAM || {
    fixAraea: { glyph: 'ㆍ', name: '시험 아래아', note: '시험용 도감 설명 가', stage: 's2' },
    fixBv: { glyph: 'ㅸ', name: '시험 순경음 비읍', note: '시험용 도감 설명 나', stage: 's3' }
  };
  const glyphs = ['g', 'va', 'z', 'n', 'q', 'bv', 'araea', 'ng'];
  const answer = { g: 'known', va: 'known', n: 'known', z: 'lost', q: 'lost', araea: 'lost', ng: 'lost', bv: 'outside' };
  NM.data.SCENES.s0 = {
    id: 's0', title: '시험 서장', era: '2026',
    mapKey: 'tests/fixtures/maps/g1-test.json', bgmKey: 'no-such-bgm',
    intro: [{ who: 'senior', text: '시험 도입 한 줄.' }],
    request: [],
    contexts: [],
    items: [{
      id: 's0.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '흩어진 글자 가르기',
      gimmick: 'sortGlyphs', config: { glyphs }, answer,
      hints: ['시험 힌트: 스물여덟 자에 든 글자를 떠올려 봐.', 'outside'],
      explain: '시험 풀이: ㆍ ㅿ ㆆ ㆁ 은 사라진 글자, ㅸ 은 스물여덟 자 밖.'
    }, {
      // config 없음 → 기본 글자 묶음(DEFAULT 13자)
      id: 's0.t2', kind: 'task', levels: ['m', 'h1', 'h23'], label: '기본 묶음 가르기',
      gimmick: 'sortGlyphs', config: {},
      answer: { g: 'known', va: 'known', z: 'lost', n: 'known', eu: 'known', q: 'lost', m: 'known', bv: 'outside', vo: 'known', araea: 'lost', s: 'known', ng: 'lost', o: 'known' },
      hints: ['시험 힌트 둘', null], explain: '시험 풀이 둘.'
    }, {
      // 두 단계(서장과 같은 짜임): ① ㄱ ㅏ ㆍ 두 칸 연습(남은 글자는 '모르는 글자'로) ② 나머지 + 세 칸
      id: 's0.t3', kind: 'task', levels: ['m', 'h1', 'h23'], label: '단계 나눠 가르기',
      gimmick: 'sortGlyphs',
      config: { steps: [
        { glyphs: ['g', 'va', 'araea'], bins: ['known', 'unknown'], rest: 'unknown',
          say: { who: 'senior', text: '시험 단계 하나 대사.' }, done: { who: 'senior', text: '시험 단계 하나 끝 대사.' } },
        { glyphs: ['bv', 'z', 'n', 'q', 'ng'], say: { who: 'senior', text: '시험 단계 둘 대사.' } }
      ] },
      answer: { g: 'known', va: 'known', araea: 'lost', bv: 'outside', z: 'lost', n: 'known', q: 'lost', ng: 'lost' },
      hints: ['시험 힌트 셋', 'outside'], explain: '시험 풀이 셋.'
    }],
    translate: { lines: [{ who: 'senior', text: '시험 통역.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
