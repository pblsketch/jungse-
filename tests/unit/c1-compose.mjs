// C1 옛한글 조합기: [대괄호] 한 음절 → 표시 문자열
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js']);
const yet = ctx.NM.core.yet;
const J = ctx.NM.data.JAMO;
assert.ok(yet, 'NM.core.yet 이 있어야 한다');
assert.ok(J && J.CHO && J.JUNG && J.JONG && J.COMPAT, 'NM.data.JAMO 표가 있어야 한다');

const u = (...cps) => String.fromCodePoint(...cps);
const syl = (s) => yet.syllable(s);

// 1) 현대 음절로 나타낼 수 있으면 완성형(U+AC00 영역)
assert.equal(syl('ㄱㅏ'), '가');
assert.equal(syl('ㅎㅏㄴ'), '한');
assert.equal(syl('ㄲㅗㅊ'), '꽃');
assert.equal(syl('ㄱㄱㅗㅊ'), '꽃', '원자열 ㄱㄱ = ㄲ');
assert.equal(syl('ㅇㅘ'), '와');
assert.equal(syl('ㅇㅗㅏ'), '와', '모음 원자열 ㅗㅏ = ㅘ');
assert.equal(syl('ㄷㅏㄺ'), '닭');
assert.equal(syl('ㄷㅏㄹㄱ'), '닭');
assert.equal(syl('ㅇㅣㅇ'), '잉');
assert.equal(syl('ㅇㅡㅣ'), '의');

// 2) 아래아·옛 중성 ㆍ ㆎ ㆉ ㆌ
assert.equal(syl('ㅎㆍ'), u(0x1112, 0x119E));
assert.equal(syl('ㅅㆎ'), u(0x1109, 0x11A1));
assert.equal(syl('ㄱㆉ'), u(0x1100, 0x1188));
assert.equal(syl('ㄱㆌ'), u(0x1100, 0x1194));
assert.equal(syl('ㅁㆍㄹ'), u(0x1106, 0x119E, 0x11AF));
assert.equal(syl('ㄱㆍㆍ'), u(0x1100, 0x11A2), '쌍아래아');

// 3) ᅀ ᅌ ᅙ
assert.equal(syl('ㅿㅏ'), u(0x1140, 0x1161));
assert.equal(syl('ㆁㅓ'), u(0x114C, 0x1165));
assert.equal(syl('ㆆㅡㅁ'), u(0x1159, 0x1173, 0x11B7));

// 4) 순경음 ᄫ ᄛ ᄝ ᅗ ᄬ
assert.equal(syl('ㅸㅓ'), u(0x112B, 0x1165));
assert.equal(syl('ㅂㅇㅓ'), u(0x112B, 0x1165));
assert.equal(syl('ㄹㅇㅏ'), u(0x111B, 0x1161));
assert.equal(syl('ㅱㅏ'), u(0x111D, 0x1161));
assert.equal(syl('ㆄㅏ'), u(0x1157, 0x1161));
assert.equal(syl('ㅹㅏ'), u(0x112C, 0x1161));

// 5) 각자병서 ᅇ ᅘ ᄽ ᄿ ᅏ ᅑ (치두·정치는 첫소리 자모를 그대로 적는다)
assert.equal(syl('ㆀㅕ'), u(0x1147, 0x1167));
assert.equal(syl('ㅇㅇㅕ'), u(0x1147, 0x1167));
assert.equal(syl('ㆅㅕ'), u(0x1158, 0x1167));
assert.equal(syl('ᄼᄼㅏ'), u(0x113D, 0x1161));
assert.equal(syl('ᄽㅏ'), u(0x113D, 0x1161));
assert.equal(syl('ᄾᄾㅏ'), u(0x113F, 0x1161));
assert.equal(syl('ᅏㅏ'), u(0x114F, 0x1161));
assert.equal(syl('ᅐᅐㅏ'), u(0x1151, 0x1161));

// 6) 합용병서
assert.equal(syl('ㅂㅅㄱㅜㄹ'), u(0x1122, 0x116E, 0x11AF), 'ᄢ');
assert.equal(syl('ㅴㅜㄹ'), u(0x1122, 0x116E, 0x11AF), 'ㅴ 호환 자모');
assert.equal(syl('ㅂㄷㅡㄷ'), u(0x1120, 0x1173, 0x11AE), 'ᄠ');
assert.equal(syl('ㅄㆍㄹ'), u(0x1121, 0x119E, 0x11AF), 'ᄡ');
assert.equal(syl('ㅺㅗㅈ'), u(0x112D, 0x1169, 0x11BD), 'ᄭ');
assert.equal(syl('ㅅㄱㅗㅈ'), u(0x112D, 0x1169, 0x11BD));
assert.equal(syl('ㅼㅏㅎ'), u(0x112F, 0x1161, 0x11C2), 'ᄯ');
assert.equal(syl('ㅂㅅㄷㅏ'), u(0x1123, 0x1161), 'ᄣ');
const hapyong = [0x1122, 0x1123, 0x1124, 0x1125, 0x1126, 0x1127, 0x1129, 0x112A, 0x112D, 0x112E, 0x112F,
  0x1130, 0x1131, 0x1132, 0x1133, 0x1134, 0x1135, 0x1136, 0x1137, 0x1138, 0x1139, 0x113A, 0x113B, 0x1120, 0x1121];

