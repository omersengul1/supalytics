import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Özet' }} />
      <Tabs.Screen name="users" options={{ title: 'Kullanıcılar' }} />
      <Tabs.Screen name="charts" options={{ title: 'Grafikler' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ayarlar' }} />
    </Tabs>
  );
}
