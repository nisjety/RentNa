import { useAuth, useUser } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthSetupBanner } from '@/components/agency/auth-setup-banner';
import { StatusToggle } from '@/components/cleaner-pro/status-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

const DAY_NAMES = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MONTH_NAMES = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
];

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtEndTime(iso: string, durationHours: number): string {
  const end = new Date(new Date(iso).getTime() + durationHours * 3600000);
  return fmtTime(end.toISOString());
}

type JobStatus = 'completed' | 'in_progress' | 'upcoming';

const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  completed: 'Fullført',
  in_progress: 'Pågår',
  upcoming: 'Kommende',
};

const JOB_STATUS_TONE: Record<JobStatus, 'info' | 'accent' | 'neutral'> = {
  completed: 'neutral',
  in_progress: 'accent',
  upcoming: 'info',
};

export default function CleanerTodayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn } = useAuth();

  const profile = useQuery(api.cleanerPro.getMyProfile);
  const jobs = useQuery(api.cleanerPro.todayJobs);
  const stats = useQuery(api.cleanerPro.dayStats);
  const activeJob = useQuery(api.cleanerPro.activeJob);
  const ensureProfile = useMutation(api.cleanerPro.ensureProfile);
  const seedCleaner = useMutation(api.seed.seedCleanerWorkspace);

  const [seedAttempted, setSeedAttempted] = useState(false);
  useEffect(() => {
    if (seedAttempted) return;
    if (profile === undefined) return;
    if (profile === null) {
      setSeedAttempted(true);
      ensureProfile({})
        .then((created) => {
          if (created) return seedCleaner({});
        })
        .catch((err) => console.warn('Cleaner seed failed:', err));
      return;
    }
    if (jobs !== undefined && jobs.length === 0) {
      setSeedAttempted(true);
      seedCleaner({}).catch((err) => console.warn('Cleaner seed failed:', err));
    }
  }, [profile, jobs, seedAttempted, ensureProfile, seedCleaner]);

  const loading = profile === undefined || jobs === undefined || stats === undefined;
  const showAuthBanner = isSignedIn && profile === null && seedAttempted;
  const firstName = user?.firstName ?? profile?.cleaner?.shortName?.split(' ')[0] ?? 'Renholder';
  const initials = profile?.cleaner?.initials ?? user?.firstName?.[0]?.toUpperCase() ?? '?';

  const now = new Date();
  const todayLabel = `${DAY_NAMES[now.getDay()]} ${now.getDate()}. ${MONTH_NAMES[now.getMonth()]}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>God dag, {firstName}</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>{todayLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <InboxButton />
            <Avatar initials={initials} size={42} tone="taupe" />
          </View>
        </View>

        {showAuthBanner && <AuthSetupBanner />}

        <StatusToggle />

        <View style={styles.statsRow}>
          <StatCard
            value={`${(stats?.totalKr ?? 0).toLocaleString('nb-NO')} kr`}
            label="Inntekt i dag"
            accent
          />
          <StatCard value={String(stats?.jobsCount ?? 0)} label="Oppdrag" />
          <StatCard
            value={`${stats?.completedCount ?? 0}/${stats?.jobsCount ?? 0}`}
            label="Fullført"
          />
        </View>

        {activeJob && (
          <Pressable
            onPress={() => router.push(`/pro/job/${activeJob._id}`)}
            style={({ pressed }) => [
              styles.activeBanner,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.9 },
            ]}>
            <View style={styles.bannerLeft}>
              <Icon name="sparkles" size={18} color={theme.accentText} />
              <View style={styles.bannerText}>
                <Text style={[styles.bannerTitle, { color: theme.accentText }]}>Pågående oppdrag</Text>
                <Text style={[styles.bannerSub, { color: theme.accentText }]}>
                  {activeJob.address} · {activeJob.area}
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={18} color={theme.accentText} />
          </Pressable>
        )}

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dagens plan</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Icon name="calendar-outline" size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen oppdrag i dag</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Sjekk forespørsler for å se nye muligheter.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {jobs.map((job, idx) => (
              <TimelineRow
                key={job._id}
                job={job}
                isLast={idx === jobs.length - 1}
                onPress={() => router.push(`/pro/job/${job._id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineRow({
  job,
  isLast,
  onPress,
}: {
  job: Doc<'cleanerJobs'>;
  isLast: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const status = job.status as JobStatus;
  const dotColor =
    status === 'in_progress' ? theme.accent : status === 'completed' ? '#3D9970' : theme.surfaceMuted;

  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLeft}>
        <Text style={[styles.tlTime, { color: theme.textSecondary }]}>{fmtTime(job.startsAt)}</Text>
        {!isLast && <View style={[styles.tlLine, { backgroundColor: theme.surfaceMuted }]} />}
      </View>

      <View style={[styles.tlDot, { backgroundColor: dotColor }]} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.jobCard,
          { backgroundColor: theme.surface },
          status === 'in_progress' && { borderLeftWidth: 3, borderLeftColor: theme.accent },
          pressed && { opacity: 0.85 },
        ]}>
        <View style={styles.jobTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobName, { color: theme.text }]}>{job.customerName}</Text>
            <Text style={[styles.jobAddress, { color: theme.textSecondary }]}>
              {job.address} · {job.area}
            </Text>
          </View>
          <Pill label={JOB_STATUS_LABEL[status]} tone={JOB_STATUS_TONE[status]} />
        </View>
        <View style={styles.jobMeta}>
          <Icon name="time-outline" size={13} color={theme.textMuted} />
          <Text style={[styles.jobMetaText, { color: theme.textMuted }]}>
            {fmtTime(job.startsAt)}–{fmtEndTime(job.startsAt, job.durationHours)} · {job.service}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: accent ? theme.accent : theme.surface }]}>
      <Text style={[styles.statValue, { color: accent ? theme.accentText : theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: accent ? theme.accentText : theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.ten },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.four,
  },
  greeting: { ...Typography.title },
  date: { ...Typography.callout, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.four },
  statCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.lg, gap: 2 },
  statValue: { ...Typography.headline, fontWeight: '700' },
  statLabel: { ...Typography.caption },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.four, marginBottom: Spacing.four,
    padding: Spacing.four, borderRadius: Radius.lg,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.two },
  bannerText: { flex: 1 },
  bannerTitle: { ...Typography.subhead, fontWeight: '600' },
  bannerSub: { ...Typography.caption, marginTop: 2 },
  sectionRow: { paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  sectionTitle: { ...Typography.subhead, fontWeight: '600' },
  timeline: { paddingHorizontal: Spacing.four, gap: 0 },
  tlRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.three },
  tlLeft: { width: 44, alignItems: 'flex-end', paddingTop: 13 },
  tlTime: { ...Typography.caption, fontVariant: ['tabular-nums'] },
  tlLine: { flex: 1, width: 1, marginTop: 4, marginBottom: -Spacing.three },
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 15, flexShrink: 0 },
  jobCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.md, gap: Spacing.two },
  jobTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  jobName: { ...Typography.bodyMedium },
  jobAddress: { ...Typography.caption, marginTop: 2 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { ...Typography.caption },
  loadingCenter: { paddingVertical: Spacing.eight, alignItems: 'center' },
  emptyBlock: { alignItems: 'center', paddingHorizontal: Spacing.six, paddingVertical: Spacing.eight, gap: Spacing.two },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center' },
  inboxBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  inboxBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  inboxBadgeText: { ...Typography.micro, fontWeight: '700', fontSize: 10 },
});

function InboxButton() {
  const theme = useTheme();
  const router = useRouter();
  const unread = useQuery(api.threads.unreadCount);
  return (
    <Pressable
      onPress={() => router.push('/inbox')}
      hitSlop={10}
      style={({ pressed }) => [
        styles.inboxBtn,
        { backgroundColor: theme.surface },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon name="chatbubble-outline" size={20} color={theme.text} />
      {unread != null && unread > 0 && (
        <View style={[styles.inboxBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.inboxBadgeText, { color: theme.accentText }]}>
            {unread > 9 ? '9+' : String(unread)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
