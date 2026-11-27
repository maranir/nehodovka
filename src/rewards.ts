import type { L } from './i18n';

export interface BadgeDef {
  id: string;
  icon: 'check' | 'target' | 'flame' | 'shield' | 'scale' | 'award';
  name: L;
  desc: L;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_quiz',
    icon: 'check',
    name: { cs: 'První jízda', en: 'First drive' },
    desc: { cs: 'Dokonči první kvíz', en: 'Complete your first quiz' },
  },
  {
    id: 'sharp_eye',
    icon: 'target',
    name: { cs: 'Ostrý zrak', en: 'Sharp eye' },
    desc: { cs: '8+/10 v kvízu', en: 'Score 8+/10 in a quiz' },
  },
  {
    id: 'week_streak',
    icon: 'flame',
    name: { cs: 'Týden v kuse', en: '7-day streak' },
    desc: { cs: '7denní denní série', en: '7-day daily streak' },
  },
  {
    id: 'second_chance',
    icon: 'shield',
    name: { cs: 'Druhá šance', en: 'Second chance' },
    desc: { cs: 'Obnov přerušenou sérii', en: 'Restore a paused streak' },
  },
  {
    id: 'hilo_master',
    icon: 'scale',
    name: { cs: 'Odhadce rizik', en: 'Risk reader' },
    desc: { cs: 'Série 5+ ve Víc/Míň', en: '5+ streak in Higher/Lower' },
  },
  {
    id: 'token_hoarder',
    icon: 'award',
    name: { cs: 'Znalec dat', en: 'Data steward' },
    desc: { cs: 'Nasbírej 10 žetonů', en: 'Earn 10 safety tokens' },
  },
];
