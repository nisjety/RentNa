import { useAuth } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthSetupBanner } from '@/components/agency/auth-setup-banner';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

type CleanerStatus = 'on_job' | 'available' | 'off' | 'missing';
type FilterTab = 'all' | 'on_job' | 'available' | 'off';

const STATUS_LABEL: Record<CleanerStatus, string> = {
  on_job:    'På jobb',
  available: 'Ledig',
  off:       'Av i dag',
  missing:   'Mangler',
};

function StripedAvatar({ initials, tone, size = 40 }: { initials: string; tone: string; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
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

export default function RosterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const agency = useQuery(api.agency.getCurrent);
  const members = useQuery(
    api.agency.listMembers,
    activeFilter === 'all' ? {} : { status: activeFilter },
  );
  const stats = useQuery(api.agency.rosterStats);
  const seedAgency = useMutation(api.seed.seedAgencyWorkspace);
  const ensureAgency = useMutation(api.agency.ensureExists);

  // Auto-seed on first load when the user has no agency yet
  const [seedAttempted, setSeedAttempted] = useState(false);
  useEffect(() => {
    if (seedAttempted) return;
    if (agency === undefined) return; // still loading
    if (agency === null) {
      setSeedAttempted(true);
      ensureAgency({})
        .then((created) => {
          // null result means Convex couldn't see auth — skip seed silently
          if (created) return seedAgency({});
        })
        .catch((err) => console.warn('Agency seed failed:', err));
      return;
    }
    if (members !== undefined && members.length === 0) {
      setSeedAttempted(true);
      seedAgency({}).catch((err) => console.warn('Agency seed failed:', err));
    }
  }, [agency, members, seedAttempted, seedAgency, ensureAgency]);

  const loading = members === undefined || stats === undefined || agency === undefined;
  // Show auth banner if user is Clerk-signed-in but Convex can't see them.
  const showAuthBanner = isSignedIn && agency === null && seedAttempted;

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: `Alle (${stats?.total ?? 0})` },
    { key: 'on_job',    label: 'På jobb' },
    { key: 'available', label: 'Ledige' },
    { key: 'off',       label: 'Off' },
  ];

  const agencyHeader = (agency?.name ?? 'BYRÅ').toUpperCase() + ' · BYRÅ';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>{agencyHeader}</Text>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Roster</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
            <Icon name="search-outline" size={18} color={theme.text} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/agency/forsporsler')}
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <Icon name="add" size={18} color={theme.accentText} />
          </Pressable>
        </View>
      </View>

      {showAuthBanner && <AuthSetupBanner />}

      <View style={styles.statsRow}>
        <StatChip value={String(stats?.total ?? 0)} label="Totalt" />
        <StatChip value={String(stats?.onJob ?? 0)} label="På jobb" accent />
        <StatChip value={String(stats?.available ?? 0)} label="Ledige" green />
        <StatChip value={`${stats?.missing ?? 0}*`} label="Mangler" warn />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
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

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Icon name="people-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen renholdere</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Legg til renholdere i byrået for å se dem her.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {members.map((c, i) => (
            <View key={c._id}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: theme.divider }]} />}
              <MemberRow member={c} />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MemberRow({ member }: { member: Doc<'agencyMembers'> }) {
  const theme = useTheme();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <StripedAvatar initials={member.initials} tone={member.tone} size={42} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, { color: theme.text }]}>{member.name}</Text>
          <StatusPill status={member.status as CleanerStatus} />
        </View>
        <Text style={[styles.area, { color: theme.textSecondary }]}>{member.area}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.hours, { color: theme.text }]}>
          {member.hoursToday}t / {member.hoursWeek}t
        </Text>
        <Text style={[styles.faste, { color: theme.textSecondary }]}>
          {member.fasteCount} faste
        </Text>
      </View>
    </Pressable>
  );
}

function StatChip({ value, label, accent, green, warn }: { value: string; label: string; accent?: boolean; green?: boolean; warn?: boolean }) {
  const theme = useTheme();
  const bg = accent ? theme.accent : green ? '#D6EED9' : warn ? '#F5E6C8' : theme.surface;
  const textColor = accent ? theme.accentText : green ? '#2D6636' : warn ? '#8A5A00' : theme.text;
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
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three,
  },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  screenTitle: { ...Typography.title, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  iconBtn: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  statChip: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: Radius.md, alignItems: 'center', gap: 2 },
  statValue: { ...Typography.subhead, fontWeight: '700' },
  statLabel: { ...Typography.micro, fontWeight: '500' },
  filterRow: { paddingHorizontal: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.three },
  filterChip: { paddingHorizontal: Spacing.three, paddingVertical: 7, borderRadius: Radius.pill },
  filterLabel: { ...Typography.caption, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
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
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.six },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center' },
});
