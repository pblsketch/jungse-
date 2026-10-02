// 링크 공유 썸네일 만들기: tests/pages/og-card.html(그림 design/art/og-art.jpg + 게임 글꼴로 쓴 제목)을
// 1200×630 으로 찍어 assets/ui/og.jpg 에 쓴다. 옛한글 제목이 깨지지 않게 브라우저(게임과 같은 글꼴)로 그린다.
//   node tools/make_og.mjs
// 필요: tests/node_modules 의 playwright, 설치된 Chrome.
import { chromium } from '../tests/node_modules/playwright/index.mjs';
import { serve } from '../tests/server.mjs';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../assets/ui/og.jpg', import.meta.url));
const TEXT = {
  seal: '原文',
  title: '나랏말ᄊᆞ미',
  sub: '중세국어를 읽어 내는 해독 어드벤처',
  meta: '중학교 · 고등학교 국어 수업용 웹 게임'
};

const server = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(server.url + 'tests/pages/og-card.html');
  await page.evaluate((t) => { for (const k of Object.keys(t)) document.getElementById(k).textContent = t[k]; }, TEXT);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load().catch(() => null))); });
  await page.waitForTimeout(300);
  await page.locator('#card').screenshot({ path: OUT, type: 'jpeg', quality: 86 });
  console.log(`og.jpg 를 썼다 (${Math.round(statSync(OUT).size / 1024)} KB)`);
} finally {
  await browser.close();
  await server.close();
}
