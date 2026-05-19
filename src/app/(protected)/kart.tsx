import { useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CleanerListCard } from '@/components/customer/cleaner-list-card';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { adaptCleaner } from '@/data/adapters';
import type { Cleaner } from '@/data/mock-cleaners';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

// Oslo area → coordinates (real points). Falls back to Oslo centre.
const AREA_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Grünerløkka:     { latitude: 59.9239, longitude: 10.7596 },
  Grünerlekka:     { latitude: 59.9239, longitude: 10.7596 },
  Frogner:         { latitude: 59.9209, longitude: 10.7068 },
  Sagene:          { latitude: 59.9395, longitude: 10.7544 },
  'St. Hanshaugen':{ latitude: 59.9296, longitude: 10.7373 },
  Tøyen:           { latitude: 59.9134, longitude: 10.7754 },
  Bygdøy:          { latitude: 59.9036, longitude: 10.6809 },
  Sentrum:         { latitude: 59.9139, longitude: 10.7522 },
  Oslo:            { latitude: 59.9139, longitude: 10.7522 },
};
const OSLO: Region = {
  latitude: 59.9265,
  longitude: 10.7400,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Uber-style minimal grayscale map theme
const UBER_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dfe9d8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e3f5' }] },
];

interface CleanerWithCoord extends Cleaner {
  coord: { latitude: number; longitude: number };
}

function coordForArea(area: string, idx: number): { latitude: number; longitude: number } {
  const base = AREA_COORDS[area] ?? OSLO;
  // Slight jitter so co-located cleaners don't fully overlap
  const jitterLat = ((idx * 37) % 13) * 0.00015;
  const jitterLng = ((idx * 47) % 17) * 0.00018;
  return {
    latitude: base.latitude + jitterLat - 0.00098,
    longitude: base.longitude + jitterLng - 0.00153,
  };
}

export default function KartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const cleanerDocs = useQuery(api.cleaners.list, {});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cleaners: CleanerWithCoord[] = useMemo(() => {
    if (!cleanerDocs) return [];
    return cleanerDocs.map((doc, idx) => {
      const adapted = adaptCleaner(doc);
      return { ...adapted, coord: coordForArea(adapted.area, idx) };
    });
  }, [cleanerDocs]);

  const selectedCleaner = cleaners.find((c) => c.id === selectedId) ?? null;

  function handleRecenter() {
    mapRef.current?.animateToRegion(OSLO, 500);
    setSelectedId(null);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={OSLO}
        customMapStyle={UBER_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onPress={() => setSelectedId(null)}>
        {cleaners.map((c) => {
          const isSelected = selectedId === c.id;
          return (
            <Marker
              key={c.id}
              identifier={c.id}
              coordinate={c.coord}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedId(c.id);
                mapRef.current?.animateToRegion(
                  {
                    ...c.coord,
                    latitudeDelta: 0.018,
                    longitudeDelta: 0.018,
                  },
                  400,
                );
              }}>
              <View
                style={[
                  pin.root,
                  {
                    backgroundColor: isSelected ? '#111' : '#FFFFFF',
                    borderColor: isSelected ? '#111' : '#E5E5E5',
                  },
                ]}>
                <Text
                  style={[
                    pin.text,
                    { color: isSelected ? '#FFFFFF' : '#111' },
                  ]}>
                  {c.hourlyRateKr} kr
                </Text>
              </View>
              <View
                style={[
                  pin.tail,
                  { borderTopColor: isSelected ? '#111' : '#FFFFFF' },
                ]}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: '#FFFFFF' },
            pressed && styles.pressed,
          ]}>
          <Icon name="chevron-back" size={22} color="#111" />
        </Pressable>
        <View style={styles.searchPill}>
          <Icon name="search" size={16} color="#666" />
          <Text style={styles.searchPillText} numberOfLines={1}>
            {cleaners.length} renholdere i Oslo
          </Text>
        </View>
        <Pressable
          onPress={handleRecenter}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: '#FFFFFF' },
            pressed && styles.pressed,
          ]}>
          <Icon name="locate-outline" size={20} color="#111" />
        </Pressable>
      </View>

      {/* Selected card OR loading overlay */}
      {cleanerDocs === undefined ? (
        <View style={styles.loadingPill}>
          <ActivityIndicator size="small" color={theme.text} />
          <Text style={styles.loadingPillText}>Laster renholdere…</Text>
        </View>
      ) : selectedCleaner ? (
        <View style={styles.bottomCard}>
          <CleanerListCard
            cleaner={selectedCleaner}
            onPress={() => router.push(`/cleaner/${selectedCleaner.id}`)}
            onBook={() => router.push(`/cleaner/${selectedCleaner.id}`)}
          />
        </View>
      ) : (
        <View style={styles.hintPill}>
          <Icon name="information-circle-outline" size={14} color="#666" />
          <Text style={styles.hintPillText}>
            Trykk på en pin for å se renholderen
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const pin = StyleSheet.create({
  root: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
  },
  text: {
    ...Typography.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tail: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  searchPill: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  searchPillText: {
    ...Typography.bodyMedium,
    color: '#111',
    flex: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.four,
    right: Spacing.four,
  },
  hintPill: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  hintPillText: { ...Typography.caption, color: '#444' },
  loadingPill: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  loadingPillText: { ...Typography.caption, color: '#444' },
  pressed: { opacity: 0.7 },
});
