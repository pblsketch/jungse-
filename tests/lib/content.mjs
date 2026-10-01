// 내용 점검(c3-*) 공용 장치: 데이터 뿌리 고르기, 데이터 불러오기, 문자열 훑기, 보고.
//
// 데이터 뿌리(--root <폴더>, 기본은 저장소 뿌리)에서 읽는 것:
//   js/data/**/*.js (jamo.js 제외), maps/*.json, design/research/*.md, 그림·소리 파일, 화면 코드(js/core·engine·ui·gimmicks, js/main.js)
// 늘 저장소 뿌리에서 읽는 것(점검 도구 쪽 코드):
//   js/core/ns.js, js/data/jamo.js, js/core/yet.js, js/engine/tiled.js, assets/fonts/*
// 그래서 tests/fixtures/c3/<세트>/ 처럼 데이터만 담은 작은 뿌리로 점검마다 일부러 틀린 예시를 돌려 볼 수 있다.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import vm from 'node:vm';
import { load, ROOT } from './load.mjs';

export { ROOT };

export const STAGE_RE = /^s(?:[0-9]|1[0-2])$/;
export const LEVELS = ['m', 'h1', 'h23'];
// 날 첫가끝 자모(조합용 자모) — 자동 생성 파일만 담을 수 있다
export const CONJOINING_RE = /[\u1100-\u11FF\uA960-\uA97F\uD7B0-\uD7FF]/u;
// 한글 글자 전부(완성형·호환 자모·첫가끝 자모)
export const HANGUL_RE = /[\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uAC00-\uD7A3\uD7B0-\uD7FF]/u;

export function parseArgs(argv = process.argv.slice(2)) {
  const ri = argv.indexOf('--root');
  const root = ri >= 0 ? resolve(argv[ri + 1]) : ROOT;
  return {
    root,
    isRepo: root === ROOT,
    requireAllScenes: argv.includes('--require-all-scenes') || process.env.NM_REQUIRE_ALL_SCENES === '1'
  };
}

export const relTo = (root, p) => relative(root, p).split(sep).join('/');

export function walkFiles(dir, test) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p, test));
    else if (test(n, p)) out.push(p);
  }
  return out;
}

// js/data 파일 목록: 맨 위 파일 먼저(이름 순), 그다음 하위 폴더(scenes/ 등). jamo.js 는 늘 저장소 것을 쓴다.
export function dataFiles(root, { generated = true } = {}) {
  const dir = join(root, 'js', 'data');
  const all = walkFiles(dir, n => n.endsWith('.js')).map(p => relTo(root, p));
  const keep = all.filter(p => p !== 'js/data/jamo.js' && (generated || !isGenerated(p)));
  const top = keep.filter(p => p.split('/').length === 3);
  const sub = keep.filter(p => p.split('/').length > 3);
  return [...top, ...sub];
}
export const isGenerated = (rel) => /\.generated\.js$/.test(rel);

