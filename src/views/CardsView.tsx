import { useEffect, useMemo, useRef, useState } from 'react';
import { loadDays, type DayRow, type Meta, type Stats } from '../data';
import { useT } from '../i18n';
import { buildCards, CATS, type CardCat } from '../cards';
import { CardView } from '../components';
import { IconShuffle } from '../icons';
import { useNav } from '../nav';

export default function CardsView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const T = useT();
  const { t } = T;
  const go = useNav();
  const [days, setDays] = useState<Record<string, DayRow> | null>(null);
  const [cat, setCat] = useState<CardCat | 'all'>('all');
  const [order, setOrder] = useState<number[] | null>(null);
  const [active, setActive] = useState(0);
  const feed = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadDays().then(setDays).catch(() => setDays({}));
  }, []);
  const all = useMemo(() => (days ? buildCards(stats.all.national, meta, days, T, new Date(), stats.all.regions) : []), [days, stats, meta, T.lang]);
  const cards = useMemo(() => {
    const list = all.filter((c) => cat === 'all' || c.cat === cat);
    return order ? order.filter((i) => i < list.length).map((i) => list[i]) : list;
  }, [all, cat, order]);

  // which card is on screen
  useEffect(() => {
    const root = document.querySelector('main');
    if (!feed.current || !root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { root, threshold: 0.55 },
    );
    feed.current.querySelectorAll('.slide').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cards]);

  const pickCat = (c: CardCat | 'all') => {
    setCat(c);
    setOrder(null);
    document.querySelector('main')?.scrollTo({ top: 0 });
  };
  const shuffle = () => {
    const idx = cards.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    setOrder(idx);
    document.querySelector('main')?.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="feed-head">
        <div className="top">
          <div className="eyebrow">{t({ cs: 'Černé karty', en: 'Black cards' })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="count">{cards.length ? `${active + 1} / ${cards.length}` : ''}</span>
            <button className="lang-mini" onClick={shuffle} style={{ display: 'flex', gap: 5, alignItems: 'center' }} aria-label="shuffle">
              <span style={{ width: 14, height: 14, display: 'flex' }}><IconShuffle /></span>
              {t({ cs: 'Zamíchat', en: 'Shuffle' })}
            </button>
          </div>
        </div>
        <div className="chips">
          {CATS.map((c) => (
            <button key={c.id} className={`chip small ${cat === c.id ? 'on' : ''}`} onClick={() => pickCat(c.id)}>
              {t(c)}
            </button>
          ))}
        </div>
      </div>
      <div ref={feed}>
        {cards.map((c, i) => (
          <section className="slide" key={c.id} data-i={i}>
            <CardView card={c} />
            {i === 0 && <div className="swipe-hint">↓ {t({ cs: 'swipni pro další', en: 'swipe for more' })}</div>}
          </section>
        ))}
        {cards.length > 0 && (
          <section className="slide feed-end">
            <div className="big-emoji">🪦</div>
            <h2>{t({ cs: 'Dorazil jsi na konec.', en: 'You made it to the end.' })}</h2>
            <p className="muted">{t({ cs: 'Na rozdíl od některých v těchhle číslech. Prověř se v kvízu.', en: 'Unlike some people in these numbers. Test yourself in the quiz.' })}</p>
            <button className="btn primary big" onClick={() => go('games/daily')}>{t({ cs: '📅 Denní kvíz', en: '📅 Daily quiz' })}</button>
            <button className="btn big" onClick={shuffle}>{t({ cs: '🔀 Znovu, zamíchané', en: '🔀 Again, shuffled' })}</button>
            <p className="muted small">{t({ cs: 'Karty se přepočítávají z nových dat Policie ČR každý týden.', en: 'Cards are recalculated from new police data every week.' })}</p>
          </section>
        )}
      </div>
    </>
  );
}
