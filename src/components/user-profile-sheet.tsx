import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Sparkline } from '@/components/sparkline';
import { fetchUserDetail, fetchUserProfile, fetchUserSessions } from '@/lib/api';
import { actionLabel, deviceLabel, providerLabel, timeAgo } from '@/lib/format';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { needsHistory } from '@/lib/setup-sql';
import { colors, radius, type as t, useTheme } from '@/lib/theme';
import type { ProfileTarget, UserEvent, UserProfile, UserSession } from '@/lib/types';

const DAY_MS = 86_400_000;

// Her listeden (kart detayları, en aktifler, Kullanıcılar sekmesi) açılan
// ortak kullanıcı profili: kimlik + rozetler + bilgiler + kişisel giriş
// yoğunluğu + açık oturumlar + uygulama verileri + tam log çizelgesi.
export function UserProfileSheet({
  target,
  onClose,
}: {
  target: ProfileTarget | null;
  onClose: () => void;
}) {
  const { prefs } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const historyEnabled = needsHistory(prefs.metrics);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[] | null>(null);
  const [events, setEvents] = useState<UserEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setProfile(null);
    setSessions(null);
    setEvents(null);
    setError(null);
    fetchUserProfile(target.id)
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : T.errFetchGeneric));
    fetchUserSessions(target.id)
      .then(setSessions)
      .catch(() => setSessions([]));
    if (historyEnabled) {
      fetchUserDetail(target.id, 200)
        .then(setEvents)
        .catch(() => setEvents([])); // profil yine gösterilir; log alınamadıysa boş kalır
    }
  }, [target, historyEnabled]);

  // Kişisel giriş yoğunluğu: çekilen olaylardan 30 günlük gün-bazlı histogram.
  const histogram = useMemo(() => {
    if (!events?.length) return null;
    const bins = new Array<number>(30).fill(0);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    for (const ev of events) {
      if (ev.action !== 'login' && ev.action !== 'token_refreshed') continue;
      const daysAgo = Math.floor((today.getTime() - new Date(ev.created_at).getTime()) / DAY_MS);
      if (daysAgo >= 0 && daysAgo < 30) bins[29 - daysAgo] += 1;
    }
    return bins.some((b) => b > 0) ? bins : null;
  }, [events]);

  const metaEntries = useMemo(() => {
    if (!profile?.metadata) return [];
    return Object.entries(profile.metadata)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .slice(0, 8);
  }, [profile]);

  // Başlık, profil yüklenene dek listeden gelen asgari kimlikle çizilir.
  const name = profile?.name ?? target?.name ?? null;
  const email = profile?.email ?? target?.email ?? null;
  const avatar = profile?.avatar_url ?? target?.avatar_url ?? null;

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <Avatar url={avatar} seed={name ?? email ?? '?'} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[t.body, { fontWeight: '700', fontSize: 18 }]} numberOfLines={1}>
                {name ?? email ?? T.noEmail}
              </Text>
              {name && email ? (
                <Text style={t.caption} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
              <View style={styles.badgeRow}>
                {profile?.banned ? <Badge label={T.badgeBanned} color={colors.danger} /> : null}
                {profile ? (
                  <Badge
                    label={profile.confirmed ? T.badgeConfirmed : T.badgeUnconfirmed}
                    color={profile.confirmed ? accentColor : colors.danger}
                  />
                ) : null}
                {profile?.mfa ? <Badge label={T.badgeMfa} color={accentColor} /> : null}
              </View>
            </View>
          </View>

          {error ? (
            <Text style={[t.caption, { color: colors.danger, marginTop: 12 }]}>{error}</Text>
          ) : null}
          {!profile && !error ? (
            <ActivityIndicator color={accentColor} style={{ marginVertical: 20 }} />
          ) : null}

          {profile ? (
            <View style={styles.factsGrid}>
              <Fact label={T.profileJoined} value={timeAgo(profile.created_at)} />
              <Fact label={T.profileLastSeen} value={timeAgo(profile.last_sign_in_at)} />
              <Fact label={T.profileDevice} value={deviceLabel(profile.device)} />
              <Fact label={T.profileSignins} value={String(profile.events_30d)} />
              {profile.phone ? <Fact label={T.profilePhone} value={profile.phone} /> : null}
              <Fact
                label={T.profileProviders}
                value={profile.providers.map(providerLabel).join(', ') || '—'}
                wide={!profile.phone}
              />
            </View>
          ) : null}
          {profile?.user_agent ? (
            // Ham istemci imzası: "Diğer" görünen platformların ne gönderdiği
            // buradan okunur (yeni kalıp bildirmek için birebir).
            <Text style={[t.caption, { marginTop: 8, fontSize: 10 }]} numberOfLines={2}>
              {profile.user_agent}
            </Text>
          ) : null}

          {histogram ? (
            <>
              <SectionTitle label={T.profileActivityTitle} />
              <View style={styles.sparkCard}>
                <Sparkline data={histogram} height={44} />
              </View>
            </>
          ) : null}

          {sessions && sessions.length > 0 ? (
            <>
              <SectionTitle label={T.profileSessionsTitle} />
              {sessions.slice(0, 6).map((s, i) => (
                <View key={i} style={styles.sessionRow}>
                  <Text style={[t.body, { fontSize: 14, fontWeight: '600' }]}>
                    {deviceLabel(s.device)}
                  </Text>
                  <Text style={[t.caption, { flex: 1 }]} numberOfLines={1}>
                    {s.ip ? `${s.ip} · ` : ''}
                    {timeAgo(s.last_active)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {metaEntries.length > 0 ? (
            <>
              <SectionTitle label={T.profileMetaTitle} />
              {metaEntries.map(([key, value]) => (
                <View key={key} style={styles.metaRow}>
                  <Text style={[t.caption, { letterSpacing: 0.4 }]}>{key}</Text>
                  <Text style={[t.body, { fontSize: 13, fontWeight: '600' }]} numberOfLines={1}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <SectionTitle label={T.profileTimelineTitle} />
          {!historyEnabled ? (
            <Text style={[t.caption, { lineHeight: 17, paddingVertical: 6 }]}>
              {T.sheetHistoryOff}
            </Text>
          ) : events === null ? (
            <ActivityIndicator color={accentColor} style={{ marginVertical: 14 }} />
          ) : events.length === 0 ? (
            <Text style={[t.caption, { paddingVertical: 6 }]}>{T.sheetEmpty}</Text>
          ) : (
            events.slice(0, 40).map((item, i) => (
              <View key={i} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: accentColor }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[t.body, { fontSize: 14 }]}>{actionLabel(item.action)}</Text>
                  <Text style={t.caption}>
                    {deviceLabel(item.device)}
                    {item.ip ? ` · ${item.ip}` : ''} · {timeAgo(item.created_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <>
      <View style={styles.divider} />
      <Text style={[t.label, { letterSpacing: 0.8, marginBottom: 6 }]}>{label}</Text>
    </>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[t.caption, { color, fontSize: 10, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.fact, wide && { flexBasis: '100%' }]}>
      <Text style={[t.caption, { letterSpacing: 0.6 }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      <Text style={[t.body, { fontSize: 14, fontWeight: '600' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.elevated,
    marginBottom: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  fact: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: 14,
  },
  sparkCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
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
