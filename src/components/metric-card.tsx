import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type as t, useTheme } from '@/lib/theme';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'default' | 'accent' | 'danger';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Verilirse kart dokunulabilir olur (detay listesi açmak için). */
  onPress?: () => void;
}

// Mat içerik kartı: cam yalnızca navigasyonda, kartlar sakin durur.
export function MetricCard({
  label,
  value,
  sub,
  subTone = 'default',
  style,
  children,
  onPress,
}: MetricCardProps) {
  const { accentColor } = useTheme();
  const subColor =
    subTone === 'accent' ? accentColor : subTone === 'danger' ? colors.danger : colors.tertiary;
  const body = (
    <>
      <Text style={[t.label, styles.label]} numberOfLines={1}>
        {label}
        {onPress ? '  ›' : ''}
      </Text>
      <Text style={t.metric} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={[t.caption, { color: subColor }]} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
      {children}
    </>
  );
  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.75 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    padding: 16,
    gap: 6,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
