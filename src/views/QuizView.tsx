import { useMemo, useState } from 'react';
import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { buildQuestions, daySeed, rankFor, rng } from '../quiz';
import { share } from '../share';

const LEN = 10;

export default function QuizView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const T = useT();
  const { t } = T;
  const [mode, setMode] = useState<'daily' | 'random' | null>(null);
  const [seed, setSeed] = useState(daySeed());
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const questions = useMemo(() => buildQuestions(stats, meta, T, rng(seed)).slice(0, LEN), [stats, meta, seed, T.lang]);

  const start = (m: 'daily' | 'random') => {
    setMode(m);
    setSeed(m === 'daily' ? daySeed() : Math.floor(Math.random() * 1e9));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  if (!mode) {
    const best = Number(localStorage.getItem('bestScore') ?? 0);
    return (
      <div className="page quiz-intro">
        <div className="eyebrow">{t({ cs: 'Kvíz', en: 'Quiz' })}</div>
        <h1>{t({ cs: 'Víš, co tě na silnici zabije?', en: 'Do you know what will kill you on the road?' })}</h1>
        <p className="muted">
          {t({
            cs: `${LEN} otázek ze skutečných policejních dat. Každá odpověď je jedna nehoda, kterou nemusíš zažít.`,
            en: `${LEN} questions from real police data. Every answer is one crash you don't have to experience.`,
          })}
        </p>
        <button className="btn primary big" onClick={() => start('daily')}>
          {t({ cs: '📅 Denní kvíz', en: '📅 Daily quiz' })}
        </button>
        <button className="btn big" onClick={() => start('random')}>
          {t({ cs: '🎲 Náhodný kvíz', en: '🎲 Random quiz' })}
        </button>
        {best > 0 && <p className="muted small">{t({ cs: 'Tvůj rekord', en: 'Your best' })}: {best}/{LEN}</p>}
      </div>
    );
  }

  if (i >= questions.length) {
    const rank = rankFor(score / questions.length);
    const best = Number(localStorage.getItem('bestScore') ?? 0);
    if (score > best) localStorage.setItem('bestScore', String(score));
    const text = t({
      cs: `Nehodovka kvíz: ${score}/${questions.length} – ${rank.cs} ${rank.emoji}. Víš, co tě na silnici zabije?`,
      en: `Nehodovka quiz: ${score}/${questions.length} – ${rank.en} ${rank.emoji}. Do you know what will kill you on the road?`,
    });
    return (
      <div className="page quiz-result">
        <div className="rank-emoji">{rank.emoji}</div>
        <div className="eyebrow">{score}/{questions.length}</div>
        <h1>{t(rank)}</h1>
        <p className="muted">
          {score === questions.length
            ? t({ cs: 'Smrtka si tě zapsala do sešitu „složité případy“.', en: 'Death has filed you under "difficult cases".' })
            : score < questions.length / 2
              ? t({ cs: 'Dobrá zpráva: teď víš víc než před deseti minutami. Špatná: ostatní řidiči ne.', en: "Good news: you know more than ten minutes ago. Bad news: the other drivers don't." })
              : t({ cs: 'Slušné. Teď to ještě aplikovat za volantem.', en: 'Decent. Now apply it behind the wheel.' })}
        </p>
        <button className="btn primary big" onClick={() => share(text)}>{t({ cs: '📤 Sdílet výsledek', en: '📤 Share result' })}</button>
        <button className="btn big" onClick={() => start('random')}>{t({ cs: '🎲 Ještě jednou', en: '🎲 Again' })}</button>
        <button className="btn ghost" onClick={() => setMode(null)}>{t({ cs: 'Zpět', en: 'Back' })}</button>
      </div>
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
    <div className="page quiz">
      <div className="progress"><div style={{ width: `${(100 * i) / questions.length}%` }} /></div>
      <div className="eyebrow">
        {t({ cs: 'Otázka', en: 'Question' })} {i + 1}/{questions.length} · {t({ cs: 'skóre', en: 'score' })} {score}
      </div>
      <h2>{q.q}</h2>
      <div className={`options n${q.options.length}`}>
        {q.options.map((o, k) => (
          <button
            key={k}
            className={`option ${answered ? (k === q.correct ? 'right' : k === picked ? 'wrong' : 'dim') : ''}`}
            onClick={() => choose(k)}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <div className="explain">
          <div className="verdict">{picked === q.correct ? t({ cs: '✔ Správně', en: '✔ Correct' }) : t({ cs: '✘ Vedle', en: '✘ Wrong' })}</div>
          <p>{q.explain}</p>
          <p className="quip">{q.quip}</p>
          <button className="btn primary big" onClick={() => { setI(i + 1); setPicked(null); }}>
            {i + 1 < questions.length ? t({ cs: 'Další →', en: 'Next →' }) : t({ cs: 'Výsledek →', en: 'Result →' })}
          </button>
        </div>
      )}
    </div>
  );
}
