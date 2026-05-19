import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expMonth: number;
  expYear: number;
  primary?: boolean;
}

const BRAND_LABEL: Record<PaymentMethod['brand'], string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
};

export default function PaymentScreen() {
  const theme = useTheme();
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: '1', brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, primary: true },
  ]);

  function handleAdd() {
    Alert.alert(
      'Legg til betalingsmetode',
      'Kort tilkobles via Stripe i neste oppdatering. Inntil videre brukes Visa ****4242 automatisk.',
    );
  }

  function handleRemove(id: string) {
    Alert.alert('Fjern betalingsmetode?', '', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Fjern', style: 'destructive', onPress: () => setMethods(methods.filter((m) => m.id !== id)) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Betalingsmetoder' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {methods.map((m) => (
          <View key={m.id} style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={[styles.brandIcon, { backgroundColor: theme.surfaceMuted }]}>
              <Icon name="card-outline" size={18} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.brand, { color: theme.text }]}>{BRAND_LABEL[m.brand]} •••• {m.last4}</Text>
                {m.primary && (
                  <View style={[styles.pill, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.pillLabel, { color: theme.accentText }]}>PRIMÆR</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.expiry, { color: theme.textSecondary }]}>
                Utløper {String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}
              </Text>
            </View>
            <Pressable hitSlop={12} onPress={() => handleRemove(m.id)}>
              <Icon name="trash-outline" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
          <Icon name="add" size={18} color={theme.background} />
          <Text style={[styles.addLabel, { color: theme.background }]}>Legg til kort</Text>
        </Pressable>

        <Text style={[styles.legal, { color: theme.textMuted }]}>
          Betalinger sikres av Stripe. RentNå lagrer aldri kortinformasjonen din.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four, borderRadius: Radius.lg },
  brandIcon: { width: 44, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  brand: { ...Typography.bodyMedium, fontWeight: '600' },
  expiry: { ...Typography.caption },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  pillLabel: { ...Typography.micro, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: Radius.pill },
  addLabel: { ...Typography.bodyMedium, fontWeight: '600' },
  legal: { ...Typography.caption, textAlign: 'center', paddingHorizontal: Spacing.four, marginTop: Spacing.three },
});
