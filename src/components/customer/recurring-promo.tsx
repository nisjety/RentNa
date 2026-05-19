import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onSetup?: () => void;
}

export function RecurringPromo({ onSetup }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;

  return (
    <View
      style={[
        styles.container,
        isCompact && styles.containerCompact,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}>
      <Image
        accessibilityLabel="Potteplante i et lyst rom"
        source={require('../../../assets/images/recurring-plant.png')}
        style={styles.backgroundImage}
        contentFit="cover"
        contentPosition="right center"
        transition={180}
      />
      <View style={styles.imageFade} />
      <View style={[styles.readabilityWash, { backgroundColor: theme.surfaceMuted }]} />
      <View style={[styles.text, isCompact && styles.textCompact]}>
        <Text style={[styles.title, { color: theme.text }]}>Fast renhold</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Hold hjemmet friskt{'\n'}hver uke.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Sett opp fast renhold"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onSetup}
        style={({ pressed }) => [
          styles.cta,
          isCompact && styles.ctaCompact,
          { backgroundColor: theme.accent },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.ctaLabel, { color: theme.accentText }]}>Sett opp</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 122,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(23, 39, 19, 0.08)',
  },
  containerCompact: {
    minHeight: 128,
    paddingHorizontal: Spacing.four,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  imageFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.36,
  },
  readabilityWash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '58%',
    opacity: 0.32,
  },
  text: { width: '48%', gap: Spacing.two },
  textCompact: { width: '50%' },
  title: { ...Typography.subhead, fontSize: 15, lineHeight: 19 },
  subtitle: { ...Typography.caption, lineHeight: 20 },
  cta: {
    position: 'absolute',
    right: '24%',
    bottom: Spacing.four,
    minWidth: 96,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  ctaCompact: {
    right: '22%',
    bottom: Spacing.four,
    minWidth: 84,
    minHeight: 38,
    paddingHorizontal: Spacing.three,
  },
  ctaLabel: { ...Typography.callout, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
