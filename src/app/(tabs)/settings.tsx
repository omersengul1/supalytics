import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetupGuide } from '@/components/setup-guide';
import { T } from '@/lib/i18n';
import { loadCredentials, wipeEverything, type MetricKey } from '@/lib/prefs';
import { usePrefs } from '@/lib/prefs-context';
import { projectHost, resetClient } from '@/lib/supabase';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

const GITHUB_URL = 'https://github.com/omersengul1/supalytics';
const METRIC_KEYS: MetricKey[] = ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'];

export default function Settings() {
  const { prefs, update, resetToDefaults } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();
  const [host, setHost] = useState<string | null>(null);
  const [sqlVisible, setSqlVisible] = useState(false);

  useEffect(() => {
    if (prefs.demoMode) {
      setHost(null);
      return;
    }
    loadCredentials().then((creds) => setHost(creds ? projectHost(creds.url) : null));
  }, [prefs.demoMode]);

  const confirmWipe = () => {
    Alert.alert(T.wipeTitle, T.wipeBody, [
      { text: T.cancel, style: 'cancel' },
      {
        text: T.wipeConfirm,
        style: 'destructive',
        onPress: async () => {
          await wipeEverything();
          resetClient();
          setAccent('supabase');
          resetToDefaults(); // setupDone=false → guard onboarding'e döndürür
        },
      },
    ]);
  };

  const toggleBiometric = async (next: boolean) => {
    if (!next) {
      update({ biometricLock: false });
      return;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
    if (!enrolled) {
      Alert.alert(T.bioUnavailableTitle, T.bioUnavailableBody);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: T.bioPrompt,
      cancelLabel: T.cancel,
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
      metrics: enabled ? [...prefs.metrics, key] : prefs.metrics.filter((m) => m !== key),
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
      <Text style={[t.title, { marginBottom: 18 }]}>{T.settingsTitle}</Text>

      <Section title={T.secConnection}>
        <Row
          label={prefs.demoMode ? T.connDemo : host ?? T.connNone}
          sub={prefs.demoMode ? T.connDemoSub : T.connProjectSub}
        />
        <Pressable onPress={() => setSqlVisible(true)}>
          <Row label={T.showSetupSql} sub={T.showSetupSqlSub}>
            <Text style={[t.body, { color: accentColor, fontSize: 18 }]}>›</Text>
          </Row>
        </Pressable>
        <Pressable onPress={confirmWipe} style={styles.dangerRow}>
          <Text style={[t.body, { color: colors.danger, fontSize: 15, fontWeight: '600' }]}>
            {T.wipe}
          </Text>
        </Pressable>
      </Section>

      <Section title={T.secSecurity}>
        <Row label={T.bioLabel}>
          <Switch
            value={prefs.biometricLock}
            onValueChange={toggleBiometric}
            trackColor={{ true: accentColor, false: colors.elevated }}
            thumbColor={colors.text}
          />
        </Row>
        <Text style={[t.caption, styles.securityNote]}>{T.securityNote}</Text>
      </Section>

      <Section title={T.secMetrics}>
        {METRIC_KEYS.map((key) => (
          <Row key={key} label={T.metricLabels[key]}>
            <Switch
              value={prefs.metrics.includes(key)}
              onValueChange={(v) => toggleMetric(key, v)}
              trackColor={{ true: accentColor, false: colors.elevated }}
              thumbColor={colors.text}
            />
          </Row>
        ))}
      </Section>

      <Section title={T.secAppearance}>
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
      </Section>

      <View style={styles.footer}>
        <Text style={t.caption}>supalytics v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <Pressable onPress={() => Linking.openURL(GITHUB_URL)} hitSlop={8}>
          <Text style={[t.caption, { color: accentColor }]}>GitHub</Text>
        </Pressable>
      </View>

      <Modal
        visible={sqlVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSqlVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={t.title}>{T.sqlModalTitle}</Text>
            <Pressable onPress={() => setSqlVisible(false)} hitSlop={10}>
              <Text style={[t.label, { color: accentColor }]}>{T.close}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <SetupGuide metrics={prefs.metrics} />
          </ScrollView>
        </View>
      </Modal>
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
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
