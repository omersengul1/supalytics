// Ekranların tek veri kapısı: demo modda mock, gerçek modda RPC.
// Ekranlar farkı bilmez; hatalar Error olarak fırlar, ekranlar inline gösterir.

import {
  mockActivity,
  mockDauSeries,
  mockDevices,
  mockProviders,
  mockSignupSeries,
  mockTotals,
  mockUserDetail,
  mockUsers,
} from './mock';
import { getClient } from './supabase';
import type {
  ActivityRow,
  DeviceSlice,
  ProviderSlice,
  SeriesPoint,
  Totals,
  UserEvent,
  UserRow,
} from './types';

let demoMode = true;

export function configureApi(opts: { demoMode: boolean }): void {
  demoMode = opts.demoMode;
}

// Demo modda küçük bir gecikme: yenileme akışları gerçekçi kalsın.
function demo<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 220));
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await getClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function fetchTotals(): Promise<Totals> {
  if (demoMode) return demo(mockTotals());
  const rows = await rpc<Totals[]>('supalytics_totals');
  if (!rows?.length) throw new Error('supalytics_totals boş döndü.');
  return rows[0];
}

export function fetchDauSeries(days: number): Promise<SeriesPoint[]> {
  if (demoMode) return demo(mockDauSeries(days));
  return rpc<SeriesPoint[]>('supalytics_dau_series', { days });
}

export function fetchSignupSeries(days: number): Promise<SeriesPoint[]> {
  if (demoMode) return demo(mockSignupSeries(days));
  return rpc<SeriesPoint[]>('supalytics_signup_series', { days });
}

export function fetchProviders(): Promise<ProviderSlice[]> {
  if (demoMode) return demo(mockProviders());
  return rpc<ProviderSlice[]>('supalytics_provider_breakdown');
}

export function fetchDevices(days: number): Promise<DeviceSlice[]> {
  if (demoMode) return demo(mockDevices(days));
  return rpc<DeviceSlice[]>('supalytics_device_breakdown', { days });
}

export function fetchUsers(q: string): Promise<UserRow[]> {
  if (demoMode) return demo(mockUsers(q));
  return rpc<UserRow[]>('supalytics_user_list', { q, page_size: 50, page_offset: 0 });
}

export function fetchActivity(maxEvents = 50): Promise<ActivityRow[]> {
  if (demoMode) return demo(mockActivity(maxEvents));
  return rpc<ActivityRow[]>('supalytics_recent_activity', { max_events: maxEvents });
}

export function fetchUserDetail(uid: string, maxEvents = 50): Promise<UserEvent[]> {
  if (demoMode) return demo(mockUserDetail(uid, maxEvents));
  return rpc<UserEvent[]>('supalytics_user_detail', { uid, max_events: maxEvents });
}
