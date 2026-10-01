# 기믹 `prefaceDecode` — 종합 해독 (장면 9 「나랏말ᄊᆞ미」, 모든 학교급)

「세종어제훈민정음」 서문(『월인석보』 권1, 1459)을 구절마다 풀어 옮기고 창제 정신을 찾는다. 한 과제를 한 번에 제출한다.

**고등판**(기본) — 구절(原文 블록 `O-s9-SEOMUN1`…`8`)마다

1. **낱말 풀기**: 原文의 낱말마다 뜻 카드를 고른다. 낱말에 `rule` 을 달면 곁에 규칙 카드가 보인다.
   - 수첩에 있는 규칙: `규칙 카드` 표지 + 카드 이름 + 카드 문장(`NM.data.RULE_CARDS[id]`).
   - 수첩에 없는 규칙: `아직 확인하지 않은 규칙` 표지(점선) + 카드 이름 + '○○에서 배워요'(카드의 `stage`). **진행을 막지 않는다.**
   - 수첩 규칙은 화면 흐름의 기록(`NM.ui.app.store()`)에서 읽는다. 목록(K1)에 없는 id 면 이름 없이 표지만 보인다.
2. **현대어로 옮기기**: 현대어 조각(새로 쓴 풀이를 나눈 것 + 헛조각)을 차례대로 놓는다. 누르거나 Enter 로 놓고, 놓은 조각을 누르면 되돌아간다.
3. **창제 정신 찾기**(마지막 쪽): 구절마다 `config.spirits` 가운데 하나 또는 '어느 쪽도 아님'.

구절 사이는 위쪽 '구절 1 … 창제 정신' 단추와 '앞으로/다음으로'로 오간다. 단추의 기호: `○` 덜 함 · `●` 다 함 · `✕` 틀린 곳 있음.

**중학교판** — `config.mode: 'modern'` 이거나, 학교급이 `m` 이고 `config.modern` 이 있으면: 새로 쓴 현대어 서문(`풀이` 표지)을 대목마다 보고 창제 정신만 고른다.
原文 해독은 없다(06 문서: 중세 원문 해독은 고1부터). 학교급별로 다른 항목을 쓰려면 장면의 `editions.m` 로 나눠도 되고, 한 항목에 두 판의 config·answer 를 함께 둬도 된다(아래 '판정').

도움 단계(spec §5-3):

- 틀린 제출: 틀린 뜻 카드 묶음·틀린 자리의 조각·틀린 정신 고르기에 `✕` 와 점선(`is-wrong`), 그 구절 단추에 `✕`. 첫 틀린 구절로 넘어간다. 상태는 `open`.
- 2번째 틀림(`showHint(2, hints[1])`): `hints[1]` 이 구절 id 면 그 구절, 낱말 id 면 그 낱말, `'spirits'` 면 정신 쪽, 없으면 방금 틀린 곳 —
  原文 속 해당 낱말에 `◆`(`is-cue`), 고칠 줄·조각 칸에 빛 테두리(`is-hint`). 정신 쪽은 구절의 `spiritWords` 낱말을 빛낸다. 중학교판은 대목 글을 빛낸다.
- 3번째 틀림: `doneByHelp`. 모든 정답(`○` + '정답'), 조각은 정답 차례로, 모두 잠금. 다시 열어도 같은 모습.

화면 문구: `js/data/text-g-prefaceDecode.js`(정신 이름 기본값 `spirits.jaju|aemin|silyong` = 자주·애민·실용).

## `config`

| 필드 | 필수 | 뜻 |
|---|---|---|
| `phrases` | 고등판 ○ | 구절 목록(아래) |
| `spirits` | | 창제 정신 `['jaju', 'aemin', 'silyong']` 또는 `[{ id, label }]`(`label` 은 데이터 표기). 비우면 정신 찾기 쪽이 없다 |
| `modern` | 중학교판 ○ | 새로 쓴 현대어 서문 대목 `[{ id, text, noSpirit? }]`(장면 작가가 새로 씀, 교과서 번역 문장 금지) |
| `mode` | | `'modern'`(학교급과 상관없이 중학교판 모습) · `'decode'`(학교급 m 이어도 고등판) |

구절 하나:

