import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

const MONTH = ['JAN', 'FEB', 'MAR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DES'];

function mondayOf(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  // ISO week number
  const startOfYear = new Date(monday.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((monday.getTime() - startOfYear.getTime()) / 86400000);
  const weekNo = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  return `UKE ${weekNo} · ${monday.getDate()}–${sunday.getDate()} ${MONTH[monday.getMonth()]}`;
}

function StripedAvatar({ initials, tone, size = 30 }: { initials: string; tone: string; size?: number }) {
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

function ShiftCell({
  shifts,
  isToday,
}: {
  shifts: Doc<'shifts'>[];
  isToday: boolean;
}) {
  const theme = useTheme();
  if (shifts.length === 0) {
    return <View style={[cell.root, isToday && cell.todayEmpty]} />;
  }
  return (
    <View style={[cell.root, isToday && { backgroundColor: 'rgba(241,221,56,0.15)' }]}>
      {shifts.map((s, i) => (
        <View
          key={i}
          style={[cell.block, { backgroundColor: isToday ? theme.accent : theme.surfaceMuted }]}>
          <Text style={[cell.label, { color: isToday ? theme.accentText : theme.text }]}>
            {String(s.startHour).padStart(2, '0')}-{String(s.endHour).padStart(2, '0')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function KalenderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);

  const monday = useMemo(() => {
    const m = mondayOf();
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const weekStart = isoDate(monday);
  const agency = useQuery(api.agency.getCurrent);
  const members = useQuery(api.agency.listMembers, {});
  const shifts = useQuery(api.agency.listShifts, { weekStart });
  const coverage = useQuery(api.agency.coverageStats, { weekStart });
  const requestCounts = useQuery(api.agency.requestCounts);

  const todayIdx = useMemo(() => {
    if (weekOffset !== 0) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - monday.getTime()) / 86400000);
    return diff >= 0 && diff <= 4 ? diff : -1;
  }, [monday, weekOffset]);

  const dayHeaders = useMemo(() => {
    const labels = ['MAN', 'TIR', 'ONS', 'TOR', 'FRE'];
    return labels.map((abbr, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { abbr, date: d.getDate() };
    });
  }, [monday]);

  const shiftsByMemberAndDay = useMemo(() => {
    const map = new Map<string, Doc<'shifts'>[][]>();
    if (!shifts) return map;
    for (const s of shifts) {
      if (s.dayIndex < 0 || s.dayIndex > 4) continue;
      const arr = map.get(s.cleanerSlug) ?? [[], [], [], [], []];
      arr[s.dayIndex].push(s);
      map.set(s.cleanerSlug, arr);
    }
    return map;
  }, [shifts]);

  const loading = agency === undefined || members === undefined || shifts === undefined || coverage === undefined;
  const showEmpty = !loading && (members?.length === 0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>
            {(agency?.name ?? 'BYRÅ').toUpperCase()} · BYRÅ
          </Text>
          <View style={styles.weekRow}>
            <Text style={[styles.weekLabel, { color: theme.textSecondary }]}>
              {weekLabel(monday)}
            </Text>
            <View style={styles.weekNav}>
              <Pressable hitSlop={8} onPress={() => setWeekOffset((w) => w - 1)} style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
                <Icon name="chevron-back" size={14} color={theme.text} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => setWeekOffset((w) => w + 1)} style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
                <Icon name="chevron-forward" size={14} color={theme.text} />
              </Pressable>
            </View>
          </View>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Dekning</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBlock, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statVal, { color: theme.text }]}>{coverage?.coveragePct ?? 0}%</Text>
          <Text style={[styles.statLab, { color: theme.textSecondary }]}>Dekning</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: theme.accent }]}>
          <Text style={[styles.statVal, { color: theme.accentText }]}>{coverage?.openHours ?? 0}*</Text>
          <Text style={[styles.statLab, { color: theme.accentText, opacity: 0.75 }]}>Åpne timer</Text>
        </View>
        <View style={[styles.statBlock, { backgroundColor: theme.surface }]}>
          <Text style={[styles.statVal, { color: theme.text }]}>{coverage?.capacityPct ?? 0}%</Text>
          <Text style={[styles.statLab, { color: theme.textSecondary }]}>Kapasitet</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : showEmpty ? (
        <View style={styles.emptyBlock}>
          <Icon name="calendar-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen renholdere</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Legg til renholdere i Roster for å se ukeplanen.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.gridRow}>
            <View style={styles.nameCol} />
            {dayHeaders.map((d, i) => (
              <View
                key={d.abbr}
                style={[styles.dayHeader, i === todayIdx && { backgroundColor: theme.text }]}>
                <Text style={[styles.dayAbbr, { color: i === todayIdx ? theme.background : theme.textMuted }]}>
                  {d.abbr}
                </Text>
                <Text style={[styles.dayDate, { color: i === todayIdx ? theme.background : theme.text }]}>
                  {d.date}
                </Text>
              </View>
            ))}
          </View>

          {members!.map((m, ri) => {
            const cleanerShifts = shiftsByMemberAndDay.get(m.cleanerSlug) ?? [[], [], [], [], []];
            return (
              <View
                key={m._id}
                style={[styles.cleanerRow, ri > 0 && { borderTopColor: theme.divider, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.nameCol}>
                  <StripedAvatar initials={m.initials} tone={m.tone} size={30} />
                  <Text style={[styles.cleanerName, { color: theme.text }]} numberOfLines={1}>
                    {m.name.split(' ')[0]}
                  </Text>
                </View>
                {cleanerShifts.slice(0, 5).map((dayShifts, di) => (
                  <ShiftCell key={di} shifts={dayShifts} isToday={di === todayIdx} />
                ))}
              </View>
            );
          })}

          {(requestCounts?.new ?? 0) > 0 && (
            <Pressable
              onPress={() => router.push('/agency/forsporsler')}
              style={({ pressed }) => [styles.alertCta, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
              <View style={[styles.alertDot, { backgroundColor: theme.accent }]}>
                <Text style={[styles.alertDotLabel, { color: theme.accentText }]}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: theme.text }]}>
                  {requestCounts!.new} forespørsler trenger bemanning
                </Text>
                <Text style={[styles.alertSub, { color: theme.textSecondary }]}>
                  {coverage?.openHours ?? 0} åpne timer denne uken
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const cell = StyleSheet.create({
  root: { flex: 1, minHeight: 52, padding: 3, gap: 3, alignItems: 'stretch', justifyContent: 'center' },
  todayEmpty: { backgroundColor: 'rgba(241,221,56,0.08)' },
  block: { borderRadius: 5, paddingVertical: 3, paddingHorizontal: 3, alignItems: 'center' },
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
  statsRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
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
  alertCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginHorizontal: Spacing.four, marginTop: Spacing.three, padding: Spacing.three, borderRadius: Radius.lg },
  alertDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  alertDotLabel: { fontSize: 18, fontWeight: '300', lineHeight: 22 },
  alertTitle: { ...Typography.caption, fontWeight: '700' },
  alertSub: { ...Typography.micro, marginTop: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.six },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center' },
  pressed: { opacity: 0.82 },
});
