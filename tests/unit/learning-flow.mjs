import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';
const { NM } = load(['js/core/ns.js', 'js/data/stages.js', 'js/data/learning-paths.js', 'js/data/rules-config.js',
  'js/data/profanity.js', 'js/core/rules.js', 'js/core/nickname.js', 'js/core/save.js', 'js/ui/stage-logic.js',
  ...Array.from({ length: 13 }, (_, i) => `js/data/scenes/s${i}.js`)]);
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; };
const create = (level, storage = memory()) => NM.core.save.createStore({ urlLevel: level, storage });
const flow = (scene, store) => NM.ui.stageLogic.learningFlow(scene, store.stage(scene.id), store.coreItems(scene), store.level);
const scene = (id, level) => NM.ui.stageLogic.resolveScene(NM.data.SCENES[id], level);

const storage = memory();
let store = create('h23', storage);
const s1 = scene('s1', 'h23');
assert.deepEqual(Array.from(flow(s1, store).objectives), ['s1.c1']);
assert.ok(!flow(s1, store).contexts.includes('s1.c2'));
assert.ok(!flow(s1, store).items.includes('s1.t1'));
store.seeContext(s1, 's1.c1');
assert.ok(!flow(s1, store).contexts.includes('s1.c2'), 'opening a context is not completion');
store.completeContext(s1, 's1.c1');
assert.ok(flow(s1, store).contexts.includes('s1.c2'));
store = create('h23', storage);
assert.ok(flow(s1, store).contexts.includes('s1.c2'), 'unlock survives reload');
assert.ok(flow(s1, store).contexts.includes('s1.c1'), 'old clue remains readable');
store.seeContext(s1, 's1.c2');
store.completeContext(s1, 's1.c2');
for (let i = 0; i < 3; i++) store.requestHelp(s1, 's1.r1');
assert.equal(store.stage('s1').items['s1.r1'].state, 'confirmedByHelp');
assert.ok(flow(s1, store).contexts.includes('s1.c3'), 'help completion advances');

let cases = 0;
for (const id of NM.data.STAGE_IDS) for (const level of NM.core.rules.LEVELS) {
  const sc = scene(id, level), st = create(level);
  const core = st.coreItems(sc), completed = new Set();
  let steps = 0;
  while (completed.size < core.length && steps++ < 120) {
    const f = flow(sc, st);
    assert.ok(f, `${id}/${level}: path exists`);
    assert.ok(f.objectives.every(cid => sc.contexts.some(c => c.id === cid)), `${id}/${level}: valid objective`);
    if (f.readyItems.length) {
      const it = core.find(i => i.id === f.readyItems[0]);
      assert.ok(it, `${id}/${level}: item is in this school scope`);
      if (it.kind === 'read') {
        st.choose(sc, it.id, it.cards.find(c => c.correct).id);
        assert.equal(st.confirm(sc, it.id).ok, true, `${id}/${level}/${it.id}: can confirm`);
      } else assert.equal(st.submit(sc, it.id, true).ok, true);
      completed.add(it.id);
    } else {
      assert.ok(f.objectives.length, `${id}/${level}: no dead end`);
      st.seeContext(sc, f.objectives[0]); st.completeContext(sc, f.objectives[0]);
    }
  }
  assert.equal(completed.size, core.length, `${id}/${level}: all core items reached`);
  cases++;
}

const legacy = create('h23');
legacy.submit(s1, 's1.t1', true);
const raw = legacy.get();
delete raw.progress.h23.s1.visitedContexts;
const oldStorage = memory(); oldStorage.setItem(legacy.KEY, JSON.stringify(raw));
const resumed = create('h23', oldStorage);
assert.ok(flow(s1, resumed).items.includes('s1.t1'), 'completed legacy task stays open');
assert.equal(resumed.stage('s1').items['s1.t1'].state, 'done');
console.log(`learning-flow: ${cases} stage/scope routes, ordered unlock, reload, revisit, help and legacy progress ok`);
