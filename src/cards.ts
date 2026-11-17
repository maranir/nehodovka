// "Black cards": darkly funny, data-driven fact cards. Every number comes from stats.json,
// so the copy stays correct when the data updates.
// House rule: the joke targets behaviour and situations, never the victims.
import { argmax, pick, sum, type Block, type DayRow, type Meta } from './data';
import type { T } from './i18n';
import { BRAND, CAUSE, MONTH, WEEKDAY } from './labels';

export interface Card {
  id: string;
  tag: string;
  big: string;
  text: string;
  punch: string;
  lesson: string;
}

const OCTAVIA_PRICE = 750_000; // rough price of a new Škoda Octavia, CZK

export function buildCards(S: Block, meta: Meta, days: Record<string, DayRow>, t: T, today = new Date()): Card[] {
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
    big: `${hk}:00–${hk + 1}:00`,
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

  return cards;
}
