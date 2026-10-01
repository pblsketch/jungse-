# 기믹 `twoEraNotebook` — 두 시대 수첩 (장면 10 「백 년 뒤」, 고2~3 핵심 · 고1 선택)

15세기 쪽과 16세기 쪽을 나란히 펴고, 수첩의 현상(줄)마다 16세기에 **지켜짐**(`kept`) / **흔들림**(`shaky`) / **없음**(`none`)을 고른 뒤,
16세기 글에서 **근거 낱말**을 눌러 모은다. 한 번에 제출한다. 이 장면은 방점을 늘 켠다(진행기가 처리 — 설정과 상관없음).

- 근거 모으기: 줄의 `근거 고르기` 단추를 켜고(▸, `aria-pressed`) 16세기 쪽 낱말 단추(또는 '더 살펴볼 낱말')를 누른다. 다시 누르거나 근거 칩을 누르면 빠진다.
  처음에는 첫 줄이 켜져 있다. 줄을 켜면 15세기 쪽의 그 줄 보기 낱말에 `◇` 가 붙는다(견주어 보기).
- `graded: false` 줄은 `알아 두기` + '채점하지 않아요'로만 보이고 고르지 않는다.
- 틀린 제출: 틀린 갈래 고르기에 `✕`, 받지 않는 근거 칩에 `✕`·줄 긋기, 근거가 필요한데 없으면 '✕ 고른 근거가 없어요', 그 줄은 점선. 상태 `open`.
- 2번째 틀림(`showHint(2, hints[1])`): `hints[1]` 이 줄 id 면 그 줄, 아니면 방금 틀린 줄들 — 줄에 빛 테두리, 15세기 보기 낱말에 `◆`,
  **근거가 들어 있는 16세기 글 묶음(블록)** 에 빛 테두리(낱말 자체는 알려 주지 않는다), 그 줄의 근거 고르기가 켜진다.
- 3번째 틀림: `doneByHelp`. 정답 갈래(`○` 정답)와 정답 근거 칩(`○`), 모두 잠금. 다시 열어도 같은 모습.

화면 문구: `js/data/text-g-twoEraNotebook.js`.

## `config`

| 필드 | 필수 | 뜻 |
|---|---|---|
| `page15` | | `{ orig: [블록 id], words: [낱말 지정], extra?: [{ id, text, note?, src? }] }` — 견주어 볼 15세기 글. 낱말은 강조용(누르지 않음) |
| `page16` | ○ | `{ orig: [블록 id], words: [낱말 지정], extra?: [{ id, text, note?, src? }] }` — 16세기 글. `words` 와 `extra` 가 누를 수 있는 근거 낱말 |
| `rows` | ○ | 수첩 줄 `[{ id, label, ex15?: [15세기 낱말 id], graded?: false, note?, src? }]`(`label`·`note` 는 데이터 표기, 새로 씀) |
| `notes` | | 수첩 아래 카드 `[{ kind: 'know' \| 'interp' \| 'variant', orig?: 블록 id, text, src? }]` — 채점하지 않음(『훈몽자회』 자모 이름, 이본 노트 등) |

낱말 지정(`{ id, block?, line?, match? | at?, nth? }`)은 `README-questionPair.md` 의 '낱말 지정'과 같다. `extra.text` 는 原文이 아닌 낱말 꼴(사전·교과서 낱말 사슬)만 쓴다.

## `answer`

```js
{ <줄 id>: { status: 'kept' | 'shaky' | 'none', evidence?: [<받아 주는 근거 낱말 id>, …] } }
```

- `evidence` 가 있으면: 학생이 1개 이상 골라야 하고, 고른 것이 모두 그 목록 안에 있어야 한다(목록을 다 고를 필요는 없다).
- `evidence: []` 이면 아무것도 고르지 않아야 한다(예: '없음' 줄). `evidence` 를 적지 않으면 근거는 보지 않는다.
- `graded: false` 줄은 `answer` 에 넣지 않는다.

## 예 (블록·드러나는 항목: 11 문서 §4-2, 15세기 쪽: 10 문서 §5 's10의 15세기 쪽 후보', 근거 쪽수: 05 문서 §3-2)

