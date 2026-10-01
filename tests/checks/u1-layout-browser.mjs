// U1 화면 크기·조작 브라우저 점검 (spec §3·§17·§18-1 7):
// 화면 크기 6종(1920×1080, 1280×800, 1366×768, 390×844, 360×740, 844×390)에서
// 첫 화면·처음 정하기 3단계·장면 고르기·설정·수첩·이미지 저장 창·장면 중 도구 막대에 가로 스크롤이 없고,
// 누르는 것은 모두 44px 이상이다. 글자 크기 '아주 크게'와 교사 크게 보기에서도 같다. 오류·외부 요청 0.
import { makeChecker, startBrowser, newPage, record } from '../fixtures/u1-harness.mjs';

const C = makeChecker('u1-layout-browser', 58000);
const { check } = C;
const env = await startBrowser();
const SIZES = [[1920, 1080], [1280, 800], [1366, 768], [390, 844], [360, 740], [844, 390]];

// 지금 보이는 화면/창의 가로 넘침과 작은 누름 대상
const measure = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = { pageOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - vw, inner: [], small: [] };
  const roots = [document.getElementById('nm-screens'), ...document.querySelectorAll('.nm-modal .nm-panel-body'), document.getElementById('nm-toolbar')]
    .filter(e => e && !e.hidden && e.offsetParent !== null);
  for (const r of roots) {
    if (r.scrollWidth > r.clientWidth + 1) out.inner.push({ id: r.id || r.className, sw: r.scrollWidth, cw: r.clientWidth });
    const rr = r.getBoundingClientRect();
    if (rr.right > vw + 1 || rr.left < -1) out.inner.push({ id: r.id || r.className, left: rr.left, right: rr.right, vw });
    for (const b of r.querySelectorAll('button, a[href], input, select, [role="button"]')) {
      if (b.offsetParent === null) continue;
      const q = b.getBoundingClientRect();
      if (q.width < 44 || q.height < 44) out.small.push({ act: b.getAttribute('data-act') || b.id || b.tagName, w: Math.round(q.width), h: Math.round(q.height) });
    }
  }
  return out;
});

try {
  // 화면 크기마다 따로 맥락을 열어 함께 돌린다(시간 줄이기)
  await Promise.all(SIZES.map(async ([w, h]) => {
    const tag = `${w}x${h}`;
    const P = await newPage(env, { viewport: { width: w, height: h }, hasTouch: w < 900 });
    const page = P.page;
    const bad = [];
    const look = async (label) => {
      const r = await measure(page);
      if (r.pageOverflow > 0 || r.inner.length || r.small.length) bad.push({ label, ...r });
    };
    // 기록 없음: 첫 화면·처음 정하기
    await P.seed(null);
    await P.open('');
    await P.waitScreen('title'); await look('title');
    await page.click('[data-act="start"]');
    await P.waitScreen('setup-level'); await look('setup-level');
    await page.click('[data-act="level"][data-value="m"]');
    await P.waitScreen('setup-protagonist'); await look('setup-protagonist');
    await page.click('[data-act="protagonist"][data-value="1"]');
    await P.waitScreen('setup-nickname');
    await page.fill('#nm-nick', 'a b');
    await page.click('[data-act="nick-ok"]');
    await look('setup-nickname+error');
    // 기록 있음, 글자 '아주 크게'
    await P.seed(record({ settings: { bangjeom: true, fontScale: 3, reducedMotion: 'auto', bgm: true, sfx: true }, progress: { m: { s2: { status: 'done', items: {}, rules: ['rule.araea'], translations: [], reflection: '' } } }, glyphs: { m: ['s2'] } }));
    await P.open('');
    await P.waitScreen('title'); await look('title-record-xl');
    await page.click('[data-act="continue"]');
    await P.waitScreen('select'); await look('select-xl');
    await page.click('#nm-screens [data-act="settings"]');
    await P.waitModal('settings'); await look('settings-xl');
    await page.keyboard.press('Escape');
    await page.click('#nm-screens [data-act="notebook"]');
    await P.waitModal('notebook'); await look('notebook-xl');
    await page.click('.nm-modal[data-modal="notebook"] [data-act="save-image"]');
    await P.waitModal('image-form'); await look('image-form-xl');
    await page.click('.nm-modal[data-modal="image-form"] [data-act="make-image"]');
    await P.waitModal('image-preview'); await look('image-preview-xl');
    await page.evaluate(() => NM.ui.dom.closeAll());
    await page.click('[data-stage="s3"]');
    await page.waitForFunction(() => window.__stub && __stub.runs.length === 1);
    await look('stage-toolbar-xl');
    await page.evaluate(() => __stub.exit());
    await P.waitScreen('select');
    // 교사 크게 보기 + 아주 크게
    await P.open('?teacher=1&level=h1');
    await P.waitScreen('title');
    await page.click('[data-act="start"]');
    await P.waitScreen('select');
    await page.click('#nm-screens [data-act="settings"]');
    await P.waitModal('settings');
    await page.click('[data-setting="fontScale"] [data-value="3"]');
    await look('teacher-settings-xl');
    await page.keyboard.press('Escape');
    await look('teacher-select-xl');
    await page.click('[data-stage="s4"]');
    await page.waitForFunction(() => window.__stub && __stub.runs.length === 1);
    await page.evaluate(() => __stub.mapReady);
    await page.click('#nm-toolbar [data-act="places"]');
    await P.waitModal('places'); await look('teacher-places-xl');
    check(`${tag}: no horizontal scroll, targets >= 44px`, bad.length === 0, bad);
    await P.clean(check, tag);
    await P.context.close();
  }));
  // 움직임 줄이기: 기기 설정을 따른다
  const P = await newPage(env);
  await P.page.emulateMedia({ reducedMotion: 'reduce' });
  await P.seed(record());
  await P.open('');
  check('reduced motion follows device by default', await P.page.evaluate(() => document.documentElement.classList.contains('nm-reduced-motion') && NM.engine.test.state().reducedMotion === true));
  await P.page.click('[data-act="continue"]');
  await P.waitScreen('select');
  await P.page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await P.page.click('[data-setting="reducedMotion"] [data-value="off"]');
  check('reduced motion can be turned off', await P.page.evaluate(() => !document.documentElement.classList.contains('nm-reduced-motion') && NM.engine.test.state().reducedMotion === false));
  await P.page.click('[data-setting="bgm"] [data-value="off"]');
  await P.page.click('[data-setting="sfx"] [data-value="off"]');
  const au = await P.page.evaluate(() => NM.engine.audio.state());
  check('bgm / sfx off separately', au.bgmOn === false && au.sfxOn === false, au);
  await P.page.click('[data-setting="bangjeom"] [data-value="off"]');
  check('bangjeom setting reaches yet renderer', await P.page.evaluate(() => NM.core.yet.settings.bangjeom === false));
  await P.page.click('[data-setting="fontScale"] [data-value="2"]');
  check('font scale sets --fs', await P.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs').trim() === '1.25'));
  const saved = await P.saved();
  check('settings saved for student', saved.settings.reducedMotion === false && saved.settings.bgm === false && saved.settings.sfx === false && saved.settings.bangjeom === false && saved.settings.fontScale === 2, saved.settings);
  await P.clean(check, 'settings');
  await P.context.close();
} catch (e) {
  check('no exception', false, String(e && e.stack || e));
} finally {
  await env.close();
}
C.finish();
