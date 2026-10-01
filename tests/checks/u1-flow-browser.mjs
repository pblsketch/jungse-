// U1 화면 흐름 브라우저 점검 (spec §4·§6·§10·§11):
// 첫 화면 → 처음 정하기(학교급 → 주인공 → 별명, 거절되는 별명 포함) → 서장 진입(장면 진행기 대역) → 장면 고르기,
// 이어 하기, 묶음 밖 안내 한 번, 완료·패 글자, 다시 하기, 학교급 바꾸기(묶음·진행), 새로 시작(확인 뒤 지움),
// 주소 학교급(기록이 있으면 저장 안 함 / 첫 실행이면 처음 학교급으로 저장), 저장소가 막힌 기기 안내 한 번.
import { makeChecker, startBrowser, newPage, record, KEY } from '../fixtures/u1-harness.mjs';

const C = makeChecker('u1-flow-browser', 90000);
const { check } = C;
const env = await startBrowser();
try {
  // ── 1) 처음 → 정하기 → 서장
  let P = await newPage(env);
  let page = P.page;
  await P.seed(null);
  await P.open('');
  await P.waitScreen('title');
  const titleText = await page.textContent('#nm-screens h1');
  check('title shows the game title (old Hangul composed)', titleText.includes('나랏말ᄊᆞ미'), titleText);
  check('no record: only start', await page.$('[data-act="start"]') && !(await page.$('[data-act="continue"]')) && !(await page.$('[data-act="newstart"]')));
  check('settings reachable from title', !!(await page.$('#nm-screens [data-act="settings"]')));
  // 키보드로: 첫 단추에 초점이 있고 Enter 로 누른다
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act'));
  check('primary button focused', focused === 'start', focused);
  await page.keyboard.press('Enter');
  await P.waitScreen('setup-level');
  check('three level choices', (await page.$$('[data-act="level"]')).length === 3);
  await page.click('[data-act="level"][data-value="h1"]');
  await P.waitScreen('setup-protagonist');
  check('four protagonists', (await page.$$('[data-act="protagonist"]')).length === 4);
  check('nothing saved before setup completes', (await P.saved()) === null);
  await page.click('[data-act="protagonist"][data-value="3"]');
  await P.waitScreen('setup-nickname');
  const helpText = await page.textContent('#nm-screens');
  check('real-name warning shown', helpText.includes('실제 이름은 쓰지 마세요'), helpText.slice(0, 200));
  const bad = await page.evaluate(() => NM.data.PROFANITY[0]);
  await page.fill('#nm-nick', bad);
  await page.click('[data-act="nick-ok"]');
  check('profane nickname rejected', (await page.textContent('.nm-error')).includes('다른 별명을 지어 주세요'));
  check('still on nickname step', (await P.screen()) === 'setup-nickname');
  await page.fill('#nm-nick', 'a b');
  await page.press('#nm-nick', 'Enter');
  check('space rejected', (await page.textContent('.nm-error')).includes('띄어쓰기'));
  check('nothing saved after rejection', (await P.saved()) === null);
  await page.fill('#nm-nick', '해솔');
  await page.click('[data-act="nick-ok"]');
  await page.waitForFunction(() => window.__stub && __stub.runs.length === 1);
  let runs = await page.evaluate(() => __stub.runs);
  check('prologue s0 entered with ctx', runs[0].stageId === 's0' && runs[0].level === 'h1' && runs[0].teacher === false && runs[0].hasStore && runs[0].hasSaveImage && runs[0].hasOnExit && !runs[0].storeIsTeacher, runs[0]);
  let rec = await P.saved();
  check('setup saved (level, protagonist, nickname)', rec && rec.level === 'h1' && rec.protagonist === 3 && rec.nickname === '해솔' && rec.prologueDone === false, rec);
  check('screens hidden during stage', (await P.screen()) === null);
  check('toolbar visible during stage', await page.isVisible('#nm-toolbar [data-act="settings"]') && await page.isVisible('#nm-toolbar [data-act="notebook"]'));
  // 서장을 끝내지 않고 나가면 장면 고르기는 닫혀 있다
  await page.evaluate(() => __stub.exit({ completed: false }));
  await P.waitScreen('title');
  check('prologue not done → back to title, continue resumes prologue', !!(await page.$('[data-act="continue"]')));
  await page.click('[data-act="continue"]');
  await page.waitForFunction(() => __stub.runs.length === 2 && __stub.runs[1].stageId === 's0');
  await page.evaluate(() => __stub.finish());
  await P.waitScreen('select');
  rec = await P.saved();
  check('prologue done saved', rec.prologueDone === true);
  check('toolbar hidden on select screen', !(await page.isVisible('#nm-toolbar')));
  const cards = await page.$$eval('[data-stage]', els => els.map(e => ({ id: e.getAttribute('data-stage'), role: e.getAttribute('data-role'), status: e.getAttribute('data-status'), text: e.textContent })));
  const byId = Object.fromEntries(cards.map(c => [c.id, c]));
  check('12 scenes all open (s1~s12)', ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'].every(id => byId[id]) && cards.filter(c => c.id !== 's0').length === 12, cards.map(c => c.id));
  check('h1 bundle marks', byId.s4.role === 'bundle' && byId.s12.role === 'bundle' && byId.s10.role === 'optional' && byId.s2.role === 'outside' && byId.s1.role === 'outside', cards.map(c => c.id + ':' + c.role));
  check('outside marked with text, optional with text', byId.s2.text.includes('추천 묶음 밖') && byId.s10.text.includes('추천 선택') && byId.s4.text.includes('★'));
  check('prologue replay available', !!byId.s0 && byId.s0.status === 'done');
  let tt = await page.textContent('[data-part="title"]');
  check('title (칭호) shown', tt.includes('견습 통사') && tt.includes('0 / 5'), tt);

  // ── 2) 새로 고침 → 이어 하기
  await P.open('');
  await P.waitScreen('title');
  check('record: continue + new start', !!(await page.$('[data-act="continue"]')) && !!(await page.$('[data-act="newstart"]')) && !(await page.$('[data-act="start"]')));
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');

  // ── 3) 묶음 밖 안내 한 번
  await page.click('[data-stage="s2"]');
  await P.waitModal('notice-outside');
  const nt = await page.textContent('.nm-modal[data-modal="notice-outside"]');
  check('outside notice text (middle school content)', nt.includes('중학교에서 배우는 내용이에요'), nt);
  await page.click('.nm-modal[data-modal="notice-outside"] [data-act="cancel"]');
  check('pick other: notice not marked seen', (await P.saved()).seenNotices.length === 0 && (await page.evaluate(() => __stub.runs.length)) === 0);
  await page.click('[data-stage="s2"]');
  await P.waitModal('notice-outside');
  check('notice shown again until the player enters', true);
  await page.click('.nm-modal[data-modal="notice-outside"] [data-act="enter"]');
  await page.waitForFunction(() => __stub.runs.length === 1 && __stub.runs[0].stageId === 's2');
  await page.evaluate(() => __stub.exit());
  await P.waitScreen('select');
  await page.click('[data-stage="s2"]');
  await page.waitForFunction(() => __stub.runs.length === 2);
  check('no notice the second time', !(await P.modalOpen('notice-outside')));
  await page.evaluate(() => __stub.exit());
  await P.waitScreen('select');
  rec = await P.saved();
  check('notice seen saved', rec.seenNotices.length === 1, rec.seenNotices);
  // 묶음 장면은 안내 없음
  await page.click('[data-stage="s4"]');
  await page.waitForFunction(() => __stub.runs.length === 3 && __stub.runs[2].stageId === 's4');
  check('no notice for bundle scene', !(await P.modalOpen('notice-outside')));
  // ── 4) s4 끝내기 → 완료·패 글자, 칭호
  await page.evaluate(() => __stub.finish());
  await P.waitScreen('select');
  let s4 = await page.$eval('[data-stage="s4"]', e => ({ status: e.getAttribute('data-status'), text: e.textContent, glyph: (e.querySelector('.nm-glyph .nm-yet') || e.querySelector('.nm-glyph') || {}).textContent }));
  check('done scene shows done mark and glyph', s4.status === 'done' && s4.text.includes('완료') && s4.glyph === 'ㆆ', s4);
  tt = await page.textContent('[data-part="title"]');
  check('title count updated (1/5)', tt.includes('1 / 5'), tt);
  // 끝낸 장면 다시 하기
  await page.click('[data-stage="s4"]');
  await P.waitModal('stage-done');
  await page.click('.nm-modal[data-modal="stage-done"] [data-act="replay"]');
  await page.waitForFunction(() => __stub.runs.length === 4 && __stub.runs[3].stageId === 's4');
  rec = await P.saved();
  check('replay keeps done + glyph, clears notebook', rec.progress.h1.s4.status === 'done' && rec.glyphs.h1.includes('s4') && rec.progress.h1.s4.translations.length === 0 && rec.progress.h1.s4.items['s4.r1'].state === 'unseen' && rec.progress.h1.s4.items['s4.r1'].firstTry === true, rec.progress.h1.s4);
  await page.evaluate(() => __stub.exit());
  await P.waitScreen('select');

  // ── 5) 학교급 바꾸기
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-setting="level"] [data-value="m"]');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.nm-modal[data-modal="settings"]'));
  let m = await page.$$eval('[data-stage]', els => Object.fromEntries(els.map(e => [e.getAttribute('data-stage'), e.getAttribute('data-role') + ':' + e.getAttribute('data-status')])));
  check('level m: bundle display switched', m.s2.startsWith('bundle') && m.s3.startsWith('bundle') && m.s4.startsWith('outside') && m.s10.startsWith('outside'), m);
  check('level m: per-level progress (s4 not done here)', m.s4.endsWith(':new') && m.s2.endsWith(':new'), m);
  check('prologue still done after level change', m.s0 && m.s0.endsWith(':done'), m.s0);
  tt = await page.textContent('[data-part="title"]');
  check('title for m (0/4)', tt.includes('0 / 4'), tt);
  check('level saved by explicit setting change', (await P.saved()).level === 'm');
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-setting="level"] [data-value="h1"]');
  await page.click('.nm-modal[data-modal="settings"] [data-act="close"]');
  m = await page.$$eval('[data-stage]', els => Object.fromEntries(els.map(e => [e.getAttribute('data-stage'), e.getAttribute('data-status')])));
  check('back to h1: s4 done again', m.s4 === 'done', m);

  // ── 6) 새로 시작
  await P.open('');
  await P.waitScreen('title');
  await page.click('[data-act="newstart"]');
  await P.waitModal('confirm-newstart');
  await page.click('.nm-modal[data-modal="confirm-newstart"] [data-act="no"]');
  check('cancel keeps record', (await P.saved()) !== null && (await P.screen()) === 'title');
  await page.click('[data-act="newstart"]');
  await P.waitModal('confirm-newstart');
  await page.click('.nm-modal[data-modal="confirm-newstart"] [data-act="yes"]');
  await P.waitScreen('setup-level');
  check('new start cleared the record', (await P.saved()) === null);
  await P.clean(check, 'flow');
  await P.context.close();

  // ── 6b) 처음 사용자가 정하기 전에 설정을 바꿔도 처음 정하기는 그대로(학교급 단계 포함)
  P = await newPage(env); page = P.page;
  await P.seed(null);
  await P.open('');
  await P.waitScreen('title');
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.click('[data-setting="fontScale"] [data-value="2"]');
  await page.click('[data-setting="level"] [data-value="h23"]');
  await page.click('.nm-modal[data-modal="settings"] [data-act="close"]');
  check('settings before setup: title still offers start only', !!(await page.$('[data-act="start"]')) && !(await page.$('[data-act="continue"]')) && !(await page.$('[data-act="newstart"]')));
  await P.open('');
  await P.waitScreen('title');
  check('after reload: still start only (setup not done)', !!(await page.$('[data-act="start"]')) && !(await page.$('[data-act="continue"]')));
  await page.click('[data-act="start"]');
  await P.waitScreen('setup-level');
  check('level step not skipped', true);
  check('settings button on setup-level', !!(await page.$('#nm-screens [data-act="settings"]')));
  check('level chosen in settings is preselected', (await page.getAttribute('[data-act="level"][data-value="h23"]', 'aria-pressed')) === 'true');
  await page.click('[data-act="level"][data-value="h1"]');
  await P.waitScreen('setup-protagonist');
  check('settings button on setup-protagonist', !!(await page.$('#nm-screens [data-act="settings"]')));
  await page.click('[data-act="protagonist"][data-value="4"]');
  await P.waitScreen('setup-nickname');
  check('settings button on setup-nickname', !!(await page.$('#nm-screens [data-act="settings"]')));
  await page.click('#nm-screens [data-act="settings"]');
  await P.waitModal('settings');
  await page.keyboard.press('Escape');
  check('setup step kept after closing settings', (await P.screen()) === 'setup-nickname');
  await page.fill('#nm-nick', 'Bora');
  await page.click('[data-act="nick-ok"]');
  await page.waitForFunction(() => __stub.runs.length === 1);
  rec = await P.saved();
  check('chosen level saved by setup (not the default)', rec.level === 'h1' && rec.protagonist === 4 && rec.nickname === 'Bora' && rec.settings.fontScale === 2, rec);
  await P.clean(check, 'settings-before-setup');
  await P.context.close();

  // ── 7) 주소 학교급: 기록이 있으면 그 접속에만
  P = await newPage(env); page = P.page;
  await P.seed(record({ level: 'm' }));
  await P.open('?level=h23');
  await P.waitScreen('title');
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');
  const roles = await page.$$eval('[data-stage]', els => Object.fromEntries(els.map(e => [e.getAttribute('data-stage'), e.getAttribute('data-role')])));
  check('URL level applies to this session (h23 bundle)', roles.s1 === 'bundle' && roles.s7 === 'bundle' && roles.s2 === 'outside', roles);
  check('header shows URL level', (await page.textContent('#nm-screens header')).includes('고2~3'));
  await page.click('[data-stage="s2"]');
  await P.waitModal('notice-outside');
  await page.click('.nm-modal[data-modal="notice-outside"] [data-act="enter"]');
  await page.waitForFunction(() => __stub.runs.length === 1);
  await page.evaluate(() => __stub.partial());
  await page.evaluate(() => __stub.exit());
  await P.waitScreen('select');
  rec = await P.saved();
  check('URL level NOT saved when a record exists', rec.level === 'm', rec.level);
  check('progress written to URL level slot', rec.progress.h23 && rec.progress.h23.s2 && rec.progress.h23.s2.status === 'progress' && !rec.progress.m, rec.progress);
  await P.open('');
  await P.waitScreen('title');
  await page.click('[data-act="continue"]');
  await P.waitScreen('select');
  check('without URL: device level m again', (await page.getAttribute('[data-stage="s2"]', 'data-role')) === 'bundle');
  await P.clean(check, 'url-level');
  await P.context.close();

  // ── 8) 첫 실행 + 주소 학교급 → 처음 학교급으로 저장, 학교급 단계 건너뜀
  P = await newPage(env); page = P.page;
  await P.seed(null);
  await P.open('?level=h23');
  await P.waitScreen('title');
  await page.click('[data-act="start"]');
  await P.waitScreen('setup-protagonist');
  check('level step skipped with URL level', true);
  await page.click('[data-act="protagonist"][data-value="1"]');
  await P.waitScreen('setup-nickname');
  await page.fill('#nm-nick', 'Sol7');
  await page.click('[data-act="nick-ok"]');
  await page.waitForFunction(() => __stub.runs.length === 1);
  rec = await P.saved();
  check('first run: URL level saved as initial level', rec && rec.level === 'h23' && rec.nickname === 'Sol7', rec);
  check('stage ctx level = h23', (await page.evaluate(() => __stub.runs[0].level)) === 'h23');
  await P.clean(check, 'first-run');
  await P.context.close();

  // ── 9) 저장소가 막힌 기기: 메모리로 계속 + 안내 한 번
  P = await newPage(env, { initScript: () => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } }); } });
  page = P.page;
  await P.open('');
  await P.waitModal('notice-storage');
  check('storage warning shown', (await page.textContent('.nm-modal[data-modal="notice-storage"]')).includes('저장할 수 없어요'));
  await page.click('.nm-modal[data-modal="notice-storage"] [data-act="close"]');
  await page.click('[data-act="start"]');
  await P.waitScreen('setup-level');
  await page.click('[data-act="level"][data-value="m"]');
  await page.click('[data-act="protagonist"][data-value="2"]');
  await page.fill('#nm-nick', '하늘');
  await page.click('[data-act="nick-ok"]');
  await page.waitForFunction(() => __stub.runs.length === 1);
  check('game continues in memory', (await page.evaluate(() => __stub.runs[0].stageId)) === 's0');
  check('storage warning only once', (await page.$$('.nm-modal[data-modal="notice-storage"]')).length === 0);
  await page.evaluate(() => __stub.finish());
  await P.waitScreen('select');
  check('select opens after prologue (memory)', true);
  await P.clean(check, 'storage-blocked');
  await P.context.close();
} catch (e) {
  check('no exception', false, String(e && e.stack || e));
} finally {
  await env.close();
}
C.finish();
