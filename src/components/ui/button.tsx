import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  leftSlot,
  rightSlot,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const palette =
    variant === 'primary'
      ? { bg: theme.accent, fg: theme.accentText }
      : variant === 'dark'
        ? { bg: theme.text, fg: theme.background }
        : variant === 'secondary'
          ? { bg: theme.surfaceMuted, fg: theme.text }
          : { bg: 'transparent', fg: theme.text };

  const sizing = SIZE_TOKENS[size];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          paddingVertical: sizing.padY,
          paddingHorizontal: sizing.padX,
          borderRadius: sizing.radius,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {leftSlot}
          <Text style={[styles.label, { color: palette.fg, fontSize: sizing.font }]}>
            {label}
          </Text>
          {rightSlot}
        </View>
      )}
    </Pressable>
  );
}

const SIZE_TOKENS = {
  sm: { padY: 10, padX: Spacing.four, radius: Radius.md, font: 14 },
  md: { padY: 14, padX: Spacing.five, radius: Radius.lg, font: 16 },
  lg: { padY: 18, padX: Spacing.six, radius: Radius.lg, font: 17 },
} as const;

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
