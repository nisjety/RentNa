import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  title: string;
  leftAction?: 'back' | 'none';
  rightAction?: 'add' | 'ellipsis' | 'none';
  onRightPress?: () => void;
}

export function ScreenHeader({
  title,
  leftAction = 'back',
  rightAction = 'none',
  onRightPress,
}: Props) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {leftAction === 'back' && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="chevron-back" size={26} color={theme.text} />
          </Pressable>
        )}
      </View>

      <Heading variant="headline" align="center" style={styles.title}>
        {title}
      </Heading>

      <View style={[styles.side, styles.sideRight]}>
        {rightAction === 'add' && (
          <Pressable
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <Icon name="add" size={22} color={theme.accentText} />
          </Pressable>
        )}
        {rightAction === 'ellipsis' && (
          <Pressable
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="ellipsis-horizontal" size={22} color={theme.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  side: { width: 44, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
