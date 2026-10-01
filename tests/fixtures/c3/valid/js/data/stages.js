'use strict';
/* C3 시험용 장면 목록 (js/data/stages.js 와 같은 모양) */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.STAGE_IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];
NM.data.BUNDLES = {
  m:   { stages: ['s2', 's3', 's9', 's12'], optional: [] },
  h1:  { stages: ['s4', 's5', 's6', 's9', 's12'], optional: ['s10'] },
  h23: { stages: ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'], optional: [] }
};
NM.data.STAGES = NM.data.STAGES || {};
NM.data.STAGES.s4 = { id: 's4', file: 'js/data/scenes/s4.js', mapKey: 's4', gimmick: 'split', carveGlyph: 'ㆍ' };
