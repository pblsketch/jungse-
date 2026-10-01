// K1 공용 목록: 규칙 카드(NM.data.RULE_CARDS)·옛글자 도감(NM.data.DOGAM)·오답 카드(NM.data.WRONG_CARDS)
// - 모양과 id 형식, 장면 id·학교급 값, 학교급 용어(중학교 '나란히 쓰기' / 고등 '병서', '이체'는 고등만)
// - 도감이 spec §7 서장을 덮는다: 28자(첫소리 17 + 가운뎃소리 11), 사라진 4자 ㆍ ㅿ ㆆ ㆁ, 28자에 들지 않는 ㅸ
// - 오답 카드마다 why·src, 참조(규칙 카드·原文 블록)가 이어진다
// - 날 첫가끝 자모 없음, 모든 문자열이 NM.core.yet.render 로 그려지고 뜻하지 않은 방점·밑줄이 생기지 않는다
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';
import { jsStrings } from '../lib/jsscan.mjs';

const FILES = ['js/data/rule-cards.js', 'js/data/dogam.js', 'js/data/wrong-cards.js'];
const ctx = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/data/stages.js', 'js/data/rules-config.js', 'js/data/orig.generated.js', ...FILES]);
const NM = ctx.NM;
const { RULE_CARDS, DOGAM, WRONG_CARDS, ORIG, STAGE_IDS, SCOPE_RULES } = NM.data;
const Y = NM.core.yet;

const LEVELS = ['m', 'h1', 'h23'];
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isStage = (s) => STAGE_IDS.includes(s);
const H23_ONLY = SCOPE_RULES.h23Only; // s1 s7 s8 s11
assert.deepEqual([...H23_ONLY].sort(), ['s1', 's11', 's7', 's8']);

