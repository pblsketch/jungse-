'use strict';
/*
 * 옛글자 도감 NM.data.DOGAM (선생님이 고칠 수 있는 공용 목록 — K1).
 * 서장(s0)에서 열린다(spec §7 서장: 28자 중 사라진 4자 ㆍ ㅿ ㆆ ㆁ 와 28자에 들지 않는 ㅸ 구별).
 * 해독 수첩(js/ui/notebook-model.js)이 읽어 '옛글자 도감'으로 보인다. 그 장면(stage)을 끝내면 '만남'으로 표시된다.
 *
 * ■ 필드
 *   키       영문 소문자로 시작하는 이름(예: araea). 저장 기록에는 쓰지 않지만 기믹이 키로 가리킬 수 있으니 바꾸지 않는다.
 *   glyph    글자 하나. 호환 자모 한 글자(ㄱ, ㆍ, ㅸ, ㅳ …)로 적는다. 날 첫가끝 자모는 쓰지 않는다.
 *   name     글자 이름(오늘날 부르는 이름).
 *   note     한두 문장 설명(새로 쓴 글). 예로 든 옛 낱말은 데이터 표기([ㅳㅡㄷ])로 적는다.
 *   stage    이 글자를 만나는 장면 id. 28자와 ㅸ은 모두 서장 's0'(서장에서 가른다). 그 밖의 글자는 처음 나오는 장면.
 *   group    서장 가르기용 분류(서장 기믹이 이 값으로 가른다).
 *              '28-current'  28자 가운데 지금도 쓰는 글자(24자)
 *              '28-lost'     28자 가운데 지금은 쓰지 않는 글자(ㆍ ㅿ ㆆ ㆁ 4자)
 *              'not28'       28자에 들지 않는 글자(ㅸ, 나란히 쓴 글자, 합친 모음 등)
 *            서장의 가르기 대상은 stage 가 's0' 인 글자(28자 + ㅸ)다. stage 가 다른 'not28' 글자는 뒤 장면에서 만난다.
 *   kind     'consonant'(자음) | 'vowel'(모음)
 *   make     만든 방법(기믹·수첩 정렬용 값, 화면 용어가 아님)
 *              'shape'(상형 기본자) 'stroke'(가획) 'different'(모양을 달리 만듦 — 고등 용어 '이체')
 *              'compound'(모음 기본자 합성) 'yeonseo'(이어 쓰기, ㅸ) 'sameDouble'(같은 글자 나란히 — 각자 병서)
 *              'diffDouble'(다른 글자 나란히 — 합용 병서) 'vowelJoin'(모음자 합치기)
 *   src      출처(리서치 문서 위치, 교과서 쪽).
 *
 * ■ 적는 법: js/core/yet.js 머리의 데이터 표기를 따른다. 나열은 쉼표나 띄어쓰기로 한다(가운뎃점을 음절 앞에 붙이면 방점이 된다).
 *   중학교 학생도 보는 글이라 '이체', '병서' 같은 고등 용어는 쓰지 않거나 괄호로만 덧붙인다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
(function () {
  const S28 = '해례 제자해 (리서치 09 §4-3, §5), 중학 국어 2-2 140~143쪽 (리서치 06 §4)';
  const LOST = '중학 국어 2-2 142~143쪽, 공통국어2 135쪽 (리서치 06 §7-1, 05 §3-1)';
  const HJ = '해례 합자해 (리서치 09 §4-5, §5)';
  NM.data.DOGAM = {
    // ── 28자: 첫소리 17자 ──
    giyeok: { glyph: 'ㄱ', name: '기역', kind: 'consonant', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '어금닛소리의 기본 글자. 혀뿌리가 목구멍 쪽을 막는 모양을 본떴다.' },
    kieuk: { glyph: 'ㅋ', name: '키읔', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㄱ보다 소리가 세게 나서 ㄱ에 획을 하나 더했다.' },
    yetieung: { glyph: 'ㆁ', name: '옛이응', kind: 'consonant', make: 'different', group: '28-lost', stage: 's0', src: S28 + ', ' + LOST,
      note: '어금닛소리 글자. 획을 더하는 길을 따르지 않고 모양을 달리해 만들었다. 뒤에 ㅇ과 섞여 쓰이다가 ㅇ으로 합쳐졌다.' },
    nieun: { glyph: 'ㄴ', name: '니은', kind: 'consonant', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '혓소리의 기본 글자. 혀끝이 윗잇몸에 닿는 모양을 본떴다.' },
    digeut: { glyph: 'ㄷ', name: '디귿', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㄴ에 획을 더했다(ㄴ → ㄷ → ㅌ).' },
    tieut: { glyph: 'ㅌ', name: '티읕', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㄷ에 획을 하나 더 더했다.' },
    mieum: { glyph: 'ㅁ', name: '미음', kind: 'consonant', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '입술소리의 기본 글자. 입 모양을 본떴다.' },
    bieup: { glyph: 'ㅂ', name: '비읍', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㅁ에 획을 더했다(ㅁ → ㅂ → ㅍ).' },
    pieup: { glyph: 'ㅍ', name: '피읖', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㅂ에 획을 하나 더 더했다.' },
    siot: { glyph: 'ㅅ', name: '시옷', kind: 'consonant', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '잇소리의 기본 글자. 이의 모양을 본떴다.' },
    jieut: { glyph: 'ㅈ', name: '지읒', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㅅ에 획을 더했다(ㅅ → ㅈ → ㅊ).' },
    chieut: { glyph: 'ㅊ', name: '치읓', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㅈ에 획을 하나 더 더했다.' },
    ieung: { glyph: 'ㅇ', name: '이응', kind: 'consonant', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '목구멍소리의 기본 글자. 목구멍 모양을 본떴다.' },
    yeorinhieut: { glyph: 'ㆆ', name: '여린히읗', kind: 'consonant', make: 'stroke', group: '28-lost', stage: 's0', src: S28 + ', ' + LOST + ', 리서치 02 §2-2',
      note: 'ㅇ에 획을 더했다(ㅇ → ㆆ → ㅎ). 주로 한자음이나 사잇소리를 적는 데 쓰이다가 일찍 사라졌다.' },
    hieut: { glyph: 'ㅎ', name: '히읗', kind: 'consonant', make: 'stroke', group: '28-current', stage: 's0', src: S28,
      note: 'ㆆ에 획을 하나 더 더했다.' },
    rieul: { glyph: 'ㄹ', name: '리을', kind: 'consonant', make: 'different', group: '28-current', stage: 's0', src: S28,
      note: '반혓소리 글자. 혀의 모양을 따랐지만 획을 더한다는 뜻 없이 모양을 달리해 만들었다.' },
    banchieum: { glyph: 'ㅿ', name: '반치음', kind: 'consonant', make: 'different', group: '28-lost', stage: 's0', src: S28 + ', ' + LOST + ', 리서치 11 §5',
      note: '반잇소리 글자. 이의 모양을 따랐지만 모양을 달리해 만들었다. 소리가 사라지면서 글자도 쓰이지 않게 되었다([ㅁㆍ][ㅿㆍㅁ] → [ㅁㆍ][ㅇㆍㅁ]).' },

    // ── 28자: 가운뎃소리 11자 ──
    araea: { glyph: 'ㆍ', name: '아래아', kind: 'vowel', make: 'shape', group: '28-lost', stage: 's0', src: S28 + ', ' + LOST + ', 리서치 11 §5, §9',
      note: '하늘(둥근 모양)을 본뜬 모음 기본 글자. 소리가 사라지면서 둘째 음절에서는 주로 ㅡ로, 첫음절에서는 주로 ㅏ로 바뀌었다. 정확한 소리값은 학설이 갈린다.' },
    eu: { glyph: 'ㅡ', name: '으', kind: 'vowel', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '땅(평평한 모양)을 본뜬 모음 기본 글자.' },
    i: { glyph: 'ㅣ', name: '이', kind: 'vowel', make: 'shape', group: '28-current', stage: 's0', src: S28,
      note: '사람(서 있는 모양)을 본뜬 모음 기본 글자.' },
    o: { glyph: 'ㅗ', name: '오', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㆍ와 ㅡ를 합친 글자(초출자).' },
    a: { glyph: 'ㅏ', name: '아', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅣ와 ㆍ를 합친 글자(초출자).' },
    u: { glyph: 'ㅜ', name: '우', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅡ와 ㆍ를 합친 글자(초출자).' },
    eo: { glyph: 'ㅓ', name: '어', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㆍ와 ㅣ를 합친 글자(초출자).' },
    yo: { glyph: 'ㅛ', name: '요', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅗ와 같되 ㅣ 소리에서 출발하는 글자(재출자). 점이 둘이다.' },
    ya: { glyph: 'ㅑ', name: '야', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅏ와 같되 ㅣ 소리에서 출발하는 글자(재출자). 점이 둘이다.' },
    yu: { glyph: 'ㅠ', name: '유', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅜ와 같되 ㅣ 소리에서 출발하는 글자(재출자). 점이 둘이다.' },
    yeo: { glyph: 'ㅕ', name: '여', kind: 'vowel', make: 'compound', group: '28-current', stage: 's0', src: S28,
      note: 'ㅓ와 같되 ㅣ 소리에서 출발하는 글자(재출자). 점이 둘이다.' },

    // ── 28자에 들지 않는 글자 ──
    sungyeongbieup: { glyph: 'ㅸ', name: '순경음 비읍', kind: 'consonant', make: 'yeonseo', group: 'not28', stage: 's0', src: '해례 제자해 연서 (리서치 09 §4-5), 리서치 03 §2 M3, 02 §2-2',
      note: 'ㅂ 아래에 ㅇ을 이어 써서 만든 글자(연서)라 28자에 들지 않는다. 해례는 입술을 잠깐만 붙여 내는 가벼운 입술소리라고 풀이한다.' },
    ssanggiyeok: { glyph: 'ㄲ', name: '쌍기역', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: '중학 국어 2-2 142쪽 (리서치 06 §7-1)',
      note: '같은 글자 ㄱ을 나란히 겹쳐 쓴 글자. 지금은 된소리를 적는다.' },
    ssangdigeut: { glyph: 'ㄸ', name: '쌍디귿', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: '중학 국어 2-2 142쪽 (리서치 06 §7-1)',
      note: '같은 글자 ㄷ을 나란히 겹쳐 쓴 글자. 지금은 된소리를 적는다.' },
    ssangbieup: { glyph: 'ㅃ', name: '쌍비읍', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: '중학 국어 2-2 142쪽 (리서치 06 §7-1)',
      note: '같은 글자 ㅂ을 나란히 겹쳐 쓴 글자. 지금은 된소리를 적는다.' },
    ssangsiot: { glyph: 'ㅆ', name: '쌍시옷', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: HJ + ', 중학 국어 2-2 142쪽',
      note: '같은 글자 ㅅ을 나란히 겹쳐 쓴 글자. 합자해는 소다와 쏘다(활을 쏘다)를 이 글자로 갈라 적은 예를 든다.' },
    ssangjieut: { glyph: 'ㅉ', name: '쌍지읒', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: '중학 국어 2-2 142쪽 (리서치 06 §7-1)',
      note: '같은 글자 ㅈ을 나란히 겹쳐 쓴 글자. 지금은 된소리를 적는다.' },
    ssanghieut: { glyph: 'ㆅ', name: '쌍히읗', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: HJ,
      note: '같은 글자 ㅎ을 나란히 겹쳐 쓴 글자. 혀와 [ㆅㅕ](끌다)를 갈라 적었다. 지금은 쓰지 않는다.' },
    ssangieung: { glyph: 'ㆀ', name: '쌍이응', kind: 'consonant', make: 'sameDouble', group: 'not28', stage: 's3', src: HJ + ', 서문 (리서치 09 §4-1)',
      note: '같은 글자 ㅇ을 나란히 겹쳐 쓴 글자. 괴여와 괴[ㆀㅕ]를 갈라 적었고, 서문의 [ㅎㆎ][ㆀㅕ]에도 보인다. 지금은 쓰지 않는다.' },
    sd: { glyph: 'ㅼ', name: 'ㅅ과 ㄷ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's3', src: HJ,
      note: '서로 다른 자음 ㅅ과 ㄷ을 나란히 쓴 첫소리. [ㅼㅏ](땅)에 보인다.' },
    bj: { glyph: 'ㅶ', name: 'ㅂ과 ㅈ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's3', src: HJ,
      note: '서로 다른 자음 ㅂ과 ㅈ을 나란히 쓴 첫소리. [ㅶㅏㄱ](짝)에 보인다.' },
    bsg: { glyph: 'ㅴ', name: 'ㅂ, ㅅ, ㄱ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's3', src: HJ,
      note: '서로 다른 자음 셋을 나란히 쓴 첫소리. [ㅴㅡㅁ](틈)에 보인다.' },
    bd: { glyph: 'ㅳ', name: 'ㅂ과 ㄷ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's5', src: '「용비어천가」 (리서치 10 §5), 공통국어2 4단원 (리서치 05 §2)',
      note: '서로 다른 자음 ㅂ과 ㄷ을 나란히 쓴 첫소리. [ㅳㅡㄷ](뜻)에 보인다. 이런 첫소리는 뒤에 된소리로 바뀌었다.' },
    sg: { glyph: 'ㅺ', name: 'ㅅ과 ㄱ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's5', src: '「용비어천가」 제13장 (리서치 10 §5)',
      note: '서로 다른 자음 ㅅ과 ㄱ을 나란히 쓴 첫소리. [ㅺㅜㅁ](꿈)에 보인다.' },
    bs: { glyph: 'ㅄ', name: 'ㅂ과 ㅅ을 나란히 쓴 글자', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's5', src: '서문 (리서치 09 §8-2), 우리말샘 좁쌀 (리서치 11 §5)',
      note: '서로 다른 자음 ㅂ과 ㅅ을 나란히 쓴 첫소리. 서문의 [ㅄㅜ]메(쓰는 데)에 보인다. 좁쌀의 ㅂ이 그 흔적이다.' },
    araeae: { glyph: 'ㆎ', name: '아래애', kind: 'vowel', make: 'vowelJoin', group: 'not28', stage: 's3', src: '해례 용자례 (리서치 09 §4-6, §5)',
      note: 'ㆍ와 ㅣ를 합친 모음. 호[ㅁㆎ](호미)에 보인다. 지금은 쓰지 않는다.' },
    wa: { glyph: 'ㅘ', name: '와', kind: 'vowel', make: 'vowelJoin', group: 'not28', stage: 's3', src: HJ + ', 중학 국어 2-2 144쪽',
      note: 'ㅗ와 ㅏ를 합친 모음. 합자해는 과(거문고 줄을 받치는 괘)를 예로 든다.' },
    wae: { glyph: 'ㅙ', name: '왜', kind: 'vowel', make: 'vowelJoin', group: 'not28', stage: 's3', src: HJ,
      note: 'ㅗ, ㅏ, ㅣ를 합친 모음. 합자해는 홰(횃불)를 예로 든다.' },
    rieulyeorinhieut: { glyph: 'ㅭ', name: 'ㄹ과 ㆆ을 나란히 쓴 받침', kind: 'consonant', make: 'diffDouble', group: 'not28', stage: 's9', src: '서문 (리서치 09 §4-1), 리서치 02 §2-2',
      note: 'ㄹ과 ㆆ을 나란히 쓴 받침. 서문의 [ㅎㅗㅭ]에 보인다. 지금은 쓰지 않는다.' }
  };
})();
