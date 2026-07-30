import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { configureApi, probeAdminAccess } from './api';
import { T } from './i18n';
import {
  defaultPrefs,
  defaultProjectLabel,
  deleteProjectSecrets,
  loadCredentials,
  loadPrefs,
  saveCredentials,
  savePrefs,
  type Prefs,
  type ProjectRef,
} from './prefs';
import {
  assertPublicKey,
  createClientForProject,
  normalizeProjectUrl,
  resetClient,
} from './supabase';

export interface ConnectInput {
  url: string;
  anonKey: string;
  email: string;
  password: string;
  /** İsteğe bağlı görünen ad; boşsa host'tan türetilir. */
  label?: string;
}

interface PrefsValue {
  prefs: Prefs;
  ready: boolean;
  update: (patch: Partial<Prefs>) => void;
  resetToDefaults: () => void;
  /** Bağlan + doğrula + kaydet: başarılıysa projeyi listeye ekler ve aktif yapar. */
  connectProject: (input: ConnectInput) => Promise<ProjectRef>;
  switchProject: (id: string) => void;
  switchToDemo: () => void;
  removeProject: (id: string) => void;
  renameProject: (id: string, label: string) => void;
}

const PrefsContext = createContext<PrefsValue>({
  prefs: defaultPrefs,
  ready: false,
  update: () => {},
  resetToDefaults: () => {},
  connectProject: async () => ({ id: '', label: '' }),
  switchProject: () => {},
  switchToDemo: () => {},
  removeProject: () => {},
  renameProject: () => {},
});

// Prefs tek kez yüklenir, tek kopya üzerinden okunur; yazmalar arka planda SecureStore'a akar.
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  // Async akışların (connectProject) güncel prefs'e bakabilmesi için ayna.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    mounted.current = true;
    loadPrefs().then((loaded) => {
      if (!mounted.current) return;
      configureApi({ demoMode: loaded.demoMode });
      setPrefs(loaded);
      setReady(true);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      configureApi({ demoMode: next.demoMode });
      void savePrefs(patch);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    configureApi({ demoMode: defaultPrefs.demoMode });
    resetClient();
    setPrefs(defaultPrefs);
  }, []);

  const connectProject = useCallback(
    async (input: ConnectInput): Promise<ProjectRef> => {
      const cleanUrl = normalizeProjectUrl(input.url);
      const key = input.anonKey.trim();
      if (!key) throw new Error(T.errKeyRequired);
      assertPublicKey(key);
      if (!input.email.trim() || !input.password) throw new Error(T.errCredsRequired);

      // Aynı proje URL'si zaten ekliyse yeni kayıt açma — bilgileri tazele.
      let existing: ProjectRef | undefined;
      for (const p of prefsRef.current.projects) {
        const stored = await loadCredentials(p.id);
        if (stored?.url === cleanUrl) {
          existing = p;
          break;
        }
      }
      const id = existing?.id ?? `p${Date.now().toString(36)}`;
      const client = createClientForProject(id, { url: cleanUrl, anonKey: key });
      try {
        const { error } = await client.auth.signInWithPassword({
          email: input.email.trim(),
          password: input.password,
        });
        if (error) {
          throw new Error(
            error.message === 'Invalid login credentials' ? T.errBadLogin : error.message,
          );
        }
        // Giriş yetmez: admin listesinde olduğunu gerçek bir RPC ile kanıtla.
        await probeAdminAccess();
      } catch (e) {
        // Yarım kalan deneme aktif client olarak kalmasın: bir önceki aktif
        // proje bir sonraki getClient çağrısında yeniden kurulur.
        resetClient();
        throw e;
      }
      try {
        await saveCredentials(id, { url: cleanUrl, anonKey: key });
      } catch {
        // SecureStore bu istemcide bozuk (ör. eski Expo Go) — sırları düz
        // depoya YAZMAYIZ; kullanıcıya durumu anlatır, akışı durdururuz.
        resetClient();
        throw new Error(T.errSecureStore);
      }
      const customLabel = input.label?.trim();
      const ref: ProjectRef = {
        id,
        label: customLabel || existing?.label || defaultProjectLabel(cleanUrl),
      };
      update({
        projects: existing
          ? prefsRef.current.projects.map((p) => (p.id === id ? ref : p))
          : [...prefsRef.current.projects, ref],
        activeProjectId: id,
        demoMode: false,
      });
      return ref;
    },
    [update],
  );

  const switchProject = useCallback(
    (id: string) => {
      if (id === prefsRef.current.activeProjectId && !prefsRef.current.demoMode) return;
      resetClient();
      update({ activeProjectId: id, demoMode: false });
    },
    [update],
  );

  const switchToDemo = useCallback(() => {
    if (prefsRef.current.demoMode) return;
    update({ demoMode: true });
  }, [update]);

  const renameProject = useCallback(
    (id: string, label: string) => {
      const clean = label.trim();
      if (!clean) return;
      update({
        projects: prefsRef.current.projects.map((p) =>
          p.id === id ? { ...p, label: clean } : p,
        ),
      });
    },
    [update],
  );

  const removeProject = useCallback(
    (id: string) => {
      void deleteProjectSecrets(id);
      const rest = prefsRef.current.projects.filter((p) => p.id !== id);
      const wasActive = prefsRef.current.activeProjectId === id;
      if (wasActive) resetClient();
      update({
        projects: rest,
        activeProjectId: wasActive ? (rest[0]?.id ?? null) : prefsRef.current.activeProjectId,
        // Aktif proje silinip geride proje kalmadıysa panel demoya düşer.
        demoMode: prefsRef.current.demoMode || (wasActive && rest.length === 0),
      });
    },
    [update],
  );

  const value = useMemo(
    () => ({
      prefs,
      ready,
      update,
      resetToDefaults,
      connectProject,
      switchProject,
      switchToDemo,
      removeProject,
      renameProject,
    }),
    [
      prefs,
      ready,
      update,
      resetToDefaults,
      connectProject,
      switchProject,
      switchToDemo,
      removeProject,
      renameProject,
    ],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  return useContext(PrefsContext);
}
