// U1 해독 수첩 화면과 수첩 이미지 브라우저 점검 (spec §14, plan U1):
// 수첩 화면(확정 항목·옮긴 구절·규칙 카드·아직 확인하지 않은 규칙과 배우는 장면·도감),
// 이름·번호 입력(저장 안 함) → PNG(내려받기 + 화면에 띄워 길게 눌러 저장), 들어가는 요소(진행 중/완료),
// 장면 도중 ctx.saveImage, 캔버스의 옛한글이 NMYet 글꼴로 조합되는지.
import { readFileSync } from 'node:fs';
import { makeChecker, startBrowser, newPage, record } from '../fixtures/u1-harness.mjs';

const C = makeChecker('u1-image-browser', 58000);
const { check } = C;
const env = await startBrowser();
try {
  const P = await newPage(env);
  const page = P.page;
  await P.seed(record({ level: 'm', nickname: '해솔' }));
  await P.open('');
  await P.waitScreen('title');
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');

  // ── 1) 장면 도중: 진행 중 이미지(ctx.saveImage)
  await page.click('[data-stage="s2"]');
  await page.waitForFunction(() => window.__stub && __stub.runs.length === 1);
  await page.evaluate(() => __stub.partial());
  await page.evaluate(() => __stub.ctx.saveImage());
  await P.waitModal('image-form');
  const ac = await page.$$eval('.nm-modal[data-modal="image-form"] input', ins => ins.map(i => i.getAttribute('autocomplete')));
  check('name/number inputs without autocomplete', ac.length === 2 && ac.every(a => a === 'off'), ac);
  await page.fill('#nm-img-name', '김하나');
  await page.fill('#nm-img-no', '7');
  await page.click('.nm-modal[data-modal="image-form"] [data-act="make-image"]');
  await P.waitModal('image-preview');
  let li = await page.evaluate(() => NM.ui.app.test.lastImage());
  const m = li.model;
  check('in-progress image model', m.status === 'progress' && m.statusText === '진행 중' && m.stageName === '시험 장면 둘' && m.levelLabel === '중학교' && m.name === '김하나' && m.number === '7' && m.nickname === '해솔' && m.teacher === false, m);
  const need = ['김하나', '7', '해솔', '진행 중', '시험 장면 둘', '중학교', m.createdText, m.title, m.gameTitle, '첫 시도 정확도', '도움 사용', '오해 장면'];
  check('drawn texts include required elements', need.every(n => li.texts.some(t => t.includes(n))), { need, texts: li.texts });
  check('no teacher mark for student', !li.texts.some(t => t.includes('교사 모드')));
  check('canvas size sane', li.width === 1080 && li.height > 600, { w: li.width, h: li.height });
  check('png blob produced', li.blobType === 'image/png' && li.blobSize > 5000, { type: li.blobType, size: li.blobSize });
  check('canvas has drawn pixels', li.inkPixels > 2000, li.inkPixels);
  const img = await page.$eval('.nm-modal[data-modal="image-preview"] img', i => ({ w: i.naturalWidth, src: i.src.slice(0, 5), alt: i.alt }));
  check('preview image shown (long-press fallback)', img.w === 1080 && img.src === 'blob:' && img.alt.length > 0, img);
  check('long-press note shown', (await page.textContent('.nm-modal[data-modal="image-preview"]')).includes('길게 눌러'));
  const dl = await page.$eval('.nm-modal[data-modal="image-preview"] a[data-act="download"]', a => ({ href: a.href.slice(0, 5), name: a.getAttribute('download') }));
  check('download link (blob, .png name)', dl.href === 'blob:' && /^naratmalssami-s2-\d{8}-\d{4}\.png$/.test(dl.name), dl);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('.nm-modal[data-modal="image-preview"] a[data-act="download"]')]);
  const path = await download.path();
  const head = readFileSync(path).subarray(0, 8).toString('hex');
  check('downloaded file is a PNG', head === '89504e470d0a1a0a' && download.suggestedFilename().endsWith('.png'), { head, name: download.suggestedFilename() });
  // 이름·번호는 저장하지 않는다
  const raw = await P.rawStorage();
  check('name/number not stored', !raw.includes('김하나') && (await page.evaluate(() => sessionStorage.length)) === 0);
  await page.click('.nm-modal[data-modal="image-preview"] [data-act="close"]');
  await page.evaluate(() => __stub.ctx.saveImage());
  await P.waitModal('image-form');
  check('form starts empty next time', (await page.inputValue('#nm-img-name')) === '' && (await page.inputValue('#nm-img-no')) === '');
  await page.keyboard.press('Escape');

  // ── 2) 수첩 화면(장면 도중, 도구 막대에서)
  await page.click('#nm-toolbar [data-act="notebook"]');
  await P.waitModal('notebook');
  const nb = await page.evaluate(() => {
    const q = (s) => document.querySelector('.nm-modal[data-modal="notebook"] [data-section="' + s + '"]');
    return ['items', 'translations', 'rules', 'unlearned', 'dogam'].map(s => [s, q(s) ? q(s).textContent : null]);
  });
  const nbm = Object.fromEntries(nb);
  check('notebook sections exist', nb.every(([, v]) => v !== null), nb);
  check('notebook opens on current stage', (await page.inputValue('#nm-nb-stage')) === 's2');
  check('unlearned rules list with learning stage name', nbm.unlearned.includes('아래아') && nbm.unlearned.includes('배우는 장면') && nbm.unlearned.includes('제6장'), nbm.unlearned);
  check('dogam list with marks', nbm.dogam.includes('ㆍ') && nbm.dogam.includes('ㅿ') && nbm.dogam.includes('○'), nbm.dogam);
  await page.keyboard.press('Escape');

  // ── 3) 끝내기 → 완료 이미지(장면 고르기의 수첩에서)
  await page.evaluate(() => __stub.solveFirstRead(true));
  await page.evaluate(() => __stub.finish('아래아를 찾았다'));
  await P.waitScreen('select');
  await page.click('#nm-screens [data-act="notebook"]');
  await P.waitModal('notebook');
  await page.selectOption('#nm-nb-stage', 's2');
  const nb2 = await page.$eval('.nm-modal[data-modal="notebook"]', e => e.textContent);
  check('notebook shows confirmed item, translation, rule, reflection', nb2.includes('말씀이') && nb2.includes('시험으로 옮긴 구절') && nb2.includes('시험용 규칙 문장 하나') && nb2.includes('아래아를 찾았다'), nb2.slice(0, 400));
  check('confirmed item original rendered with yet font', await page.$eval('.nm-modal[data-modal="notebook"] [data-section="items"] .nm-yet', e => getComputedStyle(e).fontFamily.includes('NMYet')));
  await page.click('.nm-modal[data-modal="notebook"] [data-act="save-image"]');
  await P.waitModal('image-form');
  await page.click('.nm-modal[data-modal="image-form"] [data-act="make-image"]');
  await P.waitModal('image-preview');
  li = await page.evaluate(() => NM.ui.app.test.lastImage());
  const d = li.model;
  check('done image model', d.status === 'done' && d.statusText === '완료' && d.glyph === 'ㆍ' && d.items.length === 1 && d.items[0].modern === '말씀이' && d.translations[0] === '시험으로 옮긴 구절' && d.rules[0].name === '아래아' && d.reflection === '아래아를 찾았다', d);
  check('done image stats (first try 0%, helps 2, misread 1)', d.stats.firstTryText === '0%' && d.stats.helps === 2 && d.stats.misreads === 1, d.stats);
  const need2 = ['완료', 'ㆍ', '말씀이', d.items[0].orig, '시험으로 옮긴 구절', '아래아', '아래아를 찾았다', '0%'];
  check('done image draws items/rules/reflection/glyph', need2.every(n => li.texts.some(t => t.includes(n))), { need2, texts: li.texts });
  check('fonts loaded before drawing', li.fontsReady === true);
  // ── 4) 캔버스 옛한글: NMYet 로 조합되어 한 음절 너비
  const w = await page.evaluate(async () => {
    await document.fonts.load('48px NMYet', 'ᄆᆞᆯ');
    const c = document.createElement('canvas').getContext('2d');
    c.font = '48px NMYet';
    const old = c.measureText('ᄆᆞᆯ').width, modern = c.measureText('말').width;
    c.font = '48px monospace';
    return { old, modern, ok: document.fonts.check('48px NMYet', 'ᄆᆞᆯ') };
  });
  check('canvas old Hangul composes to one syllable with NMYet', w.ok && w.old > 0 && w.old < w.modern * 1.3, w);
  await P.clean(check, 'image');
  await P.context.close();
} catch (e) {
  check('no exception', false, String(e && e.stack || e));
} finally {
  await env.close();
}
C.finish();
