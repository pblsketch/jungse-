'use strict';
/*
 * G2 기믹 borrowSort 점검용 시험 장면 (게임 데이터 아님). 진짜 장면은 S1 작업이 js/data/scenes/s1.js 에 쓴다.
 * - 原文은 진짜 자동 생성 데이터(js/data/orig.generated.js)의 블록 id 로만 가리킨다.
 * - 판정은 design/research/11_원문_고대_근대.md 'S1 판정표'를 따른다(永 뜻·吉 소리, 主 뜻·隱 소리, 夜入遊行 뜻·伊可 소리·如 뜻).
 * - 맵: tests/fixtures/maps/g1-test.json
 */
(function (root) {
  const NM = root.NM;
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};
  const item = (id, lines, marks, withRule) => ({
    id, kind: 'task', levels: ['h23'], label: '뜻이냐 소리냐',
    gimmick: 'borrowSort',
    config: Object.assign({ lines }, withRule ? { rule: {
      sentence: '실질 형태소는 대체로 {?}',
      cards: [
        { id: id + '.rule.a', text: '뜻을, 조사와 어미는 대체로 소리를 빌렸다.' },
        { id: id + '.rule.b', text: '소리를, 조사와 어미는 대체로 뜻을 빌렸다.' },
        { id: id + '.rule.c', text: '뜻을, 조사와 어미도 언제나 뜻을 빌렸다.' }
      ] } } : {}),
    answer: Object.assign({ marks }, withRule ? { rule: id + '.rule.a' } : {}),
    hints: ['시험 힌트: 조사와 어미 자리를 살펴봐.', withRule ? 'rule' : null],
    explain: '시험 풀이: 실질 형태소는 대체로 뜻, 조사와 어미는 대체로 소리.'
  });
  NM.data.SCENES.s1 = {
    id: 's1', title: '시험 빌려 쓴 글자', era: '고대',
    mapKey: 'tests/fixtures/maps/g1-test.json', bgmKey: 'no-such-bgm', carveGlyph: '[ㄱㅏ]',
    intro: [{ who: 'senior', text: '시험 도입.' }],
    request: [],
    contexts: [],
    items: [
      item('s1.t1', [
        { orig: 'O-s1-YEONGDONG', line: 0, targets: [{ at: 0, id: 'yeong' }, { at: 5, id: 'gil' }] },
        { orig: 'O-s1-SEODONG1', line: 0, targets: [{ at: 4, id: 'ju' }, { at: 5, id: 'eun' }] },
        { orig: 'O-s1-CHEOYONG1', line: 0, targets: [], notes: [
          { at: [0, 1], kind: 'interp', text: '시험 해석 카드: 읽는 법이 갈린다.' },
          { at: 5, kind: 'interp', text: '시험 해석 카드: 良 은 풀이가 갈린다.' }] },
        { orig: 'O-s1-CHEOYONG1', line: 1, targets: [
          { at: 0, id: 'ya' }, { at: 1, id: 'ip' }, { at: 2, id: 'i' }, { at: 3, id: 'yu' }, { at: 4, id: 'haeng' },
          { at: 5, id: 'yeo', note: { kind: 'know', text: '시험 알아 두기: 如 는 새김을 빌린 훈가자.' } }, { at: 6, id: 'ga' }] }
      ], { yeong: 'hun', gil: 'eum', ju: 'hun', eun: 'eum', ya: 'hun', ip: 'hun', i: 'eum', yu: 'hun', haeng: 'hun', yeo: 'hun', ga: 'eum' }, true),
      item('s1.t2', [
        { orig: 'O-s1-YEONGDONG', line: 0, targets: [{ at: 0, id: 'yeong' }, { at: 5, id: 'gil' }] }
      ], { yeong: 'hun', gil: 'eum' }, false)
    ],
    translate: { lines: [{ who: 'senior', text: '시험 통역.' }] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
