// 링크 공유 미리보기(index.html 의 og·twitter 메타): 카카오톡·SNS 는 전체 주소의 이미지만 가져오므로
// og:image·twitter:image 가 https:// 전체 주소이고, 그 주소의 파일이 저장소에 있으며, og:url 이 canonical 과 같은지 본다.
// 의존 패키지 없음.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const meta = (attr, key) => {
  const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`));
  return m ? m[1] : null;
};
const fails = [];
const need = (ok, msg) => { if (!ok) fails.push(msg); };

const url = meta('property', 'og:url');
const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/) || [])[1] || null;
need(url && /^https:\/\/[^/]+\/.*\/$/.test(url), `og:url 이 https:// 로 시작하고 / 로 끝나야 한다 (${url})`);
need(canon === url, `canonical(${canon}) 과 og:url(${url}) 이 같아야 한다`);
for (const [attr, key] of [['property', 'og:image'], ['property', 'og:image:secure_url'], ['name', 'twitter:image']]) {
  const v = meta(attr, key);
  need(v && v.startsWith('https://'), `${key} 는 https:// 전체 주소여야 한다 (${v})`);
  if (v && url && v.startsWith(url)) need(existsSync(join(ROOT, v.slice(url.length))), `${key} 파일이 저장소에 없다: ${v.slice(url.length)}`);
  else need(false, `${key} 가 og:url(${url}) 아래 주소가 아니다 (${v})`);
}
for (const [attr, key] of [['property', 'og:title'], ['property', 'og:description'], ['property', 'og:image:alt'], ['name', 'twitter:card']]) {
  need(!!meta(attr, key), `${key} 가 없다`);
}
need(meta('property', 'og:image:width') === '1200' && meta('property', 'og:image:height') === '630', 'og:image 크기 1200×630');

if (fails.length) { fails.forEach(f => console.log('  FAIL ' + f)); console.log('og-meta: 실패'); process.exit(1); }
console.log('og-meta ok: ' + url);
