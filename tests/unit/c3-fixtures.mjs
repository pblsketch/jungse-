// C3 점검의 점검: tests/fixtures/c3/ 의 예시 데이터로 내용 점검들을 돌린다.
// - valid/ : 모든 점검(c3-orig, c3-yet, c3-data, c3-text, font-coverage, extract_orig --check)이 통과해야 한다.
// - 나머지 폴더 : case.json 대로 valid 를 임시 폴더에 복사해 일부러 틀리게 만든 뒤, 적힌 점검이 실패(종료 코드 1)하고
//   출력에 expect 의 낱말(어디서·왜: 파일·id)이 모두 나와야 한다.
// case.json: { "why": 설명, "checks": [점검 이름…], "args": [덧붙일 인자…], "expect": [출력에 나올 낱말…],
//              "patch": [{ "file", "find", "replace", "all"? }], "write": { 파일: 내용 }, "remove": [파일…],
//              "removeMapObject": [{ "file", "id" }], "regen": true(바꾼 뒤 extract_orig 로 ORIG 다시 만들기) }
//   find/replace/write 안의 {{U+XXXX}} 는 그 글자, {{ESC:U+XXXX}} 는 역빗금-u 이스케이프 글자열로 바뀐다(날 자모 시험용).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ROOT } from '../lib/load.mjs';

const BASE = join(ROOT, 'tests', 'fixtures', 'c3');
const VALID = join(BASE, 'valid');
const CHECKS = {
  'c3-orig': ['tests/checks/c3-orig.mjs'],
  'c3-yet': ['tests/checks/c3-yet.mjs'],
  'c3-data': ['tests/checks/c3-data.mjs'],
  'c3-text': ['tests/checks/c3-text.mjs'],
  'font-coverage': ['tests/checks/font-coverage.mjs'],
  extract: ['tools/extract_orig.mjs', '--check']
};

function run(args) {
  return new Promise((res) => {
    const p = spawn(process.execPath, args, { cwd: ROOT, env: { ...process.env, NM_REQUIRE_ALL_SCENES: '' } });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', code => res({ code, out }));
  });
}
const runCheck = (name, root, extra = []) => run([join(ROOT, CHECKS[name][0]), ...CHECKS[name].slice(1), '--root', root, ...extra]);

const BS = String.fromCharCode(92);
function expand(s) {
  return String(s)
    .replace(/\{\{ESC:U\+([0-9A-Fa-f]{4,6})\}\}/g, (_, h) => h.length === 4 ? BS + 'u' + h.toUpperCase() : BS + 'u{' + h.toUpperCase() + '}')
    .replace(/\{\{U\+([0-9A-Fa-f]{4,6})\}\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

function applyCase(dir, c) {
  for (const p of c.patch || []) {
    const f = join(dir, p.file);
    const src = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    const find = expand(p.find), rep = expand(p.replace);
    assert.ok(src.includes(find), `case 고침 '${p.find}' 를 ${p.file} 에서 찾지 못했다 (예시 데이터가 바뀌었으면 case.json 도 고친다)`);
    writeFileSync(f, p.all ? src.split(find).join(rep) : src.replace(find, () => rep));
  }
  for (const [file, content] of Object.entries(c.write || {})) {
    const f = join(dir, file);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, expand(Array.isArray(content) ? content.join('\n') + '\n' : content));
  }
  for (const file of c.remove || []) rmSync(join(dir, file), { force: true });
  for (const r of c.removeMapObject || []) {
    const f = join(dir, r.file);
    const json = JSON.parse(readFileSync(f, 'utf8'));
    let n = 0;
    (function walk(layers) { for (const l of layers || []) { if (l.layers) walk(l.layers); if (l.objects) { const before = l.objects.length; l.objects = l.objects.filter(o => o.id !== r.id); n += before - l.objects.length; } } })(json.layers);
    assert.equal(n, 1, `case 맵 객체 ${r.id} 를 ${r.file} 에서 찾지 못했다`);
    writeFileSync(f, JSON.stringify(json, null, 2));
  }
}

const failures = [];
const note = (ok, line) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${line}`); if (!ok) failures.push(line); };

// 1) 올바른 예시는 모든 점검을 통과한다
const validRuns = await Promise.all(Object.keys(CHECKS).map(async name => ({ name, r: await runCheck(name, VALID) })));
for (const { name, r } of validRuns) note(r.code === 0, `valid / ${name} 통과${r.code === 0 ? '' : ` (exit ${r.code})\n${r.out}`}`);

// 2) 틀린 예시마다 그 점검이 실패하고 어디서·왜를 말한다
const cases = readdirSync(BASE, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'valid' && existsSync(join(BASE, d.name, 'case.json')))
  .map(d => d.name).sort();
assert.ok(cases.length > 0, '틀린 예시 세트가 없다');
const covered = new Set();
const tmpRoot = mkdtempSync(join(tmpdir(), 'nm-c3-'));
try {
  const queue = [...cases];
  const worker = async () => {
    while (queue.length) {
      const name = queue.shift();
      const c = JSON.parse(readFileSync(join(BASE, name, 'case.json'), 'utf8'));
      const dir = join(tmpRoot, name);
      cpSync(VALID, dir, { recursive: true });
      try { applyCase(dir, c); } catch (e) { note(false, `${name}: ${e.message}`); continue; }
      if (c.regen) {
        const g = await run([join(ROOT, 'tools/extract_orig.mjs'), '--root', dir]);
        if (g.code !== 0) { note(false, `${name}: ORIG 다시 만들기 실패\n${g.out}`); continue; }
      }
      for (const chk of c.checks) {
        covered.add(chk);
        const r = await runCheck(chk, dir, c.args || []);
        const missing = (c.expect || []).map(expand).filter(s => !r.out.includes(s));
        const ok = r.code === 1 && missing.length === 0;
        note(ok, `${name} / ${chk}: ${c.why}${ok ? '' : ` — exit ${r.code}, 출력에 없는 낱말 ${JSON.stringify(missing)}\n${r.out}`}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
for (const name of Object.keys(CHECKS)) note(covered.has(name), `틀린 예시가 ${name} 를 적어도 한 번 실패시킨다`);

if (failures.length) { console.log(`c3-fixtures: 실패 ${failures.length}건`); process.exit(1); }
console.log(`c3-fixtures ok: 올바른 예시 1세트 × 점검 ${Object.keys(CHECKS).length}개, 틀린 예시 ${cases.length}세트`);
