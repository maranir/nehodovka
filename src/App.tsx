import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { loadMeta, loadStats, type Meta, type Stats } from './data';
import { useT } from './i18n';
import { NavCtx, type Route } from './nav';
import { dailyDone } from './storage';
import { IconAlert, IconCards, IconGames, IconInfo, IconMap, IconToday } from './icons';
import TodayView from './views/TodayView';
import CardsView from './views/CardsView';
import GamesView from './views/GamesView';
import QuizView from './views/QuizView';
import HiLoView from './views/HiLoView';
import ProfileView from './views/ProfileView';
import AboutView from './views/AboutView';
import EduView from './views/EduView';

const MapView = lazy(() => import('./views/MapView'));

const ROUTES: Route[] = ['today', 'cards', 'map', 'map/spots', 'games', 'games/quiz', 'games/daily', 'games/hilo', 'games/profile', 'info', 'edu'];
const fromHash = (): Route => {
  const h = location.hash.slice(1) as Route;
  return ROUTES.includes(h) ? h : 'today';
};

export default function App() {
  const { t } = useT();
  const [route, setRoute] = useState<Route>(fromHash);
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
    const onHash = () => setRoute(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (r: Route) => {
    if (r !== route) location.hash = r; // pushes history, so the phone's back button works
    document.querySelector('main')?.scrollTo(0, 0);
  };

  const section = route.split('/')[0];
  const tabs: [string, Route, ReactNode, string][] = [
    ['today', 'today', <IconToday />, t({ cs: 'Dnes', en: 'Today' })],
    ['cards', 'cards', <IconCards />, t({ cs: 'Karty', en: 'Cards' })],
    ['map', 'map', <IconMap />, t({ cs: 'Mapa', en: 'Map' })],
    ['games', 'games', <IconGames />, t({ cs: 'Hry', en: 'Games' })],
    ['info', 'info', <IconInfo />, t({ cs: 'Info', en: 'Info' })],
  ];

  const ready = meta && stats;
  let view: ReactNode = null;
  if (ready) {
    switch (route) {
      case 'today': view = <TodayView meta={meta} stats={stats} />; break;
      case 'cards': view = <CardsView meta={meta} stats={stats} />; break;
      case 'map':
      case 'map/spots':
        view = (
          <Suspense fallback={<div className="page loading"><span className="loading-icon"><IconMap /></span></div>}>
            <MapView meta={meta} stats={stats} openSpots={route === 'map/spots'} />
          </Suspense>
        );
        break;
      case 'games': view = <GamesView meta={meta} stats={stats} />; break;
      case 'games/quiz': view = <QuizView meta={meta} stats={stats} mode="random" />; break;
      case 'games/daily': view = <QuizView meta={meta} stats={stats} mode="daily" />; break;
      case 'games/hilo': view = <HiLoView meta={meta} stats={stats} />; break;
      case 'games/profile': view = <ProfileView meta={meta} stats={stats} />; break;
      case 'info': view = <AboutView meta={meta} />; break;
      case 'edu': view = <EduView meta={meta} stats={stats} />; break;
    }
  }

  return (
    <NavCtx.Provider value={go}>
      <div className="app">
        <main className={section === 'map' ? 'full' : route === 'cards' ? 'feed-mode' : ''}>
          {error && (
            <div className="page">
              <h2>{t({ cs: 'Data se nepodařilo načíst', en: 'Could not load data' })}</h2>
              <p className="muted">{error}</p>
            </div>
          )}
          {!error && !ready && <div className="page loading"><span className="loading-icon"><IconAlert /></span>{t({ cs: 'Načítám…', en: 'Loading…' })}</div>}
          {view}
        </main>
        <nav className="tabbar">
          {tabs.map(([id, r, icon, label]) => (
            <button key={id} className={section === id ? 'on' : ''} onClick={() => go(r)}>
              {icon}
              <span>{label}</span>
              {id === 'games' && ready && dailyDone() == null && <i className="dot" />}
            </button>
          ))}
        </nav>
      </div>
    </NavCtx.Provider>
  );
}
