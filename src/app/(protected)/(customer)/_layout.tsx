import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRoleStore } from '@/stores/role-store';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(filled: IoniconName, outline: IoniconName) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : outline} size={size ?? 24} color={color} />
  );
}

export default function CustomerTabsLayout() {
  const scheme = useColorScheme();
  const palette = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { hasOnboarded, activeRole } = useRoleStore();

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (activeRole !== 'customer') return <Redirect href="/role-stub" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.divider,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...Typography.micro,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Hjem', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="utforsk"
        options={{ title: 'Utforsk', tabBarIcon: tabIcon('search', 'search-outline') }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bestillinger',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Meldinger',
          tabBarIcon: tabIcon('chatbubble', 'chatbubble-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
