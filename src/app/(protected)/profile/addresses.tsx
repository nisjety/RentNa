import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Address {
  id: string;
  label: string;
  line1: string;
  postal: string;
  city: string;
  primary?: boolean;
}

export default function AddressesScreen() {
  const theme = useTheme();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Address>({
    id: '', label: 'Hjem', line1: '', postal: '', city: 'Oslo', primary: true,
  });

  function handleAdd() {
    if (!draft.line1.trim() || !draft.postal.trim()) {
      Alert.alert('Mangler info', 'Skriv inn både gate og postnummer.');
      return;
    }
    const next: Address = { ...draft, id: String(Date.now()), primary: addresses.length === 0 };
    setAddresses([...addresses, next]);
    setShowForm(false);
    setDraft({ id: '', label: 'Hjem', line1: '', postal: '', city: 'Oslo' });
  }

  function handleRemove(id: string) {
    Alert.alert('Slett adresse?', '', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Slett', style: 'destructive', onPress: () => setAddresses(addresses.filter((a) => a.id !== id)) },
    ]);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Adresser' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {addresses.length === 0 && !showForm ? (
          <View style={styles.emptyBlock}>
            <Icon name="location-outline" size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen adresser lagret</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
              Legg til hjemme- eller arbeidsadresse for raskere booking.
            </Text>
          </View>
        ) : null}

        {addresses.map((a) => (
          <View key={a.id} style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardLabel, { color: theme.text }]}>{a.label}</Text>
                {a.primary && (
                  <View style={[styles.pill, { backgroundColor: theme.accent }]}>
                    <Text style={[styles.pillLabel, { color: theme.accentText }]}>PRIMÆR</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardLine, { color: theme.textSecondary }]}>{a.line1}</Text>
              <Text style={[styles.cardLine, { color: theme.textSecondary }]}>
                {a.postal} {a.city}
              </Text>
            </View>
            <Pressable hitSlop={12} onPress={() => handleRemove(a.id)}>
              <Icon name="trash-outline" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        ))}

        {showForm ? (
          <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
            <FormField label="Navn (f.eks. Hjem)" value={draft.label} onChangeText={(v) => setDraft({ ...draft, label: v })} />
            <FormField label="Gate og nummer" value={draft.line1} onChangeText={(v) => setDraft({ ...draft, line1: v })} />
            <View style={styles.row}>
              <View style={{ flex: 0.4 }}>
                <FormField label="Postnr" value={draft.postal} onChangeText={(v) => setDraft({ ...draft, postal: v })} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 0.6 }}>
                <FormField label="Sted" value={draft.city} onChangeText={(v) => setDraft({ ...draft, city: v })} />
              </View>
            </View>
            <View style={styles.formActions}>
              <Pressable onPress={() => setShowForm(false)} style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceMuted }, pressed && { opacity: 0.85 }]}>
                <Text style={[styles.btnLabel, { color: theme.text }]}>Avbryt</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={({ pressed }) => [styles.btn, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
                <Text style={[styles.btnLabel, { color: theme.background }]}>Lagre</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.text }, pressed && { opacity: 0.85 }]}>
            <Icon name="add" size={18} color={theme.background} />
            <Text style={[styles.addLabel, { color: theme.background }]}>Legg til adresse</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'default' | 'number-pad' }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={theme.textMuted}
        style={[styles.fieldInput, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  emptyBlock: { alignItems: 'center', paddingTop: Spacing.eight, gap: Spacing.two },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center', paddingHorizontal: Spacing.six },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    padding: Spacing.four, borderRadius: Radius.lg,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 4 },
  cardLabel: { ...Typography.bodyMedium, fontWeight: '600' },
  cardLine: { ...Typography.callout },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  pillLabel: { ...Typography.micro, fontWeight: '700' },
  formCard: { padding: Spacing.four, borderRadius: Radius.lg, gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  fieldLabel: { ...Typography.caption, fontWeight: '600', letterSpacing: 0.3 },
  fieldInput: { ...Typography.body, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.md },
  formActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  btn: { flex: 1, paddingVertical: 12, borderRadius: Radius.pill, alignItems: 'center' },
  btnLabel: { ...Typography.bodyMedium, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: Radius.pill },
  addLabel: { ...Typography.bodyMedium, fontWeight: '600' },
});
