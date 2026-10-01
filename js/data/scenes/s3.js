'use strict';
/*
 * 스테이지 3 「모아 써야 소리가 된다」 (1446 저잣거리 · 중학교 묶음, 다른 학교급도 들어올 수 있음)
 * - 原文: 『훈민정음』 해례 합자해(O-s3-HJ-*), 용자례 낱말(O-s3-YJ-*), 연서(O-s3-YEONSEO)·종성해(O-s3-JONG8)는 알아 두기.
 *   원문 글자는 블록 id 로만 가리킨다. 대사·풀이는 모두 새로 썼다.
 * - 의뢰: 저잣거리 백성이 물건 이름표를 새 글자로 적어 달라고 한다.
 * - 기믹 syllableBuild(js/gimmicks/README-syllableBuild.md): t1 모아쓰기·모음자 합치기, t2 나란히 쓰기(병서), 연서는 연습 과녁.
 *   과녁 낱말은 모두 합자해·용자례 原文 블록에 실린 말(독 · 신 · 홰 · 쏘다 · 낛 · 사ᄫᅵ)이다.
 * - 학교급: 중학교는 '나란히 쓰기'(rule.naranhi), 고등은 '병서'(rule.byeongseo). 같은 항목 id(s3.r2)를 editions.m 에서 바꾼다.
 */
