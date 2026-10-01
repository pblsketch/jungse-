# 기믹 `syllableBuild` — 음절 조립 (s3 「모아 써야 소리가 된다」)

초성·중성·종성 세 자리에 글자 블록을 모아 한 음절을 만드는 기믹 과제다(spec §7 s3, plan G4).

- 과녁(target)마다 세 자리(초성·중성·종성)와 글자 블록 쟁반이 있다. 자리 단추로 넣을 자리를 고른 뒤 블록을 누른다(또는 블록을 자리에 끌어다 놓는다).
  넣은 블록을 누르면 빠진다. 키보드: Tab 으로 자리 단추·블록, Enter·Space 로 고르기·넣기.
- 한 자리에 블록을 둘·셋 넣으면 **나란히 쓰기**(고등: **병서** — 같은 글자끼리 '각자 병서', 다른 글자끼리 '합용 병서'),
  중성에 모음 블록을 둘·셋 넣으면 **모음자 합치기** 이름표가 붙는다(학교급 용어: `js/data/text-g-syllableBuild.js` 의 `terms`).
  입술소리 + ㅇ(ㅸ 등)은 **연서 · 알아 두기** 이름표(연서는 채점하지 않는 알아 두기 — spec §7 s3, 06 문서 §6-1).
- 모은 글자는 데이터 표기 `[초중종]` 으로 옛한글 조합기(`NM.core.yet`)를 거쳐 DOM 글자로 미리 보인다(ㆍ ㅿ ㆁ ㆆ ㅸ·합용 병서도 조합).
  한 음절로 모이지 않으면(중성 없음, 표에 없는 묶음) "아직 한 글자로 모이지 않아요".
- **판정은 화면 글자가 아니라 자리별 자모 원자열**로 한다. `ㄲ` 블록 하나와 `ㄱ`+`ㄱ` 블록 둘은 같다(`NM.data.JAMO.COMPAT` 로 풀어 비교). 방점은 조립하지 않는다.
- 틀린 제출: 틀린 자리가 흐려진다(✕, 점선). 도움 2: `hints[1]` 의 자리를 `!` 로 강조(없으면 지난 틀린 자리). 3번째 틀림·다시 열기: 정답 블록을 ◎ 로 채우고 잠근다.
- 연습 과녁(`practice: true`)은 '알아 두기 · 채점하지 않아요' 표지가 붙고 답·판정에서 빠진다(연서 ㅸ 체험 등).

## 항목 데이터

```js
{
  id: 's3.t1', kind: 'task', levels: ['m', 'h1', 'h23'], label: '…', prompt: '…',
  gimmick: 'syllableBuild',
  config: {
    orig: ['O-s3-HJ-SAM'],                 // (선택) 과제 위에 보일 原文 카드(블록 id)
    tray: ['ㄱ', 'ㄴ', 'ㅏ'],              // (선택) 과녁에 tray 가 없을 때 쓸 블록
    targets: [
      { id: 'jjak', prompt: '…', orig: 'O-s3-HJ-HAPYONG', tray: ['ㅂ', 'ㅈ', 'ㅅ', 'ㄷ', 'ㅏ', 'ㆍ', 'ㄱ', 'ㄹ'] },
      { id: 'hwae', prompt: '…', orig: 'O-s3-HJ-JUNGHAP', tray: ['ㅎ', 'ㄱ', 'ㅗ', 'ㅏ', 'ㅣ', 'ㅜ'] },
      { id: 'heuk', prompt: '…', orig: 'O-s3-HJ-JONGHAP', tray: ['ㅎ', 'ㄴ', 'ㆍ', 'ㅡ', 'ㄹ', 'ㄱ', 'ㅅ'] },
      { id: 'sabi', prompt: '…', orig: 'O-s3-YJ-CHO-BB', practice: true, tray: ['ㅂ', 'ㅇ', 'ㅅ', 'ㅣ'] }
    ]
  },
  answer: {                                // 과녁 id → 자리별 호환 자모(문자열 또는 배열). 연습 과녁은 넣지 않는다
    jjak: { cho: 'ㅂㅈ', jung: 'ㅏ', jong: 'ㄱ' },   // ᄧᅡᆨ(짝) — 합용 병서
    hwae: { cho: 'ㅎ', jung: 'ㅗㅏㅣ', jong: '' },   // 홰(횃불) — 모음자 합치기(ㅙ)
    heuk: { cho: 'ㅎ', jung: 'ㆍ', jong: 'ㄹㄱ' }     // ᄒᆞᆰ(흙) — 끝소리 나란히 쓰기(겹받침)
  },
  hints: ['…선배의 힌트…', { jjak: ['cho'] }],      // 2단계 강조: 과녁 id → 자리 이름('cho'|'jung'|'jong') 배열
  explain: '…풀이…'
}
```

