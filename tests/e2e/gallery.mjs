// 화면 모음(점검 아님): 한 학교급 묶음을 첫 화면부터 실제 화면 흐름으로 풀면서, 화면이 바뀔 때마다 찍는다.
//   node tests/e2e/gallery.mjs --level m [--stages s2,s3] [--out 폴더]
// 같은 장면·같은 창 종류는 한 번만 찍는다. 선생님께 보여 드리거나 화면을 훑어볼 때 쓴다.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeChecker, startBrowser, newSession, setupFromTitle, playStageUI, BUNDLE, SHOTS, TOP } from '../lib/e2e-kit.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const level = arg('--level', 'm');
const out = arg('--out', join(SHOTS, '..', 'gallery', level));
const only = arg('--stages', null);
const stages = only ? only.split(',') : BUNDLE[level];
mkdirSync(out, { recursive: true });

const C = makeChecker(`gallery ${level}`, 40 * 60 * 1000);
const env = await startBrowser();
let n = 0, stop = false;
const seen = new Set();
try {
  const S = await newSession(env, { viewport: { width: 1280, height: 800 } });
  const { page } = S;
  // 창이 너무 빨리 넘어가지 않게 페이지 호출마다 조금 쉰다(찍는 쪽은 원래 함수를 쓴다)
  const evalOrig = page.evaluate.bind(page);
  page.evaluate = async (...a) => { await new Promise(r => setTimeout(r, 90)); return evalOrig(...a); };
  const sig = () => evalOrig((top) => {
    const sc = document.getElementById('nm-screens');
    const screen = sc && !sc.hidden ? sc.getAttribute('data-screen') : '';
    const modal = [...document.querySelectorAll('.nm-modal[data-modal]')].map(m => m.getAttribute('data-modal')).pop() || '';
    const c = NM.ui.stage && NM.ui.stage.current ? NM.ui.stage.current() : {};
    const w = document.querySelector(top);
    const win = w ? w.getAttribute('data-win') + ':' + (w.getAttribute('data-kind') || '') : '';
    const wrong = w && w.querySelector('.nm-wrong, [data-state="wrong"], .is-wrong') ? 'wrong' : '';
    return [screen, modal, c.stageId || '', c.phase || '', win, wrong].join('|');
  }, TOP).catch(() => null);
  const snap = async () => {
    const s = await sig();
    if (!s || seen.has(s)) return;
    seen.add(s);
    const name = String(++n).padStart(3, '0') + '_' + s.replace(/[|:]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    await page.screenshot({ path: join(out, name + '.png') }).catch(() => {});
  };
  const loop = (async () => { while (!stop) { await snap(); await new Promise(r => setTimeout(r, 150)); } })();

  await S.open('');
  await new Promise(r => setTimeout(r, 800));
  await setupFromTitle(S, C, { level, viaUrl: false, protagonist: 2, nickname: '해솔' });
  await playStageUI(S, C, 's0', { tag: `${level}/s0`, level, fromSelect: false });
  for (const id of stages) {
    C.step(`${level}: ${id}`);
    await playStageUI(S, C, id, { tag: `${level}/${id}`, level, expectOutside: !BUNDLE[level].includes(id) });
  }
  await new Promise(r => setTimeout(r, 600));
  stop = true; await loop;
  await page.screenshot({ path: join(out, String(++n).padStart(3, '0') + '_select_end.png') });
} catch (e) {
  C.check('gallery run', false, String(e && e.stack || e));
} finally {
  stop = true;
  await env.close();
}
console.log(`gallery: ${n} shots → ${out}`);
C.finish();
