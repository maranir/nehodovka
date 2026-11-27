import { useEffect, useMemo, useRef, useState } from 'react';
import { latestFullYear, loadDays, loadSpots, type BlackSpot, type DayRow, type Meta, type Stats } from '../data';
import { useT } from '../i18n';
import { useNav } from '../nav';
import { buildCards } from '../cards';
import { AppBar, CardView, ComebackBanner, DateBadge, SponsorSlot } from '../components';
import { IconAlert, IconCards, IconFlame, IconScale, IconSchool, IconTarget } from '../icons';
import { daySeed, rng } from '../quiz';
import { dailyDone, dailyStreak, getNum } from '../storage';

const YEAR_S = 365.25 * 86400;

function fmtDur(sec: number, lang: string) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (h > 0) return lang === 'cs' ? `${h} h ${m} min` : `${h}h ${m}m`;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function TodayView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const T = useT();
  const { t, n, lang } = T;
  const go = useNav();
  const { year, block } = latestFullYear(stats, meta);
  const crashS = YEAR_S / block.accidents;
  const injS = YEAR_S / (block.serious + block.light);
  const deathS = YEAR_S / block.killed;

  const opened = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState(false);
  const lastCrash = useRef(Math.floor(Date.now() / 1000 / crashS));
  useEffect(() => {
    const id = setInterval(() => {
      const t2 = Date.now();
      setNow(t2);
      const c = Math.floor(t2 / 1000 / crashS);
      if (c !== lastCrash.current) {
        lastCrash.current = c;
        setFlash(true);
        navigator.vibrate?.(30);
        setTimeout(() => setFlash(false), 650);
      }
    }, 250);
    return () => clearInterval(id);
  }, [crashS]);
  const left = (iv: number) => iv - ((now / 1000) % iv);
  const crashLeft = left(crashS);
  const elapsed = (now - opened.current) / 1000;

  // hour chart
  const S = stats.all.national;
  const [metric, setMetric] = useState<'k' | 'n'>('k');
  const hour = new Date(now).getHours();
  const [sel, setSel] = useState<number | null>(null);
  const series = S.hour[metric];
  const max = Math.max(...series);
  const shown = sel ?? hour;
  const rank = [...series].sort((a, b) => b - a).indexOf(series[shown]) + 1;

  // cards: today in history + card of the day
  const [days, setDays] = useState<Record<string, DayRow> | null>(null);
  const [spots, setSpots] = useState<BlackSpot[] | null>(null);
  useEffect(() => {
    loadDays().then(setDays).catch(() => setDays({}));
    loadSpots().then(setSpots).catch(() => setSpots([]));
  }, []);
  const cards = useMemo(() => (days ? buildCards(S, meta, days, T, new Date(), stats.all.regions) : []), [days, S, meta, T.lang]);
  const todayCard = cards.find((c) => c.id === 'today');
  const pool = cards.filter((c) => c.id !== 'today');
  const cardOfDay = pool.length ? pool[Math.floor(rng(daySeed())() * pool.length)] : null;

  const done = dailyDone();
  const streak = dailyStreak();
  const hiloBest = getNum('hiloBest');
  const ringP = 1 - crashLeft / crashS;
  const fmt2 = (x: number) => new Intl.NumberFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);

  return (
    <>
      <AppBar />
      <div className="page" style={{ paddingTop: 4 }}>
        <section className="hero">
          <svg className="ring" viewBox="0 0 54 54" aria-hidden="true">
            <circle cx="27" cy="27" r="23" fill="none" stroke="#333" strokeWidth="5" />
            <circle cx="27" cy="27" r="23" fill="none" stroke="#ffd400" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${ringP * 144.5} 144.5`} transform="rotate(-90 27 27)" />
          </svg>
          <div className="label">{t({ cs: 'Další nehoda v Česku statisticky za', en: 'Next crash in Czechia, statistically, in' })}</div>
          <div className={`clock ${flash ? 'flash' : ''}`}>{fmtDur(crashLeft, lang)}</div>
          <div className="row">
            <div className="mini">
              <b>{fmtDur(left(injS), lang)}</b>
              <span>{t({ cs: 'do dalšího zraněného', en: 'to the next injury' })}</span>
            </div>
            <div className="mini">
              <b className="c-red">{fmtDur(left(deathS), lang)}</b>
              <span>{t({ cs: 'do dalšího mrtvého', en: 'to the next death' })}</span>
            </div>
          </div>
          <p className="since">
            {t({
              cs: `Od chvíle, co jsi tady, se statisticky stalo ${fmt2(elapsed / crashS)} nehody. Doufáme, že ne tobě.`,
              en: `Since you opened this, ${fmt2(elapsed / crashS)} crashes have statistically happened. Hopefully not to you.`,
            })}
          </p>
          <p className="muted small" style={{ margin: 0 }}>
            {t({ cs: `Průměr roku ${year}: ${n(block.accidents)} nehod, ${n(block.killed)} mrtvých.`, en: `${year} average: ${n(block.accidents)} crashes, ${n(block.killed)} dead.` })}
          </p>
        </section>

        <ComebackBanner />
        <div className="tiles">
          <button className={`tile wide ${done == null ? 'yellow' : ''}`} onClick={() => go('games/daily')}>
            <DateBadge />
            <div style={{ flex: 1 }}>
              <b>{done == null ? t({ cs: 'Denní kvíz čeká', en: 'Daily quiz is waiting' }) : t({ cs: `Dnešní kvíz: ${done}/10`, en: `Today's quiz: ${done}/10` })}</b>
              <span>{done == null ? t({ cs: '10 otázek, 2 minuty, 0 mrtvých', en: '10 questions, 2 minutes, 0 casualties' }) : t({ cs: 'Zítra nové otázky', en: 'New questions tomorrow' })}</span>
            </div>
            {streak > 0 && <span className="streak"><span className="streak-icon"><IconFlame /></span>{streak}</span>}
          </button>
        </div>

        <section className="panel">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>{t({ cs: 'Rytmus dne', en: 'Rhythm of the day' })}</h2>
            <div className="seg">
              <button className={metric === 'k' ? 'on' : ''} onClick={() => setMetric('k')}>{t({ cs: 'Mrtví', en: 'Deaths' })}</button>
              <button className={metric === 'n' ? 'on' : ''} onClick={() => setMetric('n')}>{t({ cs: 'Nehody', en: 'Crashes' })}</button>
            </div>
          </div>
          <div className="bars" role="img" aria-label="hour chart">
            {series.map((v, i) => (
              <button
                key={i}
                className={`${i === hour ? 'now' : ''} ${i === sel ? 'sel' : ''}`}
                style={{ height: `${Math.max(2, (100 * v) / max)}%` }}
                onClick={() => setSel(sel === i ? null : i)}
                aria-label={`${i}:00 ${v}`}
              />
            ))}
          </div>
          <div className="bars-axis"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
          <p className="chart-caption">
            {sel == null
              ? t({
                  cs: `Teď je ${hour}:00–${hour + 1}:00. ${metric === 'k' ? 'Co do počtu mrtvých' : 'Co do počtu nehod'} je to ${rank}. nejhorší hodina dne ze 24.`,
                  en: `It's ${hour}:00–${hour + 1}:00 now: the #${rank} worst hour of 24 for ${metric === 'k' ? 'deaths' : 'crashes'}.`,
                })
              : t({
                  cs: `${sel}:00–${sel + 1}:00: ${n(series[sel])} ${metric === 'k' ? 'mrtvých' : 'nehod'} od roku ${meta.years[0].year} (${rank}. místo).`,
                  en: `${sel}:00–${sel + 1}:00: ${n(series[sel])} ${metric === 'k' ? 'deaths' : 'crashes'} since ${meta.years[0].year} (rank #${rank}).`,
                })}
          </p>
        </section>

        {todayCard && (
          <>
            <div className="section-title"><h2>{t({ cs: 'Dnes v historii', en: 'On this day' })}</h2></div>
            <CardView card={todayCard} />
          </>
        )}

        <div className="section-title"><h2>{t({ cs: 'Hraj si se smrtí', en: 'Play with death' })}</h2></div>
        <div className="tiles">
          <button className="tile red" onClick={() => go('games/profile')}>
            <div className="tile-icon"><IconTarget /></div>
            <div>
              <b>{t({ cs: 'Jak tě to zabije?', en: 'How will it get you?' })}</b>
              <span>{t({ cs: 'Tvůj osobní rizikový profil', en: 'Your personal risk profile' })}</span>
            </div>
          </button>
          <button className="tile yellow" onClick={() => go('games/hilo')}>
            <div className="tile-icon"><IconScale /></div>
            <div>
              <b>{t({ cs: 'Co zabilo víc?', en: 'What killed more?' })}</b>
              <span>{hiloBest ? t({ cs: `Rekord: ${hiloBest} v řadě`, en: `Best: ${hiloBest} in a row` }) : t({ cs: 'Vyšší, nebo nižší', en: 'Higher or lower' })}</span>
            </div>
          </button>
          <button className="tile" onClick={() => go('map/spots')}>
            <div className="tile-icon"><IconAlert /></div>
            <div>
              <b>{t({ cs: 'Černá místa', en: 'Black spots' })}</b>
              <span>{spots?.[0] ? t({ cs: `Č. 1: ${spots[0].town}${spots[0].road ? ', ' + spots[0].road : ''}`, en: `#1: ${spots[0].town}${spots[0].road ? ', ' + spots[0].road : ''}` }) : '…'}</span>
            </div>
          </button>
          <button className="tile" onClick={() => go('cards')}>
            <div className="tile-icon"><IconCards /></div>
            <div>
              <b>{t({ cs: 'Černé karty', en: 'Black cards' })}</b>
              <span>{t({ cs: `${cards.length} karet`, en: `${cards.length} cards` })}</span>
            </div>
          </button>
          <button className="tile wide" onClick={() => go('edu')}>
            <div className="tile-icon"><IconSchool /></div>
            <div style={{ flex: 1 }}>
              <b>{t({ cs: 'Pro školy, autoškoly a Policii ČR', en: 'For schools, driving schools & Police' })}</b>
              <span>{t({ cs: 'Výukový režim bez černého humoru a 45min metodika', en: 'Classroom mode without dark humour & 45-min lesson plan' })}</span>
            </div>
          </button>
        </div>

        <SponsorSlot compact />

        {cardOfDay && (
          <>
            <div className="section-title"><h2>{t({ cs: 'Karta dne', en: 'Card of the day' })}</h2></div>
            <CardView card={cardOfDay} />
          </>
        )}
      </div>
    </>
  );
}
