import type { L } from './i18n';

const l = (cs: string, en: string): L => ({ cs, en });

/** p6 – type of accident */
export const TYPE: Record<string, L> = {
  '1': l('srážka s jedoucím vozidlem', 'collision with a moving vehicle'),
  '2': l('srážka se zaparkovaným vozidlem', 'collision with a parked vehicle'),
  '3': l('náraz do pevné překážky', 'hit a fixed obstacle'),
  '4': l('srážka s chodcem', 'pedestrian hit'),
  '5': l('srážka s lesní zvěří', 'collision with wild animal'),
  '6': l('srážka s domácím zvířetem', 'collision with domestic animal'),
  '7': l('srážka s vlakem', 'collision with a train'),
  '8': l('srážka s tramvají', 'collision with a tram'),
  '9': l('havárie (bez dalšího účastníka)', 'single-vehicle crash'),
  '0': l('jiný druh nehody', 'other accident'),
};

export const CAUSE_GROUP: Record<string, L> = {
  speed: l('nepřiměřená rychlost', 'inappropriate speed'),
  overtaking: l('nesprávné předjíždění', 'bad overtaking'),
  priority: l('nedání přednosti', 'failure to give way'),
  driving: l('nesprávný způsob jízdy', 'bad driving'),
  technical: l('technická závada', 'technical defect'),
  notDriver: l('nezaviněno řidičem', 'not caused by a driver'),
  other: l('jiné', 'other'),
};

/** p12 – main cause */
export const CAUSE: Record<string, L> = {
  '100': l('nezaviněná řidičem', 'not caused by a driver'),
  '201': l('rychlost nepřizpůsobená hustotě provozu', 'speed not adapted to traffic'),
  '202': l('rychlost nepřizpůsobená viditelnosti', 'speed not adapted to visibility'),
  '203': l('rychlost nepřizpůsobená vlastnostem vozidla a nákladu', 'speed not adapted to vehicle/load'),
  '204': l('rychlost nepřizpůsobená stavu vozovky', 'speed not adapted to road surface'),
  '205': l('rychlost nepřizpůsobená zatáčce, klesání, šířce silnice', 'speed not adapted to bends/slopes/road width'),
  '206': l('překročení předepsané rychlosti', 'exceeding the legal speed limit'),
  '207': l('překročení rychlosti dané značkou', 'exceeding the posted speed limit'),
  '208': l('rychlost nepřizpůsobená bočnímu větru', 'speed not adapted to crosswind'),
  '209': l('jiná nepřiměřená rychlost', 'other inappropriate speed'),
  '301': l('předjíždění vpravo', 'overtaking on the right'),
  '302': l('předjíždění bez bočního odstupu', 'overtaking too close'),
  '303': l('předjíždění bez dostatečného rozhledu', 'overtaking without clear view'),
  '304': l('ohrožení protijedoucího při předjíždění', 'endangering oncoming traffic while overtaking'),
  '305': l('ohrožení předjížděného', 'endangering the overtaken vehicle'),
  '306': l('předjíždění vozidla odbočujícího vlevo', 'overtaking a left-turning vehicle'),
  '307': l('předjíždění tam, kde je zakázáno', 'overtaking where prohibited'),
  '308': l('přejetí plné čáry při předjíždění', 'crossing a solid line while overtaking'),
  '309': l('bránění v předjíždění', 'blocking an overtake'),
  '310': l('přehlédnutí předjíždějícího vozidla', 'not noticing an overtaking vehicle'),
  '311': l('jiné nesprávné předjíždění', 'other bad overtaking'),
  '401': l('jízda na červenou', 'running a red light'),
  '402': l('ignorování značky STŮJ', 'ignoring a STOP sign'),
  '403': l('ignorování značky DEJ PŘEDNOST', 'ignoring a GIVE WAY sign'),
  '404': l('nedání přednosti zprava', 'not yielding to the right'),
  '405': l('nedání přednosti při odbočování vlevo', 'not yielding when turning left'),
  '406': l('nedání přednosti tramvaji', 'not yielding to a turning tram'),
  '407': l('nedání přednosti při objíždění překážky', 'not yielding when passing an obstacle'),
  '408': l('nedání přednosti při rozjíždění', 'not yielding when pulling out'),
  '409': l('nedání přednosti při vjíždění na silnici', 'not yielding when entering the road'),
  '410': l('nedání přednosti při otáčení/couvání', 'not yielding when turning around/reversing'),
  '411': l('nedání přednosti při změně pruhu', 'not yielding when changing lanes'),
  '412': l('nedání přednosti chodci na přechodu', 'not yielding to a pedestrian on a crossing'),
  '413': l('nedání přednosti souběžně jedoucímu', 'not yielding to a parallel vehicle when turning'),
  '414': l('jiné nedání přednosti', 'other failure to give way'),
  '501': l('jízda v protisměru / po nesprávné straně', 'driving on the wrong side'),
  '502': l('vyhýbání bez bočního odstupu', 'passing too close'),
  '503': l('nedodržení bezpečné vzdálenosti', 'tailgating'),
  '504': l('nesprávné otáčení nebo couvání', 'bad turning around/reversing'),
  '505': l('chyba při ukazování směru', 'wrong indication'),
  '506': l('bezohledná, agresivní jízda', 'reckless, aggressive driving'),
  '507': l('náhlé bezdůvodné zabrzdění', 'sudden braking for no reason'),
  '508': l('řidič se plně nevěnoval řízení', 'driver not paying full attention'),
  '509': l('samovolné rozjetí nezajištěného vozidla', 'unsecured vehicle rolled away'),
  '510': l('vjetí na nezpevněnou komunikaci', 'drove onto an unpaved road'),
  '511': l('nezvládnutí řízení vozidla', 'lost control of the vehicle'),
  '512': l('jízda v protisměru jednosměrkou', 'wrong way down a one-way street'),
  '513': l('násilné zastavení vozidla policií', 'police stopping device'),
  '514': l('použití služební zbraně policií', 'police firearm use'),
  '515': l('služební zákrok (pronásledování)', 'police intervention (pursuit)'),
  '516': l('jiný nesprávný způsob jízdy', 'other bad driving'),
  '601': l('závada řízení', 'steering failure'),
  '602': l('závada brzd', 'brake failure'),
  '603': l('nefunkční parkovací brzda', 'parking brake failure'),
  '604': l('sjeté pneumatiky', 'bald tyres'),
  '605': l('defekt pneumatiky', 'tyre blowout'),
  '606': l('závada osvětlení', 'lighting failure'),
  '607': l('závada brzdové hadice přívěsu', 'trailer brake hose failure'),
  '608': l('špatně uložený náklad', 'badly secured load'),
  '609': l('upadlé kolo', 'a wheel fell off'),
  '610': l('zablokovaná kola', 'wheels locked up (mechanical)'),
  '611': l('lom závěsu kola / pružiny', 'suspension failure'),
  '612': l('nezajištěná bočnice', 'unsecured side panel'),
  '613': l('závada závěsu přívěsu', 'trailer hitch failure'),
  '614': l('utržená spojovací hřídel', 'broken drive shaft'),
  '615': l('jiná technická závada', 'other technical defect'),
};

