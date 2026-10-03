'use strict';
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  function attach(w, initialKeys) {
    const audio = NM.engine.audio;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'nm-st-btn nm-voice-replay';
    button.textContent = NM.ui.stageText.t('voice.replay');
    button.setAttribute('aria-label', NM.ui.stageText.t('voice.replayLabel'));
    w.foot.insertBefore(button, w.foot.firstChild);
    let keys = [], revision = 0, disposed = false;
    const owner = () => !disposed && w.isOpen() && w.el.parentNode && w.el.parentNode.lastElementChild === w.el;
    function refresh() {
      button.hidden = !keys.length;
      button.disabled = !audio.state().voiceOn;
      button.title = button.disabled ? NM.ui.stageText.t('voice.off') : NM.ui.stageText.t('voice.replayLabel');
    }
    function update(values) {
      const generation = ++revision;
      keys = (Array.isArray(values) ? values : [values]).filter(key => audio.hasVoice(key));
      audio.stopVoice(); refresh();
      Promise.resolve().then(() => { if (generation === revision && owner()) audio.playVoice(keys); });
    }
    button.addEventListener('click', () => { if (owner()) { audio.unlock(); audio.playVoice(keys); } });
    document.addEventListener('nm:voice-state', refresh);
    update(initialKeys);
    return {
      update,
      dispose() {
        disposed = true; revision++;
        document.removeEventListener('nm:voice-state', refresh);
        audio.stopVoice();
      }
    };
  }
  NM.ui.stageVoice = { attach };
})(typeof window !== 'undefined' ? window : globalThis);
