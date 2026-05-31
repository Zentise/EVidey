import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'evidey_theme';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,

  toggleTheme: async () => {
    const newVal = !get().isDark;
    set({ isDark: newVal });
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(newVal));
  },

  loadTheme: async () => {
    try {
      const raw = await AsyncStorage.getItem(THEME_KEY);
      if (raw !== null) set({ isDark: JSON.parse(raw) });
    } catch {}
  },
}));
