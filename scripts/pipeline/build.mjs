// Turn the raw tables of one year into accident records, then aggregate.
import { parseHtmlTable, jtskToWgs, parseDate, parseHour } from './parse.mjs';
import { REGIONS, causeGroup, ALCOHOL_POSITIVE, DRUG_POSITIVE, FLAGS, ageBucket, AGE_BUCKETS } from './codes.mjs';

const num = (s) => {
  const n = Number(String(s ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
/** Normalise categorical codes: "01" and "1" are the same code in the police export. */
export const code = (s) => {
  const t = String(s ?? '').trim();
  if (t === '') return '';
  const n = Number(t);
  return Number.isFinite(n) ? String(n) : t;
};
const DAY = 86400000;
/** days since 1970-01-01 (UTC) */
const epochDay = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / DAY);

/**
 * @param {Record<string, Uint8Array>} files
 * @param {number} year
 */
export function buildYear(files, year) {
  const KEEP = new Set(['p1', 'p4a', 'p4b', 'p4c', 'p2a', 'p2b', 'p14*100', 'd', 'e', 'h', 'i', 'j', 'k', 'p45b', 'p47', 'p53', 'p33d', 'p59d', 'p37']);
  const norm = (rows) => {
    for (const r of rows) for (const k in r) if (!KEEP.has(k)) r[k] = code(r[k]);
    return rows;
  };
  const accRows = norm(parseHtmlTable(files.Inehody));
  const gps = new Map(parseHtmlTable(files.IntGPS).map((r) => [r.p1, r]));
  const vehRows = norm(parseHtmlTable(files.IVozidla));
  const personRows = norm(parseHtmlTable(files.Inasledky));
  const pedRows = norm(parseHtmlTable(files.Ichodci));

  // vehicles grouped by accident
  const vehByAcc = new Map();
  const vehKey = new Map();
  for (const v of vehRows) {
    (vehByAcc.get(v.p1) ?? vehByAcc.set(v.p1, []).get(v.p1)).push(v);
    vehKey.set(`${v.p1}/${v.id_vozidla}`, v);
  }
  const pedByAcc = new Map();
  for (const p of pedRows) (pedByAcc.get(p.p1) ?? pedByAcc.set(p.p1, []).get(p.p1)).push(p);

  const seen = new Set();
  const accidents = [];
  let skipped = 0;
  for (const r of accRows) {
    if (seen.has(r.p1)) continue;
    seen.add(r.p1);
    const dt = parseDate(r.p2a);
    if (!dt || dt.y !== year || !REGIONS[r.p4a]) {
      skipped++;
      continue;
    }
    const g = gps.get(r.p1);
    const coord = g ? jtskToWgs(g.d, g.e) : null;
    const vehs = vehByAcc.get(r.p1) ?? [];
    const types = new Set(vehs.map((v) => v.p44));
    let flags = 0;
    if (ALCOHOL_POSITIVE.has(r.p11)) flags |= FLAGS.ALCOHOL;
    if (DRUG_POSITIVE.has(r.p11a)) flags |= FLAGS.DRUGS;
    if (r.p6 === '4' || pedByAcc.has(r.p1)) flags |= FLAGS.PEDESTRIAN;
    if (types.has('13')) flags |= FLAGS.BIKE;
    if (types.has('2')) flags |= FLAGS.MOTO;
    if (r.p6 === '5' || r.p6 === '6') flags |= FLAGS.ANIMAL;
    if (types.has('17') || vehs.some((v) => v.p50a === '3' || v.p50a === '4')) flags |= FLAGS.HIT_AND_RUN;
    if (types.has('5') || types.has('6') || types.has('7')) flags |= FLAGS.TRUCK;
    const killed = num(r.p13a);
    const serious = num(r.p13b);
    const light = num(r.p13c);
    accidents.push({
      id: r.p1,
      y: dt.y, m: dt.m, d: dt.d,
      day: epochDay(dt.y, dt.m, dt.d),
      wd: (new Date(Date.UTC(dt.y, dt.m - 1, dt.d)).getUTCDay() + 6) % 7, // 0 = Monday
      h: parseHour(r.p2b),
      region: r.p4a,
      inTown: r.p5a === '1',
      type: r.p6,
      obstacle: r.p8,
      animal: r.p8a,
      culprit: r.p10,
      alc: r.p11,
      drug: r.p11a,
      cause: r.p12,
      cg: causeGroup(r.p12),
      killed, serious, light,
      damage: num(r['p14*100']), // despite the header name the value is already in CZK
      surface: r.p16,
      weather: r.p18,
      vis: r.p19,
      spot: r.p27,
      road: r.p36,
      flags,
      roadNo: r.p37 ?? '',
      town: g?.h?.trim() ?? '',
      lon: coord?.[0] ?? null,
      lat: coord?.[1] ?? null,
    });
  }
  return { accidents, vehRows, personRows, pedRows, vehKey, skipped };
}

// ---------- aggregation ----------
const zeros = (n) => new Array(n).fill(0);
const bump = (obj, key, acc = 1, killed = 0) => {
  const o = (obj[key] ??= { n: 0, k: 0 });
  o.n += acc;
  o.k += killed;
};

export function emptyBlock() {
  return {
    accidents: 0, injuryAcc: 0, fatalAcc: 0, killed: 0, serious: 0, light: 0, damage: 0,
    hour: { n: zeros(24), k: zeros(24) },
    wd: { n: zeros(7), k: zeros(7) },
    month: { n: zeros(12), k: zeros(12) },
    causeGroup: {}, cause: {}, type: {}, obstacle: {}, animal: {}, weather: {}, surface: {}, vis: {}, road: {}, spot: {},
    town: {},
    alcohol: { n: 0, k: 0, refused: 0, over15: 0, notChecked: 0 },
    drugs: { n: 0, k: 0, byType: {} },
    culprit: {},
    vehicles: {}, brands: {}, fuel: {}, driverState: {}, hitAndRun: 0, fire: 0, skid: 0,
    persons: { killedAge: zeros(AGE_BUCKETS.length), seriousAge: zeros(AGE_BUCKETS.length), killedSex: {}, role: {} },
    belts: { belted: { n: 0, k: 0, s: 0 }, unbelted: { n: 0, k: 0, s: 0 } },
    helmets: { moto: { with: { n: 0, k: 0 }, without: { n: 0, k: 0 } }, bike: { with: { n: 0, k: 0 }, without: { n: 0, k: 0 } } },
    peds: { n: 0, k: 0, s: 0, kids: 0, reflective: { yes: { n: 0, k: 0 }, no: { n: 0, k: 0 } }, situation: {}, behaviour: {}, drunk: 0, phoneish: 0, killedAge: zeros(AGE_BUCKETS.length) },
    days: {},
  };
}

function addAccident(b, a) {
  b.accidents++;
  if (a.killed + a.serious + a.light > 0) b.injuryAcc++;
  if (a.killed > 0) b.fatalAcc++;
  b.killed += a.killed;
  b.serious += a.serious;
  b.light += a.light;
  b.damage += a.damage;
  if (a.h != null) {
    b.hour.n[a.h]++;
    b.hour.k[a.h] += a.killed;
  }
  b.wd.n[a.wd]++;
  b.wd.k[a.wd] += a.killed;
  b.month.n[a.m - 1]++;
  b.month.k[a.m - 1] += a.killed;
  bump(b.causeGroup, a.cg, 1, a.killed);
  bump(b.cause, a.cause, 1, a.killed);
  bump(b.type, a.type, 1, a.killed);
  if (a.type === '3') bump(b.obstacle, a.obstacle, 1, a.killed);
  if (a.animal && a.animal !== '0') bump(b.animal, a.animal, 1, a.killed);
  bump(b.weather, a.weather, 1, a.killed);
  bump(b.surface, a.surface, 1, a.killed);
  bump(b.vis, a.vis, 1, a.killed);
  bump(b.road, a.road, 1, a.killed);
  bump(b.spot, a.spot, 1, a.killed);
  bump(b.town, a.inTown ? 'in' : 'out', 1, a.killed);
  bump(b.culprit, a.culprit, 1, a.killed);
  if (a.flags & 1) {
    b.alcohol.n++;
    b.alcohol.k += a.killed;
  }
  if (a.alc === '4') b.alcohol.refused++;
  if (a.alc === '9') b.alcohol.over15++;
  if (a.alc === '0') b.alcohol.notChecked++;
  if (a.flags & 2) {
    b.drugs.n++;
    b.drugs.k += a.killed;
    b.drugs.byType[a.drug] = (b.drugs.byType[a.drug] ?? 0) + 1;
  }
  const key = `${a.y}-${String(a.m).padStart(2, '0')}-${String(a.d).padStart(2, '0')}`;
  bump(b.days, key, 1, a.killed);
  if (WINTER_SURFACE.has(a.surface)) b.days[key].w = (b.days[key].w ?? 0) + 1;
}
const WINTER_SURFACE = new Set(['5', '6', '8', '9']); // ice / packed snow / slush / sudden icing

function addVehicle(b, v, killedInVeh) {
  bump(b.vehicles, v.p44, 1, killedInVeh);
  if ((v.p44 === '3' || v.p44 === '4') && v.p45a && v.p45a !== '0') bump(b.brands, v.p45a, 1, killedInVeh);
  if (v.p45d) bump(b.fuel, v.p45d, 1, killedInVeh);
  if (v.p57) bump(b.driverState, v.p57, 1, killedInVeh);
  if (v.p50a === '3' || v.p50a === '4') b.hitAndRun++;
  if (v.p50a === '2') b.fire++;
  if (v.p49 === '1') b.skid++;
}

function addPerson(b, p, veh) {
  const outcome = p.p59g; // 1 killed, 2 serious, 3 light, 4 none
  const k = outcome === '1' ? 1 : 0;
  const s = outcome === '2' ? 1 : 0;
  const ab = ageBucket(p.p59d);
  if (k && ab >= 0) b.persons.killedAge[ab]++;
  if (s && ab >= 0) b.persons.seriousAge[ab]++;
  if (k) {
    const sex = p.p59c === '1' || p.p59c === '3' ? 'm' : p.p59c === '2' || p.p59c === '4' ? 'f' : '?';
    b.persons.killedSex[sex] = (b.persons.killedSex[sex] ?? 0) + 1;
    b.persons.role[p.p59a] = (b.persons.role[p.p59a] ?? 0) + 1;
  }
  const belt = p.p59b;
  if (belt === '3' || belt === '7') {
    b.belts.belted.n++; b.belts.belted.k += k; b.belts.belted.s += s;
  } else if (belt === '4' || belt === '8') {
    b.belts.unbelted.n++; b.belts.unbelted.k += k; b.belts.unbelted.s += s;
  }
  const kind = veh?.p44 === '2' ? 'moto' : veh?.p44 === '13' ? 'bike' : null;
  if (kind && (belt === '1' || belt === '2')) {
    const h = b.helmets[kind][belt === '1' ? 'with' : 'without'];
    h.n++;
    h.k += k;
  }
}

function addPedestrian(b, p) {
  const k = p.p33g === '1' ? 1 : 0;
  const s = p.p33g === '2' ? 1 : 0;
  b.peds.n++;
  b.peds.k += k;
  b.peds.s += s;
  if (p.p33c === '3' || p.p33c === '4') b.peds.kids++;
  if (p.p29a === '1') { b.peds.reflective.yes.n++; b.peds.reflective.yes.k += k; }
  if (p.p29a === '2') { b.peds.reflective.no.n++; b.peds.reflective.no.k += k; }
  bump(b.peds.situation, p.p32, 1, k);
  bump(b.peds.behaviour, p.p31, 1, k);
  if (ALCOHOL_POSITIVE.has(p.p30a)) b.peds.drunk++;
  if (p.p30 === '2') b.peds.phoneish++;
  const ab = ageBucket(p.p33d);
  if (k && ab >= 0) b.peds.killedAge[ab]++;
}

/**
 * Aggregate one built year into blocks: national + per region.
 */
export function aggregateYear(built) {
  const national = emptyBlock();
  const regions = {};
  const accById = new Map();
  for (const a of built.accidents) {
    accById.set(a.id, a);
    addAccident(national, a);
    addAccident((regions[a.region] ??= emptyBlock()), a);
  }
  const killedInVeh = new Map();
  for (const p of built.personRows) {
    if (p.p59g === '1') {
      const key = `${p.p1}/${p.id_vozidla}`;
      killedInVeh.set(key, (killedInVeh.get(key) ?? 0) + 1);
    }
  }
  for (const v of built.vehRows) {
    const a = accById.get(v.p1);
    if (!a) continue;
    const k = killedInVeh.get(`${v.p1}/${v.id_vozidla}`) ?? 0;
    addVehicle(national, v, k);
    addVehicle(regions[a.region], v, k);
  }
  for (const p of built.personRows) {
    const a = accById.get(p.p1);
    if (!a) continue;
    const veh = built.vehKey.get(`${p.p1}/${p.id_vozidla}`);
    addPerson(national, p, veh);
    addPerson(regions[a.region], p, veh);
  }
  for (const p of built.pedRows) {
    const a = accById.get(p.p1);
    if (!a) continue;
    addPedestrian(national, p);
    addPedestrian(regions[a.region], p);
  }
  return { national, regions };
}

/** Deep-add block b into a (same shape). */
export function mergeBlocks(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === 'number') a[k] = (a[k] ?? 0) + v;
    else if (Array.isArray(v)) {
      a[k] ??= zeros(v.length);
      v.forEach((x, i) => (a[k][i] += x));
    } else if (v && typeof v === 'object') mergeBlocks((a[k] ??= {}), v);
  }
  return a;
}

