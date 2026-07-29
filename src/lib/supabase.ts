import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { T } from './i18n';
import { loadCredentials, SESSION_KEY, secureSessionStorage, type Credentials } from './prefs';

let client: SupabaseClient | null = null;
let clientCreds: Credentials | null = null;

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

// Aynı proje için tekrar tekrar yeni client açmak, aynı storage key'i
// paylaşan yeni bir GoTrueClient örneği daha yaratır ("Multiple GoTrueClient
// instances" uyarısı); Supabase bunun kimlik doğrulama durumunu bozabileceğini
// (oturumun bazı çağrılara iliştirilmemesi dahil) açıkça belirtiyor. Aynı
// bağlantıyla tekrar denerken var olan client'ı geri veriyoruz; yalnızca
// bağlantı bilgisi değiştiğinde eskisinin auto-refresh döngüsünü durdurup
// yenisini kuruyoruz.
export function createClientFromCreds(creds: Credentials): SupabaseClient {
  if (client && clientCreds?.url === creds.url && clientCreds?.anonKey === creds.anonKey) {
    return client;
  }
  client?.auth.stopAutoRefresh().catch(() => {});
  clientCreds = creds;
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
  client?.auth.stopAutoRefresh().catch(() => {});
  client = null;
  clientCreds = null;
}
