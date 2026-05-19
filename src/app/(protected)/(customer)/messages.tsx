import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { cleanerAvatar } from '@/data/asset-map';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

type Filter = 'all' | 'cleaners' | 'support';

const LABEL: Record<Filter, string> = {
  all: 'Alle',
  cleaners: 'Renholdere',
  support: 'Support',
};

export default function MessagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const threads = useQuery(api.threads.listMine);
  const isLoading = threads === undefined;

  const filtered = (threads ?? []).filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'support') return t.badge === 'support';
    return t.badge !== 'support';
  });

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
              { backgroundColor: filter === f ? theme.text : theme.surfaceMuted },
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
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.eight }} color={theme.textSecondary} />
        ) : filtered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            Ingen meldinger ennå. Book en renholder for å starte en samtale.
          </Text>
        ) : (
          filtered.map((t) => (
            <Pressable
              key={t._id}
              onPress={() => router.push(`/thread/${t._id}`)}
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
              <Avatar
                uri={cleanerAvatar(t.cleanerSlug)}
                size={48}
                initials={t.cleanerInitials}
              />
              <View style={styles.threadBody}>
                <View style={styles.threadTopRow}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {t.cleanerShortName}
                    </Text>
                    {t.badge && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              t.badge === 'next' ? theme.text : theme.warmTaupe,
                          },
                        ]}>
                        <Text style={[styles.badgeLabel, { color: '#fff' }]}>
                          {t.badge === 'next' ? 'NEXT' : 'SUPPORT'}
                        </Text>
                      </View>
                    )}
                    {t.unread && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
                    )}
                  </View>
                  <Text style={[styles.time, { color: theme.textSecondary }]}>
                    {timeAgo(t.lastMessageAt)}
                  </Text>
                </View>
                <Text
                  style={[styles.preview, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  {t.preview}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}t`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return format(new Date(timestamp), 'd. MMM');
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
  empty: { ...Typography.body, textAlign: 'center', paddingTop: Spacing.eight },
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
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  time: { ...Typography.caption },
  preview: { ...Typography.callout },
  pressed: { opacity: 0.85 },
});
