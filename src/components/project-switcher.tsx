import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t, useTheme } from '@/lib/theme';

// Üst bardaki proje hapı: dokununca alt sayfa açılır — projeler arasında
// geçiş, demo verilere dönüş ve yeni proje bağlama buradan.
export function ProjectSwitcher() {
  const { prefs, switchProject, switchToDemo } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const activeLabel = prefs.demoMode
    ? T.demoBadge
    : (prefs.projects.find((p) => p.id === prefs.activeProjectId)?.label ?? T.connNone);

  const pick = (fn: () => void) => {
    Haptics.selectionAsync();
    fn();
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={T.projectPickerTitle}
        style={({ pressed }) => [styles.pill, pressed && { opacity: 0.75 }]}
      >
        <Text style={[t.caption, { color: colors.secondary, flexShrink: 1 }]} numberOfLines={1}>
          {activeLabel}
        </Text>
        <Text style={[t.caption, { color: colors.tertiary }]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={[t.label, styles.sheetTitle]}>{T.projectPickerTitle}</Text>

          {prefs.projects.map((p) => {
            const active = !prefs.demoMode && p.id === prefs.activeProjectId;
            return (
              <Pressable
                key={p.id}
                onPress={() => pick(() => switchProject(p.id))}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.dot, { backgroundColor: active ? accentColor : colors.elevated }]} />
                <Text style={[t.body, { fontSize: 15, flex: 1 }]} numberOfLines={1}>
                  {p.label}
                </Text>
                {active ? <Text style={[t.caption, { color: accentColor }]}>✓</Text> : null}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => pick(switchToDemo)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.dot, { backgroundColor: prefs.demoMode ? accentColor : colors.elevated }]} />
            <Text style={[t.body, { fontSize: 15, flex: 1 }]}>{T.projectDemo}</Text>
            {prefs.demoMode ? <Text style={[t.caption, { color: accentColor }]}>✓</Text> : null}
          </Pressable>

          <Pressable
            onPress={() => pick(() => router.push('/add-project'))}
            style={({ pressed }) => [styles.row, styles.addRow, pressed && { opacity: 0.7 }]}
          >
            <Text style={[t.body, { color: accentColor, fontSize: 15, fontWeight: '600' }]}>
              ＋ {T.projectAdd}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Uzun proje adı + logo üst satırı taşırmasın: hap kısalır, etiket üç noktaya düşer.
    flexShrink: 1,
    maxWidth: 220,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.elevated,
    marginBottom: 14,
  },
  sheetTitle: {
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  addRow: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
