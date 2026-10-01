// C3 ⑤ 문구 점검 (spec §18-1-5, §2-2, §17)
// - 금지 낱말: 화면에 나올 수 있는 문구(NM.data 문자열, maps/*.json 문자열, index.html, manifest)에 FORBIDDEN 낱말이 없다.
//   原文(NM.data.ORIG)은 한 글자도 바꾸지 않으므로 보지 않는다. 별명 비속어 목록(PROFANITY)도 보지 않는다.
// - 화면 코드 안의 한국어 문장 없음: js/core, js/engine, js/ui, js/gimmicks(하위 폴더 포함), js/main.js 의
//   문자열 리터럴(템플릿 글자 부분 포함, 이스케이프를 푼 실제 값)에 한글이 있으면 실패. 주석은 보지 않는다.
//   예외는 아래 CODE_ALLOW 에만 둔다(작게, 까닭 필수). 쓰이지 않는 예외 줄도 실패로 알린다(낡은 예외 방지).
// 사용: node tests/checks/c3-text.mjs [--root <데이터 뿌리>]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, loadData, walkStrings, reporter, walkFiles, relTo, readJson, HANGUL_RE } from '../lib/content.mjs';
import { jsStrings } from '../lib/jsscan.mjs';

// spec §2-2 '만들지 않는 것'에서 나온 금지 낱말 (한 곳에서만 고친다). 띄어 쓴 꼴은 따로 적는다.
// '적'·'보상'처럼 흔한 낱말(적다, 장면 보상)은 넣지 않고 묶음 꼴만 넣는다.
export const FORBIDDEN = [
  '게임오버', '게임 오버', 'game over', 'gameover',
  '점수', '랭킹', '순위표', '경험치', '레벨업', '레벨 업',
  '뽑기', '가챠', '확률형',
  '전투', '적 처치', '공격력', '체력바',
  '타이머', '제한 시간', '시간 제한', '남은 시간', '시간 초과', '반사신경', '콤보',
  '연속 접속', '출석 보상', '일일 보상'
];

// 화면 코드 한글 예외: { file, why, value?(정확히 이 값) | callee?(이 함수 호출의 인자) }
const CODE_ALLOW = [
  { file: 'js/core/yet.js', callee: ['Error', 'composeFail', 'markupFail'],
    why: '옛한글 표기·조합 오류 메시지(데이터 편집자와 점검용). 학생 화면 문구가 아니라 throw/NM.reportError 로만 나가며, c1 단위 점검이 메시지(/옛한글|표기/)를 확인한다' },
  { file: 'js/core/yet.js', value: 'ㅇ',
    why: '화면 읽기용 현대 글자 계산의 자모 상수: 초성 없음 대체 ㅇ, 연서·각자병서의 둘째 ㅇ 판정' },
  { file: 'js/core/yet.js', value: 'ㅏ',
    why: '화면 읽기용 현대 글자 계산의 자모 상수: 현대 중성으로 못 바꿀 때의 대체 모음' }
];

const R = reporter('c3-text');
const { root } = parseArgs();

// 1) 금지 낱말
const forb = FORBIDDEN.map(w => ({ w, re: new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s*'), 'i') }));
let nScan = 0;
function scanWords(s, where) {
  nScan++;
  let hits = 0;
  for (const f of forb) if (f.re.test(s)) { hits++; R.error(where, `금지 낱말 '${f.w}' (spec §2-2 만들지 않는 것): ${JSON.stringify(s.length > 60 ? s.slice(0, 60) + '…' : s)}`); }
  return hits;
}
const { NM, data, loadErrors, where } = loadData(root);
R.setWhere(where);
loadErrors.forEach(e => R.error(e.file, `불러오기 실패: ${e.message}`));
const yet = NM.core.yet;
walkStrings(data, 'NM.data', (s, path) => {
  if (scanWords(s, path)) return;
  // 꾸밈(**굵게**·루비)으로 갈라 쓴 낱말도 잡는다
  try { const plain = yet.render(s, { bangjeom: false, ruby: 'base' }); if (plain !== s) { nScan--; scanWords(plain, path); } } catch { /* 표기 오류는 c3-yet 가 알린다 */ }
}, { skip: (p) => p === 'NM.data.ORIG' || p === 'NM.data.JAMO' || p === 'NM.data.PROFANITY' });
for (const f of walkFiles(join(root, 'maps'), n => n.endsWith('.json'))) {
  const rel = relTo(root, f);
  try { walkStrings(readJson(f), rel, scanWords); } catch { /* JSON 오류는 c3-data 가 알린다 */ }
}
for (const rel of ['index.html', 'manifest.webmanifest']) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => scanWords(line, `${rel}:${i + 1}`));
}

// 2) 화면 코드 안의 한국어
const codeFiles = [];
for (const d of ['js/core', 'js/engine', 'js/ui', 'js/gimmicks']) codeFiles.push(...walkFiles(join(root, d), n => n.endsWith('.js')).map(p => relTo(root, p)));
if (existsSync(join(root, 'js/main.js'))) codeFiles.push('js/main.js');
const used = new Set();
let nLit = 0;
for (const rel of codeFiles) {
  for (const s of jsStrings(readFileSync(join(root, rel), 'utf8'))) {
    nLit++;
    if (!HANGUL_RE.test(s.value)) continue;
    const a = CODE_ALLOW.findIndex(x => x.file === rel && ((x.value !== undefined && x.value === s.value) || (x.callee && x.callee.includes(s.callee))));
    if (a >= 0) { used.add(a); continue; }
    R.error(`${rel}:${s.line}`, `화면 코드에 한국어 문자열 ${JSON.stringify(s.value)} — 화면 문구는 js/data/text-*.js(NM.data.TEXT)에 두고 NM.engine.text(key, …)로 읽는다 (spec §17)`);
  }
}
CODE_ALLOW.forEach((x, i) => {
  if (!used.has(i) && codeFiles.includes(x.file)) R.error(`tests/checks/c3-text.mjs CODE_ALLOW[${i}]`, `${x.file} 예외가 더는 쓰이지 않는다 — 지운다`);
});

R.finish(`문구 ${nScan}개 · 금지 낱말 ${FORBIDDEN.length}개, 화면 코드 ${codeFiles.length}개 파일 문자열 ${nLit}개 (예외 ${CODE_ALLOW.length}개)`);
