// 점검 실행기. tests/unit/*.mjs 와 tests/checks/*.mjs 를 차례로 실행한다.
// 각 파일은 실패하면 0이 아닌 종료 코드로 끝나야 한다. 하나라도 실패하면 이 실행기도 실패한다.
//
//   node tests/run-all.mjs                       전부 (이 컴퓨터: 브라우저 점검 포함 — 설치된 Chrome 필요)
//   node tests/run-all.mjs --no-browser          브라우저 없는 점검만 (*-browser.mjs 건너뜀) — GitHub 올릴 때 점검이 이것을 돈다
//   node tests/run-all.mjs --no-fonts            글꼴 범위 점검(font-coverage.mjs) 건너뜀 — 장면 작업(S0~S12) 도중용.
//                                                새 한자·옛한글 음절은 물결 끝 글꼴 재생성 뒤 전체 점검으로 확인한다
//   node tests/run-all.mjs --require-all-scenes  장면 데이터 '없음'을 실패로 친다(c3-data). 장면을 다 채운 뒤 Q1·DEP1 이 켠다
//
// 브라우저 점검 파일 이름은 반드시 '-browser.mjs' 로 끝낸다(--no-browser 가 이름으로 가른다).
// a1-sprite-pipeline.mjs 는 Python 3 + numpy + Pillow 가 필요하다. 건너뛰지 않는다:
// GitHub 올릴 때 점검(.github/workflows/check.yml)은 그 둘을 설치하고 돌린다. 이 컴퓨터에도 설치해 둔다.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const noBrowser = args.includes('--no-browser');
const noFonts = args.includes('--no-fonts');
const env = { ...process.env };
if (args.includes('--require-all-scenes')) env.NM_REQUIRE_ALL_SCENES = '1';

const here = dirname(fileURLToPath(import.meta.url));
const groups = ['unit', 'checks'];
let failed = 0, ran = 0;
const skipped = [];
for (const g of groups) {
  let files = [];
  try { files = readdirSync(join(here, g)).filter(f => f.endsWith('.mjs')).sort(); } catch { files = []; }
  for (const f of files) {
    if (noBrowser && f.endsWith('-browser.mjs')) { skipped.push(`${g}/${f} (--no-browser)`); continue; }
    if (noFonts && f === 'font-coverage.mjs') { skipped.push(`${g}/${f} (--no-fonts)`); continue; }
    ran++;
    const r = spawnSync(process.execPath, [join(here, g, f)], { stdio: 'inherit', env });
    if (r.status !== 0) { failed++; console.log(`FAIL ${g}/${f} (exit ${r.status})`); }
    else console.log(`PASS ${g}/${f}`);
  }
}
for (const s of skipped) console.log(`SKIP ${s}`);
console.log(`\n${ran - failed}/${ran} passed${skipped.length ? `, ${skipped.length} skipped` : ''}`);
process.exit(failed ? 1 : 0);
