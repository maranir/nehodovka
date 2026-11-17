// "Black cards": darkly funny, data-driven fact cards. Every number comes from stats.json,
// so the copy stays correct when the data updates.
// House rule: the joke targets behaviour and situations, never the victims.
import { argmax, pick, sum, type Block, type DayRow, type Meta } from './data';
import type { T } from './i18n';
import { BRAND, CAUSE, MONTH, WEEKDAY } from './labels';

export type CardCat = 'people' | 'speed' | 'alcohol' | 'time' | 'animals' | 'weird' | 'myth';
export type CardVariant = 'black' | 'white' | 'red';

export const CATS: { id: CardCat | 'all'; cs: string; en: string }[] = [
  { id: 'all', cs: 'Vše', en: 'All' },
  { id: 'people', cs: '🧍 Lidi', en: '🧍 People' },
  { id: 'speed', cs: '🏎️ Rychlost & chyby', en: '🏎️ Speed & errors' },
  { id: 'alcohol', cs: '🍺 Alkohol & drogy', en: '🍺 Booze & drugs' },
  { id: 'time', cs: '🕓 Kdy', en: '🕓 When' },
  { id: 'animals', cs: '🦌 Zvířata', en: '🦌 Animals' },
  { id: 'weird', cs: '🤯 Kuriozity', en: '🤯 Weird' },
  { id: 'myth', cs: '🧠 Mýty', en: '🧠 Myths' },
];

/** category + colour of every card id */
const CARD_META: Record<string, [CardCat, CardVariant]> = {
  today: ['time', 'red'], phone: ['speed', 'black'], belts: ['people', 'black'], trees: ['speed', 'black'], hour: ['time', 'black'],
  weekday: ['time', 'black'], month: ['time', 'black'], weather: ['myth', 'white'], worstday: ['time', 'black'], calmest: ['time', 'white'],
  alcohol: ['alcohol', 'black'], moto: ['people', 'black'], animals: ['animals', 'black'], reflective: ['people', 'black'],
  outoftown: ['myth', 'white'], motorway: ['myth', 'white'], men: ['people', 'black'], young: ['people', 'black'], tired: ['speed', 'black'],
  damage: ['weird', 'black'], brands: ['myth', 'white'], hitrun: ['weird', 'black'], train: ['weird', 'black'], speed: ['speed', 'black'],
  bike: ['people', 'black'], wheel: ['weird', 'white'], drugs: ['alcohol', 'black'], night: ['time', 'black'], deadlyhour: ['time', 'black'],
  zebra: ['people', 'black'], innocent: ['people', 'red'], seniors: ['people', 'black'], passengers: ['people', 'black'],
  aggressive: ['speed', 'black'], tailgate: ['speed', 'black'], redlight: ['speed', 'black'], chase: ['weird', 'white'], skid: ['speed', 'black'],
  fire: ['weird', 'black'], trend: ['myth', 'white'], tram: ['weird', 'black'], pets: ['animals', 'white'], prague: ['myth', 'white'],
  refused: ['alcohol', 'white'],
};

export interface Card {
  id: string;
  cat?: CardCat;
  variant?: CardVariant;
  tag: string;
  big: string;
  text: string;
  punch: string;
  lesson: string;
}

const OCTAVIA_PRICE = 750_000; // rough price of a new Škoda Octavia, CZK

