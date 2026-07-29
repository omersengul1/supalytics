import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

interface SparklineProps {
  data: number[];
  height?: number;
  strokeWidth?: number;
}

// Kendi genişliğini ölçen çizgi + gradyan alan. Chart kütüphanesi yok.
export function Sparkline({ data, height = 48, strokeWidth = 2 }: SparklineProps) {
  const { accentColor } = useTheme();
  const [width, setWidth] = useState(0);

  const pad = strokeWidth + 1;
  let line = '';
  let area = '';
  if (width > 0 && data.length > 0) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    const points = data.map((v, i) => {
      const x = data.length > 1 ? i * stepX : width / 2;
      const y = height - pad - ((v - min) / span) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    line = `M${points.join(' L')}`;
    area = `${line} L${width},${height} L0,${height} Z`;
  }

  return (
    <View style={{ height, width: '100%' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {line ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentColor} stopOpacity={0.25} />
              <Stop offset="1" stopColor={accentColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#sparkfill)" />
          <Path
            d={line}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}
