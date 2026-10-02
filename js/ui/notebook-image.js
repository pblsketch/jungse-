'use strict';
/*
 * NM.ui.notebookImage — 수첩 이미지 저장 (spec §14). 장면 끝(ctx.saveImage)과 장면 도중(수첩 창)에서 연다.
 *   open(app, stageId)  1) 이름·번호 입력 창(저장하지 않음, 자동 완성 끔, 다음에 열면 빈칸)
 *                       2) NM.ui.notebookModel.image 로 데이터를 만들고 캔버스에 그린다(가로 1080px)
 *                          글꼴: 함께 넣은 NMYet(원문·옛한글)·NMSans(화면 글자). document.fonts.load 로 받은 뒤 그린다.
 *                       3) PNG(blob) → 미리 보기 창: 그림을 화면에 띄우고(길게 눌러 저장) + 내려받기 고리(a[download])
 *   last()              점검용: 마지막으로 만든 이미지 { model, texts, width, height, blobType, blobSize, inkPixels, fontsReady }
 *   draw(model, canvas) 그리기만(점검·재사용용). 그린 글 목록을 돌려준다.
 * 외부 요청 없음(blob: 주소만). 이름·번호는 어디에도 저장하지 않는다.
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);
  const el = (a, b, c) => dom.el(a, b, c);

  const W = 1080, PAD = 64, INNER = W - PAD * 2;
  const C = { paper: '#f6efe2', ink: '#2b2420', soft: '#6b5d52', seal: '#b8322a', line: '#d8c9ad', interp: '#34508a', box: '#fffaf0' };
  // css/base.css 의 --font-ui·--font-yet 과 같은 차례(NMSans 에 없는 옛한글·드문 한자는 NMYet·NMYetExt 로)
  const SANS = "'NMSans', 'NMYet', 'NMYetExt', system-ui, sans-serif";
  const YET = "'NMYet', 'NMYetExt', 'NMSans', serif";
  let lastInfo = null;

  function font(px, family, weight) { return (weight || 400) + ' ' + px + 'px ' + family; }

  // 글을 너비에 맞춰 줄로 나눈다(옛한글 음절 묶음은 쪼개지 않는다).
  function wrap(ctx, text, maxW) {
    const units = NM.core.yet.splitSyllables(String(text));
    const lines = [];
    let cur = '', lastSpace = -1;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u === '\n') { lines.push(cur); cur = ''; lastSpace = -1; continue; }
      const next = cur + u;
      if (ctx.measureText(next).width > maxW && cur) {
        if (lastSpace > 0 && u !== ' ') {
          lines.push(cur.slice(0, lastSpace));
          cur = cur.slice(lastSpace + 1) + u;
        } else {
          lines.push(cur);
          cur = u === ' ' ? '' : u;
        }
        lastSpace = -1;
        const sp = cur.lastIndexOf(' ');
        if (sp > 0) lastSpace = sp;
      } else {
        cur = next;
        if (u === ' ') lastSpace = cur.length - 1;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  // 두 번 돈다: 처음엔 높이만 재고(draw=false), 다음에 그린다.
  function layout(ctx, m, paint) {
    const texts = [];
    let y = PAD;
    const put = (text, x, yy, f, color, align) => {
      if (!paint) return;
      ctx.font = f; ctx.fillStyle = color || C.ink; ctx.textAlign = align || 'left';
      ctx.fillText(text, x, yy);
    };
    const block = (text, f, size, color, opt) => {
      const o = opt || {};
      ctx.font = f;
      const lines = wrap(ctx, text, o.maxW || INNER);
      lines.forEach(line => { y += size * 1.45; put(line, o.x || PAD, y - size * 0.35, f, color, o.align); });
      texts.push(String(text));
    };
    const gap = (h) => { y += h; };
    const rule = () => { gap(18); if (paint) { ctx.fillStyle = C.line; ctx.fillRect(PAD, y, INNER, 3); } gap(16); };
    const head = (key) => { gap(10); block(t(key), font(30, SANS, 700), 30, C.interp); gap(4); };
    const none = t('image.none');

    // 머리: 게임 제목 + 교사 모드 표시 + 상태
    if (paint) { ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, ctx.canvas.height); ctx.strokeStyle = C.seal; ctx.lineWidth = 8; ctx.strokeRect(16, 16, W - 32, ctx.canvas.height - 32); }
    block(m.gameTitle, font(64, YET), 64, C.ink);
    if (m.teacher) {
      ctx.font = font(30, SANS, 700);
      const tw = ctx.measureText(m.teacherText).width + 36;
      if (paint) {
        ctx.fillStyle = C.seal; ctx.fillRect(W - PAD - tw, PAD + 8, tw, 52);
        put(m.teacherText, W - PAD - tw / 2, PAD + 45, font(30, SANS, 700), C.paper, 'center');
      }
      texts.push(m.teacherText);
    }
    gap(6);
    block(m.stageLabel + ' · ' + m.stageName, font(42, YET), 42, C.ink);
    block(t('image.level') + ' ' + m.levelLabel + '   ·   ' + m.statusText, font(32, SANS, 700), 32, m.status === 'done' ? C.interp : C.seal);
    rule();
    block(t('image.nameNo') + '   ' + (m.name || none) + ' · ' + (m.number || none), font(32, SANS), 32);
    block(t('image.nickname') + '   ' + (m.nickname || none), font(32, SANS), 32);
    rule();
    // 패 글자와 칭호
    block(t('image.glyph') + '   ' + (m.glyph || none), font(40, YET), 40);
    block(t('image.titleLabel') + '   ' + m.title, font(32, SANS, 700), 32);
    // 기록
    head('image.record');
    block(m.stats.growthText, font(30, SANS, 700), 30);
    block(t('image.misreads') + '   ' + m.stats.misreadText, font(28, SANS), 28, C.soft);
    rule();
    head('image.items');
    if (!m.items.length) block(none, font(30, SANS), 30, C.soft);
    m.items.forEach(it => { block(it.orig + '  ' + t('notebook.arrow') + '  ' + it.modern, font(36, YET), 36); });
    head('image.translations');
    if (!m.translations.length) block(none, font(30, SANS), 30, C.soft);
    m.translations.forEach(s => block(s, font(32, YET), 32));
    head('image.rules');
    if (!m.rules.length) block(none, font(30, SANS), 30, C.soft);
    m.rules.forEach(r => { block(r.name, font(32, YET, 400), 32, C.ink); if (r.text) block(r.text, font(28, YET), 28, C.soft); });
    head('image.reflection');
    block(m.reflection || none, font(30, SANS), 30, m.reflection ? C.ink : C.soft);
    rule();
    block(t('image.createdAt') + '   ' + m.createdText, font(26, SANS), 26, C.soft);
    gap(PAD);
    return { height: Math.ceil(y), texts };
  }

  function draw(model, canvas) {
    const cv = canvas || document.createElement('canvas');
    cv.width = W; cv.height = 10;
    const ctx = cv.getContext('2d');
    const first = layout(ctx, model, false);
    cv.height = Math.max(first.height, 600);
    ctx.textBaseline = 'alphabetic';
    const out = layout(ctx, model, true);
    return { canvas: cv, texts: out.texts };
  }

  function countInk(cv) {
    try {
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 16) {
        if (Math.abs(d[i] - 0xf6) + Math.abs(d[i + 1] - 0xef) + Math.abs(d[i + 2] - 0xe2) > 60) n++;
      }
      return n;
    } catch (e) { return -1; }
  }

  function loadFonts(model) {
    const F = document.fonts;
    if (!F || typeof F.load !== 'function') return Promise.resolve(false);
    const sample = [model.gameTitle, model.stageName, model.glyph].concat(model.items.map(i => i.orig)).join('');
    return Promise.all([F.load(font(40, "'NMYet'"), sample || 'a'), F.load(font(40, "'NMYetExt'"), sample || 'a'), F.load(font(32, "'NMSans'"), 'a'), F.load(font(32, "'NMSans'", 700), 'a')])
      .then(() => F.check(font(40, "'NMYet'"), sample || 'a'))
      .catch(() => false);
  }

  function toBlob(cv) {
    return new Promise(resolve => {
      if (typeof cv.toBlob === 'function') cv.toBlob(b => resolve(b), 'image/png');
      else resolve(null);
    });
  }

  function make(app, stageId, name, number) {
    const model = UI.notebookModel.image(app.store(), stageId, { name, number, teacher: app.isTeacher(), now: new Date() });
    return loadFonts(model).then(fontsReady => {
      const r = draw(model);
      return toBlob(r.canvas).then(blob => {
        lastInfo = {
          model, texts: r.texts, width: r.canvas.width, height: r.canvas.height,
          blobType: blob ? blob.type : null, blobSize: blob ? blob.size : 0,
          inkPixels: countInk(r.canvas), fontsReady
        };
        return { model, blob };
      });
    });
  }

  function preview(model, blob, onDone) {
    const url = URL.createObjectURL(blob);
    const body = el('div', { class: 'nm-img-preview-box' }, [
      el('img', { class: 'nm-img-preview', attrs: { src: url, alt: model.stageLabel + ' ' + model.stageName + ' ' + model.statusText, width: String(W) } }),
      el('p', { class: 'nm-help', text: t('image.longPress') }),
      el('div', { class: 'nm-row nm-row-end' }, el('a', {
        class: 'nm-btn nm-btn-primary', text: t('image.download'),
        attrs: { href: url, download: model.fileName }, data: { act: 'download' }
      }))
    ]);
    dom.openModal(body, { name: 'image-preview', titleKey: 'image.previewTitle', full: true, onClose() { try { URL.revokeObjectURL(url); } catch (e) { /* 무시 */ } if (onDone) onDone(true); } });
  }

  // opts.onDone(saved): 이름·번호 창을 그냥 닫으면 false, 이미지를 만들고 미리 보기를 닫으면 true (장면 끝 저장 제안이 기다린다)
  function open(app, stageId, opts) {
    const onDone = opts && typeof opts.onDone === 'function' ? opts.onDone : null;
    if (dom.isOpen('image-form')) return null;
    const nameIn = el('input', { attrs: { id: 'nm-img-name', type: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '20', 'data-autofocus': '1' } });
    const noIn = el('input', { attrs: { id: 'nm-img-no', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '10' } });
    const err = el('p', { class: 'nm-error', attrs: { role: 'alert' } });
    const btn = dom.button(t('image.make'), 'make-image', null, { class: 'nm-btn-primary nm-btn-big', attrs: { type: 'submit' } });
    let wrap = null, busy = false;
    const form = el('form', { class: 'nm-form', attrs: { novalidate: true, autocomplete: 'off' }, on: { submit(ev) {
      ev.preventDefault();
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.textContent = t('image.making');
      const name = nameIn.value, number = noIn.value;
      make(app, stageId, name, number).then(r => {
        nameIn.value = ''; noIn.value = '';
        if (!r.blob) throw new Error('toBlob returned null');
        dom.closeModal(wrap, true);
        preview(r.model, r.blob, onDone);
      }).catch(e => {
        NM.reportError('ui.notebookImage', e);
        err.textContent = t('image.failed');
        busy = false; btn.disabled = false; btn.textContent = t('image.make');
      });
    } } }, [
      el('p', { class: 'nm-help', text: t('image.formHelp') }),
      el('label', { class: 'nm-label', text: t('image.name'), attrs: { for: 'nm-img-name' } }), nameIn,
      el('label', { class: 'nm-label', text: t('image.number'), attrs: { for: 'nm-img-no' } }), noIn,
      err, btn
    ]);
    wrap = dom.openModal(form, { name: 'image-form', titleKey: 'image.formTitle', onClose() { if (onDone) onDone(false); } });
    return wrap;
  }

  UI.notebookImage = { open, draw, make, last() { return lastInfo ? JSON.parse(JSON.stringify(lastInfo)) : null; } };
})(typeof window !== 'undefined' ? window : globalThis);
