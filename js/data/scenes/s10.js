'use strict';
/*
 * 장면 10 「백 년 뒤」 — 16세기 후반 서당. 고2~3 묶음, 고1 '추천 선택'(중학교가 들어오면 고1 범위).
 * 原文: 『소학언해』 권2 O-s10-SOHAK1~4(화법과 언어 209쪽), 『훈몽자회』 O-s10-HUNMONG1~3(알아 두기만, 중학 국어 2-2 155쪽),
 *       15세기 쪽 견주기 O-s6-SS6e(『석보상절』 권6).
 * 지킬 것(리서치 11 §0·§8·§9):
 *  - 『소학언해』의 방점 층은 교과서 1종뿐(△)이라 견주어 채점하지 않는다. 방점 흔들림 규칙은 15세기 책과
 *    공통국어2 지도서 134쪽 사실(알아 두기)로만 세운다. 수첩의 방점 줄은 graded:false.
 *  - O-s10-SOHAK4 의 '道' 뒤 조사는 판마다 달라(·를 / ᄅᆞᆯ) 모음 조화 근거로 쓰지 않는다(이본 노트만).
 *  - ㆍ 둘째 음절 → ㅡ 는 『소학언해』 대목에 原文 근거가 없다(사흘은 이 대목에 없음). 그래서 수첩의 그 줄은
 *    graded:false 로 두고, 규칙은 공통국어2 138쪽의 낱말 사슬(사ᄋᆞᆯ → 사흘, 알아 두기)과 『소학언해』에 ㆍ가
 *    그대로 적힌 낱말로 세운다. 바뀐 해(연도)는 채점하지 않는다.
 *  - 고1(그리고 고1 범위를 쓰는 중학교)은 모음 조화를 배우지 않는다 → s10.r3 과 수첩 모음 조화 줄은 고2~3만.
 * 화면 글은 모두 새로 썼다(교과서·번역서·시험 문장 아님).
 */
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};

