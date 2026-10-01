'use strict';
/*
 * 배경음 목록 (AU1). 키 → 상대 경로.
 * 국립국악원 「국악기 디지털 음원」(디지털 이음) 악구를 이어 붙인 곡, 공공누리 제1유형(출처표시).
 * 곡마다 원곡·악구 번호는 assets/audio/CREDITS.md, 만든 방법은 tools/bgm_build.py.
 * 모든 파일은 끝 → 처음이 이어지게 만들었다(되풀이 재생용). 음량은 모두 약 -18 LUFS.
 * NM.data.ASSETS.bgm 등록은 연결 단계가 한다(이 파일은 assets.js를 고치지 않는다).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.BGM = {
  bgm_title:  'assets/audio/bgm_title.mp3',   // 대금 풍류 「청성곡」
  bgm_select: 'assets/audio/bgm_select.mp3',  // 양금 풍류 「윗도드리」
  bgm_s0:  'assets/audio/bgm_s0.mp3',   // 대피리 창작곡 「갈잎소리」
  bgm_s1:  'assets/audio/bgm_s1.mp3',   // 대금 연례악 「수제천」
  bgm_s2:  'assets/audio/bgm_s2.mp3',   // 대금 연례악 「여민락」
  bgm_s3:  'assets/audio/bgm_s3.mp3',   // 대금 민간풍류 「경기대풍류 느린굿거리」
  bgm_s4:  'assets/audio/bgm_s4.mp3',   // 거문고 풍류 「타령」
  bgm_s5:  'assets/audio/bgm_s5.mp3',   // 해금 민간풍류 「경기대풍류 느린굿거리·잦은굿거리」
  bgm_s6:  'assets/audio/bgm_s6.mp3',   // 대금 풍류 「염불도드리」
  bgm_s7:  'assets/audio/bgm_s7.mp3',   // 피리 연례악 「수제천」
  bgm_s8:  'assets/audio/bgm_s8.mp3',   // 대금 풍류 「상령산」
  bgm_s9:  'assets/audio/bgm_s9.mp3',   // 대금 연례악 「수룡음」
  bgm_s10: 'assets/audio/bgm_s10.mp3',  // 거문고 가곡 「우조 초수대엽」
  bgm_s11: 'assets/audio/bgm_s11.mp3',  // 대금 산조 「대금산조 중중모리」
  bgm_s12: 'assets/audio/bgm_s12.mp3'   // 가야금 산조 「성금련류 가야금산조 진양조」
};
