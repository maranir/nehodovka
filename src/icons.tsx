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
export const IconTarget = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
);
export const IconScale = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 3v18M5 7h14M5 7l-2.5 6h5L5 7ZM19 7l-2.5 6h5L19 7ZM8 21h8" /></svg>
);
export const IconFlame = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 3c1.5 3.5 5 5.5 5 10a5 5 0 1 1-10 0c0-2.5 1.2-4.5 2.5-6 .5 1.8 1.5 2.5 2.5 2.5-.5-2 0-4.5 0-6.5Z" /></svg>
);
export const IconAlert = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></svg>
);
export const IconCrosshair = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
);
export const IconLocate = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></svg>
);
export const IconCheck = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></svg>
);
export const IconTrophy = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></svg>
);
export const IconRefresh = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
);
export const IconCalendar = () => (
  <svg viewBox="0 0 24 24" {...P}><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M8 2v4M16 2v4M3 9h18" /></svg>
);
export const IconSun = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
);
export const IconSunrise = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M12 4v4M4.93 10.93l1.41 1.41M19.07 10.93l-1.41 1.41M3 18h18M7 18a5 5 0 0 1 10 0" /></svg>
);
export const IconSunset = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 7v3M6 12l1.5 1.5M18 12l-1.5 1.5" /></svg>
);
export const IconMoon = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
);
export const IconCar = () => (
  <svg viewBox="0 0 24 24" {...P}><path d="M5 11l2-5h10l2 5M3 11h18v6H3v-6ZM6.5 17v2M17.5 17v2M6.5 14h.01M17.5 14h.01" /></svg>
);
export const IconBike = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M12 16.5V11l-3-2M12 11h4.5l2 5.5M5.5 16.5 9 9h4" /></svg>
);
export const IconWalk = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="13" cy="5" r="2" /><path d="M12 8l-2 5 3 2-1 6M10 13l-3 5M12 9l4 2" /></svg>
);
export const IconUser = () => (
  <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
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
