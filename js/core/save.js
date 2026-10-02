'use strict';
/*
 * 기록 저장소. spec §10-2, §19-5, §9.
 * - 저장소는 주입한다(getItem/setItem/removeItem; 브라우저에선 localStorage). DOM·타이머 없음.
 * - 키 하나('naratmalssami:v1')에 기록 전체를 쓴다. 바꾸는 동작 하나 = 쓰기 한 번
 *   (항목 상태 + 수첩 + 보상을 함께 쓴다). 실패한 동작은 쓰지 않는다.
 * - 보상(완료·패 글자)은 장면 id 기준으로 한 번만 들어간다(새로 고침 뒤 다시 불러도 그대로).
 * - 망가진 JSON·모르는 형식 버전 → 기록 없음(기본값). 필드 하나가 이상하면 그 필드만 기본값.
 * - seed: 기록마다 한 번 정하는 수(해독 카드 순서용). 새 기록은 무작위, seed 없는 예전 기록은 기록 값에서 고정으로 낸다.
 * - 저장소가 막히면 메모리로 계속 돌고 storageAvailable=false. takeStorageWarning()은 처음 한 번만 true.
 * - 주소 학교급(urlLevel): 기록이 있으면 이번 접속에만 쓰고 기록의 학교급은 그대로.
 *   기록이 없으면(첫 실행) 기록의 학교급이 된다. 진행은 지금 학교급(store.level)의 칸에 쓴다.
 * - 교사 모드(teacher:true): 저장소를 읽지도 쓰지도 않는 메모리 저장소. 같은 API.
 *   기본 설정·주인공 1·별명 없음. 교사 모드라는 사실은 기록에 넣지 않는다.
 * 필요: ns.js, data/stages.js, data/rules-config.js, data/profanity.js, core/rules.js, core/nickname.js
 */
