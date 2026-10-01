// 브라우저용 스크립트(일반 <script>)를 Node vm 컨텍스트에 불러온다.
// 사용: const ctx = load(['js/core/ns.js', 'js/core/rules.js']); ctx.NM.core....
import { readFileSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function load(paths, extra = {}) {
  const ctx = { console, ...extra };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const p of paths) {
    const code = readFileSync(isAbsolute(p) ? p : join(ROOT, p), 'utf8'); // 절대 경로면 그대로(시험용 예시 데이터 뿌리)
    vm.runInContext(code, ctx, { filename: p });
  }
  return ctx;
}