```js
{
  id: 's10.t1', kind: 'task', levels: ['h1', 'h23'], label: '두 시대 수첩', gimmick: 'twoEraNotebook',
  config: {
    page15: {
      orig: ['O-s6-SS6e'],
      words: [{ id: 'e.ne', match: ':네' }, { id: 'e.saram', match: ':사[ㄹㆍ]·[ㅁㆎ]' }, { id: 'e.mom', match: '·모·[ㅁㆍㄹ]' }, { id: 'e.buteo', match: '부텨·를' }],
      extra: [{ id: 'e.saal', text: '사[ㅇㆍㄹ]', note: '사흘의 15세기 꼴', src: '공통국어2 138쪽' }]
    },
    page16: {
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
      ],
      extra: [{ id: 'x.saheul', text: '사흘', note: '16세기부터 보이는 꼴', src: '공통국어2 138쪽' }]
    },
    rows: [
      { id: 'nom', label: '주격 조사는 여전히 ㅣ일까?', ex15: ['e.ne'] },
      { id: 'ga', label: '주격 조사 가가 보일까?' },
      { id: 'cut', label: '체언과 조사를 이어 적을까?', ex15: ['e.mom', 'e.saram'] },
      { id: 'vh', label: '모음 조화를 지킬까?', ex15: ['e.mom', 'e.buteo'] },
      { id: 'bj', label: '방점', graded: false,
        note: '방점은 16세기 중엽부터 흔들리다가 16세기 말엽 문헌부터는 찍지 않게 된다. 이 장면의 방점은 교과서 판독 하나에만 기대므로 견주어 채점하지 않는다.',
        src: '공통국어2 지도서 134쪽 · 화법과 언어 209쪽' },
      { id: 'araea', label: '둘째 음절의 ㆍ는 그대로일까?', ex15: ['e.saram', 'e.saal'] }
    ],
    notes: [
      { kind: 'know', orig: 'O-s10-HUNMONG1', text: '(장면 작가가 새로 쓴 『훈몽자회』 자모 이름 설명)', src: '중학 국어 2-2 155쪽' },
      { kind: 'variant', text: '(장면 작가가 새로 쓴 이본 노트: 道 뒤 조사가 다른 판에서는 [ㄹㆍㄹ] — 채점하지 않음)', src: '11 문서 §8' }
    ]
  },
  answer: {
    nom: { status: 'kept', evidence: ['s.i'] },
    ga: { status: 'none', evidence: [] },
    cut: { status: 'shaky', evidence: ['s.mom1', 's.eolgul', 's.machm'] },
    vh: { status: 'shaky', evidence: ['s.mom2'] },
    araea: { status: 'shaky', evidence: ['x.saheul'] }
  },
  hints: ['15세기 쪽 보기와 같은 자리를 16세기 글에서 찾아보자.', 'cut'],
  explain: '(장면 작가가 새로 쓴 풀이)'
}
```

## 장면 작가가 지킬 것 (11 문서)

- **『소학언해』의 방점은 채점하지 않는다.** 방점 층은 교과서 1종뿐(△)이다. 방점 현상 줄은 `graded: false` 로 두고, 방점 낱말을 근거로 받지 않는다.
- **`O-s10-SOHAK4` 의 '道' 뒤 조사(`·를`)는 근거 낱말로 쓰지 않는다.** 다른 판은 'ᄅᆞᆯ'로 적어 모음 조화 판정이 달라진다(11 문서 §0·§8). 이본 노트로만.
  모음 조화가 흔들린 근거는 `·몸·을`, 지킨 예는 `·[ㅅㆍㄹ]·[ㅎㆍㄴ]`·`{父|·부}{母|:모}[ㄹㆍㄹ]` 이다.
- 끊어 적기 근거: `·몸·이며`·`얼굴·이며`(SOHAK2), `[ㅁㆍ]·[ㅊㆍㅁ]·이니·라`(SOHAK4). 같은 글에 이어 적기(`거·시·라`, `비·르·소미·오`)가 함께 있다 — 그래서 '흔들림'.
- 주격: 16세기에도 'ㅣ'(SOHAK1 `孔子ㅣ`), '가'는 근대 국어에서 보인다(화법과 언어 206·209쪽).
- ㆍ 둘째 음절 → ㅡ 는 16세기에 **시작된** 변화다(사ᄋᆞᆯ → 사흘, 공통국어2 138쪽). 이 『소학언해』 대목에는 둘째 음절 ㆍ가 그대로인 낱말(ᄉᆞᆯᄒᆞᆫ, ᄆᆞᄎᆞᆷ)이 있어,
  예에서는 '흔들림' + 근거 '사흘'로 두었다. 바뀐 해(연도)는 채점하지 않는다(11 문서 §9).
- 『훈몽자회』 자모 이름(뜻 빌리기·소리 빌리기)은 `notes` 의 `know`(알아 두기)로만. 채점하지 않는다.
- 줄 이름·알아 두기 글·풀이는 새로 쓴다(번역서·시험 지문 문장 금지).
