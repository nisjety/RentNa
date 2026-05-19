import { useQuery } from 'convex/react';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

function formatKr(n: number): string {
  return n.toLocaleString('nb-NO');
}

export default function OkonomScreen() {
  const theme = useTheme();
  const agency = useQuery(api.agency.getCurrent);
  const earnings = useQuery(api.agency.earningsSummary);
  const counts = useQuery(api.agency.requestCounts);

  const loading = earnings === undefined || counts === undefined || agency === undefined;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>
          {(agency?.name ?? 'BYRÅ').toUpperCase()} · BYRÅ
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>Økonomi</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.heroCard, { backgroundColor: '#1A2B1A' }]}>
            <Text style={styles.heroLabel}>DENNE MÅNEDEN</Text>
            <Text style={styles.heroValue}>{formatKr(earnings.monthKr)} kr</Text>
            <View style={styles.heroSub}>
              <Icon name="trending-up" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroSubText}>
                {counts.confirmed} bekreftede oppdrag
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>HITTIL I ÅR</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatKr(earnings.ytdKr)} kr
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>UFAKTURERT</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatKr(earnings.openInvoicesKr)} kr
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Forespørselsstatus</Text>
            <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
              <StatusRow label="Bekreftet" value={counts.confirmed} accent="#3A7D44" />
              <View style={[styles.statusDivider, { backgroundColor: theme.divider }]} />
              <StatusRow label="Foreslått" value={counts.suggested} accent="#7A4F00" />
              <View style={[styles.statusDivider, { backgroundColor: theme.divider }]} />
              <StatusRow label="Nye" value={counts.new} accent={theme.text} />
              <View style={[styles.statusDivider, { backgroundColor: theme.divider }]} />
              <StatusRow label="Avvist" value={counts.declined} accent="#B0413E" />
            </View>
          </View>

          <View style={[styles.tipCard, { backgroundColor: theme.surface }]}>
            <Icon name="information-circle-outline" size={20} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: theme.text }]}>Fakturering kommer snart</Text>
              <Text style={[styles.tipBody, { color: theme.textSecondary }]}>
                Eksport til Fiken og Tripletex, samt automatisk lønnsrapport per renholder
                lanseres i v1.1.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatusRow({ label, value, accent }: { label: string; value: number; accent: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: accent }]} />
      <Text style={[styles.statusLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.statusValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  title: { ...Typography.title, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.four, paddingBottom: Spacing.eight, gap: Spacing.three },
  heroCard: { padding: Spacing.five, borderRadius: Radius.xl, gap: Spacing.two },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.8 },
  heroValue: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroSubText: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },
  statsGrid: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.lg, gap: 4 },
  statLabel: { ...Typography.micro, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { ...Typography.headline, fontWeight: '700' },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  sectionTitle: { ...Typography.subhead, fontWeight: '700' },
  statusCard: { borderRadius: Radius.lg, paddingVertical: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { ...Typography.bodyMedium, flex: 1 },
  statusValue: { ...Typography.bodyMedium, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statusDivider: { height: StyleSheet.hairlineWidth, marginLeft: 40 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg, marginTop: Spacing.three },
  tipTitle: { ...Typography.bodyMedium, fontWeight: '600', marginBottom: 4 },
  tipBody: { ...Typography.caption, lineHeight: 18 },
});