/** Shrink a block for publishing: top-N days instead of every day. */
export function finalizeBlock(b) {
  const days = Object.entries(b.days);
  const worst = days.sort((x, y) => y[1].n - x[1].n)[0];
  const deadliest = days.sort((x, y) => y[1].k - x[1].k)[0];
  // ignore the most recent 14 days: late police reports make them look artificially calm
  const lastDay = days.map((d) => d[0]).sort().at(-1);
  const cutoff = lastDay ? new Date(Date.parse(lastDay) - 14 * DAY).toISOString().slice(0, 10) : '';
  const calmest = days.filter((d) => d[0] <= cutoff).sort((x, y) => x[1].n - y[1].n)[0];
  const out = { ...b, worstDay: worst && { date: worst[0], ...worst[1] }, deadliestDay: deadliest && { date: deadliest[0], ...deadliest[1] }, calmestDay: calmest && { date: calmest[0], ...calmest[1] }, dayCount: days.length };
  delete out.days;
  return out;
}

/** "On this day" table: per calendar day (MM-DD) totals across all years. */
export function dayOfYearTable(allAccidents) {
  const t = {};
  for (const a of allAccidents) {
    const key = `${String(a.m).padStart(2, '0')}-${String(a.d).padStart(2, '0')}`;
    const o = (t[key] ??= { n: 0, k: 0, s: 0, alc: 0, years: {} });
    o.n++;
    o.k += a.killed;
    o.s += a.serious;
    if (a.flags & 1) o.alc++;
    o.years[a.y] = (o.years[a.y] ?? 0) + 1;
  }
  return t;
}

