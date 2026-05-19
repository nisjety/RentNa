import { useMutation, useQuery } from 'convex/react';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Doc } from 'convex/_generated/dataModel';

const DAY_NAMES_SHORT = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MONTH_NAMES_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'mai', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'des',
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()}. ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

const SERVICE_COLOR: Record<string, string> = {
  home: '#D7E3EC',
  deep: '#E5DFD2',
  move: '#F5D4D4',
  office: '#ECE8E1',
};

export default function RequestsScreen() {
  const theme = useTheme();
  const requests = useQuery(api.cleanerPro.listRequests, { status: 'pending' });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.titleBar}>
        <Heading variant="title">Forespørsler</Heading>
        {requests && requests.length > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.text }]}>
            <Text style={[styles.badgeText, { color: theme.background }]}>{requests.length}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {requests === undefined ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.textSecondary} />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="checkmark-circle-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Ingen ventende forespørsler
            </Text>
          </View>
        ) : (
          requests.map((req) => <RequestCard key={req._id} request={req} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({ request }: { request: Doc<'jobRequests'> }) {
  const theme = useTheme();
  const accept = useMutation(api.cleanerPro.acceptRequest);
  const decline = useMutation(api.cleanerPro.declineRequest);
  const [isAccepted, setIsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    setBusy(true);
    try {
      await accept({ requestId: request._id });
      setIsAccepted(true);
    } catch (err) {
      Alert.alert('Kunne ikke akseptere', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    setBusy(true);
    try {
      await decline({ requestId: request._id });
    } catch (err) {
      Alert.alert('Kunne ikke avslå', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface },
        isAccepted && { borderLeftWidth: 3, borderLeftColor: '#3D9970' },
      ]}>
      <View style={styles.cardTop}>
        <Avatar initials={request.customerInitials} size={44} tone="blue" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.customerName, { color: theme.text }]}>{request.customerName}</Text>
          <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>
            {request.service} · {request.durationHours}t
          </Text>
        </View>
        <View style={[styles.ratePill, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.rateText, { color: theme.text }]}>
            {request.proposedRateKr} kr/t
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <DetailChip icon="location-outline" label={`${request.address} · ${request.area}`} />
        <DetailChip icon="calendar-outline" label={fmtDate(request.proposedDate)} />
        <DetailChip
          icon="cash-outline"
          label={`${(request.proposedRateKr * request.durationHours).toLocaleString('nb-NO')} kr`}
        />
      </View>

      {request.message && (
        <View style={[styles.messageBox, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name="chatbubble-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.messageText, { color: theme.textSecondary }]}>
            {request.message}
          </Text>
        </View>
      )}

      {isAccepted ? (
        <View style={[styles.acceptedBanner, { backgroundColor: '#3D9970' + '22' }]}>
          <Icon name="checkmark-circle" size={16} color="#3D9970" />
          <Text style={[styles.acceptedText, { color: '#3D9970' }]}>
            Akseptert — kunden varsles
          </Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            label="Avslå"
            variant="secondary"
            size="sm"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={handleDecline}
            loading={busy}
          />
          <Button
            label="Aksepter"
            variant="primary"
            size="sm"
            fullWidth={false}
            style={{ flex: 1 }}
            onPress={handleAccept}
            loading={busy}
          />
        </View>
      )}
    </View>
  );
}

function DetailChip({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={13} color={theme.textMuted} />
      <Text style={[styles.chipText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
  },
  badge: {
    minWidth: 22, height: 22, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { ...Typography.micro, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.ten, gap: Spacing.three },
  center: { paddingVertical: Spacing.ten, alignItems: 'center' },
  empty: { marginTop: Spacing.ten, alignItems: 'center', gap: Spacing.three },
  emptyText: { ...Typography.body, textAlign: 'center' },
  card: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  customerName: { ...Typography.subhead, fontWeight: '600' },
  serviceLabel: { ...Typography.caption, marginTop: 2 },
  ratePill: { paddingHorizontal: Spacing.three, paddingVertical: 5, borderRadius: Radius.pill },
  rateText: { ...Typography.caption, fontWeight: '600' },
  detailsRow: { gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { ...Typography.caption },
  messageBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  messageText: { ...Typography.caption, flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md },
  acceptedText: { ...Typography.callout, fontWeight: '600' },
});
