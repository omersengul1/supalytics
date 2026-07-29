import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetupGuide } from '@/components/setup-guide';
import { probeAdminAccess } from '@/lib/api';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { saveCredentials, type Focus, type MetricKey } from '@/lib/prefs';
import {
  assertPublicKey,
  createClientFromCreds,
  normalizeProjectUrl,
  resetClient,
} from '@/lib/supabase';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

type StepId = 'manifesto' | 'metrics' | 'focus' | 'source' | 'sql' | 'connect' | 'accent';
type SourceMode = 'real' | 'demo' | null;

const METRIC_KEYS: MetricKey[] = ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'];
const FOCUS_KEYS: Focus[] = ['growth', 'retention', 'people'];
const FOCUS_GLYPHS: Record<Focus, string> = { growth: '↗', retention: '↺', people: '◉' };

export default function Onboarding() {
  const { update } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();

  const [stepIndex, setStepIndex] = useState(0);
  const [metrics, setMetrics] = useState<MetricKey[]>(['active', 'signups', 'activity']);
  const [focus, setFocus] = useState<Focus>('growth');
  const [mode, setMode] = useState<SourceMode>(null);

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Adım yolu kaynak seçimine göre dallanır: demo SQL/bağlantı adımlarını atlar.
  const path = useMemo<StepId[]>(() => {
    const base: StepId[] = ['manifesto', 'metrics', 'focus', 'source'];
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
      const cleanUrl = normalizeProjectUrl(url);
      const key = anonKey.trim();
      if (!key) throw new Error(T.errKeyRequired);
      assertPublicKey(key);
      if (!email.trim() || !password) throw new Error(T.errCredsRequired);
      resetClient();
      const client = createClientFromCreds({ url: cleanUrl, anonKey: key });
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials' ? T.errBadLogin : error.message,
        );
      }
      // Giriş yetmez: admin listesinde olduğunu gerçek bir RPC ile kanıtla.
      await probeAdminAccess();
      await saveCredentials({ url: cleanUrl, anonKey: key });
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
    update({ setupDone: true, demoMode: mode === 'demo', focus, metrics });
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'manifesto' && (
          <View style={styles.step}>
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
          </View>
        )}

        {step === 'metrics' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.metricsTitle}</Text>
            <Text style={[t.caption, { marginBottom: 4, lineHeight: 17 }]}>{T.metricsHint}</Text>
            {METRIC_KEYS.map((key) => {
              const selected = metrics.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggleMetric(key)}
                  style={[styles.option, selected && { borderColor: accentColor }]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[t.body, { fontWeight: '600', fontSize: 15 }]}>
                      {T.metricLabels[key]}
                    </Text>
                    <Text style={[t.caption, { lineHeight: 16 }]}>{T.metricDescs[key]}</Text>
                  </View>
                  <Text
                    style={[
                      styles.check,
                      { color: selected ? accentColor : colors.elevated },
                    ]}
                  >
                    ●
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 'focus' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.focusTitle}</Text>
            <Text style={[t.caption, { marginBottom: 4 }]}>{T.focusHint}</Text>
            {FOCUS_KEYS.map((key) => {
              const selected = focus === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFocus(key);
                  }}
                  style={[styles.option, selected && { borderColor: accentColor }]}
                >
                  <Text
                    style={[styles.optionGlyph, { color: selected ? accentColor : colors.tertiary }]}
                  >
                    {FOCUS_GLYPHS[key]}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.body, { fontWeight: '600' }]}>{T.focusOptions[key].title}</Text>
                    <Text style={t.caption}>{T.focusOptions[key].desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 'source' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.sourceTitle}</Text>
            <Text style={[t.caption, { marginBottom: 4 }]}>{T.sourceHint}</Text>
            {(
              [
                { key: 'real', title: T.sourceReal, desc: T.sourceRealDesc, glyph: '⛁' },
                { key: 'demo', title: T.sourceDemo, desc: T.sourceDemoDesc, glyph: '▶' },
              ] as const
            ).map((opt) => {
              const selected = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMode(opt.key);
                  }}
                  style={[styles.option, selected && { borderColor: accentColor }]}
                >
                  <Text
                    style={[styles.optionGlyph, { color: selected ? accentColor : colors.tertiary }]}
                  >
                    {opt.glyph}
                  </Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[t.body, { fontWeight: '600' }]}>{opt.title}</Text>
                    <Text style={[t.caption, { lineHeight: 16 }]}>{opt.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 'sql' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.sqlTitle}</Text>
            <SetupGuide metrics={metrics} />
          </View>
        )}

        {step === 'connect' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.connectTitle}</Text>
            <Text style={[t.caption, { lineHeight: 17 }]}>{T.connectIntro}</Text>
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
          </View>
        )}

        {step === 'accent' && (
          <View style={styles.step}>
            <Text style={t.title}>{T.accentTitle}</Text>
            <Text style={[t.caption, { marginBottom: 8 }]}>{T.accentHint}</Text>
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
                    style={[styles.swatchOuter, selected && { borderColor: accents[key].color }]}
                  >
                    <View style={[styles.swatch, { backgroundColor: accents[key].color }]} />
                  </Pressable>
                );
              })}
            </View>
            <Text style={[t.caption, { textAlign: 'center' }]}>{T.accentNames[accent]}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {path.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === stepIndex ? accentColor : colors.elevated }]}
            />
          ))}
        </View>
        {step === 'manifesto' && <PrimaryButton label={T.start} onPress={advance} />}
        {(step === 'metrics' || step === 'focus') && (
          <PrimaryButton label={T.next} onPress={advance} />
        )}
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

function Field({
  label,
  help,
  ...inputProps
}: { label: string; help?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={t.label}>{label}</Text>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.tertiary}
        style={styles.input}
      />
      {help ? <Text style={[t.caption, { lineHeight: 15 }]}>{help}</Text> : null}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { accentColor } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: accentColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
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
    gap: 14,
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
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
  },
  optionGlyph: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
    fontWeight: '700',
  },
  check: {
    fontSize: 18,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primary: {
    height: 52,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
