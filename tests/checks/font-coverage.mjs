// 글꼴 범위 점검: 화면에 나올 수 있는 모든 글자가 NMYet 글꼴에 들어 있는가.
// - assets/fonts/coverage.json 은 tools/build_fonts.py 가 글꼴과 함께 만든다(cmap 목록 + 파일 해시).
// - 대상: js/data/**/*.js 의 모든 문자열을 NM.core.yet.render 로 렌더한 결과(표기 오류 = 실패)
//         + design/research/*.md 의 `> **原文**` 블록 글자.
// - 글자가 빠졌으면: python tools/build_fonts.py 를 다시 돌린다.
// - --root <폴더>: 데이터(js/data, design/research)만 그 뿌리에서 읽는다(C3 시험용 예시 데이터). 글꼴·css 는 늘 저장소 것.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const ri = process.argv.indexOf('--root');
const DATA_ROOT = ri >= 0 ? resolve(process.argv[ri + 1]) : ROOT;
const rel = (p) => relative(DATA_ROOT, p).split('\\').join('/');
const cov = JSON.parse(readFileSync(join(ROOT, 'assets/fonts/coverage.json'), 'utf8'));
const inRanges = (ranges) => {
  const set = new Set();
  for (const [a, b] of ranges) for (let c = a; c <= b; c++) set.add(c);
  return set;
};

// 1) 글꼴 파일이 coverage.json 과 맞는가 (낡은 목록 방지)
const fonts = {};
for (const name of ['NMYet', 'NMSans']) {
  const f = cov.fonts && cov.fonts[name];
  assert.ok(f, `coverage.json 에 ${name} 없음`);
  const path = join(ROOT, 'assets/fonts', f.file);
  assert.ok(existsSync(path), `${f.file} 없음`);
  const sha = createHash('sha256').update(readFileSync(path)).digest('hex');
  assert.equal(sha, f.sha256, `${f.file} 이 coverage.json 과 다르다 — build_fonts.py 를 다시 돌릴 것`);
  fonts[name] = inRanges(f.ranges);
}
// 보조 글꼴(NMYetExt): KR 판에 없는 한자만 담는다. 있으면 같은 방식으로 맞춰 보고 NMYet 범위에 더한다.
const ext = cov.fonts && cov.fonts.NMYetExt;
if (ext) {
  const path = join(ROOT, 'assets/fonts', ext.file);
  assert.ok(existsSync(path), `${ext.file} 없음`);
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'), ext.sha256, `${ext.file} 이 coverage.json 과 다르다 — build_fonts.py 를 다시 돌릴 것`);
}
assert.ok(existsSync(join(ROOT, 'assets/fonts/OFL.txt')), 'OFL.txt 없음');

// 2) NMYet 기본 범위
const yetSet = fonts.NMYet;
const yetAll = new Set([...yetSet, ...(ext ? inRanges(ext.ranges) : [])]);
const must = [[0x1100, 0x11FF], [0xA960, 0xA97C], [0xD7B0, 0xD7C6], [0xD7CB, 0xD7FB], [0x3131, 0x318E],
  [0x302E, 0x302F], [0xAC00, 0xD7A3], [0x20, 0x7E]];
for (const [a, b] of must) for (let c = a; c <= b; c++) {
  assert.ok(yetSet.has(c), `NMYet 에 U+${c.toString(16).toUpperCase()} 없음`);
}
for (const ch of '「」『』·…—“”‘’') assert.ok(yetSet.has(ch.codePointAt(0)), `NMYet 에 ${ch} 없음`);
for (let c = 0xAC00; c <= 0xD7A3; c++) assert.ok(fonts.NMSans.has(c), `NMSans 에 U+${c.toString(16)} 없음`);

// 3) css/fonts.css: 외부 서버 없음, 두 글꼴 선언
const css = readFileSync(join(ROOT, 'css/fonts.css'), 'utf8');
assert.ok(!/https?:|\/\//.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), 'fonts.css 에 외부 주소 금지');
for (const name of ['NMYet', 'NMSans']) {
  assert.ok(new RegExp(`font-family:\\s*['"]${name}['"]`).test(css), `fonts.css 에 ${name} 없음`);
}
assert.ok(/font-display:\s*swap/.test(css), 'font-display: swap');

// 4) 데이터 문자열 렌더 → 글자 모으기
function walkFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p, ext));
    else if (n.endsWith(ext)) out.push(p);
  }
  return out;
}
const dataFiles = walkFiles(join(DATA_ROOT, 'js/data'), '.js').map(rel).filter(p => p !== 'js/data/jamo.js');
const ctx = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', ...dataFiles.map(p => join(DATA_ROOT, p))]);
const yet = ctx.NM.core.yet;
const need = new Map(); // code point → 처음 나온 곳
const add = (s, where) => {
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c === 0x0A || c === 0x0D || c === 0x09) continue;
    if (!need.has(c)) need.set(c, where);
  }
};
const failures = [];
let nStrings = 0;
(function walk(v, path, seen) {
  if (typeof v === 'string') {
    nStrings++;
    try {
      add(yet.render(v, { bangjeom: true, ruby: 'paren' }), path);
    } catch (e) {
      failures.push(`${path}: ${e.message}`);
    }
    return;
  }
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  for (const k of Object.keys(v)) {
    if (path === 'NM.data' && k === 'JAMO') continue; // 자모 표 자체는 표시 문자열이 아니다
    walk(v[k], `${path}.${k}`, seen);
  }
})(ctx.NM.data, 'NM.data', new Set());
assert.deepEqual(failures, [], '데이터 표기 조합 실패');

// 5) 리서치 문서의 原文 블록
let nBlocks = 0;
for (const f of walkFiles(join(DATA_ROOT, 'design/research'), '.md')) {
  if (rel(f).split('/').length !== 3) continue; // design/research/*.md 만
  const lines = readFileSync(f, 'utf8').split(/\r?\n/);
  let inBlock = false;
  lines.forEach((line, i) => {
    if (/^>\s*\*\*原文\*\*/.test(line)) { inBlock = true; nBlocks++; }
    else if (!/^>/.test(line)) { inBlock = false; }
    if (!inBlock) return;
    const text = line.replace(/^>\s?/, '');
    const where = `${rel(f)}:${i + 1}`;
    add(text, where);
    try { add(yet.render(text), where); } catch { /* 마크다운 기호 — 원문 글자는 위에서 이미 셌다 */ }
  });
}

// 6) 빠진 글자
const missing = [];
for (const [c, where] of need) {
  if (c === 0x20) continue;
  if (!yetAll.has(c)) missing.push(`U+${c.toString(16).toUpperCase()} ${String.fromCodePoint(c)} (${where})`);
}
assert.deepEqual(missing, [], 'NMYet·NMYetExt 에 없는 글자 — python tools/build_fonts.py 를 다시 돌릴 것');
console.log(`font coverage ok (data strings ${nStrings}, 原文 blocks ${nBlocks}, code points ${need.size})`);
