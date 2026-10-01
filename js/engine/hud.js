'use strict';
/*
 * 캔버스 위 DOM 층(#ui-layer 안): 살피기 단추, 떠 있는 조이스틱, 화면 밖 화살표, DOM 창 자리.
 * 모양은 css/engine.css. 문서에 그 파일이 연결돼 있지 않으면 상대 경로로 붙인다(자기 파일만).
 */
(function (root) {
  const NM = root.NM || (root.NM = {});
  const E = NM.engine = NM.engine || {};
  let els = null;

  function ensureCss() {
    if (document.querySelector('link[href$="engine.css"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = 'css/engine.css';
    document.head.appendChild(l);
  }

  function mk(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function init() {
    if (els) return els;
    ensureCss();
    let layer = document.getElementById('ui-layer');
    if (!layer) { layer = mk('div', '', document.getElementById('app') || document.body); layer.id = 'ui-layer'; }
    const hud = mk('div', 'nm-hud', layer);
    hud.setAttribute('data-nm-engine', 'hud');
    const act = mk('button', 'nm-act', hud);
    act.type = 'button'; act.id = 'nm-act'; act.hidden = true;
    const joy = mk('div', 'nm-joy', hud); joy.hidden = true;
    const knob = mk('div', 'nm-joy-knob', joy);
    const arrows = mk('div', 'nm-arrows', hud);
    const overlay = mk('div', 'nm-overlay-host', layer);
    overlay.hidden = true;
    overlay.setAttribute('data-nm-engine', 'overlay');
    els = { layer, hud, act, joy, knob, arrows, overlay, arrowPool: [] };
    return els;
  }

  E.hud = {
    init,
    get els() { return els; },
    showAct(label) {
      if (!els) return;
      if (els.act.textContent !== label) els.act.textContent = label;
      els.act.hidden = false;
    },
    hideAct() { if (els) els.act.hidden = true; },
    joyShow(x, y) { if (!els) return; els.joy.style.left = x + 'px'; els.joy.style.top = y + 'px'; els.knob.style.transform = 'translate(-50%,-50%)'; els.joy.hidden = false; },
    joyKnob(dx, dy) { if (els) els.knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))'; },
    joyHide() { if (els) els.joy.hidden = true; },
    // list: [{x, y, angle}] (CSS px, 라디안)
    setArrows(list) {
      if (!els) return;
      const pool = els.arrowPool;
      while (pool.length < list.length) pool.push(mk('div', 'nm-edge-arrow', els.arrows));
      pool.forEach((a, i) => {
        const v = list[i];
        if (!v) { a.hidden = true; return; }
        a.hidden = false;
        a.style.left = v.x + 'px'; a.style.top = v.y + 'px';
        a.style.transform = 'translate(-50%,-50%) rotate(' + v.angle + 'rad)';
        if (v.id) a.setAttribute('data-target', v.id);
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
