// 플레이테스트 결과 표 만들기: 조정 전·후 요약 JSON(tests/qa/playtest.mjs --out)을 견주어 CSV 와 마크다운 표를 낸다.
// 사용: node tests/qa/tables.mjs <조정 전 --full JSON> <조정 후 --full JSON> [CSV 경로]
// (--full JSON 의 사건으로 시간을 다시 계산한다 — 시간 모형 tests/qa/time-model.mjs 를 고친 뒤에도 브라우저 없이 다시 낼 수 있다)
import { readFileSync, writeFileSync } from 'node:fs';
import { estimate } from './time-model.mjs';

const [bPath, aPath, csvPath] = process.argv.slice(2);
const load = (p) => JSON.parse(readFileSync(p, 'utf8')).results.map(r => Object.assign(r, { est: estimate(r.events, r.level) }));
const B = load(bPath);
const A = load(aPath);
const key = (r) => r.stageId + '/' + r.level;
const byB = Object.fromEntries(B.map(r => [key(r), r]));
const f = (x) => (x == null ? '' : x.toFixed(1));
const ROLE = { prologue: '서장', bundle: '묶음', optional: '추천 선택' };
const LV = { m: '중학교', h1: '고1', h23: '고2~3' };

const rows = [];
for (const a of A) {
  const b = byB[key(a)] || null;
  const needsA = a.est.needsSec || 0;
  rows.push({
    level: a.level, stage: a.stageId, role: a.role, title: a.title,
    itemsB: b ? b.items.length : null, itemsA: a.items.length,
    bestB: b && b.est.best.min, bestA: a.est.best.min,
    typB: b && b.est.typical.min, typA: a.est.typical.min,
    wrongB: b && b.est.allWrong.min, wrongA: a.est.allWrong.min,
    slowB: b && b.est.slowTypical.min, slowA: a.est.slowTypical.min,
    needsA, typInOrderA: a.est.typical.min - needsA / 60,
    charsA: a.est.typical.chars, partsA: a.est.typical.parts, phaseA: a.est.typical.byPhase
  });
}
const csvHead = 'level,stage,role,items_before,items_after,best_before,best_after,typical_before,typical_after,typical_in_bundle_order_after,all_wrong_before,all_wrong_after,slow_before,slow_after,chars_plain_after,chars_side_after,chars_orig_hangul_after,chars_orig_hanja_after';
const csv = [csvHead].concat(rows.map(r => [r.level, r.stage, r.role, r.itemsB, r.itemsA, f(r.bestB), f(r.bestA), f(r.typB), f(r.typA), f(r.typInOrderA), f(r.wrongB), f(r.wrongA), f(r.slowB), f(r.slowA),
  r.charsA.plain, r.charsA.side, r.charsA.orig, r.charsA.origHan].join(','))).join('\n') + '\n';
if (csvPath) writeFileSync(csvPath, csv);

// 마크다운: 학교급별 표
let md = '';
for (const lv of ['m', 'h1', 'h23']) {
  md += `\n#### ${LV[lv]}\n\n| 장면 | 구분 | 핵심 항목 | 보통 학생(분) 전 → 후 | 묶음 차례로 할 때(후) | 막힘 없이(후) | 모두 한 번 틀림(후) | 느린 독자(후) | 12분 |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows.filter(x => x.level === lv)) {
    const over = r.typA > 12.05 ? (r.typInOrderA > 12.05 ? '넘음' : '차례대로면 안') : '안';
    md += `| ${r.stage} ${r.title || ''} | ${ROLE[r.role] || r.role} | ${r.itemsB ?? '-'} → ${r.itemsA} | ${f(r.typB)} → **${f(r.typA)}** | ${f(r.typInOrderA)} | ${f(r.bestA)} | ${f(r.wrongA)} | ${f(r.slowA)} | ${over} |\n`;
  }
}
// 묶음 합계
md += '\n#### 묶음 합계(보통 학생, 조정 후, 서장 포함 · 추천 선택 제외)\n\n| 학교급 | 장면 수 | 합계(분) | 묶음 차례로 할 때(분) |\n|---|---|---|---|\n';
for (const lv of ['m', 'h1', 'h23']) {
  const rs = rows.filter(x => x.level === lv && x.role !== 'optional');
  const sum = rs.reduce((n, r) => n + r.typA, 0), sumO = rs.reduce((n, r) => n + r.typInOrderA, 0);
  md += `| ${LV[lv]} | ${rs.length} | ${f(sum)} | ${f(sumO)} |\n`;
}
// 시간 나눔(조정 후)
md += '\n#### 시간이 어디에 드나(보통 학생, 조정 후, 초)\n\n| 장면 | 본글 읽기 | 곁글 읽기 | 原文 읽기 | 걷기 | 카드 고르기 | 기믹 조작 | 단추 | 도입 / 탐색 / 항목 / 통역(분) | 본글·곁글·原文(한글/한자) 글자 |\n|---|---|---|---|---|---|---|---|---|---|\n';
for (const r of rows) {
  const p = r.partsA, ph = r.phaseA, c = r.charsA;
  md += `| ${r.stage}/${r.level} | ${p.readPlain} | ${p.readSide} | ${p.readOrig} | ${p.walk} | ${p.cards} | ${p.gimmick} | ${p.clicks} | ${ph.intro ?? 0} / ${ph.explore ?? 0} / ${ph.items ?? 0} / ${ph.translate ?? 0} | ${c.plain} · ${c.side} · ${c.orig}/${c.origHan} |\n`;
}
console.log(md);
