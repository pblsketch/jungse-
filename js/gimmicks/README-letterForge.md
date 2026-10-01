# 기믹 `letterForge` — 스테이지 2 「스물여덟 자」 소리 → 글자 변신

발음 기관 단면도(코드로 그린 SVG, 그림 안에 글자 없음)를 보고 기본자를 만들고, 획을 더하고, 다르게 만든 글자를 가리고,
천지인(ㆍ ㅡ ㅣ)을 합쳐 모음을 만든다(spec §7 스테이지 2). 한 과제에 **단계를 하나 이상 골라** 넣는다(S2 는 과제를 여러 개로 나눌 수 있다).

- 파일: `js/gimmicks/letterForge.js`(판정·화면), `js/gimmicks/letterForge-svg.js`(그림), 문구 `js/data/text-g-letterForge.js`, 모양 `css/g-letterForge.css`
- **정답은 기믹의 사실 표가 정한다**(장면 작성자는 무엇을 낼지만 고른다). 판정은 구조 id(획 조각·글자·모양 id)로 한다.
- 획 긋기는 자유 그리기가 아니라 **획 조각 고르기**다(누르기, Tab·Enter·Space). 틀린 획은 판 위에서 흐려진다.

## 단계

| 단계 id | 하는 일 | 사실 표 |
|---|---|---|
| `shape` | 상형: 단면도의 굵게 칠한 곳을 보고 획 조각으로 기본자 만들기 | ㄱ = 위 가로 + 오른쪽 세로, ㄴ = 왼쪽 세로 + 아래 가로, ㅁ = 네 변, ㅅ = 두 빗금, ㅇ = 동그라미 |
| `add` | 가획: 빈 자리에 글자 넣기 | ㄱ→ㅋ, ㄴ→ㄷ→ㅌ, ㅁ→ㅂ→ㅍ, ㅅ→ㅈ→ㅊ, ㅇ→ㆆ→ㅎ (해례 `O-s2-GAHOEK1`·`2`) |
| `odd` | 획을 더하는 원리를 따르지 않고 모양을 달리해 만든 글자 고르기 | ㆁ ㄹ ㅿ (`O-s2-GAHOEK2` 끝 `而唯ㆁ爲異`, `O-s2-ICHE`) |
| `samjae` | 모음 기본자가 본뜬 것 | ㆍ 하늘(`sky`) · ㅡ 땅(`earth`) · ㅣ 사람(`person`) (`O-s2-CHEON`·`JI`·`IN`) |
| `vowel` | 합성: ㆍ ㅡ ㅣ 단추를 차례로 눌러 모음 만들기(천지인 자판과 같은 차례) | 초출 ㅗ ㅏ ㅜ ㅓ(ㆍ 하나), 재출 ㅛ ㅑ ㅠ ㅕ(ㆍ 둘) (`O-s2-HAP-*`, `JAECHUL`, `CHOJAE`) |

### 학교급별 용어 (기믹이 `o.level` 로 고른다)

| | 중학교 `m` | 고등 `h1`·`h23` |
|---|---|---|
| 단계 제목 | '상형 · 가획 · 합성'만 | 같음 + `odd` 단계 제목이 '이체' |
| `odd` | 제목 '획을 더하는 원리를 따르지 않은 글자' + **날개 설명**(끝난 뒤 ㆁ ㄹ ㅿ 풀이). '이체' 낱말 없음 | '이체자를 모두 고르세요' + 끝난 뒤 이체자 풀이 |
| `vowel` | 초출자·재출자는 날개 설명에만 | 끝난 뒤 모음마다 '초출자'/'재출자' 표 |

## 글자 id

자음 `g`ㄱ `k`ㅋ `n`ㄴ `d`ㄷ `t`ㅌ `m`ㅁ `b`ㅂ `p`ㅍ `s`ㅅ `j`ㅈ `ch`ㅊ `o`ㅇ `q`ㆆ `h`ㅎ `ng`ㆁ `r`ㄹ `z`ㅿ ·
모음 `araea`ㆍ `eu`ㅡ `i`ㅣ `vo`ㅗ `va`ㅏ `vu`ㅜ `veo`ㅓ `vyo`ㅛ `vya`ㅑ `vyu`ㅠ `vyeo`ㅕ ·
획 조각 `top` `bottom` `left` `right` `slashL` `slashR` `ring`

## `config`

| 필드 | 뜻 (모두 선택) |
|---|---|
| `steps` | 넣을 단계와 순서. 없으면 다섯 단계 전부 |
| `shape.letters` | 만들 기본자(`g n m s o` 가운데, 기본 전부) |
| `add.chains` | 넣을 가획 줄(기본자 id 로, 기본 전부) · `add.extra` 덤으로 섞을 글자(가획 줄에 없는 자음, 예 `['r', 'ng']`) |
| `odd.pool` | 보일 자음(기본 `k d ng t b r p j z ch q h`) — 이 가운데 ㆁ ㄹ ㅿ 이 정답 |
| `vowel.targets` | 만들 모음(기본 8자 전부) |
| `<단계>.orig` | 그 단계 위에 原文 카드로 보일 블록 id 목록(예 `shape: { orig: ['O-s2-SANG-G'] }`) |

