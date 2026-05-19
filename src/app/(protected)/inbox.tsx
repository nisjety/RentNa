import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'nå';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}t`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return format(new Date(ts), 'd. MMM');
}

export default function CleanerInboxScreen() {
  const theme = useTheme();
  const router = useRouter();
  const threads = useQuery(api.threads.listForCleaner);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Meldinger</Text>
        <View style={{ width: 24 }} />
      </View>

      {threads === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Icon name="chatbubble-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen meldinger</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Kundene dine vil dukke opp her når de tar kontakt.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {threads.map((t) => (
            <Pressable
              key={t._id}
              onPress={() => router.push(`/thread/${t._id}`)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
              <Avatar initials={t.customerLabel.split(' ').pop()?.slice(0, 2).toUpperCase() ?? 'KU'} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.topLine}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {t.customerLabel}
                  </Text>
                  <Text style={[styles.time, { color: theme.textSecondary }]}>
                    {timeAgo(t.lastMessageAt)}
                  </Text>
                </View>
                <View style={styles.previewLine}>
                  <Text
                    style={[
                      styles.preview,
                      {
                        color: t.unreadCleaner ? theme.text : theme.textSecondary,
                        fontWeight: t.unreadCleaner ? '700' : '400',
                      },
                    ]}
                    numberOfLines={1}>
                    {t.preview}
                  </Text>
                  {t.unreadCleaner && (
                    <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: { ...Typography.subhead, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.six },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.eight, gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...Typography.bodyMedium, fontWeight: '700' },
  time: { ...Typography.caption },
  previewLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  preview: { ...Typography.callout, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
