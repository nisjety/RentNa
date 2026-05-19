import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { PushRegistrar } from '@/components/push-registrar';

export default function ProtectedLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <PushRegistrar />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
