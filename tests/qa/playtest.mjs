// AI 플레이테스트(학생 시점) — 장면마다 학생이 읽는 글의 양과 조작 수를 실제 화면에서 재고, 시간 모형으로 걸리는 시간을 낸다.
// `npm run check` 에 들지 않는다(tests/qa). 사용:
//   node tests/qa/playtest.mjs [--out design/qa/data/before.json] [--stage s11] [--level h23] [--shots design/qa/shots]
// 하는 일(장면·학교급마다):
//   1) index.html 에서 장면을 학교급 범위로 연다(저장소 기록은 새로 만든다).
//   2) 도입·의뢰·원문과 마주침·선배 풀이·needs 대사를 한 줄씩 넘기며(대사 창의 '다음' 단추를 진짜 마우스로 누름) 보이는 글을 모은다.
//   3) 맵의 모든 조사 지점·인물을 가까운 차례로 찾아간다. 걷는 길은 엔진의 길찾기(맵을 누름 → 경로)로 재고,
//      그 자리로 옮긴 뒤 E 키(살피기)로 연다. 맥락 창의 글(原文·대사·알아 두기)을 모은다.
//   4) 핵심 해독 항목마다: 항목 창을 열고 → 오답 카드 1장을 마우스로 골라 확정(오해 장면) → 정답 카드로 확정. 글은 '기본'과
//      '틀린 길'(오해 장면·왜 아닌지·힌트)로 나눠 모은다.
//   5) 기믹 과제마다: 창을 열어 보이는 글을 모으고, 틀린 답 1번 → 정답 제출(기믹 화면 조작 자체는 각 기믹 점검이 맡으므로,
//      조작 수는 정답의 칸 수로 센다).
//   6) 통역 → 새김 → 돌아보기 → 저장 제안.
// 같은 글은 장면 안에서 한 번만 센다(창을 다시 열면 새로 생긴 글만 읽는다고 본다).
// 시간 모형은 tests/qa/time-model.mjs.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { serve } from '../server.mjs';
import { ROOT } from '../lib/load.mjs';
import { countChars, countHan, estimate, MODEL } from './time-model.mjs';
import { isOpen as isChoiceOpen, answerTranslateChoice } from '../lib/translate-choice.mjs';

const args = process.argv.slice(2);
const pick = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const onlyStage = pick('--stage'), onlyLevel = pick('--level');
const outPath = pick('--out');   // 요약(글 없이) — 저장소에 남김
const fullPath = pick('--full'); // 화면 글까지 모두 — 저장소 밖에 두는 것이 좋음(크다)
const shotsDir = pick('--shots');
const shotJobs = (pick('--shot-jobs') || '').split(',').filter(Boolean); // 예: s2/m,s11/h23 (비우면 모든 장면)

const TOP = '.nm-overlay-host > .nm-st-win:not([inert]):last-child';

// 지금 맨 위 창에서 학생 눈에 보이는 글을 블록 단위로 모은다(화면 낭독기 글·창 머리/발·일반 단추 제외, 카드·기믹 단추 포함).
function snapInPage(sel) {
  const win = document.querySelector(sel);
  const out = { kind: null, item: null, plain: [], side: [], orig: [], cg: 0, who: null };
  if (!win) return out;
  out.kind = win.getAttribute('data-kind') || win.getAttribute('data-win');
  out.item = win.getAttribute('data-item');
  out.cg = win.querySelectorAll('.nm-dlg-cg img, .nm-dlg-cg').length ? 1 : 0;
  const body = win.querySelector('.nm-st-body') || win;
  const blocks = new Map();
  const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let n;
  const isInline = (e) => { const d = getComputedStyle(e).display; return d.startsWith('inline') || d === 'ruby' || d === 'ruby-text' || d === 'contents'; };
  while ((n = tw.nextNode())) {
    const p = n.parentElement;
    if (!p || !n.nodeValue.trim()) continue;
    if (p.closest('.nm-sr, script, style, [hidden], .nm-st-foot, .nm-st-head, .nm-st-seenbox')) continue;
    const btn = p.closest('button');
    if (btn && !btn.matches('.nm-st-card, .nm-st-ctx-item') && !btn.closest('.nm-st-gimmick, [data-gimmick]')) continue;
    if (!p.getClientRects().length) continue;
    const cs = getComputedStyle(p);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let b = p;
    while (b !== body && b.parentElement && isInline(b)) b = b.parentElement;
    // 곁글: 표지 카드(알아 두기·이본·해석·虛·풀이)·原文 카드의 제목줄·'규칙 카드가 붙었어요' 상자 — 학생이 훑어 읽는 글
    const card = p.closest('.nm-card');
    const side = !!(p.closest('.nm-st-rule-added') || (card && card.getAttribute('data-mark') !== 'orig') || (card && !p.closest('.nm-orig-line')));
    const e = blocks.get(b) || { t: '', orig: !!p.closest('.nm-orig-line'), side };
    e.t += n.nodeValue;
    blocks.set(b, e);
  }
  for (const e of blocks.values()) {
    const t = e.t.replace(/\s+/g, ' ').trim();
    if (t) (e.orig ? out.orig : e.side ? out.side : out.plain).push(t);
  }
  return out;
}

