import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CleanerListCard } from '@/components/customer/cleaner-list-card';
import { FilterChips, type Chip } from '@/components/customer/filter-chips';
import { Icon } from '@/components/ui/icon';
import { SearchBar } from '@/components/ui/search-bar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getCleaners } from '@/data/mock-cleaners';
import { useTheme } from '@/hooks/use-theme';

export default function UtforskScreen() {
  const theme = useTheme();
  const router = useRouter();
  const cleaners = getCleaners();

  const [chips, setChips] = useState<Chip[]>([
    { id: 'area', label: 'Grünerløkka', active: true, removable: true },
    { id: 'when', label: 'I morgen', active: true, removable: true },
    { id: 'lang', label: 'Snakker norsk', active: false },
  ]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: theme.surface },
            pressed && styles.pressed,
          ]}>
          <Icon name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <View style={[styles.searchInline, { backgroundColor: theme.surface }]}>
          <Icon name="search-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>
            Renholder i Grünerløkka
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={[styles.headerLink, { color: theme.text }]}>I morgen</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <FilterChips
          chips={chips}
          leadingCount={4}
          onPress={(c) =>
            setChips((prev) =>
              prev.map((p) => (p.id === c.id ? { ...p, active: !p.active } : p)),
            )
          }
          onRemove={(c) => setChips((prev) => prev.filter((p) => p.id !== c.id))}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.count, { color: theme.text }]}>
          {cleaners.length} renholdere
        </Text>
        <Pressable hitSlop={6} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={[styles.sort, { color: theme.textSecondary }]}>
            Sorter: Best match ⌄
          </Text>
        </Pressable>
      </View>

      <FlashList
        data={cleaners}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CleanerListCard
            cleaner={item}
            onPress={() => router.push(`/cleaner/${item.id}`)}
            onBook={() => router.push(`/cleaner/${item.id}`)}
          />
        )}
      />

      <Pressable
        style={({ pressed }) => [
          styles.mapBtn,
          { backgroundColor: theme.text },
          pressed && styles.pressed,
        ]}>
        <Icon name="map-outline" size={18} color={theme.background} />
        <Text style={[styles.mapLabel, { color: theme.background }]}>Vis kart</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    height: 40,
    borderRadius: Radius.pill,
  },
  searchPlaceholder: { ...Typography.callout },
  headerLink: { ...Typography.callout, fontWeight: '500' },
  filterRow: { paddingBottom: Spacing.three },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  count: { ...Typography.callout, fontWeight: '600' },
  sort: { ...Typography.callout },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120 },
  mapBtn: {
    position: 'absolute',
    bottom: Spacing.eight,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  mapLabel: { ...Typography.callout, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
// hide unused: SearchBar imported for type/future use
void SearchBar;