// ── 1) 규칙 카드 ──
assert.ok(RULE_CARDS && typeof RULE_CARDS === 'object', 'NM.data.RULE_CARDS 가 있어야 한다');
const ruleIds = Object.keys(RULE_CARDS);
assert.ok(ruleIds.length >= 40, `규칙 카드가 너무 적다: ${ruleIds.length}`);
const RULE_FIELDS = new Set(['id', 'name', 'text', 'stage', 'levels', 'src', 'orig', 'twin']);
for (const id of ruleIds) {
  const c = RULE_CARDS[id];
  assert.match(id, /^rule\.[A-Za-z][A-Za-z0-9]*$/, `${id}: id 형식 rule.<영문>`);
  assert.equal(c.id, id, `${id}: id 필드가 키와 같아야 한다`);
  for (const k of Object.keys(c)) assert.ok(RULE_FIELDS.has(k), `${id}: 모르는 필드 ${k}`);
  assert.ok(isStr(c.name) && isStr(c.text) && isStr(c.src), `${id}: name·text·src`);
  assert.ok(isStage(c.stage), `${id}: stage '${c.stage}' 는 s0~s12 여야 한다`);
  assert.ok(Array.isArray(c.levels) && c.levels.length > 0, `${id}: levels 는 비지 않은 배열`);
  assert.equal(new Set(c.levels).size, c.levels.length, `${id}: levels 겹침`);
  c.levels.forEach(lv => assert.ok(LEVELS.includes(lv), `${id}: 모르는 학교급 ${lv}`));
  // 고2~3 전용 장면의 규칙은 고2~3 범위만
  if (H23_ONLY.includes(c.stage)) assert.deepEqual([...c.levels], ['h23'], `${id}: 고2~3 전용 장면(${c.stage})의 규칙은 ['h23']`);
  // 중학교 핵심 규칙은 중학교 묶음 장면(서장·2·3·9·종장)에만
  if (c.levels.includes('m')) assert.ok(['s0', 's2', 's3', 's9', 's12'].includes(c.stage), `${id}: 중학교 핵심 규칙이 중학교 묶음 밖 장면(${c.stage})에 있다`);
  // 학교급 용어: 중학교 카드에는 '이체'·'병서'를 쓰지 않는다
  if (c.levels.includes('m')) assert.ok(!/이체|병서/.test(c.name + c.text), `${id}: 중학교 카드에 고등 용어(이체·병서)`);
  if (c.orig !== undefined) {
    assert.ok(Array.isArray(c.orig) && c.orig.length > 0, `${id}: orig 는 비지 않은 배열`);
    c.orig.forEach(b => assert.ok(ORIG[b], `${id}: 原文 블록 ${b} 가 없다`));
  }
  if (c.twin !== undefined) {
    const t = RULE_CARDS[c.twin];
    assert.ok(t, `${id}: twin ${c.twin} 가 없다`);
    assert.equal(t.twin, id, `${id}: twin 은 서로 가리켜야 한다`);
    assert.equal(t.stage, c.stage, `${id}: twin 은 같은 장면`);
    assert.ok(!t.levels.some(lv => c.levels.includes(lv)), `${id}: twin 끼리 학교급이 겹치면 안 된다`);
  }
}
// 장면마다 규칙 카드가 하나 이상(서장 s0 ~ 종장 s12)
for (const s of STAGE_IDS) assert.ok(ruleIds.some(id => RULE_CARDS[id].stage === s), `${s}: 규칙 카드가 없다`);
// 학교급 용어 짝
assert.equal(RULE_CARDS['rule.naranhi'].name, '나란히 쓰기');
assert.deepEqual([...RULE_CARDS['rule.naranhi'].levels], ['m']);
assert.match(RULE_CARDS['rule.byeongseo'].name, /병서/);
assert.ok(!RULE_CARDS['rule.byeongseo'].levels.includes('m'));
assert.ok(!RULE_CARDS['rule.iche'].levels.includes('m'), "중학교는 '이체'를 날개 설명으로만 본다");
['rule.consShape', 'rule.addStroke', 'rule.vowelShape', 'rule.vowelCompound'].forEach(id => assert.ok(RULE_CARDS[id].levels.includes('m'), `${id}: 중학교 핵심`));
// spec §7 이 이름으로 든 규칙(대표) — 장면 작가가 이 id 로 가리킨다
const SPEC_RULES = {
  s0: ['rule.letters28'], s1: ['rule.borrowing', 'rule.hyangchal'],
  s2: ['rule.consShape', 'rule.addStroke', 'rule.iche', 'rule.vowelShape', 'rule.vowelCompound'],
  s3: ['rule.moasseugi', 'rule.naranhi', 'rule.byeongseo', 'rule.vowelJoin'],
  s4: ['rule.linkedWriting', 'rule.eightFinals', 'rule.bangjeom', 'rule.noSpacing', 'rule.vowelHarmony'],
  s5: ['rule.meaningChange', 'rule.initialCluster', 'rule.prePalatal', 'rule.preInitialLaw', 'rule.preRounding', 'rule.hFinalNoun', 'rule.nativeVsSino', 'rule.loanword'],
  s6: ['rule.nomCase', 'rule.genitiveS', 'rule.genitiveUi', 'rule.compareE', 'rule.nominalOm', 'rule.harmonyParticle'],
  s7: ['rule.subjHon', 'rule.objHon', 'rule.addrHon'], s8: ['rule.yesNoQ', 'rule.whQ', 'rule.secondPersonQ'],
  s9: ['rule.spirit'], s10: ['rule.nomI16', 'rule.separate16', 'rule.harmony16', 'rule.bangjeom16', 'rule.araea16'],
  s11: ['rule.lostZB', 'rule.araeaLoss', 'rule.palatal', 'rule.rounding', 'rule.sevenFinals', 'rule.mixedWriting', 'rule.nomGa', 'rule.nominalGi', 'rule.newWords'],
  s12: ['rule.changeChain', 'rule.livingLanguage', 'rule.digitalHangul']
};
for (const [s, ids] of Object.entries(SPEC_RULES)) ids.forEach(id => {
  assert.ok(RULE_CARDS[id], `${id} 가 있어야 한다`);
  assert.equal(RULE_CARDS[id].stage, s, `${id}: stage`);
});
// 고2~3에서만 더하는 내용(spec §7 학교급 차이)
['rule.vowelHarmony', 'rule.genitiveUi', 'rule.harmonyParticle', 'rule.nativeVsSino', 'rule.loanword'].forEach(id =>
  assert.deepEqual([...RULE_CARDS[id].levels], ['h23'], `${id}: 고2~3 추가 내용`));
// 학설이 갈리거나 교과서 밖인 것은 규칙 카드가 아니다
assert.ok(!ruleIds.some(id => /yeonseo|dongguk|hunmong|vocative/i.test(id)), '연서·동국정운·훈몽자회·호격은 알아 두기로만');

