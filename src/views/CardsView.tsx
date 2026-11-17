import { useEffect, useMemo, useState } from 'react';
import { loadDays, type DayRow, type Meta, type Stats } from '../data';
import { useT } from '../i18n';
import { buildCards } from '../cards';
import { share } from '../share';

export default function CardsView({ meta, stats }: { meta: Meta; stats: Stats }) {
  const T = useT();
  const { t } = T;
  const [days, setDays] = useState<Record<string, DayRow> | null>(null);
  useEffect(() => {
    loadDays().then(setDays).catch(() => setDays({}));
  }, []);
  const cards = useMemo(() => (days ? buildCards(stats.all.national, meta, days, T) : []), [days, stats, meta, T.lang]);

  return (
    <div className="page cards-page">
      <div className="eyebrow">{t({ cs: 'Černé karty', en: 'Black cards' })}</div>
      <h1>{t({ cs: 'Fakta, ze kterých mrazí. Vtipy, ze kterých taky.', en: 'Facts that chill you. Jokes that do too.' })}</h1>
      <p className="muted small">
        {t({
          cs: 'Vtipy míří na chování, nikdy na oběti. Za každým číslem je člověk.',
          en: 'The jokes target behaviour, never victims. Behind every number is a person.',
        })}
      </p>
      <div className="deck">
        {cards.map((c) => (
          <article key={c.id} className="card">
            <div className="card-tag">{c.tag}</div>
            <div className="card-big">{c.big}</div>
            <p className="card-text">{c.text}</p>
            <p className="card-punch">{c.punch}</p>
            <div className="card-lesson">
              <b>{t({ cs: 'Poučení:', en: 'Lesson:' })}</b> {c.lesson}
            </div>
            <button className="share-btn" onClick={() => share(`${c.big} ${c.text}\n\n${c.punch}`)} aria-label="share">
              📤
            </button>
            <div className="card-brand">Nehodovka</div>
          </article>
        ))}
      </div>
    </div>
  );
}
