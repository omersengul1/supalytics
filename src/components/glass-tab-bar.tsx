import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, useTheme } from '@/lib/theme';

// SDK 57'de BottomTabBarProps `@react-navigation/bottom-tabs`ten import edilemiyor
// (expo-router vendorladı); tipi Tabs bileşeninden söküyoruz.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

// iOS 26 Liquid Glass henüz her istemcide (ör. Expo Go'nun derlendiği an bu native
// modülü içermiyorsa) yok — bu durumda native çağrı "Cannot find native module" fırlatır.
// Yakalayıp düz BlurView'a düşüyoruz; çökme yerine sessiz geri çekilme.
function safeIsLiquidGlassAvailable(): boolean {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

const ICONS: Record<string, { symbol: SFSymbol; fallback: string }> = {
  index: { symbol: 'chart.bar.fill', fallback: '▦' },
  users: { symbol: 'person.2.fill', fallback: '◉' },
  charts: { symbol: 'chart.xyaxis.line', fallback: '∿' },
  settings: { symbol: 'gearshape.fill', fallback: '⚙︎' },
};

export function GlassTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const glass = safeIsLiquidGlassAvailable();

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
            navigation.navigate(route.name, route.params);
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
      {glass ? (
        <GlassView style={styles.dock} glassEffectStyle="regular">
          {row}
        </GlassView>
      ) : (
        <View style={[styles.dock, styles.dockFallback]}>
          <BlurView
            tint="dark"
            intensity={50}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {row}
        </View>
      )}
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
    backgroundColor: 'rgba(20,23,28,0.72)',
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