| 필드 | 필수 | 뜻 |
|---|---|---|
| `id` | ○ | `p1` … |
| `orig` | ○ | 原文 블록 id(`O-s9-SEOMUN1` …) |
| `hanmun` | | 같은 대목의 한문 블록 id(`O-s9-HANMUN1` …). '한문 원문 보기'로 접어 둔다 |
| `words` | | 原文 속 낱말 `[{ id, match \| at, nth?, line? }]` — 낱말 지정은 `README-questionPair.md` 의 '낱말 지정' |
| `decode` | | 풀 낱말 `[{ word: <낱말 id>, rule?: <규칙 카드 id>, ruleName?: <목록에 없을 때 보일 이름>, cards: [{ id, text }] }]` |
| `pieces` | | 현대어 조각 `[{ id, text }]` — 정답 조각 + 헛조각. **새로 쓴 풀이**만(09 문서 '풀이 · 새로 씀' 또는 장면 작가) |
| `spiritWords` | | 정신 쪽 2번째 틀림에 빛낼 낱말 id |
| `noSpirit` | | `true` 면 정신 찾기에서 뺀다(자료마다 판정이 갈리는 구절) |

## `answer`

```js
// 고등판
{ decode: { <낱말 id>: <카드 id> }, order: { <구절 id>: [<조각 id>, …] }, spirits: { <구절 id>: <정신 id> | 'none' } }
// 중학교판
{ modernSpirits: { <대목 id>: <정신 id> | 'none' } }
```

판정: 학생 답에 `modernSpirits` 가 있으면(중학교판 모습) 그것만, 아니면 `decode`·`order`·`spirits` 가운데 `answer` 에 적힌 것만 본다.
`order` 는 자리마다 맞아야 한다(덜 놓거나 헛조각을 더 놓으면 틀림).

## 예 — 고등판 (原文 블록·낱말 위치: 09 문서 §4-1·§8-2 표, 오답 카드 근거: 10 문서 §10)

규칙 카드 id 는 K1 의 규칙 카드 목록을 따른다. 아래 `rule.*` 는 자리 표시용 예시다.

