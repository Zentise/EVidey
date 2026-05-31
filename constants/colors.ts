export interface ColorScheme {
  primary: string;
  primaryDark: string;
  primaryForeground: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  charger: string;
  route: string;
}

/** Dark AMOLED — true black + eco green */
export const darkColors: ColorScheme = {
  primary: '#00C853',
  primaryDark: '#009624',
  primaryForeground: '#000000',
  background: '#000000',
  surface: '#0D0D0D',
  surfaceAlt: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#9E9E9E',
  textMuted: '#555555',
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF1744',
  charger: '#00C853',
  route: '#448AFF',
};

/** Light AMOLED — pure white + eco green */
export const lightColors: ColorScheme = {
  primary: '#00A846',
  primaryDark: '#007E33',
  primaryForeground: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceAlt: '#EEEEEE',
  border: '#E0E0E0',
  text: '#000000',
  textSecondary: '#616161',
  textMuted: '#9E9E9E',
  success: '#00A846',
  warning: '#FF8F00',
  error: '#C62828',
  charger: '#00A846',
  route: '#1565C0',
};

/** Backward-compat alias — theme-aware code uses useTheme() hook */
export const Colors = darkColors;
