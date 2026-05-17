import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/* ─── Types ─────────────────────────────────────────────── */
interface ShiftBlock {
  start: string; // "08"
  end: string;   // "12"
}

interface DayCoverage {
  shifts: ShiftBlock[];
}

interface CleanerWeek {
  id: string;
  name: string;
  initials: string;
  tone: string;
  days: (DayCoverage | null)[]; // index 0=Mon .. 4=Fri
}

/* ─── Mock week data (week 11, Mon 14 – Fri 18 Mar) ──────── */
const WEEK_LABEL = 'UKE 11 · 14–20 MARS';
const TODAY_COL  = 1; // TIR 15 = index 1

const DAY_HEADERS = [
  { abbr: 'MAN', date: 14 },
  { abbr: 'TIR', date: 15 },
  { abbr: 'ONS', date: 16 },
  { abbr: 'TOR', date: 17 },
  { abbr: 'FRE', date: 18 },
];

const CLEANERS: CleanerWeek[] = [
  {
    id: 'cl_maja', name: 'Maja', initials: 'ML', tone: '#D6CCBA',
    days: [
      { shifts: [{ start: '08', end: '12' }] },
      { shifts: [{ start: '08', end: '17' }] },
      { shifts: [{ start: '09', end: '13' }] },
      null,
      { shifts: [{ start: '08', end: '15' }] },
    ],
  },
  {
    id: 'cl_oleksandra', name: 'Oleksa.', initials: 'OK', tone: '#C8D8E2',
    days: [
      { shifts: [{ start: '09', end: '15' }] },
      { shifts: [{ start: '11', end: '16' }] },
      { shifts: [{ start: '08', end: '14' }] },
      { shifts: [{ start: '12', end: '17' }] },
      null,
    ],
  },
  {
    id: 'cl_amir', name: 'Amir', initials: 'AT', tone: '#D9D6CC',
    days: [
      { shifts: [{ start: '08', end: '13' }] },
      { shifts: [{ start: '08', end: '12' }, { start: '13', end: '17' }] },
      { shifts: [{ start: '09', end: '12' }] },
      { shifts: [{ start: '10', end: '14' }] },
      { shifts: [{ start: '09', end: '16' }] },
    ],
  },
  {
    id: 'cl_liv', name: 'Liv', initials: 'LM', tone: '#E2D8CC',
    days: [
      { shifts: [{ start: '10', end: '13' }] },
      null,
      { shifts: [{ start: '09', end: '14' }] },
      { shifts: [{ start: '11', end: '15' }] },
      { shifts: [{ start: '18', end: '21' }] },
    ],
  },
  {
    id: 'cl_nina', name: 'Nina', initials: 'NS', tone: '#CCD4D8',
    days: [
      { shifts: [{ start: '08', end: '15' }] },
      { shifts: [{ start: '09', end: '17' }] },
      { shifts: [{ start: '08', end: '12' }, { start: '14', end: '16' }] },
      null,
      { shifts: [{ start: '08', end: '14' }] },
    ],
  },
];

/* ─── Sub-components ─────────────────────────────────────── */
function StripedAvatar({ initials, tone, size = 32 }: { initials: string; tone: string; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', width: size * 2, height: 2, backgroundColor: 'rgba(255,255,255,0.32)', transform: [{ rotate: '-45deg' }, { translateY: (i - 2) * 8 }] }} />
      ))}
      <Text style={{ fontSize: size * 0.32, fontWeight: '600', color: theme.text }}>{initials}</Text>
    </View>
  );
}

