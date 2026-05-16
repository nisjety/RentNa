import { useAuth, useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';
import { api } from 'convex/_generated/api';

interface RowProps {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  trailing?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function formatKr(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    return remainder > 0 ? `${thousands} ${String(remainder).padStart(3, '0')}` : `${thousands} 000`;
  }
  return String(n);
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { reset } = useRoleStore();
  const stats = useQuery(api.bookings.myStats);

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';
  const joined = [firstName, lastName].filter(Boolean).join(' ');
  const fullName = joined || (user?.primaryEmailAddress?.emailAddress ?? 'Bruker');
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const letterInitials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();
  const initials = letterInitials || (fullName[0]?.toUpperCase() ?? '?');
  const avatarUrl = user?.imageUrl;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBar}>
          <Heading variant="title">Profil</Heading>
        </View>

        <View style={[styles.hero, { backgroundColor: theme.surface }]}>
          <Avatar uri={avatarUrl} initials={initials} size={56} tone="taupe" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{fullName}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{email}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats === undefined ? (
            <View style={[styles.stat, { backgroundColor: theme.surface, flex: 1, alignItems: 'center', justifyContent: 'center', height: 64 }]}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
          ) : (
            <>
              <Stat value={String(stats.total)} label="Bookinger" />
              <Stat value={String(stats.recurring)} label="Fast renholder" />
              <Stat value={formatKr(stats.totalKr)} label="kr i år" accent />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Row icon="location-outline" label="Adresser" />
          <Row icon="card-outline" label="Betalingsmetoder" />
          <Row icon="heart-outline" label="Faste renholdere" />
          <Row icon="globe-outline" label="Språk" />
        </View>

        <View style={[styles.proCta, { backgroundColor: theme.text }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.proTitle, { color: theme.background }]}>
              Jobber du som renholder?
            </Text>
            <Text style={[styles.proSubtitle, { color: theme.textMuted }]}>
              Bytt til renholder-arbeidsbenken
            </Text>
          </View>
          <Pressable
            onPress={() => {
              reset();
              router.replace('/onboarding');
            }}
            style={({ pressed }) => [
              styles.proBtn,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.proBtnLabel, { color: theme.accentText }]}>Bytt rolle</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Row
            icon="log-out-outline"
            label="Logg ut"
            destructive
            onPress={() => signOut()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, trailing, onPress, destructive }: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Icon name={icon} size={18} color={destructive ? '#B0413E' : theme.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: destructive ? '#B0413E' : theme.text }]}>
          {label}
        </Text>
        {trailing && (
          <Text style={[styles.rowTrailing, { color: theme.textSecondary }]}>{trailing}</Text>
        )}
      </View>
      {!destructive && <Icon name="chevron-forward" size={18} color={theme.textMuted} />}
    </Pressable>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: accent ? theme.accent : theme.surface },
      ]}>
      <Text style={[styles.statValue, { color: accent ? theme.accentText : theme.text }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: accent ? theme.accentText : theme.textSecondary },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.eight },
  titleBar: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  name: { ...Typography.subhead },
  email: { ...Typography.caption, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  stat: { flex: 1, padding: Spacing.three, borderRadius: Radius.lg, alignItems: 'flex-start' },
  statValue: { ...Typography.headline, fontWeight: '700' },
  statLabel: { ...Typography.caption, marginTop: 2 },
  section: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...Typography.bodyMedium },
  rowTrailing: { ...Typography.caption, marginTop: 1 },
  proCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  proTitle: { ...Typography.bodyMedium, fontWeight: '600' },
  proSubtitle: { ...Typography.caption, marginTop: 2 },
  proBtn: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: Radius.pill },
  proBtnLabel: { ...Typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
