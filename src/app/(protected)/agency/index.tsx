import { useRouter } from 'expo-router';
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
type CleanerStatus = 'on_job' | 'available' | 'off' | 'missing';

interface RosterCleaner {
  id: string;
  name: string;
  initials: string;
  tone: string;
  area: string;
  status: CleanerStatus;
  hoursToday: number;
  hoursWeek: number;
  faste: number;
}

/* ─── Mock data ──────────────────────────────────────────── */
const CLEANERS: RosterCleaner[] = [
  { id: 'cl_maja',       name: 'Maja L.',       initials: 'ML', tone: '#D6CCBA', area: 'Grünerlekka', status: 'on_job',   hoursToday: 7, hoursWeek: 28, faste: 12 },
  { id: 'cl_oleksandra', name: 'Oleksandra K.', initials: 'OK', tone: '#C8D8E2', area: 'Frogner',      status: 'available',hoursToday: 4, hoursWeek: 18, faste: 6  },
  { id: 'cl_amir',       name: 'Amir T.',       initials: 'AT', tone: '#D9D6CC', area: 'Sagene',       status: 'on_job',   hoursToday: 6, hoursWeek: 24, faste: 9  },
  { id: 'cl_liv',        name: 'Liv M.',        initials: 'LM', tone: '#E2D8CC', area: 'St. Hanshaugen',status: 'off',     hoursToday: 0, hoursWeek: 12, faste: 3  },
  { id: 'cl_nina',       name: 'Nina S.',       initials: 'NS', tone: '#CCD4D8', area: 'Tøyen',        status: 'available',hoursToday: 5, hoursWeek: 22, faste: 8  },
];

type FilterTab = 'all' | 'on_job' | 'available' | 'off';

const STATUS_LABEL: Record<CleanerStatus, string> = {
  on_job:    'På jobb',
  available: 'Ledig',
  off:       'Av i dag',
  missing:   'Mangler',
};

/* ─── Sub-components ─────────────────────────────────────── */
function StripedAvatar({ initials, tone, size = 40 }: { initials: string; tone: string; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Diagonal stripe overlay */}
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * 2,
            height: 2.5,
            backgroundColor: 'rgba(255,255,255,0.35)',
            transform: [{ rotate: '-45deg' }, { translateY: (i - 3) * 8 }],
          }}
        />
      ))}
      <Text style={{ fontSize: size * 0.33, fontWeight: '600', color: theme.text }}>{initials}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: CleanerStatus }) {
  const theme = useTheme();
  const color =
    status === 'on_job'    ? '#3A7D44' :
    status === 'available' ? '#3A7D44' :
    status === 'missing'   ? '#B0413E' :
    theme.textMuted;
  const bg =
    status === 'on_job'    ? '#D6EED9' :
    status === 'available' ? 'transparent' :
    status === 'missing'   ? '#F5D4D4' :
    theme.surfaceMuted;
  const border = status === 'available' ? '#3A7D44' : 'transparent';

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border, borderWidth: status === 'available' ? 1 : 0 }]}>
      <Text style={[styles.pillText, { color }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────── */
export default function RosterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const total     = CLEANERS.length;
  const onJob     = CLEANERS.filter(c => c.status === 'on_job').length;
  const available = CLEANERS.filter(c => c.status === 'available').length;
  const missing   = 2; // mock — unfilled slots

  const filtered = CLEANERS.filter(c => {
    if (activeFilter === 'all')       return true;
    if (activeFilter === 'on_job')    return c.status === 'on_job';
    if (activeFilter === 'available') return c.status === 'available';
    if (activeFilter === 'off')       return c.status === 'off';
    return true;
  });

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: `Alle (${total})` },
    { key: 'on_job',    label: 'På jobb' },
    { key: 'available', label: 'Ledige' },
    { key: 'off',       label: 'Off' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>OSLO RENHOLD AS · BYRÅ</Text>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Roster</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
            <Icon name="search-outline" size={18} color={theme.text} />
          </Pressable>
          <Pressable hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <Icon name="add" size={18} color={theme.accentText} />
          </Pressable>
        </View>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <StatChip value={String(total)}     label="Totalt"   />
        <StatChip value={String(onJob)}     label="På jobb"  accent />
        <StatChip value={String(available)} label="Ledige"   green />
        <StatChip value={`${missing}*`}     label="Mangler"  warn />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={({ pressed }) => [
              styles.filterChip,
              { backgroundColor: activeFilter === f.key ? theme.text : theme.surface },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.filterLabel, { color: activeFilter === f.key ? theme.background : theme.textSecondary }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Roster list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((c, i) => (
          <View key={c.id}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => {}}>
              <StripedAvatar initials={c.initials} tone={c.tone} size={42} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, { color: theme.text }]}>{c.name}</Text>
                  <StatusPill status={c.status} />
                </View>
                <Text style={[styles.area, { color: theme.textSecondary }]}>{c.area}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.hours, { color: theme.text }]}>
                  {c.hoursToday}t / {c.hoursWeek}t
                </Text>
                <Text style={[styles.faste, { color: theme.textSecondary }]}>
                  {c.faste} faste
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ value, label, accent, green, warn }: { value: string; label: string; accent?: boolean; green?: boolean; warn?: boolean }) {
  const theme = useTheme();
  const bg =
    accent ? theme.accent :
    green  ? '#D6EED9' :
    warn   ? '#F5E6C8' :
    theme.surface;
  const textColor =
    accent ? theme.accentText :
    green  ? '#2D6636' :
    warn   ? '#8A5A00' :
    theme.text;

  return (
    <View style={[styles.statChip, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textColor, opacity: 0.75 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  screenTitle: { ...Typography.title, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  iconBtn: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  statChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { ...Typography.subhead, fontWeight: '700' },
  statLabel: { ...Typography.micro, fontWeight: '500' },
  filterRow: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  filterLabel: { ...Typography.caption, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 12,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { ...Typography.bodyMedium, fontWeight: '600' },
  area: { ...Typography.caption },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  hours: { ...Typography.caption, fontWeight: '600' },
  faste: { ...Typography.micro },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  pillText: { ...Typography.micro, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
