import { useMutation, useQuery } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

const POLICY_LABEL: Record<'free' | 'partial' | 'full', { title: string; body: string }> = {
  free:    { title: 'Gratis avbestilling',     body: 'Du får alt refundert. Renholderen får ingen kompensasjon.' },
  partial: { title: 'Sen avbestilling — 50%',  body: 'Du får halvparten refundert. Renholderen mottar resten som kompensasjon for blokkert tid.' },
  full:    { title: 'Avbestilling under 4 timer', body: 'Ingen refundering. Hele beløpet går til renholderen.' },
};

function formatKr(n: number) {
  return n.toLocaleString('nb-NO');
}

export default function CancelBookingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = id as Id<'bookings'>;
  const policy = useQuery(api.bookings.cancellationPolicy, id ? { bookingId } : 'skip');
  const cancel = useMutation(api.bookings.cancel);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await cancel({ bookingId, reason: reason.trim() || undefined });
      Alert.alert(
        'Booking avlyst',
        policy && policy.canCancel && policy.refundKr > 0
          ? `${formatKr(policy.refundKr)} kr refunderes til kortet ditt innen 3 dager.`
          : 'Bookingen er avlyst.',
        [{ text: 'OK', onPress: () => router.replace('/bookings') }],
      );
    } catch (err) {
      Alert.alert('Kunne ikke avlyse', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Avlys booking',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackTitle: 'Tilbake',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {policy === undefined ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.textSecondary} />
            </View>
          ) : policy === null || !policy.canCancel ? (
            <View style={styles.center}>
              <Icon name="alert-circle-outline" size={36} color={theme.textMuted} />
              <Text style={[styles.heading, { color: theme.text }]}>Kan ikke avlyses</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {policy?.reason ?? 'Bookingen kan ikke avlyses i denne statusen.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.tierCard, { backgroundColor: tierBg(policy.policy) }]}>
                <Text style={[styles.tierTitle, { color: tierFg(policy.policy) }]}>
                  {POLICY_LABEL[policy.policy].title}
                </Text>
                <Text style={[styles.tierBody, { color: tierFg(policy.policy) }]}>
                  {POLICY_LABEL[policy.policy].body}
                </Text>
                <Text style={[styles.tierWindow, { color: tierFg(policy.policy) }]}>
                  {policy.hoursUntilStart >= 1
                    ? `${Math.round(policy.hoursUntilStart)} t igjen til oppstart`
                    : `${Math.round(policy.hoursUntilStart * 60)} min igjen til oppstart`}
                </Text>
              </View>

              <View style={[styles.breakdown, { backgroundColor: theme.surface }]}>
                <BreakdownRow
                  label="Totalsum"
                  value={`${formatKr(policy.totalKr)} kr`}
                  muted
                />
                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                <BreakdownRow
                  label="Avbestillingsgebyr"
                  value={`-${formatKr(policy.feeKr)} kr`}
                  tint={policy.feeKr > 0 ? '#B0413E' : undefined}
                />
                <BreakdownRow
                  label="Refundert"
                  value={`${formatKr(policy.refundKr)} kr`}
                  tint="#0F7A3E"
                  bold
                />
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                ÅRSAK (VALGFRITT)
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Endrede planer, fant en annen renholder, …"
                placeholderTextColor={theme.textMuted}
                multiline
                style={[styles.textarea, { backgroundColor: theme.surface, color: theme.text }]}
                maxLength={240}
              />

              <Text style={[styles.legal, { color: theme.textMuted }]}>
                Refunderingen skjer til samme kort/Vipps innen 3 virkedager. Hyppige
                avbestillinger sent kan påvirke prisen din i framtiden.
              </Text>
            </>
          )}
        </ScrollView>

        {policy && policy.canCancel && (
          <View style={[styles.footer, { backgroundColor: theme.background }]}>
            <Button
              label={
                policy.feeKr === 0
                  ? 'Bekreft avbestilling'
                  : `Bekreft — ${formatKr(policy.feeKr)} kr gebyr`
              }
              variant="primary"
              size="lg"
              loading={submitting}
              onPress={handleConfirm}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BreakdownRow({
  label,
  value,
  muted,
  bold,
  tint,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  tint?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: muted ? theme.textSecondary : theme.text }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          {
            color: tint ?? theme.text,
            fontWeight: bold ? '700' : '600',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
}

function tierBg(policy: 'free' | 'partial' | 'full') {
  return policy === 'free' ? '#D6EED9' : policy === 'partial' ? '#F5E6C8' : '#F5D4D4';
}
function tierFg(policy: 'free' | 'partial' | 'full') {
  return policy === 'free' ? '#0F7A3E' : policy === 'partial' ? '#7A4F00' : '#B0413E';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.six, gap: Spacing.three },
  center: { alignItems: 'center', paddingVertical: Spacing.eight, gap: Spacing.two },
  heading: { ...Typography.subhead, fontWeight: '700' },
  body: { ...Typography.callout, textAlign: 'center', paddingHorizontal: Spacing.four },
  tierCard: { padding: Spacing.four, borderRadius: Radius.lg, gap: 4 },
  tierTitle: { ...Typography.bodyMedium, fontWeight: '700' },
  tierBody: { ...Typography.caption, lineHeight: 18 },
  tierWindow: { ...Typography.caption, marginTop: 6, opacity: 0.75 },
  breakdown: { borderRadius: Radius.lg, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowLabel: { ...Typography.body },
  rowValue: { ...Typography.body, fontVariant: ['tabular-nums'] },
  divider: { height: StyleSheet.hairlineWidth },
  label: { ...Typography.caption, fontWeight: '700', letterSpacing: 0.5, marginTop: Spacing.two },
  textarea: {
    ...Typography.body,
    minHeight: 80,
    padding: Spacing.three,
    borderRadius: Radius.md,
    lineHeight: 22,
  },
  legal: { ...Typography.caption, lineHeight: 16 },
  footer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
