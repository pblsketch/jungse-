'use strict';
/*
 * D1 점검용 시험 기믹 'd1-test' (게임 기믹 아님). 기믹 접점(js/ui/stage-gimmick.js)이 도는지 보인다.
 * config.choices 의 수 가운데 하나를 골라 제출한다. 정답은 item.answer.
 * check 는 틀린 부분(고른 수)을 돌려주고, showWrong 은 그 단추에 표시를 단다.
 * 문구: 숫자와 기호만 쓴다(화면 문구 데이터가 필요 없게).
 */
(function (root) {
  const NM = root.NM;
  NM.gimmicks.register('d1-test', {
    check(answer, item) {
      return answer === item.answer ? true : { correct: false, wrong: answer };
    },
    mount(el, o) {
      const doc = o.document || root.document;
      const box = doc.createElement('div');
      box.className = 'd1tg';
      const buttons = {};
      let picked = null;
      (o.config.choices || []).forEach(n => {
        const b = doc.createElement('button');
        b.type = 'button'; b.className = 'd1tg-choice'; b.textContent = String(n);
        b.setAttribute('data-choice', String(n));
        b.addEventListener('click', () => {
          picked = n;
          Object.keys(buttons).forEach(k => buttons[k].setAttribute('aria-pressed', String(Number(k) === n)));
        });
        buttons[n] = b; box.appendChild(b);
      });
      const submit = doc.createElement('button');
      submit.type = 'button'; submit.className = 'd1tg-submit'; submit.textContent = '→';
      submit.addEventListener('click', () => { if (picked != null) o.onSubmit(picked); });
      box.appendChild(submit);
      el.appendChild(box);
      if (o.readOnly) submit.disabled = true;
      return {
        showWrong(info) {
          Object.keys(buttons).forEach(k => buttons[k].classList.remove('d1tg-wrong'));
          if (buttons[info.wrong]) buttons[info.wrong].classList.add('d1tg-wrong');
        },
        showHint(step, target) { if (step >= 2 && buttons[target]) buttons[target].classList.add('d1tg-hint'); },
        showAnswer(answer) { if (buttons[answer]) buttons[answer].classList.add('d1tg-answer'); submit.disabled = true; },
        destroy() { box.remove(); }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
