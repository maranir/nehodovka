import type { L } from './i18n';

export interface Sponsor {
  id: string;
  name: string;
  tagline: L;
  url: string;
  tier: 'general' | 'schools' | 'regional';
  badge?: string;
}

/**
 * Configure active sponsors here. When empty, the app displays an open
 * partnership slot inviting road-safety, insurance, or mobility partners.
 */
export const ACTIVE_SPONSORS: Sponsor[] = [];

export const SPONSOR_CONTACT = {
  email: 'partner@nehodovka.cz',
  subject: 'Partnerství Nehodovka',
};

export const SPONSOR_TIERS: { id: string; title: L; desc: L }[] = [
  {
    id: 'general',
    title: { cs: 'Generální partner prevence', en: 'General prevention partner' },
    desc: {
      cs: 'Transparentní uvedení na úvodní obrazovce a v sekci O projektu. Bez sledování uživatelů a bez reklamních sítí.',
      en: 'Transparent credit on the home screen and About page. Zero user tracking, zero ad networks.',
    },
  },
  {
    id: 'schools',
    title: { cs: 'Partner pro školy a autoškoly', en: 'Schools & driving-school partner' },
    desc: {
      cs: 'Podpora výukového režimu pro střední školy, autoškoly a preventivní programy Policie ČR / BESIP.',
      en: 'Supports classroom mode for high schools, driving schools, and police road-safety workshops.',
    },
  },
  {
    id: 'regional',
    title: { cs: 'Krajský partner bezpečnosti', en: 'Regional safety partner' },
    desc: {
      cs: 'Podpora konkrétního kraje v mapě černých míst a lokálních statistikách.',
      en: 'Supports a specific region in the black-spot map and local crash statistics.',
    },
  },
];
