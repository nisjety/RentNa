import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { Slot } from 'expo-router';
import React from 'react';
import { LogBox, useColorScheme } from 'react-native';

// Dev-only: hide noisy Convex auth errors while the Clerk JWT template
// is being set up. They still surface as Alerts where the user expects them.
if (__DEV__) {
  LogBox.ignoreLogs([
    /Ikke autentisert/,
    /No auth provider found matching the given token/,
    /Failed to authenticate/,
  ]);
}

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { convex } from '@/lib/convex';
import { queryClient } from '@/lib/query-client';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </ConvexProviderWithClerk>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <AppProviders>
        <AnimatedSplashOverlay />
        <Slot />
      </AppProviders>
    </ClerkProvider>
  );
}
