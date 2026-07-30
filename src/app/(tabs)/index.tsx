import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CohortSheet } from '@/components/cohort-sheet';
import { MetricCard } from '@/components/metric-card';
import { UserProfileSheet } from '@/components/user-profile-sheet';
import { ProjectSwitcher } from '@/components/project-switcher';
import { PulseDot } from '@/components/pulse-dot';
import { Sparkline } from '@/components/sparkline';
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

  const metricSet = useMemo(() => new Set(prefs.metrics), [prefs.metrics]);

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

  const cards = useMemo(() => {
    const list: React.ReactNode[] = [];
    const topProvider = [...providers].sort((a, b) => b.users - a.users)[0];
    const providerTotal = providers.reduce((sum, p) => sum + p.users, 0);
    const topDevice = [...devices].sort((a, b) => b.sessions - a.sessions)[0];
    const sessionTotal = devices.reduce((sum, d) => sum + d.sessions, 0);
    const signupTotal = signups.reduce((sum, p) => sum + p.users, 0);

    const activeCards = metricSet.has('active') && totals && (
      <View key="active" style={styles.gridRowGroup}>
        <MetricCard
          style={styles.half}
          label={T.cardWeeklyActive}
          value={compact(totals.wau)}
          sub={T.cardMonthSub(compact(totals.mau))}
          onPress={() => setCohort('wau')}
        />
        <MetricCard
          style={styles.half}
          label={T.cardEngagement}
          value={totals.mau > 0 ? `${Math.round((totals.dau / totals.mau) * 100)}%` : '—'}
          sub={T.cardEngagementSub}
        />
        <MetricCard
          style={styles.half}
          label={T.cardOnlineNow}
          value={compact(totals.online_now)}
          sub={T.cardOnlineNowSub}
          subTone="accent"
          onPress={() => setCohort('online')}
        />
        <MetricCard
          style={styles.half}
          label={T.cardLoginsToday}
          value={compact(totals.logins_today)}
          sub={T.cardLoginsTodaySub}
          onPress={() => setCohort('logins')}
        />
      </View>
    );

    const signupCards = metricSet.has('signups') && totals && (
      <View key="signups" style={styles.gridRowGroup}>
        <MetricCard
          style={styles.full}
          label={T.cardSignups30}
          value={compact(signupTotal)}
          sub={T.cardSignupsSub(compact(totals.new_week), compact(totals.new_today))}
          subTone="accent"
          onPress={() => setCohort('signups')}
        >
          <Sparkline data={signups.map((p) => p.users)} height={56} />
        </MetricCard>
        <MetricCard
          style={styles.half}
          label={T.cardTotalUsers}
          value={compact(totals.total_users)}
          sub={T.cardTotalUsersSub}
        />
        <MetricCard
          style={styles.half}
          label={T.cardGrowth}
          value={growth === null ? '—' : `${growth >= 0 ? '+' : ''}${growth}%`}
          sub={T.cardGrowthSub(compact(totals.new_week), compact(totals.new_prev_week))}
          subTone={growth !== null && growth < 0 ? 'danger' : 'accent'}
        />
        <MetricCard
          style={styles.half}
          label={T.cardUnconfirmed}
          value={compact(totals.unconfirmed_users)}
          sub={T.cardUnconfirmedSub}
        />
        <MetricCard
          style={styles.half}
          label={T.cardMfa}
          value={compact(totals.mfa_users)}
          sub={T.cardMfaSub}
        />
      </View>
    );

    const sessionCards = metricSet.has('sessions') && totals && (
      <View key="sessions" style={styles.gridRowGroup}>
        <MetricCard
          style={styles.half}
          label={T.cardOpenSessions}
          value={compact(totals.open_sessions)}
          sub={T.cardOpenSessionsSub}
        />
        <MetricCard
          style={styles.half}
          label={T.cardSessions}
          value={compact(sessionTotal)}
          sub={T.cardSessionsSub}
        />
      </View>
    );

    const providerCard = metricSet.has('providers') && topProvider && providerTotal > 0 && (
      <MetricCard
        key="providers"
        style={styles.half}
        label={T.cardTopProvider}
        value={`${Math.round((topProvider.users / providerTotal) * 100)}%`}
        sub={providerLabel(topProvider.provider)}
      />
    );

    const deviceCard = metricSet.has('devices') && topDevice && sessionTotal > 0 && (
      <MetricCard
        key="devices"
        style={styles.half}
        label={T.cardTopDevice}
        value={`${Math.round((topDevice.sessions / sessionTotal) * 100)}%`}
        sub={deviceLabel(topDevice.device)}
      />
    );

    const tail = (providerCard || deviceCard) && (
      <View key="tail" style={styles.gridRowGroup}>
        {providerCard}
        {deviceCard}
      </View>
    );

    list.push(activeCards, signupCards, sessionCards, tail);
    return list;
  }, [metricSet, totals, signups, providers, devices, growth]);

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
        <Text style={styles.wordmark}>supalytics</Text>
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

      {cards}

      {metricSet.has('active') && topUsers.length > 0 ? (
        <View style={styles.listCard}>
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
      ) : null}

      {metricSet.has('activity') && activity.length > 0 ? (
        <View style={[styles.listCard, { marginTop: 12 }]}>
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
      ) : null}

      <CohortSheet cohort={cohort} onClose={() => setCohort(null)} />
      <UserProfileSheet target={profile} onClose={() => setProfile(null)} />
    </ScrollView>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  wordmark: {
    ...t.caption,
    color: colors.tertiary,
    letterSpacing: 3,
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
  gridRowGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  half: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  full: {
    flexBasis: '100%',
  },
  listCard: {
    backgroundColor: colors.surface,
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
