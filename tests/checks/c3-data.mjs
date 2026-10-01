// C3 ③ 데이터 점검 (spec §18-1-3, §19-1·§19-3·§19-4, §6-1)
// - 장면 목록·추천 묶음이 §6-1과 같다. 장면 목록(STAGE_IDS) 기준으로 장면마다 데이터 '있음/없음'을 보고한다.
//   데이터가 아직 없는 장면은 건너뛰지 않고 '없음'으로 적는다. 없음은 기본으로는 실패가 아니고,
//   --require-all-scenes (또는 NM_REQUIRE_ALL_SCENES=1)를 주면 실패다 — 장면을 다 채운 뒤(Q1·DEP1) 켠다.
// - id 형식·겹침, 참조 이어짐(맵 조사 지점·인물 ↔ 맥락 ↔ 항목 ↔ 原文 id 형식 ↔ 규칙 카드 ↔ 그림 파일).
// - 해독 항목마다 그 장면 맵 안에 서로 다른 맥락 2곳 이상:
//   맥락 c 가 그 항목에 셈 = 장면 맥락 c 의 items 에 항목이 있고, 맵 spots·npcs 층에 contextId=c 인 객체가 있다.
// - 해독 항목마다 카드 3~4장, 정답 정확히 1장. 기믹 과제마다 gimmick·answer. 장면마다 패 글자(서장 s0 제외).
// 原文 블록의 존재·확실도는 c3-orig 가 본다(여기서는 형식만).
// 사용: node tests/checks/c3-data.mjs [--root <데이터 뿌리>] [--require-all-scenes]
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { parseArgs, loadData, reporter, readJson, relTo, walkFiles, sceneEntries, sceneVariants, asList, LEVELS, dataFiles } from '../lib/content.mjs';

