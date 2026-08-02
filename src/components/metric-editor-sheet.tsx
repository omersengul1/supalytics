import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardLabel, DEFAULT_CARD_ORDER, metricsForCards, type CardId } from '@/lib/cards';
import { T } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs-context';
import { colors, radius, type as t, useTheme } from '@/lib/theme';

const ROW_H = 52;

// Özet kartlarını düzenler: sürükleyerek sırala, anahtarla gizle/göster.
// Sürükleme RN'in kendi PanResponder'ı ile — üçüncü parti sürükleme kütüphaneleri
// Reanimated 4 ile henüz oynak, buradaki liste de sabit satır yüksekliğinde
// olduğu için basit bir hesap yetiyor.
//
// Yöntem "canlı sıralama": parmak bir satır boyu yol aldığında dizi anında
// yeniden diziliyor, sürüklenen satır da aradaki artık mesafe kadar kaydırılıyor.
// Böylece komşuları ayrıca animasyonlamak gerekmiyor.
export function MetricEditorSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { prefs, update } = usePrefs();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<CardId[]>(prefs.cards);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const committed = useRef(0);
  const offset = useRef(new Animated.Value(0)).current;
  // Parmak kalkarken güncel sırayı okumak için: setOrder güncelleyicisinin içinden
  // kaydetmek yan etki olurdu (React güncelleyiciyi iki kez çağırabilir).
  const orderRef = useRef(order);
  orderRef.current = order;

  // Sürükleme sırasında yerel sıra tek yetkili; dışarıdan (ör. ayarlar) gelen
  // değişiklikler yalnızca parmak kalkmışken içeri alınır.
  useEffect(() => {
    if (dragIndexRef.current === null) setOrder(prefs.cards);
  }, [prefs.cards]);

  const commit = (cards: CardId[]) => update({ cards, metrics: metricsForCards(cards) });

  const grant = (index: number) => {
    dragIndexRef.current = index;
    committed.current = 0;
    offset.setValue(0);
    setDragIndex(index);
    Haptics.selectionAsync();
  };

  const move = (dy: number) => {
    const from = dragIndexRef.current;
    if (from === null) return;
    const shift = Math.round((dy - committed.current) / ROW_H);
    if (shift !== 0) {
      const to = Math.max(0, Math.min(order.length - 1, from + shift));
      if (to !== from) {
        setOrder((prev) => {
          const next = [...prev];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return next;
        });
        committed.current += (to - from) * ROW_H;
        dragIndexRef.current = to;
        setDragIndex(to);
        Haptics.selectionAsync();
      }
    }
    offset.setValue(dy - committed.current);
  };

  const release = () => {
    if (dragIndexRef.current === null) return;
    dragIndexRef.current = null;
    committed.current = 0;
    offset.setValue(0);
    setDragIndex(null);
    commit(orderRef.current);
  };

  const setShown = (id: CardId, shown: boolean) => {
    if (!shown && order.length === 1) return; // en az bir kart açık kalmalı
    Haptics.selectionAsync();
    const next = shown ? [...order, id] : order.filter((c) => c !== id);
    setOrder(next);
    commit(next);
  };

  const hidden = DEFAULT_CARD_ORDER.filter((id) => !order.includes(id));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.headRow}>
          <Text style={t.title}>{T.editMetricsTitle}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={[t.label, { color: accentColor }]}>{T.done}</Text>
          </Pressable>
        </View>
        <Text style={[t.caption, styles.hint]}>{T.editMetricsHint}</Text>

        <ScrollView
          style={styles.list}
          scrollEnabled={dragIndex === null}
          showsVerticalScrollIndicator={false}
        >
          {order.map((id, i) => {
            const dragging = dragIndex === i;
            return (
              <Animated.View
                key={id}
                style={[
                  styles.row,
                  dragging && styles.rowDragging,
                  dragging && { transform: [{ translateY: offset }] },
                ]}
              >
                <DragHandle
                  onGrant={() => grant(i)}
                  onMove={move}
                  onRelease={release}
                  label={cardLabel(id)}
                />
                <Text style={[t.body, styles.rowLabel]} numberOfLines={1}>
                  {cardLabel(id)}
                </Text>
                <Switch
                  value
                  onValueChange={(v) => setShown(id, v)}
                  disabled={order.length === 1}
                  trackColor={{ true: accentColor, false: colors.elevated }}
                  thumbColor={colors.text}
                />
              </Animated.View>
            );
          })}

          {order.length === 1 ? (
            <Text style={[t.caption, styles.note]}>{T.metricsLastOne}</Text>
          ) : null}

          {hidden.length > 0 ? (
            <>
              <Text style={[t.label, styles.hiddenTitle]}>{T.metricsHiddenTitle}</Text>
              {hidden.map((id) => (
                <View key={id} style={styles.row}>
                  <View style={styles.handleSpacer} />
                  <Text style={[t.body, styles.rowLabel, { color: colors.secondary }]} numberOfLines={1}>
                    {cardLabel(id)}
                  </Text>
                  <Switch
                    value={false}
                    onValueChange={(v) => setShown(id, v)}
                    trackColor={{ true: accentColor, false: colors.elevated }}
                    thumbColor={colors.text}
                  />
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Sürükleme yalnızca tutamaçtan başlar: satırın geri kalanı ScrollView'a kalsın,
// listeyi kaydırmak isterken yanlışlıkla sıralama bozulmasın.
function DragHandle({
  onGrant,
  onMove,
  onRelease,
  label,
}: {
  onGrant: () => void;
  onMove: (dy: number) => void;
  onRelease: () => void;
  label: string;
}) {
  const cbs = useRef({ onGrant, onMove, onRelease });
  cbs.current = { onGrant, onMove, onRelease };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => cbs.current.onGrant(),
      onPanResponderMove: (_e, g) => cbs.current.onMove(g.dy),
      onPanResponderRelease: () => cbs.current.onRelease(),
      onPanResponderTerminate: () => cbs.current.onRelease(),
    }),
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityLabel={`${label} — ${T.dragToReorder}`}
      style={styles.handle}
    >
      <Text style={styles.handleGlyph}>≡</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.elevated,
    marginBottom: 14,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 6,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  // Sürüklenen satır komşularının üstünde kalmalı: iOS zIndex'e, Android
  // elevation'a bakıyor.
  rowDragging: {
    zIndex: 10,
    elevation: 10,
    backgroundColor: colors.elevated,
    borderRadius: radius.control,
    borderTopWidth: 0,
    paddingHorizontal: 6,
    marginHorizontal: -6,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  handle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.elevated,
  },
  handleSpacer: {
    width: 34,
  },
  handleGlyph: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },
  note: {
    paddingTop: 8,
    lineHeight: 16,
  },
  hiddenTitle: {
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 2,
  },
});
