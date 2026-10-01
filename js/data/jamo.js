'use strict';
/*
 * 옛한글 자모 표 NM.data.JAMO — NM.core.yet(js/core/yet.js)이 읽는다. 고치거나 늘릴 때는 여기만 고친다.
 *
 * ■ 원자(atom)와 원자 열쇠
 *   - 자음 원자: ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ ㅿ ㆁ ㆆ + 치두음 ᄼ ᅎ ᅔ / 정치음 ᄾ ᅐ ᅕ (이 여섯은 첫소리 자모 글자를 그대로 원자로 쓴다)
 *   - 모음 원자: ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ ㆍ
 *   - 모든 자모는 원자를 늘어놓은 "원자 열쇠"로 적는다.
 *       쌍자음 ㄲ = 'ㄱㄱ', 합용병서 ᄢ = 'ㅂㅅㄱ', 순경음(연서) ᄫ = 'ㅂㅇ' (아래 ㅇ을 뒤에 붙임),
 *       겹모음 ㅐ = 'ㅏㅣ', ㅘ = 'ㅗㅏ', ㆎ = 'ㆍㅣ', ㆉ = 'ㅛㅣ' …
 *   - 대괄호 표기 [ㅂㅅㄱㅜㄹ] 의 글자들은 COMPAT(호환 자모 → 원자 열쇠)와 CHO/JUNG/JONG 역표(첫·가운뎃·끝소리 자모 → 원자 열쇠)로
 *     원자열이 된 뒤 [자음…][모음…][자음…] 으로 나뉘어 아래 표에서 찾는다. 표에 없으면 조합 실패(오류)다.
 *
 * ■ 표의 출처
 *   CHO/JUNG/JONG/COMPAT 은 유니코드 16.0 문자 이름(HANGUL CHOSEONG PIEUP-SIOS-KIYEOK 등)을 원자로 풀어 기계적으로 만들었다.
 *   (SSANG = 같은 원자 둘, KAPYEOUN = 뒤에 ㅇ, '-' = 이어 붙임) 표 안에 겹치는 열쇠는 없다.
 *   CHO 124자 · JUNG 94자 · JONG 137자 = U+1100–11FF, U+A960–A97C, U+D7B0–D7C6, U+D7CB–D7FB 의 채움 문자를 뺀 전부.
 *
 * ■ READING: 화면 읽기(aria-label)용 현대 글자 바꾸기 규칙 — 접근성 보조일 뿐 채점과 무관하다. yet.js modernReading 참고.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.JAMO = {
  CONSONANTS: 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅿㆁㆆ\u113C\u114E\u1154\u113E\u1150\u1155',
  VOWELS: 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㆍ',
  FILLER_CHO: '\u115F',
  FILLER_JUNG: '\u1160',
  // 초성: 원자 열쇠 → 첫소리 자모 (U+1100–115E, U+A960–A97C)
  CHO: {
    'ㄱ': '\u1100', // ᄀ KIYEOK
    'ㄱㄱ': '\u1101', // ᄁ SSANGKIYEOK
    'ㄴ': '\u1102', // ᄂ NIEUN
    'ㄷ': '\u1103', // ᄃ TIKEUT
    'ㄷㄷ': '\u1104', // ᄄ SSANGTIKEUT
    'ㄹ': '\u1105', // ᄅ RIEUL
    'ㅁ': '\u1106', // ᄆ MIEUM
    'ㅂ': '\u1107', // ᄇ PIEUP
    'ㅂㅂ': '\u1108', // ᄈ SSANGPIEUP
    'ㅅ': '\u1109', // ᄉ SIOS
    'ㅅㅅ': '\u110A', // ᄊ SSANGSIOS
    'ㅇ': '\u110B', // ᄋ IEUNG
    'ㅈ': '\u110C', // ᄌ CIEUC
    'ㅈㅈ': '\u110D', // ᄍ SSANGCIEUC
    'ㅊ': '\u110E', // ᄎ CHIEUCH
    'ㅋ': '\u110F', // ᄏ KHIEUKH
    'ㅌ': '\u1110', // ᄐ THIEUTH
    'ㅍ': '\u1111', // ᄑ PHIEUPH
    'ㅎ': '\u1112', // ᄒ HIEUH
    'ㄴㄱ': '\u1113', // ᄓ NIEUN-KIYEOK
    'ㄴㄴ': '\u1114', // ᄔ SSANGNIEUN
    'ㄴㄷ': '\u1115', // ᄕ NIEUN-TIKEUT
    'ㄴㅂ': '\u1116', // ᄖ NIEUN-PIEUP
    'ㄷㄱ': '\u1117', // ᄗ TIKEUT-KIYEOK
    'ㄹㄴ': '\u1118', // ᄘ RIEUL-NIEUN
    'ㄹㄹ': '\u1119', // ᄙ SSANGRIEUL
    'ㄹㅎ': '\u111A', // ᄚ RIEUL-HIEUH
    'ㄹㅇ': '\u111B', // ᄛ KAPYEOUNRIEUL
    'ㅁㅂ': '\u111C', // ᄜ MIEUM-PIEUP
    'ㅁㅇ': '\u111D', // ᄝ KAPYEOUNMIEUM
    'ㅂㄱ': '\u111E', // ᄞ PIEUP-KIYEOK
    'ㅂㄴ': '\u111F', // ᄟ PIEUP-NIEUN
    'ㅂㄷ': '\u1120', // ᄠ PIEUP-TIKEUT
    'ㅂㅅ': '\u1121', // ᄡ PIEUP-SIOS
    'ㅂㅅㄱ': '\u1122', // ᄢ PIEUP-SIOS-KIYEOK
    'ㅂㅅㄷ': '\u1123', // ᄣ PIEUP-SIOS-TIKEUT
    'ㅂㅅㅂ': '\u1124', // ᄤ PIEUP-SIOS-PIEUP
    'ㅂㅅㅅ': '\u1125', // ᄥ PIEUP-SSANGSIOS
    'ㅂㅅㅈ': '\u1126', // ᄦ PIEUP-SIOS-CIEUC
    'ㅂㅈ': '\u1127', // ᄧ PIEUP-CIEUC
    'ㅂㅊ': '\u1128', // ᄨ PIEUP-CHIEUCH
    'ㅂㅌ': '\u1129', // ᄩ PIEUP-THIEUTH
    'ㅂㅍ': '\u112A', // ᄪ PIEUP-PHIEUPH
    'ㅂㅇ': '\u112B', // ᄫ KAPYEOUNPIEUP
    'ㅂㅂㅇ': '\u112C', // ᄬ KAPYEOUNSSANGPIEUP
    'ㅅㄱ': '\u112D', // ᄭ SIOS-KIYEOK
    'ㅅㄴ': '\u112E', // ᄮ SIOS-NIEUN
    'ㅅㄷ': '\u112F', // ᄯ SIOS-TIKEUT
    'ㅅㄹ': '\u1130', // ᄰ SIOS-RIEUL
    'ㅅㅁ': '\u1131', // ᄱ SIOS-MIEUM
    'ㅅㅂ': '\u1132', // ᄲ SIOS-PIEUP
    'ㅅㅂㄱ': '\u1133', // ᄳ SIOS-PIEUP-KIYEOK
    'ㅅㅅㅅ': '\u1134', // ᄴ SIOS-SSANGSIOS
    'ㅅㅇ': '\u1135', // ᄵ SIOS-IEUNG
    'ㅅㅈ': '\u1136', // ᄶ SIOS-CIEUC
    'ㅅㅊ': '\u1137', // ᄷ SIOS-CHIEUCH
    'ㅅㅋ': '\u1138', // ᄸ SIOS-KHIEUKH
    'ㅅㅌ': '\u1139', // ᄹ SIOS-THIEUTH
    'ㅅㅍ': '\u113A', // ᄺ SIOS-PHIEUPH
    'ㅅㅎ': '\u113B', // ᄻ SIOS-HIEUH
    '\u113C': '\u113C', // ᄼ CHITUEUMSIOS
    '\u113C\u113C': '\u113D', // ᄽ CHITUEUMSSANGSIOS
    '\u113E': '\u113E', // ᄾ CEONGCHIEUMSIOS
    '\u113E\u113E': '\u113F', // ᄿ CEONGCHIEUMSSANGSIOS
    'ㅿ': '\u1140', // ᅀ PANSIOS
    'ㅇㄱ': '\u1141', // ᅁ IEUNG-KIYEOK
    'ㅇㄷ': '\u1142', // ᅂ IEUNG-TIKEUT
    'ㅇㅁ': '\u1143', // ᅃ IEUNG-MIEUM
    'ㅇㅂ': '\u1144', // ᅄ IEUNG-PIEUP
    'ㅇㅅ': '\u1145', // ᅅ IEUNG-SIOS
    'ㅇㅿ': '\u1146', // ᅆ IEUNG-PANSIOS
    'ㅇㅇ': '\u1147', // ᅇ SSANGIEUNG
    'ㅇㅈ': '\u1148', // ᅈ IEUNG-CIEUC
    'ㅇㅊ': '\u1149', // ᅉ IEUNG-CHIEUCH
    'ㅇㅌ': '\u114A', // ᅊ IEUNG-THIEUTH
    'ㅇㅍ': '\u114B', // ᅋ IEUNG-PHIEUPH
    'ㆁ': '\u114C', // ᅌ YESIEUNG
    'ㅈㅇ': '\u114D', // ᅍ CIEUC-IEUNG
    '\u114E': '\u114E', // ᅎ CHITUEUMCIEUC
    '\u114E\u114E': '\u114F', // ᅏ CHITUEUMSSANGCIEUC
    '\u1150': '\u1150', // ᅐ CEONGCHIEUMCIEUC
    '\u1150\u1150': '\u1151', // ᅑ CEONGCHIEUMSSANGCIEUC
    'ㅊㅋ': '\u1152', // ᅒ CHIEUCH-KHIEUKH
    'ㅊㅎ': '\u1153', // ᅓ CHIEUCH-HIEUH
    '\u1154': '\u1154', // ᅔ CHITUEUMCHIEUCH
    '\u1155': '\u1155', // ᅕ CEONGCHIEUMCHIEUCH
    'ㅍㅂ': '\u1156', // ᅖ PHIEUPH-PIEUP
    'ㅍㅇ': '\u1157', // ᅗ KAPYEOUNPHIEUPH
    'ㅎㅎ': '\u1158', // ᅘ SSANGHIEUH
    'ㆆ': '\u1159', // ᅙ YEORINHIEUH
    'ㄱㄷ': '\u115A', // ᅚ KIYEOK-TIKEUT
    'ㄴㅅ': '\u115B', // ᅛ NIEUN-SIOS
    'ㄴㅈ': '\u115C', // ᅜ NIEUN-CIEUC
    'ㄴㅎ': '\u115D', // ᅝ NIEUN-HIEUH
    'ㄷㄹ': '\u115E', // ᅞ TIKEUT-RIEUL
    'ㄷㅁ': '\uA960', // ꥠ TIKEUT-MIEUM
    'ㄷㅂ': '\uA961', // ꥡ TIKEUT-PIEUP
    'ㄷㅅ': '\uA962', // ꥢ TIKEUT-SIOS
    'ㄷㅈ': '\uA963', // ꥣ TIKEUT-CIEUC
    'ㄹㄱ': '\uA964', // ꥤ RIEUL-KIYEOK
    'ㄹㄱㄱ': '\uA965', // ꥥ RIEUL-SSANGKIYEOK
    'ㄹㄷ': '\uA966', // ꥦ RIEUL-TIKEUT
    'ㄹㄷㄷ': '\uA967', // ꥧ RIEUL-SSANGTIKEUT
    'ㄹㅁ': '\uA968', // ꥨ RIEUL-MIEUM
    'ㄹㅂ': '\uA969', // ꥩ RIEUL-PIEUP
    'ㄹㅂㅂ': '\uA96A', // ꥪ RIEUL-SSANGPIEUP
    'ㄹㅂㅇ': '\uA96B', // ꥫ RIEUL-KAPYEOUNPIEUP
    'ㄹㅅ': '\uA96C', // ꥬ RIEUL-SIOS
    'ㄹㅈ': '\uA96D', // ꥭ RIEUL-CIEUC
    'ㄹㅋ': '\uA96E', // ꥮ RIEUL-KHIEUKH
    'ㅁㄱ': '\uA96F', // ꥯ MIEUM-KIYEOK
    'ㅁㄷ': '\uA970', // ꥰ MIEUM-TIKEUT
    'ㅁㅅ': '\uA971', // ꥱ MIEUM-SIOS
    'ㅂㅅㅌ': '\uA972', // ꥲ PIEUP-SIOS-THIEUTH
    'ㅂㅋ': '\uA973', // ꥳ PIEUP-KHIEUKH
    'ㅂㅎ': '\uA974', // ꥴ PIEUP-HIEUH
    'ㅅㅅㅂ': '\uA975', // ꥵ SSANGSIOS-PIEUP
    'ㅇㄹ': '\uA976', // ꥶ IEUNG-RIEUL
    'ㅇㅎ': '\uA977', // ꥷ IEUNG-HIEUH
    'ㅈㅈㅎ': '\uA978', // ꥸ SSANGCIEUC-HIEUH
    'ㅌㅌ': '\uA979', // ꥹ SSANGTHIEUTH
    'ㅍㅎ': '\uA97A', // ꥺ PHIEUPH-HIEUH
    'ㅎㅅ': '\uA97B', // ꥻ HIEUH-SIOS
    'ㆆㆆ': '\uA97C'  // ꥼ SSANGYEORINHIEUH
  },
  // 중성: 원자 열쇠 → 가운뎃소리 자모 (U+1161–11A7, U+D7B0–D7C6)
  JUNG: {
    'ㅏ': '\u1161', // ◌ᅡ A
    'ㅏㅣ': '\u1162', // ◌ᅢ AE
    'ㅑ': '\u1163', // ◌ᅣ YA
    'ㅑㅣ': '\u1164', // ◌ᅤ YAE
    'ㅓ': '\u1165', // ◌ᅥ EO
    'ㅓㅣ': '\u1166', // ◌ᅦ E
    'ㅕ': '\u1167', // ◌ᅧ YEO
    'ㅕㅣ': '\u1168', // ◌ᅨ YE
    'ㅗ': '\u1169', // ◌ᅩ O
    'ㅗㅏ': '\u116A', // ◌ᅪ WA
    'ㅗㅏㅣ': '\u116B', // ◌ᅫ WAE
    'ㅗㅣ': '\u116C', // ◌ᅬ OE
    'ㅛ': '\u116D', // ◌ᅭ YO
    'ㅜ': '\u116E', // ◌ᅮ U
    'ㅜㅓ': '\u116F', // ◌ᅯ WEO
    'ㅜㅓㅣ': '\u1170', // ◌ᅰ WE
    'ㅜㅣ': '\u1171', // ◌ᅱ WI
    'ㅠ': '\u1172', // ◌ᅲ YU
    'ㅡ': '\u1173', // ◌ᅳ EU
    'ㅡㅣ': '\u1174', // ◌ᅴ YI
    'ㅣ': '\u1175', // ◌ᅵ I
    'ㅏㅗ': '\u1176', // ◌ᅶ A-O
    'ㅏㅜ': '\u1177', // ◌ᅷ A-U
    'ㅑㅗ': '\u1178', // ◌ᅸ YA-O
    'ㅑㅛ': '\u1179', // ◌ᅹ YA-YO
    'ㅓㅗ': '\u117A', // ◌ᅺ EO-O
    'ㅓㅜ': '\u117B', // ◌ᅻ EO-U
    'ㅓㅡ': '\u117C', // ◌ᅼ EO-EU
    'ㅕㅗ': '\u117D', // ◌ᅽ YEO-O
    'ㅕㅜ': '\u117E', // ◌ᅾ YEO-U
    'ㅗㅓ': '\u117F', // ◌ᅿ O-EO
    'ㅗㅓㅣ': '\u1180', // ◌ᆀ O-E
    'ㅗㅕㅣ': '\u1181', // ◌ᆁ O-YE
    'ㅗㅗ': '\u1182', // ◌ᆂ O-O
    'ㅗㅜ': '\u1183', // ◌ᆃ O-U
    'ㅛㅑ': '\u1184', // ◌ᆄ YO-YA
    'ㅛㅑㅣ': '\u1185', // ◌ᆅ YO-YAE
    'ㅛㅕ': '\u1186', // ◌ᆆ YO-YEO
    'ㅛㅗ': '\u1187', // ◌ᆇ YO-O
    'ㅛㅣ': '\u1188', // ◌ᆈ YO-I
    'ㅜㅏ': '\u1189', // ◌ᆉ U-A
    'ㅜㅏㅣ': '\u118A', // ◌ᆊ U-AE
    'ㅜㅓㅡ': '\u118B', // ◌ᆋ U-EO-EU
    'ㅜㅕㅣ': '\u118C', // ◌ᆌ U-YE
    'ㅜㅜ': '\u118D', // ◌ᆍ U-U
    'ㅠㅏ': '\u118E', // ◌ᆎ YU-A
    'ㅠㅓ': '\u118F', // ◌ᆏ YU-EO
    'ㅠㅓㅣ': '\u1190', // ◌ᆐ YU-E
    'ㅠㅕ': '\u1191', // ◌ᆑ YU-YEO
    'ㅠㅕㅣ': '\u1192', // ◌ᆒ YU-YE
    'ㅠㅜ': '\u1193', // ◌ᆓ YU-U
    'ㅠㅣ': '\u1194', // ◌ᆔ YU-I
    'ㅡㅜ': '\u1195', // ◌ᆕ EU-U
    'ㅡㅡ': '\u1196', // ◌ᆖ EU-EU
    'ㅡㅣㅜ': '\u1197', // ◌ᆗ YI-U
    'ㅣㅏ': '\u1198', // ◌ᆘ I-A
    'ㅣㅑ': '\u1199', // ◌ᆙ I-YA
    'ㅣㅗ': '\u119A', // ◌ᆚ I-O
    'ㅣㅜ': '\u119B', // ◌ᆛ I-U
    'ㅣㅡ': '\u119C', // ◌ᆜ I-EU
    'ㅣㆍ': '\u119D', // ◌ᆝ I-ARAEA
    'ㆍ': '\u119E', // ◌ᆞ ARAEA
    'ㆍㅓ': '\u119F', // ◌ᆟ ARAEA-EO
    'ㆍㅜ': '\u11A0', // ◌ᆠ ARAEA-U
    'ㆍㅣ': '\u11A1', // ◌ᆡ ARAEA-I
    'ㆍㆍ': '\u11A2', // ◌ᆢ SSANGARAEA
    'ㅏㅡ': '\u11A3', // ◌ᆣ A-EU
    'ㅑㅜ': '\u11A4', // ◌ᆤ YA-U
    'ㅕㅑ': '\u11A5', // ◌ᆥ YEO-YA
    'ㅗㅑ': '\u11A6', // ◌ᆦ O-YA
    'ㅗㅑㅣ': '\u11A7', // ◌ᆧ O-YAE
    'ㅗㅕ': '\uD7B0', // ◌ힰ O-YEO
    'ㅗㅗㅣ': '\uD7B1', // ◌ힱ O-O-I
    'ㅛㅏ': '\uD7B2', // ◌ힲ YO-A
    'ㅛㅏㅣ': '\uD7B3', // ◌ힳ YO-AE
    'ㅛㅓ': '\uD7B4', // ◌ힴ YO-EO
    'ㅜㅕ': '\uD7B5', // ◌ힵ U-YEO
    'ㅜㅣㅣ': '\uD7B6', // ◌ힶ U-I-I
    'ㅠㅏㅣ': '\uD7B7', // ◌ힷ YU-AE
    'ㅠㅗ': '\uD7B8', // ◌ힸ YU-O
    'ㅡㅏ': '\uD7B9', // ◌ힹ EU-A
    'ㅡㅓ': '\uD7BA', // ◌ힺ EU-EO
    'ㅡㅓㅣ': '\uD7BB', // ◌ힻ EU-E
    'ㅡㅗ': '\uD7BC', // ◌ힼ EU-O
    'ㅣㅑㅗ': '\uD7BD', // ◌ힽ I-YA-O
    'ㅣㅑㅣ': '\uD7BE', // ◌ힾ I-YAE
    'ㅣㅕ': '\uD7BF', // ◌ힿ I-YEO
    'ㅣㅕㅣ': '\uD7C0', // ◌ퟀ I-YE
    'ㅣㅗㅣ': '\uD7C1', // ◌ퟁ I-O-I
    'ㅣㅛ': '\uD7C2', // ◌ퟂ I-YO
    'ㅣㅠ': '\uD7C3', // ◌ퟃ I-YU
    'ㅣㅣ': '\uD7C4', // ◌ퟄ I-I
    'ㆍㅏ': '\uD7C5', // ◌ퟅ ARAEA-A
    'ㆍㅓㅣ': '\uD7C6'  // ◌ퟆ ARAEA-E
  },
  // 종성: 원자 열쇠 → 끝소리 자모 (U+11A8–11FF, U+D7CB–D7FB)
  JONG: {
    'ㄱ': '\u11A8', // ◌ᆨ KIYEOK
    'ㄱㄱ': '\u11A9', // ◌ᆩ SSANGKIYEOK
    'ㄱㅅ': '\u11AA', // ◌ᆪ KIYEOK-SIOS
    'ㄴ': '\u11AB', // ◌ᆫ NIEUN
    'ㄴㅈ': '\u11AC', // ◌ᆬ NIEUN-CIEUC
    'ㄴㅎ': '\u11AD', // ◌ᆭ NIEUN-HIEUH
    'ㄷ': '\u11AE', // ◌ᆮ TIKEUT
    'ㄹ': '\u11AF', // ◌ᆯ RIEUL
    'ㄹㄱ': '\u11B0', // ◌ᆰ RIEUL-KIYEOK
    'ㄹㅁ': '\u11B1', // ◌ᆱ RIEUL-MIEUM
    'ㄹㅂ': '\u11B2', // ◌ᆲ RIEUL-PIEUP
    'ㄹㅅ': '\u11B3', // ◌ᆳ RIEUL-SIOS
    'ㄹㅌ': '\u11B4', // ◌ᆴ RIEUL-THIEUTH
    'ㄹㅍ': '\u11B5', // ◌ᆵ RIEUL-PHIEUPH
    'ㄹㅎ': '\u11B6', // ◌ᆶ RIEUL-HIEUH
    'ㅁ': '\u11B7', // ◌ᆷ MIEUM
    'ㅂ': '\u11B8', // ◌ᆸ PIEUP
    'ㅂㅅ': '\u11B9', // ◌ᆹ PIEUP-SIOS
    'ㅅ': '\u11BA', // ◌ᆺ SIOS
    'ㅅㅅ': '\u11BB', // ◌ᆻ SSANGSIOS
    'ㅇ': '\u11BC', // ◌ᆼ IEUNG
    'ㅈ': '\u11BD', // ◌ᆽ CIEUC
    'ㅊ': '\u11BE', // ◌ᆾ CHIEUCH
    'ㅋ': '\u11BF', // ◌ᆿ KHIEUKH
    'ㅌ': '\u11C0', // ◌ᇀ THIEUTH
    'ㅍ': '\u11C1', // ◌ᇁ PHIEUPH
    'ㅎ': '\u11C2', // ◌ᇂ HIEUH
    'ㄱㄹ': '\u11C3', // ◌ᇃ KIYEOK-RIEUL
    'ㄱㅅㄱ': '\u11C4', // ◌ᇄ KIYEOK-SIOS-KIYEOK
    'ㄴㄱ': '\u11C5', // ◌ᇅ NIEUN-KIYEOK
    'ㄴㄷ': '\u11C6', // ◌ᇆ NIEUN-TIKEUT
    'ㄴㅅ': '\u11C7', // ◌ᇇ NIEUN-SIOS
    'ㄴㅿ': '\u11C8', // ◌ᇈ NIEUN-PANSIOS
    'ㄴㅌ': '\u11C9', // ◌ᇉ NIEUN-THIEUTH
    'ㄷㄱ': '\u11CA', // ◌ᇊ TIKEUT-KIYEOK
    'ㄷㄹ': '\u11CB', // ◌ᇋ TIKEUT-RIEUL
    'ㄹㄱㅅ': '\u11CC', // ◌ᇌ RIEUL-KIYEOK-SIOS
    'ㄹㄴ': '\u11CD', // ◌ᇍ RIEUL-NIEUN
    'ㄹㄷ': '\u11CE', // ◌ᇎ RIEUL-TIKEUT
    'ㄹㄷㅎ': '\u11CF', // ◌ᇏ RIEUL-TIKEUT-HIEUH
    'ㄹㄹ': '\u11D0', // ◌ᇐ SSANGRIEUL
    'ㄹㅁㄱ': '\u11D1', // ◌ᇑ RIEUL-MIEUM-KIYEOK
    'ㄹㅁㅅ': '\u11D2', // ◌ᇒ RIEUL-MIEUM-SIOS
    'ㄹㅂㅅ': '\u11D3', // ◌ᇓ RIEUL-PIEUP-SIOS
    'ㄹㅂㅎ': '\u11D4', // ◌ᇔ RIEUL-PIEUP-HIEUH
    'ㄹㅂㅇ': '\u11D5', // ◌ᇕ RIEUL-KAPYEOUNPIEUP
    'ㄹㅅㅅ': '\u11D6', // ◌ᇖ RIEUL-SSANGSIOS
    'ㄹㅿ': '\u11D7', // ◌ᇗ RIEUL-PANSIOS
    'ㄹㅋ': '\u11D8', // ◌ᇘ RIEUL-KHIEUKH
    'ㄹㆆ': '\u11D9', // ◌ᇙ RIEUL-YEORINHIEUH
    'ㅁㄱ': '\u11DA', // ◌ᇚ MIEUM-KIYEOK
    'ㅁㄹ': '\u11DB', // ◌ᇛ MIEUM-RIEUL
    'ㅁㅂ': '\u11DC', // ◌ᇜ MIEUM-PIEUP
    'ㅁㅅ': '\u11DD', // ◌ᇝ MIEUM-SIOS
    'ㅁㅅㅅ': '\u11DE', // ◌ᇞ MIEUM-SSANGSIOS
    'ㅁㅿ': '\u11DF', // ◌ᇟ MIEUM-PANSIOS
    'ㅁㅊ': '\u11E0', // ◌ᇠ MIEUM-CHIEUCH
    'ㅁㅎ': '\u11E1', // ◌ᇡ MIEUM-HIEUH
    'ㅁㅇ': '\u11E2', // ◌ᇢ KAPYEOUNMIEUM
    'ㅂㄹ': '\u11E3', // ◌ᇣ PIEUP-RIEUL
    'ㅂㅍ': '\u11E4', // ◌ᇤ PIEUP-PHIEUPH
    'ㅂㅎ': '\u11E5', // ◌ᇥ PIEUP-HIEUH
    'ㅂㅇ': '\u11E6', // ◌ᇦ KAPYEOUNPIEUP
    'ㅅㄱ': '\u11E7', // ◌ᇧ SIOS-KIYEOK
    'ㅅㄷ': '\u11E8', // ◌ᇨ SIOS-TIKEUT
    'ㅅㄹ': '\u11E9', // ◌ᇩ SIOS-RIEUL
    'ㅅㅂ': '\u11EA', // ◌ᇪ SIOS-PIEUP
    'ㅿ': '\u11EB', // ◌ᇫ PANSIOS
    'ㅇㄱ': '\u11EC', // ◌ᇬ IEUNG-KIYEOK
    'ㅇㄱㄱ': '\u11ED', // ◌ᇭ IEUNG-SSANGKIYEOK
    'ㅇㅇ': '\u11EE', // ◌ᇮ SSANGIEUNG
    'ㅇㅋ': '\u11EF', // ◌ᇯ IEUNG-KHIEUKH
    'ㆁ': '\u11F0', // ◌ᇰ YESIEUNG
    'ㆁㅅ': '\u11F1', // ◌ᇱ YESIEUNG-SIOS
    'ㆁㅿ': '\u11F2', // ◌ᇲ YESIEUNG-PANSIOS
    'ㅍㅂ': '\u11F3', // ◌ᇳ PHIEUPH-PIEUP
    'ㅍㅇ': '\u11F4', // ◌ᇴ KAPYEOUNPHIEUPH
    'ㅎㄴ': '\u11F5', // ◌ᇵ HIEUH-NIEUN
    'ㅎㄹ': '\u11F6', // ◌ᇶ HIEUH-RIEUL
    'ㅎㅁ': '\u11F7', // ◌ᇷ HIEUH-MIEUM
    'ㅎㅂ': '\u11F8', // ◌ᇸ HIEUH-PIEUP
    'ㆆ': '\u11F9', // ◌ᇹ YEORINHIEUH
    'ㄱㄴ': '\u11FA', // ◌ᇺ KIYEOK-NIEUN
    'ㄱㅂ': '\u11FB', // ◌ᇻ KIYEOK-PIEUP
    'ㄱㅊ': '\u11FC', // ◌ᇼ KIYEOK-CHIEUCH
    'ㄱㅋ': '\u11FD', // ◌ᇽ KIYEOK-KHIEUKH
    'ㄱㅎ': '\u11FE', // ◌ᇾ KIYEOK-HIEUH
    'ㄴㄴ': '\u11FF', // ◌ᇿ SSANGNIEUN
    'ㄴㄹ': '\uD7CB', // ◌ퟋ NIEUN-RIEUL
    'ㄴㅊ': '\uD7CC', // ◌ퟌ NIEUN-CHIEUCH
    'ㄷㄷ': '\uD7CD', // ◌ퟍ SSANGTIKEUT
    'ㄷㄷㅂ': '\uD7CE', // ◌ퟎ SSANGTIKEUT-PIEUP
    'ㄷㅂ': '\uD7CF', // ◌ퟏ TIKEUT-PIEUP
    'ㄷㅅ': '\uD7D0', // ◌ퟐ TIKEUT-SIOS
    'ㄷㅅㄱ': '\uD7D1', // ◌ퟑ TIKEUT-SIOS-KIYEOK
    'ㄷㅈ': '\uD7D2', // ◌ퟒ TIKEUT-CIEUC
    'ㄷㅊ': '\uD7D3', // ◌ퟓ TIKEUT-CHIEUCH
    'ㄷㅌ': '\uD7D4', // ◌ퟔ TIKEUT-THIEUTH
    'ㄹㄱㄱ': '\uD7D5', // ◌ퟕ RIEUL-SSANGKIYEOK
    'ㄹㄱㅎ': '\uD7D6', // ◌ퟖ RIEUL-KIYEOK-HIEUH
    'ㄹㄹㅋ': '\uD7D7', // ◌ퟗ SSANGRIEUL-KHIEUKH
    'ㄹㅁㅎ': '\uD7D8', // ◌ퟘ RIEUL-MIEUM-HIEUH
    'ㄹㅂㄷ': '\uD7D9', // ◌ퟙ RIEUL-PIEUP-TIKEUT
    'ㄹㅂㅍ': '\uD7DA', // ◌ퟚ RIEUL-PIEUP-PHIEUPH
    'ㄹㆁ': '\uD7DB', // ◌ퟛ RIEUL-YESIEUNG
    'ㄹㆆㅎ': '\uD7DC', // ◌ퟜ RIEUL-YEORINHIEUH-HIEUH
    'ㄹㅇ': '\uD7DD', // ◌ퟝ KAPYEOUNRIEUL
    'ㅁㄴ': '\uD7DE', // ◌ퟞ MIEUM-NIEUN
    'ㅁㄴㄴ': '\uD7DF', // ◌ퟟ MIEUM-SSANGNIEUN
    'ㅁㅁ': '\uD7E0', // ◌ퟠ SSANGMIEUM
    'ㅁㅂㅅ': '\uD7E1', // ◌ퟡ MIEUM-PIEUP-SIOS
    'ㅁㅈ': '\uD7E2', // ◌ퟢ MIEUM-CIEUC
    'ㅂㄷ': '\uD7E3', // ◌ퟣ PIEUP-TIKEUT
    'ㅂㄹㅍ': '\uD7E4', // ◌ퟤ PIEUP-RIEUL-PHIEUPH
    'ㅂㅁ': '\uD7E5', // ◌ퟥ PIEUP-MIEUM
    'ㅂㅂ': '\uD7E6', // ◌ퟦ SSANGPIEUP
    'ㅂㅅㄷ': '\uD7E7', // ◌ퟧ PIEUP-SIOS-TIKEUT
    'ㅂㅈ': '\uD7E8', // ◌ퟨ PIEUP-CIEUC
    'ㅂㅊ': '\uD7E9', // ◌ퟩ PIEUP-CHIEUCH
    'ㅅㅁ': '\uD7EA', // ◌ퟪ SIOS-MIEUM
    'ㅅㅂㅇ': '\uD7EB', // ◌ퟫ SIOS-KAPYEOUNPIEUP
    'ㅅㅅㄱ': '\uD7EC', // ◌ퟬ SSANGSIOS-KIYEOK
    'ㅅㅅㄷ': '\uD7ED', // ◌ퟭ SSANGSIOS-TIKEUT
    'ㅅㅿ': '\uD7EE', // ◌ퟮ SIOS-PANSIOS
    'ㅅㅈ': '\uD7EF', // ◌ퟯ SIOS-CIEUC
    'ㅅㅊ': '\uD7F0', // ◌ퟰ SIOS-CHIEUCH
    'ㅅㅌ': '\uD7F1', // ◌ퟱ SIOS-THIEUTH
    'ㅅㅎ': '\uD7F2', // ◌ퟲ SIOS-HIEUH
    'ㅿㅂ': '\uD7F3', // ◌ퟳ PANSIOS-PIEUP
    'ㅿㅂㅇ': '\uD7F4', // ◌ퟴ PANSIOS-KAPYEOUNPIEUP
    'ㆁㅁ': '\uD7F5', // ◌ퟵ YESIEUNG-MIEUM
    'ㆁㅎ': '\uD7F6', // ◌ퟶ YESIEUNG-HIEUH
    'ㅈㅂ': '\uD7F7', // ◌ퟷ CIEUC-PIEUP
    'ㅈㅂㅂ': '\uD7F8', // ◌ퟸ CIEUC-SSANGPIEUP
    'ㅈㅈ': '\uD7F9', // ◌ퟹ SSANGCIEUC
    'ㅍㅅ': '\uD7FA', // ◌ퟺ PHIEUPH-SIOS
    'ㅍㅌ': '\uD7FB'  // ◌ퟻ PHIEUPH-THIEUTH
  },
  // 호환 자모 → 원자 열쇠 (글자 하나가 원자 하나인 것은 적지 않는다)
  COMPAT: {
    'ㄲ': 'ㄱㄱ', 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ',
    'ㄸ': 'ㄷㄷ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ',
    'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ',
    'ㅃ': 'ㅂㅂ', 'ㅄ': 'ㅂㅅ', 'ㅆ': 'ㅅㅅ', 'ㅉ': 'ㅈㅈ',
    'ㅐ': 'ㅏㅣ', 'ㅒ': 'ㅑㅣ', 'ㅔ': 'ㅓㅣ', 'ㅖ': 'ㅕㅣ',
    'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅏㅣ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ',
    'ㅞ': 'ㅜㅓㅣ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ', 'ㅥ': 'ㄴㄴ',
    'ㅦ': 'ㄴㄷ', 'ㅧ': 'ㄴㅅ', 'ㅨ': 'ㄴㅿ', 'ㅩ': 'ㄹㄱㅅ',
    'ㅪ': 'ㄹㄷ', 'ㅫ': 'ㄹㅂㅅ', 'ㅬ': 'ㄹㅿ', 'ㅭ': 'ㄹㆆ',
    'ㅮ': 'ㅁㅂ', 'ㅯ': 'ㅁㅅ', 'ㅰ': 'ㅁㅿ', 'ㅱ': 'ㅁㅇ',
    'ㅲ': 'ㅂㄱ', 'ㅳ': 'ㅂㄷ', 'ㅴ': 'ㅂㅅㄱ', 'ㅵ': 'ㅂㅅㄷ',
    'ㅶ': 'ㅂㅈ', 'ㅷ': 'ㅂㅌ', 'ㅸ': 'ㅂㅇ', 'ㅹ': 'ㅂㅂㅇ',
    'ㅺ': 'ㅅㄱ', 'ㅻ': 'ㅅㄴ', 'ㅼ': 'ㅅㄷ', 'ㅽ': 'ㅅㅂ',
    'ㅾ': 'ㅅㅈ', 'ㆀ': 'ㅇㅇ', 'ㆂ': 'ㆁㅅ', 'ㆃ': 'ㆁㅿ',
    'ㆄ': 'ㅍㅇ', 'ㆅ': 'ㅎㅎ', 'ㆇ': 'ㅛㅑ', 'ㆈ': 'ㅛㅑㅣ',
    'ㆉ': 'ㅛㅣ', 'ㆊ': 'ㅠㅕ', 'ㆋ': 'ㅠㅕㅣ', 'ㆌ': 'ㅠㅣ',
    'ㆎ': 'ㆍㅣ'
  },
  // 화면 읽기용 단순화 (모두 "어림"이다: 실제 근대 국어로의 변화와 다를 수 있다)
  READING: {
    // 초성 원자 바꾸기. 자음 뒤의 ㅇ(연서·각자병서)은 먼저 지운다: ᄫ→ㅂ, ᅇ→ㅇ.
    // 바꾼 뒤에도 현대 초성이 아니면(합용병서 등) 마지막 원자만 남기되 ㄱㄷㅂㅅㅈ 이면 된소리로: ᄢ→ㄲ, ᄠ→ㄸ, ᄡ→ㅆ, ᅘ→ㅎ
    CHO: { 'ㅿ': 'ㅇ', 'ㆁ': 'ㅇ', 'ㆆ': 'ㅇ', '\u113C': 'ㅅ', '\u113E': 'ㅅ', '\u114E': 'ㅈ', '\u1150': 'ㅈ', '\u1154': 'ㅊ', '\u1155': 'ㅊ' },
    // 중성 원자 바꾸기. ㆍ→ㅏ (ㆎ→ㅐ). 바꾼 뒤 현대 중성이 아니면 뒤에서부터 원자를 덜어 낸다: ㆉ→ㅛ, ㆌ→ㅠ
    JUNG: { 'ㆍ': 'ㅏ' },
    // 종성 원자 바꾸기. ㆆ은 지운다(ㅭ→ㄹ), ㆁ→ㅇ, ㅿ→ㅅ. 현대 종성이 아니면 앞에서부터 덜어 낸다: ᇧ(ㅅㄱ)→ㄱ
    JONG: { 'ㆆ': '', 'ㆁ': 'ㅇ', 'ㅿ': 'ㅅ' },
    TENSE: 'ㄱㄷㅂㅅㅈ',
    // 홀로 쓴 옛 호환 자모는 이름으로 읽는다
    LETTER_NAMES: {
      'ㆍ': '아래아', 'ㆎ': '아래아 이', 'ㅿ': '반치음', 'ㆁ': '옛이응', 'ㆆ': '여린히읗', 'ㅸ': '순경음 비읍',
      'ㅹ': '순경음 쌍비읍', 'ㅱ': '순경음 미음', 'ㆄ': '순경음 피읖', 'ㆀ': '쌍이응', 'ㆅ': '쌍히읗'
    }
  }
};
