import { useAuth, useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StrikeStatus } from '@/components/cleaner-pro/strike-status';
import { Avatar } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { SERVICE_LABEL, TAG_LABEL, type CleanerService, type CleanerTag } from '@/data/mock-cleaners';
import { useTheme } from '@/hooks/use-theme';
import { useRoleStore } from '@/stores/role-store';
import { api } from 'convex/_generated/api';

export default function CleanerProfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { setActiveRole } = useRoleStore();
  const data = useQuery(api.cleanerPro.getMyProfile);

  if (data === undefined) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  const cleaner = data?.cleaner;
  const profile = data?.profile;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    cleaner?.name ||
    user?.primaryEmailAddress?.emailAddress ||
    'Renholder';
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    cleaner?.initials ||
    fullName[0]?.toUpperCase() ||
    '?';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBar}>
          <Heading variant="title">Profil</Heading>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <Avatar uri={user?.imageUrl} initials={initials} size={60} tone="taupe" />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]}>{fullName}</Text>
              {cleaner?.isSuperCleaner && (
                <Icon name="shield-checkmark" size={16} color="#3D9970" />
              )}
            </View>
            <Text style={[styles.location, { color: theme.textSecondary }]}>
              {cleaner ? `${cleaner.area} · ${cleaner.city}` : 'Profil ikke koblet'}
            </Text>
            {cleaner && (
              <View style={styles.ratingRow}>
                <Icon name="star" size={13} color={theme.accent} />
                <Text style={[styles.rating, { color: theme.text }]}>
                  {cleaner.rating.toFixed(2)} · {cleaner.reviewCount} vurderinger
                </Text>
              </View>
            )}
          </View>
        </View>

        {cleaner && (
          <View style={styles.statsRow}>
            <StatCard value={String(cleaner.jobsCompleted)} label="Oppdrag" />
            <StatCard value={`${cleaner.yearsExperience} år`} label="Erfaring" />
            <StatCard value={`${cleaner.hourlyRateKr} kr`} label="Timerate" accent />
          </View>
        )}

        {cleaner && cleaner.services.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mine tjenester</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              {cleaner.services.map((s) => (
                <View key={s} style={[styles.serviceRow, { borderBottomColor: theme.divider }]}>
                  <Icon name="checkmark-circle" size={18} color="#3D9970" />
                  <Text style={[styles.serviceLabel, { color: theme.text }]}>
                    {SERVICE_LABEL[s as CleanerService] ?? s}
                  </Text>
                  <Icon name="chevron-forward" size={16} color={theme.textMuted} />
                </View>
              ))}
            </View>
          </>
        )}

        {cleaner && cleaner.tags.length > 0 && (
          <View style={styles.tagRow}>
            {cleaner.tags.map((t) => (
              <Pill key={t} label={TAG_LABEL[t as CleanerTag] ?? t} tone="neutral" />
            ))}
          </View>
        )}

        <StrikeStatus />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Offentlig profil</Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Row
            icon="eye-outline"
            label="Vis min profil"
            onPress={() => cleaner && router.push(`/cleaner/${cleaner.slug}`)}
          />
          <Row
            icon="pencil-outline"
            label="Rediger bio"
            onPress={() =>
              Alert.alert('Rediger bio', 'Bio-editor kommer i v1.1.')
            }
          />
          <Row
            icon="camera-outline"
            label="Endre profilbilde"
            onPress={() =>
              Alert.alert(
                'Profilbilde',
                'Bilde hentes fra påloggingstjenesten din.',
              )
            }
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Innstillinger</Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Row
            icon="cash-outline"
            label="Betalingsinformasjon"
            trailing={
              profile?.payoutMethod && profile?.payoutLast4
                ? `${profile.payoutMethod === 'vipps' ? 'Vipps' : 'Bank'} · ****${profile.payoutLast4}`
                : 'Ikke satt'
            }
            onPress={() =>
              Alert.alert('Utbetaling', 'Vipps og bankkonto-integrasjon kommer i v1.1.')
            }
          />
          <Row
            icon="notifications-outline"
            label="Varsler"
            onPress={() => Linking.openSettings()}
          />
          <Row
            icon="shield-outline"
            label="Personvern og sikkerhet"
            onPress={() => Linking.openURL('https://rentna.no/personvern')}
          />
        </View>

        <View style={[styles.switchBanner, { backgroundColor: theme.text }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchTitle, { color: theme.background }]}>
              Bytt til kundemodus
            </Text>
            <Text style={[styles.switchSub, { color: theme.surfaceMuted }]}>
              Book en renholder til hjemmet ditt
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setActiveRole('customer');
              router.replace('/');
            }}
            style={({ pressed }) => [
              styles.switchBtn,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={[styles.switchBtnLabel, { color: theme.accentText }]}>Bytt</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Row
            icon="log-out-outline"
            label="Logg ut"
            destructive
            onPress={() =>
              Alert.alert('Logg ut', 'Er du sikker?', [
                { text: 'Avbryt', style: 'cancel' },
                { text: 'Logg ut', style: 'destructive', onPress: () => signOut() },
              ])
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  trailing,
  onPress,
  destructive,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  trailing?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
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
      {!destructive && <Icon name="chevron-forward" size={16} color={theme.textMuted} />}
    </Pressable>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: accent ? theme.accent : theme.surface }]}>
      <Text style={[styles.statValue, { color: accent ? theme.accentText : theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: accent ? theme.accentText : theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: Spacing.ten },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleBar: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    marginHorizontal: Spacing.four, marginBottom: Spacing.three,
    padding: Spacing.four, borderRadius: Radius.xl,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  name: { ...Typography.subhead, fontWeight: '700' },
  location: { ...Typography.caption, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { ...Typography.caption },
  statsRow: {
    flexDirection: 'row', gap: Spacing.two,
    paddingHorizontal: Spacing.four, marginBottom: Spacing.four,
  },
  statCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.lg, gap: 2 },
  statValue: { ...Typography.headline, fontWeight: '700' },
  statLabel: { ...Typography.caption },
  sectionHeader: {
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.two,
  },
  sectionTitle: { ...Typography.callout, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { marginHorizontal: Spacing.four, borderRadius: Radius.lg, overflow: 'hidden' },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceLabel: { ...Typography.body, flex: 1 },
  tagRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two,
    paddingHorizontal: Spacing.four, marginTop: Spacing.three,
  },
  section: {
    marginHorizontal: Spacing.four, borderRadius: Radius.lg,
    overflow: 'hidden', gap: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { ...Typography.bodyMedium },
  rowTrailing: { ...Typography.caption, marginTop: 2 },
  switchBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    marginHorizontal: Spacing.four, marginTop: Spacing.four, marginBottom: Spacing.three,
    padding: Spacing.four, borderRadius: Radius.xl,
  },
  switchTitle: { ...Typography.subhead, fontWeight: '600' },
  switchSub: { ...Typography.caption, marginTop: 2 },
  switchBtn: {
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.lg,
  },
  switchBtnLabel: { ...Typography.callout, fontWeight: '700' },
});
