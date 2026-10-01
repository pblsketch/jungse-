// 개발·점검용 정적 서버. 사용: node tests/server.mjs [포트]
// 다른 모듈에서: import { serve } from './server.mjs'; const { url, close } = await serve();
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { ROOT } from './lib/load.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.webmanifest': 'application/manifest+json'
};

export function serve(port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let p = normalize(join(ROOT, u));
      if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      if ((await stat(p)).isDirectory()) p = join(p, 'index.html');
      const body = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => {
    const { port: p } = server.address();
    resolve({ url: `http://127.0.0.1:${p}/`, close: () => new Promise(r => server.close(r)) });
  }));
}

if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  const port = Number(process.argv[2] || 8770);
  serve(port).then(({ url }) => console.log(`serving ${url}`));
}