function makeRun(page, job) {
  const seen = new Set();
  const seenAll = []; // 본 글 전부(기믹 설정 글 겹침 판단용)
  const focusNotes = new Set();
  const ev = []; // { phase, tag, type, ... }
  const problems = [];
  const note = (m) => problems.push(m);
  let phase = 'intro', tag = 'base';
  const add = (o) => ev.push(Object.assign({ phase, tag }, o));

  async function snap() { return page.evaluate(snapInPage, TOP); }
  function record(s, ctxLabel) {
    let plain = 0, orig = 0, side = 0, origHan = 0;
    const newPlain = [], newOrig = [], newSide = [];
    const SKIP = /^(출처|https?:)/; // 출처 줄은 읽는다고 보지 않는다
    // 기믹 설정 글은 화면에 이미 보인 글(부분 문자열 포함)이면 세지 않는다
    // (기믹 화면은 原文을 낱말 단추로 쪼개 보이므로, 설정 글의 글자 70% 이상이 이미 본 글에 있으면 겹친 것으로 본다)
    const dup = (t) => {
      if (s.kind !== 'task-config') return false;
      if (seenAll.some(x => x.includes(t))) return true;
      const joined = seenAll.join('').replace(/\s+/g, '');
      const words = t.split(/\s+/).filter(Boolean);
      const total = words.reduce((n, w) => n + w.length, 0) || 1;
      const covered = words.filter(w => joined.includes(w)).reduce((n, w) => n + w.length, 0);
      if (covered / total >= 0.7) return true;
      // 띄어쓰기 없는 原文 줄: 한글만 남겨(한자 뒤 루비 읽기 등 그리는 방식 차이를 피함) 이미 본 글에 들어 있는 조각(2자 이상)이 덮는 비율
      const hg = (x) => x.replace(/[^\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/g, '');
      const seenHg = seenAll.map(hg).join('|');
      const h = hg(t);
      let covered2 = 0;
      for (let i = 0; i < h.length;) {
        let k = 0;
        while (i + k < h.length && seenHg.includes(h.slice(i, i + k + 1))) k++;
        if (k >= 2) { covered2 += k; i += k; } else i++;
      }
      const rest = { length: h.length - covered2 }, len0 = h.length || 1;
      return rest.length / len0 <= 0.3;
    };
    for (const t of s.plain) {
      if (SKIP.test(t) || dup(t)) continue;
      if (!seen.has(t)) { seen.add(t); newPlain.push(t); plain += countChars(t); }
    }
    for (const t of (s.side || [])) {
      if (SKIP.test(t)) continue;
      if (!seen.has(t)) { seen.add(t); newSide.push(t); side += countChars(t); }
    }
    for (const t of s.orig) { if (dup(t)) continue; if (!seen.has('O:' + t)) { seen.add('O:' + t); newOrig.push(t); const h = countHan(t); origHan += h; orig += countChars(t) - h; } }
    if (s.kind !== 'task-config') seenAll.push(...s.plain, ...(s.side || []), ...s.orig);
    const ph = s.kind === 'translate' ? { phase: 'translate' } : {};
    if (plain || orig || side || origHan) ev.push(Object.assign({ phase, tag }, ph, { type: 'read', plain, side, orig, origHan, win: s.kind, where: ctxLabel || null,
      text: newPlain.concat(newSide.map(t => '〔곁〕' + t), newOrig.map(t => '〔原〕' + t)) }));
    if (s.cg) add({ type: 'cg' });
  }
  const top = () => page.evaluate((sel) => {
    const w = document.querySelector(sel);
    if (!w) return null;
    const has = (s) => !!w.querySelector(s);
    return { win: w.getAttribute('data-win'), item: w.getAttribute('data-item'), context: w.getAttribute('data-context'),
      next: has('.nm-dlg-next'), skip: has('.nm-st-skip'), later: has('.nm-st-later'), endNext: has('.nm-st-foot .nm-st-next') };
  }, TOP);
  async function realClick(sel) {
    // 진짜 마우스 누르기(겹침이 있으면 실패) → 실패하면 DOM 누르기로 대신하고 문제로 남긴다
    try { await page.locator(sel).first().click({ timeout: 1500 }); return 'mouse'; }
    catch (e) {
      const ok = await page.evaluate((s) => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);
      if (ok) {
        const why = String(e && e.message || '').split(/\r?\n/).filter(l => /intercepts|not stable|not visible|outside|timeout/i.test(l)).slice(-2).join(' / ').slice(0, 220);
        const where = await page.evaluate((s) => { const b = document.querySelector(s); const w = b && b.closest('.nm-st-win'); return w ? (w.getAttribute('data-kind') || w.getAttribute('data-win')) + ': ' + (w.textContent || '').replace(/\s+/g, ' ').slice(0, 60) : ''; }, sel).catch(() => '');
        note('mouse click blocked → DOM click: ' + sel.replace(TOP, 'TOP') + ' [' + where + '] ' + why);
        return 'dom';
      }
      return false;
    }
  }
  // 대화·끝 창을 넘기며 글을 모은다.
  async function settle(max = 120) {
    for (let i = 0; i < max; i++) {
      const t = await top();
      if (!t) break;
      if (t.next) { record(await snap()); add({ type: 'click', what: 'next' }); await realClick(TOP + ' .nm-dlg-next'); }
      else if (t.skip) { record(await snap()); add({ type: 'end', what: 'skip-reflection' }); await realClick(TOP + ' .nm-st-skip'); }
      else if (t.later) { record(await snap()); add({ type: 'click', what: 'later' }); await realClick(TOP + ' .nm-st-later'); }
      else if (t.endNext) { record(await snap()); add({ type: 'click', what: 'end-next' }); await realClick(TOP + ' .nm-st-foot .nm-st-next'); }
      else break;
      await page.waitForTimeout(30);
    }
  }
  // 창을 하나씩 닫는다. 닫다가 대화(통역 등)가 열리면 그 대화를 읽으며 넘긴다.
  async function closeAll() {
    for (let i = 0; i < 30; i++) {
      const t = await top();
      if (!t) { if (await page.evaluate(() => NM.engine.isOverlayOpen())) { await page.evaluate(() => NM.engine.closeOverlay()); continue; } break; }
      if (t.next || t.skip || t.later || t.endNext) { await settle(); continue; }
      await page.evaluate(() => NM.engine.closeOverlay());
      await page.waitForTimeout(60);
    }
  }

  // 맵에서 대상까지 걷기: 대상 자리를 누르면 엔진이 경로를 만든다 → 경로 길이를 재고 → 끝점으로 옮겨 E 키로 살핀다.
  async function walkTo(target) {
    const r = await page.evaluate((t) => {
      const st0 = NM.engine.test.state();
      const tg = NM.engine.test.target(t.id);
      if (!tg) return { ok: false, why: 'no target' };
      const rc = tg.rect;
      const wx = rc.x + rc.w / 2, wy = rc.y + rc.h / 2;
      const ok = NM.engine.test.tap(wx, wy);
      const st = NM.engine.test.state();
      let len = 0, x = st0.x, y = st0.y;
      for (const p of st.path) { len += Math.hypot(p.x - x, p.y - y); x = p.x; y = p.y; }
      if (st.path.length) NM.engine.test.teleport(x, y);
      return { ok, len, from: { x: st0.x, y: st0.y }, to: { x, y }, prompt: NM.engine.test.state().prompt };
    }, target);
    if (!r.ok) { note('walk: no path to ' + target.id); }
    add({ type: 'walk', px: r.len || 0, to: target.id });
    // 창을 닫은 뒤 초점이 단추에 남아 있으면 E 키가 듣지 않는다(엔진 규칙). 학생은 지도를 눌러 걸으므로 초점이 풀린다고 본다.
    const focus = await page.evaluate(() => { const a = document.activeElement; const d = a && a !== document.body ? (a.tagName + '.' + (a.className || '')).slice(0, 60) : null; if (a && a.blur) a.blur(); return d; });
    if (focus) focusNotes.add(focus);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(80);
    let opened = await top();
    if (!opened) {
      note('E key did not open ' + target.id + ' (prompt ' + JSON.stringify(r.prompt) + ') → goTo');
      await page.evaluate((id) => NM.engine.goTo(id), target.id);
      await page.waitForTimeout(80);
    }
    return r;
  }

  return { seen, focusNotes, ev, problems, note, add, snap, record, top, realClick, settle, closeAll, walkTo,
    setPhase: (p) => { phase = p; }, setTag: (t) => { tag = t; } };
}

async function playMeasured(page, job, shot) {
  const R = makeRun(page, job);
  const { stageId, level } = job;
  const ok = await page.evaluate(async ({ stageId, level }) => {
    try { localStorage.clear(); } catch (e) { /* 무시 */ }
    window.__nmErrors = [];
    const st = NM.core.save.createStore({ storage: localStorage, urlLevel: level, level });
    st.setup({ level, protagonist: 1, nickname: '바다' });
    st.markPrologueDone && st.markPrologueDone();
    window.__pt = { store: st, exits: [] };
    if (NM.ui.stage.stop) NM.ui.stage.stop();
    return NM.ui.stage.run(stageId, { store: st, level, teacher: false, onExit: (r) => window.__pt.exits.push(r) });
  }, { stageId, level });
  if (!ok) { R.note('run() failed'); return { R }; }
  await page.waitForTimeout(150);
  R.setPhase('intro');
  await R.settle();

  const plan = await page.evaluate(({ stageId }) => {
    const st = window.__pt.store;
    const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[stageId], st.level);
    const places = NM.engine.listPlaces().map(p => ({ id: p.id, kind: p.kind, contextId: p.contextId || null }));
    const s0 = NM.engine.test.state();
    const items = st.coreItems(sc).map(it => ({
      id: it.id, kind: it.kind, gimmick: it.gimmick || null, answer: it.answer,
      contexts: (sc.contexts || []).filter(c => (c.items || []).indexOf(it.id) >= 0).map(c => c.id),
      wrong: it.kind === 'read' ? ((it.cards || []).filter(c => !c.correct)[0] || {}).id : null,
      right: it.kind === 'read' ? ((it.cards || []).filter(c => c.correct)[0] || {}).id : null,
      nCards: it.kind === 'read' ? (it.cards || []).length : 0
    }));
    return { phase: NM.ui.stage.current().phase, places, spawn: { x: s0.x, y: s0.y }, items,
      translateAt: (sc.translate && sc.translate.at) || null, title: sc.title,
      allContexts: (sc.contexts || []).map(c => c.id) };
  }, { stageId });
  if (plan.phase !== 'explore') R.note('after intro, phase is ' + plan.phase);

  // 탐색: 모든 장소를 가까운 차례로(학생이 지도를 한 바퀴 도는 모형). 통역 장소는 맨 끝에 다시 간다.
  R.setPhase('explore');
  const targets = plan.places.slice();
  const pos = Object.assign({}, plan.spawn);
  const centers = await page.evaluate((ids) => ids.map(id => { const t = NM.engine.test.target(id); return t ? { id, x: t.rect.x + t.rect.w / 2, y: t.rect.y + t.rect.h / 2 } : { id, x: 0, y: 0 }; }), targets.map(t => t.id));
  const order = [];
  const left = centers.slice();
  while (left.length) {
    let bi = 0, bd = Infinity;
    left.forEach((c, i) => { const d = Math.hypot(c.x - pos.x, c.y - pos.y); if (d < bd) { bd = d; bi = i; } });
    const c = left.splice(bi, 1)[0];
    order.push(c.id); pos.x = c.x; pos.y = c.y;
  }
  let shotDone = false;
  for (const id of order) {
    const tgt = targets.find(t => t.id === id);
    await R.walkTo(tgt);
    await R.settle();
    const t = await R.top();
    if (t) R.record(await R.snap(), id);
    if (shot && !shotDone && t && t.win === 'context') { await shot('ctx'); shotDone = true; }
    await R.closeAll();
    await R.settle();
  }

  // 핵심 항목
  R.setPhase('items');
  let shotItem = false;
  for (const it of plan.items) {
    if (it.kind === 'read') {
      const ctx = [...new Set(it.contexts)];
      if (ctx.length < 2) R.note(it.id + ' has fewer than 2 contexts');
      R.setTag('base');
      await page.evaluate((id) => NM.ui.stage.openItem(id), it.id);
      R.add({ type: 'click', what: 'open-item' });
      await page.waitForTimeout(80);
      R.record(await R.snap(), it.id);
      R.add({ type: 'choice', item: it.id, nCards: it.nCards });
      if (it.wrong) {
        R.setTag('wrong:' + it.id);
        await R.realClick(TOP + ` .nm-st-card[data-card="${it.wrong}"]`);
        if (!(await R.realClick(TOP + ' .nm-st-confirm'))) R.note(it.id + ': confirm button closed');
        R.add({ type: 'click', what: 'confirm' });
        await page.waitForTimeout(80);
        await R.settle();
        if ((await R.top() || {}).item !== it.id) { await page.evaluate((id) => NM.ui.stage.openItem(id), it.id); await page.waitForTimeout(80); }
        R.record(await R.snap(), it.id);
        R.add({ type: 'choice', item: it.id, nCards: it.nCards - 1, retry: true });
        if (shot && !shotItem) { await shot('misread-' + it.id.replace('.', '-')); shotItem = true; }
      }
      R.setTag('base');
      await R.realClick(TOP + ` .nm-st-card[data-card="${it.right}"]`);
      await R.realClick(TOP + ' .nm-st-confirm');
      R.add({ type: 'click', what: 'confirm' });
      await page.waitForTimeout(80);
      await R.settle();
      R.record(await R.snap(), it.id);
      const s2 = await page.evaluate((id) => window.__pt.store.stage(NM.ui.stage.current().stageId).items[id].state, it.id);
      if (s2 !== 'confirmed') R.note(it.id + ': state after correct confirm = ' + s2);
      await R.closeAll(); await R.settle();
    } else {
      R.setTag('base');
      await page.evaluate((id) => NM.ui.stage.openItem(id), it.id);
      R.add({ type: 'click', what: 'open-item' });
      await page.waitForTimeout(200);
      R.record(await R.snap(), it.id);
      // 기믹 설정 글(뒤 단계 화면에 나올 글)도 센다: config 의 사람이 읽는 문자열 + 原文 블록
      const cfg = await page.evaluate((id) => {
        const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[NM.ui.stage.current().stageId], window.__pt.store.level);
        const item = sc.items.find(i => i.id === id);
        const plain = [], orig = [];
        const isId = (s) => /^[A-Za-z0-9_.\-]+$/.test(s);
        (function walk(v, k) {
          if (typeof v === 'string') {
            if (/^O-s\d+-/.test(v) && NM.data.ORIG[v]) { (NM.data.ORIG[v].lines || []).forEach(l => orig.push(NM.core.yet.render(typeof l === 'string' ? l : (l.text || ''), { bangjeom: false, ruby: 'base' }))); return; }
            if (isId(v) || k === 'id' || k === 'find') return;
            plain.push(NM.core.yet.render(v, { bangjeom: false, ruby: 'base' }));
          } else if (Array.isArray(v)) v.forEach(x => walk(x, k));
          else if (v && typeof v === 'object') Object.keys(v).forEach(kk => walk(v[kk], kk));
        })(item.config, null);
        return { plain, orig, steps: (item.config && Array.isArray(item.config.steps)) ? item.config.steps.length : 1 };
      }, it.id);
      R.record({ kind: 'task-config', plain: cfg.plain, orig: cfg.orig, cg: 0 }, it.id + ' (config)');
      const ops = countOps(it.answer);
      R.add({ type: 'ops', item: it.id, gimmick: it.gimmick, ops, steps: cfg.steps });
      if (shot && it === plan.items.find(x => x.kind === 'task')) await shot('task-' + it.id.replace('.', '-'));
      R.setTag('wrong:' + it.id);
      await page.evaluate(() => NM.ui.itemTask.test.submit({ __playthroughWrong: true }));
      R.add({ type: 'click', what: 'submit' });
      await page.waitForTimeout(80);
      R.record(await R.snap(), it.id);
      R.add({ type: 'fix', item: it.id });
      R.setTag('base');
      await page.evaluate((a) => NM.ui.itemTask.test.submit(a), it.answer);
      R.add({ type: 'click', what: 'submit' });
      await page.waitForTimeout(80);
      R.record(await R.snap(), it.id);
      const s2 = await page.evaluate((id) => window.__pt.store.stage(NM.ui.stage.current().stageId).items[id].state, it.id);
      if (s2 !== 'done') R.note(it.id + ': state after correct submit = ' + s2);
      await R.settle();
      await R.closeAll(); await R.settle();
    }
  }

  // 통역
  R.setPhase('translate');
  await page.waitForTimeout(120);
  if (plan.translateAt) {
    const tgt = plan.places.find(p => p.id === plan.translateAt || p.contextId === plan.translateAt) || { id: plan.translateAt };
    await R.walkTo(tgt);
  }
  await page.waitForTimeout(120);
  await R.settle(160);
  // 통역 고르기(scene.translate.choose)가 있으면 바르게 골라 통역한다(tests/lib/translate-choice.mjs)
  if (await isChoiceOpen(page)) {
    const c = await answerTranslateChoice(page, { wrongOnce: false });
    c.problems.forEach(p => R.note('translate choice: ' + p));
    await page.waitForTimeout(60);
    await R.settle(160);
  }
  await page.waitForTimeout(150);
  R.setPhase('end');
  await R.settle(60);
  const end = await page.evaluate(({ stageId }) => {
    const st = window.__pt.store;
    return { exits: window.__pt.exits, status: st.stage(stageId).status, phase: NM.ui.stage.current().phase, errors: (window.__nmErrors || []).slice(0, 5) };
  }, { stageId });
  if (end.status !== 'done') R.note('stage status ' + end.status + ' (phase ' + end.phase + ')');
  if (end.errors.length) R.note('NM errors: ' + JSON.stringify(end.errors));
  return { R, plan, end };
}

