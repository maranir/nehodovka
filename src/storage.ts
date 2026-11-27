// localStorage helpers: streaks, comeback shields, safety tokens, badges, and classroom mode.
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const emitPrefs = () => window.dispatchEvent(new Event('nehodovka:prefs'));

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

export function isCleanMode(): boolean {
  return localStorage.getItem('cleanMode') === '1';
}
export function setCleanMode(on: boolean) {
  localStorage.setItem('cleanMode', on ? '1' : '0');
  emitPrefs();
}

export function getTokens(): number {
  return getNum('tokens');
}
export function getTotalTokens(): number {
  return getNum('totalTokens');
}
export function addTokens(amount: number) {
  if (amount <= 0) return getTokens();
  const next = getTokens() + amount;
  localStorage.setItem('tokens', String(next));
  localStorage.setItem('totalTokens', String(getTotalTokens() + amount));
  if (getTotalTokens() >= 10) unlockBadge('token_hoarder');
  emitPrefs();
  return next;
}
export function spendTokens(amount: number): boolean {
  const cur = getTokens();
  if (cur < amount) return false;
  localStorage.setItem('tokens', String(cur - amount));
  emitPrefs();
  return true;
}

export function getBadges(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem('badges') ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
export function unlockBadge(id: string): boolean {
  const cur = getBadges();
  if (cur.includes(id)) return false;
  localStorage.setItem('badges', JSON.stringify([...cur, id]));
  emitPrefs();
  return true;
}

function getDaysMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('daily') ?? '{}');
  } catch {
    return {};
  }
}

export interface ComebackInfo {
  missedDays: number;
  priorStreak: number;
}

export function getComebackInfo(): ComebackInfo | null {
  if (dailyStreak() > 0) return null;
  const days = getDaysMap();
  if (days[dayKey()] != null) return null;
  // Check if a streak of >= 2 ended 2..4 days ago (missed 1..3 calendar days)
  for (let gap = 2; gap <= 4; gap++) {
    const d = new Date();
    d.setDate(d.getDate() - gap);
    if (days[dayKey(d)] != null) {
      let len = 0;
      const cur = new Date(d);
      while (days[dayKey(cur)] != null) {
        len++;
        cur.setDate(cur.getDate() - 1);
      }
      if (len >= 2) return { missedDays: gap - 1, priorStreak: len };
      return null;
    }
  }
  return null;
}

function bridgeComebackDays(missedDays: number) {
  const days = getDaysMap();
  for (let i = 1; i <= missedDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    if (days[k] == null) days[k] = 0; // comeback shield marker
  }
  localStorage.setItem('daily', JSON.stringify(days));
}

/** Spend 2 tokens to restore a paused streak immediately. */
export function redeemComeback(): boolean {
  const info = getComebackInfo();
  if (!info || !spendTokens(2)) return false;
  bridgeComebackDays(info.missedDays);
  unlockBadge('second_chance');
  emitPrefs();
  return true;
}

/** Mark today's daily quiz as done; returns current streak + whether comeback triggered. */
export function markDaily(score: number): { streak: number; comebackUsed: boolean; tokensEarned: number } {
  const days = getDaysMap();
  const already = days[dayKey()] != null;
  const comeback = !already && score >= 6 ? getComebackInfo() : null;
  if (comeback) {
    bridgeComebackDays(comeback.missedDays);
    unlockBadge('second_chance');
  }
  days[dayKey()] = Math.max(days[dayKey()] ?? 0, score);
  localStorage.setItem('daily', JSON.stringify(days));
  const streak = dailyStreak();
  setBest('bestStreak', streak);

  let tokensEarned = 0;
  if (!already) {
    tokensEarned = score >= 8 ? 2 : 1;
    addTokens(tokensEarned);
  }
  unlockBadge('first_quiz');
  if (score >= 8) unlockBadge('sharp_eye');
  if (streak >= 7) unlockBadge('week_streak');
  emitPrefs();
  return { streak, comebackUsed: Boolean(comeback), tokensEarned };
}

export function recordRandomQuiz(score: number): number {
  unlockBadge('first_quiz');
  if (score >= 8) unlockBadge('sharp_eye');
  if (score >= 6 && localStorage.getItem('randomTokenDay') !== dayKey()) {
    localStorage.setItem('randomTokenDay', dayKey());
    addTokens(1);
    return 1;
  }
  return 0;
}

export function recordHiLo(streak: number): number {
  const isBest = setBest('hiloBest', streak);
  if (streak >= 5) {
    unlockBadge('hilo_master');
    if (isBest) {
      addTokens(1);
      return 1;
    }
  }
  return 0;
}

export function recordProfileComplete(): number {
  if (localStorage.getItem('profileToken') === '1') return 0;
  localStorage.setItem('profileToken', '1');
  addTokens(1);
  return 1;
}

export function dailyDone(): number | null {
  const days = getDaysMap();
  return days[dayKey()] ?? null;
}
export function dailyStreak() {
  const days = getDaysMap();
  let streak = 0;
  const d = new Date();
  if (days[dayKey(d)] == null) d.setDate(d.getDate() - 1); // streak still alive until midnight
  while (days[dayKey(d)] != null) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
