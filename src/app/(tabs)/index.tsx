import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CohortSheet } from '@/components/cohort-sheet';
import { MetricCard } from '@/components/metric-card';
import { MetricEditorSheet } from '@/components/metric-editor-sheet';
import { UserProfileSheet } from '@/components/user-profile-sheet';
import { ProjectSwitcher } from '@/components/project-switcher';
import { PulseDot } from '@/components/pulse-dot';
import { Sparkline } from '@/components/sparkline';
import { Wordmark } from '@/components/wordmark';
import {
  fetchActivity,
  fetchDauSeries,
  fetchDevices,
  fetchProviders,
  fetchSignupSeries,
  fetchTopUsers,
  fetchTotals,
} from '@/lib/api';
import {
  actionLabel,
  compact,
  deviceLabel,
  pctDelta,
  providerLabel,
  timeAgo,
} from '@/lib/format';
import { metricsForCards, type CardId } from '@/lib/cards';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type {
  ActivityRow,
  CohortKey,
  DeviceSlice,
  ProfileTarget,
  ProviderSlice,
  SeriesPoint,
  TopUser,
  Totals,
} from '@/lib/types';

export default function Overview() {
  const { prefs } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [totals, setTotals] = useState<Totals | null>(null);
  const [dau, setDau] = useState<SeriesPoint[]>([]);
  const [signups, setSignups] = useState<SeriesPoint[]>([]);
  const [providers, setProviders] = useState<ProviderSlice[]>([]);
  const [devices, setDevices] = useState<DeviceSlice[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cohort, setCohort] = useState<CohortKey | null>(null);
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const [editing, setEditing] = useState(false);

  // Hangi verinin çekileceği görünen kartlardan türetilir: kapalı bir kartın
  // RPC'si hiç çağrılmaz (kurulumda o metriğin SQL'i atlanmış olabilir).
  const metricSet = useMemo(() => new Set(metricsForCards(prefs.cards)), [prefs.cards]);

  // Yalnızca seçili metriklerin verisi çekilir: seçilmeyen metrik, kurulumda
  // SQL'i atlanmış olabilir — boşuna RPC hatası üretmeyelim.
  // Bağımlılıklardaki demoMode/activeProjectId: proje değişince yeniden yükle.
  const load = useCallback(async () => {
    const jobs: Promise<void>[] = [fetchTotals().then(setTotals)];
    if (metricSet.has('active')) {
      jobs.push(fetchDauSeries(30).then(setDau));
      jobs.push(fetchTopUsers(30, 5).then(setTopUsers));
    }
    if (metricSet.has('signups')) jobs.push(fetchSignupSeries(30).then(setSignups));
    if (metricSet.has('providers')) jobs.push(fetchProviders().then(setProviders));
    if (metricSet.has('devices') || metricSet.has('sessions'))
      jobs.push(fetchDevices(30).then(setDevices));
    if (metricSet.has('activity')) jobs.push(fetchActivity(8).then(setActivity));

    const results = await Promise.allSettled(jobs);
    const firstError = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    setError(
      firstError
        ? firstError.reason instanceof Error
          ? firstError.reason.message
          : T.errFetchGeneric
        : null,
    );
  }, [metricSet, prefs.demoMode, prefs.activeProjectId]);

  // Sekmeye her dönüşte tazele; ekran açık kaldığı sürece 60 sn'de bir
  // kendini yeniler (RPC yanıtları KB mertebesinde — kotaya etkisi yok).
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 60_000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const delta = useMemo(() => {
    if (dau.length < 2) return null;
    return pctDelta(dau[dau.length - 1].users, dau[dau.length - 2].users);
  }, [dau]);

  // Haftalık büyüme: bu haftanın kayıtları vs önceki hafta.
  const growth = useMemo(() => {
    if (!totals || totals.new_prev_week <= 0) return null;
    return Math.round(((totals.new_week - totals.new_prev_week) / totals.new_prev_week) * 100);
  }, [totals]);

  // Hero seçime uyar: aktiflik izlenmiyorsa toplam kullanıcı gösterilir.
  const heroIsActive = metricSet.has('active');

  // Her kart kendi kimliğiyle ayrı bir düğüm; hangisinin çizileceğini ve hangi
  // sırayla çizileceğini prefs.cards belirler. Hepsi tek bir saran kaba akıyor:
  // yarım kartlar kendiliğinden eşleşiyor, tam genişlikte olanlar (grafikli kart
  // ve listeler) kendi satırını alıyor — yani kullanıcı sırayı değiştirdiğinde
  // düzen kendini yeniden topluyor, boş yer kalmıyor.
  const cardNodes = useMemo(() => {
    const map: Partial<Record<CardId, React.ReactNode>> = {};
    const topProvider = [...providers].sort((a, b) => b.users - a.users)[0];
    const providerTotal = providers.reduce((sum, p) => sum + p.users, 0);
    const topDevice = [...devices].sort((a, b) => b.sessions - a.sessions)[0];
    const sessionTotal = devices.reduce((sum, d) => sum + d.sessions, 0);
    const signupTotal = signups.reduce((sum, p) => sum + p.users, 0);

    if (totals) {
      map.weeklyActive = (
        <MetricCard
          key="weeklyActive"
          style={styles.half}
          label={T.cardWeeklyActive}
          value={compact(totals.wau)}
          sub={T.cardMonthSub(compact(totals.mau))}
          onPress={() => setCohort('wau')}
        />
      );
      map.engagement = (
        <MetricCard
          key="engagement"
          style={styles.half}
          label={T.cardEngagement}
          value={totals.mau > 0 ? `${Math.round((totals.dau / totals.mau) * 100)}%` : '—'}
          sub={T.cardEngagementSub}
        />
      );
      map.onlineNow = (
        <MetricCard
          key="onlineNow"
          style={styles.half}
          label={T.cardOnlineNow}
          value={compact(totals.online_now)}
          sub={T.cardOnlineNowSub}
          subTone="accent"
          onPress={() => setCohort('online')}
        />
      );
      map.loginsToday = (
        <MetricCard
          key="loginsToday"
          style={styles.half}
          label={T.cardLoginsToday}
          value={compact(totals.logins_today)}
          sub={T.cardLoginsTodaySub}
          onPress={() => setCohort('logins')}
        />
      );
      map.signups30 = (
        <MetricCard
          key="signups30"
          style={styles.full}
          label={T.cardSignups30}
          value={compact(signupTotal)}
          sub={T.cardSignupsSub(compact(totals.new_week), compact(totals.new_today))}
          subTone="accent"
          onPress={() => setCohort('signups')}
        >
          <Sparkline data={signups.map((p) => p.users)} height={56} />
        </MetricCard>
      );
      map.totalUsers = (
        <MetricCard
          key="totalUsers"
          style={styles.half}
          label={T.cardTotalUsers}
          value={compact(totals.total_users)}
          sub={T.cardTotalUsersSub}
        />
      );
      map.growth = (
        <MetricCard
          key="growth"
          style={styles.half}
          label={T.cardGrowth}
          value={growth === null ? '—' : `${growth >= 0 ? '+' : ''}${growth}%`}
          sub={T.cardGrowthSub(compact(totals.new_week), compact(totals.new_prev_week))}
          subTone={growth !== null && growth < 0 ? 'danger' : 'accent'}
        />
      );
      map.unconfirmed = (
        <MetricCard
          key="unconfirmed"
          style={styles.half}
          label={T.cardUnconfirmed}
          value={compact(totals.unconfirmed_users)}
          sub={T.cardUnconfirmedSub}
        />
      );
      map.mfa = (
        <MetricCard
          key="mfa"
          style={styles.half}
          label={T.cardMfa}
          value={compact(totals.mfa_users)}
          sub={T.cardMfaSub}
        />
      );
      map.openSessions = (
        <MetricCard
          key="openSessions"
          style={styles.half}
          label={T.cardOpenSessions}
          value={compact(totals.open_sessions)}
          sub={T.cardOpenSessionsSub}
        />
      );
      map.sessionCount = (
        <MetricCard
          key="sessionCount"
          style={styles.half}
          label={T.cardSessions}
          value={compact(sessionTotal)}
          sub={T.cardSessionsSub}
        />
      );
    }

    if (topProvider && providerTotal > 0)
      map.topProvider = (
        <MetricCard
          key="topProvider"
          style={styles.half}
          label={T.cardTopProvider}
          value={`${Math.round((topProvider.users / providerTotal) * 100)}%`}
          sub={providerLabel(topProvider.provider)}
        />
      );

    if (topDevice && sessionTotal > 0)
      map.topDevice = (
        <MetricCard
          key="topDevice"
          style={styles.half}
          label={T.cardTopDevice}
          value={`${Math.round((topDevice.sessions / sessionTotal) * 100)}%`}
          sub={deviceLabel(topDevice.device)}
        />
      );

    if (topUsers.length > 0)
      map.topUsers = (
        <View key="topUsers" style={[styles.listCard, styles.fullBlock]}>
          <Text style={[t.label, styles.listTitle]}>{T.topUsersTitle}</Text>
          {topUsers.map((u, i) => (
            <Pressable
              key={u.user_id}
              onPress={() =>
                setProfile({ id: u.user_id, email: u.email, name: u.name, avatar_url: u.avatar_url })
              }
              style={({ pressed }) => [
                styles.listRow,
                i === 0 && { borderTopWidth: 0 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Avatar url={u.avatar_url} seed={u.name ?? u.email ?? '?'} size={34} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[t.body, { fontSize: 14 }]} numberOfLines={1}>
                  {u.name ?? u.email ?? T.unknownUser}
                </Text>
                <Text style={t.caption} numberOfLines={1}>
                  {T.lastSeen(timeAgo(u.last_seen))}
                </Text>
              </View>
              <Text style={[t.caption, { color: accentColor, fontWeight: '700' }]}>
                {T.topUserEvents(compact(u.events))}
              </Text>
            </Pressable>
          ))}
        </View>
      );

    if (activity.length > 0)
      map.activity = (
        <View key="activity" style={[styles.listCard, styles.fullBlock]}>
          <Text style={[t.label, styles.listTitle]}>{T.activityTitle}</Text>
          {activity.map((row, i) => (
            <View key={i} style={[styles.listRow, i === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[t.body, { fontSize: 14 }]} numberOfLines={1}>
                  {row.email ?? T.unknownUser}
                </Text>
                <Text style={t.caption} numberOfLines={1}>
                  {actionLabel(row.action)} · {deviceLabel(row.device)} · {timeAgo(row.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );

    return map;
  }, [totals, signups, providers, devices, growth, topUsers, activity, accentColor]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
      refreshControl={
        // Android çemberi tintColor'ı okumaz (colors/progressBackgroundColor gerekir)
        // ve çentiğin altında kalmasın diye safe-area kadar aşağıdan başlar.
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={accentColor}
          colors={[accentColor]}
          progressBackgroundColor={colors.surface}
          progressViewOffset={insets.top}
        />
      }
    >
      <View style={styles.topRow}>
        <Wordmark height={34} />
        <ProjectSwitcher />
      </View>

      <Pressable
        style={styles.hero}
        disabled={!heroIsActive}
        onPress={() => setCohort('dau')}
        accessibilityRole={heroIsActive ? 'button' : undefined}
      >
        <View style={styles.heroLabelRow}>
          <Text style={[t.label, styles.heroLabel]}>
            {heroIsActive ? T.heroActive : T.heroUsers}
            {heroIsActive ? '  ›' : ''}
          </Text>
          <PulseDot />
        </View>
        <Text style={t.hero}>
          {totals ? compact(heroIsActive ? totals.dau : totals.total_users) : '—'}
        </Text>
        {heroIsActive && delta !== null ? (
          <Text style={[t.label, { color: delta >= 0 ? accentColor : colors.danger }]}>
            {T.deltaVsYesterday(`${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%`)}
          </Text>
        ) : null}
        {!heroIsActive && totals ? (
          <Text style={[t.label, { color: accentColor }]}>
            {T.newTodaySub(compact(totals.new_today))}
          </Text>
        ) : null}
      </Pressable>

      {error ? (
        <Text style={[t.caption, { color: colors.danger, marginBottom: 12, lineHeight: 17 }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.editRow}>
        <Text style={[t.label, styles.editTitle]}>{T.metricsSectionTitle}</Text>
        <Pressable
          onPress={() => setEditing(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={T.editMetricsTitle}
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={[t.caption, { color: accentColor, fontWeight: '700' }]}>
            {T.editMetrics}
          </Text>
        </Pressable>
      </View>

      <View style={styles.grid}>{prefs.cards.map((id) => cardNodes[id] ?? null)}</View>

      <CohortSheet cohort={cohort} onClose={() => setCohort(null)} />
      <UserProfileSheet target={profile} onClose={() => setProfile(null)} />
      <MetricEditorSheet visible={editing} onClose={() => setEditing(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  hero: {
    marginBottom: 28,
    gap: 4,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabel: {
    letterSpacing: 1.2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editTitle: {
    letterSpacing: 0.8,
  },
  editButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceGlass,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  // Tüm metrik blokları tek saran kapta akar: yarım kartlar eşleşir, tam
  // genişlikte olanlar (grafikli kart, listeler) kendi satırını alır.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fullBlock: {
    flexBasis: '100%',
  },
  half: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  full: {
    flexBasis: '100%',
  },
  listCard: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: {
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
});
