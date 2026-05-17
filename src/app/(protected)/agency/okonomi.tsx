import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OkonomScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.agencyLabel, { color: theme.textMuted }]}>OSLO RENHOLD AS · BYRÅ</Text>
        <Text style={[styles.title, { color: theme.text }]}>Økonomi</Text>
      </View>
      <View style={styles.center}>
        <Icon name="cash-outline" size={36} color={theme.textMuted} />
        <Text style={[styles.soon, { color: theme.textSecondary }]}>Fakturering og lønnsrapporter</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>Kommer snart</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  agencyLabel: { ...Typography.micro, letterSpacing: 0.6, marginBottom: 2 },
  title: { ...Typography.title, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  soon: { ...Typography.bodyMedium },
  sub: { ...Typography.caption },
});
