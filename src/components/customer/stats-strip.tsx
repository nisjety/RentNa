import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  yearsExperience: number;
}

export function StatsStrip({ rating, reviewCount, jobsCompleted, yearsExperience }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.cell}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={theme.text} />
          <Text style={[styles.value, { color: theme.text }]}>{rating.toFixed(2)}</Text>
        </View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {reviewCount} anmeldelser
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <View style={styles.cell}>
        <Text style={[styles.value, { color: theme.text }]}>{jobsCompleted}</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>fullførte jobber</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
      <View style={styles.cell}>
        <Text style={[styles.value, { color: theme.text }]}>{yearsExperience}</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>års erfaring</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  cell: { flex: 1, alignItems: 'flex-start', paddingHorizontal: Spacing.three, gap: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 40 },
  value: { ...Typography.subhead, fontWeight: '600' },
  label: { ...Typography.caption, textAlign: 'left' },
});