/** Columnar, compact point set for the map (only accidents with casualties). */
export function pointsFor(accidents) {
  const cols = { lon: [], lat: [], day: [], h: [], k: [], s: [], l: [], type: [], cause: [], flags: [] };
  for (const a of accidents) {
    if (a.lon == null) continue;
    if (a.killed + a.serious + a.light === 0) continue;
    cols.lon.push(Math.round(a.lon * 1e5));
    cols.lat.push(Math.round(a.lat * 1e5));
    cols.day.push(a.day);
    cols.h.push(a.h ?? -1);
    cols.k.push(a.killed);
    cols.s.push(a.serious);
    cols.l.push(a.light);
    cols.type.push(Number(a.type));
    cols.cause.push(Number(a.cause) || 0);
    cols.flags.push(a.flags);
  }
  return { n: cols.lon.length, ...cols };
}

// ---------- black spots ----------
const SMALL_WORDS = new Set(['nad', 'pod', 'u', 'v', 've', 'na', 'and', 'der', 'pri', 'při']);
/** "BYSTŘICE NAD PERNŠTEJNEM" -> "Bystřice nad Pernštejnem" */
export function titleCase(s) {
  return s
    .toLocaleLowerCase('cs')
    .split(/(\s+|-)/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toLocaleUpperCase('cs') + w.slice(1)))
    .join('');
}

