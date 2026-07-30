import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { UserProfileSheet } from '@/components/user-profile-sheet';
import { fetchUsers, USERS_PAGE_SIZE } from '@/lib/api';
import { providerGlyph, timeAgo } from '@/lib/format';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { UserRow } from '@/lib/types';

const DAY_MS = 86_400_000;

export default function Users() {
  const { prefs } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Son sayfa tam dolu geldiyse devamı olabilir; eksik geldiyse liste bitti.
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Yarış koruması: sorgu/proje değişince eski isteklerin sonucu düşer.
  const requestSeq = useRef(0);

  const load = useCallback(
    async (q: string) => {
      const seq = ++requestSeq.current;
      try {
        const page = await fetchUsers(q, 0);
        if (seq !== requestSeq.current) return;
        setRows(page);
        setHasMore(page.length === USERS_PAGE_SIZE);
        setError(null);
      } catch (e) {
        if (seq !== requestSeq.current) return;
        setError(e instanceof Error ? e.message : T.errUsersFetch);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    },
    [prefs.demoMode, prefs.activeProjectId],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, load]);

  // Sekmeye geri dönüldüğünde listeyi tazele. İlk odak, üstteki debounce
  // etkisiyle zaten yüklendiği için atlanır; query ref üzerinden okunur ki
  // yazarken (callback kimliği değişip) çifte istek atılmasın.
  const queryRef = useRef(query);
  queryRef.current = query;
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      load(queryRef.current);
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(queryRef.current);
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const page = await fetchUsers(query, rows.length);
      if (seq !== requestSeq.current) return;
      setRows((prev) => {
        // Aynı sayfanın iki kez eklenmesine karşı id bazlı süzgeç.
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...page.filter((r) => !seen.has(r.id))];
      });
      setHasMore(page.length === USERS_PAGE_SIZE);
    } catch {
      // sonraki sayfa alınamadıysa sessizce dur; çekmece tekrar denenebilir
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, query, rows.length]);

  const renderRow = ({ item }: { item: UserRow }) => {
    const activeToday =
      !!item.last_sign_in_at && Date.now() - new Date(item.last_sign_in_at).getTime() < DAY_MS;
    return (
      <Pressable onPress={() => setSelected(item)} style={styles.row}>
        <Avatar
          url={item.avatar_url}
          seed={item.name ?? item.email ?? '?'}
          size={40}
          ringColor={activeToday ? accentColor : undefined}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[t.body, { fontSize: 15 }]} numberOfLines={1}>
            {item.name ?? item.email ?? T.noEmail}
          </Text>
          <Text style={t.caption} numberOfLines={1}>
            {item.name && item.email ? `${item.email} · ` : ''}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
              colors={[accentColor]}
              progressBackgroundColor={colors.surface}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={accentColor} style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={[t.caption, styles.empty]}>
              {query.trim() ? T.emptySearch : T.emptyUsers}
            </Text>
          }
        />
      )}
      <UserProfileSheet
        target={
          selected
            ? {
                id: selected.id,
                email: selected.email,
                name: selected.name,
                avatar_url: selected.avatar_url,
              }
            : null
        }
        onClose={() => setSelected(null)}
      />
    </View>
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
  empty: {
    textAlign: 'center',
    marginTop: 48,
  },
});
