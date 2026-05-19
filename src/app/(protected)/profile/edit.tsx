import { useUser } from '@clerk/expo';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? '';
  const initials =
    (firstName[0] ?? '').toUpperCase() + (lastName[0] ?? '').toUpperCase() ||
    email[0]?.toUpperCase() || '?';

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      router.back();
    } catch (err) {
      Alert.alert('Kunne ikke lagre', err instanceof Error ? err.message : 'Ukjent feil');
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} />
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Rediger profil',
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving} hitSlop={10}>
              <Text style={[styles.saveBtn, { color: saving ? theme.textMuted : theme.text }]}>
                {saving ? 'Lagrer…' : 'Lagre'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.avatarBlock}>
            <Avatar uri={user?.imageUrl} initials={initials} size={88} tone="taupe" />
            <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
              Profilbilde fra {user?.externalAccounts?.[0]?.provider ?? 'kontoen din'}
            </Text>
          </View>

          <Field
            label="Fornavn"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Fornavn"
          />
          <Field
            label="Etternavn"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Etternavn"
          />
          <Field
            label="E-post"
            value={email}
            editable={false}
            hint="E-post styres av påloggingstjenesten"
          />
          {phone ? (
            <Field
              label="Telefon"
              value={phone}
              editable={false}
              hint="Endre via SMS-pålogging"
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  hint,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        editable={editable}
        style={[
          styles.fieldInput,
          {
            backgroundColor: editable ? theme.surface : theme.surfaceMuted,
            color: editable ? theme.text : theme.textSecondary,
          },
        ]}
      />
      {hint ? (
        <Text style={[styles.fieldHint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.eight, gap: Spacing.three },
  avatarBlock: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two },
  avatarHint: { ...Typography.caption },
  saveBtn: { ...Typography.bodyMedium, fontWeight: '600' },
  field: { gap: 6 },
  fieldLabel: { ...Typography.caption, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  fieldInput: {
    ...Typography.body,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  fieldHint: { ...Typography.caption, marginTop: 4 },
});
