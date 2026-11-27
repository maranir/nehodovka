import type { Meta, Stats } from '../data';
import { useT } from '../i18n';
import { useNav } from '../nav';
import { AppBar, BadgeIcon, ComebackBanner, DateBadge, usePrefsTick } from '../components';
import { IconCoin, IconFlame, IconScale, IconShuffle, IconTarget } from '../icons';
import { BADGES } from '../rewards';
import { dailyDone, dailyStreak, getBadges, getNum, getTokens } from '../storage';

export default function GamesView(_: { meta: Meta; stats: Stats }) {
  const { t } = useT();
  const go = useNav();
  usePrefsTick();
  const done = dailyDone();
  const streak = dailyStreak();
  const tokens = getTokens();
  const unlocked = new Set(getBadges());
  return (
    <>
      <AppBar />
      <div className="page">
        <div className="games-head">
          <div>
            <div className="eyebrow">{t({ cs: 'Hry', en: 'Games' })}</div>
            <h1>{t({ cs: 'Uč se. Hraj. Přežij.', en: 'Learn. Play. Survive.' })}</h1>
          </div>
          <div className="token-pill" title={t({ cs: 'Bezpečnostní žetony', en: 'Safety tokens' })}>
            <IconCoin /> <b>{tokens}</b>
          </div>
        </div>
        <ComebackBanner />
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
        <div className="section-title">
          <h2>{t({ cs: 'Odznaky & žetony', en: 'Badges & tokens' })}</h2>
          <span className="muted small">{unlocked.size}/{BADGES.length}</span>
        </div>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const on = unlocked.has(b.id);
            return (
              <div className={`badge-card ${on ? 'on' : 'locked'}`} key={b.id}>
                <span className="badge-icon"><BadgeIcon name={b.icon} /></span>
                <div>
                  <b>{t(b.name)}</b>
                  <div className="muted small">{t(b.desc)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted small" style={{ marginTop: 18 }}>
          {t({ cs: 'Žetony získáváš za denní kvíz (+1, za 8+/10 +2), první profil a rekordy. Za 2 žetony můžeš obnovit přerušenou sérii.', en: 'Earn tokens from daily quizzes (+1, or +2 for 8+/10), your first profile, and records. Spend 2 tokens to restore a paused streak.' })}
        </p>
      </div>
    </>
  );
}
