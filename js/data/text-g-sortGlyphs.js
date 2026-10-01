'use strict';
/*
 * 기믹 sortGlyphs(서장 「흩어진 글자」) 화면 문구와 글자 표. 화면 코드(js/gimmicks/sortGlyphs.js)는 한국어를 쓰지 않고 여기서 읽는다.
 * - glyphs: 글자 id → 보이는 글자(호환 자모). 어느 칸이 맞는지는 기믹 코드의 사실 표(28자 / 사라진 4자 / 28자 밖)가 정한다.
 *   훈민정음 28자 = 첫소리 17자(ㄱ ㅋ ㆁ ㄷ ㅌ ㄴ ㅂ ㅍ ㅁ ㅈ ㅊ ㅅ ㆆ ㅎ ㅇ ㄹ ㅿ) + 가운뎃소리 11자(ㆍ ㅡ ㅣ ㅗ ㅏ ㅜ ㅓ ㅛ ㅑ ㅠ ㅕ).
 *   사라진 4자: ㆁ ㅿ ㆆ ㆍ (지학사 중학 국어 2-2 142~143쪽). ㅸ 은 연서로 만든 글자라 28자에 들지 않는다.
 * - 문구 안의 %이름% 은 기믹이 채운다. 가운뎃점(·)을 음절 바로 앞에 붙이면 방점이 되므로 쓰지 않는다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.TEXT = NM.data.TEXT || {};
NM.data.TEXT.g = NM.data.TEXT.g || {};
NM.data.TEXT.g.sortGlyphs = {
  glyphs: {
    g: 'ㄱ', k: 'ㅋ', ng: 'ㆁ', d: 'ㄷ', t: 'ㅌ', n: 'ㄴ', b: 'ㅂ', p: 'ㅍ', m: 'ㅁ', j: 'ㅈ', ch: 'ㅊ', s: 'ㅅ',
    q: 'ㆆ', h: 'ㅎ', o: 'ㅇ', r: 'ㄹ', z: 'ㅿ',
    araea: 'ㆍ', eu: 'ㅡ', i: 'ㅣ', vo: 'ㅗ', va: 'ㅏ', vu: 'ㅜ', veo: 'ㅓ', vyo: 'ㅛ', vya: 'ㅑ', vyu: 'ㅠ', vyeo: 'ㅕ',
    bv: 'ㅸ'
  },
  bins: {
    known: { name: '아는 글자', desc: '오늘날에도 쓰는 글자' },
    lost: { name: '스물여덟 자 안', desc: '훈민정음 스물여덟 자에 들었지만 지금은 쓰지 않는 글자' },
    outside: { name: '스물여덟 자 밖', desc: '스물여덟 자에 들지 않은 글자' }
  },
  groupUnknown: '모르는 글자',
  pool: '흩어진 글자',
  poolEmpty: '흩어진 글자를 모두 갈랐어요.',
  lead: '글자를 하나 고른 뒤, 놓을 칸의 단추를 누르세요. 칸에 놓은 글자를 다시 누르면 옮길 수 있어요.',
  put: '여기에 놓기',
  putAria: '고른 글자를 %bin% 칸에 놓기',
  tileAria: '%glyph% 글자',
  tileInBin: '%glyph% 글자, %bin% 칸',
  left: '남은 글자 %n%개',
  submit: '갈라 놓은 대로 내기',
  mark: { wrong: '다시 볼 글자', hint: '고칠 곳', answer: '정답 자리' },
  dogam: {
    title: '옛글자 도감이 열렸어요',
    lead: '모르는 글자로 가른 글자들이 도감에 들어갔어요.'
  }
};