export function buildCards(S: Block, meta: Meta, days: Record<string, DayRow>, t: T, today = new Date(), regions?: Record<string, Block>): Card[] {
  const cs = t.lang === 'cs';
  const L = (c: string, e: string) => (cs ? c : e);
  const from = meta.years[0].year;
  const since = L(`od roku ${from}`, `since ${from}`);
  const cards: Card[] = [];
  const add = (c: Card) => cards.push(c);

  // --- today in history ---
  const key = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const d = days[key];
  if (d) {
    const yrs = Object.keys(d.years).length;
    add({
      id: 'today',
      tag: L('Dnes v historii', 'On this day'),
      big: t.n(d.n),
      text: L(
        `nehod se stalo na ${t.dayMonth(today)} v letech ${from}–${meta.years.at(-1)!.year} (${yrs}× tento den). Zemřelo ${t.n(d.k)} lidí, těžce zraněno ${t.n(d.s)}. Alkohol hrál roli ${t.n(d.alc)}×.`,
        `crashes happened on ${t.dayMonth(today)} in ${from}–${meta.years.at(-1)!.year} (${yrs} times this date). ${t.n(d.k)} people died, ${t.n(d.s)} were seriously injured. Alcohol was involved ${t.n(d.alc)} times.`,
      ),
      punch: L('Dnešek zatím vede jen v tom, že ještě neskončil.', "Today's only advantage so far: it isn't over yet."),
      lesson: L('Dnes je ideální den nebýt v té statistice.', 'Today is a great day not to become a statistic.'),
    });
  }

  // --- inattention (phone) ---
  const c508 = S.cause['508'];
  if (c508) {
    const rank = Object.entries(S.cause).sort((a, b) => b[1].n - a[1].n)[0][0];
    add({
      id: 'phone',
      tag: L('Příčina č. 1', 'Cause #1'),
      big: t.n(c508.n),
      text: L(
        `nehod ${since}: „řidič se plně nevěnoval řízení“. ${rank === '508' ? 'Nejčastější příčina vůbec.' : ''} ${t.n(c508.k)} mrtvých.`,
        `crashes ${since}: "driver not paying full attention". ${rank === '508' ? 'The most common cause of all.' : ''} ${t.n(c508.k)} dead.`,
      ),
      punch: L('Ta zpráva počká. Pohřební služba taky, ale ochotněji.', 'That text can wait. So can the undertaker, but more patiently.'),
      lesson: L('Telefon do tašky nebo do držáku s režimem Řízení. Ne do ruky.', 'Phone in the bag or in a mount on driving mode. Not in your hand.'),
    });
  }

  // --- seatbelts ---
  const { belted, unbelted } = S.belts;
  if (belted.n && unbelted.n) {
    const rb = belted.k / belted.n;
    const ru = unbelted.k / unbelted.n;
    add({
      id: 'belts',
      tag: L('Pásy', 'Seatbelts'),
      big: `${t.p(ru / rb)}×`,
      text: L(
        `vyšší šance zemřít, když se nepřipoutáš. Nepřipoutaní jsou jen ${t.pct(unbelted.n, belted.n + unbelted.n)} lidí v bourajících autech, ale ${t.pct(unbelted.k, belted.k + unbelted.k)} mrtvých.`,
        `higher chance of dying if you don't buckle up. Unbelted people are only ${t.pct(unbelted.n, belted.n + unbelted.n)} of those in crashing cars, but ${t.pct(unbelted.k, belted.k + unbelted.k)} of the dead.`,
      ),
      punch: L('Pás tě omezuje asi jako padák parašutistu.', 'A seatbelt restricts you the way a parachute restricts a skydiver.'),
      lesson: L('Připoutat se trvá 2 sekundy. I vzadu. I „jen kousek“.', 'Buckling up takes 2 seconds. In the back too. Even for "just around the corner".'),
    });
  }

  // --- trees ---
  const tree = S.obstacle['1'];
  if (tree) {
    add({
      id: 'trees',
      tag: L('Pevné překážky', 'Fixed objects'),
      big: t.n(tree.k),
      text: L(`lidí ${since} zemřelo po nárazu do stromu. To je víc než všichni mrtví při nehodách s alkoholem (${t.n(S.alcohol.k)}).`, `people died hitting a tree ${since}. More than all deaths in alcohol-related crashes (${t.n(S.alcohol.k)}).`),
      punch: L('Strom přitom stál. Celou dobu. Na stejném místě. Desítky let.', 'The tree was standing still. The whole time. Same spot. For decades.'),
      lesson: L('Aleje jsou krásné, ale neuhýbají. Na okreskách zpomal, hlavně v zatáčkách.', 'Tree-lined roads are pretty but do not dodge. Slow down on country roads, especially in bends.'),
    });
  }

  // --- deadliest hour ---
  const hk = argmax(S.hour.k);
  add({
    id: 'hour',
    tag: L('Smrtka má pracovní dobu', 'Death keeps office hours'),
    big: `${hk}–${hk + 1} h`,
    text: L(
      `Nejvíc mrtvých (${t.n(S.hour.k[hk])}) ${since} připadá na tuhle hodinu. Ne na půlnoc, ne na pátou ráno. Na odpoledne, kdy jedou všichni.`,
      `The deadliest hour ${since} (${t.n(S.hour.k[hk])} dead). Not midnight, not 5 a.m. The afternoon, when everyone's on the road.`,
    ),
    punch: L('Smrtka je zřejmě úřednice. Nejvíc stihne těsně před koncem šichty.', "Death is apparently a civil servant. Most productive right before clocking off."),
    lesson: L('Odpolední špička = únava + spěch. Nejezdi domů jako do cíle závodu.', 'Afternoon rush = fatigue + hurry. Home is not a finish line.'),
  });

  // --- weekday ---
  const wdMax = argmax(S.wd.n);
  add({
    id: 'weekday',
    tag: L('Nejhorší den v týdnu', 'Worst day of the week'),
    big: WEEKDAY[wdMax][t.lang],
    text: L(`${t.n(S.wd.n[wdMax])} nehod ${since}. Nejvíc ze všech dní v týdnu. Neděle má o ${t.pct(S.wd.n[wdMax] - S.wd.n[6], S.wd.n[wdMax])} méně.`, `${t.n(S.wd.n[wdMax])} crashes ${since}, more than any other day. Sunday has ${t.pct(S.wd.n[wdMax] - S.wd.n[6], S.wd.n[wdMax])} fewer.`),
    punch: L('Lidi tak spěchají na víkend, že ho někteří stráví na traumatologii.', 'People rush so hard into the weekend that some spend it in A&E.'),
    lesson: L('Víkend ti neuteče. Ty se mu klidně můžeš vyhnout úplně.', "The weekend won't run away. You, however, could miss it entirely."),
  });

  // --- deadliest month ---
  const mk = argmax(S.month.k);
  add({
    id: 'month',
    tag: L('Nejsmrtelnější měsíc', 'Deadliest month'),
    big: MONTH[mk][t.lang],
    text: L(`${t.n(S.month.k[mk])} mrtvých ${since}. Prosinec s ledem a tmou: ${t.n(S.month.k[11])}.`, `${t.n(S.month.k[mk])} dead ${since}. December, with ice and darkness: ${t.n(S.month.k[11])}.`),
    punch: L('Zima zabíjí méně než léto. Sníh tě aspoň donutí jet pomalu.', 'Winter kills fewer than summer. At least snow forces you to slow down.'),
    lesson: L('Sucho, světlo a dovolená = falešný pocit bezpečí. Rychlost zabíjí hlavně za hezkého počasí.', 'Dry roads, daylight and holidays = false sense of safety. Speed kills mostly in nice weather.'),
  });

  // --- good weather ---
  const fine = S.weather['1'];
  if (fine) {
    add({
      id: 'weather',
      tag: L('Počasí', 'Weather'),
      big: t.pct(fine.k, sum(Object.values(S.weather).map((w) => w.k))),
      text: L('mrtvých zemřelo za „neztížených povětrnostních podmínek“. Tedy za hezkého počasí.', 'of the dead died in "unimpaired weather conditions". In other words: nice weather.'),
      punch: L('Problém není déšť. Problém je sebevědomí.', 'The problem is not rain. The problem is confidence.'),
      lesson: L('Dobré počasí není důvod jet rychleji. Fyzika na předpověď nekouká.', 'Good weather is not a reason to drive faster. Physics ignores the forecast.'),
    });
  }

  // --- worst day (snow) ---
  if (S.worstDay) {
    const snowy = (S.worstDay.w ?? 0) / S.worstDay.n > 0.3;
    add({
      id: 'worstday',
      tag: L('Nejhorší den', 'Worst day'),
      big: t.n(S.worstDay.n),
      text: L(
        `nehod za jediný den: ${t.date(S.worstDay.date)}. ${snowy ? `${t.n(S.worstDay.w!)} z nich na sněhu nebo ledu.` : ''}`,
        `crashes in a single day: ${t.date(S.worstDay.date)}. ${snowy ? `${t.n(S.worstDay.w!)} of them on snow or ice.` : ''}`,
      ),
      punch: snowy
        ? L('Každý rok stejný šok: v zimě napadne sníh. Kdo to mohl tušit.', 'Every year the same shock: it snows in winter. Who could have known.')
        : L('Nikdo neví proč. Asi úplněk.', 'Nobody knows why. Full moon, probably.'),
      lesson: L('Zimní pneumatiky, delší odstup, a když to klouže, prostě později dorazíš.', 'Winter tyres, longer gaps, and when it is slippery you simply arrive later.'),
    });
  }

  // --- calmest day ---
  if (S.calmestDay) {
    const xmas = S.calmestDay.date.slice(5) === '12-24' || S.calmestDay.date.slice(5) === '12-25';
    add({
      id: 'calmest',
      tag: L('Nejklidnější den', 'Calmest day'),
      big: t.dayMonth(S.calmestDay.date),
      text: L(`${t.date(S.calmestDay.date)}: jen ${t.n(S.calmestDay.n)} nehod v celé republice.`, `${t.date(S.calmestDay.date)}: only ${t.n(S.calmestDay.n)} crashes in the whole country.`),
      punch: xmas
        ? L('Jediný den v roce, kdy je cukroví silnější než touha předjíždět.', 'The one day a year when Christmas cookies beat the urge to overtake.')
        : L('Všichni zřejmě zůstali doma. Doporučujeme častěji.', 'Everyone apparently stayed home. We recommend it more often.'),
      lesson: L('Nejbezpečnější jízda je ta, kterou nemusíš absolvovat.', 'The safest trip is the one you skip.'),
    });
  }

  // --- alcohol ---
  add({
    id: 'alcohol',
    tag: L('Alkohol', 'Alcohol'),
    big: t.n(S.alcohol.over15),
    text: L(`viníků nehod ${since} nadýchalo 1,5 ‰ a víc. Dalších ${t.n(S.alcohol.refused)} raději dechovou zkoušku odmítlo.`, `at-fault drivers ${since} blew 1.5‰ or more. Another ${t.n(S.alcohol.refused)} preferred to refuse the breath test.`),
    punch: L('To už není „jedno pivo“. To je celý pivovar za volantem.', 'That is not "just one beer". That is a brewery behind the wheel.'),
    lesson: L('Piješ = nejedeš. Taxi je levnější než advokát, pohřeb i výčitky.', 'Drink = don\'t drive. A taxi is cheaper than a lawyer, a funeral or regret.'),
  });

  // --- motorcycles ---
  const moto = S.vehicles['2'];
  const car = S.vehicles['3'];
  if (moto && car && car.k) {
    add({
      id: 'moto',
      tag: L('Motorky', 'Motorcycles'),
      big: `${t.p(moto.k / moto.n / (car.k / car.n))}×`,
      text: L(`vyšší šance, že nehodu nepřežiješ, když sedíš na motorce místo v autě. ${t.n(moto.k)} mrtvých motorkářů ${since}.`, `higher chance of not surviving a crash on a motorbike rather than in a car. ${t.n(moto.k)} riders dead ${since}.`),
      punch: L('Kožená bunda je styl. Deformační zóna to není.', 'A leather jacket is a style. Not a crumple zone.'),
      lesson: L('Na motorce jsi neviditelný. Jezdi tak, jako by tě nikdo neviděl – protože tě nevidí.', 'On a bike you are invisible. Ride as if nobody can see you – because they can\'t.'),
    });
  }

  // --- animals ---
  const an = S.animal;
  const deer = an['1']?.n ?? 0;
  const boar = an['7']?.n ?? 0;
  const wolf = an['10']?.n ?? 0;
  const bear = an['11']?.n ?? 0;
  const dog = an['18']?.n ?? 0;
  add({
    id: 'animals',
    tag: L('Zvěřinec', 'Wildlife'),
    big: t.n(deer),
    text: L(
      `srážek se srnkou ${since}. Divočáci: ${t.n(boar)}. Psi: ${t.n(dog)}. Vlci: ${t.n(wolf)}. Medvědi: ${t.n(bear)}.`,
      `collisions with roe deer ${since}. Wild boar: ${t.n(boar)}. Dogs: ${t.n(dog)}. Wolves: ${t.n(wolf)}. Bears: ${t.n(bear)}.`,
    ),
    punch: bear ? L('Ano, medvěd. V Česku. Taky jsme se divili.', 'Yes, a bear. In Czechia. We were surprised too.') : L('Medvědi: nula. Zatím.', 'Bears: zero. So far.'),
    lesson: L('Za soumraku u lesa zpomal. Srnky nečtou dopravní značky a chodí ve skupinách – za první běží druhá.', 'Slow down near forests at dusk. Deer can\'t read road signs, and they come in groups – a second one follows the first.'),
  });

  // --- pedestrians & reflective gear ---
  const pr = S.peds.reflective;
  if (S.peds.k) {
    add({
      id: 'reflective',
      tag: L('Chodci', 'Pedestrians'),
      big: `${t.n(pr.yes.k)} / ${t.n(S.peds.k)}`,
      text: L(`Z ${t.n(S.peds.k)} mrtvých chodců ${since} mělo reflexní prvek jen ${t.n(pr.yes.k)}.`, `Of ${t.n(S.peds.k)} pedestrians killed ${since}, only ${t.n(pr.yes.k)} wore anything reflective.`),
      punch: L('Reflexní páska stojí 30 Kč. Alternativa je výrazně dražší.', 'A reflective band costs about €1. The alternative is considerably more expensive.'),
      lesson: L('Za tmy tě řidič v tmavém oblečení uvidí na 20 metrů. S reflexkou na 200.', 'In the dark, drivers see you at about 20 m in dark clothes. With reflectors: 200 m.'),
    });
  }

  // --- out of town ---
  const tin = S.town.in, tout = S.town.out;
  if (tin && tout) {
    add({
      id: 'outoftown',
      tag: L('Mimo obec', 'Outside towns'),
      big: t.pct(tout.k, tin.k + tout.k),
      text: L(`mrtvých zemřelo mimo obec, i když se tam stane jen ${t.pct(tout.n, tin.n + tout.n)} nehod.`, `of the dead died outside built-up areas, although only ${t.pct(tout.n, tin.n + tout.n)} of crashes happen there.`),
      punch: L('Ve městě se bourá. Za městem se umírá. Rozdíl je asi 40 km/h.', 'In town you crash. Out of town you die. The difference is about 40 km/h.'),
      lesson: L('Energie nárazu roste s druhou mocninou rychlosti: o 20 % rychleji = o 44 % tvrdší rána.', 'Crash energy grows with the square of speed: 20 % faster = 44 % harder hit.'),
    });
  }

  // --- motorway myth ---
  const r0 = S.road['0'], r1 = S.road['1'], r3 = S.road['3'];
  if (r0 && r1) {
    add({
      id: 'motorway',
      tag: L('Mýtus: dálnice', 'Myth: motorways'),
      big: `${t.n(r0.k)} vs. ${t.n(r1.k + (S.road['2']?.k ?? 0) + (r3?.k ?? 0))}`,
      text: L('Mrtví na dálnicích vs. na obyčejných silnicích 1.–3. třídy.', 'Deaths on motorways vs. on ordinary class I–III roads.'),
      punch: L('Dálnice vypadá nebezpečně, ale nikdo tam nepředjíždí kamion do zatáčky.', 'Motorways look scary, but nobody there overtakes a truck into a blind bend.'),
      lesson: L('Nejnebezpečnější silnice je ta obyčejná, co znáš nazpaměť.', 'The most dangerous road is the ordinary one you know by heart.'),
    });
  }

  // --- men ---
  const sx = S.persons.killedSex;
  if (sx.m && sx.f) {
    add({
      id: 'men',
      tag: L('Pohlaví', 'Gender'),
      big: t.pct(sx.m, sx.m + sx.f),
      text: L('mrtvých ve vozidlech jsou muži a chlapci.', 'of the people killed in vehicles are men and boys.'),
      punch: L('Testosteron je skvělý na spoustu věcí. Jako palivo ne.', 'Testosterone is great for many things. Not as fuel.'),
      lesson: L('Rychlá jízda nic nedokazuje. Kromě toho, že fyzika platí i na tebe.', 'Driving fast proves nothing. Except that physics applies to you too.'),
    });
  }

  // --- young drivers (age 18-24) ---
  const ka = S.persons.killedAge;
  if (sum(ka)) {
    add({
      id: 'young',
      tag: L('Věk', 'Age'),
      big: t.n(ka[2]),
      text: L(`mrtvých ve věku 18–24 let ${since}. To je jen 7 ročníků, ale ${t.pct(ka[2], sum(ka))} všech mrtvých ve vozidlech.`, `dead aged 18–24 ${since}. Just 7 birth years, but ${t.pct(ka[2], sum(ka))} of everyone killed in vehicles.`),
      punch: L('Řidičák je povolení řídit. Ne certifikát nesmrtelnosti.', 'A licence is a permit to drive. Not a certificate of immortality.'),
      lesson: L('Prvních pár let je nejrizikovějších. Kamarádi v autě riziko zvyšují, ne snižují.', 'The first years are the riskiest. Friends in the car raise the risk, not lower it.'),
    });
  }

  // --- fatigue ---
  const tired = S.driverState['2'];
  if (tired) {
    add({
      id: 'tired',
      tag: L('Únava', 'Fatigue'),
      big: t.n(tired.n),
      text: L(`řidičů ${since} bylo unavených, usnulo nebo jim bylo náhle zle. ${t.n(tired.k)} mrtvých v jejich vozidlech.`, `drivers ${since} were tired, fell asleep or suddenly felt ill. ${t.n(tired.k)} dead in their vehicles.`),
      punch: L('Kafe je levnější než svodidla. A nevolá ti pak pojišťovna.', 'Coffee is cheaper than crash barriers. And no insurer calls you afterwards.'),
      lesson: L('Každé 2 hodiny pauza. Mikrospánek při 130 km/h = 36 metrů naslepo za sekundu.', 'Take a break every 2 hours. Microsleep at 130 km/h = 36 metres blind per second.'),
    });
  }

  // --- damage ---
  add({
    id: 'damage',
    tag: L('Účet', 'The bill'),
    big: `${t.p(S.damage / 1e9)} ${L('mld. Kč', 'bn CZK')}`,
    text: L(`hmotných škod ${since}. Za to by šlo koupit zhruba ${t.n(S.damage / OCTAVIA_PRICE)} nových Octavií.`, `in material damage ${since}. That buys roughly ${t.n(S.damage / OCTAVIA_PRICE)} new Škoda Octavias.`),
    punch: L('Které by pak někdo zase naboural.', 'Which someone would then crash again.'),
    lesson: L('Plechy jdou opravit. Lidi většinou ne.', 'Metal can be fixed. People mostly can\'t.'),
  });

  // --- brands: statistics lesson ---
  const brands = Object.entries(S.brands).sort((a, b) => b[1].n - a[1].n);
  if (brands.length > 2) {
    const [b1, b2] = brands;
    add({
      id: 'brands',
      tag: L('Lekce statistiky', 'Statistics lesson'),
      big: BRAND[b1[0]] ?? '?',
      text: L(`je značka, která bourá nejčastěji: ${t.n(b1[1].n)} aut ${since}. Druhý ${BRAND[b2[0]] ?? '?'}: ${t.n(b2[1].n)}.`, `is the brand involved in the most crashes: ${t.n(b1[1].n)} cars ${since}. Runner-up ${BRAND[b2[0]] ?? '?'}: ${t.n(b2[1].n)}.`),
      punch: L('Šokující zjištění. Skoro tak šokující jako to, že nejvíc aut v Česku je Škoda.', 'Shocking. Almost as shocking as the fact that most cars in Czechia are Škodas.'),
      lesson: L('Absolutní čísla bez kontextu lžou. Vždycky se ptej: „z kolika?“', 'Raw counts without context lie. Always ask: "out of how many?"'),
    });
  }

  // --- hit and run ---
  const fled = S.vehicles['17'];
  if (fled) {
    add({
      id: 'hitrun',
      tag: L('Ujel', 'Hit and run'),
      big: t.n(fled.n),
      text: L(`případů ${since}, kdy neznámý řidič od nehody ujel. Většinou od zaparkovaného auta na parkovišti.`, `cases ${since} where an unknown driver fled the scene. Mostly from a parked car in a car park.`),
      punch: L('Lístek za stěračem stojí jednu propisku. Svědomí je zadarmo.', 'A note under the wiper costs one pen. A conscience is free.'),
      lesson: L('Ujet od nehody je trestný čin. Od nehody se zraněním a bez pomoci ještě horší.', 'Leaving the scene is a crime. Leaving an injured person without help is far worse.'),
    });
  }

  // --- trains ---
  const train = S.type['7'];
  if (train) {
    add({
      id: 'train',
      tag: L('Přejezdy', 'Level crossings'),
      big: t.n(train.n),
      text: L(`srážek s vlakem ${since}, ${t.n(train.k)} mrtvých.`, `collisions with trains ${since}, ${t.n(train.k)} dead.`),
      punch: L('Vlak má brzdnou dráhu i přes kilometr. Vyhnout se neumí. Je to vlak.', 'A train needs up to a kilometre to stop. It cannot swerve. It is a train.'),
      lesson: L('Bliká červená = stůj. I když „tam ještě nic nejede“.', 'Red light flashing = stop. Even if "nothing is coming yet".'),
    });
  }

  // --- speed ---
  const sp = S.causeGroup.speed;
  if (sp) {
    const allK = sum(Object.values(S.causeGroup).map((x) => x.k));
    add({
      id: 'speed',
      tag: L('Rychlost', 'Speed'),
      big: t.pct(sp.k, allK),
      text: L(`všech mrtvých ${since} má na svědomí nepřiměřená rychlost, ačkoli způsobí jen ${t.pct(sp.n, sum(Object.values(S.causeGroup).map((x) => x.n)))} nehod. Nejčastěji „${CAUSE['205'].cs}“.`, `of all deaths ${since} are down to inappropriate speed, although it causes only ${t.pct(sp.n, sum(Object.values(S.causeGroup).map((x) => x.n)))} of crashes. Most often: "${CAUSE['205'].en}".`),
      punch: L('Rychlost nezabíjí. Zabíjí náhlé zastavení. Rychlost to jen pěkně připraví.', "Speed doesn't kill. Sudden stopping does. Speed just sets it up nicely."),
      lesson: L('Do zatáčky pomalu, ze zatáčky rychle. Ne naopak.', 'Slow into the bend, fast out of it. Not the other way round.'),
    });
  }

  // --- cyclists & helmets ---
  const bh = S.helmets.bike;
  if (bh.with.n && bh.without.n) {
    add({
      id: 'bike',
      tag: L('Cyklisté', 'Cyclists'),
      big: t.n(pick(S.vehicles, ['13'])),
      text: L(`mrtvých cyklistů ${since}. Bez helmy jich jelo ${t.pct(bh.without.n, bh.with.n + bh.without.n)} ze všech cyklistů v nehodách.`, `cyclists killed ${since}. ${t.pct(bh.without.n, bh.with.n + bh.without.n)} of cyclists in crashes rode without a helmet.`),
      punch: L('Helma ti zkazí účes. Asfalt ho zkazí důkladněji.', 'A helmet ruins your hair. Tarmac ruins it more thoroughly.'),
      lesson: L('Helma, světla, a počítej s tím, že tě řidič nevidí.', 'Helmet, lights, and assume the driver has not seen you.'),
    });
  }


  // ================= v2 cards =================

  // --- wheel fell off ---
  const wheel = S.cause['609'];
  if (wheel?.n) {
    add({
      id: 'wheel',
      tag: L('Technika', 'Mechanics'),
      big: t.n(wheel.n),
      text: L(`nehod ${since} způsobilo upadlé kolo. Celé kolo. Za jízdy.`, `crashes ${since} were caused by a wheel falling off. A whole wheel. While driving.`),
      punch: L('Dotáhnout šrouby trvá pět minut. Hledat kolo v řepce celé odpoledne.', 'Tightening the bolts takes five minutes. Finding the wheel in a field takes all afternoon.'),
      lesson: L('Po přezutí pneumatik dotáhni kola znovu po 50–100 km.', 'After changing tyres, re-torque the wheel nuts after 50–100 km.'),
    });
  }

  // --- drugs ---
  const dt = S.drugs.byType;
  if ((dt['3'] ?? 0) > 0) {
    const meth = dt['3'] ?? 0, amph = dt['2'] ?? 0, thc = dt['1'] ?? 0;
    add({
      id: 'drugs',
      tag: L('Drogy', 'Drugs'),
      big: t.n(meth),
      text: L(
        `viníků nehod ${since} mělo v sobě pervitin. Amfetamin ${t.n(amph)}, tráva „jen“ ${t.n(thc)}. Nejčastější droga za volantem tedy není marihuana.`,
        `at-fault drivers ${since} were on meth. Amphetamine: ${t.n(amph)}, cannabis "only" ${t.n(thc)}. The most common drug behind the wheel is not weed.`,
      ),
      punch: L('Česká specialita, kterou opravdu nechceš potkat v protisměru.', 'A Czech speciality you really don\'t want to meet in the oncoming lane.'),
      lesson: L('Drogy mění vnímání rychlosti i vzdálenosti. A testy je najdou i druhý den.', 'Drugs distort your sense of speed and distance. And tests find them the next day too.'),
    });
  }

  // --- night without street lights ---
  const day = S.vis['1'], dark = S.vis['6'];
  if (day?.n && dark?.n) {
    const r = dark.k / dark.n / (day.k / day.n);
    add({
      id: 'night',
      tag: L('Tma', 'Darkness'),
      big: `${t.p(r)}×`,
      text: L('smrtelnější je nehoda v noci na neosvětlené silnici než nehoda za dne.', 'deadlier is a crash at night on an unlit road than one in daylight.'),
      punch: L('Tma nezabíjí. Jen ti neukáže, co tě zabije.', "Darkness doesn't kill. It just won't show you what will."),
      lesson: L('V noci jezdi tak, abys zastavil na vzdálenost, kam ti svítí světla.', 'At night, drive so you can stop within the distance your headlights reach.'),
    });
  }

  // --- deadliest hour per crash ---
  const ratios = S.hour.k.map((k, i) => (S.hour.n[i] > 1500 ? k / S.hour.n[i] : 0));
  const worstH = argmax(ratios);
  const safest = ratios.reduce((b, v, i) => (v > 0 && v < ratios[b] ? i : b), worstH);
  if (ratios[safest] > 0) {
    add({
      id: 'deadlyhour',
      tag: L('Hodina pravdy', 'Witching hour'),
      big: `${t.p(ratios[worstH] / ratios[safest])}×`,
      text: L(
        `smrtelnější je nehoda mezi ${worstH}. a ${worstH + 1}. hodinou než nehoda mezi ${safest}. a ${safest + 1}. Méně aut, víc mrtvých.`,
        `deadlier is a crash between ${worstH}:00 and ${worstH + 1}:00 than one between ${safest}:00 and ${safest + 1}:00. Fewer cars, more dead.`,
      ),
      punch: L('V tuhle hodinu jezdí jen pekaři, záchranáři a lidi, co by neměli.', 'At this hour the roads belong to bakers, paramedics and people who shouldn\'t be driving.'),
      lesson: L('Prázdná silnice svádí k rychlosti a únava k mikrospánku. Dvojitě pozor.', 'Empty roads tempt you to speed, fatigue tempts you to nod off. Double caution.'),
    });
  }

  // --- pedestrians killed on zebra crossings ---
  const zebra = S.peds.situation['4'];
  if (zebra?.k) {
    add({
      id: 'zebra',
      tag: L('Přechody', 'Crossings'),
      big: t.n(zebra.k),
      text: L(`chodců ${since} zemřelo přímo na přechodu pro chodce. Sraženo tam bylo ${t.n(zebra.n)} lidí.`, `pedestrians ${since} died right on a zebra crossing. ${t.n(zebra.n)} people were hit there.`),
      punch: L('Zebra je dopravní značka. Ne neprůstřelná vesta.', 'A zebra crossing is a road marking. Not a bulletproof vest.'),
      lesson: L('Na přechodu máš přednost, ne nesmrtelnost. Než vstoupíš, chyť oční kontakt s řidičem.', 'On a crossing you have priority, not immortality. Make eye contact with the driver before you step out.'),
    });
  }

  // --- innocent pedestrians (serious card, no joke) ---
  const good = S.peds.behaviour['1'];
  if (good?.k) {
    add({
      id: 'innocent',
      tag: L('Bez legrace', 'No joke'),
      big: t.n(good.k),
      text: L(`chodců ${since} zemřelo, přestože se podle policie chovali naprosto správně.`, `pedestrians ${since} died even though, according to the police, they did everything right.`),
      punch: L('Tady vtip nebude. Někdy uděláš všechno dobře a stejně to nestačí.', 'No joke here. Sometimes you do everything right and it still isn\'t enough.'),
      lesson: L('Řidiči: u přechodů, škol a zastávek jeď tak, abys zastavil vždycky.', 'Drivers: near crossings, schools and stops, drive so you can always stop.'),
    });
  }

  // --- seniors on foot ---
  const pa = S.peds.killedAge;
  if (sum(pa)) {
    add({
      id: 'seniors',
      tag: L('Senioři', 'Seniors'),
      big: t.pct(pa[8], sum(pa)),
      text: L('mrtvých chodců bylo starších 75 let. Přitom tvoří jen asi desetinu populace.', 'of pedestrians killed were over 75 – a group that is only about a tenth of the population.'),
      punch: L('Babička nepřebíhá. Babička přechází. Tempem, se kterým tvoje navigace nepočítá.', "Grandma doesn't dash across. She crosses. At a pace your sat-nav didn't plan for."),
      lesson: L('U zastávek, nemocnic a obchodů počítej s pomalým chodcem. A s tím, že tě neslyší.', 'Near stops, hospitals and shops, expect slow pedestrians – who may not hear you.'),
    });
  }

  // --- passengers ---
  const role = S.persons.role;
  const pass = (role['2'] ?? 0) + (role['3'] ?? 0) + (role['4'] ?? 0);
  if (pass) {
    add({
      id: 'passengers',
      tag: L('Spolujezdci', 'Passengers'),
      big: t.n(pass),
      text: L(`spolujezdců zemřelo ${since}. Nikdo z nich neřídil.`, `passengers died ${since}. None of them was driving.`),
      punch: L('Když řidič řekne „drž se“, není to fráze. Je to předpověď.', 'When the driver says "hold on", it\'s not a figure of speech. It\'s a forecast.'),
      lesson: L('Jako spolujezdec máš právo říct „zpomal“. A právo vystoupit.', 'As a passenger you have the right to say "slow down". And the right to get out.'),
    });
  }

  // --- aggressive driving ---
  const agg = S.cause['506'];
  if (agg?.n) {
    add({
      id: 'aggressive',
      tag: L('Agrese', 'Road rage'),
      big: t.n(agg.n),
      text: L(`nehod ${since} způsobila „bezohledná, agresivní, neohleduplná jízda“. ${t.n(agg.k)} mrtvých.`, `crashes ${since} were caused by "reckless, aggressive, inconsiderate driving". ${t.n(agg.k)} dead.`),
      punch: L('Předjel jsi ho a byl v cíli o 40 sekund dřív. Gratulujeme ke 40 sekundám.', 'You overtook him and arrived 40 seconds earlier. Congratulations on your 40 seconds.'),
      lesson: L('Agresivní jízda ušetří minuty. Nehoda vezme roky.', 'Aggressive driving saves minutes. A crash takes years.'),
    });
  }

  // --- tailgating ---
  const tg = S.cause['503'];
  if (tg?.n) {
    add({
      id: 'tailgate',
      tag: L('Odstup', 'Following distance'),
      big: t.n(tg.n),
      text: L(`nehod ${since} kvůli nedodržení bezpečné vzdálenosti. Typicky: ťuk zezadu v koloně.`, `crashes ${since} from not keeping a safe distance. Classic: a rear-end tap in traffic.`),
      punch: L('Kdo ti jede na zadku, nespěchá. Jen se chce seznámit. S tvým kufrem.', "Whoever's glued to your bumper isn't in a hurry. They just want to meet your boot."),
      lesson: L('Dvě sekundy odstupu. Počítej „jedna-dvacet-jedna, jedna-dvacet-dva“.', 'Two seconds of gap. Count "one-thousand-one, one-thousand-two".'),
    });
  }

  // --- red light ---
  const red = S.cause['401'];
  if (red?.n) {
    add({
      id: 'redlight',
      tag: L('Semafor', 'Traffic lights'),
      big: t.n(red.n),
      text: L(`nehod ${since} po jízdě na červenou. ${t.n(red.k)} mrtvých.`, `crashes ${since} after running a red light. ${t.n(red.k)} dead.`),
      punch: L('Oranžová neznamená „šlápni na to“. Ani tmavě oranžová.', 'Amber does not mean "floor it". Not even dark amber.'),
      lesson: L('Na oranžovou zastav, pokud to jde bezpečně. Pár sekund u semaforu nikoho nezabilo.', 'On amber, stop if you safely can. Nobody ever died from waiting at a light.'),
    });
  }

  // --- police chase ---
  const chase = S.cause['515'];
  if (chase?.n) {
    add({
      id: 'chase',
      tag: L('Akční film', 'Action movie'),
      big: t.n(chase.n),
      text: L(`nehod ${since} se stalo při policejním zákroku nebo pronásledování.`, `crashes ${since} happened during a police intervention or pursuit.`),
      punch: L('Ujet policii je skvělý plán. Až do první zatáčky.', 'Outrunning the police is a great plan. Right up to the first bend.'),
      lesson: L('Pokuta je levnější než pronásledování. Vždycky.', 'A fine is cheaper than a chase. Always.'),
    });
  }

  // --- skids ---
  if (S.skid) {
    add({
      id: 'skid',
      tag: L('Smyk', 'Skids'),
      big: t.n(S.skid),
      text: L(`vozidel ${since} dostalo při nehodě smyk.`, `vehicles ${since} skidded during a crash.`),
      punch: L('Smyk je rychlokurz fyziky. Známku dostává karoserie.', 'A skid is a crash course in physics. The bodywork gets the grade.'),
      lesson: L('Smyk nevzniká v zatáčce. Vzniká 200 metrů před ní, rychlostí.', "A skid doesn't start in the bend. It starts 200 metres before it, with your speed."),
    });
  }

  // --- fire ---
  if (S.fire) {
    add({
      id: 'fire',
      tag: L('Oheň', 'Fire'),
      big: t.n(S.fire),
      text: L(`vozidel ${since} po nehodě začalo hořet.`, `vehicles ${since} caught fire after a crash.`),
      punch: L('Hasicí přístroj v kufru: nejlevnější díl auta, který může zachránit celé auto.', 'The extinguisher in your boot: the cheapest part of the car that can save the whole car.'),
      lesson: L('Měj hasicí přístroj po ruce, ne pod kufrem s nákupem. A po nehodě vypni motor.', 'Keep the extinguisher reachable, not under the shopping. And switch off the engine after a crash.'),
    });
  }

  // --- refused breath test ---
  if (S.alcohol.refused) {
    add({
      id: 'refused',
      tag: L('Strategie', 'Strategy'),
      big: t.n(S.alcohol.refused),
      text: L(`viníků nehod ${since} odmítlo dechovou zkoušku.`, `at-fault drivers ${since} refused a breath test.`),
      punch: L('Odvážná taktika. Odmítnutí se trestá stejně jako opilost. Takže v podstatě přiznání s extra krokem.', 'Bold move. Refusing is punished like drunk driving. So basically a confession with extra steps.'),
      lesson: L('Odmítnutí zkoušky = stejný trest jako jízda pod vlivem. Nevyplatí se.', 'Refusing the test = same penalty as driving under the influence. Not worth it.'),
    });
  }

  // --- trend: good news ---
  const full = meta.years.filter((y) => y.complete);
  if (full.length >= 2) {
    const first = full[0], last = full.at(-1)!;
    const down = last.killed < first.killed;
    add({
      id: 'trend',
      tag: L('Dobrá zpráva', 'Good news'),
      big: `${down ? '−' : '+'}${t.pct(Math.abs(first.killed - last.killed), first.killed)}`,
      text: L(
        `mrtvých v roce ${last.year} oproti roku ${first.year} (${full.map((y) => `${y.year}: ${t.n(y.killed)}`).join(', ')}).`,
        `deaths in ${last.year} compared with ${first.year} (${full.map((y) => `${y.year}: ${t.n(y.killed)}`).join(', ')}).`,
      ),
      punch: down
        ? L('Smrtka má na českých silnicích klesající tržby. Pomoz jí zkrachovat.', 'Death\'s revenue on Czech roads is falling. Help it go bankrupt.')
        : L('Smrtka letos přidává. Nedělej jí radost.', "Death is picking up the pace this year. Don't give it the satisfaction."),
      lesson: L('Každý mrtvý míň je něčí táta, máma nebo kamarád, který přišel domů.', 'Every death less is someone\'s parent or friend who made it home.'),
    });
  }

  // --- trams ---
  const tram = S.type['8'];
  if (tram?.n) {
    add({
      id: 'tram',
      tag: L('Tramvaje', 'Trams'),
      big: t.n(tram.n),
      text: L(`srážek s tramvají ${since}.`, `collisions with trams ${since}.`),
      punch: L('Tramvaj neuhne. Nikdy. Má to v popisu práce. A v kolejích.', 'A tram never swerves. It\'s in the job description. And in the rails.'),
      lesson: L('Tramvaj brzdí zhruba třikrát déle než auto. Nevjížděj jí do cesty.', 'A tram needs roughly three times longer to stop than a car. Stay out of its way.'),
    });
  }

  // --- pets & farm animals ---
  const dogs = an['18']?.n ?? 0, cats = an['19']?.n ?? 0, horses = an['15']?.n ?? 0, cows = an['14']?.n ?? 0, sheep = an['17']?.n ?? 0, hens = an['20']?.n ?? 0;
  if (dogs) {
    add({
      id: 'pets',
      tag: L('Domácí mazlíčci', 'Pets & farm'),
      big: `🐕 ${t.n(dogs)}`,
      text: L(`srážek se psem ${since}. Kočky: ${t.n(cats)}. Koně: ${t.n(horses)}. Krávy: ${t.n(cows)}. Ovce: ${t.n(sheep)}. Slepice: ${t.n(hens)}.`, `collisions with dogs ${since}. Cats: ${t.n(cats)}. Horses: ${t.n(horses)}. Cows: ${t.n(cows)}. Sheep: ${t.n(sheep)}. Chickens: ${t.n(hens)}.`),
      punch: L('Kočky mají devět životů a lepší reflexy. Psi mají páníčky, co je pustí bez vodítka.', 'Cats have nine lives and better reflexes. Dogs have owners who let them off the lead.'),
      lesson: L('Pes u silnice patří na vodítko. A za tmy na něj reflexní obojek.', 'Dogs near roads belong on a lead – and in a reflective collar after dark.'),
    });
  }

  // --- Prague: jams save lives ---
  const pha = regions?.['00'];
  if (pha && regions) {
    const others = Object.entries(regions).filter(([c]) => c !== '00').map(([c, b]) => ({ c, r: b.killed / b.accidents }));
    const worst = others.sort((a, b) => b.r - a.r)[0];
    add({
      id: 'prague',
      tag: L('Praha vs. zbytek', 'Prague vs. the rest'),
      big: `1 : ${t.n(pha.accidents / Math.max(1, pha.killed))}`,
      text: L(
        `V Praze zemře člověk zhruba na každou ${t.n(pha.accidents / Math.max(1, pha.killed))}. nehodu. V kraji ${meta.regions[worst.c].cs} na každou ${t.n(1 / worst.r)}.`,
        `In Prague, roughly one person dies per ${t.n(pha.accidents / Math.max(1, pha.killed))} crashes. In ${meta.regions[worst.c].en}: one per ${t.n(1 / worst.r)}.`,
      ),
      punch: L('Pražská zácpa: nejlepší airbag v republice.', 'Prague traffic jams: the best airbag in the country.'),
      lesson: L('Bourá se všude. Umírá se tam, kde se jezdí rychle.', 'People crash everywhere. They die where people drive fast.'),
    });
  }

  for (const c of cards) [c.cat, c.variant] = CARD_META[c.id] ?? ['weird', 'black'];
  return cards;
}
