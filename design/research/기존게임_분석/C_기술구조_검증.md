# C. 기술 구조·콘텐츠 데이터·검증 체계 분석 — 새 중세국어 게임 저장소를 위해

- 조사 대상(읽기 전용 클론): `/home/user/pblsketch/{sori-haejeon, gwandong-byeolgok, hero-road, dosan-sipigok, pansori-hanmadang, sassi-namjeonggi}` (모두 `pblsketch` 계정, 단일 커밋 얕은 클론)
- 조사일: 2026-10-01
- 범위: 기술 구조, 학습 콘텐츠 데이터 스키마, 원문·옛한글 표기와 사실 확인 방법, 테스트·QA·플레이테스트, 에이전트 협업 문서 체계, 모바일·접근성·성능. (디자인 이론·에셋 파이프라인은 다른 보고서 범위. 맥락에 필요한 만큼만 언급)
- 표기: 경로는 저장소 이름부터 적는다(예: `sori-haejeon/docs/contracts.md`). "확인"은 파일을 직접 읽어 본 것, "추정"은 파일에서 짐작한 것이다.

---

## 0. 한눈에 보는 결론

1. **여섯 게임의 기술 스택은 같다.** 빌드 도구 없는 HTML + CSS + 순수 JS, 일반 `<script>`를 순서대로 등록하고 전역 `window.G`(엔진)와 전역 데이터 상수(`window.SONGS`, `window.KB` 등)를 쓴다. 서버·계정이 없다. 저장은 `localStorage` 한 키, 배포는 GitHub Pages(기본 가지의 저장소 맨 위 폴더를 그대로 내보냄)다. CI 워크플로(`.github/`)와 서비스 워커는 **어느 저장소에도 없다**.
2. **학습 내용은 모두 `js/data/*.js`에 있다.** 파일 머리 주석이 스키마 설명서 구실을 하고, "선생님이 고쳐도 되는 파일"이라고 적혀 있다. 글 안에는 작은 표시 언어를 쓴다. 옛한글 `[ㅎㆍ]`, 루비 `{漢字|한글}`, 시어 칸 `@id`, 호칭 칸 `[호칭|인물]`, `**굵게**`, 이름 자리 `{이름:을}` 같은 것들이다.
3. **옛한글 표기 방식은 세 가지다.** ① 데이터에는 호환 자모를 대괄호에 넣어 적고(`[ㅎㆍ]다`) 실행할 때 첫가끝(U+1100대) 자모열로 조합한다(관동별곡·도산십이곡). ② 원문에서 자동으로 뽑은 첫가끝 문자를 그대로 저장한다(판소리 `orig.js`). ③ 옛한글 자체를 금지한다(음운 해전). 셋 모두 Noto Serif KR SubsetOTF에서 **옛한글 자모 블록을 통째로 남기고 `ljmo/vjmo/tjmo` 기능을 살린 부분 글꼴**을 함께 넣는다.
4. **사실 확인은 문서로 남긴다.** 저장소마다 `원문_검증노트.md`, `원작_검증노트.md`, `research/01_작품_사실확인.md` 중 하나가 있다. 내용은 출처 약호표(URL), 확실도 기호(◎○△？ / ✅⚠️❌ / 확실·이본 차이·추정·미확인), 자료끼리 어긋난 곳의 행별 표, 채택 근거, "확인 못 한 것" 목록이다. 관동별곡은 Python `difflib`로 본문을 기계 대조했다(99.6%/98.5% 일치). 판소리는 **원문이 리서치 문서의 글자와 똑같은지를 테스트로 강제**한다.
5. **QA는 네 겹이다.** ① Node `vm`으로 데이터와 규칙을 브라우저 없이 점검한다. ② 브라우저 자동화로 학생처럼 끝까지 푼다(Playwright + 설치된 Chrome, 음운 해전만 aside). ③ AI 에이전트 실입력 플레이테스트를 한다. Codex에게 과제 지시서를 주면 보고서·수정·커밋까지 맡는다. ④ "학생 시점 대본 추출 → 정답표 분리 → 블라인드 풀이 에이전트 2~3명 → 디자이너 검토"를 돌린다. 판소리는 점수 균형 시뮬레이터도 있다.
6. **음운 해전(sori-haejeon)의 문서 체계가 가장 성숙했다.** `CLAUDE.md`와 `AGENTS.md`(같은 내용), 층별 `js/*/AGENTS.md`, `docs/`(architecture·contracts·standards·engineering-notes·operations·security·business-rules), `docs/tracking/`(status·findings·ADR 12건)이 있다. 새 저장소에 거의 그대로 옮길 수 있다(§6 템플릿).
7. **새 중세국어 게임에서 보강할 점.** 옛한글 조합기를 넓혀야 한다(방점, ㆌ, 동국정운식 한자음, 합용병서 전부). 원문 출처 사슬을 테스트로 묶고, 글꼴 커버리지를 자동으로 점검하고, Node 점검을 CI로 돌리는 것이 좋다. 화면 낭독기가 첫가끝 자모를 제대로 읽지 못하므로 현대 독음 `aria-label`도 필요하다. 관동별곡의 Google Fonts 의존과 `user-scalable=no`는 따라 하지 말 것.

---

## 1. 공통 기술 스택과 폴더 구조

### 1-1. 공통 스택 표

