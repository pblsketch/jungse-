// 끝까지 풀기(spec §18-1 6): 한 학교급의 추천 묶음을 첫 화면부터 실제 화면 흐름으로 끝까지 푼다.
//   node tests/e2e/play-level.mjs --level m|h1|h23
// 시작 → 처음 정하기(학교급 — m·h23 은 화면에서 고르기, h1 은 주소 ?level=h1 로 건너뛰기 · 주인공 · 별명)
// → 서장(s0) → 장면 고르기 → 묶음 장면을 차례로(장면마다 일부러 한 번씩 틀림) → 장면 고르기.
// 그 사이에: 장면 도중 새로 고침 → 이어 하기, 수첩 이미지(진행 중·완료, PNG), 묶음 밖 안내 한 번,
// 교사 모드(m·h23 설정 단추 / h1 주소 teacher=1 — 장소 목록·정답 바로 보기·학생 기록 바이트 동일).
// 끝에: 묶음 장면이 모두 완료·패 글자, 칭호 '정음 통사'. 내내 콘솔 오류·게임 오류·외부 요청 0, 점검 통로가 화면에 없음.
import {
  makeChecker, startBrowser, newSession, setupFromTitle, playStageUI, outsideVisit, teacherVisit,
  imageFromSelect, checkLevelComplete, visibleTestUi, BUNDLE
} from '../lib/e2e-kit.mjs';

const args = process.argv.slice(2);
const level = args[args.indexOf('--level') + 1];
if (!BUNDLE[level]) { console.log('usage: node tests/e2e/play-level.mjs --level m|h1|h23'); process.exit(2); }

// 학교급마다 하는 일(묶음 순서대로 푼다)
const PLAN = {
  m: {
    viaUrl: false, query: '', outside: 's4', teacher: { via: 'settings', stage: 's9', before: 's9' },
    stages: {
      s2: { reloadAfterItems: 2 },
      s3: { imageInProgress: true },
      s9: { reflection: '서문을 읽었다' },
      s12: { saveAtEnd: true }
    },
    outsideBefore: 's3', notebookDone: 's2'
  },
  h1: {
    viaUrl: true, query: '?level=h1', outside: 's2', teacher: { via: 'url', stage: 's12', before: 's12' },
    stages: {
      s4: { reloadAfterItems: 1 },
      s5: { imageInProgress: true },
      s6: {},
      s9: { reflection: '서문의 뜻을 알았다' },
      s12: { saveAtEnd: true },
      s10: {}
    },
    outsideBefore: 's9', notebookDone: 's5'
  },
  h23: {
    viaUrl: false, query: '', outside: 's3', teacher: { via: 'settings', stage: 's7', before: 's12' },
    stages: {
      s1: { reloadAfterItems: 1 },
      s4: {}, s5: {}, s6: {},
      s7: { imageInProgress: true },
      s8: {},
      s9: { reflection: '서문 해독' },
      s10: { reloadAfterItems: 0 },
      s11: {},
      s12: { saveAtEnd: true }
    },
    outsideBefore: 's8', notebookDone: 's11'
  }
};
const P = PLAN[level];
const C = makeChecker(`e2e play ${level}`, 40 * 60 * 1000);
const env = await startBrowser();
let S = null;
try {
  S = await newSession(env, { viewport: { width: 1280, height: 800 } });
  C.step(`${level}: title → setup → prologue`);
  await S.open(P.query);
  await setupFromTitle(S, C, { level, viaUrl: P.viaUrl, protagonist: level === 'h1' ? 3 : 2, nickname: level === 'h23' ? 'Sol7' : '해솔' });
  await playStageUI(S, C, 's0', { tag: `${level}/s0`, level, fromSelect: false });
  await S.shot(`${level}-select-after-prologue`);
  for (const id of BUNDLE[level]) {
    if (P.outsideBefore === id) { C.step(`${level}: outside notice (${P.outside})`); await outsideVisit(S, C, P.outside, { level }); }
    if (P.teacher.before === id) {
      C.step(`${level}: teacher mode (${P.teacher.via})`);
      await teacherVisit(S, C, { level, via: P.teacher.via, stageId: P.teacher.stage, studentQuery: P.query });
    }
    C.step(`${level}: ${id}`);
    const o = Object.assign({ tag: `${level}/${id}`, level }, P.stages[id] || {});
    await playStageUI(S, C, id, o);
  }
  C.step(`${level}: completed image from notebook (${P.notebookDone})`);
  await imageFromSelect(S, C, P.notebookDone, { tag: `${level}/${P.notebookDone}` });
  C.step(`${level}: level complete`);
  await checkLevelComplete(S, C, level);
  await S.shot(`${level}-select-complete`);
  C.check(`${level}: no visible test UI on final select`, (await visibleTestUi(S.page)).length === 0, await visibleTestUi(S.page));
} catch (e) {
  C.check(`${level}: no exception`, false, String(e && e.stack || e));
  if (S) await S.shot(`${level}-exception`);
} finally {
  if (S) {
    const nm = await S.allNmErrors().catch(() => []);
    C.check(`${level}: no game errors (__nmErrors) throughout`, nm.length === 0, nm.slice(0, 10));
    C.check(`${level}: no console errors throughout`, S.watch.consoleErrors.length === 0, S.watch.consoleErrors.slice(0, 10));
    C.check(`${level}: no external requests throughout`, S.watch.external.length === 0, S.watch.external.slice(0, 10));
    C.check(`${level}: no failed (4xx/5xx) requests`, S.watch.failed.length === 0, S.watch.failed.slice(0, 10));
  }
  await env.close();
}
C.finish(C.failed ? 'first failures: ' + C.fails.slice(0, 3).join(' | ').slice(0, 600) : `bundle ${BUNDLE[level].join(',')} done`);
