import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

// Profil fotoğrafı varsa onu, yoksa (veya yüklenemezse) deterministik renkli
// bir baş harf dairesi gösterir. Demo modda url hep null'dır — ağ trafiği yok.

const PALETTE = ['#3ECF8E', '#7DD3FC', '#A78BFA', '#FBBF24', '#F87171', '#34D399', '#F472B6'];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function Avatar({
  url,
  seed,
  size = 40,
  ringColor,
}: {
  url: string | null;
  /** Baş harf + renk bunun üstünden türetilir (isim ya da e-posta). */
  seed: string;
  size?: number;
  ringColor?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (seed.trim().charAt(0) || '?').toUpperCase();
  const bg = hashColor(seed);
  const showImage = !!url && !failed;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: showImage ? colors.elevated : bg + '2E',
        },
        ringColor ? { borderColor: ringColor, borderWidth: 1.5 } : null,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={120}
          recyclingKey={url}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: bg, fontSize: size * 0.42, fontWeight: '700' }}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
