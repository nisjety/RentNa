import { useAction, useMutation, useQuery } from 'convex/react';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/customer/screen-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { adaptBooking } from '@/data/adapters';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const bookingDoc = useQuery(
    api.bookings.getById,
    id ? { id: id as Id<'bookings'> } : 'skip',
  );
  const syncVipps = useAction(api.vipps.syncStatus);

  // Pull the latest Vipps state on open if we have a reference and payment
  // is still pre-capture (returns from the redirect flow update via this).
  useEffect(() => {
    if (!bookingDoc?.vippsReference) return;
    if (bookingDoc.paymentStatus === 'captured' || bookingDoc.paymentStatus === 'refunded') {
      return;
    }
    syncVipps({ bookingId: bookingDoc._id }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingDoc?._id, bookingDoc?.vippsReference]);

  if (bookingDoc === undefined) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Booking" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (bookingDoc === null) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Booking" />
        <View style={styles.center}>
          <Text style={{ color: theme.textSecondary }}>Booking ikke funnet.</Text>
          <Button label="Tilbake" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const booking = adaptBooking(bookingDoc);
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
            source={booking.imageUrl}
            style={styles.hero}
            contentFit="cover"
            transition={200}
          />
          <StatusPill status={booking.status} style={styles.heroPill} />
        </View>

        <View style={styles.bodyBlock}>
          <Text style={[styles.bookingTitle, { color: theme.text }]}>{booking.service}</Text>

          {bookingDoc.status === 'in_progress' && bookingDoc.etaMinutes != null && (
            <View style={[styles.etaBanner, { backgroundColor: '#F5E6C8' }]}>
              <Icon name="navigate" size={18} color="#7A4F00" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.etaTitle, { color: '#7A4F00' }]}>
                  Renholder er på vei
                </Text>
                <Text style={[styles.etaBody, { color: '#7A4F00' }]}>
                  ~{bookingDoc.etaMinutes} min unna — du blir varslet ved ankomst
                </Text>
              </View>
            </View>
          )}

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
                onPress={() => router.push(`/cleaner/${booking.cleaner.id}`)}
                style={({ pressed }) => [
                  styles.chatBtn,
                  { backgroundColor: theme.surfaceMuted },
                  pressed && { opacity: 0.8 },
                ]}>
                <Icon name="chatbubble-outline" size={18} color={theme.text} />
              </Pressable>
            }
          />

          <ServiceLine iconName="cube-outline" label="Tjenester" value={booking.service} chevron />

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

          {booking.recurring && (
            <ServiceLine
              iconName="refresh-outline"
              label="Hyppighet"
              value={
                booking.recurring === 'weekly'
                  ? 'Hver uke'
                  : booking.recurring === 'biweekly'
                    ? 'Annenhver uke'
                    : 'Hver måned'
              }
            />
          )}

          <PaymentBlock
            paymentStatus={bookingDoc.paymentStatus}
            paymentBrand={booking.payment.brand}
            paymentLast4={booking.payment.last4}
            totalKr={booking.totalKr}
            refundKr={bookingDoc.refundKr}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <BookingFooter
          bookingId={bookingDoc._id}
          status={bookingDoc.status}
          completedAt={bookingDoc.completedAt}
          cleanerId={booking.cleaner.id}
          refundKr={bookingDoc.refundKr}
          cancellationFeeKr={bookingDoc.cancellationFeeKr}
        />
      </View>
    </SafeAreaView>
  );
}

function PaymentBlock({
  paymentStatus,
  paymentBrand,
  paymentLast4,
  totalKr,
  refundKr,
}: {
  paymentStatus?: string;
  paymentBrand: string;
  paymentLast4: string;
  totalKr: number;
  refundKr?: number;
}) {
  const theme = useTheme();
  const router = useRouter();

  const brandLabel =
    paymentBrand === 'vipps'
      ? 'Vipps'
      : `${paymentBrand[0].toUpperCase()}${paymentBrand.slice(1)} · Kort ${paymentLast4}`;

  const status = paymentStatus ?? 'authorized';
  const meta =
    status === 'failed'
      ? { bg: '#F5D4D4', fg: '#B0413E', icon: 'alert-circle' as const, line: 'Betaling feilet — kontakt support' }
      : status === 'refunded'
        ? { bg: '#D8DEE5', fg: '#3D5A6A', icon: 'arrow-undo' as const, line: `Refundert ${(refundKr ?? totalKr).toLocaleString('nb-NO')} kr` }
        : status === 'partial_refund'
          ? { bg: '#F5E6C8', fg: '#7A4F00', icon: 'arrow-undo' as const, line: `Delvis refundert · ${(refundKr ?? 0).toLocaleString('nb-NO')} kr` }
          : status === 'captured'
            ? { bg: '#D6EED9', fg: '#0F7A3E', icon: 'checkmark-circle' as const, line: `Belastet ${totalKr.toLocaleString('nb-NO')} kr` }
            : { bg: theme.surfaceMuted, fg: theme.textSecondary, icon: 'lock-closed' as const, line: `Reservert ${totalKr.toLocaleString('nb-NO')} kr` };

  return (
    <View style={[styles.paymentBlock, { backgroundColor: meta.bg }]}>
      <Icon name={meta.icon} size={20} color={meta.fg} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.paymentLabel, { color: meta.fg }]}>{brandLabel}</Text>
        <Text style={[styles.paymentLine, { color: meta.fg }]}>{meta.line}</Text>
      </View>
      {status === 'failed' && (
        <Pressable
          hitSlop={8}
          onPress={() =>
            router.push({
              pathname: '/profile/payment',
            })
          }>
          <Text style={[styles.paymentSupport, { color: meta.fg }]}>Support</Text>
        </Pressable>
      )}
    </View>
  );
}

