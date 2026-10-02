'use strict';
/*
 * NM.ui.stageLogic — 장면 진행기의 순수 부분 (DOM·저장소·타이머 없음). 판정은 NM.core.rules 가 한다.
 *   resolveScene(scene, level)     학교급별 판: scene.editions[level] 의 필드가 덮는다(얕은 합치기). 원본은 그대로.
 *   itemById(scene, id), contextById(scene, id), contextsOf(scene, itemId)
 *   nonCoreItems(scene, core)      이 학교급에서 핵심이 아닌 항목(알아 두기로만 보인다)
 *   bangjeomFor(stageId, scene, settings)  방점 보이기: s4·s10 또는 scene.bangjeomAlways 면 늘 켬, 아니면 설정
 *   objectives(scene, stageProg, core)     목표 맥락: 확정 전 핵심 해독 항목이 아직 두 곳을 못 보았을 때 그 항목이 든 안 본 맥락
 *   modernLocked(scene, stageProg, core, blockId)
 *                                  原文 블록의 현대어 풀이를 아직 감추는가: 장면을 끝내지 않았고, 그 블록이 든 맥락을 쓰는
 *                                  핵심 해독 항목 가운데 확정하지 않은 것이 있으면 참(풀이가 답을 알려 주지 않게)
 *   solvedWords(scene, stageProg)  확정한 항목의 { itemId, forms(item.word + item.wordForms), gloss(item.gloss 또는 정답 카드 글자) }
 *                                  — 화면 곳곳 현대어 풀이용
 *   knownRules(record, level) / unknownRules(scene, record, level)
 *                                  scene.needs([{rule, lines}]) 가운데 이 학교급 수첩에 없는 규칙 → { rule, lines, name, stage, stageName }
 *   judge(def, answer, item)       기믹 판정: def.check(answer, item) → 참/거짓 또는 { correct, wrong }.
 *                                  check 가 없으면 item.answer 와 깊은 비교(객체 키 순서 무관). check 가 던지면 { error:true }.
 *   stageName(stageId)             '서장' / '스테이지 n' / '종장' (+ 장면 데이터 제목)
 * 필요: ns.js, core/rules.js, data/text-stage.js, ui/stage-text.js (core/yet.js 가 있으면 제목 표기를 푼다)
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const R = () => NM.core.rules;
  const TX = () => NM.ui.stageText;
  const ALWAYS_BANGJEOM = ['s4', 's10'];
  const list = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);

  function resolveScene(scene, level) {
    if (!scene || typeof scene !== 'object') return null;
    const out = Object.assign({}, scene);
    const ed = scene.editions && typeof scene.editions === 'object' ? scene.editions[level] : null;
    if (ed && typeof ed === 'object') Object.assign(out, ed);
    out.id = scene.id;
    delete out.editions;
    return out;
  }

  const itemById = (scene, id) => list(scene && scene.items).filter(i => i.id === id)[0] || null;
  const contextById = (scene, id) => list(scene && scene.contexts).filter(c => c.id === id)[0] || null;
  const contextsOf = (scene, itemId) => list(scene && scene.contexts).filter(c => list(c.items).indexOf(itemId) >= 0);

  function nonCoreItems(scene, core) {
    const ids = list(core).map(i => i.id);
    return list(scene && scene.items).filter(i => ids.indexOf(i.id) < 0);
  }

  function bangjeomFor(stageId, scene, settings) {
    if (ALWAYS_BANGJEOM.indexOf(stageId) >= 0) return true;
    if (scene && scene.bangjeomAlways === true) return true;
    return !(settings && settings.bangjeom === false);
  }

  function objectives(scene, prog, core) {
    const items = (prog && prog.items) || {};
    const want = [];
    list(core).forEach(it => {
      if (it.kind !== 'read') return;
      const rec = items[it.id];
      if (rec && R().isItemDone(rec)) return;
      const seen = rec && Array.isArray(rec.seenContexts) ? rec.seenContexts : [];
      if (seen.length >= 2) return;
      contextsOf(scene, it.id).forEach(c => { if (seen.indexOf(c.id) < 0 && want.indexOf(c.id) < 0) want.push(c.id); });
    });
    return list(scene && scene.contexts).map(c => c.id).filter(id => want.indexOf(id) >= 0);
  }

  function modernLocked(scene, prog, core, blockId) {
    if (prog && prog.status === 'done') return false;
    const items = (prog && prog.items) || {};
    return list(core).some(it => it.kind === 'read' && !R().isItemDone(items[it.id]) &&
      contextsOf(scene, it.id).some(c => list(c.orig).indexOf(blockId) >= 0));
  }

  function solvedWords(scene, prog) {
    const items = (prog && prog.items) || {};
    const out = [];
    list(scene && scene.items).forEach(it => {
      if (it.kind !== 'read' || !R().isItemDone(items[it.id])) return;
      const forms = [];
      [it.word].concat(list(it.wordForms)).forEach(w => { if (typeof w === 'string' && w && forms.indexOf(w) < 0) forms.push(w); });
      let gloss = typeof it.gloss === 'string' && it.gloss ? it.gloss : null;
      if (!gloss) {
        const right = list(it.cards).filter(c => c.correct === true)[0];
        if (right && typeof right.text === 'string') {
          try { gloss = NM.core.yet ? NM.core.yet.render(right.text, { bangjeom: false, ruby: 'base' }) : right.text; }
          catch (e) { gloss = right.text; }
        }
      }
      if (!forms.length || !gloss) return;
      out.push({ itemId: it.id, forms, gloss });
    });
    return out;
  }

  function knownRules(record, level) {
    const out = [];
    const lvp = record && record.progress && record.progress[level];
    if (!lvp || typeof lvp !== 'object') return out;
    Object.keys(lvp).forEach(sid => list(lvp[sid] && lvp[sid].rules).forEach(r => { if (out.indexOf(r) < 0) out.push(r); }));
    return out;
  }

  function stageName(stageId) {
    const m = /^s(\d+)$/.exec(String(stageId));
    let name;
    if (stageId === 's0') name = TX().t('prologue');
    else if (stageId === 's12') name = TX().t('epilogue');
    else name = TX().t('stageNo', { n: m ? m[1] : stageId });
    const sc = NM.data.SCENES && NM.data.SCENES[stageId];
    const st = NM.data.STAGES && NM.data.STAGES[stageId];
    const title = (sc && sc.title) || (st && st.title) || '';
    if (title) {
      let plain = title;
      try { if (NM.core.yet) plain = NM.core.yet.render(title, { bangjeom: false, ruby: 'base' }); } catch (e) { plain = title; }
      name += ' ' + plain;
    }
    return name;
  }

  function unknownRules(scene, record, level) {
    const known = knownRules(record, level);
    const cards = NM.data.RULE_CARDS && typeof NM.data.RULE_CARDS === 'object' ? NM.data.RULE_CARDS : {};
    return list(scene && scene.needs).filter(n => typeof n.rule === 'string' && known.indexOf(n.rule) < 0).map(n => {
      const card = cards[n.rule] || null;
      const stage = card && typeof card.stage === 'string' ? card.stage : null;
      return {
        rule: n.rule, lines: list(n.lines),
        name: card && card.name ? card.name : null,
        text: card && card.text ? card.text : null,
        stage, stageName: stage ? stageName(stage) : null
      };
    });
  }

  function stable(x) {
    if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }

  function judge(def, answer, item) {
    try {
      if (def && typeof def.check === 'function') {
        const r = def.check(answer, item);
        if (r === true || r === false) return { correct: r, wrong: null };
        if (r && typeof r === 'object') return { correct: r.correct === true, wrong: r.wrong === undefined ? null : r.wrong };
        throw new Error('check returned ' + typeof r);
      }
      return { correct: stable(answer) === stable(item ? item.answer : undefined), wrong: null };
    } catch (e) {
      NM.reportError('stage.judge', e);
      return { correct: false, wrong: null, error: true };
    }
  }

  NM.ui.stageLogic = {
    ALWAYS_BANGJEOM, resolveScene, itemById, contextById, contextsOf, nonCoreItems, bangjeomFor, modernLocked,
    objectives, solvedWords, knownRules, unknownRules, judge, stageName
  };
})(typeof window !== 'undefined' ? window : globalThis);
