# 국립국악원 「디지털 이음」 악구 중 선생님이 승인한 것만 내려받는다(2026-10-01 승인).
#   python tools/gugak_fetch.py  → assets/raw/audio/ (git에 넣지 않음)
# 이용 조건: 공공누리 제1유형(출처표시). 사이트 양식대로 사용 목적·기관명을 제출한다(선생님 승인 값).
import json, urllib.request, urllib.parse, http.cookiejar, io, os, sys, zipfile, time
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'raw', 'audio')
os.makedirs(OUT, exist_ok=True)
B = 'https://www.gugak.go.kr/digitaleum/'
FORM = {'usePurposeGb': '비상업용', 'usePurpose': '교육용', 'usePurposeDtl': '', 'companyName': '온양여자고등학교'}
approved = json.load(open(os.path.join(ROOT, 'design', 'audio', 'approved_ids.json'), encoding='utf-8'))
ids = [i for k in approved for i in approved[k]]
print('승인 악구', len(ids))
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [('User-Agent', 'Mozilla/5.0'), ('Referer', B + 'front/phrase/list.do')]
op.open(B + 'front/phrase/list.do').read()
have = set(f.lower() for f in os.listdir(OUT))
todo = [i for i in ids if not any(f.startswith(i.lower()) for f in have)]
for k in range(0, len(todo), 30):
    chunk = todo[k:k + 30]
    data = dict(FORM, arrId=','.join(chunk), id='')
    path = 'cmmn/file/phrase/downloads.do' if len(chunk) > 1 else 'cmmn/file/phrase/download.do'
    if len(chunk) == 1: data['id'] = chunk[0]
    r = op.open(B + path, urllib.parse.urlencode(data).encode())
    body = r.read(); disp = r.headers.get('Content-Disposition', '')
    print('받음', len(body), r.headers.get('Content-Type', ''))
    if body[:2] == b'PK':
        z = zipfile.ZipFile(io.BytesIO(body))
        for n in z.namelist():
            base = os.path.basename(n)
            if base: open(os.path.join(OUT, base), 'wb').write(z.read(n))
    else:
        fn = urllib.parse.unquote(disp.split('filename=')[-1].strip('"; ')) if 'filename=' in disp else chunk[0] + '.bin'
        open(os.path.join(OUT, os.path.basename(fn)), 'wb').write(body)
    time.sleep(1)
files = os.listdir(OUT)
missing = [i for i in ids if not any(f.lower().startswith(i.lower()) for f in files)]
print('파일', len(files), '빠진 악구', missing)
