// Demo modunun deterministik sahte verisi. Ağ yok, rastgelelik seed'li:
// aynı gün içinde her render aynı sayıları üretir.

import type {
  ActivityRow,
  DeviceSlice,
  ProviderSlice,
  SeriesPoint,
  Totals,
  UserEvent,
  UserRow,
} from './types';

const BASE_SEED = 0x50a17;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Gün ortasına sabitlenmiş "şimdi": gün boyunca deterministik.
function anchorNow(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function series(days: number, base: number, growth: number, seedSalt: number): SeriesPoint[] {
  const rnd = mulberry32(BASE_SEED + seedSalt);
  const now = anchorNow();
  const points: SeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - i));
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const trend = base * Math.pow(growth, i);
    const noise = 0.88 + rnd() * 0.24;
    const value = trend * noise * (weekend ? 0.72 : 1);
    points.push({ day: isoDay(date), users: Math.max(0, Math.round(value)) });
  }
  return points;
}

export function mockDauSeries(days: number): SeriesPoint[] {
  return series(days, 380, 1.004, 11);
}

export function mockSignupSeries(days: number): SeriesPoint[] {
  return series(days, 24, 1.006, 23);
}

export function mockTotals(): Totals {
  const dau30 = mockDauSeries(30);
  const signup30 = mockSignupSeries(30);
  const dau = dau30[dau30.length - 1].users;
  const newToday = signup30[signup30.length - 1].users;
  const newWeek = signup30.slice(-7).reduce((sum, p) => sum + p.users, 0);
  return {
    total_users: 12483,
    new_today: newToday,
    new_week: newWeek,
    dau,
    wau: Math.round(dau * 2.9),
    mau: Math.round(dau * 6.4),
  };
}

export function mockProviders(): ProviderSlice[] {
  const total = mockTotals().total_users;
  return [
    { provider: 'email', users: Math.round(total * 0.57) },
    { provider: 'google', users: Math.round(total * 0.31) },
    { provider: 'apple', users: Math.round(total * 0.09) },
    { provider: 'github', users: Math.round(total * 0.03) },
  ];
}

export function mockDevices(days: number): DeviceSlice[] {
  const sessions = mockDauSeries(days).reduce((sum, p) => sum + p.users, 0);
  return [
    { device: 'iOS', sessions: Math.round(sessions * 0.46) },
    { device: 'Android', sessions: Math.round(sessions * 0.38) },
    { device: 'macOS', sessions: Math.round(sessions * 0.09) },
    { device: 'Windows', sessions: Math.round(sessions * 0.05) },
    { device: 'Other', sessions: Math.round(sessions * 0.02) },
  ];
}

const FIRST = [
  'ayse', 'mehmet', 'zeynep', 'emre', 'elif', 'can', 'deniz', 'selin', 'burak', 'merve',
  'kerem', 'ece', 'mert', 'irem', 'ozan', 'defne', 'arda', 'naz', 'cem', 'yasemin',
  'baran', 'ipek', 'onur', 'sude', 'tolga', 'melis', 'kaan', 'aylin', 'umut', 'derin',
];
const LAST = [
  'yilmaz', 'kaya', 'demir', 'celik', 'sahin', 'ozturk', 'arslan', 'dogan', 'kilic', 'aydin',
  'koc', 'kurt', 'aksoy', 'polat', 'erdem', 'gunes', 'tekin', 'yildiz', 'acar', 'bulut',
];
const DOMAINS = ['gmail.com', 'hotmail.com', 'icloud.com', 'outlook.com', 'yandex.com'];
const PROVIDER_SETS: string[][] = [
  ['email'], ['email'], ['google'], ['google'], ['email', 'google'], ['apple'], ['email'], ['github'],
];
const DEVICES = ['iOS', 'iOS', 'Android', 'Android', 'iOS', 'macOS', 'Windows', 'Android'];

interface MockUser extends UserRow {
  device: string;
}

let userCache: MockUser[] | null = null;

