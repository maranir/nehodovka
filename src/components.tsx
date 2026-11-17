import type { ReactNode } from 'react';
import type { Card } from './cards';
import CountUp from './CountUp';
import { useLang, useT } from './i18n';
import { IconBack, IconImage, IconShare, Sign } from './icons';
import { useNav, type Route } from './nav';
import { share } from './share';
import { shareCard } from './shareImage';

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
  const text = `${card.big} ${card.text}\n\n${card.punch}`;
  return (
    <article className={`card ${card.variant ?? 'black'}`}>
      <div className="card-tag">{card.tag}</div>
      <div className={`card-big ${card.big.length > 11 ? 'xlong' : card.big.length > 7 ? 'long' : ''}`}><CountUp text={card.big} /></div>
      <p className="card-text">{card.text}</p>
      <p className="card-punch">{card.punch}</p>
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
