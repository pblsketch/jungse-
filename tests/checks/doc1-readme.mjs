// DOC1 README 점검 (plan DOC1 검증): README.md 와 design/README.md 가 실제 저장소와 맞는지 본다. 의존 패키지 없음.
// - 파일 경로: 두 문서의 저장소 안 링크([글](경로))와 `코드` 안의 경로가 모두 있다.
//     링크는 그 문서 폴더 기준, `코드` 경로는 저장소 뿌리 기준(없으면 문서 폴더 기준)으로 찾는다.
//     <id>, <기믹> 같은 꺾쇠 자리와 * 는 '그 폴더에 맞는 것이 하나 이상 있음'으로 본다.
//     README.md 안의 #제목 링크는 GitHub 제목 이름 규칙으로 그 제목이 있는지 본다.
// - 주소 값: 문서에 나온 ?키=값 / &키=값 / `키=값` 이 js/ui/app-url.js 의 키(KEYS)·값과 맞는다.
//     '모르는 값' 줄에 든 예는 거꾸로 받아들여지지 않아야 한다. 코드의 키와 학교급 값은 README 에 모두 나와야 한다.
// - 추천 묶음: README 의 bundles 표(<!-- bundles:start --> ~ <!-- bundles:end -->)가 NM.data.BUNDLES 와 같다(순서·추천 선택·장면 수).
// - 칭호: NM.data.TITLE_RULES 의 칭호 이름이 README 에 모두 나온다.
// 사용: node tests/checks/doc1-readme.mjs
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const DOCS = ['README.md', 'design/README.md'];
// 다른 작업이 앞으로 만드는 경로(아직 없어도 실패로 치지 않고 알리기만 한다).
const FUTURE = {
  'design/qa': 'Q2 가 플레이테스트 기록을 쓴다'
};
const FILE_EXT = /\.(js|mjs|json|md|txt|py|html|css|woff2|mp3|webp|png|yml|ps1|webmanifest|tsv)$/;
const PATH_CHARS = /^[A-Za-z0-9_.\-<>*\/가-힣]+$/;

const errors = [];
const notes = [];
const err = (doc, msg) => errors.push(`${doc}: ${msg}`);
const rel = (abs) => relative(ROOT, abs).split(sep).join('/');

// ── 문서 읽기 ──
const texts = {};
for (const d of DOCS) {
  const p = join(ROOT, d);
  if (!existsSync(p)) { err(d, '파일이 없다'); continue; }
  texts[d] = readFileSync(p, 'utf8');
}

// ── 경로 확인 도구 ──
function patternExists(absPattern) {
  // 꺾쇠 자리·* 가 든 경로: 폴더를 한 단계씩 내려가며 맞는 것을 찾는다.
  const parts = rel(absPattern).split('/');
  if (parts[0] === '..') return false;
  let bases = [ROOT];
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (seg === '') continue;
    const last = i === parts.length - 1;
    const next = [];
    for (const b of bases) {
      if (/[<>*]/.test(seg)) {
        const re = new RegExp('^' + seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/<[^>]*>/g, '[^/]+').replace(/\*/g, '[^/]*') + '$');
        let names = [];
        try { names = readdirSync(b); } catch { names = []; }
        for (const n of names) if (re.test(n)) next.push(join(b, n));
      } else if (existsSync(join(b, seg))) next.push(join(b, seg));
    }
    bases = last ? next : next.filter(x => statSync(x).isDirectory());
    if (!bases.length) return false;
  }
  return bases.length > 0;
}
function exists(abs) {
  if (!rel(abs) || rel(abs).startsWith('..')) return false;
  return /[<>*]/.test(abs) ? patternExists(abs) : existsSync(abs);
}
function futureOf(abs) {
  const r = rel(abs).replace(/\/$/, '');
  for (const k of Object.keys(FUTURE)) if (r === k || r.startsWith(k + '/')) return k;
  return null;
}

