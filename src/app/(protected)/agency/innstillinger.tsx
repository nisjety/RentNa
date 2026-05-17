import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';

export default function InnstillingerScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { setActiveRole } = useRoleStore();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>OSLO RENHOLD AS · BYRÅ</Text>
        <Text style={[styles.title, { color: theme.text }]}>Innstillinger</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Row icon="business-outline" label="Byråprofil" />
        <Row icon="people-outline" label="Teammedlemmer" />
        <Row icon="notifications-outline" label="Varsler" />
        <Row icon="card-outline" label="Fakturering" />
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Pressable
          onPress={() => { setActiveRole('customer'); router.replace('/'); }}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
            <Icon name="swap-horizontal-outline" size={17} color={theme.text} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Bytt til kundemodus</Text>
          <Icon name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>
        <Pressable
          onPress={() => signOut()}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.iconWrap, { backgroundColor: '#F5D4D4' }]}>
            <Icon name="log-out-outline" size={17} color="#B0413E" />
          </View>
          <Text style={[styles.rowLabel, { color: '#B0413E' }]}>Logg ut</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  const theme = useTheme();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name={icon} size={17} color={theme.text} />
      </View>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <Icon name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  title: { ...Typography.title, fontWeight: '700' },
  section: { marginHorizontal: Spacing.four, marginBottom: Spacing.three, borderRadius: Radius.xl, overflow: 'hidden', gap: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: 13 },
  iconWrap: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...Typography.bodyMedium, flex: 1 },
  pressed: { opacity: 0.82 },
});