(function (root) {
  const NM = root.NM;
  const R = NM.core.rules;
  const KEY = 'naratmalssami:v1';
  const VERSION = 1;
  const LEVELS = R.LEVELS;
  const STATUSES = ['new', 'progress', 'done'];
  const REFLECTION_MAX = 200;

  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const isLevel = (lv) => LEVELS.indexOf(lv) >= 0;
  const isStageId = (id) => (NM.data.STAGE_IDS || []).indexOf(id) >= 0;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const bool = (x, d) => (typeof x === 'boolean' ? x : d);
  const count = (x) => (Number.isInteger(x) && x >= 0 ? x : 0);
  function strList(x, filter) {
    if (!Array.isArray(x)) return [];
    const out = [];
    x.forEach(s => { if (typeof s === 'string' && s && out.indexOf(s) < 0 && (!filter || filter(s))) out.push(s); });
    return out;
  }

  function defaultSettings() {
    return { bangjeom: true, modern: 'tap', eum: true, fontScale: 1, reducedMotion: 'auto', bgm: true, sfx: true };
  }
  // seed: 기록마다 한 번 정하는 수(해독 카드 보이는 순서 NM.core.rules.cardOrder 용, S01). 1 ~ 2^31-1 정수.
  const isSeed = (x) => Number.isInteger(x) && x >= 1 && x <= 0x7fffffff;
  const newSeed = () => 1 + Math.floor(Math.random() * 0x7ffffffe);
  // 예전 기록(seed 없음)은 기록 안의 변하지 않을 값으로 정한다 → 다음 쓰기 전에 새로 고쳐도 같은 순서. 다음 쓰기에서 저장된다.
  function legacySeed(raw) {
    const str = JSON.stringify([raw.level, raw.protagonist, raw.nickname, raw.glyphs]);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return (h % 0x7ffffffe) + 1;
  }
  function defaultRecord(level, seed) {
    return {
      v: VERSION, level: isLevel(level) ? level : 'm', protagonist: 1, nickname: '',
      settings: defaultSettings(), prologueDone: false, progress: {}, glyphs: {}, seenNotices: [],
      seed: isSeed(seed) ? seed : newSeed()
    };
  }
  function newStageProgress() {
    return { status: 'new', items: {}, rules: [], translations: [], reflection: '' };
  }

  const SETTING_OK = {
    bangjeom: (v) => typeof v === 'boolean',
    modern: (v) => v === 'tap' || v === 'always' || v === 'off',
    eum: (v) => typeof v === 'boolean',
    fontScale: (v) => v === 1 || v === 2 || v === 3,
    reducedMotion: (v) => v === 'auto' || v === true || v === false,
    bgm: (v) => typeof v === 'boolean',
    sfx: (v) => typeof v === 'boolean'
  };
  // base 위에 s 의 올바른 값만 덮는다(모르는 키·잘못된 값은 무시).
  function normSettings(s, base) {
    const out = Object.assign(defaultSettings(), base || {});
    if (!isObj(s)) return out;
    Object.keys(SETTING_OK).forEach(k => { if (SETTING_OK[k](s[k])) out[k] = s[k]; });
    return out;
  }

  function normItem(x) {
    if (!isObj(x) || (x.kind !== 'read' && x.kind !== 'task')) return null;
    const rec = R.newItemRecord(x.kind);
    rec.wrongs = count(x.wrongs);
    rec.helps = Number.isInteger(x.helps) && x.helps >= 0 && x.helps <= 3 ? x.helps : 0;
    rec.firstTry = x.firstTry === true || x.firstTry === false ? x.firstTry : null;
    // asks: 스스로 요청한 도움 수(S03). 있을 때만 둔다(없으면 0 — 예전 기록과 같은 모양).
    if (count(x.asks) > 0) rec.asks = Math.min(count(x.asks), rec.helps);
    if (x.kind === 'task') {
      rec.state = R.TASK_STATES.indexOf(x.state) >= 0 ? x.state : 'open';
      return rec;
    }
    rec.seenContexts = strList(x.seenContexts);
    rec.guess = typeof x.guess === 'string' && x.guess ? x.guess : null;
    rec.state = R.READ_STATES.indexOf(x.state) >= 0 ? x.state : 'unseen';
    if (rec.state === 'unseen' && rec.seenContexts.length === 0) rec.guess = null;
    rec.state = R.derivePreConfirm(rec);
    return rec;
  }

  function normStage(x) {
    const p = newStageProgress();
    if (!isObj(x)) return p;
    p.status = STATUSES.indexOf(x.status) >= 0 ? x.status : 'new';
    if (isObj(x.items)) {
      Object.keys(x.items).forEach(id => { const rec = normItem(x.items[id]); if (rec) p.items[id] = rec; });
    }
    p.rules = strList(x.rules);
    p.translations = strList(x.translations);
    p.reflection = typeof x.reflection === 'string' ? x.reflection.slice(0, REFLECTION_MAX) : '';
    const it = normInterp(x.interp);
    if (it) p.interp = it; // 있을 때만 둔다(없으면 예전 기록과 같은 모양)
    return p;
  }
  // 통역 고르기 기록(js/ui/stage-translate.js): { firstTry, tries, first:[처음 고른 카드 id], picks:[마지막 고른 카드 id] }
  function normInterp(x) {
    if (!isObj(x)) return null;
    return {
      firstTry: x.firstTry === true || x.firstTry === false ? x.firstTry : null,
      tries: count(x.tries), first: strList(x.first), picks: strList(x.picks)
    };
  }

  // 저장된 값 → 올바른 기록. 기록으로 볼 수 없으면(형식 버전 다름 등) null.
  function normalizeRecord(raw) {
    if (!isObj(raw) || raw.v !== VERSION) return null;
    const rec = defaultRecord(raw.level, isSeed(raw.seed) ? raw.seed : legacySeed(raw));
    rec.protagonist = [1, 2, 3, 4].indexOf(raw.protagonist) >= 0 ? raw.protagonist : 1;
    rec.nickname = typeof raw.nickname === 'string' && NM.core.nickname.check(raw.nickname).ok ? raw.nickname : '';
    rec.settings = normSettings(raw.settings);
    rec.prologueDone = raw.prologueDone === true;
    if (isObj(raw.progress)) {
      LEVELS.forEach(lv => {
        const src = raw.progress[lv];
        if (!isObj(src)) return;
        const out = {};
        Object.keys(src).forEach(sid => { if (isStageId(sid)) out[sid] = normStage(src[sid]); });
        rec.progress[lv] = out;
      });
    }
    if (isObj(raw.glyphs)) {
      LEVELS.forEach(lv => {
        if (Array.isArray(raw.glyphs[lv])) rec.glyphs[lv] = strList(raw.glyphs[lv], id => isStageId(id) && id !== 's0');
      });
    }
    rec.seenNotices = strList(raw.seenNotices);
    return rec;
  }

  function createStore(opts) {
    const o = opts || {};
    const teacher = o.teacher === true;
    const storage = teacher ? null : (o.storage || null);
    const urlLevel = isLevel(o.urlLevel) ? o.urlLevel : null;
    let storageAvailable = !!storage;
    let warned = false;
    let hasRecord = false;
    let record = null;

    if (!teacher && storage) {
      let text = null;
      try { text = storage.getItem(KEY); } catch (e) { storageAvailable = false; }
      if (typeof text === 'string') {
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
        record = normalizeRecord(parsed);
        hasRecord = !!record;
      }
    }
    if (!record) record = defaultRecord(urlLevel || (teacher ? o.level : null));
    let level = urlLevel || record.level;

    function write(next) {
      if (teacher || !storageAvailable) return;
      try { storage.setItem(KEY, JSON.stringify(next)); } catch (e) { storageAvailable = false; }
    }
    // 사본에 바꾸기를 모두 하고, 성공하면 한 번에 쓰고 바꿔 넣는다.
    function commit(mutator) {
      const next = clone(record);
      const out = mutator(next) || { ok: true };
      if (out.ok === false) return out;
      write(next);
      record = next;
      hasRecord = true;
      return out;
    }
    function stageOf(rec, stageId) {
      const lvp = rec.progress[level] || (rec.progress[level] = {});
      return lvp[stageId] || (lvp[stageId] = newStageProgress());
    }
    const touch = (p) => { if (p.status === 'new') p.status = 'progress'; };
    function coreItem(stage, itemId) {
      const list = R.coreItemsFor(stage, level);
      for (let i = 0; i < list.length; i++) if (list[i].id === itemId) return list[i];
      return null;
    }
    const validStage = (stage) => !!stage && isStageId(stage.id);

    function itemOp(stage, itemId, kind, apply) {
      if (kind === 'any') { const it = validStage(stage) ? coreItem(stage, itemId) : null; kind = it ? it.kind : 'read'; }
      if (!validStage(stage)) return { ok: false, reason: 'badStage' };
      const item = coreItem(stage, itemId);
      if (!item) return { ok: false, reason: 'notCore' };
      if (item.kind !== kind) return { ok: false, reason: kind === 'read' ? 'notRead' : 'notTask' };
      return commit(rec => {
        const p = stageOf(rec, stage.id);
        const cur = p.items[itemId] || R.newItemRecord(kind);
        const r = apply(cur, item);
        if (!r.ok) return { ok: false, reason: r.reason };
        p.items[itemId] = r.record;
        touch(p);
        const out = { ok: true, state: r.record.state };
        if ('correct' in r) { out.correct = r.correct; out.help = r.help; }
        else if ('help' in r) out.help = r.help;
        if (R.isItemDone(r.record) && item.ruleCard && kind === 'read') {
          if (p.rules.indexOf(item.ruleCard) < 0) p.rules.push(item.ruleCard);
          out.ruleCard = item.ruleCard;
        }
        return out;
      });
    }

    const api = {
      KEY,
      get isTeacher() { return teacher; },
      get storageAvailable() { return storageAvailable; },
      get hasRecord() { return hasRecord; },
      get level() { return level; },
      get seed() { return record.seed; },
      takeStorageWarning() {
        if (teacher || storageAvailable || warned) return false;
        warned = true;
        return true;
      },
      get() { return clone(record); },
      stage(stageId) {
        const lvp = record.progress[level];
        return clone(lvp && lvp[stageId] ? lvp[stageId] : newStageProgress());
      },
      canSelectStage() { return record.prologueDone === true; },
      bundleRole(stageId) { return R.bundleRole(level, stageId); },
      title() { return R.titleFor(record.progress[level], level); },
      stats(stage) { return R.notebookStats(record.progress[level] && stage ? record.progress[level][stage.id] : null, stage, level); },
      coreItems(stage) { return R.coreItemsFor(stage, level); },
      hasSeenNotice(id) { return record.seenNotices.indexOf(id) >= 0; },

      setup(p) {
        const q = p || {};
        const lv = q.level === undefined ? level : q.level;
        if (!isLevel(lv)) return { ok: false, reason: 'badLevel' };
        if ([1, 2, 3, 4].indexOf(q.protagonist) < 0) return { ok: false, reason: 'badProtagonist' };
        const nick = q.nickname == null ? '' : q.nickname;
        if (nick !== '') { const c = NM.core.nickname.check(nick); if (!c.ok) return c; }
        return commit(rec => {
          if (q.level !== undefined || !hasRecord) { rec.level = lv; level = lv; }
          rec.protagonist = q.protagonist;
          rec.nickname = nick;
          return { ok: true };
        });
      },
      setLevel(lv) {
        if (!isLevel(lv)) return { ok: false, reason: 'badLevel' };
        return commit(rec => { rec.level = lv; level = lv; return { ok: true }; });
      },
      setProtagonist(n) {
        if ([1, 2, 3, 4].indexOf(n) < 0) return { ok: false, reason: 'badProtagonist' };
        return commit(rec => { rec.protagonist = n; return { ok: true }; });
      },
      setNickname(s) {
        const c = s === '' ? { ok: true, reason: null } : NM.core.nickname.check(s);
        if (!c.ok) return c;
        return commit(rec => { rec.nickname = s; return { ok: true, reason: null }; });
      },
      setSettings(partial) {
        if (!isObj(partial)) return { ok: false, reason: 'badSettings' };
        return commit(rec => { rec.settings = normSettings(partial, rec.settings); return { ok: true }; });
      },
      markPrologueDone() { return commit(rec => { rec.prologueDone = true; return { ok: true }; }); },
      markNotice(id) {
        if (typeof id !== 'string' || !id) return { ok: false, reason: 'badId' };
        if (record.seenNotices.indexOf(id) >= 0) return { ok: true };
        return commit(rec => { rec.seenNotices.push(id); return { ok: true }; });
      },

      // 맥락 하나를 살핌 → 그 맥락에 든 핵심 해독 항목 모두에 반영
      seeContext(stage, contextId) {
        if (!validStage(stage)) return { ok: false, reason: 'badStage' };
        const c = (stage.contexts || []).filter(x => x && x.id === contextId)[0];
        if (!c) return { ok: false, reason: 'unknownContext' };
        const ids = (c.items || []).filter(id => { const it = coreItem(stage, id); return it && it.kind === 'read'; });
        return commit(rec => {
          const p = stageOf(rec, stage.id);
          const changed = [];
          ids.forEach(id => {
            const r = R.seeContext(p.items[id] || R.newItemRecord('read'), contextId);
            if (r.ok) { p.items[id] = r.record; if (r.changed) changed.push(id); }
          });
          touch(p);
          return { ok: true, changed };
        });
      },
      choose(stage, itemId, cardId) { return itemOp(stage, itemId, 'read', (cur, item) => R.chooseCard(cur, item, cardId)); },
      confirm(stage, itemId) { return itemOp(stage, itemId, 'read', (cur, item) => R.confirm(cur, item)); },
      submit(stage, itemId, correct) { return itemOp(stage, itemId, 'task', (cur) => R.submit(cur, correct)); },
      // 스스로 도움 한 단계(해독 항목·기믹 과제 모두). 오답 수는 그대로.
      requestHelp(stage, itemId) { return itemOp(stage, itemId, 'any', (cur, item) => R.requestHelp(cur, item)); },

      addTranslation(stageId, id) {
        if (!isStageId(stageId) || typeof id !== 'string' || !id) return { ok: false, reason: 'badId' };
        return commit(rec => {
          const p = stageOf(rec, stageId);
          if (p.translations.indexOf(id) < 0) p.translations.push(id);
          touch(p);
          return { ok: true };
        });
      },
      // 통역 고르기 결과. 첫 시도(firstTry·first)는 처음 한 번만 남기고(다시 하기에도 그대로), 시도 수·마지막 고른 것은 바꾼다.
      recordInterp(stageId, r) {
        if (!isStageId(stageId) || !isObj(r)) return { ok: false, reason: 'badInput' };
        return commit(rec => {
          const p = stageOf(rec, stageId);
          const old = p.interp;
          const keep = !!old && typeof old.firstTry === 'boolean';
          p.interp = {
            firstTry: keep ? old.firstTry : (typeof r.firstTry === 'boolean' ? r.firstTry : null),
            tries: count(r.tries), first: keep ? old.first : strList(r.first), picks: strList(r.picks)
          };
          touch(p);
          return { ok: true };
        });
      },
      setReflection(stageId, text) {
        if (!isStageId(stageId) || typeof text !== 'string') return { ok: false, reason: 'badInput' };
        return commit(rec => { stageOf(rec, stageId).reflection = text.slice(0, REFLECTION_MAX); return { ok: true }; });
      },

      // 통역 장면을 본 뒤 부른다. 핵심 항목이 모두 끝났으면 완료 + 패 글자(한 번만), 쓰기 한 번.
      completeStage(stage) {
        if (!validStage(stage)) return { ok: false, reason: 'badStage' };
        const lvp = record.progress[level] || {};
        if (!R.isCoreComplete(lvp[stage.id], stage, level)) return { ok: false, reason: 'incomplete' };
        return commit(rec => {
          const p = stageOf(rec, stage.id);
          const newlyDone = p.status !== 'done';
          p.status = 'done';
          let glyphAdded = false;
          if (stage.id === 's0') rec.prologueDone = true;
          else {
            const g = rec.glyphs[level] || (rec.glyphs[level] = []);
            if (g.indexOf(stage.id) < 0) { g.push(stage.id); glyphAdded = true; }
          }
          return { ok: true, newlyDone, glyphAdded };
        });
      },
      // 끝낸 장면 다시 하기: 항목·수첩을 비우고 firstTry·패 글자·done 상태는 남긴다.
      replay(stageId) {
        const lvp = record.progress[level];
        if (!lvp || !lvp[stageId] || lvp[stageId].status !== 'done') return { ok: false, reason: 'notDone' };
        return commit(rec => {
          const p = rec.progress[level][stageId];
          Object.keys(p.items).forEach(id => {
            const old = p.items[id];
            const fresh = R.newItemRecord(old.kind);
            fresh.firstTry = old.firstTry;
            p.items[id] = fresh;
          });
          p.rules = []; p.translations = []; p.reflection = '';
          return { ok: true };
        });
      },
      // 새로 시작: 기록 전부 지움
      newStart() {
        if (!teacher && storageAvailable) {
          try { storage.removeItem(KEY); } catch (e) { storageAvailable = false; }
        }
        record = defaultRecord(teacher ? level : urlLevel);
        level = urlLevel || record.level;
        hasRecord = false;
        return { ok: true };
      }
    };
    return api;
  }

  NM.core.save = { KEY, VERSION, createStore, normalizeRecord, defaultRecord, newStageProgress };
})(typeof window !== 'undefined' ? window : globalThis);
