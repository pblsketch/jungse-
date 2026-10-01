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
NM.data.STAGES['s12'] = {"id": "s12", "file": "js/data/scenes/s12.js", "mapKey": "s12", "gimmick": "wordRiver", "carveGlyph": "말", "bgmKey": "bgm_s12"};
NM.data.STAGES['s0'] = {"id": "s0", "file": "js/data/scenes/s0.js", "mapKey": "s0", "gimmick": "sortGlyphs", "bgmKey": "bgm_s0"};
NM.data.STAGES['s1'] = {"id": "s1", "file": "js/data/scenes/s1.js", "mapKey": "s1", "gimmick": "borrowSort", "carveGlyph": "借", "bgmKey": "bgm_s1"};
NM.data.STAGES['s4'] = {"id": "s4", "file": "js/data/scenes/s4.js", "mapKey": "s4", "gimmick": "wordCut", "carveGlyph": "〮", "bgmKey": "bgm_s4"};
NM.data.STAGES['s5'] = {"id": "s5", "file": "js/data/scenes/s5.js", "mapKey": "s5", "carveGlyph": "[ㅳ]", "bgmKey": "bgm_s5"};
NM.data.STAGES['s6'] = {"id": "s6", "file": "js/data/scenes/s6.js", "mapKey": "s6", "carveGlyph": "ㅣ", "bgmKey": "bgm_s6"};
NM.data.STAGES['s7'] = {"id": "s7", "file": "js/data/scenes/s7.js", "mapKey": "s7", "gimmick": "honorScale", "carveGlyph": "ㆁ", "bgmKey": "bgm_s7"};
NM.data.STAGES['s10'] = {"id": "s10", "file": "js/data/scenes/s10.js", "mapKey": "s10", "gimmick": "twoEraNotebook", "carveGlyph": "ㅿ", "bgmKey": "bgm_s10"};
NM.data.STAGES['s11'] = {"id": "s11", "file": "js/data/scenes/s11.js", "mapKey": "s11", "gimmick": "threeEraLink", "carveGlyph": "가", "bgmKey": "bgm_s11"};
NM.data.STAGES['s2'] = {"id": "s2", "file": "js/data/scenes/s2.js", "mapKey": "s2", "gimmick": "letterForge", "carveGlyph": "ㄱ", "bgmKey": "bgm_s2"};
NM.data.STAGES['s3'] = {"id": "s3", "file": "js/data/scenes/s3.js", "mapKey": "s3", "gimmick": "syllableBuild", "carveGlyph": "ㅘ", "bgmKey": "bgm_s3"};
NM.data.STAGES['s8'] = {"id": "s8", "file": "js/data/scenes/s8.js", "mapKey": "s8", "gimmick": "questionPair", "carveGlyph": "고", "bgmKey": "bgm_s8"};
NM.data.STAGES['s9'] = {"id": "s9", "file": "js/data/scenes/s9.js", "mapKey": "s9", "gimmick": "prefaceDecode", "carveGlyph": "정", "bgmKey": "bgm_s9"};
/* stages:end */
