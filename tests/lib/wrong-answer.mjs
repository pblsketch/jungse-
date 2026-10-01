// 기믹 과제의 '일부러 틀린 답' 만들기(브라우저 쪽에서 돈다 — page.evaluate 에 함수째 넘긴다).
// 정답(item.answer)을 조금씩 바꾼 후보들을 만들어, 기믹 판정(check)으로 '틀림 + 틀린 부분이 비어 있지 않음'인
// 첫 후보를 고른다. 틀린 부분이 있어야 기믹이 showWrong 에서 표시를 그린다.
// 사용: const w = await page.evaluate(pickWrongAnswer, { stageId, itemId });
//   → { ok, answer, wrong, tried } (ok:false 면 reason)

export function pickWrongAnswer({ stageId, itemId, level: lv }) {
  const NM = window.NM;
  const level = lv || (NM.ui.app && NM.ui.app.store ? NM.ui.app.store().level : 'm');
  const sc = NM.ui.stageLogic.resolveScene(NM.data.SCENES[stageId], level);
  const item = (sc.items || []).filter(i => i.id === itemId)[0];
  if (!item) return { ok: false, reason: 'no item ' + itemId };
  const def = NM.gimmicks.get(item.gimmick);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const ans = item.answer;
  const strings = [];
  (function collect(x) {
    if (Array.isArray(x)) x.forEach(collect);
    else if (x && typeof x === 'object') Object.keys(x).forEach(k => collect(x[k]));
    else if (typeof x === 'string' && strings.indexOf(x) < 0) strings.push(x);
  })(ans);
  const getAt = (root, path) => path.reduce((o, k) => (o == null ? o : o[k]), root);
  const setAt = (root, path, v) => {
    if (!path.length) return v;
    const parent = getAt(root, path.slice(0, -1));
    parent[path[path.length - 1]] = v;
    return root;
  };
  const cands = [];
  const push = (path, v) => cands.push(setAt(clone(ans), path, v));
  (function walk(x, path) {
    if (Array.isArray(x)) {
      if (x.length >= 2) {
        const sw = x.slice(); const t = sw[0]; sw[0] = sw[1]; sw[1] = t;
        if (JSON.stringify(sw) !== JSON.stringify(x)) push(path, sw);
        const rv = x.slice().reverse();
        if (JSON.stringify(rv) !== JSON.stringify(x)) push(path, rv);
      }
      if (x.length >= 1) push(path, x.slice(0, -1));
      x.forEach((v, i) => walk(v, path.concat(i)));
      if (!x.length && strings.length) push(path, [strings[0]]);
    } else if (x && typeof x === 'object') {
      Object.keys(x).forEach(k => walk(x[k], path.concat(k)));
    } else if (typeof x === 'boolean') push(path, !x);
    else if (typeof x === 'number') push(path, x + 1);
    else if (typeof x === 'string') {
      const other = strings.filter(s => s !== x)[0];
      if (other !== undefined) push(path, other);
      push(path, x + 'x');
    } else if (x === null && strings.length) push(path, strings[0]);
  })(ans, []);
  // 모든 낱값을 한꺼번에 바꾼 후보(틀린 부분이 여러 갈래가 되도록 — 기믹 화면 상태와 상관없이 그려지는 표시가 있게)
  const all = clone(ans);
  (function mutateAll(x, path) {
    if (Array.isArray(x)) { x.forEach((v, i) => mutateAll(v, path.concat(i))); return; }
    if (x && typeof x === 'object') { Object.keys(x).forEach(k => mutateAll(x[k], path.concat(k))); return; }
    let v = x;
    if (typeof x === 'boolean') v = !x;
    else if (typeof x === 'number') v = x + 1;
    else if (typeof x === 'string') { const other = strings.filter(s => s !== x)[0]; v = other !== undefined ? other : x + 'x'; }
    setAt(all, path, v);
  })(ans, []);
  cands.push(all);
  // 틀린 부분의 크기(낱값 수)
  const size = (w) => {
    if (w == null || w === false) return 0;
    if (Array.isArray(w)) return w.reduce((n, v) => n + (v && typeof v === 'object' ? size(v) : 1), 0);
    if (typeof w === 'object') return Object.keys(w).reduce((n, k) => n + (w[k] && typeof w[k] === 'object' ? size(w[k]) : (w[k] ? 1 : 0)), 0);
    return 1;
  };
  const judge = (c) => {
    try {
      if (def && typeof def.check === 'function') {
        const r = def.check(c, item);
        if (r === true || r === false) return { correct: r, wrong: null };
        if (r && typeof r === 'object') return { correct: r.correct === true, wrong: r.wrong === undefined ? null : r.wrong };
        return { error: true };
      }
      return { correct: JSON.stringify(c) === JSON.stringify(ans), wrong: null };
    } catch (e) { return { error: true }; }
  };
  const ok = [];
  cands.forEach((c, i) => {
    const j = judge(c);
    if (!j.error && !j.correct) ok.push({ answer: c, wrong: j.wrong, n: size(j.wrong), i });
  });
  if (!ok.length) return { ok: false, reason: 'no wrong candidate among ' + cands.length, tried: cands.length };
  // 틀린 부분이 가장 넓은 후보(같으면 먼저 만든 것)
  ok.sort((a, b) => (b.n - a.n) || (a.i - b.i));
  const best = ok[0];
  return { ok: true, answer: best.answer, wrong: best.wrong, size: best.n, tried: cands.length, hasCheck: !!(def && def.check) };
}

// 기믹 과제 창 안의 '틀린 부분' 표시 개수(기믹마다 is-wrong·data-wrong·data-mark="wrong"·빠짐 표시 등)
export const WRONG_MARK_SELECTOR = '.is-wrong, [data-wrong], [data-mark="wrong"], .is-missing:not([hidden]), .is-joined, [class*="sym-wrong"]';