// spec §6-1 (서장 제외). 이 표가 바뀌면 spec 을 먼저 고친다.
const SPEC_STAGE_IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];
const SPEC_BUNDLES = {
  m:   { stages: ['s2', 's3', 's9', 's12'], optional: [] },
  h1:  { stages: ['s4', 's5', 's6', 's9', 's12'], optional: ['s10'] },
  h23: { stages: ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'], optional: [] }
};
const ITEM_RE = /^(s\d+)\.([rt])([1-9]\d*)$/;
const CTX_RE = /^(s\d+)\.c([1-9]\d*)$/;
const CARD_RE = /^(s\d+\.[rt][1-9]\d*)\.([abcd])$/;
const RULE_RE = /^rule\.[A-Za-z][A-Za-z0-9]*$/;
const BLOCK_RE = /^O-s(?:[0-9]|1[0-2])-[A-Za-z0-9]+$/;
const ASSET_KEY_FIELDS = { cgKey: 'cg', portraitKey: 'portraits', spriteKey: 'sprites', bgKey: 'bg', uiKey: 'ui' };

const R = reporter('c3-data');
const { root, requireAllScenes } = parseArgs();
const { NM, data, loadErrors, where, origin } = loadData(root);
R.setWhere(where);
loadErrors.forEach(e => R.error(e.file, `불러오기 실패: ${e.message}`));
const tiled = NM.engine.tiled;
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const fileExists = (p) => existsSync(p) && statSync(p).isFile();
const sameSet = (a, b) => Array.isArray(a) && a.length === b.length && new Set(a).size === a.length && b.every(x => a.includes(x));

// ── 1) 장면 목록과 추천 묶음 ──
const STAGE_IDS = data.STAGE_IDS;
if (!Array.isArray(STAGE_IDS) || STAGE_IDS.join() !== SPEC_STAGE_IDS.join()) {
  R.error('NM.data.STAGE_IDS', `spec §19-1 과 다르다: ${JSON.stringify(STAGE_IDS)} (기대 ${JSON.stringify(SPEC_STAGE_IDS)})`);
}
const BUNDLES = data.BUNDLES || {};
for (const lv of Object.keys(BUNDLES)) if (!SPEC_BUNDLES[lv]) R.error(`NM.data.BUNDLES.${lv}`, `spec §6-1 에 없는 학교급이다`);
for (const lv of LEVELS) {
  const b = BUNDLES[lv];
  if (!b) { R.error(`NM.data.BUNDLES.${lv}`, '없음 (spec §6-1)'); continue; }
  if (!sameSet(b.stages, SPEC_BUNDLES[lv].stages)) R.error(`NM.data.BUNDLES.${lv}.stages`, `spec §6-1 과 다르다: ${JSON.stringify(b.stages)} (기대 ${JSON.stringify(SPEC_BUNDLES[lv].stages)})`);
  if (!sameSet(b.optional || [], SPEC_BUNDLES[lv].optional)) R.error(`NM.data.BUNDLES.${lv}.optional`, `spec §6-1 과 다르다: ${JSON.stringify(b.optional)} (기대 ${JSON.stringify(SPEC_BUNDLES[lv].optional)})`);
}

// ── 2) 그림·소리 목록: 적힌 파일이 있다 ──
const ASSETS = data.ASSETS || {};
(function walk(v, path) {
  if (typeof v === 'string') { if (!fileExists(join(root, v))) R.error(path, `그림·소리 파일 '${v}' 가 없다`); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`);
})(ASSETS, 'NM.data.ASSETS');

// ── 3) 공용 목록: 규칙 카드·도감 ──
const RULE_CARDS = data.RULE_CARDS || {};
for (const [k, c] of Object.entries(RULE_CARDS)) {
  const w = `NM.data.RULE_CARDS['${k}']`;
  if (!RULE_RE.test(k)) R.error(w, `규칙 카드 id 형식이 틀렸다 (rule.<영문 이름>)`);
  if (!c || c.id !== k) R.error(w, `id 필드가 키와 다르다 (${c && c.id})`);
  if (!c || !isStr(c.name) || !isStr(c.text)) R.error(w, 'name·text 가 있어야 한다');
  if (c && c.stage !== undefined && !SPEC_STAGE_IDS.includes(c.stage)) R.error(w, `stage '${c.stage}' 는 장면 id 가 아니다`);
}
for (const [k, g] of Object.entries(data.DOGAM || {})) {
  const w = `NM.data.DOGAM['${k}']`;
  if (!g || !isStr(g.glyph) || !isStr(g.name)) R.error(w, 'glyph·name 이 있어야 한다');
  if (g && g.stage !== undefined && !SPEC_STAGE_IDS.includes(g.stage)) R.error(w, `stage '${g.stage}' 는 장면 id 가 아니다`);
}

// ── 4) 맵 ──
const mapCache = {};
function mapFor(mapKey) {
  const reg = ASSETS.maps && ASSETS.maps[mapKey];
  const rel = reg || `maps/${mapKey}.json`;
  if (mapCache[rel]) return mapCache[rel];
  const abs = join(root, rel);
  const out = { rel, ok: false, objects: [], problems: [] };
  mapCache[rel] = out;
  if (!fileExists(abs)) { out.problems.push(`맵 파일 '${rel}' 가 없다`); return out; }
  let json;
  try { json = readJson(abs); } catch (e) { out.problems.push(`맵 JSON 읽기 실패: ${e.message}`); return out; }
  const parsed = tiled.parse(json);
  parsed.problems.forEach(p => out.problems.push(`Tiled 맵 형식: ${p}`));
  if (parsed.bg && !fileExists(resolve(dirname(abs), parsed.bg.image))) out.problems.push(`bg 그림 '${parsed.bg.image}' 가 없다`);
  if (!parsed.bg) out.problems.push('bg 그림 층이 없다');
  for (const ts of json.tilesets || []) {
    if (ts.image && !fileExists(resolve(dirname(abs), ts.image))) out.problems.push(`타일셋 그림 '${ts.image}' 가 없다`);
  }
  out.objects = [...parsed.spots, ...parsed.npcs];
  out.npcs = parsed.npcs;
  out.ok = true;
  return out;
}
// 맵 JSON 은 장면이 없어도 깨지지 않아야 한다
for (const f of walkFiles(join(root, 'maps'), n => n.endsWith('.json'))) {
  try { readJson(f); } catch (e) { R.error(relTo(root, f), `JSON 읽기 실패: ${e.message}`); }
}

// ── 5) 장면 ──
const SCENES = data.SCENES || {};
const entries = sceneEntries(SCENES);
const byStage = {};
for (const e of entries) {
  if (!e.stage || !SPEC_STAGE_IDS.includes(e.stage)) { R.error(`NM.data.SCENES['${e.key}']`, '키가 장면 id(s0~s12 또는 <장면>.<학교급>)가 아니다'); continue; }
  (byStage[e.stage] = byStage[e.stage] || []).push(e);
}

function checkScene(label, stage, sc, levelOnly, partial) {
  const W = `NM.data.SCENES.${label}`;
  const summary = { read: 0, task: 0, contexts: 0 };
  if (!sc || typeof sc !== 'object') { R.error(W, '장면 데이터가 객체가 아니다'); return summary; }
  if (sc.id !== stage) R.error(W, `id '${sc.id}' 가 장면 키(${stage})와 다르다`);
  for (const f of ['title', 'mapKey', 'intro']) if (sc[f] === undefined || sc[f] === '' || sc[f] === null) R.error(W, `${f} 가 없다 (spec §19-3)`);
  if (stage !== 's0') {
    for (const f of ['request', 'translate']) if (sc[f] === undefined || sc[f] === '' || sc[f] === null) R.error(W, `${f} 가 없다 (spec §19-3, 서장만 뺄 수 있다)`);
    if (!isStr(sc.carveGlyph)) R.error(W, '패 글자(carveGlyph)가 없다 (spec §6-3, 서장 제외 장면마다 하나)');
  } else if (sc.carveGlyph) {
    R.error(W, '서장(s0)에는 패 글자가 없다 (spec §6-3)');
  }
  if (!isStr(sc.era)) R.warn(W, 'era(화면 표시용 시대)가 없다');
  if (!isStr(sc.bgmKey)) R.warn(W, 'bgmKey 가 없다');
  else if (!(ASSETS.bgm && ASSETS.bgm[sc.bgmKey])) R.warn(W, `배경음 '${sc.bgmKey}' 가 그림·소리 목록에 아직 없다 (화면에서는 조용히 건너뜀)`);

  // 맥락
  // partial: 학교급별 판이 따로 있는 바탕 장면 — contexts·items 를 판에만 둘 수 있다
  const contexts = Array.isArray(sc.contexts) ? sc.contexts : ((partial && sc.contexts === undefined) || R.error(W, 'contexts 가 배열이 아니다'), []);
  const ctxById = {};
  contexts.forEach((c, i) => {
    const cw = `${W}.contexts[${i}]`;
    if (!c || typeof c !== 'object') { R.error(cw, '맥락이 객체가 아니다'); return; }
    const m = CTX_RE.exec(c.id || '');
    if (!m) { R.error(cw, `맥락 id '${c.id}' 형식이 틀렸다 (<장면>.c<번호>)`); return; }
    if (m[1] !== stage) R.error(cw, `맥락 ${c.id} 가 다른 장면(${m[1]})의 id 다`);
    if (ctxById[c.id]) R.error(cw, `맥락 id ${c.id} 가 겹친다`);
    ctxById[c.id] = c;
    if (!isStr(c.label)) R.error(cw, `맥락 ${c.id} 에 label 이 없다`);
    if (!(Array.isArray(c.lines) && c.lines.length) && !(Array.isArray(c.orig) && c.orig.length)) R.error(cw, `맥락 ${c.id} 에 lines 도 orig 도 없다`);
    for (const o of Array.isArray(c.orig) ? c.orig : []) if (!BLOCK_RE.test(o)) R.error(cw, `맥락 ${c.id} 의 原文 id '${o}' 형식이 틀렸다`);
    if (c.items !== undefined && !Array.isArray(c.items)) R.error(cw, `맥락 ${c.id} 의 items 는 배열이어야 한다`);
  });
  summary.contexts = contexts.length;

  // 맵
  let map = null;
  if (isStr(sc.mapKey)) {
    map = mapFor(sc.mapKey);
    map.problems.forEach(p => R.error(`${W} 맵 ${map.rel}`, p));
  }
  const onMap = new Set();
  if (map && map.ok) {
    const seenCtx = {}, seenNpc = {};
    for (const o of map.objects) {
      const ow = `${map.rel} ${o.kind === 'npc' ? 'npcs' : 'spots'} 객체 (${o.npcId || o.contextId})`;
      if (o.kind === 'npc') {
        if (seenNpc[o.npcId]) R.error(ow, `npcId ${o.npcId} 가 겹친다`);
        seenNpc[o.npcId] = true;
      }
      if (!o.contextId) continue;
      if (seenCtx[o.contextId]) R.error(ow, `contextId ${o.contextId} 를 두 객체가 쓴다 (맥락 하나 = 조사 지점 하나)`);
      seenCtx[o.contextId] = true;
      if (!ctxById[o.contextId]) R.error(ow, `contextId ${o.contextId} 가 장면 ${label} 의 맥락에 없다`);
      onMap.add(o.contextId);
    }
    for (const id of Object.keys(ctxById)) if (!onMap.has(id)) R.warn(`${W} 맥락 ${id}`, `맵 ${map.rel} 에 이 맥락의 조사 지점·인물이 없다(살필 수 없음)`);
  }

  // 항목
  const items = Array.isArray(sc.items) ? sc.items : ((partial && sc.items === undefined) || R.error(W, 'items 가 배열이 아니다'), []);
  const itemById = {};
  const cardIds = {};
  items.forEach((it, i) => {
    const iw = `${W}.items[${i}]`;
    if (!it || typeof it !== 'object') { R.error(iw, '항목이 객체가 아니다'); return; }
    const m = ITEM_RE.exec(it.id || '');
    if (!m) { R.error(iw, `항목 id '${it.id}' 형식이 틀렸다 (<장면>.<r|t><번호>)`); return; }
    const w = `${W} 항목 ${it.id}`;
    if (m[1] !== stage) R.error(w, `다른 장면(${m[1]})의 항목 id 다`);
    if (itemById[it.id]) R.error(w, `항목 id ${it.id} 가 겹친다`);
    itemById[it.id] = it;
    const want = m[2] === 'r' ? 'read' : 'task';
    if (it.kind !== want) R.error(w, `kind '${it.kind}' 가 id(${m[2]} → ${want})와 맞지 않다`);
    if (!Array.isArray(it.levels) || !it.levels.length || it.levels.some(l => !LEVELS.includes(l))) R.error(w, `levels 는 m·h1·h23 중에서 고른 목록이어야 한다 (${JSON.stringify(it.levels)})`);
    if (!isStr(it.explain)) R.error(w, 'explain(정답 풀이)이 없다');
    if (!Array.isArray(it.hints) || !isStr(it.hints[0]) || it.hints[1] === undefined || it.hints[1] === null || it.hints[1] === '') R.error(w, 'hints 는 [1단계 힌트, 2단계 대상] 이어야 한다');
    if (want === 'read') {
      summary.read++;
      const cards = Array.isArray(it.cards) ? it.cards : [];
      if (cards.length < 3 || cards.length > 4) R.error(w, `선택 카드는 3~4장이어야 한다 (지금 ${cards.length}장)`);
      const correct = cards.filter(c => c && c.correct === true);
      if (correct.length !== 1) R.error(w, `정답 카드(correct: true)는 정확히 1장이어야 한다 (지금 ${correct.length}장)`);
      cards.forEach((c, ci) => {
        const cw = `${w} 카드[${ci}]`;
        if (!c || typeof c !== 'object') { R.error(cw, '카드가 객체가 아니다'); return; }
        const cm = CARD_RE.exec(c.id || '');
        if (!cm || cm[1] !== it.id) R.error(cw, `카드 id '${c.id}' 형식이 틀렸다 (${it.id}.<a|b|c|d>)`);
        else if (cardIds[c.id]) R.error(cw, `카드 id ${c.id} 가 겹친다`);
        cardIds[c.id] = true;
        if (!isStr(c.text)) R.error(cw, `카드 ${c.id} 에 text 가 없다`);
        if (typeof c.correct !== 'boolean') R.error(cw, `카드 ${c.id} 의 correct 는 true/false 여야 한다`);
        if (c.correct === false && !isStr(c.why)) R.error(cw, `오답 카드 ${c.id} 에 why('왜 아닌지')가 없다`);
      });
      const wrong = cards.filter(c => c && c.correct === false).map(c => c.id);
      const mis = it.misread && typeof it.misread === 'object' ? it.misread : {};
      for (const k of Object.keys(mis)) if (!wrong.includes(k)) R.error(w, `misread 의 '${k}' 는 이 항목의 오답 카드가 아니다`);
      for (const k of wrong) if (!(k in mis)) R.warn(w, `오답 카드 ${k} 의 오해 장면(misread)이 없다`);
      if (Array.isArray(it.hints) && it.hints[1] !== undefined && !ctxById[it.hints[1]]) R.error(w, `hints[1] '${it.hints[1]}' 는 이 장면의 맥락 id 여야 한다(2단계에 빛낼 곳)`);
      if (it.ruleCard !== undefined) {
        if (!RULE_RE.test(it.ruleCard)) R.error(w, `ruleCard '${it.ruleCard}' 형식이 틀렸다 (rule.<영문 이름>)`);
        else if (!RULE_CARDS[it.ruleCard]) R.error(w, `규칙 카드 ${it.ruleCard} 가 NM.data.RULE_CARDS 에 없다`);
      }
    } else {
      summary.task++;
      if (!isStr(it.gimmick)) R.error(w, '기믹 과제에 gimmick 이 없다');
      if (it.answer === undefined || it.answer === null) R.error(w, '기믹 과제에 answer 가 없다');
    }
  });

  // 맥락 → 항목 참조
  for (const c of Object.values(ctxById)) {
    for (const id of Array.isArray(c.items) ? c.items : []) {
      if (!itemById[id]) R.error(`${W} 맥락 ${c.id}`, `items 의 '${id}' 가 이 장면의 항목이 아니다`);
      else if (itemById[id].kind !== 'read') R.error(`${W} 맥락 ${c.id}`, `items 의 '${id}' 는 해독 항목(read)이 아니다 — 맥락은 해독 항목만 '만남'으로 만든다`);
    }
  }

  // 해독 항목마다 서로 다른 맥락 2곳 이상 (맵에 실제로 있는 것만 센다)
  for (const it of Object.values(itemById)) {
    if (it.kind !== 'read') continue;
    const listed = Object.values(ctxById).filter(c => Array.isArray(c.items) && c.items.includes(it.id)).map(c => c.id);
    const placed = listed.filter(id => onMap.has(id));
    if (placed.length < 2) {
      const missing = listed.filter(id => !onMap.has(id));
      R.error(`${W} 항목 ${it.id}`, `맵 안의 서로 다른 맥락이 ${placed.length}곳뿐이다 (2곳 이상 필요; 맵에 있는 맥락: ${JSON.stringify(placed)}${missing.length ? `, 맵에 없는 맥락: ${JSON.stringify(missing)}` : ''})`);
    }
  }

  // 그림 키
  (function walk(v, p) {
    if (!v || typeof v !== 'object') return;
    for (const k of Object.keys(v)) {
      if (ASSET_KEY_FIELDS[k] && typeof v[k] === 'string') {
        const cat = ASSET_KEY_FIELDS[k];
        if (!(ASSETS[cat] && ASSETS[cat][v[k]])) R.error(`${p}.${k}`, `그림 키 '${v[k]}' 가 NM.data.ASSETS.${cat} 에 없다`);
      } else walk(v[k], `${p}.${k}`);
    }
  })(sc, W);

  // 알아 두기 등 사실 카드는 출처, 虛 카드는 '실제로는'
  asList(sc.notes).forEach((n, i) => { if (n && typeof n === 'object' && !isStr(n.src)) R.error(`${W}.notes[${i}]`, '사실 카드(알아 두기·이본 노트·해석)에 src(출처)가 없다 (spec §19-3)'); });
  asList(sc.fiction).forEach((n, i) => { if (n && typeof n === 'object' && !isStr(n.real)) R.error(`${W}.fiction[${i}]`, "게임 설정 · 虛 카드에 real('실제로는 →')이 없다 (spec §12)"); });

  return summary;
}

const stageInfo = {};
for (const stage of SPEC_STAGE_IDS) {
  const list = byStage[stage] || [];
  const info = { present: list.length > 0, read: 0, task: 0, contexts: 0, levels: new Set(), labels: [] };
  for (const e of list) {
    const vars = sceneVariants(e.key, e.scene);
    for (const v of vars) {
      const s = checkScene(v.label, stage, v.scene, e.level || v.level, vars.length > 1 && v.level === null);
      info.read += s.read; info.task += s.task; info.contexts += s.contexts;
      // 학교급별 판·파일은 그 학교급만, 바탕 장면은 항목의 levels 를 따른다
      const items = Array.isArray(v.scene && v.scene.items) ? v.scene.items : [];
      const lvOnly = e.level || v.level;
      for (const it of items) for (const l of Array.isArray(it && it.levels) ? it.levels : []) if (!lvOnly || l === lvOnly) info.levels.add(l);
      info.labels.push(v.label);
    }
  }
  stageInfo[stage] = info;
}

// STAGES 등록과 장면 데이터가 맞는가
for (const [k, st] of Object.entries(data.STAGES || {})) {
  const w = `NM.data.STAGES.${k}`;
  if (!SPEC_STAGE_IDS.includes(k)) { R.error(w, '장면 id 가 아니다'); continue; }
  if (!st || st.id !== k) R.error(w, `id 필드가 키와 다르다 (${st && st.id})`);
  if (st && st.file && !fileExists(join(root, st.file))) R.error(w, `장면 데이터 파일 '${st.file}' 가 없다`);
  const sc = SCENES[k];
  if (st && sc) {
    if (st.mapKey !== undefined && st.mapKey !== sc.mapKey) R.error(w, `mapKey '${st.mapKey}' 가 장면 데이터('${sc.mapKey}')와 다르다`);
    if (st.carveGlyph !== undefined && st.carveGlyph !== sc.carveGlyph) R.error(w, `carveGlyph '${st.carveGlyph}' 가 장면 데이터('${sc.carveGlyph}')와 다르다`);
    if (st.gimmick && !(sc.items || []).some(it => it && it.gimmick === st.gimmick)) R.error(w, `gimmick '${st.gimmick}' 를 쓰는 기믹 과제가 장면 데이터에 없다`);
  }
}

// 장면 데이터 파일 자리(spec 고정 경로: js/data/scenes/<장면>.js) — 경고만
for (const [k, f] of Object.entries(origin.SCENES)) {
  const stage = k.split(/[.:_-]/)[0];
  const okPath = f === `js/data/scenes/${stage}.js` || LEVELS.some(l => [`.${l}`, `-${l}`, `_${l}`].some(sep => f === `js/data/scenes/${stage}${sep}.js`));
  if (!okPath) R.warn(`NM.data.SCENES.${k}`, `장면 데이터는 js/data/scenes/${stage}.js 에 둔다 (지금 ${f})`);
}
// index.html 등록: js/data 의 파일이 모두 <script> 로 등록됐는가 — 등록은 물결 끝 연결 단계가 하므로 경고만
if (existsSync(join(root, 'index.html'))) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  for (const f of ['js/data/jamo.js', ...dataFiles(root)]) {
    if (!html.includes(`src="${f}"`)) R.warn(f, 'index.html 의 scripts 구역에 아직 등록되지 않았다(연결 단계에서 data 묶음에 덧붙인다)');
  }
}

// ── 6) 장면 목록 기준 보고 + 묶음 장면의 학교급별 핵심 항목 ──
const inBundles = (s) => LEVELS.filter(l => SPEC_BUNDLES[l].stages.includes(s));
const inOptional = (s) => LEVELS.filter(l => SPEC_BUNDLES[l].optional.includes(s));
const missing = [];
R.info('장면 목록 (spec §19-1 / §6-1 묶음 기준):');
for (const s of SPEC_STAGE_IDS) {
  const info = stageInfo[s];
  const b = inBundles(s);
  const opt = inOptional(s).map(l => `${l} 추천 선택`);
  const tag = b.length || opt.length ? [b.length ? `묶음 ${b.join('·')}` : '', ...opt].filter(Boolean).join(', ') : (s === 's0' ? '서장(묶음 밖)' : '묶음 밖');
  if (!info.present) { missing.push(s); R.info(`  ${s.padEnd(3)} 없음  (${tag})`); continue; }
  R.info(`  ${s.padEnd(3)} 있음  해독 ${info.read} · 기믹 ${info.task} · 맥락 ${info.contexts} · 학교급 ${[...info.levels].join('/') || '-'}  (${tag})`);
  for (const l of b) {
    if (!info.levels.has(l)) R.error(`NM.data.SCENES.${s}`, `학교급 ${l} 추천 묶음 장면인데 ${l} 핵심 항목이 하나도 없다 (spec §6-1·§7)`);
  }
}
if (missing.length) {
  const line = `장면 데이터 없음 ${missing.length}/13: ${missing.join(', ')}`;
  if (requireAllScenes) R.error('NM.data.SCENES', `${line} (--require-all-scenes)`);
  else R.info(`${line} — 아직 실패로 치지 않는다(다 채운 뒤 --require-all-scenes 로 켠다)`);
}

R.finish(`장면 ${13 - missing.length}/13 있음`);

