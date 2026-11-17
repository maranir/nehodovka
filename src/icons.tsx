// Minimal line icons (24×24, currentColor).
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const IconToday = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 3 2.5 19.5h19L12 3Z" /><path d="M12 9.5v4.5M12 17h.01" /></svg>
);
export const IconCards = () => (
  <svg viewBox="0 0 24 24" {...P}><rect x="7" y="3" width="13" height="17" rx="2.5" /><path d="M4 7.5v11A2.5 2.5 0 0 0 6.5 21H15" /></svg>
);
export const IconMap = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4Z" /><path d="M9 4v13.5M15 6.5V20" /></svg>
);
export const IconGames = () => (
  <svg viewBox="0 0 24 24" {...P}><rect x="2.5" y="7" width="19" height="11" rx="5" /><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></svg>
);
export const IconInfo = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5h.01" /></svg>
);
export const IconShare = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
);
export const IconImage = () => (
  <svg viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
);
export const IconShuffle = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
);
export const IconBack = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M15 18l-6-6 6-6" /></svg>
);
export const Sign = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
    <path d="M256 40 L482 432 H30 Z" fill="#ffd400" stroke="#0b0b0b" strokeWidth="14" strokeLinejoin="round" />
    <path d="M256 104 L428 404 H84 Z" fill="none" stroke="#e10600" strokeWidth="30" strokeLinejoin="round" />
    <circle cx="256" cy="282" r="62" fill="#0b0b0b" />
    <circle cx="234" cy="276" r="14" fill="#ffd400" />
    <circle cx="278" cy="276" r="14" fill="#ffd400" />
  </svg>
);
