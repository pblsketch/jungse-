// U1 화면 문구·코드 규칙: TEXT.ui 병합, 화면 코드의 문구 열쇠가 모두 있는지, 화면 코드에 한국어 문장이 없는지,
// 금지 낱말, console.error·저장소 직접 쓰기·외부 주소 없음.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../lib/load.mjs';

// 1) 병합: 이미 있는 NM.data.TEXT 를 덮어쓰지 않는다
const ctx = { console };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext("window.NM = { data: { TEXT: { stage: { keep: 'x' } } } };", ctx);
vm.runInContext(readFileSync(join(ROOT, 'js/data/text-ui.js'), 'utf8'), ctx, { filename: 'text-ui.js' });
assert.equal(ctx.NM.data.TEXT.stage.keep, 'x', 'TEXT.stage 를 지우면 안 된다');
const T = ctx.NM.data.TEXT.ui;
assert.ok(T && typeof T === 'object', 'TEXT.ui 가 있어야 한다');

// 2) 화면 코드 파일들
const MINE = /^(app|screen|settings|teacher|notebook)[\w-]*\.js$/;
const uiDir = join(ROOT, 'js/ui');
const files = readdirSync(uiDir).filter(f => MINE.test(f)).sort();
for (const need of ['app.js', 'app-dom.js', 'app-url.js', 'screens.js', 'settings.js', 'teacher.js', 'notebook.js', 'notebook-model.js', 'notebook-image.js']) {
  assert.ok(files.includes(need), `js/ui/${need} 가 있어야 한다`);
}
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
const get = (key) => key.split('.').reduce((o, k) => (o != null && typeof o === 'object') ? o[k] : undefined, T);
const missing = [];
for (const f of files) {
  const src = readFileSync(join(uiDir, f), 'utf8');
  const code = stripComments(src);
  // 화면 코드 안 한국어 금지(주석 제외)
  const hangul = code.match(/[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]+/g);
  assert.equal(hangul, null, `js/ui/${f}: 코드에 한국어 글자 ${JSON.stringify(hangul)}`);
  assert.ok(!/console\.error/.test(code), `js/ui/${f}: console.error 금지`);
  assert.ok(!/localStorage\s*\.\s*(setItem|removeItem|clear)|sessionStorage|indexedDB|document\.cookie/.test(code), `js/ui/${f}: 저장소에 직접 쓰지 않는다(기록은 store 로만)`);
  assert.ok(!/https?:\/\//.test(code), `js/ui/${f}: 외부 주소 금지`);
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(code), `js/ui/${f}: 네트워크 요청 금지`);
  assert.ok(!/innerHTML\s*=/.test(code), `js/ui/${f}: innerHTML 금지`);
  assert.ok(!/setTimeout|setInterval/.test(code) || f === 'app.js' || f === 'notebook-image.js', `js/ui/${f}: 타이머 금지(시간 제한 없음)`);
  for (const m of code.matchAll(/\bt\(\s*'([^']+)'/g)) {
    // 'a.b.' + 값 처럼 이어 붙이는 열쇠는 앞부분이 묶음(객체)이어야 한다
    if (m[1].endsWith('.')) { const g = get(m[1].slice(0, -1)); if (!g || typeof g !== 'object') missing.push(`${f}: ${m[1]}`); }
    else if (typeof get(m[1]) !== 'string') missing.push(`${f}: ${m[1]}`);
  }
}
assert.deepEqual(missing, [], '없는 문구 열쇠');

// 3) 금지 낱말(시간 제한·점수·순위·게임오버 없음)
const all = [];
(function walk(v) { if (typeof v === 'string') all.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(T);
const banned = ['게임오버', '게임 오버', '점수', '순위', '랭킹', '제한 시간', '남은 시간', '실패했', '패배'];
for (const s of all) for (const b of banned) assert.ok(!s.includes(b), `금지 낱말 '${b}': ${s}`);
// 옛한글 표기 기호와 부딪히는 글자 금지(중괄호·밑줄표·역빗금). 대괄호는 gameTitle 의 음절 표기에만.
for (const s of all) assert.ok(!/[{}_\\]/.test(s), `문구에 표기 기호: ${s}`);
for (const s of all) if (s !== T.gameTitle) assert.ok(!/[[\]]/.test(s), `문구에 대괄호: ${s}`);
// 날 첫가끝 자모 금지(표기로 적는다)
for (const s of all) assert.ok(!/[\u1100-\u11FF\uA960-\uA97F\uD7B0-\uD7FF]/.test(s), `문구에 날 첫가끝 자모: ${s}`);

// 4) 꼭 있어야 하는 문구(spec 의 단추 이름)
assert.equal(T.title.continue, '이어 하기');
assert.equal(T.title.newStart, '새로 시작');
assert.equal(T.title.start, '시작');
assert.equal(T.setup.nicknameErrors.profanity, '다른 별명을 지어 주세요');
assert.equal(T.settings.teacher, '교사 모드');
assert.equal(T.image.statusDone, '완료');
assert.equal(T.image.statusProgress, '진행 중');
assert.equal(T.image.teacherMark, '교사 모드');
for (const k of ['empty', 'tooLong', 'space', 'chars', 'profanity']) assert.equal(typeof T.setup.nicknameErrors[k], 'string');
for (const id of ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12']) assert.equal(typeof T.stageLabels[id], 'string');
console.log(`u1 text ok (${files.length} ui files)`);
