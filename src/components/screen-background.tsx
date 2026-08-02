import { Image, StyleSheet, View } from 'react-native';

import { colors } from '@/lib/theme';

// Uygulama arayüz arka planı: bulunduğu kabı doldurur ve dokunuşları geçirir.
// Kök düzende bir kez asılır; ekranlar kendi zeminlerini 'transparent' bırakarak
// üstünde çizilir. Görsel yüklenene kadar altta colors.bg durur, ilk karede
// zemin boş görünmez.
const SRC = require('../../assets/images/app-background.png');

export function ScreenBackground() {
  return (
    <View pointerEvents="none" style={styles.root}>
      <Image source={SRC} resizeMode="cover" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  // Genişlik/yükseklik açıkça verilmezse görsel doğal boyutunda çizilir (react-native-web
  // bunu böyle yapıyor) ve kabından taşar; %100 ile konumlandırma her iki platformda net.
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
