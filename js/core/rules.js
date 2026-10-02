'use strict';
/*
 * 순수 규칙 (DOM·저장소·타이머 없음). spec §5·§6.
 * - 해독 항목(kind 'read') / 기믹 과제(kind 'task')의 상태 기계와 도움 3단계(오답마다 + 스스로 요청 requestHelp)
 * - 해독 카드 보이는 순서(cardOrder: 기록 seed·항목 id 로 고정된 순열)
 * - 핵심 항목 범위(묶음 밖 규칙 포함), 장면 끝 판정, 수첩 숫자, 추천 묶음 역할, 칭호
 * 모든 함수는 입력을 바꾸지 않고 새 값을 돌려준다. 전이 함수는 { ok, record, reason } 를 낸다.
 * 판정은 카드 id(정답 카드의 correct 표시)로만 한다. 잘못된 입력에도 던지지 않는다.
 * 필요: js/core/ns.js, js/data/stages.js, js/data/rules-config.js
 */
(function (root) {
  const NM = root.NM;
  const D = NM.data;

  const LEVELS = ['m', 'h1', 'h23'];
  const READ_STATES = ['unseen', 'met', 'guessed', 'confirmable', 'misread', 'confirmed', 'confirmedByHelp'];
  const TASK_STATES = ['open', 'done', 'doneByHelp'];
  const DONE_STATES = ['confirmed', 'confirmedByHelp', 'done', 'doneByHelp'];
  const PRE_CONFIRM = ['unseen', 'met', 'guessed', 'confirmable'];

  const helpMax = () => (Number.isInteger(D.HELP_MAX) && D.HELP_MAX > 0 ? D.HELP_MAX : 3);
  const isLevel = (lv) => LEVELS.indexOf(lv) >= 0;
  const fail = (record, reason) => ({ ok: false, record, reason });

  function copyRecord(rec) {
    const out = Object.assign({}, rec);
    if (Array.isArray(rec.seenContexts)) out.seenContexts = rec.seenContexts.slice();
    return out;
  }

  function newItemRecord(kind) {
    if (kind === 'task') return { kind: 'task', state: 'open', wrongs: 0, helps: 0, firstTry: null };
    return { kind: 'read', state: 'unseen', seenContexts: [], guess: null, wrongs: 0, helps: 0, firstTry: null };
  }

  // 확정 전 상태를 살핀 맥락 수와 고른 카드로 다시 정한다(misread·끝난 상태는 그대로).
  function derivePreConfirm(rec) {
    if (PRE_CONFIRM.indexOf(rec.state) < 0) return rec.state;
    const seen = rec.seenContexts.length;
    if (seen === 0) return 'unseen';
    if (rec.guess == null) return 'met';
    return seen >= 2 ? 'confirmable' : 'guessed';
  }

  function isItemDone(rec) { return !!rec && DONE_STATES.indexOf(rec.state) >= 0; }

  function seeContext(rec, contextId) {
    if (!rec || rec.kind !== 'read') return fail(rec, 'notRead');
    if (typeof contextId !== 'string' || !contextId) return fail(rec, 'badContext');
    if (isItemDone(rec)) return { ok: true, record: rec, changed: false };
    if (rec.seenContexts.indexOf(contextId) >= 0) return { ok: true, record: rec, changed: false };
    const next = copyRecord(rec);
    next.seenContexts.push(contextId);
    next.state = derivePreConfirm(next);
    return { ok: true, record: next, changed: true };
  }

  function findCard(item, cardId) {
    const cards = item && Array.isArray(item.cards) ? item.cards : [];
    for (let i = 0; i < cards.length; i++) if (cards[i] && cards[i].id === cardId) return cards[i];
    return null;
  }

  // 카드 고르기. 정답 여부는 알려 주지 않는다.
  function chooseCard(rec, item, cardId) {
    if (!rec || rec.kind !== 'read') return fail(rec, 'notRead');
    if (rec.state === 'unseen') return fail(rec, 'unseen');
    if (isItemDone(rec)) return fail(rec, 'alreadyDone');
    if (typeof cardId !== 'string' || !findCard(item, cardId)) return fail(rec, 'unknownCard');
    const next = copyRecord(rec);
    next.guess = cardId;
    next.state = derivePreConfirm(next);
    return { ok: true, record: next };
  }

  function confirm(rec, item) {
    if (!rec || rec.kind !== 'read') return fail(rec, 'notRead');
    if (isItemDone(rec)) return fail(rec, 'alreadyDone');
    if (rec.state !== 'confirmable' && rec.state !== 'misread') return fail(rec, 'notConfirmable');
    if (rec.guess == null) return fail(rec, 'noGuess');
    const card = findCard(item, rec.guess);
    if (!card) return fail(rec, 'unknownCard');
    const correct = card.correct === true;
    const next = copyRecord(rec);
    if (next.firstTry !== true && next.firstTry !== false) next.firstTry = correct;
    if (correct) {
      next.state = 'confirmed';
    } else {
      next.wrongs = (next.wrongs | 0) + 1;
      next.helps = stepUp(next);
      next.guess = null;
      next.state = next.helps >= helpMax() ? 'confirmedByHelp' : 'misread';
    }
    return { ok: true, record: next, correct, help: correct ? 0 : next.helps };
  }

  // 도움 한 단계 올리기: 오답(wrongs 를 이미 더한 next)·스스로 요청 모두 한 단계씩. 스스로 요청이 없으면 helps = wrongs 그대로다.
  function stepUp(next) {
    return Math.min(Math.max((next.helps | 0) + 1, next.wrongs | 0), helpMax());
  }

  // 스스로 도움 요청('실마리 더 보기', S03): 오답 없이 도움을 한 단계 올린다. wrongs 는 그대로, asks(스스로 요청 수)를 센다.
  // 도움을 받았으므로 처음 시도는 '맞음'이 될 수 없다(firstTry 가 아직 없으면 false). 마지막 단계에 닿으면 도움으로 확정·완료.
  // 해독 항목은 아직 만나지 않은 말(unseen)이면 요청할 수 없다(카드 고르기와 같음).
  function requestHelp(rec, item) {
    if (!rec || (rec.kind !== 'read' && rec.kind !== 'task')) return fail(rec, 'badRecord');
    if (isItemDone(rec)) return fail(rec, 'alreadyDone');
    if (rec.kind === 'read' && rec.state === 'unseen') return fail(rec, 'unseen');
    if ((rec.helps | 0) >= helpMax()) return fail(rec, 'maxHelp');
    const next = copyRecord(rec);
    next.helps = Math.min((next.helps | 0) + 1, helpMax());
    next.asks = (next.asks | 0) + 1;
    if (next.firstTry !== true && next.firstTry !== false) next.firstTry = false;
    if (next.helps >= helpMax()) {
      if (next.kind === 'read') { next.state = 'confirmedByHelp'; next.guess = null; }
      else next.state = 'doneByHelp';
    }
    return { ok: true, record: next, help: next.helps };
  }

  // 해독 카드 보이는 순서(S01): 항목 id 와 기록의 seed 로 정해지는 고정 순열. 같은 기록·같은 항목이면 언제나 같은 순서.
  // 장면 데이터는 정답 카드를 맨 앞에 적으므로 화면은 이 순서를 쓴다. 판정은 카드 id 로 하므로 순서와 상관없다.
  function hashStr(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function cardOrder(item, seed) {
    const cards = item && Array.isArray(item.cards) ? item.cards.slice() : [];
    let s = hashStr(String(seed >>> 0) + '|' + String(item && item.id)) || 1;
    const rnd = () => { // mulberry32
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp;
    }
    return cards;
  }

  // 기믹 과제 제출. correct 는 기믹이 판정한 참/거짓.
  function submit(rec, correct) {
    if (!rec || rec.kind !== 'task') return fail(rec, 'notTask');
    if (rec.state !== 'open') return fail(rec, 'alreadyDone');
    if (correct !== true && correct !== false) return fail(rec, 'badJudgement');
    const next = copyRecord(rec);
    if (next.firstTry !== true && next.firstTry !== false) next.firstTry = correct;
    if (correct) {
      next.state = 'done';
    } else {
      next.wrongs = (next.wrongs | 0) + 1;
      next.helps = stepUp(next);
      next.state = next.helps >= helpMax() ? 'doneByHelp' : 'open';
    }
    return { ok: true, record: next, correct, help: correct ? 0 : next.helps };
  }

  // 지금 열린 도움: 1단계 힌트, 2단계 빛낼 맥락(또는 강조 대상), 3단계 정답(카드 id 또는 과제 answer)·풀이
  function helpView(item, rec) {
    const step = rec && Number.isInteger(rec.helps) ? Math.max(0, Math.min(rec.helps, helpMax())) : 0;
    const hints = item && Array.isArray(item.hints) ? item.hints : [];
    let answer = null;
    if (step >= 3 && item) {
      if (item.kind === 'task') answer = item.answer === undefined ? null : item.answer;
      else {
        const right = (item.cards || []).filter(c => c && c.correct === true)[0];
        answer = right ? right.id : null;
      }
    }
    return {
      step,
      hint: step >= 1 && hints[0] != null ? hints[0] : null,
      glow: step >= 2 && hints[1] != null ? hints[1] : null,
      answer,
      explain: step >= 3 && item && item.explain != null ? item.explain : null
    };
  }

  // ── 핵심 항목 범위
  const itemsOf = (stage) => (stage && Array.isArray(stage.items) ? stage.items.filter(Boolean) : []);
  const coreAt = (item, lv) => !Array.isArray(item.levels) || item.levels.indexOf(lv) >= 0;

  function isH23Only(stage) {
    if (!stage) return false;
    if (stage.h23Only === true) return true;
    const list = D.SCOPE_RULES && Array.isArray(D.SCOPE_RULES.h23Only) ? D.SCOPE_RULES.h23Only : [];
    if (list.indexOf(stage.id) >= 0) return true;
    const items = itemsOf(stage);
    return items.length > 0 && items.every(it => Array.isArray(it.levels) && it.levels.length > 0 &&
      it.levels.every(lv => lv === 'h23'));
  }

  function scopeLevel(stage, level) {
    if (!isLevel(level)) return null;
    if (isH23Only(stage)) return 'h23';
    const items = itemsOf(stage);
    if (!items.length || items.some(it => coreAt(it, level))) return level;
    const fb = (D.SCOPE_RULES && D.SCOPE_RULES.fallback && D.SCOPE_RULES.fallback[level]) || [];
    for (let i = 0; i < fb.length; i++) if (items.some(it => coreAt(it, fb[i]))) return fb[i];
    return level;
  }

  function coreItemsFor(stage, level) {
    const lv = scopeLevel(stage, level);
    if (!lv) return [];
    return itemsOf(stage).filter(it => coreAt(it, lv));
  }

  function findItem(stage, itemId) {
    const items = itemsOf(stage);
    for (let i = 0; i < items.length; i++) if (items[i].id === itemId) return items[i];
    return null;
  }

  function isCoreComplete(stageProg, stage, level) {
    const core = coreItemsFor(stage, level);
    if (!core.length) return false;
    const items = stageProg && stageProg.items ? stageProg.items : {};
    return core.every(it => isItemDone(items[it.id]));
  }

  // 수첩 숫자: 첫 시도 정확도(firstTry 가 정해진 핵심 항목 중 참의 비율), 도움 합, 오해(해독 항목 wrongs 합)
  function notebookStats(stageProg, stage, level) {
    const items = stageProg && stageProg.items ? stageProg.items : {};
    let right = 0, set = 0, helps = 0, misreads = 0;
    coreItemsFor(stage, level).forEach(it => {
      const rec = items[it.id];
      if (!rec) return;
      if (rec.firstTry === true || rec.firstTry === false) { set++; if (rec.firstTry) right++; }
      helps += rec.helps | 0;
      if (rec.kind === 'read') misreads += rec.wrongs | 0;
    });
    return { firstTryRate: set ? right / set : null, firstTryRight: right, firstTrySet: set, helps, misreads };
  }

  // ── 묶음·칭호
  function bundleRole(level, stageId) {
    if (stageId === 's0') return 'prologue';
    const b = D.BUNDLES && D.BUNDLES[level];
    if (!b) return 'outside';
    if (b.stages.indexOf(stageId) >= 0) return 'bundle';
    if ((b.optional || []).indexOf(stageId) >= 0) return 'optional';
    return 'outside';
  }

  function titleFor(levelProgress, level) {
    const b = D.BUNDLES && D.BUNDLES[level];
    const stages = b ? b.stages : [];
    const prog = levelProgress || {};
    const done = stages.filter(id => prog[id] && prog[id].status === 'done').length;
    const total = stages.length;
    const ratio = total ? done / total : 0;
    const tiers = (D.TITLE_RULES && D.TITLE_RULES.tiers) || [];
    let title = tiers.length ? tiers[tiers.length - 1].title : '';
    for (let i = 0; i < tiers.length; i++) { if (ratio >= tiers[i].ratio) { title = tiers[i].title; break; } }
    return { title, done, total };
  }

  NM.core.rules = {
    LEVELS, READ_STATES, TASK_STATES, DONE_STATES,
    helpMax, newItemRecord, seeContext, chooseCard, confirm, submit, requestHelp, cardOrder, isItemDone, helpView, derivePreConfirm,
    isH23Only, scopeLevel, coreItemsFor, findItem, isCoreComplete, notebookStats,
    bundleRole, titleFor
  };
})(typeof window !== 'undefined' ? window : globalThis);
