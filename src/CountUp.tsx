import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n';

/**
 * Animates the leading number of a formatted string ("72 427", "10,6×", "84,1 %") from 0 when it scrolls into view.
 * Strings that are not "number + suffix" are shown as-is.
 */
export default function CountUp({ text, duration = 900 }: { text: string; duration?: number }) {
  const { lang } = useLang();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  useEffect(() => {
    const parsed = parse(text, lang);
    if (!parsed || !ref.current) {
      setShown(text);
      return;
    }
    const fmt = new Intl.NumberFormat(lang === 'cs' ? 'cs-CZ' : 'en-GB', { minimumFractionDigits: parsed.decimals, maximumFractionDigits: parsed.decimals });
    setShown(fmt.format(0) + parsed.suffix);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setShown(p === 1 ? text : fmt.format(parsed.value * eased) + parsed.suffix);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, lang, duration]);
  return <span ref={ref}>{shown}</span>;
}

function parse(text: string, lang: string) {
  const thousands = lang === 'cs' ? '[\\s\\u00a0\\u202f]' : ',';
  const dec = lang === 'cs' ? ',' : '\\.';
  const m = new RegExp(`^(\\d{1,3}(?:${thousands}\\d{3})*|\\d+)(?:${dec}(\\d+))?(.*)$`).exec(text);
  if (!m) return null;
  const suffix = m[3];
  if (/\d/.test(suffix) || suffix.startsWith('.') || suffix.startsWith(':')) return null;
  const int = Number(m[1].replace(/[^\d]/g, ''));
  const decimals = m[2]?.length ?? 0;
  const value = int + (decimals ? Number(m[2]) / 10 ** decimals : 0);
  return { value, decimals, suffix };
}
