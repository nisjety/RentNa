import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { mockCurrentUser } from '@/data/mock-user';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';

interface RowProps {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  trailing?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { reset } = useRoleStore();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBar}>
          <Heading variant="title">Profil</Heading>
        </View>

        <View style={[styles.hero, { backgroundColor: theme.surface }]}>
          <Avatar initials={mockCurrentUser.initials} size={56} tone="taupe" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {mockCurrentUser.firstName} {mockCurrentUser.lastName}
            </Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>
              eva@email.com
            </Text>
            <View style={[styles.pointsPill, { backgroundColor: theme.accent }]}>
              <Text style={[styles.pointsText, { color: theme.accentText }]}>+ 320 poeng</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value="24" label="Bookinger" />
          <Stat value="1" label="Fast renholder" />
          <Stat value="4 290" label="kr i år" accent />
        </View>

        <View style={styles.section}>
          <Row icon="location-outline" label="Adresser" trailing="3 lagrede" />
          <Row icon="card-outline" label="Betalingsmetoder" trailing="Visa · Kort 4242" />
          <Row icon="heart-outline" label="Faste renholdere" trailing="1 favoritt · Maja" />
          <Row icon="globe-outline" label="Språk" trailing="Norsk Bokmål" />
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
  pointsPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  pointsText: { ...Typography.micro, fontSize: 10 },
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
