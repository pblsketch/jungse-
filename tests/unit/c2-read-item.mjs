// C2: 해독 항목 상태 기계 (spec §5-2, §5-4)
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { boot, J, readItem } from './c2-fixtures.mjs';
import { load, ROOT } from '../lib/load.mjs';

const ctx = boot();
const R = ctx.NM.core.rules;
const item = readItem('s6.r2', ['h1']);
const RIGHT = 's6.r2.b', WRONG1 = 's6.r2.a', WRONG2 = 's6.r2.c';

// 줄줄이 적용: 각 단계는 ok 여야 한다
function run(rec, steps) {
  for (const [op, arg] of steps) {
    const r = op === 'see' ? R.seeContext(rec, arg)
      : op === 'choose' ? R.chooseCard(rec, item, arg)
      : R.confirm(rec, item);
    assert.equal(r.ok, true, `${op} ${arg} 실패: ${r.reason}`);
    rec = r.record;
  }
  return rec;
}

// 새 기록
const fresh = R.newItemRecord('read');
assert.deepEqual(J(fresh), { kind: 'read', state: 'unseen', seenContexts: [], guess: null, wrongs: 0, helps: 0, firstTry: null });
assert.deepEqual(J(R.newItemRecord('task')), { kind: 'task', state: 'open', wrongs: 0, helps: 0, firstTry: null });

// unseen → met → guessed → confirmable → confirmed
let rec = run(fresh, [['see', 's6.c1']]);
assert.equal(rec.state, 'met');
rec = run(rec, [['choose', WRONG1]]);
assert.equal(rec.state, 'guessed');
rec = run(rec, [['see', 's6.c1']]); // 같은 맥락 다시 → 그대로
assert.equal(rec.state, 'guessed');
assert.deepEqual(J(rec.seenContexts), ['s6.c1']);
rec = run(rec, [['see', 's6.c2']]);
assert.equal(rec.state, 'confirmable');
// 추측은 확정 전 언제든 바꿀 수 있고, 맞았는지 알려 주지 않는다
const changed = R.chooseCard(rec, item, RIGHT);
assert.equal(changed.ok, true);
assert.equal(changed.record.state, 'confirmable');
assert.equal(changed.record.guess, RIGHT);
assert.equal('correct' in changed, false, '확정 전 정답 여부 노출 금지');
rec = changed.record;
const done = R.confirm(rec, item);
assert.equal(done.ok, true);
assert.equal(done.correct, true);
assert.equal(done.record.state, 'confirmed');
assert.equal(done.record.firstTry, true);
assert.equal(done.record.helps, 0);
assert.equal(R.isItemDone(done.record), true);

// 순서 바꿈: 맥락 2곳 먼저, 카드 나중 → confirmable
rec = run(fresh, [['see', 's6.c1'], ['see', 's6.c3']]);
assert.equal(rec.state, 'met');
rec = run(rec, [['choose', RIGHT]]);
assert.equal(rec.state, 'confirmable');

// 금지 전이
const forbid = (r, why) => { assert.equal(r.ok, false, why); assert.equal(typeof r.reason, 'string'); };
forbid(R.chooseCard(fresh, item, RIGHT), 'unseen 에서 카드 고르기');
forbid(R.confirm(fresh, item), 'unseen 확정');
forbid(R.confirm(run(fresh, [['see', 'x']]), item), 'met 확정');
forbid(R.confirm(run(fresh, [['see', 'x'], ['choose', RIGHT]]), item), 'guessed 확정(맥락 1곳)');
forbid(R.confirm(run(fresh, [['see', 'x'], ['see', 'y']]), item), '카드 없이 확정');
forbid(R.chooseCard(run(fresh, [['see', 'x']]), item, 'other.a'), '이 항목에 없는 카드');
forbid(R.chooseCard(run(fresh, [['see', 'x']]), item, null), '빈 카드');
forbid(R.seeContext(fresh, ''), '빈 맥락 id');
forbid(R.confirm(done.record, item), 'confirmed 다시 확정');
forbid(R.chooseCard(done.record, item, WRONG1), 'confirmed 뒤 카드 바꾸기');
// 끝난 항목에서 살피기는 상태를 바꾸지 않는다
const after = R.seeContext(done.record, 's6.c9');
assert.equal(after.record.state, 'confirmed');
// 원본 기록은 바뀌지 않는다(순수 함수)
assert.equal(fresh.state, 'unseen');
assert.equal(fresh.seenContexts.length, 0);

