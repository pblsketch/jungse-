'use strict';
/*
 * NM.ui.stageWindow — 지도 위에 열리는 DOM 창(엔진 openOverlay 위). 창이 열려 있는 동안 지도는 멈춘다.
 *   open({ win, kind, title, eyebrow?, data:{key:value}, closable(기본 true), build(창), onClose(reason) }) → 창
 *     title: 글 또는 DOM(<h2 class="nm-st-title"> 안 .nm-st-title-main). eyebrow: 제목 위 작은 갈래 글(.nm-st-eyebrow)
 *     build 는 지도 위에 올리기 전에 부른다(내용을 채운 뒤 연다).
 *     창 = { el, body, foot, close(reason), isOpen(), focus(el?) }
 *     focus(el) 은 그 요소로, focus() 는 아래 '처음 초점' 규칙대로 옮긴다.
 *     el: <section class="nm-st-win" data-win role="dialog" aria-modal="true">
 *   top(), closeAll(), count()
 * 키보드: 맨 위 창 안에서 Tab/Shift+Tab 이 돈다(창 밖으로 나가지 않음). Esc 는 맨 위 창만 닫는다(closable 일 때).
 * 여러 창이 겹치면 아래 창은 inert(누르기·초점 막힘)가 된다. 닫으면 연 단추로 초점을 돌려준다.
 * onClose(reason): 'button'(×) | 'esc' | 'all'(closeAll — 진행기 정리 중) | 'external'(엔진 closeOverlay 로 닫힘) | 부른 쪽이 준 값.
 * 닫기 단추(×)는 DOM 끝에 두고 css 로 오른쪽 위에 놓는다(Tab 순서는 내용 → ×).
 * 스크롤: 머리글(제목·×)과 아래 단추 줄(foot)은 제자리, 본문(body)만 스크롤한다(css/stage.css) → 긴 창에서도 ×가 보인다.
 * 처음 초점: 스크롤하지 않고 보이는 첫 단추(본문 첫 화면이나 아래 단추 줄 안). 그런 단추가 없으면 제목(h2, tabindex -1).
 *   초점 때문에 본문이 저절로 내려가 위 내용을 가리는 일이 없게 한다(preventScroll, 본문 scrollTop 0).
 * 필요: ns.js, engine/api.js, ui/stage-text.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const stack = [];
  let seq = 0;
  let keysWired = false;

  const FOCUSABLE = 'button:not([disabled]):not([hidden]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), e => e.offsetParent !== null || e === document.activeElement);
  }

  function top() { return stack.length ? stack[stack.length - 1] : null; }

  function onKey(e) {
    const w = top();
    if (!w) return;
    // 다른 화면(U1 의 창 등)이 위에 올라와 있으면 그쪽 몫이다
    const host = w.el.parentNode;
    if (!host || host.lastElementChild !== w.el) return;
    if (e.key === 'Escape') {
      if (w.closable) { e.preventDefault(); e.stopPropagation(); w.close('esc'); }
      return;
    }
    if (e.key === 'Tab') {
      const list = focusables(w.el);
      if (!list.length) { e.preventDefault(); w.el.focus(); return; }
      const i = list.indexOf(document.activeElement);
      let next;
      if (e.shiftKey) next = i <= 0 ? list[list.length - 1] : list[i - 1];
      else next = i < 0 || i >= list.length - 1 ? list[0] : list[i + 1];
      e.preventDefault();
      next.focus();
    }
  }

  // 다른 코드가 NM.engine.closeOverlay 로 창을 직접 닫아도 목록을 맞춘다(onClose 는 reason 'external')
  function prune() {
    stack.slice().forEach(w => { if (!w.el.isConnected) w.close('external'); });
  }

  function wireKeys() {
    if (keysWired) return;
    keysWired = true;
    document.addEventListener('keydown', onKey, true);
    if (NM.engine && typeof NM.engine.on === 'function') NM.engine.on('overlay', prune);
  }

  function setInert(el, on) {
    if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
    else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
  }

  function open(o) {
    wireKeys();
    const doc = document;
    const id = 'nm-st-win-' + (++seq);
    const el = doc.createElement('section');
    el.className = 'nm-st-win' + (o.className ? ' ' + o.className : '');
    el.setAttribute('data-win', o.win || 'window');
    if (o.kind) el.setAttribute('data-kind', o.kind);
    Object.keys(o.data || {}).forEach(k => el.setAttribute('data-' + k, o.data[k]));
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('tabindex', '-1');
    const head = doc.createElement('header');
    head.className = 'nm-st-head';
    const h = doc.createElement('h2');
    h.className = 'nm-st-title';
    h.id = id + '-t';
    h.setAttribute('tabindex', '-1');
    // 작은 윗글(eyebrow): 창 갈래('해독'·'과제'·'조사'). 제목은 지금 할 일(항목 이름·장소 이름)
    if (o.eyebrow != null && o.eyebrow !== '') {
      const eb = doc.createElement('span');
      eb.className = 'nm-st-eyebrow';
      eb.appendChild(doc.createTextNode(String(o.eyebrow)));
      h.appendChild(eb);
      h.classList.add('has-eyebrow');
    }
    const main = doc.createElement('span');
    main.className = 'nm-st-title-main';
    if (o.title && o.title.nodeType) main.appendChild(o.title);
    else main.appendChild(doc.createTextNode(o.title == null ? '' : String(o.title)));
    h.appendChild(main);
    head.appendChild(h);
    el.setAttribute('aria-labelledby', h.id);
    const body = doc.createElement('div');
    body.className = 'nm-st-body';
    const foot = doc.createElement('div');
    foot.className = 'nm-st-foot';
    el.appendChild(head); el.appendChild(body); el.appendChild(foot);
    const closable = o.closable !== false;
    if (closable) {
      const x = doc.createElement('button');
      x.type = 'button';
      x.className = 'nm-st-close';
      x.setAttribute('aria-label', TX().t('btn.close'));
      x.appendChild(doc.createTextNode('×'));
      x.addEventListener('click', () => w.close('button'));
      el.appendChild(x);
    }

    const opener = doc.activeElement;
    let open = true;
    const w = {
      el, body, foot, closable,
      isOpen: () => open,
      focus(target) {
        try {
          if (target) target.focus();
          else focusStart();
        } catch (e) { /* 초점 실패는 무시 */ }
      },
      close(reason) {
        if (!open) return;
        open = false;
        const i = stack.indexOf(w);
        if (i >= 0) stack.splice(i, 1);
        if (reason !== 'external') {
          try { NM.engine.closeOverlay(el); } catch (e) { NM.reportError('stageWindow.close', e); }
        }
        const nt = top();
        if (nt) {
          setInert(nt.el, false);
          if (opener && nt.el.contains(opener) && doc.contains(opener)) { try { opener.focus(); } catch (e) { /* 무시 */ } }
          else nt.focus();
        }
        if (typeof o.onClose === 'function') {
          try { o.onClose(reason || 'code'); } catch (e) { NM.reportError('stageWindow.onClose', e); }
        }
      }
    };
    if (typeof o.build === 'function') {
      try { o.build(w); } catch (e) { NM.reportError('stageWindow.build', e); }
    }
    // 처음 초점: 본문을 스크롤하지 않고 보이는 첫 단추, 없으면 제목
    function inView(e) {
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      if (!body.contains(e)) return true; // 머리글·아래 단추 줄은 늘 보인다
      const b = body.getBoundingClientRect();
      return r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
    }
    function focusStart() {
      const first = focusables(el).filter(e => e.className !== 'nm-st-close').find(inView);
      const target = first || h;
      try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    }
    const prev = top();
    if (prev) setInert(prev.el, true);
    stack.push(w);
    NM.engine.openOverlay(el);
    body.scrollTop = 0;
    focusStart();
    return w;
  }

  function closeAll() { while (stack.length) top().close('all'); }

  NM.ui.stageWindow = { open, top, closeAll, count: () => stack.length };
})(typeof window !== 'undefined' ? window : globalThis);
