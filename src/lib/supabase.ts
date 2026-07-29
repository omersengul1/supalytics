import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { T } from './i18n';
import { loadCredentials, SESSION_KEY, secureSessionStorage, type Credentials } from './prefs';

let client: SupabaseClient | null = null;

/** "https://xyz.supabase.co/" → doğrulanmış, sondaki / kırpılmış URL. */
export function normalizeProjectUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error(T.errUrlEmpty);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(T.errUrlInvalid);
  }
  if (parsed.protocol !== 'https:') throw new Error(T.errUrlHttps);
  return trimmed;
}

// service_role / secret anahtarları daha istemcide reddet: yanlışlıkla
// yapıştırılan tanrı anahtarı Keychain'e bile girmesin.
export function assertPublicKey(key: string): void {
  if (key.startsWith('sb_secret')) throw new Error(T.errSecretKey);
  const parts = key.split('.');
  if (parts.length === 3) {
    let payload: { role?: string } | null = null;
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      payload = JSON.parse(globalThis.atob(padded));
    } catch {
      payload = null; // JWT değilmiş; sunucu doğrulaması zaten yapılacak
    }
    if (payload?.role === 'service_role') throw new Error(T.errServiceRole);
  }
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
  if (!creds) throw new Error(T.errNoConnection);
  return createClientFromCreds(creds);
}

export function resetClient(): void {
  client = null;
}
