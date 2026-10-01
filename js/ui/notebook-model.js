'use strict';
/*
 * NM.ui.notebookModel — 해독 수첩 화면과 수첩 이미지가 그릴 데이터(DOM 없음, 저장소에 쓰지 않음).
 *   stageLabel(id) / stageName(id) / sceneOf(id) / carveGlyph(id)
 *   view(store, stageId)  → 수첩 화면: 확정 항목(표기 그대로), 옮긴 구절, 돌아보기, 얻은 규칙 카드(지금 학교급 전체),
 *                           아직 확인하지 않은 규칙(배우는 장면 이름과 함께), 옛글자 도감(만남 여부)
 *   image(store, stageId, { name, number, teacher, now }) → 수첩 이미지(spec §14): 모든 글은 렌더된 평문.
 *                           이름·번호는 이 값에만 들어가고 어디에도 저장하지 않는다.
 * 읽는 데이터(없어도 된다):
 *   NM.data.SCENES[id]      장면 데이터(spec §19-3). title, carveGlyph, items[{id, kind, word|label, cards}], translate
 *                           확정 항목의 원문 글은 item.word(없으면 item.label)를 쓴다. 현대어는 정답 카드 text.
 *                           옮긴 구절 글: translate(배열 또는 {lines}) / translations 안에서 같은 id 의 text|modern.
 *   NM.data.RULE_CARDS[id]  { id, name, text, stage }
 *   NM.data.DOGAM[key]      { glyph, name, note, stage }
 *   NM.data.STAGES[id].carveGlyph (장면 데이터에 패 글자가 없을 때)
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const D = NM.data;
  const t = (k, v) => UI.dom.t(k, v);
  const DONE = ['confirmed', 'confirmedByHelp'];
  const ALWAYS_BANGJEOM = ['s4', 's10'];

  const sceneOf = (id) => (D.SCENES && D.SCENES[id]) || null;
  const stageLabel = (id) => (UI.dom.has('stageLabels.' + id) ? t('stageLabels.' + id) : String(id));
  function stageName(id) {
    const s = sceneOf(id);
    return s && typeof s.title === 'string' && s.title ? s.title : stageLabel(id);
  }
  function carveGlyph(id) {
    const s = sceneOf(id);
    if (s && typeof s.carveGlyph === 'string' && s.carveGlyph) return s.carveGlyph;
    const st = D.STAGES && D.STAGES[id];
    return st && typeof st.carveGlyph === 'string' ? st.carveGlyph : '';
  }
  const stageIds = () => (D.STAGE_IDS || []).slice();

  function bangjeomFor(store, stageId) {
    if (ALWAYS_BANGJEOM.indexOf(stageId) >= 0) return true;
    const s = store.get().settings;
    return !s || s.bangjeom !== false;
  }

  function confirmedItems(store, stageId) {
    const sc = sceneOf(stageId);
    const prog = store.stage(stageId);
    if (!sc || !Array.isArray(sc.items)) return [];
    const out = [];
    sc.items.forEach(it => {
      if (!it || it.kind !== 'read') return;
      const rec = prog.items[it.id];
      if (!rec || DONE.indexOf(rec.state) < 0) return;
      const right = (it.cards || []).filter(c => c && c.correct === true)[0];
      out.push({ id: it.id, word: typeof it.word === 'string' ? it.word : (typeof it.label === 'string' ? it.label : ''), modern: right && typeof right.text === 'string' ? right.text : '', byHelp: rec.state === 'confirmedByHelp' });
    });
    return out;
  }

  function translationLines(sc) {
    if (!sc) return [];
    const src = [];
    [sc.translate, sc.translations].forEach(x => {
      if (Array.isArray(x)) src.push.apply(src, x);
      else if (x && Array.isArray(x.lines)) src.push.apply(src, x.lines);
    });
    return src.filter(l => l && typeof l === 'object');
  }
  function translations(store, stageId) {
    const lines = translationLines(sceneOf(stageId));
    return store.stage(stageId).translations.map(id => {
      const l = lines.filter(x => x.id === id)[0];
      const text = l ? (typeof l.text === 'string' ? l.text : (typeof l.modern === 'string' ? l.modern : id)) : id;
      return { id, text };
    });
  }

  function ruleCard(id) {
    const c = D.RULE_CARDS && D.RULE_CARDS[id];
    return { id, name: c && c.name ? String(c.name) : id, text: c && c.text ? String(c.text) : '', stage: c && c.stage ? String(c.stage) : '' };
  }
  function learnedRuleIds(store) {
    const out = [];
    stageIds().forEach(sid => store.stage(sid).rules.forEach(r => { if (out.indexOf(r) < 0) out.push(r); }));
    return out;
  }
  function stageDone(store, sid) { return !!sid && store.stage(sid).status === 'done'; }

  function view(store, stageId) {
    const prog = store.stage(stageId);
    const learned = learnedRuleIds(store);
    const all = D.RULE_CARDS ? Object.keys(D.RULE_CARDS) : [];
    return {
      stageId,
      stageLabel: stageLabel(stageId),
      stageName: stageName(stageId),
      status: prog.status,
      items: confirmedItems(store, stageId),
      translations: translations(store, stageId),
      reflection: prog.reflection || '',
      rulesLearned: learned.map(ruleCard),
      rulesUnlearned: all.filter(id => learned.indexOf(id) < 0).map(id => {
        const c = ruleCard(id);
        return Object.assign(c, { stageName: c.stage ? stageName(c.stage) : '' });
      }),
      dogam: D.DOGAM ? Object.keys(D.DOGAM).map(key => {
        const g = D.DOGAM[key] || {};
        const stage = g.stage ? String(g.stage) : '';
        return { key, glyph: String(g.glyph || ''), name: String(g.name || ''), note: String(g.note || ''), stage, stageName: stage ? stageName(stage) : '', found: stageDone(store, stage) };
      }) : []
    };
  }

  const pad = (n) => (n < 10 ? '0' : '') + n;
  function dateText(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function stamp(d) {
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
  }
  function plain(text, bangjeom) {
    const Y = NM.core.yet;
    try { return Y.render(String(text || ''), { bangjeom }); } catch (e) { NM.reportError('ui.notebookModel.render', e); return String(text || ''); }
  }

  function image(store, stageId, opts) {
    const o = opts || {};
    const now = o.now && typeof o.now.getTime === 'function' ? o.now : new Date();
    const rec = store.get();
    const prog = store.stage(stageId);
    const bj = bangjeomFor(store, stageId);
    const sc = sceneOf(stageId);
    const st = store.stats(sc);
    const glyphs = rec.glyphs[store.level] || [];
    const done = prog.status === 'done';
    const teacher = o.teacher === true;
    return {
      gameTitle: plain(t('gameTitle'), true),
      stageId,
      stageLabel: stageLabel(stageId),
      stageName: plain(stageName(stageId), bj),
      level: store.level,
      levelLabel: t('levels.' + store.level),
      name: String(o.name || '').trim(),
      number: String(o.number || '').trim(),
      nickname: rec.nickname || '',
      items: confirmedItems(store, stageId).map(x => ({ id: x.id, orig: plain(x.word, bj), modern: x.modern })),
      translations: translations(store, stageId).map(x => plain(x.text, bj)),
      rules: prog.rules.map(ruleCard).map(c => ({ id: c.id, name: plain(c.name, bj), text: plain(c.text, bj) })),
      reflection: prog.reflection || '',
      glyph: glyphs.indexOf(stageId) >= 0 ? carveGlyph(stageId) : '',
      title: store.title().title,
      stats: {
        firstTryRate: st.firstTryRate,
        firstTryText: st.firstTryRate === null ? t('image.none') : t('image.percent', { n: Math.round(st.firstTryRate * 100) }),
        helps: st.helps,
        misreads: st.misreads
      },
      status: done ? 'done' : 'progress',
      statusText: done ? t('image.statusDone') : t('image.statusProgress'),
      teacher,
      teacherText: teacher ? t('image.teacherMark') : '',
      createdAt: now.toISOString(),
      createdText: dateText(now),
      fileName: t('image.fileName') + '-' + stageId + '-' + stamp(now) + '.png'
    };
  }

  UI.notebookModel = { sceneOf, stageLabel, stageName, carveGlyph, view, image, bangjeomFor };
})(typeof window !== 'undefined' ? window : globalThis);
