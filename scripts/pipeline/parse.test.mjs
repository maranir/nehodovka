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

test('black spot helpers', async () => {
  const { titleCase, roadLabel, blackSpots } = await import('./build.mjs');
  assert.equal(titleCase('BYSTŘICE NAD PERNŠTEJNEM'), 'Bystřice nad Pernštejnem');
  assert.equal(titleCase('FRÝDEK-MÍSTEK'), 'Frýdek-Místek');
  assert.equal(roadLabel('0', '1'), 'D1');
  assert.equal(roadLabel('2', '0118'), 'II/118');
  assert.equal(roadLabel('6', ''), null);
  const a = (lat, lon, killed) => ({ lat, lon, killed, serious: 0, light: 1, cause: '206', town: 'X', road: '1', roadNo: '3', region: '00', flags: 0 });
  const cluster = Array.from({ length: 12 }, (_, i) => a(50 + i * 0.00001, 14, i === 0 ? 1 : 0));
  const spots = blackSpots([...cluster, a(49, 16, 0)], 5);
  assert.equal(spots.length, 1); // the lone crash is not a black spot
  assert.equal(spots[0].n, 12);
  assert.equal(spots[0].road, 'I/3');
});
