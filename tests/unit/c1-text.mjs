// C1 표기 처리: 방점, 루비, 꾸밈, 음절 나누기, 읽기 도우미, 비교, DOM 만들기
import assert from 'node:assert/strict';
import { load } from '../lib/load.mjs';

const ctx = load(['js/core/ns.js', 'js/data/jamo.js', 'js/core/yet.js']);
const yet = ctx.NM.core.yet;
const u = (...cps) => String.fromCodePoint(...cps);
const MAL = u(0x1106, 0x119E, 0x11AF);   // ᄆᆞᆯ
const SSA = u(0x110A, 0x119E);           // ᄊᆞ
const G = '〮', S = '〯';        // 거성·상성 방점
// vm 컨텍스트 배열은 다른 realm 이라 deepEqual 전에 평범한 값으로 바꾼다
const plain = (v) => JSON.parse(JSON.stringify(v));

// ── 기본 렌더 ──
assert.equal(yet.render('나랏[ㅁㆍㄹ][ㅆㆍ]미'), '나랏' + MAL + SSA + '미');
assert.equal(yet.render('그냥 글'), '그냥 글');
assert.equal(yet.render(''), '');

// ── 방점: 데이터에는 음절 앞, 출력은 음절 뒤 ──
assert.equal(yet.render('·나랏:[ㅁㆍㄹ]'), '나' + G + '랏' + MAL + S);
assert.equal(yet.render('·나랏:[ㅁㆍㄹ]', { bangjeom: false }), '나랏' + MAL);
assert.equal(yet.render('·ᄒᆞ'), 'ᄒᆞ' + G, '붙여 넣은 옛한글 음절 앞 방점');
assert.equal(yet.render('나' + G), '나' + G, '유니코드 순서로 적은 방점은 그대로');
assert.equal(yet.render('나' + G, { bangjeom: false }), '나', '끄면 직접 적은 방점도 숨긴다');
// 음절 앞이 아니면 가운뎃점·쌍점은 글자 그대로
assert.equal(yet.render('가 · 나'), '가 · 나');
assert.equal(yet.render('예: 가'), '예: 가');
assert.equal(yet.render('10:30'), '10:30');
assert.equal(yet.render('끝·'), '끝·');
// 역빗금으로 글자 그대로
assert.equal(yet.render('\\·나'), '·나');
assert.equal(yet.render('\\:나'), ':나');
assert.equal(yet.render('\\[ㄱ\\]'), '[ㄱ]');
assert.equal(yet.render('\\*\\*'), '**');
// 전역 켜고 끄기
assert.equal(yet.settings.bangjeom, true);
yet.setBangjeom(false);
assert.equal(yet.render('·나'), '나');
assert.equal(yet.render('·나', { bangjeom: true }), '나' + G, '호출별 선택이 전역보다 앞선다');
yet.setBangjeom(true);
assert.equal(yet.render('·나'), '나' + G);

// ── 루비 {漢字|읽기} ──
let t = yet.parse('{國|·[ㄱㅜㅣㄱ]}');
assert.deepEqual(plain(t), [{ type: 'ruby', base: '國', reading: '귁' + G, bold: false, underline: false }]);
t = yet.parse('{字|[ㅉㆍㅇ]}字');
assert.equal(t[0].reading, u(0x110D, 0x119E, 0x11BC));
assert.equal(t[1].text, '字');
assert.equal(yet.render('{字|[ㅉㆍㅇ]}'), '字(' + u(0x110D, 0x119E, 0x11BC) + ')');
assert.equal(yet.render('{字|[ㅉㆍㅇ]}', { ruby: 'base' }), '字');
assert.equal(yet.render('{字|[ㅉㆍㅇ]}', { ruby: 'reading' }), u(0x110D, 0x119E, 0x11BC));
assert.equal(yet.render('{國|·귁}', { bangjeom: false }), '國(귁)');

// ── 꾸밈 **굵게** _밑줄_ ──
t = yet.parse('**굵게** 보통 _밑줄_을');
assert.deepEqual(plain(t), [
  { type: 'text', text: '굵게', bold: true, underline: false },
  { type: 'text', text: ' 보통 ', bold: false, underline: false },
  { type: 'text', text: '밑줄', bold: false, underline: true },
  { type: 'text', text: '을', bold: false, underline: false }
]);
assert.equal(yet.render('**굵게** 보통 _밑줄_을'), '굵게 보통 밑줄을');
t = yet.parse('**_[ㅎㆍ]_{國|귁}**');
assert.deepEqual(plain(t), [
  { type: 'text', text: 'ᄒᆞ', bold: true, underline: true },
  { type: 'ruby', base: '國', reading: '귁', bold: true, underline: false }
]);
assert.equal(yet.render('snake_case a_b'), 'snake_case a_b', '영숫자 사이 밑줄표는 글자');
assert.equal(yet.toPlain(yet.parse('**가**{國|귁}')), '가國(귁)');

// ── 잘못된 표기는 던진다 ──
for (const bad of ['**굵게', '_밑줄', '[ㄱㅏ', 'ㄱㅏ]', '{國', '{國}', '{國|}', '{|귁}', '{a|{b|c}}', '[]', '[ㄱㅏㄱㅏ]', '·[ㄱㅏx]', '끝\\']) {
  assert.throws(() => yet.render(bad), /옛한글|표기/, `잘못된 표기: ${bad}`);
}