```js
{
  id: 's9.t1', kind: 'task', levels: ['h1', 'h23'], label: '서문 종합 해독', gimmick: 'prefaceDecode',
  config: {
    spirits: ['jaju', 'aemin', 'silyong'],
    phrases: [
      { id: 'p1', orig: 'O-s9-SEOMUN1', hanmun: 'O-s9-HANMUN1',
        words: [{ id: 'p1.w1', match: '나·랏' }, { id: 'p1.w2', match: ':말[ㅆㆍ]·미' }, { id: 'p1.w3', match: '{中|[ㄷㅠㆁ]}{國|·귁}·에' }],
        decode: [
          { word: 'p1.w1', rule: 'rule.genitiveS', cards: [{ id: 'p1.w1.a', text: '나라의' }, { id: 'p1.w1.b', text: '나라를' }] },
          { word: 'p1.w2', cards: [{ id: 'p1.w2.a', text: '말이' }, { id: 'p1.w2.b', text: '말씀(높임말)이' }] },
          { word: 'p1.w3', rule: 'rule.compareE', cards: [{ id: 'p1.w3.a', text: '중국과 견주어' }, { id: 'p1.w3.b', text: '중국 땅에서' }] }
        ],
        pieces: [{ id: 'p1.k1', text: '우리나라의 말소리는' }, { id: 'p1.k2', text: '중국 말과' }, { id: 'p1.k3', text: '같지 않아서' }, { id: 'p1.kx', text: '중국에 가서' }],
        spiritWords: ['p1.w3'] },
      { id: 'p2', orig: 'O-s9-SEOMUN2',
        words: [{ id: 'p2.w1', match: '[ㅅㆍ][ㅁㆍㅅ]·디' }],
        decode: [{ word: 'p2.w1', cards: [{ id: 'p2.w1.a', text: '통하지' }, { id: 'p2.w1.b', text: '맞서지' }] }],
        pieces: [{ id: 'p2.k1', text: '한자로 적어서는' }, { id: 'p2.k2', text: '서로 뜻이' }, { id: 'p2.k3', text: '막힘없이 오가지 못한다.' }],
        spiritWords: ['p2.w1'] },
      { id: 'p3', orig: 'O-s9-SEOMUN3',
        words: [{ id: 'p3.w1', match: '어·린' }],
        decode: [{ word: 'p3.w1', cards: [{ id: 'p3.w1.a', text: '어리석은' }, { id: 'p3.w1.b', text: '나이가 어린' }] }],
        pieces: [{ id: 'p3.k1', text: '그 때문에' }, { id: 'p3.k2', text: '글을 모르는 백성은' }, { id: 'p3.k3', text: '하고 싶은 이야기가 있더라도' }, { id: 'p3.kx', text: '나이 어린 백성은' }],
        spiritWords: ['p3.w1'] },
      { id: 'p4', orig: 'O-s9-SEOMUN4',
        words: [{ id: 'p4.w1', match: '·노·미' }, { id: 'p4.w2', match: '하·니·라' }],
        decode: [
          { word: 'p4.w1', cards: [{ id: 'p4.w1.a', text: '사람이' }, { id: 'p4.w1.b', text: '남을 낮춰 이르는 놈이' }] },
          { word: 'p4.w2', cards: [{ id: 'p4.w2.a', text: '많다' }, { id: 'p4.w2.b', text: '한다' }] }
        ],
        pieces: [{ id: 'p4.k1', text: '끝내 제 속뜻을' }, { id: 'p4.k2', text: '글로 드러내지 못하는 이가' }, { id: 'p4.k3', text: '많다.' }],
        spiritWords: ['p4.w1'] },
      { id: 'p5', orig: 'O-s9-SEOMUN5', hanmun: 'O-s9-HANMUN3',
        words: [{ id: 'p5.w1', match: ':어엿·비' }],
        decode: [{ word: 'p5.w1', cards: [{ id: 'p5.w1.a', text: '불쌍히' }, { id: 'p5.w1.b', text: '예쁘게' }] }],
        pieces: [{ id: 'p5.k1', text: '나는 이것을' }, { id: 'p5.k2', text: '가엾고 딱하게 여겨' }, { id: 'p5.kx', text: '예쁘게 여겨' }],
        spiritWords: ['p5.w1'] },
      { id: 'p6', orig: 'O-s9-SEOMUN6', noSpirit: true,
        words: [{ id: 'p6.w1', match: '[ㅁㆎㆁ]·[ㄱㆍ]노·니' }],
        decode: [{ word: 'p6.w1', cards: [{ id: 'p6.w1.a', text: '만드니' }, { id: 'p6.w1.b', text: '맺으니' }] }],
        pieces: [{ id: 'p6.k1', text: '스물여덟 글자를' }, { id: 'p6.k2', text: '새로 지었다.' }] },
      { id: 'p7', orig: 'O-s9-SEOMUN7', hanmun: 'O-s9-HANMUN4',
        words: [{ id: 'p7.w1', match: '·[ㅄㅜ]·메' }],
        decode: [{ word: 'p7.w1', rule: 'rule.nominalUm', cards: [{ id: 'p7.w1.a', text: '쓰는 데(씀에)' }, { id: 'p7.w1.b', text: '쓰면서' }] }],
        pieces: [{ id: 'p7.k1', text: '누구나 손쉽게 배워' }, { id: 'p7.k2', text: '하루하루 쓰는 데' }],
        spiritWords: ['p7.w1'] },
      { id: 'p8', orig: 'O-s9-SEOMUN8',
        words: [{ id: 'p8.w1', match: '[ㅼㆍ][ㄹㆍ]·미니·라' }],
        decode: [{ word: 'p8.w1', cards: [{ id: 'p8.w1.a', text: '따름이다' }, { id: 'p8.w1.b', text: '딸이다' }] }],
        pieces: [{ id: 'p8.k1', text: '불편함이 없기를' }, { id: 'p8.k2', text: '바랄 뿐이다.' }],
        spiritWords: ['p8.w1'] }
    ]
  },
  answer: {
    decode: {
      'p1.w1': 'p1.w1.a', 'p1.w2': 'p1.w2.a', 'p1.w3': 'p1.w3.a', 'p2.w1': 'p2.w1.a', 'p3.w1': 'p3.w1.a',
      'p4.w1': 'p4.w1.a', 'p4.w2': 'p4.w2.a', 'p5.w1': 'p5.w1.a', 'p6.w1': 'p6.w1.a', 'p7.w1': 'p7.w1.a', 'p8.w1': 'p8.w1.a'
    },
    order: {
      p1: ['p1.k1', 'p1.k2', 'p1.k3'], p2: ['p2.k1', 'p2.k2', 'p2.k3'], p3: ['p3.k1', 'p3.k2', 'p3.k3'], p4: ['p4.k1', 'p4.k2', 'p4.k3'],
      p5: ['p5.k1', 'p5.k2'], p6: ['p6.k1', 'p6.k2'], p7: ['p7.k1', 'p7.k2'], p8: ['p8.k1', 'p8.k2']
    },
    spirits: { p1: 'jaju', p2: 'jaju', p3: 'aemin', p4: 'aemin', p5: 'aemin', p7: 'silyong', p8: 'silyong' }
  },
  hints: ['앞 장면에서 모은 규칙 카드를 옆에 펴 놓고 풀어 보자.', 'p1'],
  explain: '(장면 작가가 새로 쓴 풀이)'
}
```

