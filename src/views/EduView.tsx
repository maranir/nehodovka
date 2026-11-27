import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { useNav } from '../nav';
import { AppBar, SponsorSlot, usePrefsTick } from '../components';
import { IconCards, IconMap, IconRefresh, IconSchool, IconShield, IconTarget } from '../icons';
import { isCleanMode, setCleanMode } from '../storage';

export default function EduView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const { t, n, pct } = useT();
  const go = useNav();
  usePrefsTick();
  const clean = isCleanMode();
  const S = stats.all.national;

  const speedK = (S.cause['201']?.k ?? 0) + (S.cause['202']?.k ?? 0) + (S.cause['203']?.k ?? 0);
  const inattN = S.cause['501']?.n ?? 0;
  const alcK = S.alcohol.k;
  const youngK = S.persons.killedAge[2] ?? 0;

  return (
    <>
      <AppBar back="info" title={t({ cs: 'Pro školy a policii', en: 'Schools & Police' })} />
      <div className="page edu">
        <div className="eyebrow">{t({ cs: 'Vzdělávání & prevence', en: 'Education & prevention' })}</div>
        <h1>{t({ cs: 'Režim pro školy, autoškoly a Policii ČR', en: 'Mode for schools, driving schools & Police' })}</h1>
        <p className="muted">
          {t({
            cs: 'Připraveno pro projektor ve třídě, autoškolu i preventivní besedy BESIP. Reálná data Policie ČR bez účtů, bez sledování a zdarma.',
            en: 'Built for classroom projectors, driving schools, and police prevention workshops. Real Czech Police data with zero accounts, zero tracking, and free access.',
          })}
        </p>

        <section className="panel edu-toggle-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="tile-icon"><IconShield /></span>
            <div style={{ flex: 1 }}>
              <b>{t({ cs: 'Výukový režim (bez černého humoru)', en: 'Classroom mode (no dark humour)' })}</b>
              <div className="muted small">
                {t({
                  cs: 'Skryje ironické hlášky na kartách a v kvízech. Ponechá čistá fakta a poučení.',
                  en: 'Hides dark-humour punchlines on cards and quizzes. Keeps pure facts and lessons.',
                })}
              </div>
            </div>
            <button
              className={`chip ${clean ? 'on' : ''}`}
              onClick={() => setCleanMode(!clean)}
              aria-pressed={clean}
            >
              {clean ? t({ cs: 'Zapnuto', en: 'On' }) : t({ cs: 'Vypnuto', en: 'Off' })}
            </button>
          </div>
        </section>

        <h2>{t({ cs: 'Metodika na 45 minut', en: '45-minute lesson plan' })}</h2>
        <div className="panel">
          <div className="edu-step">
            <span className="edu-time">0–10 min</span>
            <div>
              <b>{t({ cs: 'Lokální realita a rytmus dne', en: 'Local reality & daily rhythm' })}</b>
              <p className="muted small">{t({ cs: 'Otevřete mapu nehod v okolí školy nebo obce a ukažte nejrizikovější místa v dojezdové vzdálenosti.', en: 'Open the crash map around your school or town and inspect nearby black spots.' })}</p>
              <button className="link" onClick={() => go('map/spots')}>
                <IconMap /> {t({ cs: 'Otevřít černá místa →', en: 'Open black spots →' })}
              </button>
            </div>
          </div>

          <div className="edu-step">
            <span className="edu-time">10–25 min</span>
            <div>
              <b>{t({ cs: 'Společný denní kvíz (10 otázek)', en: 'Shared daily quiz (10 questions)' })}</b>
              <p className="muted small">{t({ cs: 'Stejných 10 otázek pro celou třídu. Nechte žáky hlasovat předem a porovnejte intuici s daty.', en: 'Same 10 questions for the whole class. Have students vote first, then compare intuition with data.' })}</p>
              <button className="link" onClick={() => go('games/daily')}>
                <IconTarget /> {t({ cs: 'Spustit denní kvíz →', en: 'Launch daily quiz →' })}
              </button>
            </div>
          </div>

          <div className="edu-step">
            <span className="edu-time">25–35 min</span>
            <div>
              <b>{t({ cs: 'Můj rizikový profil (věk 18–24)', en: 'Personal risk profile (ages 18–24)' })}</b>
              <p className="muted small">{t({ cs: 'Porovnejte násobič rizika pro mladé řidiče, jízdu v noci, motorku nebo chůzi bez reflexních prvků.', en: 'Compare risk multipliers for young drivers, night travel, motorcycles, or walking without reflectors.' })}</p>
              <button className="link" onClick={() => go('games/profile')}>
                <IconSchool /> {t({ cs: 'Otevřít rizikový profil →', en: 'Open risk profile →' })}
              </button>
            </div>
          </div>

          <div className="edu-step">
            <span className="edu-time">35–45 min</span>
            <div>
              <b>{t({ cs: 'Diskuze nad kartami příčin', en: 'Cause cards discussion' })}</b>
              <p className="muted small">{t({ cs: 'Projděte témata rychlost, mobil za volantem, bezpečnostní pás a viditelnost chodců.', en: 'Review speed, phone distraction, seatbelts, and pedestrian visibility.' })}</p>
              <button className="link" onClick={() => go('cards')}>
                <IconCards /> {t({ cs: 'Otevřít karty →', en: 'Open cards →' })}
              </button>
            </div>
          </div>
        </div>

        <h2>{t({ cs: 'Čísla pro tabuli', en: 'Numbers for the board' })}</h2>
        <div className="panel">
          <div className="row"><span>{t({ cs: 'Období dat Policie ČR', en: 'Czech Police data period' })}</span><b>{meta.years[0].year}–{meta.years[meta.years.length - 1].year}</b></div>
          <div className="row"><span>{t({ cs: 'Podíl nepřiměřené rychlosti na úmrtích', en: 'Speed share of fatalities' })}</span><b>{pct(speedK, S.killed)}</b></div>
          <div className="row"><span>{t({ cs: 'Nehody z nepozornosti (mobil apod.)', en: 'Inattention crashes (phones, etc.)' })}</span><b>{n(inattN)}</b></div>
          <div className="row"><span>{t({ cs: 'Oběti nehod s alkoholem', en: 'Alcohol-crash fatalities' })}</span><b>{n(alcK)}</b></div>
          {youngK > 0 && <div className="row"><span>{t({ cs: 'Zemřelí ve věku 18–24 let', en: 'Fatalities aged 18–24' })}</span><b>{n(youngK)}</b></div>}
        </div>

        <div className="no-print" style={{ marginTop: 14 }}>
          <button className="btn primary big" onClick={() => window.print()}>
            <span className="btn-icon"><IconRefresh /></span>
            {t({ cs: 'Vytisknout metodiku / uložit PDF', en: 'Print lesson plan / save PDF' })}
          </button>
        </div>

        <h2>{t({ cs: 'Proč je to bezpečné pro školy', en: 'School-safe by design' })}</h2>
        <ul className="facts">
          <li>{t({ cs: 'Žádná registrace žáků, žádné cookies třetích stran, žádné sledování (GDPR-free).', en: 'No student accounts, no third-party cookies, zero tracking.' })}</li>
          <li>{t({ cs: 'Oficiální otevřená data Policie ČR (CC BY 4.0), týdenní aktualizace.', en: 'Official Czech Police open data (CC BY 4.0), updated weekly.' })}</li>
          <li>{t({ cs: 'Funguje i offline jako PWA a plně dvojjazyčně (CZ / EN).', en: 'Works offline as a PWA and fully bilingual (CZ / EN).' })}</li>
        </ul>

        <div className="no-print" style={{ marginTop: 18 }}>
          <SponsorSlot />
        </div>
      </div>
    </>
  );
}
