import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Booking } from '@/data/mock-bookings';

export function CleanerOnTheWay({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const eta = booking.cleaner.etaMinutes;
  if (!eta) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.warmTaupe },
        pressed && styles.pressed,
      ]}>
      <View style={styles.text}>
        <Text style={styles.title}>Din renholder er på vei</Text>
        <Text style={styles.subtitle}>
          {booking.cleaner.name.split(' ')[0]} forventes om {eta} min.
        </Text>
      </View>
      <Avatar uri={booking.cleaner.avatarUrl} size={44} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1, gap: 2 },
  title: { color: '#FFFFFF', ...Typography.bodyMedium, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.85)', ...Typography.caption },
  pressed: { opacity: 0.9 },
});
