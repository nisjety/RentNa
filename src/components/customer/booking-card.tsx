import { Image } from 'expo-image';
import { format } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/ui/pill';
import { Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Booking } from '@/data/mock-bookings';

interface Props {
  booking: Booking;
  onPress?: () => void;
  variant?: 'list' | 'feature';
}

export function BookingCard({ booking, onPress, variant = 'list' }: Props) {
  const theme = useTheme();
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);

  if (variant === 'feature') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.feature,
          { backgroundColor: theme.surface },
          Shadow.soft as any,
          pressed && styles.pressed,
        ]}>
        <View style={styles.featureImageWrap}>
          <Image
            source={{ uri: booking.imageUrl }}
            style={styles.featureImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.featureRibbon}>
            <Text style={styles.featureRibbonText}>
              {format(start, 'EEEE') === format(new Date(Date.now() + 86400000), 'EEEE')
                ? 'Tomorrow'
                : format(start, 'EEEE')}
            </Text>
          </View>
        </View>
        <View style={styles.featureBody}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>{booking.service}</Text>
            <Text style={[styles.featureMeta, { color: theme.textSecondary }]}>
              {format(start, 'EEE, d MMM')} · {format(start, 'HH:mm')}
            </Text>
          </View>
          <StatusPill status={booking.status} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}>
      <Image
        source={{ uri: booking.imageUrl }}
        style={styles.rowImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.rowBody}>
        <Text style={[styles.rowDate, { color: theme.textSecondary }]}>
          {format(start, 'EEE, d MMM')}
        </Text>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
          {booking.service}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.textSecondary }]} numberOfLines={1}>
          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
        </Text>
        <Text style={[styles.rowAddress, { color: theme.textMuted }]} numberOfLines={1}>
          {booking.address}
        </Text>
      </View>
      <StatusPill status={booking.status} style={styles.rowPill} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  feature: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  featureImageWrap: { position: 'relative' },
  featureImage: {
    width: '100%',
    height: 180,
  },
  featureRibbon: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    backgroundColor: '#172713',
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  featureRibbonText: {
    color: '#F5F2EC',
    ...Typography.caption,
    fontWeight: '600',
  },
  featureBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  featureTitle: { ...Typography.headline },
  featureMeta: { ...Typography.callout, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.three,
  },
  rowImage: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  rowBody: { flex: 1, gap: 2 },
  rowDate: { ...Typography.caption },
  rowTitle: { ...Typography.subhead, marginTop: 2 },
  rowMeta: { ...Typography.callout },
  rowAddress: { ...Typography.caption },
  rowPill: { alignSelf: 'center' },
  pressed: { opacity: 0.9 },
});
