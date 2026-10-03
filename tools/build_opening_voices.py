import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

import msgpack

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tests/test-results/opening-review/voice-cache'
OUT = ROOT / 'assets/audio/voices'
KEY = os.environ.get('NARATMALSSAMI_FISH_API_KEY', '')
FREE = '--free' in sys.argv
MODEL = 's2.1-pro-free' if FREE else 's2.1-pro'
if not KEY:
    raise SystemExit('NARATMALSSAMI_FISH_API_KEY is required for generation.')
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
plan = json.loads(subprocess.check_output(['node', str(ROOT / 'tools/opening_voice_plan.mjs')], cwd=ROOT))
assert len(plan['speakers']) == 3 and len(plan['clips']) == 8
assert sum(len(c['text'].encode('utf-8')) for c in plan['clips']) < 6000


def request(path, payload, model, binary=False):
    body = msgpack.packb(payload, use_bin_type=True) if binary else json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request('https://api.fish.audio' + path, data=body, headers={
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/msgpack' if binary else 'application/json',
        'model': model,
    })
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf-8', errors='replace').replace(KEY, '[redacted]')
        raise RuntimeError('Fish Audio HTTP ' + str(error.code) + ': ' + detail[:400]) from None


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()


refs = {}
for name, speaker in plan['speakers'].items():
    assert len(speaker['text']) <= 150
    cache = CACHE / (name + '-' + MODEL + '-' + digest(speaker)[:12] + '.json')
    if cache.exists():
        candidate = json.loads(cache.read_text(encoding='utf-8'))
    else:
        if FREE:
            seed_audio = request('/v1/tts', {'text': '[' + speaker['instruction'] + '] ' + speaker['text'], 'format': 'wav'}, MODEL)
            candidate = {'audio_base64': base64.b64encode(seed_audio).decode('ascii'), 'text': speaker['text'], 'duration_ms': None}
        else:
            result = json.loads(request('/v1/voice-design', {
                'instruction': speaker['instruction'], 'reference_text': speaker['text'],
                'language': 'ko', 'n': 1, 'seed': speaker['seed'], 'speed': 1,
            }, 'voice-design-1'))
            candidate = result['candidates'][0]
        cache.write_text(json.dumps(candidate, ensure_ascii=False), encoding='utf-8')
    audio = base64.b64decode(candidate['audio_base64'])
    seed_path = CACHE / (name + '.wav')
    seed_path.write_bytes(audio)
    refs[name] = {'audio': audio, 'text': speaker['text']}
    print('Voice ready:', name, candidate.get('duration_ms'), 'ms', flush=True)

manifest = {'provider': 'Fish Audio', 'models': [MODEL] if FREE else ['voice-design-1', MODEL], 'clips': []}
existing = {}
if (OUT / 'manifest.json').exists():
    existing = {c['id']: c for c in json.loads((OUT / 'manifest.json').read_text(encoding='utf-8'))['clips']}
for clip in plan['clips']:
    file = clip['id'].replace('.', '-') + '.mp3'
    target = OUT / file
    stamp = digest({'clip': clip, 'speaker': plan['speakers'][clip['speaker']], 'model': MODEL})
    if not target.exists() or existing.get(clip['id'], {}).get('generation_digest') != stamp:
        raw = CACHE / (file + '.raw.mp3')
        raw.write_bytes(request('/v1/tts', {
            'text': clip['direction'] + ' ' + clip['text'],
            'references': [refs[clip['speaker']]], 'format': 'mp3', 'mp3_bitrate': 128,
            'temperature': 0.65, 'top_p': 0.7,
        }, MODEL, binary=True))
        subprocess.run(['ffmpeg', '-nostdin', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(raw),
                        '-af', 'loudnorm=I=-18:LRA=7:TP=-2', '-map_metadata', '-1',
                        '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k', str(target)], check=True)
    duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                              '-of', 'default=noprint_wrappers=1:nokey=1', str(target)]))
    assert 1 < duration < 90
    entry = dict(clip, file='assets/audio/voices/' + file, duration=duration,
                 sha256=hashlib.sha256(target.read_bytes()).hexdigest(), generation_digest=stamp)
    manifest['clips'].append(entry)
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Audio ready:', clip['id'], round(duration, 2), 's', target.stat().st_size, 'bytes', flush=True)

mapping = {c['id']: c['file'] for c in manifest['clips']}
(ROOT / 'js/data/voices.js').write_text("'use strict';\nwindow.NM = window.NM || {};\nNM.data = NM.data || {};\nNM.data.VOICES = " + json.dumps(mapping, indent=2) + ';\n', encoding='utf-8')
print('Generated voice files:', len(mapping), flush=True)