// 기믹 조작 수: 정답 구조의 끝 칸 수(고르기·놓기·긋기 하나 = 조작 하나). 배열 안 문자열은 하나씩, 숫자 배열(끊는 자리)은 자리마다.
function countOps(a) {
  if (a == null) return 0;
  if (Array.isArray(a)) return a.reduce((n, x) => n + (typeof x === 'object' && x ? countOps(x) : 1), 0);
  if (typeof a === 'object') return Object.keys(a).reduce((n, k) => n + countOps(a[k]), 0);
  return 1;
}

const HARD = setTimeout(() => { console.log('time limit'); process.exit(1); }, 1500000);
const server = await serve();
let browser;
const results = [];
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErr = [];
  page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text()); });
  page.on('pageerror', e => consoleErr.push('pageerror: ' + e.message));
  await page.goto(server.url);
  await page.waitForFunction(() => window.NM && NM.ui && NM.ui.stage && NM.engine, null, { timeout: 30000 });
  await page.evaluate(() => NM.engine.ready());
  const B = await page.evaluate(() => NM.data.BUNDLES);
  const jobs = [];
  for (const lv of ['m', 'h1', 'h23']) {
    jobs.push({ stageId: 's0', level: lv, role: 'prologue' });
    B[lv].stages.forEach(s => jobs.push({ stageId: s, level: lv, role: 'bundle' }));
    (B[lv].optional || []).forEach(s => jobs.push({ stageId: s, level: lv, role: 'optional' }));
  }
  for (const job of jobs) {
    if (onlyStage && job.stageId !== onlyStage) continue;
    if (onlyLevel && job.level !== onlyLevel) continue;
    const shot = (shotsDir && (!shotJobs.length || shotJobs.includes(job.stageId + '/' + job.level))) ? async (name) => {
      mkdirSync(join(ROOT, shotsDir), { recursive: true });
      await page.screenshot({ path: join(ROOT, shotsDir, `${job.stageId}-${job.level}-${name}.jpg`), type: 'jpeg', quality: 55 });
    } : null;
    const t0 = Date.now();
    const { R, plan, end } = await playMeasured(page, job, shot);
    const est = estimate(R.ev, job.level);
    results.push({ ...job, title: plan && plan.title, items: plan ? plan.items.map(i => i.id) : [], problems: R.problems, focusAfterClose: [...R.focusNotes], end, est, events: R.ev, ms: Date.now() - t0 });
    console.log(`${job.stageId}/${job.level} ${plan ? plan.items.length : 0} items — best ${est.best.min.toFixed(1)} · typical ${est.typical.min.toFixed(1)} · allWrong ${est.allWrong.min.toFixed(1)} · slow ${est.slowTypical.min.toFixed(1)} min` + (R.problems.length ? '\n   ! ' + R.problems.join('\n   ! ') : ''));
  }
  if (consoleErr.length) console.log('console errors: ' + JSON.stringify(consoleErr.slice(0, 5)));
  results.consoleErr = consoleErr;
} finally {
  if (browser) await browser.close();
  await server.close();
  clearTimeout(HARD);
}
const abs = (p) => (/^[A-Za-z]:|^\//.test(p) ? p : join(ROOT, p));
if (fullPath) {
  mkdirSync(dirname(abs(fullPath)), { recursive: true });
  writeFileSync(abs(fullPath), JSON.stringify({ model: MODEL, date: new Date().toISOString().slice(0, 10), results }, null, 1));
  console.log('wrote ' + fullPath);
}
if (outPath) {
  // 요약: 장면·학교급마다 추정 시간, 글자 수, 항목, 문제. 사건은 항목별 합계만.
  const summary = results.map(r => {
    const perItem = {};
    for (const e of r.events) {
      const key = e.phase === 'items' ? (e.item || (e.where || '').replace(/ \(config\)$/, '') || 'items') : e.phase;
      const o = perItem[key] || (perItem[key] = { plain: 0, side: 0, orig: 0, origHan: 0, walkPx: 0, ops: 0, dialogClicks: 0 });
      if (e.type === 'read') { o.plain += e.plain || 0; o.side += e.side || 0; o.orig += e.orig || 0; o.origHan += e.origHan || 0; }
      if (e.type === 'walk') o.walkPx += Math.round(e.px || 0);
      if (e.type === 'ops') o.ops += e.ops || 0;
      if (e.type === 'click' && e.what === 'next') o.dialogClicks++;
    }
    return { stageId: r.stageId, level: r.level, role: r.role, title: r.title, items: r.items, problems: r.problems, end: { status: r.end && r.end.status },
      est: r.est, perItem };
  });
  mkdirSync(dirname(abs(outPath)), { recursive: true });
  writeFileSync(abs(outPath), JSON.stringify({ model: MODEL, date: new Date().toISOString().slice(0, 10), results: summary }, null, 1));
  console.log('wrote ' + outPath);
}
