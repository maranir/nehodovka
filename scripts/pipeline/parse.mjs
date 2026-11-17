// Parsers for the Police CR accident export.
// The ".xls" files are really HTML tables encoded in windows-1250.
import proj4 from 'proj4';

const decoder = new TextDecoder('windows-1250');

/**
 * Parse an HTML-table "xls" export into an array of row objects keyed by header name.
 * @param {Uint8Array} bytes
 * @returns {Record<string,string>[]}
 */
export function parseHtmlTable(bytes) {
  const text = decoder.decode(bytes);
  const rows = text.split(/<TR>/i).slice(1);
  if (!rows.length) return [];
  const cellRe = /<T[HD]>([\s\S]*?)<\/T[HD]>/gi;
  const cells = (row) => [...row.matchAll(cellRe)].map((m) => m[1].trim());
  const header = cells(rows[0]);
  const out = new Array(rows.length - 1);
  for (let i = 1; i < rows.length; i++) {
    const c = cells(rows[i]);
    const o = {};
    for (let j = 0; j < header.length; j++) o[header[j]] = c[j] ?? '';
    out[i - 1] = o;
  }
  return out;
}

// S-JTSK / Krovak East North (EPSG:5514) -> WGS84
const KROVAK =
  '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=572.213,85.334,461.94,4.9732,1.529,5.2484,3.5378 +units=m +no_defs';
const toWgs = proj4(KROVAK, 'WGS84');

/** Convert police GPS columns (d = X/northing, e = Y/easting, both negative metres) to [lon, lat]. */
export function jtskToWgs(d, e) {
  const x = Number(String(e).replace(',', '.'));
  const y = Number(String(d).replace(',', '.'));
  if (!Number.isFinite(x) || !Number.isFinite(y) || x === 0 || y === 0) return null;
  // Rough S-JTSK bounding box of Czechia; anything outside is garbage.
  if (x > -400000 || x < -950000 || y > -900000 || y < -1250000) return null;
  const [lon, lat] = toWgs.forward([x, y]);
  if (lat < 48.4 || lat > 51.2 || lon < 11.9 || lon > 19.0) return null;
  return [lon, lat];
}

/** "11.01.2025" -> {y,m,d} */
export function parseDate(s) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
  if (!m) return null;
  return { y: +m[3], m: +m[2], d: +m[1] };
}

/** "2325" -> 23 (hour), "2560"/"25xx" means unknown -> null */
export function parseHour(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const h = Math.floor(n / 100);
  return h >= 0 && h <= 23 ? h : null;
}
