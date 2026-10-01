// C3 ① 원문 출처 점검 (spec §18-1-1, §12, §19-2)
// - 리서치 문서의 原文 블록 형식이 맞다(tools/extract_orig.mjs 와 같은 규칙).
// - js/data/orig.generated.js 가 지금 리서치 문서에서 뽑은 것과 글자까지 같다(낡았거나 손으로 고치면 실패).
// - ORIG 는 자동 생성 파일만 만든다(다른 데이터 파일이 NM.data.ORIG 를 만들면 실패).
// - 데이터가 참조하는 原文 블록 id(O-…)가 모두 있다. 확실도 △ 블록은 데이터에 쓰지 않는다.
// - 原文 줄을 손으로 고치는 데이터에 옮겨 적지 않는다(원문 글자는 자동 생성 원문 데이터에만 있다, §19-2).
// 사용: node tests/checks/c3-orig.mjs [--root <데이터 뿌리>]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, loadData, walkStrings, reporter, isGenerated } from '../lib/content.mjs';
import { extractOrig, renderGenerated, normalizeEol, diffOrig, readGeneratedOrig, OUT_REL, BLOCK_ID_RE } from '../../tools/extract_orig.mjs';

const MIN_COPY_LEN = 6; // 이만큼 긴 原文 줄이 손 데이터에 통째로 들어 있으면 '옮겨 적음'으로 본다
const R = reporter('c3-orig');
const { root } = parseArgs();

// 1) 리서치 문서 블록
const ex = extractOrig(root);
ex.errors.forEach(e => R.error(e.split(': ')[0], e.slice(e.indexOf(': ') + 2)));
ex.warnings.forEach(w => R.warn(w.split(': ')[0], w.slice(w.indexOf(': ') + 2)));

// 2) 자동 생성 파일이 최신인가
const outPath = join(root, OUT_REL);
const want = renderGenerated(ex.orig);
const { data, loadErrors, where } = loadData(root);
R.setWhere(where);
loadErrors.forEach(e => R.error(e.file, `불러오기 실패: ${e.message}`));
if (!existsSync(outPath)) {
  R.error(OUT_REL, '없음 — node tools/extract_orig.mjs 를 돌려 만든다');
} else if (!ex.errors.length) {
  const cur = normalizeEol(readFileSync(outPath, 'utf8'));
  if (cur !== want) {
    const diffs = diffOrig(readGeneratedOrig(cur), ex.orig, ex.skipped);
    diffs.forEach(([w, why]) => R.error(w, why));
    if (!diffs.length) R.error(OUT_REL, '리서치 문서에서 다시 만든 내용과 글자가 다르다(머리말·형식) — node tools/extract_orig.mjs 를 다시 돌린다');
  }
}

// 3) ORIG 는 자동 생성 파일만 만든다
const hand = loadData(root, { generated: false });
if (hand.data.ORIG !== undefined) {
  const who = hand.files.filter(f => !isGenerated(f) && /\bORIG\b/.test(readFileSync(join(root, f), 'utf8')));
  R.error(who.join(', ') || 'js/data', 'NM.data.ORIG 는 자동 생성 파일(orig.generated.js)만 만든다 — 손 데이터는 블록 id 로만 참조한다');
}

// 4) 블록 id 참조 + 5) 原文 줄 옮겨 적기
const orig = data.ORIG || {};
const longLines = [];
for (const id of Object.keys(ex.orig)) ex.orig[id].lines.forEach((l, i) => { if ([...l.trim()].length >= MIN_COPY_LEN) longLines.push({ id, i, text: l.trim() }); });
let refs = 0;
walkStrings(hand.data, 'NM.data', (s, path) => {
  // 블록 id 처럼 생긴 문자열은 모두 참조로 본다
  if (/^O-\S+$/.test(s)) {
    refs++;
    if (!BLOCK_ID_RE.test(s)) R.error(path, `原文 블록 id '${s}' 형식이 틀렸다 (O-<장면>-<약칭>)`);
    else if (ex.skipped[s]) R.error(path, `原文 블록 ${s} 는 확실도 △ 라 데이터에 쓸 수 없다 (${ex.skipped[s].doc}:${ex.skipped[s].line})`);
    else if (!orig[s] || !ex.orig[s]) R.error(path, `原文 블록 ${s} 가 리서치 문서(design/research/*.md)에 없다`);
    return;
  }
  for (const L of longLines) {
    if (s.includes(L.text)) R.error(path, `原文 줄(${L.id}.lines[${L.i}])을 손 데이터에 옮겨 적었다 — 블록 id 로만 참조한다(원문 글자는 orig.generated.js 에만)`);
  }
}, { skip: (p, k) => p === 'NM.data.JAMO' });

// 장면 맥락의 orig 목록은 배열이어야 한다
for (const [key, sc] of Object.entries(hand.data.SCENES || {})) {
  for (const c of Array.isArray(sc && sc.contexts) ? sc.contexts : []) {
    if (c && c.orig !== undefined && !Array.isArray(c.orig)) R.error(`NM.data.SCENES.${key} 맥락 ${c.id}`, 'orig 는 原文 블록 id 목록(배열)이어야 한다');
  }
}

R.finish(`原文 블록 ${Object.keys(ex.orig).length}개 (△ ${Object.keys(ex.skipped).length}개 제외, 문서 ${ex.docs}개), 데이터 참조 ${refs}곳`);
