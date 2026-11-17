import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtmlTable, jtskToWgs, parseDate, parseHour } from './parse.mjs';
import { code } from './build.mjs';
import { causeGroup, ageBucket } from './codes.mjs';
import { validate } from './validate.mjs';

const enc = (s) => {
  // minimal windows-1250 encoder for the characters used in the fixture
  const map = { 'Č': 0xc8, 'Í': 0xcd };
  return Uint8Array.from([...s].map((c) => map[c] ?? c.charCodeAt(0)));
};

test('parseHtmlTable reads header + rows and decodes cp1250', () => {
  const html = "<HTML><TABLE><TR><TH>p1</TH><TH>h</TH>\r\n</TR>\r\n<TR><TD>000025000001</TD><TD>JIČÍN</TD><TD></TD></TR>\r\n";
  const rows = parseHtmlTable(enc(html));
  assert.deepEqual(rows, [{ p1: '000025000001', h: 'JIČÍN' }]);
});

test('S-JTSK coordinates land in the right town', () => {
  const [lon, lat] = jtskToWgs('-1013606', '-670599'); // Jičín
  assert.ok(Math.abs(lat - 50.434) < 0.01 && Math.abs(lon - 15.372) < 0.01);
  assert.equal(jtskToWgs('0', '0'), null);
  assert.equal(jtskToWgs('', ''), null);
});

test('date and hour parsing', () => {
  assert.deepEqual(parseDate('11.01.2025'), { y: 2025, m: 1, d: 11 });
  assert.equal(parseHour('2325'), 23);
  assert.equal(parseHour('0720'), 7);
  assert.equal(parseHour('2560'), null); // unknown time
});

test('codes', () => {
  assert.equal(code('01'), '1');
  assert.equal(code(''), '');
  assert.equal(causeGroup('206'), 'speed');
  assert.equal(causeGroup('508'), 'driving');
  assert.equal(ageBucket('19'), 2);
  assert.equal(ageBucket('XX'), -1);
});

test('validate blocks shrinking data', () => {
  const prev = { years: [{ year: 2025, accidents: 85000, lastDate: '2025-12-31' }] };
  const now = { years: [{ year: 2025, complete: true, accidents: 20000, skipped: 0, lastDate: '2025-12-31' }] };
  assert.ok(validate(now, prev).length > 0);
  now.years[0].accidents = 85500;
  assert.deepEqual(validate(now, prev), []);
});
