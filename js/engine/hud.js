'use strict';
/*
 * 캔버스 위 DOM 층(#ui-layer 안): 살피기 단추, 떠 있는 조이스틱, 화면 밖 화살표, 목표 이름표, 알림 줄, DOM 창 자리.
 * 모양은 css/engine.css. 문서에 그 파일이 연결돼 있지 않으면 상대 경로로 붙인다(자기 파일만).
 *   showAct(label)        살피기 단추(대상 이름이 든 문구 — world.js 가 E.actLabel 로 만든다)
 *   setArrows(list)       화면 밖 목표: [{ id, x, y, angle, name?, dir? }] → 화살표(이름표·읽기 이름 함께)
 *   setTags(list)         화면 안 목표 '!' 위 이름표: [{ id, x, y, name }]
 *   say(text)             화면 낭독기 알림(aria-live polite, 화면에는 안 보임)
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
    const tags = mk('div', 'nm-mark-tags', hud);
    const arrows = mk('div', 'nm-arrows', hud);
    const act = mk('button', 'nm-act', hud);
    act.type = 'button'; act.id = 'nm-act'; act.hidden = true;
    const joy = mk('div', 'nm-joy', hud); joy.hidden = true;
    const knob = mk('div', 'nm-joy-knob', joy);
    const live = mk('div', 'nm-hud-live', hud);
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    const overlay = mk('div', 'nm-overlay-host', layer);
    overlay.hidden = true;
    overlay.setAttribute('data-nm-engine', 'overlay');
    els = { layer, hud, act, joy, knob, arrows, tags, live, overlay, arrowPool: [], tagPool: [] };
    return els;
  }

  // 이름표가 층 밖으로 나가지 않게 가로로 밀어 넣는다
  function keepInside(node) {
    const L = els.layer.getBoundingClientRect(), r = node.getBoundingClientRect();
    if (!r.width) return;
    let dx = 0;
    if (r.left < L.left + 4) dx = L.left + 4 - r.left;
    else if (r.right > L.right - 4) dx = L.right - 4 - r.right;
    let dy = 0;
    if (r.top < L.top + 4) dy = L.top + 4 - r.top;
    else if (r.bottom > L.bottom - 4) dy = L.bottom - 4 - r.bottom;
    if (dx || dy) node.style.translate = Math.round(dx) + 'px ' + Math.round(dy) + 'px';
  }
  function setText(node, s) { if (node.textContent !== s) node.textContent = s; }
  // 이름표끼리 겹치면 뒤의 것을 숨긴다(화면 안 '!' 이름표 먼저, 그다음 화살표 이름표). 읽기 이름(aria-label)은 그대로.
  function declutter() {
    const nodes = els.tagPool.concat(els.arrowPool.map(a => a.lastChild)).filter(n => n.getAttribute('data-want') === '1');
    nodes.forEach(n => { n.hidden = false; });
    const kept = [];
    nodes.forEach(n => {
      const r = n.getBoundingClientRect();
      if (!r.width) return;
      const hit = kept.some(k => r.left < k.right - 2 && r.right > k.left + 2 && r.top < k.bottom - 2 && r.bottom > k.top + 2);
      if (hit) n.hidden = true; else kept.push(r);
    });
  }
  function dirWord(dir) { return E.text('engine.arrow.dir.' + dir, dir); }

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
    say(text) {
      if (!els) return;
      // 같은 말을 다시 알려도 읽히도록 비웠다가 채운다
      els.live.textContent = '';
      setTimeout(() => { if (els) els.live.textContent = String(text || ''); }, 30);
    },
    // list: [{id, x, y, angle, name?, dir?}] (CSS px, 라디안)
    setArrows(list) {
      if (!els) return;
      const pool = els.arrowPool;
      while (pool.length < list.length) {
        const a = mk('div', 'nm-edge-arrow', els.arrows);
        a.setAttribute('role', 'img');
        mk('span', 'nm-edge-tip', a);
        mk('span', 'nm-edge-name', a).setAttribute('aria-hidden', 'true');
        pool.push(a);
      }
      pool.forEach((a, i) => {
        const v = list[i];
        if (!v) { a.hidden = true; a.lastChild.setAttribute('data-want', '0'); return; }
        a.hidden = false;
        a.style.left = v.x + 'px'; a.style.top = v.y + 'px';
        a.firstChild.style.transform = 'translate(-50%,-50%) rotate(' + v.angle + 'rad)';
        if (v.id) a.setAttribute('data-target', v.id);
        const name = v.name || '';
        const dir = dirWord(v.dir || 'right');
        a.setAttribute('aria-label', E.fill(E.text(name ? 'engine.arrow.label' : 'engine.arrow.unnamed', name), { name, dir }));
        a.title = name;
        // 이름표는 화살표에서 화면 가운데 쪽으로 붙인다
        const tag = a.lastChild;
        setText(tag, name);
        tag.hidden = !name;
        tag.setAttribute('data-want', name ? '1' : '0');
        const c = Math.cos(v.angle), s = Math.sin(v.angle);
        tag.style.translate = '';
        tag.style.left = Math.round(-c * 30) + 'px';
        tag.style.top = Math.round(-s * 30) + 'px';
        tag.style.transform = 'translate(' + (c > 0.35 ? '-100%' : c < -0.35 ? '0' : '-50%') + ',' + (s > 0.35 ? '-100%' : s < -0.35 ? '0' : '-50%') + ')';
        if (name) keepInside(tag);
      });
      declutter();
    },
    // list: [{id, x, y, name}] — '!' 위에 붙는 이름표(화면 안 목표)
    setTags(list) {
      if (!els) return;
      const pool = els.tagPool;
      while (pool.length < list.length) {
        const t = mk('div', 'nm-mark-tag', els.tags);
        t.setAttribute('aria-hidden', 'true');
        pool.push(t);
      }
      pool.forEach((t, i) => {
        const v = list[i];
        if (!v || !v.name) { t.hidden = true; t.setAttribute('data-want', '0'); return; }
        t.hidden = false;
        t.setAttribute('data-want', '1');
        t.setAttribute('data-target', v.id || '');
        setText(t, v.name);
        t.style.translate = '';
        t.style.left = v.x + 'px'; t.style.top = v.y + 'px';
        keepInside(t);
      });
      declutter();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
