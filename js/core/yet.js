'use strict';
/*
 * NM.core.yet — 옛한글 표기 처리. 자모 표는 js/data/jamo.js(NM.data.JAMO)에 있다.
 * 옛한글은 언제나 DOM 글자로 보인다(캔버스 그림 아님). 채점은 id 로 하며 렌더된 문자열을 비교하지 않는다.
 *
 * ■ 데이터 표기 규칙 (js/data/** 의 화면 문자열)
 *   [ㅂㅅㄱㅜㄹ]   대괄호 = 한 음절. 호환 자모(ㄱ–ㆎ, ㅸ ㆀ ㅴ …)나 첫·가운뎃·끝소리 자모를 늘어놓는다.
 *                 초성(자음 원자 1–3) + 중성(모음 원자 1–3) + 종성(자음 원자 0–3) 으로 나뉜다.
 *                 현대 음절로 나타낼 수 있으면 완성형(가–힣), 아니면 첫가끝 자모열(초성 없으면 U+115F, 중성 없으면 U+1160).
 *                 표에 없는 묶음·자모 아닌 글자·음절 둘 → 오류를 던진다(조용히 버리지 않음).
 *   ·가 / :가     방점. 가운뎃점 U+00B7(거성 1점) · 쌍점 ':'(상성 2점)을 음절 "바로 앞"에 쓴다.
 *                 출력에서는 유니코드 관례대로 음절 "뒤"에 U+302E 〮 / U+302F 〯 를 붙인다.
 *                 바로 뒤가 음절(완성형 가–힣, 첫소리 자모로 시작하는 옛한글 음절, 또는 '[')일 때만 방점이다.
 *                 그 밖의 '·' ':' 은 글자 그대로("10:30", "가 · 나"). 음절 앞인데 글자로 쓰려면 '\·' '\:'.
 *                 → 그래서 "가·나"처럼 가운뎃점을 띄우지 않고 쓰면 방점이 된다. 결정 기록: design/decisions/0001-방점-표기.md
 *                 U+302E/302F 를 직접 적어도 된다(이미 음절 뒤). 방점 끄기는 이것도 숨긴다.
 *   {漢字|읽기}   루비. 읽기와 바탕 글자에는 대괄호·방점을 쓸 수 있다(꾸밈·루비 겹치기는 안 됨).
 *   **굵게**  _밑줄_   꾸밈. 밑줄표는 양옆이 모두 영숫자이면 글자 그대로(snake_case). 닫지 않으면 오류.
 *   \x            역빗금 뒤 한 글자는 글자 그대로.
 *
 * ■ API
 *   syllable(inner)          대괄호 안 → 음절 문자열
 *   render(text, opts)       표기 → 평문. opts.bangjeom(기본 settings.bangjeom), opts.ruby 'paren'(기본)|'base'|'reading'
 *   parse(text, opts)        표기 → 토큰 [{type:'text',text,bold,underline} | {type:'ruby',base,reading,bold,underline}]
 *   toPlain(tokens, opts)    토큰 → 평문 (루비는 '漢字(읽기)')
 *   buildDom(text|tokens, {document, bangjeom}) → DocumentFragment. createElement/createTextNode 만 쓴다(innerHTML 없음).
 *                            표기 오류면 NM.reportError 로 보고하고 원문 글자를 그대로 보인다(점검은 오류 모음으로 실패).
 *   setBangjeom(on)          전역 방점 보이기/숨기기 (settings.bangjeom)
 *   soloTone(s)              홀로 선 방점 하나('〮' '〯', s4 패 글자) → 화면·그림용 점 글자('•' ':'). 그 밖의 글은 그대로.
 *                            (글꼴은 음절 뒤가 아닌 방점을 점선 동그라미 ◌ 와 함께 그린다)
 *   splitSyllables(shown)    렌더된 문자열 → 음절 단위 배열(완성형 또는 첫가끝 묶음 + 뒤따르는 방점·결합 부호)
 *   modernReading(text, {modern})  화면 읽기용 현대 글자 어림 (방점 제거, 규칙은 NM.data.JAMO.READING). modern 이 있으면 그것.
 *   normalize(s, {tone}) / same(a, b, {tone})  화면 비교용 정규화(NFC + 자모 묶음 정규형). tone:false 면 방점 무시.
 */
