import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadCredentials, SESSION_KEY, secureSessionStorage, type Credentials } from './prefs';

let client: SupabaseClient | null = null;

/** "https://xyz.supabase.co/" → doğrulanmış, sondaki / kırpılmış URL. Hatalıysa TR mesajlı Error. */
export function normalizeProjectUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('Proje URL’si boş olamaz.');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Geçerli bir URL girin (https://…).');
  }
  if (parsed.protocol !== 'https:') throw new Error('URL https:// ile başlamalı.');
  return trimmed;
}

export function projectHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function createClientFromCreds(creds: Credentials): SupabaseClient {
  client = createClient(creds.url, creds.anonKey, {
    auth: {
      storage: secureSessionStorage,
      storageKey: SESSION_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/** Kayıtlı bağlantıyla tekil client; bağlantı yoksa Error. */
export async function getClient(): Promise<SupabaseClient> {
  if (client) return client;
  const creds = await loadCredentials();
  if (!creds) throw new Error('Supabase bağlantısı bulunamadı.');
  return createClientFromCreds(creds);
}

export function resetClient(): void {
  client = null;
}
