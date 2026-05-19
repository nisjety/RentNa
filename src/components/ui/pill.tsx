import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { BookingStatus } from '@/data/mock-bookings';

interface PillProps {
  label: string;
  tone?: 'info' | 'neutral' | 'accent';
  style?: ViewStyle;
}

export function Pill({ label, tone = 'info', style }: PillProps) {
  const theme = useTheme();

  const palette =
    tone === 'accent'
      ? { bg: theme.accent, fg: theme.accentText }
      : tone === 'neutral'
        ? { bg: theme.surfaceMuted, fg: theme.textSecondary }
        : { bg: theme.pillBg, fg: theme.pillText };

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  in_progress: 'Pågår',
  confirmed: 'Bekreftet',
  upcoming: 'Kommende',
  completed: 'Fullført',
  cancelled: 'Avlyst',
  pending_approval: 'Venter godkjenning',
  approved: 'Godkjent',
  disputed: 'Under behandling',
};

const STATUS_TONE: Record<BookingStatus, PillProps['tone']> = {
  in_progress: 'accent',
  confirmed: 'info',
  upcoming: 'info',
  completed: 'neutral',
  cancelled: 'neutral',
  pending_approval: 'accent',
  approved: 'neutral',
  disputed: 'neutral',
};

export function StatusPill({ status, style }: { status: BookingStatus; style?: ViewStyle }) {
  return (
    <Pill
      label={STATUS_LABEL[status] ?? status}
      tone={STATUS_TONE[status] ?? 'neutral'}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
