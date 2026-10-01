'use strict';
/*
 * 기믹 끼우기 접점 (NM.gimmicks.register). 기믹 과제(kind 'task')는 js/gimmicks/ 의 모듈이 그린다.
 *
 * ■ 기믹 모듈이 하는 일
 *   NM.gimmicks.register('<이름>', {
 *     mount(el, o) → 인스턴스      el 안에 그린다. o = {
 *                                   item, config(item.config), level, teacher, document, readOnly(이미 끝난 과제),
 *                                   reducedMotion, bangjeom,
 *                                   onSubmit(answer)      학생이 '제출'하면 부른다. 판정·저장·도움은 진행기가 한다.
 *                                   text(key, vars)       NM.data.TEXT.stage 문구(기믹 문구는 자기 TEXT 이름 공간에 둔다)
 *                                   yet(text, opts)       옛한글 DOM(js/ui/stage-yet.js build) — 원문·옛말 표시용
 *                                   fill(text)            대사 별명 채우기
 *                                   rulecard(opts)        규칙 카드 문장 완성 공용 부품(js/ui/rulecard.js build)
 *                                   knownRules            이 학교급에서 이미 얻은 규칙 카드 id 목록
 *                                   addTranslation(id)    옮긴 구절 id 를 수첩에 남긴다(장면 translations 의 id)
 *                                 }
 *     check(answer, item)          선택. 참/거짓 또는 { correct, wrong }(틀린 부분 — showWrong 에 그대로 전해짐).
 *                                  없으면 진행기가 answer 와 item.answer 를 깊은 비교한다(객체 키 순서 무관).
 *   })
 *   인스턴스(모두 선택):
 *     showWrong({ wrong, answer, wrongs, help })   틀린 제출 직후. 틀린 부분을 바로 표시(번짐·흐려짐 등)
 *     showHint(step, target)       도움 단계. step 2 에 target = item.hints[1](고칠 곳)을 강조
 *     showAnswer(answer)           3번째 틀림(doneByHelp) 또는 이미 끝난 과제를 다시 열 때 정답을 보인다
 *     showDone(answer)             맞게 제출해 done 이 된 직후(입력 잠그기·결과 보이기 등)
 *     destroy()                    창이 닫힐 때
 * ■ 판정은 진행기가 한다: judge → store.submit(stage, itemId, correct) → NM.core.rules.submit.
 *   도움 1단계 힌트(item.hints[0])와 3단계 풀이(item.explain)는 진행기가 창에 쓴다.
 * 필요: js/core/ns.js
 */
(function (root) {
  const NM = root.NM;
  const G = NM.gimmicks = NM.gimmicks || {};
  const registry = {};

  G.register = function (name, def) {
    if (typeof name !== 'string' || !name || !def || typeof def.mount !== 'function') {
      NM.reportError('gimmicks.register', 'bad gimmick: ' + name);
      return false;
    }
    registry[name] = def;
    return true;
  };
  G.get = function (name) { return Object.prototype.hasOwnProperty.call(registry, name) ? registry[name] : null; };
  G.list = function () { return Object.keys(registry); };
})(typeof window !== 'undefined' ? window : globalThis);
