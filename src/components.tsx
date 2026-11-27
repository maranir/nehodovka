import { useEffect, useState, type ReactNode } from 'react';
import type { Card } from './cards';
import CountUp from './CountUp';
import { useLang, useT } from './i18n';
import {
  IconAward,
  IconBack,
  IconCheck,
  IconCoin,
  IconFlame,
  IconImage,
  IconScale,
  IconShare,
  IconShield,
  IconSpark,
  IconTarget,
  Sign,
} from './icons';
import { useNav, type Route } from './nav';
import type { BadgeDef } from './rewards';
import { share } from './share';
import { shareCard } from './shareImage';
import { ACTIVE_SPONSORS, SPONSOR_CONTACT } from './sponsors';
import { getComebackInfo, getTokens, isCleanMode, redeemComeback } from './storage';

export function usePrefsTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((x) => x + 1);
    window.addEventListener('nehodovka:prefs', h);
    return () => window.removeEventListener('nehodovka:prefs', h);
  }, []);
  return tick;
}

export function AppBar({ back, title }: { back?: Route; title?: string }) {
  const { lang, setLang } = useLang();
  const go = useNav();
  return (
    <header className="appbar">
      {back ? (
        <button className="lang-mini" onClick={() => go(back)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 16, height: 16, display: 'flex' }}><IconBack /></span>
          {title}
        </button>
      ) : (
        <div className="wordmark">
          <Sign className="sign" />
          <span>NEHODO<b>VKA</b></span>
        </div>
      )}
      <button className="lang-mini" onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')} aria-label="language">
        {lang === 'cs' ? 'EN' : 'CZ'}
      </button>
    </header>
  );
}

export function CardView({ card, footer }: { card: Card; footer?: ReactNode }) {
  const { t } = useT();
  usePrefsTick();
  const clean = isCleanMode();
  const text = clean ? `${card.big} ${card.text}\n\n${card.lesson}` : `${card.big} ${card.text}\n\n${card.punch}`;
  return (
    <article className={`card ${card.variant ?? 'black'}`}>
      <div className="card-tag">{card.tag}</div>
      <div className={`card-big ${card.big.length > 11 ? 'xlong' : card.big.length > 7 ? 'long' : ''}`}><CountUp text={card.big} /></div>
      <p className="card-text">{card.text}</p>
      {!clean && <p className="card-punch">{card.punch}</p>}
      <div className="card-lesson">
        <b>{t({ cs: 'Poučení:', en: 'Lesson:' })}</b> {card.lesson}
      </div>
      <div className="card-foot">
        <div className="card-brand">NEHODOVKA</div>
        <div className="card-actions">
          <button onClick={() => shareCard(card, t({ cs: 'data: Policie ČR', en: 'data: Czech Police' }), text)} aria-label={t({ cs: 'Sdílet obrázek', en: 'Share image' })}>
            <IconImage />
          </button>
          <button onClick={() => share(text)} aria-label={t({ cs: 'Sdílet text', en: 'Share text' })}>
            <IconShare />
          </button>
        </div>
      </div>
      {footer}
    </article>
  );
}

export function DateBadge() {
  const { lang } = useLang();
  const d = new Date();
  const month = new Intl.DateTimeFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { month: 'short' }).format(d).replace('.', '');
  return (
    <div className="datebadge" aria-hidden="true">
      <small>{month}</small>
      <b>{d.getDate()}</b>
    </div>
  );
}

export function BadgeIcon({ name }: { name: BadgeDef['icon'] }) {
  switch (name) {
    case 'check': return <IconCheck />;
    case 'target': return <IconTarget />;
    case 'flame': return <IconFlame />;
    case 'shield': return <IconShield />;
    case 'scale': return <IconScale />;
    case 'award': return <IconAward />;
  }
}

export function ComebackBanner() {
  const { t } = useT();
  const go = useNav();
  usePrefsTick();
  const info = getComebackInfo();
  const tokens = getTokens();
  if (!info) return null;
  return (
    <section className="comeback-banner">
      <div className="comeback-head">
        <span className="comeback-icon"><IconShield /></span>
        <div>
          <b>{t({ cs: `Návrat · série ${info.priorStreak} dní čeká`, en: `Comeback · ${info.priorStreak}-day streak paused` })}</b>
          <div className="muted small">
            {t({
              cs: `Chyběl jsi ${info.missedDays} ${info.missedDays === 1 ? 'den' : 'dny'}. Dej dnes kvíz (6+/10) nebo použij 2 žetony.`,
              en: `You missed ${info.missedDays} ${info.missedDays === 1 ? 'day' : 'days'}. Score 6+/10 today or spend 2 tokens to restore.`,
            })}
          </div>
        </div>
      </div>
      <div className="comeback-actions">
        <button className="btn primary" onClick={() => go('games/daily')}>
          {t({ cs: 'Hrát návratový kvíz', en: 'Play comeback quiz' })}
        </button>
        {tokens >= 2 && (
          <button className="btn" onClick={() => redeemComeback()}>
            <span className="btn-icon"><IconCoin /></span>
            {t({ cs: 'Obnovit za 2 žetony', en: 'Restore (2 tokens)' })}
          </button>
        )}
      </div>
    </section>
  );
}

export function SponsorSlot({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  const go = useNav();
  const sponsor = ACTIVE_SPONSORS[0];
  if (sponsor) {
    return (
      <a className="sponsor-card" href={sponsor.url} target="_blank" rel="noopener noreferrer">
        <span className="sponsor-icon"><IconSpark /></span>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">{t({ cs: 'Partner prevence', en: 'Prevention partner' })}</div>
          <b>{sponsor.name}</b>
          {!compact && <div className="muted small">{t(sponsor.tagline)}</div>}
        </div>
      </a>
    );
  }
  if (compact) {
    return (
      <button className="sponsor-card" onClick={() => go('info')}>
        <span className="sponsor-icon"><IconSpark /></span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="eyebrow">{t({ cs: 'Partnerství', en: 'Sponsorship' })}</div>
          <b>{t({ cs: 'Prostor pro partnera bezpečnosti silnic', en: 'Open slot for a road-safety partner' })}</b>
          <div className="muted small">{t({ cs: 'Bez trackerů a reklam třetích stran · Zjistit víc →', en: 'Zero trackers or third-party ads · Learn more →' })}</div>
        </div>
      </button>
    );
  }
  return (
    <div className="sponsor-card">
      <span className="sponsor-icon"><IconSpark /></span>
      <div style={{ flex: 1 }}>
        <div className="eyebrow">{t({ cs: 'Podpořte projekt', en: 'Sponsor Nehodovka' })}</div>
        <b>{t({ cs: 'Staňte se partnerem prevence', en: 'Become a prevention partner' })}</b>
        <div className="muted small">
          {t({
            cs: 'Transparentní podpora pro školy, kraje nebo celostátní osvětu.',
            en: 'Transparent support for schools, regions, or national road-safety.',
          })}
        </div>
        <a
          className="btn primary"
          style={{ marginTop: 10, marginBottom: 0 }}
          href={`mailto:${SPONSOR_CONTACT.email}?subject=${encodeURIComponent(SPONSOR_CONTACT.subject)}`}
        >
          {SPONSOR_CONTACT.email}
        </a>
      </div>
    </div>
  );
}
