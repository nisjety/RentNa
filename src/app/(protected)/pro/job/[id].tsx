import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type ChecklistItem = Doc<'cleanerJobs'>['checklist'][number];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const job = useQuery(
    api.cleanerPro.getJob,
    id ? { jobId: id as Id<'cleanerJobs'> } : 'skip',
  );
  const toggleItem = useMutation(api.cleanerPro.toggleChecklistItem);
  const markComplete = useMutation(api.cleanerPro.markJobComplete);
  const [completing, setCompleting] = useState(false);

  if (job === undefined) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (job === null) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Icon name="alert-circle-outline" size={40} color={theme.textMuted} />
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>
            Oppdraget ble ikke funnet
          </Text>
          <Button label="Tilbake" variant="secondary" size="md" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const endTime = fmtTime(
    new Date(new Date(job.startsAt).getTime() + job.durationHours * 3600000).toISOString(),
  );

  const checklist = job.checklist;
  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const rooms = Array.from(new Set(checklist.map((c) => c.room)));

  async function handleToggle(itemId: string) {
    try {
      await toggleItem({ jobId: job!._id, itemId });
    } catch (err) {
      Alert.alert('Kunne ikke oppdatere', err instanceof Error ? err.message : 'Ukjent feil');
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await markComplete({ jobId: job!._id });
    } catch (err) {
      Alert.alert('Kunne ikke fullføre', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setCompleting(false);
    }
  }

  const isCompleted = job.status === 'completed';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{job.customerName}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {job.address} · {job.area}
          </Text>
        </View>
        <Pill
          label={
            job.status === 'in_progress'
              ? 'Pågår'
              : job.status === 'completed'
                ? 'Fullført'
                : 'Kommende'
          }
          tone={job.status === 'in_progress' ? 'accent' : 'neutral'}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoRow}>
          <InfoChip icon="time-outline" label={`${fmtTime(job.startsAt)}–${endTime}`} />
          <InfoChip icon="briefcase-outline" label={job.service} />
          <InfoChip icon="cash-outline" label={`${job.totalKr.toLocaleString('nb-NO')} kr`} />
        </View>

        {(job.floor || job.accessCode) && (
          <View style={[styles.accessCard, { backgroundColor: theme.surfaceMuted }]}>
            {job.floor && (
              <View style={styles.accessRow}>
                <Icon name="business-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.accessText, { color: theme.text }]}>{job.floor}</Text>
              </View>
            )}
            {job.accessCode && (
              <View style={styles.accessRow}>
                <Icon name="keypad-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.accessCode, { color: theme.text }]}>{job.accessCode}</Text>
              </View>
            )}
          </View>
        )}

        {job.notes && (
          <View style={[styles.notesCard, { backgroundColor: theme.surface }]}>
            <Icon name="chatbubble-outline" size={15} color={theme.textMuted} />
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{job.notes}</Text>
          </View>
        )}

        {checklist.length > 0 ? (
          <>
            <View style={styles.checklistHeader}>
              <Text style={[styles.checklistTitle, { color: theme.text }]}>Sjekkliste</Text>
              <Text style={[styles.checklistCount, { color: theme.textSecondary }]}>
                {doneCount}/{totalCount}
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: allDone ? '#3D9970' : theme.accent,
                    width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>

            {rooms.map((room) => (
              <View key={room} style={styles.roomSection}>
                <Text style={[styles.roomLabel, { color: theme.textSecondary }]}>{room}</Text>
                {checklist
                  .filter((c) => c.room === room)
                  .map((item) => (
                    <CheckRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggle(item.id)}
                    />
                  ))}
              </View>
            ))}
          </>
        ) : (
          <View style={[styles.noChecklist, { backgroundColor: theme.surface }]}>
            <Icon name="list-outline" size={24} color={theme.textMuted} />
            <Text style={[styles.noChecklistText, { color: theme.textSecondary }]}>
              Ingen sjekkliste for dette oppdraget
            </Text>
          </View>
        )}

        {job.status === 'in_progress' && (
          <View style={styles.finishSection}>
            <Button
              label={
                allDone || checklist.length === 0
                  ? 'Merk som fullført'
                  : `Fullfør (${doneCount}/${totalCount})`
              }
              variant="primary"
              size="lg"
              loading={completing}
              onPress={handleComplete}
            />
          </View>
        )}

        {isCompleted && (
          <View style={[styles.finishedBanner, { backgroundColor: '#3D9970' + '22', marginHorizontal: Spacing.four, marginTop: Spacing.five }]}>
            <Icon name="checkmark-circle" size={20} color="#3D9970" />
            <Text style={[styles.finishedText, { color: '#3D9970' }]}>
              Oppdrag fullført — kunden varsles
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.checkRow,
        { backgroundColor: theme.surface },
        item.done && { opacity: 0.7 },
        pressed && { opacity: 0.8 },
      ]}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: item.done ? '#3D9970' : 'transparent',
            borderColor: item.done ? '#3D9970' : theme.surfaceMuted,
          },
        ]}>
        {item.done && <Icon name="checkmark" size={13} color="#FFFFFF" />}
      </View>
      <Text
        style={[
          styles.checkLabel,
          { color: item.done ? theme.textMuted : theme.text },
          item.done && { textDecorationLine: 'line-through' },
        ]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function InfoChip({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.infoChip, { backgroundColor: theme.surface }]}>
      <Icon name={icon} size={14} color={theme.textSecondary} />
      <Text style={[styles.infoChipText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  notFoundText: { ...Typography.body },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: { ...Typography.subhead, fontWeight: '700' },
  headerSub: { ...Typography.caption, marginTop: 2 },
  scroll: { paddingBottom: Spacing.ten },
  infoRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  infoChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, padding: Spacing.three, borderRadius: Radius.md, justifyContent: 'center' },
  infoChipText: { ...Typography.caption, fontWeight: '600' },
  accessCard: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.three },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  accessText: { ...Typography.callout },
  accessCode: { ...Typography.callout, fontWeight: '700', letterSpacing: 1 },
  notesCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, marginHorizontal: Spacing.four, padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.three },
  notesText: { ...Typography.caption, flex: 1 },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, marginBottom: Spacing.two, marginTop: Spacing.two },
  checklistTitle: { ...Typography.subhead, fontWeight: '600' },
  checklistCount: { ...Typography.callout },
  progressTrack: { height: 4, marginHorizontal: Spacing.four, borderRadius: Radius.pill, marginBottom: Spacing.four, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  roomSection: { marginBottom: Spacing.three },
  roomLabel: { ...Typography.micro, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: Spacing.four, marginBottom: Spacing.two },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 24, height: 24, borderRadius: Radius.xs, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { ...Typography.body, flex: 1 },
  noChecklist: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginHorizontal: Spacing.four, padding: Spacing.four, borderRadius: Radius.lg, marginTop: Spacing.three },
  noChecklistText: { ...Typography.body },
  finishSection: { marginHorizontal: Spacing.four, marginTop: Spacing.five },
  finishedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  finishedText: { ...Typography.callout, fontWeight: '600' },
});
