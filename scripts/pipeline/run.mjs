#!/usr/bin/env node
// Data pipeline entry point.
//   node scripts/pipeline/run.mjs            -> discover + download + build into public/data
//   node scripts/pipeline/run.mjs --offline  -> rebuild from cached archives only
//   node scripts/pipeline/run.mjs --force    -> skip the "data shrank" safety check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverYear, downloadArchive, FIRST_YEAR } from './sources.mjs';
import { buildYear, aggregateYear, mergeBlocks, emptyBlock, finalizeBlock, dayOfYearTable, pointsFor, blackSpots } from './build.mjs';
import { REGIONS } from './codes.mjs';
import { validate } from './validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(root, 'public/data');
const CACHE = path.join(root, '.cache/raw');
const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');

const log = (...a) => console.log('[data]', ...a);

async function main() {
  const thisYear = new Date().getUTCFullYear();
  const sources = [];
  if (offline) {
    for (const f of fs.existsSync(CACHE) ? fs.readdirSync(CACHE) : []) {
      if (!f.endsWith('.rar.json')) continue;
      const slug = f.replace(/\.rar\.json$/, '');
      const y = Number(/(\d{4})$/.exec(slug)?.[1]);
      sources.push({ year: y, slug, url: '', complete: /^data\d{4}$/i.test(slug) });
    }
    // keep only the best source per year
    sources.sort((a, b) => a.year - b.year || Number(b.complete) - Number(a.complete) || b.slug.localeCompare(a.slug));
    for (let i = sources.length - 1; i > 0; i--) if (sources[i].year === sources[i - 1].year) sources.splice(i, 1);
  } else {
    for (let y = FIRST_YEAR; y <= thisYear + 1; y++) {
      const s = await discoverYear(y);
      if (s) sources.push(s);
      log(y, s ? `${s.slug} (${s.complete ? 'complete' : 'partial'})` : 'nothing published');
    }
  }
  if (!sources.length) throw new Error('No data sources found');

  const yearsMeta = [];
  const yearBlocks = {};
  const allRegion = {};
  const all = emptyBlock();
  const allAccidents = [];
  const pointsByRegion = {};

  for (const src of sources) {
    log('processing', src.slug);
    const { files, fileName, lastModified } = await downloadArchive(src, CACHE, { offline });
    const built = buildYear(files, src.year);
    const { national, regions } = aggregateYear(built);
    const last = built.accidents.reduce((m, a) => Math.max(m, a.day), 0);
    yearsMeta.push({
      year: src.year,
      complete: src.complete,
      accidents: built.accidents.length,
      killed: national.killed,
      lastDate: new Date(last * 86400000).toISOString().slice(0, 10),
      source: { file: fileName, page: src.page ?? null, url: src.url || null, lastModified: lastModified ?? null },
      skipped: built.skipped,
    });
    yearBlocks[src.year] = { national: finalizeBlock(structuredClone(national)), regions: Object.fromEntries(Object.entries(regions).map(([k, v]) => [k, finalizeBlock(structuredClone(v))])) };
    mergeBlocks(all, national);
    for (const [k, v] of Object.entries(regions)) mergeBlocks((allRegion[k] ??= emptyBlock()), v);
    for (const a of built.accidents) {
      allAccidents.push({ m: a.m, d: a.d, y: a.y, killed: a.killed, serious: a.serious, flags: a.flags });
      (pointsByRegion[a.region] ??= []).push(a);
    }
    log(`  ${built.accidents.length} accidents, ${national.killed} killed, last date ${yearsMeta.at(-1).lastDate}`);
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    years: yearsMeta,
    latestDate: yearsMeta.map((y) => y.lastDate).sort().at(-1),
    regions: Object.fromEntries(Object.entries(REGIONS).map(([code, r]) => [code, { ...r, bbox: null, points: 0 }])),
    source: 'Policie ČR – Statistiky dopravní nehodovosti (https://policie.gov.cz/statistiky-dopravni-nehodovosti)',
  };

  const previous = fs.existsSync(path.join(OUT, 'meta.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'meta.json'), 'utf8')) : null;
  const problems = validate(meta, previous);
  if (problems.length) {
    for (const p of problems) console.error('[data] VALIDATION:', p);
    if (!args.has('--force')) throw new Error('Validation failed; refusing to publish. Re-run with --force if the change is expected.');
  }

  // Collect every output file first, so we can tell whether anything actually changed.
  const outputs = {};
  for (const [code, accs] of Object.entries(pointsByRegion)) {
    const pts = pointsFor(accs);
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (let i = 0; i < pts.n; i++) {
      minLon = Math.min(minLon, pts.lon[i]); maxLon = Math.max(maxLon, pts.lon[i]);
      minLat = Math.min(minLat, pts.lat[i]); maxLat = Math.max(maxLat, pts.lat[i]);
    }
    meta.regions[code].bbox = [minLon / 1e5, minLat / 1e5, maxLon / 1e5, maxLat / 1e5];
    meta.regions[code].points = pts.n;
    outputs[`points/${REGIONS[code].key}.json`] = JSON.stringify(pts);
  }
  const stats = {
    all: { national: finalizeBlock(all), regions: Object.fromEntries(Object.entries(allRegion).map(([k, v]) => [k, finalizeBlock(v)])) },
    years: yearBlocks,
  };
  outputs['stats.json'] = JSON.stringify(stats);
  outputs['days.json'] = JSON.stringify(dayOfYearTable(allAccidents));
  outputs['blackspots.json'] = JSON.stringify(blackSpots(Object.values(pointsByRegion).flat()));

  const read = (f) => (fs.existsSync(path.join(OUT, f)) ? fs.readFileSync(path.join(OUT, f), 'utf8') : null);
  const changed = Object.entries(outputs).filter(([f, c]) => read(f) !== c).map(([f]) => f);
  if (!changed.length && previous) {
    meta.generatedAt = previous.generatedAt; // nothing new from the police: keep the file byte-identical
    log('no changes in the data');
  } else {
    log('changed files:', changed.join(', '));
  }
  fs.mkdirSync(path.join(OUT, 'points'), { recursive: true });
  for (const [f, c] of Object.entries(outputs)) fs.writeFileSync(path.join(OUT, f), c);
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed.length ? 'true' : 'false'}\n`);
  log('done. latest record:', meta.latestDate);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
