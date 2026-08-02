import * as SecureStore from 'expo-secure-store';

import { cardsFromMetrics, DEFAULT_CARD_ORDER, isCardId, type CardId } from './cards';
import type { AccentKey } from './theme';

const PREFS_KEY = 'supalytics.prefs';
const LEGACY_CREDS_KEY = 'supalytics.creds';
const LEGACY_SESSION_KEY = 'supalytics.session';

// Tüm depolama SecureStore'da: her erişim try/catch içinde, sessiz fallback.
// SecureStore bozuksa (ör. eski Expo Go) tercihler bellekte yaşar ve oturum
// kapanışında silinir, ama uygulama çökmez — demo modu her durumda çalışır.
//
// Çoklu proje: her projenin bağlantı bilgisi ve supabase-js oturumu kendi
// anahtarı altında durur; prefs yalnızca sır İÇERMEYEN referans listesini tutar.

export type MetricKey = 'active' | 'signups' | 'providers' | 'devices' | 'sessions' | 'activity';

export interface ProjectRef {
  id: string;
  label: string; // proje host'u (xxxx.supabase.co) — sır değil
}

export interface Prefs {
  setupDone: boolean;
  demoMode: boolean;
  metrics: MetricKey[];
  /** Özetteki kartlar: dizide olmak = görünür, dizideki yer = sıra. Özetin tek
   *  doğruluk kaynağı budur; metrics ondan türetilir. */
  cards: CardId[];
  accent: AccentKey;
  biometricLock: boolean;
  projects: ProjectRef[];
  activeProjectId: string | null;
}

export const defaultPrefs: Prefs = {
  setupDone: false,
  demoMode: false,
  metrics: ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'],
  cards: DEFAULT_CARD_ORDER,
  accent: 'supabase',
  biometricLock: false,
  projects: [],
  activeProjectId: null,
};

/** Diskten gelen kart listesini temizler: tanınmayan/yinelenen kimlikleri atar,
 *  hiç kart tercihi yoksa eski metrics seçiminden türetir. */
function normalizeCards(stored: Partial<Prefs>): CardId[] {
  if (!Array.isArray(stored.cards)) {
    return cardsFromMetrics(stored.metrics ?? defaultPrefs.metrics);
  }
  const seen = new Set<CardId>();
  for (const id of stored.cards) if (isCardId(id)) seen.add(id);
  return [...seen];
}

export interface Credentials {
  url: string;
  anonKey: string;
}

export function credsKeyFor(projectId: string): string {
  return `supalytics.creds.${projectId}`;
}

export function sessionKeyFor(projectId: string): string {
  return `supalytics.session.${projectId}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Varsayılan proje etiketi: host'un ".supabase.co" soneki kırpılmış hali. */
export function defaultProjectLabel(url: string): string {
  return hostOf(url).replace(/\.supabase\.co$/, '');
}

export async function loadPrefs(): Promise<Prefs> {
  let prefs: Prefs | null = null;
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) prefs = { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    // SecureStore bozuksa (ör. Expo Go eski versiyonu) varsayılanları kullan
  }
  let merged = prefs ?? defaultPrefs;
  // Kart tercihi bu sürümle geldi: eski kayıtlarda yok, metrics'ten türetilir.
  merged = { ...merged, cards: normalizeCards(merged) };

  // Eski sürümlerin tam-host etiketleri kısaltılır (bir kez). Kullanıcının
  // verdiği özel adlar ".supabase.co" ile bitmeyeceği için etkilenmez.
  if (merged.projects.some((p) => p.label.endsWith('.supabase.co'))) {
    merged = {
      ...merged,
      projects: merged.projects.map((p) =>
        p.label.endsWith('.supabase.co')
          ? { ...p, label: p.label.replace(/\.supabase\.co$/, '') }
          : p,
      ),
    };
    SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(merged)).catch(() => {});
  }

  // Tek-proje sürümünden geçiş: eski sabit anahtarlardaki bağlantı + oturum,
  // "p1" kimlikli ilk projeye taşınır (bir kez).
  if (merged.projects.length === 0) {
    try {
      const legacy = await SecureStore.getItemAsync(LEGACY_CREDS_KEY);
      if (legacy) {
        const creds = JSON.parse(legacy) as Credentials;
        const migrated: Prefs = {
          ...merged,
          projects: [{ id: 'p1', label: defaultProjectLabel(creds.url) }],
          activeProjectId: 'p1',
        };
        await SecureStore.setItemAsync(credsKeyFor('p1'), legacy);
        const session = await SecureStore.getItemAsync(LEGACY_SESSION_KEY);
        if (session) await SecureStore.setItemAsync(sessionKeyFor('p1'), session);
        SecureStore.deleteItemAsync(LEGACY_CREDS_KEY).catch(() => {});
        SecureStore.deleteItemAsync(LEGACY_SESSION_KEY).catch(() => {});
        SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(migrated)).catch(() => {});
        return migrated;
      }
    } catch {
      // taşınamadıysa mevcut haliyle devam
    }
  }
  return merged;
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

export async function loadCredentials(projectId: string): Promise<Credentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(credsKeyFor(projectId));
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

/** Sır yazımı: SecureStore bozuksa Error fırlatır — çağıran kullanıcıya anlatır. */
export async function saveCredentials(projectId: string, creds: Credentials): Promise<void> {
  await SecureStore.setItemAsync(credsKeyFor(projectId), JSON.stringify(creds));
}

/** Bir projenin tüm sırlarını (bağlantı + oturum) siler. */
export async function deleteProjectSecrets(projectId: string): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(credsKeyFor(projectId)).catch(() => {}),
    SecureStore.deleteItemAsync(sessionKeyFor(projectId)).catch(() => {}),
  ]);
}

export async function wipeEverything(): Promise<void> {
  const prefs = await loadPrefs();
  await Promise.all([
    SecureStore.deleteItemAsync(PREFS_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(LEGACY_CREDS_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(LEGACY_SESSION_KEY).catch(() => {}),
    ...prefs.projects.map((p) => deleteProjectSecrets(p.id)),
  ]);
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
