'use strict';
/*
 * NM.ui.settings — 설정 창 (spec §11 표 전부, §9 교사 모드 켜기·끄기). 언제든 연다(첫 화면·장면 고르기·장면 중 도구 막대).
 *   open(app)
 * 줄마다 [data-setting="<이름>"] 안에 data-value 단추. 고른 값은 aria-pressed="true" + 기호(●)로도 보인다.
 *   level(m|h1|h23) · bangjeom(on|off) · modern(tap|always|off: 原文 현대어 풀이) · eum(on|off: 한자 음) · fontScale(1|2|3) · reducedMotion(auto|on|off) · bgm(on|off) · sfx(on|off)
 *   teacher: [data-act="teacher-on"] / [data-act="teacher-off"], 학교급을 모르면 [data-act="teacher-level"][data-value]
 *   newstart: [data-act="newstart"] (확인 창 뒤 지움)
 * 장면 중에는 학교급·교사 모드·새로 시작을 잠근다(장면이 그 학교급·기록으로 돌고 있으므로). 교사 모드에서는 새로 시작을 잠근다.
 * 값은 app.store() 로만 바꾼다(교사 모드면 메모리 저장소라 저장되지 않는다).
 */
(function (root) {
  const NM = root.NM;
  const UI = NM.ui = NM.ui || {};
  const dom = UI.dom;
  const t = (k, v) => dom.t(k, v);
  const el = (a, b, c) => dom.el(a, b, c);

  function open(app) {
    if (dom.isOpen('settings')) return null;
    const body = el('div', { class: 'nm-settings' });
    let pickingTeacherLevel = false;
    let wrap = null;

    function rerender(focusSel) {
      dom.clear(body);
      build();
      if (focusSel) {
        const f = body.querySelector(focusSel);
        if (f) { try { f.focus(); } catch (e) { /* 무시 */ } }
      }
    }
    function row(name, labelKey, helpKey, controls, note) {
      const id = 'nm-set-' + name;
      return el('section', { class: 'nm-set-row', data: { setting: name }, attrs: { 'aria-labelledby': id } }, [
        el('h3', { class: 'nm-set-label', text: t(labelKey), attrs: { id } }),
        helpKey ? el('p', { class: 'nm-help', text: t(helpKey) }) : null,
        el('div', { class: 'nm-seg', attrs: { role: 'group', 'aria-labelledby': id } }, controls),
        note ? el('p', { class: 'nm-help nm-note', text: note }) : null
      ]);
    }
    function seg(name, options, current, onPick, disabled) {
      return options.map(o => dom.button(o.label, 'set', () => {
        onPick(o.value);
        rerender('[data-setting="' + name + '"] [data-value="' + o.value + '"]');
      }, { class: 'nm-seg-btn', data: { value: o.value }, pressed: o.value === current, disabled: !!disabled }));
    }
    const onOff = () => [{ value: 'on', label: t('on') }, { value: 'off', label: t('off') }];

    function build() {
      const st = app.store();
      const s = st.get().settings;
      const inStage = app.inStage;
      const teacher = app.isTeacher();
      const lockNote = inStage ? t('settings.lockedInStage') : null;

      body.appendChild(row('level', 'settings.level', 'settings.levelHelp',
        seg('level', ['m', 'h1', 'h23'].map(v => ({ value: v, label: t('levels.' + v) })), st.level, v => app.setLevel(v), inStage), lockNote));
      body.appendChild(row('bangjeom', 'settings.bangjeom', 'settings.bangjeomHelp',
        seg('bangjeom', onOff(), s.bangjeom ? 'on' : 'off', v => app.updateSettings({ bangjeom: v === 'on' }))));
      body.appendChild(row('modern', 'settings.modern', 'settings.modernHelp',
        seg('modern', ['tap', 'always', 'off'].map(v => ({ value: v, label: t('settings.moderns.' + v) })), s.modern || 'tap',
          v => app.updateSettings({ modern: v }))));
      body.appendChild(row('eum', 'settings.eum', 'settings.eumHelp',
        seg('eum', onOff(), s.eum === false ? 'off' : 'on', v => app.updateSettings({ eum: v === 'on' }))));
      body.appendChild(row('fontScale', 'settings.fontScale', null,
        seg('fontScale', [1, 2, 3].map(v => ({ value: String(v), label: t('settings.fontScales.' + v) })), String(s.fontScale), v => app.updateSettings({ fontScale: Number(v) }))));
      const rm = s.reducedMotion === 'auto' ? 'auto' : (s.reducedMotion ? 'on' : 'off');
      body.appendChild(row('reducedMotion', 'settings.reducedMotion', null,
        seg('reducedMotion', ['auto', 'on', 'off'].map(v => ({ value: v, label: t('settings.reducedMotions.' + v) })), rm,
          v => app.updateSettings({ reducedMotion: v === 'auto' ? 'auto' : v === 'on' }))));
      body.appendChild(row('bgm', 'settings.bgm', 'settings.soundHelp',
        seg('bgm', onOff(), s.bgm ? 'on' : 'off', v => app.updateSettings({ bgm: v === 'on' }))));
      body.appendChild(row('sfx', 'settings.sfx', null,
        seg('sfx', onOff(), s.sfx ? 'on' : 'off', v => app.updateSettings({ sfx: v === 'on' }))));
      body.appendChild(row('voice', 'settings.voice', 'settings.voiceHelp',
        seg('voice', onOff(), s.voice !== false ? 'on' : 'off', v => app.updateSettings({ voice: v === 'on' }))));
      // 전체 화면: 저장하는 설정이 아니라 지금 화면을 바꾼다(지원하지 않는 브라우저는 안내만)
      const FS = UI.fullscreen;
      if (FS && FS.supported()) body.appendChild(row('fullscreen', 'settings.fullscreen', 'settings.fullscreenHelp', [FS.button({ cls: 'nm-seg-btn' })]));
      else body.appendChild(row('fullscreen', 'settings.fullscreen', 'settings.fullscreenNo', []));

      // 교사 모드
      let tControls;
      if (teacher) {
        tControls = [
          el('p', { class: 'nm-help', text: t('settings.teacherIsOn') }),
          dom.button(t('settings.teacherOff'), 'teacher-off', () => app.setTeacher(false), { disabled: inStage })
        ];
      } else if (pickingTeacherLevel) {
        tControls = [el('p', { class: 'nm-help', text: t('settings.teacherPickLevel') })].concat(
          ['m', 'h1', 'h23'].map((v, i) => dom.button(t('levels.' + v), 'teacher-level', () => app.setTeacher(true, v), { data: { value: v, autofocus: i === 0 ? '1' : null } })));
      } else {
        tControls = [dom.button(t('settings.teacherOn'), 'teacher-on', () => {
          if (app.urlLevel) app.setTeacher(true);
          else { pickingTeacherLevel = true; rerender('[data-act="teacher-level"]'); }
        }, { disabled: inStage })];
      }
      body.appendChild(row('teacher', 'settings.teacher', 'settings.teacherHelp', tControls, lockNote));

      // 새로 시작
      const nsLocked = teacher || inStage;
      body.appendChild(row('newstart', 'settings.newStart', 'settings.newStartHelp',
        [dom.button(t('settings.newStart'), 'newstart', () => { dom.closeModal(wrap, true); app.askNewStart(); }, { class: 'nm-btn-danger', disabled: nsLocked })],
        teacher ? t('settings.newStartTeacher') : lockNote));
    }

    build();
    // 닫으면 뒤 화면을 다시 그린다(정하기 전 설정 변경, 학교급 변경 등)
    wrap = dom.openModal(body, { name: 'settings', titleKey: 'settings.title', onClose() { app.refresh(); } });
    return wrap;
  }

  UI.settings = { open };
})(typeof window !== 'undefined' ? window : globalThis);
