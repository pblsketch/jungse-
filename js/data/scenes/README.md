# 장면 데이터 (`js/data/scenes/<장면 id>.js`)

장면 하나에 파일 하나를 둔다(spec §19-3). 선생님이 고치는 파일이다. 장면 진행기(`js/ui/stage-runner.js`)가 이 데이터로 장면을 돌린다.
화면에 나오는 문구는 모두 이 파일(또는 `js/data/text-stage.js`)에 두고, 화면 코드에는 한국어 문장을 넣지 않는다.

## 등록

```js
'use strict';
window.NM = window.NM || {};
NM.data = NM.data || {};
NM.data.SCENES = NM.data.SCENES || {};
NM.data.SCENES['s6'] = { id: 's6', /* … */ };
```

- 파일은 `index.html` 의 스크립트 등록 구역에 일반 `<script>` 로 붙는다(물결 끝 연결 단계가 붙인다). 장면 진행기보다 먼저든 나중이든 상관없다.
- 다른 장면 파일을 덮어쓰지 않도록 `NM.data.SCENES = NM.data.SCENES || {}` 로 합친다.

## 글 적는 법 (데이터 표기)

모든 글은 `js/core/yet.js` 머리의 데이터 표기 규칙을 따른다.

| 적는 법 | 뜻 |
|---|---|
| `[ㅁㆍㄹ]` | 대괄호 = 옛한글 한 음절(호환 자모를 늘어놓음) |
| `·가`, `:가` | 음절 바로 앞의 가운뎃점·쌍점 = 방점(거성 1점, 상성 2점). 화면에서는 음절 **왼쪽**에 점으로 찍힌다 |
| `{漢\|한}` | 루비(한자 위 읽기) — 중괄호 안을 세로줄로 나눈다 |
| `**굵게**`, `_밑줄_` | 꾸밈 |
| `<@>`, `<@이>`, `<@아>`, `<@은>`, `<@을>`, `<@과>`, `<@으로>` … | 별명 자리. 별명 받침에 맞춰 조사가 바뀐다(바다야 / 하늘아). 교사 모드나 별명이 없으면 '통사' |

- 가운뎃점을 음절에 붙여 쓰면 방점이 된다. 나열에는 띄어 쓴다(`가 · 나`).
- 조사 짝 목록은 `js/data/text-stage.js` 의 `josa` 에 있다(이/가, 은/는, 을/를, 과/와, 아/야, 이라/라, 으로/로 …).
- **원문 글자는 장면 데이터에 쓰지 않는다.** 원문은 블록 id(`O-s4-YB2`)로만 가리키고, 글자는 자동 생성 원문 데이터
  `NM.data.ORIG`(js/data/orig.generated.js, 손으로 고치지 않음)에서 그린다.

## 장면 필드

