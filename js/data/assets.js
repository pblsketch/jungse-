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
// 인물(A2): 스프라이트 아틀라스(png+json, tools/process_sprites.py)와 초상. 초상 키는 <인물>_<표정>.
Object.assign(NM.data.ASSETS.sprites, {
  anc_child: { png: 'assets/sprites/anc_child.png', json: 'assets/sprites/anc_child.json' },
  anc_man: { png: 'assets/sprites/anc_man.png', json: 'assets/sprites/anc_man.json' },
  anc_scribe: { png: 'assets/sprites/anc_scribe.png', json: 'assets/sprites/anc_scribe.json' },
  anc_woman: { png: 'assets/sprites/anc_woman.png', json: 'assets/sprites/anc_woman.json' },
  artisan: { png: 'assets/sprites/artisan.png', json: 'assets/sprites/artisan.json' },
  child: { png: 'assets/sprites/child.png', json: 'assets/sprites/child.json' },
  commoner_man: { png: 'assets/sprites/commoner_man.png', json: 'assets/sprites/commoner_man.json' },
  commoner_woman: { png: 'assets/sprites/commoner_woman.png', json: 'assets/sprites/commoner_woman.json' },
  editor_1896: { png: 'assets/sprites/editor_1896.png', json: 'assets/sprites/editor_1896.json' },
  elder: { png: 'assets/sprites/elder.png', json: 'assets/sprites/elder.json' },
  hero_1: { png: 'assets/sprites/hero_1.png', json: 'assets/sprites/hero_1.json' },
  hero_2: { png: 'assets/sprites/hero_2.png', json: 'assets/sprites/hero_2.json' },
  hero_3: { png: 'assets/sprites/hero_3.png', json: 'assets/sprites/hero_3.json' },
  hero_4: { png: 'assets/sprites/hero_4.png', json: 'assets/sprites/hero_4.json' },
  merchant: { png: 'assets/sprites/merchant.png', json: 'assets/sprites/merchant.json' },
  monk: { png: 'assets/sprites/monk.png', json: 'assets/sprites/monk.json' },
  newsboy_1896: { png: 'assets/sprites/newsboy_1896.png', json: 'assets/sprites/newsboy_1896.json' },
  noblewoman_18c: { png: 'assets/sprites/noblewoman_18c.png', json: 'assets/sprites/noblewoman_18c.json' },
  official: { png: 'assets/sprites/official.png', json: 'assets/sprites/official.json' },
  sejong: { png: 'assets/sprites/sejong.png', json: 'assets/sprites/sejong.json' },
  senior_tongsa: { png: 'assets/sprites/senior_tongsa.png', json: 'assets/sprites/senior_tongsa.json' },
  student_16c: { png: 'assets/sprites/student_16c.png', json: 'assets/sprites/student_16c.json' },
  teacher_16c: { png: 'assets/sprites/teacher_16c.png', json: 'assets/sprites/teacher_16c.json' },
  teacher_modern: { png: 'assets/sprites/teacher_modern.png', json: 'assets/sprites/teacher_modern.json' },
  yangban_man: { png: 'assets/sprites/yangban_man.png', json: 'assets/sprites/yangban_man.json' },
  yangban_woman: { png: 'assets/sprites/yangban_woman.png', json: 'assets/sprites/yangban_woman.json' },
  yeokgwan_18c: { png: 'assets/sprites/yeokgwan_18c.png', json: 'assets/sprites/yeokgwan_18c.json' },
});
Object.assign(NM.data.ASSETS.portraits, {
  anc_child: 'assets/portraits/anc_child.webp',
  anc_man: 'assets/portraits/anc_man.webp',
  anc_scribe: 'assets/portraits/anc_scribe.webp',
  anc_woman: 'assets/portraits/anc_woman.webp',
  artisan: 'assets/portraits/artisan.webp',
  child: 'assets/portraits/child.webp',
  commoner_man: 'assets/portraits/commoner_man.webp',
  commoner_woman: 'assets/portraits/commoner_woman.webp',
  editor_1896: 'assets/portraits/editor_1896.webp',
  elder: 'assets/portraits/elder.webp',
  hero_1_neutral: 'assets/portraits/hero_1_neutral.webp',
  hero_1_smile: 'assets/portraits/hero_1_smile.webp',
  hero_1_surprised: 'assets/portraits/hero_1_surprised.webp',
  hero_1_thinking: 'assets/portraits/hero_1_thinking.webp',
  hero_2_neutral: 'assets/portraits/hero_2_neutral.webp',
  hero_2_smile: 'assets/portraits/hero_2_smile.webp',
  hero_2_surprised: 'assets/portraits/hero_2_surprised.webp',
  hero_2_thinking: 'assets/portraits/hero_2_thinking.webp',
  hero_3_neutral: 'assets/portraits/hero_3_neutral.webp',
  hero_3_smile: 'assets/portraits/hero_3_smile.webp',
  hero_3_surprised: 'assets/portraits/hero_3_surprised.webp',
  hero_3_thinking: 'assets/portraits/hero_3_thinking.webp',
  hero_4_neutral: 'assets/portraits/hero_4_neutral.webp',
  hero_4_smile: 'assets/portraits/hero_4_smile.webp',
  hero_4_surprised: 'assets/portraits/hero_4_surprised.webp',
  hero_4_thinking: 'assets/portraits/hero_4_thinking.webp',
  merchant: 'assets/portraits/merchant.webp',
  monk: 'assets/portraits/monk.webp',
  newsboy_1896: 'assets/portraits/newsboy_1896.webp',
  noblewoman_18c: 'assets/portraits/noblewoman_18c.webp',
  official: 'assets/portraits/official.webp',
  sejong_full: 'assets/portraits/sejong_full.webp',
  sejong_neutral: 'assets/portraits/sejong_neutral.webp',
  sejong_smile: 'assets/portraits/sejong_smile.webp',
  senior_tongsa_full: 'assets/portraits/senior_tongsa_full.webp',
  senior_tongsa_neutral: 'assets/portraits/senior_tongsa_neutral.webp',
  senior_tongsa_smile: 'assets/portraits/senior_tongsa_smile.webp',
  senior_tongsa_surprised: 'assets/portraits/senior_tongsa_surprised.webp',
  senior_tongsa_thinking: 'assets/portraits/senior_tongsa_thinking.webp',
  student_16c: 'assets/portraits/student_16c.webp',
  teacher_16c: 'assets/portraits/teacher_16c.webp',
  teacher_modern_neutral: 'assets/portraits/teacher_modern_neutral.webp',
  teacher_modern_smile: 'assets/portraits/teacher_modern_smile.webp',
  teacher_modern_surprised: 'assets/portraits/teacher_modern_surprised.webp',
  teacher_modern_thinking: 'assets/portraits/teacher_modern_thinking.webp',
  yangban_man: 'assets/portraits/yangban_man.webp',
  yangban_woman: 'assets/portraits/yangban_woman.webp',
  yeokgwan_18c: 'assets/portraits/yeokgwan_18c.webp',
  // 주인공 고르기 화면용 별칭(1~4번 주인공 = hero_1~4 기본 표정)
  p1: 'assets/portraits/hero_1_neutral.webp',
  p2: 'assets/portraits/hero_2_neutral.webp',
  p3: 'assets/portraits/hero_3_neutral.webp',
  p4: 'assets/portraits/hero_4_neutral.webp',
});
// 맵 배경(A3). 맵 파일은 maps/<장면>.json 규칙으로 찾는다.
Object.assign(NM.data.ASSETS.bg, {
  s0: 'assets/bg/s0.webp',
  s1: 'assets/bg/s1.webp',
  s2: 'assets/bg/s2.webp',
  s3: 'assets/bg/s3.webp',
  s4: 'assets/bg/s4.webp',
  s5: 'assets/bg/s5.webp',
  s6: 'assets/bg/s6.webp',
  s7: 'assets/bg/s7.webp',
  s8: 'assets/bg/s8.webp',
  s9: 'assets/bg/s9.webp',
  s10: 'assets/bg/s10.webp',
  s11: 'assets/bg/s11.webp',
  s12: 'assets/bg/s12.webp',
});
// 장면 그림(A4): <장면>_intro / <장면>_climax, 오해 장면 반응 그림 mis_*.
Object.assign(NM.data.ASSETS.cg, {
  mis_child_laughing: 'assets/cg/mis_child_laughing.webp',
  mis_commoner_puzzled: 'assets/cg/mis_commoner_puzzled.webp',
  mis_monk_bemused: 'assets/cg/mis_monk_bemused.webp',
  mis_official_confused: 'assets/cg/mis_official_confused.webp',
  mis_woman_flustered: 'assets/cg/mis_woman_flustered.webp',
  mis_yangban_offended: 'assets/cg/mis_yangban_offended.webp',
  s0_climax: 'assets/cg/s0_climax.webp',
  s0_intro: 'assets/cg/s0_intro.webp',
  s10_climax: 'assets/cg/s10_climax.webp',
  s10_intro: 'assets/cg/s10_intro.webp',
  s11_climax: 'assets/cg/s11_climax.webp',
  s11_intro: 'assets/cg/s11_intro.webp',
  s12_climax: 'assets/cg/s12_climax.webp',
  s12_intro: 'assets/cg/s12_intro.webp',
  s1_climax: 'assets/cg/s1_climax.webp',
  s1_intro: 'assets/cg/s1_intro.webp',
  s2_climax: 'assets/cg/s2_climax.webp',
  s2_intro: 'assets/cg/s2_intro.webp',
  s3_climax: 'assets/cg/s3_climax.webp',
  s3_intro: 'assets/cg/s3_intro.webp',
  s4_climax: 'assets/cg/s4_climax.webp',
  s4_intro: 'assets/cg/s4_intro.webp',
  s5_climax: 'assets/cg/s5_climax.webp',
  s5_intro: 'assets/cg/s5_intro.webp',
  s6_climax: 'assets/cg/s6_climax.webp',
  s6_intro: 'assets/cg/s6_intro.webp',
  s7_climax: 'assets/cg/s7_climax.webp',
  s7_intro: 'assets/cg/s7_intro.webp',
  s8_climax: 'assets/cg/s8_climax.webp',
  s8_intro: 'assets/cg/s8_intro.webp',
  s9_climax: 'assets/cg/s9_climax.webp',
  s9_intro: 'assets/cg/s9_intro.webp',
});
// UI 그림(A4): 아이콘·대표 이미지.
Object.assign(NM.data.ASSETS.ui, {
  og: 'assets/ui/og.jpg', app192: 'assets/ui/app-192.png', app512: 'assets/ui/app-512.png',
  notebook: 'assets/ui/icon_notebook.png', settings: 'assets/ui/icon_settings.png', rulecard: 'assets/ui/icon_rulecard.png',
  dictionary: 'assets/ui/icon_dictionary.png', plaque: 'assets/ui/icon_plaque.png', hint: 'assets/ui/icon_hint.png',
  map: 'assets/ui/icon_map.png', soundOn: 'assets/ui/icon_sound_on.png', soundOff: 'assets/ui/icon_sound_off.png',
  // 첫 화면 배경 그림: 넓은 화면용·세로 화면용(assets/raw/gen/ui_title_wide·tall.png 를 웹용 webp 로 줄인 것)
  titleBg: 'assets/ui/title-bg.webp', titleBgTall: 'assets/ui/title-bg-tall.webp',
  // 종이 화면 바탕 한지 무늬(거울 반복 타일 — 이음매 없음)
  paper: 'assets/ui/paper.webp',
  // 학교급 고르기 카드 그림(중학교·고1·고2~3)
  levelM: 'assets/ui/level_m.webp', levelH1: 'assets/ui/level_h1.webp', levelH23: 'assets/ui/level_h23.webp'
});
// 장면 고르기 카드의 작은 그림(장면 첫 그림 assets/cg/<id>_intro.webp 를 320×240 으로 줄인 것)
NM.data.ASSETS.thumbs = Object.assign(NM.data.ASSETS.thumbs || {}, {
  s0: 'assets/ui/thumbs/s0.webp', s1: 'assets/ui/thumbs/s1.webp', s2: 'assets/ui/thumbs/s2.webp', s3: 'assets/ui/thumbs/s3.webp',
  s4: 'assets/ui/thumbs/s4.webp', s5: 'assets/ui/thumbs/s5.webp', s6: 'assets/ui/thumbs/s6.webp', s7: 'assets/ui/thumbs/s7.webp',
  s8: 'assets/ui/thumbs/s8.webp', s9: 'assets/ui/thumbs/s9.webp', s10: 'assets/ui/thumbs/s10.webp', s11: 'assets/ui/thumbs/s11.webp',
  s12: 'assets/ui/thumbs/s12.webp'
});
/* assets:end */
