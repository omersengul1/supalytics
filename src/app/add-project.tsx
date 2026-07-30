import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, PrimaryButton } from '@/components/form';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t } from '@/lib/theme';

// "Proje ekle" modalı: onboarding'deki bağlantı adımının bire bir karşılığı.
// Başarılı bağlantı projeyi listeye ekler, aktif yapar ve modalı kapatır.
export default function AddProject() {
  const { connectProject } = usePrefs();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connectProject({ url, anonKey, email, password, label });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : T.errConnectGeneric);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 18 : insets.top + 12 }]}>
        <Text style={t.title}>{T.addProjectTitle}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[t.label, { color: colors.secondary }]}>{T.close}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[t.caption, { lineHeight: 17 }]}>{T.addProjectIntro}</Text>
        <View style={styles.card}>
          <Text style={[t.label, styles.cardLabel]}>{T.whereFindTitle}</Text>
          <Text style={[t.caption, { lineHeight: 18, color: colors.secondary }]}>
            {T.whereFindBody}
          </Text>
        </View>
        <Field
          label={T.fieldProjectName}
          help={T.fieldProjectNameHelp}
          value={label}
          onChangeText={setLabel}
          placeholder={T.fieldProjectNamePlaceholder}
          maxLength={40}
        />
        <Field
          label={T.fieldUrl}
          help={T.fieldUrlHelp}
          value={url}
          onChangeText={setUrl}
          placeholder="https://xxxx.supabase.co"
          keyboardType="url"
        />
        <Field
          label={T.fieldAnon}
          help={T.fieldAnonHelp}
          value={anonKey}
          onChangeText={setAnonKey}
          placeholder="eyJhbGciOi… / sb_publishable_…"
        />
        <Field
          label={T.fieldEmail}
          help={T.fieldEmailHelp}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <Field
          label={T.fieldPassword}
          help={T.fieldPasswordHelp}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        {error ? (
          <Text style={[t.caption, { color: colors.danger, lineHeight: 17 }]}>{error}</Text>
        ) : (
          <Text style={[t.caption, { lineHeight: 17 }]}>{T.connectChecksAdmin}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={connecting ? T.connectVerifying : T.connectCta}
          onPress={handleConnect}
          disabled={connecting}
          loading={connecting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    letterSpacing: 0.8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