## 예 — 중학교판 (새로 쓴 현대어 서문: 09 문서 '중학교판 현대어 서문'을 대목으로 나눔)

```js
{
  id: 's9.t1', kind: 'task', levels: ['m'], label: '창제 정신 찾기', gimmick: 'prefaceDecode',
  config: {
    mode: 'modern',
    spirits: ['jaju', 'aemin', 'silyong'],
    modern: [
      { id: 'm1', text: '우리말은 중국말과 소리부터 다르다.' },
      { id: 'm2', text: '그런데 글은 중국 글자인 한자를 빌려 써 왔으니, 말과 글이 서로 맞아떨어지지 않는다.' },
      { id: 'm3', text: '그래서 글을 배우지 못한 백성은 꼭 하고 싶은 말이 있어도 끝내 그 마음을 글로 펼쳐 보이지 못하는 일이 많다.' },
      { id: 'm4', text: '나는 그것이 늘 안타까웠다.' },
      { id: 'm5', text: '그래서 스물여덟 글자를 새로 만들었다.', noSpirit: true },
      { id: 'm6', text: '누구든 쉽게 배워 날마다 편하게 쓰기를 바랄 뿐이다.' }
    ]
  },
  answer: { modernSpirits: { m1: 'jaju', m2: 'jaju', m3: 'aemin', m4: 'aemin', m6: 'silyong' } },
  hints: ['누구를 위해, 무엇이 문제여서, 어떻게 쓰이길 바랐는지 나눠 보자.', 'm4'],
  explain: '(장면 작가가 새로 쓴 풀이)'
}
```

## 장면 작가가 지킬 것

- 原文은 블록 id 로만(`O-s9-SEOMUN1`…`8`, `O-s9-HANMUN1`…`4`). 한문 블록은 8구절이 아니라 4문장 단위다(HANMUN1 ↔ SEOMUN1~2, 2 ↔ 3~4, 3 ↔ 5~6, 4 ↔ 7~8).
- 조각·뜻 카드·현대어 서문은 **새로 쓴 글**만(09 문서의 '풀이 · 새로 씀', 또는 장면 작가). 교과서·번역서 번역 문장은 쓰지 않는다.
- **SEOMUN6(스물여덟 자를 새로 만듦)의 정신은 채점하지 않는다**: 09 문서 대응표는 '창조'로, 02 문서는 그 문장을 '애민' 문장에 넣는다.
  spec §7 은 자주·애민·실용 세 가지다. 그래서 예에서는 `noSpirit: true` 로 뺐다(필요하면 `notes` 의 `interp` 카드로).
- '·노·미'를 '것·경우'로 보는 견해, '어린'을 '글을 모르는'으로 옮기는 풀이는 09 문서 §8-1 의 '해석' — 오답 카드로 쓰지 않는다.
- 세종은 장면 대사(`who: 'sejong'`, 지어낸 말은 `fiction: true`)로 나온다. 이 기믹은 인물을 그리지 않는다.