| 항목 | 여섯 게임 공통(예외) | 근거 파일 |
|---|---|---|
| 언어·런타임 | HTML + CSS + 순수 JavaScript(ES2020 정도, `'use strict'`), 브라우저만 필요 | 각 `README.md` '만든 방법' |
| 빌드 도구 | **없음.** 번들러·트랜스파일러·npm 런타임 의존이 없다. ES 모듈도 쓰지 않는다(file://에서 CORS로 막히므로) | `sori-haejeon/docs/tracking/decisions/0002-classic-scripts.md` |
| 모듈 방식 | 일반 `<script>` + 전역 이름공간 `window.G` (`G.util`, `G.save`, `G.audio`, `G.ui` …). 데이터는 전역 상수(`window.SOUNDS`, `KB`, `STORY`, `SONGS`, `DAEMOK` …). **의존 방향은 `index.html`의 등록 순서로만 지켜진다** | `sori-haejeon/index.html`, `gwandong-byeolgok/index.html` |
| 렌더링 | DOM 중심(사씨·판소리·도산·음운). 캔버스 게임 루프는 관동별곡(횡스크롤)과 영웅의 길(탑뷰 RPG). 정확해야 하는 그림은 SVG 코드(음운 해전의 입안 단면도) | `gwandong-byeolgok/js/main.js`, `hero-road/js/game/world.js`, `sori-haejeon/js/game/mouth.js` |
| 상태·저장 | 저장 모듈 하나(`js/core/save.js`)가 `localStorage` 한 키에 JSON 하나를 둔다. 버전 필드를 두고, 저장이 막혀도 예외 없이 돈다 | 각 `js/core/save.js` |
| 오디오 | 웹 오디오. 국립국악원 「디지털 이음」 악구 녹음(공공누리 1유형)을 이어 붙여 쓰고, 못 읽으면 브라우저 합성음으로 대신한다(관동별곡 엔진을 물려 씀). 음운 해전만 CC BY 녹음과 Freesound CC0 | 각 README, `sori-haejeon/assets/audio/CREDITS.md` |
| 글꼴 | 게임에 쓰인 글자만 남긴 부분 글꼴(woff2, SIL OFL). `tools/build_fonts.py`(fontTools + brotli)가 `js/` 문자열에서 글자를 모아 만든다. OFL 예약 이름 때문에 이름을 바꾼다(SoriUI, DosanYet …). 관동별곡은 Google Fonts CDN도 쓴다(예외) | `sori-haejeon/tools/AGENTS.md`, `dosan-sipigok/tools/build_fonts.py`, `gwandong-byeolgok/index.html` |
| 그림 | Codex CLI 이미지 생성(gpt-image-2) → Python(numpy·Pillow) 후처리 → webp. 프롬프트는 `tools/prompts/*.txt`. **그림 속에 글자를 넣지 않는다**(가짜 현판·가짜 원문 방지) | 각 README '만든 방법' |
| 배포 | GitHub Pages, 저장소 맨 위 폴더를 그대로(빌드 없음). 주소는 `https://pblsketch.github.io/<저장소>/`. `.nojekyll`은 sori-haejeon과 hero-road에만 있다. 상대 경로만 쓴다(절대 경로 `/assets`는 Pages 하위 경로와 file://에서 깨짐) | `sori-haejeon/docs/operations.md` §배포, `sori-haejeon/docs/contracts.md` ① |
| CI | **없음**(`.github/` 없음). 점검은 개발 기기(Windows, Node 24)에서 손으로 돌린다 | 확인: 여섯 저장소 모두 `.github` 없음 |
| PWA | `manifest.webmanifest`는 5개 게임에 있다(음운 해전만 없음). **서비스 워커는 하나도 없다** → 설치(홈 화면 추가)만 되고 오프라인 캐시는 없다 | `gwandong-byeolgok/manifest.webmanifest`(fullscreen, landscape), `dosan-sipigok/manifest.webmanifest`(standalone) |
| 링크 미리보기 | Open Graph·Twitter 카드(절대 주소 이미지 1200×630, 바꾸면 `?v=2`처럼 파일 이름을 바꿔 카카오톡 캐시를 깸) | `dosan-sipigok/index.html` 주석 |
| 개발 환경 흔적 | Windows + PowerShell(`tools/gen.ps1`), `.claude/`·`.omc/`·`.dryforge` gitignore, Codex CLI, aside | 각 `.gitignore`, `hero-road/design/qa/codex_final.md`(`E:/github/…` 경로) |

### 1-2. 공통 폴더 트리(여섯 게임의 공통분모)

```
<게임>/
├── index.html                 ← 유일한 진입점. <link>·<script> 등록 순서 = 의존 순서
├── manifest.webmanifest       ← (음운 해전 제외) 홈 화면 설치용
├── README.md                  ← 선생님용: 실행법, 차시 운영, 내용 고치기 표, 출처·라이선스, 테스트, 알려진 한계
├── .gitignore                 ← assets/raw/, tools/fonts_src/, tests/node_modules, tests/shots, .claude/ .omc/
├── .nojekyll                  ← (sori, hero만) Pages의 Jekyll 끄기
├── css/                       ← style.css 하나(5개 게임) 또는 모듈별 짝 CSS + base.css 토큰(음운 해전)
├── js/
│   ├── data/                  ← 학습 데이터와 화면 문구(선생님이 고치는 곳), window.이름 = …
│   ├── core/                  ← util·save·audio·ui(·text·scene·input·fx·assets·rules)
│   ├── game/                  ← 화면·장면·단계 실행기·엔진(app·steps·world …)
│   └── main.js                ← 마지막에 불러와 부팅
├── assets/
│   ├── fonts/                 ← 부분 글꼴 woff2 + OFL.txt
│   ├── bgm|audio|music/       ← mp3 + CREDITS
│   ├── sc|bg|pt|img|sprites|ui/ ← webp 그림, 아이콘, og 이미지
│   └── raw/                   ← (git 제외) 생성 원본
├── tools/                     ← build_fonts.py, gen.ps1/genqueue.ps1, make_prompts.py, process_assets.py, prompts/, (student_view.js, sim-balance.mjs, extract_orig.py, build_yet_font.py, yet_chars.js)
├── tests/                     ← package.json(playwright devDependency 또는 의존 없음), *.mjs 점검, shots/(git 제외)
└── design/                    ← 기획안 v0 → 기획서/설계서 v1(v2), research/, 검증노트, review/, playtest/, qa/
```

음운 해전만 위 구조에 다음을 더한다: `CLAUDE.md`·`AGENTS.md`, `docs/`(7문서 + `tracking/`), `js/{core,data,game}/AGENTS.md`, `tools/AGENTS.md`, `tests/lib/`(load·drive), `tests/pages/`(점검 전용 페이지), `tests/review/학생검토.md`.

### 1-3. 실행·배포 방식(공통 문구)

| 방법 | 설명 | 근거 |
|---|---|---|
| 웹 주소 | `https://pblsketch.github.io/<저장소>/` — 휴대폰·태블릿·칠판은 이 방법 권장 | 각 README |
| 로컬 서버 | `python -m http.server 8765` 또는 `node tests/server.mjs 8766` | `sori-haejeon/README.md`, `hero-road/README.md` |
| 파일로 | `index.html` 더블클릭도 돈다(일반 스크립트라 모듈 오류 없음). 다만 file://에서는 글꼴·fetch가 막혀 **옛한글이 기기 글꼴로 보일 수 있다** → 수업에서는 웹 주소 | `gwandong-byeolgok/README.md` 알려진 한계, `dosan-sipigok/README.md` |
| 바로가기 쿼리 | `?level=2A`, `?ch=ch5`, `?song=7`, `?pan=3`, `?teacher=1`, `?path=m`, `?result=1`, `?fast=1`(판소리, 연출 가속) | 각 README. **음운 해전은 주소 값을 일부러 읽지 않는다**(`docs/contracts.md` ①, ADR 0007) |
| 처음 배포 | `gh repo create pblsketch/<이름> --public --source . --push` → `gh api -X POST repos/…/pages -f "source[branch]=master" -f "source[path]=/"` → 빌드 상태 `gh api …/pages/builds/latest --jq .status` → `BASE=<배포주소> npm test` | `sori-haejeon/docs/operations.md` |
| 올리기 전 | **원격에 올리기(push·저장소 만들기·Pages 켜기) 전에 선생님 확인** | `sori-haejeon/docs/standards.md` §커밋·저장소 |

---

## 2. 게임별 코드 구조 비교

### 2-1. 비교표

| | 음운 해전 sori-haejeon | 관동별곡 gwandong-byeolgok | 영웅의 길 hero-road | 도산십이곡 dosan-sipigok | 판소리 한마당 pansori-hanmadang | 사씨남정기 sassi-namjeonggi |
|---|---|---|---|---|---|---|
| 장르 | 배틀십형 추론 + 실시간 2팀 대결 | 캔버스 횡스크롤 액션 + 두루마리 퀴즈 | 캔버스 탑뷰 RPG + 대화·카드 전투 | 수묵 관조 퍼즐(景·理·音) | 경영·편성 시뮬레이션(사설 짜기) | 필사본 복원 추리(호칭·빈칸) |
| 전체 파일 / JS 파일 | 223 / 17 | 159 / 20 | 294 / 22 | 138 / 12 | 232 / 17 | 156 / 10 |
| JS 줄 수(대략) | 5,900 (data 841) | 5,720 (data 1,353) | 5,840 (data 1,452) | 3,600 (data 668) | 2,880 (data 611) | 3,170 (data 873) |
| CSS | 모듈별 짝 CSS 10개 + `base.css` 토큰 | `style.css` 1개 | 1개 | 1개 | 1개 | 1개 |
| 데이터 전역 | `SOUNDS` `FLEETS` `LEVELS` `TEXT` `MOUTH` | `KB`(info·scrolls·quizzes·bossQuiz·finalTest·people·symbols·routes) `GD`(chapters·places·routes·fiction·sorts) | `STAGES` `WORKS` `STORY` `QUESTS` `MAPS` `NOTES` `SKILLS` `BOSSES` `BATTLE` `PEOPLE` | `SONGS` `NOTES`(INTRO·RECALL·VOICES) | `ORIG_RAW` `DAEMOK` `MOODS` `MOTIFS` `PANS` `NOTES` | `STORY` `PEOPLE` `LINKS` `NOTES` |
| 주요 모듈 | `G.rules`(순수 규칙), `G.save`, `G.audio`, `G.mouth`(SVG), `G.board`, `G.controls`, `G.howto`, `G.practice`, `G.duel`, `G.app` | `G.scenes`, `G.input`, `G.fx`, `G.assets`, `G.ui`, world·player·entities·bosses·levels·map·ending, `G.yet` | world(1,280줄)·combat·battle·steps·tiles·app | `G.scene`(번짐 캔버스), `G.text`(표시 언어 파서·음절·음보), steps·gimmicks | `SIM`(결정적 점수 엔진), journey·build·stage·ledger·book | steps(912줄 단계 실행기)·app |
| 화면/씬 관리 | `G.app.go(이름, 값)` 라우터. 화면 `open({resume, container})`이 `{destroy()}`를 돌려주고, 늦은 비동기 작업은 토큰으로 버림. 한 번에 한 화면 | `G.scenes.go(scene)`: scene 객체의 `enter/exit/update(dt)/draw(ctx)`, 페이드 Promise, 고정 시간 간격 rAF 루프. `TitleScene`·`LevelScene`·`CardScene`·`ChapterEnd` | 맵 월드(캔버스) + 이야기 '단계 실행기'(steps.js)를 대화창에 띄움. 단계 종류 `say·choice·name·gender·alias·blocked·train·relic·battle` | 곡마다 `ri:` 장면 조각 배열(`do: voice·card·choose·batch·lens·sort·scales …`)을 차례로 실행 | 판 순서 상태 기계(여정 → 단가 → 짜기 → 소리판 → 셈) | `type: page·case·card·sort·route·reveal·charges·reflect·mapfill` 단계를 실행기가 Promise로 처리 |
| 규칙·점수 | `G.rules` 순수 함수(DOM·localStorage·타이머 금지, 인자 불변, Node vm에서 점검) | 레벨 코드 안 | battle.js / combat.js | gimmicks 안 | `SIM.simulate(pan, plan)` 결정적(무작위 없음), 가중치 `SIM.K` | steps 안 |
| 저장 키 | `sori-haejeon:` + 이름 6개(`settings` `selection` `soundmap` `seenExample` `seenHowto` `game`), 값마다 `{ s: SCHEMA }`, 판 상태 `v: GAME_V` | `gwandong_byeolgok_save_v1` | `hero-road-v1`(`v:1`) | `dosan-sipigok-v1`(`v:1`) | `pansori-hanmadang-v1` | `sassi-jiwojin-v1` |
| 저장 단위 | 매 발마다 진행 판 저장. 끝난 판은 그 순간 누적 지도에 한 번만 더함(판 id로 중복 방지) | 레벨 클리어·두루마리·퀴즈 첫 시도(`quiz[id] = {ok, tries}`) | 끝낸 단계 id, 능력치, 갈래, 장 안 위치는 저장 안 함 | 단계·시어·음보·첫 시도 통계·오답 노트·도움 횟수 | 판별 결과·모티프·실제 공연 기록 | 장·활동 결과·도움 사용 |
| 테스트 | 15개 `check-*.mjs`(Node + aside), 의존 패키지 없음 | **없음** | 9개 + `codex-qa/` 10개(Playwright) | 5개(Playwright) + `tools/student_view.js` | 9개 + `codex/` 5개(Playwright) + `tools/sim-balance.mjs` | 7개(Playwright) |
| PWA manifest | 없음 | 있음(fullscreen·landscape) | 있음 | 있음(standalone) | 있음 | 있음 |
| 문서 | CLAUDE/AGENTS + docs 7 + ADR 12 | 기획안·기획서·원문 검증노트 | 기획안·기획서 v1·v2·사실확인·QA 보고서 | 기획서·research 2·review 7 | 설계서·인터뷰 결정·research 3·playtest | 기획서·검증노트·research 3 |

### 2-2. 상태 관리 패턴 정리

- **"저장 객체 하나 + 기본값 병합"**(5개 게임): `const fresh = () => ({ v: 1, … })` 기본값을 만들고, 읽을 때 `Object.assign(fresh(), JSON.parse(raw))`로 합친다. 모든 접근을 `try/catch`로 감싸고, 쓰기는 `S.write()` 한 곳에서만 한다. 없앤 설정값은 읽을 때 옮긴다(예: 관동별곡의 `difficulty` '쉬움' → `normal`). 근거: `gwandong-byeolgok/js/core/save.js`, `hero-road/js/core/save.js`, `dosan-sipigok/js/core/save.js`
- **"계약 문서 + 두 겹 버전"**(음운 해전): 저장 형식 버전 `SCHEMA`와 판 상태 버전 `GAME_V`를 따로 둔다. 망가진 값은 기본값으로 돌리고, 모양이 맞지 않는 진행 판은 지운다. 저장소가 막히면 메모리 `mem`에 값을 들고 돈다. `console.error`는 쓰지 않는다. 근거: `sori-haejeon/js/core/save.js` 머리 주석, `docs/contracts.md` ②
- **학습 기록 필드의 공통 어휘**: `first`(첫 시도 정확도), `wrong`(오답 노트), `helped`/`helpSong`(도움 사용, 감점 대신 기록), `seen`/`seenFiction`(한 번 본 설정 카드), `mode: 'first'|'review'`(처음 읽기/다시 읽기), `font`(글자 크기 배율), `teacher`.
- **재개(이어 하기) 버그는 되풀이되는 결함 유형이다**: 영웅의 길 QA-001(수련 중 새로고침 → 능력치 중복 지급), 판소리 P0-01(도입 중 재접속 → 시작 카드 누락). 둘 다 "보상은 즉시 저장, 진행 단계는 나중에 저장"이라 어긋났다. 음운 해전은 이 문제를 "끝난 판은 반드시 `saveGame`을 거치고, 판 id로 한 번만 더한다"는 규칙으로 막았다(`docs/engineering-notes.md` §저장·이어서 하기). → 새 게임에도 **보상과 진행 표시를 같은 트랜잭션에 저장**하는 규칙과 재개 회귀 테스트를 처음부터 둘 것.

---

## 3. 학습 콘텐츠 데이터 스키마(실제 데이터 인용)

### 3-1. 공통 원칙

1. 데이터 파일마다 **머리 주석에 스키마와 표기 규칙**을 적는다. 이것이 선생님용 편집 설명서다(`dosan-sipigok/js/data/songs.js` 1~15행, `sassi-namjeonggi/js/data/story.js` 1~25행, `hero-road/js/data/story.js` 1~9행).
2. `window.이름 = …`으로 내보낸다. 최상위 `const`는 Node `vm` 컨텍스트에서 보이지 않기 때문이다(`sori-haejeon/docs/engineering-notes.md`). 판소리만 `var`를 쓴다(이것도 vm에서 보임).
3. **원문, 풀이, 게임 설정을 필드 수준에서 나눈다.** `orig`/`text`(원문) ↔ `modern`(현대 표기) ↔ `gloss`(풀이) ↔ `fiction.body`(설정) + `real`(실제로는 →).
4. 오답 피드백은 **보기마다 단다**(`why`). 정답 해설(`explain`)과 답한 뒤 카드(`after`)를 따로 둔다.
5. 화면 문구는 데이터에만 둔다. 화면 코드에 한국어 문장을 박지 않는다(`sori-haejeon/docs/standards.md` §모듈 경계). 글꼴 도구도 이 문자열에서 글자를 모은다.

### 3-2. 관동별곡: 원문 두루마리 + 문항(`gwandong-byeolgok/js/data/text.js`)

```js
{ id: 'S01', section: '서사', chapter: 0, level: 'P1',
  place: '창평 죽림', placeNow: '전라남도 담양군 창평면 일대',
  title: '강호애 병이 깁퍼 — 관찰사에 임명되다',
  orig: '강호(江湖)애 병(病)이 깁퍼 듁님(竹林)의 누엇더니 / 관동(關東) 팔[ㅂㆍㅣㄱ] 니(八百里)에 방면(方面)을 맛디시니 / 어와 셩은(聖恩)이야 가디록 망극(罔極)[ㅎㆍ]다',
  modern: '자연을 사랑하는 마음이 병이 될 만큼 깊어 … / … / 아아, 임금의 은혜야말로 갈수록 끝이 없구나',
  words: [ { w: '강호', m: '강과 호수, 곧 자연' }, … ],
  points: [ { tag: '정서', text: '…(연군).' }, { tag: '표현', text: '…' } ],
  mind: 'official', mindValue: -1 }
```
- 행은 ` / `로 나누고 `orig`와 `modern`의 행 수를 맞춘다. 한자는 괄호 병기(`강호(江湖)`)로 적고 `G.stripHanja`로 끌 수 있다.
- 문항: `{ id:'Q02', scroll:'S01', type:'meaning', q, choices:[3개], answer:1, explain }`. 보스 문항은 `bossQuiz.libai[]`, 최종 평가는 `finalTest[]`(5지).
- 게임 설정(虛)과 實/虛 분류(`js/data/game.js`):
```js
fiction: { premise: { name:'망각귀와 흩어진 두루마리', title, body:'망각귀(忘却鬼)가 …',
           real:'관동별곡에는 망각귀도, 흩어진 두루마리도 나오지 않아요. …' } }
sorts: { 1: [ { t:'화자는 창평의 대숲에 머물다가 …', real:true, why:'…' },
              { t:'망각귀가 관동별곡의 시구를 먹물로 흩어 놓았다.', real:false, why:'게임을 위해 지어낸 이야기예요.' } ] }
```
- `game.js` 머리 주석: "원문 구절 자체는 text.js에만 있다. 이 파일의 'real'은 원문 내용을 풀어 쓴 설명이다(**따옴표로 원문인 척하지 않는다**)."

### 3-3. 도산십이곡: 원문·음보·시어·장면 조각(`dosan-sipigok/js/data/songs.js`)

```js
{ n: 1, part: 1, title: '제1곡', key: '고칠 수 없는 병',
  scene: { img: 's01', focus: [0.5, 0.62] },
  place: { t: '서당 앞 샘과 바위', note: '「도산기」에 … 1곡이 이곳을 노래했다는 근거는 없어요.' },
  text:   ['이런[ㄷㆍㄹ] 엇더[ㅎㆍ]며 뎌런[ㄷㆍㄹ] 엇더[ㅎㆍ]료', '@choya이 이러타 엇더[ㅎㆍ]료', '[ㅎㆍ][ㅁㆍㄹ]며 @cheonseok을 고텨 므슴[ㅎㆍ]료'],
  modern: ['이런들 어떠하며 저런들 어떠하리', …],
  gloss:  ['이렇게 산들 어떻고 저렇게 산들 어떠랴.', '_시골에 묻힌 못난 선비_가 …', …],
  words: { choya: { orig: '{草野愚生|초야우생}', gloss: '…', hint: '서당 마루에 앉은 사람을 찾아보세요', spot: { x: 0.81, y: 0.5, r: 0.07 } } },
  feet: ['이런[ㄷㆍㄹ]/엇더[ㅎㆍ]며/뎌런[ㄷㆍㄹ]/엇더[ㅎㆍ]료', '초야|우생이/이러타/엇더[ㅎㆍ]료', …],   // '/' 꼭 끊을 곳, '|' 채점 안 함
  cutLines: [0, 1, 2],
  ri: [ { do: 'voice', who: 'doctor', text: '…' },
        { do: 'card', kind: 'fiction', id: 'doctor', title: '의원은 지어낸 인물이에요', body: '…' },
        { do: 'choose', q: '…**종장**을 근거로 골라 보세요.', options: [
            { t: '"이 병은 내가 좋아서 든 것이니 약은 거두시오."', ok: true, why: '…**설의법**…' },
            { t: '"고칠 수 없는 병이니 약도 소용없소."', why: '…체념이 아니라 만족이에요. 헷갈리기 쉬운 곳이에요.' } ],
          after: { kind: 'note', title: '왜 하필 "병"이라고 했을까요?', body: '…' } },
        { do: 'batch', rows: [{ head, slots: [{ id, answer, label, pre }] }], pool: [{ id, text }], hint } ],
  mind: { options: [ { t: '자연 속 삶에 만족함', ok: true },
                     { t: '자연에 다다르지 못한 아쉬움', why: '2023 수능에서 **틀린 선지**였어요. …' } ] },
  summary: '…' }
```
- 표시 언어 파서는 `dosan-sipigok/js/core/text.js`에 있다. `T.parse`(루비, 시어 칸), `T.reading`(한글 읽기 + 옛한글 조합), `T.syllables`(**첫가끝 자모열을 한 음절로 묶음**), `T.feet`(음보 표기 → 끊을 자리 집합). 중세국어에서 음절 단위로 누르고 자르고 세는 상호작용에 바로 다시 쓸 수 있다.
- 오답 보기는 **리서치 문서의 오개념 목록과 기출 함정**에서 가져온다(`design/review/검토_결과.md` §3).

### 3-4. 판소리 한마당: 원문 자동 추출 + 카드 데이터

```js
// js/data/orig.js — 자동 생성: python tools/extract_orig.py. 손으로 고치지 마세요.
var ORIG_RAW = { "E01": { "title": "광한루 경치(적성가의 바탕)",
  "text": "광한누 셥젹 올나 사면을 살펴보니 경ᄀᆡ가 장니 조타\n젹셩 아침 날의 느진 안ᄀᆡ ᄯᅴ여 잇고 …",
  "where": "상권 · 추출 줄 50, 51",
  "url": "http://www.davincimap.co.kr/davBase/Source/davSource.jsp?Job=Body&SourID=SOUR001003&Lang=한글(고어)&Page=1&View=Text" } }
```
```js
// js/data/daemok.js
{ id: 'sarang', order: 4, name: '사랑가', jangdan: '진양조·중중모리', jo: '평조', mood: ['화평'], len: 2, ext: true, gyeok: 0, slots: 2,
  orig: 'E05', extOrig: 'E06', unlock: 1, about: '…', extNote: '…장면의 극대화…', deonum: '고수관의 더늠으로 … 전한다고 알려져 있다.' }
// js/data/notes.js — 사실 카드에는 반드시 src
facts: { root: { kind: 'note', title: '근원 설화', body: '…**어느 설화가 중심인지는 학자마다 달라요**.', src: '한국민족문화대백과사전 「춘향전」; 『신편 한국사』 35' } }
```
- 출처 사슬: 원문 사이트 → 리서치 문서(`design/research/02_마당별_대목_모티프.md`의 `#### E01` + `> **原文**` 블록 + `출처: <URL>`) → `extract_orig.py` → `orig.js`. 마지막으로 `tests/sim.test.mjs`의 "원문은 리서치 문서의 글자 그대로다" 테스트가 **orig.js의 모든 줄이 리서치 문서에 그대로 있는지** 검사한다.
- 성격 태그는 출처를 구분한다: `비장: '…(교과서 용어)'`, `애절: '…(게임에서 나눈 말)'`.

### 3-5. 사씨남정기: 호칭 표시와 사건 빈칸(`sassi-namjeonggi/js/data/story.js`)

```js
{ id: 'c_song', type: 'case', title: '백자당의 노래', scene: 'sc_pavilion',
  intro: '이 쪽은 먹이 번져 세 군데가 지워졌어요. …',
  spots: [ { x: 44, y: 44, label: '거문고 타는 여인', text: '…', words: ['교씨', '교 낭자'] }, … ],
  bank: ['매를 들자', '내쫓자'],      // 처음부터 있는 오답 낱말
  hard: ['두 부인', '꾸짖자'],        // 다시 읽기에서만 더하는 헷갈리는 낱말(정답이 될 수 없는 것만)
  lines: ['[사씨]가 음란한 노래를 부르는 [교씨]를 좋은 말로 [타이르자], 교씨는 도리어 원한을 품었다.'],
  blanks: { '사씨': { person: 'sassi' }, '교씨': { person: 'gyo' }, '타이르자': { word: '타이르자' } },
  evidence: { title: '노래 사건', short: '사씨의 훈계에 원한을 품고 헐뜯음' },
  explain: '사씨는 교씨를 벌하거나 내쫓지 않고 **좋은 말로 타이르기만** 했어요. …' }
// page 단계의 본문 표시: [호칭|인물] = 학생이 잇는 호칭, {호칭|인물} = 자동 표시
'{소사|yusosa}의 누이는 두씨 집안에 시집간 사람으로, … 집안에서는 그를 [두 부인|dubuin]이라 불렀다.'
// 이본 노트(notes.js)
variants: [ { title: '여승의 이름', body: '한문본 계열은 묘희(妙喜), 한글 경판본 계열은 묘혜(妙慧).' } ]
```
- 원문(퍼블릭 도메인)은 `hoemok`(한문본 12회 회목)에만 둔다: `{ han, read, gloss, note }`. 나머지 글은 "원작 줄거리를 오늘날 말로 새로 풀어 쓴 것"이고 파일 머리에 그렇게 밝힌다.
- 도움 사다리: 틀린 칸 표시 → 여백의 메모(힌트) → 정답 보기. 감점 없이 '도움 사용'으로만 기록한다(README).

### 3-6. 영웅의 길: 이야기 단계와 작품 카드(`hero-road/js/data/story.js`, `works.js`)

```js
{ id: 'c1-2', type: 'choice', who: 'narrator', q: '이 집안은 어떤 내력을 지닌 집안이오?', … }
{ when: { path: 'f' }, who: 'narrator', t: '딸이라! 그렇다면 … **여성 영웅소설**의 길을 따르겠소. …' }   // 조건부 대사
'옛날 중국 명나라 때, 서울에 {부}이라는 신하가 있었다.'   // {이름:을}처럼 받침에 맞춰 조사 바꿈
yu: { title: '유충렬전', han: '劉忠烈傳', seal: '原作', group: 'm',
      src: '참고: 한국민족문화대백과사전 「유충렬전」 · 『유충렬전』 1912 활자본 · 교과서(완판본) 본문과 대조 필요',
      stages: { 2: { t: '…**남악 형산**에 정성을 드리자 …', note: '청룡은 태몽 속 선관이 타고 온 것이고, 충렬의 천상 정체는 자미원 대장성이에요.' } } }
window.STAGES_SRC = '영웅의 일대기 7단계는 조동일, 「영웅소설 작품구조의 시대적 성격」(『동아문화』 10, 1971)의 정리를 따른 것이에요. … 모든 작품이 똑같이 따르는 설계도는 아니에요.'
```

### 3-7. 음운 해전: "채점의 진실"과 문구의 분리

```js
// js/data/sounds.js — 자질만 적는다(화면 이름 없음). 다음 편 게임이 가져다 쓰는 공용 데이터
['ㅎ', 'glottal', 'fricative', 'none'], // 교과서마다 세기 자리가 달라서 세기 없음으로 채점
// js/data/levels.js
1: { sea: 'consonant', level: 1, open: ['ㅂ','ㄷ','ㄱ','ㅈ','ㅅ','ㅁ','ㄴ','ㅇ','ㄹ'], strengthCards: false,
     show: { cellSounds: true, emptyCells: true, strengthSlots: true, lineNames: true, placeNames: true },
     highlight: true, help: { followAlong: true, example: true }, fleet: [2, 1, 1], turns: 8 /* 조정값 */ }
// js/data/text.js — 학년 키 m3·h1이 같은 구조, {n} 자리는 G.text.fill이 채움
terms: { m3: { place: { bilabial: '입술소리', … } }, h1: { … '입술소리·양순음' … } }
```
- `sori-haejeon/docs/contracts.md` ③에 데이터 파일마다의 약속을 표로 적었다. 데이터가 틀리면 `G.rules`가 **오류를 던진다**(조용히 넘어가지 않는다, 채점의 진실이므로).

### 3-8. 다섯 게임이 함께 쓰는 '표지' 체계(사실과 상상의 구분)

| 표지 | 뜻 | 쓰는 게임 |
|---|---|---|
| 붉은 낙관 `原文` / `原作` | 원문 그대로(한 글자도 바꾸지 않음) / 실제 작품 요약 | 관동·도산·판소리·사씨 / 영웅 |
| 한지 `풀이·해설` · 먹 `알아 두기` | 현대어 풀이, 교과서 수준 해설, 사실 카드(출처 포함) | 전부 |
| 청록 `게임 설정 · 虛` | 지어낸 인물·사건·수치. 처음 나올 때 "실제로는 →"(`real`)을 함께 보여 줌 | 전부 |
| 황토·갈색 `이본 노트` | 판본마다 다른 곳. **채점하지 않음** | 도산·사씨 |
| 쪽빛 `해석 · 채점하지 않아요` | 학설이 갈리는 곳 | 영웅·도산·판소리·사씨 |
| `전해지는 이야기` | 사실 여부가 불확실한 전승(명창 일화) | 판소리 |
| 實/虛 분류 활동 | 장 끝에 사실과 상상을 직접 가르기 | 관동 |

공통 규칙: **가짜 원문을 만들지 않는다**, **그림에 글자를 넣지 않는다**(가짜 현판 방지), **판정(정답)에는 모든 이본에 공통인 사실만 쓴다**(사씨 README, 사씨 검증노트 §2), **원작에 없는 전개(만약에 엔딩)를 학생이 수행하게 하지 않는다**(사씨, 원작 기억 오염 방지. 관동별곡의 '만약에 엔딩'은 원문 선택과 대비시키는 장치로만 둠).

---

## 4. 원문·옛한글 표기와 사실 확인 방법론

### 4-1. 옛한글 표기 방식 비교

| 방식 | 데이터에 적는 모양 | 화면 변환 | 장점 | 단점·한계 | 근거 |
|---|---|---|---|---|---|
| **A. 대괄호 호환 자모 표시** | `[ㅎㆍ]다`, `알[ㅍㆍㅣ]`, `[ㅅㄷㅗ]`(ᄯᅩ), `팔[ㅂㆍㅣㄱ]` | `G.yet(text)`: 현대 음절로 쓸 수 있으면 완성형, 아니면 첫가끝(U+1100 초성 / U+1160 중성 / U+11A8 종성) 자모열 | 사람이 키보드로 입력·검색·diff하기 쉽다. 원시 첫가끝 문자가 파일에 없다는 것을 검사할 수 있다 | 조합표에 없는 자모는 실패한다(`console.warn('옛한글 조합 실패')`). 관동별곡 규칙은 허용 중성이 "현대 모음, ㆍ, ㆍㅣ"뿐이라 **ㆌ(ᆔ)를 못 써서 '쥬·취'로 바꿨다**(검증노트 §5). 방점 미지원 | `gwandong-byeolgok/js/core/util.js` 29~86행, `dosan-sipigok/js/core/text.js` |
| **B. 첫가끝 문자를 그대로 저장** | `경ᄀᆡ가`, `ᄯᅴ여`, `ᄇᆡᆨ능` | 그대로 출력(글꼴의 조합 기능에 맡김) | 원문 사이트의 문자열을 **사람 손 없이** 옮길 수 있다(오탈자 방지) | 편집기에서 눈으로 보고 고치기 어렵다. 문자열 비교·검색·길이 계산이 까다롭다 | `pansori-hanmadang/js/data/orig.js`, `tools/extract_orig.py` |
| **C. 쓰지 않음** | — | — | — | 음운 해전은 의도적으로 금지(ADR 0010: 소리와 문자를 섞지 않음) | `sori-haejeon/docs/tracking/decisions/0010-phonology-only.md` |

**관동별곡 조합기(`G.yet`)의 실제 구성**(`gwandong-byeolgok/js/core/util.js`):
- 초성표 `L`: 현대 19자 + `ㅿ ㆁ ㆆ ㅸ(ㅂㅇ)` + 합용병서·각자병서 다수(`ㄴㄱ … ㅂㅅㄱ ㅂㅅㄷ ㅅㄱ ㅅㄷ ㅅㅂ ㅇㅇ` 등, U+1113~U+1147).
- 중성표 `V`: 현대 21자 + `ㆍ(U+119E) ㆍㅣ/ㆎ(U+11A1) ㆍㅓ ㆍㅜ ㆍㆍ ㅑㅗ ㅕㅣ`.
- 종성표 `T`: 현대 27자 + `ㅿ ㆁ ㆆ ㄹㆆ ㅁㅿ ㄹㅿ ㅅㄱ ㅅㄷ ㅂㅇ`.
- 호환 겹자모 풀기 `SPLIT`(`ㅺ → ㅅㄱ`, `ㅴ → ㅂㅅㄱ` …). 정규식 `/\[([^\]\[]{1,8})\]/g`.
- 한자 병기 제거: `G.stripHanja = text.replace(/\(([㐀-鿿豈-﫿·\s]+)\)/g, '')`.
- **글꼴 자동 선택 `G.pickYetFont()`**: 시험 문자열 `[ㅎㆍ][ㄷㆍ][ㅂㆍㄹ]`을 캔버스에서 재어, 세 음절 폭('가가가')과 비슷하고 대체 글꼴과 폭이 다르면 "조합된다"고 판단해 CSS 변수 `--yet`에 넣는다. 후보: 내장 글꼴 → 맑은 고딕 → Apple SD Gothic Neo → Noto CJK → 함초롬바탕 → 나눔명조 옛한글.

**옛한글 글꼴 만들기**(`gwandong-byeolgok/tools/build_yet_font.py`, `tools/yet_chars.js`, `dosan-sipigok/tools/build_fonts.py`):
- 원본: `notofonts/noto-cjk`의 `Serif/SubsetOTF/KR/NotoSerifKR-Regular.otf`(**옛한글 조합 기능 ljmo·vjmo·tjmo가 있는 판**). 저장소에는 올리지 않는다.
- 남기는 범위: 첫가끝 자모 U+1100~11FF, 확장 A U+A960~A97F, 확장 B U+D7B0~D7FF, 호환 자모 U+3130~318F, 기본 라틴·문장 부호 + 게임에 쓰인 글자. `layout_features = ['ccmp','ljmo','vjmo','tjmo','locl','kern','palt']`. 결과는 약 460KB. **자모 블록을 통째로 남기므로 새 옛한글 음절이 생겨도 조합된다.**
- 글자 모으기: `yet_chars.js`가 vm에서 데이터를 읽고 `G.yet(v)`·`G.yet(G.stripHanja(v))` 결과의 글자까지 모은다.

### 4-2. 원문 검증 노트의 구조(세 저장소 공통 골격)

| 절 | 관동별곡 `design/원문_검증노트.md` | 도산십이곡 `design/research/01_작품_사실확인.md` | 사씨남정기 `design/원작_검증노트.md` |
|---|---|---|---|
| 머리 | "결론부터": 무엇을 대조했고 무엇을 못 봤는지("교과서 원본·성주본 영인본은 직접 보지 못함, ★ 항목은 교과서와 대조 권장") | 확실도 기호 정의(◎ 1차 사료 일치 / ○ 자료 1개 / △ 판본마다 다름 → 기준 텍스트를 정해야 함 / ？ 미확인), 판본 약칭 | 검증 대상 파일, "이 문서는 보고서다. 데이터는 고치지 않았다", 판정 기호 ✅⚠️❌ |
| 1. 사용한 자료 | 자료 A~H 표(구분·자료·URL·쓴 곳). 위키문헌 판본 전사, 나무위키, EBS 교재, 교사 자료 PDF, 한국민족문화대백과, 디지털강릉문화대전 | §9 출처 목록: 1차 사료·판본 / 사전·공공기관 / 논문(KCI) / 기출·교육과정 / **"해설 블로그(참고만, 본문 출처로 쓰지 말 것)"** / 미확인·재확인 목록. 출처마다 신뢰도 메모 | 약호표(KOSTMA 한문본 해제, 논문의 원문 인용, 수능·학평 지문, 백과사전, 국립한글박물관 웹진) + "확인하지 못한 것" |
| 2. 방침 | 따른 판본(교과서·EBS 통용 본문 우선, 이선본 전사는 독립 대조본), 한자 독음은 편집 관례, 옛한글 입력 규칙, 문장부호 없음 | 판본별 표기 결정(목판본 판독 우선, 판독 불확실 글자는 교재 통용형) | 판정은 이본 공통 사실만, 서술은 한문본 계열 가능, 지어낸 세부 금지, 대사는 새로 써도 되지만 말한 사람·때·요지는 맞출 것, 회목은 한 글자씩 프로그램 대조 |
| 3. 대조 방법 | 옛한글 표시를 실제 옛한글로 바꾸고 한자·띄어쓰기·문장부호를 지운 뒤 **Python `difflib`로 글자 단위 비교** → B와 99.6%, A와 98.5% 일치. 한자만 뽑아 551자 대 550자 비교. 4음보 한 행씩 146행(백과사전의 이선본 146행과 대조) | 장서각 목판본(D6B-46) 공개 이미지 6장을 **직접 확대 판독**, 800×600이라 획 가는 글자는 △ | 회목 원문을 KOSTMA 해제와 프로그램으로 한 글자씩 대조 |
| 4. 차이표 | 행 번호 · 채택 · 다른 표기(자료) · 채택 근거, ★ = 교과서 대조 필요(예: 133행 '내려와셔' ↔ '내텨와셔', 뜻이 달라지는 차이) | 0-2 "자료끼리 어긋나는 것" 표: 항목 · 목판본 · 다른 자료 · **게임 권장**(예: 4곡 白雲 ◎ / 청구영언 白雪 → 이본 노트) | 항목별 판정(장별 문장, 빈칸 정답, 회목, 호칭, 관계선, 이본 노트) |
| 5. 해석 | 해석이 갈리는 곳과 선택(채점에서 빼는 방법 포함) | 출제 이력, 해설서가 퍼뜨리는 오류(예: "도산서원을 세우고 지었다" ✕), **학생 오개념 36개** | "고칠 문장 제안: 현재 → 제안"(❌ 9건, ⚠️ 31건) |
| 6. 못 한 것 | "확인하지 못해 뺀 정보"(예: 홍만종 평 — 교차 확인 실패로 데이터에서 제외) | 9-6 재확인 목록 | §7 이번에 확인하지 못한 것 |

### 4-3. 공통 사실 확인 원칙(방법론 요약)

1. **판본 계열을 둘 이상 독립적으로 대조한다**(판본 전사 vs 교과서·EBS 계열). 차이는 행 단위로 모두 적는다.
2. **교과서 통용형을 기본으로 하고, 판본 차이는 '이본 노트'로 보여 주되 채점하지 않는다.** 선생님에게 "쓰시는 교과서와 한 번 대조해 주세요"라고 README와 노트에 적는다.
3. **확실도를 항목마다 표시한다**. 확실하지 않은 것은 데이터에 넣지 않거나 일반적인 표현으로 낮춘다(영웅의 길 README '알려진 한계': '추정' 항목은 카드에 넣지 않음).
4. **1차 사료 > 공공기관 사전·KCI 논문 > 기출 지문 > 교사 자료 > 블로그** 순으로 믿는다. 블로그는 "참고만"이고 오류 사례로도 기록한다.
5. **원문 인용은 짧게**(영웅의 길: 15자 이내). 번역서·시험 지문의 문장은 쓰지 않고 새로 풀어 쓴다(사씨).
6. **기계 대조를 쓴다**: difflib(관동), 회목 프로그램 대조(사씨), "원문 = 리서치 문서 글자" 테스트(판소리), 퀴즈 선택지의 원문 인용이 원문과 글자까지 같은지 검사(관동 검증노트 §9).
7. **AI QA는 문학 사실 검증이 아니라는 점을 밝힌다**: "외부 문헌을 열지 않았으므로 문학 사실의 독립적인 원전 대조도 미검증이다"(`hero-road/design/qa/QA_보고서_codex.md` §2).

---

## 5. 테스트·QA·플레이테스트 체계

### 5-1. 층별 정리

| 층 | 무엇을 | 도구 | 대표 파일 |
|---|---|---|---|
| ① 데이터 린트(브라우저 없음, 수 초) | 단계 id 중복, 알려진 단계 종류, 참조 무결성(관습·작품·인물·적·그림 파일), 이름 자리 `{…}`·조사 표시, 갈래마다 끝까지 갈 수 있는지, 괄호·따옴표 짝, 빈칸 정답 낱말을 게임 안에서 주울 수 있는지, 관계선이 다른 얼굴을 지나가지 않는지 | Node `vm` + 직접 만든 `check()`/`problems[]` | `hero-road/tests/content.mjs`, `sassi-namjeonggi/tests/content.mjs` |
| ② 규칙·엔진 단위 시험 | 모든 조합의 채점(1,366건), 신호 규칙 사례, 무작위 배치의 막다른 상태 없음 / 결정성("같은 짜기면 결과가 늘 같다"), 이면 맞음·억지 | Node `vm`, `node:assert/strict` | `sori-haejeon/tests/check-rules.mjs`, `pansori-hanmadang/tests/sim.test.mjs` |
| ③ 문구·표기 점검 | 금지 낱말(데이터 + 파일 전체 + 실제 화면 글), 빗금 표기, 한 줄 30자, 학년 키 구조 동일, 풀이 예시의 기대 신호 | Node + 브라우저 | `sori-haejeon/tests/check-text.mjs`, `check-screen-text.mjs` |
| ④ 원문 출처 점검 | orig.js의 모든 줄이 리서치 문서에 그대로 있는지 | Node | `pansori-hanmadang/tests/sim.test.mjs` 마지막 시험 |
| ⑤ 저장 점검 | 저장 → 복원 동일, 망가진 값, 다른 버전, 막힌 저장소, 기록 지우기 범위, 한 판 한 번 | Node + 흉내 낸 저장소 | `sori-haejeon/tests/check-save.mjs`, `hero-road/tests/resume.mjs`(QA-001 재발 방지) |
| ⑥ 학생처럼 끝까지(E2E) | 선생님 단추 없이 처음부터 결과·이미지 저장까지, **일부러 한 번 틀리기**, 중간 새로고침 → 이어 하기, 메뉴·설정, 화면 크기별 | Playwright `chromium.launch({ channel: 'chrome', headless: true })`(설치된 크롬, 브라우저 내려받기 없음) / 음운 해전은 aside | `dosan-sipigok/tests/student.mjs`, `sassi-namjeonggi/tests/full.mjs`(987줄), `hero-road/tests/e2e.mjs m|fa|fb|fc`, `sori-haejeon/tests/check-play.mjs` |
| ⑦ 화면 크기·터치 | 칠판 1920×1080, 태블릿 1280×800, 노트북 1366×768, 휴대폰 390×844·360×740, 눕힌 휴대폰 844×390. 터치 목표 크기, 가로 스크롤 없음, 휴대폰에서 스크롤 없이 한 발 | aside + `tests/pages/frame.html?w=390&h=844&src=index.html` iframe / Playwright `isMobile·hasTouch` | `sori-haejeon/tests/check-shots.mjs`, `sassi-namjeonggi/tests/measure.mjs` |
| ⑧ file:// | 더블클릭으로 열어도 시작·저장이 되는지 | Playwright | `hero-road/tests/file.mjs` |
| ⑨ 소리 | 곡 마디·음량(LUFS/RMS)·클리핑·이음새·장면별 곡 바뀜 | ffmpeg / Playwright | `*/tests/audio.mjs`, `dosan-sipigok/tests/bgm.mjs` |
| ⑩ 밸런스 시뮬레이션 | 전략별(균형·벌이만·명성만·비속 재담·무작위) 여섯 판 결과로 칭호 기준선이 네 칸으로 갈리는지. `--K.FIT=1`처럼 가중치를 바꿔 실험 / 능력치 배분별 턴 수·천우신조 비율 | Node(시드 고정 LCG) | `pansori-hanmadang/tools/sim-balance.mjs`, `hero-road/tests/balance.mjs` |
| ⑪ AI 실입력 플레이테스트 | 경로별 완주, 이슈 표(ID·심각도·분류·위치·재현·기대·실제·스크린샷·추정 원인 파일:줄), FPS, 글 수집, 교육 피드백 | Codex + Playwright 봇 | `hero-road/design/qa/QA_보고서_codex.md` + `tests/codex-qa/`, `pansori-hanmadang/design/playtest/` + `tests/codex/` |
| ⑫ 학생 시점 검토 | 대본 추출 → 정답표 분리 → 블라인드 풀이 에이전트(성적대별) → 디자이너 검토 → 고치고 다시 풂 | `tools/student_view.js` + 에이전트 | `dosan-sipigok/design/review/*`, `sori-haejeon/tests/review/학생검토.md`(aside exec) |
| ⑬ 디자인 검수 | 캡처 이미지만 보고 '높음' 지적이 없어질 때까지 반복(1회 높음 3 → … → 4회 0) | Codex CLI(`codex exec -m gpt-6.1-sol`) | `sori-haejeon/design/review-3.md` |

**두 계열의 브라우저 점검 도구**
- **aside 계열(음운 해전)**: 선생님이 지정했다(ADR 0003). npm 의존이 없다. 대신 aside의 성질에 맞춘 규칙이 많다. 종료 코드가 늘 0이라 출력의 `PASS`/`FAIL`로 판정하고, 콘솔 이벤트가 오지 않아 게임이 `window.__soriErrors`에 오류를 모은다(그래서 **게임 코드의 `console.error`는 곧 점검 실패**). 화면 크기를 바꿀 수 없어 iframe 틀을 쓰고, 호출 120초·evaluate 30초 제한 때문에 대본을 조각낸다. 전체 점검에 약 30분 걸린다. 근거: `sori-haejeon/tests/aside.mjs` 머리 주석, `docs/engineering-notes.md`
- **Playwright 계열(나머지 4개)**: `tests/package.json`에 `playwright` devDependency. `channel: 'chrome'`으로 설치된 크롬을 쓴다. `tests/serve.mjs`가 빈 포트에 정적 서버를 띄우고 `BASE` 환경 변수로 배포 주소도 점검한다. 근거: `hero-road/tests/serve.mjs`, `dosan-sipigok/tests/student.mjs`

**점검용 통로(게임 화면에 드러내지 않음)**: `G.practice.debug()`, `G.duel.config`, `data-screen` 속성, SVG `data-*` 상태(음운 해전), `G.world.test.complete`(영웅의 길). 이름을 바꾸면 tests도 함께 고친다(`sori-haejeon/js/game/AGENTS.md`).

### 5-2. AI 플레이테스트 지시서의 구조(`pansori-hanmadang/design/playtest/CODEX_TASK.md`, 36줄)

```
# Codex 플레이테스트 과제 (1차)
역할: 플레이테스터이자 개발자. 끝까지 플레이 → 보고서 → 코드 수정 → 커밋
## 게임      — 무엇인지, 먼저 읽을 문서(README, 설계서), 코드 위치
## 환경      — git worktree 브랜치(codex/playtest-1), push 금지, 서빙 주소, Playwright·설치된 크롬, 참고할 기존 시험, ?fast=1 등
## 할 일
 1. 직접 플레이: 스크립트를 tests/codex/에 쓰고 최소 2회 완주
    - 휴대폰 390×844 '꼼꼼한 학생' / PC 1366×860 '서두르는 학생'(억지 선택·아무 즉흥)
    - 화면마다 스크린샷을 찍고 이미지를 직접 열어 판단: 글자 겹침·잘림, 버튼 크기, 흐름, 피드백 이해도,
      학습 목표가 플레이로 드러나는지, 맞춤법, 콘솔 오류, 45분 분량
 2. 보고서: P0 버그 / P1 학습·사용성 / P2 다듬기, 각 항목에 근거(스크린샷·재현 순서)와 고칠 방향
 3. 고치기: P0·P1 전부, P2는 쉬운 것. 작은 단위 커밋(한국어 메시지)
 4. 확인: 단위 시험, 밸런스 시뮬레이터(칭호 4분할 유지, 수치 바꾸면 결과표 첨부), e2e phone/desktop 등 모두 'no errors'
 5. 보고서 끝에 "고친 것 / 남은 것", 마지막 커밋
## 지켜야 할 것
 - 원문 orig.js는 한 글자도 바꾸지 마라(시험이 검사)
 - 사실을 지어내지 마라. 새 사실 문장은 design/research/에 근거가 있어야 함. 지어낸 것은 '게임 설정' 표시
 - 점수 엔진은 결정적, 소리 파일은 건드리지 말 것(다른 작업 중), 그림 생성·외부 내려받기·push·새 npm 금지
 - 빌드 없음, 휴대폰 세로 기준, 1시간 30분 안쪽
```
결과물: `design/playtest/codex_playtest_1.md`(P0-01 도입 재접속 모티프 누락, P0-02 실제 공연과 '나의 춘향가' 기록 불일치 등. 각 항목에 재현 → 영향 → 근거(evidence/ 링크) → 원인 → 수정 → 확인), `design/playtest/evidence/{before,after}-regressions.json`, `balance.log`, `verification.json`, 재현 방법 `tests/codex/README.md`(`regressions.mjs before 76b73db`처럼 **최초 커밋의 JS/CSS를 시험 브라우저에만 제공해 수정 전 문제를 재현**).

영웅의 길 QA(`hero-road/design/qa/QA_보고서_codex.md`)의 방법상 특징:
- "장 바로가기·선생님 모드·강제 승리·상태 변경 함수 사용 안 함"을 명시한다. 이동은 충돌 상자 기반 8px BFS 길찾기 + 실제 방향키·CDP 터치 끌기로 한다.
- 화면 붉은 픽셀로 공격 예고를 감지해 피한다. 55분 전체 제한, 90초 무진행·5초 제자리 감지를 둔다.
- **기존 파일 330개의 SHA-256을 검사 전후로 비교해 게임 파일 무변경을 증명**한다.
- 장별 시간·선택·전투 24건 표, rAF 간격으로 잰 FPS 표, DOM 글 수집(중복 제거 행 수·미치환 `{…}` 0)을 남긴다.
- 한계를 따로 적는다(실기기·Safari·청취·문학 사실 원전 대조는 미검증).

### 5-3. 학생 시점 검토 파이프라인(도산십이곡, 가장 체계적)

1. `node tools/student_view.js` → `design/review/student_view.md`(정답 없음)와 `answer_key.md`. **게임과 같은 섞기 함수·시드(`G.util.shuffleNot`)로 보기 순서를 재현**하고, 옛한글을 조합하고, 루비를 `漢字(한글)`로 펼친다.
2. 블라인드 풀이 에이전트(정답표·js·기획서·research 열람 금지): A = 국어 3~4등급 고1, B = 6~7등급 고1(수정 전), C = 보통 고1(1차 수정 후). 문항별 표: 내 답 · 확신 · **어떻게 풀었나(원문·풀이에 바로 나옴 / 보기 소거 / 조금 추론)** · 걸린 느낌 · 한 줄 속마음.
3. 게임 디자이너 겸 플레이테스트 진행자 역할 검토(`designer.md`): 휴대폰 스크린샷 59장 + 코드를 본다. **기준 시점(스크린샷·대본 생성 시각 vs 코드 수정 시각)을 명시**하고 "이미 반영된 것"을 분리한다.
4. 종합 `검토_결과.md`: 찾은 것 → 고친 것(문항, 재미, 시간) → 다시 풀기 결과(A '바로 나옴' 29 → C 20, '보기 소거' 11 → 0) → 남은 한계.
- 핵심 통찰: **"답이 이미 화면에 있다"를 정량화**했다. 풀이 줄의 밑줄과 카드 풀이가 같아 글자 맞추기가 되거나, 원문 띄어쓰기가 음보 정답(혹은 함정)이 되는 식이다. 이 지표는 중세국어 문법 문항(어미·조사 분석)에도 그대로 쓸 수 있다.

음운 해전의 학생 검토(`sori-haejeon/tests/review/학생검토.md`): 전체 자동 점검 통과 뒤 `aside exec` 에이전트에게 "처음 보는 중3, 규칙 설명 없음, 개발자 도구·소스 금지"로 네 판을 시킨다. 판별 결과표 + 헷갈린 곳 / 막힌 곳 / 설명이 없어 모른 것 / 너무 긴 문구 / 휴대폰 불편으로 정리한다. 제안은 반영한 것과 선생님 결정을 기다리는 것으로 나눠 `docs/tracking/status.md`에 남긴다.

---

## 6. 음운 해전의 AGENTS.md / CLAUDE.md / docs 체계 — 재사용 템플릿

### 6-1. 체계의 구성과 역할

| 파일 | 역할 | 크기 |
|---|---|---|
| `CLAUDE.md` = `AGENTS.md` | 같은 내용 두 벌(Claude Code·Codex 둘 다 읽게). 한 문단 소개 → 프로젝트 구조 트리(파일마다 한 줄 설명) → **꼭 지킬 것 5개** → **작업 전에 읽을 것**(작업 종류별 문서 지정) → **문제가 생기면**(곧바로 선생님께 알릴 것 목록 / 나머지는 findings.md에) | 56줄 |
| `js/core/AGENTS.md`, `js/data/AGENTS.md`, `js/game/AGENTS.md`, `tools/AGENTS.md` | 층마다 같은 5절: **맡는 것 / 맡지 않는 것(건드리지 말 것) / 불변 조건 / 구현 방식 / 점검** | 각 30~50줄 |
| `docs/architecture.md` | 전체 모양, 불러오는 순서, 모듈 지도 표(층·모듈·역할·기대는 것), 대표 흐름(한 발이 흐르는 길 1~6단계), 화면 전환, 배치 기준, 바깥 의존, 점검 구성 | 73줄 |
| `docs/business-rules.md` | 도메인 규칙(용어 정의, 채점·신호·턴·승패) | 179줄 |
| `docs/contracts.md` | 바깥과의 약속 셋: ① 주소, ② 기기에 남는 저장 값(이름·모양·옛 값을 만나면), ③ 선생님이 고치는 데이터 파일 형식 | 40줄 |
| `docs/standards.md` | "어기면 점검이 실패하거나 화면이 깨지거나 선생님이 뺀 내용이 되살아나는 규칙만": 내용·표기 / 모듈 경계 / 불러오기·등록 / 오류 처리 / 화면 표현 / 점검 관문 / 커밋·저장소. 규칙마다 **위반 판정: 어느 점검이 실패하는지** | 62줄 |
| `docs/engineering-notes.md` | 겪어 본 함정: 증상 → 원인 → 대응 → 확인 방법. 반복 작업 순서(문구 고치기, 조정값, 규칙 고치기, 배포 점검) | 74줄 |
| `docs/operations.md` | 준비물 표(무엇·언제 필요·확인 명령), 게임 열기, 점검 명령·환경 값 표, 내용·조정값 고치기 표(고칠 것·파일·뒤따를 일), 글꼴·그림·음원 다시 만들기, 배포 명령 | 96줄 |
| `docs/security.md` | 개인정보(받지 않음, 입력 칸 없음), 네트워크(보내지 않음, 외부 CDN 금지 — 학교망 차단·제3자 접속 기록), 권한 모델(없음), 기기에 남는 것 표(이름·내용·민감도·지우는 방법), 출처 표기 의무, 배포 계정 | 42줄 |
| `docs/tracking/status.md` | 기준일·커밋. 된 것(부분·상태·**근거 = 어느 점검**) / 남은 것(순서대로) / 막힌 것 | 38줄 |
| `docs/tracking/findings.md` | 아직 못 푼 문제: **무엇이 / 왜 중요한가 / 왜 지금 못 푸나 / 방법 후보** | 35줄 |
| `docs/tracking/decisions/NNNN-*.md` + `index.md` | ADR 12건. 각 13~16줄: **배경 / 결정 / 버린 것 / 결과** | — |

이 체계의 핵심 장치:
- **"선생님 결정"을 되돌리지 못하게 막는다.** standards.md에 "만들지 않는 것(선생님이 뺀 것, 앞으로도 되살리지 않음)"과 "지금 범위 밖인 것(요청하면 그때 만든다, 먼저 만들어 두지 않음)"을 나눠 둔다. ADR의 '버린 것' 절이 근거를 남긴다. 에이전트가 '개선'이라며 뺀 기능을 되살리는 것을 막는다.
- **규칙마다 그 규칙을 지키는 점검을 붙인다**("위반 판정: `check-text`·`check-screen-text`가 실패한다").
- **에스컬레이션 목록**(곧바로 선생님께 알릴 것)과 **findings.md**(이번에 못 푸는 것)로 나눈다.
- **함정 기록은 증상부터 쓴다**("aside는 점검이 실패해도 0으로 끝난다. 증상: … 대응: … 확인: 일부러 틀린 조건을 넣어 FAIL로 뜨는지 본다").
- 원격 작업(push·저장소 생성·Pages)과 외부 파일 내려받기는 선생님 승인 사항이다.

### 6-2. 새 저장소용 템플릿

> 아래는 음운 해전 문서의 골격을 중세국어 게임에 맞게 바꾼 초안이다. `<…>`는 채울 자리다.

**① `CLAUDE.md` / `AGENTS.md`(두 파일 같은 내용)**
```markdown
# <게임 이름>

<학년·과목·성취기준>의 **<학습 대상: 예) 중세국어의 표기·음운·문법(15세기 국어)>**을 배우는 교실용 정적 웹 게임이다.
<게임 뼈대 한 문장>. 고등학교 국어 교사 한 명이 만들어 수업에서 쓰는 국어 게임 시리즈의 한 편이다.
서버·계정·빌드 도구가 없다. 일반 `<script>` + 전역 `window.G` 하나로 `index.html` 더블클릭과 GitHub Pages 둘 다에서 돈다.
기록은 기기 브라우저(localStorage)에만 남는다. 기기: <전자칠판 / 태블릿 / 휴대폰 세로>.

## 프로젝트 구조
(트리 — 파일마다 한 줄 설명. §8-3 참고)

## 꼭 지킬 것(요약 — 전체 규칙은 docs/standards.md)
1. **원문은 한 글자도 바꾸지 않는다.** 원문은 `js/data/orig.js`(자동 생성)에만 있고, 그 근거는 `design/research/<원문 자료>.md`다. 손으로 고치지 않는다.
2. **옛한글은 데이터에 `[초성중성종성]` 표시로만 적는다**(원시 첫가끝 자모 금지 — orig.js 예외). 화면 표시는 `G.yet`만 거친다. 방점은 <표기 규칙>.
3. **채점·판정은 `G.rules`(순수 함수)만 정한다.** 판정에는 판본 공통 사실만 쓰고, 판본 차이는 '이본 노트'로 보여 주되 채점하지 않는다.
4. **사실을 지어내지 않는다.** 새 사실 문장은 `design/research/`에 근거가 있어야 하고, 지어낸 것은 `게임 설정 · 虛`로 표시한다.
5. **네트워크로 아무것도 보내지 않고 인터넷에서 아무것도 불러오지 않는다**(글꼴·그림·음원 모두 동봉).
6. **`cd tests && npm test`가 0으로 끝나야 한다.**

## 작업 전에 읽을 것
- 늘: `docs/standards.md`, `docs/engineering-notes.md`, 고칠 곳의 `js/*/AGENTS.md`.
- 원문·옛한글을 건드리기 전: `design/원문_검증노트.md`, `docs/contracts.md` ③, 고친 뒤 `npm test -- orig yet font`.
- 문구를 고치기 전: `docs/standards.md` 표기 규칙. 새 글자가 생기면 `python tools/build_fonts.py`.
- 저장 모양을 바꾸기 전: `docs/contracts.md` ②(교실 기기에 이미 저장된 진행이 있다).

## 문제가 생기면
- **곧바로 선생님께 알릴 것**: 원문이 출처와 어긋남 · 옛한글이 풀어져 보임(조합 실패) · 판정이 교과서 체계와 어긋남 · 외부로 데이터를 보내거나 불러오는 코드가 생김 · 진행 기록이 사라지거나 두 번 더해짐 · 점검 도구가 응답하지 않음.
- 그 밖에 이번에 못 푸는 문제는 `docs/tracking/findings.md`에 "무엇이 · 왜 중요한가 · 왜 지금 못 푸나 · 방법 후보"로 적는다.
```

**② 층별 `js/<층>/AGENTS.md`**
```markdown
# js/<층> — <한 줄 역할>
## 맡는 것
- `<파일>`(`G.<이름>`): <역할>. **<핵심 성질: 예) 순수 함수만>**
## 맡지 않는 것(건드리지 말 것)
- <다른 층이 맡는 것과 그 위치>
## 불변 조건
- <깨지면 안 되는 성질 — 점검이 검사하는 것>
## 구현 방식
- <데이터 모양의 기준 위치(머리 주석), 이름 관례, 난수 시드, 오류 처리>
## 점검
- `node tests/check-<이름>.mjs`: <무엇을 확인하는지>
```

**③ `docs/standards.md` 항목 꼴**
```markdown
- **<규칙 한 줄>**. <예외>. 위반 판정: `<점검 파일>`이 실패한다.
## 만들지 않는 것(선생님이 뺀 것 — 앞으로도 되살리지 않음)
## 지금 범위 밖인 것(선생님이 요청하면 그때 만든다 — 먼저 만들어 두지 않음)
## 점검 관문
- 커밋 전: 고친 곳의 점검, 병합·배포 전: 전체 0 종료. 새 규칙·기능에는 점검을 더한다.
## 커밋·저장소
- 커밋 메시지는 한국어로 무엇을 왜. 원격 작업·외부 파일 내려받기는 선생님 확인 뒤.
```

**④ ADR `docs/tracking/decisions/NNNN-<이름>.md`**
```markdown
# NNNN <결정 한 줄>
## 배경
<무엇이 후보였고 선생님이 무엇이라고 했는지(인용)>
## 결정
<한 문단>
## 버린 것
- <대안>: <버린 까닭>
## 결과
<이 결정 때문에 생긴 규칙·점검·한계>
```
새 게임 첫 ADR 후보: 0001 일반 스크립트 + 전역 G(시리즈 공통, sori 0002 계승) / 0002 브라우저 점검 도구(Playwright vs aside) / 0003 옛한글 데이터 표기(대괄호 표시 + 자동 추출 원문) / 0004 원문 판본 선택(<예: 훈민정음 언해본 계열 · 교과서 통용형>) / 0005 방점 표시 정책(보임/숨김/선택) / 0006 판정에는 공통 사실만 / 0007 선생님용 기능 범위.

**⑤ `docs/contracts.md` 꼴**: ① 주소(진입점, 쿼리 값을 읽는지 여부, 상대 경로) / ② 저장 값 표(이름 · 모양 · 옛 값·망가진 값을 만나면) + 버전 올리는 규칙 / ③ 데이터 파일 표(파일·전역 · 약속) + "잘못된 데이터를 만나면 오류를 던진다".

**⑥ `docs/tracking/status.md` 꼴**: 기준일·커밋 → 된 것 표(부분 · 상태 · 근거 = 점검 이름) → 남은 것(순서대로, 사람이 확인할 것 포함) → 막힌 것.

**⑦ `docs/tracking/findings.md` 꼴**: `## <문제 제목>` + 무엇이 / 왜 중요한가 / 왜 지금 못 푸나 / 방법 후보.

---

## 7. 모바일·접근성·성능 원칙

### 7-1. 모바일·터치

| 원칙 | 구현 | 근거 |
|---|---|---|
| 기준 화면은 **휴대폰 세로**(판소리·도산·사씨). 캔버스 액션은 가로 고정(관동) | 관동: 세로면 "가로로 돌려 주세요" 덮개 + 게임 멈춤, 첫 메뉴 탭에서 `requestFullscreen` + `screen.orientation.lock('landscape')`. 아이폰은 홈 화면 추가로만 전체 화면. 카카오톡 등 인앱 브라우저를 감지해 '다른 브라우저로 열기' 안내 | `gwandong-byeolgok/js/main.js` `G.screen`, README |
| 배치 기준은 하나의 미디어 쿼리 | 세로 = `(max-width: 760px), (orientation: portrait)`, 낮은 가로 = `(orientation: landscape) and (max-height: 500px)`. **이 값이 JS 4곳·CSS 4곳에 흩어져 있어 함께 바꿔야 한다는 점을 문서화** | `sori-haejeon/docs/engineering-notes.md` §세로 배치 기준 |
| 터치 목표 크기 | 가로 64px, 휴대폰 세로 48px, 발사 단추 56px 이상. 가로 스크롤 없음. 휴대폰에서 스크롤 없이 한 발 → `check-shots`가 잰다 | `sori-haejeon/docs/standards.md` §화면 표현 |
| 여러 손가락 동시 입력 | `pointerId`별로 따로 받는다. 문서 전체 `preventDefault` 금지 | 같은 곳 |
| 가상 조이스틱·노란 상호작용 단추 | 화면 왼쪽 끌기, 가까이 가면 뜨는 단추, 가장자리 화살표 | `hero-road/README.md` |
| 손가락 오차 보정 | 음보 끊기에서 틈 대신 **글자를 눌러도** 그 뒤가 끊김 | `dosan-sipigok/design/review/검토_결과.md` |
| 안전 영역 | `viewport-fit=cover` + `#safe` 영역 측정(노치) | `gwandong-byeolgok/index.html`, `js/main.js` |
| 소리 | 첫 pointerdown/keydown/touchend 뒤에 켬(자동 재생 정책). 다른 탭으로 가면 멈춤 | `sori-haejeon/docs/engineering-notes.md`, 사씨 README |
| 교실 운영 장치 | '병풍 접기'(화면 덮고 소리 멈춤 — "화면 접으세요" 한마디로 반 전체 멈춤), 2부 단추 3시간 뒤 공개(인출 간격), 결과 화면 캡처·이미지 저장 제출 | `dosan-sipigok/README.md` 선생님용 |

### 7-2. 접근성

| 원칙 | 구현 | 근거 |
|---|---|---|
| 색만으로 구분하지 않기 | 신호는 색 + SVG 기호(과녁·↔·↕·×·∅), 글꼴 기호에 기대지 않음. 색각 이상 학생 대응 | `sori-haejeon/README.md` §신호, `js/core/util.js` `glyph()` |
| 색 역할 분리·명암비 | 토큰만 사용(팀 색 / 신호 색 / 강조 색 섞지 않음), 맞히지 않은 글자를 흐리게 하지 않음(명암비 4.5 이상) | `sori-haejeon/docs/standards.md` |
| 움직임 줄이기 | 설정 + `prefers-reduced-motion` → 애니메이션 대신 정지 그림. 연출은 한 번(0.2초 안팎)하고 멈춤, 반복 깜박임·흔들림 금지 | `sori-haejeon/js/core/util.js` `reducedMotion()`(음운 해전 10곳, 나머지 각 1곳) |
| 글자 크기 배율 | 저장 필드 `font`, '아주 크게'까지. 판소리 P1-01: 큰 글자에서 원문이 청중 막대를 가리던 것을 문서 흐름 배치로 고침 | `*/js/core/save.js`, `pansori-hanmadang/design/playtest/codex_playtest_1.md` |
| 키보드 | 모든 조작에 키 대응. Enter 진행은 포커스가 다른 단추에 없을 때만(`enterFree`). 윈도 고정 키(Shift 5회) 함정을 피해 키 배치 | `sassi-namjeonggi/js/game/steps.js`, `gwandong-byeolgok/README.md` |
| aria | 음운 해전 62곳(숨긴 단계에서는 aria-label에도 답이 새지 않게 점검), 사씨 role 25곳. 캔버스는 `aria-label="게임 화면"`뿐(관동) | grep 결과 |
| 숨긴 정보 누설 금지 | 숨긴 단계의 답이 **글·DOM 속성·클래스·aria-label·title** 어디에도 없어야 함 → `check-board`가 DOM 전체 문자열을 뒤짐 | `sori-haejeon/js/game/AGENTS.md` 불변 조건 |
| 읽을 시간 | 판소리 P1-02: 원문 흐름에 '멈춰 읽기', '원문·풀이 읽기', '지난 반응 다시 보기'를 추가하고 열람 중에는 진행을 멈춤 | `pansori-hanmadang/design/playtest/codex_playtest_1.md` |
| 문구 길이 | 판 화면 설명은 한 줄 자리 하나, 약 30자, 넘치면 15px까지 줄이고 말줄임. 여러 줄 안내는 학생이 여는 '게임 방법' 창에만 | `sori-haejeon/docs/standards.md`, ADR 0012 |
| **반례(따라 하지 말 것)** | 관동별곡 `maximum-scale=1, user-scalable=no`(확대 막음), Google Fonts CDN 의존(학교망 차단 시 깨짐·제3자 접속 기록) | `gwandong-byeolgok/index.html` |

### 7-3. 성능

| 원칙 | 구현 | 근거 |
|---|---|---|
| 부분 글꼴 | 게임 글자만 남김(본문 232~852KB). 옛한글 글꼴은 자모 블록을 통째로 남겨 약 460KB | §4-1, `du` 결과 |
| 곡은 쓸 때 받기 | 장에 들어갈 때 그 곡만 받음(곡당 0.6~1.2MB, 모노 64~96kbps), 풀어 둔 배경 음악은 2곡까지만 유지(저사양 칠판 메모리), 효과음 0.4초 넘게 늦으면 건너뜀 | 사씨 README, `sori-haejeon/js/core/AGENTS.md` |
| 캔버스 | 정수 배율 확대, `devicePixelRatio` 최대 3(관동) 또는 2(도산), 고정 시간 간격 루프. 도산 번짐은 `drawImage`만 써서 픽셀을 읽지 않음(file://에서도 동작) | `gwandong-byeolgok/js/main.js`, `dosan-sipigok/js/core/scene.js` |
| 측정 | AI QA가 rAF 간격으로 FPS를 잼(58~60fps, 95백분위 16.8ms). 실기기(저사양 안드로이드 칠판) 확인은 사람 몫으로 status.md에 남김 | `hero-road/design/qa/QA_보고서_codex.md` §5, `sori-haejeon/docs/tracking/status.md` |
| 조정값 노출 | 입자 수 `MOUTH.PARTICLES`, 제한 턴 `LEVELS.turns`, 보스 hp를 데이터 파일에 '조정값'으로 표시 → 교실에서 보고 고침 | `sori-haejeon/js/data/AGENTS.md` |
| 캐시 무효화 | 관동은 `?v=15` 쿼리로 스크립트를 무효화, og 이미지는 `?v=2`. 서비스 워커가 없어 오프라인 캐시는 없음 | `gwandong-byeolgok/index.html` |
| 용량 | 저장소 21~63MB(그림이 대부분). 원본 그림·원음은 git 제외 | `du` 결과, `.gitignore` |

---

## 8. 새 중세국어 게임 저장소 권고

### 8-1. 그대로 가져올 것

| # | 가져올 것 | 출처 | 중세국어 게임에서의 쓰임 |
|---|---|---|---|
| 1 | 빌드 없는 일반 스크립트 + `window.G` + `data/core/game` 3층 + `index.html` 등록 순서 주석(`<!-- scripts:start (순서: util → data → core → game → main) -->`) | `sori-haejeon/index.html`, ADR 0002 | 시리즈 일관성, 선생님 직접 수정, file:// 실행 |
| 2 | 음운 해전 문서 체계 전부(CLAUDE/AGENTS, 층별 AGENTS, docs 7종, tracking, ADR) | §6 | 에이전트 협업 규칙, 선생님 결정 보존 |
| 3 | **옛한글 조합기 `G.yet` + 대괄호 표시 규칙** + `G.stripHanja` + `G.pickYetFont` | `gwandong-byeolgok/js/core/util.js` | 중세국어 예문·원문 전반 |
| 4 | 표시 언어 파서(`{漢字|한글}` 루비, `@id` 칸, `**굵게**`, `_밑줄_`)와 **첫가끝 음절 분할 `T.syllables`**, 음보 분할 `T.feet` | `dosan-sipigok/js/core/text.js` | 음절 단위 누르기·형태소 경계 끊기(예: 체언+조사, 어간+선어말어미+어말어미 분석), 이어적기/끊어적기 비교 |
| 5 | 옛한글 부분 글꼴 만들기(Noto Serif KR SubsetOTF, 자모 블록 통째, `ljmo/vjmo/tjmo`) + 글자 모으기 스크립트 | `gwandong-byeolgok/tools/build_yet_font.py`·`yet_chars.js`, `dosan-sipigok/tools/build_fonts.py` | 휴대폰마다 옛한글이 풀어져 보이는 문제 방지 |
| 6 | **원문 출처 사슬**: 원문 사이트 → `design/research/*.md`의 `#### E01` + `> **原文** (위치)` + `출처: <URL>` → `tools/extract_orig.py` → `js/data/orig.js`(손으로 고치지 않음) → "원문은 리서치 문서 글자 그대로" 테스트 | `pansori-hanmadang/tools/extract_orig.py`, `tests/sim.test.mjs` | 훈민정음 언해·석보상절·월인석보·용비어천가 등 원문 발췌 |
| 7 | 검증 노트 형식(자료 표 · 방침 · 기계 대조(difflib) · 행별 차이표 · ★교과서 대조 · 해석 갈림 · 못 한 것) + 확실도 기호 | §4-2 | 판본(해례본/언해본, 초간/중간) 차이, 방점·한자음 표기 차이 |
| 8 | 표지 체계 `原文` / `풀이` / `알아 두기(src)` / `게임 설정 · 虛`(+`real`) / `이본 노트(채점 안 함)` / `해석(채점 안 함)` | §3-8 | 문법 설명(사실)과 게임 설정 구분 |
| 9 | 보기마다 `why`, 정답 `explain`, 답한 뒤 `after` 카드, 오답을 **오개념·기출 함정**에서 가져오기, 도움 사다리(틀린 칸 → 힌트 → 정답 보기, 감점 대신 기록), 첫 시도 정확도·오답 노트 | `dosan-sipigok/js/data/songs.js`, `sassi-namjeonggi` README | 중세국어 오개념(예: 'ㆍ'의 음가, 8종성법, 주격 조사 'ㅣ'의 이형태) |
| 10 | 처음 읽기/다시 읽기 두 방식(풀이 가림, 헷갈리는 오답 카드 추가) | 도산·사씨 | 도입 차시 / 복습 차시 |
| 11 | 저장 계약(접두사 + `{ s: SCHEMA }` + 상태 `v`, 막혀도 메모리로, 예외 없음, 한 번만 더하기) | `sori-haejeon/js/core/save.js`, `docs/contracts.md` | 교실 공용 기기 |
| 12 | `window.__<game>Errors` 오류 모음 + "`console.error`는 점검 실패" 규칙 | `sori-haejeon/js/core/util.js` | 옛한글 조합 실패를 `console.warn`이 아니라 점검 실패로 잡기 |
| 13 | Node `vm` 데이터 린트(`content.mjs`) + 순수 규칙 엔진 단위 시험 | `hero-road/tests/content.mjs`, `sori-haejeon/tests/lib/load.mjs` | 참조 무결성, 판정 규칙 |
| 14 | 학생처럼 끝까지 E2E(일부러 틀리기, 중간 새로고침, 화면 6종, file://) | `dosan-sipigok/tests/student.mjs`, `sassi-namjeonggi/tests/full.mjs` | — |
| 15 | `tools/student_view.js` + 블라인드 풀이 2~3명 + 디자이너 검토 + 재풀이 지표("바로 나옴/보기 소거") | `dosan-sipigok/design/review/` | 문항이 생각을 요구하는지 정량 확인 |
| 16 | Codex 플레이테스트 지시서(역할·환경·할 일·지킬 것 + P0/P1/P2 보고서 + evidence/ + before 커밋 재현) | `pansori-hanmadang/design/playtest/CODEX_TASK.md`, `tests/codex/README.md` | — |
| 17 | 점수가 있다면 결정적 엔진 + `sim-balance.mjs`(전략별 결과표, 가중치 실험 플래그) | `pansori-hanmadang/tools/sim-balance.mjs` | — |
| 18 | README 골격(만든이, 어려운 점 ↔ 게임 장치 표, 실행 표, 차시 운영 표, 실제와 상상 표, 선생님용, 내용 고치기 표, 만든 방법, 테스트, 알려진 한계) | 여섯 README | — |
| 19 | 보안 정책(개인정보·입력 칸 없음 원칙, 외부 CDN 금지, 출처 표기 세 곳 동기화) | `sori-haejeon/docs/security.md` | 이름 입력이 필요하면 결과 화면 캡처용으로만, 저장하지 않음 |
| 20 | GitHub Pages(맨 위 폴더) + `.nojekyll` + OG 태그 + manifest | §1-3 | — |
| 21 | 음운 해전의 **자질 중심 음운 데이터**(`js/data/sounds.js`, 화면 이름 없이 자질만) | `sori-haejeon/docs/contracts.md` ③("다음 편이 가져다 쓸 음운 데이터") | 현대 vs 15세기 자음·모음 체계 비교. 예: ㅸ·ㅿ·ㆆ·ㆁ를 같은 자질 키로 추가 |

### 8-2. 개선할 것

| # | 개선점 | 까닭(관찰한 문제) | 제안 |
|---|---|---|---|
| 1 | **옛한글 조합표 넓히기** | 관동 규칙은 허용 중성이 현대 모음·ㆍ·ㆍㅣ뿐이라 ㆌ(ᆔ)를 쓰지 못해 '쥬·취'로 바꿨다(검증노트 §5). 중세국어에는 ㆉ·ㆌ·ㆇ·ㆈ, ᅀ·ᅌ·ᅙ, 순경음 ᄛ·ᄝ·ᄫ·ᅗ, 각자병서 ᅇ·ᅘ·ᄿ, 치두·정치음(ᄼ ᄾ ᅎ ᅐ ᅔ ᅕ), 종성 ㅭ 등이 나온다 | 조합표를 데이터로 분리(`js/data/jamo.js`)하고 Unicode 자모 블록 전체를 대응시킨다. **모든 데이터 문자열을 조합해 실패 0건임을 검사**하는 점검을 둔다 |
| 2 | **방점(성조) 지원** | 여섯 게임 모두 방점을 다루지 않는다 | 방점 U+302E(〮)·U+302F(〯)의 데이터 표기 규칙을 ADR로 정한다(예: 음절 뒤 `·`/`:`). 표시 켜기/끄기 설정, 글꼴의 결합 위치 렌더링을 **실기기 캡처로 확인**한다(Noto Serif KR에서의 표시 품질은 이번 조사에서 확인하지 않음) |
| 3 | 동국정운식 한자음(`世솅宗종`) | 루비 문법 `{漢字|한글}`이 있지만 한자음 자체에 옛한글이 들어간다 | `{世|[ㅅㅖㆆ]}`처럼 루비 안 옛한글을 허용하는지 파서 단위 시험으로 고정한다(도산 `T.reading`은 이미 `yet()`을 거침) |
| 4 | 정답 판정은 문자열이 아니라 id로 | 첫가끝 자모열은 NFC로 합쳐지지 않아 같은 글자가 여러 바이트열이 될 수 있다(완성형 vs 첫가끝) | 판정에는 id·인덱스만 쓰고, 화면 문자열 비교가 필요하면 `G.yet` 정규화 결과끼리 비교하는 도우미를 둔다 |
| 5 | **화면 낭독기 대응** | 첫가끝 자모열은 낭독기가 자모 단위로 읽거나 건너뛴다(추정 — 실기 확인 필요). 기존 게임은 원문 요소에 대체 읽기가 없다 | 원문 요소에 `aria-label="<현대 독음 또는 현대 표기>"`를 주고 시각 원문은 `aria-hidden`. 데이터에 `modern` 필드를 필수로 둔다 |
| 6 | 글꼴 커버리지 자동 점검 | 음운 해전도 새 음절이 기기 글꼴로 새는지를 캡처로만 본다(`docs/engineering-notes.md` §글꼴) | woff2의 cmap을 읽어(fontTools 또는 Node) **데이터에 쓰인 모든 코드포인트가 글꼴에 있는지** 검사하는 Node 점검을 만든다 |
| 7 | 원시 첫가끝 자모 금지 검사 | 관동은 "원시 첫가끝 자모는 파일에 없음, 검사로 확인"이라고 적었지만 저장소에 그 검사가 없다(tests 없음) | `orig.js` 말고 모든 `js/data/*.js`에서 U+1100~11FF·A960~A97F·D7B0~D7FF를 금지하는 점검을 둔다 |
| 8 | **CI 추가** | 여섯 저장소 모두 `.github/` 없음. 점검이 개발 기기에서만 돈다 | GitHub Actions에서 브라우저 없는 점검만 돌린다(데이터 린트, 규칙, 원문 출처, 옛한글 조합, 글꼴 커버리지 — npm 의존 없음). 브라우저 점검은 로컬·배포 주소 대상으로 둔다. Pages는 지금처럼 가지에서 바로 배포 |
| 9 | 브라우저 점검 도구 하나로 정하기 | aside(의존 없음, 제약 많음, 30분)와 Playwright(npm 필요, 크기·터치 자유)가 섞여 있다 | 선생님께 확인해 ADR로 고정한다. 시리즈 다수는 Playwright + `channel: 'chrome'`이다 |
| 10 | 저장·재개 트랜잭션 규칙 | 영웅 QA-001, 판소리 P0-01 같은 재개 버그가 되풀이된다 | 보상과 진행 표시를 한 번에 저장하는 `G.save.commit(step, reward)` 하나로 묶는다. 장면 경계마다 '새로고침 → 이어 하기' 회귀 테스트를 표준으로 둔다 |
| 11 | 오프라인(선택) | 서비스 워커가 없다. 학교망이 불안정하면 첫 로딩이 실패할 수 있다 | 필요할 때만 버전 고정 캐시 서비스 워커를 넣는다(이름에 버전, 새 버전 알림). 수업 중 옛 캐시가 남는 위험이 있으므로 ADR로 결정한다 |
| 12 | 외부 CDN·확대 금지 반례 피하기 | 관동별곡의 Google Fonts, `user-scalable=no` | 모든 글꼴을 동봉하고 확대를 허용한다(security.md·standards.md에 명시) |
| 13 | 데이터 머리 주석의 예시 깨짐 방지 | 관동 `text.js` 머리 주석의 변환 예시가 `[ㅎㆍ]다 → [ㅎㆍ]다`로 양쪽이 같다(완성 결과 예시가 사라짐. README에는 `→ ᄒᆞ다`로 맞게 있음) | 주석 예시는 표시 형태만 적고, 결과 예시는 단위 시험 사례로 옮긴다 |
| 14 | 검증 노트에 '기계 대조 스크립트' 동봉 | 관동은 difflib로 대조했다고 적었지만 스크립트가 저장소에 없다 | `tools/compare_orig.py`(정규화 규칙 + 대조 결과 일치율)를 저장소에 두고 노트에 결과를 붙인다 |
| 15 | 세로 배치 기준 상수 한 곳 | 음운 해전은 같은 미디어 쿼리가 8곳에 흩어져 있다 | CSS 사용자 속성 + JS 상수 하나(`G.layout.PORTRAIT_Q`)에서 읽게 한다 |
| 16 | 시리즈 경계 명시 | 음운 해전 ADR 0010은 훈민정음·중세국어·제자 원리를 그 게임에서 **일부러 뺐다**("소리와 문자를 섞지 않는다") | 새 게임 README·ADR에 "음운 해전은 음운(소리), 이 게임은 표기·문법(문자와 중세국어)"이라는 역할 분담을 적는다. 새 게임에서도 `/ㄱ/` 빗금(음운)과 〈ㄱ〉·'ㄱ'(문자) 표기 규칙을 분명히 한다 |

### 8-3. 제안 저장소 트리(초안)

```
jungse-/                              ← (저장소 이름은 확정 전)
├── CLAUDE.md / AGENTS.md             ← §6-2 ① (두 파일 같은 내용)
├── README.md                         ← 선생님용(만든이·실행·차시·실제와 상상·내용 고치기·출처·테스트·알려진 한계)
├── index.html                        ← <!-- styles:start --> / <!-- scripts:start (util → data → core → game → main) -->
├── manifest.webmanifest  .nojekyll  .gitignore
├── docs/
│   ├── architecture.md  business-rules.md  contracts.md  standards.md
│   ├── engineering-notes.md  operations.md  security.md
│   └── tracking/ status.md  findings.md  decisions/{index.md, 0001-…}
├── css/  base.css(토큰)  fonts.css(생성)  <화면>.css …
├── js/
│   ├── core/  AGENTS.md  util.js(G, 오류 모음)  yet.js(옛한글 조합·음절·방점)  text.js(표시 언어 파서)
│   │          rules.js(판정 순수 함수)  save.js  audio.js  ui.js
│   ├── data/  AGENTS.md  orig.js(자동 생성, 손대지 않음)  jamo.js(조합표)  <단원>.js(문항·풀이·why·after)
│   │          notes.js(알아 두기 src·게임 설정 real·이본 노트·해석·디브리핑)  text.js(화면 문구)
│   ├── game/  AGENTS.md  app.js(go/destroy 라우터)  steps.js(단계 실행기)  <화면>.js …
│   └── main.js
├── assets/ fonts/(woff2 + OFL)  audio/(+CREDITS)  img/  ui/(icon·og)   raw/(git 제외)
├── tools/  AGENTS.md  build_fonts.py  extract_orig.py  compare_orig.py  student_view.js  (sim-balance.mjs)  gen.ps1  prompts/
├── tests/  package.json  run-all.mjs  server.mjs  lib/load.mjs
│           check-data.mjs  check-rules.mjs  check-orig.mjs(출처 사슬)  check-yet.mjs(조합 0실패·원시 자모 금지)
│           check-font.mjs(커버리지)  check-save.mjs  check-text.mjs  student.mjs(E2E)  shots.mjs  codex/
└── design/ 기획안_v0.md  설계서_v1.md  인터뷰_결정.md
            research/ 01_<원문>_사실확인.md  02_<문법 항목>_교과서_대조.md  03_게임설계.md
            원문_검증노트.md  review/(student_view·answer_key·solver_*·designer·검토_결과)  playtest/(CODEX_TASK.md, 보고서, evidence/)
```

### 8-4. 원문 검증용 출처 후보(이번 조사에서 확인하지 않은 후보 — 확정 전 검증 필요)

여섯 게임이 실제로 쓴 출처 유형(위키문헌 판본 전사, 한국민족문화대백과, 한국고전종합DB, KCI 논문, 평가원 기출, EBS, 공공기관 디지털 아카이브의 판본 이미지)을 중세국어 원문에 맞춰 보면 후보는 다음과 같다. 훈민정음 해례본·언해본 영인(국립한글박물관·간송 계열 공개 이미지), 『석보상절』·『월인석보』·『용비어천가』 등 판본 이미지(규장각·장서각·국립중앙도서관 원문 서비스), 국립국어원 역사 말뭉치(21세기 세종계획), 위키문헌 전사본, 한국민족문화대백과·우리역사넷. **어느 것을 기준 판본으로 삼을지, 교과서 통용 표기(방점 유무, 한자 병기 방식)를 따를지는 선생님과 ADR로 정하고** 검증 노트 §2 "따른 판본과 표기 방침"에 적는다.

---

## 부록: 주요 근거 파일 목록

- 문서 체계: `sori-haejeon/{CLAUDE.md, AGENTS.md}`, `sori-haejeon/js/{core,data,game}/AGENTS.md`, `sori-haejeon/tools/AGENTS.md`, `sori-haejeon/docs/{architecture,business-rules,contracts,standards,engineering-notes,operations,security}.md`, `sori-haejeon/docs/tracking/{status,findings}.md`, `sori-haejeon/docs/tracking/decisions/0001~0012-*.md`
- 옛한글: `gwandong-byeolgok/js/core/util.js`(G.yet·pickYetFont), `gwandong-byeolgok/tools/{build_yet_font.py, yet_chars.js}`, `dosan-sipigok/js/core/text.js`, `dosan-sipigok/tools/build_fonts.py`, `pansori-hanmadang/{tools/extract_orig.py, js/data/orig.js}`
- 검증 노트: `gwandong-byeolgok/design/원문_검증노트.md`, `dosan-sipigok/design/research/01_작품_사실확인.md`, `sassi-namjeonggi/design/원작_검증노트.md`, `hero-road/design/research/01_작품_사실확인.md`, `pansori-hanmadang/design/research/02_마당별_대목_모티프.md`
- 데이터: `gwandong-byeolgok/js/data/{text,game}.js`, `dosan-sipigok/js/data/{songs,notes}.js`, `pansori-hanmadang/js/data/{orig,daemok,notes}.js`, `sassi-namjeonggi/js/data/{story,people,notes}.js`, `hero-road/js/data/{story,works,notes}.js`, `sori-haejeon/js/data/{sounds,levels,text}.js`
- 테스트·QA: `sori-haejeon/tests/{run-all,aside,check-*}.mjs`, `sori-haejeon/tests/lib/{load,drive}.mjs`, `sori-haejeon/tests/review/학생검토.md`, `hero-road/tests/{content,e2e,resume,balance,file}.mjs`, `hero-road/tests/codex-qa/play.mjs`, `hero-road/design/qa/{QA_보고서_codex,codex_final}.md`, `dosan-sipigok/tests/student.mjs`, `dosan-sipigok/tools/student_view.js`, `dosan-sipigok/design/review/{student_view,answer_key,solver_A,solver_B,solver_C,designer,검토_결과}.md`, `pansori-hanmadang/tests/{sim.test,load,e2e}.mjs`, `pansori-hanmadang/tests/codex/README.md`, `pansori-hanmadang/tools/sim-balance.mjs`, `pansori-hanmadang/design/playtest/{CODEX_TASK,codex_playtest_1}.md`, `sassi-namjeonggi/tests/{content,full,measure}.mjs`
- 배포·PWA: 각 `index.html`, `*/manifest.webmanifest`, `sori-haejeon/docs/operations.md` §배포, `sori-haejeon/.nojekyll`, `hero-road/.nojekyll`
