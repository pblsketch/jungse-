#!/usr/bin/env node
// 原文 추출 도구 (의존 패키지 없음).
// design/research/*.md 의 spec §19-2 原文 블록 → js/data/orig.generated.js (NM.data.ORIG).
//
//   node tools/extract_orig.mjs             만들기(다시 쓰기)
//   node tools/extract_orig.mjs --check     만들지 않고, 파일이 지금 문서와 다르거나 블록 형식이 틀렸으면 실패(종료 코드 1)
//   --root <폴더>                           저장소 뿌리 대신 다른 뿌리(시험용 예시 데이터)
//
// 블록 형식 (spec §19-2):
//   #### O-s4-YB2
//   > **原文** 「용비어천가」 제2장 (1447)
//   > (원문 한 줄. 데이터 표기 규칙으로 적음)
//   - 출처: <URL> 또는 교과서 쪽(예: 공통국어2 132쪽)
//   - 대조: <URL> [, <URL>]
//   - 확실도: ◎ | ○ | △
//   - 교과서: <교과서·쪽> [★ 교과서 대조 필요]
//
// 정한 것:
// - 원문 줄은 '>' 와 그 뒤 빈칸 하나만 떼고 글자 그대로 옮긴다(끝 공백만 지움, 정규화 없음). 빈 '>' 줄은 형식 오류다.
// - 확실도 △ 블록은 ORIG 에 넣지 않는다(spec §12 "확인하지 못한 원문은 데이터에 넣지 않는다"). skipped 로 알린다.
// - 코드 울타리(``` / ~~~) 안은 읽지 않는다(문서에 형식 견본을 적어도 된다).
// - id 없는 '> **原文**' 블록은 경고만 한다(데이터가 참조할 수 없다).
// - 문서 순서(파일 이름 순 → 문서 안 순서)대로 적는다. 줄바꿈은 LF. 비교할 때는 CRLF 를 LF 로 보고 비교한다.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_REL = 'js/data/orig.generated.js';
export const BLOCK_ID_RE = /^O-s(?:[0-9]|1[0-2])-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const CERTAINTY = ['◎', '○', '△'];

function researchDocs(root) {
  const dir = join(root, 'design', 'research');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(n => n.endsWith('.md') && statSync(join(dir, n)).isFile())
    .sort()
    .map(n => ({ rel: `design/research/${n}`, path: join(dir, n) }));
}

// → { orig, skipped: {id: {doc, line, certainty}}, errors: [..], warnings: [..], blocks: n, docs: n }
export function extractOrig(root = REPO_ROOT) {
  const orig = {};
  const skipped = {};
  const seen = {}; // id → where
  const errors = [];
  const warnings = [];
  const docs = researchDocs(root);
  for (const doc of docs) {
    const lines = readFileSync(doc.path, 'utf8').split(/\r?\n/);
    let fence = null;
    const consumed = new Set();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const f = /^\s*(```|~~~)/.exec(line);
      if (f) { if (!fence) fence = f[1]; else if (f[1] === fence) fence = null; continue; }
      if (fence) continue;
      const head = /^####\s+(O-\S*)\s*$/.exec(line);
      if (head) {
        const r = parseBlock(lines, i, doc.rel, head[1]);
        r.consumed.forEach(n => consumed.add(n));
        errors.push(...r.errors);
        if (!r.block) continue;
        const id = head[1];
        const where = `${doc.rel}:${i + 1}`;
        if (seen[id]) { errors.push(`${where}: 原文 블록 id ${id} 가 겹친다 (먼저 나온 곳 ${seen[id]})`); continue; }
        seen[id] = where;
        if (r.block.certainty === '△') { skipped[id] = { doc: doc.rel, line: i + 1, certainty: '△' }; continue; }
        orig[id] = r.block;
        continue;
      }
      if (/^>\s*\*\*原文\*\*/.test(line) && !consumed.has(i)) {
        warnings.push(`${doc.rel}:${i + 1}: id(#### O-…) 없는 原文 블록 — 데이터가 참조할 수 없다`);
      }
    }
    if (fence) warnings.push(`${doc.rel}: 닫히지 않은 코드 울타리(${fence})`);
  }
  return { orig, skipped, errors, warnings, blocks: Object.keys(orig).length + Object.keys(skipped).length, docs: docs.length };
}