export const causeLabel = (code: number | string): L => {
  const c = String(code);
  if (CAUSE[c]) return CAUSE[c];
  return l('neuvedeno', 'not stated');
};

export const WEEKDAY: L[] = [
  l('pondělí', 'Monday'), l('úterý', 'Tuesday'), l('středa', 'Wednesday'), l('čtvrtek', 'Thursday'),
  l('pátek', 'Friday'), l('sobota', 'Saturday'), l('neděle', 'Sunday'),
];
export const MONTH: L[] = [
  l('leden', 'January'), l('únor', 'February'), l('březen', 'March'), l('duben', 'April'), l('květen', 'May'), l('červen', 'June'),
  l('červenec', 'July'), l('srpen', 'August'), l('září', 'September'), l('říjen', 'October'), l('listopad', 'November'), l('prosinec', 'December'),
];

/** p8a */
export const ANIMAL: Record<string, L> = {
  '1': l('srnka', 'roe deer'), '2': l('jelen', 'red deer'), '3': l('daněk', 'fallow deer'), '4': l('muflon', 'mouflon'),
  '5': l('zajíc', 'hare'), '6': l('bažant', 'pheasant'), '7': l('divoké prase', 'wild boar'), '8': l('liška', 'fox'),
  '9': l('sob', 'reindeer'), '10': l('vlk', 'wolf'), '11': l('medvěd', 'bear'), '12': l('jiná zvěř', 'other wildlife'),
  '13': l('vepř', 'pig'), '14': l('kráva', 'cow'), '15': l('kůň', 'horse'), '16': l('koza', 'goat'), '17': l('ovce', 'sheep'),
  '18': l('pes', 'dog'), '19': l('kočka', 'cat'), '20': l('slepice', 'chicken'), '21': l('kachna / husa', 'duck / goose'), '22': l('jiné zvíře', 'other animal'),
};

/** p36 */
export const ROAD: Record<string, L> = {
  '0': l('dálnice', 'motorway'), '1': l('silnice 1. třídy', 'class I road'), '2': l('silnice 2. třídy', 'class II road'),
  '3': l('silnice 3. třídy', 'class III road'), '6': l('místní komunikace', 'local street'), '7': l('polní/lesní cesta', 'field/forest track'),
  '8': l('parkoviště, odpočívka', 'car park, rest area'),
};

/** p44 */
export const VEHICLE: Record<string, L> = {
  '2': l('motocykl', 'motorcycle'), '3': l('osobní auto', 'car'), '5': l('nákladní auto', 'truck'), '8': l('autobus', 'bus'),
  '9': l('traktor', 'tractor'), '10': l('tramvaj', 'tram'), '13': l('jízdní kolo', 'bicycle'), '16': l('vlak', 'train'),
};

/** p45a – car brands (only the common ones) */
export const BRAND: Record<string, string> = {
  '39': 'Škoda', '47': 'Volkswagen', '13': 'Ford', '17': 'Hyundai', '4': 'BMW', '44': 'Toyota', '35': 'Renault', '32': 'Peugeot',
  '26': 'Mercedes', '2': 'Audi', '31': 'Opel', '7': 'Citroën', '8': 'Dacia', '12': 'Fiat', '25': 'Mazda', '38': 'Seat', '48': 'Volvo',
  '29': 'Nissan', '16': 'Honda', '42': 'Suzuki', '41': 'Subaru', '27': 'Mitsubishi',
};

export const AGE_BUCKETS = ['0–14', '15–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+'];
