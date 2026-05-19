import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileSubLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerBackTitle: 'Tilbake',
        headerBackButtonDisplayMode: 'minimal',
        // Custom back button to guarantee visibility across platforms
        headerLeft: ({ canGoBack }) =>
          canGoBack !== false ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: theme.surface },
                pressed && { opacity: 0.7 },
              ]}>
              <Icon
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                size={20}
                color={theme.text}
              />
            </Pressable>
          ) : null,
      }}
    />
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Platform.OS === 'ios' ? 0 : 8,
  },
});
