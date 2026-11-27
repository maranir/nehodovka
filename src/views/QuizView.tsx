import { useEffect, useMemo, useState } from 'react';
import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { buildQuestions, daySeed, rankFor, rng } from '../quiz';
import { share } from '../share';
import { AppBar } from '../components';
import { IconCheck, IconCoin, IconFlame, IconScale, IconShare, IconShield, IconShuffle } from '../icons';
import { useNav } from '../nav';
import { dailyDone, isCleanMode, markDaily, recordRandomQuiz, setBest } from '../storage';

const LEN = 10;

export default function QuizView({ meta, stats, mode }: { meta: Meta; stats: Stats; mode: 'daily' | 'random' }) {
  const T = useT();
  const { t } = T;
  const go = useNav();
  const clean = isCleanMode();
  const [seed, setSeed] = useState(() => (mode === 'daily' ? daySeed() : Math.floor(Math.random() * 1e9)));
  const already = mode === 'daily' ? dailyDone() : null;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ streak: number; record: boolean; comebackUsed: boolean; tokensEarned: number } | null>(null);
  const questions = useMemo(() => buildQuestions(stats, meta, T, rng(seed)).slice(0, LEN), [stats, meta, seed, T.lang]);
  const title = mode === 'daily' ? t({ cs: 'Denní kvíz', en: 'Daily quiz' }) : t({ cs: 'Náhodný kvíz', en: 'Random quiz' });

  const finished = i >= questions.length;
  useEffect(() => {
    if (!finished || result) return;
    if (mode === 'daily') {
      const d = markDaily(score);
      setResult({ streak: d.streak, record: setBest('bestDaily', score), comebackUsed: d.comebackUsed, tokensEarned: d.tokensEarned });
    } else {
      const tokensEarned = recordRandomQuiz(score);
      setResult({ streak: 0, record: setBest('bestScore', score), comebackUsed: false, tokensEarned });
    }
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
          <div className="end-icon ok"><IconCheck /></div>
          <h1>{t({ cs: `Dnes máš ${already}/10`, en: `You scored ${already}/10 today` })}</h1>
          <p className="muted">{t({ cs: 'Nové otázky budou zítra. Do té doby jezdi opatrně, ať je máš kde hrát.', en: 'New questions tomorrow. Until then, drive carefully so you are around to play.' })}</p>
          <button className="btn primary big" onClick={() => go('games/quiz')}><span className="btn-icon"><IconShuffle /></span>{t({ cs: 'Náhodný kvíz', en: 'Random quiz' })}</button>
          <button className="btn big" onClick={() => go('games/hilo')}><span className="btn-icon"><IconScale /></span>{t({ cs: 'Co zabilo víc?', en: 'What killed more?' })}</button>
        </div>
      </>
    );
  }

  if (finished) {
    const rank = rankFor(score / questions.length);
    const res = result ?? { streak: 0, record: false, comebackUsed: false, tokensEarned: 0 };
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
          <div className="reward-pills">
            {res.streak > 0 && (
              <span className="streak" style={{ fontSize: '0.95rem' }}>
                <span className="streak-icon"><IconFlame /></span>
                {t({ cs: `${res.streak} ${res.streak === 1 ? 'den' : res.streak < 5 ? 'dny' : 'dní'} v řadě`, en: `${res.streak}-day streak` })}
              </span>
            )}
            {res.comebackUsed && (
              <span className="token-pill ok">
                <IconShield /> {t({ cs: 'Série obnovena!', en: 'Streak restored!' })}
              </span>
            )}
            {res.tokensEarned > 0 && (
              <span className="token-pill">
                <IconCoin /> +{res.tokensEarned} {t({ cs: res.tokensEarned === 1 ? 'žeton' : 'žetony', en: res.tokensEarned === 1 ? 'token' : 'tokens' })}
              </span>
            )}
          </div>
          <p className="muted">
            {clean
              ? t({ cs: 'Výsledky jsou založené na datech Policie ČR.', en: 'Results are based on Czech Police open data.' })
              : score === questions.length
                ? t({ cs: 'Smrtka si tě zapsala do sešitu „složité případy“.', en: 'Death has filed you under "difficult cases".' })
                : score < questions.length / 2
                  ? t({ cs: 'Dobrá zpráva: teď víš víc než před dvěma minutami. Špatná: ostatní řidiči ne.', en: "Good news: you know more than two minutes ago. Bad news: the other drivers don't." })
                  : t({ cs: 'Slušné. Teď to ještě aplikovat za volantem.', en: 'Decent. Now apply it behind the wheel.' })}
          </p>
          <button className="btn primary big" onClick={() => share(text)}><span className="btn-icon"><IconShare /></span>{t({ cs: 'Sdílet výsledek', en: 'Share result' })}</button>
          <button className="btn big" onClick={() => (mode === 'daily' ? go('games/quiz') : restart())}><span className="btn-icon"><IconShuffle /></span>{t({ cs: 'Náhodný kvíz', en: 'Random quiz' })}</button>
          <button className="btn big" onClick={() => go('games/hilo')}><span className="btn-icon"><IconScale /></span>{t({ cs: 'Co zabilo víc?', en: 'What killed more?' })}</button>
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
            <div className={`verdict ${picked === q.correct ? 'ok' : 'ko'}`}>{picked === q.correct ? t({ cs: 'Správně', en: 'Correct' }) : t({ cs: 'Vedle', en: 'Wrong' })}</div>
            <p>{q.explain}</p>
            {!clean && <p className="quip">{q.quip}</p>}
            <button className="btn primary big" onClick={() => { setI(i + 1); setPicked(null); }}>
              {i + 1 < questions.length ? t({ cs: 'Další →', en: 'Next →' }) : t({ cs: 'Výsledek →', en: 'Result →' })}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
