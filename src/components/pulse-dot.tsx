import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/theme';

// İmza öğesi: hero sayının yanında 1.6 sn periyotla nefes alan nokta ve
// genişleyen soluk halo. Uygulamadaki tek dekoratif animasyon budur.
export function PulseDot({ size = 10 }: { size?: number }) {
  const { accentColor } = useTheme();
  const progress = useSharedValue(0);
  // Animasyon ancak "reduce motion kapalı" bilgisi gelince başlar.
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 1.6 }],
    opacity: 0.35 * (1 - progress.value),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.12, 1]) }],
  }));

  const halo = size * 2;
  return (
    <View style={{ width: halo, height: halo, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: halo / 2, backgroundColor: accentColor },
          haloStyle,
        ]}
      />
      <Animated.View
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: accentColor }, dotStyle]}
      />
    </View>
  );
}
