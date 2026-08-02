import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, useTheme } from '@/lib/theme';

type TabBarProps = MaterialTopTabBarProps;

const ICONS: Record<string, { symbol: SFSymbol; fallback: string }> = {
  index: { symbol: 'chart.bar.fill', fallback: '▦' },
  users: { symbol: 'person.2.fill', fallback: '◉' },
  charts: { symbol: 'chart.xyaxis.line', fallback: '∿' },
  settings: { symbol: 'gearshape.fill', fallback: '⚙︎' },
};

export function GlassTabBar({ state, descriptors, navigation, jumpTo }: TabBarProps) {
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const row = (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icon = ICONS[route.name] ?? ICONS.index;
        const tint = focused ? accentColor : colors.tertiary;
        const { options } = descriptors[route.key];
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync();
            // jumpTo route.key bekler (içeride routes.findIndex(r => r.key === key)
            // yapıyor) — route.name geçilirse -1 bulur ve sessizce hiçbir şey olmaz.
            jumpTo(route.key);
          }
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.title ?? route.name}
            onPress={onPress}
            style={styles.tab}
            hitSlop={6}
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name={icon.symbol} size={22} tintColor={tint} />
            ) : (
              <Text style={[styles.fallbackIcon, { color: tint }]}>{icon.fallback}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
      <View style={[styles.dock, styles.dockFallback]}>
        <BlurView
          tint="dark"
          intensity={50}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {row}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    borderRadius: radius.dock,
    overflow: 'hidden',
  },
  dockFallback: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tab: {
    width: 60,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
});
