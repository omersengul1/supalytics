// Sayı, zaman ve etiket biçimleyiciler — dile göre (i18n.ts) davranır.

import { lang, T } from './i18n';

function oneDecimal(n: number): string {
  const s = n.toFixed(1).replace('.', T.decimalSep);
  return s.endsWith(`${T.decimalSep}0`) ? s.slice(0, -2) : s;
}

/** TR: 1234 → "1,2B" · EN: 1234 → "1.2K"; milyon her iki dilde M. */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + oneDecimal(abs / 1_000_000) + 'M';
  if (abs >= 1_000) return sign + oneDecimal(abs / 1_000) + T.thousandSuffix;
  return sign + String(Math.round(abs));
}

/** ISO zamandan "az önce" / "5 dk önce" … (ya da EN karşılıkları). */
export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return T.never;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return T.never;
  const sec = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (sec < 60) return T.justNow;
  const min = Math.floor(sec / 60);
  if (min < 60) return T.minAgo(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return T.hrAgo(hr);
  return T.dayAgo(Math.floor(hr / 24));
}

/** Bir önceki değere göre yüzde değişim; önceki 0 ise null. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** "2026-07-12" → "12 Tem" / "Jul 12" (grafik ekseni için). */
export function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  const month = T.months[d.getMonth()];
  return lang === 'tr' ? `${d.getDate()} ${month}` : `${month} ${d.getDate()}`;
}

export function actionLabel(action: string): string {
  return T.actions[action] ?? action.replaceAll('_', ' ');
}

export function deviceLabel(device: string): string {
  if (device === 'Other') return T.deviceOther;
  if (device === 'Unknown') return T.deviceUnknown;
  return device;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  github: 'GitHub',
  gitlab: 'GitLab',
  facebook: 'Facebook',
  twitter: 'Twitter',
  discord: 'Discord',
  azure: 'Azure',
};

export function providerLabel(provider: string): string {
  if (provider === 'email') return T.providerEmail;
  if (provider === 'phone') return T.providerPhone;
  if (provider === 'anonymous') return T.providerAnon;
  return PROVIDER_LABELS[provider] ?? provider;
}

/** Kullanıcı satırındaki kısa sağlayıcı glifleri: ✉ G  ⌥ … */
const PROVIDER_GLYPHS: Record<string, string> = {
  email: '✉',
  phone: '☏',
  google: 'G',
  apple: '',
  github: '⌥',
  gitlab: '🦊',
  discord: 'D',
  anonymous: '?',
};

export function providerGlyph(provider: string): string {
  return PROVIDER_GLYPHS[provider] ?? provider.charAt(0).toUpperCase();
}
