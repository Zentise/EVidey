import { Tabs } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Text, StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan Trip',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Text style={{ fontSize: 20, color: color as string }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Text style={{ fontSize: 20, color: color as string }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    padding: 4,
    borderRadius: 8,
  },
  iconActive: {
    backgroundColor: `${Colors.primary}22`,
  },
});