function parseBlock(lines, at, rel, id) {
  const errors = [];
  const consumed = [];
  const where = (k) => `${rel}:${k + 1}`;
  if (!BLOCK_ID_RE.test(id)) {
    errors.push(`${where(at)}: 原文 블록 id '${id}' 형식이 틀렸다 (O-<장면 s0~s12>-<영문·숫자 약칭>, 예: O-s4-YB2)`);
    return { block: null, errors, consumed };
  }
  let i = at + 1;
  while (i < lines.length && lines[i].trim() === '') i++;
  const t = /^>\s*\*\*原文\*\*\s*(.*)$/.exec(lines[i] || '');
  if (!t) {
    errors.push(`${where(at)}: ${id} 바로 다음에 '> **原文** <제목>' 줄이 없다`);
    return { block: null, errors, consumed };
  }
  consumed.push(i);
  const title = t[1].replace(/\s+$/, '');
  if (!title) errors.push(`${where(i)}: ${id} 의 原文 제목(문헌·위치)이 비었다`);
  i++;
  const body = [];
  for (; i < lines.length && /^>/.test(lines[i]); i++) {
    const text = lines[i].replace(/^> ?/, '').replace(/\s+$/, '');
    if (text === '') { errors.push(`${where(i)}: ${id} 에 빈 原文 줄이 있다 (빈 '>' 줄 금지)`); continue; }
    body.push(text);
  }
  if (!body.length) errors.push(`${where(at)}: ${id} 에 原文 줄이 없다`);
  // 메타 목록
  while (i < lines.length && lines[i].trim() === '') i++;
  const meta = {};
  for (; i < lines.length; i++) {
    const m = /^\s*[-*]\s*([^:：]+?)\s*[:：]\s*(.*)$/.exec(lines[i]);
    if (!m) break;
    meta[m[1].trim()] = { value: m[2].trim(), line: i };
  }
  const need = (k) => {
    if (!meta[k] || !meta[k].value) { errors.push(`${where(at)}: ${id} 에 '- ${k}:' 줄이 없다`); return null; }
    return meta[k];
  };
  const src = need('출처');
  const cmp = need('대조');
  const cert = need('확실도');
  // 출처·대조는 URL 또는 교과서 쪽 표시(기준 본문이 교과서인 경우, 예: 공통국어2 132쪽). 둘 중 적어도 하나에는 URL 이 있어야 한다.
  const URL_RE = /https?:\/\//, PAGE_RE = /[0-9]+\s*쪽/;
  if (src && !URL_RE.test(src.value) && !PAGE_RE.test(src.value)) errors.push(`${where(src.line)}: ${id} 출처에 URL 이나 교과서 쪽이 없다`);
  if (cmp && !URL_RE.test(cmp.value) && !PAGE_RE.test(cmp.value)) errors.push(`${where(cmp.line)}: ${id} 대조에 URL 이나 교과서 쪽이 없다`);
  if (src && cmp && !URL_RE.test(src.value + cmp.value)) errors.push(`${where(src.line)}: ${id} 출처·대조 어디에도 URL 이 없다`);
  let certainty = null;
  if (cert) {
    certainty = [...cert.value].find(ch => CERTAINTY.includes(ch)) || null;
    if (!certainty) errors.push(`${where(cert.line)}: ${id} 확실도는 ◎ ○ △ 중 하나여야 한다 ('${cert.value}')`);
  }
  if (errors.length) return { block: null, errors, consumed };
  // 화면 출처는 URL: 출처 칸에 URL 이 없고 교과서 쪽만 있으면 대조 칸의 첫 URL 을 쓴다(교과서 출판사·쪽은 화면에 적지 않음)
  const firstUrl = (v) => { const m = v && v.match(/https?:\/\/[^\s<>]+/); return m ? m[0].replace(/[,.;]+$/, '') : null; };
  const srcUrl = firstUrl(src.value) || firstUrl(cmp && cmp.value) || src.value;
  const block = { title, lines: body, src: srcUrl, certainty, doc: rel };
  // '- 방점: 표기 안 함' 블록은 방점을 판독하지 못한 구절이다(평성이라는 뜻이 아님). 화면은 방점 설정과 상관없이 방점 없이 보인다.
  if (meta['방점'] && /^표기\s*안\s*함/.test(meta['방점'].value)) block.noBangjeom = true;
  // '- 현대어: …' 화면의 현대어 풀이(설정으로 켜고 끔). 原文 줄이 여럿이면 ' / ' 로 나눠 줄마다 하나씩.
  if (meta['현대어'] && meta['현대어'].value) {
    const parts = meta['현대어'].value.split(/\s+\/\s+/).map(x => x.trim());
    if (parts.length !== body.length || parts.some(x => !x)) {
      errors.push(`${where(meta['현대어'].line)}: ${id} 현대어 풀이는 原文 줄 수(${body.length})만큼 ' / ' 로 나눠 쓴다 (지금 ${parts.length}개)`);
      return { block: null, errors, consumed };
    }
    if (parts.some(x => /[\[\]{}|]/.test(x))) {
      errors.push(`${where(meta['현대어'].line)}: ${id} 현대어 풀이에 표기 기호([ ] { } |)가 있다 — 오늘날 글자로만 쓴다`);
      return { block: null, errors, consumed };
    }
    block.modern = parts;
  }
  return { block, errors, consumed };
}

