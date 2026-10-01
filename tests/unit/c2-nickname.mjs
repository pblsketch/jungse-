// C2: 별명 규칙 (spec §10-1)
import assert from 'node:assert/strict';
import { boot } from './c2-fixtures.mjs';

const ctx = boot();
const check = ctx.NM.core.nickname.check;
const ok = (s) => assert.equal(check(s).ok, true, s);
const no = (s, reason) => { const r = check(s); assert.equal(r.ok, false, String(s)); assert.equal(r.reason, reason, String(s)); };

ok('세종'); ok('a'); ok('가'); ok('통사12'); ok('Abcdefgh'); ok('가나다라마바사아'); ok('12345678'); ok('Kim이도');
assert.equal(check('세종').reason, null);
no('', 'empty'); no(null, 'empty'); no(undefined, 'empty'); no(12, 'empty');
no('가나다라마바사아자', 'tooLong'); no('abcdefghi', 'tooLong');
no('세 종', 'space'); no(' 세종', 'space'); no('세종\t', 'space'); no('세　종', 'space');
no('세종!', 'chars'); no('ㅅㅈ', 'chars'); no('세_종', 'chars'); no('éa', 'chars'); no('😀', 'chars'); no('世宗', 'chars');
// 비속어(대소문자 무시, 부분 일치)
no('씨발', 'profanity'); no('너는병신', 'profanity'); no('FuCk1', 'profanity'); no('xShitx', 'profanity');
const list = ctx.NM.data.PROFANITY;
assert.ok(Array.isArray(list) && list.length >= 20);
for (const w of list) assert.equal(typeof w, 'string');
console.log('c2 nickname ok');
