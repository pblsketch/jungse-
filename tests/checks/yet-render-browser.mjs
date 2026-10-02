// 옛한글·한자·루비·방점 화면 점검 (브라우저). tests/pages/yet-audit.html 이 데이터의 표기 글을 모두 실제 그리기 코드로
// 그리고(原文 블록 · 장면 글 · 규칙 카드·도감·오답 카드·기믹 문구 · 첫 화면·장면 고르기·수첩·수첩 이미지 · 기믹),
// window.__audit() 가 화면을 훑은 결과에 아래 문제가 하나도 없어야 한다.
//   no-font            한글·한자·방점 글자를 함께 넣은 글꼴(NMYet·NMYetExt·NMSans)이 못 그려 기기 글꼴로 넘어감
//   dotted-circle      ◌ 가 보임(글자 ◌, 또는 음절 뒤가 아닌 방점 글자 — 글꼴이 ◌ 와 함께 그린다)
//   not-composed       첫가끝 자모가 한 음절로 모이지 않음(너비가 글자 크기의 1.25배를 넘음) / lone-jamo 홀로 남은 가운뎃·끝소리 자모
//   raw-markup         풀리지 않은 데이터 표기([ㅅㆍ] {漢|읽기})가 보임
//   mixed-font-word    한 낱말 안에서 글꼴이 바뀜(말[ㅆㆍ]미 → 고딕·명조·고딕) / hanja-font-differs 옛말 낱말 안 한자만 다른 글꼴
//   size-jump          한 줄 안 본문 글자 크기가 들쭉날쭉(5% 넘게)
//   bangjeom-ambiguous 방점 점이 제 음절보다 앞 음절에 더 가까움 / bangjeom-vertical 점이 음절 높이 밖
//   ruby-overlap       이웃한 루비 읽기끼리 겹침 / spill 글자가 상자(테두리·단추) 밖으로 나감 / clipped-x·y 잘림 / page-hscroll 가로 넘침
//   nm-error           그리기 중 오류 모음(window.__nmErrors)
// 사람이 볼 화면 모음은 node tests/qa/yet-audit.mjs (tests/shots/yet-audit/).
import { chromium } from 'playwright';
import { serve } from '../server.mjs';

const HARD_LIMIT = setTimeout(() => { console.log('FAIL yet-render-browser: time limit (170 s)'); process.exit(1); }, 170000);
let failed = 0;
function check(name, ok, info) {
  if (ok) console.log('  ok   ' + name);
  else { failed++; console.log('  FAIL ' + name + (info !== undefined ? ' — ' + JSON.stringify(info).slice(0, 1500) : '')); }
}
const KOREAN = /[ᄀ-ᇿꥠ-꥿ힰ-퟿가-힣ㄱ-ㆎ〮〯㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{3134F}]/u;
const IGNORE = new Set(['tone-char']); // 수첩의 방점 글자(음절 뒤) — 글꼴이 음절 왼쪽에 바르게 그린다(정보용)
const RUNS = [
  ['orig', 1280, 1], ['orig', 390, 1],
  ['scenes', 1280, 1], ['scenes', 1280, 1.5],
  ['data', 1280, 1],
  ['ui', 1280, 1], ['ui', 390, 1.5],
  ['gimmicks', 1280, 1], ['gimmicks', 390, 1]
];

const server = await serve();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [sec, w, fs] of RUNS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${server.url}tests/pages/yet-audit.html?sec=${sec}&fs=${fs}`);
    await page.waitForFunction(() => window.__auditReady === true, null, { timeout: 60000 });
    const issues = (await page.evaluate(() => window.__audit()))
      .filter(i => !IGNORE.has(i.type))
      .filter(i => i.type !== 'no-font' || KOREAN.test(i.ch)); // ☐ ✓ 같은 기호는 기기 글꼴로 그려도 된다
    const tag = `${sec} ${w}px fs ${fs}`;
    const counts = {};
    issues.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    check(`${tag}: no rendering problems`, issues.length === 0, { counts, first: issues.slice(0, 6) });
    check(`${tag}: no console errors`, errs.length === 0, errs.slice(0, 5));
    if (sec === 'ui' && w === 1280) {
      // 홀로 선 방점(s4 패 글자)은 점 글자로, 수첩 이미지에는 글꼴 오류 없이
      const s4 = await page.evaluate(() => { const g = document.querySelector('[data-path="select.s4"] .nm-glyph'); return g ? g.textContent : null; });
      check('s4 carve glyph shows a dot, not a bare tone mark', s4 === NMsolo(), s4);
    }
    if (sec === 'scenes' && fs === 1) {
      // 옛말 낱말은 낱말째 .nm-yet: 대사 속 나·랏:말[ㅆㆍ]·미 의 현대 음절도 명조
      const r = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('.nm-dlg-text .nm-yet').forEach(y => out.push(getComputedStyle(y).fontFamily.split(',')[0].replace(/['"]/g, '').trim()));
        const words = [...document.querySelectorAll('.nm-dlg-text .nm-tk')].filter(t => /ᄊᆞ/.test(t.textContent));
        const bare = words.filter(t => [...t.childNodes].some(c => c.nodeType === 3 && /[가-힣]ᄊ|ᄊᆞ[가-힣]/.test(c.data)));
        return { fams: [...new Set(out)], n: out.length, bare: bare.length };
      });
      check('medieval words in dialog are wrapped whole in .nm-yet (NMYet)', r.n > 0 && r.fams.length === 1 && r.fams[0] === 'NMYet' && r.bare === 0, r);
    }
    await page.close();
  }
} catch (e) {
  failed++;
  console.log('  FAIL run — ' + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD_LIMIT);
}
function NMsolo() { return '•'; } // js/core/yet.js soloTone('〮')
if (failed) { console.log(`FAIL yet-render-browser (${failed})`); process.exit(1); }
console.log('PASS yet-render-browser');
