import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { T } from '@/lib/i18n';

// expo-router'ın Tabs'i bottom-tabs üzerine kurulu ve parmakla kaydırmayı
// desteklemiyor. material-top-tabs bir pager üzerinde çalıştığı için ekran
// parmağı takip eder; çubuk yine bizim GlassTabBar'ımız, altta yüzmeye devam
// ediyor. Kaydırma sırası aşağıdaki Screen sırasıdır.
const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
  return (
    // Sahne zemini şeffaf: kök düzendeki arka plan görseli sekmelerin altında görünür.
    <SwipeTabs
      tabBar={(props) => <GlassTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{ sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <SwipeTabs.Screen name="index" options={{ title: T.tabOverview }} />
      <SwipeTabs.Screen name="users" options={{ title: T.tabUsers }} />
      <SwipeTabs.Screen name="charts" options={{ title: T.tabCharts }} />
      <SwipeTabs.Screen name="settings" options={{ title: T.tabSettings }} />
    </SwipeTabs>
  );
}
