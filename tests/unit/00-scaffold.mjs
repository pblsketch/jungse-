// 기본 구성 점검: 이름 공간, 장면 목록, 추천 묶음(spec §6-1)
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';
const ctx = load(['js/core/ns.js', 'js/data/stages.js']);
assert.equal(typeof ctx.NM.reportError, 'function');
assert.deepEqual([...ctx.NM.data.STAGE_IDS], ['s0','s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12']);
assert.deepEqual([...ctx.NM.data.BUNDLES.m.stages], ['s2','s3','s9','s12']);
assert.deepEqual([...ctx.NM.data.BUNDLES.h1.stages], ['s4','s5','s6','s9','s12']);
assert.deepEqual([...ctx.NM.data.BUNDLES.h1.optional], ['s10']);
assert.deepEqual([...ctx.NM.data.BUNDLES.h23.stages], ['s1','s4','s5','s6','s7','s8','s9','s10','s11','s12']);
console.log('scaffold ok');
