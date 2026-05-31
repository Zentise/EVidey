import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import type { ColorValue } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { darkColors, lightColors } from '../../../constants/colors';

export default function TabsLayout() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors = isDark ? darkColors : lightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }: { color: ColorValue }) => (
            <Text style={{ fontSize: 20, color: color as string }}>🔖</Text>
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