// 7) 옛 종성 ᇙ ᇮ ᇰ ᇫ ᇹ ᇧ
assert.equal(syl('ㅇㅣㆁ'), u(0x110B, 0x1175, 0x11F0), 'ᇰ 은 잉 이 아니다');
assert.equal(syl('ㅂㅏㅭ'), u(0x1107, 0x1161, 0x11D9), 'ᇙ');
assert.equal(syl('ㅂㅏㄹㆆ'), u(0x1107, 0x1161, 0x11D9));
assert.equal(syl('ㄴㅏㆀ'), u(0x1102, 0x1161, 0x11EE), 'ᇮ');
assert.equal(syl('ㅅㅏㅿ'), u(0x1109, 0x1161, 0x11EB), 'ᇫ');
assert.equal(syl('ㅎㅏㆆ'), u(0x1112, 0x1161, 0x11F9), 'ᇹ');
assert.equal(syl('ㄴㅏㅅㄱ'), u(0x1102, 0x1161, 0x11E7), 'ᇧ');
assert.equal(syl('ㄴㅏㄱㅅ'), '낛', 'ㄳ 은 현대 종성');

// 8) 채움 문자: 초성 없음 → U+115F, 중성 없음 → U+1160
assert.equal(syl('ㆍ'), u(0x115F, 0x119E));
assert.equal(syl('ㅂㅅ'), u(0x1121, 0x1160));
assert.equal(syl('ㄱ'), u(0x1100, 0x1160));

// 9) 표의 모든 자모가 원자 열쇠로 다시 조합된다 (표가 스스로 모순 없음)
const fillerV = 'ᅠ', fillerL = 'ᅟ';
for (const [key, ch] of Object.entries(J.CHO)) {
  assert.equal(syl(key), ch + fillerV, `초성 ${key} → ${ch}`);
}
for (const [key, ch] of Object.entries(J.JUNG)) {
  assert.equal(syl(key), fillerL + ch, `중성 ${key}`);
}
for (const [key, ch] of Object.entries(J.JONG)) {
  const out = syl('ㄱㆍ' + key);
  assert.equal(out, 'ᄀᆞ' + ch, `종성 ${key}`);
}
for (const cp of hapyong) {
  const ch = u(cp);
  assert.ok(Object.values(J.CHO).includes(ch), `합용병서 U+${cp.toString(16)} 표에 있음`);
}
// 블록 전체 (채움 문자 제외)
const want = [[0x1100, 0x115E], [0xA960, 0xA97C], [0x1161, 0x11A7], [0xD7B0, 0xD7C6], [0x11A8, 0x11FF], [0xD7CB, 0xD7FB]];
const have = new Set([...Object.values(J.CHO), ...Object.values(J.JUNG), ...Object.values(J.JONG)].map(c => c.codePointAt(0)));
for (const [a, b] of want) for (let c = a; c <= b; c++) assert.ok(have.has(c), `U+${c.toString(16)} 표에 없음`);
// 호환 자모 전부 (U+3131–318E, 채움 U+3164 제외) 단독으로 조합된다
for (let c = 0x3131; c <= 0x318E; c++) {
  if (c === 0x3164) continue;
  assert.doesNotThrow(() => syl(u(c)), `호환 자모 U+${c.toString(16)}`);
}

// 10) 조합 실패는 던진다 (조용히 버리지 않는다)
assert.throws(() => syl(''), /옛한글/);
assert.throws(() => syl('ㄱㅏㄱㅏ'), /옛한글/, '음절 둘');
assert.throws(() => syl('ㄱㅏx'), /옛한글/, '자모 아닌 글자');
assert.throws(() => syl('ㅎㄱㄷㅏ'), /옛한글/, '없는 초성 묶음');
assert.throws(() => syl('ㄱㅏㅎㅎㅎㅎ'), /옛한글/, '없는 종성 묶음');
assert.throws(() => syl('ㄱㅡㅡㅡ'), /옛한글/, '없는 중성 묶음');

console.log('c1 compose ok');
