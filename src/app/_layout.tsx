import * as LocalAuthentication from 'expo-local-authentication';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <ThemeProvider initialAccent={prefs.accent} onAccentChange={onAccentChange}>
      <StatusBar style="light" />
      {locked ? (
        <LockScreen onUnlocked={() => setUnlocked(true)} />
      ) : (
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
        >
          {/* Redirect yerine guard: '/' çakışması yaratmadan onboarding ⇄ tabs geçişi. */}
          <Stack.Protected guard={prefs.setupDone}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={!prefs.setupDone}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}

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
    backgroundColor: colors.bg,
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
