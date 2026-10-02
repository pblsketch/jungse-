// 출처 글(NM.ui.marker.srcLabel): 데이터 출처 칸의 검증 메모(리서치 절·오해 id·블록 id·파일 경로)는
// 학생 화면에 나오지 않고, 교과서 쪽·문헌 이름은 남고, 주소는 사이트 이름으로 바뀐다.
// 실제 데이터(원문 블록·장면 카드)의 출처 칸 전부에 대해서도 확인한다.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load, ROOT } from '../lib/load.mjs';

const ctx = load(['js/core/ns.js', 'js/data/text-stage.js', 'js/ui/stage-text.js', 'js/ui/marker.js']);
const L = ctx.NM.ui.marker.srcLabel;

assert.equal(L('지학사 공통국어2 132쪽(PDF 글자 층) — `source_cache/tb_gongtong2_p132_seomun.txt`'), '', '교과서 출판사·쪽은 화면에 적지 않는다');
assert.equal(L('https://ko.wikisource.org/wiki/%EC%9A%A9%EB%B9%84%EC%96%B4%EC%B2%9C%EA%B0%80'), '위키문헌 「용비어천가」');
assert.equal(L('https://ko.wikisource.org/wiki/소학언해/권2'), '위키문헌 「소학언해 · 권2」');
assert.equal(L('http://db.sejongkorea.org/front/detail.do?bkCode=P14_WS_v001&recordId=P14_WS_e01_v001_0170'), '세종대왕기념사업회 한글고전 DB');
assert.equal(L('리서치 10 §8'), '');
assert.equal(L('wrong.araeaIsA'), '');
assert.equal(L('리서치 10 §10 10번, 12번'), '');
assert.equal(L('화법과 언어 210쪽 (rule.nominalGi, 리서치 11 §4-3)'), '');
assert.equal(L('리서치 10 §7 ⑥ (화법과 언어 205쪽, 『석보상절』 권6 11ㄱ 원본 영인)'), '『석보상절』 권6 11ㄱ 원본 영인');
assert.equal(L('『훈민정음』 해례 제자해 O-s3-YEONSEO (리서치 09 §4-5), 중학 국어 2-2 지도서 보충 (리서치 06 §4)'), '『훈민정음』 해례 제자해');
assert.equal(L('공통국어2 138쪽 · 우리말샘 역사 정보(사흘) · 리서치 11 §5'), '우리말샘 역사 정보(사흘)');
assert.equal(L('시험 출처'), '시험 출처');
assert.equal(L(''), '');
assert.equal(L(null), '');

// 실제 데이터 전부: 화면에 보일 출처 글에 검증 메모·날 주소가 남지 않는다
const files = ['js/data/orig.generated.js'].concat(readdirSync(join(ROOT, 'js/data/scenes')).filter(f => f.endsWith('.js')).map(f => 'js/data/scenes/' + f));
const BAD = /지학사|공통국어|중학 국어|화법과 언어|지도서|리서치|source_cache|\.txt\b|https?:|%[0-9A-F]{2}|\bO-s\d|\b(rule|wrong)\.[A-Za-z]|spec\s*§|PDF 글자 층|`/;
let n = 0;
for (const f of files) {
  const text = readFileSync(join(ROOT, f), 'utf8');
  for (const m of text.matchAll(/["']?src["']?:\s*(["'])((?:\\.|(?!\1).)*)\1/g)) {
    const raw = m[2].replace(/\\(['"\\])/g, '$1');
    const out = L(raw);
    n++;
    assert.ok(!BAD.test(out), `${f}: 출처 글에 검증 메모가 남음 — ${JSON.stringify(out)} ← ${raw}`);
  }
}
assert.ok(n > 100, 'src 칸을 충분히 찾지 못함: ' + n);
console.log(`src label ok (${n} data sources)`);
