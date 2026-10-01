'use strict';
/*
 * NM.ui.dom — 화면 코드가 함께 쓰는 작은 도구.
 *   t(key, vars)          NM.data.TEXT.ui 의 문구(점 경로). %이름% 을 vars 값으로 바꾼다. 없는 열쇠는 오류로 보고한다.
 *   el(tag, props, kids)  요소 만들기. props: class, text, attrs{}, on{}, data{}. innerHTML 은 쓰지 않는다.
 *   button(text, act, onClick, extra)  data-act 가 붙은 단추(type=button)
 *   yet(text, opts)       옛한글 표기 → DOM(.nm-yet, 화면 낭독기용 현대 읽기 함께)
 *   openModal(node, opts) / closeModal(wrap)  창. 엔진 창 자리(NM.engine.openOverlay)가 있으면 그곳에 띄운다.
 * 화면 문구는 이 파일에 두지 않는다.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};

  function lookup(key) {
    const T = NM.data && NM.data.TEXT && NM.data.TEXT.ui;
    if (!T) return undefined;
    return String(key).split('.').reduce((o, k) => (o != null && typeof o === 'object') ? o[k] : undefined, T);
  }
  function fill(s, vars) {
    if (!vars) return s;
    return s.replace(/%(\w+)%/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
  }
  function t(key, vars) {
    const v = lookup(key);
    if (typeof v === 'string') return fill(v, vars);
    if (typeof v === 'number') return String(v);
    NM.reportError('ui.text', 'missing text key ' + key);
    return String(key);
  }
  function has(key) { const v = lookup(key); return typeof v === 'string'; }

  function el(tag, props, kids) {
    const e = document.createElement(tag);
    const p = props || {};
    if (p.class) e.className = p.class;
    if (p.text !== undefined && p.text !== null) e.textContent = String(p.text);
    if (p.attrs) Object.keys(p.attrs).forEach(k => { const v = p.attrs[k]; if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : String(v)); });
    if (p.data) Object.keys(p.data).forEach(k => { if (p.data[k] !== undefined && p.data[k] !== null) e.setAttribute('data-' + k, String(p.data[k])); });
    if (p.on) Object.keys(p.on).forEach(k => e.addEventListener(k, guard(p.on[k], 'ui.' + k)));
    append(e, kids);
    return e;
  }
  function append(e, kids) {
    if (kids === undefined || kids === null || kids === false) return e;
    if (Array.isArray(kids)) { kids.forEach(k => append(e, k)); return e; }
    if (typeof kids === 'string' || typeof kids === 'number') e.appendChild(document.createTextNode(String(kids)));
    else e.appendChild(kids);
    return e;
  }
  function clear(e) { while (e && e.firstChild) e.removeChild(e.firstChild); return e; }

  // 사건 처리기에서 난 오류를 오류 모음으로 보낸다.
  function guard(fn, where) {
    return function (ev) {
      try { return fn.call(this, ev); } catch (err) { NM.reportError(where || 'ui', err); return undefined; }
    };
  }

  function button(text, act, onClick, extra) {
    const x = extra || {};
    const attrs = Object.assign({ type: 'button' }, x.attrs || {});
    if (x.pressed !== undefined) attrs['aria-pressed'] = x.pressed ? 'true' : 'false';
    if (x.disabled) attrs.disabled = true;
    const data = Object.assign({ act: act }, x.data || {});
    return el('button', { class: 'nm-btn' + (x.class ? ' ' + x.class : ''), attrs, data, on: onClick ? { click: onClick } : null }, x.kids !== undefined ? x.kids : text);
  }

  function settingsBangjeom() {
    const y = NM.core && NM.core.yet;
    return y && y.settings ? y.settings.bangjeom !== false : true;
  }
  // 옛한글 표기 글. 보이는 글은 낭독기에서 숨기고, 현대 읽기를 따로 둔다.
  function yet(text, opts) {
    const o = opts || {};
    const wrap = el('span', { class: 'nm-yet-wrap' + (o.class ? ' ' + o.class : '') });
    const shown = el('span', { class: 'nm-yet', attrs: { 'aria-hidden': 'true', lang: 'ko' } });
    const Y = NM.core && NM.core.yet;
    let reading = String(text == null ? '' : text);
    if (Y) {
      try {
        shown.appendChild(Y.buildDom(String(text == null ? '' : text), { document, bangjeom: o.bangjeom !== undefined ? o.bangjeom : settingsBangjeom() }));
        reading = Y.modernReading(String(text == null ? '' : text), { modern: o.modern });
      } catch (err) {
        NM.reportError('ui.yet', err);
        shown.textContent = String(text == null ? '' : text);
      }
    } else shown.textContent = reading;
    wrap.appendChild(shown);
    wrap.appendChild(el('span', { class: 'nm-sr', text: reading }));
    return wrap;
  }

  /* ---------- 창 ---------- */
  let ownHost = null;
  const openList = [];
  function host() {
    if (ownHost && document.contains(ownHost)) return ownHost;
    const layer = document.getElementById('ui-layer') || document.body;
    ownHost = el('div', { class: 'nm-modal-host', attrs: { hidden: true } });
    layer.appendChild(ownHost);
    return ownHost;
  }
  function useEngine() { return !!(NM.engine && typeof NM.engine.openOverlay === 'function' && typeof NM.engine.closeOverlay === 'function'); }

  function focusFirst(node) {
    const f = node.querySelector('[data-autofocus], input, select, textarea, button:not([disabled]), [href]');
    try { (f || node).focus(); } catch (e) { /* 초점 실패는 무시 */ }
  }

  // node: 창 안 내용. opts: { name, titleKey|title, onClose, closable(기본 참), full(꽉 찬 창) }
  function openModal(node, opts) {
    const o = opts || {};
    const titleId = 'nm-modal-title-' + (openList.length + 1) + '-' + Math.floor(Math.random() * 1e6);
    const panel = el('div', { class: 'nm-panel' + (o.full ? ' nm-panel-full' : '') });
    const head = el('div', { class: 'nm-panel-head' });
    head.appendChild(el('h2', { class: 'nm-panel-title', text: o.title !== undefined ? o.title : (o.titleKey ? t(o.titleKey) : ''), attrs: { id: titleId } }));
    const closable = o.closable !== false;
    if (closable) head.appendChild(button(t('close'), 'close', () => closeModal(wrap), { class: 'nm-btn-close' }));
    panel.appendChild(head);
    const body = el('div', { class: 'nm-panel-body' });
    body.appendChild(node);
    panel.appendChild(body);
    const wrap = el('div', {
      class: 'nm-modal',
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      data: { modal: o.name || 'modal' }
    }, panel);
    wrap.__nmOnClose = o.onClose || null;
    wrap.__nmBody = body;
    wrap.addEventListener('keydown', guard(function (ev) {
      if (ev.key === 'Escape' && closable) { ev.stopPropagation(); ev.preventDefault(); closeModal(wrap); }
      else if (ev.key === 'Tab') trapTab(ev, wrap);
    }, 'ui.modal.key'));
    openList.push(wrap);
    if (useEngine()) {
      wrap.__nmEngine = true;
      NM.engine.openOverlay(wrap);
      focusFirst(wrap);
    } else {
      wrap.__nmPrev = document.activeElement;
      const h = host();
      h.appendChild(wrap);
      h.hidden = false;
      focusFirst(wrap);
    }
    return wrap;
  }
  function trapTab(ev, wrap) {
    const list = Array.prototype.filter.call(wrap.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      n => !n.disabled && n.offsetParent !== null);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }
  function closeModal(wrap, silent) {
    const w = wrap || openList[openList.length - 1];
    if (!w) return false;
    const i = openList.indexOf(w);
    if (i < 0) return false;
    openList.splice(i, 1);
    if (w.__nmEngine) NM.engine.closeOverlay(w);
    else {
      if (w.parentNode) w.parentNode.removeChild(w);
      if (ownHost && !ownHost.firstChild) ownHost.hidden = true;
      const prev = w.__nmPrev;
      if (prev && prev.focus && document.contains(prev)) { try { prev.focus(); } catch (e) { /* 무시 */ } }
    }
    if (!silent && typeof w.__nmOnClose === 'function') {
      try { w.__nmOnClose(); } catch (err) { NM.reportError('ui.modal.onClose', err); }
    }
    return true;
  }
  function closeAll() { while (openList.length) closeModal(openList[openList.length - 1], true); }
  function modals() { return openList.slice(); }
  function isOpen(name) { return openList.some(w => w.getAttribute('data-modal') === name); }

  UI.dom = { t, has, el, append, clear, guard, button, yet, openModal, closeModal, closeAll, modals, isOpen };
})(typeof window !== 'undefined' ? window : globalThis);
