import { Image, type ImageStyle, type StyleProp } from 'react-native';

// Marka yazısı. Kaynak "logo text.png" 1920×1920 tuvalin ortasında duran ince bir
// şerit; wordmark.png onun mürekkebine kırpılmış hâli — bu yüzden tek bir height
// değeri düzeni belirlemeye yeter, kaynaktaki boşluğu telafi etmek gerekmez.
const SRC = require('../../assets/images/wordmark.png');
const ASPECT = 726 / 145;

export function Wordmark({
  height = 20,
  style,
}: {
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={SRC}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="supalytics"
      style={[{ width: Math.round(height * ASPECT), height }, style]}
    />
  );
}
