import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveStatusPill } from '@/components/customer/live-status-dot';
import { Avatar } from '@/components/ui/avatar';
import { Pill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Cleaner } from '@/data/mock-cleaners';

interface Props {
  cleaner: Cleaner;
  onPress?: () => void;
  onBook?: () => void;
}

export function CleanerListCard({ cleaner, onPress, onBook }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <Avatar uri={cleaner.avatarUrl} initials={cleaner.initials} size={56} />

        <View style={styles.body}>
          <View style={styles.topLine}>
            <View style={styles.nameWrap}>
              {cleaner.isSuperCleaner && (
                <View style={[styles.superDot, { backgroundColor: theme.accent }]} />
              )}
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {cleaner.shortName}
              </Text>
            </View>
            <Text style={[styles.price, { color: theme.text }]}>
              {cleaner.hourlyRateKr} <Text style={[styles.priceUnit, { color: theme.textSecondary }]}>kr/t</Text>
            </Text>
          </View>

          <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
            {cleaner.area} · {cleaner.yearsExperience} år
          </Text>

          <View style={styles.ratingRow}>
            <Text style={[styles.rating, { color: theme.textSecondary }]} numberOfLines={1}>
              ★ {cleaner.rating.toFixed(2)}  ({cleaner.reviewCount})
            </Text>
            <LiveStatusPill cleanerSlug={cleaner.id} hideWhenOffline />
          </View>

          <View style={styles.footer}>
            <Text
              style={[styles.next, { color: theme.textSecondary }]}
              numberOfLines={1}>
              Neste: {cleaner.nextAvailable.label}
            </Text>
            <Pressable
              onPress={onBook}
              hitSlop={8}
              style={({ pressed }) => [
                styles.bookBtn,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.bookLabel, { color: theme.accentText }]}>Bestill</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  row: { flexDirection: 'row', gap: Spacing.three },
  body: { flex: 1, gap: 2 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  superDot: { width: 8, height: 8, borderRadius: 4 },
  name: { ...Typography.subhead },
  price: { ...Typography.bodyMedium, fontWeight: '600' },
  priceUnit: { ...Typography.caption, fontWeight: '500' },
  meta: { ...Typography.caption },
  rating: { ...Typography.caption },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  next: { ...Typography.caption, flex: 1 },
  bookBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  bookLabel: { ...Typography.callout, fontWeight: '600' },
  pressed: { opacity: 0.9 },
});

// Pill is intentionally unused in this card right now but exported for reuse elsewhere.
void Pill;
