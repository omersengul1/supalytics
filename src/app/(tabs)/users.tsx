import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchUserDetail, fetchUsers } from '@/lib/api';
import { actionLabel, deviceLabel, providerGlyph, timeAgo } from '@/lib/format';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { needsHistory } from '@/lib/setup-sql';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { UserEvent, UserRow } from '@/lib/types';

const DAY_MS = 86_400_000;

export default function Users() {
  const { prefs } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      setRows(await fetchUsers(q));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : T.errUsersFetch);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, load]);

  const renderRow = ({ item }: { item: UserRow }) => {
    const activeToday =
      !!item.last_sign_in_at && Date.now() - new Date(item.last_sign_in_at).getTime() < DAY_MS;
    const initial = (item.email ?? '?').charAt(0).toUpperCase();
    return (
      <Pressable onPress={() => setSelected(item)} style={styles.row}>
        <View
          style={[
            styles.avatar,
            activeToday && { borderColor: accentColor, borderWidth: 1.5 },
          ]}
        >
          <Text style={[t.body, { fontWeight: '700', fontSize: 15 }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[t.body, { fontSize: 15 }]} numberOfLines={1}>
            {item.email ?? T.noEmail}
          </Text>
          <Text style={t.caption} numberOfLines={1}>
            {T.lastSeen(timeAgo(item.last_sign_in_at))}
          </Text>
        </View>
        <Text style={[t.caption, { color: colors.secondary, letterSpacing: 2 }]}>
          {item.providers.map(providerGlyph).join(' ')}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={[t.title, styles.header]}>{T.usersTitle}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={T.searchPlaceholder}
        placeholderTextColor={colors.tertiary}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />
      {error ? (
        <Text style={[t.caption, { color: colors.danger, paddingHorizontal: 20, marginBottom: 8 }]}>
          {error}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          ListEmptyComponent={
            <Text style={[t.caption, styles.empty]}>
              {query.trim() ? T.emptySearch : T.emptyUsers}
            </Text>
          }
        />
      )}
      <UserSheet
        user={selected}
        historyEnabled={needsHistory(prefs.metrics)}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

// Satıra dokununca açılan zaman çizelgesi sheet'i. Giriş geçmişi metrikleri
// hiç seçilmediyse (SQL'de arşiv yok) zaman çizelgesi yerine açıklama gösterir.
function UserSheet({
  user,
  historyEnabled,
  onClose,
}: {
  user: UserRow | null;
  historyEnabled: boolean;
  onClose: () => void;
}) {
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<UserEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !historyEnabled) return;
    setEvents(null);
    setError(null);
    fetchUserDetail(user.id, 50)
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : T.errHistoryFetch));
  }, [user, historyEnabled]);

  return (
    <Modal visible={!!user} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        <Text style={[t.body, { fontWeight: '700', fontSize: 17 }]} numberOfLines={1}>
          {user?.email ?? T.noEmail}
        </Text>
        <Text style={[t.caption, { marginTop: 2 }]}>
          {T.sheetJoined(user ? timeAgo(user.created_at) : '')} · {T.sheetProviders}:{' '}
          {user?.providers.join(', ') || '—'}
        </Text>
        <View style={styles.sheetDivider} />
        {!historyEnabled ? (
          <Text style={[t.caption, { lineHeight: 17, paddingBottom: 8 }]}>
            {T.sheetHistoryOff}
          </Text>
        ) : null}
        {error ? <Text style={[t.caption, { color: colors.danger }]}>{error}</Text> : null}
        {historyEnabled && !events && !error ? <ActivityIndicator color={accentColor} /> : null}
        {events ? (
          <FlatList
            data={events}
            keyExtractor={(_, i) => String(i)}
            style={{ maxHeight: 380 }}
            ListEmptyComponent={<Text style={t.caption}>{T.sheetEmpty}</Text>}
            renderItem={({ item }) => (
              <View style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: accentColor }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[t.body, { fontSize: 14 }]}>{actionLabel(item.action)}</Text>
                  <Text style={t.caption}>
                    {deviceLabel(item.device)}
                    {item.ip ? ` · ${item.ip}` : ''} · {timeAgo(item.created_at)}
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
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 48,
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
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: 14,
  },
  eventRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
});
