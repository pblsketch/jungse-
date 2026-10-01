// C2 점검용 공용 장치: 스크립트 불러오기, 가짜 저장소, 시험용 장면 데이터.
// 직접 실행하면 시험용 장면 데이터의 모양(카드 3~4장·정답 1장·맥락 2곳 이상)을 확인한다.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { load } from '../lib/load.mjs';

export const SCRIPTS = [
  'js/core/ns.js',
  'js/data/stages.js',
  'js/data/rules-config.js',
  'js/data/profanity.js',
  'js/core/rules.js',
  'js/core/nickname.js',
  'js/core/save.js'
];

export function boot(extra) { return load(SCRIPTS, extra); }

// vm 컨텍스트에서 만든 객체를 이 쪽 객체로 옮겨 deepEqual 비교가 되게 한다.
export const J = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

export function fakeStorage(initial) {
  const data = new Map(Object.entries(initial || {}));
  const calls = [];
  return {
    calls,
    data,
    getItem(k) { calls.push(['get', k]); return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { calls.push(['set', k]); data.set(k, String(v)); },
    removeItem(k) { calls.push(['remove', k]); data.delete(k); },
    sets() { return calls.filter(c => c[0] === 'set').length; }
  };
}

export function throwingStorage() {
  const calls = [];
  const boom = (op) => () => { calls.push(op); throw new Error('SecurityError: blocked'); };
  return { calls, getItem: boom('get'), setItem: boom('set'), removeItem: boom('remove') };
}

const card = (itemId, letter, correct) => ({ id: `${itemId}.${letter}`, text: letter, correct, why: '' });
export function readItem(id, levels, extra) {
  return Object.assign({
    id, kind: 'read', levels,
    cards: [card(id, 'a', false), card(id, 'b', true), card(id, 'c', false)],
    explain: '풀이', hints: ['힌트', null], misread: {}
  }, extra || {});
}
export function taskItem(id, levels) {
  return { id, kind: 'task', levels, gimmick: 'test', config: {}, answer: 1, hints: ['힌트', null], explain: '풀이' };
}

// s2: 중학교판이 있는 장면(중학교 묶음)
export const S2 = {
  id: 's2', carveGlyph: 'ㆍ',
  items: [readItem('s2.r1', ['m', 'h1', 'h23']), readItem('s2.r2', ['h1', 'h23']), taskItem('s2.t1', ['m', 'h1', 'h23'])],
  contexts: [
    { id: 's2.c1', items: ['s2.r1', 's2.r2'] },
    { id: 's2.c2', items: ['s2.r1'] },
    { id: 's2.c3', items: ['s2.r2', 's2.r1'] },
    { id: 's2.c4', items: ['s2.r2'] }
  ]
};
// s4: 중학교판이 없는 고등 장면. 규칙 항목 포함
export const S4 = {
  id: 's4', carveGlyph: 'ㅿ',
  items: [
    readItem('s4.r1', ['h1', 'h23']),
    readItem('s4.r2', ['h23'], { ruleCard: 'rule.nomCase', hints: ['힌트', 's4.c3'] }),
    taskItem('s4.t1', ['h1', 'h23'])
  ],
  contexts: [
    { id: 's4.c1', items: ['s4.r1', 's4.r2'] },
    { id: 's4.c2', items: ['s4.r1'] },
    { id: 's4.c3', items: ['s4.r2'] }
  ]
};
// s1: 고2~3 전용 장면(설정값 목록에 있음). 일부 항목에 h1 표시가 있어도 늘 h23 범위
export const S1 = {
  id: 's1', carveGlyph: 'ㆆ',
  items: [readItem('s1.r1', ['h23']), readItem('s1.r2', ['h1', 'h23']), readItem('s1.r3', ['h1'])],
  contexts: [
    { id: 's1.c1', items: ['s1.r1', 's1.r2', 's1.r3'] },
    { id: 's1.c2', items: ['s1.r1', 's1.r2', 's1.r3'] }
  ]
};
// s9: 묶음 공통 장면, 단순
export const S9 = {
  id: 's9', carveGlyph: 'ㅸ',
  items: [taskItem('s9.t1', ['m', 'h1', 'h23'])], contexts: []
};
// s0: 서장(패 글자 없음)
export const S0 = { id: 's0', items: [taskItem('s0.t1', ['m', 'h1', 'h23'])], contexts: [] };

export function stageById(id) {
  const base = { s0: S0, s1: S1, s2: S2, s4: S4, s9: S9 }[id];
  if (base) return base;
  // 그 밖의 장면: 기믹 과제 하나짜리
  return { id, carveGlyph: 'ㄱ', items: [taskItem(`${id}.t1`, ['m', 'h1', 'h23'])], contexts: [] };
}

// 장면을 store 로 끝까지 진행한다(모든 핵심 항목을 첫 시도에 맞힘 + 통역 끝).
export function clearStage(ctx, store, stage) {
  const core = ctx.NM.core.rules.coreItemsFor(stage, store.level);
  for (const it of core) {
    if (it.kind === 'read') {
      const ctxs = stage.contexts.filter(c => c.items.includes(it.id)).slice(0, 2);
      for (const c of ctxs) assert.equal(store.seeContext(stage, c.id).ok, true);
      assert.equal(store.choose(stage, it.id, it.cards.find(c => c.correct).id).ok, true);
      assert.equal(store.confirm(stage, it.id).ok, true);
    } else {
      assert.equal(store.submit(stage, it.id, true).ok, true);
    }
  }
  return store.completeStage(stage);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const st of [S0, S1, S2, S4, S9]) {
    for (const it of st.items) {
      if (it.kind !== 'read') continue;
      assert.ok(it.cards.length >= 3 && it.cards.length <= 4, it.id);
      assert.equal(it.cards.filter(c => c.correct).length, 1, it.id);
      assert.ok(st.contexts.filter(c => c.items.includes(it.id)).length >= 2, it.id);
    }
  }
  console.log('c2 fixtures ok');
}
