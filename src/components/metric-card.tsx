import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type as t, useTheme } from '@/lib/theme';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  subTone?: 'default' | 'accent' | 'danger';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Mat içerik kartı: cam yalnızca navigasyonda, kartlar sakin durur.
export function MetricCard({ label, value, sub, subTone = 'default', style, children }: MetricCardProps) {
  const { accentColor } = useTheme();
  const subColor =
    subTone === 'accent' ? accentColor : subTone === 'danger' ? colors.danger : colors.tertiary;
  return (
    <View style={[styles.card, style]}>
      <Text style={[t.label, styles.label]} numberOfLines={1}>
        {label}
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
    </View>
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
