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

export default function CleanerTabsLayout() {
  const scheme = useColorScheme();
  const palette = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { activeRole, hasOnboarded } = useRoleStore();

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (activeRole !== 'cleaner') return <Redirect href="/" />;

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
        options={{ title: 'I dag', tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Forespørsler',
          tabBarIcon: tabIcon('notifications-circle', 'notifications-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Kalender', tabBarIcon: tabIcon('calendar', 'calendar-outline') }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Inntjening', tabBarIcon: tabIcon('cash', 'cash-outline') }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: tabIcon('person-circle', 'person-circle-outline'),
        }}
      />
      <Tabs.Screen name="job" options={{ href: null }} />
    </Tabs>
  );
}