| 필드 | 뜻 |
|---|---|
| `config.targets[]` | `{ id, prompt?, tray?, orig?, practice? }`. `prompt` 는 데이터 표기(별명 `<@>` 가능, 새로 쓴 문장). `orig` 는 그 과녁 위에 보일 原文 블록 id 하나 |
| `tray` | 호환 자모 글자 배열(한 블록 = 한 글자, `ㄲ`·`ㅘ` 같은 묶음 글자도 블록이 될 수 있다). 같은 블록은 몇 번이고 쓸 수 있다. 오답 블록을 섞어 둔다 |
| `answer` | `{ 과녁 id: { cho, jung, jong } }`. 값은 호환 자모 문자열(또는 배열). 원자열로 풀어 비교하므로 `'ㄲ'` = `'ㄱㄱ'`, `'ㅙ'` = `'ㅗㅏㅣ'`. 빈 자리는 `''` |
| `hints[1]` | `{ 과녁 id: ['cho'|'jung'|'jong', …] }` — 2번째 틀림에 강조할 자리 |
| 학교급 | `level` m 이면 '나란히 쓰기', h1·h23 이면 '병서'(각자/합용). 과제 데이터는 같아도 된다 |

## 장면 작성자가 할 일

- 과녁 낱말은 해례 합자해·용자례 原文 블록에 실린 말에서 고른다(09 문서 §4-5·4-6, 오늘 말 대응은 09 문서 §5 표).
  예: `O-s3-HJ-HAPYONG`(합용 병서 첫소리 — `·[ㅼㅏ]` 땅, `[ㅶㅏㄱ]` 짝, `·[ㅴㅡㅁ]` 틈), `O-s3-HJ-GAKJA`(각자 병서 — `·[ㆅㅕ]`, `괴·[ㆀㅕ]`, `쏘·다`),
  `O-s3-HJ-JUNGHAP`(모음자 합치기 — `·과` 괘, `·홰` 횃불), `O-s3-HJ-JONGHAP`(끝소리 합용 — `[ㅎㆍㄺ]` 흙, `·낛` 낚시),
  용자례 `O-s3-YJ-*`(생활 물건 낱말: `·[ㄱㆍㄹ]` 갈대, `[ㅋㅗㆁ]` 콩, `아[ㅿㆍ]` 아우 …). 중학교 교과서 예(06 문서 §4): 된소리 ㄲ·ㄸ·ㅃ·ㅆ·ㅉ, 겹받침 ㄳ·ㄶ·ㄵ·ㄺ·ㅄ, 모음 ㅘ·ㅝ·ㅐ·ㅔ.
- 원문 글자를 config 에 옮겨 적지 않는다 — 블록은 `orig`(id)로만 보이고, `answer` 에는 자모만 쓴다.
- **연서(ㅸ)·종성 규정(8종성)은 알아 두기**다: 채점 과녁에 넣지 말고 `practice: true` 과녁이나 장면 `notes`(kind `know`, 블록 `O-s3-YEONSEO`·`O-s3-JONG8`)로 보인다.
- 물음·힌트·풀이는 교과서 문장을 옮기지 않고 새로 쓴다. 중학교판 물음에는 '상형·가획·합성' 밖의 용어(병서·연서)를 쓰지 않는다.

## 끼우기

```html
<!-- 데이터 구역 -->
<script src="js/data/text-g-syllableBuild.js"></script>
<!-- js/ui/stage-gimmick.js 뒤 -->
<script src="js/gimmicks/syllableBuild.js"></script>
<!-- css/stage.css 뒤 -->
<link rel="stylesheet" href="css/g-syllableBuild.css">
```

`js/data/jamo.js`·`js/core/yet.js`(조합), 原文 카드를 쓰면 `js/data/orig.generated.js`·`js/ui/marker.js` 가 먼저 있어야 한다.
시험: `tests/pages/g-syllableBuild.html`, `tests/checks/g4-syllableBuild-browser.mjs`, `tests/unit/g4-syllableBuild.mjs`.
