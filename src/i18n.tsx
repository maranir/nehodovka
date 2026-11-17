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
export function useT() {
  const { lang } = useLang();
  const nf = new Intl.NumberFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB');
  const pf = new Intl.NumberFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { maximumFractionDigits: 1 });
  const df = new Intl.DateTimeFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dmf = new Intl.DateTimeFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { day: 'numeric', month: 'long' });
  return {
    lang,
    t: (s: L) => s[lang],
    n: (x: number) => nf.format(Math.round(x)),
    p: (x: number) => pf.format(x),
    pct: (part: number, whole: number) => pf.format(whole ? (100 * part) / whole : 0) + ' %',
    date: (iso: string | Date) => df.format(typeof iso === 'string' ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')) : iso),
    dayMonth: (iso: string | Date) => dmf.format(typeof iso === 'string' ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')) : iso),
  };
}
export type T = ReturnType<typeof useT>;