// ── 2) 옛글자 도감 ──
assert.ok(DOGAM && typeof DOGAM === 'object', 'NM.data.DOGAM 이 있어야 한다');
const GROUPS = ['28-current', '28-lost', 'not28'];
const MAKES = ['shape', 'stroke', 'different', 'compound', 'yeonseo', 'sameDouble', 'diffDouble', 'vowelJoin'];
const DOGAM_FIELDS = new Set(['glyph', 'name', 'note', 'stage', 'group', 'kind', 'make', 'src']);
const glyphs = {};
for (const [k, g] of Object.entries(DOGAM)) {
  assert.match(k, /^[a-z][A-Za-z0-9]*$/, `도감 키 ${k}`);
  for (const f of Object.keys(g)) assert.ok(DOGAM_FIELDS.has(f), `도감 ${k}: 모르는 필드 ${f}`);
  assert.ok(isStr(g.glyph) && isStr(g.name) && isStr(g.note) && isStr(g.src), `도감 ${k}: glyph·name·note·src`);
  assert.equal([...g.glyph].length, 1, `도감 ${k}: glyph 는 글자 하나(호환 자모)`);
  assert.ok(/[ㄱ-ㆎ]/u.test(g.glyph), `도감 ${k}: glyph 는 호환 자모`);
  assert.ok(isStage(g.stage), `도감 ${k}: stage`);
  assert.ok(GROUPS.includes(g.group), `도감 ${k}: group '${g.group}'`);
  assert.ok(['consonant', 'vowel'].includes(g.kind), `도감 ${k}: kind`);
  assert.ok(MAKES.includes(g.make), `도감 ${k}: make '${g.make}'`);
  assert.ok(!glyphs[g.glyph], `도감 글자 ${g.glyph} 가 겹친다`);
  glyphs[g.glyph] = g;
}
const CHO17 = ['ㄱ', 'ㅋ', 'ㆁ', 'ㄷ', 'ㅌ', 'ㄴ', 'ㅂ', 'ㅍ', 'ㅁ', 'ㅈ', 'ㅊ', 'ㅅ', 'ㆆ', 'ㅎ', 'ㅇ', 'ㄹ', 'ㅿ'];
const JUNG11 = ['ㆍ', 'ㅡ', 'ㅣ', 'ㅗ', 'ㅏ', 'ㅜ', 'ㅓ', 'ㅛ', 'ㅑ', 'ㅠ', 'ㅕ'];
const LOST4 = ['ㆍ', 'ㅿ', 'ㆆ', 'ㆁ'];
for (const ch of [...CHO17, ...JUNG11]) {
  const g = glyphs[ch];
  assert.ok(g, `도감에 28자 ${ch} 가 있어야 한다`);
  assert.equal(g.group, LOST4.includes(ch) ? '28-lost' : '28-current', `${ch}: group`);
  assert.equal(g.stage, 's0', `${ch}: 28자는 서장에서 만난다`);
  assert.equal(g.kind, CHO17.includes(ch) ? 'consonant' : 'vowel', `${ch}: kind`);
}
const in28 = Object.values(DOGAM).filter(g => g.group !== 'not28');
assert.equal(in28.length, 28, '28자 그룹(28-current + 28-lost)은 정확히 28자');
assert.deepEqual(Object.values(DOGAM).filter(g => g.group === '28-lost').map(g => g.glyph).sort(), [...LOST4].sort(), '사라진 4자 ㆍ ㅿ ㆆ ㆁ');
assert.equal(Object.values(DOGAM).filter(g => g.group === '28-current').length, 24, '지금도 쓰는 24자');
assert.ok(glyphs['ㅸ'] && glyphs['ㅸ'].group === 'not28' && glyphs['ㅸ'].stage === 's0' && glyphs['ㅸ'].make === 'yeonseo', 'ㅸ: 28자 밖, 서장에서 구별');
assert.deepEqual(Object.values(DOGAM).filter(g => g.stage === 's0').length, 29, '서장 가르기 대상 = 28자 + ㅸ');
// 뒤 장면에서 만나는 옛글자(spec 예: 각자 병서 ㅃ ㅆ ㆅ ᅇ, 합용 병서 ᄠ ᄡ ᄢ, ㆎ)
for (const ch of ['ㅃ', 'ㅆ', 'ㆅ', 'ㆀ', 'ㅳ', 'ㅄ', 'ㅴ', 'ㆎ']) {
  assert.ok(glyphs[ch] && glyphs[ch].group === 'not28' && glyphs[ch].stage !== 's0', `도감에 ${ch} (28자 밖, 뒤 장면) 가 있어야 한다`);
}
assert.equal(glyphs['ㅳ'].stage, 's5', 'ᄠ 는 s5(패 글자)');
// 모양을 달리 만든 글자는 ㆁ ㄹ ㅿ, 가획자에 ㆆ
assert.deepEqual(Object.values(DOGAM).filter(g => g.make === 'different').map(g => g.glyph).sort(), ['ㄹ', 'ㅿ', 'ㆁ'].sort());
assert.deepEqual(Object.values(DOGAM).filter(g => g.make === 'shape' && g.kind === 'consonant').map(g => g.glyph).sort(), ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ', 'ㅇ'].sort());
// 도감 글은 중학교 학생도 본다: 고등 용어는 괄호 안에서만
for (const [k, g] of Object.entries(DOGAM)) assert.ok(!/이체/.test(g.note), `도감 ${k}: '이체'를 쓰지 않는다`);

// ── 3) 오답 카드 ──
assert.ok(WRONG_CARDS && typeof WRONG_CARDS === 'object', 'NM.data.WRONG_CARDS 가 있어야 한다');
const WRONG_FIELDS = new Set(['id', 'text', 'why', 'about', 'stages', 'src', 'rule', 'word', 'orig', 'caution']);
const wrongIds = Object.keys(WRONG_CARDS);
assert.ok(wrongIds.length >= 30, `오답 카드가 너무 적다: ${wrongIds.length}`);
for (const id of wrongIds) {
  const w = WRONG_CARDS[id];
  assert.match(id, /^wrong\.[a-z][A-Za-z0-9]*$/, `${id}: id 형식 wrong.<영문>`);
  assert.equal(w.id, id, `${id}: id 필드`);
  for (const k of Object.keys(w)) assert.ok(WRONG_FIELDS.has(k), `${id}: 모르는 필드 ${k}`);
  assert.ok(isStr(w.text) && isStr(w.why) && isStr(w.about) && isStr(w.src), `${id}: text·why·about·src`);
  assert.notEqual(w.text.trim(), w.why.trim(), `${id}: why 는 text 와 달라야 한다`);
  assert.ok(w.why.length >= 15, `${id}: why 가 너무 짧다`);
  assert.match(w.src, /리서치 \d\d/, `${id}: src 는 리서치 문서 위치를 적는다`);
  assert.ok(Array.isArray(w.stages) && w.stages.length > 0 && w.stages.every(isStage), `${id}: stages`);
  if (w.rule !== undefined) assert.ok(RULE_CARDS[w.rule], `${id}: 규칙 카드 ${w.rule} 가 없다`);
  if (w.orig !== undefined) w.orig.forEach(b => assert.ok(ORIG[b], `${id}: 原文 블록 ${b} 가 없다`));
  if (w.word !== undefined) assert.ok(isStr(w.word), `${id}: word`);
}
// 03 문서 §2 의 오개념(M1~M11)과 10·11 문서의 함정이 들어 있다(대표)
['wrong.scholarsMade', 'wrong.byeop28', 'wrong.icheIsStroke', 'wrong.linkedIsMistake', 'wrong.bangjeomStress', 'wrong.ga15c',
  'wrong.eorinYoung', 'wrong.araeaIsA', 'wrong.abolishHanja', 'wrong.hadaDo', 'wrong.nomInsult', 'wrong.particleAlwaysSound', 'wrong.ga16c']
  .forEach(id => assert.ok(WRONG_CARDS[id], `${id} 가 있어야 한다`));
assert.equal(WRONG_CARDS['wrong.eorinYoung'].text, '나이가 어린', '어린 = 나이 어린 (handoff 의 대표 오개념)');
// 학설이 갈리는 카드에는 작가 주의가 붙는다
assert.ok(isStr(WRONG_CARDS['wrong.araeaIsA'].caution), 'ㆍ 소리값은 채점하지 않는다는 주의');

// ── 4) 표기: 날 첫가끝 자모 없음, 모두 그려짐, 뜻하지 않은 방점·밑줄 없음 ──
const CONJOINING = /[ᄀ-ᇿꥠ-꥿ힰ-퟿]/u;
for (const rel of FILES) {
  for (const s of jsStrings(readFileSync(join(ROOT, rel), 'utf8'))) {
    assert.ok(!CONJOINING.test(s.value), `${rel}:${s.line}: 날 첫가끝 자모 — 대괄호 호환 자모 표기로 적는다`);
    assert.ok(!s.value.includes('_'), `${rel}:${s.line}: 밑줄표(_)는 꾸밈 표기라 쓰지 않는다`);
  }
}
let nStr = 0;
function walk(v, path) {
  if (typeof v === 'string') {
    nStr++;
    let out;
    assert.doesNotThrow(() => { out = Y.render(v, { bangjeom: true, ruby: 'paren' }); }, `${path}: 표기 오류`);
    assert.ok(!/[〮〯]/u.test(out), `${path}: 뜻하지 않은 방점이 생겼다(가운뎃점·쌍점을 음절 앞에 붙였나) — ${v}`);
    return;
  }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`);
}
walk(RULE_CARDS, 'RULE_CARDS');
walk(DOGAM, 'DOGAM');
walk(WRONG_CARDS, 'WRONG_CARDS');
// 옛 음절이 실제로 조합된다(예: 어두 자음군 ᄠᅳᆮ)
assert.ok(CONJOINING.test(Y.render(RULE_CARDS['rule.initialCluster'].text)), '[ㅳㅡㄷ] 이 옛한글 음절로 조합된다');

console.log(`k1-lists ok: 규칙 카드 ${ruleIds.length}장, 도감 ${Object.keys(DOGAM).length}자, 오답 카드 ${wrongIds.length}장, 문자열 ${nStr}개`);
