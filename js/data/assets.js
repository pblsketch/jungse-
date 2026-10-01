'use strict';
/*
 * 그림·소리 목록 (공유 등록 파일 — 물결 끝 연결 단계만 고친다).
 * 키 → 상대 경로. 장면에 들어갈 때 그 장면 것만 불러온다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.ASSETS = NM.data.ASSETS || { bg: {}, sprites: {}, portraits: {}, cg: {}, ui: {}, bgm: {}, maps: {} };
/* assets:start */
// 배경음: js/data/bgm.js(NM.data.BGM)를 먼저 불러와 그대로 옮긴다.
Object.assign(NM.data.ASSETS.bgm, NM.data.BGM || {});
/* assets:end */
