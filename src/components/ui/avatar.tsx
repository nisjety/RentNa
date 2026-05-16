import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AvatarProps {
  uri?: string;
  initials?: string;
  size?: number;
  tone?: 'pink' | 'blue' | 'taupe' | 'muted';
}

const TONE_COLOR: Record<NonNullable<AvatarProps['tone']>, string> = {
  pink: '#F5D4D4',
  blue: '#D7E3EC',
  taupe: '#E5DFD2',
  muted: '#ECE8E1',
};

export function Avatar({ uri, initials, size = 36, tone = 'pink' }: AvatarProps) {
  const theme = useTheme();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: TONE_COLOR[tone],
        },
      ]}>
      <Text
        style={[
          styles.initials,
          { color: theme.text, fontSize: Math.max(11, size * 0.36) },
        ]}>
        {initials ?? '·'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
});
