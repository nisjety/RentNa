import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/customer/booking-card';
import { CleanerOnTheWay } from '@/components/customer/cleaner-on-the-way';
import { ScreenHeader } from '@/components/customer/screen-header';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { adaptBooking } from '@/data/adapters';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

type Tab = 'upcoming' | 'past';

const UPCOMING_STATUSES = new Set([
  'in_progress',
  'confirmed',
  'upcoming',
  'pending_approval',
]);
const PAST_STATUSES = new Set([
  'completed',
  'cancelled',
  'approved',
  'disputed',
]);

export default function BookingsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');

  const bookingDocs = useQuery(api.bookings.listMine);
  const onTheWayDoc = useQuery(api.bookings.cleanerOnTheWay);

  const allBookings = useMemo(
    () => (bookingDocs ?? []).map(adaptBooking),
    [bookingDocs],
  );

  const onTheWay = useMemo(
    () => (onTheWayDoc ? adaptBooking(onTheWayDoc) : null),
    [onTheWayDoc],
  );

  const bookings = allBookings.filter((b) =>
    tab === 'upcoming' ? UPCOMING_STATUSES.has(b.status) : PAST_STATUSES.has(b.status),
  );

  const isLoading = bookingDocs === undefined;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="" leftAction="none" rightAction="add" onRightPress={() => router.push('/')} />

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.text }]}>Mine bookinger</Text>
      </View>

      <View style={[styles.tabs, { borderBottomColor: theme.divider }]}>
        <TabButton label="Kommer" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabButton label="Tidligere" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: Spacing.eight }} color={theme.textSecondary} />
        ) : bookings.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            Ingen {tab === 'upcoming' ? 'kommende' : 'tidligere'} bestillinger ennå.
          </Text>
        ) : (
          bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => router.push(`/bookings/${b.id}`)}
            />
          ))
        )}
      </ScrollView>

      {onTheWay && tab === 'upcoming' && (
        <View style={styles.alert}>
          <CleanerOnTheWay
            booking={onTheWay}
            onPress={() => router.push(`/bookings/${onTheWay.id}`)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Text style={[styles.tabLabel, { color: active ? theme.text : theme.textMuted }]}>
        {label}
      </Text>
      {active && <View style={[styles.tabBar, { backgroundColor: theme.text }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleRow: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  title: { ...Typography.title },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: { paddingVertical: Spacing.three, alignItems: 'center' },
  tabLabel: { ...Typography.subhead },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: Radius.pill,
  },
  list: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 160 },
  empty: { ...Typography.body, textAlign: 'center', paddingTop: Spacing.eight },
  alert: {
    position: 'absolute',
    bottom: Spacing.six,
    left: Spacing.four,
    right: Spacing.four,
  },
});
