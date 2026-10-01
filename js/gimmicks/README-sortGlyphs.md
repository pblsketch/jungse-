# 기믹 `sortGlyphs` — 서장 「흩어진 글자」

교과서 사진에서 흩어진 글자를 **아는 글자 / 모르는 글자(스물여덟 자 안 · 스물여덟 자 밖)** 칸으로 가른다.
다 가르면 **옛글자 도감** 결과판이 열린다. 핵심은 28자 가운데 사라진 4자(ㆍ ㅿ ㆆ ㆁ)와 28자에 들지 않는 ㅸ 을 구별하는 것이다(spec §7 서장). 학교급 차이는 없다.

- 파일: `js/gimmicks/sortGlyphs.js`, 문구·글자 표 `js/data/text-g-sortGlyphs.js`, 모양 `css/g-sortGlyphs.css`
- 판정은 글자 id 로 한다. **어느 칸이 맞는지는 기믹의 사실 표가 정한다**(장면 작성자가 정하지 않는다).

| 칸 id | 화면 이름 | 들어갈 글자 |
|---|---|---|
| `known` | 아는 글자 | 28자 가운데 오늘날에도 쓰는 글자 |
| `lost` | 모르는 글자 › 스물여덟 자 안 | 사라진 4자 ㆍ(`araea`) ㅿ(`z`) ㆆ(`q`) ㆁ(`ng`) |
| `outside` | 모르는 글자 › 스물여덟 자 밖 | ㅸ(`bv`) — 연서로 만든 글자 |

## 글자 id

| 첫소리 17자 | `g`ㄱ `k`ㅋ `ng`ㆁ `d`ㄷ `t`ㅌ `n`ㄴ `b`ㅂ `p`ㅍ `m`ㅁ `j`ㅈ `ch`ㅊ `s`ㅅ `q`ㆆ `h`ㅎ `o`ㅇ `r`ㄹ `z`ㅿ |
|---|---|
| 가운뎃소리 11자 | `araea`ㆍ `eu`ㅡ `i`ㅣ `vo`ㅗ `va`ㅏ `vu`ㅜ `veo`ㅓ `vyo`ㅛ `vya`ㅑ `vyu`ㅠ `vyeo`ㅕ |
| 28자 밖 | `bv`ㅸ |

## `config`

| 필드 | 필수 | 뜻 |
|---|---|---|
| `glyphs` | | 흩어 놓을 글자 id 목록(보이는 순서). 없으면 기본 13자: `g va z n eu q m bv vo araea s ng o` (사라진 4자와 ㅸ 이 모두 든 묶음) |

## `answer`

`{ <글자 id>: 'known' | 'lost' | 'outside' }` — `config.glyphs` 의 글자마다 하나. 사실 표와 같아야 한다
(다르면 기믹이 `NM.reportError('g.sortGlyphs.answer')` 로 알리고, 판정은 사실 표를 따른다).
사실 표로 만든 정답은 `NM.gimmicks.get('sortGlyphs').facts.answerFor(config)` 로도 얻는다.

## `hints`

`[1단계 힌트 문장, 2단계 강조 대상]`. 강조 대상은 칸 id(`'outside'` 등)나 글자 id, 또는 그 배열. `null` 이면 마지막에 틀린 글자를 강조한다.

## 끝난 뒤: 옛글자 도감

맞게 내거나, 3번째 틀려 정답이 보이거나, 끝난 과제를 다시 열면 결과판에 `lost`·`outside` 글자를 보인다.

- 도감 설명은 `NM.data.DOGAM` 에서 **같은 글자(`glyph`)** 인 항목의 `name`·`note` 를 쓴다(K1 이 채운다). 없으면 칸 설명만 보인다.
- `document` 에 `nm:dogam-open` 사건을 보낸다. `detail = { gimmick: 'sortGlyphs', item, glyphs: [글자…], keys: [DOGAM 열쇠…], byHelp, reopened }`
  (`byHelp`: 맞음 `false` · 도움으로 끝 `true` · 다시 열기 `null`)
- 기믹 뿌리 요소(`.nm-gsg`)에 `data-dogam="open"` 이 붙는다. 도감 화면 자체는 수첩(U1) 몫이다.

## 조작

글자 단추를 눌러(또는 Tab 으로 가서 Enter·Space) 고르고, 칸의 '여기에 놓기' 단추로 놓는다. 놓으면 다음 글자가 골라지고 초점이 옮겨 간다.
칸에 놓은 글자를 다시 누르면 옮길 수 있다. 끌어 놓기는 쓰지 않는다. 틀린 글자는 × 와 점선 테두리로, 강조는 △ 로, 정답 자리는 ○ 로 보인다.

## 알아 둘 사실 (장면 작성자용)

- 서문 8구절(`O-s9-SEOMUN1`~`8`)에는 ㆍ ㆆ ㆁ ㅸ 은 있지만 **ㅿ 은 없다**. 대사에서 "이 글자들이 모두 서문 사진에서 흩어졌다"고 쓰지 않는다.
- ㅸ(연서)은 중학교 교과서 본문이 아니라 지도서 보충에만 있다(06 문서). 서장은 학교급 차이가 없으므로 그대로 두되, 풀이는 짧게 쓴다.

## 예시 항목 (장면 파일 `js/data/scenes/s0.js` 의 `items` 안)

```js
{
  id: 's0.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '흩어진 글자',
  prompt: '흩어진 글자를 아는 글자와 모르는 글자로 갈라 보자.',
  gimmick: 'sortGlyphs',
  config: { glyphs: ['g', 'va', 'z', 'n', 'eu', 'q', 'm', 'bv', 'vo', 'araea', 's', 'ng', 'o'] },
  answer: { g: 'known', va: 'known', z: 'lost', n: 'known', eu: 'known', q: 'lost', m: 'known',
            bv: 'outside', vo: 'known', araea: 'lost', s: 'known', ng: 'lost', o: 'known' },
  hints: ['훈민정음은 스물여덟 자였어. 그 가운데 지금 안 쓰는 글자는 넷뿐이야.', 'outside'],
  explain: 'ㆍ ㅿ ㆆ ㆁ 은 스물여덟 자에 들었지만 지금은 쓰지 않는 글자이고, ㅸ 은 ㅂ 아래 ㅇ 을 이어 써서 만든 글자라 스물여덟 자에 들지 않는다.'
}
```
