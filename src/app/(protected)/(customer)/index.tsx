import { useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/customer/booking-card';
import { HomeHeader } from '@/components/customer/home-header';
import { RecurringPromo } from '@/components/customer/recurring-promo';
import { SectionHeader } from '@/components/customer/section-header';
import { ServiceTile } from '@/components/customer/service-tile';
import { Heading } from '@/components/ui/heading';
import { SearchBar } from '@/components/ui/search-bar';
import { Spacing } from '@/constants/theme';
import { adaptBooking } from '@/data/adapters';
import { greeting } from '@/data/mock-user';
import { useTheme } from '@/hooks/use-theme';
import type { ServiceType } from '@/data/mock-bookings';
import { api } from 'convex/_generated/api';

export default function CustomerHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');

  const nextUpcomingDoc = useQuery(api.bookings.nextUpcoming);

  const upcoming = useMemo(
    () => (nextUpcomingDoc ? adaptBooking(nextUpcomingDoc) : null),
    [nextUpcomingDoc],
  );

  const firstName =
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    '';

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] ?? '')).toUpperCase()
    : firstName[0]?.toUpperCase() ?? '?';

  const services: ServiceType[] = ['home', 'deep', 'move', 'office'];

  function handleSearchSubmit() {
    if (searchText.trim()) {
      router.push({ pathname: '/utforsk', params: { q: searchText.trim() } });
    } else {
      router.push('/utforsk');
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <HomeHeader greeting={greeting()} firstName={firstName} initials={initials} />

        <View style={styles.titleBlock}>
          <Heading variant="display">Finn ditt{'\n'}perfekte renhold</Heading>
        </View>

        <View style={styles.searchBlock}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onFilterPress={() => router.push('/utforsk')}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>

        <View style={styles.servicesRow}>
          {services.map((s, i) => (
            <View key={s} style={{ flex: 1, marginLeft: i === 0 ? 0 : Spacing.two }}>
              <ServiceTile
                type={s}
                onPress={() => router.push({ pathname: '/utforsk', params: { service: s } })}
              />
            </View>
          ))}
        </View>

        {upcoming && (
          <View style={styles.section}>
            <SectionHeader
              title="Kommende booking"
              actionLabel="Se alle"
              onActionPress={() => router.push('/bookings')}
            />
            <BookingCard
              booking={upcoming}
              variant="feature"
              onPress={() => router.push(`/bookings/${upcoming.id}`)}
            />
          </View>
        )}

        <View style={styles.section}>
          <RecurringPromo onSetup={() => router.push({ pathname: '/utforsk', params: { service: 'regular' } })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.eight },
  titleBlock: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  searchBlock: { paddingHorizontal: Spacing.four },
  servicesRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
});
