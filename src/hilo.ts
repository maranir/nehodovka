// Item pool for the "What killed more?" higher/lower game. Values = deaths since the first data year.
import { pick, type Block, type Meta, type Stats } from './data';
import type { L } from './i18n';

export interface HiLoItem {
  id: string;
  emoji: string;
  label: L;
  value: number;
}

const l = (cs: string, en: string): L => ({ cs, en });

export function hiloItems(stats: Stats, meta: Meta): HiLoItem[] {
  const S: Block = stats.all.national;
  const R = stats.all.regions;
  const reg = (code: string, emoji: string): HiLoItem => ({ id: `reg${code}`, emoji, label: l(meta.regions[code].cs, meta.regions[code].en), value: R[code]?.killed ?? 0 });
  const items: HiLoItem[] = [
    { id: 'trees', emoji: '🌳', label: l('Nárazy do stromu', 'Hitting a tree'), value: S.obstacle['1']?.k ?? 0 },
    { id: 'poles', emoji: '🪧', label: l('Nárazy do sloupu', 'Hitting a pole'), value: S.obstacle['2']?.k ?? 0 },
    { id: 'barrier', emoji: '🚧', label: l('Nárazy do svodidel', 'Hitting a crash barrier'), value: S.obstacle['4']?.k ?? 0 },
    { id: 'wall', emoji: '🧱', label: l('Nárazy do zdi či mostu', 'Hitting a wall or bridge'), value: S.obstacle['6']?.k ?? 0 },
    { id: 'alcohol', emoji: '🍺', label: l('Nehody s alkoholem', 'Drink-driving crashes'), value: S.alcohol.k },
    { id: 'drugs', emoji: '💊', label: l('Nehody s drogami', 'Drug-driving crashes'), value: S.drugs.k },
    { id: 'train', emoji: '🚆', label: l('Srážky s vlakem', 'Collisions with trains'), value: S.type['7']?.k ?? 0 },
    { id: 'tram', emoji: '🚋', label: l('Srážky s tramvají', 'Collisions with trams'), value: S.type['8']?.k ?? 0 },
    { id: 'wild', emoji: '🦌', label: l('Srážky s lesní zvěří', 'Collisions with wildlife'), value: S.type['5']?.k ?? 0 },
    { id: 'peds', emoji: '🚶', label: l('Sražení chodci', 'Pedestrians hit'), value: S.peds.k },
    { id: 'moto', emoji: '🏍️', label: l('Motorkáři', 'Motorcyclists'), value: S.vehicles['2']?.k ?? 0 },
    { id: 'bike', emoji: '🚲', label: l('Cyklisté', 'Cyclists'), value: S.vehicles['13']?.k ?? 0 },
    { id: 'trucks', emoji: '🚛', label: l('Lidé v nákladních autech', 'People in trucks'), value: pick(S.vehicles, ['5', '6', '7']) },
    { id: 'bus', emoji: '🚌', label: l('Lidé v autobusech', 'People in buses'), value: S.vehicles['8']?.k ?? 0 },
    { id: 'tractor', emoji: '🚜', label: l('Lidé na traktorech', 'People on tractors'), value: S.vehicles['9']?.k ?? 0 },
    { id: 'unbelted', emoji: '🪢', label: l('Nepřipoutaní', 'Unbelted occupants'), value: S.belts.unbelted.k },
    { id: 'speed', emoji: '🏎️', label: l('Nepřiměřená rychlost', 'Inappropriate speed'), value: S.causeGroup.speed?.k ?? 0 },
    { id: 'overtake', emoji: '↗️', label: l('Špatné předjíždění', 'Bad overtaking'), value: S.causeGroup.overtaking?.k ?? 0 },
    { id: 'phone', emoji: '📱', label: l('Nevěnování se řízení', 'Not paying attention'), value: S.cause['508']?.k ?? 0 },
    { id: 'wrongside', emoji: '⛔', label: l('Jízda v protisměru', 'Driving on the wrong side'), value: S.cause['501']?.k ?? 0 },
    { id: 'control', emoji: '🌀', label: l('Nezvládnuté řízení', 'Losing control'), value: S.cause['511']?.k ?? 0 },
    { id: 'giveway', emoji: '🔻', label: l('Ignorovaná „Dej přednost“', 'Ignored GIVE WAY sign'), value: S.cause['403']?.k ?? 0 },
    { id: 'left', emoji: '↩️', label: l('Odbočení vlevo bez přednosti', 'Left turn without yielding'), value: S.cause['405']?.k ?? 0 },
    { id: 'redlight', emoji: '🚦', label: l('Jízda na červenou', 'Running a red light'), value: S.cause['401']?.k ?? 0 },
    { id: 'zebra', emoji: '🦓', label: l('Nedání přednosti na přechodu', 'Not yielding at a crossing'), value: S.cause['412']?.k ?? 0 },
    { id: 'aggr', emoji: '😤', label: l('Agresivní jízda', 'Aggressive driving'), value: S.cause['506']?.k ?? 0 },
    { id: 'tailgate', emoji: '🔗', label: l('Jízda na krátký odstup', 'Tailgating'), value: S.cause['503']?.k ?? 0 },
    { id: 'tech', emoji: '🔧', label: l('Technické závady', 'Technical defects'), value: S.causeGroup.technical?.k ?? 0 },
    { id: 'motorway', emoji: '🛣️', label: l('Dálnice', 'Motorways'), value: S.road['0']?.k ?? 0 },
    { id: 'road1', emoji: '1️⃣', label: l('Silnice 1. třídy', 'Class I roads'), value: S.road['1']?.k ?? 0 },
    { id: 'road3', emoji: '3️⃣', label: l('Silnice 3. třídy', 'Class III roads'), value: S.road['3']?.k ?? 0 },
    { id: 'local', emoji: '🏘️', label: l('Místní ulice', 'Local streets'), value: S.road['6']?.k ?? 0 },
    { id: 'fog', emoji: '🌫️', label: l('Mlha', 'Fog'), value: S.weather['2']?.k ?? 0 },
    { id: 'rain', emoji: '🌧️', label: l('Déšť', 'Rain'), value: S.weather['4']?.k ?? 0 },
    { id: 'snow', emoji: '❄️', label: l('Sněžení', 'Snowfall'), value: S.weather['5']?.k ?? 0 },
    { id: 'nice', emoji: '☀️', label: l('Hezké počasí', 'Nice weather'), value: S.weather['1']?.k ?? 0 },
    { id: 'darkunlit', emoji: '🌑', label: l('Noc bez osvětlení', 'Night, no street lights'), value: S.vis['6']?.k ?? 0 },
    { id: 'aug', emoji: '🏖️', label: l('Srpen', 'August'), value: S.month.k[7] },
    { id: 'dec', emoji: '🎄', label: l('Prosinec', 'December'), value: S.month.k[11] },
    { id: 'fri', emoji: '🍻', label: l('Pátky', 'Fridays'), value: S.wd.k[4] },
    { id: 'sun', emoji: '⛪', label: l('Neděle', 'Sundays'), value: S.wd.k[6] },
    { id: 'h14', emoji: '🕑', label: l('Mezi 14. a 15. hodinou', 'Between 2 and 3 p.m.'), value: S.hour.k[14] },
    { id: 'h3', emoji: '🕒', label: l('Mezi 3. a 4. ráno', 'Between 3 and 4 a.m.'), value: S.hour.k[3] },
    { id: 'young', emoji: '🧑', label: l('Lidé 18–24 let', 'People aged 18–24'), value: S.persons.killedAge[2] },
    { id: 'old', emoji: '👵', label: l('Lidé 75+ ve vozidlech', 'People 75+ in vehicles'), value: S.persons.killedAge[8] },
    { id: 'women', emoji: '👩', label: l('Ženy ve vozidlech', 'Women in vehicles'), value: S.persons.killedSex.f ?? 0 },
    { id: 'outtown', emoji: '🌾', label: l('Nehody mimo obec', 'Crashes outside towns'), value: S.town.out?.k ?? 0 },
    { id: 'intown', emoji: '🏙️', label: l('Nehody v obci', 'Crashes in towns'), value: S.town.in?.k ?? 0 },
    reg('00', '🏰'), reg('01', '🌻'), reg('06', '🍷'), reg('07', '⛏️'), reg('19', '♨️'), reg('16', '🌲'),
  ];
  return items.filter((i) => i.value > 0);
}