// 오답 → misread → 다른 카드로 정답 → confirmed
rec = run(fresh, [['see', 'a'], ['see', 'b'], ['choose', WRONG1]]);
let r = R.confirm(rec, item);
assert.equal(r.correct, false);
assert.equal(r.record.state, 'misread');
assert.equal(r.record.wrongs, 1);
assert.equal(r.record.helps, 1);
assert.equal(r.help, 1);
assert.equal(r.record.firstTry, false);
assert.equal(r.record.guess, null, '오답 확정 뒤 고른 카드는 비운다');
forbid(R.confirm(r.record, item), 'misread 에서 카드 없이 다시 확정');
// misread 에서 맥락을 더 봐도 misread
assert.equal(R.seeContext(r.record, 'c').record.state, 'misread');
rec = run(r.record, [['choose', RIGHT]]);
assert.equal(rec.state, 'misread');
r = R.confirm(rec, item);
assert.equal(r.record.state, 'confirmed');
assert.equal(r.record.firstTry, false, 'firstTry 는 처음 한 번만');
assert.equal(r.record.wrongs, 1);
assert.equal(r.record.helps, 1);

// 도움 사다리: 오답 1·2·3 → 도움 1·2·3, 3번째에 confirmedByHelp
rec = run(fresh, [['see', 'a'], ['see', 'b'], ['choose', WRONG1]]);
r = R.confirm(rec, item);
assert.deepEqual([r.record.state, r.help, R.helpView(item, r.record).step], ['misread', 1, 1]);
assert.equal(R.helpView(item, r.record).hint, '힌트');
assert.equal(R.helpView(item, r.record).answer, null);
rec = run(r.record, [['choose', WRONG2]]);
r = R.confirm(rec, item);
assert.deepEqual([r.record.state, r.help, r.record.wrongs], ['misread', 2, 2]);
assert.equal(R.helpView(item, r.record).step, 2);
rec = run(r.record, [['choose', WRONG1]]);
r = R.confirm(rec, item);
assert.deepEqual([r.record.state, r.help, r.record.wrongs, r.record.helps], ['confirmedByHelp', 3, 3, 3]);
assert.equal(R.helpView(item, r.record).answer, RIGHT);
assert.equal(R.isItemDone(r.record), true);
forbid(R.confirm(r.record, item), 'confirmedByHelp 다시 확정');
// 2번 틀린 뒤 정답이면 confirmed(도움으로 확정 아님)
rec = run(fresh, [['see', 'a'], ['see', 'b'], ['choose', WRONG1], ['confirm'], ['choose', WRONG2], ['confirm'], ['choose', RIGHT], ['confirm']]);
assert.deepEqual([rec.state, rec.wrongs, rec.helps, rec.firstTry], ['confirmed', 2, 2, false]);
// 도움 0단계 보기
assert.deepEqual(J(R.helpView(item, fresh)), { step: 0, hint: null, glow: null, answer: null, explain: null });

// 기록에 firstTry 가 이미 있으면(다시 하기) 바뀌지 않는다
const replayed = Object.assign(R.newItemRecord('read'), { firstTry: false });
rec = run(replayed, [['see', 'a'], ['see', 'b'], ['choose', RIGHT], ['confirm']]);
assert.equal(rec.firstTry, false);
const replayed2 = Object.assign(R.newItemRecord('read'), { firstTry: true });
rec = run(replayed2, [['see', 'a'], ['see', 'b'], ['choose', WRONG1], ['confirm']]);
assert.equal(rec.firstTry, true);

// 잘못된 종류
assert.equal(R.confirm(R.newItemRecord('task'), item).ok, false);

// ── 스스로 도움 요청 '실마리 더 보기'(S03): 한 번에 한 단계, wrongs 는 그대로, 첫 시도는 정답 아님
assert.equal(R.requestHelp(fresh, item).reason, 'unseen', '만나기 전에는 요청 못 함');
let hr = R.requestHelp(run(fresh, [['see', 'a']]), item);
assert.deepEqual([hr.ok, hr.help, hr.record.state, hr.record.helps, hr.record.wrongs, hr.record.asks, hr.record.firstTry], [true, 1, 'met', 1, 0, 1, false]);
assert.equal(R.helpView(item, hr.record).hint, '힌트');
assert.equal(fresh.helps, 0, '순수 함수');
// 고른 카드는 그대로 두고 확정할 수 있다 → 맞아도 firstTry 는 false
rec = run(hr.record, [['see', 'b'], ['choose', RIGHT], ['confirm']]);
assert.deepEqual([rec.state, rec.firstTry, rec.wrongs, rec.helps], ['confirmed', false, 0, 1]);
// 요청 → 오답 → 요청: 단계는 오답·요청 모두 하나씩 올라 3단계에서 도움으로 확정
rec = run(fresh, [['see', 'a'], ['see', 'b'], ['choose', WRONG1]]);
hr = R.requestHelp(rec, item);
assert.deepEqual([hr.record.state, hr.record.guess, hr.record.helps], ['confirmable', WRONG1, 1], '요청은 고른 카드를 지우지 않는다');
r = R.confirm(hr.record, item);
assert.deepEqual([r.record.state, r.help, r.record.wrongs, r.record.helps], ['misread', 2, 1, 2]);
assert.equal(R.helpView(item, r.record).step, 2);
hr = R.requestHelp(r.record, item);
assert.deepEqual([hr.ok, hr.help, hr.record.state, hr.record.guess, hr.record.wrongs, hr.record.asks], [true, 3, 'confirmedByHelp', null, 1, 2]);
assert.equal(R.helpView(item, hr.record).answer, RIGHT);
assert.equal(R.requestHelp(hr.record, item).reason, 'alreadyDone');
// 요청 2번 → 오답 1번이면 3단계(도움으로 확정)
rec = run(fresh, [['see', 'a'], ['see', 'b']]);
rec = R.requestHelp(R.requestHelp(rec, item).record, item).record;
rec = run(rec, [['choose', WRONG2]]);
r = R.confirm(rec, item);
assert.deepEqual([r.record.state, r.record.wrongs, r.record.helps, r.help], ['confirmedByHelp', 1, 3, 3]);
// 끝난 항목·잘못된 기록
assert.equal(R.requestHelp(run(fresh, [['see', 'a'], ['see', 'b'], ['choose', RIGHT], ['confirm']]), item).reason, 'alreadyDone');
assert.equal(R.requestHelp(null, item).ok, false);
// 다시 하기 중(firstTry 가 이미 참)이면 그대로
const rp = R.requestHelp(run(Object.assign(R.newItemRecord('read'), { firstTry: true }), [['see', 'a']]), item);
assert.equal(rp.record.firstTry, true);