// GitHub 제목 이름(앵커) 규칙: 소문자, 글자·숫자·공백·-·_ 만 남기고, 공백은 - 로.
function slug(h) {
  return h.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-');
}
function anchorsOf(text) {
  const out = new Set(), seen = {};
  for (const line of text.split('\n')) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (!m) continue;
    const s0 = slug(m[1].replace(/`/g, ''));
    let s = s0;
    if (seen[s0] !== undefined) { seen[s0]++; s = `${s0}-${seen[s0]}`; } else seen[s0] = 0;
    out.add(s);
  }
  return out;
}
const fenced = (text) => text.replace(/```[\s\S]*?```/g, m => m.replace(/`/g, ' ')); // 코드 블록 안 글을 일반 글처럼

let checkedPaths = 0;
for (const [doc, text] of Object.entries(texts)) {
  const docDir = dirname(join(ROOT, doc));

  // 1) 마크다운 링크
  const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const m of text.matchAll(linkRe)) {
    let target = m[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    let anchor = null;
    const hash = target.indexOf('#');
    if (hash >= 0) { anchor = decodeURIComponent(target.slice(hash + 1)); target = target.slice(0, hash); }
    const abs = target ? resolve(docDir, decodeURIComponent(target)) : join(ROOT, doc);
    checkedPaths++;
    if (!exists(abs)) {
      const f = futureOf(abs);
      if (f) notes.push(`${doc}: 앞으로 생길 경로 ${rel(abs)} (${FUTURE[f]})`);
      else err(doc, `링크 대상이 없다: ${m[1]}`);
      continue;
    }
    if (anchor && rel(abs).endsWith('.md')) {
      const anchors = anchorsOf(readFileSync(abs, 'utf8'));
      if (!anchors.has(anchor)) err(doc, `링크의 제목(#${anchor})이 ${rel(abs)} 에 없다`);
    }
  }

  // 2) `코드` 안의 경로 (코드 블록 포함)
  const codeRe = /`([^`\n]+)`/g;
  for (const m of fenced(text).replace(/```/g, '').matchAll(codeRe)) collectPaths(doc, docDir, m[1]);
  for (const block of text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) collectPaths(doc, docDir, block[1]);
}
function collectPaths(doc, docDir, span) {
  for (const raw of span.split(/\s+/)) {
    const tok = raw.replace(/^[('"]+|[)'",.:;]+$/g, '');
    if (!tok || /^(https?:|--?)/.test(tok) || tok.includes('=') || tok.includes('%')) continue;
    if (!PATH_CHARS.test(tok)) continue;
    if (!tok.includes('/') && !FILE_EXT.test(tok)) continue;
    if (/^\d+\/\d+$/.test(tok)) continue; // 40/40 같은 수
    const candidates = [join(ROOT, tok), resolve(docDir, tok)];
    checkedPaths++;
    if (candidates.some(exists)) continue;
    const f = candidates.map(futureOf).find(Boolean);
    if (f) { notes.push(`${doc}: 앞으로 생길 경로 ${tok} (${FUTURE[f]})`); continue; }
    err(doc, `경로가 없다: ${tok}`);
  }
}

// ── 주소 값 ──
const urlSrc = readFileSync(join(ROOT, 'js/ui/app-url.js'), 'utf8');
const URL_NM = load(['js/core/ns.js', 'js/ui/app-url.js']).NM;
const KEYS = URL_NM.ui.url.KEYS;
const parse = URL_NM.ui.url.parse;
const levelsM = /const LEVELS = \[([^\]]*)\]/.exec(urlSrc);
const LEVELS = levelsM ? [...levelsM[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
if (!LEVELS.length) err('js/ui/app-url.js', 'LEVELS 목록을 읽지 못했다(점검을 고칠 것)');
const keyNames = Object.values(KEYS);
const seenPairs = new Set();
let urlPairs = 0;
for (const [doc, text] of Object.entries(texts)) {
  for (const line of text.split('\n')) {
    const unknownLine = line.includes('모르는 값');
    const pairs = [];
    for (const m of line.matchAll(/[?&]([A-Za-z_]+)=([A-Za-z0-9_]*)/g)) pairs.push([m[1], [m[2]]]);
    for (const m of line.matchAll(/`([A-Za-z_]+)=([^`\s]+)`/g)) pairs.push([m[1], m[2].split('|')]);
    for (const [k, vals] of pairs) {
      if (!keyNames.includes(k)) { err(doc, `코드에 없는 주소 키: ${k}= (코드의 키: ${keyNames.join(', ')})`); continue; }
      for (const v of vals) {
        urlPairs++;
        const out = parse(`?${k}=${v}`);
        const ok = k === KEYS.level ? out.level === v : k === KEYS.teacher ? out.teacher === true : false;
        if (unknownLine) { if (ok) err(doc, `'모르는 값' 예인데 코드가 받아들인다: ${k}=${v}`); }
        else if (!ok) err(doc, `코드가 받아들이지 않는 주소 값: ${k}=${v}`);
        else seenPairs.add(`${k}=${v}`);
      }
    }
  }
}
const readme = texts['README.md'] || '';
for (const k of keyNames) if (!readme.includes('`' + k + '`')) err('README.md', `주소 키 \`${k}\` 설명이 없다`);
for (const lv of LEVELS) if (!seenPairs.has(`${KEYS.level}=${lv}`)) err('README.md', `학교급 값 ${KEYS.level}=${lv} 이 README 에 없다`);
if (!seenPairs.has(`${KEYS.teacher}=1`)) err('README.md', `${KEYS.teacher}=1 이 README 에 없다`);

// ── 추천 묶음 표 ──
const DATA = load(['js/data/stages.js', 'js/data/rules-config.js']).NM.data;
const BUNDLES = DATA.BUNDLES;
const tbl = /<!-- bundles:start[^>]*-->([\s\S]*?)<!-- bundles:end -->/.exec(readme);
const toIds = (cell) => {
  if (/서장/.test(cell)) return null;
  return [...cell.matchAll(/종장|\d+/g)].map(x => x[0] === '종장' ? 's12' : 's' + Number(x[0]));
};
const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
const rowsSeen = new Set();
if (!tbl) err('README.md', '추천 묶음 표(<!-- bundles:start --> ~ <!-- bundles:end -->)가 없다');
else {
  for (const line of tbl[1].split('\n')) {
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 6) continue;
    const lm = /level=([A-Za-z0-9_]+)/.exec(cells[2]);
    if (!lm) continue;
    const lv = lm[1];
    rowsSeen.add(lv);
    const b = BUNDLES[lv];
    if (!b) { err('README.md', `묶음 표의 학교급 ${lv} 이 NM.data.BUNDLES 에 없다`); continue; }
    const stages = toIds(cells[3]);
    const optional = /없음/.test(cells[4]) ? [] : toIds(cells[4]);
    const count = Number((/(\d+)/.exec(cells[5]) || [])[1]);
    if (!same(stages, b.stages)) err('README.md', `묶음 표 ${lv}: '${cells[3]}' ≠ BUNDLES.${lv}.stages ${JSON.stringify(b.stages)}`);
    if (!same(optional, b.optional)) err('README.md', `묶음 표 ${lv} 추천 선택: '${cells[4]}' ≠ BUNDLES.${lv}.optional ${JSON.stringify(b.optional)}`);
    if (count !== b.stages.length) err('README.md', `묶음 표 ${lv} 장면 수: ${cells[5]} ≠ ${b.stages.length}`);
  }
  for (const lv of Object.keys(BUNDLES)) if (!rowsSeen.has(lv)) err('README.md', `묶음 표에 학교급 ${lv} 줄이 없다`);
}

// ── 칭호 ──
for (const t of (DATA.TITLE_RULES && DATA.TITLE_RULES.tiers) || []) {
  if (!readme.includes(t.title)) err('README.md', `칭호 '${t.title}' 이 README 에 없다`);
}

// ── 결과 ──
for (const n of notes) console.log(`NOTE ${n}`);
console.log(`doc1-readme: 경로 ${checkedPaths}개, 주소 값 ${urlPairs}개, 묶음 ${rowsSeen.size}줄 확인`);
if (errors.length) {
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(`doc1-readme: ${errors.length}개 틀림`);
  process.exit(1);
}
console.log('doc1-readme: 통과');
