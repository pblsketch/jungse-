# 그림 도구 사용법 (A1)

그림은 Codex CLI 내장 `image_gen`(gpt-image-2)으로 만들고, 파이썬 스크립트로 게임용 파일로 바꾼다.

## 지켜야 할 것

- 문구는 **영어 ASCII만** 쓴다. 한글·한자가 섞이면 `gen.ps1`이 거부한다(종료 코드 2).
- 모든 문구에 **TEXT RULE**(글자·한글·한자·숫자·로고·워터마크·상표 금지)을 넣는다. `make_prompts.py`가 자동으로 붙인다.
- 15세기 인물·장면에는 **PERIOD RULE**(`design/research/08_복식_고증.md` §5)이 붙는다. 복식 문구는 같은 문서 §6을 옮긴 것이다.
- 생성 원본은 `assets/raw/`(git 제외)에 둔다. 게임이 읽는 파일만 `assets/bg|portraits|cg|sprites|ui`에 커밋한다.
- 사용자의 `~/.codex` 설정은 건드리지 않는다. `gen.ps1`은 `%TEMP%\nm-codex-home`에 따로 만든 CODEX_HOME만 쓰고, `auth.json`은 읽어서 복사만 한다.
- 대량 생성은 사람이 시킬 때만 한다. 한 장에 1~3분 걸리고 사용량 제한에 걸릴 수 있다.

## 1. 문구 만들기 — `make_prompts.py`

```
python tools/make_prompts.py list                                  # 인물 키 목록
python tools/make_prompts.py portrait senior_tongsa --out tools/prompts/portrait_senior_tongsa.txt
python tools/make_prompts.py sd commoner_man commoner_woman --out tools/prompts/sd_x.txt   # 1~2명, 초록 배경
python tools/make_prompts.py map --desc "a 1450s palace gate plaza" --screens 2 --out tools/prompts/map_gate.txt
python tools/make_prompts.py cg --desc "..." --chars hero_1,senior_tongsa --out tools/prompts/cg_x.txt
python tools/make_prompts.py samples                               # 견본 문구 + sample_manifest.tsv
```

SD 시트는 4줄(아래·왼쪽·오른쪽·위) × 3칸(걷기 3프레임), 순수 초록(#00FF00) 배경이다. 초록 옷(예: 양반 남자의 muted green)은 크로마 키와 겹치므로 `sd`가 자동으로 갈색으로 바꾼다.

## 2. 그리기 — `gen.ps1` / `genqueue.ps1`

```
powershell -ExecutionPolicy Bypass -File tools/gen.ps1 -PromptFile tools/prompts/map_market_street.txt -Out assets/raw/gen/map_market_street.png -Size 1536x1024
powershell -ExecutionPolicy Bypass -File tools/gen.ps1 -PromptFile tools/prompts/sd_hero_1_2.txt -Out assets/raw/gen/sd_hero_1_2.png -Size 1536x1024 -Ref design/art/characters/v2/L1_protagonists_lineup.png
powershell -ExecutionPolicy Bypass -File tools/genqueue.ps1 -Manifest tools/prompts/sample_manifest.tsv -DryRun   # 먼저 점검
powershell -ExecutionPolicy Bypass -File tools/genqueue.ps1 -Manifest tools/prompts/sample_manifest.tsv
```

- 크기: `1024x1024`, `1536x1024`, `1024x1536`. 품질: `low|medium|high`(기본 high).
- "at capacity"면 30초부터 두 배씩 기다렸다 다시(`-Retries`), 사용량 제한이면 `-WaitOnLimitSec`(기본 600초)만큼 기다렸다 다시(`-LimitRetries`).
- 실행할 때마다 `assets/prompts.md`에 날짜·출력·크기·참조·문구·결과가 붙는다.
- 목록(TSV): `name  size  refs  prompt`. `refs`는 `;`로 나누고, 앞 작업 이름을 쓰면 그 결과 그림을 참조로 쓴다. 이미 있는 출력은 건너뛰고, 실패한 작업은 다음 회차(`-Passes`)에 다시 한다. 기본 출력 폴더는 `assets/raw/gen/`.

## 3. 스프라이트 — `process_sprites.py`

```
python tools/process_sprites.py assets/raw/gen/sd_hero_1_2.png --name hero_1 --region left
python tools/process_sprites.py assets/raw/gen/sd_hero_1_2.png --name hero_2 --region right
```

- 초록 키(옛 시트는 `--key magenta`), 가장자리 색 번짐 제거, 부드러운 알파 유지(이진화·팔레트 축소 없음).
- 빈 줄·빈 칸을 찾아 4×3으로 자르고, 첫 프레임 키를 `--target-height`(기본 112px)에 맞춘 **한 가지 배율**을 모든 프레임에 쓴다.
- 발 기준점 = 아래 12% 줄의 불투명 픽셀 x 중앙값, 기준선 = 맨 아래. 모든 프레임이 같은 칸 크기·같은 기준점을 갖는다.
- 결과: `assets/sprites/<name>.png` + `.json`(칸 크기, pivot/origin, anims `down/left/up/idle`, `flip.right = "left"`). 원본 시트는 `assets/raw/sprites/`에 복사된다.
- `--cell 96x128`처럼 칸을 정하면, 넘치는 프레임이 있을 때 실패한다.

## 4. 배경·초상·CG — `process_assets.py`

```
python tools/process_assets.py bg assets/raw/gen/map_market_street.png       # 가로 1920 이하, webp q80
python tools/process_assets.py portrait assets/raw/gen/portrait_x.png        # 긴 변 512, webp q84
python tools/process_assets.py cg assets/raw/gen/cg_first_meeting.png        # 가로 1280 이하, webp q80
python tools/process_assets.py og assets/raw/gen/cover.png --name og         # 1200x630 jpg
```

## 점검

`npm --prefix tests run check` — `tests/checks/a1-sprite-pipeline.mjs`가 견본 시트로 파이프라인을 돌려 12프레임·같은 칸 크기·발 기준선(±2px)을 확인한다. numpy·Pillow가 없으면 `python -m pip install numpy Pillow`.
