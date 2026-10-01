// C2: 기믹 과제 상태 기계 (spec §5-3)
import assert from 'node:assert/strict';
import { boot, J, taskItem } from './c2-fixtures.mjs';

const ctx = boot();
const R = ctx.NM.core.rules;
const item = taskItem('s4.t1', ['h1']);
const fresh = R.newItemRecord('task');

// 바로 맞음 → done
let r = R.submit(fresh, true);
assert.equal(r.ok, true);
assert.deepEqual(J(r.record), { kind: 'task', state: 'done', wrongs: 0, helps: 0, firstTry: true });
assert.equal(r.correct, true);
assert.equal(R.isItemDone(r.record), true);
assert.equal(R.submit(r.record, true).ok, false, 'done 다시 제출 금지');

// 틀림 → open(도움 1) → 틀림 → open(도움 2) → 맞음 → done
r = R.submit(fresh, false);
assert.deepEqual([r.record.state, r.record.wrongs, r.record.helps, r.help, r.record.firstTry], ['open', 1, 1, 1, false]);
assert.equal(R.helpView(item, r.record).hint, '힌트');
r = R.submit(r.record, false);
assert.deepEqual([r.record.state, r.record.wrongs, r.help], ['open', 2, 2]);
r = R.submit(r.record, true);
assert.deepEqual([r.record.state, r.record.wrongs, r.record.helps, r.record.firstTry], ['done', 2, 2, false]);

// 3번째 틀린 제출 → doneByHelp
r = R.submit(fresh, false); r = R.submit(r.record, false); r = R.submit(r.record, false);
assert.deepEqual([r.record.state, r.record.wrongs, r.record.helps, r.help], ['doneByHelp', 3, 3, 3]);
assert.equal(R.helpView(item, r.record).answer, 1);
assert.equal(R.isItemDone(r.record), true);
assert.equal(R.submit(r.record, false).ok, false, 'doneByHelp 다시 제출 금지');

// 판정 값은 참/거짓만
assert.equal(R.submit(fresh, 'yes').ok, false);
// 해독 항목 기록에 제출 금지
assert.equal(R.submit(R.newItemRecord('read'), true).ok, false);
// 순수 함수
assert.equal(fresh.state, 'open');
// firstTry 유지(다시 하기)
const replayed = Object.assign(R.newItemRecord('task'), { firstTry: true });
assert.equal(R.submit(replayed, false).record.firstTry, true);
console.log('c2 task item ok');
