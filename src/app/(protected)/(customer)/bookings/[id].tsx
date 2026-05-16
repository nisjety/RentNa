import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/customer/screen-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getBookingById } from '@/data/mock-bookings';
import { useTheme } from '@/hooks/use-theme';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const booking = id ? getBookingById(id) : undefined;

  if (!booking) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Booking" />
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary }}>Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="" rightAction="ellipsis" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Bookingdetaljer</Text>

        <View style={styles.heroWrap}>
          <Image
            source={{ uri: booking.imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={200}
          />
          <StatusPill status={booking.status} style={styles.heroPill} />
        </View>

        <View style={styles.bodyBlock}>
          <Text style={[styles.bookingTitle, { color: theme.text }]}>{booking.service}</Text>

          <MetaRow
            icon="calendar-outline"
            text={`${format(start, 'EEE, d MMM')}  •  ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
          />
          <MetaRow icon="location-outline" text={booking.address} />
          <MetaRow icon="receipt-outline" text={`Ordre #${booking.orderNumber}`} />

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <DetailRow
            left={
              <View style={styles.cleanerLeft}>
                <Avatar uri={booking.cleaner.avatarUrl} size={40} />
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Renholder
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {booking.cleaner.name}
                  </Text>
                </View>
              </View>
            }
            right={
              <Pressable
                hitSlop={10}
                style={({ pressed }) => [
                  styles.chatBtn,
                  { backgroundColor: theme.surfaceMuted },
                  pressed && { opacity: 0.8 },
                ]}>
                <Icon name="chatbubble-outline" size={18} color={theme.text} />
              </Pressable>
            }
          />

          <ServiceLine
            iconName="cube-outline"
            label="Tjenester"
            value="Standard hjemvask"
            chevron
          />

          {booking.addOns.map((a) => (
            <ServiceLine
              key={a.id}
              iconName="add-circle-outline"
              label="Tillegg"
              value={a.label}
              trailing={`+ ${a.priceKr} kr`}
            />
          ))}

          <ServiceLine
            iconName="card-outline"
            label="Betaling"
            value={
              booking.payment.brand === 'vipps'
                ? 'Vipps'
                : `${booking.payment.brand[0].toUpperCase()}${booking.payment.brand.slice(1)} · Kort ${booking.payment.last4}`
            }
            trailing={`${booking.totalKr.toLocaleString('no-NO')} kr`}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button label="Kontakt renholder" variant="primary" size="lg" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function MetaRow({ icon, text }: { icon: React.ComponentProps<typeof Icon>['name']; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={16} color={theme.textSecondary} />
      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

function DetailRow({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <View style={{ flex: 1 }}>{left}</View>
      {right}
    </View>
  );
}

function ServiceLine({
  iconName,
  label,
  value,
  trailing,
  chevron,
}: {
  iconName: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
  trailing?: string;
  chevron?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name={iconName} size={18} color={theme.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
      </View>
      {trailing && (
        <Text style={[styles.detailValue, { color: theme.text }]}>{trailing}</Text>
      )}
      {chevron && <Icon name="chevron-forward" size={18} color={theme.textMuted} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 120 },
  screenTitle: {
    ...Typography.title,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  heroWrap: { paddingHorizontal: Spacing.four },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
  },
  heroPill: { position: 'absolute', top: Spacing.three, right: Spacing.six },
  bodyBlock: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  bookingTitle: { ...Typography.headline, marginBottom: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  metaText: { ...Typography.callout },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.three,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1 },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { ...Typography.caption },
  detailValue: { ...Typography.bodyMedium, marginTop: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
