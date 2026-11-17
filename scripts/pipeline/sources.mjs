// Discovery + download of the raw police archives.
import fs from 'node:fs';
import path from 'node:path';
import { createExtractorFromData } from 'node-unrar-js';

const BASE = 'https://policie.gov.cz';
export const FIRST_YEAR = 2023; // first year the police publish as raw records on policie.gov.cz
const UA = 'nehodovka-data-pipeline (open data import)';

async function fetchRetry(url, opts = {}, tries = 4) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { 'user-agent': UA, ...(opts.headers || {}) } });
      if (res.status >= 500) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (e) {
      err = e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw err;
}

/**
 * Find the raw-data RAR for a given year.
 * Prefers the complete-year archive ("data2025"); falls back to the rolling current-year one ("dataweb102026").
 * @returns {Promise<null | {year:number, url:string, slug:string, complete:boolean, page:string}>}
 */
export async function discoverYear(year) {
  const page = `${BASE}/statistiky-dopravni-nehodovosti-za-rok-${year}`;
  const res = await fetchRetry(page);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${page}`);
  const html = await res.text();
  const slugs = [...new Set([...html.matchAll(/https:\/\/policie\.gov\.cz\/documents\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]))];
  const complete = slugs.find((s) => s.toLowerCase() === `data${year}`);
  const rolling = slugs.filter((s) => /^dataweb/i.test(s));
  const slug = complete ?? rolling.sort().at(-1);
  if (!slug) return null;
  return { year, slug, url: `${BASE}/documents/${slug}?disposition=attachment`, complete: Boolean(complete), page };
}

/** Download (with a simple on-disk cache keyed by slug + ETag) and extract a RAR into memory. */
export async function downloadArchive(src, cacheDir, { offline = false } = {}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, `${src.slug}.rar`);
  const metaFile = file + '.json';
  const cached = fs.existsSync(file) && fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : null;
  let fileName = cached?.fileName ?? `${src.slug}.rar`;
  let lastModified = cached?.lastModified ?? null;
  if (!offline) {
    const headers = cached?.etag ? { 'if-none-match': cached.etag } : {};
    const res = await fetchRetry(src.url, { headers });
    if (res.status === 304) {
      // cached copy still valid
    } else if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.subarray(0, 4).toString('latin1') !== 'Rar!') throw new Error(`${src.url} did not return a RAR archive`);
      fs.writeFileSync(file, buf);
      const cd = res.headers.get('content-disposition') || '';
      fileName = /filename="([^"]+)"/.exec(cd)?.[1] ?? fileName;
      lastModified = res.headers.get('last-modified');
      fs.writeFileSync(metaFile, JSON.stringify({ etag: res.headers.get('etag'), lastModified, fileName }));
    } else {
      throw new Error(`HTTP ${res.status} for ${src.url}`);
    }
  } else if (!cached) {
    throw new Error(`offline mode and no cached archive for ${src.slug}`);
  }
  const data = fs.readFileSync(file);
  const extractor = await createExtractorFromData({ data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
  const files = {};
  for (const f of extractor.extract().files) {
    if (!f.extraction) continue;
    const name = path.basename(f.fileHeader.name.replace(/\\/g, '/')).replace(/\.xls$/i, '');
    files[name] = f.extraction;
  }
  for (const need of ['Inehody', 'IntGPS', 'IVozidla', 'Inasledky', 'Ichodci']) {
    if (!files[need]) throw new Error(`${src.slug}: archive is missing ${need}.xls (found: ${Object.keys(files).join(', ')})`);
  }
  return { files, fileName, lastModified };
}
