# B. 에셋 제작 방법론 분석 — 기존 6개 게임에서 중세국어 게임으로

조사 대상(읽기 전용 클론): `/home/user/pblsketch/{gwandong-byeolgok, sassi-namjeonggi, hero-road, pansori-hanmadang, dosan-sipigok, sori-haejeon}`
조사 방법: tools/·assets/·design/·docs/의 스크립트와 문서를 읽었다. 그 밖에 직접 확인한 것: 배포된 woff2 글꼴을 fontTools와 HarfBuzz(uharfbuzz)로 열어 글자 수와 조합 결과를 셌고, `G.yet()` 조합기를 node로 돌려 보았고, 결과 이미지의 크기·용량을 쟀다.
보안: `gen.ps1`에는 API 키가 없다. 인증은 `~/.codex/auth.json`(ChatGPT 계정 로그인)을 임시 폴더로 복사해서 쓴다. 이 보고서에는 비밀 값을 옮기지 않았다.

만든 순서(문서 날짜로 추정): **관동별곡(09-24) → 사씨남정기(09-27) → 영웅의 길·판소리 한마당·도산십이곡(09-28~29, 거의 동시에) → 소리 해전(09-30~10-01)**. 저장소마다 커밋이 1개뿐인 스냅샷이라, 순서는 문서 안의 날짜와 "전작에서 가져옴" 같은 언급으로 추정했다.

---

## 1. 에셋 파이프라인 전체 흐름도

```
[기획서·리서치]  design/기획서_v1.md (화풍·인물·장면 목록 확정)
      │
      ▼
(1) 화풍 견본 ── tools/prompts/style_{a,b,c[,d]}_*.txt  (같은 장면 + 'Art style:' 문단만 다름)
      │            manifest_style(s).tsv → genqueue.ps1 → gen.ps1 → assets/raw/style_*.png
      │            축소본 → design/style-samples/  (sori: preview_samples_v2.py)
      ▼
   선생님 선택 (기획서/ assets/prompts.md에 기록, "견본 2~3장 보여 드리고 고른 것만")
      │
      ▼
(2) 기준 그림(인물 일관성 앵커)
      ├ 견본 A 자체를 라인업으로 사용 (hero-road ref_cast.png = style_a_woodblock)
      ├ 견본에서 인물별로 잘라 냄 (sassi ref_sassi.png 384×1024 ×4, ref_cast_nobadge 2048×512)
      ├ 설정화를 새로 생성 (dosan ref_cast.txt / pansori cs_cast·cs_chunhyang)
      └ 주인공 한 장 (gwandong ref_jeongcheol.png 700×460)
      │
      ▼
(3) 프롬프트+매니페스트 생성 ── python tools/make_prompts*.py / make_sprites.py
      │   STYLE 상수 + 종류별 머리말(PORTRAIT/SCENE/SHEET/BG) + 인물 공통 문구 + 장면 설명 + 시대 문구
      │   → tools/prompts/<name>.txt (ASCII만, assert) + tools/manifest*.tsv (name, size, ref, mode)
      ▼
(4) 생성 ── powershell tools/genqueue.ps1 -Manifest … [-Parallel 3] [-SkipExisting] [-Only a,b]
      │        └ 각 줄마다 gen.ps1 → codex exec (내장 image_gen, gpt-image-2) [--image=ref.png]
      │        └ genretry.ps1: 계정 한도에 걸리면 10분씩 기다리며 최대 18번 다시 시도(hero-road)
      │   결과 → assets/raw/<name>.png  (git에 안 올림)
      ▼
(5) 눈으로 점검 ── contact.py(밀착 인화, pansori), --check PASS/FAIL(sori), 다시 만든 기록(prompts.md)
      │   파생 그림은 앞선 결과를 참조로 다시 생성(s06 → s06b 가을밤, ship → ship_burnt, pt_* → sp_*)
      ▼
(6) 후처리 ── python tools/process_assets.py / process_sprites.py / process_top.py
      │   크롭·리사이즈(LANCZOS) → webp(q78~84) / jpg / png
      │   자홍(#FF00FF) 크로마키 → 투명, 프레임 검출 → 발밑 피벗 → PPU 축소 → 팔레트 양자화 → 아틀라스
      │   + sprites.json, js/data/sprites.js(file://에서도 읽게)
      │   + 코드로 만드는 것: 한지 질감 paper.webp, 바랜 그림(_f), 아이콘 192/512, OG 1200×630
      ▼
(7) 글꼴 ── python tools/build_fonts.py / build_yet_font.py (+ node chars.js / yet_chars.js)
      │   게임 소스의 글자 수집(옛한글 조합 후) → fontTools 부분 글꼴 woff2 → 이름 바꾸기(OFL) → OFL.txt
      ▼
(8) 소리 ── 국립국악원 디지털 이음 악구(공공누리 1유형) 내려받기(gugak_fetch.py 또는 브라우저)
      │   → bgm_probe.py(길이·LUFS·무음) → make_bgm.py / bgm_build.py / build_music.py / process_audio.py
      │   이어 붙이기·크로스페이드·되풀이 이음매·음량 맞추기 → mp3(모노 64~96k / 스테레오 112k)
      │   (sori만 CC BY 음악 + Freesound CC0 효과음)
      ▼
(9) 출처·라이선스 ── assets/audio/CREDITS*, assets/fonts/OFL*.txt, README '만든 방법', 제목 화면 출처 줄
      ▼
커밋: 결과물만(assets/{pt,sc,img,sprites,bg,ui,bgm,music,audio,fonts}, 프롬프트, 매니페스트)
      원본(assets/raw, tools/fonts_src, tools/music_src, assets/raw_audio)은 .gitignore
```

---

## 2. 단계별 도구·입력·출력 표

