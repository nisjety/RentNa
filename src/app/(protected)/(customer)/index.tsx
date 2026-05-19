import { useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthSetupBannerAuto } from '@/components/agency/auth-setup-banner';
import { BookingCard } from '@/components/customer/booking-card';
import { HomeHeader } from '@/components/customer/home-header';
import { RecurringPromo } from '@/components/customer/recurring-promo';
import { SectionHeader } from '@/components/customer/section-header';
import { ServiceTile } from '@/components/customer/service-tile';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { adaptBooking } from '@/data/adapters';
import { greeting } from '@/data/mock-user';
import { useTheme } from '@/hooks/use-theme';
import type { ServiceType } from '@/data/mock-bookings';
import { api } from 'convex/_generated/api';

export default function CustomerHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useUser();

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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <HomeHeader greeting={greeting()} firstName={firstName} initials={initials} />

        <AuthSetupBannerAuto />

        <View style={styles.titleBlock}>
          <Heading variant="display">Finn ditt{'\n'}perfekte renhold</Heading>
        </View>

        <View style={styles.searchBlock}>
          <Pressable
            onPress={() => router.push({ pathname: '/utforsk', params: { focus: '1' } })}
            style={({ pressed }) => [
              styles.searchPseudo,
              { backgroundColor: theme.surface },
              pressed && { opacity: 0.85 },
            ]}>
            <Icon name="search-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.searchPseudoText, { color: theme.textMuted }]}>
              Søk renholder, område, tjeneste…
            </Text>
            <View style={[styles.searchFilter, { backgroundColor: theme.surfaceMuted }]}>
              <Icon name="options-outline" size={18} color={theme.text} />
            </View>
          </Pressable>
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
  searchPseudo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.four, paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  searchPseudoText: { ...Typography.body, flex: 1 },
  searchFilter: {
    width: 36, height: 36, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  servicesRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  section: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
});