(function (root) {
  const NM = root.NM;
  const J = NM.data.JAMO;
  const R = J.READING;
  const GEOSEONG = String.fromCharCode(0x302E), SANGSEONG = String.fromCharCode(0x302F); // 거성 1점, 상성 2점
  const TONE_RE = new RegExp('[' + GEOSEONG + SANGSEONG + ']', 'g');
  const FILL_L = J.FILLER_CHO, FILL_V = J.FILLER_JUNG;

  const CONS = new Set(J.CONSONANTS);
  const VOW = new Set(J.VOWELS);
  const ATOMS_OF = Object.create(null); // 첫·가운뎃·끝소리 자모 → 원자 열쇠
  for (const t of [J.CHO, J.JUNG, J.JONG]) for (const k of Object.keys(t)) ATOMS_OF[t[k]] = k;
  ATOMS_OF[FILL_L] = '';
  ATOMS_OF[FILL_V] = '';

  const settings = { bangjeom: true };

  function composeFail(msg) { throw new Error('옛한글 조합 실패: ' + msg); }
  function markupFail(msg, text) { throw new Error('표기 오류: ' + msg + ' — ' + JSON.stringify(text)); }

  // ── 글자 분류 ──
  const isL = (c) => (c >= 0x1100 && c <= 0x115F) || (c >= 0xA960 && c <= 0xA97F);
  const isV = (c) => (c >= 0x1160 && c <= 0x11A7) || (c >= 0xD7B0 && c <= 0xD7C6);
  const isT = (c) => (c >= 0x11A8 && c <= 0x11FF) || (c >= 0xD7CB && c <= 0xD7FB);
  const isSyl = (c) => c >= 0xAC00 && c <= 0xD7A3;
  const MARK = /\p{M}/u;
  function cls(ch) {
    const c = ch.codePointAt(0);
    if (isL(c)) return 'L';
    if (isV(c)) return 'V';
    if (isT(c)) return 'T';
    if (isSyl(c)) return (c - 0xAC00) % 28 === 0 ? 'LV' : 'LVT';
    if (c === 0x302E || c === 0x302F || MARK.test(ch)) return 'M';
    return 'X';
  }
  // 한글 음절 경계 규칙(UAX #29 GB6–GB9)
  function joins(prev, k) {
    if (k === 'M') return true;
    if (prev === 'L') return k === 'L' || k === 'V' || k === 'LV' || k === 'LVT';
    if (prev === 'V' || prev === 'LV') return k === 'V' || k === 'T';
    if (prev === 'T' || prev === 'LVT') return k === 'T';
    return false;
  }

  function splitSyllables(str) {
    const out = [];
    let cur = '', prev = null;
    for (const ch of String(str)) {
      const k = cls(ch);
      if (cur && joins(prev, k)) cur += ch;
      else { if (cur) out.push(cur); cur = ch; }
      prev = k;
    }
    if (cur) out.push(cur);
    return out;
  }

  // ── 조합 ──
  const modernL = (ch) => { const c = ch.codePointAt(0); return c >= 0x1100 && c <= 0x1112; };
  const modernV = (ch) => { const c = ch.codePointAt(0); return c >= 0x1161 && c <= 0x1175; };
  const modernT = (ch) => { const c = ch.codePointAt(0); return c >= 0x11A8 && c <= 0x11C2; };

  function joinLVT(L, V, T) {
    if (L && V && modernL(L) && modernV(V) && (!T || modernT(T))) {
      const l = L.codePointAt(0) - 0x1100, v = V.codePointAt(0) - 0x1161, t = T ? T.codePointAt(0) - 0x11A7 : 0;
      return String.fromCharCode(0xAC00 + (l * 21 + v) * 28 + t);
    }
    return (L || FILL_L) + (V || FILL_V) + (T || '');
  }

  function atomize(inner) {
    let out = '';
    for (const ch of inner) {
      if (CONS.has(ch) || VOW.has(ch)) out += ch;
      else if (J.COMPAT[ch] != null) out += J.COMPAT[ch];
      else if (ATOMS_OF[ch] != null) out += ATOMS_OF[ch];
      else composeFail(`[${inner}] 의 '${ch}'(U+${ch.codePointAt(0).toString(16).toUpperCase()}) 는 자모가 아니다`);
    }
    return out;
  }

  // 원자열 → [초성 열쇠, 중성 열쇠, 종성 열쇠]
  function splitAtoms(atoms, label) {
    const a = [...atoms];
    let i = 0, cho = '', jung = '', jong = '';
    while (i < a.length && CONS.has(a[i])) cho += a[i++];
    while (i < a.length && VOW.has(a[i])) jung += a[i++];
    while (i < a.length && CONS.has(a[i])) jong += a[i++];
    if (i < a.length) composeFail(`[${label}] 는 한 음절이 아니다`);
    return [cho, jung, jong];
  }

  function fromKeys(cho, jung, jong, label) {
    if (!cho && !jung) composeFail(`[${label}] 에 초성도 중성도 없다`);
    // 자음만 있고 초성 표에 없지만 종성 표에 있으면(ㄳ ㄺ ᇧ …) 끝소리 낱자: 채움 초성 + 채움 중성 + 종성
    if (!jung && !J.CHO[cho] && J.JONG[cho]) return FILL_L + FILL_V + J.JONG[cho];
    const L = cho ? J.CHO[cho] : '';
    if (cho && !L) composeFail(`[${label}] 초성 '${cho}' 는 표에 없다`);
    const V = jung ? J.JUNG[jung] : '';
    if (jung && !V) composeFail(`[${label}] 중성 '${jung}' 는 표에 없다`);
    const T = jong ? J.JONG[jong] : '';
    if (jong && !T) composeFail(`[${label}] 종성 '${jong}' 는 표에 없다`);
    return joinLVT(L, V, T);
  }

  function syllable(inner) {
    inner = String(inner);
    if (!inner) composeFail('빈 대괄호 []');
    const atoms = atomize(inner);
    if (!atoms) composeFail(`[${inner}] 에 자모가 없다`);
    const [cho, jung, jong] = splitAtoms(atoms, inner);
    return fromKeys(cho, jung, jong, inner);
  }

  // ── 표기 해석 ──
  const isAsciiAlnum = (ch) => !!ch && /^[A-Za-z0-9]$/.test(ch);
  const cpAt = (s, i) => String.fromCodePoint(s.codePointAt(i));

  // 방점 접두 뒤가 음절의 시작인가
  function startsSyllable(src, i) {
    if (i >= src.length) return false;
    if (src[i] === '[') return true;
    const c = src.codePointAt(i);
    return isSyl(c) || isL(c);
  }

  // src[i] 에서 음절 하나를 읽는다 → [문자열, 다음 위치]
  function readSyllable(src, i) {
    if (src[i] === '[') {
      const j = src.indexOf(']', i + 1);
      if (j < 0) markupFail('닫는 ] 가 없다', src);
      return [syllable(src.slice(i + 1, j)), j + 1];
    }
    let out = '', prev = null;
    while (i < src.length) {
      const ch = cpAt(src, i);
      const k = cls(ch);
      if (k === 'M') break;
      if (out && !joins(prev, k)) break;
      out += ch; prev = k; i += ch.length;
    }
    return [out, i];
  }

  // 대괄호·방점·역빗금만 처리 (루비 안쪽). '{' '}' '|' ']' 는 오류.
  function inline(src, bangjeom, whole) {
    let out = '';
    let i = 0;
    while (i < src.length) {
      const r = inlineStep(src, i, bangjeom, whole);
      if (r) { out += r[0]; i = r[1]; continue; }
      const ch = src[i];
      if (ch === '{' || ch === '}' || ch === '|') markupFail(`루비 안에 '${ch}' 를 쓸 수 없다`, whole);
      const c = cpAt(src, i);
      out += c; i += c.length;
    }
    return out;
  }

  // 공통 한 걸음: 처리했으면 [출력, 다음 위치], 아니면 null
  function inlineStep(src, i, bangjeom, whole) {
    const ch = src[i];
    if (ch === '\\') {
      if (i + 1 >= src.length) markupFail('끝에 역빗금만 있다', whole);
      const c = cpAt(src, i + 1);
      return [c, i + 1 + c.length];
    }
    if (ch === '[') return readSyllable(src, i);
    if (ch === ']') markupFail('여는 [ 없이 ] 가 있다', whole);
    if ((ch === '·' || ch === ':') && startsSyllable(src, i + 1)) {
      const [s, next] = readSyllable(src, i + 1);
      return [s + (bangjeom ? (ch === ':' ? SANGSEONG : GEOSEONG) : ''), next];
    }
    if (ch === GEOSEONG || ch === SANGSEONG) return [bangjeom ? ch : '', i + 1];
    return null;
  }

  function wantBangjeom(opts) {
    return opts && typeof opts.bangjeom === 'boolean' ? opts.bangjeom : settings.bangjeom;
  }

  function parse(text, opts) {
    const src = String(text == null ? '' : text);
    const bj = wantBangjeom(opts);
    const tokens = [];
    let buf = '', bold = false, underline = false;
    const flush = () => {
      if (buf) tokens.push({ type: 'text', text: buf, bold, underline });
      buf = '';
    };
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '*' && src[i + 1] === '*') { flush(); bold = !bold; i += 2; continue; }
      if (ch === '_') {
        if (isAsciiAlnum(src[i - 1]) && isAsciiAlnum(src[i + 1])) { buf += ch; i++; continue; }
        flush(); underline = !underline; i++; continue;
      }
      // '{?}' 는 규칙 문장의 빈칸 자리(js/ui/rulecard.js 가 먼저 나눈다). 다른 곳에서 그려지면 빈칸 표시로 둔다.
      if (ch === '{' && src[i + 1] === '?' && src[i + 2] === '}') { buf += '＿＿'; i += 3; continue; }
      if (ch === '{') {
        let j = i + 1, bar = -1;
        for (; j < src.length; j++) {
          if (src[j] === '\\') { j++; continue; }
          if (src[j] === '}') break;
          if (src[j] === '{') markupFail('루비를 겹칠 수 없다', src);
          if (src[j] === '|' && bar < 0) bar = j;
        }
        if (j >= src.length) markupFail('닫는 } 가 없다', src);
        if (bar < 0) markupFail('루비에 | 가 없다 ({漢字|읽기})', src);
        const base = src.slice(i + 1, bar), reading = src.slice(bar + 1, j);
        if (!base || !reading) markupFail('루비의 바탕 글자나 읽기가 비었다', src);
        flush();
        tokens.push({ type: 'ruby', base: inline(base, bj, src), reading: inline(reading, bj, src), bold, underline });
        i = j + 1;
        continue;
      }
      if (ch === '}') markupFail('여는 { 없이 } 가 있다', src);
      const r = inlineStep(src, i, bj, src);
      if (r) { buf += r[0]; i = r[1]; continue; }
      const c = cpAt(src, i);
      buf += c; i += c.length;
    }
    if (bold) markupFail('** 를 닫지 않았다', src);
    if (underline) markupFail('_ 를 닫지 않았다', src);
    flush();
    return tokens;
  }

  function toPlain(tokens, opts) {
    const mode = (opts && opts.ruby) || 'paren';
    let out = '';
    for (const t of tokens) {
      if (t.type === 'ruby') {
        out += mode === 'base' ? t.base : mode === 'reading' ? t.reading : t.base + '(' + t.reading + ')';
      } else out += t.text;
    }
    return out;
  }

  function render(text, opts) { return toPlain(parse(text, opts), opts); }

  function buildDom(input, opts) {
    const doc = (opts && opts.document) || root.document;
    const frag = doc.createDocumentFragment();
    let tokens;
    try {
      tokens = Array.isArray(input) ? input : parse(input, opts);
    } catch (e) {
      NM.reportError('yet.buildDom', e);
      frag.appendChild(doc.createTextNode(String(input)));
      return frag;
    }
    for (const t of tokens) {
      let node;
      if (t.type === 'ruby') {
        node = doc.createElement('ruby');
        node.appendChild(doc.createTextNode(t.base));
        const rp1 = doc.createElement('rp'); rp1.appendChild(doc.createTextNode('('));
        const rt = doc.createElement('rt'); rt.appendChild(doc.createTextNode(t.reading));
        const rp2 = doc.createElement('rp'); rp2.appendChild(doc.createTextNode(')'));
        node.appendChild(rp1); node.appendChild(rt); node.appendChild(rp2);
      } else {
        node = doc.createTextNode(t.text);
      }
      if (t.underline) { const el = doc.createElement('u'); el.appendChild(node); node = el; }
      if (t.bold) { const el = doc.createElement('strong'); el.appendChild(node); node = el; }
      frag.appendChild(node);
    }
    return frag;
  }

  function setBangjeom(on) { settings.bangjeom = !!on; return settings.bangjeom; }
  // 홀로 선 방점 하나(s4 패 글자 '〮'): 글꼴은 음절 뒤가 아닌 방점을 점선 동그라미(◌)와 함께 그린다 → 같은 모양의 점 글자로
  function soloTone(s) { return s === GEOSEONG ? '•' : s === SANGSEONG ? ':' : s; }

  // ── 음절 묶음 ↔ 원자 열쇠 ──
  // 첫가끝 묶음(완성형은 NFD 로 풀어 넣는다) → [초성, 중성, 종성] 원자 열쇠. 한글 묶음이 아니면 null.
  function clusterKeys(unit) {
    let cho = '', jung = '', jong = '', any = false;
    for (const ch of unit.normalize('NFD')) {
      const k = cls(ch);
      if (k === 'M') continue;
      if (k !== 'L' && k !== 'V' && k !== 'T') return null;
      const a = ATOMS_OF[ch];
      if (a == null) return null;
      any = true;
      if (k === 'L') cho += a; else if (k === 'V') jung += a; else jong += a;
    }
    return any ? [cho, jung, jong] : null;
  }

  // ── 화면 읽기용 현대 글자 ──
  const MODERN = { cho: new Set(), jung: new Set(), jong: new Set() };
  for (const k of Object.keys(J.CHO)) if (modernL(J.CHO[k])) MODERN.cho.add(k);
  for (const k of Object.keys(J.JUNG)) if (modernV(J.JUNG[k])) MODERN.jung.add(k);
  for (const k of Object.keys(J.JONG)) if (modernT(J.JONG[k])) MODERN.jong.add(k);
  const TENSE = new Set(R.TENSE);

  // 자음 뒤의 ㅇ(연서·각자병서의 둘째 ㅇ)을 지운다
  const dropYeonseo = (atoms) => atoms.filter((a, i) => !(i > 0 && a === 'ㅇ' && CONS.has(atoms[i - 1])));
  const mapAtoms = (atoms, table) => atoms.map(a => (table[a] != null ? table[a] : a)).join('');

  function readCho(key) {
    if (!key) return 'ㅇ';
    const a = [...mapAtoms(dropYeonseo([...key]), R.CHO)];
    let k = a.join('');
    if (MODERN.cho.has(k)) return k;
    const last = a[a.length - 1];
    k = TENSE.has(last) ? last + last : last;
    return MODERN.cho.has(k) ? k : 'ㅇ';
  }
  function readJung(key) {
    const a = [...mapAtoms([...key], R.JUNG)];
    while (a.length && !MODERN.jung.has(a.join(''))) a.pop();
    return a.length ? a.join('') : 'ㅏ';
  }
  function readJong(key) {
    const a = [...mapAtoms(dropYeonseo([...key]), R.JONG)];
    while (a.length && !MODERN.jong.has(a.join(''))) a.shift();
    return a.join('');
  }

  function modernUnit(unit) {
    const keys = clusterKeys(unit);
    if (!keys) {
      const first = [...unit][0];
      if (R.LETTER_NAMES[first] != null) return R.LETTER_NAMES[first];
      return unit.replace(TONE_RE, '');
    }
    const [cho, jung, jong] = keys;
    if (!jung) return cho ? compatOf(readCho(cho)) : compatOf(readJong(jong));
    return joinLVT(J.CHO[readCho(cho)], J.JUNG[readJung(jung)], jong ? J.JONG[readJong(jong)] || '' : '');
  }
  // 원자 열쇠 → 호환 자모 (중성 없는 낱자 읽기용)
  const COMPAT_OF = Object.create(null);
  for (const ch of Object.keys(J.COMPAT)) COMPAT_OF[J.COMPAT[ch]] = ch;
  const compatOf = (key) => COMPAT_OF[key] || key;

  function modernReading(text, opts) {
    if (opts && typeof opts.modern === 'string') return opts.modern;
    const shown = render(text, { bangjeom: false, ruby: 'reading' });
    return splitSyllables(shown).map(modernUnit).join('').normalize('NFC');
  }

  // ── 화면 비교용 정규화 ──
  function normalize(str, opts) {
    const keepTone = !(opts && opts.tone === false);
    let out = '';
    for (const unit of splitSyllables(String(str).normalize('NFD'))) {
      let body = keepTone ? unit : unit.replace(TONE_RE, ''), tail = '';
      const m = /\p{M}+$/u.exec(body);
      if (m && m.index > 0 && clusterKeys(body.slice(0, m.index))) { tail = m[0]; body = body.slice(0, m.index); }
      const keys = clusterKeys(body);
      let norm = null;
      if (keys) {
        const [cho, jung, jong] = keys;
        const L = cho ? J.CHO[cho] : '', V = jung ? J.JUNG[jung] : '', T = jong ? J.JONG[jong] : '';
        if ((!cho || L) && (!jung || V) && (!jong || T) && (cho || jung)) norm = joinLVT(L, V, T);
      }
      out += (norm != null ? norm : body.normalize('NFC')) + tail.normalize('NFC');
    }
    return out;
  }
  function same(a, b, opts) { return normalize(a, opts) === normalize(b, opts); }

  NM.core.yet = {
    GEOSEONG, SANGSEONG, settings,
    syllable, parse, toPlain, render, buildDom, setBangjeom, soloTone,
    splitSyllables, modernReading, normalize, same
  };
})(typeof window !== 'undefined' ? window : globalThis);
