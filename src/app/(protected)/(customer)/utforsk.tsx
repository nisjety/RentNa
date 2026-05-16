import { useQuery, useMutation } from 'convex/react';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CleanerListCard } from '@/components/customer/cleaner-list-card';
import { FilterChips, type Chip } from '@/components/customer/filter-chips';
import { Icon } from '@/components/ui/icon';
import { SearchBar } from '@/components/ui/search-bar';
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
  { id: 'regular', label: 'Hjemvask',     type: 'service', value: 'regular' },
  { id: 'deep',    label: 'Dypvask',      type: 'service', value: 'deep' },
  { id: 'move',    label: 'Flyttevask',   type: 'service', value: 'move' },
  { id: 'office',  label: 'Kontorvask',   type: 'service', value: 'office' },
  { id: 'eco',     label: 'Miljøvennlig', type: 'tag',     value: 'eco' },
  { id: 'norwegian', label: 'Snakker norsk', type: 'tag', value: 'norwegian' },
  { id: 'pets_ok', label: 'Husdyr OK',   type: 'tag',     value: 'pets_ok' },
];

// Map service type param from home screen to filter id
const SERVICE_PARAM_MAP: Record<string, string> = {
  home: 'regular',
  deep: 'deep',
  move: 'move',
  office: 'office',
  regular: 'regular',
};

export default function UtforskScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; service?: string }>();

  // Initialise filters from params passed by home screen
  const initialService = params.service ? (SERVICE_PARAM_MAP[params.service] ?? undefined) : undefined;
  const [activeService, setActiveService] = useState<string | undefined>(initialService);
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [searchText, setSearchText] = useState(params.q ?? '');

  const cleanerDocs = useQuery(api.cleaners.list, {
    service: activeService,
    tag: activeTag,
    search: searchText.trim() || undefined,
  });

  const seedCleaners = useMutation(api.seed.seedCleaners);

  // Track whether we triggered a seed so we don't flash an empty state
  const [seedTriggered, setSeedTriggered] = useState(false);

  useEffect(() => {
    if (cleanerDocs !== undefined && cleanerDocs.length === 0 && !seedTriggered) {
      setSeedTriggered(true);
      seedCleaners({}).catch(console.error);
    }
  }, [cleanerDocs, seedTriggered, seedCleaners]);

  const cleaners = useMemo(
    () => (cleanerDocs ?? []).map(adaptCleaner),
    [cleanerDocs],
  );

  // Show spinner while: initial load OR just triggered seed (waiting for data)
  const showSpinner =
    cleanerDocs === undefined ||
    (cleanerDocs.length === 0 && seedTriggered && cleanerDocs.length === 0);

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

  function handleClearAll() {
    setActiveService(undefined);
    setActiveTag(undefined);
    setSearchText('');
  }

  const activeCount = chips.filter((c) => c.active).length + (searchText.trim() ? 1 : 0);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header with search */}
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

        <View style={{ flex: 1 }}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Søk renholder, område…"
            onFilterPress={handleClearAll}
          />
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <FilterChips
          chips={chips}
          leadingCount={activeCount}
          onPress={handleChipPress}
        />
      </View>

      {/* Count row */}
      <View style={styles.metaRow}>
        {showSpinner ? (
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

      {showSpinner ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.textSecondary} />
        </View>
      ) : (
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
            <View style={styles.emptyState}>
              <Icon name="search-outline" size={36} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Ingen renholdere funnet
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Prøv å endre søket eller fjerne filtre
              </Text>
              {activeCount > 0 && (
                <Pressable
                  onPress={handleClearAll}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.clearLabel, { color: theme.background }]}>
                    Fjern alle filtre
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

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
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: 120 },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.ten,
    paddingHorizontal: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: { ...Typography.subhead, marginTop: Spacing.two },
  emptySub: { ...Typography.callout, textAlign: 'center' },
  clearBtn: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  clearLabel: { ...Typography.callout, fontWeight: '600' },
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
