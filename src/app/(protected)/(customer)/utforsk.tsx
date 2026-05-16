import { useQuery, useMutation } from 'convex/react';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CleanerListCard } from '@/components/customer/cleaner-list-card';
import { FilterChips, type Chip } from '@/components/customer/filter-chips';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { adaptCleaner } from '@/data/adapters';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

type FilterKey = 'service' | 'tag';

interface FilterDef {
  id: string;
  label: string;
  type: FilterKey;
  value: string;
}

const FILTER_DEFS: FilterDef[] = [
  { id: 'regular', label: 'Hjemvask',      type: 'service', value: 'regular' },
  { id: 'deep',    label: 'Dypvask',       type: 'service', value: 'deep' },
  { id: 'move',    label: 'Flyttevask',    type: 'service', value: 'move' },
  { id: 'office',  label: 'Kontorvask',    type: 'service', value: 'office' },
  { id: 'eco',     label: 'Miljøvennlig',  type: 'tag',     value: 'eco' },
  { id: 'norwegian', label: 'Snakker norsk', type: 'tag', value: 'norwegian' },
  { id: 'pets_ok', label: 'Husdyr OK',    type: 'tag',     value: 'pets_ok' },
];

export default function UtforskScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [activeService, setActiveService] = useState<string | undefined>();
  const [activeTag, setActiveTag] = useState<string | undefined>();

  const cleanerDocs = useQuery(api.cleaners.list, {
    service: activeService,
    tag: activeTag,
  });

  const seedCleaners = useMutation(api.seed.seedCleaners);

  // Seed demo cleaners if the database is empty
  useEffect(() => {
    if (cleanerDocs !== undefined && cleanerDocs.length === 0) {
      seedCleaners({}).catch(console.error);
    }
  }, [cleanerDocs, seedCleaners]);

  const cleaners = useMemo(
    () => (cleanerDocs ?? []).map(adaptCleaner),
    [cleanerDocs],
  );

  // Build chip state from filter defs
  const chips: Chip[] = FILTER_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    active:
      (def.type === 'service' && def.value === activeService) ||
      (def.type === 'tag' && def.value === activeTag),
  }));

  function handleChipPress(chip: Chip) {
    const def = FILTER_DEFS.find((d) => d.id === chip.id);
    if (!def) return;
    if (def.type === 'service') {
      setActiveService((prev) => (prev === def.value ? undefined : def.value));
    } else {
      setActiveTag((prev) => (prev === def.value ? undefined : def.value));
    }
  }

  const isLoading = cleanerDocs === undefined;

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
            Finn renholder i Oslo
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <FilterChips
          chips={chips}
          leadingCount={chips.filter((c) => c.active).length}
          onPress={handleChipPress}
        />
      </View>

      <View style={styles.metaRow}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.textSecondary} />
        ) : (
          <Text style={[styles.count, { color: theme.text }]}>
            {cleaners.length} renholder{cleaners.length !== 1 ? 'e' : ''}
          </Text>
        )}
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
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              Ingen renholdere funnet. Prøv å fjerne filtere.
            </Text>
          )
        }
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
  empty: {
    ...Typography.body,
    textAlign: 'center',
    paddingTop: Spacing.eight,
  },
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
