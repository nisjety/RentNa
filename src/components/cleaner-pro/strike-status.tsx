import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

const REASON_LABEL: Record<string, string> = {
  no_show: 'Møtte ikke opp',
  quality: 'Kvalitet',
  damage:  'Skade',
  safety:  'Sikkerhet',
  other:   'Annet',
};

const SEVERITY_TINT = (sev: number) =>
  sev >= 3 ? '#B0413E' : sev >= 2 ? '#7A4F00' : '#3D5A6A';

const SEVERITY_BG = (sev: number) =>
  sev >= 3 ? '#F5D4D4' : sev >= 2 ? '#F5E6C8' : '#D8DEE5';

/**
 * Renders the cleaner's current strike standing. Shown on cleaner-pro
 * profile. Hides itself entirely if the cleaner has zero strikes.
 */
export function StrikeStatus() {
  const theme = useTheme();
  const data = useQuery(api.strikes.listMine);

  if (data === undefined) return null;
  const { strikes, total, suspended, suspendedReason, threshold } = data;
  if (!suspended && strikes.length === 0) return null;

  const remaining = Math.max(0, (threshold ?? 5) - total);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Strike-status
        </Text>
      </View>

      {suspended && (
        <View style={[styles.banner, { backgroundColor: '#F5D4D4' }]}>
          <Icon name="alert-circle" size={20} color="#B0413E" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#B0413E' }]}>
              Konto suspendert
            </Text>
            <Text style={[styles.bannerBody, { color: '#B0413E' }]}>
              {suspendedReason ??
                'Kontoen er midlertidig deaktivert. Ta kontakt med support.'}
            </Text>
          </View>
        </View>
      )}

      {!suspended && total > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Aktive strike-poeng
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {total} / {threshold ?? 5}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: total >= (threshold ?? 5) ? '#B0413E' : theme.accent,
                  width: `${Math.min(100, (total / (threshold ?? 5)) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.summaryHint, { color: theme.textSecondary }]}>
            {remaining > 0
              ? `${remaining} poeng igjen før kontoen suspenderes automatisk.`
              : 'Du nærmer deg grensen — neste rapport kan suspendere kontoen.'}
          </Text>
        </View>
      )}

      {strikes.length > 0 && (
        <View style={[styles.list, { backgroundColor: theme.surface }]}>
          {strikes.map((s, i) => (
            <View key={s._id}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
              <View style={styles.row}>
                <View
                  style={[styles.sevPill, { backgroundColor: SEVERITY_BG(s.severity) }]}>
                  <Text style={[styles.sevText, { color: SEVERITY_TINT(s.severity) }]}>
                    {s.severity}p
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reason, { color: theme.text }]}>
                    {REASON_LABEL[s.reason] ?? s.reason}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={2}>
                    {s.notes ?? '—'}
                  </Text>
                  <Text style={[styles.date, { color: theme.textMuted }]}>
                    {format(new Date(s.createdAt), 'd. MMM yyyy')} · utløper{' '}
                    {format(new Date(s.expiresAt), 'd. MMM yyyy')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionTitle: {
    ...Typography.callout,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  bannerTitle: { ...Typography.bodyMedium, fontWeight: '700' },
  bannerBody: { ...Typography.caption, marginTop: 2, lineHeight: 18 },
  summary: {
    marginHorizontal: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Typography.caption, fontWeight: '600' },
  summaryValue: { ...Typography.subhead, fontWeight: '700', fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  summaryHint: { ...Typography.caption, lineHeight: 17 },
  list: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, padding: Spacing.three },
  sevPill: {
    minWidth: 36, paddingHorizontal: 6, paddingVertical: 5,
    borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center',
  },
  sevText: { ...Typography.caption, fontWeight: '700' },
  reason: { ...Typography.bodyMedium, fontWeight: '600' },
  meta: { ...Typography.caption, marginTop: 2 },
  date: { ...Typography.micro, marginTop: 3 },
});
