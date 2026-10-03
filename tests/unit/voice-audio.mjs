import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';
const instances = [];
class Media {
  constructor() { this.events = {}; this.paused = true; this.currentTime = 0; this.volume = 1; instances.push(this); }
  addEventListener(name, fn) { this.events[name] = fn; }
  play() { this.paused = false; return new Promise(resolve => { this.resolve = resolve; }); }
  pause() { this.paused = true; }
  removeAttribute() { this.src = ''; }
  load() {}
  end() { this.paused = true; this.events.ended(); }
}
const context = load(['js/core/ns.js', 'js/engine/audio.js'], { Audio: Media });
context.NM.data = { VOICES: { a: 'a.mp3', b: 'b.mp3', c: 'c.mp3' }, ASSETS: { bgm: { music: 'music.mp3' } } };
const audio = context.NM.engine.audio;
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
assert.equal(audio.playVoice('a'), false, 'no playback before user gesture');
audio.playBgm('music'); audio.unlock();
const music = instances[0];
assert.equal(music.volume, 0.5);
audio.playVoice(['a', 'b']);
const first = instances.at(-1); first.resolve(); await tick();
assert.equal(audio.state().voicePlaying, true); assert.equal(music.volume, 0.15);
first.end();
const second = instances.at(-1); second.resolve(); await tick();
assert.equal(audio.state().voiceKey, 'b'); assert.equal(first.paused, true);
audio.playVoice('c');
assert.equal(second.paused, true);
const replacement = instances.at(-1);
second.end();
assert.equal(instances.at(-1), replacement, 'obsolete ended event does not change new voice');
audio.stopVoice(); replacement.resolve(); await tick();
assert.equal(replacement.paused, true, 'late play promise stays stopped');
assert.equal(audio.state().voiceKey, null); assert.equal(music.volume, 0.5);
audio.setVoiceEnabled(false); assert.equal(audio.playVoice('a'), false);
audio.setVoiceEnabled(true); audio.setSfxEnabled(false);
assert.equal(audio.playVoice('a'), true);
const final = instances.at(-1); final.resolve(); await tick(); final.end();
assert.equal(audio.state().voicePlaying, false); assert.equal(audio.state().voicePending, 0);
assert.equal(music.volume, 0.5);
console.log('voice audio ok: gesture, queue, single channel, replacement, obsolete events, late cancellation, ducking and mute');
