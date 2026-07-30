import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, PrimaryButton } from '@/components/form';
import { SetupGuide } from '@/components/setup-guide';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import type { MetricKey } from '@/lib/prefs';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

type StepId = 'manifesto' | 'metrics' | 'source' | 'sql' | 'connect' | 'accent';
type SourceMode = 'real' | 'demo' | null;

const METRIC_KEYS: MetricKey[] = ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'];

export default function Onboarding() {
  const { update, connectProject } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();

  const [stepIndex, setStepIndex] = useState(0);
  const [metrics, setMetrics] = useState<MetricKey[]>(['active', 'signups', 'activity']);
  const [mode, setMode] = useState<SourceMode>(null);

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Adım yolu kaynak seçimine göre dallanır: demo, SQL/bağlantı adımlarını atlar.
  const path = useMemo<StepId[]>(() => {
    const base: StepId[] = ['manifesto', 'metrics', 'source'];
    return mode === 'demo' ? [...base, 'accent'] : [...base, 'sql', 'connect', 'accent'];
  }, [mode]);
  const step = path[Math.min(stepIndex, path.length - 1)];

  const advance = () => setStepIndex((i) => Math.min(i + 1, path.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const toggleMetric = (key: MetricKey) => {
    setMetrics((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // en az 1 metrik kalmalı
        Haptics.selectionAsync();
        return prev.filter((m) => m !== key);
      }
      Haptics.selectionAsync();
      return [...prev, key];
    });
  };

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      // Doğrulama + giriş + admin kanıtı + kayıt tek yerde: prefs-context.
      await connectProject({ url, anonKey, email, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advance();
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : T.errConnectGeneric);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  };

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({ setupDone: true, demoMode: mode === 'demo', metrics });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {stepIndex > 0 ? (
          <Pressable onPress={goBack} hitSlop={12} accessibilityLabel={T.back}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
        ) : (
          <View style={{ height: 28 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View key={step} entering={FadeInDown.duration(280)} style={styles.step}>
          {step === 'manifesto' && (
            <>
              <Text style={styles.wordmark}>supalytics</Text>
              <Text style={styles.headline}>{T.manifestoHeadline}</Text>
              <Text style={[t.body, { color: colors.secondary, lineHeight: 24 }]}>
                {T.manifestoBody}
              </Text>
              <View style={styles.card}>
                <Text style={[t.label, styles.cardLabel]}>{T.manifestoWhyTitle}</Text>
                <Text style={[t.body, { color: colors.secondary, lineHeight: 22, fontSize: 14 }]}>
                  {T.manifestoWhyBody}
                </Text>
              </View>
            </>
          )}

          {step === 'metrics' && (
            <>
              <Text style={styles.question}>{T.metricsTitle}</Text>
              <Text style={styles.hint}>{T.metricsHint}</Text>
              {METRIC_KEYS.map((key) => {
                const selected = metrics.includes(key);
                return (
                  <SelectRow
                    key={key}
                    selected={selected}
                    accentColor={accentColor}
                    title={T.metricLabels[key]}
                    desc={T.metricDescs[key]}
                    onPress={() => toggleMetric(key)}
                  />
                );
              })}
            </>
          )}

          {step === 'source' && (
            <>
              <Text style={styles.question}>{T.sourceTitle}</Text>
              <Text style={styles.hint}>{T.sourceHint}</Text>
              <SelectRow
                selected={mode === 'real'}
                accentColor={accentColor}
                title={T.sourceReal}
                desc={T.sourceRealDesc}
                round
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode('real');
                }}
              />
              <SelectRow
                selected={mode === 'demo'}
                accentColor={accentColor}
                title={T.sourceDemo}
                desc={T.sourceDemoDesc}
                round
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode('demo');
                }}
              />
            </>
          )}

          {step === 'sql' && (
            <>
              <Text style={styles.question}>{T.sqlTitle}</Text>
              <SetupGuide metrics={metrics} />
            </>
          )}

          {step === 'connect' && (
            <>
              <Text style={styles.question}>{T.connectTitle}</Text>
              <Text style={styles.hint}>{T.connectIntro}</Text>
              <View style={styles.card}>
                <Text style={[t.label, styles.cardLabel]}>{T.whereFindTitle}</Text>
                <Text style={[t.caption, { lineHeight: 18, color: colors.secondary }]}>
                  {T.whereFindBody}
                </Text>
              </View>
              <Field
                label={T.fieldUrl}
                help={T.fieldUrlHelp}
                value={url}
                onChangeText={setUrl}
                placeholder="https://xxxx.supabase.co"
                keyboardType="url"
              />
              <Field
                label={T.fieldAnon}
                help={T.fieldAnonHelp}
                value={anonKey}
                onChangeText={setAnonKey}
                placeholder="eyJhbGciOi… / sb_publishable_…"
              />
              <Field
                label={T.fieldEmail}
                help={T.fieldEmailHelp}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <Field
                label={T.fieldPassword}
                help={T.fieldPasswordHelp}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
              {connectError ? (
                <Text style={[t.caption, { color: colors.danger, lineHeight: 17 }]}>
                  {connectError}
                </Text>
              ) : (
                <Text style={[t.caption, { lineHeight: 17 }]}>{T.connectChecksAdmin}</Text>
              )}
            </>
          )}

          {step === 'accent' && (
            <>
              <Text style={styles.question}>{T.accentTitle}</Text>
              <Text style={styles.hint}>{T.accentHint}</Text>
              <View style={styles.swatchRow}>
                {(Object.keys(accents) as AccentKey[]).map((key) => {
                  const selected = accent === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityLabel={T.accentNames[key]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setAccent(key);
                      }}
                      style={({ pressed }) => [
                        styles.swatchOuter,
                        selected && { borderColor: accents[key].color },
                        pressed && { transform: [{ scale: 0.94 }] },
                      ]}
                    >
                      <View style={[styles.swatch, { backgroundColor: accents[key].color }]} />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[t.caption, { textAlign: 'center' }]}>{T.accentNames[accent]}</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {path.map((_, i) => (
            <Animated.View
              key={i}
              layout={LinearTransition.springify().damping(18)}
              style={[
                styles.dot,
                i === stepIndex
                  ? { width: 22, backgroundColor: accentColor }
                  : { width: 8, backgroundColor: colors.elevated },
              ]}
            />
          ))}
        </View>
        {step === 'manifesto' && <PrimaryButton label={T.start} onPress={advance} />}
        {step === 'metrics' && <PrimaryButton label={T.next} onPress={advance} />}
        {step === 'source' && (
          <PrimaryButton label={T.next} onPress={advance} disabled={mode === null} />
        )}
        {step === 'sql' && <PrimaryButton label={T.sqlDone} onPress={advance} />}
        {step === 'connect' && (
          <PrimaryButton
            label={connecting ? T.connectVerifying : T.connectCta}
            onPress={handleConnect}
            disabled={connecting}
            loading={connecting}
          />
        )}
        {step === 'accent' && <PrimaryButton label={T.openPanel} onPress={finish} />}
      </View>
    </KeyboardAvoidingView>
  );
}

// Seçilebilir satır: vurgu tonlu zemin + kare (çoklu) ya da yuvarlak (tekli) onay işareti.
function SelectRow({
  selected,
  accentColor,
  title,
  desc,
  round,
  onPress,
}: {
  selected: boolean;
  accentColor: string;
  title: string;
  desc: string;
  round?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={round ? 'radio' : 'checkbox'}
      accessibilityState={round ? { selected } : { checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected && { borderColor: accentColor, backgroundColor: accentColor + '14' },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[t.body, { fontWeight: '600', fontSize: 15 }]}>{title}</Text>
        <Text style={[t.caption, { lineHeight: 16 }]}>{desc}</Text>
      </View>
      <View
        style={[
          styles.checkbox,
          round && { borderRadius: 11 },
          selected && { backgroundColor: accentColor, borderColor: accentColor },
        ]}
      >
        {selected ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: 20,
  },
  backGlyph: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.secondary,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  step: {
    gap: 12,
  },
  wordmark: {
    ...t.caption,
    color: colors.tertiary,
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  headline: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 46,
    color: colors.text,
    marginBottom: 4,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
    color: colors.text,
  },
  hint: {
    ...t.caption,
    lineHeight: 17,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    letterSpacing: 0.8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 24,
  },
  swatchOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
