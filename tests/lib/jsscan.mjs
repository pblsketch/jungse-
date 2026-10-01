// 자바스크립트 소스에서 문자열 리터럴만 뽑는 작은 낱말 분석기(의존 패키지 없음).
// - 주석(// … , /* … */)은 건너뛴다. 정규식 리터럴도 건너뛴다(앞 낱말로 나눗셈과 가른다).
// - '…' "…" 와 템플릿 `…`(${…} 안은 다시 코드로 읽음)의 글자 부분을 돌려준다.
// - value 는 이스케이프(\uXXXX, \u{…}, \xHH, \n …)를 푼 실제 값이다. '살' 처럼 숨겨 적어도 잡힌다.
// - callee 는 그 리터럴을 감싼 가장 안쪽 호출의 함수 이름이다(예: new Error('…') → 'Error'). 없으면 null.
// 사용: jsStrings(src) → [{ line, col, quote, raw, value, callee }]

const ID_CHAR = /[\p{ID_Continue}$\u200C\u200D]/u;
const KEYWORDS_BEFORE_EXPR = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await']);

export function cook(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== '\\') { out += ch; continue; }
    const n = raw[++i];
    if (n === undefined) break;
    if (n === 'u') {
      if (raw[i + 1] === '{') {
        const end = raw.indexOf('}', i + 2);
        out += String.fromCodePoint(parseInt(raw.slice(i + 2, end), 16));
        i = end;
      } else {
        out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 5), 16));
        i += 4;
      }
    } else if (n === 'x') {
      out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (n === '\r') {
      if (raw[i + 1] === '\n') i++;
    } else if (n === '\n' || n === '\u2028' || n === '\u2029') {
      // 줄 이음
    } else {
      out += ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' })[n] ?? n;
    }
  }
  return out;
}

export function jsStrings(src) {
  const out = [];
  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
  const pos = (i) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStarts[m] <= i) lo = m; else hi = m - 1; }
    return { line: lo + 1, col: i - lineStarts[lo] + 1 };
  };
  const parenStack = []; // '(' 마다 바로 앞 낱말(함수 이름) 또는 null
  const push = (start, quote, raw) => out.push({ ...pos(start), quote, raw, value: cook(raw), callee: parenStack.length ? parenStack[parenStack.length - 1] : null });
  let lastIdent = null;

  let i = 0;
  const n = src.length;
  // 정규식이 올 수 있는 자리인가: 직전 의미 있는 낱말
  let prevKind = 'start'; // 'start' | 'punct' | 'value' | 'keyword'
  const braceStack = []; // 템플릿 ${ 안에서 '{' 깊이
  let tplDepth = 0;

  function readTemplate(startIdx) {
    // startIdx: 여는 ` 다음 또는 } (템플릿 이어짐) 다음
    let j = startIdx, chunkStart = startIdx;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') { push(chunkStart, '`', src.slice(chunkStart, j)); return { end: j + 1, closed: true }; }
      if (c === '$' && src[j + 1] === '{') { push(chunkStart, '`', src.slice(chunkStart, j)); return { end: j + 2, closed: false }; }
      j++;
    }
    push(chunkStart, '`', src.slice(chunkStart));
    return { end: n, closed: true };
  }

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '\'' || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      push(i + 1, c, src.slice(i + 1, j));
      i = j + 1; prevKind = 'value'; lastIdent = null; continue;
    }
    if (c === '`') {
      const r = readTemplate(i + 1);
      i = r.end;
      if (!r.closed) { tplDepth++; braceStack.push(0); prevKind = 'start'; }
      else prevKind = 'value';
      continue;
    }
    if (c === '/') {
      if (prevKind === 'value') { i++; prevKind = 'punct'; continue; } // 나눗셈
      // 정규식 리터럴
      let j = i + 1, inClass = false;
      while (j < n && src[j] !== '\n') {
        const ch = src[j];
        if (ch === '\\') { j += 2; continue; }
        if (ch === '[') inClass = true;
        else if (ch === ']') inClass = false;
        else if (ch === '/' && !inClass) break;
        j++;
      }
      j++;
      while (j < n && /[a-z]/i.test(src[j])) j++;
      i = j; prevKind = 'value'; continue;
    }
    if (c === '{' || c === '}') lastIdent = null;
    if (c === '{') { if (tplDepth) braceStack[braceStack.length - 1]++; i++; prevKind = 'punct'; continue; }
    if (c === '}') {
      if (tplDepth && braceStack[braceStack.length - 1] === 0) {
        braceStack.pop(); tplDepth--;
        const r = readTemplate(i + 1);
        i = r.end;
        if (!r.closed) { tplDepth++; braceStack.push(0); prevKind = 'start'; }
        else prevKind = 'value';
        continue;
      }
      if (tplDepth) braceStack[braceStack.length - 1]--;
      i++; prevKind = 'value'; continue; // 블록 끝 뒤 정규식은 드물다
    }
    if (c === '(') { parenStack.push(lastIdent); lastIdent = null; i++; prevKind = 'punct'; continue; }
    if (c === ')') { parenStack.pop(); lastIdent = null; i++; prevKind = 'value'; continue; }
    if (c === ']') { lastIdent = null; i++; prevKind = 'value'; continue; }
    if (ID_CHAR.test(c)) {
      let j = i;
      while (j < n && ID_CHAR.test(src[j])) j++;
      const word = src.slice(i, j);
      prevKind = KEYWORDS_BEFORE_EXPR.has(word) ? 'keyword' : 'value';
      lastIdent = prevKind === 'value' && !/^\d/.test(word) ? word : null;
      i = j; continue;
    }
    lastIdent = null; i++; prevKind = 'punct';
  }
  return out;
}
