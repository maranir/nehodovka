// Types + loaders for the files produced by scripts/pipeline.
export type NK = { n: number; k: number };
export type Dict = Record<string, NK>;

export interface Block {
  accidents: number;
  injuryAcc: number;
  fatalAcc: number;
  killed: number;
  serious: number;
  light: number;
  damage: number;
  hour: { n: number[]; k: number[] };
  wd: { n: number[]; k: number[] };
  month: { n: number[]; k: number[] };
  causeGroup: Dict;
  cause: Dict;
  type: Dict;
  obstacle: Dict;
  animal: Dict;
  weather: Dict;
  surface: Dict;
  vis: Dict;
  road: Dict;
  spot: Dict;
  town: Dict;
  culprit: Dict;
  alcohol: { n: number; k: number; refused: number; over15: number; notChecked: number };
  drugs: { n: number; k: number; byType: Record<string, number> };
  vehicles: Dict;
  brands: Dict;
  fuel: Dict;
  driverState: Dict;
  hitAndRun: number;
  fire: number;
  skid: number;
  persons: { killedAge: number[]; seriousAge: number[]; killedSex: Record<string, number>; role: Record<string, number> };
  belts: { belted: { n: number; k: number; s: number }; unbelted: { n: number; k: number; s: number } };
  helmets: Record<'moto' | 'bike', { with: NK; without: NK }>;
  peds: {
    n: number; k: number; s: number; kids: number; drunk: number; phoneish: number;
    reflective: { yes: NK; no: NK };
    situation: Dict; behaviour: Dict; killedAge: number[];
  };
  worstDay?: { date: string; n: number; k: number; w?: number };
  deadliestDay?: { date: string; n: number; k: number; w?: number };
  calmestDay?: { date: string; n: number; k: number; w?: number };
  dayCount: number;
}

export interface Scope { national: Block; regions: Record<string, Block> }
export interface Stats { all: Scope; years: Record<string, Scope> }

export interface Region { key: string; cs: string; en: string; pop: number; bbox: [number, number, number, number] | null; points: number }
export interface Meta {
  generatedAt: string;
  latestDate: string;
  years: { year: number; complete: boolean; accidents: number; killed: number; lastDate: string }[];
  regions: Record<string, Region>;
  source: string;
}

export interface DayRow { n: number; k: number; s: number; alc: number; years: Record<string, number> }

/** Columnar map points (one row per accident with casualties). lon/lat are * 1e5. */
export interface Points {
  n: number;
  lon: number[]; lat: number[]; day: number[]; h: number[];
  k: number[]; s: number[]; l: number[]; type: number[]; cause: number[]; flags: number[];
}

export const FLAGS = { ALCOHOL: 1, DRUGS: 2, PEDESTRIAN: 4, BIKE: 8, MOTO: 16, ANIMAL: 32, HIT_AND_RUN: 64, TRUCK: 128 } as const;

const base = import.meta.env?.BASE_URL ?? '/';
const cache = new Map<string, Promise<unknown>>();
function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(`${base}data/${file}`).then((r) => {
        if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(file) as Promise<T>;
}

export const loadMeta = () => load<Meta>('meta.json');
export const loadStats = () => load<Stats>('stats.json');
export const loadDays = () => load<Record<string, DayRow>>('days.json');
export const loadPoints = (regionKey: string) => load<Points>(`points/${regionKey}.json`);

/** Sum a Dict's values (n or k) for a subset of keys. */
export const pick = (d: Dict, keys: string[], f: 'n' | 'k' = 'k') => keys.reduce((s, k) => s + (d[k]?.[f] ?? 0), 0);
export const argmax = (arr: number[]) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0);
export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const dayToDate = (day: number) => new Date(day * 86400000);

export interface BlackSpot {
  rank: number; lat: number; lon: number; town: string; road: string | null; region: string;
  n: number; k: number; s: number; l: number; cause: string | null; causeN: number; peds: number; bikes: number; alcohol: number;
}
export const loadSpots = () => load<BlackSpot[]>('blackspots.json');

/** Block of the most recent complete year (falls back to all data). */
export function latestFullYear(stats: Stats, meta: Meta) {
  const y = meta.years.filter((x) => x.complete).at(-1);
  return y ? { year: y.year, block: stats.years[y.year].national } : { year: meta.years.at(-1)!.year, block: stats.all.national };
}