| 필드 | 필수 | 뜻 |
|---|---|---|
| `id` | ○ | `s0`~`s12` |
| `title`, `era` | ○ | 화면에 보이는 장면 이름, 시대 |
| `mapKey` | ○ | `NM.engine.loadMap` 에 넘길 맵 키(없으면 `NM.data.STAGES[id].mapKey`, 그것도 없으면 장면 id → `maps/<id>.json`) |
| `bgmKey` | | 배경음 키(`NM.data.ASSETS.bgm`). 파일이 없으면 조용히 건너뛴다 |
| `carveGlyph` | ○ | 패 글자(데이터 표기). 서장은 없음 |
| `bangjeomAlways` | | `true` 면 설정과 상관없이 방점을 늘 켠다(s4·s10 은 쓰지 않아도 늘 켬) |
| `cast` | | 대사의 `who` 키 → `{ name, portrait }`. `senior`(선배 통사)·`sejong`(세종)·`me`(주인공)·`narrator`(해설)는 따로 적지 않아도 된다 |
| `intro` | ○ | 혼자 시작하는 도입 대사 `[줄]` |
| `request` | ○ | 의뢰 대사 `[줄]` |
| `encounter` | | 원문과 마주침 `{ orig: [블록 id], lines: [줄] }` |
| `example` | | 선배의 풀이 예시 `{ orig: [블록 id], lines: [줄] }` |
| `needs` | | 앞 장면에서 배우는 규칙 `[{ rule: 'rule.nomCase', lines: [줄] }]`. 이 학교급 수첩에 그 규칙 카드가 없으면 선배가 `lines` 로 짧게 알려 주고, '아직 확인하지 않은 규칙' 카드에 그 규칙을 배우는 장면 이름(`NM.data.RULE_CARDS[rule].stage`)이 나온다 |
| `contexts` | ○ | 맥락(조사 지점·사람의 말) `[{ id, label, orig: [블록 id], lines: [줄], items: [항목 id] }]` |
| `items` | ○ | 핵심 항목(아래) |
| `npcs` | | 맥락이 아닌 인물의 말 `{ <npcId>: { name, lines: [줄] } }`. `name` 은 교사 모드 장소 목록에도 쓰인다 |
| `notes` | | `[{ id, kind, text, src, at: [맥락 id], title? }]` (kind: `know` · `variant` · `interp`) — 알아 두기(사실 카드는 `src` 필수)·이본 노트·해석(둘은 채점 안 함). `at` 의 맥락 창에 보인다 |
| `fiction` | | `[{ id, text, real, name? }]` — `게임 설정 · 虛` 한 줄 표지. 이름은 `name`, 없으면 `text` 의 앞머리(`정음 통사: …`·`말의 강 — …` 의 콜론·줄표 앞), 그것도 없으면 `text` 전체. `실제 역사 보기` 를 누르면 나머지 설명과 "실제로는 → real" 이 펼쳐진다(도입에서 그 장면의 표지가 모여 보이고, 대사 줄의 `fiction: '<id>'` 로도 붙일 수 있다) |
| `translate` | ○ | 통역(의뢰 해결) 장면 `{ id?, text?, at?, lines: [줄] }`. 핵심 항목이 모두 끝나면 바로(또는 `at` 맥락/인물에 가면) 재생되고, 그 뒤 장면이 끝난다. `id` 는 수첩의 옮긴 구절로 남고(`text` 가 그 현대어), 통역 뒤에는 퀴즈가 없다 |
| `translate.choose` | | 통역 고르기(선택, 처음 쓴 곳 s5). `[{ id, item?, prompt, options: [{ id, text, part?, correct, reaction?: [줄] }] }]` — 다 된 통역 대사 전에 학생이 해독한 뜻으로 통역을 1~2번 고른다. 고르기마다 정답 1개, 틀린 카드의 `reaction` 은 그 통역을 들은 사람의 반응(짧게)이고 다시 고를 수 있다. `compose` 는 고른 말(`part`)이 차례로 들어갈 빈칸 `{?}` 이 든 통역 문장, `chooseAt` 은 고르기 앞에 먼저 틀 `lines` 줄 수. `item` 은 근거가 되는 해독 항목 id(점검용). 없으면 예전처럼 `lines` 만 튼다(js/ui/stage-translate.js) |
| `translations` | | 기믹이 `store.addTranslation(stageId, id)` 로 남기는 옮긴 구절 `[{ id, text, orig? }]`(수첩용) |
| `editions` | | 학교급별 판(아래) |

### 대사 줄

문자열(해설) 또는 `{ who, text, portrait?, expr?, cg?, fiction?, mark?, src? }`.

- `who`: `cast` 키 또는 `senior`·`sejong`·`me`·`narrator`
- `fiction: true` → 이름 옆에 `게임 설정 · 虛` 표지(세종의 지어낸 대사 등). `fiction: '<fiction id>'` → 그 카드를 줄 아래에 붙임
- `mark: 'know'|'variant'|'interp'|'explain'` → 대사 대신 표지 카드로 보임(`src` 는 출처)
- `portrait`: `NM.data.ASSETS.portraits` 의 키(없으면 `cast[who].portrait`, 그다음 `who`). 그림이 없으면 이름 첫 글자
  - 초상 키 찾는 순서: `me` → 고른 주인공 `hero_<번호>`, `senior` → `senior_tongsa`; 그다음 `<키>_<expr>` → `<키>_neutral` → `<키>`. 인물 초상 키는 `js/data/assets.js` 의 `portraits` 를 본다(예: `commoner_man`, `yangban_woman`, `sejong`).
- `expr`: 표정 `neutral` / `surprised` / `smile` / `thinking` (그 표정 초상이 있을 때만 바뀜)
- `cg`: `NM.data.ASSETS.cg` 키. 대사 위에 웹툰 그림을 한 장 보인다(예: 도입 `s2_intro`, 절정 `s2_climax`, 오해 장면 반응 `mis_commoner_puzzled`·`mis_yangban_offended`·`mis_child_laughing`·`mis_official_confused`·`mis_woman_flustered`·`mis_monk_bemused`)

### 항목 (`items`)

