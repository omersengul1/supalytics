import * as SecureStore from 'expo-secure-store';

import type { AccentKey } from './theme';

const PREFS_KEY = 'supalytics.prefs';
const CREDS_KEY = 'supalytics.creds';
// supabase-js oturumu bu sabit anahtar altında tutulur ki wipe tek hamlede silebilsin.
export const SESSION_KEY = 'supalytics.session';

export type Focus = 'growth' | 'retention' | 'people';

export type MetricKey = 'active' | 'signups' | 'providers' | 'devices' | 'sessions' | 'activity';

export interface Prefs {
  setupDone: boolean;
  demoMode: boolean;
  focus: Focus;
  metrics: MetricKey[];
  accent: AccentKey;
  biometricLock: boolean;
}

export const defaultPrefs: Prefs = {
  setupDone: false,
  demoMode: false,
  focus: 'growth',
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
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return defaultPrefs;
  }
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const next = { ...(await loadPrefs()), ...patch };
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
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

export async function saveCredentials(creds: Credentials): Promise<void> {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify(creds));
}

export async function wipeEverything(): Promise<void> {
  await Promise.all(
    [PREFS_KEY, CREDS_KEY, SESSION_KEY].map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => {}),
    ),
  );
}

// supabase-js storage adapter'ı — oturum yalnızca Keychain/Keystore'da yaşar.
export const secureSessionStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};
