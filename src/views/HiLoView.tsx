import { useMemo, useState } from 'react';
import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { hiloItems, type HiLoItem } from '../hilo';
import { AppBar } from '../components';
import CountUp from '../CountUp';
import { share } from '../share';
import { getNum, setBest } from '../storage';

type Phase = 'ask' | 'reveal' | 'over';

export default function HiLoView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const { t, n, lang } = useT();
  const items = useMemo(() => hiloItems(stats, meta), [stats, meta]);
  const randomItem = (except: HiLoItem[]) => {
    const pool = items.filter((x) => !except.some((e) => e.id === x.id) && !except.some((e) => e.value === x.value));
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const [a, setA] = useState<HiLoItem>(() => randomItem([]));
  const [b, setB] = useState<HiLoItem>(() => randomItem([a]));
  const [used, setUsed] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('ask');
  const [ok, setOk] = useState(false);
  const [streak, setStreak] = useState(0);
  const [record, setRecord] = useState(false);
  const since = t({ cs: `mrtvých od roku ${meta.years[0].year}`, en: `deaths since ${meta.years[0].year}` });

  const guess = (higher: boolean) => {
    if (phase !== 'ask') return;
    const right = higher ? b.value >= a.value : b.value <= a.value;
    setOk(right);
    setPhase('reveal');
    navigator.vibrate?.(right ? 20 : [50, 40, 50]);
    if (right) setStreak((s) => s + 1);
    else setRecord(setBest('hiloBest', streak));
  };
  const next = () => {
    if (!ok) {
      setPhase('over');
      return;
    }
    const nu = [...used, a.id];
    const fresh = randomItem([b, ...items.filter((x) => nu.includes(x.id))]) ?? randomItem([b]);
    setUsed(nu.length > items.length - 4 ? [] : nu);
    setA(b);
    setB(fresh);
    setPhase('ask');
  };
  const restart = () => {
    const na = randomItem([]);
    setA(na);
    setB(randomItem([na]));
    setUsed([]);
    setStreak(0);
    setRecord(false);
    setPhase('ask');
  };

  const title = t({ cs: 'Co zabilo víc?', en: 'What killed more?' });
  if (phase === 'over') {
    const quip =
      streak >= 10 ? t({ cs: 'Tohle už není hra. Ty jsi statistik.', en: "This isn't a game any more. You're a statistician." })
        : streak >= 5 ? t({ cs: 'Slušná série. Smrtka si dělá poznámky.', en: 'Solid streak. Death is taking notes.' })
          : streak >= 2 ? t({ cs: 'Intuice funguje. Napůl.', en: 'Your gut works. Half the time.' })
            : t({ cs: 'Tvoje intuice by neměla řídit.', en: 'Your gut should not be driving.' });
    return (
      <>
        <AppBar back="games" title={title} />
        <div className="page center">
          <div className="big-emoji">{streak >= 5 ? '🏆' : '💥'}</div>
          <div className="eyebrow">{t({ cs: 'Série', en: 'Streak' })}{record ? t({ cs: ' · nový rekord!', en: ' · new record!' }) : ''}</div>
          <h1 style={{ fontSize: '4rem', margin: '4px 0' }}>{streak}</h1>
          <p className="quip">{quip}</p>
          <p className="muted">{t({ cs: `Rekord: ${Math.max(getNum('hiloBest'), streak)}`, en: `Best: ${Math.max(getNum('hiloBest'), streak)}` })}</p>
          <button className="btn primary big" onClick={restart}>{t({ cs: '🔁 Znovu', en: '🔁 Again' })}</button>
          <button className="btn big" onClick={() => share(t({ cs: `V „Co zabilo víc?“ mám sérii ${streak}. Překonáš to?`, en: `I got a streak of ${streak} in "What killed more?". Can you beat it?` }))}>
            {t({ cs: '📤 Vyzvat kamaráda', en: '📤 Challenge a friend' })}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AppBar back="games" title={title} />
      <div className="page">
        <div className="scorebar">
          <span>{t({ cs: 'Série', en: 'Streak' })} <b>{streak}</b></span>
          <span>{t({ cs: 'Rekord', en: 'Best' })} <b>{Math.max(getNum('hiloBest'), streak)}</b></span>
        </div>
        <div className="hilo">
          <div className="hilo-card known" key={a.id}>
            <div className="emoji">{a.emoji}</div>
            <div className="label">{t(a.label)}</div>
            <div className="value">{n(a.value)}</div>
            <div className="unit">{since}</div>
          </div>
          <div className="hilo-vs">VS</div>
          <div className={`hilo-card mystery ${phase === 'reveal' ? (ok ? 'result-ok' : 'result-ko') : ''}`} key={b.id}>
            <div className="emoji">{b.emoji}</div>
            <div className="label">{t(b.label)}</div>
            {phase === 'reveal' ? (
              <>
                <div className="value"><CountUp key={b.id + lang} text={n(b.value)} duration={700} /></div>
                <div className="unit">{since}</div>
              </>
            ) : (
              <div className="unit" style={{ marginTop: 8 }}>{t({ cs: 'zabilo víc, nebo míň?', en: 'killed more or fewer?' })}</div>
            )}
          </div>
          {phase === 'ask' ? (
            <div className="hilo-buttons">
              <button className="btn danger big" onClick={() => guess(true)}>▲ {t({ cs: 'Víc', en: 'More' })}</button>
              <button className="btn big" onClick={() => guess(false)}>▼ {t({ cs: 'Míň', en: 'Fewer' })}</button>
            </div>
          ) : (
            <button className={`btn big ${ok ? 'primary' : 'danger'}`} onClick={next}>
              {ok ? t({ cs: '✔ Správně – další →', en: '✔ Correct – next →' }) : t({ cs: '✘ Konec hry →', en: '✘ Game over →' })}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
