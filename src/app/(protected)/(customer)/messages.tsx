import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { mockCleaners } from '@/data/mock-cleaners';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'all' | 'cleaners' | 'support';

interface MockThread {
  id: string;
  cleanerId: string;
  preview: string;
  unread: boolean;
  highlighted: boolean;
  timestamp: string;
  badge?: 'next' | 'support';
}

const NOW = new Date();

const threads: MockThread[] = [
  {
    id: 't_maja',
    cleanerId: 'cl_maja',
    preview: 'Hei Eva! Tirsdag stemmer fint. Ses kl. 11.',
    unread: true,
    highlighted: true,
    timestamp: new Date(NOW.getTime() - 20 * 60 * 1000).toISOString(),
    badge: 'next',
  },
  {
    id: 't_amir',
    cleanerId: 'cl_amir',
    preview: 'Du trenger ny tid 24/3?',
    unread: false,
    highlighted: false,
    timestamp: new Date(NOW.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't_support',
    cleanerId: 'cl_liv',
    preview: 'Velkommen til Rent Nå! Vi hjelper deg gjerne.',
    unread: false,
    highlighted: false,
    timestamp: new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    badge: 'support',
  },
  {
    id: 't_liv',
    cleanerId: 'cl_liv',
    preview: 'Bekreftet · Tor 2. apr 14:00',
    unread: false,
    highlighted: false,
    timestamp: new Date(NOW.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Heading variant="title">Meldinger</Heading>
        <View style={styles.headerActions}>
          <Pressable hitSlop={8} style={({ pressed }) => [pressed && styles.pressed]}>
            <Icon name="search-outline" size={22} color={theme.text} />
          </Pressable>
          <Pressable hitSlop={8} style={({ pressed }) => [pressed && styles.pressed]}>
            <Icon name="ellipsis-vertical" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['all', 'cleaners', 'support'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor: filter === f ? theme.text : theme.surfaceMuted,
              },
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.tabLabel,
                { color: filter === f ? theme.background : theme.textSecondary },
              ]}>
              {LABEL[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {threads.map((t) => {
          const cleaner = mockCleaners.find((c) => c.id === t.cleanerId);
          if (!cleaner) return null;
          return (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/cleaner/${cleaner.id}`)}
              style={({ pressed }) => [
                styles.thread,
                {
                  backgroundColor: t.highlighted ? theme.accent : 'transparent',
                  borderRadius: t.highlighted ? Radius.lg : 0,
                  padding: t.highlighted ? Spacing.three : 0,
                  marginHorizontal: t.highlighted ? -Spacing.two : 0,
                },
                pressed && styles.pressed,
              ]}>
              <Avatar uri={cleaner.avatarUrl} size={48} initials={cleaner.initials} />
              <View style={styles.threadBody}>
                <View style={styles.threadTopRow}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {cleaner.shortName}
                    </Text>
                    {t.badge && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: t.badge === 'next' ? theme.text : theme.warmTaupe },
                        ]}>
                        <Text style={[styles.badgeLabel, { color: '#fff' }]}>
                          {t.badge === 'next' ? 'NEXT' : 'SUPPORT'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.time, { color: theme.textSecondary }]}>
                    {timeAgo(t.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[styles.preview, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  {t.preview}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const LABEL: Record<Filter, string> = {
  all: 'Alle',
  cleaners: 'Renholdere',
  support: 'Support',
};

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}t`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return format(date, 'd. MMM');
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.four },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  tab: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: Radius.pill },
  tabLabel: { ...Typography.caption, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120, gap: Spacing.four },
  thread: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  threadBody: { flex: 1, gap: 2 },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...Typography.subhead },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  time: { ...Typography.caption },
  preview: { ...Typography.callout },
  pressed: { opacity: 0.85 },
});
