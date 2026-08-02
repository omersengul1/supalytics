import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { T } from '@/lib/i18n';

export default function TabsLayout() {
  return (
    // Sahne zemini şeffaf: kök düzendeki arka plan görseli sekmelerin altında görünür.
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: T.tabOverview }} />
      <Tabs.Screen name="users" options={{ title: T.tabUsers }} />
      <Tabs.Screen name="charts" options={{ title: T.tabCharts }} />
      <Tabs.Screen name="settings" options={{ title: T.tabSettings }} />
    </Tabs>
  );
}
