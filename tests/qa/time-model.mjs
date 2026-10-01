// 시간 모형(학생 한 명이 혼자 화면을 읽고 조작할 때). 값은 어림값이며, 보고서(design/qa/playtest-*.md)에 그대로 적는다.
// 사건(events)은 tests/qa/playtest.mjs 가 실제 화면에서 모은 것: read(보통 글자 수 plain, 原文 글자 수 orig), click, walk(px),
// choice(카드 고르기), ops(기믹 조작 수), fix(기믹 틀린 곳 고치기), cg(웹툰 그림), end(돌아보기).
// tag 가 'wrong:<항목>' 인 사건은 그 항목에서 일부러 틀렸을 때만 생기는 것(오해 장면·왜 아닌지·힌트·다시 고르기).

export const MODEL = {
  // '보통 독자': 대사·물음·카드(본글)를 중학생 300, 고등학생 350 자/분으로 읽고, 곁글(알아 두기·이본·해석·虛 카드, 풀이, 붙은 규칙 카드,
  // 原文 카드 제목줄)은 절반만 읽는다(훑어봄). '느린 독자': 250 / 300 자/분, 곁글도 다 읽음.
  readPlain: { m: 300, h1: 350, h23: 350 },
  sideWeight: 0.5,
  slow: { readPlain: { m: 250, h1: 300, h23: 300 }, sideWeight: 1 },
  readOrig: 100,                             // 자/분 — 原文의 한글(옛한글)은 글자를 맞대어 보며 읽어 훨씬 느리다
  readHanja: 300,                            // 자/분 — 原文의 한자는 풀어 읽지 않고 훑어본다(아는 글자·자모만 찾음)
  clickSec: 1,                               // '다음'·확정·제출 단추 한 번
  cgSec: 3,                                  // 웹툰 그림 한 장 보기
  walkSpeed: 170,                            // 월드 px/초 = NM.engine.config.speed
  walkFixedSec: 2,                           // 목적지를 찾아 누르기·방향 잡기(곳마다)
  openItemSec: 2,                            // 진행표에서 항목 창 열기
  choiceSec: 8,                              // 카드 고르기 판단(카드 글 읽기는 read 로 따로 셈)
  retrySec: 5,                               // 오답 뒤 다시 고르기 판단
  opSec: 5,                                  // 기믹 조작 하나(고르기·끌어 놓기·획 긋기 + 생각)
  stepSec: 5,                                // 기믹 단계 넘어가기
  fixSec: 15,                                // 기믹에서 틀린 곳 표시를 보고 고치기
  reflectSec: 30,                            // 돌아보기 한 줄(써도 되고 건너뛰어도 됨 — 쓴다고 봄)
  pWrong: { read: 0.35, task: 0.5 }          // '보통 학생': 해독 항목 35%, 기믹 과제 50%에서 한 번 틀린다고 봄
};

const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null;
// 글자 수: 글자·숫자인 자소 묶음(옛한글 한 음절 = 한 글자, 한자 한 자 = 한 글자). 띄어쓰기·문장 부호·방점은 세지 않는다.
export function countHan(s) { return (String(s || '').match(/\p{Script=Han}/gu) || []).length; }
export function countChars(s) {
  if (!s) return 0;
  const str = String(s).replace(/[〮〯]/g, '');
  if (!SEG) return (str.match(/[\p{L}\p{N}]/gu) || []).length;
  let n = 0;
  for (const g of SEG.segment(str)) if (/[\p{L}\p{N}]/u.test(g.segment)) n++;
  return n;
}

function readSec(e, level, R) {
  return ((e.plain || 0) + (e.side || 0) * R.sideWeight) / R.readPlain[level] * 60 + (e.orig || 0) / MODEL.readOrig * 60 + (e.origHan || 0) / MODEL.readHanja * 60;
}
function secOf(e, level, R) {
  const M = MODEL;
  switch (e.type) {
    case 'read': return readSec(e, level, R);
    case 'click': return e.what === 'open-item' ? M.openItemSec : M.clickSec;
    case 'cg': return M.cgSec;
    case 'walk': return (e.px || 0) / M.walkSpeed + M.walkFixedSec;
    case 'choice': return e.retry ? M.retrySec : M.choiceSec;
    case 'ops': return (e.ops || 0) * M.opSec + Math.max(0, (e.steps || 1) - 1) * M.stepSec;
    case 'fix': return M.fixSec;
    case 'end': return M.reflectSec;
    default: return 0;
  }
}

function bucket(e) {
  if (e.type === 'read') return null; // 아래에서 plain/orig 로 나눔
  if (e.type === 'walk') return 'walk';
  if (e.type === 'ops' || e.type === 'fix') return 'gimmick';
  if (e.type === 'choice') return 'cards';
  return 'clicks';
}

export function estimate(events, level) {
  const M = MODEL;
  const NORMAL = { readPlain: M.readPlain, sideWeight: M.sideWeight };
  let R = NORMAL;
  const itemKind = {};
  events.forEach(e => { if (e.type === 'ops') itemKind[e.item] = 'task'; });
  const scen = (weightOf) => {
    const parts = { readPlain: 0, readSide: 0, readOrig: 0, walk: 0, cards: 0, gimmick: 0, clicks: 0 };
    const chars = { plain: 0, side: 0, orig: 0, origHan: 0 };
    const byPhase = {};
    let sec = 0;
    for (const e of events) {
      const w = weightOf(e);
      if (!w) continue;
      const s = secOf(e, level, R) * w;
      sec += s;
      byPhase[e.phase] = (byPhase[e.phase] || 0) + s;
      if (e.type === 'read') {
        parts.readPlain += (e.plain || 0) / R.readPlain[level] * 60 * w;
        parts.readSide += (e.side || 0) * R.sideWeight / R.readPlain[level] * 60 * w;
        parts.readOrig += ((e.orig || 0) / M.readOrig + (e.origHan || 0) / M.readHanja) * 60 * w;
        chars.plain += (e.plain || 0) * w; chars.side += (e.side || 0) * w; chars.orig += (e.orig || 0) * w; chars.origHan += (e.origHan || 0) * w;
      } else parts[bucket(e)] += s;
    }
    Object.keys(parts).forEach(k => { parts[k] = Math.round(parts[k]); });
    Object.keys(byPhase).forEach(k => { byPhase[k] = Math.round(byPhase[k] / 6) / 10; });
    Object.keys(chars).forEach(k => { chars[k] = Math.round(chars[k]); });
    return { min: sec / 60, parts, chars, byPhase };
  };
  const wrongItem = (e) => (e.tag && e.tag.startsWith('wrong:')) ? e.tag.slice(6) : null;
  const typ = (e) => { const id = wrongItem(e); if (!id) return 1; return itemKind[id] === 'task' ? M.pWrong.task : M.pWrong.read; };
  const out = {
    best: scen(e => wrongItem(e) ? 0 : 1),
    typical: scen(typ),
    allWrong: scen(() => 1)
  };
  R = M.slow;
  out.slowTypical = scen(typ);
  // 앞 장면 규칙 안내(needs): 묶음을 차례대로 해서 그 규칙 카드를 이미 가졌으면 나오지 않는 시간(초, 보통 독자)
  R = NORMAL;
  out.needsSec = Math.round(events.filter(e => e.type === 'read' && e.win === 'needs').reduce((n, e) => n + readSec(e, level, R), 0)
    + events.filter(e => e.type === 'click' && e.what === 'next' && e.needs).length * M.clickSec);
  return out;
}
