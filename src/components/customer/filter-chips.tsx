import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface Chip {
  id: string;
  label: string;
  active?: boolean;
  removable?: boolean;
}

interface Props {
  chips: Chip[];
  onPress?: (chip: Chip) => void;
  onRemove?: (chip: Chip) => void;
  leadingCount?: number;
}

export function FilterChips({ chips, onPress, onRemove, leadingCount }: Props) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {leadingCount !== undefined && (
        <View style={[styles.leading, { backgroundColor: theme.surface }]}>
          <Icon name="options-outline" size={16} color={theme.text} />
          <Text style={[styles.leadingLabel, { color: theme.text }]}>
            {leadingCount} filtre
          </Text>
        </View>
      )}
      {chips.map((chip) => (
        <Pressable
          key={chip.id}
          onPress={() => onPress?.(chip)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: chip.active ? theme.text : theme.surface,
            },
            pressed && styles.pressed,
          ]}>
          <Text
            style={[
              styles.chipLabel,
              { color: chip.active ? theme.background : theme.text },
            ]}>
            {chip.label}
          </Text>
          {chip.removable && (
            <Pressable hitSlop={6} onPress={() => onRemove?.(chip)}>
              <Icon
                name="close"
                size={14}
                color={chip.active ? theme.background : theme.textSecondary}
              />
            </Pressable>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  leadingLabel: { ...Typography.caption, fontWeight: '600' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  chipLabel: { ...Typography.caption, fontWeight: '500' },
  pressed: { opacity: 0.85 },
});
