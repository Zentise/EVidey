import { useThemeStore } from '../store/themeStore';
import { darkColors, lightColors, type ColorScheme } from '../constants/colors';

export interface ThemeContext {
  colors: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
}

export function useTheme(): ThemeContext {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return { colors: isDark ? darkColors : lightColors, isDark, toggleTheme };
}
