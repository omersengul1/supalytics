// setup.sql içindeki RPC'lerin dönüş satırı tipleri.

export interface Totals {
  total_users: number;
  unconfirmed_users: number;
  new_today: number;
  new_week: number;
  new_month: number;
  new_prev_week: number;
  dau: number;
  wau: number;
  mau: number;
  logins_today: number;
  open_sessions: number;
  online_now: number;
  mfa_users: number;
}

// Eski (v1) SQL kurulumları yeni kolonları döndürmez; api katmanı eksikleri
// bu varsayılanlarla tamamlar ki kartlar NaN yerine 0 göstersin.
export const zeroTotals: Totals = {
  total_users: 0,
  unconfirmed_users: 0,
  new_today: 0,
  new_week: 0,
  new_month: 0,
  new_prev_week: 0,
  dau: 0,
  wau: 0,
  mau: 0,
  logins_today: 0,
  open_sessions: 0,
  online_now: 0,
  mfa_users: 0,
};

export interface SeriesPoint {
  day: string; // ISO tarih (YYYY-MM-DD)
  users: number;
}

export interface ProviderSlice {
  provider: string;
  users: number;
}

export interface DeviceSlice {
  device: string;
  sessions: number;
}

export interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  providers: string[];
  created_at: string;
  last_sign_in_at: string | null;
}

export interface TopUser {
  user_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  events: number;
  last_seen: string;
}

export interface UserEvent {
  action: string;
  ip: string | null;
  device: string;
  created_at: string;
}

export interface ActivityRow {
  email: string | null;
  action: string;
  device: string;
  created_at: string;
}
