// Sayı, zaman ve etiket biçimleyiciler (TR).

function oneDecimal(n: number): string {
  const s = n.toFixed(1).replace('.', ',');
  return s.endsWith(',0') ? s.slice(0, -2) : s;
}

/** 1234 → "1,2B" · 3400000 → "3,4M" (TR kısaltmaları: B=bin, M=milyon). */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + oneDecimal(abs / 1_000_000) + 'M';
  if (abs >= 1_000) return sign + oneDecimal(abs / 1_000) + 'B';
  return sign + String(Math.round(abs));
}

/** ISO zamandan "az önce" / "5 dk önce" / "3 sa önce" / "2 gün önce". */
export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'hiç';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'hiç';
  const sec = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (sec < 60) return 'az önce';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce`;
}

/** Bir önceki değere göre yüzde değişim; önceki 0 ise null. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** "2026-07-12" → "12 Tem" (grafik ekseni için). */
export function shortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

const ACTION_LABELS: Record<string, string> = {
  login: 'giriş yaptı',
  logout: 'çıkış yaptı',
  user_signedup: 'kaydoldu',
  user_repeated_signup: 'tekrar kayıt denedi',
  token_refreshed: 'oturumu yenilendi',
  token_revoked: 'oturumu kapatıldı',
  user_recovery_requested: 'şifre sıfırlama istedi',
  user_confirmation_requested: 'doğrulama istedi',
  user_modified: 'profilini güncelledi',
  user_updated_password: 'şifresini değiştirdi',
  user_deleted: 'hesabı silindi',
  user_invited: 'davet edildi',
  invite_accepted: 'daveti kabul etti',
  mfa_challenge_verified: 'MFA doğruladı',
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replaceAll('_', ' ');
}

const DEVICE_LABELS: Record<string, string> = {
  iOS: 'iOS',
  Android: 'Android',
  macOS: 'macOS',
  Windows: 'Windows',
  Linux: 'Linux',
  Other: 'Diğer',
  Unknown: 'Bilinmiyor',
};

export function deviceLabel(device: string): string {
  return DEVICE_LABELS[device] ?? device;
}

const PROVIDER_LABELS: Record<string, string> = {
  email: 'E-posta',
  phone: 'Telefon',
  google: 'Google',
  apple: 'Apple',
  github: 'GitHub',
  gitlab: 'GitLab',
  facebook: 'Facebook',
  twitter: 'Twitter',
  discord: 'Discord',
  azure: 'Azure',
  anonymous: 'Anonim',
};

export function providerLabel(provider: string): string {
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
