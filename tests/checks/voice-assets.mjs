import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, load } from '../lib/load.mjs';
const manifest = JSON.parse(readFileSync(join(ROOT, 'assets/audio/voices/manifest.json'), 'utf8'));
const plan = JSON.parse(execFileSync(process.execPath, [join(ROOT, 'tools/opening_voice_plan.mjs')], { cwd: ROOT, encoding: 'utf8' }));
const ctx = load(['js/core/ns.js', 'js/data/voices.js']);
assert.equal(manifest.clips.length, 8);
assert.deepEqual(Object.keys(ctx.NM.data.VOICES).sort(), plan.clips.map(c => c.id).sort());
for (const clip of manifest.clips) {
  assert.equal(clip.text, plan.clips.find(c => c.id === clip.id).text, clip.id + ': transcript matches displayed text');
  assert.equal(ctx.NM.data.VOICES[clip.id], clip.file);
  assert.match(clip.file, /^assets\/audio\/voices\/[a-z0-9-]+\.mp3$/);
  const bytes = readFileSync(join(ROOT, clip.file));
  assert.ok(bytes.length > 2000 && bytes.length < 1024 * 1024);
  assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), clip.sha256);
  assert.ok(clip.duration > 1 && clip.duration < 90);
}
console.log('voice-assets ok: 8 MP3 files, hashes, sizes, durations, registry and transcripts');
