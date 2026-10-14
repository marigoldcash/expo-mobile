import { Tabs } from 'expo-router';

/** The open wallet's six places, along the bottom. */
export default function WalletTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 13 } }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarButtonTestID: 'tab-home' }} />
      <Tabs.Screen name="receive" options={{ title: 'Receive', tabBarButtonTestID: 'tab-receive' }} />
      <Tabs.Screen name="pay" options={{ title: 'Pay', tabBarButtonTestID: 'tab-pay' }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarButtonTestID: 'tab-history' }} />
      <Tabs.Screen name="backup" options={{ title: 'Backup', tabBarButtonTestID: 'tab-backup' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarButtonTestID: 'tab-settings' }} />
    </Tabs>
  );
}
