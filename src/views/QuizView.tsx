import { useEffect, useMemo, useState } from 'react';
import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { buildQuestions, daySeed, rankFor, rng } from '../quiz';
import { share } from '../share';
import { AppBar } from '../components';
import { useNav } from '../nav';
import { dailyDone, markDaily, setBest } from '../storage';

const LEN = 10;

export default function QuizView({ meta, stats, mode }: { meta: Meta; stats: Stats; mode: 'daily' | 'random' }) {
  const T = useT();
  const { t } = T;
  const go = useNav();
  const [seed, setSeed] = useState(() => (mode === 'daily' ? daySeed() : Math.floor(Math.random() * 1e9)));
  const already = mode === 'daily' ? dailyDone() : null;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ streak: number; record: boolean } | null>(null);
  const questions = useMemo(() => buildQuestions(stats, meta, T, rng(seed)).slice(0, LEN), [stats, meta, seed, T.lang]);
  const title = mode === 'daily' ? t({ cs: 'Denní kvíz', en: 'Daily quiz' }) : t({ cs: 'Náhodný kvíz', en: 'Random quiz' });

  const finished = i >= questions.length;
  useEffect(() => {
    if (!finished || result) return;
    setResult({ streak: mode === 'daily' ? markDaily(score) : 0, record: setBest(mode === 'daily' ? 'bestDaily' : 'bestScore', score) });
  }, [finished, result, mode, score]);

  const restart = () => {
    setSeed(Math.floor(Math.random() * 1e9));
    setI(0);
    setPicked(null);
    setScore(0);
    setResult(null);
  };

  if (already != null && i === 0 && picked == null && !result) {
    return (
      <>
        <AppBar back="games" title={title} />
        <div className="page center">
          <div className="big-emoji">✅</div>
          <h1>{t({ cs: `Dnes máš ${already}/10`, en: `You scored ${already}/10 today` })}</h1>
          <p className="muted">{t({ cs: 'Nové otázky budou zítra. Do té doby jezdi opatrně, ať je máš kde hrát.', en: 'New questions tomorrow. Until then, drive carefully so you are around to play.' })}</p>
          <button className="btn primary big" onClick={() => go('games/quiz')}>{t({ cs: '🎲 Náhodný kvíz', en: '🎲 Random quiz' })}</button>
          <button className="btn big" onClick={() => go('games/hilo')}>{t({ cs: '⚖️ Co zabilo víc?', en: '⚖️ What killed more?' })}</button>
        </div>
      </>
    );
  }

  if (finished) {
    const rank = rankFor(score / questions.length);
    const res = result ?? { streak: 0, record: false };
    const text = t({
      cs: `${mode === 'daily' ? 'Denní kvíz' : 'Kvíz'} Nehodovka: ${score}/${questions.length} – ${rank.cs} ${rank.emoji}${res.streak > 1 ? ` 🔥${res.streak}` : ''}. Víš, co tě na silnici zabije?`,
      en: `Nehodovka ${mode === 'daily' ? 'daily ' : ''}quiz: ${score}/${questions.length} – ${rank.en} ${rank.emoji}${res.streak > 1 ? ` 🔥${res.streak}` : ''}. Do you know what will kill you on the road?`,
    });
    return (
      <>
        <AppBar back="games" title={title} />
        <div className="page center">
          <div className="big-emoji">{rank.emoji}</div>
          <div className="eyebrow">{score}/{questions.length}{res.record ? t({ cs: ' · nový rekord!', en: ' · new record!' }) : ''}</div>
          <h1>{t(rank)}</h1>
          {res.streak > 0 && <p><span className="streak" style={{ fontSize: '1rem' }}>🔥 {t({ cs: `${res.streak} ${res.streak === 1 ? 'den' : res.streak < 5 ? 'dny' : 'dní'} v řadě`, en: `${res.streak}-day streak` })}</span></p>}
          <p className="muted">
            {score === questions.length
              ? t({ cs: 'Smrtka si tě zapsala do sešitu „složité případy“.', en: 'Death has filed you under "difficult cases".' })
              : score < questions.length / 2
                ? t({ cs: 'Dobrá zpráva: teď víš víc než před dvěma minutami. Špatná: ostatní řidiči ne.', en: "Good news: you know more than two minutes ago. Bad news: the other drivers don't." })
                : t({ cs: 'Slušné. Teď to ještě aplikovat za volantem.', en: 'Decent. Now apply it behind the wheel.' })}
          </p>
          <button className="btn primary big" onClick={() => share(text)}>{t({ cs: '📤 Sdílet výsledek', en: '📤 Share result' })}</button>
          <button className="btn big" onClick={() => (mode === 'daily' ? go('games/quiz') : restart())}>{t({ cs: '🎲 Náhodný kvíz', en: '🎲 Random quiz' })}</button>
          <button className="btn big" onClick={() => go('games/hilo')}>{t({ cs: '⚖️ Co zabilo víc?', en: '⚖️ What killed more?' })}</button>
        </div>
      </>
    );
  }

  const q = questions[i];
  const answered = picked != null;
  const choose = (k: number) => {
    if (answered) return;
    setPicked(k);
    if (k === q.correct) setScore((s) => s + 1);
    navigator.vibrate?.(k === q.correct ? 20 : [40, 40, 40]);
  };
  return (
    <>
      <AppBar back="games" title={title} />
      <div className="page">
        <div className="progress"><div style={{ width: `${(100 * (i + (answered ? 1 : 0))) / questions.length}%` }} /></div>
        <div className="eyebrow">
          {t({ cs: 'Otázka', en: 'Question' })} {i + 1}/{questions.length} · {t({ cs: 'skóre', en: 'score' })} {score}
        </div>
        <h2 style={{ marginTop: 10 }}>{q.q}</h2>
        <div className={`options n${q.options.length}`}>
          {q.options.map((o, k) => (
            <button key={k} className={`option ${answered ? (k === q.correct ? 'right' : k === picked ? 'wrong' : 'dim') : ''}`} onClick={() => choose(k)}>
              {o}
            </button>
          ))}
        </div>
        {answered && (
          <div className="explain">
            <div className={`verdict ${picked === q.correct ? 'ok' : 'ko'}`}>{picked === q.correct ? t({ cs: '✔ Správně', en: '✔ Correct' }) : t({ cs: '✘ Vedle', en: '✘ Wrong' })}</div>
            <p>{q.explain}</p>
            <p className="quip">{q.quip}</p>
            <button className="btn primary big" onClick={() => { setI(i + 1); setPicked(null); }}>
              {i + 1 < questions.length ? t({ cs: 'Další →', en: 'Next →' }) : t({ cs: 'Výsledek →', en: 'Result →' })}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
