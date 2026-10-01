// C3 ② 옛한글 점검 (spec §18-1-2, §13)
// - 데이터의 모든 문자열(자동 생성 原文 포함)과 맵의 문자열 속성이 NM.core.yet 로 조합된다(실패 0).
// - 자동 생성 파일이 아닌 데이터(js/data/**/*.js, maps/*.json)에는 날 첫가끝 자모(U+1100–11FF, A960–A97F, D7B0–D7FF)가 없다.
//   문자열 리터럴의 실제 값으로 본다('\u1100' 처럼 숨겨 적어도 잡힌다). 주석은 보지 않는다.
// - '넣은 글꼴에 데이터에 쓰인 모든 글자가 있다'는 tests/checks/font-coverage.mjs(C1)가 맡는다(같은 --root 를 받는다).
// 사용: node tests/checks/c3-yet.mjs [--root <데이터 뿌리>]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, loadData, walkStrings, reporter, isGenerated, isMetaPath, walkFiles, relTo, readJson, CONJOINING_RE, dataFiles } from '../lib/content.mjs';
import { jsStrings } from '../lib/jsscan.mjs';

// 날 첫가끝 자모를 담아도 되는 손 데이터 파일 (작게 유지, 까닭 필수)
const RAW_JAMO_ALLOW = {
  'js/data/jamo.js': '자모 표 자체 — yet.js 가 대괄호 표기를 첫가끝 자모로 바꿀 때 쓰는 대응표(값은 \\u 이스케이프)'
};

const R = reporter('c3-yet');
const { root } = parseArgs();
const { NM, data, loadErrors, where } = loadData(root);
R.setWhere(where);
loadErrors.forEach(e => R.error(e.file, `불러오기 실패: ${e.message}`));
const yet = NM.core.yet;

// 1) 조합
let nStr = 0;
const tryRender = (s, where) => {
  nStr++;
  try { yet.render(s, { bangjeom: true, ruby: 'paren' }); }
  catch (e) { R.error(where, e.message); }
};
walkStrings(data, 'NM.data', tryRender, { skip: (p) => p === 'NM.data.JAMO' || isMetaPath(p) });

const mapFiles = walkFiles(join(root, 'maps'), n => n.endsWith('.json'));
for (const f of mapFiles) {
  const rel = relTo(root, f);
  let json;
  try { json = readJson(f); } catch (e) { R.error(rel, `JSON 읽기 실패: ${e.message}`); continue; }
  (function walkLayers(layers, lp) {
    (layers || []).forEach((l, li) => {
      if (l.type === 'group') return walkLayers(l.layers, `${lp}${l.name || li}/`);
      (l.objects || []).forEach(o => {
        const props = Array.isArray(o.properties) ? o.properties : Object.entries(o.properties || {}).map(([name, value]) => ({ name, value }));
        const where = `${rel} 층 ${lp}${l.name} 객체 ${o.id}`;
        if (typeof o.name === 'string' && o.name) tryRender(o.name, `${where} name`);
        // 화면에 나오는 것은 label(없으면 name)뿐 — contextId·sprite 같은 키는 표기가 아니다
        props.forEach(p => { if (p.name === 'label' && typeof p.value === 'string') tryRender(p.value, `${where} label`); });
      });
    });
  })(json.layers, '');
}

// 2) 날 첫가끝 자모 (손 데이터)
let nFiles = 0;
for (const rel of dataFiles(root)) {
  if (isGenerated(rel) || RAW_JAMO_ALLOW[rel]) continue;
  nFiles++;
  for (const s of jsStrings(readFileSync(join(root, rel), 'utf8'))) {
    const m = CONJOINING_RE.exec(s.value);
    if (m) R.error(`${rel}:${s.line}`, `날 첫가끝 자모 U+${m[0].codePointAt(0).toString(16).toUpperCase()} — 손 데이터는 대괄호 호환 자모 표기([ㅁㆍㄹ])로 적는다`);
  }
}
for (const f of mapFiles) {
  const rel = relTo(root, f);
  let json;
  try { json = readJson(f); } catch { continue; }
  nFiles++;
  walkStrings(json, rel, (s, path) => {
    const m = CONJOINING_RE.exec(s);
    if (m) R.error(path, `날 첫가끝 자모 U+${m[0].codePointAt(0).toString(16).toUpperCase()} — 맵 문자열도 대괄호 표기로 적는다`);
  });
}

R.finish(`조합 ${nStr}개 문자열, 날 자모 검사 ${nFiles}개 파일`);
