'use strict';
/*
 * 규칙 카드 목록 NM.data.RULE_CARDS (선생님이 고칠 수 있는 공용 목록 — K1).
 * 장면 데이터는 규칙 카드를 id 로만 가리킨다(항목의 ruleCard, 장면의 needs[].rule).
 * 해독 수첩(js/ui/notebook-model.js)과 장면 진행기('아직 확인하지 않은 규칙', js/ui/stage-logic.js)가 읽는다.
 *
 * ■ 필드
 *   id      'rule.<영문 이름>' — 키와 같아야 한다. 저장 기록에 남으므로 한 번 쓴 id 는 바꾸지 않는다.
 *   name    카드 이름(짧게). 학교급마다 교과서 용어를 따른다(아래 '학교급 용어').
 *   text    완성된 규칙 문장. 학생이 '규칙 카드 문장 완성'으로 채운 뒤 수첩에 붙는 문장이다.
 *   stage   이 규칙을 가르치는 장면 id(s0~s12). '아직 확인하지 않은 규칙' 카드에 이 장면 이름이 나온다.
 *   levels  이 규칙이 핵심인 학교급 목록(m 중학교 · h1 고1 · h23 고2~3). 그 학교급이 이 장면을 할 때 핵심 항목이 되는 규칙이다.
 *           목록에 없는 학교급에는 장면에서 알아 두기로만 보이게 한다(장면 항목의 levels 를 이 값과 맞춘다).
 *           빈 목록 [] = 지금은 어느 학교급에서도 항목으로 다루지 않고 장면의 알아 두기 카드로만 보인다(장면 시간 10~12분에 맞춰 뺀 규칙).
 *           고2~3 전용 장면(s1 s7 s8 s11)의 규칙은 ['h23'] 이다(누가 들어가도 그 범위를 쓴다, js/data/rules-config.js).
 *   src     교과서 쪽과 리서치 문서 위치(사실 카드의 출처). 리서치 = design/research/ 의 번호 문서.
 *   orig    (있으면) 이 규칙이 드러나는 原文 블록 id 목록. 장면 작가가 맥락을 고를 때 쓴다. 原文 글자는 orig.generated.js 에만 있다.
 *   twin    (있으면) 같은 규칙을 다른 학교급 용어로 쓴 카드 id. 수첩은 지금 학교급의 levels 에 든 카드만 보이면 된다.
 *
 * ■ 학교급 용어 (spec §7, 리서치 06 §7-1)
 *   중학교는 '상형, 가획, 합성', '나란히 쓰기'만 쓴다('이체'는 날개 설명, '병서'는 지도서 용어).
 *   고등은 '이체', '병서'를 쓴다. 그래서 rule.naranhi(중학교) ↔ rule.byeongseo(고등)는 twin 이고, rule.iche 는 고등만 핵심이다.
 *
 * ■ 넣지 않은 것
 *   교과서에 없는 내용(연서 ㅸ, 종성 규정 '종성부용초성', 동국정운식 한자음, 호격 '하', 훈몽자회 자모 이름)과
 *   학설이 갈리는 것(ㆍ의 정확한 소리값, 방점의 정확한 높낮이 값, 변화가 일어난 정확한 연도)은 규칙 카드로 만들지 않는다.
 *   필요하면 장면의 notes(알아 두기·해석)로 둔다.
 *
 * ■ 적는 법: js/core/yet.js 머리의 데이터 표기를 따른다. 옛 음절은 [ㅁㆍㄹ] 처럼 대괄호로 적는다.
 *   가운뎃점·쌍점을 음절 바로 앞에 쓰면 방점이 되므로 나열은 쉼표나 띄어쓰기로 한다. 밑줄표(_)는 쓰지 않는다.
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.RULE_CARDS = {
  // ── 서장 s0 ──
  'rule.letters28': {
    id: 'rule.letters28', stage: 's0', levels: ['m', 'h1', 'h23'],
    name: '스물여덟 자',
    text: '훈민정음은 첫소리 글자 17자와 가운뎃소리 글자 11자, 모두 28자다. 그 가운데 ㆍ ㅿ ㆆ ㆁ 네 글자는 지금 쓰지 않는다. ㅸ은 ㅂ 아래에 ㅇ을 이어 쓴 글자라 28자에 들지 않는다.',
    src: '중학 국어 2-2 142~143쪽, 공통국어2 135쪽 (리서치 06 §7-1, 05 §3-1, 09 §4-3)',
    orig: ['O-s2-JJ-CHO17', 'O-s2-JUNG11', 'O-s3-YEONSEO']
  },

  // ── 1 빌려 쓴 글자 (고2~3) ──
  'rule.borrowing': {
    id: 'rule.borrowing', stage: 's1', levels: ['h23'],
    name: '뜻 빌림과 소리 빌림',
    text: '글자가 없던 때에는 한자를 빌려 우리말을 적었다. 한자의 뜻을 빌리기도 하고(훈차) 소리를 빌리기도 했다(음차). 같은 고장을 永同과 吉同 두 이름으로 적은 것이 그 예다.',
    src: '화법과 언어 203쪽 (리서치 11 §4-1)',
    orig: ['O-s1-YEONGDONG', 'O-s1-MILSEONG']
  },
  'rule.hyangchal': {
    id: 'rule.hyangchal', stage: 's1', levels: ['h23'],
    name: '향찰의 짜임',
    text: '향찰에서 뜻을 지닌 말(실질 형태소)은 대체로 한자의 뜻을 빌려 적고, 조사와 어미는 대체로 한자의 소리를 빌려 적었다. 어디까지나 대체로 그렇다는 것이라 예외도 있다.',
    src: '화법과 언어 207쪽 (리서치 11 §4-1, §11)',
    orig: ['O-s1-SEODONG1', 'O-s1-SEODONG2', 'O-s1-CHEOYONG1']
  },

  // ── 2 스물여덟 자 (중학교 묶음) ──
  'rule.consShape': {
    id: 'rule.consShape', stage: 's2', levels: ['m', 'h1', 'h23'],
    name: '자음 상형',
    text: '자음의 기본 글자 ㄱ ㄴ ㅁ ㅅ ㅇ은 그 소리를 낼 때의 발음 기관 모양을 본떠 만들었다.',
    src: '중학 국어 2-2 140쪽 (리서치 06 §4, 09 §4-3)',
    orig: ['O-s2-SANG-G', 'O-s2-SANG-N', 'O-s2-SANG-M', 'O-s2-SANG-S', 'O-s2-SANG-O']
  },
  'rule.addStroke': {
    id: 'rule.addStroke', stage: 's2', levels: ['m', 'h1', 'h23'],
    name: '가획',
    text: '소리가 세지면 기본 글자에 획을 더해 새 글자를 만들었다(ㄱ → ㅋ, ㄴ → ㄷ → ㅌ, ㅁ → ㅂ → ㅍ, ㅅ → ㅈ → ㅊ, ㅇ → ㆆ → ㅎ).',
    src: '중학 국어 2-2 141쪽 (리서치 06 §4, §7-2)',
    orig: ['O-s2-GAHOEK1', 'O-s2-GAHOEK2']
  },
  'rule.iche': {
    id: 'rule.iche', stage: 's2', levels: ['h1', 'h23'],
    name: '이체',
    text: 'ㆁ ㄹ ㅿ은 획을 더할수록 소리가 세진다는 가획의 원리를 따르지 않고, 모양을 달리해 만든 글자(이체자)다.',
    src: '중학 국어 2-2 142쪽 날개, 교사용 핵심 정리 (리서치 06 §7-1, 09 §4-3)',
    orig: ['O-s2-ICHE', 'O-s2-GAHOEK2']
  },
  'rule.vowelShape': {
    id: 'rule.vowelShape', stage: 's2', levels: ['m', 'h1', 'h23'],
    name: '모음 상형',
    text: '모음의 기본 글자 ㆍ ㅡ ㅣ는 하늘(둥근 모양), 땅(평평한 모양), 사람(서 있는 모양)을 본떠 만들었다.',
    src: '중학 국어 2-2 143쪽 (리서치 06 §4, 09 §4-3)',
    orig: ['O-s2-CHEON', 'O-s2-JI', 'O-s2-IN']
  },
  'rule.vowelCompound': {
    id: 'rule.vowelCompound', stage: 's2', levels: ['m', 'h1', 'h23'],
    name: '모음 합성',
    text: '모음 기본 글자를 합쳐 ㅗ ㅏ ㅜ ㅓ(초출자)를 만들고, 여기에 ㆍ를 하나 더 더해 ㅛ ㅑ ㅠ ㅕ(재출자)를 만들었다.',
    src: '중학 국어 2-2 143~144쪽 (리서치 06 §4, 09 §4-3)',
    orig: ['O-s2-HAP-O', 'O-s2-HAP-A', 'O-s2-HAP-U', 'O-s2-HAP-EO', 'O-s2-JAECHUL', 'O-s2-CHOJAE']
  },

  // ── 3 모아 써야 소리가 된다 (중학교 묶음) ──
  'rule.moasseugi': {
    id: 'rule.moasseugi', stage: 's3', levels: ['m', 'h1', 'h23'],
    name: '모아쓰기',
    text: '한글은 낱소리를 적는 글자(음소 문자)이지만, 첫소리, 가운뎃소리, 끝소리 글자를 모아 음절 단위로 쓴다.',
    src: '중학 국어 2-2 3단원 (리서치 06 §4), 해례 합자해 (리서치 09 §4-5)',
    orig: ['O-s3-HJ-SAM', 'O-s3-HJ-CHO', 'O-s3-HJ-JUNG', 'O-s3-HJ-JONG']
  },
  'rule.naranhi': {
    id: 'rule.naranhi', stage: 's3', levels: ['m'], twin: 'rule.byeongseo',
    name: '나란히 쓰기',
    text: '자음 글자를 옆으로 나란히 써서 된소리(ㄲ ㄸ ㅃ ㅆ ㅉ)나 겹받침(ㄳ ㄶ ㄵ ㄺ ㅄ)을 나타낸다.',
    src: '중학 국어 2-2 142쪽 (리서치 06 §4, §7-1)',
    orig: ['O-s3-HJ-GAKJA', 'O-s3-HJ-JONGHAP']
  },
  'rule.byeongseo': {
    id: 'rule.byeongseo', stage: 's3', levels: ['h1', 'h23'], twin: 'rule.naranhi',
    name: '병서',
    text: '자음 글자를 나란히 붙여 쓰는 것을 병서라 한다. 같은 글자를 겹쳐 쓰면 각자 병서(ㄲ ㅆ ㆅ 등), 서로 다른 글자를 이어 쓰면 합용 병서(ㅼ ㅳ ㅴ 등)다.',
    src: '중학 국어 2-2 지도서 용어 (리서치 06 §4), 리서치 02 §2-2, 해례 합자해 (리서치 09 §4-5)',
    orig: ['O-s3-HJ-GAKJA', 'O-s3-HJ-HAPYONG', 'O-s3-HJ-JONGHAP']
  },
  'rule.vowelJoin': {
    id: 'rule.vowelJoin', stage: 's3', levels: ['m', 'h1', 'h23'],
    name: '모음자 합치기',
    text: '이미 만든 모음자를 다시 합해 ㅘ ㅝ ㅐ ㅔ 같은 모음자를 만든다(ㅗ + ㅏ → ㅘ).',
    src: '중학 국어 2-2 144쪽 (리서치 06 §7-1), 해례 합자해 (리서치 09 §4-5)',
    orig: ['O-s3-HJ-JUNGHAP']
  },

  // ── 4 소리대로 적은 책 (고1, 고2~3) ──
  'rule.linkedWriting': {
    id: 'rule.linkedWriting', stage: 's4', levels: ['h1', 'h23'],
    name: '이어 적기',
    text: '받침 있는 말 뒤에 모음으로 시작하는 조사나 어미가 오면, 받침을 다음 음절의 첫소리로 옮겨 소리 나는 대로 적었다(깊 + 은 → 기픈).',
    src: '공통국어2 4단원, 화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB2a', 'O-s4-YB2b']
  },
  'rule.eightFinals': {
    id: 'rule.eightFinals', stage: 's4', levels: ['h1', 'h23'],
    name: '8종성법',
    text: '받침에는 ㄱ ㆁ ㄷ ㄴ ㅂ ㅁ ㅅ ㄹ 여덟 글자만 썼다. 다만 「용비어천가」에는 깊고, 높고처럼 원래 받침을 살려 적은 예외도 있다.',
    src: '공통국어2 135쪽 (리서치 05 §2, 10 §5), 해례 종성해 (리서치 09 §4-5)',
    orig: ['O-s4-YB34a', 'O-s4-YB34b', 'O-s3-JONG8']
  },
  'rule.bangjeom': {
    id: 'rule.bangjeom', stage: 's4', levels: ['h1', 'h23'],
    name: '방점',
    text: '글자 왼쪽에 찍은 점으로 소리의 높낮이(성조)를 나타냈다. 점이 없으면 평성, 하나면 거성, 둘이면 상성이다.',
    src: '공통국어2 4단원 (리서치 05 §2), 해례 합자해 (리서치 09 §4-5)',
    orig: ['O-s3-HJ-BANGJEOM', 'O-s3-HJ-SASEONG', 'O-s4-YB2a']
  },
  'rule.noSpacing': {
    id: 'rule.noSpacing', stage: 's4', levels: ['h1', 'h23'],
    name: '띄어쓰기 없음',
    text: '15세기 문헌은 낱말 사이를 띄어 쓰지 않고 이어서 적었다.',
    src: '공통국어2 4단원 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB2a', 'O-s4-YB34a']
  },
  'rule.vowelHarmony': {
    id: 'rule.vowelHarmony', stage: 's4', levels: ['h23'],
    name: '모음 조화',
    text: '양성 모음(ㆍ ㅗ ㅏ)은 양성 모음끼리, 음성 모음(ㅡ ㅜ ㅓ)은 음성 모음끼리 어울렸다. ㅣ는 어느 쪽과도 어울렸다(중성 모음).',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB2a', 'O-s4-YB2b', 'O-s6-SS6e']
  },

  // ── 5 사라진 소리, 바뀐 뜻 ──
  'rule.meaningChange': {
    id: 'rule.meaningChange', stage: 's5', levels: ['h1', 'h23'],
    name: '뜻이 바뀐 말',
    text: '모양이 지금과 같거나 비슷해도 뜻이 달랐던 말이 있다(어리다 = 어리석다, 어엿브다 = 불쌍하다, 하다 = 많다). 지금 뜻으로 읽으면 잘못 알아듣는다.',
    src: '공통국어2 137쪽, 화법과 언어 202쪽, 204쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s5-YB39a', 'O-s5-YB50', 'O-s5-YB13', 'O-s5-YB64', 'O-s9-SEOMUN3', 'O-s9-SEOMUN4', 'O-s9-SEOMUN5']
  },
  'rule.initialCluster': {
    id: 'rule.initialCluster', stage: 's5', levels: ['h1', 'h23'],
    name: '어두 자음군',
    text: '낱말 첫머리에 서로 다른 자음이 둘이나 셋 함께 올 수 있었다([ㅳㅡㄷ], [ㅺㅜㅁ]). 이 소리는 뒤에 된소리로 바뀌었다.',
    src: '공통국어2 4단원, 화법과 언어 (리서치 05 §2, 10 §5, 11 §5)',
    orig: ['O-s5-YB13', 'O-s5-DS114', 'O-s9-SEOMUN7']
  },
  'rule.prePalatal': {
    id: 'rule.prePalatal', stage: 's5', levels: [],
    name: '구개음화 이전',
    text: 'ㅣ나 ㅣ로 시작하는 모음 앞에서도 ㄷ, ㅌ이 ㅈ, ㅊ으로 바뀌지 않고 그대로 쓰였다(됴코 → 좋고).',
    src: '공통국어2 4단원 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB2a', 'O-s7-WS1b']
  },
  'rule.preInitialLaw': {
    id: 'rule.preInitialLaw', stage: 's5', levels: [],
    name: '두음 법칙 이전',
    text: '낱말 첫머리의 ㄴ이 ㅣ나 ㅣ로 시작하는 모음 앞에서도 그대로 쓰였다(닐굽 → 일곱).',
    src: '공통국어2 4단원 (리서치 05 §2, 10 §5)',
    orig: ['O-s7-WS1e', 'O-s7-WS1i', 'O-s7-SS6b']
  },
  'rule.preRounding': {
    id: 'rule.preRounding', stage: 's5', levels: [],
    name: '원순 모음화 이전',
    text: 'ㅁ ㅂ ㅍ 뒤의 ㅡ가 ㅜ로 바뀌지 않고 그대로 쓰였다(믈 → 물, 블 → 불).',
    src: '공통국어2 4단원 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB34a', 'O-s4-YB2b', 'O-s7-WS1h']
  },
  'rule.hFinalNoun': {
    id: 'rule.hFinalNoun', stage: 's5', levels: [],
    name: 'ㅎ 종성 체언',
    text: '끝에 ㅎ을 지닌 체언이 있어서, 모음으로 시작하는 조사 앞에서 그 ㅎ이 드러났다(하[ㄴㆍㅀ] + 이 → 하[ㄴㆍㄹ]히). 안팎이라는 말에 그 흔적이 남아 있다.',
    src: '공통국어2 133쪽, 137쪽, 138쪽 (리서치 05 §2, 10 §5, 11 §5)',
    orig: ['O-s4-YB34a', 'O-s4-YB34b', 'O-s4-YB2b', 'O-s7-WS1b']
  },
  'rule.nativeVsSino': {
    id: 'rule.nativeVsSino', stage: 's5', levels: ['h23'],
    name: '고유어와 한자어의 경쟁',
    text: '같은 뜻의 고유어와 한자어가 함께 쓰이다가 고유어가 밀려나기도 했다. 수를 나타내던 즈믄과 온은 한자어 천(千)과 백(百)에 밀려 사라졌다.',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s5-DS1017', 'O-s5-DS114']
  },
  'rule.loanword': {
    id: 'rule.loanword', stage: 's5', levels: [],
    name: '차용어',
    text: '중세 국어에는 몽골어처럼 다른 나라 말에서 들어와 자리 잡은 낱말(차용어)도 있었다.',
    src: '화법과 언어 15세기 국어 (리서치 05 §2)'
  },

  // ── 6 말을 잇는 끈 ──
  'rule.nomCase': {
    id: 'rule.nomCase', stage: 's6', levels: ['h1', 'h23'],
    name: '주격 조사 이, ㅣ, Ø',
    text: '주격 조사는 받침 있는 말 뒤에서 \'이\', ㅣ가 아닌 모음 뒤에서 \'ㅣ\'(부텨 + ㅣ → 부톄), ㅣ나 반모음 ㅣ로 끝난 말 뒤에서는 아무 형태 없이(Ø) 나타났다(불휘). \'가\'는 아직 없었다.',
    src: '공통국어2 136쪽, 화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB2a', 'O-s4-YB2b', 'O-s7-SS6b', 'O-s6-SS6e', 'O-s6-SS6a']
  },
  'rule.genitiveS': {
    id: 'rule.genitiveS', stage: 's6', levels: ['h1', 'h23'],
    name: '관형격 조사 ㅅ',
    text: '무정 명사나 높여야 할 사람을 나타내는 말 뒤에서는 관형격 조사 \'ㅅ\'을 썼다(나랏 말, 부텻 말).',
    src: '공통국어2 4단원, 화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s9-SEOMUN1', 'O-s8-SS6g', 'O-s7-WS1f', 'O-s5-YB39a']
  },
  'rule.genitiveUi': {
    id: 'rule.genitiveUi', stage: 's6', levels: ['h23'],
    name: '관형격 조사 [ㅇㆎ]와 의',
    text: '높이지 않는 사람이나 동물을 나타내는 말 뒤에서는 \'[ㅇㆎ]\'나 \'의\'를 썼다. 앞말의 모음이 양성이면 \'[ㅇㆎ]\', 음성이면 \'의\'를 골랐다(사[ㄹㆍ][ㅁㆎ], 羅雲의).',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s6-SS6e', 'O-s6-SS6j', 'O-s6-YB17a', 'O-s6-YB17b']
  },
  'rule.compareE': {
    id: 'rule.compareE', stage: 's6', levels: [],
    name: '비교의 에',
    text: '조사 \'에\'가 견주는 대상을 나타내기도 했다. 서문의 \'中國에 달아\'는 \'중국과 달라\'라는 뜻이다.',
    src: '공통국어2 136쪽 날개 (리서치 05 §2, 10 §10)',
    orig: ['O-s9-SEOMUN1']
  },
  'rule.nominalOm': {
    id: 'rule.nominalOm', stage: 's6', levels: ['h1', 'h23'],
    name: '명사형 어미 -옴/-움',
    text: '명사형 어미는 주로 \'-옴/-움\'을 썼다([ㅄㅡ]- + -움 + 에 → [ㅄㅜ]메).',
    src: '공통국어2 137쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s9-SEOMUN7', 'O-s6-SS6a', 'O-s6-SS6d', 'O-s6-YB17a']
  },
  'rule.harmonyParticle': {
    id: 'rule.harmonyParticle', stage: 's6', levels: ['h23'],
    name: '모음 조화와 조사',
    text: '조사도 모음 조화를 따라 앞말의 모음에 맞는 형태를 골랐다. 양성 모음 뒤에는 [ㅇㆍㄴ], [ㅇㆍㄹ], [ㅇㆎ]를, 음성 모음 뒤에는 은, 을, 의를 썼다.',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s6-SS6e', 'O-s6-YB17a', 'O-s6-YB17b', 'O-s4-YB2a']
  },

  // ── 7 높이는 말 (고2~3) ──
  'rule.subjHon': {
    id: 'rule.subjHon', stage: 's7', levels: ['h23'],
    name: '주체 높임 -시-/-샤-',
    text: '문장의 주어를 높일 때 \'-시-\'를 썼다. 어미 \'-아/-어\'나 \'-오-\' 앞에서는 \'-샤-\'로 나타난다(니[ㄹㆍ]샤[ㄷㆎ]).',
    src: '화법과 언어 205쪽, 208쪽, 공통국어2 133쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB34a', 'O-s7-WS1c', 'O-s7-SS6b', 'O-s7-WS1e', 'O-s7-WS1i']
  },
  'rule.objHon': {
    id: 'rule.objHon', stage: 's7', levels: ['h23'],
    name: '객체 높임 -[ㅅㆍㅂ]-/-[ㅈㆍㅂ]-/-[ㅿㆍㅂ]-',
    text: '목적어나 부사어가 가리키는 대상을 높일 때 \'-[ㅅㆍㅂ]-\', \'-[ㅈㆍㅂ]-\', \'-[ㅿㆍㅂ]-\'을 썼다. 앞 소리에 따라 모양이 달라진다.',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s7-SS6b', 'O-s7-WS1a', 'O-s7-WS1f', 'O-s7-WS1j', 'O-s7-YB29', 'O-s7-YB63']
  },
  'rule.addrHon': {
    id: 'rule.addrHon', stage: 's7', levels: ['h23'],
    name: '상대 높임 -[ㆁㅣ]-',
    text: '듣는 사람을 높일 때 \'-[ㆁㅣ]-\'를 썼다(하쇼셔체).',
    src: '화법과 언어 205쪽, 공통국어2 133쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s4-YB34a', 'O-s4-YB34b', 'O-s7-YB63', 'O-s7-SS6h']
  },

  // ── 8 묻는 말 (고2~3) ──
  'rule.yesNoQ': {
    id: 'rule.yesNoQ', stage: 's8', levels: ['h23'],
    name: '판정 의문 -가',
    text: '의문사 없이 \'예, 아니요\'의 대답을 바라는 물음(판정 의문)은 \'-가\' 계열로 끝났다.',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s8-YB15', 'O-s8-YB88', 'O-s8-WS894']
  },
  'rule.whQ': {
    id: 'rule.whQ', stage: 's8', levels: ['h23'],
    name: '설명 의문 -고',
    text: '\'어느, 엇더, 어듸\' 같은 의문사가 있어 무엇인지 설명해 달라는 물음(설명 의문)은 \'-고\' 계열로 끝났다.',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s8-SS6g', 'O-s8-YB28', 'O-s8-YB47']
  },
  'rule.secondPersonQ': {
    id: 'rule.secondPersonQ', stage: 's8', levels: ['h23'],
    name: '2인칭 의문 -ㄴ다',
    text: '주어가 듣는 사람(너)인 물음은 판정 의문이든 설명 의문이든 \'-ㄴ다\'로 끝났다(듣[ㄴㆍㄴ]다 = 듣느냐).',
    src: '화법과 언어 205쪽 (리서치 05 §2, 10 §5)',
    orig: ['O-s8-SS6f', 'O-s8-SS68', 'O-s8-SS6i']
  },

  // ── 9 나랏말ᄊᆞ미 ──
  'rule.spirit': {
    id: 'rule.spirit', stage: 's9', levels: ['m', 'h1', 'h23'],
    name: '창제 정신',
    text: '훈민정음 서문에는 세 가지 뜻이 담겨 있다. 우리말이 중국말과 달라 한자로는 맞지 않는다는 자주, 글 모르는 백성을 딱하게 여긴 애민, 누구나 쉽게 익혀 날마다 편하게 쓰게 하려는 실용이다.',
    src: '중학 국어 2-2 138쪽, 공통국어2 132쪽 (리서치 02 §4-1, 06 §4, 09 §4-1)',
    orig: ['O-s9-SEOMUN1', 'O-s9-SEOMUN2', 'O-s9-SEOMUN3', 'O-s9-SEOMUN4', 'O-s9-SEOMUN5', 'O-s9-SEOMUN6', 'O-s9-SEOMUN7', 'O-s9-SEOMUN8']
  },

  // ── 10 백 년 뒤 (고2~3, 고1 선택) ──
  'rule.nomI16': {
    id: 'rule.nomI16', stage: 's10', levels: ['h1', 'h23'],
    name: '16세기의 주격 조사',
    text: '16세기 후반 문헌에서도 주격 조사는 아직 \'이\'와 \'ㅣ\'였고, \'가\'는 보이지 않는다(孔子ㅣ).',
    src: '화법과 언어 209쪽 (리서치 05 §2, 11 §4-2)',
    orig: ['O-s10-SOHAK1']
  },
  'rule.separate16': {
    id: 'rule.separate16', stage: 's10', levels: ['h1', 'h23'],
    name: '끊어 적기가 섞임',
    text: '16세기 후반 문헌에는 이어 적기 사이로 체언과 조사를 갈라 적는 끊어 적기가 가끔 섞여 나온다(몸이며, 몸을).',
    src: '화법과 언어 209쪽 (리서치 05 §3-2, 11 §4-2)',
    orig: ['O-s10-SOHAK2', 'O-s10-SOHAK4']
  },
  'rule.harmony16': {
    id: 'rule.harmony16', stage: 's10', levels: ['h23'],
    name: '모음 조화의 흔들림',
    text: '16세기 후반 문헌에는 모음 조화를 지킨 말과 어긴 말이 함께 나온다(지킨 예 父母[ㄹㆍㄹ], 어긴 예 몸을).',
    src: '화법과 언어 209쪽 (리서치 05 §3-2, 11 §4-2, §11)',
    orig: ['O-s10-SOHAK2', 'O-s10-SOHAK4']
  },
  'rule.bangjeom16': {
    id: 'rule.bangjeom16', stage: 's10', levels: ['h1', 'h23'],
    name: '방점의 흔들림',
    text: '16세기에 들어 방점이 15세기만큼 한결같이 찍히지 않고 흔들리다가, 그 뒤로는 쓰이지 않게 되었다.',
    src: '공통국어2 지도서 134쪽 (리서치 05 §3-2)'
  },
  'rule.araea16': {
    id: 'rule.araea16', stage: 's10', levels: ['h1', 'h23'],
    name: '둘째 음절의 ㆍ',
    text: '둘째 음절 이하의 ㆍ가 ㅡ로 바뀌기 시작했다(사[ㅇㆍㄹ] → 사흘).',
    src: '공통국어2 138쪽, 우리말샘 역사 정보 (리서치 05 §3-2, 11 §5)'
  },

  // ── 11 끊어 적는 시대 (고2~3) ──
  'rule.lostZB': {
    id: 'rule.lostZB', stage: 's11', levels: ['h23'],
    name: 'ㅸ과 ㅿ의 소멸',
    text: '근대 자료에는 ㅸ과 ㅿ이 쓰이지 않는다. 그 소리는 사라지거나 다른 소리로 바뀌었다(셔[ㅸㅡㄹ] → 셔울, [ㅁㆍ][ㅿㆍㅁ] → [ㅁㆍ][ㅇㆍㅁ]).',
    src: '화법과 언어 206쪽, 210쪽 (리서치 05 §2, 11 §4-3, §5)',
    orig: ['O-s11-NOGEOL1795']
  },
  'rule.araeaLoss': {
    id: 'rule.araeaLoss', stage: 's11', levels: ['h23'],
    name: 'ㆍ의 소실',
    text: 'ㆍ의 소리는 사라졌지만 글자는 한동안 남아, 같은 글 안에 ㆍ와 ㅏ가 섞여 쓰이기도 했다.',
    src: '화법과 언어 206쪽, 212쪽 (리서치 05 §2, 11 §4-3, §11)',
    orig: ['O-s11-DOKRIP2', 'O-s11-AD1902']
  },
  'rule.palatal': {
    id: 'rule.palatal', stage: 's11', levels: ['h23'],
    name: '구개음화',
    text: 'ㄷ, ㅌ이 ㅣ나 ㅣ로 시작하는 모음 앞에서 ㅈ, ㅊ으로 바뀌었다(둏다 → 죻다 → 좋다).',
    src: '화법과 언어 206쪽, 210쪽 (리서치 05 §2, 11 §4-3, §5)',
    orig: ['O-s11-NOGEOL1670', 'O-s11-NOGEOL1795']
  },
  'rule.rounding': {
    id: 'rule.rounding', stage: 's11', levels: ['h23'],
    name: '원순 모음화',
    text: 'ㅁ ㅂ ㅍ 뒤의 ㅡ가 ㅜ로 바뀌었다(믈 → 물).',
    src: '화법과 언어 206쪽 (리서치 05 §2, 11 §5)'
  },
  'rule.sevenFinals': {
    id: 'rule.sevenFinals', stage: 's11', levels: ['h23'],
    name: '7종성',
    text: '받침을 ㄱ ㄴ ㄹ ㅁ ㅂ ㅅ ㅇ 일곱 글자로 적었다. ㄷ, ㅈ, ㅊ, ㅌ 받침 자리도 ㅅ으로 적었다([ㄱㆍㅅ]다 = 같다).',
    src: '화법과 언어 206쪽 (리서치 05 §2, 11 §4-3)',
    orig: ['O-s11-NOGEOL1795']
  },
  'rule.mixedWriting': {
    id: 'rule.mixedWriting', stage: 's11', levels: ['h23'],
    name: '거듭 적기',
    text: '받침을 앞 음절에 적고 다음 음절 첫소리에도 한 번 더 적는 거듭 적기가 나타났다. 한 글 안에 이어 적기, 끊어 적기, 거듭 적기가 섞여 쓰였다.',
    src: '화법과 언어 206쪽, 211쪽 (리서치 05 §2, 11 §4-3, §11)',
    orig: ['O-s11-DOKRIP1', 'O-s11-DOKRIP4']
  },
  'rule.nomGa': {
    id: 'rule.nomGa', stage: 's11', levels: ['h23'],
    name: '주격 조사 가',
    text: '모음으로 끝난 말 뒤에 주격 조사 \'가\'가 쓰이게 되었다(얼마가, 보기가).',
    src: '화법과 언어 206쪽, 211쪽 (리서치 05 §2, 11 §4-3)',
    orig: ['O-s11-DOKRIP1', 'O-s11-DOKRIP3']
  },
  'rule.nominalGi': {
    id: 'rule.nominalGi', stage: 's11', levels: ['h23'],
    name: '명사형 -기의 확대',
    text: '명사형 어미 \'-기\'가 널리 쓰이게 되었다. 같은 대목이 앞선 판에서는 \'가미\', 뒤의 판에서는 \'가기\'로 적혔다.',
    src: '화법과 언어 210쪽 (리서치 05 §2, 11 §4-3)',
    orig: ['O-s11-NOGEOL1670', 'O-s11-NOGEOL1795', 'O-s11-DOKRIP3']
  },
  'rule.newWords': {
    id: 'rule.newWords', stage: 's11', levels: ['h23'],
    name: '외래 어휘',
    text: '개화기에는 새 문물과 함께 새 낱말이 들어왔다([ㅈㆍ][ㅎㆎㅇ]거 = 자전거).',
    src: '화법과 언어 212쪽 (리서치 05 §2, 11 §4-3)',
    orig: ['O-s11-AD1902']
  },

  // ── 종장 s12 ──
  'rule.changeChain': {
    id: 'rule.changeChain', stage: 's12', levels: ['h1', 'h23'],
    name: '변화의 순서',
    text: '한 낱말이 여러 변화를 차례로 거쳐 지금의 모습이 되었다([ㅁㆍ][ㅿㆍㅁ] → [ㅁㆍ][ㅇㆍㅁ] → [ㅁㆍ]음 → 마음). 변화가 일어난 앞뒤 순서가 중요하다.',
    src: '공통국어2 138쪽, 화법과 언어 210쪽, 우리말샘 역사 정보 (리서치 11 §5)'
  },
  'rule.livingLanguage': {
    id: 'rule.livingLanguage', stage: 's12', levels: ['h1', 'h23'],
    name: '지금도 바뀌는 말',
    text: '국어는 지금도 바뀌고 있다. 줄임말 신어가 생기고, ㅔ와 ㅐ를 구별해 발음하는 사람이 줄고 있다.',
    src: '공통국어2 139쪽 (리서치 11 §6-1)'
  },
  'rule.digitalHangul': {
    id: 'rule.digitalHangul', stage: 's12', levels: ['m'],
    name: '디지털 시대의 한글',
    text: '한글은 자음, 모음 글쇠를 누르는 대로 음절이 바로 완성되고 글자와 소리가 거의 하나씩 맞아, 디지털 기기로 입력하거나 음성을 알아듣게 하기에 좋다.',
    src: '중학 국어 2-2 145~147쪽 (리서치 06 §4, 11 §6-2)'
  }
};
