'use strict';
/*
 * NM.ui.rulecard — 선택 카드 묶음과 '규칙 카드 문장 완성' 공용 부품 (S1·S6·S10·S11 규칙 항목, 기믹 G2 등).
 *   cards({ cards, selected, onSelect(cardId), disabled, label, fill, solved }) → { el, setSelected(id), setDisabled(b), reveal(correctId) }
 *     카드 단추 묶음(role=radiogroup, 카드마다 role=radio·aria-checked). 누르기·Enter·Space 로 고른다.
 *     reveal(correctId): 정답 카드에 ○ 기호와 '정답' 글자를 단다(색만으로 나누지 않음). 확정 뒤·도움 3단계·교사 보기에만 부른다.
 *   build({ sentence, cards, selected, onSelect, disabled, fill, solved }) → { el, cards(위 묶음), setSelected, setDisabled, reveal }
 *     규칙 문장의 빈칸 자리 표시는 '{?}'. 예) '주격 조사는 자음 뒤에서 {?} 로 쓰인다.'
 *     고른 카드 글자가 빈칸에 채워져 문장이 완성된 모습으로 보인다(정오는 알려 주지 않는다).
 *   카드 글자·문장은 장면 데이터 표기(옛한글·루비·꾸밈 가능). 판정은 카드 id 로 진행기가 한다.
 * 필요: ns.js, ui/stage-text.js, ui/stage-yet.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};
  const TX = () => NM.ui.stageText;
  const YB = () => NM.ui.stageYet;
  const BLANK = '{?}';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.appendChild(document.createTextNode(String(text)));
    return e;
  }
  function rich(text, o) {
    const s = el('span', 'nm-st-text');
    s.appendChild(YB().build(o.fill ? o.fill(text) : text, { solved: o.solved }));
    return s;
  }

  function cards(o) {
    const list = Array.isArray(o.cards) ? o.cards.filter(c => c && typeof c.id === 'string') : [];
    const group = el('div', 'nm-st-cards');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', o.label || TX().t('cardsLabel'));
    const btns = {};
    let selected = o.selected || null;
    let disabled = !!o.disabled;
    list.forEach(c => {
      const b = el('button', 'nm-st-card');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('data-card', c.id);
      const mark = el('span', 'nm-st-card-mark');
      mark.setAttribute('aria-hidden', 'true');
      b.appendChild(mark);
      b.appendChild(rich(c.text, o));
      b.addEventListener('click', () => {
        if (disabled) return;
        api.setSelected(c.id);
        if (typeof o.onSelect === 'function') o.onSelect(c.id);
      });
      btns[c.id] = b;
      group.appendChild(b);
    });
    const api = {
      el: group,
      setSelected(id) {
        selected = id || null;
        Object.keys(btns).forEach(k => {
          const on = k === selected;
          btns[k].setAttribute('aria-checked', String(on));
          btns[k].classList.toggle('is-selected', on);
        });
      },
      setDisabled(b) {
        disabled = !!b;
        Object.keys(btns).forEach(k => { btns[k].disabled = disabled; });
      },
      reveal(correctId) {
        const b = btns[correctId];
        if (!b) return;
        b.classList.add('is-correct');
        const m = b.querySelector('.nm-st-card-mark');
        m.textContent = '○';
        const tag = el('span', 'nm-st-card-tag', TX().t('answer'));
        b.appendChild(tag);
      }
    };
    api.setSelected(selected);
    api.setDisabled(disabled);
    return api;
  }

  function build(o) {
    const wrap = el('div', 'nm-rulecard');
    const sentence = el('p', 'nm-rulecard-sentence');
    const parts = String(o.sentence || '').split(BLANK);
    const blank = el('span', 'nm-rulecard-blank');
    const list = Array.isArray(o.cards) ? o.cards : [];
    function fillBlank(id) {
      blank.textContent = '';
      const c = list.filter(x => x && x.id === id)[0];
      if (c) { blank.classList.add('is-filled'); blank.appendChild(rich(c.text, o)); }
      else { blank.classList.remove('is-filled'); blank.appendChild(el('span', 'nm-rulecard-placeholder', TX().t('blank'))); }
    }
    parts.forEach((p, i) => {
      if (p) sentence.appendChild(rich(p, o));
      if (i < parts.length - 1) sentence.appendChild(i === 0 ? blank : el('span', 'nm-rulecard-blank-extra', '…'));
    });
    if (parts.length < 2) sentence.appendChild(blank);
    wrap.appendChild(sentence);
    const group = cards(Object.assign({}, o, {
      onSelect(id) { fillBlank(id); if (typeof o.onSelect === 'function') o.onSelect(id); }
    }));
    wrap.appendChild(group.el);
    fillBlank(o.selected || null);
    return {
      el: wrap, cards: group,
      setSelected(id) { group.setSelected(id); fillBlank(id); },
      setDisabled: group.setDisabled,
      reveal: group.reveal
    };
  }

  NM.ui.rulecard = { BLANK, cards, build };
})(typeof window !== 'undefined' ? window : globalThis);
