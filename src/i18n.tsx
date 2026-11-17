import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'cs' | 'en';

const initial = (): Lang => {
  const saved = localStorage.getItem('lang');
  if (saved === 'cs' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('cs') || navigator.language?.toLowerCase().startsWith('sk') ? 'cs' : 'en';
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'cs', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Bilingual string helper: t({cs, en}) */
export type L = { cs: string; en: string };
/** Formatting + translation helpers for a language (usable outside React too). */
export function makeT(lang: Lang) {
  const loc = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const nf = new Intl.NumberFormat(loc);
  const pf = new Intl.NumberFormat(loc, { maximumFractionDigits: 1 });
  const df = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  const dmf = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long' });
  const toDate = (iso: string | Date) => (typeof iso === 'string' ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')) : iso);
  return {
    lang,
    t: (s: L) => s[lang],
    n: (x: number) => nf.format(Math.round(x)),
    p: (x: number) => pf.format(x),
    pct: (part: number, whole: number) => pf.format(whole ? (100 * part) / whole : 0) + ' %',
    date: (iso: string | Date) => df.format(toDate(iso)),
    dayMonth: (iso: string | Date) => dmf.format(toDate(iso)),
  };
}
export function useT() {
  return makeT(useLang().lang);
}
export type T = ReturnType<typeof useT>;