// ── 카드 보이는 순서(S01): 기록 seed·항목 id 로 고정된 순열
{
  const four = readItem('x.r1', ['m'], { cards: ['a', 'b', 'c', 'd'].map((l, i) => ({ id: 'x.r1.' + l, text: l, correct: i === 0 })) });
  const o1 = R.cardOrder(four, 12345).map(c => c.id);
  assert.deepEqual(o1, R.cardOrder(four, 12345).map(c => c.id), '같은 seed·항목 → 같은 순서');
  assert.deepEqual(o1.slice().sort(), ['x.r1.a', 'x.r1.b', 'x.r1.c', 'x.r1.d'], '순열(빠짐·겹침 없음)');
  assert.deepEqual(four.cards.map(c => c.id), ['x.r1.a', 'x.r1.b', 'x.r1.c', 'x.r1.d'], '원본 배열은 그대로');
  const seeds = Array.from({ length: 40 }, (_, i) => 1 + i * 7919);
  assert.ok(new Set(seeds.map(sd => R.cardOrder(four, sd).map(c => c.id).join())).size > 4, 'seed 마다 순서가 달라진다');
  assert.deepEqual(J(R.cardOrder({ id: 'none' }, 1)), []);
}

// ── 실제 장면 데이터 전체(학교급 판 포함): 정답 카드 자리가 고르게 흩어진다 (데이터는 정답을 늘 맨 앞에 적음)
{
  const scenes = readdirSync(join(ROOT, 'js/data/scenes')).filter(f => f.endsWith('.js')).map(f => 'js/data/scenes/' + f);
  const sc = load(['js/data/rule-cards.js', 'js/data/wrong-cards.js', ...scenes]).NM.data.SCENES;
  const items = [];
  for (const s of Object.values(sc)) {
    for (const list of [s.items, ...Object.values(s.editions || {}).map(e => e && e.items)]) {
      for (const it of list || []) if (it && it.kind === 'read' && Array.isArray(it.cards)) items.push(it);
    }
  }
  assert.ok(items.length >= 60, '해독 항목 수 ' + items.length);
  assert.ok(items.every(it => it.cards.findIndex(c => c.correct) === 0), '데이터 전제: 정답 카드가 맨 앞(바뀌면 이 점검도 손볼 것)');
  for (const seed of [1, 2, 777, 123456789, 0x7fffffff]) {
    const pos = items.map(it => R.cardOrder(it, seed).findIndex(c => c.correct === true));
    assert.ok(pos.every(p => p >= 0), '정답 카드가 빠지지 않음');
    const at0 = pos.filter(p => p === 0).length;
    assert.ok(at0 < items.length * 0.6, `seed ${seed}: 맨 앞 정답 ${at0}/${items.length}`);
    assert.ok(new Set(pos).size >= 3, `seed ${seed}: 정답 자리 종류 ${[...new Set(pos)]}`);
    // 다시 불러도 같은 순서
    const sc2 = load(['js/data/rule-cards.js', 'js/data/wrong-cards.js', ...scenes]).NM.data.SCENES;
    if (seed === 777) {
      const again = [];
      for (const s of Object.values(sc2)) for (const list of [s.items, ...Object.values(s.editions || {}).map(e => e && e.items)]) for (const it of list || []) if (it && it.kind === 'read' && Array.isArray(it.cards)) again.push(R.cardOrder(it, seed).findIndex(c => c.correct === true));
      assert.deepEqual(again, pos, '새로 불러도 같은 순서');
    }
  }
}
console.log('c2 read item ok');
