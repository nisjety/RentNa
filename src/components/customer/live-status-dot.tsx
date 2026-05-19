import { useQuery } from 'convex/react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from 'convex/_generated/api';

type StatusKey = 'available' | 'en_route' | 'working' | 'available_in' | 'offline';

const META: Record<StatusKey, { label: string; color: string; bg: string }> = {
  available:    { label: 'Ledig nå',    color: '#0F7A3E', bg: '#D6EED9' },
  en_route:     { label: 'På vei',      color: '#7A4F00', bg: '#F5E6C8' },
  working:      { label: 'Jobber nå',   color: '#7A2E00', bg: '#F5D9C8' },
  available_in: { label: 'Ledig om…',   color: '#4A5A6A', bg: '#D8DEE5' },
  offline:      { label: 'Offline',     color: '#888',    bg: '#E8E8E8' },
};

/**
 * Live status pill for a single cleaner. Pulls from cleanerStatus.
 * Hidden when the cleaner has never set a status (no row in the table)
 * to avoid making every legacy cleaner look "Offline".
 */
export function LiveStatusPill({ cleanerSlug, hideWhenOffline }: { cleanerSlug: string; hideWhenOffline?: boolean }) {
  const status = useQuery(api.cleanerStatus.getBySlug, { cleanerSlug });
  const theme = useTheme();

  if (status === undefined) return null;          // still loading
  if (status === null) return null;               // no status row → hide
  const key = status.status as StatusKey;
  if (hideWhenOffline && key === 'offline') return null;
  const meta = META[key] ?? META.offline;

  let label = meta.label;
  if (key === 'en_route' && status.etaMinutes != null) {
    label = `På vei · ${status.etaMinutes} min`;
  } else if (key === 'available_in' && status.availableInHours != null) {
    const h = status.availableInHours;
    label = h < 1 ? `Ledig om ${Math.round(h * 60)} m` : `Ledig om ${h} t`;
  }

  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...Typography.micro, fontWeight: '700' },
});
