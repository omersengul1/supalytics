import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, type as t, useTheme } from '@/lib/theme';

// Onboarding'in bağlantı adımı ile "proje ekle" ekranının ortak form parçaları.

export function Field({
  label,
  help,
  ...inputProps
}: { label: string; help?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={t.label}>{label}</Text>
      <TextInput
        {...inputProps}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.tertiary}
        style={styles.input}
      />
      {help ? <Text style={[t.caption, { lineHeight: 15 }]}>{help}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { accentColor } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: accentColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  primary: {
    height: 52,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});
