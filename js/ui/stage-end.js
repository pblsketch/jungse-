'use strict';
/*
 * NM.ui.stageEnd — 장면 끝 차례 (spec §5-5). 통역 장면 뒤에 부른다. 퀴즈는 없다.
 *   run(env) → Promise<{ saved }>
 *     1) 새김: 통사 패에 장면의 패 글자(scene.carveGlyph, 옛한글 DOM)를 새긴다(움직임 줄이기면 정지 그림)
 *     2) 돌아보기 한 줄: 채점하지 않는다. 비워 두고 넘어가도 된다. 쓴 글은 env.setReflection(text) 로 저장
 *     3) 수첩 이미지 저장 제안: env.saveImage 가 있을 때만(U1 이 준다). 없으면 건너뛴다.
 *   각 창의 Esc·닫기는 '다음/건너뛰기/나중에'와 같다.
 * env: { scene, reducedMotion(), sfx(name), setReflection(text), saveImage?, alive() }
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js, ui/stage-window.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const REFLECT_MAX = 200;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function button(cls, key, primary) {
    const b = el('button', 'nm-st-btn ' + (primary ? 'nm-st-primary ' : '') + cls, TX().t(key));
    b.type = 'button';
    return b;
  }

  function carve(env) {
    return new Promise(resolve => {
      NM.ui.stageWindow.open({
        win: 'carve', title: TX().t('win.carve'), className: 'nm-st-endwin',
        build(w) {
          const plate = el('div', 'nm-st-plate' + (env.reducedMotion() ? ' is-still' : ''));
          const g = el('span', 'nm-st-glyph nm-yet');
          g.appendChild(YB().build(env.scene.carveGlyph || '', {}));
          plate.appendChild(g);
          w.body.appendChild(plate);
          w.body.appendChild(el('p', 'nm-st-end-text', TX().t('carve')));
          const next = button('nm-st-next', 'btn.next', true);
          next.addEventListener('click', () => w.close('next'));
          w.foot.appendChild(next);
          env.sfx('carve');
        },
        onClose() { resolve(); }
      });
    });
  }

  function reflect(env) {
    return new Promise(resolve => {
      let input = null;
      NM.ui.stageWindow.open({
        win: 'reflect', title: TX().t('win.reflect'), className: 'nm-st-endwin',
        build(w) {
          const id = 'nm-st-reflect-' + Date.now();
          const lab = el('label', 'nm-st-end-text', TX().t('reflectAsk'));
          lab.setAttribute('for', id);
          w.body.appendChild(lab);
          input = el('textarea', 'nm-st-reflect-input');
          input.id = id;
          input.rows = 2;
          input.maxLength = REFLECT_MAX;
          input.placeholder = TX().t('reflectPlaceholder');
          w.body.appendChild(input);
          const skip = button('nm-st-skip', 'btn.skip');
          skip.addEventListener('click', () => { input.value = ''; w.close('skip'); });
          const next = button('nm-st-next', 'btn.done', true);
          next.addEventListener('click', () => w.close('next'));
          w.foot.appendChild(skip);
          w.foot.appendChild(next);
        },
        onClose(reason) {
          const text = reason === 'next' && input ? input.value.trim().slice(0, REFLECT_MAX) : '';
          if (text) env.setReflection(text);
          resolve();
        }
      });
    });
  }

  function offerSave(env) {
    if (typeof env.saveImage !== 'function') return Promise.resolve(false);
    return new Promise(resolve => {
      NM.ui.stageWindow.open({
        win: 'save', title: TX().t('win.save'), className: 'nm-st-endwin',
        build(w) {
          w.body.appendChild(el('p', 'nm-st-end-text', TX().t('saveAsk')));
          const later = button('nm-st-later', 'btn.later');
          later.addEventListener('click', () => w.close('later'));
          const save = button('nm-st-save', 'btn.save', true);
          save.addEventListener('click', () => w.close('save'));
          w.foot.appendChild(later);
          w.foot.appendChild(save);
        },
        onClose(reason) {
          if (reason !== 'save') { resolve(false); return; }
          let p;
          try { p = env.saveImage(); } catch (e) { NM.reportError('stage.saveImage', e); }
          Promise.resolve(p).then(() => resolve(true), (e) => { NM.reportError('stage.saveImage', e); resolve(false); });
        }
      });
    });
  }

  // env.alive() 가 거짓이 되면(장면을 나가 정리됨) 다음 창을 열지 않는다
  function run(env) {
    const alive = () => typeof env.alive !== 'function' || env.alive();
    return carve(env)
      .then(() => (alive() ? reflect(env) : null))
      .then(() => (alive() ? offerSave(env) : false))
      .then((s) => ({ saved: !!s, aborted: !alive() }));
  }

  NM.ui.stageEnd = { run };
})(typeof window !== 'undefined' ? window : globalThis);
