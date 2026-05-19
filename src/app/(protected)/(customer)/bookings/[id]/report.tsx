import { useMutation } from 'convex/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

type ReportReason = 'quality' | 'no_show' | 'damage' | 'safety' | 'other';

const REASONS: { key: ReportReason; icon: React.ComponentProps<typeof Icon>['name']; label: string; body: string }[] = [
  { key: 'no_show', icon: 'close-circle-outline',     label: 'Renholder møtte ikke opp',  body: 'Du ble ikke møtt på avtalt tid og sted.' },
  { key: 'quality', icon: 'thumbs-down-outline',      label: 'Dårlig kvalitet',           body: 'Jobben ble ikke fullført eller var ikke tilfredsstillende.' },
  { key: 'damage',  icon: 'warning-outline',          label: 'Skade på eiendeler',         body: 'Noe ble ødelagt eller skadet under jobben.' },
  { key: 'safety',  icon: 'shield-outline',           label: 'Sikkerhetsbekymring',        body: 'Upassende oppførsel eller noe utrygt skjedde.' },
  { key: 'other',   icon: 'ellipsis-horizontal-circle-outline', label: 'Annet',           body: 'Beskriv problemet i detaljer nedenfor.' },
];

export default function ReportProblemScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportProblem = useMutation(api.bookings.reportProblem);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      Alert.alert('Velg årsak', 'Velg hva problemet handler om.');
      return;
    }
    if (details.trim().length < 10) {
      Alert.alert('Skriv litt mer', 'Beskriv problemet i minst 10 tegn.');
      return;
    }
    setSubmitting(true);
    try {
      await reportProblem({
        bookingId: id as Id<'bookings'>,
        reason,
        details: details.trim(),
      });
      const isNoShow = reason === 'no_show';
      Alert.alert(
        'Takk',
        isNoShow
          ? 'Rapporten er sendt. Vi har pauset utbetalingen og kan hjelpe deg å finne en erstatter med en gang.'
          : 'Rapporten er sendt. Support tar kontakt innen 24 timer. Utbetalingen til renholderen er pauset i mellomtiden.',
        isNoShow
          ? [
              { text: 'Senere', style: 'cancel', onPress: () => router.back() },
              {
                text: 'Finn erstatter',
                onPress: () => router.replace('/utforsk'),
              },
            ]
          : [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert('Kunne ikke sende', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Rapporter problem',
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackTitle: 'Avbryt',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.lead, { color: theme.textSecondary }]}>
            Hva skjedde? Vi pauser utbetalingen til renholderen mens vi undersøker.
          </Text>

          <View style={styles.reasonList}>
            {REASONS.map((r) => {
              const isSelected = reason === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setReason(r.key)}
                  style={({ pressed }) => [
                    styles.reasonCard,
                    {
                      backgroundColor: isSelected ? theme.text : theme.surface,
                      borderColor: isSelected ? theme.text : theme.surfaceMuted,
                    },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <View
                    style={[
                      styles.reasonIcon,
                      { backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : theme.surfaceMuted },
                    ]}>
                    <Icon
                      name={r.icon}
                      size={18}
                      color={isSelected ? theme.background : theme.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        { color: isSelected ? theme.background : theme.text },
                      ]}>
                      {r.label}
                    </Text>
                    <Text
                      style={[
                        styles.reasonBody,
                        { color: isSelected ? 'rgba(255,255,255,0.75)' : theme.textSecondary },
                      ]}>
                      {r.body}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={20} color={theme.background} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>BESKRIV PROBLEMET</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Hva skjedde? Detaljer hjelper oss å hjelpe deg raskere."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[
              styles.textarea,
              { backgroundColor: theme.surface, color: theme.text },
            ]}
          />

          <Text style={[styles.legal, { color: theme.textMuted }]}>
            Falske rapporter kan føre til at kontoen din suspenderes. Vi tar
            alle rapporter seriøst og kontakter begge parter.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Button
            label="Send rapport"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={!reason || details.trim().length < 10 || submitting}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.eight, gap: Spacing.three },
  lead: { ...Typography.body, lineHeight: 22 },
  reasonList: { gap: Spacing.two },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonLabel: { ...Typography.bodyMedium, fontWeight: '600' },
  reasonBody: { ...Typography.caption, marginTop: 2, lineHeight: 16 },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
  },
  textarea: {
    ...Typography.body,
    minHeight: 120,
    padding: Spacing.three,
    borderRadius: Radius.md,
    lineHeight: 22,
  },
  legal: { ...Typography.caption, lineHeight: 16, marginTop: Spacing.two },
  footer: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
