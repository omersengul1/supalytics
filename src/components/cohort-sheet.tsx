import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { fetchCohort } from '@/lib/api';
import { deviceLabel, timeAgo } from '@/lib/format';
import { T } from '@/lib/i18n';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { CohortKey, CohortUser } from '@/lib/types';

// Metrik kartına dokununca açılan detay: o sayıyı OLUŞTURAN kullanıcılar —
// kim, hangi cihazdan, en son ne zaman.
export function CohortSheet({
  cohort,
  onClose,
}: {
  cohort: CohortKey | null;
  onClose: () => void;
}) {
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<CohortUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cohort) return;
    setRows(null);
    setError(null);
    fetchCohort(cohort, 200)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : T.errFetchGeneric));
  }, [cohort]);

  return (
    <Modal visible={!!cohort} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        <View style={styles.headRow}>
          <Text style={[t.body, { fontWeight: '700', fontSize: 17, flex: 1 }]}>
            {cohort ? T.cohortTitles[cohort] : ''}
          </Text>
          {rows ? (
            <Text style={[t.caption, { color: accentColor, fontWeight: '700' }]}>
              {rows.length}
            </Text>
          ) : null}
        </View>
        {cohort ? (
          <Text style={[t.caption, { marginTop: 2, lineHeight: 16 }]}>
            {T.cohortHints[cohort]}
          </Text>
        ) : null}
        <View style={styles.divider} />
        {error ? <Text style={[t.caption, { color: colors.danger }]}>{error}</Text> : null}
        {!rows && !error ? <ActivityIndicator color={accentColor} style={{ marginVertical: 20 }} /> : null}
        {rows ? (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.user_id}
            style={{ maxHeight: 440 }}
            ListEmptyComponent={
              <Text style={[t.caption, { textAlign: 'center', marginVertical: 16 }]}>
                {T.cohortEmpty}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar url={item.avatar_url} seed={item.name ?? item.email ?? '?'} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[t.body, { fontSize: 14 }]} numberOfLines={1}>
                    {item.name ?? item.email ?? T.unknownUser}
                  </Text>
                  <Text style={t.caption} numberOfLines={1}>
                    {deviceLabel(item.device)} · {timeAgo(item.last_seen)}
                    {cohort !== 'signups' && item.events > 1
                      ? ` · ${T.topUserEvents(String(item.events))}`
                      : ''}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
});
