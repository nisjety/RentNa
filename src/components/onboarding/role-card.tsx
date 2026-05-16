import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconProps } from '@/components/ui/icon';
import { Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  icon: IconProps['name'];
  iconBgColor: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export function RoleCard({ icon, iconBgColor, iconColor, title, subtitle, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        Shadow.soft as object,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconSquare, { backgroundColor: iconBgColor }]}>
        <Icon name={icon} size={26} color={iconColor ?? theme.text} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Icon name="arrow-forward" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  iconSquare: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { ...Typography.subhead },
  subtitle: { ...Typography.caption, marginTop: 2 },
  pressed: { opacity: 0.92 },
});
