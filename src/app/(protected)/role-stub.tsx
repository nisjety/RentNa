import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';

const ROLE_LABEL = {
  cleaner: 'Renholder',
  agency: 'Byrå',
  customer: 'Kunde',
  admin: 'Admin',
} as const;

export default function RoleStubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { activeRole, setActiveRole } = useRoleStore();

  const label = activeRole ? ROLE_LABEL[activeRole] : 'Pro';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name="construct-outline" size={32} color={theme.text} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{label}-modus kommer snart</Text>
        <Text style={[styles.body_text, { color: theme.textSecondary }]}>
          Vi bygger {label.toLowerCase()}-opplevelsen akkurat nå. I mellomtiden kan du bruke
          appen som kunde — eller logge ut og kommer tilbake.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Bytt til kundemodus"
          variant="primary"
          size="lg"
          onPress={() => {
            setActiveRole('customer');
            router.replace('/');
          }}
        />
        <Button label="Logg ut" variant="ghost" size="md" onPress={() => signOut()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Spacing.four },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { ...Typography.title, textAlign: 'center' },
  body_text: { ...Typography.body, textAlign: 'center' },
  actions: { gap: Spacing.two, paddingBottom: Spacing.four },
});
