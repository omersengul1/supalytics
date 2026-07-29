import * as Haptics from 'expo-haptics';
import { useState } from 'react';
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

import { usePrefs } from '@/lib/prefs-context';
import { saveCredentials, type Focus, type MetricKey } from '@/lib/prefs';
import { createClientFromCreds, normalizeProjectUrl, resetClient } from '@/lib/supabase';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

const STEP_COUNT = 5;

const FOCUS_OPTIONS: { key: Focus; glyph: string; title: string; desc: string }[] = [
  { key: 'growth', glyph: '↗', title: 'Büyüme', desc: 'Kayıtlar ve yeni kullanıcılar önde' },
  { key: 'retention', glyph: '↺', title: 'Tutundurma', desc: 'Aktiflik ve bağlılık önde' },
  { key: 'people', glyph: '◉', title: 'Kullanıcılar', desc: 'Kim girmiş, ne zaman girmiş' },
];

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'active', label: 'Aktif kullanıcılar' },
  { key: 'signups', label: 'Kayıtlar' },
  { key: 'providers', label: 'Sağlayıcılar' },
  { key: 'devices', label: 'Cihazlar' },
  { key: 'sessions', label: 'Son oturumlar' },
  { key: 'activity', label: 'İşlem akışı' },
];

export default function Onboarding() {
  const { update } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<Focus>('growth');
  const [metrics, setMetrics] = useState<MetricKey[]>(['active', 'signups', 'activity']);

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const advance = () => setStep((s) => Math.min(s + 1, STEP_COUNT - 1));

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const cleanUrl = normalizeProjectUrl(url);
      const key = anonKey.trim();
      if (!key) throw new Error('anon anahtarı gerekli.');
      if (!email.trim() || !password) throw new Error('E-posta ve şifre gerekli.');
      resetClient();
      const client = createClientFromCreds({ url: cleanUrl, anonKey: key });
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'E-posta veya şifre hatalı.'
            : error.message,
        );
      }
      await saveCredentials({ url: cleanUrl, anonKey: key });
      update({ demoMode: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advance();
    } catch (e) {
      resetClient();
      setConnectError(e instanceof Error ? e.message : 'Bağlantı kurulamadı.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  };

  const enterDemo = () => {
    Haptics.selectionAsync();
    update({ demoMode: true });
    advance();
  };

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

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({ setupDone: true, focus, metrics });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.step}>
            <Text style={styles.wordmark}>supalytics</Text>
            <Text style={styles.headline}>Veriniz{'\n'}cihazınızdan{'\n'}çıkmaz.</Text>
            <Text style={[t.body, { color: colors.secondary, lineHeight: 24 }]}>
              Supabase projenizin kullanıcı analitiği; sunucusuz, telemetrisiz, tamamen bu
              cihazın üstünde.
            </Text>
            <View style={styles.card}>
              <Text style={[t.label, styles.cardLabel]}>NEDEN SERVICE_ROLE İSTEMİYORUZ?</Text>
              <Text style={[t.body, { color: colors.secondary, lineHeight: 22, fontSize: 14 }]}>
                service_role anahtarı veritabanınızdaki her şeyi okuyup yazabilen bir tanrı
                anahtarıdır ve bir telefonda asla durmamalıdır. supalytics yalnızca herkese açık
                anon anahtar + sizin admin hesabınızla çalışır; yetki kontrolü veritabanında,
                security definer fonksiyonların içindedir.
              </Text>
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={t.title}>Projeni bağla</Text>
            <Text style={[t.caption, { marginBottom: 8 }]}>
              Bilgiler yalnızca bu cihazın Keychain/Keystore’unda saklanır.
            </Text>
            <Field
              label="PROJE URL"
              value={url}
              onChangeText={setUrl}
              placeholder="https://xxxx.supabase.co"
              keyboardType="url"
            />
            <Field
              label="ANON ANAHTARI (PUBLIC)"
              value={anonKey}
              onChangeText={setAnonKey}
              placeholder="eyJhbGciOi…"
            />
            <Field
              label="ADMİN E-POSTA"
              value={email}
              onChangeText={setEmail}
              placeholder="ben@ornek.com"
              keyboardType="email-address"
            />
            <Field
              label="ŞİFRE"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            {connectError ? (
              <Text style={[t.caption, { color: colors.danger }]}>{connectError}</Text>
            ) : null}
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={t.title}>Neye odaklanıyorsun?</Text>
            <Text style={[t.caption, { marginBottom: 8 }]}>Özet ekranının sırasını belirler.</Text>
            {FOCUS_OPTIONS.map((opt) => {
              const selected = focus === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFocus(opt.key);
                  }}
                  style={[styles.option, selected && { borderColor: accentColor }]}
                >
                  <Text style={[styles.optionGlyph, { color: selected ? accentColor : colors.tertiary }]}>
                    {opt.glyph}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[t.body, { fontWeight: '600' }]}>{opt.title}</Text>
                    <Text style={t.caption}>{opt.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={t.title}>Özet’te ne görünsün?</Text>
            <Text style={[t.caption, { marginBottom: 8 }]}>En az bir metrik seçili kalır.</Text>
            <View style={styles.chipWrap}>
              {METRIC_OPTIONS.map((opt) => {
                const selected = metrics.includes(opt.key);
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => toggleMetric(opt.key)}
                    style={[
                      styles.chip,
                      selected && { borderColor: accentColor, backgroundColor: colors.elevated },
                    ]}
                  >
                    <Text
                      style={[
                        t.body,
                        { fontSize: 14, fontWeight: '600' },
                        { color: selected ? colors.text : colors.tertiary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={t.title}>Vurgu rengin</Text>
            <Text style={[t.caption, { marginBottom: 8 }]}>
              Canlı veriyi işaretleyen tek renk bu olacak.
            </Text>
            <View style={styles.swatchRow}>
              {(Object.keys(accents) as AccentKey[]).map((key) => {
                const selected = accent === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityLabel={accents[key].label}
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
            <Text style={[t.caption, { textAlign: 'center' }]}>{accents[accent].label}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? accentColor : colors.elevated },
              ]}
            />
          ))}
        </View>
        {step === 0 && <PrimaryButton label="Başla" onPress={advance} />}
        {step === 1 && (
          <>
            <PrimaryButton
              label={connecting ? 'Doğrulanıyor…' : 'Bağlan ve doğrula'}
              onPress={handleConnect}
              disabled={connecting}
              loading={connecting}
            />
            <Pressable onPress={enterDemo} disabled={connecting} hitSlop={8}>
              <Text style={[t.label, { color: accentColor, textAlign: 'center', marginTop: 14 }]}>
                Şimdilik demo verilerle gez
              </Text>
            </Pressable>
          </>
        )}
        {step === 2 && <PrimaryButton label="Devam" onPress={advance} />}
        {step === 3 && <PrimaryButton label="Devam" onPress={advance} />}
        {step === 4 && <PrimaryButton label="Paneli aç" onPress={finish} />}
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={t.label}>{label}</Text>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.tertiary}
        style={styles.input}
      />
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
        { backgroundColor: accentColor, opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  step: {
    gap: 16,
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
    marginTop: 8,
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
    fontSize: 24,
    width: 32,
    textAlign: 'center',
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
