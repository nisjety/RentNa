/**
 * Rent Nå design tokens — Scandinavian editorial.
 * Quiet luxury · warm off-whites · soft surfaces · restrained accents.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F7F5F1',
    surface: '#FFFFFF',
    surfaceMuted: '#ECE8E1',
    surfaceSelected: '#E5DFD2',
    backgroundElement: '#ECE8E1',
    backgroundSelected: '#E5DFD2',
    text: '#172713',
    textSecondary: '#847267',
    textMuted: '#A89F92',
    accent: '#F1DD38',
    accentText: '#172713',
    info: '#7D97A8',
    infoSoft: '#E2EAEF',
    infoText: '#5A7B91',
    warmTaupe: '#847267',
    border: 'rgba(23, 39, 19, 0.08)',
    divider: 'rgba(23, 39, 19, 0.06)',
    shadow: 'rgba(23, 39, 19, 0.06)',
    pillBg: '#E2EAEF',
    pillText: '#5A7B91',
  },
  dark: {
    background: '#0E0D0B',
    surface: '#1A1916',
    surfaceMuted: '#211F1B',
    surfaceSelected: '#2A2722',
    backgroundElement: '#211F1B',
    backgroundSelected: '#2A2722',
    text: '#F5F2EC',
    textSecondary: '#A89F92',
    textMuted: '#6B6358',
    accent: '#F1DD38',
    accentText: '#172713',
    info: '#7D97A8',
    infoSoft: 'rgba(125, 151, 168, 0.18)',
    infoText: '#A8C3D4',
    warmTaupe: '#A89F92',
    border: 'rgba(245, 242, 236, 0.08)',
    divider: 'rgba(245, 242, 236, 0.06)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    pillBg: 'rgba(125, 151, 168, 0.18)',
    pillText: '#A8C3D4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  none: 0,
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  ten: 48,
  twelve: 64,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const Typography = {
  display:    { fontSize: 26, lineHeight: 31, fontWeight: '700' as const, letterSpacing: -0.6 },
  title:      { fontSize: 22, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.5 },
  headline:   { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  subhead:    { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  body:       { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.1 },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, letterSpacing: -0.1 },
  callout:    { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: -0.1 },
  caption:    { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing:  0   },
  micro:      { fontSize: 10, lineHeight: 13, fontWeight: '600' as const, letterSpacing:  0.3 },
};

export const Shadow = {
  soft: Platform.select({
    ios: {
      shadowColor: '#172713',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
    },
    android: { elevation: 2 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#172713',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
    },
    android: { elevation: 4 },
    default: {},
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 60 }) ?? 0;
export const MaxContentWidth = 800;
