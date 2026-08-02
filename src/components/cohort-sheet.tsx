import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BottomSheet } from '@/components/bottom-sheet';
import { UserProfileSheet } from '@/components/user-profile-sheet';
import { fetchCohort } from '@/lib/api';
import { deviceLabel, timeAgo } from '@/lib/format';
import { T } from '@/lib/i18n';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { CohortKey, CohortUser, ProfileTarget } from '@/lib/types';

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
  const [profile, setProfile] = useState<ProfileTarget | null>(null);

  useEffect(() => {
    if (!cohort) return;
    setRows(null);
    setError(null);
    setProfile(null);
    fetchCohort(cohort, 200)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : T.errFetchGeneric));
  }, [cohort]);

  return (
    <BottomSheet
      visible={!!cohort}
      onClose={onClose}
      style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
    >
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
      {/* Yükleme kutusu listenin tipik boyunda: sayfa baştan gerçek boyuna yakın
          açılsın, veri düşünce boy sıçraması olmasın. Kalan fark BottomSheet'in
          layout geçişiyle akıyor. */}
      {!rows && !error ? (
        <View style={styles.loadingBody}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : null}
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
            <Pressable
              onPress={() =>
                setProfile({
                  id: item.user_id,
                  email: item.email,
                  name: item.name,
                  avatar_url: item.avatar_url,
                })
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
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
              <Text style={[t.caption, { color: colors.tertiary, fontSize: 16 }]}>›</Text>
            </Pressable>
          )}
        />
      ) : null}

      {/* İç içe modal: liste açıkken profil üstte açılır, kapatınca listeye dönülür. */}
      <UserProfileSheet target={profile} onClose={() => setProfile(null)} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
  loadingBody: {
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
});
