import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showMark?: boolean;
  color?: string;
}

export function BrandMark({ size = 'md', showMark = true, color }: Props) {
  const theme = useTheme();
  const fg = color ?? theme.text;
  const config = SIZE[size];

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.word,
          { color: fg, fontFamily: SERIF, fontSize: config.font, letterSpacing: config.tracking },
        ]}>
        Rent Nå.
      </Text>
      {showMark && (
        <Text
          style={[
            styles.mark,
            { color: fg, fontSize: config.markFont, lineHeight: config.markFont * 1.2 },
          ]}>
          ®
        </Text>
      )}
    </View>
  );
}

const SIZE = {
  sm: { font: 22, tracking: -0.6, markFont: 9 },
  md: { font: 32, tracking: -1.0, markFont: 11 },
  lg: { font: 44, tracking: -1.4, markFont: 14 },
} as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  word: { fontWeight: '500' },
  mark: { marginTop: 6 },
});
