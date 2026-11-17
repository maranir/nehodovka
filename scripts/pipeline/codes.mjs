// Code lists from the Police CR form ("Položky formuláře"). Only the ones the pipeline needs.

/** p4a region codes -> stable keys, names, and population (ČSÚ, approx. 1. 1. 2025). */
export const REGIONS = {
  '00': { key: 'PHA', cs: 'Hlavní město Praha', en: 'Prague', pop: 1397880 },
  '01': { key: 'STC', cs: 'Středočeský kraj', en: 'Central Bohemia', pop: 1455940 },
  '02': { key: 'JHC', cs: 'Jihočeský kraj', en: 'South Bohemia', pop: 652303 },
  '03': { key: 'PLK', cs: 'Plzeňský kraj', en: 'Plzeň Region', pop: 614393 },
  '04': { key: 'ULK', cs: 'Ústecký kraj', en: 'Ústí nad Labem Region', pop: 811069 },
  '05': { key: 'HKK', cs: 'Královéhradecký kraj', en: 'Hradec Králové Region', pop: 555268 },
  '06': { key: 'JHM', cs: 'Jihomoravský kraj', en: 'South Moravia', pop: 1226749 },
  '07': { key: 'MSK', cs: 'Moravskoslezský kraj', en: 'Moravia-Silesia', pop: 1177989 },
  '14': { key: 'OLK', cs: 'Olomoucký kraj', en: 'Olomouc Region', pop: 631226 },
  '15': { key: 'ZLK', cs: 'Zlínský kraj', en: 'Zlín Region', pop: 573436 },
  '16': { key: 'VYS', cs: 'Kraj Vysočina', en: 'Vysočina', pop: 515563 },
  '17': { key: 'PAK', cs: 'Pardubický kraj', en: 'Pardubice Region', pop: 527761 },
  '18': { key: 'LBK', cs: 'Liberecký kraj', en: 'Liberec Region', pop: 448834 },
  '19': { key: 'KVK', cs: 'Karlovarský kraj', en: 'Karlovy Vary Region', pop: 287994 },
};

/** p12 main cause -> group key */
export function causeGroup(code) {
  const c = Number(code);
  if (c === 100) return 'notDriver';
  if (c >= 200 && c < 300) return 'speed';
  if (c >= 300 && c < 400) return 'overtaking';
  if (c >= 400 && c < 500) return 'priority';
  if (c >= 500 && c < 600) return 'driving';
  if (c >= 600 && c < 700) return 'technical';
  return 'other';
}
export const CAUSE_GROUPS = ['speed', 'overtaking', 'priority', 'driving', 'technical', 'notDriver', 'other'];

/** p11 alcohol codes meaning "alcohol detected" */
export const ALCOHOL_POSITIVE = new Set(['1', '3', '6', '7', '8', '9']);
/** p11a drug codes meaning "drug detected" */
export const DRUG_POSITIVE = new Set(['1', '2', '3', '4', '5', '6']);

/** p44 vehicle types we care about */
export const VEH = { MOTO: '2', CAR: '3', CAR_TRAILER: '4', TRUCK: ['5', '6', '7'], BUS: '8', TRACTOR: '9', TRAM: '10', BIKE: '13', TRAIN: '16', HIT_RUN: '17' };

/** Bit flags stored per map point */
export const FLAGS = {
  ALCOHOL: 1,
  DRUGS: 2,
  PEDESTRIAN: 4,
  BIKE: 8,
  MOTO: 16,
  ANIMAL: 32,
  HIT_AND_RUN: 64,
  TRUCK: 128,
};

export const AGE_BUCKETS = [
  [0, 14], [15, 17], [18, 24], [25, 34], [35, 44], [45, 54], [55, 64], [65, 74], [75, 200],
];
export function ageBucket(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a < 0 || a > 120) return -1;
  return AGE_BUCKETS.findIndex(([lo, hi]) => a >= lo && a <= hi);
}
