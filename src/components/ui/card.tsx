import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  variant?: 'surface' | 'muted' | 'elevated';
  padding?: number;
  radius?: keyof typeof Radius;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export function Card({
  variant = 'surface',
  padding = 16,
  radius = 'lg',
  onPress,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const bg =
    variant === 'muted'
      ? theme.surfaceMuted
      : variant === 'elevated'
        ? theme.surface
        : theme.surface;

  const baseStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: Radius[radius],
    padding,
    ...(variant === 'elevated' ? (Shadow.card as ViewStyle) : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});
