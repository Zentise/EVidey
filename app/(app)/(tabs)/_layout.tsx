import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import type { ColorValue } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { darkColors, lightColors } from '../../../constants/colors';

function TabIcon({ emoji, label, focused, colors }: {
  emoji: string; label: string; focused: boolean; colors: typeof lightColors;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10, fontWeight: focused ? '700' : '500',
        color: focused ? colors.primary : colors.textMuted,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const isDark = useThemeStore(s => s.isDark);
  const colors = isDark ? darkColors : lightColors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 4,
          paddingTop: 4,
          elevation: 0,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon emoji="⚡" label="Plan" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon emoji="🔖" label="Saved" focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}
