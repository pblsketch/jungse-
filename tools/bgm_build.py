# 승인된 국악 악구(assets/raw/audio/)를 장면별 배경음으로 잇는다.
#   python tools/bgm_build.py  → assets/audio/bgm_*.mp3 + assets/raw/audio/_build.json(측정값)
# 순서: 모노 44.1kHz로 읽기 → (무장단 곡만) 앞뒤 무음 정리 → 짧은 등전력 크로스페이드로 잇기
#       → 너무 짧으면 되풀이 → 끝과 처음을 겹쳐 되풀이 이음매 없애기
#       → 이득 + 리미터로 -18 LUFS(두 번 맞춤), 천장 -2.5 dBFS → MP3 모노 64kbps → ebur128로 다시 재기
import json, os, re, subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW = os.path.join(ROOT, 'assets', 'raw', 'audio')
OUT = os.path.join(ROOT, 'assets', 'audio')
FF = os.environ.get('FFMPEG_BIN', r'C:\Users\wnsdl\ffmpeg\bin')
FFMPEG = os.path.join(FF, 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
SR = 44100
TARGET_I, TARGET_TP = -18.0, -1.5
# 리미터 천장 -2.5 dBFS: MP3로 줄일 때 생기는 넘침까지 쳐서 True Peak가 -1.5 dBFS 아래에 머물게 한다
LIMIT = 'alimiter=limit=0.75:attack=5:release=80:level=false'
EDGE = 0.03     # 파일 양끝 페이드(초)
MIN_LEN = 40.0  # 이보다 짧은 곡은 악구 묶음을 되풀이해 늘린다

# free=True: 무장단(자유 리듬) → 앞뒤 무음 정리, 이음매를 길게 겹침
TRACKS = json.load(open(os.path.join(ROOT, 'design', 'audio', 'approved_ids.json'), encoding='utf-8'))
FREE = {'bgm_title', 'bgm_s1', 'bgm_s7'}
SEAM = {True: 2.5, False: 0.6}      # 되풀이 이음매 겹침(초)
JOIN = {True: 0.04, False: 0.015}   # 악구 사이 겹침(초)
# s0 「갈잎소리」는 내려받은 파일 이름이 악구 번호가 아니라 원래 mp3 이름을 따른다(getFileInfo의 mp3_file_path)
ALIAS = {'w6-007-001': '16_갈잎소리1_1', 'w6-007-002': '16_갈잎소리1_2',
         'w6-007-003': '16_갈잎소리1_3', 'w6-007-004': '16_갈잎소리2_2'}


def find(pid):
    stem = ALIAS.get(pid, pid).lower()
    hits = [f for f in os.listdir(RAW) if f.lower().endswith('.wav') and f.lower().startswith(stem)]
    if len(hits) != 1:
        raise SystemExit(f'악구 파일을 찾지 못함: {pid} → {hits}')
    return os.path.join(RAW, hits[0])


def load(path):
    p = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                       capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)


def trim(x, db=-48.0, head=0.10, tail=0.35):
    thr = 10 ** (db / 20)
    idx = np.flatnonzero(np.abs(x) > thr)
    if idx.size == 0:
        return x
    a = max(0, idx[0] - int(head * SR))
    b = min(len(x), idx[-1] + int(tail * SR))
    return x[a:b]


def xfade(a, b, d):
    n = min(int(d * SR), len(a), len(b))
    if n <= 0:
        return np.concatenate([a, b])
    t = np.linspace(0, np.pi / 2, n)
    mid = a[-n:] * np.cos(t) + b[:n] * np.sin(t)
    return np.concatenate([a[:-n], mid, b[n:]])


def loopify(x, d):
    """끝 d초를 처음 d초와 겹쳐 앞에 둔다. 결과의 끝 → 처음이 원래 이어지던 소리로 이어진다."""
    n = int(d * SR)
    t = np.linspace(0, np.pi / 2, n)
    mid = x[-n:] * np.cos(t) + x[:n] * np.sin(t)
    return np.concatenate([mid, x[n:-n]])


def run(args):
    return subprocess.run([FFMPEG, '-hide_banner', '-nostats'] + args, capture_output=True, text=True, encoding='utf-8', errors='replace')


def measure(path):
    r = run(['-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    s = r.stderr[r.stderr.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
    return i, tp


def main():
    os.makedirs(OUT, exist_ok=True)
    report = {}
    for key, ids in TRACKS.items():
        free = key in FREE
        parts = [load(find(pid)) for pid in ids]
        if free:
            parts = [trim(p) for p in parts]
        body = parts[0]
        for p in parts[1:]:
            body = xfade(body, p, JOIN[free])
        unit = body
        while len(body) / SR < MIN_LEN + SEAM[free]:
            body = xfade(body, unit, JOIN[free])
        body = loopify(body, SEAM[free])
        tmp = os.path.join(RAW, f'_{key}.wav')
        pcm = np.clip(body, -1, 1).astype(np.float32)
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', tmp],
                       input=pcm.tobytes(), check=True)
        input_i, _ = measure(tmp)
        # 이득으로 목표 음량에 맞추고, 튀는 봉우리만 리미터로 누른다(뜯는 현악기는 봉우리가 높다).
        # 리미터와 MP3 인코딩이 음량을 조금 바꾸므로, 결과 MP3를 다시 재서 ±0.3 LU 안에 들 때까지 고친다.
        mp3 = os.path.join(OUT, f'{key}.mp3')
        aim = TARGET_I
        for attempt in range(4):
            cur = tmp
            for step in range(2):
                i_now, _ = measure(cur)
                nxt = os.path.join(RAW, f'_{key}_{step}.wav')
                r = run(['-y', '-i', cur, '-af', f'volume={aim - i_now:.2f}dB,{LIMIT}', '-c:a', 'pcm_f32le', nxt])
                if r.returncode:
                    raise SystemExit(r.stderr[-2000:])
                if cur != tmp:
                    os.remove(cur)
                cur = nxt
            # 이음매 양끝 30ms 페이드: MP3는 앞뒤에 인코더 여백이 붙어 되풀이할 때 틈이 생길 수 있으므로
            # 틈이 나도 '딱' 소리가 나지 않게 아주 짧게 줄였다 키운다.
            fade = f'afade=t=in:d={EDGE},afade=t=out:st={len(body) / SR - EDGE:.4f}:d={EDGE}'
            r = run(['-y', '-i', cur, '-af', fade, '-ar', str(SR), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k',
                     '-map_metadata', '-1', '-id3v2_version', '0', '-write_xing', '1', mp3])
            if r.returncode:
                raise SystemExit(r.stderr[-2000:])
            os.remove(cur)
            i, tp = measure(mp3)
            if abs(i - TARGET_I) <= 0.3:
                break
            aim += TARGET_I - i
        os.remove(tmp)
        report[key] = {'ids': ids, 'sec': round(len(body) / SR, 2), 'lufs': i, 'true_peak_dbfs': tp,
                       'input_lufs': input_i, 'kb': round(os.path.getsize(mp3) / 1024),
                       'seam_s': SEAM[free], 'free': free}
        print(f"{key:11s} {report[key]['sec']:7.2f}s  {i:6.1f} LUFS  peak {tp:5.1f}  {report[key]['kb']:4d}KB  (원래 {input_i} LUFS)")
    json.dump(report, open(os.path.join(RAW, '_build.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
