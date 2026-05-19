import { useAuth } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';
import { api } from 'convex/_generated/api';

export default function InnstillingerScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { setActiveRole } = useRoleStore();
  const router = useRouter();
  const agency = useQuery(api.agency.getCurrent);
  const stats = useQuery(api.agency.rosterStats);

  const agencyHeader = (agency?.name ?? 'BYRÅ').toUpperCase() + ' · BYRÅ';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>{agencyHeader}</Text>
          <Text style={[styles.title, { color: theme.text }]}>Innstillinger</Text>
        </View>

        {agency && (
          <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.profileBadge, { backgroundColor: theme.accent }]}>
              <Icon name="business-outline" size={20} color={theme.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>{agency.name}</Text>
              <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>
                {agency.city}
                {agency.orgNumber ? ` · Org. ${agency.orgNumber}` : ''}
              </Text>
              <Text style={[styles.profileMeta, { color: theme.textMuted, marginTop: 2 }]}>
                {stats?.total ?? 0} renholdere · {stats?.onJob ?? 0} på jobb
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Row
            icon="business-outline"
            label="Byråprofil"
            onPress={() => Alert.alert('Byråprofil', 'Rediger byrådata kommer i v1.1.')}
          />
          <Row
            icon="people-outline"
            label="Teammedlemmer"
            onPress={() => router.push('/agency')}
          />
          <Row
            icon="notifications-outline"
            label="Varsler"
            onPress={() => Linking.openSettings()}
          />
          <Row
            icon="card-outline"
            label="Fakturering"
            onPress={() => router.push('/agency/okonomi')}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={() => {
              setActiveRole('customer');
              router.replace('/');
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
              <Icon name="swap-horizontal-outline" size={17} color={theme.text} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Bytt til kundemodus</Text>
            <Icon name="chevron-forward" size={16} color={theme.textMuted} />
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('Logg ut', 'Er du sikker?', [
                { text: 'Avbryt', style: 'cancel' },
                { text: 'Logg ut', style: 'destructive', onPress: () => signOut() },
              ])
            }
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, { backgroundColor: '#F5D4D4' }]}>
              <Icon name="log-out-outline" size={17} color="#B0413E" />
            </View>
            <Text style={[styles.rowLabel, { color: '#B0413E' }]}>Logg ut</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
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
  scroll: { paddingBottom: Spacing.eight },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  title: { ...Typography.title, fontWeight: '700' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    marginHorizontal: Spacing.four, marginBottom: Spacing.three,
    padding: Spacing.four, borderRadius: Radius.xl,
  },
  profileBadge: {
    width: 44, height: 44, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { ...Typography.subhead, fontWeight: '700' },
  profileMeta: { ...Typography.caption, marginTop: 2 },
  section: {
    marginHorizontal: Spacing.four, marginBottom: Spacing.three,
    borderRadius: Radius.xl, overflow: 'hidden', gap: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.four, paddingVertical: 13,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { ...Typography.bodyMedium, flex: 1 },
  pressed: { opacity: 0.82 },
});
