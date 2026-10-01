'use strict';
/*
 * NM.ui.stageText — 장면 진행기의 문구 도우미 (DOM 없음).
 *   t(key, vars)          NM.data.TEXT.stage 의 점 경로 문구. %v% 자리를 채운다. 없으면 '' + 오류 모음.
 *   has(key)              있으면 문구, 없으면 undefined(오류 없음)
 *   finalInfo(word)       끝 글자의 받침 { batchim, rieul } (조사 고르기용)
 *   particle(word, p)     word 뒤에 붙을 조사. p 는 짝의 어느 쪽이든 된다(TEXT.stage.josa). 짝이 없으면 p 그대로.
 *   callName({nickname, teacher})  대사에서 부르는 이름. 교사 모드나 별명이 없으면 TEXT.stage.call.
 *   fill(text, opts)      대사의 <@> <@이> <@아> … 를 이름+조사로 바꾼다(루비 {漢|읽기}·옛한글 표기는 그대로).
 *                         꺾쇠 자리는 데이터 표기(js/core/yet.js)와 겹치지 않는다(중괄호는 루비라서 쓰지 않음).
 * 받침 판정: 한글 완성형은 종성으로, 숫자는 한국어 읽기로(0 영·1 일·3 삼·6 육·7 칠·8 팔), 로마자는
 *   한 글자면 글자 이름(L 엘·M 엠·N 엔·R 알), 여러 글자면 끝이 l·m·n·ng 이면 받침(어림).
 * 필요: js/core/ns.js, js/data/text-stage.js
 */
(function (root) {
  const NM = root.NM;
  NM.ui = NM.ui || {};

  function lookup(key) {
    const T = NM.data && NM.data.TEXT && NM.data.TEXT.stage;
    if (!T || typeof key !== 'string') return undefined;
    return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), T);
  }

  function t(key, vars) {
    const v = lookup(key);
    if (typeof v !== 'string') { NM.reportError('stage.text', 'missing text: ' + key); return ''; }
    if (!vars) return v;
    return v.replace(/%(\w+)%/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  }

  const DIGIT = { '0': [true, false], '1': [true, true], '2': [false, false], '3': [true, false], '4': [false, false],
    '5': [false, false], '6': [true, false], '7': [true, true], '8': [true, true], '9': [false, false] };
  const LETTER = { l: [true, true], m: [true, false], n: [true, false], r: [true, true] };

  function finalInfo(word) {
    const s = String(word == null ? '' : word);
    const chars = Array.from(s);
    const last = chars[chars.length - 1];
    if (!last) return { batchim: false, rieul: false };
    const c = last.codePointAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) {
      const jong = (c - 0xAC00) % 28;
      return { batchim: jong !== 0, rieul: jong === 8 };
    }
    if (DIGIT[last]) return { batchim: DIGIT[last][0], rieul: DIGIT[last][1] };
    if (/[A-Za-z]/.test(last)) {
      const low = s.toLowerCase();
      if (chars.length === 1 || !/[a-z]/.test(chars[chars.length - 2] || '')) {
        const v = LETTER[low.slice(-1)];
        return v ? { batchim: v[0], rieul: v[1] } : { batchim: false, rieul: false };
      }
      if (/ng$/.test(low)) return { batchim: true, rieul: false };
      const v = LETTER[low.slice(-1)];
      if (v && low.slice(-1) !== 'r') return { batchim: v[0], rieul: v[1] };
      return { batchim: false, rieul: false };
    }
    return { batchim: false, rieul: false };
  }

  function particle(word, p) {
    const list = lookup('josa');
    const pair = Array.isArray(list) ? list.filter(x => x && (x.c === p || x.v === p))[0] : null;
    if (!pair) return p;
    const f = finalInfo(word);
    const consonant = f.batchim && !(pair.rieulAsVowel && f.rieul);
    return consonant ? pair.c : pair.v;
  }

  function callName(opts) {
    const o = opts || {};
    const nick = typeof o.nickname === 'string' ? o.nickname : '';
    return o.teacher || !nick ? t('call') : nick;
  }

  function fill(text, opts) {
    const s = String(text == null ? '' : text);
    if (s.indexOf('<@') < 0) return s;
    const name = callName(opts);
    return s.replace(/<@([^<>@]*)>/g, (m, p) => name + (p ? particle(name, p) : ''));
  }

  // 있으면 문구, 없으면 undefined (오류로 모으지 않음 — 선택 문구용)
  function has(key) { const v = lookup(key); return typeof v === 'string' ? v : undefined; }

  NM.ui.stageText = { t, has, finalInfo, particle, callName, fill };
})(typeof window !== 'undefined' ? window : globalThis);
