// 끝까지 풀기 전체 실행기(spec §18-1 6·7): npm --prefix tests run e2e
//   play-level --level m / h1 / h23   학교급마다 첫 화면부터 추천 묶음 끝까지(교사 모드·이어 하기·수첩 이미지·묶음 밖 안내 포함)
//   screens                           화면 크기 6종의 가로 스크롤·움직임 세 가지·오류 0
// 하나라도 실패하면 0이 아닌 코드로 끝난다. 끝에 요약을 찍는다. 그림은 tests/shots/e2e/(git 이 무시)에 남는다.
//   node tests/e2e/run.mjs [--only m,h1,h23,screens]
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  { id: 'm', file: 'play-level.mjs', args: ['--level', 'm'] },
  { id: 'h1', file: 'play-level.mjs', args: ['--level', 'h1'] },
  { id: 'h23', file: 'play-level.mjs', args: ['--level', 'h23'] },
  { id: 'screens', file: 'screens.mjs', args: [] }
];
const argv = process.argv.slice(2);
const only = argv.indexOf('--only') >= 0 ? argv[argv.indexOf('--only') + 1].split(',') : null;

function run(s) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [join(here, s.file), ...s.args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let summary = null, buf = '';
    const onData = (d) => {
      process.stdout.write(d);
      buf += d.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        if (line.startsWith('SUMMARY ')) summary = line.slice(8);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('close', code => resolve({ id: s.id, code, summary: summary || (buf.startsWith('SUMMARY ') ? buf.slice(8).trim() : null), sec: Math.round((Date.now() - t0) / 1000) }));
  });
}

const results = [];
for (const s of SUITES) {
  if (only && only.indexOf(s.id) < 0) continue;
  console.log(`\n===== e2e ${s.id} =====`);
  results.push(await run(s));
}
console.log('\n===== e2e summary =====');
for (const r of results) console.log(`${r.code === 0 ? 'PASS' : 'FAIL'} ${r.id.padEnd(8)} ${String(r.sec).padStart(4)} s  ${r.summary || '(no summary — exit ' + r.code + ')'}`);
const failed = results.filter(r => r.code !== 0).length;
console.log(`\n${results.length - failed}/${results.length} e2e suites passed`);
process.exit(failed || !results.length ? 1 : 0);
