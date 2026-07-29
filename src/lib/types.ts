// setup.sql içindeki RPC'lerin dönüş satırı tipleri.

export interface Totals {
  total_users: number;
  new_today: number;
  new_week: number;
  dau: number;
  wau: number;
  mau: number;
}

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
  providers: string[];
  created_at: string;
  last_sign_in_at: string | null;
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