export function renderGenerated(orig) {
  return [
    "'use strict';",
    '/*',
    ' * 자동 생성 파일 — 손으로 고치지 않는다.',
    ' * 만든 도구: tools/extract_orig.mjs (원본: design/research/*.md 의 spec §19-2 原文 블록, 확실도 △ 제외)',
    ' * 다시 만들기: node tools/extract_orig.mjs    낡았는지 점검: node tools/extract_orig.mjs --check',
    ' * NM.data.ORIG[<블록 id>] = { title, lines: [원문 줄…], src: <출처 URL 또는 교과서 쪽>, certainty: ◎|○, doc: <리서치 문서>, noBangjeom?: true, modern?: [줄마다 현대어 풀이] }',
    ' */',
    'window.NM = window.NM || {};',
    'NM.data = NM.data || {};',
    'NM.data.ORIG = ' + JSON.stringify(orig, null, 2) + ';',
    ''
  ].join('\n');
}

export const normalizeEol = (s) => s.replace(/\r\n/g, '\n');

// 자동 생성 파일 글을 읽어 ORIG 객체로 (읽지 못하면 null)
export function readGeneratedOrig(text) {
  try {
    const ctx = { window: {} };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(text, ctx, { filename: OUT_REL });
    return (ctx.NM && ctx.NM.data && ctx.NM.data.ORIG) || null;
  } catch { return null; }
}

// 있는 ORIG 와 문서에서 뽑은 ORIG 의 차이 → [[어디, 왜], …] (블록·줄 단위)
export function diffOrig(have, want, skipped = {}) {
  const out = [];
  have = have || {};
  for (const id of new Set([...Object.keys(have), ...Object.keys(want)])) {
    const a = have[id], b = want[id];
    if (!a) { out.push([`${OUT_REL} ${id}`, `리서치 문서(${b.doc})에 있는 블록이 자동 생성 파일에 없다 — 추출 도구를 다시 돌린다`]); continue; }
    if (!b) { out.push([`${OUT_REL} ${id}`, skipped[id] ? '확실도 △ 블록이 자동 생성 파일에 들어 있다' : '리서치 문서에 없는 블록이다(손으로 넣었거나 문서에서 지워짐)']); continue; }
    const al = Array.isArray(a.lines) ? a.lines : [], bl = b.lines;
    for (let i = 0; i < Math.max(al.length, bl.length); i++) {
      if (al[i] !== bl[i]) out.push([`${OUT_REL} ${id}.lines[${i}]`, `原文 글자가 리서치 문서(${b.doc})와 다르다: ${JSON.stringify(al[i])} ≠ ${JSON.stringify(bl[i])}`]);
    }
    if (JSON.stringify(a.modern || null) !== JSON.stringify(b.modern || null)) out.push([`${OUT_REL} ${id}.modern`, `현대어 풀이가 리서치 문서(${b.doc})와 다르다 — 추출 도구를 다시 돌린다`]);
    for (const k of ['title', 'src', 'certainty', 'doc']) {
      if (a[k] !== b[k]) out.push([`${OUT_REL} ${id}.${k}`, `리서치 문서와 다르다: ${JSON.stringify(a[k])} ≠ ${JSON.stringify(b[k])}`]);
    }
  }
  return out;
}

function main(argv) {
  const check = argv.includes('--check');
  const ri = argv.indexOf('--root');
  const root = ri >= 0 ? resolve(argv[ri + 1]) : REPO_ROOT;
  const r = extractOrig(root);
  r.warnings.forEach(w => console.log('  경고 ' + w));
  if (r.errors.length) {
    r.errors.forEach(e => console.log('  FAIL ' + e));
    console.log(`extract_orig: 原文 블록 형식 오류 ${r.errors.length}건 — 고친 뒤 다시 돌린다`);
    return 1;
  }
  const text = renderGenerated(r.orig);
  const out = join(root, OUT_REL);
  const summary = `原文 블록 ${Object.keys(r.orig).length}개 (△ 제외 ${Object.keys(r.skipped).length}개, 문서 ${r.docs}개)`;
  if (check) {
    const cur = existsSync(out) ? normalizeEol(readFileSync(out, 'utf8')) : null;
    if (cur === null) { console.log(`  FAIL ${OUT_REL} 없음 — node tools/extract_orig.mjs 를 돌린다`); return 1; }
    if (cur !== text) {
      diffOrig(readGeneratedOrig(cur), r.orig, r.skipped).forEach(([w, why]) => console.log(`  FAIL ${w} — ${why}`));
      console.log(`  FAIL ${OUT_REL} 가 리서치 문서와 다르다(낡았거나 손으로 고침) — node tools/extract_orig.mjs 를 다시 돌린다`);
      return 1;
    }
    console.log(`extract_orig --check ok: ${summary}`);
    return 0;
  }
  writeFileSync(out, text, 'utf8');
  console.log(`extract_orig: ${OUT_REL} 를 썼다 — ${summary}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