function BookingFooter({
  bookingId,
  status,
  completedAt,
  cleanerId,
  refundKr,
  cancellationFeeKr,
}: {
  bookingId: Id<'bookings'>;
  status: string;
  completedAt?: number;
  cleanerId: string;
  refundKr?: number;
  cancellationFeeKr?: number;
}) {
  const theme = useTheme();
  const router = useRouter();
  const approve = useMutation(api.bookings.approve);
  const [approving, setApproving] = useState(false);
  const [countdown, setCountdown] = useState('');

  // 12h auto-release countdown
  useEffect(() => {
    if (status !== 'pending_approval' || !completedAt) return;
    const tick = () => {
      const deadline = completedAt + 12 * 3600 * 1000;
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setCountdown('snart');
        return;
      }
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      setCountdown(hours > 0 ? `${hours}t ${minutes}m` : `${minutes}m`);
    };
    tick();
    const t = setInterval(tick, 30 * 1000);
    return () => clearInterval(t);
  }, [status, completedAt]);

  async function handleApprove() {
    setApproving(true);
    try {
      await approve({ bookingId });
    } catch (err) {
      Alert.alert('Kunne ikke godkjenne', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setApproving(false);
    }
  }

  if (status === 'pending_approval') {
    return (
      <View style={styles.approvalFooter}>
        <View style={[styles.countdownPill, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name="time-outline" size={13} color={theme.textSecondary} />
          <Text style={[styles.countdownText, { color: theme.textSecondary }]}>
            Auto-godkjennes om {countdown}
          </Text>
        </View>
        <View style={styles.approvalBtns}>
          <Button
            label="Rapporter problem"
            variant="secondary"
            size="lg"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={() => router.push(`/bookings/${bookingId}/report`)}
          />
          <Button
            label="Godkjenn jobb"
            variant="primary"
            size="lg"
            fullWidth={false}
            style={{ flex: 1.3 }}
            loading={approving}
            onPress={handleApprove}
          />
        </View>
      </View>
    );
  }

  if (status === 'approved' || status === 'completed') {
    return (
      <View style={{ gap: Spacing.two }}>
        <View style={[styles.approvedBanner, { backgroundColor: '#3D9970' + '22' }]}>
          <Icon name="checkmark-circle" size={18} color="#3D9970" />
          <Text style={[styles.approvedText, { color: '#3D9970' }]}>
            Godkjent — renholderen er betalt
          </Text>
        </View>
        <Button
          label="Book igjen"
          variant="primary"
          size="lg"
          onPress={() => router.push(`/cleaner/${cleanerId}`)}
        />
      </View>
    );
  }

  if (status === 'disputed') {
    return (
      <View style={[styles.approvedBanner, { backgroundColor: '#F5D4D4' }]}>
        <Icon name="alert-circle" size={18} color="#B0413E" />
        <Text style={[styles.approvedText, { color: '#B0413E' }]}>
          Problem rapportert — support tar kontakt
        </Text>
      </View>
    );
  }

  if (status === 'cancelled') {
    return (
      <View style={{ gap: Spacing.two }}>
        <View style={[styles.approvedBanner, { backgroundColor: '#EFEFEF' }]}>
          <Icon name="close-circle" size={18} color="#666" />
          <Text style={[styles.approvedText, { color: '#666' }]}>
            {refundKr != null && refundKr > 0
              ? `Avlyst — ${refundKr.toLocaleString('nb-NO')} kr refundert`
              : `Avlyst${cancellationFeeKr ? ` — ${cancellationFeeKr.toLocaleString('nb-NO')} kr gebyr` : ''}`}
          </Text>
        </View>
        <Button
          label="Book igjen"
          variant="primary"
          size="lg"
          onPress={() => router.push(`/cleaner/${cleanerId}`)}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <Button
        label="Kontakt renholder"
        variant="primary"
        size="lg"
        onPress={() => router.push(`/cleaner/${cleanerId}`)}
      />
      {(status === 'upcoming' || status === 'in_progress') && (
        <Pressable
          onPress={() => router.push(`/bookings/${bookingId}/cancel`)}
          hitSlop={6}
          style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.cancelLinkText, { color: '#B0413E' }]}>
            Avlys booking
          </Text>
        </Pressable>
      )}
    </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingBottom: 120 },
  screenTitle: {
    ...Typography.title,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  heroWrap: { paddingHorizontal: Spacing.four },
  hero: { width: '100%', height: 220, borderRadius: Radius.xl },
  heroPill: { position: 'absolute', top: Spacing.three, right: Spacing.six },
  bodyBlock: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three },
  bookingTitle: { ...Typography.headline, marginBottom: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  metaText: { ...Typography.callout },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.three },
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
  approvalFooter: { gap: Spacing.two },
  countdownPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  countdownText: { ...Typography.caption, fontWeight: '600' },
  approvalBtns: { flexDirection: 'row', gap: Spacing.two },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  approvedText: { ...Typography.bodyMedium, fontWeight: '600' },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    marginBottom: Spacing.three,
  },
  etaTitle: { ...Typography.bodyMedium, fontWeight: '700' },
  etaBody: { ...Typography.caption, marginTop: 2 },
  cancelLink: { alignSelf: 'center', paddingVertical: 8 },
  cancelLinkText: { ...Typography.caption, fontWeight: '600', textDecorationLine: 'underline' },
  paymentBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  paymentLabel: { ...Typography.caption, fontWeight: '600' },
  paymentLine: { ...Typography.bodyMedium, fontWeight: '600', marginTop: 2 },
  paymentSupport: { ...Typography.caption, fontWeight: '700', textDecorationLine: 'underline' },
});
