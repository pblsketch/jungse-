'use strict';
/*
 * NM.ui.dialog — 대사 창과 대사 줄.
 *   play(lines, { kind, title, env, extras }) → Promise<'end'|'esc'>
 *     한 줄씩 보인다('다음' 단추·Enter). Esc 는 남은 대사를 넘기고 닫는다. extras: 줄 위에 늘 보이는 요소 배열
 *     (원문 카드·虛 카드·아직 확인하지 않은 규칙 카드 등). 대사가 없고 extras 만 있으면 한 쪽만 보인다.
 *   lineEl(line, env) → 대사 한 줄 요소(맥락 창에서 대사를 한꺼번에 보일 때)
 * 대사 줄: 문자열(해설) 또는 { who, text, portrait, fiction, mark, src }
 *   who: 'me'(주인공 — 별명 또는 '통사'), 'senior'·'sejong'·'narrator'(TEXT.stage.speakers), 또는 scene.cast 의 키
 *   text: 장면 데이터 표기(옛한글·루비·꾸밈) + 별명 자리 <@> <@이> …
 *   fiction: true 면 이름 옆에 '게임 설정 · 虛' 표지. scene.fiction 의 카드 id 면 그 카드를 줄 아래에 붙이고,
 *            처음 나올 때만 "실제로는 →" 을 함께 보인다(본 것은 store.markNotice('fiction:<id>')).
 *   mark: 'know'|'variant'|'interp'|'explain' 이면 대사 대신 표지 카드로 보인다(src 는 출처).
 *   portrait: NM.data.ASSETS.portraits 의 키(없으면 cast[who].portrait → who). 그림이 없으면 이름 첫 글자 동그라미.
 * env: 진행기가 주는 { scene, store, teacher, fill(text), callName(), solved(), seenFiction(id), markFiction(id) }
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js, ui/marker.js, ui/stage-window.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const MK = () => NM.ui.marker;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }

  function speaker(who, env) {
    if (!who || who === 'narrator') return { name: '', portrait: null };
    if (who === 'me') return { name: env && env.callName ? env.callName() : TX().t('call'), portrait: 'me' };
    const cast = env && env.scene && env.scene.cast && env.scene.cast[who];
    if (cast) return { name: cast.name || '', portrait: cast.portrait || who };
    const fixed = TX().has('speakers.' + who);
    if (fixed !== undefined) return { name: fixed, portrait: who };
    NM.reportError('stage.dialog', 'unknown speaker: ' + who);
    return { name: '', portrait: null };
  }

  // 초상 키 찾기: 'me' → 고른 주인공(hero_<번호>), 'senior' → senior_tongsa. 그다음 <키>_<표정> → <키>_neutral → <키>.
  const PORTRAIT_ALIAS = { senior: 'senior_tongsa' };
  function portraitSrc(key, env, expr) {
    const P = NM.data.ASSETS && NM.data.ASSETS.portraits;
    if (!key || !P) return null;
    let base = key;
    if (key === 'me') {
      const rec = env && env.store && env.store.get ? env.store.get() : null;
      const n = env && env.teacher ? 1 : (rec && rec.protagonist) || 1;
      base = 'hero_' + n;
    } else if (PORTRAIT_ALIAS[key]) base = PORTRAIT_ALIAS[key];
    const tries = [expr ? base + '_' + expr : null, base + '_neutral', base, key];
    for (const k of tries) if (k && typeof P[k] === 'string') return P[k];
    return null;
  }

  function portraitEl(key, name, env, expr) {
    const box = el('span', 'nm-dlg-portrait');
    box.setAttribute('aria-hidden', 'true');
    const src = portraitSrc(key, env, expr);
    if (src) {
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.decoding = 'async';
      box.appendChild(img);
    } else {
      box.classList.add('is-mono');
      box.appendChild(document.createTextNode(name ? Array.from(name)[0] : '·'));
    }
    return box;
  }

  function richText(text, env) {
    const span = el('span', 'nm-st-text');
    const filled = env && env.fill ? env.fill(text) : String(text == null ? '' : text);
    span.appendChild(YB().build(filled, { solved: env && env.solved ? env.solved() : [] }));
    return span;
  }

  function fictionCard(id, env) {
    const list = env && env.scene && Array.isArray(env.scene.fiction) ? env.scene.fiction : [];
    const f = list.filter(x => x && x.id === id)[0];
    if (!f) { NM.reportError('stage.dialog', 'unknown fiction card: ' + id); return null; }
    const first = !(env.seenFiction && env.seenFiction(id));
    const c = MK().card({ kind: 'fiction', text: f.text, real: f.real, showReal: first, fill: env.fill });
    if (first && env.markFiction) env.markFiction(id);
    return c;
  }

  function lineEl(line, env) {
    const ln = typeof line === 'string' ? { text: line } : (line || {});
    if (ln.mark) {
      const c = MK().card({ kind: ln.mark, text: ln.text, src: ln.src, fill: env && env.fill, solved: env && env.solved ? env.solved() : [] });
      c.classList.add('nm-dlg-line', 'is-card');
      return c;
    }
    const sp = speaker(ln.who, env);
    const row = el('div', 'nm-dlg-line' + (sp.name ? '' : ' is-narration'));
    if (sp.name) row.appendChild(portraitEl(ln.portrait || sp.portrait, sp.name, env, ln.expr));
    const main = el('div', 'nm-dlg-main');
    if (sp.name) {
      const who = el('span', 'nm-dlg-who', sp.name);
      if (ln.fiction) { who.appendChild(document.createTextNode(' ')); who.appendChild(MK().badge('fiction')); }
      main.appendChild(who);
    }
    const p = el('p', 'nm-dlg-text');
    p.appendChild(richText(ln.text, env));
    main.appendChild(p);
    if (typeof ln.fiction === 'string') { const c = fictionCard(ln.fiction, env); if (c) main.appendChild(c); }
    row.appendChild(main);
    return row;
  }

  function play(lines, opts) {
    const o = opts || {};
    const list = Array.isArray(lines) ? lines.filter(x => x != null) : [];
    const extras = Array.isArray(o.extras) ? o.extras.filter(Boolean) : [];
    if (!list.length && !extras.length) return Promise.resolve('end');
    return new Promise(resolve => {
      let i = 0;
      let stage = null, next = null;
      const pages = list.length || 1;
      function show() {
        stage.textContent = '';
        if (list.length) stage.appendChild(lineEl(list[i], o.env));
        next.textContent = TX().t('btn.next');
      }
      NM.ui.stageWindow.open({
        win: 'dialog', kind: o.kind || 'dialog', title: o.title || TX().t('win.dialog'),
        className: 'nm-st-dialog',
        build(w) {
          if (extras.length) {
            const box = el('div', 'nm-dlg-extras');
            extras.forEach(x => box.appendChild(x));
            w.body.appendChild(box);
          }
          stage = el('div', 'nm-dlg-stage');
          stage.setAttribute('aria-live', 'polite');
          w.body.appendChild(stage);
          next = el('button', 'nm-st-btn nm-st-primary nm-dlg-next');
          next.type = 'button';
          next.addEventListener('click', () => {
            if (i < pages - 1) { i++; show(); next.focus(); }
            else w.close('end');
          });
          w.foot.appendChild(next);
          show();
        },
        onClose(reason) { resolve(reason === 'end' ? 'end' : 'esc'); }
      });
    });
  }

  NM.ui.dialog = { play, lineEl, speaker };
})(typeof window !== 'undefined' ? window : globalThis);
