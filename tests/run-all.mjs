// 브라우저 없는 점검 실행기. tests/unit/*.mjs 와 tests/checks/*.mjs 를 차례로 실행한다.
// 각 파일은 실패하면 0이 아닌 종료 코드로 끝나야 한다. 하나라도 실패하면 이 실행기도 실패한다.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const groups = ['unit', 'checks'];
let failed = 0, ran = 0;
for (const g of groups) {
  let files = [];
  try { files = readdirSync(join(here, g)).filter(f => f.endsWith('.mjs')).sort(); } catch { files = []; }
  for (const f of files) {
    ran++;
    const r = spawnSync(process.execPath, [join(here, g, f)], { stdio: 'inherit' });
    if (r.status !== 0) { failed++; console.log(`FAIL ${g}/${f} (exit ${r.status})`); }
    else console.log(`PASS ${g}/${f}`);
  }
}
console.log(`\n${ran - failed}/${ran} passed`);
process.exit(failed ? 1 : 0);