export function roadLabel(roadType, roadNo) {
  const n = String(roadNo ?? '').trim().replace(/^0+/, '');
  if (!n) return null;
  if (roadType === '0') return `D${n}`;
  if (roadType === '1') return `I/${n}`;
  if (roadType === '2') return `II/${n}`;
  if (roadType === '3') return `III/${n}`;
  return null;
}

const mode = (arr) => {
  const m = new Map();
  for (const x of arr) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  let best = null, bn = 0;
  for (const [k, v] of m) if (v > bn) { best = k; bn = v; }
  return best;
};

/**
 * Find the worst places: score ~250 m grid cells by severity, then pick the best cells
 * greedily, at least 1.5 km apart. Stats are computed for a 300 m radius around each spot.
 */
export function blackSpots(accidents, top = 100) {
  const inj = accidents.filter((a) => a.lon != null && a.killed + a.serious + a.light > 0);
  const CELL_LAT = 0.00225; // ~250 m
  const CELL_LON = 0.0035; // ~250 m at 50°N
  const cells = new Map();
  for (const a of inj) {
    const key = `${Math.round(a.lat / CELL_LAT)}:${Math.round(a.lon / CELL_LON)}`;
    const c = cells.get(key) ?? { score: 0, lat: 0, lon: 0, w: 0 };
    const sc = a.killed * 25 + a.serious * 6 + a.light;
    c.score += sc;
    c.lat += a.lat * sc;
    c.lon += a.lon * sc;
    c.w += sc;
    cells.set(key, c);
  }
  const ranked = [...cells.values()].sort((x, y) => y.score - x.score);
  const dist = (lat1, lon1, lat2, lon2) => {
    const dx = (lon2 - lon1) * 71500; // m per degree lon at ~50°N
    const dy = (lat2 - lat1) * 111200;
    return Math.hypot(dx, dy);
  };
  const picked = [];
  for (const c of ranked) {
    const lat = c.lat / c.w, lon = c.lon / c.w;
    if (picked.some((p) => dist(p.lat, p.lon, lat, lon) < 1500)) continue;
    picked.push({ lat, lon });
    if (picked.length >= top * 5) break;
  }
  const spots = picked.map((p) => {
    const near = inj.filter((a) => Math.abs(a.lat - p.lat) < 0.004 && Math.abs(a.lon - p.lon) < 0.006 && dist(p.lat, p.lon, a.lat, a.lon) <= 300);
    const causes = mode(near.filter((a) => a.cause !== '100').map((a) => a.cause));
    return {
      lat: Math.round(p.lat * 1e5) / 1e5,
      lon: Math.round(p.lon * 1e5) / 1e5,
      town: titleCase(mode(near.map((a) => a.town)) ?? ''),
      road: mode(near.map((a) => roadLabel(a.road, a.roadNo))),
      region: mode(near.map((a) => a.region)),
      n: near.length,
      k: near.reduce((s, a) => s + a.killed, 0),
      s: near.reduce((s, a) => s + a.serious, 0),
      l: near.reduce((s, a) => s + a.light, 0),
      cause: causes,
      causeN: near.filter((a) => a.cause === causes).length,
      peds: near.filter((a) => a.flags & 4).length,
      bikes: near.filter((a) => a.flags & 8).length,
      alcohol: near.filter((a) => a.flags & 1).length,
    };
  });
  // A black spot is a place where crashes keep happening, not one terrible crash.
  const MIN_CRASHES = 10;
  return spots
    .filter((x) => x.n >= MIN_CRASHES)
    .map((x) => ({ ...x, score: x.k * 25 + x.s * 6 + x.l })) // severity matters more than volume
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
    .map((x, i) => ({ rank: i + 1, ...x }));
}
