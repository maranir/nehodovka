import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { useNav } from '../nav';
import { AppBar, DateBadge } from '../components';
import { IconFlame, IconScale, IconShuffle, IconTarget } from '../icons';
import { dailyDone, dailyStreak, getNum } from '../storage';

export default function GamesView(_: { meta: Meta; stats: Stats }) {
  const { t } = useT();
  const go = useNav();
  const done = dailyDone();
  const streak = dailyStreak();
  return (
    <>
      <AppBar />
      <div className="page">
        <div className="eyebrow">{t({ cs: 'Hry', en: 'Games' })}</div>
        <h1>{t({ cs: 'Uč se. Hraj. Přežij.', en: 'Learn. Play. Survive.' })}</h1>
        <div className="tiles">
          <button className={`tile wide ${done == null ? 'yellow' : ''}`} onClick={() => go('games/daily')}>
            <DateBadge />
            <div style={{ flex: 1 }}>
              <b>{t({ cs: 'Denní kvíz', en: 'Daily quiz' })}</b>
              <span>{done == null ? t({ cs: 'Stejné otázky pro celé Česko. Dnes ještě nehráno.', en: 'Same questions for everyone. Not played today.' }) : t({ cs: `Dnes: ${done}/10. Další zítra.`, en: `Today: ${done}/10. Next one tomorrow.` })}</span>
            </div>
            {streak > 0 && <span className="streak"><span className="streak-icon"><IconFlame /></span>{streak}</span>}
          </button>
          <button className="tile red" onClick={() => go('games/profile')}>
            <div className="tile-icon"><IconTarget /></div>
            <div>
              <b>{t({ cs: 'Jak tě to zabije?', en: 'How will it get you?' })}</b>
              <span>{t({ cs: '4 otázky → tvůj rizikový profil', en: '4 questions → your risk profile' })}</span>
            </div>
          </button>
          <button className="tile" onClick={() => go('games/hilo')}>
            <div className="tile-icon"><IconScale /></div>
            <div>
              <b>{t({ cs: 'Co zabilo víc?', en: 'What killed more?' })}</b>
              <span>{getNum('hiloBest') ? t({ cs: `Rekord: ${getNum('hiloBest')}`, en: `Best: ${getNum('hiloBest')}` }) : t({ cs: 'Nekonečná hra', en: 'Endless game' })}</span>
            </div>
          </button>
          <button className="tile wide" onClick={() => go('games/quiz')}>
            <div className="tile-icon"><IconShuffle /></div>
            <div style={{ flex: 1 }}>
              <b>{t({ cs: 'Náhodný kvíz', en: 'Random quiz' })}</b>
              <span>{getNum('bestScore') ? t({ cs: `Rekord ${getNum('bestScore')}/10`, en: `Best ${getNum('bestScore')}/10` }) : t({ cs: 'Pokaždé jiné otázky', en: 'Different questions every time' })}</span>
            </div>
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 22 }}>
          {t({ cs: 'Všechny odpovědi jsou spočítané ze skutečných nehod. Žádná čísla si nevymýšlíme – to nechceme ani my.', en: 'Every answer is computed from real crashes. We make up no numbers – we wouldn\'t want to.' })}
        </p>
      </div>
    </>
  );
}
