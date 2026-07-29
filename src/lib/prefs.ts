import * as SecureStore from 'expo-secure-store';

import type { AccentKey } from './theme';

const PREFS_KEY = 'supalytics.prefs';
const CREDS_KEY = 'supalytics.creds';
// supabase-js oturumu bu sabit anahtar altında tutulur ki wipe tek hamlede silebilsin.
export const SESSION_KEY = 'supalytics.session';

// Tüm depolama SecureStore'da: her erişim try/catch içinde, sessiz fallback.
// SecureStore bozuksa (ör. eski Expo Go) tercihler bellekte yaşar ve oturum kapanışında silinir,
// ama uygulama çökmez — demo modu her durumda çalışır.

export type MetricKey = 'active' | 'signups' | 'providers' | 'devices' | 'sessions' | 'activity';

export interface Prefs {
  setupDone: boolean;
  demoMode: boolean;
  metrics: MetricKey[];
  accent: AccentKey;
  biometricLock: boolean;
}

export const defaultPrefs: Prefs = {
  setupDone: false,
  demoMode: false,
  metrics: ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'],
  accent: 'supabase',
  biometricLock: false,
};

export interface Credentials {
  url: string;
  anonKey: string;
}

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    // SecureStore bozuksa (ör. Expo Go eski versiyonu) varsayılanları kullan
  }
  return defaultPrefs;
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const next = { ...(await loadPrefs()), ...patch };
  try {
    await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
  } catch {
    // kalıcılık başarısızsa bile uygulama oturum boyunca state ile çalışır
  }
  return next;
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDS_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

/** Sır yazımı: SecureStore bozuksa Error fırlatır — çağıran kullanıcıya anlatır. */
export async function saveCredentials(creds: Credentials): Promise<void> {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify(creds));
}

export async function wipeEverything(): Promise<void> {
  await Promise.all([
    PREFS_KEY,
    CREDS_KEY,
    SESSION_KEY,
  ].map((key) => SecureStore.deleteItemAsync(key).catch(() => {})));
}

// supabase-js storage adapter'ı — oturum yalnızca Keychain/Keystore'da yaşar.
// Hiçbir çağrı fırlatmaz: bozuk istemcide oturum kalıcı olmaz (yeniden giriş
// gerekir) ama uygulama çökmez.
export const secureSessionStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // sessiz: oturum bellekte sürer
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // sessiz
    }
  },
};
