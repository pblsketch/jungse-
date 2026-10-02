'use strict';
/*
 * NM.ui.fullscreen — 전체 화면(브라우저 주소창·위쪽 표시줄 숨기기). Fullscreen API(webkit 접두 포함)를 쓴다.
 *   supported()            이 브라우저가 쪽 전체 화면을 허락하는가(아이폰 사파리·일부 앱 안 브라우저는 아님)
 *   isOn() / enter() / exit() / toggle()
 *   button(opts)           전체 화면 단추 <button data-act="fullscreen" aria-pressed>. 켜고 끌 때 글자·상태가 저절로 바뀐다.
 *                          opts: { cls, iconOnly }  — 도구 막대는 아이콘 + 짧은 글자
 *   켜져 있으면 <html class="nm-fullscreen">. Esc 나 브라우저 단추로 나가도 상태를 따라간다.
 * 필요: ns.js, ui/app-dom.js(NM.ui.dom.t)
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const doc = root.document;
  const t = (k) => (UI.dom && UI.dom.t ? UI.dom.t(k) : k);
  const buttons = new Set();

  function current() { return doc.fullscreenElement || doc.webkitFullscreenElement || null; }
  function supported() {
    const d = doc.documentElement;
    return !!((doc.fullscreenEnabled || doc.webkitFullscreenEnabled) && (d.requestFullscreen || d.webkitRequestFullscreen));
  }
  function isOn() { return !!current(); }
  function enter() {
    const d = doc.documentElement;
    try {
      const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen();
      if (p && typeof p.catch === 'function') p.catch(() => { /* 사용자가 막았거나 허락되지 않음 — 그대로 둔다 */ });
    } catch (e) { /* 지원하지 않음 */ }
  }
  function exit() {
    try {
      const p = doc.exitFullscreen ? doc.exitFullscreen() : (doc.webkitExitFullscreen ? doc.webkitExitFullscreen() : null);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* 무시 */ }
  }
  function toggle() { if (isOn()) exit(); else enter(); }

  function icon() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'nm-fs-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = doc.createElementNS(NS, 'path');
    path.setAttribute('d', 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }
  function paint(b) {
    const on = isOn();
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const label = b.querySelector('.nm-fs-label');
    if (label) label.textContent = t(on ? 'fullscreen.exit' : 'fullscreen.enter');
  }
  function button(opts) {
    const o = opts || {};
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'nm-btn nm-fs-btn' + (o.cls ? ' ' + o.cls : '');
    b.setAttribute('data-act', 'fullscreen');
    b.appendChild(icon());
    const span = doc.createElement('span');
    span.className = 'nm-fs-label' + (o.labelCls ? ' ' + o.labelCls : '');
    b.appendChild(span);
    b.addEventListener('click', toggle);
    buttons.add(b);
    paint(b);
    return b;
  }

  function onChange() {
    doc.documentElement.classList.toggle('nm-fullscreen', isOn());
    buttons.forEach(b => { if (!doc.contains(b)) buttons.delete(b); else paint(b); });
    try { root.dispatchEvent(new root.Event('resize')); } catch (e) { /* 무시 */ }
  }
  doc.addEventListener('fullscreenchange', onChange);
  doc.addEventListener('webkitfullscreenchange', onChange);

  UI.fullscreen = { supported, isOn, enter, exit, toggle, button };
})(typeof window !== 'undefined' ? window : globalThis);
