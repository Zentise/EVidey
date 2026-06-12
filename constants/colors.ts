export interface ColorScheme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryForeground: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  charger: string;
  route: string;
  overlay: string;
  cardShadow: string;
}

/** Light mode — default, clean & professional */
export const lightColors: ColorScheme = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  primaryForeground: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  charger: '#16A34A',
  route: '#2563EB',
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: '#64748B',
};

/** Dark mode — AMOLED-friendly, deep & refined */
export const darkColors: ColorScheme = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#052E16',
  primaryForeground: '#000000',
  background: '#090909',
  surface: '#141414',
  surfaceAlt: '#1C1C1C',
  surfaceElevated: '#1E1E1E',
  border: '#262626',
  borderLight: '#1C1C1C',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  charger: '#22C55E',
  route: '#60A5FA',
  overlay: 'rgba(0,0,0,0.7)',
  cardShadow: '#000000',
};

/** Backward-compat alias */
export const Colors = lightColors;
