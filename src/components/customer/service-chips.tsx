import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SERVICE_LABEL, type CleanerService } from '@/data/mock-cleaners';

interface Props {
  services: CleanerService[];
}

export function ServiceChips({ services }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {services.map((s) => (
        <View
          key={s}
          style={[
            styles.chip,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <Text style={[styles.label, { color: theme.text }]}>{SERVICE_LABEL[s]}</Text>
          <Ionicons name="checkmark" size={14} color="#3A7D3F" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: { ...Typography.callout, fontWeight: '500' },
});
