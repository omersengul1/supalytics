import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sparkline } from '@/components/sparkline';
import { fetchDauSeries, fetchDevices, fetchProviders, fetchSignupSeries } from '@/lib/api';
import { compact, deviceLabel, providerLabel, shortDate } from '@/lib/format';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { DeviceSlice, ProviderSlice, SeriesPoint } from '@/lib/types';

const RANGES = [7, 30, 90] as const;

export default function Charts() {
  const { prefs } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [dau, setDau] = useState<SeriesPoint[]>([]);
  const [signups, setSignups] = useState<SeriesPoint[]>([]);
  const [providers, setProviders] = useState<ProviderSlice[]>([]);
  const [devices, setDevices] = useState<DeviceSlice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricSet = useMemo(() => new Set(prefs.metrics), [prefs.metrics]);
  const anyChart =
    metricSet.has('active') ||
    metricSet.has('signups') ||
    metricSet.has('providers') ||
    metricSet.has('devices');

  // Seçilmeyen metriğin verisi çekilmez (SQL'i kurulmamış olabilir).
  // demoMode/activeProjectId bağımlılıkları: proje değişince yeniden yükle.
  const load = useCallback(
    async (range: number) => {
      const jobs: Promise<void>[] = [];
      if (metricSet.has('active')) jobs.push(fetchDauSeries(range).then(setDau));
      if (metricSet.has('signups')) jobs.push(fetchSignupSeries(range).then(setSignups));
      if (metricSet.has('providers')) jobs.push(fetchProviders().then(setProviders));
      if (metricSet.has('devices')) jobs.push(fetchDevices(range).then(setDevices));
      const results = await Promise.allSettled(jobs);
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      setError(
        failed
          ? failed.reason instanceof Error
            ? failed.reason.message
            : T.errFetchGeneric
          : null,
      );
    },
    [metricSet, prefs.demoMode, prefs.activeProjectId],
  );

  // Sekmeye her dönüşte (ve aralık/proje değişince) tazele.
  useFocusEffect(
    useCallback(() => {
      load(days);
    }, [days, load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(days);
    setRefreshing(false);
  }, [load, days]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
      refreshControl={
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
      <Text style={[t.title, { marginBottom: 14 }]}>{T.chartsTitle}</Text>

      <View style={styles.segment}>
        {RANGES.map((range) => {
          const active = range === days;
          return (
            <Pressable
              key={range}
              onPress={() => {
                if (!active) {
                  Haptics.selectionAsync();
                  setDays(range);
                }
              }}
              style={[styles.segmentItem, active && { backgroundColor: colors.elevated }]}
            >
              <Text style={[t.label, { color: active ? colors.text : colors.tertiary }]}>
                {T.rangeDays(range)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={[t.caption, { color: colors.danger, marginBottom: 12, lineHeight: 17 }]}>
          {error}
        </Text>
      ) : null}

      {!anyChart ? <Text style={[t.caption, { lineHeight: 17 }]}>{T.chartsAllOff}</Text> : null}

      {metricSet.has('active') ? (
        <SeriesCard title={T.chartDau} data={dau} height={140} />
      ) : null}
      {metricSet.has('signups') ? (
        <SeriesCard title={T.chartSignups} data={signups} height={100} />
      ) : null}

      {metricSet.has('providers') ? (
        <BreakdownCard
          title={T.chartProviders}
          rows={providers.map((p) => ({ label: providerLabel(p.provider), value: p.users }))}
          accentColor={accentColor}
        />
      ) : null}
      {metricSet.has('devices') ? (
        <BreakdownCard
          title={T.chartDevices}
          rows={devices.map((d) => ({ label: deviceLabel(d.device), value: d.sessions }))}
          accentColor={accentColor}
        />
      ) : null}
    </ScrollView>
  );
}

function SeriesCard({ title, data, height }: { title: string; data: SeriesPoint[]; height: number }) {
  return (
    <View style={styles.card}>
      <Text style={[t.label, styles.cardLabel]}>{title}</Text>
      {data.length > 0 ? (
        <>
          <Sparkline data={data.map((p) => p.users)} height={height} />
          <View style={styles.axisRow}>
            <Text style={t.caption}>{shortDate(data[0].day)}</Text>
            <Text style={t.caption}>{shortDate(data[data.length - 1].day)}</Text>
          </View>
        </>
      ) : (
        <Text style={t.caption}>{T.noData}</Text>
      )}
    </View>
  );
}

function BreakdownCard({
  title,
  rows,
  accentColor,
}: {
  title: string;
  rows: { label: string; value: number }[];
  accentColor: string;
}) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value ?? 0;
  return (
    <View style={styles.card}>
      <Text style={[t.label, styles.cardLabel]}>{title}</Text>
      {sorted.length === 0 ? (
        <Text style={t.caption}>{T.noData}</Text>
      ) : (
        sorted.map((row) => (
          <View key={row.label} style={styles.barBlock}>
            <View style={styles.barLabelRow}>
              <Text style={[t.body, { fontSize: 14 }]}>{row.label}</Text>
              <Text
                style={[
                  t.body,
                  { fontSize: 14, fontVariant: ['tabular-nums'], color: colors.secondary },
                ]}
              >
                {compact(row.value)}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: accentColor,
                    width: max > 0 ? `${Math.max(2, (row.value / max) * 100)}%` : '2%',
                  },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </View>
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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 3,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.control - 3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  cardLabel: {
    letterSpacing: 0.8,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barBlock: {
    gap: 6,
    marginBottom: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.elevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
