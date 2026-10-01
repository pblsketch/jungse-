'use strict';
/*
 * 장면 목록 (공유 등록 파일 — 물결 끝 연결 단계만 고친다).
 * 장면 id: s0(서장) ~ s12(종장). spec §19-1.
 * 각 항목: { id, file, mapKey, gimmick, carveGlyph } — 장면 데이터 파일이 생기면 연결 단계가 덧붙인다.
 * 학교급별 추천 묶음은 spec §6-1 표를 그대로 옮긴 것이다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.STAGE_IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'];
NM.data.BUNDLES = {
  m:   { stages: ['s2', 's3', 's9', 's12'], optional: [] },
  h1:  { stages: ['s4', 's5', 's6', 's9', 's12'], optional: ['s10'] },
  h23: { stages: ['s1', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12'], optional: [] }
};
NM.data.STAGES = NM.data.STAGES || {};
/* stages:start */
/* stages:end */
