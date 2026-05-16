import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconProps } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ServiceType } from '@/data/mock-bookings';

const SERVICE_META: Record<ServiceType, { label: string; icon: IconProps['name'] }> = {
  home:   { label: 'Hjem\nvask',   icon: 'home-outline' },
  deep:   { label: 'Dyp\nvask',    icon: 'sparkles-outline' },
  move:   { label: 'Flytte\nvask', icon: 'cube-outline' },
  office: { label: 'Kontor\nvask', icon: 'briefcase-outline' },
};

export function ServiceTile({
  type,
  onPress,
}: {
  type: ServiceType;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const meta = SERVICE_META[type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        <Icon name={meta.icon} size={22} color={theme.text} />
      </View>
      <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  iconWrap: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 15,
  },
  pressed: { opacity: 0.85 },
});
