// Content + parameters of the 'How will it get you?' risk profile.
import type { L } from './i18n';

export type Mode = 'car' | 'passenger' | 'moto' | 'bike' | 'walk';
export type Slot = 'morning' | 'day' | 'afternoon' | 'evening' | 'night';

// Approximate population of Czechia by the age buckets used in the police data (ČSÚ, ~2024).
export const AGE_POP = [1_700_000, 330_000, 700_000, 1_200_000, 1_620_000, 1_620_000, 1_300_000, 1_250_000, 980_000];
export const SLOTS: Record<Slot, { hours: number[]; e: string; label: L }> = {
  morning: { hours: [6, 7, 8], e: '🌅', label: { cs: 'Ráno 6–9', en: 'Morning 6–9' } },
  day: { hours: [9, 10, 11, 12, 13, 14], e: '☀️', label: { cs: 'Přes den 9–15', en: 'Daytime 9–15' } },
  afternoon: { hours: [15, 16, 17, 18], e: '🚗', label: { cs: 'Odpoledne 15–19', en: 'Afternoon 15–19' } },
  evening: { hours: [19, 20, 21, 22], e: '🌆', label: { cs: 'Večer 19–23', en: 'Evening 19–23' } },
  night: { hours: [23, 0, 1, 2, 3, 4, 5], e: '🌙', label: { cs: 'V noci 23–6', en: 'Night 23–6' } },
};
export const MODES: Record<Mode, { e: string; label: L }> = {
  car: { e: '🚗', label: { cs: 'Řídím auto', en: 'I drive a car' } },
  passenger: { e: '🧍', label: { cs: 'Vozím se', en: "I'm a passenger" } },
  moto: { e: '🏍️', label: { cs: 'Motorka', en: 'Motorbike' } },
  bike: { e: '🚲', label: { cs: 'Kolo', en: 'Bicycle' } },
  walk: { e: '🚶', label: { cs: 'Chodím pěšky', en: 'I walk' } },
};

export const VERDICT: Record<Mode, L> = {
  car: { cs: 'Nejspíš tě nezabije pirát silnic. Nejspíš tě zabije notifikace.', en: 'Probably not a road hog. Probably a notification.' },
  passenger: { cs: 'Tvůj osud řídí někdo jiný. Doslova.', en: 'Someone else is driving your fate. Literally.' },
  moto: { cs: 'Svoboda, vítr ve vlasech a výrazně vyšší šance, že to nepřežiješ.', en: 'Freedom, wind in your hair and much better odds of not surviving.' },
  bike: { cs: 'Zdravý životní styl s nezdravou přílohou: kamiony, co odbočují.', en: 'A healthy lifestyle with an unhealthy side dish: turning trucks.' },
  walk: { cs: 'Pěšky je to nejzdravější. Dokud nepotkáš auto.', en: 'Walking is the healthiest option. Until you meet a car.' },
};
export const TIPS: Record<Mode, L[]> = {
  car: [
    { cs: '📱 Telefon do držáku s režimem Řízení. Nejčastější příčina nehod je nepozornost.', en: '📱 Phone in a mount on driving mode. Inattention is the #1 cause of crashes.' },
    { cs: '↪️ Do zatáček pomaleji. Rychlost nepřizpůsobená zatáčce zabíjí nejvíc.', en: '↪️ Slow down for bends. Speed not adapted to bends kills the most.' },
    { cs: '🌳 Na okreskách se stromy kolem silnice uber. Strom neuhne.', en: '🌳 On tree-lined country roads, ease off. Trees don\'t move.' },
  ],
  passenger: [
    { cs: '🪢 Připoutej se i vzadu. Nepřipoutaní umírají asi 10× častěji.', en: '🪢 Buckle up in the back too. Unbelted people die about 10× more often.' },
    { cs: '🗣️ Řekni „zpomal“. Je to tvůj život, ne jeho ego.', en: '🗣️ Say "slow down". It\'s your life, not their ego.' },
    { cs: '🍺 Nesedej k opilému. Taxi je levnější než invalidní vozík.', en: '🍺 Never ride with a drunk driver. A taxi is cheaper than a wheelchair.' },
  ],
  moto: [
    { cs: '👀 Řidiči tě nevidí, hlavně když odbočují vlevo. Počítej s tím.', en: '👀 Drivers don\'t see you, especially when turning left. Assume it.' },
    { cs: '🦺 Plná výstroj – kůže, chrániče, helma. Asfalt brousí rychleji než bruska.', en: '🦺 Full gear – leathers, armour, helmet. Tarmac grinds faster than a grinder.' },
    { cs: '🏁 Okreska není okruh. Zatáčky si nech na trať.', en: '🏁 A country road is not a racetrack. Save the lean angles for the circuit.' },
  ],
  bike: [
    { cs: '⛑️ Helma. Víc než polovina cyklistů v nehodách ji neměla.', en: '⛑️ Helmet. More than half of cyclists in crashes had none.' },
    { cs: '💡 Světla vpředu i vzadu, i za soumraku.', en: '💡 Front and rear lights, at dusk too.' },
    { cs: '🚛 Nikdy nestůj vedle kamionu, který odbočuje. Nevidí tě.', en: '🚛 Never wait beside a turning truck. It can\'t see you.' },
  ],
  walk: [
    { cs: '✨ Reflexní prvky za tmy. Bez nich tě řidič vidí na 20 m, s nimi na 200.', en: '✨ Wear reflectors after dark: seen at 200 m instead of 20.' },
    { cs: '👁️ Na přechodu oční kontakt s řidičem. Přednost není neprůstřelná.', en: '👁️ Make eye contact at crossings. Priority is not bulletproof.' },
    { cs: '🎧 Sluchátka dolů u silnice. Auto slyšíš dřív, než ho vidíš.', en: '🎧 Headphones off near roads. You hear a car before you see it.' },
  ],
};

