import { useState } from 'react';
import type { Meta, Stats } from '../data';
import { sum } from '../data';
import { useT, type L } from '../i18n';
import { AppBar } from '../components';
import { share } from '../share';
import { AGE_BUCKETS } from '../labels';

import { AGE_POP, MODES, SLOTS, TIPS, VERDICT, type Mode, type Slot } from '../profile';

export default function ProfileView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const { t, n, p } = useT();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const S = stats.all.national;
  const title = t({ cs: 'Jak tě to zabije?', en: 'How will it get you?' });
  const since = t({ cs: `od roku ${meta.years[0].year}`, en: `since ${meta.years[0].year}` });

  const restart = () => { setStep(0); setMode(null); setAge(null); setRegion(null); setSlot(null); };

  if (step < 4) {
    const questions: { q: L; one?: boolean; options: { key: string; e?: string; label: string; pick: () => void }[] }[] = [
      {
        q: { cs: 'Jak se nejčastěji pohybuješ?', en: 'How do you usually get around?' },
        options: (Object.keys(MODES) as Mode[]).map((m) => ({ key: m, e: MODES[m].e, label: t(MODES[m].label), pick: () => setMode(m) })),
      },
      {
        q: { cs: 'Kolik ti je?', en: 'How old are you?' },
        options: AGE_BUCKETS.map((a, i) => ({ key: a, label: a, pick: () => setAge(i) })),
      },
      {
        q: { cs: 'Kde jezdíš nejčastěji?', en: 'Where do you travel most?' },
        one: true,
        options: Object.entries(meta.regions).sort((a, b) => a[1].cs.localeCompare(b[1].cs, 'cs')).map(([code, r]) => ({ key: code, label: t(r), pick: () => setRegion(code) })),
      },
      {
        q: { cs: 'Kdy jsi nejčastěji na cestě?', en: 'When are you usually on the road?' },
        one: true,
        options: (Object.keys(SLOTS) as Slot[]).map((s) => ({ key: s, e: SLOTS[s].e, label: t(SLOTS[s].label), pick: () => setSlot(s) })),
      },
    ];
    const q = questions[step];
    return (
      <>
        <AppBar back="games" title={title} />
        <div className="page">
          <div className="step-dots">{questions.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
          <div className="eyebrow">{step + 1}/4</div>
          <h1>{t(q.q)}</h1>
          <div className={`choices ${q.one ? 'one' : ''}`}>
            {q.options.map((o) => (
              <button key={o.key} className="choice" onClick={() => { o.pick(); setStep(step + 1); }}>
                {o.e && <span className="e">{o.e}</span>}
                {o.label}
              </button>
            ))}
          </div>
          {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>← {t({ cs: 'Zpět', en: 'Back' })}</button>}
        </div>
      </>
    );
  }

  // ---------- result ----------
  const car = S.vehicles['3'];
  const carRate = car.k / car.n;
  const modeStat: Record<Mode, { k: number; rate: number }> = {
    car: { k: car.k, rate: carRate },
    passenger: { k: (S.persons.role['2'] ?? 0) + (S.persons.role['3'] ?? 0) + (S.persons.role['4'] ?? 0), rate: carRate },
    moto: { k: S.vehicles['2'].k, rate: S.vehicles['2'].k / S.vehicles['2'].n },
    bike: { k: S.vehicles['13'].k, rate: S.vehicles['13'].k / S.vehicles['13'].n },
    walk: { k: S.peds.k, rate: S.peds.k / S.peds.n },
  };
  const ms = modeStat[mode!];
  const mMult = ms.rate / carRate;

  const ageDeaths = S.persons.killedAge.map((k, i) => k + S.peds.killedAge[i]);
  const perCap = ageDeaths.map((d, i) => d / AGE_POP[i]);
  const avgCap = sum(ageDeaths) / sum(AGE_POP);
  const aMult = perCap[age!] / avgCap;

  const R = stats.all.regions;
  const totalPop = Object.values(meta.regions).reduce((s, r) => s + r.pop, 0);
  const rRate = R[region!].killed / meta.regions[region!].pop;
  const rMult = rRate / (S.killed / totalPop);

  const hrs = SLOTS[slot!].hours;
  const sk = hrs.reduce((s, h) => s + S.hour.k[h], 0), sn = hrs.reduce((s, h) => s + S.hour.n[h], 0);
  const tMult = sk / sn / (sum(S.hour.k) / sum(S.hour.n));

  const score = Math.max(2, Math.min(99, Math.round(40 + 16 * Math.log2(mMult * aMult * rMult * tMult))));
  const level =
    score < 30 ? t({ cs: 'Nudně v bezpečí', en: 'Boringly safe' })
      : score < 45 ? t({ cs: 'Běžný smrtelník', en: 'Ordinary mortal' })
        : score < 60 ? t({ cs: 'Pokoušíš osud', en: 'Tempting fate' })
          : score < 75 ? t({ cs: 'Smrtka si tě píše', en: 'Death has your number' })
            : t({ cs: 'VIP klient smrtky', en: "Death's VIP client" });
  const color = score < 45 ? '#2bd576' : score < 60 ? '#ffd400' : score < 75 ? '#ff9500' : '#ff1f3d';

  const x = (m: number) => `×${p(m)}`;
  const factor = (e: string, title: string, sub: string, m: number) => (
    <div className="factor" key={title}>
      <span className="e">{e}</span>
      <div>{title}<small>{sub}</small></div>
      <span className={`x ${m > 1.15 ? 'up' : m < 0.87 ? 'down' : ''}`}>{x(m)}</span>
    </div>
  );

  const extraTip: L | null =
    slot === 'night' ? { cs: '🌙 V noci je každá nehoda víc než 2× smrtelnější. Únava + tma = mikrospánek.', en: '🌙 At night every crash is over twice as deadly. Fatigue + dark = microsleep.' }
      : age === 2 ? { cs: '🧑 18–24: kamarádi v autě riziko zvyšují. Nejsi na Instagramu, jsi na silnici.', en: "🧑 18–24: friends in the car raise the risk. You're on a road, not on Instagram." }
        : age! >= 7 ? { cs: '👵 Reakce se s věkem zpomalují. Delší odstup a méně jízdy za tmy.', en: '👵 Reactions slow with age. Longer gaps and less driving after dark.' }
          : age === 0 ? { cs: '🧒 Děti neodhadnou rychlost auta. Rodiče: přecházejte s nimi a buďte vidět.', en: "🧒 Kids can't judge car speed. Parents: cross with them and be visible." }
            : null;

  const shareText = t({
    cs: `Můj rizikový profil v Nehodovce: ${score}/100 – ${level}. ${t(VERDICT[mode!])} Jak dopadneš ty?`,
    en: `My Nehodovka risk profile: ${score}/100 – ${level}. ${t(VERDICT[mode!])} How about you?`,
  });

  // semicircle gauge
  const a0 = Math.PI, a1 = Math.PI * (1 - score / 100);
  const R0 = 90, cx = 110, cy = 105;
  const arc = (from: number, to: number) => `M ${cx + R0 * Math.cos(from)} ${cy - R0 * Math.sin(from)} A ${R0} ${R0} 0 0 1 ${cx + R0 * Math.cos(to)} ${cy - R0 * Math.sin(to)}`;

  return (
    <>
      <AppBar back="games" title={title} />
      <div className="page">
        <div className="eyebrow center">{t({ cs: 'Tvůj rizikový profil', en: 'Your risk profile' })}</div>
        <div className="gauge">
          <svg viewBox="0 0 220 120">
            <path d={arc(a0, 0)} stroke="#2a2a2a" strokeWidth="18" fill="none" strokeLinecap="round" />
            <path d={arc(a0, a1)} stroke={color} strokeWidth="18" fill="none" strokeLinecap="round" />
          </svg>
          <div className="gauge-num" style={{ color }}>{score}</div>
        </div>
        <div className="gauge-label" style={{ color }}>{level}</div>
        <h2 className="center" style={{ marginTop: 14 }}>{t(VERDICT[mode!])}</h2>

        <section className="panel">
          {factor(MODES[mode!].e, t(MODES[mode!].label), t({ cs: `${n(ms.k)} mrtvých ${since}; riziko úmrtí při nehodě vs. auto`, en: `${n(ms.k)} dead ${since}; risk of dying in a crash vs. a car` }), mMult)}
          {factor('🎂', t({ cs: `Věk ${AGE_BUCKETS[age!]}`, en: `Age ${AGE_BUCKETS[age!]}` }), t({ cs: `${n(ageDeaths[age!])} mrtvých ${since}; na obyvatele vs. průměr`, en: `${n(ageDeaths[age!])} dead ${since}; per capita vs. average` }), aMult)}
          {factor('📍', t(meta.regions[region!]), t({ cs: `${n(R[region!].killed)} mrtvých; na obyvatele vs. průměr ČR`, en: `${n(R[region!].killed)} dead; per capita vs. national` }), rMult)}
          {factor(SLOTS[slot!].e, t(SLOTS[slot!].label), t({ cs: 'jak smrtelná je nehoda v tuhle dobu', en: 'how deadly a crash is at this time' }), tMult)}
        </section>

        <h2>{t({ cs: 'Jak to přežít', en: 'How to survive it' })}</h2>
        <ul className="facts" style={{ listStyle: 'none', padding: 0 }}>
          {[...TIPS[mode!], ...(extraTip ? [extraTip] : [])].map((tip, i) => (
            <li key={i} className="tip" style={{ marginBottom: 8 }}>{t(tip)}</li>
          ))}
        </ul>
        <button className="btn primary big" onClick={() => share(shareText)}>{t({ cs: '📤 Sdílet můj profil', en: '📤 Share my profile' })}</button>
        <button className="btn big" onClick={restart}>{t({ cs: '🔁 Zkusit jako někdo jiný', en: '🔁 Try as someone else' })}</button>
        <p className="muted small">
          {t({
            cs: 'Hravý odhad, ne vědecká studie. Násobky jsou spočítané z policejních dat; počty obyvatel podle věku jsou přibližné. Skóre nezná tvoje řidičské schopnosti – a to je asi dobře.',
            en: "A playful estimate, not a scientific study. Multipliers come from police data; population by age is approximate. The score doesn't know your driving skills – probably for the best.",
          })}
        </p>
      </div>
    </>
  );
}