// 데이터 불러오기 → { ctx, NM, data, loadErrors: [{file, message}], files }
export function loadData(root, { generated = true } = {}) {
  const ctx = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js', 'js/engine/tiled.js']);
  const NM = ctx.NM;
  NM.data.SCENES = NM.data.SCENES || {};
  NM.data.TEXT = NM.data.TEXT || {};
  const files = dataFiles(root, { generated });
  const loadErrors = [];
  // NM.data 키·장면 키(SCENES)·문구 묶음(TEXT) → 처음 만든 파일
  const origin = { data: {}, SCENES: {}, TEXT: {} };
  const mark = (f) => {
    for (const k of Object.keys(NM.data)) if (!origin.data[k] && k !== 'SCENES' && k !== 'TEXT') origin.data[k] = f;
    for (const g of ['SCENES', 'TEXT']) for (const k of Object.keys(NM.data[g] || {})) if (!origin[g][k]) origin[g][k] = f;
  };
  mark('(core)');
  for (const f of files) {
    try {
      vm.runInContext(readFileSync(join(root, f), 'utf8'), ctx, { filename: f });
    } catch (e) {
      loadErrors.push({ file: f, message: e && e.message || String(e) });
    }
    mark(f);
  }
  // 'NM.data.SCENES.s4…' 같은 경로 → '<파일> › NM.data.SCENES.s4…' (파일을 알 때)
  const where = (path) => {
    let m = /^NM\.data\.(SCENES|TEXT)\.([^.[\s]+)/.exec(path);
    let f = m && origin[m[1]][m[2]];
    if (!f) { m = /^NM\.data\.([^.[\s]+)/.exec(path); f = m && origin.data[m[1]]; }
    return f && f !== '(core)' ? `${f} › ${path}` : path;
  };
  return { ctx, NM, data: NM.data, loadErrors, files, origin, where };
}

// 값 안의 모든 문자열: fn(str, path)
export function walkStrings(v, path, fn, { skip = () => false } = {}, seen = new Set()) {
  if (typeof v === 'string') { fn(v, path); return; }
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  for (const k of Object.keys(v)) {
    const p = Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`;
    if (skip(p, k)) continue;
    walkStrings(v[k], p, fn, { skip }, seen);
  }
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

// 보고: 실패는 어디서·왜를 한 줄씩. 실패가 하나라도 있으면 종료 코드 1.
export function reporter(name) {
  const errors = [], warns = [], infos = [];
  let at = (w) => w;
  return {
    setWhere(fn) { at = fn; }, // 'NM.data.…' 경로 앞에 그것을 만든 파일 이름을 붙인다(loadData().where)
    error: (where, why) => errors.push(`${at(where)} — ${why}`),
    warn: (where, why) => warns.push(`${at(where)} — ${why}`),
    info: (line) => infos.push(line),
    get errorCount() { return errors.length; },
    finish(okLine) {
      for (const l of infos) console.log('  ' + l);
      for (const w of warns) console.log('  경고 ' + w);
      for (const e of errors) console.log('  FAIL ' + e);
      if (errors.length) {
        console.log(`${name}: 실패 ${errors.length}건`);
        process.exit(1);
      }
      console.log(`${name} ok${okLine ? ': ' + okLine : ''}`);
      process.exit(0);
    }
  };
}

// 장면 목록: SCENES 의 키 → { stage, level|null, scene }
// 키는 '<장면>' 또는 '<장면>.<학교급>'(학교급별 파일을 따로 둔 경우). 장면 안의 학교급별 판(variants/byLevel/<학교급> 키)은 sceneVariants 로 편다.
export function sceneEntries(SCENES) {
  const out = [];
  for (const key of Object.keys(SCENES || {})) {
    const m = /^(s\d+)(?:[.:_-](m|h1|h23))?$/.exec(key);
    out.push({ key, stage: m ? m[1] : null, level: m ? (m[2] || null) : null, scene: SCENES[key] });
  }
  return out;
}

// 장면 하나 → 점검할 판 목록 [{label, level, scene}] — 학교급별 판은 바탕 장면 위에 덮어쓴(얕은 병합) 모습으로 본다.
export function sceneVariants(key, scene) {
  const out = [{ label: key, level: null, scene }];
  if (!scene || typeof scene !== 'object') return out;
  const holders = [scene.variants, scene.byLevel, scene];
  const done = new Set();
  for (const h of holders) {
    if (!h || typeof h !== 'object') continue;
    for (const lv of LEVELS) {
      const v = h[lv];
      if (done.has(lv) || !v || typeof v !== 'object' || Array.isArray(v)) continue;
      if (!('items' in v) && !('contexts' in v)) continue;
      done.add(lv);
      const merged = Object.assign({}, scene, v);
      delete merged.variants; delete merged.byLevel;
      for (const l2 of LEVELS) delete merged[l2];
      out.push({ label: `${key}[${lv}]`, level: lv, scene: merged });
    }
  }
  return out;
}

export const asList = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
