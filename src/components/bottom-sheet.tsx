import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

// Alt sayfaların ortak kabuğu.
//
// Modal'ın kendi animationType'ı bu işe uymuyor: "slide" saydam bir modalda
// KABIN TAMAMINI kaydırır, tam ekran karartı da dahil — ekranı aşağıdan yukarı
// süpüren bir karaltı görünürdü. "fade" ise sayfayı hiç hareket ettirmez.
// Doğrusu ikisini ayırmak: karartı yerinde açılır, sayfa aşağıdan kayar.
//
// İkinci mesele yükseklik: bu sayfaların içeriği async geliyor, sayfa önce
// yükleniyor hâliyle (kısa) açılıp veri düşünce boyuna sıçrıyordu — "önce az
// açılıp sonra tamamen açılma" hissi buradan geliyordu. LinearTransition
// yükseklik değişimini de animasyona bağlıyor, böylece açılış tek bir kesintisiz
// hareket olarak okunuyor. SlideInDown yüksekliği kendi ölçtüğü için ayrıca
// ölçüm tutmaya gerek yok.
//
// Çıkış animasyonunun oynayabilmesi için Modal, içerik sökülürken bir süre daha
// ayakta kalmalı: `mounted` bunun için, `visible` kapanınca EXIT_MS sonra iniyor.
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
  /** Sayfanın kendi görünümü (zemin, köşe, dolgu) — her ekran kendi stilini verir. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const id = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        {visible ? (
          <>
            <Animated.View
              entering={FadeIn.duration(ENTER_MS)}
              exiting={FadeOut.duration(EXIT_MS)}
              style={styles.backdrop}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onClose}
                accessibilityRole="button"
              />
            </Animated.View>
            <Animated.View
              entering={SlideInDown.duration(ENTER_MS).easing(Easing.out(Easing.cubic))}
              exiting={SlideOutDown.duration(EXIT_MS).easing(Easing.in(Easing.cubic))}
              layout={LinearTransition.duration(ENTER_MS).easing(Easing.out(Easing.cubic))}
              style={style}
            >
              {children}
            </Animated.View>
          </>
        ) : null}
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
