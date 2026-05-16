import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  greeting: string;
  firstName: string;
  initials: string;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
}

export function HomeHeader({
  greeting,
  firstName,
  initials,
  onNotificationsPress,
  onAvatarPress,
}: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.text}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
        <Text style={[styles.name, { color: theme.text }]}>{firstName}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onNotificationsPress}
          hitSlop={12}
          style={({ pressed }) => [
            styles.bell,
            { backgroundColor: theme.surface },
            pressed && styles.pressed,
          ]}>
          <Icon name="notifications-outline" size={20} color={theme.text} />
        </Pressable>
        <Pressable
          onPress={onAvatarPress}
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.pressed]}>
          <Avatar initials={initials} size={40} tone="pink" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  text: { flex: 1, gap: 0 },
  greeting: { ...Typography.body },
  name: { ...Typography.subhead, marginTop: -2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  bell: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
