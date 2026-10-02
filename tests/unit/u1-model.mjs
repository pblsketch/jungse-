// U1 주소 값 해석과 수첩·수첩 이미지 데이터 모델(화면 없이)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load([
  'js/core/ns.js', 'js/data/stages.js', 'js/data/jamo.js', 'js/data/rules-config.js', 'js/data/profanity.js',
  'js/data/text-ui.js', 'tests/fixtures/ui-data.js',
  'js/core/yet.js', 'js/core/rules.js', 'js/core/nickname.js', 'js/core/save.js',
  'js/ui/app-dom.js', 'js/ui/app-url.js', 'js/ui/notebook-model.js'
]);
const NM = ctx.NM;
const plain = (v) => JSON.parse(JSON.stringify(v));

// ── 주소 값 (spec §19-1)
const P = NM.ui.url.parse;
assert.deepEqual(plain(P('?level=h1')), { level: 'h1', teacher: false });
assert.deepEqual(plain(P('?teacher=1&level=h23')), { level: 'h23', teacher: true });
assert.deepEqual(plain(P('?level=x&teacher=0')), { level: null, teacher: false });
assert.deepEqual(plain(P('')), { level: null, teacher: false });
assert.deepEqual(plain(P('?teacher=1')), { level: null, teacher: true });
assert.equal(NM.ui.url.KEYS.level, 'level');
assert.equal(NM.ui.url.KEYS.teacher, 'teacher');

// ── 저장소 흉내
function memStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), dump: () => [...m.entries()] };
}
const storage = memStorage();
const store = NM.core.save.createStore({ storage });
assert.ok(store.setup({ level: 'm', protagonist: 2, nickname: '해솔' }).ok);
const S2 = NM.data.SCENES.s2;
const M = NM.ui.notebookModel;
const now = new Date(2026, 9, 1, 14, 5);

// 진행 중: 맥락 하나 보고, 과제 한 번 틀림
store.seeContext(S2, 'test.c1');
store.submit(S2, 's2.t1', false);
let img = plain(M.image(store, 's2', { name: '김하나', number: '7', teacher: false, now }));
assert.equal(img.status, 'progress');
assert.equal(img.statusText, '진행 중');
assert.equal(img.stageName, '시험 장면 둘');
assert.equal(img.stageLabel, '제2장');
assert.equal(img.levelLabel, '중학교');
assert.equal(img.name, '김하나');
assert.equal(img.number, '7');
assert.equal(img.nickname, '해솔');
assert.equal(img.teacher, false);
assert.equal(img.teacherText, '');
assert.equal(img.items.length, 0);
assert.equal(img.glyph, '', '끝내기 전엔 패 글자 없음');
assert.equal(img.stats.helps, 1);
assert.equal(img.stats.self, 0);
assert.equal(img.stats.byHelp, 0);
assert.equal(img.stats.growthText, '스스로 확정한 말 0 · 도움 받아 확정한 말 0');
assert.equal(img.stats.misreadText, '0번');
assert.ok(!('firstTryText' in img.stats) && !('firstTryRate' in img.stats), '첫 시도 정확도(%)는 이미지에 싣지 않는다');
assert.ok(/2026/.test(img.createdText) && /14:05/.test(img.createdText), img.createdText);
assert.equal(typeof img.title, 'string');
assert.ok(img.title.length > 0);
assert.equal(img.gameTitle, NM.core.yet.render('나랏말[ㅆㆍ]미'));
// 이름·번호는 기록에 들어가지 않는다
assert.ok(!storage.dump().some(([, v]) => v.includes('김하나')), '이름이 저장되면 안 된다');

// 끝내기: 해독 항목 확정(첫 시도 정답), 과제 확정, 옮긴 구절, 돌아보기
store.seeContext(S2, 'test.c2');
store.choose(S2, 's2.r1', 's2.r1.a');
assert.ok(store.confirm(S2, 's2.r1').correct);
store.submit(S2, 's2.t1', true);
store.addTranslation('s2', 's2.tr1');
store.setReflection('s2', '아래아가 재미있었다');
assert.ok(store.completeStage(S2).ok);
img = plain(M.image(store, 's2', { name: '', number: '', teacher: false, now }));
assert.equal(img.status, 'done');
assert.equal(img.statusText, '완료');
assert.equal(img.glyph, 'ㆍ');
assert.equal(img.items.length, 1);
assert.equal(img.items[0].modern, '말씀이');
assert.ok(img.items[0].orig.length > 0, '원문은 렌더된 옛한글');
assert.ok(!/[[\]]/.test(img.items[0].orig), '표기 기호가 남으면 안 된다');
assert.deepEqual(img.translations, ['시험으로 옮긴 구절']);
assert.deepEqual(img.rules.map(r => r.name), ['아래아']);
assert.equal(img.reflection, '아래아가 재미있었다');
assert.equal(img.stats.self, 1, '해독 항목을 스스로 확정');
assert.equal(img.stats.byHelp, 0);
assert.equal(img.stats.growthText, '스스로 확정한 말 1 · 도움 받아 확정한 말 0');
assert.equal(img.stats.misreads, 0);
assert.equal(img.title, '견습 통사', 'm 묶음 4개 중 s2 하나 → 절반 미만');