공통: `id`(`s6.r2`, `s4.t1`), `kind`(`read`|`task`), `levels`(핵심인 학교급 `['m','h1','h23']` — 목록에 없는 학교급에서는 맥락 창에 알아 두기 카드로만 보인다), `label`(항목 이름표), `prompt`(물음, 없으면 기본 문구).

**해독 항목** `kind: 'read'`

| 필드 | 뜻 |
|---|---|
| `cards` | 3~4장 `{ id: '<항목>.a', text, correct, why }`. 정답(`correct: true`)은 정확히 1장. 오답은 실제 오개념, `why` 는 왜 아닌지 |
| `explain` | 정답 풀이 |
| `hints` | `[1단계 힌트, 2단계에 빛낼 맥락 id]` |
| `misread` | `{ <오답 카드 id>: [줄] }` — 그 뜻으로 통역했을 때의 오해 장면 |
| `ruleCard` | 규칙 항목이면 규칙 카드 id. 확정하는 순간 수첩에 붙는다 |
| `sentence` | 규칙 항목의 규칙 문장. 빈칸 자리를 `{?}` 로 적으면 '규칙 카드 문장 완성' 부품으로 보인다(카드가 빈칸 보기) |
| `word` | 옛 형태(데이터 표기, 문자열). 확정한 뒤 화면 곳곳(원문·대사)의 같은 말 옆에 현대어 풀이가 붙는다. 수첩도 이 값을 옛 형태로 쓴다(없으면 `label`) |
| `wordForms` | `word` 의 다른 표기(방점·이형태) 목록 — 풀이 붙일 곳을 찾을 때만 쓴다 |
| `gloss` | 화면 풀이에 쓸 현대어. 없으면 정답 카드 글자 |

항목마다 그 장면 맵 안에 **서로 다른 맥락이 2곳 이상**(맵 `spots`·`npcs` 의 `contextId`) 있어야 한다. 서로 다른 맥락 2곳을 살펴야 확정 단추가 열린다.

**기믹 과제** `kind: 'task'`

| 필드 | 뜻 |
|---|---|
| `gimmick` | `NM.gimmicks.register` 로 등록한 기믹 이름 |
| `config` | 기믹별 설정 |
| `answer` | 정답(기믹이 `check` 를 주지 않으면 학생 답과 깊은 비교 — 객체 키 순서 무관) |
| `hints` | `[1단계 힌트, 2단계 강조 대상]`(강조 대상은 기믹이 해석) |
| `explain` | 풀이(3번째 틀림·완료 뒤) |

과제는 화면 왼쪽 위 진행표에서 열고, 맥락의 `items` 에 넣으면 그 맥락 창에서도 열 수 있다.

### 학교급별 판 (`editions`) — 결정

중학교판(9·종장)처럼 학교급마다 다른 판은 **같은 파일 안에서 `editions` 로 나눈다**.

```js
NM.data.SCENES['s9'] = {
  id: 's9', title: '…', /* 고등판 필드 */
  editions: {
    m: { title: '…', intro: [ … ], contexts: [ … ], items: [ … ], translate: { … } }
  }
};
```

진행기는 지금 학교급(`store.level`)의 `editions[학교급]` 필드로 위 필드를 **통째로** 덮어 쓴다(얕은 합치기 — `items`·`contexts` 는 배열째 바뀐다).
핵심 항목 범위(묶음 밖 장면, 고2~3 전용 장면)는 그 뒤에 `NM.core.rules` 가 `levels` 로 정한다.

## id 규칙 (spec §19-1)

장면 `s0`~`s12` · 항목 `<장면>.<r|t><번호>` · 맥락 `<장면>.c<번호>` · 카드 `<항목>.<a|b|c|d>` · 규칙 카드 `rule.<영문>` · 원문 블록 `O-<장면>-<약칭>`.

## 기믹 끼우기

`js/gimmicks/<이름>.js` 에서 `NM.gimmicks.register('<이름>', { mount(el, o), check?(answer, item) })`. 계약은 `js/ui/stage-gimmick.js` 머리 주석.
판정·저장·도움 단계는 진행기가 `NM.core.rules`(store)로 한다. 기믹은 그리기·답 만들기·틀린 곳 표시만 한다.

## 시험용 예시

`tests/fixtures/d1-scene.js`(시험 장면 — 원문 글자는 시험 문자열), `tests/fixtures/maps/d1-test.json`(맵), `tests/fixtures/d1-gimmick.js`(시험 기믹).
