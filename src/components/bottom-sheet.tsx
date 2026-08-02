import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Alt sayfaların ortak kabuğu.
//
// Modal'ın kendi animationType'ı bu işe uymuyor: "slide" saydam bir modalda
// KABIN TAMAMINI kaydırır, tam ekran karartı da dahil — ekranı aşağıdan yukarı
// süpüren bir karaltı görünürdü. "fade" ise sayfayı hiç hareket ettirmez.
// Doğrusu ikisini ayırmak: karartı yerinde açılır (opacity), sayfa aşağıdan
// kayar (translateY).
//
// Animasyon RN'in kendi Animated'ıyla sürülüyor. Reanimated'in entering/layout
// animasyonları burada denendi ama Modal portalının içinde kayıt olamayıp
// başlangıç durumunda donuyorlardı (sayfa ekran dışında, opacity 0 kalıyordu).
//
// Açılışın TEK parça olması sayfanın boyunun sabit olmasına bağlı: içerikten boy
// alan bir sayfa, verisi async geldiği için önce kısa hâliyle kayar, sonra boy
// değiştirirdi — "önce az açılıp sonra tamamlanma" hissi buradan gelir. Bu yüzden
// bu kabuğu kullanan sayfalar kendi stillerinde sabit yükseklik verir; buradaki
// ölçüm de bir kez oturur ve kaymanın mesafesini belirler.
const ENTER_MS = 260;
const EXIT_MS = 180;

export function BottomSheet({
  visible,
  onClose,
  style,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  /** Sayfanın kendi görünümü (zemin, köşe, dolgu, sabit yükseklik). */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: EXIT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, progress]);

  // Açılış ölçüm oturduktan sonra başlar: mesafe yanlış hesaplanıp sayfa yarı
  // yoldan gelmiş gibi görünmesin.
  useEffect(() => {
    if (!visible || !mounted || height <= 0) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, mounted, height, progress]);

  if (!mounted) return null;

  // Ölçüm gelmeden önceki ilk karede mesafe bilinmiyor; 0 verilseydi sayfa o
  // karede son konumunda görünüp sonra aşağı atlardı. Bir ekran boyu aşağıda
  // başlatmak bu kareyi de ekran dışında tutuyor.
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height || Dimensions.get('window').height, 0],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={[style, { transform: [{ translateY }] }]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