// 수첩 화면 모델
const v = plain(M.view(store, 's2'));
assert.equal(v.status, 'done');
assert.equal(v.items.length, 1);
assert.deepEqual(plain(v.growth), { self: 1, byHelp: 0, growthText: '스스로 확정한 말 1 · 도움 받아 확정한 말 0' });
assert.equal(v.items[0].word, '·[ㅁㆍㄹ][ㅆㆍ]·미', '화면용은 표기 그대로(화면이 조합)');
assert.deepEqual(v.translations.map(x => x.text), ['시험으로 옮긴 구절']);
assert.deepEqual(v.rulesLearned.map(r => r.id), ['rule.araea']);
assert.deepEqual(v.rulesUnlearned.map(r => r.id).sort(), ['rule.bangjeom', 'rule.nomCase']);
// levels 가 있는 규칙 카드는 그 학교급에서만 보인다(store.level = m)
ctx.NM.data.RULE_CARDS['rule.h23only'] = { id: 'rule.h23only', name: '고2~3 규칙', text: '시험', stage: 's7', levels: ['h23'] };
ctx.NM.data.RULE_CARDS['rule.mAlso'] = { id: 'rule.mAlso', name: '중학교 규칙', text: '시험', stage: 's3', levels: ['m', 'h1'] };
const vLv = plain(M.view(store, 's2')).rulesUnlearned.map(r => r.id);
assert.ok(vLv.indexOf('rule.mAlso') >= 0 && vLv.indexOf('rule.h23only') < 0, '학교급 밖 규칙 카드는 빠진다');
delete ctx.NM.data.RULE_CARDS['rule.h23only']; delete ctx.NM.data.RULE_CARDS['rule.mAlso'];
const nom = v.rulesUnlearned.filter(r => r.id === 'rule.nomCase')[0];
assert.equal(nom.stageName, '제6장', '장면 데이터가 없으면 장면 번호 이름');
const bj = v.rulesUnlearned.filter(r => r.id === 'rule.bangjeom')[0];
assert.equal(bj.stageName, '시험 장면 넷');
assert.equal(v.dogam.length, 2);
assert.equal(v.dogam.filter(d => d.glyph === 'ㆍ')[0].found, true);
assert.equal(v.dogam.filter(d => d.glyph === 'ㅿ')[0].found, false);
assert.equal(M.stageName('s12'), '종장');
// 배열 모양 translate 도 읽는다
const ts4 = NM.core.save.createStore({ storage: memStorage() });
ts4.setup({ level: 'h1', protagonist: 1, nickname: 'abc' });
ts4.addTranslation('s4', 's4.tr1');
assert.deepEqual(plain(M.view(ts4, 's4')).translations.map(x => x.text), ['시험 ·구절 넷'], '화면용은 표기 그대로');
// 제4장·제10장은 방점 끄기와 상관없이 늘 켠다
ts4.setSettings({ bangjeom: false });
assert.equal(M.bangjeomFor(ts4, 's4'), true);
assert.equal(M.bangjeomFor(ts4, 's10'), true);
assert.equal(M.bangjeomFor(ts4, 's2'), false);
const img4 = plain(M.image(ts4, 's4', { now }));
assert.ok(img4.translations[0].includes('\u302E'), '이미지의 s4 옮긴 구절에 방점');

// 교사 모드: 메모리 저장소, 교사 모드 표시, 별명 없음
const ts = NM.core.save.createStore({ teacher: true, level: 'h1' });
img = plain(M.image(ts, 's4', { name: '', number: '', teacher: true, now }));
assert.equal(img.teacher, true);
assert.equal(img.teacherText, '교사 모드');
assert.equal(img.levelLabel, '고1');
assert.equal(img.nickname, '');
assert.equal(img.status, 'progress');
assert.equal(img.stats.growthText, '스스로 확정한 말 0 · 도움 받아 확정한 말 0');
// 도움 받아 확정한 말: 선배가 정답을 알려 주면(도움 마지막 단계) '도움 받아'로 센다. 첫 시도 정확도와 달리 비율은 없다.
{
  const hs = NM.core.save.createStore({ storage: memStorage() });
  hs.setup({ level: 'm', protagonist: 1, nickname: 'abc' });
  hs.seeContext(S2, 'test.c1'); hs.seeContext(S2, 'test.c2');
  for (let i = 0; i < NM.core.rules.helpMax(); i++) hs.requestHelp(S2, 's2.r1');
  assert.equal(hs.stage('s2').items['s2.r1'].state, 'confirmedByHelp');
  const hi = plain(M.image(hs, 's2', { now }));
  assert.equal(hi.stats.self, 0);
  assert.equal(hi.stats.byHelp, 1);
  assert.equal(hi.stats.growthText, '스스로 확정한 말 0 · 도움 받아 확정한 말 1');
  assert.equal(plain(M.view(hs, 's2')).growth.byHelp, 1);
}
console.log('u1 model ok');