function ShiftCell({ day, isToday }: { day: DayCoverage | null; isToday: boolean }) {
  const theme = useTheme();

  if (!day || day.shifts.length === 0) {
    return <View style={[cell.root, isToday && cell.todayEmpty]} />;
  }

  return (
    <View style={[cell.root, isToday && { backgroundColor: 'rgba(241,221,56,0.15)' }]}>
      {day.shifts.map((s, i) => (
        <View
          key={i}
          style={[
            cell.block,
            { backgroundColor: isToday ? theme.accent : theme.surfaceMuted },
          ]}>
          <Text style={[cell.label, { color: isToday ? theme.accentText : theme.text }]}>
            {s.start}-{s.end}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────── */
export default function KalenderScreen() {
  const theme = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>OSLO RENHOLD AS · BYRÅ</Text>
          <View style={styles.weekRow}>
            <Text style={[styles.weekLabel, { color: theme.textSecondary }]}>{WEEK_LABEL}</Text>
            <View style={styles.weekNav}>
              <Pressable hitSlop={8} onPress={() => setWeekOffset(w => w - 1)} style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
                <Icon name="chevron-back" size={14} color={theme.text} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => setWeekOffset(w => w + 1)} style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
                <Icon name="chevron-forward" size={14} color={theme.text} />
              </Pressable>
            </View>
          </View>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Dekning</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <View style={[styles.statBlock, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statVal, { color: theme.text }]}>78%</Text>
          <Text style={[styles.statLab, { color: theme.textSecondary }]}>Dekning</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: theme.accent }]}>
          <Text style={[styles.statVal, { color: theme.accentText }]}>14 *</Text>
          <Text style={[styles.statLab, { color: theme.accentText, opacity: 0.75 }]}>Åpne timer</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statVal, { color: theme.text }]}>92%</Text>
          <Text style={[styles.statLab, { color: theme.textSecondary }]}>Kapasitet</Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Column headers */}
        <View style={styles.gridRow}>
          <View style={styles.nameCol} />
          {DAY_HEADERS.map((d, i) => (
            <View
              key={d.abbr}
              style={[
                styles.dayHeader,
                i === TODAY_COL && { backgroundColor: theme.text },
              ]}>
              <Text style={[styles.dayAbbr, { color: i === TODAY_COL ? theme.background : theme.textMuted }]}>
                {d.abbr}
              </Text>
              <Text style={[styles.dayDate, { color: i === TODAY_COL ? theme.background : theme.text }]}>
                {d.date}
              </Text>
            </View>
          ))}
        </View>

        {/* Cleaner rows */}
        {CLEANERS.map((c, ri) => (
          <View key={c.id} style={[styles.cleanerRow, ri > 0 && { borderTopColor: theme.divider, borderTopWidth: StyleSheet.hairlineWidth }]}>
            {/* Name col */}
            <View style={styles.nameCol}>
              <StripedAvatar initials={c.initials} tone={c.tone} size={30} />
              <Text style={[styles.cleanerName, { color: theme.text }]} numberOfLines={1}>
                {c.name}
              </Text>
            </View>
            {/* Day cells */}
            {c.days.map((day, di) => (
              <ShiftCell key={di} day={day} isToday={di === TODAY_COL} />
            ))}
          </View>
        ))}

        {/* Alert CTA */}
        <Pressable
          style={({ pressed }) => [styles.alertCta, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
          <View style={[styles.alertDot, { backgroundColor: theme.accent }]}>
            <Text style={[styles.alertDotLabel, { color: theme.accentText }]}>+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: theme.text }]}>
              2 forespørsler trenger bemanning
            </Text>
            <Text style={[styles.alertSub, { color: theme.textSecondary }]}>
              Torsdag formiddag — 14 åpne timer
            </Text>
          </View>
          <Icon name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const cell = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 52,
    padding: 3,
    gap: 3,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  todayEmpty: { backgroundColor: 'rgba(241,221,56,0.08)' },
  block: {
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: -0.2 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 3 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  weekLabel: { ...Typography.caption },
  weekNav: { flexDirection: 'row', gap: 4 },
  navBtn: { width: 24, height: 24, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { ...Typography.title, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  statBlock: { flex: 1, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', gap: 2 },
  statVal: { ...Typography.headline, fontWeight: '800' },
  statLab: { ...Typography.micro, fontWeight: '500' },
  gridRow: { flexDirection: 'row', paddingHorizontal: Spacing.four, marginBottom: 4 },
  nameCol: { width: 64, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, paddingRight: 4 },
  dayHeader: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: Radius.sm, gap: 1 },
  dayAbbr: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dayDate: { ...Typography.caption, fontWeight: '700' },
  cleanerRow: { flexDirection: 'row', paddingHorizontal: Spacing.four, paddingVertical: 4 },
  cleanerName: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  alertCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  alertDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  alertDotLabel: { fontSize: 18, fontWeight: '300', lineHeight: 22 },
  alertTitle: { ...Typography.caption, fontWeight: '700' },
  alertSub: { ...Typography.micro, marginTop: 1 },
  pressed: { opacity: 0.82 },
});
