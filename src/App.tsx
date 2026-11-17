import { lazy, Suspense, useEffect, useState } from 'react';
import { loadMeta, loadStats, type Meta, type Stats } from './data';
import { useT } from './i18n';
import QuizView from './views/QuizView';
import CardsView from './views/CardsView';
import AboutView from './views/AboutView';

const MapView = lazy(() => import('./views/MapView'));

type Tab = 'cards' | 'map' | 'quiz' | 'about';

export default function App() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || 'cards');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadMeta(), loadStats()])
      .then(([m, s]) => {
        setMeta(m);
        setStats(s);
      })
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
  }, [tab]);

  const tabs: [Tab, string, string][] = [
    ['cards', '🃏', t({ cs: 'Karty', en: 'Cards' })],
    ['map', '🗺️', t({ cs: 'Mapa', en: 'Map' })],
    ['quiz', '❓', t({ cs: 'Kvíz', en: 'Quiz' })],
    ['about', 'ℹ️', t({ cs: 'Info', en: 'Info' })],
  ];

  return (
    <div className="app">
      <main className={tab === 'map' ? 'full' : ''}>
        {error && <div className="page"><h2>{t({ cs: 'Data se nepodařilo načíst', en: 'Could not load data' })}</h2><p className="muted">{error}</p></div>}
        {!error && (!meta || !stats) && <div className="page loading">🚧 {t({ cs: 'Načítám…', en: 'Loading…' })}</div>}
        {meta && stats && (
          <>
            {tab === 'cards' && <CardsView meta={meta} stats={stats} />}
            {tab === 'map' && (
              <Suspense fallback={<div className="page loading">🗺️</div>}>
                <MapView meta={meta} stats={stats} />
              </Suspense>
            )}
            {tab === 'quiz' && <QuizView meta={meta} stats={stats} />}
            {tab === 'about' && <AboutView meta={meta} />}
          </>
        )}
      </main>
      <nav className="tabbar">
        {tabs.map(([id, icon, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span className="icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
