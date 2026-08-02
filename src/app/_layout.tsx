import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenBackground } from '@/components/screen-background';
import { T } from '@/lib/i18n';
import { PrefsProvider, usePrefs } from '@/lib/prefs-context';
import { colors, radius, ThemeProvider, type as t, useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <PrefsProvider>
      <Gate />
    </PrefsProvider>
  );
}

function Gate() {
  const { prefs, ready, update } = usePrefs();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  const onAccentChange = useCallback(
    (accent: (typeof prefs)['accent']) => update({ accent }),
    [update],
  );

  if (!ready) return null;

  const locked = prefs.setupDone && prefs.biometricLock && !unlocked;

  // Arka plan görseli tüm gezinme ağacının altında tek sefer asılır; ekranlar
  // kendi zeminlerini şeffaf bırakıp üstünde çizilir. Modal olarak açılan
  // add-project bunun istisnası — o kendi zeminini kendi kurar.
  return (
    <ThemeProvider initialAccent={prefs.accent} onAccentChange={onAccentChange}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <ScreenBackground />
        {locked ? (
          <LockScreen onUnlocked={() => setUnlocked(true)} />
        ) : (
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
          >
            {/* Redirect yerine guard: '/' çakışması yaratmadan onboarding ⇄ tabs geçişi. */}
            <Stack.Protected guard={prefs.setupDone}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-project" options={{ presentation: 'modal' }} />
            </Stack.Protected>
            <Stack.Protected guard={!prefs.setupDone}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
          </Stack>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

// Kilit açılmadan panel içeriği hiç mount edilmez.
function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const { accentColor } = useTheme();
  const [failed, setFailed] = useState(false);

  const tryUnlock = useCallback(async () => {
    setFailed(false);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: T.lockPrompt,
        cancelLabel: T.cancel,
      });
      if (result.success) onUnlocked();
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  }, [onUnlocked]);

  useEffect(() => {
    tryUnlock();
  }, [tryUnlock]);

  return (
    <View style={lockStyles.screen}>
      {Platform.OS === 'ios' ? (
        <SymbolView name="lock.fill" size={40} tintColor={colors.tertiary} />
      ) : (
        <Text style={{ fontSize: 36, color: colors.tertiary }}>🔒</Text>
      )}
      <Text style={[t.title, { marginTop: 16 }]}>{T.lockTitle}</Text>
      <Text style={[t.caption, { marginTop: 6 }]}>{failed ? T.lockFailed : T.lockWaiting}</Text>
      <Pressable
        onPress={tryUnlock}
        style={({ pressed }) => [
          lockStyles.button,
          { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={lockStyles.buttonText}>{T.lockRetry}</Text>
      </Pressable>
    </View>
  );
}

const lockStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  button: {
    marginTop: 28,
    paddingHorizontal: 28,
    height: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
