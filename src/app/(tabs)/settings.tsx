import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetupGuide } from '@/components/setup-guide';
import { T } from '@/lib/i18n';
import { wipeEverything, type MetricKey } from '@/lib/prefs';
import { usePrefs } from '@/lib/prefs-context';
import { resetClient } from '@/lib/supabase';
import { accents, colors, radius, type as t, useTheme, type AccentKey } from '@/lib/theme';

const GITHUB_URL = 'https://github.com/omersengul1/supalytics';
const METRIC_KEYS: MetricKey[] = ['active', 'signups', 'providers', 'devices', 'sessions', 'activity'];

export default function Settings() {
  const { prefs, update, resetToDefaults, removeProject, renameProject } = usePrefs();
  const { accent, accentColor, setAccent } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sqlVisible, setSqlVisible] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);

  const activeLabel = prefs.demoMode
    ? T.connDemo
    : (prefs.projects.find((p) => p.id === prefs.activeProjectId)?.label ?? T.connNone);

  const confirmRemoveProject = (id: string, label: string) => {
    Alert.alert(T.removeProjectTitle, T.removeProjectBody(label), [
      { text: T.cancel, style: 'cancel' },
      {
        text: T.removeProjectConfirm,
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeProject(id);
        },
      },
    ]);
  };

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
          label={activeLabel}
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

      <Section title={T.secProjects}>
        {prefs.projects.map((p) => {
          const active = !prefs.demoMode && p.id === prefs.activeProjectId;
          return (
            <Pressable key={p.id} onPress={() => setRenaming({ id: p.id, label: p.label })}>
              <Row label={p.label} sub={active ? T.projectActiveSub : T.projectRenameHint}>
                <Pressable
                  onPress={() => confirmRemoveProject(p.id, p.label)}
                  hitSlop={10}
                  accessibilityLabel={T.removeProjectTitle}
                >
                  <Text style={[t.body, { color: colors.danger, fontSize: 16 }]}>✕</Text>
                </Pressable>
              </Row>
            </Pressable>
          );
        })}
        <Pressable onPress={() => router.push('/add-project')}>
          <Row label={`＋ ${T.projectAdd}`} sub={T.projectAddSub}>
            <Text style={[t.body, { color: accentColor, fontSize: 18 }]}>›</Text>
          </Row>
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

      <RenameModal
        state={renaming}
        onClose={() => setRenaming(null)}
        onSave={(id, label) => {
          renameProject(id, label);
          setRenaming(null);
        }}
      />

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

// Çapraz-platform yeniden adlandırma diyaloğu (Alert.prompt yalnız iOS'ta var).
function RenameModal({
  state,
  onClose,
  onSave,
}: {
  state: { id: string; label: string } | null;
  onClose: () => void;
  onSave: (id: string, label: string) => void;
}) {
  const { accentColor } = useTheme();
  const [value, setValue] = useState('');

  // Modal her açılışta mevcut adla başlar.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (state && state.id !== openedFor) {
    setOpenedFor(state.id);
    setValue(state.label);
  }

  const save = () => {
    if (state && value.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave(state.id, value.trim());
    }
  };

  return (
    <Modal visible={!!state} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.renameBackdrop} onPress={onClose} />
      <View style={styles.renameCard}>
        <Text style={[t.body, { fontWeight: '700', fontSize: 16 }]}>{T.renameProjectTitle}</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={T.renameProjectPlaceholder}
          placeholderTextColor={colors.tertiary}
          autoFocus
          autoCorrect={false}
          maxLength={40}
          onSubmitEditing={save}
          returnKeyType="done"
          style={styles.renameInput}
        />
        <View style={styles.renameActions}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[t.label, { color: colors.secondary }]}>{T.cancel}</Text>
          </Pressable>
          <Pressable onPress={save} hitSlop={8} disabled={!value.trim()}>
            <Text style={[t.label, { color: accentColor, opacity: value.trim() ? 1 : 0.4 }]}>
              {T.renameProjectSave}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  renameBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  renameCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '32%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 18,
    gap: 14,
  },
  renameInput: {
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
  },
});
