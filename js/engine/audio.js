'use strict';
/*
 * 소리 관리 NM.engine.audio
 * - 첫 누르기/키 입력 뒤에만 시작한다(자동 재생 정책).
 * - 배경음·효과음을 따로 끈다. 다른 탭으로 가면 멈춘다.
 * - playBgm(key): NM.data.ASSETS.bgm[key] 파일을 그때 받는다. 키나 파일이 없으면 조용히 넘어간다.
 * - 효과음은 파일 없이 WebAudio 로 만든다: confirm, carve, misread, help, inspect
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};

  const st = { unlocked: false, bgmOn: true, sfxOn: true, hidden: false, bgmKey: null, bgmVolume: 0.5, sfxVolume: 0.6, lastSfx: null, bgmPlaying: false };
  let ctx = null, el = null, elKey = null;

  function bgmUrl(key) {
    const A = NM.data && NM.data.ASSETS;
    const u = A && A.bgm && A.bgm[key];
    return typeof u === 'string' && u ? u : null;
  }

  function stopEl() {
    if (el) { try { el.pause(); el.removeAttribute('src'); el.load(); } catch (e) { /* 무시 */ } }
    el = null; elKey = null; st.bgmPlaying = false;
  }

  function syncBgm() {
    const want = st.unlocked && st.bgmOn && !st.hidden && st.bgmKey && bgmUrl(st.bgmKey);
    if (!want) { if (el) { try { el.pause(); } catch (e) { /* 무시 */ } } st.bgmPlaying = false; return; }
    if (elKey !== st.bgmKey) {
      stopEl();
      el = new Audio();
      el.loop = true; el.preload = 'auto'; el.volume = st.bgmVolume;
      el.addEventListener('error', () => { stopEl(); }); // 파일이 없으면 조용히 넘어간다
      el.src = bgmUrl(st.bgmKey); elKey = st.bgmKey;
    }
    const p = el.play();
    st.bgmPlaying = true;
    if (p && typeof p.catch === 'function') p.catch(() => { st.bgmPlaying = false; });
  }

  function unlock() {
    if (st.unlocked) return;
    st.unlocked = true;
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (AC) ctx = new AC();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch (e) { ctx = null; }
    syncBgm();
  }

  function env(g, t, a, d, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(type, f0, f1, start, dur, peak) {
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.01, dur, peak * st.sfxVolume);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(start, dur, freq, peak) {
    const t = ctx.currentTime + start, n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 3;
    env(g, t, 0.004, dur, peak * st.sfxVolume);
    s.connect(f); f.connect(g); g.connect(ctx.destination);
    s.start(t); s.stop(t + dur + 0.02);
  }

  const SFX = {
    confirm() { tone('sine', 660, 660, 0, 0.12, 0.35); tone('sine', 990, 990, 0.1, 0.22, 0.35); },
    carve() { noise(0, 0.09, 1800, 0.5); tone('triangle', 180, 120, 0, 0.12, 0.4); noise(0.14, 0.07, 2200, 0.35); },
    misread() { tone('triangle', 440, 400, 0, 0.16, 0.3); tone('triangle', 330, 290, 0.14, 0.26, 0.3); },
    help() { tone('sine', 880, 880, 0, 0.3, 0.22); tone('sine', 1320, 1320, 0.08, 0.35, 0.16); },
    inspect() { tone('sine', 520, 700, 0, 0.07, 0.2); }
  };

  E.audio = {
    unlock,
    sfx(name) {
      st.lastSfx = name;
      if (!st.unlocked || !st.sfxOn || st.hidden || !ctx || !SFX[name]) return false;
      try { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); SFX[name](); return true; }
      catch (e) { NM.reportError('engine.audio.sfx', e); return false; }
    },
    playBgm(key) { st.bgmKey = key || null; try { syncBgm(); } catch (e) { stopEl(); } },
    stopBgm() { st.bgmKey = null; stopEl(); },
    setBgmEnabled(on) { st.bgmOn = !!on; syncBgm(); },
    setSfxEnabled(on) { st.sfxOn = !!on; },
    state() { return { unlocked: st.unlocked, bgmOn: st.bgmOn, sfxOn: st.sfxOn, hidden: st.hidden, bgmKey: st.bgmKey, bgmPlaying: st.bgmPlaying, hasContext: !!ctx, lastSfx: st.lastSfx }; },
    names: Object.keys(SFX)
  };

  if (typeof root.addEventListener === 'function') {
    const first = () => {
      unlock();
      root.removeEventListener('pointerdown', first, true);
      root.removeEventListener('keydown', first, true);
      root.removeEventListener('touchend', first, true);
    };
    root.addEventListener('pointerdown', first, true);
    root.addEventListener('keydown', first, true);
    root.addEventListener('touchend', first, true);
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      st.hidden = document.visibilityState === 'hidden';
      try {
        if (ctx) { if (st.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}); }
        syncBgm();
      } catch (e) { NM.reportError('engine.audio.visibility', e); }
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
