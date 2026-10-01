'use strict';
/* 부팅. 엔진(NM.engine.boot)과 화면(NM.ui.start)이 생기면 그것을 부른다. */
(function () {
  function start() {
    try {
      if (NM.engine && typeof NM.engine.boot === 'function') NM.engine.boot();
      if (NM.ui && typeof NM.ui.start === 'function') NM.ui.start();
    } catch (e) {
      NM.reportError('main', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
