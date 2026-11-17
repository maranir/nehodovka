import { createContext, useContext } from 'react';

export type Route =
  | 'today' | 'cards' | 'map' | 'map/spots' | 'games' | 'games/quiz' | 'games/daily' | 'games/hilo' | 'games/profile' | 'info';

export const NavCtx = createContext<(r: Route) => void>(() => {});
export const useNav = () => useContext(NavCtx);
