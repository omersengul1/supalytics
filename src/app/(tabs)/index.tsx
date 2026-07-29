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

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchTotals(),
      fetchDauSeries(30),
      fetchSignupSeries(30),
      fetchProviders(),
      fetchDevices(30),
      fetchActivity(8),
    ]);
    const [rTotals, rDau, rSignups, rProviders, rDevices, rActivity] = results;
    if (rTotals.status === 'fulfilled') setTotals(rTotals.value);
    if (rDau.status === 'fulfilled') setDau(rDau.value);
    if (rSignups.status === 'fulfilled') setSignups(rSignups.value);
    if (rProviders.status === 'fulfilled') setProviders(rProviders.value);
    if (rDevices.status === 'fulfilled') setDevices(rDevices.value);
    if (rActivity.status === 'fulfilled') setActivity(rActivity.value);
    const firstError = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    setError(
      firstError
        ? firstError.reason instanceof Error
          ? firstError.reason.message
          : 'Veriler alınamadı.'
        : null,
    );
  }, []);

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

  const cards = useMemo(() => {
    const list: React.ReactNode[] = [];
    const metricSet = new Set(prefs.metrics);
    const topProvider = [...providers].sort((a, b) => b.users - a.users)[0];
    const providerTotal = providers.reduce((sum, p) => sum + p.users, 0);
    const topDevice = [...devices].sort((a, b) => b.sessions - a.sessions)[0];
    const sessionTotal = devices.reduce((sum, d) => sum + d.sessions, 0);
    const signupTotal = signups.reduce((sum, p) => sum + p.users, 0);

    const activeCards = metricSet.has('active') && totals && (
      <View key="active" style={styles.gridRowGroup}>
        <MetricCard
          style={styles.half}
          label="Haftalık aktif"
          value={compact(totals.wau)}
          sub={`Ay: ${compact(totals.mau)}`}
        />
        <MetricCard
          style={styles.half}
          label="Bağlılık"
          value={totals.mau > 0 ? `${Math.round((totals.dau / totals.mau) * 100)}%` : '—'}
          sub="DAU / MAU"
        />
      </View>
    );

    const signupCards = metricSet.has('signups') && totals && (
      <View key="signups" style={styles.gridRowGroup}>
        <MetricCard
          style={styles.full}
          label="Yeni kayıtlar · 30 gün"
          value={compact(signupTotal)}
          sub={`+${compact(totals.new_week)} bu hafta · +${compact(totals.new_today)} bugün`}
          subTone="accent"
        >
          <Sparkline data={signups.map((p) => p.users)} height={56} />
        </MetricCard>
        <MetricCard
          style={styles.half}
          label="Kayıtlı kullanıcı"
          value={compact(totals.total_users)}
          sub="toplam hesap"
        />
        {metricSet.has('sessions') ? (
          <MetricCard
            style={styles.half}
            label="Oturumlar"
            value={compact(sessionTotal)}
            sub="30 günde"
          />
        ) : null}
      </View>
    );

    const providerCard = metricSet.has('providers') && topProvider && providerTotal > 0 && (
      <MetricCard
        key="providers"
        style={styles.half}
        label="En çok sağlayıcı"
        value={`${Math.round((topProvider.users / providerTotal) * 100)}%`}
        sub={providerLabel(topProvider.provider)}
      />
    );

    const deviceCard = metricSet.has('devices') && topDevice && sessionTotal > 0 && (
      <MetricCard
        key="devices"
        style={styles.half}
        label="En çok cihaz"
        value={`${Math.round((topDevice.sessions / sessionTotal) * 100)}%`}
        sub={deviceLabel(topDevice.device)}
      />
    );

    const sessionsOnly = !metricSet.has('signups') && metricSet.has('sessions') && (
      <MetricCard
        key="sessions"
        style={styles.half}
        label="Oturumlar"
        value={compact(sessionTotal)}
        sub="30 günde"
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
  }, [prefs.metrics, prefs.focus, totals, signups, providers, devices]);

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
            <Text style={[t.caption, { color: colors.secondary }]}>DEMO</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.hero}>
        <View style={styles.heroLabelRow}>
          <Text style={[t.label, styles.heroLabel]}>BUGÜN AKTİF</Text>
          <PulseDot />
        </View>
        <Text style={t.hero}>{totals ? compact(totals.dau) : '—'}</Text>
        {delta !== null ? (
          <Text
            style={[
              t.label,
              { color: delta >= 0 ? accentColor : colors.danger },
            ]}
          >
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% düne göre
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text style={[t.caption, { color: colors.danger, marginBottom: 12 }]}>{error}</Text>
      ) : null}

      {cards}

      {prefs.metrics.includes('activity') && activity.length > 0 ? (
        <View style={styles.activityCard}>
          <Text style={[t.label, styles.activityTitle]}>SON HAREKETLER</Text>
          {activity.map((row, i) => (
            <View key={i} style={[styles.activityRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={[t.body, { fontSize: 14 }]} numberOfLines={1}>
                {row.email ?? 'bilinmeyen kullanıcı'}
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
