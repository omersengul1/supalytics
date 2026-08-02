import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#0A0C0F',
  surface: '#14171C',
  // surface'in %72'si. Arka plan görselinin üstünde duran kartlar bunu kullanır;
  // doku hafifçe geçer. Üstünde zemin olmayan katmanlar (alt sayfalar, modallar)
  // okunaklılık için opak surface'te kalır.
  surfaceGlass: 'rgba(20,23,28,0.72)',
  elevated: '#1B2027',
  hairline: 'rgba(255,255,255,0.07)',
  text: '#F4F6F8',
  secondary: '#8B93A1',
  tertiary: '#5A6270',
  danger: '#FF6B6B',
} as const;

export type AccentKey = 'supabase' | 'ice' | 'violet' | 'amber';

export const accents: Record<AccentKey, { label: string; color: string }> = {
  supabase: { label: 'Supabase', color: '#3ECF8E' },
  ice: { label: 'Buz', color: '#7DD3FC' },
  violet: { label: 'Menekşe', color: '#A78BFA' },
  amber: { label: 'Kehribar', color: '#FBBF24' },
};

export const radius = { card: 20, control: 12, dock: 32 } as const;

export const type = {
  hero: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  metric: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.secondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.tertiary },
} satisfies Record<string, TextStyle>;

interface ThemeValue {
  accent: AccentKey;
  accentColor: string;
  setAccent: (key: AccentKey) => void;
}

const ThemeContext = createContext<ThemeValue>({
  accent: 'supabase',
  accentColor: accents.supabase.color,
  setAccent: () => {},
});

export function ThemeProvider({
  initialAccent,
  onAccentChange,
  children,
}: {
  initialAccent: AccentKey;
  onAccentChange?: (key: AccentKey) => void;
  children: ReactNode;
}) {
  const [accent, setAccentState] = useState<AccentKey>(initialAccent);
  const value = useMemo<ThemeValue>(
    () => ({
      accent,
      accentColor: accents[accent].color,
      setAccent: (key) => {
        setAccentState(key);
        onAccentChange?.(key);
      },
    }),
    [accent, onAccentChange],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