// ── 음절 나누기 ──
const shown = yet.render('나랏:[ㅁㆍㄹ] [ㅆㆍ]미');
assert.deepEqual(plain(yet.splitSyllables(shown)), ['나', '랏', MAL + S, ' ', SSA, '미']);
assert.deepEqual(plain(yet.splitSyllables('가ᇰ나')), ['가ᇰ', '나'], '완성형 + 옛 종성은 한 음절');
assert.deepEqual(plain(yet.splitSyllables('ᄀᅠab')), ['ᄀᅠ', 'a', 'b']);
assert.deepEqual(plain(yet.splitSyllables('國' + G + '😀')), ['國' + G, '😀']);
assert.deepEqual(plain(yet.splitSyllables(u(0x1122, 0x116E, 0x11AF, 0x1109, 0x119E))), [u(0x1122, 0x116E, 0x11AF), u(0x1109, 0x119E)]);
assert.deepEqual(plain(yet.splitSyllables('')), []);

// ── 화면 읽기용 현대 글자 (채점과 무관한 접근성 보조) ──
const m = (s, o) => yet.modernReading(s, o);
assert.equal(m('나랏[ㅁㆍㄹ][ㅆㆍ]미'), '나랏말싸미');
assert.equal(m('·나랏:[ㅁㆍㄹ]'), '나랏말', '방점 제거');
assert.equal(m('나' + G + MAL + S), '나말', '이미 렌더된 문자열도 받는다');
assert.equal(m('[ㅂㅅㄱㅜㄹ]'), '꿀');
assert.equal(m('[ㅂㄷㅡㄷ]'), '뜯');
assert.equal(m('[ㅄㆍㄹ]'), '쌀');
assert.equal(m('[ㅁㆍ][ㅿㆍㅁ]'), '마암');
assert.equal(m('[ㅇㅣㆁ]'), '잉');
assert.equal(m('[ㆆㅡㅁ]'), '음');
assert.equal(m('[ㅂㅏㄹㆆ]'), '발');
assert.equal(m('[ㄱㆉ]'), '교');
assert.equal(m('[ㅸㅓ]'), '버');
assert.equal(m('[ㅅㆎ]'), '새');
assert.equal(m('{國|·[ㄱㅜㅣㄱ]}'), '귁', '루비는 읽기를 쓴다');
assert.equal(m('**굵게**'), '굵게');
assert.equal(m('ㆍ는'), '아래아는', '홀로 쓴 옛 자모는 이름으로');
assert.equal(m('아무거나', { modern: '덮어쓰기' }), '덮어쓰기', '데이터의 modern 값이 우선');

// ── 화면 비교용 정규화 (채점은 id 로 한다) ──
assert.equal(yet.normalize('가'), '가');
assert.ok(yet.same('가', '가'));
assert.ok(yet.same('그ᅵ', '긔'), '중성 둘 → 겹중성');
assert.ok(yet.same('ᄇᄉ굴', u(0x1122, 0x116E, 0x11AF)), '초성 셋 → 합용병서');
assert.equal(yet.normalize('가ᇰ'), '가ᇰ', '옛 종성이 붙으면 풀어쓴다');
assert.ok(!yet.same('가' + G, '가'));
assert.ok(yet.same('가' + G, '가', { tone: false }));
assert.ok(yet.same('Café', 'Café'), '그 밖의 글자는 NFC');

// ── DOM 만들기 (innerHTML 금지) ──
function fakeDoc() {
  const mk = (tag) => ({
    nodeType: 1, tagName: tag.toUpperCase(), children: [], attrs: {},
    appendChild(c) { this.children.push(c); return c; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    set innerHTML(_) { throw new Error('innerHTML 사용 금지'); },
    get textContent() { return this.children.map(c => c.textContent).join(''); }
  });
  return {
    createElement: mk,
    createDocumentFragment: () => mk('#fragment'),
    createTextNode: (s) => ({ nodeType: 3, textContent: String(s) })
  };
}
const doc = fakeDoc();
const frag = yet.buildDom('**굵**{國|·귁}_밑_<b>', { document: doc });
assert.equal(frag.children.length, 4);
assert.equal(frag.children[0].tagName, 'STRONG');
assert.equal(frag.children[0].textContent, '굵');
const ruby = frag.children[1];
assert.equal(ruby.tagName, 'RUBY');
assert.deepEqual(ruby.children.map(c => c.tagName || '#text'), ['#text', 'RP', 'RT', 'RP']);
assert.equal(ruby.children[2].textContent, '귁' + G);
assert.equal(frag.children[2].tagName, 'U');
assert.equal(frag.children[3].nodeType, 3);
assert.equal(frag.children[3].textContent, '<b>', '데이터의 꺾쇠는 글자로 남는다');
// 표기 오류: 던지지 않고 오류 모음에 넣은 뒤 원문 글자를 그대로 보인다 (점검은 오류 모음으로 실패)
const before = ctx.__nmErrors.length;
const bad = yet.buildDom('[ㄱㅏㄱㅏ]', { document: doc });
assert.equal(ctx.__nmErrors.length, before + 1);
assert.equal(bad.textContent, '[ㄱㅏㄱㅏ]');

console.log('c1 text ok');
