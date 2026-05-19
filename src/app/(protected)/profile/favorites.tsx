import { useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CleanerListCard } from '@/components/customer/cleaner-list-card';
import { Icon } from '@/components/ui/icon';
import { Spacing, Typography } from '@/constants/theme';
import { adaptCleaner } from '@/data/adapters';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

export default function FavoritesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const cleanerDocs = useQuery(api.cleaners.list, {});

  // Until favourites schema exists, show "rated 4.8+ in your area" as a stand-in
  const cleaners = cleanerDocs ? cleanerDocs.filter((c) => c.rating >= 4.8).map(adaptCleaner) : [];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Faste renholdere' }} />

      {cleanerDocs === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : cleaners.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Icon name="heart-outline" size={36} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Ingen faste enda</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Marker en renholder som favoritt etter en booking for å se dem her.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {cleaners.map((c) => (
            <View key={c.id} style={{ marginBottom: Spacing.three }}>
              <CleanerListCard
                cleaner={c}
                onPress={() => router.push(`/cleaner/${c.id}`)}
                onBook={() => router.push(`/cleaner/${c.id}`)}
              />
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBlock: { alignItems: 'center', paddingTop: Spacing.eight, gap: Spacing.two, paddingHorizontal: Spacing.six },
  emptyTitle: { ...Typography.subhead, fontWeight: '600', marginTop: Spacing.two },
  emptyBody: { ...Typography.callout, textAlign: 'center' },
  list: { padding: Spacing.four },
});