function allUsers(): MockUser[] {
  if (userCache) return userCache;
  const rnd = mulberry32(BASE_SEED + 77);
  const now = anchorNow().getTime();
  const users: MockUser[] = [];
  for (let i = 0; i < 57; i++) {
    const first = FIRST[Math.floor(rnd() * FIRST.length)];
    const last = LAST[Math.floor(rnd() * LAST.length)];
    const domain = DOMAINS[Math.floor(rnd() * DOMAINS.length)];
    const email = `${first}.${last}${i % 9 === 0 ? String(Math.floor(rnd() * 90) + 10) : ''}@${domain}`;
    const createdDaysAgo = Math.floor(rnd() * 180) + 1;
    // Kabaca üçte biri son 24 saatte aktif, birkaçı hiç girmemiş.
    const bucket = rnd();
    let lastSignIn: string | null;
    if (bucket < 0.34) {
      lastSignIn = new Date(now - Math.floor(rnd() * 23 + 1) * 3600_000).toISOString();
    } else if (bucket < 0.92) {
      lastSignIn = new Date(now - Math.floor(rnd() * createdDaysAgo * 0.8 + 1) * 86400_000).toISOString();
    } else {
      lastSignIn = null;
    }
    users.push({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      email,
      providers: PROVIDER_SETS[Math.floor(rnd() * PROVIDER_SETS.length)],
      created_at: new Date(now - createdDaysAgo * 86400_000).toISOString(),
      last_sign_in_at: lastSignIn,
      device: DEVICES[Math.floor(rnd() * DEVICES.length)],
    });
  }
  users.sort((a, b) => {
    if (!a.last_sign_in_at) return 1;
    if (!b.last_sign_in_at) return -1;
    return b.last_sign_in_at.localeCompare(a.last_sign_in_at);
  });
  userCache = users;
  return users;
}

export function mockUsers(q: string): UserRow[] {
  const query = q.trim().toLowerCase();
  return allUsers()
    .filter((u) => !query || (u.email ?? '').includes(query))
    .map(({ device: _device, ...row }) => row);
}

const ACTIVITY_ACTIONS = [
  'login', 'login', 'login', 'token_refreshed', 'token_refreshed', 'logout', 'user_signedup', 'login',
];

export function mockActivity(maxEvents: number): ActivityRow[] {
  const rnd = mulberry32(BASE_SEED + 131);
  const users = allUsers();
  const now = anchorNow().getTime();
  const rows: ActivityRow[] = [];
  let minutesBack = 2;
  for (let i = 0; i < maxEvents; i++) {
    const user = users[Math.floor(rnd() * users.length)];
    rows.push({
      email: user.email,
      action: ACTIVITY_ACTIONS[Math.floor(rnd() * ACTIVITY_ACTIONS.length)],
      device: user.device,
      created_at: new Date(now - minutesBack * 60_000).toISOString(),
    });
    minutesBack += Math.floor(rnd() * 14) + 2;
  }
  return rows;
}

export function mockUserDetail(uid: string, maxEvents: number): UserEvent[] {
  const users = allUsers();
  const user = users.find((u) => u.id === uid) ?? users[0];
  const rnd = mulberry32(BASE_SEED + 211 + users.indexOf(user));
  const rows: UserEvent[] = [];
  let cursor = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : anchorNow().getTime();
  const created = new Date(user.created_at).getTime();
  for (let i = 0; i < maxEvents && cursor > created; i++) {
    rows.push({
      action: ACTIVITY_ACTIONS[Math.floor(rnd() * ACTIVITY_ACTIONS.length)],
      ip: `78.163.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}`,
      device: user.device,
      created_at: new Date(cursor).toISOString(),
    });
    cursor -= Math.floor(rnd() * 30 + 4) * 3600_000;
  }
  rows.push({ action: 'user_signedup', ip: null, device: user.device, created_at: user.created_at });
  return rows.slice(0, maxEvents);
}
