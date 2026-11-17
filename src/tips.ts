// Practical safety tips shown for a real accident or an area. No jokes here:
// these are real crashes with real people, the humour lives in the aggregate cards.
import { FLAGS } from './data';
import type { L } from './i18n';

const l = (cs: string, en: string): L => ({ cs, en });

export function causeTip(cause: number, flags: number): L {
  if (flags & FLAGS.ALCOHOL) return l('Alkohol prodlužuje reakční dobu a zužuje zorné pole. Piješ = nejedeš.', 'Alcohol slows reactions and narrows your vision. If you drink, don\'t drive.');
  if (flags & FLAGS.PEDESTRIAN) return l('U přechodů zpomal a počítej s tím, že chodec vyjde. Jako chodec: reflexní prvky a oční kontakt.', 'Slow down near crossings and expect pedestrians to step out. On foot: wear reflectors and make eye contact.');
  if (flags & FLAGS.ANIMAL) return l('U lesa za soumraku zpomal; když vidíš jedno zvíře, čekej další.', 'Slow down near forests at dusk; one animal usually means more are coming.');
  if (cause >= 200 && cause < 300) return l('Rychlost přizpůsob podmínkám, ne značce. Brzdná dráha roste s druhou mocninou rychlosti.', 'Match your speed to conditions, not just the sign. Braking distance grows with the square of speed.');
  if (cause >= 300 && cause < 400) return l('Předjížděj, jen když vidíš celý prostor, který potřebuješ – a ještě kus navíc.', 'Only overtake when you can see all the space you need – plus a bit more.');
  if (cause >= 400 && cause < 500) return l('Na křižovatce se dvakrát podívej. Přednost je pravidlo, ne záruka, že ti ji ostatní dají.', 'Look twice at junctions. Right of way is a rule, not a guarantee that others will respect it.');
  if (cause === 508) return l('Telefon pryč z ruky. Dvě sekundy pohledu do displeje = 28 metrů naslepo při 50 km/h.', 'Phone out of your hand. Two seconds looking at a screen = 28 metres blind at 50 km/h.');
  if (cause === 503) return l('Drž odstup aspoň 2 sekundy, za deště 4.', 'Keep at least a 2-second gap, 4 in the rain.');
  if (cause === 501 || cause === 511) return l('Ztráta kontroly bývá kombinace rychlosti, únavy a nepozornosti. Na všechny tři je lék: zpomal.', 'Losing control is usually speed + fatigue + inattention. One cure for all three: slow down.');
  if (cause >= 600 && cause < 700) return l('Pneumatiky, brzdy a světla kontroluj pravidelně. Technika stárne potichu.', 'Check tyres, brakes and lights regularly. Machines age quietly.');
  return l('Jezdi tak, aby ostatní mohli udělat chybu a nikdo kvůli ní nezemřel.', 'Drive so that others can make a mistake without anyone dying from it.');
}
