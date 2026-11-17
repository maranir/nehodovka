// Quiz question generators. All answers are computed from stats.json.
import { argmax, sum, type Block, type Meta, type Stats } from './data';
import type { T } from './i18n';
import { CAUSE, MONTH, WEEKDAY } from './labels';

export interface Question {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain: string;
  quip: string;
}

/** Deterministic PRNG so the daily quiz is the same for everyone on a given day. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
export const daySeed = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

function shuffle<T>(arr: T[], r: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a multiple-choice question from a correct option + distractors. */
function mc(id: string, q: string, correct: string, wrong: string[], explain: string, quip: string, r: () => number): Question {
  const options = shuffle([correct, ...shuffle(wrong, r).slice(0, 3)], r);
  return { id, q, options, correct: options.indexOf(correct), explain, quip };
}

/** Numeric question: distractors are the true value scaled. */
function numeric(id: string, q: string, value: number, fmt: (x: number) => string, explain: string, quip: string, r: () => number): Question {
  const factors = shuffle([0.25, 0.5, 2, 3.5, 0.65, 1.6], r).slice(0, 3);
  const wrong = factors.map((f) => fmt(value * f));
  return mc(id, q, fmt(value), wrong, explain, quip, r);
}

interface Killer { label: string; k: number }

export function buildQuestions(stats: Stats, meta: Meta, t: T, r: () => number): Question[] {
  const S: Block = stats.all.national;
  const cs = t.lang === 'cs';
  const L = (c: string, e: string) => (cs ? c : e);
  const from = meta.years[0].year;
  const since = L(`od roku ${from}`, `since ${from}`);
  const qs: Question[] = [];

  // 1. deadliest 3-hour window
  const win = (i: number) => `${i * 3}:00–${i * 3 + 3}:00`;
  const blocks = Array.from({ length: 8 }, (_, i) => S.hour.k[i * 3] + S.hour.k[i * 3 + 1] + S.hour.k[i * 3 + 2]);
  const bi = argmax(blocks);
  qs.push(mc('hour', L('Ve kterém tříhodinovém okně umírá na českých silnicích nejvíc lidí?', 'In which 3-hour window do most people die on Czech roads?'),
    win(bi), blocks.map((_, i) => win(i)).filter((_, i) => i !== bi),
    L(`${win(bi)}: ${t.n(blocks[bi])} mrtvých ${since}. Noc (0–3) jen ${t.n(blocks[0])}.`, `${win(bi)}: ${t.n(blocks[bi])} dead ${since}. Night (0–3): only ${t.n(blocks[0])}.`),
    L('Smrtka nedělá noční. Má ráda dopravní špičku.', "Death doesn't do night shifts. It loves rush hour."), r));

  // 2. weekday with most crashes
  const wd = argmax(S.wd.n);
  qs.push(mc('weekday', L('Který den v týdnu se stane nejvíc nehod?', 'Which day of the week has the most crashes?'),
    WEEKDAY[wd][t.lang], WEEKDAY.filter((_, i) => i !== wd).map((d) => d[t.lang]),
    L(`${WEEKDAY[wd].cs}: ${t.n(S.wd.n[wd])} nehod ${since}.`, `${WEEKDAY[wd].en}: ${t.n(S.wd.n[wd])} crashes ${since}.`),
    L('Víkend začíná v pátek. Pro někoho na urgentu.', 'The weekend starts on Friday. For some, in A&E.'), r));

  // 3. deadliest month
  const mo = argmax(S.month.k);
  qs.push(mc('month', L('Který měsíc je na silnicích nejsmrtelnější?', 'Which month is the deadliest on the roads?'),
    MONTH[mo][t.lang], MONTH.filter((_, i) => i !== mo).map((m) => m[t.lang]),
    L(`${MONTH[mo].cs}: ${t.n(S.month.k[mo])} mrtvých ${since}. Prosinec: ${t.n(S.month.k[11])}.`, `${MONTH[mo].en}: ${t.n(S.month.k[mo])} dead ${since}. December: ${t.n(S.month.k[11])}.`),
    L('Led tě zpomalí. Sucho a dovolená ne.', 'Ice slows you down. Dry roads and holidays don\'t.'), r));

  // 4. belts multiplier
  const { belted, unbelted } = S.belts;
  const mult = unbelted.k / unbelted.n / (belted.k / belted.n);
  qs.push(numeric('belts', L('Kolikrát vyšší je šance zemřít při nehodě, když nejsi připoutaný?', 'How many times higher is the chance of dying in a crash without a seatbelt?'),
    mult, (x) => `${t.p(Math.max(1.1, x))}×`,
    L(`Zhruba ${t.p(mult)}×. ${t.n(unbelted.k)} mrtvých nepřipoutaných ${since}.`, `About ${t.p(mult)}×. ${t.n(unbelted.k)} unbelted people dead ${since}.`),
    L('Pás je nejlevnější životní pojistka. Platíš dvěma sekundami.', 'A seatbelt is the cheapest life insurance. Premium: two seconds.'), r));

  // 5. deaths in latest complete year
  const full = meta.years.filter((y) => y.complete).at(-1);
  if (full) {
    qs.push(numeric('deaths', L(`Kolik lidí zemřelo při nehodách v Česku v roce ${full.year} (do 24 hodin od nehody)?`, `How many people died in road crashes in Czechia in ${full.year} (within 24 hours)?`),
      full.killed, (x) => t.n(Math.round(x)),
      L(`${t.n(full.killed)}. Průměrně ${t.p(full.killed / 365)} denně.`, `${t.n(full.killed)}. About ${t.p(full.killed / 365)} per day.`),
      L('Zhruba dvě plná letadla ročně. Jen to nespadne najednou, tak to není ve zprávách.', 'Roughly two full airliners a year. It just never happens all at once, so it never makes the news.'), r));
  }

  // 6. most common cause
  const causes = Object.entries(S.cause).filter(([c]) => CAUSE[c] && c !== '100').sort((a, b) => b[1].n - a[1].n);
  if (causes.length > 4) {
    const [top, ...rest] = causes;
    qs.push(mc('cause', L('Co je nejčastější příčina nehod v Česku?', 'What is the most common cause of crashes in Czechia?'),
      CAUSE[top[0]][t.lang], rest.slice(0, 6).map(([c]) => CAUSE[c][t.lang]),
      L(`„${CAUSE[top[0]].cs}“: ${t.n(top[1].n)} nehod ${since}.`, `"${CAUSE[top[0]].en}": ${t.n(top[1].n)} crashes ${since}.`),
      L('Nebyl to opilec ani pirát. Byl to někdo, kdo „jen na sekundu“ koukl jinam.', 'Not a drunk or a speed demon. Someone who looked away "just for a second".'), r));
  }

  // 7. region per capita
  const regs = Object.entries(stats.all.regions).map(([code, b]) => ({ code, rate: (b.killed / meta.regions[code].pop) * 1e5, name: meta.regions[code][t.lang] }));
  regs.sort((a, b) => b.rate - a.rate);
  qs.push(mc('region', L('Který kraj má nejvíc mrtvých na počet obyvatel?', 'Which region has the most road deaths per capita?'),
    regs[0].name, regs.slice(1).map((x) => x.name),
    L(`${regs[0].name}: ${t.p(regs[0].rate)} mrtvých na 100 tis. obyvatel ${since}. Nejméně ${regs.at(-1)!.name}: ${t.p(regs.at(-1)!.rate)}.`, `${regs[0].name}: ${t.p(regs[0].rate)} deaths per 100k people ${since}. Lowest: ${regs.at(-1)!.name}: ${t.p(regs.at(-1)!.rate)}.`),
    L('Kolony jsou otravné, ale bezpečné. V zácpě se umírá špatně.', 'Traffic jams are annoying but safe. Hard to die at 8 km/h.'), r));

  // 8–10. "who killed more" duels
  const killers: Killer[] = [
    { label: L('nárazy do stromu', 'hitting trees'), k: S.obstacle['1']?.k ?? 0 },
    { label: L('nehody s alkoholem', 'drink-driving crashes'), k: S.alcohol.k },
    { label: L('nehody s drogami', 'drug-driving crashes'), k: S.drugs.k },
    { label: L('srážky s vlakem', 'collisions with trains'), k: S.type['7']?.k ?? 0 },
    { label: L('srážky se zvěří', 'collisions with wildlife'), k: S.type['5']?.k ?? 0 },
    { label: L('nehody na dálnicích', 'motorway crashes'), k: S.road['0']?.k ?? 0 },
    { label: L('nehody na silnicích 1. třídy', 'crashes on class I roads'), k: S.road['1']?.k ?? 0 },
    { label: L('nehody v mlze', 'crashes in fog'), k: S.weather['2']?.k ?? 0 },
    { label: L('nehody za sněžení', 'crashes in snowfall'), k: S.weather['5']?.k ?? 0 },
    { label: L('nehody za hezkého počasí', 'crashes in nice weather'), k: S.weather['1']?.k ?? 0 },
    { label: L('srážky s chodcem', 'pedestrian collisions'), k: S.type['4']?.k ?? 0 },
    { label: L('předjíždění', 'overtaking'), k: S.causeGroup.overtaking?.k ?? 0 },
    { label: L('nepřiměřená rychlost', 'inappropriate speed'), k: S.causeGroup.speed?.k ?? 0 },
    { label: L('technické závady', 'technical defects'), k: S.causeGroup.technical?.k ?? 0 },
    { label: L('jízda v protisměru', 'driving on the wrong side'), k: S.cause['501']?.k ?? 0 },
  ];
  for (let i = 0; i < 3; i++) {
    let a: Killer, b: Killer;
    let guard = 0;
    do {
      a = killers[Math.floor(r() * killers.length)];
      b = killers[Math.floor(r() * killers.length)];
      guard++;
    } while ((a === b || Math.abs(a.k - b.k) < Math.max(a.k, b.k) * 0.15) && guard < 50);
    const win = a.k > b.k ? a : b;
    const lose = win === a ? b : a;
    const ratio = lose.k ? win.k / lose.k : Infinity;
    qs.push({
      id: `duel${i}`,
      q: L(`Co ${since} zabilo víc lidí?`, `What killed more people ${since}?`),
      options: [a.label, b.label],
      correct: win === a ? 0 : 1,
      explain: L(`${win.label}: ${t.n(win.k)} mrtvých, ${lose.label}: ${t.n(lose.k)}.`, `${win.label}: ${t.n(win.k)} dead, ${lose.label}: ${t.n(lose.k)}.`),
      quip: ratio > 3
        ? L('Ani to nebyl souboj. Spíš poprava.', "That wasn't a contest. More of an execution.")
        : ratio < 1.5
          ? L('Těsné. Ale v tomhle závodě nechceš být v žádném týmu.', "Close. But this is a race where you don't want to be on either team.")
          : L('Jasný vítěz. Gratulovat se ale nebude.', 'A clear winner. There will be no award ceremony.'),
    });
  }

  // 11. true / false myths
  const tin = S.town.in, tout = S.town.out;
  const myths: { q: string; truth: boolean; explain: string; quip: string }[] = [
    {
      q: L('Pravda, nebo mýtus: Víc lidí zemře při nehodách v obci než mimo obec.', 'True or myth: More people die in crashes inside towns than outside.'),
      truth: tin.k > tout.k,
      explain: L(`V obci ${t.n(tin.k)}, mimo obec ${t.n(tout.k)} mrtvých.`, `Inside towns ${t.n(tin.k)}, outside ${t.n(tout.k)} dead.`),
      quip: L('Ve městě bouráš za 50, za městem za 90. Fyziku nepřekecáš.', 'In town you crash at 50, outside at 90. You can\'t argue with physics.'),
    },
    {
      q: L('Pravda, nebo mýtus: Většina mrtvých zemře za deště, sněhu nebo mlhy.', 'True or myth: Most deaths happen in rain, snow or fog.'),
      truth: (S.weather['1']?.k ?? 0) < sum(Object.values(S.weather).map((w) => w.k)) / 2,
      explain: L(`${t.pct(S.weather['1']?.k ?? 0, sum(Object.values(S.weather).map((w) => w.k)))} mrtvých zemřelo za neztíženého počasí.`, `${t.pct(S.weather['1']?.k ?? 0, sum(Object.values(S.weather).map((w) => w.k)))} died in normal weather.`),
      quip: L('Za deště jsou lidi opatrní. Za sluníčka jsou lidi lidi.', 'In the rain people are careful. In the sun people are people.'),
    },
    {
      q: L('Pravda, nebo mýtus: Muži tvoří většinu mrtvých ve vozidlech.', 'True or myth: Men make up most of those killed in vehicles.'),
      truth: (S.persons.killedSex.m ?? 0) > (S.persons.killedSex.f ?? 0),
      explain: L(`Muži ${t.pct(S.persons.killedSex.m ?? 0, (S.persons.killedSex.m ?? 0) + (S.persons.killedSex.f ?? 0))}.`, `Men: ${t.pct(S.persons.killedSex.m ?? 0, (S.persons.killedSex.m ?? 0) + (S.persons.killedSex.f ?? 0))}.`),
      quip: L('„Podrž mi pivo“ není dopravní manévr.', '"Hold my beer" is not a driving manoeuvre.'),
    },
    {
      q: L('Pravda, nebo mýtus: Na dálnicích umírá víc lidí než na silnicích 1. třídy.', 'True or myth: More people die on motorways than on class I roads.'),
      truth: (S.road['0']?.k ?? 0) > (S.road['1']?.k ?? 0),
      explain: L(`Dálnice ${t.n(S.road['0']?.k ?? 0)}, silnice 1. třídy ${t.n(S.road['1']?.k ?? 0)}.`, `Motorways ${t.n(S.road['0']?.k ?? 0)}, class I roads ${t.n(S.road['1']?.k ?? 0)}.`),
      quip: L('Na dálnici nikdo nepotká kamion čelně. Většinou.', 'On a motorway nobody meets a truck head-on. Usually.'),
    },
  ];
  const yes = L('Pravda', 'True');
  const no = L('Mýtus', 'Myth');
  for (const m of shuffle(myths, r).slice(0, 2)) {
    qs.push({ id: 'myth-' + m.q.length, q: m.q, options: [yes, no], correct: m.truth ? 0 : 1, explain: m.explain, quip: m.quip });
  }

  // 12. reflective gear share
  const pr = S.peds.reflective;
  if (S.peds.k) {
    const share = (100 * pr.yes.k) / S.peds.k;
    qs.push(numeric('reflect', L('Kolik procent mrtvých chodců mělo na sobě reflexní prvek?', 'What share of pedestrians killed wore something reflective?'),
      share, (x) => `${t.p(Math.min(95, Math.max(1, x)))} %`,
      L(`Jen ${t.p(share)} %. ${t.n(pr.yes.k)} z ${t.n(S.peds.k)}.`, `Only ${t.p(share)} %. ${t.n(pr.yes.k)} of ${t.n(S.peds.k)}.`),
      L('Černá je elegantní. Hlavně na parte.', 'Black is elegant. Especially on an obituary.'), r));
  }

  // 13. wild animals count
  qs.push(numeric('deer', L(`Kolik srážek se srnkou zaznamenala policie ${since}?`, `How many collisions with roe deer did police record ${since}?`),
    S.animal['1']?.n ?? 0, (x) => t.n(Math.round(x / 100) * 100),
    L(`${t.n(S.animal['1']?.n ?? 0)}. A to jen ty nahlášené.`, `${t.n(S.animal['1']?.n ?? 0)}. And those are just the reported ones.`),
    L('Srnka je nejúspěšnější český tuner karoserií.', 'The roe deer: Czechia\'s most prolific body-shop customer acquisition channel.'), r));

  return shuffle(qs, r);
}

export const RANKS = [
  { min: 0, cs: 'Chodící statistika', en: 'Walking statistic', emoji: '🪦' },
  { min: 0.4, cs: 'Airbag s mozkem', en: 'Airbag with a brain', emoji: '🎈' },
  { min: 0.7, cs: 'Defenzivní řidič', en: 'Defensive driver', emoji: '🛡️' },
  { min: 0.9, cs: 'Smrtka tě nesnáší', en: 'Death hates you', emoji: '💀' },
];
export const rankFor = (ratio: number) => [...RANKS].reverse().find((r) => ratio >= r.min)!;
