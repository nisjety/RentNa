import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onSetup?: () => void;
}

export function RecurringPromo({ onSetup }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceMuted }]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>Fast renhold</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Hold hjemmet friskt{'\n'}hver uke.
        </Text>
        <Pressable
          onPress={onSetup}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: theme.accent },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.ctaLabel, { color: theme.accentText }]}>Sett opp</Text>
        </Pressable>
      </View>
      <View style={styles.plantSlot}>
        <View style={[styles.plant, { backgroundColor: '#D6CCBA' }]}>
          <Icon name="leaf-outline" size={56} color="#5C7A4F" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: Spacing.one },
  title: { ...Typography.subhead },
  subtitle: { ...Typography.callout, marginBottom: Spacing.three },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  ctaLabel: { ...Typography.callout, fontWeight: '600' },
  plantSlot: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  plant: {
    width: 92,
    height: 92,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
