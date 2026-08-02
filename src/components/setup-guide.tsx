import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { T } from '@/lib/i18n';
import type { MetricKey } from '@/lib/prefs';
import { buildSetupSql, needsHistory } from '@/lib/setup-sql';
import { colors, radius, type as t, useTheme } from '@/lib/theme';

// Neden-SQL açıklaması + adımlar + kopyalanabilir script.
// Onboarding'in SQL adımı ve Ayarlar'daki "Kurulum SQL'i" aynı bileşeni kullanır.
// adminEmail verilirse (onboarding) script hazır üretilir: düzenleme adımı yoktur.
export function SetupGuide({
  metrics,
  adminEmail,
}: {
  metrics: MetricKey[];
  adminEmail?: string;
}) {
  const { accentColor } = useTheme();
  const sql = useMemo(() => buildSetupSql(metrics, adminEmail), [metrics, adminEmail]);
  const history = needsHistory(metrics);
  const steps = adminEmail ? T.sqlStepsEmbedded : T.sqlSteps;

  return (
    <View style={styles.wrap}>
      <View style={styles.whyCard}>
        {T.sqlWhy.map((p, i) => (
          <Text key={i} style={styles.whyText}>
            {p}
          </Text>
        ))}
        {history ? <Text style={styles.whyText}>{T.sqlWhyArchive}</Text> : null}
        <Text style={[styles.whyText, { color: colors.tertiary }]}>
          {T.sqlScopeNote(metrics.length)}
        </Text>
      </View>

      <Text style={[t.label, styles.stepsTitle]}>{T.sqlStepsTitle}</Text>
      {steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={[styles.stepNum, { color: accentColor }]}>{i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <Text style={[styles.pasteLabel, { color: accentColor }]}>{T.sqlPasteLabel}</Text>
      <CodeBlock code={sql} />
    </View>
  );
}

function CodeBlock({ code }: { code: string }) {
  const { accentColor } = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.codeCard}>
      <View style={styles.codeHeader}>
        <Text style={[t.caption, { letterSpacing: 1 }]}>setup.sql</Text>
        <Pressable
          onPress={copy}
          hitSlop={8}
          style={[styles.copyButton, copied && { borderColor: accentColor }]}
        >
          <Text style={[t.caption, { color: copied ? accentColor : colors.secondary }]}>
            {copied ? T.sqlCopied : T.sqlCopy}
          </Text>
        </Pressable>
      </View>
      <ScrollView style={styles.codeScroll} nestedScrollEnabled>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text selectable style={styles.code}>
            {code}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  whyCard: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 16,
    gap: 10,
  },
  whyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.secondary,
  },
  stepsTitle: {
    letterSpacing: 0.8,
    marginTop: 6,
    marginLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    width: 14,
    lineHeight: 19,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.secondary,
  },
  pasteLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 10,
  },
  codeCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
    marginTop: 6,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  copyButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeScroll: {
    maxHeight: 300,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text,
    padding: 14,
  },
});