(function (root) {
  const NM = root.NM = root.NM || {};
  NM.data = NM.data || {};
  NM.data.SCENES = NM.data.SCENES || {};

  const ALL = ['m', 'h1', 'h23'];

  /* ---------- 해독 항목 ---------- */
  const R1 = {
    id: 's3.r1', kind: 'read', levels: ALL, label: '모아쓰기', ruleCard: 'rule.moasseugi',
    prompt: '방과 장사꾼들의 이름표를 살피고, 빈칸에 맞는 말을 고르자.',
    sentence: '새 글자는 낱소리를 적는 글자이지만, {?} 한 음절씩 쓴다.',
    cards: [
      { id: 's3.r1.a', text: '첫소리, 가운뎃소리, 끝소리 글자를 한자리에 모아', correct: true, why: '' },
      { id: 's3.r1.b', text: '자음과 모음을 옆으로 한 줄에 풀어 늘어놓아', correct: false,
        why: 'ㄷ ㅗ ㄱ처럼 풀어 늘어놓지 않았다. 첫소리는 가운뎃소리 위나 왼쪽, 끝소리는 그 아래에 두어 한 음절로 모았다.' },
      { id: 's3.r1.c', text: '음절마다 따로 만든 글자 하나로', correct: false,
        why: '음절마다 글자를 따로 만들었다면 수천 자가 필요했을 것이다. 새 글자는 스물여덟 자를 모아 음절을 이룬다.' }
    ],
    explain: '독은 첫소리 ㄷ, 가운뎃소리 ㅗ, 끝소리 ㄱ을 위아래로 모아 쓴 한 글자다. 낱소리 글자를 모아 음절 단위로 쓰는 것을 모아쓰기라 한다.',
    hints: ['옹기 장수가 소리 낸 "독"을 떠올려 봐. 세 소리가 각각 어디에 놓였지?', 's3.c2'],
    misread: {
      's3.r1.b': [
        { who: 'merchant', text: 'ㄷ, ㅗ, ㄱ을 줄줄이 늘어놓으면 이름표가 옹기보다 길어지겠소!', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '하하, 그렇게 쓰지 않아요. 세 글자를 한자리에 모아 "독" 한 글자로 써요.', expr: 'smile' }
      ],
      's3.r1.c': [
        { who: 'merchant', text: '음절마다 새 글자라면, 물건 이름 다 적으려면 글자를 몇 천 개나 외워야 하오?', cg: 'mis_commoner_puzzled' },
        { who: 'senior', text: '걱정 마세요. 스물여덟 자를 모아서 쓰니까, 그 글자들만 알면 어떤 이름이든 적을 수 있어요.' }
      ]
    }
  };

  // 고등판: 병서 (rule.byeongseo)
  const R2_H = {
    id: 's3.r2', kind: 'read', levels: ['h1', 'h23'], label: '병서', ruleCard: 'rule.byeongseo',
    sentence: '같은 글자를 나란히 쓴 ㄲ ㅆ ㆅ은 {?}이고, 서로 다른 글자를 이어 쓴 ㅼ ㅳ ㅴ은 합용 병서다.',
    cards: [
      { id: 's3.r2.a', text: '각자 병서', correct: true, why: '' },
      { id: 's3.r2.b', text: '합용 병서', correct: false,
        why: '합용 병서는 ㅼ ㅳ처럼 서로 다른 글자를 이어 쓴 것이다. ㄲ ㅆ은 같은 글자를 겹쳤다.' },
      { id: 's3.r2.c', text: '연서', correct: false,
        why: '연서는 ㅸ처럼 입술소리 아래에 ㅇ을 이어 쓰는 방법이다. 옆으로 나란히 붙여 쓰는 병서와 다르다.' },
      { id: 's3.r2.d', text: '가획', correct: false,
        why: '가획은 ㄱ에서 ㅋ을 만들듯 획을 더해 새 글자를 만드는 원리다. 병서는 이미 있는 글자를 나란히 붙여 쓰는 방법이다.' }
    ],
    explain: '자음 글자를 나란히 붙여 쓰는 것을 병서라 한다. 쏘다의 ㅆ처럼 같은 글자를 겹치면 각자 병서, 짝의 첫소리 ㅶ처럼 다른 글자를 이으면 합용 병서다. 낛, 흙처럼 끝소리 자리에도 나란히 쓴다.',
    hints: ['아이가 말한 소다와 쏘다를 견주어 봐. 무엇을 겹쳤지?', 's3.c4'],
    misread: {
      's3.r2.b': [
        { who: 'child', text: 'ㅅ하고 ㅅ이 서로 다른 글자예요? 제 눈엔 똑같은데!', cg: 'mis_child_laughing' },
        { who: 'senior', text: '맞아, 똑같지. 같은 글자를 겹친 건 각자 병서야. 합용 병서는 짝의 ㅶ처럼 다른 글자를 이은 거고.' }
      ],
      's3.r2.c': [
        { who: 'child', text: 'ㅇ을 붙이는 거예요? 쏘다에는 ㅇ이 없는데요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '그렇네. ㅇ을 아래에 이어 쓰는 건 연서야. 쏘다의 ㅆ은 ㅅ을 옆으로 나란히 겹친 각자 병서고.' }
      ],
      's3.r2.d': [
        { who: 'child', text: '획을 더하면 ㅅ이 ㅈ이 되잖아요. 그럼 쏘다가 조다가 돼요!', cg: 'mis_child_laughing' },
        { who: 'senior', text: '하하, 그러네. 획을 더하면 아예 다른 글자가 돼. ㅆ은 ㅅ을 나란히 겹쳐 쓴 각자 병서야.', expr: 'smile' }
      ]
    }
  };

  // 중학교판: 나란히 쓰기 (rule.naranhi) — '병서'·'연서' 낱말을 쓰지 않는다
  const R2_M = {
    id: 's3.r2', kind: 'read', levels: ['m'], label: '나란히 쓰기', ruleCard: 'rule.naranhi',
    sentence: '자음 글자를 {?} 된소리(ㄲ ㄸ ㅃ ㅆ ㅉ)나 겹받침(ㄳ ㄺ ㅄ)을 나타낸다.',
    cards: [
      { id: 's3.r2.a', text: '옆으로 나란히 써서', correct: true, why: '' },
      { id: 's3.r2.b', text: '획을 하나 더 그어서', correct: false,
        why: '획을 더하면 ㅅ이 ㅈ이 되듯 다른 글자가 된다. ㄱ에서 ㅋ을 만든 것은 거센소리를 위한 가획이고, 된소리 ㄲ은 ㄱ을 나란히 쓴 것이다.' },
      { id: 's3.r2.c', text: '처음부터 따로 만든 기본 글자로 바꾸어', correct: false,
        why: 'ㄲ ㄸ ㅃ ㅆ ㅉ은 스물여덟 자의 첫소리 열일곱 자 안에 따로 들어 있지 않다. 있는 글자를 나란히 써서 나타냈다.' }
    ],
    explain: '쏘다의 ㅆ처럼 같은 자음을 옆으로 나란히 쓰면 된소리를 적는다. 낛의 ㄳ, 흙의 ㄺ처럼 끝소리 자리에 서로 다른 자음을 나란히 쓰면 겹받침이 된다.',
    hints: ['아이가 말한 소다와 쏘다를 견주어 봐. 무엇이 하나 더 붙었지?', 's3.c4'],
    misread: {
      's3.r2.b': [
        { who: 'child', text: '획을 더하면 ㅅ이 ㅈ이 되잖아요. 그럼 쏘다가 조다가 돼요!', cg: 'mis_child_laughing' },
        { who: 'senior', text: '하하, 맞는 말이야. 획을 더하면 다른 글자가 돼. 쏘다는 ㅅ 옆에 ㅅ을 하나 더 나란히 쓴 거야.', expr: 'smile' }
      ],
      's3.r2.c': [
        { who: 'child', text: '따로 만든 글자라면서, ㅆ은 왜 ㅅ 두 개처럼 생겼어요?', cg: 'mis_child_laughing' },
        { who: 'senior', text: '잘 봤어. ㅆ은 새로 만든 글자가 아니라 ㅅ을 옆으로 나란히 쓴 거야. 그래서 ㅅ 두 개로 보이지.' }
      ]
    }
  };

  const R3 = {
    id: 's3.r3', kind: 'read', levels: ALL, label: '모음자 합치기', ruleCard: 'rule.vowelJoin',
    sentence: '이미 만든 모음자를 다시 {?} ㅘ ㅝ ㅐ ㅔ 같은 모음자를 만든다.',
    cards: [
      { id: 's3.r3.a', text: '합해서(ㅗ와 ㅏ를 합하면 ㅘ)', correct: true, why: '' },
      { id: 's3.r3.b', text: '획을 더해서', correct: false,
        why: '소리가 세질 때 획을 더한 것은 자음 기본 글자에서 쓴 방법이다. ㅘ는 ㅗ와 ㅏ를 합친 모음자다.' },
      { id: 's3.r3.c', text: '나란히 써서 된소리로 바꾸어', correct: false,
        why: '나란히 써서 된소리를 나타내는 것은 자음 이야기다. ㅘ는 세게 내는 ㅏ가 아니라 ㅗ와 ㅏ를 합친 모음자다.' }
    ],
    explain: '거문고의 괘를 적은 "과"는 ㅗ와 ㅏ를, 횃불감 홰는 ㅗ와 ㅏ와 ㅣ를 가운뎃소리 자리에 합쳐 썼다. 이미 만든 모음자를 다시 합해 새 모음자를 만든다.',
    hints: ['선비가 말한 괘("과")를 보자. 가운뎃소리 자리에 모음자가 몇 개 들었지?', 's3.c6'],
    misread: {
      's3.r3.b': [
        { who: 'yangban', text: '획을 더했다고? 내 눈에는 ㅗ와 ㅏ가 나란히 붙어 있을 뿐이네만.', cg: 'mis_yangban_offended' },
        { who: 'senior', text: '제가 잘못 보았네요. 획을 더한 게 아니라 ㅗ와 ㅏ를 합친 거예요.' }
      ],
      's3.r3.c': [
        { who: 'yangban', text: '된소리라니. 괘를 세게 부르면 거문고 줄이 놀라겠네.', cg: 'mis_yangban_offended' },
        { who: 'senior', text: '죄송해요. 된소리는 자음을 나란히 쓸 때의 이야기예요. "과"는 ㅗ와 ㅏ를 합친 모음자예요.' }
      ]
    }
  };

  /* ---------- 기믹 과제 (syllableBuild) ---------- */
  const T1 = {
    id: 's3.t1', kind: 'task', levels: ALL, label: '물건 이름표 쓰기',
    prompt: '사람들이 내민 빈 이름표에 물건 이름을 적어 주자. 자리마다 글자 블록을 모아 한 글자로.',
    gimmick: 'syllableBuild',
    config: {
      orig: ['O-s3-HJ-SAM'],
      targets: [
        { id: 'dok', prompt: '옹기 장수의 독. 첫소리, 가운뎃소리, 끝소리 자리에 글자를 모아 보자.', orig: 'O-s3-YJ-JONG-G', tray: ['ㄷ', 'ㅌ', 'ㅗ', 'ㅜ', 'ㄱ', 'ㅋ'] },
        { id: 'sin', prompt: '아낙의 짚신. 이름표에 "신"을 써 보자.', orig: 'O-s3-YJ-JONG-N', tray: ['ㅅ', 'ㅈ', 'ㅣ', 'ㅡ', 'ㄴ', 'ㅁ'] },
        { id: 'hwae', prompt: '노점의 홰(횃불감). 가운뎃소리 자리에 모음자를 합쳐 보자.', orig: 'O-s3-HJ-JUNGHAP', tray: ['ㅎ', 'ㅇ', 'ㅗ', 'ㅏ', 'ㅣ', 'ㅜ', 'ㅓ'] }
      ]
    },
    answer: {
      dok: { cho: 'ㄷ', jung: 'ㅗ', jong: 'ㄱ' },
      sin: { cho: 'ㅅ', jung: 'ㅣ', jong: 'ㄴ' },
      hwae: { cho: 'ㅎ', jung: 'ㅗㅏㅣ', jong: '' }
    },
    hints: ['홰는 ㅗ, ㅏ, ㅣ 셋을 모두 가운뎃소리 자리에 넣어야 해.', { hwae: ['jung'] }],
    explain: '독과 신은 첫소리, 가운뎃소리, 끝소리를 모아 쓴 한 글자다. 홰는 가운뎃소리 자리에 ㅗ, ㅏ, ㅣ를 합쳐 썼다.'
  };

  const T2 = {
    id: 's3.t2', kind: 'task', levels: ALL, label: '센소리와 겹받침',
    prompt: '아이와 생선 가게 주인의 말을 적어 주자. 한 자리에 자음 글자 둘을 나란히 넣어야 해.',
    gimmick: 'syllableBuild',
    config: {
      targets: [
        { id: 'sso', prompt: '아이가 말한 쏘다의 첫 글자. 첫소리 자리에 ㅅ을 둘 넣어 보자.', orig: 'O-s3-HJ-GAKJA', tray: ['ㅅ', 'ㅈ', 'ㅊ', 'ㅗ', 'ㅜ', 'ㅏ'] },
        { id: 'naks', prompt: '생선 가게의 낛(낚시). 끝소리 자리에 글자 둘을 나란히 넣어 보자.', orig: 'O-s3-HJ-JONGHAP', tray: ['ㄴ', 'ㄷ', 'ㅏ', 'ㅓ', 'ㄱ', 'ㅅ', 'ㄹ'] },
        { id: 'sabi', prompt: '덤으로 해 보기: 새우를 적은 사[ㅸㅣ]의 둘째 글자. ㅂ 아래에 ㅇ을 이어 쓴 글자야.', orig: 'O-s3-YJ-CHO-BB', practice: true, tray: ['ㅂ', 'ㅇ', 'ㅅ', 'ㅣ'] }
      ]
    },
    answer: {
      sso: { cho: 'ㅅㅅ', jung: 'ㅗ', jong: '' },
      naks: { cho: 'ㄴ', jung: 'ㅏ', jong: 'ㄱㅅ' }
    },
    hints: ['쏘의 첫소리 자리에는 ㅅ이 두 개 들어가.', { sso: ['cho'] }],
    explain: '쏘의 첫소리는 ㅅ을 둘 나란히 써서 된소리를 적었고, 낛은 끝소리 자리에 ㄱ과 ㅅ을 나란히 썼다. 사[ㅸㅣ]의 ㅸ은 덤으로 본 글자다.'
  };

  const ITEMS_H = [R1, R2_H, R3, T1, T2];
  const ITEMS_M = [R1, R2_M, R3, T1, T2];

  NM.data.SCENES['s3'] = {
    id: 's3',
    title: '모아 써야 소리가 된다',
    era: '1446 · 저잣거리',
    mapKey: 's3',
    bgmKey: 'bgm_s3',
    carveGlyph: 'ㅘ',
    cast: {
      merchant: { name: '옹기 장수', portrait: 'merchant' },
      woman: { name: '짚신 파는 아낙', portrait: 'commoner_woman' },
      child: { name: '아이', portrait: 'child' },
      yangban: { name: '선비', portrait: 'yangban_man' }
    },

    intro: [
      { who: 'narrator', text: '1446년, 새 글자를 세상에 알린 해. 저잣거리에 빈 나무 이름표를 든 사람들이 줄을 섰다.', cg: 's3_intro' },
      { who: 'senior', text: '<@아>, 여기야. 새 글자가 나왔다는 소문에 다들 제 물건 이름을 적어 달라며 몰려왔어.' },
      { who: 'me', text: '글자는 스물여덟 자뿐인데, 물건 이름을 어떻게 다 적어요?', expr: 'thinking' },
      { who: 'senior', text: '글자를 따로따로 늘어놓지 않고 모아서 쓰거든. 그게 오늘 할 일이야.' }
    ],

    request: [
      { who: 'merchant', text: '통사 양반, 내 옹기에 "독"이라고 이름표 좀 붙여 주오. 손님마다 물어 대서 목이 쉬겠소.' },
      { who: 'woman', text: '저는 짚신을 팔아요. "신"이라고 써 주세요.' }
    ],

    encounter: {
      orig: ['O-s3-HJ-SAM'],
      lines: [
        { who: 'senior', text: '해례에 이렇게 적혀 있어. 첫소리, 가운뎃소리, 끝소리 셋이 모여야 비로소 한 글자가 된다는 뜻이야.' }
      ]
    },

    example: {
      orig: ['O-s3-YJ-CHO-G'],
      lines: [
        { who: 'senior', text: '해례가 보기로 든 낱말 "감"을 풀어 볼게. ㄱ 소리, ㅏ 소리, ㅁ 소리가 나지?' },
        { who: 'senior', text: 'ㄱ은 왼쪽 위, ㅏ는 그 오른쪽, ㅁ은 아래에 모으면 한 글자 "감"이 돼. 길에서 같은 방법이 쓰인 곳을 두 군데씩 찾아보자.' }
      ]
    },

    needs: [
      { rule: 'rule.vowelCompound', lines: [
        { who: 'senior', text: '하나만 먼저 알려 줄게. 모음 ㅗ는 ㆍ와 ㅡ를, ㅏ는 ㅣ와 ㆍ를 합쳐 만든 글자야. 기본 글자를 합쳐 모음을 만든다는 걸 기억해 둬.' }
      ] }
    ],

    contexts: [
      {
        id: 's3.c1', label: '벽에 붙은 방',
        orig: ['O-s3-HJ-CHO', 'O-s3-HJ-JUNG', 'O-s3-HJ-JONG'],
        lines: [
          { who: 'narrator', text: '흰 담벼락에 새 글자 쓰는 법을 적은 방이 붙어 있다.', fiction: 'fiction.bang' },
          { who: 'senior', text: '첫소리는 가운뎃소리 위나 왼쪽에, 끝소리는 그 아래에 둔대. 글자마다 앉을 자리가 정해져 있어.' }
        ],
        items: ['s3.r1']
      },
      {
        id: 's3.c2', label: '옹기 가게의 장수',
        orig: ['O-s3-YJ-JONG-G'],
        lines: [
          { who: 'merchant', text: '독이라… "드" 하고 "오" 하고, 끝에 "윽" 하는 소리가 나는구먼.' },
          { who: 'merchant', text: '세 소리를 위아래로 포개니 한 덩이 글자가 되네. 신기하구려.' }
        ],
        items: ['s3.r1']
      },
      {
        id: 's3.c7', label: '곡식 노점',
        orig: ['O-s3-YJ-CHO-K', 'O-s3-JONG8'],
        lines: [
          { who: 'narrator', text: '곡식 노점에 콩과 피가 자루마다 담겨 있다.' },
          { who: 'senior', text: '해례 보기 낱말에도 콩이 있어. 첫소리 ㅋ, 가운뎃소리 ㅗ, 끝소리 ㆁ을 모아 한 글자로 썼지.' }
        ],
        items: ['s3.r1']
      },
      {
        id: 's3.c3', label: '생선 가게 처마',
        orig: ['O-s3-HJ-JONGHAP', 'O-s3-YJ-CHO-BB', 'O-s3-YEONSEO'],
        lines: [
          { who: 'narrator', text: '생선 가게 처마에 낚싯대와 마른 새우가 걸려 있다.' },
          { who: 'senior', text: '낚시를 해례에서는 "낛"으로 적었어. 끝소리 자리에 ㄱ과 ㅅ을 나란히 썼지. 흙도 ㄹ과 ㄱ을 나란히 써서 [ㅎㆍㄺ]이야.' }
        ],
        items: ['s3.r2']
      },
      {
        id: 's3.c4', label: '장난감 활을 든 아이',
        orig: ['O-s3-HJ-GAKJA', 'O-s3-HJ-HAPYONG'],
        lines: [
          { who: 'child', text: '"소다"는 그릇을 엎는 거고, "쏘다"는 활을 쏘는 거래요!' },
          { who: 'child', text: 'ㅅ 옆에 ㅅ을 하나 더 붙였을 뿐인데 소리가 세져요. 쏘!' }
        ],
        items: ['s3.r2']
      },
      {
        id: 's3.c5', label: '짚단 쌓인 수레 노점',
        orig: ['O-s3-HJ-JUNGHAP'],
        lines: [
          { who: 'narrator', text: '짚단과 마른 장작을 쌓아 둔 수레 노점. 밤길에 쓸 홰(횃불감)를 판다.' },
          { who: 'senior', text: '홰는 가운뎃소리 자리에 ㅗ와 ㅏ와 ㅣ를 합쳐 썼어. 이미 만든 모음자를 다시 합친 거지.' }
        ],
        items: ['s3.r3']
      },
      {
        id: 's3.c6', label: '옷감 가게 앞의 선비',
        lines: [
          { who: 'yangban', text: '거문고 줄을 받치는 괘를 사러 나왔네. 새 글자로는 "과"라 적는다지?' },
          { who: 'yangban', text: 'ㅗ 곁에 ㅏ를 붙이니 두 소리가 한 소리처럼 이어지는군. 재미있네.' }
        ],
        items: ['s3.r3']
      }
    ],

    npcs: {
      's3.woman': {
        name: '짚신 파는 아낙',
        lines: [{ who: 'woman', text: '짚신에 "신" 한 글자만 적혀 있어도 손님이 바로 알아보겠지요?' }]
      }
    },

    items: ITEMS_H,

    notes: [
      { id: 'note.s3.yeonseo', kind: 'know', title: '이어 쓴 글자 ㅸ',
        text: 'ㅸ처럼 입술소리 아래에 ㅇ을 이어 쓰면 입술을 가볍게 붙였다 떼는 소리가 된다. 이렇게 이어 쓴 글자는 스물여덟 자에 들지 않는다. 채점하지 않는 알아 두기다.',
        src: '『훈민정음』 해례 제자해 O-s3-YEONSEO (리서치 09 §4-5), 중학 국어 2-2 지도서 보충 (리서치 06 §4)', at: ['s3.c3'] },
      { id: 'note.s3.jong8', kind: 'know', title: '받침 여덟 자',
        text: '해례 종성해는 받침을 ㄱ ㆁ ㄷ ㄴ ㅂ ㅁ ㅅ ㄹ 여덟 글자만으로도 넉넉히 쓸 수 있다고 했다. 콩의 ㆁ도 그 여덟 자 가운데 하나다. 채점하지 않는 알아 두기다.',
        src: '『훈민정음』 해례 종성해 O-s3-JONG8 (리서치 09 §4-5)', at: ['s3.c7'] },
      { id: 'note.s3.jonghap', kind: 'variant', title: '흙과 유시 앞의 점',
        text: '이 구절의 [ㅎㆍㄺ]과 [ㄷㆍㅩ] 앞에 점(방점)을 하나씩 더 찍은 입력본이 하나 있다. 여기서는 여러 입력본이 함께 따르는 쪽(점 없음)을 실었다.',
        src: '리서치 09 §4-5 (O-s3-HJ-JONGHAP, 교과서 대조 필요)', at: ['s3.c3'] }
    ],

    fiction: [
      { id: 'fiction.tongsa', text: '정음 통사 — 새 글자(정음)와 사람들의 말 사이를 이어 주는 통역관',
        real: '이런 직책은 없었어요. 이 이야기를 위해 지은 설정이에요.' },
      { id: 'fiction.bang', text: '저잣거리 담벼락에 새 글자 쓰는 법을 적은 방',
        real: '이런 방이 붙었다는 기록은 없어요. 해례 합자해에 적힌 내용을 방으로 옮겨 보인 설정이에요.' }
    ],

    translate: {
      id: 's3.x1',
      text: '첫소리, 가운뎃소리, 끝소리 셋이 모여야 비로소 한 글자가 된다.',
      lines: [
        { who: 'narrator', text: '이름표마다 새 글자가 한 덩이씩 또렷하다. 아낙과 아이가 이름표를 높이 들어 보인다.', cg: 's3_climax' },
        { who: 'woman', text: '"신"! 정말 우리 짚신 이름이네요. 한 글자 안에 소리가 다 들었어요.' },
        { who: 'merchant', text: '독 한 글자에 소리가 셋이나 들었구먼. 이제 손님한테 이름표만 가리키면 되겠소.' },
        { who: 'senior', text: '스물여덟 자를 모으고, 나란히 쓰고, 합치니 어떤 말이든 적을 수 있지. <@아>, 수고했어.', expr: 'smile' }
      ]
    },

    editions: {
      m: { items: ITEMS_M }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