(function () {
  // 두 시대 수첩(기믹 twoEraNotebook) — 고2~3판과 고1판이 모음 조화 줄 하나만 다르다.
  const PAGE15 = {
    orig: ['O-s6-SS6e'],
    words: [
      { id: 'e.ne', match: ':네' },
      { id: 'e.saram', match: ':사[ㄹㆍ]·[ㅁㆎ]' },
      { id: 'e.mom', match: '·모·[ㅁㆍㄹ]' },
      { id: 'e.buteo', match: '부텨·를' }
    ]
  };
  const PAGE16 = {
    orig: ['O-s10-SOHAK1', 'O-s10-SOHAK2', 'O-s10-SOHAK3', 'O-s10-SOHAK4'],
    words: [
      { id: 's.i', block: 'O-s10-SOHAK1', match: 'ㅣ' },
      { id: 's.mom1', block: 'O-s10-SOHAK2', match: '·몸·이며' },
      { id: 's.eolgul', block: 'O-s10-SOHAK2', match: '얼굴·이며' },
      { id: 's.salhan', block: 'O-s10-SOHAK2', match: '·[ㅅㆍㄹ]·[ㅎㆍㄴ]' },
      { id: 's.geosira', block: 'O-s10-SOHAK2', match: '거·시·라' },
      { id: 's.bireuso', block: 'O-s10-SOHAK3', match: '비·르·소미·오' },
      { id: 's.mom2', block: 'O-s10-SOHAK4', match: '·몸·을' },
      { id: 's.bumo', block: 'O-s10-SOHAK4', match: '{父|·부}{母|:모}[ㄹㆍㄹ]' },
      { id: 's.machm', block: 'O-s10-SOHAK4', match: '[ㅁㆍ]·[ㅊㆍㅁ]·이니·라' }
    ]
  };
  const ROW_NOM = { id: 'nom', label: '주격 조사는 여전히 ㅣ일까?', ex15: ['e.ne'] };
  const ROW_GA = { id: 'ga', label: '이 대목에 주격 조사 ‘가’가 보일까?' };
  const ROW_CUT = { id: 'cut', label: '체언과 조사를 늘 이어 적을까?', ex15: ['e.mom', 'e.saram'] };
  const ROW_VH = { id: 'vh', label: '조사가 모음 조화를 지킬까?', ex15: ['e.mom', 'e.buteo'] };
  const ROW_BJ = {
    id: 'bj', label: '방점', graded: false,
    note: '방점은 16세기 중엽부터 흔들리다가 16세기 말엽의 책부터는 찍지 않게 된다.',
    src: '공통국어2 지도서 134쪽 · 리서치 11 §8'
  };
  const ROW_ARAEA = {
    id: 'araea', label: '둘째 음절의 ㆍ', graded: false,
    note: '사[ㅇㆍㄹ]이 사흘로 바뀐 것처럼, 둘째 음절의 ㆍ가 ㅡ로 바뀌기 시작한 때다.',
    src: '공통국어2 138쪽 · 우리말샘 역사 정보(사흘) · 리서치 11 §5'
  };
  // 『훈몽자회』 자모 이름 알아 두기는 마루 끝 맥락(s10.c8)의 s10.n5 에 있다 — 수첩에서는 뺐다(시간 조정, Q2).
  const T_HINTS = ['15세기 쪽 보기 낱말과 같은 자리를 16세기 글에서 찾아보자. 체언 뒤에 조사가 어떻게 붙었는지 보면 돼.', 'cut'];

  function notebook(id, levels, rows, answer, explain) {
    return {
      id, kind: 'task', levels, label: '두 시대 수첩', gimmick: 'twoEraNotebook',
      prompt: '15세기 쪽과 16세기 쪽을 나란히 펴고, 줄마다 지켜짐 · 흔들림 · 없음을 고른 뒤 16세기 글에서 근거 낱말을 골라 보자.',
      config: { page15: PAGE15, page16: PAGE16, rows },
      answer, hints: T_HINTS, explain
    };
  }

  const NEEDS_BASE = [
    { rule: 'rule.nomCase', lines: [{ who: 'senior', text: '15세기 주격 조사부터 짚고 가자. 받침 뒤에는 ‘이’, ㅣ가 아닌 모음 뒤에는 ‘ㅣ’, ㅣ로 끝난 말 뒤에는 아무것도 붙이지 않았어. ‘가’는 아직 없었고.' }] },
    { rule: 'rule.linkedWriting', lines: [{ who: 'senior', text: '15세기 책은 받침을 뒤 음절 첫소리로 옮겨 소리 나는 대로 이어 적었어. ‘몸’에 ‘을’이 붙으면 ‘모[ㅁㆍㄹ]’처럼.' }] },
    { rule: 'rule.bangjeom', lines: [{ who: 'senior', text: '글자 왼쪽의 점은 방점이야. 소리의 높낮이를 나타냈지. 점이 없으면 평성, 하나면 거성, 둘이면 상성.' }] }
  ];
  const NEED_HARMONY = { rule: 'rule.vowelHarmony', lines: [{ who: 'senior', text: '모음 조화도 떠올려 둬. 양성 모음(ㆍ ㅗ ㅏ)은 양성끼리, 음성 모음(ㅡ ㅜ ㅓ)은 음성끼리 어울렸어. 그래서 조사도 앞말에 따라 ‘[ㅇㆍㄹ]’과 ‘을’로 갈렸지.' }] };

  NM.data.SCENES['s10'] = {
    id: 's10',
    title: '백 년 뒤',
    era: '16세기 후반 · 서당',
    mapKey: 's10',
    bgmKey: 'bgm_s10',
    carveGlyph: 'ㅿ',
    bangjeomAlways: true,
    cast: {
      teacher: { name: '훈장', portrait: 'teacher_16c' },
      kid1: { name: '학동 막동이', portrait: 'student_16c' },
      kid2: { name: '학동 큰돌이', portrait: 'student_16c' },
      kid3: { name: '학동 작은돌이', portrait: 'student_16c' }
    },
    fiction: [
      { id: 'fiction.tongsa', text: '정음 통사: 새 글자와 사람들의 말 사이를 이어 주는 통역관.', real: '이런 직책은 없었어요. 조선의 통사는 외국어 통역관이었고, 정음 통사는 이 이야기에서 지어낸 일이에요.' },
      { id: 'fiction.century', text: '서문을 다 읽고 돌아가려던 길이 백 년 뒤 서당에 닿았다.', real: '시간을 건너는 길은 이야기 설정이에요. 『소학언해』는 1587년에 언해를 마치고 1588년에 펴낸 실제 책이에요.' }
    ],

    intro: [
      { who: 'narrator', text: '종이 냄새, 그리고 웅얼웅얼 글 읽는 소리. 눈을 떠 보니 기와집 마당이다.', cg: 's10_intro' },
      { who: 'senior', text: '<@아>, 정신 들었어? 우리가 일하던 때에서 백 년쯤 흘렀나 봐. 여긴 서당이야.', expr: 'surprised', fiction: 'fiction.century' },
      { who: 'senior', text: '말이 얼마나 달라졌는지 살피는 게 우리 정음 통사의 일이지.', fiction: 'fiction.tongsa' }
    ],
    request: [
      { who: 'teacher', text: '손님들, 글을 안다고? 아이들이 『소학』 언해본을 소리 내어 읽기는 하는데 뜻을 물으면 입을 꾹 다무오. 백 년 전 책과 견주어 아이들에게 읽어 주시오.' },
      { who: 'kid1', text: '손님, 우리 할아버지 책엔 점이 빼곡한데 이 책은 왜 다르게 생겼어요?' }
    ],
    encounter: {
      orig: ['O-s10-SOHAK1'],
      lines: [
        { who: 'senior', text: '이게 오늘 읽을 『소학언해』 첫 구절이야. 공자가 제자 증자에게 말을 건네는 대목이지.' },
        { who: 'senior', text: '15세기 책과 비슷해 보여도 백 년이야. 어디가 그대로고 어디가 흔들리는지 견주어 보자.' }
      ]
    },
    example: {
      orig: ['O-s10-SOHAK2'],
      lines: [
        { who: 'senior', text: '내가 하나 풀어 볼게. 여기 ‘[ㅺㅢ]’를 봐. 첫소리에 자음 둘을 나란히 적었지?' },
        { who: 'senior', text: '15세기 책에도 이렇게 첫소리에 자음을 겹쳐 적은 말이 있었어. 그러니 이건 백 년 동안 **지켜진** 모습이야.' },
        { who: 'senior', text: '이렇게 16세기 글에서 같은 자리를 찾아 지켜졌는지 흔들렸는지 보면 돼. 아이들이 읽는 대목은 마당 곳곳에 있어.' }
      ]
    },
    needs: NEEDS_BASE.concat([NEED_HARMONY]),

    contexts: [
      {
        id: 's10.c1', label: '훈장의 책상',
        orig: ['O-s10-SOHAK1'],
        lines: [
          { who: 'teacher', text: '공자께서 증자를 불러 말씀하시는 첫머리요. 아이들이 ‘공자’ 뒤에 붙은 작은 글자를 자꾸 빼먹고 읽소.' },
          { who: 'senior', text: '‘{孔子|공자}’ 바로 뒤의 ‘ㅣ’ 말이지. 누가 말했는지를 알려 주는 자리야.' }
        ],
        items: ['s10.r1']
      },
      {
        id: 's10.c2', label: '막동이의 글 읽기',
        orig: ['O-s10-SOHAK2'],
        lines: [
          { who: 'kid1', text: '몸이며, 얼굴이며, 머리털이며… 다 부모님께 받은 거래요. 그런데 ‘거시라’는 왜 붙여서 써요?' },
          { who: 'senior', text: '좋은 질문이야. 같은 줄에서 ‘몸이며’는 체언과 조사를 갈라 적었고, ‘거시라’는 ‘것’의 받침을 뒤로 넘겨 이어 적었어.' },
          { who: 'senior', text: '‘[ㅅㆍㄹ][ㅎㆍㄴ]’도 봐 둬. 둘째 음절에 ㆍ가 아직 그대로 적혀 있지.' }
        ],
        items: ['s10.r2', 's10.r3', 's10.r5']
      },
      {
        id: 's10.c3', label: '큰돌이의 글 읽기',
        orig: ['O-s10-SOHAK3'],
        lines: [
          { who: 'kid2', text: '함부로 다치게 하지 않는 게 효도의 시작이래요. 그럼 ‘홈이’는 누가 뭘 한다는 말이에요?' },
          { who: 'senior', text: '‘홈’은 ‘하는 일’쯤 되는 말이고, 받침 ㅁ 뒤에 주격 조사 ‘이’가 붙었어. 그 일이 바로 효도의 시작이라는 거지.' }
        ],
        items: ['s10.r1']
      },
      {
        id: 's10.c4', label: '평상 위에 펼친 책',
        orig: ['O-s10-SOHAK4'],
        lines: [
          { who: 'senior', text: '『소학』의 이 대목 끝부분이야. 이름을 뒷세상에 남겨 부모를 빛내는 것이 효도의 마지막이라고 했지.' },
          { who: 'senior', text: '‘몸을’과 ‘父母[ㄹㆍㄹ]’에 붙은 조사를 견주어 봐. 그리고 ‘[ㅁㆍ][ㅊㆍㅁ]이니라’는 어떻게 적었는지도.' }
        ],
        items: ['s10.r2', 's10.r3']
      },
      {
        id: 's10.c5', label: '헛간 앞 책 보따리',
        orig: ['O-s6-SS6e'],
        lines: [
          { who: 'narrator', text: '보따리 안에 낡은 책 한 권. 백 년 전에 찍은 『석보상절』이다.' },
          { who: 'senior', text: '15세기 책은 이렇게 글자마다 방점을 또박또박 찍었어. 점이 없는 글자는 평성이라 일부러 비워 둔 거고.' }
        ],
        items: ['s10.r4']
      },
      {
        id: 's10.c6', label: '훈장의 말',
        lines: [
          { who: 'teacher', text: '그 점 말이오? 요즘은 같은 책을 베껴도 점을 다 찍는 이가 드물고, 어디에 몇 개를 찍는지도 사람마다 말이 다르오.' },
          { who: 'senior', text: '방점은 16세기 중엽부터 찍는 방식이 흔들렸고, 16세기 말엽의 책부터는 아예 찍지 않게 돼.' },
          { who: 'senior', text: '15세기 책과 견주어 보면 그 차이가 더 잘 보일 거야.' }
        ],
        items: ['s10.r4']
      },
      {
        id: 's10.c7', label: '우물가 작은돌이',
        lines: [
          { who: 'kid3', text: '훈장님이 ‘사흘’ 뒤에 외워 오라 하셨는데, 할아버지 책에는 ‘사[ㅇㆍㄹ]’이라고 적혀 있어요. 어느 게 맞아요?' },
          { who: 'senior', text: '‘사흘’의 옛 모습이 ‘사[ㅇㆍㄹ]’이야. 15세기 책에는 ‘사[ㅇㆍㄹ]’, 16세기부터는 ‘사흘’로 적힌 책이 보여.' },
          { who: 'senior', text: '둘째 음절의 모음을 견주어 봐. 어떤 모음이 어떤 모음으로 바뀌었지?' }
        ],
        items: ['s10.r5']
      },
      {
        id: 's10.c8', label: '마루 끝 『훈몽자회』',
        orig: ['O-s10-HUNMONG1', 'O-s10-HUNMONG2', 'O-s10-HUNMONG3'],
        lines: [
          { who: 'kid1', text: '이건 글자 이름 외우는 책이에요. ‘기역, 니은, 디귿…’ 이렇게요.' },
          { who: 'senior', text: '자음 이름을 한자로 단 책이야. 그런데 ㄷ과 ㅅ 옆의 동그라미 친 글자는 소리가 아니라 뜻으로 읽으라는 표시래.' }
        ],
        items: []
      }
    ],

    items: [
      {
        id: 's10.r1', kind: 'read', levels: ['h1', 'h23'], label: '16세기의 주격 조사', ruleCard: 'rule.nomI16',
        prompt: '‘{孔子|공자}ㅣ’와 ‘홈이’를 보고 규칙 문장을 완성하자.',
        sentence: '16세기 후반 『소학언해』의 이 대목에서도 주격 조사는 {?}',
        cards: [
          { id: 's10.r1.a', text: '여전히 ‘이’와 ‘ㅣ’다. ‘가’는 보이지 않는다.', correct: true },
          { id: 's10.r1.b', text: '벌써 ‘가’가 쓰였다.', correct: false, src: 'wrong.ga16c',
            why: '이 대목의 주격은 ‘ㅣ’다(‘{孔子|공자}ㅣ’). 주격 조사 ‘가’는 근대 국어에 와서 나타난다.' },
          { id: 's10.r1.c', text: '15세기부터 줄곧 ‘ㅣ’와 ‘가’가 함께 쓰였다.', correct: false, src: 'wrong.ga15c',
            why: '15세기 주격 조사는 ‘이’, ‘ㅣ’, 그리고 아무것도 붙이지 않는 꼴뿐이었다. 15세기 책에서는 주격 ‘가’를 찾을 수 없고, 이 대목에도 없다.' }
        ],
        explain: '‘{孔子|공자}ㅣ’는 모음으로 끝난 말 뒤의 ‘ㅣ’, ‘홈이’는 받침 뒤의 ‘이’다. 이 대목의 주격 조사는 백 년 전과 같다. 주격 조사 ‘가’는 근대 국어에 와서 나타난다.',
        hints: ['누가 말했는지를 알려 주는 자리, ‘공자’ 바로 뒤를 다시 보자.', 's10.c1'],
        misread: {
          's10.r1.b': [
            { who: 'kid2', text: '‘공자가’라고 읽었는데요… 훈장님, 이 책장 어디에도 ‘가’ 자가 없어요!', cg: 'mis_child_laughing' },
            { who: 'teacher', text: '없는 글자를 지어 읽으면 못쓰지. 공자 뒤에 실제로 무엇이 적혔는지 보시오.' }
          ],
          's10.r1.c': [
            { who: 'teacher', text: '백 년 전 책에도 ‘가’가 있었다고? 내 서가의 옛 책을 다 뒤져도 그런 글자는 못 보았소.', cg: 'mis_yangban_offended' },
            { who: 'senior', text: '15세기 책에서 주격 자리에 무엇이 붙었는지부터 다시 떠올려 보자.' }
          ]
        }
      },
      {
        id: 's10.r2', kind: 'read', levels: ['h1', 'h23'], label: '끊어 적기가 섞임', ruleCard: 'rule.separate16',
        prompt: '‘몸이며’와 ‘거시라’가 한 책에 함께 있는 까닭으로 규칙 문장을 완성하자.',
        sentence: '『소학언해』에 ‘몸이며’와 ‘거시라’가 함께 있는 것은 {?}',
        cards: [
          { id: 's10.r2.a', text: '이어 적기 사이로 체언과 조사를 갈라 적는 끊어 적기가 가끔 섞였기 때문이다.', correct: true },
          { id: 's10.r2.b', text: '이 무렵 이미 모두 끊어 적기로 바뀌었고, ‘거시라’만 옛 버릇이 남았기 때문이다.', correct: false, src: 'wrong.modernAllSeparate (시기를 16세기로 옮김)',
            why: '같은 책에 ‘거시라’, ‘비르소미오’처럼 이어 적은 말이 여럿이다. 끊어 적기는 가끔 섞였을 뿐, 모두 바뀐 것이 아니다.' },
          { id: 's10.r2.c', text: '이어 적기는 맞춤법을 몰라 생긴 잘못이라, 바르게 고친 말과 틀린 말이 섞였기 때문이다.', correct: false, src: 'wrong.linkedIsMistake',
            why: '이어 적기는 소리 나는 대로 적는 그 시대의 방식이었다. 잘못 적은 것이 아니다.' }
        ],
        explain: '15세기 책은 ‘모[ㅁㆍㄹ]’처럼 이어 적는 것이 보통이었다. 16세기 후반 『소학언해』에는 ‘거시라’, ‘비르소미오’ 같은 이어 적기 사이로 ‘몸이며’, ‘얼굴이며’, ‘[ㅁㆍ][ㅊㆍㅁ]이니라’처럼 끊어 적은 말이 가끔 섞여 나온다.',
        hints: ['같은 줄 안에서 받침이 뒤로 넘어간 말과 넘어가지 않은 말을 나란히 찾아보자.', 's10.c2'],
        misread: {
          's10.r2.b': [
            { who: 'kid1', text: '이제 다 끊어 쓴다면서요? 그럼 ‘비르소미오’는 뭐예요? 이것도 붙어 있는데!', cg: 'mis_child_laughing' },
            { who: 'senior', text: '이어 적은 말이 하나뿐인지 같은 책 안에서 더 세어 보자.' }
          ],
          's10.r2.c': [
            { who: 'teacher', text: '이 책을 언해한 학자들이 맞춤법을 몰랐다는 말이오? 그분들은 소리 나는 대로 적었을 뿐이오.', cg: 'mis_yangban_offended' },
            { who: 'senior', text: '이어 적기도 하나의 적는 방식이었어. 무엇이 새로 끼어들었는지에 눈을 두자.' }
          ]
        }
      },
      {
        id: 's10.r3', kind: 'read', levels: ['h23'], label: '모음 조화의 흔들림', ruleCard: 'rule.harmony16',
        prompt: '‘[ㅅㆍㄹ][ㅎㆍㄴ]’, ‘父母[ㄹㆍㄹ]’, ‘몸을’의 조사를 견주어 규칙 문장을 완성하자.',
        sentence: '16세기 후반 『소학언해』에서 모음 조화는 {?}',
        cards: [
          { id: 's10.r3.a', text: '지킨 말과 어긴 말이 함께 나올 만큼 흔들리고 있었다.', correct: true },
          { id: 's10.r3.b', text: '이미 완전히 무너져 아무 데서도 지켜지지 않았다.', correct: false, src: 'wrong.harmonyGone16',
            why: '같은 대목에 지킨 예(‘父母[ㄹㆍㄹ]’, ‘[ㅅㆍㄹ][ㅎㆍㄴ]’)와 어긴 예(‘몸을’)가 함께 나온다. 흔들리기 시작했을 뿐이다.' },
          { id: 's10.r3.c', text: '15세기와 똑같이 지켜졌고, ‘몸을’은 새긴 사람의 실수일 뿐이다.', correct: false, src: 'wrong.linkedIsMistake와 같은 갈래(바뀐 모습을 실수로 봄)',
            why: '양성 모음 ‘몸’ 뒤에 음성 모음 조사 ‘을’이 붙은 것은 실수가 아니라, 이 무렵 모음 조화가 흔들리던 모습이다.' }
        ],
        explain: '양성 모음 뒤에 양성 모음 조사가 붙은 ‘父母[ㄹㆍㄹ]’, ‘[ㅅㆍㄹ][ㅎㆍㄴ]’은 모음 조화를 지켰고, 양성 모음 ‘몸’ 뒤에 ‘을’이 붙은 ‘몸을’은 어겼다. 한 대목 안에 둘이 함께 있으니 모음 조화가 흔들리던 때다.',
        hints: ['앞말의 모음이 양성인지 음성인지, 붙은 조사의 모음은 어느 쪽인지 짝지어 보자.', 's10.c4'],
        misread: {
          's10.r3.b': [
            { who: 'kid2', text: '아무 데서도 안 지켰다면서요? ‘父母[ㄹㆍㄹ]’은 딱 맞춰 붙였는데요?', cg: 'mis_child_laughing' },
            { who: 'senior', text: '지킨 예도 있는지 같은 대목을 다시 보자.' }
          ],
          's10.r3.c': [
            { who: 'teacher', text: '판을 새긴 장인이 실수했다고? 그 판은 여러 번 살펴 찍은 것이오.', cg: 'mis_yangban_offended' },
            { who: 'senior', text: '‘몸을’ 하나만 보지 말고 지킨 말과 어긴 말을 함께 놓고 보자.' }
          ]
        }
      },
      {
        id: 's10.r4', kind: 'read', levels: ['h1', 'h23'], label: '방점의 흔들림', ruleCard: 'rule.bangjeom16',
        prompt: '15세기 책과 훈장의 말을 견주어 규칙 문장을 완성하자.',
        sentence: '15세기 책에는 글자마다 방점을 찍었지만, 16세기에 들어 방점은 {?}',
        cards: [
          { id: 's10.r4.a', text: '한결같이 찍히지 않고 흔들리다가, 그 뒤로는 쓰이지 않게 되었다.', correct: true },
          { id: 's10.r4.b', text: '소리의 높낮이 대신 세기나 길이를 나타내게 되었다.', correct: false, src: 'wrong.bangjeomStress',
            why: '방점은 처음부터 소리의 높낮이(성조)를 나타냈다. 16세기에 흔들린 것은 그 표시를 찍는 일 자체다.' },
          { id: 's10.r4.c', text: '15세기와 다름없이 빠짐없이 찍혔다.', correct: false, src: '리서치 04 §3 스테이지 10(같은 중세 안의 변화)',
            why: '같은 중세 국어 안에서도 말은 바뀌었다. 훈장의 말처럼 16세기에는 방점을 찍는 방식이 흔들렸다.' }
        ],
        explain: '15세기 책은 글자마다 방점을 찍어 높낮이를 나타냈다. 16세기 중엽부터는 찍는 방식이 흔들렸고, 16세기 말엽의 책부터는 방점을 표시하지 않게 되었다.',
        hints: ['백 년 전 책과 요즘 책에 점을 찍는 모습이 어떻게 다른지 훈장에게 다시 들어 보자.', 's10.c6'],
        misread: {
          's10.r4.b': [
            { who: 'kid3', text: '점이 세기라고요? 그럼 점 많은 글자는 이렇게 크게 소리 질러요? 아아악!', cg: 'mis_child_laughing' },
            { who: 'teacher', text: '서당에서 고함은 안 된다. 점이 무엇을 나타냈는지, 그리고 요즘 그 점이 어찌 되었는지를 보시오.' }
          ],
          's10.r4.c': [
            { who: 'teacher', text: '빠짐없이 찍는다니, 요즘 베낀 책들을 한 번이라도 보았소?', cg: 'mis_yangban_offended' },
            { who: 'senior', text: '15세기 책과 요즘 책을 나란히 놓고, 점 찍는 모습이 같은지 다시 보자.' }
          ]
        }
      },
      {
        id: 's10.r5', kind: 'read', levels: ['h1', 'h23'], label: '둘째 음절의 ㆍ', ruleCard: 'rule.araea16',
        prompt: '‘사[ㅇㆍㄹ]’과 ‘사흘’을 견주고, 『소학언해』의 ‘[ㅅㆍㄹ][ㅎㆍㄴ]’도 떠올리며 규칙 문장을 완성하자.',
        sentence: '16세기에는 둘째 음절 이하의 ㆍ가 {?}',
        cards: [
          { id: 's10.r5.a', text: 'ㅡ로 바뀌기 시작했다(사[ㅇㆍㄹ] → 사흘).', correct: true },
          { id: 's10.r5.b', text: 'ㅏ로 바뀌었다. ㆍ는 본디 ㅏ와 같은 소리였기 때문이다.', correct: false, src: 'wrong.araeaIsA',
            why: 'ㆍ는 28자 안에서 ㅏ와 따로 만든 모음 글자다. 둘째 음절 이하에서는 주로 ㅡ로 바뀌었다(사흘).' },
          { id: 's10.r5.c', text: '글자째 사라져 더는 적히지 않았다.', correct: false, src: 'wrong.noAraeaModern (시기를 16세기로 옮김)',
            why: '『소학언해』에도 ‘[ㅅㆍㄹ][ㅎㆍㄴ]’, ‘[ㅁㆍ][ㅊㆍㅁ]’처럼 둘째 음절에 ㆍ가 그대로 적혀 있다. 소리가 바뀌기 시작했어도 글자는 오래 남았다.' }
        ],
        explain: '‘사[ㅇㆍㄹ]’이 ‘사흘’이 된 것처럼, 16세기부터 둘째 음절 이하의 ㆍ가 ㅡ로 바뀌기 시작했다. 그래도 글자 ㆍ는 사라지지 않아서 『소학언해』에는 ㆍ가 그대로 적힌 말이 많다. 정확히 몇 년에 바뀌었는지는 따지지 않는다.',
        hints: ['‘사[ㅇㆍㄹ]’과 ‘사흘’의 둘째 음절만 떼어 견주어 보자.', 's10.c7'],
        misread: {
          's10.r5.b': [
            { who: 'kid3', text: '그럼 ‘사흘’이 아니라 ‘사할’이에요? 훈장님한테 ‘사할 뒤에 외워 올게요’ 했다가 혼났어요!', cg: 'mis_child_laughing' },
            { who: 'senior', text: '‘사흘’의 둘째 음절이 실제로 무슨 모음인지 다시 보자.' }
          ],
          's10.r5.c': [
            { who: 'kid1', text: '글자가 다 없어졌다고요? 제 책엔 아직 동그란 점 모음이 수두룩한데요?', cg: 'mis_child_laughing' },
            { who: 'senior', text: '소리가 바뀌는 것과 글자가 없어지는 것은 따로야. 막동이 책의 ‘[ㅅㆍㄹ][ㅎㆍㄴ]’을 보자.' }
          ]
        }
      },
      // 방점·둘째 음절 ㆍ 줄(채점 안 함)은 해독 항목 r4·r5 가 다루므로 수첩에서 뺐다(시간 조정, Q2). ROW_BJ·ROW_ARAEA 는 남겨 둔다.
      notebook('s10.t1', ['h23'], [ROW_NOM, ROW_GA, ROW_CUT, ROW_VH], {
        nom: { status: 'kept', evidence: ['s.i'] },
        ga: { status: 'none', evidence: [] },
        cut: { status: 'shaky', evidence: ['s.mom1', 's.eolgul', 's.machm'] },
        vh: { status: 'shaky', evidence: ['s.mom2'] }
      }, '이 대목의 주격 조사는 백 년 뒤에도 ‘ㅣ’ 그대로(‘{孔子|공자}ㅣ’)였고 ‘가’는 보이지 않았다. 체언과 조사는 대체로 이어 적었지만 ‘몸이며’, ‘얼굴이며’, ‘[ㅁㆍ][ㅊㆍㅁ]이니라’처럼 끊어 적은 말이 섞여 흔들렸다. 모음 조화도 ‘父母[ㄹㆍㄹ]’은 지키고 ‘몸을’은 어겨 흔들렸다.'),
      notebook('s10.t2', ['h1'], [ROW_NOM, ROW_GA, ROW_CUT], {
        nom: { status: 'kept', evidence: ['s.i'] },
        ga: { status: 'none', evidence: [] },
        cut: { status: 'shaky', evidence: ['s.mom1', 's.eolgul', 's.machm'] }
      }, '이 대목의 주격 조사는 백 년 뒤에도 ‘ㅣ’ 그대로(‘{孔子|공자}ㅣ’)였고 ‘가’는 보이지 않았다. 체언과 조사는 대체로 이어 적었지만 ‘몸이며’, ‘얼굴이며’, ‘[ㅁㆍ][ㅊㆍㅁ]이니라’처럼 끊어 적은 말이 섞여 흔들렸다.')
    ],

    notes: [
      { id: 's10.n1', kind: 'know', title: '『소학언해』', text: '『소학』을 우리말로 옮겨 1588년에 펴낸 책이다.', src: '화법과 언어 209쪽 · 리서치 11 §9', at: ['s10.c1'] },
      { id: 's10.n4', kind: 'know', title: '구개음화 이전', text: '‘현뎌케’는 ㄷ이 ㅣ 앞에서도 ㅈ으로 바뀌지 않은 모습이다.', src: '리서치 11 §4-2 · 화법과 언어 206쪽', at: ['s10.c4'] },
      { id: 's10.n5', kind: 'know', title: '자모 이름', text: '『훈몽자회』(1527)는 ㄷ과 ㅅ의 이름에 末(새김 ‘귿’)과 衣(새김 ‘옷’)의 뜻을 빌려 ‘디귿’, ‘시옷’이라 적었다.', src: '중학 국어 2-2 155쪽 · 리서치 11 §4-2', at: ['s10.c8'] }
    ],

    translate: {
      id: 's10.x1',
      text: '몸과 얼굴, 머리털과 살은 모두 부모에게서 받은 것이니, 함부로 다치게 하지 않는 것이 효도의 첫걸음이다. 바르게 살아 이름을 뒷세상에 남기고 그것으로 부모를 빛내는 것이 효도의 마지막이다.',
      lines: [
        { who: 'senior', text: '<@아>, 이제 아이들에게 읽어 줄 차례야. 두 책을 나란히 펴 놓고.', cg: 's10_climax' },
        { who: 'me', text: '얘들아, 들어 봐. 몸도 얼굴도 머리카락도 살도 다 부모님께 받은 거래. 그러니 함부로 다치지 않게 하는 게 효도의 시작이야.' },
        { who: 'me', text: '그리고 바르게 살아서 이름을 남기고, 그걸로 부모님을 빛내는 게 효도의 마지막이래.' },
        { who: 'kid1', text: '아, 그런 뜻이었구나! 저는 그냥 소리만 따라 읽었어요.', expr: 'smile' },
        { who: 'teacher', text: '백 년 전 책과 지금 책이 어디가 같고 어디가 달라졌는지까지 짚어 주니, 아이들 귀가 트였소. 고맙소.' },
        { who: 'senior', text: '백 년 사이에도 말은 조금씩 움직였지. 앞으로는 더 크게 움직일 거야. 다음 길로 가 보자.' }
      ]
    },

    editions: {
      // 고1(과 고1 범위를 쓰는 중학교)은 모음 조화를 배우지 않으므로 앞 장면 규칙 안내에서도 뺀다
      h1: { needs: NEEDS_BASE },
      m: { needs: NEEDS_BASE }
    }
  };
})();
