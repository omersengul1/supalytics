import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadCredentials, wipeEverything, type MetricKey } from '@/lib/prefs';
import { usePrefs } from '@/lib/prefs-context';
import { projectHost, resetClient } from '@/lib/supabase';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

const GITHUB_URL = 'https://github.com/omersengul1/supalytics';

const METRIC_LABELS: Record<MetricKey, string> = {
  active: 'Aktif kullanıcılar',
  signups: 'Kayıtlar',
  providers: 'Sağlayıcılar',
  devices: 'Cihazlar',
  sessions: 'Son oturumlar',
  activity: 'İşlem akışı',
};

export default function Settings() {
  const { prefs, update, resetToDefaults } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    if (prefs.demoMode) {
      setHost(null);
      return;
    }
    loadCredentials().then((creds) => setHost(creds ? projectHost(creds.url) : null));
  }, [prefs.demoMode]);

  const confirmWipe = () => {
    Alert.alert(
      'Bağlantıyı sil ve sıfırla',
      'Bağlantı bilgileri, oturum ve tüm tercihler bu cihazdan silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil ve sıfırla',
          style: 'destructive',
          onPress: async () => {
            await wipeEverything();
            resetClient();
            setAccent('supabase');
            resetToDefaults(); // setupDone=false → guard onboarding'e döndürür
          },
        },
      ],
    );
  };

  const toggleBiometric = async (next: boolean) => {
    if (!next) {
      update({ biometricLock: false });
      return;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) {
      Alert.alert(
        'Biyometri kullanılamıyor',
        'Bu cihazda Face ID / parmak izi tanımlı değil.',
      );
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Kilidi etkinleştirmek için doğrula',
      cancelLabel: 'Vazgeç',
    });
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      update({ biometricLock: true });
    }
  };

  const toggleMetric = (key: MetricKey, enabled: boolean) => {
    if (!enabled && prefs.metrics.length === 1 && prefs.metrics.includes(key)) return; // sonuncu kapanmaz
    Haptics.selectionAsync();
    update({
      metrics: enabled
        ? [...prefs.metrics, key]
        : prefs.metrics.filter((m) => m !== key),
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
    >
      <Text style={[t.title, { marginBottom: 18 }]}>Ayarlar</Text>

      <Section title="BAĞLANTI">
        <Row
          label={prefs.demoMode ? 'Demo verileri' : host ?? 'Bağlantı bulunamadı'}
          sub={prefs.demoMode ? 'Hiçbir yere bağlı değilsiniz' : 'Supabase projesi'}
        />
        <Pressable onPress={confirmWipe} style={styles.dangerRow}>
          <Text style={[t.body, { color: colors.danger, fontSize: 15, fontWeight: '600' }]}>
            Bağlantıyı sil ve sıfırla
          </Text>
        </Pressable>
      </Section>

      <Section title="GÜVENLİK">
        <Row label="Face ID / parmak izi kilidi">
          <Switch
            value={prefs.biometricLock}
            onValueChange={toggleBiometric}
            trackColor={{ true: accentColor, false: colors.elevated }}
            thumbColor={colors.text}
          />
        </Row>
        <Text style={[t.caption, styles.securityNote]}>
          Bağlantı bilgileriniz ve oturumunuz yalnızca bu cihazın Keychain/Keystore’unda durur;
          verileriniz cihazınızdan çıkmaz.
        </Text>
      </Section>

      <Section title="ÖZETTE GÖSTER">
        {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
          <Row key={key} label={METRIC_LABELS[key]}>
            <Switch
              value={prefs.metrics.includes(key)}
              onValueChange={(v) => toggleMetric(key, v)}
              trackColor={{ true: accentColor, false: colors.elevated }}
              thumbColor={colors.text}
            />
          </Row>
        ))}
      </Section>

      <Section title="GÖRÜNÜM">
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
      </Section>

      <View style={styles.footer}>
        <Text style={t.caption}>supalytics v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Pressable onPress={() => Linking.openURL(GITHUB_URL)} hitSlop={8}>
          <Text style={[t.caption, { color: accentColor }]}>GitHub</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[t.label, styles.sectionTitle]}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[t.body, { fontSize: 15 }]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? <Text style={t.caption}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  dangerRow: {
    paddingVertical: 14,
  },
  securityNote: {
    paddingBottom: 12,
    lineHeight: 17,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  swatchOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
});
