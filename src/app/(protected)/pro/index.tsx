import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { mockCleanerJobs, type CleanerJob } from '@/data/mock-cleaner-jobs';
import { useTheme } from '@/hooks/use-theme';

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

const JOB_STATUS_LABEL: Record<CleanerJob['status'], string> = {
  completed: 'Fullført',
  in_progress: 'Pågår',
  upcoming: 'Kommende',
};

const JOB_STATUS_TONE: Record<CleanerJob['status'], 'info' | 'accent' | 'neutral'> = {
  completed: 'neutral',
  in_progress: 'accent',
  upcoming: 'info',
};

export default function CleanerTodayScreen() {
  const theme = useTheme();
  const router = useRouter();

  const jobs = mockCleanerJobs;
  const activeJob = jobs.find((j) => j.status === 'in_progress');
  const totalKr = jobs.reduce((s, j) => s + j.totalKr, 0);
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  const now = new Date();
  const todayLabel = `${DAY_NAMES[now.getDay()]} ${now.getDate()}. ${MONTH_NAMES[now.getMonth()]}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>God dag, Maja</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>{todayLabel}</Text>
          </View>
          <Avatar initials="ML" size={42} tone="taupe" />
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatCard value={`${totalKr.toLocaleString('nb-NO')} kr`} label="Inntekt i dag" accent />
          <StatCard value={String(jobs.length)} label="Oppdrag" />
          <StatCard value={`${completedCount}/${jobs.length}`} label="Fullført" />
        </View>

        {/* Active job banner */}
        {activeJob && (
          <Pressable
            onPress={() => router.push(`/pro/job/${activeJob.id}`)}
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

        {/* Timeline */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dagens plan</Text>
        </View>

        <View style={styles.timeline}>
          {jobs.map((job, idx) => (
            <TimelineRow
              key={job.id}
              job={job}
              isLast={idx === jobs.length - 1}
              onPress={() => router.push(`/pro/job/${job.id}`)}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineRow({
  job,
  isLast,
  onPress,
}: {
  job: CleanerJob;
  isLast: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dotColor =
    job.status === 'in_progress'
      ? theme.accent
      : job.status === 'completed'
        ? '#3D9970'
        : theme.surfaceMuted;

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
          job.status === 'in_progress' && { borderLeftWidth: 3, borderLeftColor: theme.accent },
          pressed && { opacity: 0.85 },
        ]}>
        <View style={styles.jobTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobName, { color: theme.text }]}>{job.customerName}</Text>
            <Text style={[styles.jobAddress, { color: theme.textSecondary }]}>
              {job.address} · {job.area}
            </Text>
          </View>
          <Pill label={JOB_STATUS_LABEL[job.status]} tone={JOB_STATUS_TONE[job.status]} />
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
    <View
      style={[
        styles.statCard,
        { backgroundColor: accent ? theme.accent : theme.surface },
      ]}>
      <Text style={[styles.statValue, { color: accent ? theme.accentText : theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: accent ? theme.accentText : theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.ten },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  greeting: { ...Typography.title },
  date: { ...Typography.callout, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: 2,
  },
  statValue: { ...Typography.headline, fontWeight: '700' },
  statLabel: { ...Typography.caption },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.lg,
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
  tlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 15,
    flexShrink: 0,
  },

  jobCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  jobTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  jobName: { ...Typography.bodyMedium },
  jobAddress: { ...Typography.caption, marginTop: 2 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobMetaText: { ...Typography.caption },
});
