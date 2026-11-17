// Tiny localStorage helpers: streaks and best scores.
const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function getNum(key: string) {
  return Number(localStorage.getItem(key) ?? 0) || 0;
}
export function setBest(key: string, value: number) {
  if (value > getNum(key)) {
    localStorage.setItem(key, String(value));
    return true;
  }
  return false;
}

/** Mark today's daily quiz as done; returns current streak. */
export function markDaily(score: number) {
  const days: Record<string, number> = JSON.parse(localStorage.getItem('daily') ?? '{}');
  days[today()] = Math.max(days[today()] ?? 0, score);
  localStorage.setItem('daily', JSON.stringify(days));
  return dailyStreak();
}
export function dailyDone(): number | null {
  const days: Record<string, number> = JSON.parse(localStorage.getItem('daily') ?? '{}');
  return days[today()] ?? null;
}
export function dailyStreak() {
  const days: Record<string, number> = JSON.parse(localStorage.getItem('daily') ?? '{}');
  let streak = 0;
  const d = new Date();
  if (days[today(d)] == null) d.setDate(d.getDate() - 1); // streak still alive until midnight
  while (days[today(d)] != null) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
