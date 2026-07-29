import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MetricCard } from '@/components/metric-card';
import { PulseDot } from '@/components/pulse-dot';
import { Sparkline } from '@/components/sparkline';
import {
  fetchActivity,
  fetchDauSeries,
  fetchDevices,
  fetchProviders,
  fetchSignupSeries,
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
  DeviceSlice,
  ProviderSlice,
  SeriesPoint,
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
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricSet = useMemo(() => new Set(prefs.metrics), [prefs.metrics]);

  // Yalnızca seçili metriklerin verisi çekilir: seçilmeyen metrik, kurulumda
  // SQL'i atlanmış olabilir — boşuna RPC hatası üretmeyelim.
  const load = useCallback(async () => {
    const jobs: Promise<void>[] = [fetchTotals().then(setTotals)];
    if (metricSet.has('active')) jobs.push(fetchDauSeries(30).then(setDau));
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
  }, [metricSet]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const delta = useMemo(() => {
    if (dau.length < 2) return null;
    return pctDelta(dau[dau.length - 1].users, dau[dau.length - 2].users);
  }, [dau]);

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
        />
        <MetricCard
          style={styles.half}
          label={T.cardEngagement}
          value={totals.mau > 0 ? `${Math.round((totals.dau / totals.mau) * 100)}%` : '—'}
          sub={T.cardEngagementSub}
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
        >
          <Sparkline data={signups.map((p) => p.users)} height={56} />
        </MetricCard>
        <MetricCard
          style={styles.half}
          label={T.cardTotalUsers}
          value={compact(totals.total_users)}
          sub={T.cardTotalUsersSub}
        />
        {metricSet.has('sessions') ? (
          <MetricCard
            style={styles.half}
            label={T.cardSessions}
            value={compact(sessionTotal)}
            sub={T.cardSessionsSub}
          />
        ) : null}
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

    const sessionsOnly = !metricSet.has('signups') && metricSet.has('sessions') && (
      <MetricCard
        key="sessions"
        style={styles.half}
        label={T.cardSessions}
        value={compact(sessionTotal)}
        sub={T.cardSessionsSub}
      />
    );

    const tail = (
      <View key="tail" style={styles.gridRowGroup}>
        {providerCard}
        {deviceCard}
        {sessionsOnly}
      </View>
    );

    if (prefs.focus === 'growth') {
      list.push(signupCards, activeCards, tail);
    } else {
      list.push(activeCards, signupCards, tail);
    }
    return list;
  }, [metricSet, prefs.focus, totals, signups, providers, devices]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />
      }
    >
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>supalytics</Text>
        {prefs.demoMode ? (
          <View style={styles.demoBadge}>
            <Text style={[t.caption, { color: colors.secondary }]}>{T.demoBadge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.hero}>
        <View style={styles.heroLabelRow}>
          <Text style={[t.label, styles.heroLabel]}>
            {heroIsActive ? T.heroActive : T.heroUsers}
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
      </View>

      {error ? (
        <Text style={[t.caption, { color: colors.danger, marginBottom: 12, lineHeight: 17 }]}>
          {error}
        </Text>
      ) : null}

      {cards}

      {metricSet.has('activity') && activity.length > 0 ? (
        <View style={styles.activityCard}>
          <Text style={[t.label, styles.activityTitle]}>{T.activityTitle}</Text>
          {activity.map((row, i) => (
            <View key={i} style={[styles.activityRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={[t.body, { fontSize: 14 }]} numberOfLines={1}>
                {row.email ?? T.unknownUser}
              </Text>
              <Text style={t.caption} numberOfLines={1}>
                {actionLabel(row.action)} · {deviceLabel(row.device)} · {timeAgo(row.created_at)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
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
  demoBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityTitle: {
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  activityRow: {
    paddingVertical: 10,
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
});
