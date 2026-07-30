// Ekranların tek veri kapısı: demo modda mock, gerçek modda RPC.
// Ekranlar farkı bilmez; hatalar Error olarak fırlar, ekranlar inline gösterir.

import {
  mockActivity,
  mockDauSeries,
  mockDevices,
  mockProviders,
  mockSignupSeries,
  mockTopUsers,
  mockTotals,
  mockUserDetail,
  mockUsers,
} from './mock';
import { T } from './i18n';
import { getClient } from './supabase';
import {
  zeroTotals,
  type ActivityRow,
  type DeviceSlice,
  type ProviderSlice,
  type SeriesPoint,
  type TopUser,
  type Totals,
  type UserEvent,
  type UserRow,
} from './types';

export const USERS_PAGE_SIZE = 50;

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
  if (error) {
    // Ham PostgREST/Postgres mesajlarını yol gösteren metinlere çevir.
    if (error.code === 'PGRST202' || /could not find the function/i.test(error.message)) {
      throw new Error(T.errMissingRpc);
    }
    if (error.message === 'forbidden') throw new Error(T.errNotAdmin);
    if (error.code === '42501' || /permission denied for function/i.test(error.message)) {
      throw new Error(T.errPermissionDenied);
    }
    throw new Error(error.message);
  }
  return data as T;
}

interface WhoAmI {
  jwt_role: string | null;
  uid: string | null;
  is_admin: boolean;
}

// supalytics_whoami hem anon hem authenticated'a açık — asla "permission
// denied" ile başarısız olmaz. Asıl çağrı başarısız olduğunda bağlantının
// veritabanına gerçekte hangi rolle/kimlikle ulaştığını görmek için kullanılır.
async function whoami(): Promise<WhoAmI | null> {
  try {
    const supabase = await getClient();
    const { data } = await supabase.rpc('supalytics_whoami');
    const row = Array.isArray(data) ? data[0] : data;
    return (row as WhoAmI) ?? null;
  } catch {
    return null;
  }
}

/** Onboarding: giriş sonrası gerçek bir RPC ile admin yetkisini doğrular.
 *  demoMode bayrağından bağımsız çalışır. */
export async function probeAdminAccess(): Promise<void> {
  try {
    await rpc<Partial<Totals>[]>('supalytics_totals');
  } catch (e) {
    const message = e instanceof Error ? e.message : T.errConnectGeneric;
    const who = await whoami();
    throw new Error(
      who ? `${message}\n\n${T.whoamiDebug(who.jwt_role, who.uid, who.is_admin)}` : message,
    );
  }
}

export async function fetchTotals(): Promise<Totals> {
  if (demoMode) return demo(mockTotals());
  const rows = await rpc<Partial<Totals>[]>('supalytics_totals');
  if (!rows?.length) throw new Error(T.errEmptyTotals);
  // Eski SQL kurulumları yeni kolonları döndürmeyebilir; eksikler 0'lanır.
  return { ...zeroTotals, ...rows[0] };
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

export function fetchUsers(q: string, offset = 0): Promise<UserRow[]> {
  if (demoMode) return demo(mockUsers(q, offset, USERS_PAGE_SIZE));
  return rpc<UserRow[]>('supalytics_user_list', {
    q,
    page_size: USERS_PAGE_SIZE,
    page_offset: offset,
  });
}

export function fetchTopUsers(days = 30, maxRows = 5): Promise<TopUser[]> {
  if (demoMode) return demo(mockTopUsers(maxRows));
  return rpc<TopUser[]>('supalytics_top_users', { days, max_rows: maxRows });
}

export function fetchActivity(maxEvents = 50): Promise<ActivityRow[]> {
  if (demoMode) return demo(mockActivity(maxEvents));
  return rpc<ActivityRow[]>('supalytics_recent_activity', { max_events: maxEvents });
}

export function fetchUserDetail(uid: string, maxEvents = 50): Promise<UserEvent[]> {
  if (demoMode) return demo(mockUserDetail(uid, maxEvents));
  return rpc<UserEvent[]>('supalytics_user_detail', { uid, max_events: maxEvents });
}