## `answer`

`NM.gimmicks.get('letterForge').facts.answerFor(config)` 와 같은 값을 적는다(다르면 `NM.reportError('g.letterForge.answer')`, 판정은 사실 표).

```js
{
  shape:  { g: ['right', 'top'], n: ['bottom', 'left'], m: ['bottom', 'left', 'right', 'top'], s: ['slashL', 'slashR'], o: ['ring'] },
  add:    { 'g.1': 'k', 'n.1': 'd', 'n.2': 't', 'm.1': 'b', 'm.2': 'p', 's.1': 'j', 's.2': 'ch', 'o.1': 'q', 'o.2': 'h' },
  odd:    ['ng', 'r', 'z'],                       // odd.pool 순서
  samjae: { araea: 'sky', eu: 'earth', i: 'person' },
  vowel:  { vo: 'eu-up-1', va: 'i-right-1', vu: 'eu-down-1', veo: 'i-left-1',
            vyo: 'eu-up-2', vya: 'i-right-2', vyu: 'eu-down-2', vyeo: 'i-left-2' }
}
```
`config.steps` 에 든 단계의 열쇠만 적는다. 획 목록 순서는 상관없다.

## `hints`

`[1단계 힌트, 2단계 강조 대상]` — 강조 대상은 부분 id(`'shape.g'` · `'add.n.2'` · `'odd.r'` · `'samjae.eu'` · `'vowel.vya'`), 단계 id(`'odd'`), 또는 그 배열. `null` 이면 마지막에 틀린 곳.

## 틀렸을 때 보이는 것

- 상형: 그 줄에 ×, 판 위의 **틀린(남는) 획이 흐린 점선**이 되고 그 획 단추에 ×. 모자란 획은 드러내지 않는다.
- 가획: 틀린 자리에 ×. 다르게 만든 글자: **잘못 고른 글자**에 ×, 빠뜨린 글자는 드러내지 않고 '고를 글자가 더 있어요'.
- 천지인·합성: 그 줄에 ×. 2단계 강조는 △ 와 바깥선, 정답은 ○ 와 겹테두리.

## 예시 항목 (장면 파일 `js/data/scenes/s2.js` 의 `items` 안)

```js
{
  id: 's2.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '소리를 글자로',
  prompt: '백성의 말소리를 글자로 바꾸어 보자. 먼저 자음부터.',
  gimmick: 'letterForge',
  config: {
    steps: ['shape', 'add', 'odd'],
    shape: { orig: ['O-s2-SANG-G', 'O-s2-SANG-N', 'O-s2-SANG-M', 'O-s2-SANG-S', 'O-s2-SANG-O'] },
    add: { orig: ['O-s2-GAHOEK1'] },
    odd: { orig: ['O-s2-ICHE'] }
  },
  answer: {
    shape: { g: ['right', 'top'], n: ['bottom', 'left'], m: ['bottom', 'left', 'right', 'top'], s: ['slashL', 'slashR'], o: ['ring'] },
    add: { 'g.1': 'k', 'n.1': 'd', 'n.2': 't', 'm.1': 'b', 'm.2': 'p', 's.1': 'j', 's.2': 'ch', 'o.1': 'q', 'o.2': 'h' },
    odd: ['ng', 'r', 'z']
  },
  hints: ['ㄱ은 혀뿌리가 목구멍을 막는 모양이야. 단면도의 굵은 선을 따라가 봐.', 'shape'],
  explain: '기본자 ㄱ ㄴ ㅁ ㅅ ㅇ 은 발음 기관의 모양을 본떴다(상형). 소리가 세지면 획을 더했다(가획). ㆁ ㄹ ㅿ 은 획을 더하는 원리를 따르지 않고 모양을 달리해 만들었다.'
}
```
(중학교판 `explain` 에는 '이체' 를 쓰지 않는다. 고등판이 '이체' 를 쓰려면 `editions` 로 나눈다.)

모음 과제 예: `config: { steps: ['samjae', 'vowel'], samjae: { orig: ['O-s2-CHEON', 'O-s2-JI', 'O-s2-IN'] } }`,
`answer: { samjae: { araea: 'sky', eu: 'earth', i: 'person' }, vowel: { vo: 'eu-up-1', … } }` (위 표 그대로).

## 알아 둘 것

- 단면도는 설명용 그림이다(해부도 아님). 본뜬 곳(혀뿌리·혀끝·입·이·목구멍)은 굵은 선과 끝점 동그라미로 표시하고 이름은 DOM 글자로 단다.
- ㄴ 의 上腭 은 '윗잇몸'(중2-2 140쪽 활동)과 '입천장' 풀이가 갈려(09 문서 8-1) 이름표에 둘을 함께 적었다. 채점 대상은 글자 구조뿐이다.
- 오음 이름(어금닛소리·혓소리·입술소리·잇소리·목구멍소리)은 해례(牙舌脣齒喉音)를 따른 것으로 모든 학교급에 보인다.