| 단계 | 도구(대표 경로) | 입력 | 출력 | 메모 |
|---|---|---|---|---|
| 화풍 견본 | `*/tools/prompts/style_*.txt`, `manifest_style(s).tsv` | 같은 장면 + 화풍 문단 3~4개 | `assets/raw/style_*.png` → `design/style-samples/` | sori: `tools/preview_samples_v2.py`로 축소본 |
| 기준 그림 | `dosan-sipigok/tools/prompts/ref_cast.txt`, `manifest_ref.tsv`; `pansori-hanmadang/tools/manifest_b1.tsv` | 인물 설정 문장 | `design/ref/ref_cast.png`, `assets/raw/cs_cast.png` | sassi는 견본을 잘라 `design/ref/ref_*.png` |
| 프롬프트 생성 | `hero-road/tools/make_prompts.py`, `make_sprites.py`; `sassi-namjeonggi/tools/make_prompts.py`; `dosan-sipigok/tools/make_prompts.py`; `pansori-hanmadang/tools/make_prompts_b2.py`·`_b3.py`; `gwandong-byeolgok/tools/make_prompts.py` | 파이썬 상수(STYLE, 인물 문구) | `tools/prompts/<name>.txt`, `tools/manifest*.tsv` | 비ASCII가 있으면 assert로 멈추거나 WARN |
| 1장 생성 | `*/tools/gen.ps1` | `-Name -PromptFile -Out [-Size] [-Quality high] [-Image] [-RefMode]` | PNG 1장 | Codex CLI `exec` + 내장 `image_gen` |
| 일괄 생성 | `*/tools/genqueue.ps1` | 매니페스트 TSV | `assets/raw/<name>.png` | 동시 3개, 작업마다 900초 대기, `-SkipExisting`, `-Only` |
| 재시도 | `hero-road/tools/genretry.ps1` | 매니페스트 | 빠진 그림 | 18번 × 10분. 먼저 1장으로 시험한 뒤 일괄 |
| 육안 점검 | `pansori-hanmadang/tools/contact.py` | `assets/raw/<패턴>.png` | 밀착 인화 PNG(칸 300px, 5열) | |
| 장면·초상 후처리 | `*/tools/process_assets.py` | `assets/raw/*.png` | `assets/{pt,sc,dm,pl,ui}/*.webp` | 접두어(pt_/sc_/dm_/pl_/map_/s##)로 갈래를 나눔 |
| 스프라이트 | `gwandong-byeolgok/tools/process_assets.py`, `hero-road/tools/process_sprites.py` | 마젠타 시트 | `assets/sprites/*.png`, `assets/sprites.json`, `js/data/sprites.js` | 발밑 피벗, PPU, 팔레트 |
| 투명 그림 | `sori-haejeon/tools/process_assets.py`(`key_out`), `process_top.py` | 자홍 배경 PNG | 투명 webp | 알파 역산식 크로마키, `--check` |
| 글꼴 | `*/tools/build_fonts.py`, `gwandong-byeolgok/tools/build_yet_font.py`, `dosan-sipigok/tools/chars.js`, `gwandong-byeolgok/tools/yet_chars.js` | 원본 OTF/TTF(`tools/fonts_src`, `assets/raw`) + 게임 문자열 | `assets/fonts/*.woff2`, `OFL*.txt`, (sori) `css/fonts.css` | |
| 국악 수집 | `dosan-sipigok/tools/gugak_fetch.py`(API 자동), hero-road는 Aside 브라우저 | 악기·장르·악곡 이름 | `assets/raw/bgm/*.wav`, `picks.json` | 양식: 비상업용/교육용/소속 학교 |
| 국악 측정 | `dosan-sipigok/tools/bgm_probe.py` | wav | `probe.json`(길이·LUFS·피크·무음) | ffprobe, ebur128, silencedetect |
| BGM 만들기 | `hero-road/tools/make_bgm.py`, `dosan-sipigok/tools/bgm_build.py`, `sassi-namjeonggi/tools/build_music.py`, `pansori-hanmadang/tools/process_audio.py` + `audio_selection.json` | 악구 번호 목록 | `assets/{bgm,music,audio}/*.mp3`, (dosan) `bgm.json` | |
| 오디오 코드 이식 | `pansori-hanmadang/tools/patch_audio.py` | 사씨남정기 `js/core/audio.js` | 판소리용 audio.js | 한 번만 돌리는 문자열 치환 |
| OG/표지 | `hero-road/tools/make_og.py`, `dosan-sipigok/tools/make_cover.py`, pansori·sassi `process_assets.py` 안 | title_art, 게임 캡처 | `assets/ui/og-*.jpg` 1200×630, `design/screens/dorms_cover.jpg` 1600×1000 | |
| 원문 추출 | `pansori-hanmadang/tools/extract_orig.py` | 리서치 문서의 원문 블록 | `js/data/orig.js` | "사람 손을 거치지 않고 그대로 복사"(오탈자 방지) |

---

## 3. 이미지 프롬프트 작성 규칙

### 3.1 생성 엔진과 호출 방식 (`*/tools/gen.ps1`)
- **엔진**: OpenAI **Codex CLI**의 내장 `image_gen` 도구. 주석에는 "gpt-image-2"로 적혀 있다(`dosan-sipigok/tools/gen.ps1` 1행, `hero-road/design/기획서_v1.md` §8). `model = …`은 도구를 부르는 에이전트 LLM이고 이미지 모델은 아니다. 기본값은 `gpt-6-astra`이고 `~/.codex/config.toml`에 다른 값이 있으면 그것을 쓴다. pansori만 `gpt-5.6-terra`로 고정하고 `[features] image_generation = true`를 켰다. 이유는 주석에 있다: "전역 설정의 모델은 로컬 브리지 전용이라 ChatGPT 계정으로 바로 부르면 400".
- **명령**: `codex exec "<지시문>" -C $CODEX_HOME -s workspace-write --skip-git-repo-check -c 'model_reasoning_effort="low"' [--image=<ref.png>]`
  - 지시문: "Call the built-in image_gen tool exactly once to generate 1 image (size $Size, quality $Quality). Do not run any shell commands and do not read any files.{refNote} Use everything between <prompt> and </prompt> verbatim as the image prompt. After the image is generated, reply only with DONE."
  - 결과 수거: `$CODEX_HOME\generated_images\**\*.png` 가운데 시작 시각 뒤에 생긴 가장 새 파일을 `-Out`으로 복사하고 `SAVED`/`NO_IMAGE`를 찍는다.
- **알려진 함정**(문서로 남아 있음, `sori-haejeon/docs/engineering-notes.md` §그림 생성, `sori-haejeon/tools/AGENTS.md`):
  - 프롬프트는 **영어(ASCII)만** 쓴다. 명령문에 그대로 끼워 넘기기 때문에 한글이 들어가면 깨진다. `"`는 `'`로 바꾼다.
  - codex에게 프롬프트 **파일을 읽게 하면** 샌드박스가 막아서 생성이 되지 않는다.
  - 전역 `~/.codex`(플러그인·MCP)를 쓰면 시작이 몇 분씩 멈춘다. 그래서 최소 config만 둔 **임시 CODEX_HOME**을 쓴다(`%TEMP%\codex-img-<게임>-<name>`).
  - Bash에서 부를 때는 **`</dev/null`로 표준 입력을 닫아야** 한다. 안 닫으면 멈춘다.
  - 크기는 `1024x1024`(초상·소품), `1536x1024`(가로 장면·시트), `1024x1536`(세로 병풍·타이틀) 세 가지. 품질은 `high`.

### 3.2 프롬프트 구성식
make_prompts.py가 상수를 이어 붙여 만든다.

```
[종류 머리말]  + [인물/장면 설명(인물 공통 문구 재사용)] + "\n\n" + [STYLE 문단] + [시대·복식 문구]
```

- **종류 머리말** (실제 문장):
  - 초상(`hero-road/tools/make_prompts.py` PORTRAIT): "Bust portrait (head and upper chest) of a single character for a story game character card. The figure is centered, facing slightly toward the viewer, and fills most of the square. Plain cream mulberry paper background with nothing else on it."
  - 장면(SCENE): "Wide illustration of one scene from a classical heroic novel, for a mobile story game. Clear readable composition, figures large enough to recognize, calm areas of plain paper around the figures."
  - 병풍 장면(`dosan-sipigok/tools/make_prompts.py` PRE): "A tall vertical panel of a Korean folding-screen painting, Joseon dynasty, year 1565 … **Keep every important element inside the central 70 percent of the height** and make each listed element clearly visible and recognizable, not tiny."
  - 횡스크롤 배경(`gwandong-byeolgok/tools/make_prompts.py` BG): "…**Keep the bottom 22% of the image calm, low-detail mist or water** (it will be covered by the game's ground)… The left and right edges should have similar tone and horizon height so the image can be repeated horizontally."
  - 픽셀 시트(gwandong PIX / hero-road SHEET): "Pixel art sprite sheet … 16-bit SNES style, crisp hard-edged pixels, no anti-aliasing, limited palette, dark 1-pixel outlines. **Solid flat pure magenta background (#FF00FF)** … strict invisible grid with wide empty magenta gaps … feet of every frame rest on the same baseline (**foot pivot fixed at bottom center**)."
  - 소품(hero-road PROPS): "…one consistent pixel scale where **one ground tile is 32x32 pixels and a person would be about 48 pixels tall**."
- **STYLE 문단**: 견본에서 고른 화풍 문장을 그대로 붙여 넣는다.
  - 도산(수묵담채): "Art style: Korean true-view landscape ink painting (jingyeong sansu) with light watercolor tints (sumuk damchae), in the manner of 18th-century Korean literati painters: expressive calligraphic brush strokes, dry-brush texture strokes on rocks, … visible warm hanji paper texture, elegant and restrained."
  - 영웅의 길(방각본 목판): "Art style: hand-colored Korean woodblock print, like the illustrations of late-Joseon commercially printed classical novels (bangakbon) and the Oryun Haengsildo: bold carved black outlines with the slight irregularity of a carved wood block, flat areas of hand-applied color limited to vermilion red, indigo blue, ochre yellow and soft green, visible wood grain and ink-press texture, cream mulberry paper background. … printed look, not a painting."
  - 사씨(민화): "19th-century Joseon Korean folk painting (minhwa) in the manner of classical-novel illustration folding screens (such as the Guunmong screens): flat opaque mineral pigments, fine even black ink outlines…"
  - 판소리(웹툰): "modern Korean historical webtoon illustration for teenagers: clean confident line art, soft cel shading, … not photorealistic, not anime-glossy."
  - 소리 해전(평면 벡터): "flat vector illustration made of simple clean geometric shapes, solid color fills with no gradients or only very subtle ones, crisp edges, minimal detail, modern editorial infographic look." 여기에 **팔레트를 hex로 못 박는다**(`#2E5266`, `#EEF0EA`, `#A8342B`, `#8FC7B8`, v2는 `#1B5F82`, `#183540`, `#096C6A` 등).
- **시대·복식 문구**(고증 오류를 막는 덧붙임):
  - "The story world is an idealized Ming-dynasty China …, so every story character wears MING DYNASTY Chinese clothing and armor, never Korean hanbok."(hero-road MING)
  - "This is late-Joseon Korea (18th-19th century): people wear Korean hanbok, men wear black horsehair gat hats or headbands."(JOSEON)
  - 사씨 NOBADGE: "Any official in a dark green or dark robe wears a PLAIN robe with NO rank badge … Nobody wears a dragon robe." 젊은 한림학사의 품계에 맞지 않는 학 흉배를 막으려고 넣었다.
  - 판소리 story 모드: "Byeon Hak-do's chest badge shows a tiger, never a dragon."

### 3.3 화풍 탐색과 선택
- **변인 통제**: 견본들은 장면 문단이 글자 하나까지 같고 **`Art style:` 문단만** 다르다(`dosan-sipigok/tools/prompts/style_{a_damchae,b_cheongnok,c_modern}.txt`를 비교하면 바로 보인다). 장면은 그 게임의 대표 장면이거나 **주요 인물 4명 라인업**이다(hero-road·sassi). 그래서 견본이 곧 인물 설정화 역할도 한다.
- 견본 개수와 결과:
  - 관동(픽셀 / 수묵 / **하이브리드** → 픽셀 캐릭터 + 수묵 배경)
  - 사씨(**민화** / 수묵 / 웹툰)
  - 영웅(**목판** / 무신도 / 오려 붙이기 / 붓 만화)
  - 판소리(풍속화 / 병풍 / **웹툰**)
  - 도산(**수묵담채** / 청록산수 / 현대 수묵)
  - 소리 v1(**평면** / 해도 / 동화풍), v2(**평면** / 2.5D 로우폴리 / 포스터)
- **"전작과 다르게"**를 원칙으로 둔다(`hero-road/design/기획서_v1.md` 18행: "전작(관동별곡 픽셀·수묵, 사씨남정기 민화)과 다르게").
- 선택은 **선생님이 한다**. 기록 위치는 기획서 '화풍' 행, `sori-haejeon/assets/prompts.md`의 "선택한 그림체" 절, 그리고 `sori-haejeon/tools/AGENTS.md`의 불변 조건("새 화풍은 견본 2~3장을 선생님께 보여 드리고 고른 것으로만 만든다. 쓴 프롬프트와 고른 결과는 assets/prompts.md에 적는다").
- **다시 만든 기록**(sori prompts.md "다시 만든 기록"):
  - 1회차: 세 화풍 모두 실사 3D처럼 나와 구별이 안 됐다.
  - 2회차: B와 C는 문구를 세게 바꿔 통과했다("장난감 같은 로우폴리", "스크린 인쇄 포스터, 색 여덟 개, 그림자 없음").
  - 3회차: A는 "그라데이션·key art" 같은 말을 빼고 통과했다.
  - **교훈**: 'gradient', 'key art', 'cinematic' 같은 말은 사실적인 렌더 쪽으로 끌고 간다.

### 3.4 캐릭터 일관성 기법
1. **참조 그림 + RefMode**(`gen.ps1`의 `$refNote`가 지시문에 덧붙는다):
   - `same`: "keep the character design, face, costume, colors and art style identical". 같은 인물의 다른 표정이나 같은 배의 불탄 판에 쓴다.
   - `style`: "an ART STYLE reference only … match its painting style, line work, colors and paper texture exactly, but draw the new character … not the people in the reference". 조연·청중에 쓴다.
   - `scene`: 화풍과 등장인물을 함께 따른다. **refNote 안에 인물별 식별 문구를 하드코딩한다**. 예(hero-road): "the young male general in dark-gold scale armor and crimson robe, the young woman commander disguised as a man in silver armor and indigo robe, the old white-bearded Taoist master in a grey crane robe, the sly minister in a purple robe and black winged hat". 게임마다 이 줄을 바꿔 써야 한다.
   - `char`(hero-road): 의상·색·머리 모양만 가져오고 픽셀 스프라이트 화풍으로 다시 그린다. 목판 초상(`assets/raw/pt_*.png`)을 도트 시트로 옮길 때 쓴다.
   - `story`(pansori): 춘향가 인물 6명을 따로 기술한 scene의 변형.
2. **인물 공통 문구 상수**: `HERO_M`, `VILLAIN`, `MASTER` 같은 문구를 초상과 장면에 **글자 그대로** 되풀이한다(hero-road make_prompts.py 주석: "초상과 장면에서 같은 말을 되풀이해 모습을 맞춘다").
3. **라인업에서 한 명 고르기**: "Draw ONLY the first character from the left in the reference image, …"(hero-road `pt_m_hero.txt`), "Only one person: … (third in the reference)"(pansori b2).
4. **식별성 요구**: 라인업 프롬프트에 "Each character must be instantly distinguishable by silhouette and main color."
5. **기준 그림을 단계적으로 만든다**:
   - pansori: 견본 C → 설정화 `cs_cast`(scene) → 초상 9장(scene) → 장소 그림 `pl_*`은 각 NPC 초상을 `same` 참조로(`manifest_b3.tsv`).
   - sassi: 견본 A를 인물별로 잘라 `ref_sassi.png` 등 4장(각 384×1024)으로 만들고, 장면용으로는 흉배를 뺀 4인 띠 `ref_cast_nobadge.png`(2048×512)를 쓴다.
6. **파생 그림**: 앞선 결과를 참조로 같은 구도의 변형을 만든다.
   - dosan `s06b` 가을밤: `manifest_b.tsv`의 ref가 `assets/raw/s06.png`, 프롬프트는 "The attached reference shows this exact place in spring. Paint the very same place and composition on an autumn night…".
   - sori `ship*_burnt`도 같은 방식(`same`).
7. **실패 사례**: 화풍 참조(`style`)로 견본을 붙였더니 견본의 배를 그대로 베껴 세 척이 똑같아졌다. 참조를 빼고 비율 문구("선체 길이 폭의 5배")를 넣어서 해결했다(sori prompts.md).

### 3.5 금지어·네거티브(모든 게임 공통 꼬리)
- "**Absolutely no text, no letters, no calligraphy, no seals, no signatures, no captions**[, no frames or borders][, no watermark]." 거의 모든 프롬프트 끝에 붙는다.
- 화면 안 글자는 전부 HTML 글꼴로 얹는다. **예외는 관동 `logo.txt` 하나**다: "exactly these four Hangul syllables: 관동별곡 … perfectly legible". 이때도 낙관은 "abstract red pattern (no legible characters)"로 막았다.
- 장면별 네거티브 예:
  - "Every signboard on the buildings is completely blank."(관동 bg_palace)
  - "IMPORTANT: no paper kites, no toy kites, no flags anywhere"(도산 s06. 시어 '연(鳶, 솔개)'을 종이연으로 잘못 그리는 것을 막음)
  - "Only these two people appear: do not include the herbal doctor or the villager from the reference image"
  - 소리 해전: "no traditional Korean or Joseon ships, no sails, no oars", "no hull numbers", 그리고 빨강·주황·황금 금지(게임 UI 신호색과 겹치지 않게)
- 투명이 필요한 그림은 **자홍 #FF00FF 단색 배경**으로 그린다. 그 대신 그림 자체에는 자홍을 쓰지 않게 프롬프트로 막는다.
- 레이아웃 규칙을 숫자로 적는다: "exactly 3 rows of 4 frames", "Row 1: walking DOWN…", "Always facing RIGHT", "empty calm paper area in the top third for the title", "top 40% empty sky … bottom 25% quiet sea for the menu panel".

---

## 4. 매니페스트 스키마와 예시 행

- 형식: **UTF-8 TSV**, 한 줄에 그림 하나. `#`로 시작하는 줄과 빈 줄은 건너뛴다. 머리줄은 `# name\tsize\tref\tmode`.

| 열 | 뜻 | 값 |
|---|---|---|
| name | 프롬프트 `tools/prompts/<name>.txt`, 결과 `assets/raw/<name>.png` | 접두어로 갈래 구분: `pt_`(초상), `sc_`/`s##`(장면), `dm_`(대목), `pl_`(장소), `sp_`(스프라이트), `props_`, `bg_`, `cs_`(설정화), `style_`, `ref_`, `title_art`, `map_`, `paper` |
| size | 생성 크기 | `1024x1024` / `1536x1024` / `1024x1536` |
| ref | 참조 그림 경로(저장소 기준 상대 경로, 비우면 없음) | `design/ref/ref_cast.png`, `design/style-samples/…`, `assets/raw/<앞선 결과>.png` |
| mode | RefMode(비우면 `same`) | `same` / `style` / `scene` / `char` / `story` |

- 예시 행(실제):
```
# name	size	ref	mode
pt_toegye	1024x1024	design/ref/ref_cast.png	same          ← dosan manifest.tsv
s01	1024x1536	design/ref/ref_cast.png	scene
s06b	1024x1536	assets/raw/s06.png	same                 ← dosan manifest_b.tsv(파생)
ref_cast	1536x1024		                                  ← dosan manifest_ref.tsv(기준 그림)
sp_hero_m_child	1536x1024	assets/raw/pt_m_child.png	char ← hero-road manifest_sprites.tsv
pl_jumak	1536x1024	assets/raw/pt_np_jumo.png	same     ← pansori manifest_b3.tsv
dm_bangja	1536x1024	assets/raw/cs_chunhyang.png	story
hero_a	1536x1024	design/ref/ref_jeongcheol.png        ← gwandong(3열, 머리줄 없음, mode 없음)
```
- 매니페스트를 **배치별로 나눈다**: `manifest_styles.tsv`(견본) → `manifest_ref.tsv`(기준) → `manifest.tsv`(본편) → `manifest_b.tsv`/`_s06.tsv`(파생·재생성). pansori는 `b1`→`b2`→`b3`. 앞 배치의 결과가 다음 배치의 ref가 되기 때문이다.
- 매니페스트는 make_prompts.py가 자동으로 쓰므로 손으로 고치지 않는다. 다만 dosan `manifest_s06.tsv`처럼 한 장만 다시 만들 때 쓰는 작은 파일은 따로 둔다.

---

## 5. 후처리 규칙(실제 수치)

### 5.1 장면·초상(webp)
| 게임 | 초상 | 장면 | 기타 |
|---|---|---|---|
| 도산 `dosan-sipigok/tools/process_assets.py` | 위쪽 기준 정사각 크롭 → **256px**, q84 (실측 평균 11KB) | 가로 **1024**, q80 (s01 1024×1536, 411KB) + **바랜 그림 `_f`**(흑백 → 대비 0.58 → 밝기 1.08 → 한지색 (236,228,210)과 0.26 혼합, q70, 152KB) | title 가로 1100 q80, 아이콘은 타이틀 크롭 192/512 |
| 영웅 `hero-road/tools/process_assets.py` | **320px** q84 (평균 27KB) | 가로 **1280** q80 (평균 320KB) | title 가로 900, 아이콘 '雄' 붉은 인장 |
| 사씨 `sassi-namjeonggi/tools/process_assets.py` | 320 q84 | 1280 q80, `map_` 900 | title 1200, og-image.jpg q85 |
| 판소리 `pansori-hanmadang/tools/process_assets.py` | 320 q84 | sc 1280(세로 그림 900), `dm_`·`pl_` **960** q80 (평균 113~149KB) | **증분 처리**(원본 mtime이 더 새로울 때만 다시 만듦) |
| 관동 `gwandong-byeolgok/tools/process_assets.py` | 2×2 시트를 잘라 높이 **300** PNG(갓 테두리에 비친 자홍 85% 제거) | 배경 높이 ≤1024, **좌우 12% 교차 페이드로 이어 붙임** → JPG q86 (평균 294KB, 1687×821) | logo 가로 820, title 1600 JPG, map 아이콘 최대 96px |
| 소리 `sori-haejeon/tools/process_assets.py` | — | 16:9 크롭 → **1920×1080** (평면 그림이라 title 64KB), 휴대폰 1080×1920(빈 하늘을 세로로 늘림) | 투명 배 가로 ≤1024 q84, top_* 최대 768 |

- 한지 질감은 **생성하지 않고 코드로 만든다**: 512×512, 시드 고정(7/11). 바탕색 (239,226,195)~(245,236,220)에 3단 노이즈(32·8·2 스케일)와 섬유 380~900개를 그리고 GaussianBlur 0.4, webp q78~82. 섬유를 ±n 오프셋으로 9번 그려 상하좌우 이음매가 없다. 관동만 생성한 `paper.txt`를 쓴다(jpg q82).
- 크기 목표: 명시한 KB 예산은 없다. 대신 **게임당 assets 7.6~19MB**이고 원본은 커밋하지 않는다(관동 .gitignore에 "68MB"라고 적혀 있다).

### 5.2 픽셀 스프라이트(관동에서 시작해 영웅의 길로 이식. 주석에 "영상에서 배운 규칙")
1. **배경 제거**: `magenta = (r>170)&(b>170)&(g<110)&(|r−b|<70)` → 알파 0. **despill**: 가장자리의 R, B를 G 쪽으로 누른다. 투명 영역에 맞닿은 약한 자홍 픽셀을 한 번 더 지운다.
2. **프레임 검출**: 알파 마스크에서 30px 미만 먼지를 빼고 행·열 투영(`split_1d`)으로 자른다. 넓은 틈부터 고르고, 틈이 치우치면 균등 분할점 근처의 틈을 쓴다(격자가 조금 어긋나도 괜찮다).
3. **발밑 피벗**: 프레임 아래쪽 12% 띠에 있는 불투명 픽셀 x의 중앙값을 피벗으로 삼아 모든 프레임을 같은 칸에 맞춘다.
4. **PPU 축소**: 땅 한 칸 **32px**. 어른 **48px**, 아이 **36px**, 관동 주인공 **46px**, 보스 64~72px. 첫 앞모습 프레임 키로 배율을 정해 같은 시트의 모든 프레임에 똑같이 적용한다. 행마다 크기가 다르면 `norm`으로 보정한다.
5. **도트화**: 알파를 곱한 뒤 **BOX 축소**(가장자리 색 번짐 방지) → 알파를 110에서 이진화 → **MEDIANCUT 양자화, 디더링 없음, 캐릭터 40~48색, 소품 40~48색, 타일 32색**.
6. **아틀라스**: 8열 격자, 칸 크기 64×64 / 96×80 / 112×80 / 192×120. 메타데이터는 `{img, fw, fh, px, py, cols, anims:{name:{start,n,fps}}}`. 걷기 8fps, 공격 16~18fps. 소품은 `foot`(충돌 상자 비율)을 함께 적는다. **오른쪽 방향은 왼쪽을 뒤집어서 쓴다.**
7. **타일**: 높이 44px(널빤지 40). 폭은 32의 배수로 잘라 `seamless_x(6)`으로 끝 6픽셀을 디더링처럼 섞는다.
8. 결과는 `assets/sprites.json`과 **`js/data/sprites.js`(window.SPRITES)** 두 곳에 쓴다. file://로 열면 fetch가 막히기 때문이다.

### 5.3 투명 그림 정밀 크로마키(소리 해전, `key_out`)
- 픽셀 하나를 `(1−f)·본래색 + f·자홍`으로 보고 **`f = (min(R,B) − G)/255`**를 역산한다. f<0.04는 0, f>0.85는 1로 둔다. 알파를 1−f로 하고 본래 색을 복원한다. 12px 미만의 외톨이 점은 지운다.
- 연기 가장자리 같은 반투명을 살린다. 남은 보랏빛은 `smoke_tint`/`water_tint`로 지운다. 여백 16px만 남기고 자른다(`trim`).
- 온전한 배와 불탄 배는 **같은 자르기 상자**를 쓴다(바꿔 끼워도 흔들리지 않게).
- `sea_tile`: 반 칸 밀어 붙이는 최소 비용 경로(min-cut)로 이음매를 없앤다. 그 뒤 **무손실 webp**로 저장한다(손실 압축은 가장자리를 다시 어긋나게 한다).
- `--check`: 크기·투명도·이음매를 보고 PASS/FAIL을 찍는다(`tools/process_assets.py --check`).

---

## 6. 폰트 파이프라인 — 특히 옛한글 처리

### 6.1 게임별 글꼴(배포 woff2를 fontTools로 직접 확인)
| 게임 | 결과 파일(이름 바꿈) | 원본 | 수집 방식 | 옛한글 |
|---|---|---|---|---|
| 관동 | `assets/fonts/yet-serif.woff2` "Gwandong Yet" **472,784B**. cmap 1,738, 글리프 3,635, 음절 795, 한자 350 | **NotoSerifKR-Regular.otf** (noto-cjk `Serif/SubsetOTF/KR`) | `node tools/yet_chars.js`: vm으로 util.js·데이터를 돌려 `G.yet()`·`G.stripHanja()`를 거친 결과 + 코드 속 문자열 | **자모 전 범위**: U+1100–11FF, A960–A97F, D7B0–D7FF, 3130–318F + ASCII, U+00B7, 2010–2027, 2190–2193, 25B2–25BC, 3000–3011 |
| | UI는 Google Fonts CDN(Gowun Batang, Noto Sans/Serif KR) `<link>` | | | |
| 도산 | `yet.woff2` "DosanYet" 409KB, `myeongjo(-bold).woff2` "DosanMyeongjo" 400/700, `brush.woff2` "DosanBrush" | 옛한글: 같은 NotoSerifKR-Regular.otf / 본문: Google Fonts **NotoSerifKR[wght].ttf**(instancer로 400·700) / 제목: NanumBrushScript | `node tools/chars.js`(SONGS·NOTES 등에 `G.util.yet`, `G.text.reading` 적용) | yet.woff2에 JAMO 4범위 전체 + 기능 `ccmp, ljmo, vjmo, tjmo, locl, kern, palt, ruby` |
| 판소리 | `myeongjo(-bold)` "HanmadangSerif", `brush` "HanmadangBrush" | Google Fonts NotoSerifKR VF, NanumBrush | js 전체 + index.html 원문을 `populate(text=…)` | 원문(`js/data/orig.js`)이 **첫가끝 자모를 직접** 담는다(234자). layout_features `'*'`로 ljmo/vjmo/tjmo를 유지하고, 쓰인 자모 33개만 넣는다 |
| 영웅 | `myeongjo(-bold)` "HeroMyeongjo", `brush` "HeroBrush" | GF NotoSerifKR VF, NanumBrush | js 전체 + index.html 원문 | 없음(자모 0) |
| 사씨 | "SassiMyeongjo", "SassiBrush" | 같음 | 같음 | 없음 |
| 소리 | `title-800` "SoriTitle"(Hahmlet VF→800), `ui-500/600/700` "SoriUI"(Pretendard) | Hahmlet[wght].ttf, Pretendard-*.otf | **JS 토크나이저**(주석 제외 문자열·정규식), HTML 텍스트·속성, CSS `content` + 늘 넣는 기호와 호환 자모 | 없음(현대 국어 게임) |

공통 처리(`*/tools/build_fonts.py`):
- `fontTools.subset`, flavor woff2, `notdef_outline=True`, (일부) `hinting=False`.
- 가변 글꼴은 `instancer.instantiateVariableFont({'wght': …})`로 굵기를 고정한다.
- **OFL 예약 이름을 피하려고 이름 테이블을 바꾼다**(nameID 1·3·4·6·16·21 등). 저작권(nameID 0)과 라이선스 문구는 그대로 둔다.
- `assets/fonts/OFL.txt`에 원본 저작권 표시와 전문을 붙인다.
- 소리 해전은 여기서 더 나아갔다:
  - `recalcTimestamp=False`로 결과를 결정적으로 만든다.
  - nameID 16·17·21·22·25를 지우고, 남은 칸에 원래 이름이 있는지 검사한다.
  - **게임 글자 중 원본에 없는 글자를 보고**한다.
  - `css/fonts.css`를 만들고, 굵기 설명자를 범위로 둬서(`700 900`) 가짜 굵게를 막는다.
- 주의: 관동 `build_yet_font.py`는 **이름을 바꾸지 않는다**(배포 파일의 nameID 1이 그대로 'Noto Serif KR'). Noto CJK의 예약 이름은 'Source'라 위반 위험은 낮지만, 시리즈의 관행과 다르다.

### 6.2 옛한글 입력·조합 방식(관동 → 도산, `js/core/util.js`)
- 원문 데이터에는 **대괄호 안에 호환 자모**를 적는다. 예: `[ㅎㆍ]다`, `알[ㅍㆍㅣ]`, `[ㅅㄷㅗ]`(`gwandong-byeolgok/js/data/text.js`에 405곳).
- `G.yet()`은 이를 현대 음절로 쓸 수 있으면 완성형(U+AC00+)으로, 아니면 **첫가끝 자모열**(L U+1100대, V U+1161대, T U+11A8대)로 바꾼다. 실패하면 `console.warn('옛한글 조합 실패')`.
- 대응표: 초성 ㅿ ㆁ ㆆ ㅸ과 합용병서 40여 개(ᄢ ᄣ ᄯ ᄲ …), 중성 ㆍ ㆎ ᆢ ᆟ ᆠ ᆄ, 종성 ㅿ ㆁ ㆆ ᇙ ᇠ ᇗ ᇧ ᇨ ᇦ. 호환 겹자모(ㅺ ㅼ ㅽ ㅄ ㅳ …)는 낱자로 풀어서 처리한다.
- `G.stripHanja()`: `강호(江湖)애` → `강호애`(한자 병기 끄기).
- `G.pickYetFont()`: 캔버스로 `[ㅎㆍ][ㄷㆍ][ㅂㆍㄹ]`의 폭을 재서 '가가가' 폭의 ±25% 안이고 monospace 대체 결과와 다르면 "조합됨"으로 판정하고 CSS `--yet` 변수를 설정한다. 후보는 Gwandong Yet → 맑은 고딕 → Apple SD Gothic Neo → Noto Serif CJK KR → Source Han Serif K → 함초롬바탕 → 나눔명조 옛한글.
- CSS: `--yet: "Gwandong Yet", "Malgun Gothic", "Apple SD Gothic Neo", serif;`. 도산은 `--yet: 'DosanYet', 'DosanMyeongjo', 'Noto Serif CJK KR', 'Source Han Serif K', 'HCR Batang', 'Malgun Gothic', serif`.

### 6.3 검증 결과(직접 실행)
- **HarfBuzz 조합 시험**(관동 yet-serif.woff2, 도산 yet.woff2): 훈민정음 언해 견본 "나랏말ᄊᆞ미 듀ᇰ귁에 … ᄒᆞᆯᄊᆡ 솅조ᇰ 어ᅌᅥᆼ졩 ᅙᅡᆫ ᄼᆞ ᅎᅵ ᅘᅧ ᄛᅡ ᄫᅳᆯ ᄀᆔ ᄠᅳᆮ ᅀᆞᆯ"을 넣으면 **.notdef 0개**.
  - ᄒᆞ, ᄫ, ᅀᆞ, ᄉᆡᇰ은 글리프 1개로 합쳐진다(ccmp 합자).
  - ᅙ, 확장 A·B 자모는 너비 0 위치 변형 글리프로 겹쳐 그린다(ljmo/vjmo/tjmo). 눈으로 보면 한 음절이다.
  - 자모 보유: U+1100–11FF **256/256**, 확장 A **29/29**, 확장 B **72/76**.
- **부분 글꼴에 없는 현대 음절도 그려진다**: 귁·솅·졩은 cmap에 없지만 HarfBuzz가 완성형을 자모로 풀어서 조합했다. 자모 블록을 통째로 넣은 덕분에 원문을 고쳐도 덜 깨진다. 다만 이것은 HarfBuzz 계열 브라우저(Chrome·Firefox)의 동작이다. Safari(CoreText)에서는 따로 확인해야 한다.
- **방점(U+302E 〮, U+302F 〯)은 두 yet 글꼴 모두에 없다.** `ᄒᆞ〮`를 넣으면 방점 자리가 .notdef(두부)로 나온다. HarfBuzz가 방점 글리프를 음절 **앞(왼쪽)**으로 옮기는 것은 확인했다. 따라서 범위만 넣으면 표시 위치는 맞을 가능성이 높다. `RANGES`의 `(0x3000, 0x3011)`이 302E/302F를 포함하지 않는다. 원본 Noto Serif CJK KR에 이 두 글자가 있는지는 이 환경에서 원본을 받지 못해 **확인하지 못했다**(github 원본은 프록시 403).
- **`G.yet()`의 빈 곳**(node 실행 결과, 조합 실패 경고):
  - `[ㆅㅕ]`(ᅘ, 쌍히읗): 호환 자모 ㆅ(U+3185) 대응 없음.
  - `[ㅱㅡ]`(ᄝ): 호환 ㅱ(U+3171) 대응 없음. 다만 `ㅁㅇ` 두 글자로 쓰면 된다.
  - `[ㆄㅏ]`(ᅗ, 가벼운 ㅍ), `[ㆀㅣ]`(ㆀ 호환), `[ㄱㆉ]`(ᆈ), `[ㄱㅠㅓ]`(ᆎ): 실패.
  - 치두음·정치음 ᄼ ᄾ ᅎ ᅐ ᅔ ᅕ(U+113C–1155)과 ᄛ(가벼운 ㄹ, U+111B)은 호환 자모가 아예 없어서 대괄호 표기로는 입력할 수 없다.
  - 종성 대응도 한정적이다(ᇮ ᇱ ᇲ 등 없음).
  - 성공한 것: `[ㆁㅓㆁ]`→ᅌᅥᇰ, `[ㆆㅏㄴ]`→ᅙᅡᆫ, `[ㅸㅜㄹ]`→ᄫᅮᆯ, `[ㅿㆍㄹ]`→ᅀᆞᆯ, `[ㅅㄷㅡㄷ]`→ᄯᅳᆮ, `[ㅄㄷㅐ]`→ᄣᅢ, `[ㅎㆍㄹㆆ]`→ᄒᆞᇙ, `[ㅇㅑㅗ]`→ᄋᆄ, `[ㄱㆎㅿ]`→ᄀᆡᇫ.
- **굵기**: yet 글꼴은 Regular 한 벌뿐이다. 도산 CSS는 `.wcard .han { font-family: var(--yet); font-weight: 700 }`처럼 굵게를 써서 **브라우저 가짜 굵게**가 생긴다.
- **file://**: 관동 README '알려진 한계'에 "index.html을 파일로 바로 열면 브라우저가 글꼴 파일을 막아 기기 글꼴로 대신 그린다"고 적혀 있다. 그래서 웹 주소로 배포하는 것을 전제로 한다.
- 판소리 글꼴(GF Noto Serif KR VF 부분 글꼴): orig.js 원문 2,287자를 HarfBuzz로 돌리면 .notdef 0(줄바꿈만 제외). 구글 폰트판 Noto Serif KR에도 ljmo/vjmo/tjmo와 옛한글 자모가 있다는 뜻이다.

### 6.4 중세국어 게임에 그대로 쓸 수 있는가 — 평가
- **골격은 그대로 쓸 수 있다.** 관동의 `build_yet_font.py` + `yet_chars.js` + `G.yet`/`pickYetFont`(또는 도산판)를 가져오면 ㆍ·ㅿ·ㆁ·ㆆ·ㅸ·각자병서·합용병서·ᆡ 등 훈민정음 시기 표기의 대부분이 조합된다.
- **고쳐야 할 것**:
  1. **방점**: `RANGES`에 `(0x302E, 0x302F)`를 추가하고, 원본에 글리프가 있는지 확인한다(없으면 Source Han Serif K, 함초롬바탕 옛한글, 나눔명조 옛한글 같은 대안 OFL 글꼴을 검토). 방점 위치(왼쪽)를 브라우저 세 곳에서 캡처로 검증한다.
  2. **입력 표기 확장**: ㆅ ㅱ ㆄ ㆀ ㆇ–ㆌ를 L/V/T 표에 추가한다. 호환 자모가 없는 치두·정치음(ᄼ ᄾ ᅎ ᅐ ᅔ ᅕ)과 ᄛ은 별도 이름 표기(예: `[ㅅ치두ㆍ]`)를 정하거나, 판소리처럼 **자모를 직접 넣는 방식과 병행**한다. 종성 표도 넓힌다.
  3. **굵기**: 옛한글 제목이나 강조가 필요하면 NotoSerifKR-Bold.otf(SubsetOTF)로 700 한 벌을 더 만든다.
  4. **이름 바꾸기**(OFL 관행)와 결정적 빌드, 빠진 글자 보고 기능을 소리 해전의 `build_fonts.py`에서 합친다.
  5. 동국정운식 한자음(世솅宗조ᇰ) 병기용 한자 범위를 수집에 넣는다. 드문 한자는 기기 글꼴로 대체된다.
  6. 이 게임에서는 학습 대상이 자모 자체라서 **낱자 자모(ㆍ ㅿ ㆁ ㆆ 단독 표시)**와 **호환 자모 U+3130–318F**를 모든 UI 글꼴에도 넣어야 한다. 현재 소리 해전 UI 글꼴에는 현대 호환 자모만 들어 있다.

---

## 7. 오디오·BGM 파이프라인과 라이선스

### 7.1 국악(국립국악원 「국악기 디지털 음원」 디지털 이음, **공공누리 제1유형(출처표시)**)
- 출처: https://www.gugak.go.kr/digitaleum/front/phrase/list.do. 로그인은 필요 없다. 내려받을 때 **사용목적=비상업용, 용도=교육용, 기관명=소속 학교**를 적는다(한 번에 30개까지).
- 원칙: **한 연주의 번호가 이어지는 악구를 순서대로 이으면 실제 곡의 한 대목이 된다.** 반주장구를 밑에 깔지 않고 한 악기만 쓴다. 박이 어긋나지 않게 하려는 것이다(`hero-road/design/bgm_plan.md` '계획에서 바뀐 것').

| 게임 | 도구 | 이어 붙이기 | 반복 | 음량 | 인코딩 | 결과 |
|---|---|---|---|---|---|---|
| 사씨 | `tools/build_music.py` (양금만) | 이어지는 악구는 `[ ]` 묶음으로 바로 붙임, 떨어진 악구는 끝을 0.08초 줄여 다음 첫 박에 붙임 | 곡 끝 페이드, 반복 사이 쉼은 게임에서 | 소리 나는 구간 **RMS −19 dBFS**, 천장 −1 dBFS, 최대 3dB 압축 | 모노 44.1k **96kbps** | 11곡 9.2MB |
| 영웅 | `tools/make_bgm.py` + `design/bgm_plan.md` | 앞뒤 무음 정리(앞 0.10초, 뒤 0.35초, −48dB) 후 **40ms** 등전력 크로스페이드 | 끝에 처음 1.5초를 겹치는 loopify | ffmpeg loudnorm 2패스 **−17 LUFS**, TP −1.5, linear | 모노 **64kbps** | 13곡 8.6MB, 악구 105개 |
| 도산 | `tools/gugak_fetch.py`(사이트 목록 API `getInstrumentList/getGenreList/getFileList`, `downloads.do` 30개씩) → `bgm_probe.py` → `bgm_build.py` | 이어지는 악구 **5ms**, 떨어진 대목은 장단 경계에서(`metric`은 길이 유지) | 자유 장단(청성곡·수제천)은 끝 2.5~3초를 처음에 겹침 | **−20 LUFS**, 피크 −1 dBFS | 모노 64kbps | 7곡 4.3MB + `bgm.json`(출처 문자열 포함). 거문고·양금 「윗도드리」를 같은 길이로 맞춰 **같은 자리에서 악기만 바뀌게** 함 |
| 판소리 | `tools/process_audio.py` + `audio_selection.json` | ffmpeg `acrossfade d=0.02 tri` | 게임에서 끝·처음 겹침 | loudnorm **I=−20**, TP −2 | BGM 스테레오 **112k**, 고수 북 장단 `buk_*.mp3` 모노 96k(+2dB, limiter 0.85) | 23파일 7.4MB. 북 악구 1개 = 장단 한 바퀴, 게임이 이어서 친다 |
| 관동 | (도구 없음, 결과만 `assets/bgm/*.mp3` 8곡 5.1MB) | — | — | — | — | README: 파일을 못 읽으면 `js/core/audio.js`의 합성 창작곡(가야금 Karplus-Strong·대금·해금·장구·북·징)으로 대신 연주 |

- **대체 방식(공통)**: 녹음 파일이 없거나 file://에서 못 읽으면 WebAudio 합성음으로 바꾼다. 합성 엔진은 관동 → 사씨 → 영웅·판소리 순으로 이어받았다(`pansori-hanmadang/tools/patch_audio.py`가 사씨 audio.js를 문자열 치환으로 고친다). 효과음은 국악 게임들에서 대부분 합성음이다.
- 출처 표기 위치: 제목 화면 아래 한 줄, README '소리' 항목, `assets/audio/CREDITS.txt`(판소리는 악구 코드·악곡·장단을 하나하나 적음), `bgm.json`의 `src`.

### 7.2 비국악(소리 해전)
- 배경음악: Kevin MacLeod "Groove Grove"·"Cipher", Scott Buckley "Echoes Of Home"(모두 **CC BY 4.0**). 효과음 5종: Freesound **CC0**(DRFX, Kreastricon62, qubodup, Saltbearer, craigsmith).
- 손질(`sori-haejeon/assets/audio/CREDITS.md`):
  - 16kHz 저역 통과, EBU R128 **배경음악 약 −18 LUFS, 효과음 약 −16 LUFS**.
  - 반복 구간은 **스펙트럼·크로마 유사도**로 고르고, 크로스페이드 위치를 **파형 상관으로 샘플 단위까지** 맞췄다(0.8~1.0초).
  - 128~160kbps. 점검은 `tests/check-audio.mjs`(이음새 20ms 소리 크기 차, 한 샘플 튐, 곡 사이 음량 차, 클리핑).
- 결정 기록 `docs/tracking/decisions/0011-recorded-audio.md`: 합성음은 "짜치지 않게 양질"이라는 선생님 요구로 버렸다. CC BY 곡은 **게임 안 '만든 사람·출처', README, CREDITS.md 세 곳**을 함께 관리한다. 음원을 바꾸려면 후보를 다시 들려 드리고 골라야 한다.

### 7.3 녹음 음성(목소리)
- 여섯 게임 모두 **실제 음성도, TTS도 없다**. 0011에서 "실제 음성(소리 녹음·음성 합성): 학생이 직접 발음하게 한다"고 명시적으로 버렸다. 판소리의 추임새도 합성 효과음이다(`pansori-hanmadang/design/설계서_v1.md` 201행).
- 중세국어 게임에서 재구 발음(성조·ㆍ·ㅿ 음가)을 들려주려면 **새 결정이 필요하다**: 직접 녹음 + 동의·라이선스, 또는 학생 발음.

---

## 8. 게임별 차이점과 진화

| 순서 | 게임 | 처음 도입하거나 개선한 것 |
|---|---|---|
| 1 | **관동별곡** (gwandong-byeolgok) | Codex 생성 파이프라인의 원형: `gen.ps1` + `genqueue.ps1`, 매니페스트 3열(mode 없음), 참조 주인공 1장. **하이브리드 화풍**(픽셀 + 수묵). 마젠타 배경 → 프레임 자동 검출 → 발밑 피벗 → PPU → 팔레트 양자화(주석에 "영상에서 배운 규칙"). 배경 좌우 이어 붙임. **옛한글 조합기 `G.yet` + 자모 전체 부분 글꼴 + `pickYetFont`**. 합성 BGM으로 시작해 나중에(09-30 커밋) 국악 녹음으로 바꿈. UI 글꼴은 Google Fonts CDN. 화면 속 글자 그림(logo)을 허용한 유일한 게임 |
| 2 | **사씨남정기** (sassi) | 매니페스트 4열 + **RefMode same/style/scene**, scene 안에 인물 식별 문구. 비ASCII WARN. 임시 CODEX_HOME에 config 모델 읽기. 견본을 **인물별로 잘라** ref로 씀, 흉배 고증 수정판 ref(`ref_cast_nobadge`). **webp 전환**(pt 320, sc 1280). **한지 질감을 코드로 생성**. 부분 글꼴 **이름 바꾸기 + OFL 전문 동봉** 정착. 국악(양금) BGM `build_music.py` |
| 3 | **영웅의 길** (hero-road) | 견본 4종, **견본 A 라인업 = ref_cast**. make_prompts에서 **인물 문구 상수 재사용**. **`char` 모드**(목판 초상 → 도트 스프라이트), `make_sprites.py`·`process_sprites.py`(관동 규칙 이식, 탑뷰 RPG PPU 32). **`genretry.ps1`**(한도 대기 재시도), `-UseModel`/환경변수. **`make_og.py`**(실제 게임 화면 카드를 넣은 OG). `make_bgm.py`(loudnorm 2패스) + **계획 문서 → 선생님 확인 → 완료 기록**(`design/bgm_plan.md`) |
| 4 | **판소리 한마당** (pansori) | 모델 고정(gpt-5.6-terra) + `[features] image_generation`(계정 400 오류 해결). **배치 매니페스트 b1→b2→b3**(설정화 → 초상 → 장소, 앞 결과를 다음 ref로). `story` 모드(복식 고증 문장). **`contact.py` 밀착 인화 점검**. 증분 후처리. `extract_orig.py`로 원문 무손실 이전(첫가끝 자모 직접 저장). `audio_selection.json`으로 선곡과 처리 분리, 북 장단 악구 |
| 5 | **도산십이곡** (dosan) | **설정화를 따로 생성**(`ref_cast.txt`, `manifest_ref.tsv`). 견본/본편/파생 매니페스트 분리. 병풍 세로(1024×1536) "중앙 70%" 규칙, 시어 오독 네거티브. **바랜 그림 코드 생성**(학습 메커닉에 씀). 옛한글 글꼴(DosanYet)과 본문 명조를 분리하고 `ruby` 기능 유지. **`gugak_fetch.py` API 자동 수집 + `bgm_probe.py` 측정 + 장단 종류(metric/free)별 이음**. DoRms 표지 `make_cover.py`. OG 캐시 무효화 `?v=2` |
| 6 | **소리 해전** (sori-haejeon) | 현대·비역사 평면 벡터, **팔레트 hex 지정**. **`assets/prompts.md`에 모든 프롬프트와 다시 만든 기록**(try1/try2, 실패 원인) 보관. `tools/AGENTS.md` 불변 조건. **알파 역산 크로마키 `key_out`**, `smoke_tint`, 같은 자르기 상자, min-cut 이음매 + 무손실, **`--check` PASS/FAIL**. 글꼴: **결정적 빌드, JS 토크나이저 수집, 빠진 글자 보고, css/fonts.css 자동 생성, 예약 이름 검사**. 오디오: CC BY/CC0 녹음 + 반복점 자동 탐지 + `check-audio` 시험. `docs/engineering-notes.md`에 함정 정리(stdin `</dev/null` 등) |

요약하면 **이미지 생성 골격(gen/genqueue)은 1번부터 거의 그대로**이고 RefMode만 늘어났다(same → +style/scene → +char → +story). 품질 관리는 "눈으로" → contact sheet → 자동 `--check`로, 글꼴은 "쓰인 글자 + 자모" → 결정적 빌드 + 누락 보고로, 소리는 합성 → 국악 녹음 → 측정 기반 이음으로 발전했다.

---

## 9. 중세국어(훈민정음 시기) 게임에 재사용할 때 체크리스트

### 준비
- [ ] Windows + PowerShell + Codex 데스크톱 앱(`%LOCALAPPDATA%\OpenAI\Codex\bin\codex.exe`) + `~/.codex/auth.json` 로그인 확인. 모델은 pansori 방식으로 고정한다(`$model` + `[features] image_generation = true`). 키를 저장소에 두지 않는다.
- [ ] Python: Pillow, numpy, scipy, fontTools, brotli. 그리고 ffmpeg/ffprobe, node.
- [ ] `.gitignore`: `assets/raw/`, `tools/fonts_src/`, `assets/raw_audio/`·`tools/music_src/`, `tests/shots/`, `.omc/`.

### 그림
- [ ] **기본 골격**: `hero-road/tools/gen.ps1`(RefMode가 가장 많음, `-UseModel`) + `genqueue.ps1` + `genretry.ps1` + `pansori-hanmadang/tools/contact.py`.
- [ ] **refNote의 scene 문구를 새 인물로 바꾼다**. gen.ps1 안에 하드코딩되어 있다(예: 세종·집현전 학사·아이·백성의 식별 문구).
- [ ] 화풍 견본 3~4종, 장면을 같게 두고 `Art style:` 문단만 다르게. 15세기 판화 삽화 계열(『삼강행실도』(1434)나 『석보상절』·『월인석보』 시기의 목판 삽화풍)을 후보로 둔다. 영웅의 길이 방각본 목판을 이미 썼으므로 "전작과 다르게" 원칙에 맞춰 차이를 문서로 남긴다.
- [ ] **시대 복식 문구**를 새로 쓴다. 15세기 조선 전기 복식(사모·단령, 흑립 형태 등)이다. 후기 조선의 갓·두루마기 문구(`JOSEON`)를 그대로 쓰면 고증 오류가 생긴다.
- [ ] 라인업 기준 그림(4명) → 초상(same) → 장면(scene) → 파생(same). 매니페스트는 배치별로 나눈다.
- [ ] **이미지 안에 한글·한자·훈민정음 글자를 절대 그리게 하지 않는다**(생성 모델이 ㆍ·ㅿ 같은 글자를 틀리게 그린다). 책·현판·언해본 지면은 "blank pages / blank signboard"로 비워 두고, 글자는 글꼴 레이어로 얹는다. 낙관은 "abstract red pattern".
- [ ] 투명 그림은 #FF00FF 배경 + 소리 해전 `key_out`(알파 역산). 도트를 쓴다면 관동/영웅의 피벗·PPU 규칙.
- [ ] 크기 규칙: 초상 320 webp q84, 장면 1280 q80(세로 900~1024), OG 1200×630 jpg, 아이콘 192/512. 한지 질감은 코드로.
- [ ] `assets/prompts.md`에 견본, 선택, 다시 만든 기록을 남긴다(소리 해전 형식).

### 글꼴(가장 중요)
- [ ] `gwandong-byeolgok/tools/build_yet_font.py`를 바탕으로 하고, 다음을 고친다:
  - [ ] **U+302E–302F(방점) 추가**. 원본 OTF에 글리프가 있는지 먼저 확인한다(`fontTools`로 cmap 검사).
  - [ ] 출력 이름을 바꾼다(OFL 관행). `recalcTimestamp=False`, 빠진 글자 보고, `css/fonts.css` 생성(소리 해전 `build_fonts.py`에서 가져옴).
  - [ ] Bold 한 벌을 추가하거나, CSS에서 yet 글꼴에 `font-weight:700`을 쓰지 않는다.
- [ ] `G.yet()` 대응표 확장: ㆅ(→U+1158) ㅱ(→U+111D) ㆄ(→U+1157) ㆀ(→U+1147), 중성 ㆇ–ㆌ, ᄛ, 치두·정치음 ᄼ ᄾ ᅎ ᅐ ᅔ ᅕ(별도 표기 규칙), 종성(ᇮ 등). 실패 경고가 0인지 확인하는 node 시험을 만든다.
- [ ] 방점 표기 규칙(예: `[ㅎㆍ]·` → U+302E)을 조합기에 추가한다.
- [ ] HarfBuzz 시험 스크립트(uharfbuzz): 원문 전체를 shaping해서 .notdef 0을 확인한다. 브라우저 캡처는 Chrome·Safari·안드로이드에서 방점 위치와 ᄼ·ᅙ 조합을 본다.
- [ ] UI 글꼴에도 **낱자 옛자모(ㆍ ㅿ ㆁ ㆆ ㅸ, 호환 U+3130–318F 전체)**를 넣는다. 학습 대상이 자모 자체이기 때문이다.
- [ ] 배포는 웹 주소로 한다(file://에서 글꼴이 막히는 한계가 README에 있음). `pickYetFont` 대체 경로를 유지한다.

### 소리
- [ ] 국악 BGM: `dosan-sipigok/tools/gugak_fetch.py`(자동 수집) + `bgm_probe.py` + `bgm_build.py`(장단 종류별 이음). 15세기 분위기라면 정악(「여민락」·「수제천」·「보허자」 등, 세종 시대와 연결되는 곡)을 후보로 둔다. 양식 값은 비상업용/교육용/학교 이름으로 하되 **선생님 확인 후** 받는다(`hero-road/design/bgm_plan.md` 절차).
- [ ] 출처 표기 3곳(게임 안·README·CREDITS)과 악구 코드 목록(판소리 CREDITS.txt 형식).
- [ ] 음량 목표를 하나로 정한다(−17~−20 LUFS, TP −1.5). 모노 64k로 곡당 0.5~1MB.
- [ ] 녹음 음성(재구 발음)을 쓸지는 **새 결정 문서**로 정한다. 기존 시리즈에는 선례가 없고, 0011은 음성을 버렸다.

### 출처·배포
- [ ] OG 1200×630(실제 게임 화면 카드를 넣는 make_og 방식), 그림을 바꾸면 파일 이름을 바꾸거나 `?v=` 쿼리를 붙인다(카카오톡이 썸네일을 캐시함). DoRms 표지 1600×1000(`make_cover.py`).
- [ ] `assets/fonts/OFL.txt`(원본 저작권 + 전문 + "이름을 바꾼 부분 글꼴"이라는 설명), 오디오 CREDITS, README '만든 방법'.
- [ ] 원문 데이터는 판본의 표기를 손대지 않고 옮긴다(`extract_orig.py` 방식). 출처 URL과 위치를 필드로 저장한다.
