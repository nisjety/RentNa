import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { mockEarnings } from '@/data/mock-cleaner-jobs';
import { useTheme } from '@/hooks/use-theme';

type Period = 'week' | 'month' | 'ytd';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Denne uken',
  month: 'Denne måneden',
  ytd: 'I år',
};

const MONTH_NAMES_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'mai', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'des',
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

export default function EarningsScreen() {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('month');

  const stats =
    period === 'week'
      ? mockEarnings.thisWeek
      : period === 'month'
        ? mockEarnings.thisMonth
        : mockEarnings.ytd;

  const maxKr = Math.max(...mockEarnings.monthlyBars.map((b) => b.kr));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.titleBar}>
          <Heading variant="title">Inntjening</Heading>
        </View>

        {/* Period selector */}
        <View style={[styles.segmented, { backgroundColor: theme.surfaceMuted }]}>
          {(['week', 'month', 'ytd'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.segment,
                period === p && { backgroundColor: theme.surface },
              ]}>
              <Text
                style={[
                  styles.segmentLabel,
                  { color: period === p ? theme.text : theme.textMuted },
                ]}>
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Hero stat */}
        <View style={[styles.heroCard, { backgroundColor: theme.text }]}>
          <Text style={[styles.heroLabel, { color: theme.surfaceMuted }]}>
            {PERIOD_LABELS[period]}
          </Text>
          <Text style={[styles.heroAmount, { color: theme.background }]}>
            {stats.totalKr.toLocaleString('nb-NO')} kr
          </Text>
          <View style={styles.heroRow}>
            <HeroStat value={String(stats.jobsCount)} label="Oppdrag" light />
            <View style={[styles.heroDivider, { backgroundColor: theme.surfaceMuted + '40' }]} />
            <HeroStat value={`${stats.hoursWorked}t`} label="Arbeidstimer" light />
            <View style={[styles.heroDivider, { backgroundColor: theme.surfaceMuted + '40' }]} />
            <HeroStat
              value={`${Math.round(stats.totalKr / stats.hoursWorked)} kr/t`}
              label="Snittrate"
              light
            />
          </View>
        </View>

        {/* Monthly bar chart */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Månedlig oversikt</Text>
        </View>
        <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
          <View style={styles.bars}>
            {mockEarnings.monthlyBars.map((b, idx) => {
              const isLast = idx === mockEarnings.monthlyBars.length - 1;
              const pct = b.kr / maxKr;
              return (
                <View key={b.month} style={styles.barCol}>
                  <Text style={[styles.barAmount, { color: theme.textSecondary }]}>
                    {b.kr >= 10000 ? `${Math.round(b.kr / 1000)}k` : b.kr}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.round(pct * 100)}%`,
                          backgroundColor: isLast ? theme.accent : theme.surfaceMuted,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      { color: isLast ? theme.text : theme.textMuted, fontWeight: isLast ? '700' : '400' },
                    ]}>
                    {b.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent payouts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Siste utbetalinger</Text>
        </View>
        <View style={styles.payoutList}>
          {mockEarnings.recentPayouts.map((p) => (
            <View
              key={p.id}
              style={[styles.payoutRow, { backgroundColor: theme.surface }]}>
              <View
                style={[styles.payoutIcon, { backgroundColor: p.status === 'paid' ? '#E5DFD2' : theme.surfaceMuted }]}>
                <Icon
                  name={p.status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={p.status === 'paid' ? '#3D9970' : theme.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payoutAmount, { color: theme.text }]}>
                  {p.kr.toLocaleString('nb-NO')} kr
                </Text>
                <Text style={[styles.payoutDate, { color: theme.textSecondary }]}>
                  {fmtDate(p.date)}
                </Text>
              </View>
              <View
                style={[
                  styles.payoutStatus,
                  {
                    backgroundColor: p.status === 'paid' ? '#3D9970' + '22' : theme.surfaceMuted,
                  },
                ]}>
                <Text
                  style={[
                    styles.payoutStatusText,
                    { color: p.status === 'paid' ? '#3D9970' : theme.textMuted },
                  ]}>
                  {p.status === 'paid' ? 'Utbetalt' : 'Venter'}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function HeroStat({
  value,
  label,
  light,
}: {
  value: string;
  label: string;
  light?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatValue, { color: light ? theme.background : theme.text }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.heroStatLabel,
          { color: light ? theme.surfaceMuted : theme.textSecondary },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.ten },

  titleBar: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },

  segmented: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    padding: 3,
    marginBottom: Spacing.four,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  segmentLabel: { ...Typography.caption, fontWeight: '600' },

  heroCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    marginBottom: Spacing.five,
    gap: Spacing.two,
  },
  heroLabel: { ...Typography.caption },
  heroAmount: { ...Typography.display, fontWeight: '700' },
  heroRow: { flexDirection: 'row', marginTop: Spacing.two },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { ...Typography.subhead, fontWeight: '700' },
  heroStatLabel: { ...Typography.micro },
  heroDivider: { width: 1, marginHorizontal: Spacing.two },

  sectionHeader: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  sectionTitle: { ...Typography.subhead, fontWeight: '600' },

  chartCard: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    marginBottom: Spacing.five,
  },
  bars: { flexDirection: 'row', height: 120, gap: Spacing.two, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barAmount: { ...Typography.micro },
  barTrack: { width: '100%', height: 80, justifyContent: 'flex-end', borderRadius: Radius.xs },
  barFill: { width: '100%', borderRadius: Radius.xs, minHeight: 4 },
  barLabel: { ...Typography.micro },

  payoutList: {
    marginHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    gap: 1,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  payoutIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutAmount: { ...Typography.bodyMedium },
  payoutDate: { ...Typography.caption, marginTop: 2 },
  payoutStatus: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  payoutStatusText: { ...Typography.micro, fontWeight: '600' },
});
