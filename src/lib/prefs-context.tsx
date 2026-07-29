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

import { configureApi } from './api';
import { defaultPrefs, loadPrefs, savePrefs, type Prefs } from './prefs';

interface PrefsValue {
  prefs: Prefs;
  ready: boolean;
  update: (patch: Partial<Prefs>) => void;
  resetToDefaults: () => void;
}

const PrefsContext = createContext<PrefsValue>({
  prefs: defaultPrefs,
  ready: false,
  update: () => {},
  resetToDefaults: () => {},
});

// Prefs tek kez yüklenir, tek kopya üzerinden okunur; yazmalar arka planda SecureStore'a akar.
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

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
    setPrefs(defaultPrefs);
  }, []);

  const value = useMemo(
    () => ({ prefs, ready, update, resetToDefaults }),
    [prefs, ready, update, resetToDefaults],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  return useContext(PrefsContext);
}
