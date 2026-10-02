'use strict';
/* 부팅. 엔진(NM.engine.boot)과 화면(NM.ui.start)이 생기면 그것을 부른다. */
(function () {
  /*
   * 보이는 높이 맞추기: 휴대 전화 안 브라우저(카카오톡 등)는 window.innerHeight·100vh 가 주소 줄·아래 단추 줄에 가린 부분까지
   * 셀 때가 있어, 위쪽(장면 진행 판·도구 막대)이 화면 밖으로 밀려났다. visualViewport 높이(실제로 보이는 높이)를
   * --nm-app-h 로 두어 #app 을 그 높이로 고정한다(css/base.css). 손가락으로 확대한 동안(scale > 1)에는 바꾸지 않는다.
   * 문서는 스크롤하지 않는다: 무엇이 문서를 밀어 올렸으면(초점 이동 등) 되돌린다. 글 입력 중(화상 자판)에는 브라우저에 맡긴다.
   */
  function fitViewport() {
    try {
      const vv = window.visualViewport;
      const h = vv && (!vv.scale || vv.scale <= 1.01) ? vv.height : window.innerHeight;
      if (!h || h < 100) return;
      const html = document.documentElement;
      const v = Math.round(h) + 'px';
      if (html.style.getPropertyValue('--nm-app-h') !== v) html.style.setProperty('--nm-app-h', v);
      if (!html.hasAttribute('data-nm-vh')) html.setAttribute('data-nm-vh', '');
    } catch (e) { NM.reportError('main.viewport', e); }
  }
  function typing() {
    const a = document.activeElement;
    return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable));
  }
  function unscroll() {
    if (typing()) return;
    if (window.scrollY || window.scrollX) window.scrollTo(0, 0);
    const b = document.body;
    if (b && (b.scrollTop || b.scrollLeft)) { b.scrollTop = 0; b.scrollLeft = 0; }
  }
  function watchViewport() {
    fitViewport();
    let raf = 0;
    const later = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; fitViewport(); unscroll(); }); };
    window.addEventListener('resize', later);
    window.addEventListener('orientationchange', later);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', later);
    window.addEventListener('scroll', unscroll, { passive: true });
  }

  function start() {
    try {
      watchViewport();
      if (NM.engine && typeof NM.engine.boot === 'function') NM.engine.boot();
      if (NM.ui && typeof NM.ui.start === 'function') NM.ui.start();
    } catch (e) {
      NM.reportError('main', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
