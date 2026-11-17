// Merges per-region point files into one in-memory table + GeoJSON for the map.
import { FLAGS, loadPoints, type Meta } from './data';

export interface Merged {
  n: number;
  lon: Float64Array; lat: Float64Array; day: Int32Array; year: Int16Array; h: Int8Array;
  k: Uint8Array; s: Uint8Array; l: Uint16Array; type: Uint8Array; cause: Uint16Array; flags: Uint16Array;
}

export async function loadAllPoints(meta: Meta): Promise<Merged> {
  const keys = Object.values(meta.regions).filter((r) => r.points > 0).map((r) => r.key);
  const parts = await Promise.all(keys.map((k) => loadPoints(k)));
  const n = parts.reduce((s, p) => s + p.n, 0);
  const m: Merged = {
    n,
    lon: new Float64Array(n), lat: new Float64Array(n), day: new Int32Array(n), year: new Int16Array(n), h: new Int8Array(n),
    k: new Uint8Array(n), s: new Uint8Array(n), l: new Uint16Array(n), type: new Uint8Array(n), cause: new Uint16Array(n), flags: new Uint16Array(n),
  };
  let o = 0;
  for (const p of parts) {
    for (let i = 0; i < p.n; i++, o++) {
      m.lon[o] = p.lon[i] / 1e5;
      m.lat[o] = p.lat[i] / 1e5;
      m.day[o] = p.day[i];
      m.year[o] = new Date(p.day[i] * 86400000).getUTCFullYear();
      m.h[o] = p.h[i];
      m.k[o] = p.k[i];
      m.s[o] = p.s[i];
      m.l[o] = p.l[i];
      m.type[o] = p.type[i];
      m.cause[o] = p.cause[i];
      m.flags[o] = p.flags[i];
    }
  }
  return m;
}

export const severity = (m: Merged, i: number) => (m.k[i] > 0 ? 3 : m.s[i] > 0 ? 2 : 1);

export function toGeoJSON(m: Merged): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = new Array(m.n);
  for (let i = 0; i < m.n; i++) {
    const f = m.flags[i];
    features[i] = {
      type: 'Feature',
      id: i,
      geometry: { type: 'Point', coordinates: [m.lon[i], m.lat[i]] },
      properties: {
        i,
        sev: severity(m, i),
        y: m.year[i],
        a: f & FLAGS.ALCOHOL || f & FLAGS.DRUGS ? 1 : 0,
        p: f & FLAGS.PEDESTRIAN ? 1 : 0,
        b: f & FLAGS.BIKE ? 1 : 0,
        m: f & FLAGS.MOTO ? 1 : 0,
        z: f & FLAGS.ANIMAL ? 1 : 0,
      },
    };
  }
  return { type: 'FeatureCollection', features };
}

const R = 6371000;
export function distance(lon1: number, lat1: number, lon2: number, lat2: number) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface AreaStats {
  n: number; k: number; s: number; l: number;
  alcohol: number; peds: number; bikes: number; motos: number; animals: number;
  topCause: number | null; topCauseN: number; worstHour: number | null; nearestFatal: number | null;
  years: number;
}

/** Stats for all injury accidents within `radius` metres of a point. */
export function areaStats(m: Merged, lon: number, lat: number, radius = 1000): AreaStats {
  const st: AreaStats = { n: 0, k: 0, s: 0, l: 0, alcohol: 0, peds: 0, bikes: 0, motos: 0, animals: 0, topCause: null, topCauseN: 0, worstHour: null, nearestFatal: null, years: 0 };
  const causes = new Map<number, number>();
  const hours = new Array(24).fill(0);
  const dLat = radius / 111000;
  const dLon = radius / (111000 * Math.cos((lat * Math.PI) / 180));
  let nearest = Infinity;
  for (let i = 0; i < m.n; i++) {
    if (Math.abs(m.lat[i] - lat) > dLat * 6 || Math.abs(m.lon[i] - lon) > dLon * 6) continue;
    const d = distance(lon, lat, m.lon[i], m.lat[i]);
    if (m.k[i] > 0 && d < nearest) nearest = d;
    if (d > radius) continue;
    st.n++;
    st.k += m.k[i];
    st.s += m.s[i];
    st.l += m.l[i];
    const f = m.flags[i];
    if (f & FLAGS.ALCOHOL) st.alcohol++;
    if (f & FLAGS.PEDESTRIAN) st.peds++;
    if (f & FLAGS.BIKE) st.bikes++;
    if (f & FLAGS.MOTO) st.motos++;
    if (f & FLAGS.ANIMAL) st.animals++;
    if (m.cause[i] && m.cause[i] !== 100) causes.set(m.cause[i], (causes.get(m.cause[i]) ?? 0) + 1);
    if (m.h[i] >= 0) hours[m.h[i]]++;
  }
  for (const [c, n] of causes) if (n > st.topCauseN) { st.topCause = c; st.topCauseN = n; }
  if (st.n) st.worstHour = hours.indexOf(Math.max(...hours));
  st.nearestFatal = Number.isFinite(nearest) ? nearest : null;
  return st;
}
