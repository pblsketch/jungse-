// 옛한글·한자·루비·방점 화면 검수(점검 아님 — 사람이 볼 화면 모음 + 자동 탐지 목록).
//   node tests/qa/yet-audit.mjs [--sec orig,scenes,data,ui,gimmicks] [--cfg normal,large,phone] [--out 폴더] [--no-shots]
// tests/pages/yet-audit.html 을 열어 데이터의 표기 글을 실제 그리기 코드로 그리고,
//   - 화면을 조각(높이 1600px)으로 찍는다 → tests/shots/yet-audit/<sec>-<cfg>-NN.png
//   - window.__audit() 의 자동 탐지 결과를 모은다 → tests/shots/yet-audit/report.json (종류별 개수는 화면에도 찍는다)
// 설정: normal(1280px, 글자 1) · large(1280px, 글자 크게 1.5) · phone(390px, 글자 1)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SECS = arg('--sec', 'orig,scenes,data,ui,gimmicks').split(',');
const CFGS = { normal: { w: 1280, fs: 1 }, large: { w: 1280, fs: 1.5 }, phone: { w: 390, fs: 1 } };
const cfgs = arg('--cfg', 'normal,large,phone').split(',');
const OUT = arg('--out', join(ROOT, 'tests', 'shots', 'yet-audit'));
const shots = !args.includes('--no-shots');
const perWin = args.includes('--per-win'); // 창(.nm-st-win / .nm-modal)마다 따로 찍기
mkdirSync(OUT, { recursive: true });

const server = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = {};
try {
  for (const sec of SECS) {
    for (const c of cfgs) {
      const cfg = CFGS[c];
      const page = await browser.newPage({ viewport: { width: cfg.w, height: 900 }, deviceScaleFactor: 1 });
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await page.goto(`${server.url}tests/pages/yet-audit.html?sec=${sec}&fs=${cfg.fs}`);
      await page.waitForFunction(() => window.__auditReady === true, null, { timeout: 120000 });
      const issues = await page.evaluate(() => window.__audit());
      report[`${sec}-${c}`] = { issues, console: errs };
      const counts = {};
      issues.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
      console.log(`${sec}-${c}: ${issues.length} issues ${JSON.stringify(counts)}${errs.length ? ' console:' + errs.length : ''}`);
      if (shots && sec === 'ui' && c === 'normal') {
        // 수첩 이미지(캔버스)는 원래 크기로 따로 저장
        const imgs = await page.evaluate(() => [...document.querySelectorAll('img.ya-canvas')].map(i => [i.getAttribute('data-path'), i.src]));
        for (const [p, src] of imgs) writeFileSync(join(OUT, `${p.replace(/\W+/g, '-')}.png`), Buffer.from(src.split(',')[1], 'base64'));
      }
      if (perWin) {
        const wins = await page.$$('[data-audit]');
        for (let k = 0; k < wins.length; k++) await wins[k].screenshot({ path: join(OUT, `${sec}-${c}-w${String(k + 1).padStart(3, '0')}.png`) }).catch(() => {});
      } else if (shots) {
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        const step = 1600;
        for (let y = 0, k = 1; y < H; y += step, k++) {
          await page.screenshot({ path: join(OUT, `${sec}-${c}-${String(k).padStart(2, '0')}.png`), clip: { x: 0, y, width: cfg.w, height: Math.min(step, H - y) }, fullPage: true });
        }
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 1));
console.log('report → ' + join(OUT, 'report.json'));
